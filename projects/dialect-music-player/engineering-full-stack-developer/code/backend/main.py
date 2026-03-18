"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from config import DATA_DIR
from database import init_database
from routers import region, dialect, music
from scripts.init_app import ensure_directories, seed_data

# 创建应用
app = FastAPI(
    title="方言音乐播放器 API",
    description="一个支持方言播放和音乐播放的 Web 应用",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化
ensure_directories()
init_database()
seed_data()

# 静态文件服务（音频文件）
app.mount("/audio", StaticFiles(directory=DATA_DIR), name="audio")

# 注册路由
app.include_router(region.router, prefix="/api/regions", tags=["地区"])
app.include_router(dialect.router, prefix="/api/dialect", tags=["方言"])
app.include_router(music.router, prefix="/api/music", tags=["音乐"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "方言音乐播放器 API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
