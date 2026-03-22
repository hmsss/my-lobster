"""初始化示例数据"""
import os
import sqlite3
from config import DATABASE_PATH, DIALECT_DIR, MUSIC_DIR, DATA_DIR


def ensure_directories():
    """确保目录存在"""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(DIALECT_DIR, exist_ok=True)
    os.makedirs(MUSIC_DIR, exist_ok=True)


def seed_data():
    """填充示例数据"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 示例省份数据
    provinces = [
        ("sichuan", "四川省", "sichuan", 1),
        ("guangdong", "广东省", "guangdong", 2),
        ("beijing", "北京市", "beijing", 3),
        ("shanghai", "上海市", "shanghai", 4),
        ("zhejiang", "浙江省", "zhejiang", 5),
        ("jiangsu", "江苏省", "jiangsu", 6),
    ]
    
    cursor.executemany(
        "INSERT OR IGNORE INTO provinces (id, name, pinyin, sort_order) VALUES (?, ?, ?, ?)",
        provinces
    )
    
    # 示例城市数据
    cities = [
        ("chengdu", "sichuan", "成都市", "chengdu", 1),
        ("leshan", "sichuan", "乐山市", "leshan", 2),
        ("guangzhou", "guangdong", "广州市", "guangzhou", 1),
        ("shenzhen", "guangdong", "深圳市", "shenzhen", 2),
        ("dongguan", "guangdong", "东莞市", "dongguan", 3),
        ("beijing_city", "beijing", "北京城区", "beijing", 1),
        ("shanghai_city", "shanghai", "上海城区", "shanghai", 1),
        ("hangzhou", "zhejiang", "杭州市", "hangzhou", 1),
        ("ningbo", "zhejiang", "宁波市", "ningbo", 2),
        ("nanjing", "jiangsu", "南京市", "nanjing", 1),
        ("suzhou", "jiangsu", "苏州市", "suzhou", 2),
    ]
    
    cursor.executemany(
        "INSERT OR IGNORE INTO cities (id, province_id, name, pinyin, sort_order) VALUES (?, ?, ?, ?, ?)",
        cities
    )
    
    # 示例方言数据（占位，实际音频文件需要单独准备）
    dialects = [
        ("d001", "chengdu", "成都话 - 日常对话", "成都本地人的日常对话录音，包含问候、购物、问路等场景", 120, "sichuan/chengdu_001.mp3", 1920000),
        ("d002", "chengdu", "成都话 - 茶馆龙门阵", "成都茶馆里的典型龙门阵对话", 180, "sichuan/chengdu_002.mp3", 2880000),
        ("d003", "leshan", "乐山话 - 街头闲聊", "乐山当地人的街头闲聊", 90, "sichuan/leshan_001.mp3", 1440000),
        ("d004", "guangzhou", "广州话 - 日常生活", "广州本地粤语日常对话", 150, "guangdong/guangzhou_001.mp3", 2400000),
        ("d005", "guangzhou", "广州话 - 茶楼早茶", "广州茶楼早茶场景对话", 200, "guangdong/guangzhou_002.mp3", 3200000),
        ("d006", "shenzhen", "深圳话 - 本地话", "深圳本地话（围头话）", 100, "guangdong/shenzhen_001.mp3", 1600000),
        ("d007", "beijing_city", "北京话 - 日常闲聊", "北京胡同里的日常闲聊", 130, "beijing/beijing_001.mp3", 2080000),
        ("d008", "shanghai_city", "上海话 - 日常对话", "上海本地人的日常对话", 140, "shanghai/shanghai_001.mp3", 2240000),
        ("d009", "hangzhou", "杭州话 - 吴语对话", "杭州吴语日常对话", 110, "zhejiang/hangzhou_001.mp3", 1760000),
        ("d010", "nanjing", "南京话 - 街头巷尾", "南京话街头巷尾的对话", 95, "jiangsu/nanjing_001.mp3", 1520000),
    ]
    
    cursor.executemany(
        """INSERT OR IGNORE INTO dialects 
           (id, city_id, name, description, duration, file_path, file_size, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        dialects
    )
    
    conn.commit()
    conn.close()
    print("示例数据填充完成")


def init_app():
    """初始化应用"""
    print("开始初始化应用...")
    ensure_directories()
    
    from database import init_database
    init_database()
    
    seed_data()
    print("应用初始化完成！")


if __name__ == "__main__":
    init_app()
