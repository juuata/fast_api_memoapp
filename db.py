import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.memo import Base
import models.user  # noqa: F401 — usersテーブルをBase.metadataに登録するためのインポート

# .envファイルから環境変数を読み込む
load_dotenv()

# 環境変数からDB接続URLを取得する
DATABASE_URL = os.getenv("DATABASE_URL")

# 非同期エンジンの作成
engine = create_async_engine(DATABASE_URL, echo=True)

# 非同期セッションファクトリの作成
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# テーブルを非同期で作成する関数
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# FastAPIの依存性注入で使用するDBセッション取得関数
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
