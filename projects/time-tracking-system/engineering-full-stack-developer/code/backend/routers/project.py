"""项目相关API路由"""
from fastapi import APIRouter, Query, Depends
from database import get_db
from schemas import ApiResponse
from auth import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_projects(
    status: str = Query("active"),
    current_user: dict = Depends(get_current_user)
):
    """获取项目列表"""
    with get_db() as conn:
        if status == "all":
            rows = conn.execute("""
                SELECT id, name, description, status, created_at
                FROM projects
                ORDER BY created_at DESC
            """).fetchall()
        else:
            rows = conn.execute("""
                SELECT id, name, description, status, created_at
                FROM projects
                WHERE status = ?
                ORDER BY created_at DESC
            """, (status,)).fetchall()
        
        items = [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "status": row["status"],
                "createdAt": row["created_at"]
            }
            for row in rows
        ]
        
        return ApiResponse(data=items)


@router.post("", response_model=ApiResponse)
async def create_project(
    data: dict,
    current_user: dict = Depends(get_current_admin_user)
):
    """创建项目（仅管理员）"""
    name = data.get("name", "").strip()
    description = data.get("description", "").strip() if data.get("description") else None
    
    if not name:
        return ApiResponse(code=1001, message="项目名称不能为空")
    
    if len(name) > 100:
        return ApiResponse(code=1001, message="项目名称不能超过100字符")
    
    with get_db() as conn:
        # 检查项目名是否已存在
        existing = conn.execute(
            "SELECT id FROM projects WHERE name = ?",
            (name,)
        ).fetchone()
        
        if existing:
            return ApiResponse(code=3001, message="项目名称已存在")
        
        # 创建项目
        cursor = conn.execute(
            "INSERT INTO projects (name, description) VALUES (?, ?)",
            (name, description)
        )
        
        project_id = cursor.lastrowid
        
        return ApiResponse(
            message="创建成功",
            data={
                "id": project_id,
                "name": name,
                "description": description,
                "status": "active",
                "createdAt": None
            }
        )


@router.put("/{project_id}", response_model=ApiResponse)
async def update_project(
    project_id: int,
    data: dict,
    current_user: dict = Depends(get_current_admin_user)
):
    """更新项目（仅管理员）"""
    name = data.get("name", "").strip()
    description = data.get("description", "").strip() if data.get("description") else None
    
    if not name:
        return ApiResponse(code=1001, message="项目名称不能为空")
    
    with get_db() as conn:
        # 检查项目是否存在
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?",
            (project_id,)
        ).fetchone()
        
        if not project:
            return ApiResponse(code=3003, message="项目不存在")
        
        # 检查项目名是否与其他项目重复
        existing = conn.execute(
            "SELECT id FROM projects WHERE name = ? AND id != ?",
            (name, project_id)
        ).fetchone()
        
        if existing:
            return ApiResponse(code=3001, message="项目名称已存在")
        
        # 更新项目
        conn.execute(
            "UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (name, description, project_id)
        )
        
        return ApiResponse(
            message="更新成功",
            data={
                "id": project_id,
                "name": name,
                "description": description
            }
        )


@router.post("/{project_id}/archive", response_model=ApiResponse)
async def archive_project(
    project_id: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """归档项目（仅管理员）"""
    with get_db() as conn:
        project = conn.execute(
            "SELECT id, name FROM projects WHERE id = ?",
            (project_id,)
        ).fetchone()
        
        if not project:
            return ApiResponse(code=3003, message="项目不存在")
        
        conn.execute(
            "UPDATE projects SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (project_id,)
        )
        
        return ApiResponse(
            message="归档成功",
            data={
                "id": project_id,
                "name": project["name"],
                "status": "archived"
            }
        )


@router.post("/{project_id}/activate", response_model=ApiResponse)
async def activate_project(
    project_id: int,
    current_user: dict = Depends(get_current_admin_user)
):
    """激活项目（仅管理员）"""
    with get_db() as conn:
        project = conn.execute(
            "SELECT id, name FROM projects WHERE id = ?",
            (project_id,)
        ).fetchone()
        
        if not project:
            return ApiResponse(code=3003, message="项目不存在")
        
        conn.execute(
            "UPDATE projects SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (project_id,)
        )
        
        return ApiResponse(
            message="激活成功",
            data={
                "id": project_id,
                "name": project["name"],
                "status": "active"
            }
        )
