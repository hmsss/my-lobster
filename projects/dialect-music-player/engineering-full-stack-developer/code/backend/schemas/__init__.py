"""Pydantic 模型定义"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ==================== 通用响应 ====================

class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None


# ==================== 地区模块 ====================

class Province(BaseModel):
    id: str
    name: str
    pinyin: Optional[str] = None
    cityCount: int = 0


class City(BaseModel):
    id: str
    provinceId: str
    name: str
    pinyin: Optional[str] = None
    dialectCount: int = 0


class CascadeOption(BaseModel):
    value: str
    label: str
    children: Optional[List["CascadeOption"]] = None


# ==================== 方言模块 ====================

class Dialect(BaseModel):
    id: str
    cityId: str
    cityName: str
    name: str
    description: Optional[str] = None
    duration: int  # 秒
    durationText: str
    audioUrl: str
    fileSize: int
    fileSizeText: str
    createdAt: Optional[str] = None


class DialectListResponse(BaseModel):
    total: int
    page: int
    pageSize: int
    items: List[Dialect]


# ==================== 音乐模块 ====================

class Music(BaseModel):
    id: str
    name: str
    artist: Optional[str] = None
    album: Optional[str] = None
    duration: int
    durationText: str
    audioUrl: str
    fileSize: int
    fileSizeText: str
    fileType: str
    uploadTime: str


class MusicListResponse(BaseModel):
    total: int
    page: int
    pageSize: int
    items: List[Music]


class MusicUpdate(BaseModel):
    name: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
