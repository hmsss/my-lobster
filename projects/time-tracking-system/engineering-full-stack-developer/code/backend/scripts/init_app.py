"""初始化示例数据"""
import os
import sqlite3
from passlib.context import CryptContext
from config import DATABASE_PATH, DATA_DIR
from database import init_database

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def ensure_directories():
    """确保目录存在"""
    os.makedirs(DATA_DIR, exist_ok=True)


def seed_data():
    """填充初始数据"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 创建默认管理员账号
    admin_password = pwd_context.hash("admin123", rounds=10)
    cursor.execute("""
        INSERT OR IGNORE INTO users (username, password, name, role, status)
        VALUES ('admin', ?, '系统管理员', 'admin', 'active')
    """, (admin_password,))
    
    # 创建示例员工账号
    employee_password = pwd_context.hash("123456", rounds=10)
    employees = [
        ("zhangsan", "张三"),
        ("lisi", "李四"),
        ("wangwu", "王五"),
    ]
    
    for username, name in employees:
        cursor.execute("""
            INSERT OR IGNORE INTO users (username, password, name, role, status)
            VALUES (?, ?, ?, 'employee', 'active')
        """, (username, employee_password, name))
    
    # 创建示例项目
    projects = [
        ("项目A", "XX客户项目"),
        ("项目B", "内部系统项目"),
        ("项目C", "研发项目"),
    ]
    
    for name, desc in projects:
        cursor.execute("""
            INSERT OR IGNORE INTO projects (name, description, status)
            VALUES (?, ?, 'active')
        """, (name, desc))
    
    conn.commit()
    conn.close()
    print("初始数据填充完成")


def init_app():
    """初始化应用"""
    print("开始初始化应用...")
    ensure_directories()
    init_database()
    seed_data()
    print("应用初始化完成！")
    print("\n默认账号：")
    print("  管理员 - admin / admin123")
    print("  员工 - zhangsan / 123456")


if __name__ == "__main__":
    init_app()
