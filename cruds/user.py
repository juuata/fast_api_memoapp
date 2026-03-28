from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password
from models.user import User
from schemas.user import UserRegisterSchema


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    """usernameでユーザーを1件取得する。存在しない場合はNoneを返す。
    ログイン時の照合やトークン検証時のユーザー確認に使う"""
    result = await session.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def create_user(session: AsyncSession, data: UserRegisterSchema) -> User:
    """新規ユーザーを登録する。パスワードはハッシュ化してDBに保存する"""
    new_user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user
