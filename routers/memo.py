from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, ResponseSchema
import cruds.memo as memo_crud
import db

# ルーターを作成し、タグとURLパスのプレフィックスを設定
router = APIRouter(tags=["Memos"], prefix="/memos")


# メモを新規登録するエンドポイント
@router.post("", response_model=MemoSchema)
async def create_memo(memo: InsertAndUpdateMemoSchema, db: AsyncSession = Depends(db.get_db)):
    try:
        result = await memo_crud.create_memo(db, memo)
        print("新規登録に成功しました")
        return result
    except Exception as e:
        print(f"新規登録に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの登録に失敗しました")


# 全メモを一覧取得するエンドポイント
@router.get("", response_model=list[MemoSchema])
async def get_memos(order: str = Query("desc", pattern="^(asc|desc)$"), db: AsyncSession = Depends(db.get_db)):
    try:
        result = await memo_crud.get_memos(db, order)
        print("全件取得に成功しました")
        return result
    except Exception as e:
        print(f"全件取得に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモ一覧の取得に失敗しました")


# 指定したIDのメモを1件取得するエンドポイント
@router.get("/{memo_id}", response_model=MemoSchema)
async def get_memo_by_id(memo_id: int, db: AsyncSession = Depends(db.get_db)):
    try:
        result = await memo_crud.get_memo_by_id(db, memo_id)
        print(f"memo_id={memo_id} の取得に成功しました")
        return result
    except HTTPException:
        # cruds層で発生した404エラーはそのまま再送出する
        raise
    except Exception as e:
        print(f"1件取得に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの取得に失敗しました")


# 指定したIDのメモを更新するエンドポイント
@router.put("/{memo_id}", response_model=MemoSchema)
async def update_memo(memo_id: int, memo: InsertAndUpdateMemoSchema, db: AsyncSession = Depends(db.get_db)):
    try:
        result = await memo_crud.update_memo(db, memo_id, memo)
        print(f"memo_id={memo_id} の更新に成功しました")
        return result
    except HTTPException:
        # cruds層で発生した404エラーはそのまま再送出する
        raise
    except Exception as e:
        print(f"更新に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの更新に失敗しました")


# 指定したIDのメモを削除するエンドポイント
@router.delete("/{memo_id}", response_model=ResponseSchema)
async def delete_memo(memo_id: int, db: AsyncSession = Depends(db.get_db)):
    try:
        result = await memo_crud.delete_memo(db, memo_id)
        print(f"memo_id={memo_id} の削除に成功しました")
        return result
    except HTTPException:
        # cruds層で発生した404エラーはそのまま再送出する
        raise
    except Exception as e:
        print(f"削除に失敗しました: {e}")
        raise HTTPException(status_code=500, detail="メモの削除に失敗しました")
