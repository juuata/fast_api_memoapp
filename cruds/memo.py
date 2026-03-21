from datetime import datetime

from fastapi import HTTPException
import math

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.memo import Memo
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, PaginatedMemoSchema, ResponseSchema


# ORMモデルをレスポンス用スキーマに変換するヘルパー関数
def _to_schema(memo: Memo) -> MemoSchema:
    return MemoSchema(
        memo_id=memo.memo_id,
        title=memo.title,
        description=memo.description or "",
        created_at=memo.created_at,
        updated_at=memo.updated_at,
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


# ページネーション付き全件取得
async def get_memos(db: AsyncSession, order: str = "desc", page: int = 1, per_page: int = 10) -> PaginatedMemoSchema:
    print("全件取得：開始")
    sort_order = asc(Memo.created_at) if order == "asc" else desc(Memo.created_at)

    # 総件数を取得する
    total = (await db.execute(select(func.count()).select_from(Memo))).scalar()

    # offsetとlimitで対象ページのレコードを取得する
    offset = (page - 1) * per_page
    result = await db.execute(select(Memo).order_by(sort_order).offset(offset).limit(per_page))
    memos = result.scalars().all()
    print("全件取得：完了")

    return PaginatedMemoSchema(
        items=[_to_schema(memo) for memo in memos],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )


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
