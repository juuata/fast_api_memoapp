from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.memo import Memo
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, ResponseSchema


# ORMモデルをレスポンス用スキーマに変換するヘルパー関数
def _to_schema(memo: Memo) -> MemoSchema:
    return MemoSchema(
        memo_id=memo.memo_id,
        title=memo.title,
        description=memo.description or "",
    )


# memo_idでレコードを取得し、存在しない場合は404エラーを返すヘルパー関数
async def _get_memo_or_404(db: AsyncSession, memo_id: int) -> Memo:
    result = await db.execute(select(Memo).where(Memo.memo_id == memo_id))
    memo = result.scalars().first()
    if memo is None:
        raise HTTPException(status_code=404, detail=f"memo_id={memo_id} のメモが見つかりません")
    return memo


# 新規登録
async def create_memo(db: AsyncSession, memo: InsertAndUpdateMemoSchema) -> MemoSchema:
    # スキーマのデータをもとに新しいMemoモデルのインスタンスを生成する
    new_memo = Memo(title=memo.title, description=memo.description)

    # セッションに追加してデータベースに保存する
    print("新規登録：開始")
    db.add(new_memo)
    await db.commit()

    # コミット後にDBが自動採番したmemo_idなどを取得するためリフレッシュする
    await db.refresh(new_memo)
    print("データ追加：完了")

    return _to_schema(new_memo)


# 全件取得
async def get_memos(db: AsyncSession) -> list[MemoSchema]:
    # memosテーブルの全レコードを取得するクエリを実行する
    print("全件取得：開始")
    result = await db.execute(select(Memo))
    memos = result.scalars().all()
    print("全件取得：完了")

    # ORMモデルのリストをレスポンス用スキーマのリストに変換して返す
    return [_to_schema(memo) for memo in memos]


# IDで特定のメモを1件取得
async def get_memo_by_id(db: AsyncSession, memo_id: int) -> MemoSchema:
    print("1件取得：開始")
    memo = await _get_memo_or_404(db, memo_id)
    print("データ取得完了")
    return _to_schema(memo)


# メモを更新
async def update_memo(db: AsyncSession, memo_id: int, memo: InsertAndUpdateMemoSchema) -> MemoSchema:
    print("データ更新：開始")
    existing_memo = await _get_memo_or_404(db, memo_id)

    # リクエストの内容でフィールドを上書きし、更新日時をセットする
    existing_memo.title = memo.title
    existing_memo.description = memo.description
    existing_memo.updated_at = datetime.now()

    # 変更をデータベースにコミットしてリフレッシュする
    await db.commit()
    await db.refresh(existing_memo)
    print("データ更新完了")

    return _to_schema(existing_memo)


# メモを削除
async def delete_memo(db: AsyncSession, memo_id: int) -> ResponseSchema:
    print("データ削除：開始")
    memo = await _get_memo_or_404(db, memo_id)

    # レコードをデータベースから削除してコミットする
    await db.delete(memo)
    await db.commit()
    print("データ削除完了")

    return ResponseSchema(message=f"memo_id={memo_id} のメモを削除しました")
