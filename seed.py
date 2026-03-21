import asyncio
from datetime import datetime, timedelta
import random

from db import AsyncSessionLocal
from models.memo import Memo


TITLES = [
    "買い物リスト", "会議のアジェンダ", "読書メモ", "アイデアメモ", "タスク管理",
    "プロジェクト計画", "勉強ノート", "旅行の準備", "レシピメモ", "目標設定",
    "日記", "感想メモ", "気になる本", "映画リスト", "運動記録",
    "健康管理", "家計メモ", "仕事の進捗", "連絡事項", "メモ帳",
]

DESCRIPTIONS = [
    "牛乳、卵、パンを買う",
    "プロジェクトの進捗を共有する",
    "第3章まで読んだ。続きが気になる",
    "新しいサービスのアイデアを整理する",
    "今週中に終わらせるタスクをリストアップ",
    "来月のリリースに向けてスケジュールを確認",
    "Pythonの非同期処理について復習する",
    "パスポートと航空券を準備する",
    "カレーの材料と手順をメモ",
    "今年中に達成したい目標を書き出す",
    "今日あったことを振り返る",
    "映画を見た感想をまとめる",
    "友人におすすめされた本のタイトル",
    "今月中に見たい映画のリスト",
    "ジョギング30分、腕立て20回",
    "血圧と体重の記録",
    "今月の支出をまとめる",
    "担当タスクの進捗を上長に報告",
    "チームへの連絡事項をまとめる",
    "",
]


async def seed():
    async with AsyncSessionLocal() as db:
        memos = []
        for i in range(1, 101):
            created = datetime.now() - timedelta(days=random.randint(0, 365))
            updated = created + timedelta(days=random.randint(1, 30)) if random.random() > 0.5 else None
            memo = Memo(
                title=f"{random.choice(TITLES)} {i}",
                description=random.choice(DESCRIPTIONS),
                created_at=created,
                updated_at=updated,
            )
            memos.append(memo)

        db.add_all(memos)
        await db.commit()
        print("100件のデモデータを追加しました。")


if __name__ == "__main__":
    asyncio.run(seed())
