"""统计相关API路由"""
from fastapi import APIRouter, Query, Depends
from datetime import datetime, timedelta
from database import get_db
from schemas import ApiResponse
from auth import get_current_user, get_current_admin_user

router = APIRouter()


def get_week_range(date_str: str = None) -> tuple:
    """获取周范围"""
    if date_str:
        base_date = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        base_date = datetime.now()
    
    # 周一为一周开始
    start_of_week = base_date - timedelta(days=base_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    return start_of_week.strftime("%Y-%m-%d"), end_of_week.strftime("%Y-%m-%d")


def get_month_range(date_str: str = None) -> tuple:
    """获取月范围"""
    if date_str:
        base_date = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        base_date = datetime.now()
    
    start_of_month = base_date.replace(day=1)
    if base_date.month == 12:
        end_of_month = base_date.replace(year=base_date.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        end_of_month = base_date.replace(month=base_date.month + 1, day=1) - timedelta(days=1)
    
    return start_of_month.strftime("%Y-%m-%d"), end_of_month.strftime("%Y-%m-%d")


@router.get("/summary", response_model=ApiResponse)
async def get_summary(current_user: dict = Depends(get_current_user)):
    """获取今日/本周/本月统计"""
    today = datetime.now().strftime("%Y-%m-%d")
    week_start, week_end = get_week_range()
    month_start, month_end = get_month_range()
    
    with get_db() as conn:
        # 今日工时
        today_hours = conn.execute("""
            SELECT COALESCE(SUM(hours), 0) as total
            FROM time_entries
            WHERE user_id = ? AND work_date = ?
        """, (current_user["id"], today)).fetchone()["total"]
        
        # 本周工时
        week_hours = conn.execute("""
            SELECT COALESCE(SUM(hours), 0) as total
            FROM time_entries
            WHERE user_id = ? AND work_date >= ? AND work_date <= ?
        """, (current_user["id"], week_start, week_end)).fetchone()["total"]
        
        # 本月工时
        month_hours = conn.execute("""
            SELECT COALESCE(SUM(hours), 0) as total
            FROM time_entries
            WHERE user_id = ? AND work_date >= ? AND work_date <= ?
        """, (current_user["id"], month_start, month_end)).fetchone()["total"]
        
        return ApiResponse(data={
            "today": round(today_hours, 1),
            "week": round(week_hours, 1),
            "month": round(month_hours, 1)
        })


@router.get("/personal", response_model=ApiResponse)
async def get_personal_stats(
    type: str = Query("week"),
    date: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """获取个人工时统计"""
    if type == "month":
        start_date, end_date = get_month_range(date)
    else:
        start_date, end_date = get_week_range(date)
    
    with get_db() as conn:
        # 总工时和天数
        summary = conn.execute("""
            SELECT COALESCE(SUM(hours), 0) as total_hours,
                   COUNT(DISTINCT work_date) as total_days
            FROM time_entries
            WHERE user_id = ? AND work_date >= ? AND work_date <= ?
        """, (current_user["id"], start_date, end_date)).fetchone()
        
        total_hours = summary["total_hours"]
        total_days = summary["total_days"]
        avg_hours = round(total_hours / total_days, 1) if total_days > 0 else 0
        
        # 按项目分组
        by_project = conn.execute("""
            SELECT p.id as project_id, p.name as project_name, SUM(te.hours) as hours
            FROM time_entries te
            JOIN projects p ON te.project_id = p.id
            WHERE te.user_id = ? AND te.work_date >= ? AND te.work_date <= ?
            GROUP BY p.id
            ORDER BY hours DESC
        """, (current_user["id"], start_date, end_date)).fetchall()
        
        project_stats = []
        for row in by_project:
            percentage = round((row["hours"] / total_hours) * 100, 1) if total_hours > 0 else 0
            project_stats.append({
                "projectId": row["project_id"],
                "projectName": row["project_name"],
                "hours": round(row["hours"], 1),
                "percentage": percentage
            })
        
        # 每日趋势
        daily = conn.execute("""
            SELECT work_date as date, SUM(hours) as hours
            FROM time_entries
            WHERE user_id = ? AND work_date >= ? AND work_date <= ?
            GROUP BY work_date
            ORDER BY work_date
        """, (current_user["id"], start_date, end_date)).fetchall()
        
        daily_trend = [
            {"date": row["date"], "hours": round(row["hours"], 1)}
            for row in daily
        ]
        
        return ApiResponse(data={
            "period": {
                "type": type,
                "startDate": start_date,
                "endDate": end_date
            },
            "summary": {
                "totalHours": round(total_hours, 1),
                "totalDays": total_days,
                "avgHoursPerDay": avg_hours
            },
            "byProject": project_stats,
            "dailyTrend": daily_trend
        })


@router.get("/team", response_model=ApiResponse)
async def get_team_stats(
    type: str = Query("week"),
    date: str = Query(None),
    userIds: str = Query(None),
    current_user: dict = Depends(get_current_admin_user)
):
    """获取团队工时统计（仅管理员）"""
    if type == "month":
        start_date, end_date = get_month_range(date)
    else:
        start_date, end_date = get_week_range(date)
    
    # 解析用户ID列表
    user_id_list = [int(uid) for uid in userIds.split(",")] if userIds else None
    
    with get_db() as conn:
        # 构建用户过滤条件
        user_filter = ""
        params = [start_date, end_date]
        if user_id_list:
            placeholders = ",".join("?" * len(user_id_list))
            user_filter = f"AND te.user_id IN ({placeholders})"
            params = [start_date, end_date] + user_id_list
        
        # 总工时
        summary = conn.execute(f"""
            SELECT COALESCE(SUM(hours), 0) as total_hours,
                   COUNT(DISTINCT te.user_id) as total_users
            FROM time_entries te
            WHERE te.work_date >= ? AND te.work_date <= ? {user_filter}
        """, params).fetchone()
        
        total_hours = summary["total_hours"]
        total_users = summary["total_users"]
        avg_hours = round(total_hours / total_users, 1) if total_users > 0 else 0
        
        # 按用户分组
        by_user = conn.execute(f"""
            SELECT u.id as user_id, u.name as user_name, SUM(te.hours) as hours
            FROM time_entries te
            JOIN users u ON te.user_id = u.id
            WHERE te.work_date >= ? AND te.work_date <= ? {user_filter}
            GROUP BY u.id
            ORDER BY hours DESC
        """, params).fetchall()
        
        user_stats = []
        for row in by_user:
            percentage = round((row["hours"] / total_hours) * 100, 1) if total_hours > 0 else 0
            user_stats.append({
                "userId": row["user_id"],
                "userName": row["user_name"],
                "hours": round(row["hours"], 1),
                "percentage": percentage
            })
        
        # 按项目分组
        by_project = conn.execute(f"""
            SELECT p.id as project_id, p.name as project_name, SUM(te.hours) as hours
            FROM time_entries te
            JOIN projects p ON te.project_id = p.id
            WHERE te.work_date >= ? AND te.work_date <= ? {user_filter}
            GROUP BY p.id
            ORDER BY hours DESC
        """, params).fetchall()
        
        project_stats = []
        for row in by_project:
            percentage = round((row["hours"] / total_hours) * 100, 1) if total_hours > 0 else 0
            project_stats.append({
                "projectId": row["project_id"],
                "projectName": row["project_name"],
                "hours": round(row["hours"], 1),
                "percentage": percentage
            })
        
        return ApiResponse(data={
            "period": {
                "type": type,
                "startDate": start_date,
                "endDate": end_date
            },
            "summary": {
                "totalHours": round(total_hours, 1),
                "totalUsers": total_users,
                "avgHoursPerUser": avg_hours
            },
            "byUser": user_stats,
            "byProject": project_stats
        })
