from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

import db
from auth import get_current_user
from models.user import User
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, PaginatedMemoSchema, ResponseSchema
import cruds.memo as memo_crud

router = APIRouter(tags=["Memos"], prefix="/memos")


@router.post("", response_model=MemoSchema)
async def create_memo(
    memo: InsertAndUpdateMemoSchema,
    session: AsyncSession = Depends(db.get_db),
    # Depends(get_current_user)を付けることでこのエンドポイントはログイン必須になる
    # トークンが無効な場合はget_current_user内で401エラーが発生し処理がここに届かない
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.create_memo(session, memo, current_user.user_id)
        return result
    except Exception as e:
        print(f"新規登録に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの登録に失敗しました")


@router.get("", response_model=PaginatedMemoSchema)
async def get_memos(
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(db.get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.get_memos(session, current_user.user_id, order, page, per_page)
        return result
    except Exception as e:
        print(f"全件取得に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモ一覧の取得に失敗しました")


@router.get("/all", response_model=PaginatedMemoSchema)
async def get_all_memos(
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(db.get_db),
    # ログイン必須にする（未ログインでURLを直打ちしてもデータを返さない）
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.get_all_memos(session, order, page, per_page)
        return result
    except Exception as e:
        print(f"全件取得に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモ一覧の取得に失敗しました")


@router.get("/{memo_id}", response_model=MemoSchema)
async def get_memo_by_id(
    memo_id: int,
    session: AsyncSession = Depends(db.get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.get_memo_by_id(session, memo_id, current_user.user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"1件取得に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの取得に失敗しました")


@router.put("/{memo_id}", response_model=MemoSchema)
async def update_memo(
    memo_id: int,
    memo: InsertAndUpdateMemoSchema,
    session: AsyncSession = Depends(db.get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.update_memo(session, memo_id, memo, current_user.user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"更新に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの更新に失敗しました")


@router.delete("/{memo_id}", response_model=ResponseSchema)
async def delete_memo(
    memo_id: int,
    session: AsyncSession = Depends(db.get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await memo_crud.delete_memo(session, memo_id, current_user.user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"削除に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの削除に失敗しました")
