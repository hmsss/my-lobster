"""方言音乐播放器后端配置"""
import os

# 基础路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# 数据库配置
DATABASE_PATH = os.path.join(DATA_DIR, "app.db")

# 文件存储配置
DIALECT_DIR = os.path.join(DATA_DIR, "dialect")
MUSIC_DIR = os.path.join(DATA_DIR, "music")

# 上传配置
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"]
ALLOWED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"]

# CORS 配置
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
