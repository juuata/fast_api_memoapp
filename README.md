# FastAPI メモアプリ

FastAPI（バックエンド）と React（フロントエンド）で構成したシンプルなメモ管理アプリです。
スキーマ駆動開発で設計し、SQLite データベースに非同期でアクセスします。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Python / FastAPI |
| データベース | SQLite + SQLAlchemy（非同期） |
| スキーマ定義 | Pydantic |
| フロントエンド | React + Vite |

---

## 機能

- メモの新規登録
- メモ一覧の表示
- メモの編集・更新
- メモの削除（確認ダイアログあり）

---

## ディレクトリ構成

```
fast_api_memoapp/
├── main.py               # FastAPIアプリ本体・CORS設定・ルーター登録
├── db.py                 # DB接続設定・セッション管理
├── init_database.py      # DBの初期化スクリプト（テーブル再作成）
├── memos.db              # SQLiteデータベース（自動生成）
├── schemas/
│   └── memo.py           # Pydanticスキーマ定義
├── models/
│   └── memo.py           # SQLAlchemy ORMモデル定義
├── cruds/
│   └── memo.py           # 非同期CRUD処理
├── routers/
│   └── memo.py           # APIエンドポイント定義
└── frontapp/
    ├── index.html        # エントリポイントHTML
    ├── main.jsx          # Reactエントリポイント
    ├── App.jsx           # メインコンポーネント
    ├── styles.css        # スタイルシート
    └── vite.config.js    # Vite設定
```

---

## セットアップ

### 前提条件

- Python 3.13 以上
- Node.js 18 以上
- 仮想環境（`.venv`）

### 1. 仮想環境の作成とパッケージのインストール

```bash
python -m venv .venv
source .venv/bin/activate  # Windows の場合: .venv\Scripts\activate
.venv/bin/pip install fastapi uvicorn sqlalchemy aiosqlite greenlet
```

### 2. フロントエンドのパッケージインストール

```bash
npm run dev --prefix frontapp  # または cd frontapp && npm install
```

### 3. データベースの初期化

```bash
.venv/bin/python init_database.py
```

---

## 起動方法

### バックエンド（ターミナル1）

```bash
uvicorn main:app --reload
```

→ `http://localhost:8000` で起動

### フロントエンド（ターミナル2）

```bash
npm run dev
```

→ `http://localhost:5173` で起動

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/memos` | メモを新規登録 |
| GET | `/memos` | メモ一覧を取得 |
| GET | `/memos/{memo_id}` | 指定IDのメモを取得 |
| PUT | `/memos/{memo_id}` | 指定IDのメモを更新 |
| DELETE | `/memos/{memo_id}` | 指定IDのメモを削除 |

APIドキュメント（Swagger UI）は起動後に `http://localhost:8000/docs` で確認できます。
