from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db import init_db
from routers import auth, memo


# アプリ起動時にDBを初期化するライフスパンイベント
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


# CORSの設定
# フロントエンド（Vite開発サーバー）からのリクエストを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://main.d396l5gz9yaicy.amplifyapp.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# バリデーションエラーハンドラ
# 422エラー発生時にエラー詳細をJSON形式で返す
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )


# メモ管理ルーターを登録する
app.include_router(auth.router)
app.include_router(memo.router)
