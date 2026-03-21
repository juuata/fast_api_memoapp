from pydantic import BaseModel, Field

# 登録・更新で使用するスキーマ
class InsertAndUpdateMemoSchema(BaseModel):
    title: str = Field(..., min_length=1, description="メモのタイトル。少なくとも1文字以上", examples=["明日のアジェンダ"])
    description: str = Field(default="", description="メモの内容についての追加情報。任意で記入可能", examples=["会議で話すトピック→プロジェクトの進捗状況"])


class MemoSchema(InsertAndUpdateMemoSchema):
    memo_id: int = Field(..., description="メモを一意に識別するID番号。データベースで自動的に割り当てられます", examples=[123])


class ResponseSchema(BaseModel):
    message: str = Field(..., description="API操作の結果を説明するメッセージ", examples=["メモの更新に成功しました"])
