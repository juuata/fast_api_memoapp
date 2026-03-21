import asyncio

from db import engine
from models.memo import Base


async def init_db():
    async with engine.begin() as conn:
        # 既存のテーブルをすべて削除する
        await conn.run_sync(Base.metadata.drop_all)
        # 新しいテーブルを作成する
        await conn.run_sync(Base.metadata.create_all)

    print("データベースの初期化が完了しました。")


# このファイルを直接実行した場合にinit_dbを呼び出す
if __name__ == "__main__":
    asyncio.run(init_db())
