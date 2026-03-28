import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

import db as database

load_dotenv()

# JWTの署名に使う秘密鍵。.envで管理し、コードに直書きしない
# "changeme"はフォールバック値で、本番環境では必ず.envで上書きすること
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")

# 署名アルゴリズム。HS256はHMAC-SHA256方式（対称鍵）
ALGORITHM = "HS256"

# トークンの有効期限（分）。期限切れ後はログインし直しが必要になる
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# パスワードのハッシュ化に使うコンテキスト。bcryptアルゴリズムを使用する
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# リクエストヘッダーの "Authorization: Bearer <token>" からトークンを取り出す仕組み
# tokenUrl="/login" を指定するとSwagger UIに「Authorize」ボタンが表示される
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def hash_password(password: str) -> str:
    """平文パスワードをbcryptでハッシュ化して返す。DBにはこの値を保存する"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ログイン時に入力されたパスワードとDBのハッシュ値を照合する。
    ハッシュは一方向変換のため、元の値に戻さず再ハッシュして比較する"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """JWTアクセストークンを生成して返す。
    dataにはログインユーザー情報（subキーにusername）を渡す。
    有効期限(exp)を付与した上でSECRET_KEYで署名する"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(database.get_db),
):
    """認証済みユーザーを取得する依存関数。
    各エンドポイントで Depends(get_current_user) として使い、ログイン必須にする。
    トークンが無効・期限切れ・ユーザー不在の場合は401エラーを返す"""

    # 認証失敗時に返す共通エラー（詳細を隠すため原因は一律同じメッセージにする）
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # トークンをSECRET_KEYで検証・デコードしてペイロード（中身）を取り出す
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # subクレームにはcreate_access_token呼び出し時に設定したusernameが入っている
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        # 署名不正・期限切れなどJWT起因のエラーはすべて401にする
        raise credentials_exception

    # usernameでDBからユーザーを取得し、存在しなければ401を返す
    from cruds.user import get_user_by_username
    user = await get_user_by_username(session, username)
    if user is None:
        raise credentials_exception
    return user
