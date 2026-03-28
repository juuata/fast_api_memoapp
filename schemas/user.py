from pydantic import BaseModel, Field


class UserRegisterSchema(BaseModel):
    """ユーザー登録リクエストのスキーマ"""
    username: str = Field(..., min_length=1, max_length=50, examples=["alice"])
    password: str = Field(..., min_length=6, examples=["secret123"])


class TokenSchema(BaseModel):
    """ログイン成功時のレスポンススキーマ。フロントエンドはaccess_tokenを保存して以降のリクエストに使う"""
    access_token: str
    token_type: str = "bearer"
