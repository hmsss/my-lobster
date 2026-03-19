"""工时填报系统后端配置"""
import os
from datetime import timedelta

# 基础路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
EXPORT_DIR = os.path.join(BASE_DIR, "exports")

# 数据库配置
DATABASE_PATH = os.path.join(DATA_DIR, "app.db")

# JWT 配置
JWT_SECRET_KEY = "time-tracking-system-secret-key-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# 密码加密
BCRYPT_SALT_ROUNDS = 10

# CORS 配置
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

# 业务配置
MAX_EXPORT_ROWS = 10000
ALLOWED_DATE_RANGE_DAYS = 7
