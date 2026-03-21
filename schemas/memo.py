from datetime import datetime

from pydantic import BaseModel, Field

# 登録・更新で使用するスキーマ
class InsertAndUpdateMemoSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=50, description="メモのタイトル。1文字以上50文字以内", examples=["明日のアジェンダ"])
    description: str = Field(default="", max_length=255, description="メモの内容についての追加情報。任意で記入可能（255文字以内）", examples=["会議で話すトピック→プロジェクトの進捗状況"])


class MemoSchema(InsertAndUpdateMemoSchema):
    memo_id: int = Field(..., description="メモを一意に識別するID番号。データベースで自動的に割り当てられます", examples=[123])
    created_at: datetime = Field(..., description="メモの作成日時")
    updated_at: datetime | None = Field(None, description="メモの更新日時。未更新の場合はNULL")


class PaginatedMemoSchema(BaseModel):
    # ページネーション付きのメモ一覧レスポンス
    items: list[MemoSchema] = Field(..., description="現在のページのメモ一覧")
    total: int = Field(..., description="全件数")
    page: int = Field(..., description="現在のページ番号")
    per_page: int = Field(..., description="1ページあたりの件数")
    total_pages: int = Field(..., description="総ページ数")


class ResponseSchema(BaseModel):
    message: str = Field(..., description="API操作の結果を説明するメッセージ", examples=["メモの更新に成功しました"])
