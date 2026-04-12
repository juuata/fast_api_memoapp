# FastAPI メモアプリ

FastAPI（バックエンド）と React（フロントエンド）で構成したメモ管理アプリです。
JWT認証・PostgreSQL・Dockerによる本番想定の構成で実装しています。

---

## 技術スタック

### バックエンド（Python）

| 技術 | バージョン | 用途 |
|------|-----------|------|
| FastAPI | 0.135.1 | Webフレームワーク。ルーティング・バリデーション・OpenAPI自動生成 |
| Uvicorn | 0.42.0 | ASGIサーバー |
| SQLAlchemy | 2.0.48 | ORM。Pythonオブジェクトとテーブルを対応付け |
| asyncpg | 0.30.0 | PostgreSQL非同期ドライバ |
| Pydantic | 2.12.5 | スキーマ定義・バリデーション |
| python-jose | 3.3.0 | JWTトークンの生成・検証 |
| passlib + bcrypt | 1.7.4 / 4.0.1 | パスワードのハッシュ化・照合 |
| python-dotenv | 1.0.1 | `.env` ファイルから環境変数を読み込み |
| python-multipart | 0.0.20 | OAuth2ログイン時のフォームデータ解析 |

### フロントエンド（JavaScript）

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 19.2.4 | UIライブラリ。コンポーネント・state管理 |
| Vite | 8.0.0 | ビルドツール・開発サーバー |

### データベース・インフラ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| PostgreSQL | 16 | リレーショナルDB |
| Docker | - | コンテナ化。環境の再現性を保証 |
| Docker Compose | - | backend / frontend / db の3サービスを一括管理 |
| Render | - | バックエンドのホスティング（自動HTTPS） |
| AWS Amplify | - | フロントエンド（React）の静的ホスティング |
| Amazon ECS Fargate | - | バックエンドコンテナのサーバーレス実行（検証済み） |
| Amazon ECR | - | Dockerイメージのプライベートレジストリ |
| Amazon RDS (PostgreSQL) | 16 | マネージドPostgreSQLデータベース（検証済み） |

### アーキテクチャ・設計

| 項目 | 内容 |
|------|------|
| APIアーキテクチャ | REST API（JSON over HTTP） |
| ディレクトリ構成 | router / cruds / models / schemas の責務分離 |
| 認証方式 | JWT（Bearer Token）+ OAuth2PasswordFlow |
| DB接続 | 非同期（`async/await`）接続 |
| 環境変数管理 | `.env` ファイル（Gitに含めない） |
| コンテナ起動順序制御 | `healthcheck` + `depends_on: condition: service_healthy` |

---

## 機能

- ユーザー登録・ログイン（JWT認証）
- メモの新規登録・一覧表示・編集・削除
- ページネーション・並び替え（新しい順 / 古い順）
- 自分のメモのみ操作可能（ユーザーごとのデータ分離）
- 管理者画面（`/admin`）：全ユーザーのメモを閲覧可能（編集・削除不可）

---

## ディレクトリ構成

```
fast_api_memoapp/
├── main.py               # FastAPIアプリ本体・CORS設定・ルーター登録
├── db.py                 # DB接続設定・セッション管理
├── auth.py               # JWT生成・検証・パスワードハッシュ
├── .env                  # 環境変数（DB接続URL・秘密鍵）※Gitに含めない
├── requirements.txt      # Pythonパッケージ一覧
├── Dockerfile            # バックエンドのDockerビルド設定
├── docker-compose.yml    # 全サービスの起動設定
├── schemas/
│   ├── memo.py           # メモのPydanticスキーマ
│   └── user.py           # ユーザーのPydanticスキーマ
├── models/
│   ├── memo.py           # メモのSQLAlchemy ORMモデル
│   └── user.py           # ユーザーのSQLAlchemy ORMモデル
├── cruds/
│   ├── memo.py           # メモのCRUD処理
│   └── user.py           # ユーザーの作成・取得処理
├── routers/
│   ├── memo.py           # メモAPIエンドポイント
│   └── auth.py           # 認証APIエンドポイント（登録・ログイン）
└── frontapp/
    ├── index.html        # エントリポイントHTML
    ├── main.jsx          # Reactエントリポイント
    ├── App.jsx           # 認証状態管理・画面切り替え
    ├── styles.css        # スタイルシート（ペーパー＆インク風）
    ├── vite.config.js    # Vite設定
    ├── Dockerfile        # フロントエンドのDockerビルド設定
    └── pages/
        ├── AuthPage.jsx  # ログイン・ユーザー登録画面
        ├── MemoPage.jsx  # メモ一覧・CRUD画面
        └── AdminPage.jsx # 管理者画面（全ユーザーのメモ閲覧）
```

---

## セットアップ・起動方法

### 前提条件

- Docker / Docker Compose がインストール済みであること

### 1. 環境変数の設定

`.env` ファイルをプロジェクトルートに作成します。

```
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/memoapp
SECRET_KEY=your-secret-key-here
```

### 2. 起動

```bash
docker compose up --build
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:5173 |
| バックエンド（API） | http://localhost:8000 |
| APIドキュメント（Swagger UI） | http://localhost:8000/docs |

### 3. 停止

```bash
docker compose down
```

データ（DBの内容）も含めて削除する場合：

```bash
docker compose down -v
```

---

## 本番デプロイ構成

```
[ブラウザ]
    ↓ HTTPS
[AWS Amplify] ← Reactフロントエンド（静的ホスティング）
    ↓ HTTPS
[Render] ← FastAPIバックエンド（自動HTTPS）
    ↓
[Render PostgreSQL] ← マネージドDB
```

| サービス | URL |
|---------|-----|
| フロントエンド | https://main.d396l5gz9yaicy.amplifyapp.com |
| バックエンドAPI | https://memoapp-backend-w2zt.onrender.com |
| APIドキュメント | https://memoapp-backend-w2zt.onrender.com/docs |

---

## AWS構成（検証済み）

ECS Fargate + RDS PostgreSQL によるバックエンド構成も検証・動作確認済み。
AmplifyはHTTPS必須のため、ECS（HTTP）との組み合わせではMixed Contentエラーが発生する。
ALB + ACM + Route 53による独自ドメイン＆HTTPS化で解決可能。

```
[ブラウザ]
    ↓ HTTPS
[AWS Amplify] ← Reactフロントエンド
    ↓ HTTPS（ALB + ACM で実現）
[Amazon ECS Fargate] ← FastAPIバックエンド
    ↓
[Amazon RDS PostgreSQL] ← マネージドDB（東京リージョン）
```

---

## API エンドポイント

### 認証

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/register` | ユーザー登録（JWTトークンを返す） |
| POST | `/login` | ログイン（JWTトークンを返す） |

### メモ（要ログイン）

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/memos` | メモを新規登録 |
| GET | `/memos` | 自分のメモ一覧を取得（ページネーション対応） |
| GET | `/memos/all` | 全ユーザーのメモ一覧を取得（管理者画面用） |
| GET | `/memos/{memo_id}` | 指定IDのメモを取得 |
| PUT | `/memos/{memo_id}` | 指定IDのメモを更新 |
| DELETE | `/memos/{memo_id}` | 指定IDのメモを削除 |
