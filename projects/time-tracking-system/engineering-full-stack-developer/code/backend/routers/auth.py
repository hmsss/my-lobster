"""认证相关API路由"""
from fastapi import APIRouter, Depends
from passlib.context import CryptContext
from auth import create_token, get_current_user
from database import get_db
from schemas import ApiResponse, LoginRequest, ChangePasswordRequest
from config import BCRYPT_SALT_ROUNDS

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=ApiResponse)
async def login(request: LoginRequest):
    """用户登录"""
    if not request.username or not request.password:
        return ApiResponse(code=1001, message="用户名或密码不能为空")
    
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, password, name, role, status FROM users WHERE username = ?",
            (request.username,)
        ).fetchone()
        
        if not user:
            return ApiResponse(code=1101, message="用户名或密码错误")
        
        if not pwd_context.verify(request.password, user["password"]):
            return ApiResponse(code=1101, message="用户名或密码错误")
        
        if user["status"] != "active":
            return ApiResponse(code=1102, message="用户已被禁用")
        
        token = create_token(user["id"], user["username"], user["role"])
        
        return ApiResponse(
            message="登录成功",
            data={
                "token": token,
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "name": user["name"],
                    "role": user["role"]
                }
            }
        )


@router.get("/me", response_model=ApiResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, name, role, status, created_at FROM users WHERE id = ?",
            (current_user["id"],)
        ).fetchone()
        
        return ApiResponse(data={
            "id": user["id"],
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "status": user["status"],
            "createdAt": user["created_at"]
        })


@router.put("/password", response_model=ApiResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """修改密码"""
    if len(request.newPassword) < 6 or len(request.newPassword) > 20:
        return ApiResponse(code=1104, message="新密码长度应为6-20位")
    
    with get_db() as conn:
        user = conn.execute(
            "SELECT password FROM users WHERE id = ?",
            (current_user["id"],)
        ).fetchone()
        
        if not pwd_context.verify(request.oldPassword, user["password"]):
            return ApiResponse(code=1103, message="原密码错误")
        
        new_password_hash = pwd_context.hash(request.newPassword)
        conn.execute(
            "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_password_hash, current_user["id"])
        )
        
        return ApiResponse(message="密码修改成功")
