from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# SQLAlchemyの宣言的ベースクラス。全モデルクラスはこのBaseを継承して定義する
class Base(DeclarativeBase):
    pass


# memosテーブルに対応するORMモデルクラス
class Memo(Base):
    __tablename__ = "memos"

    # メモを一意に識別するID。主キーかつ自動採番
    memo_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # メモのタイトル。最大50文字、必須項目
    title: Mapped[str] = mapped_column(String(50), nullable=False)
    # メモの詳細説明。最大255文字、任意項目
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # メモの作成日時。レコード作成時に自動でセットされる
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    # メモの更新日時。更新時に手動でセットする。未更新の場合はNULL
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
