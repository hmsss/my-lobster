"""Pydantic 模型定义"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from enum import Enum


class UserRole(str, Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


# ==================== 通用响应 ====================

class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None


# ==================== 认证模块 ====================

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    role: str
    status: str
    createdAt: str


# ==================== 工时模块 ====================

class TimeEntryCreate(BaseModel):
    projectId: int
    task: str
    hours: float
    date: str
    note: Optional[str] = None


class TimeEntryUpdate(BaseModel):
    projectId: int
    task: str
    hours: float
    date: str
    note: Optional[str] = None


class TimeEntryResponse(BaseModel):
    id: int
    projectId: int
    projectName: str
    task: str
    hours: float
    date: str
    note: Optional[str] = None
    createdAt: str
    updatedAt: Optional[str] = None


class TimeEntryListResponse(BaseModel):
    total: int
    page: int
    pageSize: int
    items: List[TimeEntryResponse]


# ==================== 项目模块 ====================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    createdAt: str


# ==================== 统计模块 ====================

class PeriodInfo(BaseModel):
    type: str
    startDate: str
    endDate: str


class ProjectHours(BaseModel):
    projectId: int
    projectName: str
    hours: float
    percentage: float


class DailyHours(BaseModel):
    date: str
    hours: float


class PersonalStatsResponse(BaseModel):
    period: PeriodInfo
    summary: dict
    byProject: List[ProjectHours]
    dailyTrend: List[DailyHours]


class TeamStatsResponse(BaseModel):
    period: PeriodInfo
    summary: dict
    byUser: List[dict]
    byProject: List[ProjectHours]


class SummaryResponse(BaseModel):
    today: float
    week: float
    month: float
