"""数据库连接和初始化"""
import sqlite3
from contextlib import contextmanager
from config import DATABASE_PATH


def get_connection() -> sqlite3.Connection:
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """数据库连接上下文管理器"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database():
    """初始化数据库表结构"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 省份表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS provinces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            pinyin TEXT,
            sort_order INTEGER DEFAULT 0
        )
    """)
    
    # 城市表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cities (
            id TEXT PRIMARY KEY,
            province_id TEXT NOT NULL,
            name TEXT NOT NULL,
            pinyin TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (province_id) REFERENCES provinces(id)
        )
    """)
    
    # 方言表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dialects (
            id TEXT PRIMARY KEY,
            city_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            duration INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (city_id) REFERENCES cities(id)
        )
    """)
    
    # 音乐表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS musics (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            artist TEXT,
            album TEXT,
            duration INTEGER,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            file_type TEXT,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 创建索引
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cities_province ON cities(province_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dialects_city ON dialects(city_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_musics_upload_time ON musics(upload_time)")
    
    conn.commit()
    conn.close()
    print("数据库初始化完成")
