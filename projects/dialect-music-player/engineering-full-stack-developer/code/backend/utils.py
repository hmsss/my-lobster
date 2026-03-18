"""工具函数"""
import os
import uuid


def format_duration(seconds: int) -> str:
    """格式化时长为 mm:ss 格式"""
    if seconds < 0:
        return "00:00"
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes:02d}:{secs:02d}"


def format_file_size(bytes_size: int) -> str:
    """格式化文件大小"""
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.2f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.2f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"


def generate_id(prefix: str = "") -> str:
    """生成唯一ID"""
    return f"{prefix}{uuid.uuid4().hex[:12]}"


def get_file_extension(filename: str) -> str:
    """获取文件扩展名（小写）"""
    _, ext = os.path.splitext(filename)
    return ext.lower().lstrip(".")


def is_allowed_audio_type(filename: str) -> bool:
    """检查是否为允许的音频类型"""
    allowed = {"mp3", "wav", "ogg", "m4a"}
    ext = get_file_extension(filename)
    return ext in allowed
