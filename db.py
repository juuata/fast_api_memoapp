from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.memo import Base

# 非同期SQLite接続用のデータベースURL
# aiosqliteドライバを使用してSQLiteに非同期アクセスする
DATABASE_URL = "sqlite+aiosqlite:///./memos.db"

# 非同期エンジンの作成
# echo=Trueにすると実行されるSQLがコンソールに出力される（デバッグ用）
engine = create_async_engine(DATABASE_URL, echo=True)

# 非同期セッションファクトリの作成
# expire_on_commit=Falseにすることでコミット後もオブジェクトの属性にアクセスできる
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# テーブルを非同期で作成する関数
# アプリ起動時に呼び出し、未作成のテーブルをデータベースに作成する
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# FastAPIの依存性注入で使用するDBセッション取得関数
# yieldを使うことでリクエスト終了時に自動でセッションをクローズする
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
