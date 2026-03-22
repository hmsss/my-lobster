"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from config import CORS_ORIGINS, DATA_DIR, EXPORT_DIR
from database import init_database
from routers import auth, timesheet, project, stats, export
from scripts.init_app import ensure_directories, seed_data

# 创建应用
app = FastAPI(
    title="工时填报系统 API",
    description="企业工时填报与管理系统",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化
ensure_directories()
os.makedirs(EXPORT_DIR, exist_ok=True)
init_database()
seed_data()

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(timesheet.router, prefix="/api/timesheet", tags=["工时"])
app.include_router(project.router, prefix="/api/projects", tags=["项目"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])
app.include_router(export.router, prefix="/api/export", tags=["导出"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "工时填报系统 API",
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
