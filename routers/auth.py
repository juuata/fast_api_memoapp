from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

import db
from auth import create_access_token, verify_password
from cruds.user import create_user, get_user_by_username
from schemas.user import TokenSchema, UserRegisterSchema

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=TokenSchema, status_code=201)
async def register(data: UserRegisterSchema, session: AsyncSession = Depends(db.get_db)):
    """新規ユーザーを登録してアクセストークンを返す。
    すでに同じusernameが存在する場合は400エラーを返す"""

    # 同名ユーザーが存在する場合は登録を拒否する
    existing = await get_user_by_username(session, data.username)
    if existing:
        raise HTTPException(status_code=400, detail="このユーザー名はすでに使用されています")

    user = await create_user(session, data)

    # 登録完了後にそのままトークンを発行してログイン状態にする
    access_token = create_access_token(data={"sub": user.username})
    return TokenSchema(access_token=access_token)


@router.post("/login", response_model=TokenSchema)
async def login(
    # OAuth2PasswordRequestFormはusernameとpasswordをフォームデータで受け取る専用クラス
    # JSON形式ではなくapplication/x-www-form-urlencodedで送る必要がある（OAuth2の仕様）
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(db.get_db),
):
    """ユーザー認証を行いアクセストークンを返す。
    username・passwordが一致しない場合は401エラーを返す"""

    # usernameでユーザーを検索する
    user = await get_user_by_username(session, form_data.username)

    # ユーザーが存在しない場合とパスワードが違う場合を同じエラーにする
    # （どちらが原因かを外部に教えないためのセキュリティ対策）
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名またはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})
    return TokenSchema(access_token=access_token)
