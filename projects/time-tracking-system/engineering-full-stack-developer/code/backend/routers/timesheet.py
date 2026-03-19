"""工时相关API路由"""
from fastapi import APIRouter, Query, Depends
from datetime import datetime, timedelta
from database import get_db
from schemas import ApiResponse
from auth import get_current_user, get_current_admin_user
from config import ALLOWED_DATE_RANGE_DAYS

router = APIRouter()


@router.post("", response_model=ApiResponse)
async def create_timesheet(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """提交工时"""
    project_id = data.get("projectId")
    task = data.get("task", "").strip()
    hours = data.get("hours")
    work_date = data.get("date")
    note = data.get("note", "").strip() if data.get("note") else None
    
    # 参数校验
    if not project_id or not task or hours is None or not work_date:
        return ApiResponse(code=1001, message="缺少必填参数")
    
    if len(task) > 200:
        return ApiResponse(code=1001, message="任务名称不能超过200字符")
    
    if hours <= 0 or hours > 24:
        return ApiResponse(code=2003, message="时长必须大于0且不超过24小时")
    
    if note and len(note) > 500:
        return ApiResponse(code=1001, message="备注不能超过500字符")
    
    with get_db() as conn:
        # 检查项目是否存在且为active
        project = conn.execute(
            "SELECT id, name FROM projects WHERE id = ? AND status = 'active'",
            (project_id,)
        ).fetchone()
        
        if not project:
            return ApiResponse(code=2001, message="项目不存在或已归档")
        
        # 日期校验：禁止未来日期 + 禁止超过7天前
        try:
            work_date_obj = datetime.strptime(work_date, "%Y-%m-%d").date()
            today = datetime.now().date()
            min_allowed_date = today - timedelta(days=ALLOWED_DATE_RANGE_DAYS)
            
            if work_date_obj > today:
                return ApiResponse(code=2002, message="不能提交未来日期的工时")
            
            if work_date_obj < min_allowed_date:
                return ApiResponse(code=2002, message=f"只能提交{ALLOWED_DATE_RANGE_DAYS}天内的工时")
        except ValueError:
            return ApiResponse(code=1001, message="日期格式错误，请使用 YYYY-MM-DD 格式")
        
        # 保存工时记录
        cursor = conn.execute("""
            INSERT INTO time_entries (user_id, project_id, task, hours, work_date, note)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (current_user["id"], project_id, task, hours, work_date, note))
        
        entry_id = cursor.lastrowid
        
        return ApiResponse(
            message="提交成功",
            data={
                "id": entry_id,
                "projectId": project_id,
                "projectName": project["name"],
                "task": task,
                "hours": hours,
                "date": work_date,
                "note": note,
                "createdAt": None
            }
        )


@router.get("", response_model=ApiResponse)
async def list_timesheet(
    startDate: str = Query(None),
    endDate: str = Query(None),
    projectId: int = Query(None),
    userId: int = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """获取工时列表"""
    # 普通用户只能查看自己的记录
    target_user_id = userId if (current_user["role"] == "admin" and userId) else current_user["id"]
    
    with get_db() as conn:
        # 构建查询条件
        conditions = ["te.user_id = ?"]
        params = [target_user_id]
        
        if startDate:
            conditions.append("te.work_date >= ?")
            params.append(startDate)
        if endDate:
            conditions.append("te.work_date <= ?")
            params.append(endDate)
        if projectId:
            conditions.append("te.project_id = ?")
            params.append(projectId)
        
        where_clause = " AND ".join(conditions)
        
        # 获取总数
        total = conn.execute(
            f"SELECT COUNT(*) as count FROM time_entries te WHERE {where_clause}",
            params
        ).fetchone()["count"]
        
        # 分页查询
        offset = (page - 1) * pageSize
        rows = conn.execute(f"""
            SELECT te.id, te.project_id, p.name as project_name, te.task, te.hours,
                   te.work_date, te.note, te.created_at, te.updated_at
            FROM time_entries te
            JOIN projects p ON te.project_id = p.id
            WHERE {where_clause}
            ORDER BY te.work_date DESC, te.created_at DESC
            LIMIT ? OFFSET ?
        """, params + [pageSize, offset]).fetchall()
        
        items = [
            {
                "id": row["id"],
                "projectId": row["project_id"],
                "projectName": row["project_name"],
                "task": row["task"],
                "hours": row["hours"],
                "date": row["work_date"],
                "note": row["note"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"]
            }
            for row in rows
        ]
        
        return ApiResponse(data={
            "total": total,
            "page": page,
            "pageSize": pageSize,
            "items": items
        })


@router.get("/{entry_id}", response_model=ApiResponse)
async def get_timesheet(
    entry_id: int,
    current_user: dict = Depends(get_current_user)
):
    """获取工时详情"""
    with get_db() as conn:
        row = conn.execute("""
            SELECT te.id, te.user_id, u.name as user_name, te.project_id, p.name as project_name,
                   te.task, te.hours, te.work_date, te.note, te.created_at, te.updated_at
            FROM time_entries te
            JOIN users u ON te.user_id = u.id
            JOIN projects p ON te.project_id = p.id
            WHERE te.id = ?
        """, (entry_id,)).fetchone()
        
        if not row:
            return ApiResponse(code=2004, message="工时记录不存在")
        
        # 权限检查
        if current_user["role"] != "admin" and row["user_id"] != current_user["id"]:
            return ApiResponse(code=2005, message="无权访问此记录")
        
        return ApiResponse(data={
            "id": row["id"],
            "userId": row["user_id"],
            "userName": row["user_name"],
            "projectId": row["project_id"],
            "projectName": row["project_name"],
            "task": row["task"],
            "hours": row["hours"],
            "date": row["work_date"],
            "note": row["note"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        })


@router.put("/{entry_id}", response_model=ApiResponse)
async def update_timesheet(
    entry_id: int,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """更新工时"""
    with get_db() as conn:
        # 检查记录是否存在
        entry = conn.execute(
            "SELECT id, user_id FROM time_entries WHERE id = ?",
            (entry_id,)
        ).fetchone()
        
        if not entry:
            return ApiResponse(code=2004, message="工时记录不存在")
        
        # 权限检查
        if entry["user_id"] != current_user["id"]:
            return ApiResponse(code=2005, message="无权修改此记录")
        
        # 获取更新数据
        project_id = data.get("projectId")
        task = data.get("task", "").strip()
        hours = data.get("hours")
        work_date = data.get("date")
        note = data.get("note", "").strip() if data.get("note") else None
        
        if not project_id or not task or hours is None or not work_date:
            return ApiResponse(code=1001, message="缺少必填参数")
        
        if hours <= 0 or hours > 24:
            return ApiResponse(code=2003, message="时长必须大于0且不超过24小时")
        
        # 检查项目
        project = conn.execute(
            "SELECT id, name FROM projects WHERE id = ? AND status = 'active'",
            (project_id,)
        ).fetchone()
        
        if not project:
            return ApiResponse(code=2001, message="项目不存在或已归档")
        
        # 日期校验：禁止未来日期 + 禁止超过7天前
        try:
            work_date_obj = datetime.strptime(work_date, "%Y-%m-%d").date()
            today = datetime.now().date()
            min_allowed_date = today - timedelta(days=ALLOWED_DATE_RANGE_DAYS)
            
            if work_date_obj > today:
                return ApiResponse(code=2002, message="不能提交未来日期的工时")
            
            if work_date_obj < min_allowed_date:
                return ApiResponse(code=2002, message=f"只能提交{ALLOWED_DATE_RANGE_DAYS}天内的工时")
        except ValueError:
            return ApiResponse(code=1001, message="日期格式错误，请使用 YYYY-MM-DD 格式")
        
        # 更新记录
        conn.execute("""
            UPDATE time_entries
            SET project_id = ?, task = ?, hours = ?, work_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (project_id, task, hours, work_date, note, entry_id))
        
        return ApiResponse(
            message="更新成功",
            data={
                "id": entry_id,
                "projectId": project_id,
                "projectName": project["name"],
                "task": task,
                "hours": hours,
                "date": work_date,
                "note": note
            }
        )


@router.delete("/{entry_id}", response_model=ApiResponse)
async def delete_timesheet(
    entry_id: int,
    current_user: dict = Depends(get_current_user)
):
    """删除工时"""
    with get_db() as conn:
        # 检查记录是否存在
        entry = conn.execute(
            "SELECT id, user_id FROM time_entries WHERE id = ?",
            (entry_id,)
        ).fetchone()
        
        if not entry:
            return ApiResponse(code=2004, message="工时记录不存在")
        
        # 权限检查
        if entry["user_id"] != current_user["id"]:
            return ApiResponse(code=2005, message="无权删除此记录")
        
        # 删除记录
        conn.execute("DELETE FROM time_entries WHERE id = ?", (entry_id,))
        
        return ApiResponse(message="删除成功")
