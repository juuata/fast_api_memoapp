import math
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.memo import Memo
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, PaginatedMemoSchema, ResponseSchema


def _to_schema(memo: Memo) -> MemoSchema:
    """ORMモデルをレスポンス用スキーマに変換するヘルパー関数"""
    return MemoSchema(
        memo_id=memo.memo_id,
        title=memo.title,
        description=memo.description or "",
        created_at=memo.created_at,
        updated_at=memo.updated_at,
    )


async def _get_memo_or_404(session: AsyncSession, memo_id: int, user_id: int) -> Memo:
    """memo_idとuser_idで対象メモを取得する。
    存在しない場合と他ユーザーのメモの場合は同じ404を返す
    （他ユーザーのメモIDが存在するかどうかを外部に教えないため）"""
    result = await session.execute(
        select(Memo).where(Memo.memo_id == memo_id, Memo.user_id == user_id)
    )
    memo = result.scalars().first()
    if memo is None:
        raise HTTPException(status_code=404, detail=f"memo_id={memo_id} のメモが見つかりません")
    return memo


async def create_memo(session: AsyncSession, memo: InsertAndUpdateMemoSchema, user_id: int) -> MemoSchema:
    """新規メモを登録する。user_idを付与して所有者を紐付ける"""
    new_memo = Memo(title=memo.title, description=memo.description, user_id=user_id)
    session.add(new_memo)
    await session.commit()
    await session.refresh(new_memo)
    return _to_schema(new_memo)


async def get_memos(session: AsyncSession, user_id: int, order: str = "desc", page: int = 1, per_page: int = 10) -> PaginatedMemoSchema:
    """ログイン中のユーザーのメモのみをページネーション付きで取得する"""
    sort_order = asc(Memo.created_at) if order == "asc" else desc(Memo.created_at)

    # 自分のメモの総件数を取得する
    total = (await session.execute(
        select(func.count()).select_from(Memo).where(Memo.user_id == user_id)
    )).scalar()

    # 自分のメモだけを対象ページ分取得する
    offset = (page - 1) * per_page
    result = await session.execute(
        select(Memo).where(Memo.user_id == user_id).order_by(sort_order).offset(offset).limit(per_page)
    )
    memos = result.scalars().all()

    return PaginatedMemoSchema(
        items=[_to_schema(memo) for memo in memos],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )


async def get_memo_by_id(session: AsyncSession, memo_id: int, user_id: int) -> MemoSchema:
    """IDで自分のメモを1件取得する"""
    memo = await _get_memo_or_404(session, memo_id, user_id)
    return _to_schema(memo)


async def update_memo(session: AsyncSession, memo_id: int, memo: InsertAndUpdateMemoSchema, user_id: int) -> MemoSchema:
    """自分のメモを更新する"""
    existing_memo = await _get_memo_or_404(session, memo_id, user_id)
    existing_memo.title = memo.title
    existing_memo.description = memo.description
    existing_memo.updated_at = datetime.now()
    await session.commit()
    await session.refresh(existing_memo)
    return _to_schema(existing_memo)


async def delete_memo(session: AsyncSession, memo_id: int, user_id: int) -> ResponseSchema:
    """自分のメモを削除する"""
    memo = await _get_memo_or_404(session, memo_id, user_id)
    await session.delete(memo)
    await session.commit()
    return ResponseSchema(message=f"memo_id={memo_id} のメモを削除しました")
