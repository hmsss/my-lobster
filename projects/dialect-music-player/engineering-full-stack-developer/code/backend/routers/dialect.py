"""方言相关API路由"""
from fastapi import APIRouter, Query
from database import get_db
from schemas import ApiResponse, Dialect, DialectListResponse

router = APIRouter()


@router.get("/list", response_model=ApiResponse)
async def get_dialect_list(
    city_id: str = Query(..., description="城市ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量")
):
    """获取指定城市的方言列表"""
    with get_db() as conn:
        # 检查城市是否存在
        city = conn.execute(
            "SELECT id, name FROM cities WHERE id = ?", (city_id,)
        ).fetchone()
        if not city:
            return ApiResponse(code=1102, message="城市不存在")
        
        # 获取总数
        total = conn.execute(
            "SELECT COUNT(*) as count FROM dialects WHERE city_id = ?", (city_id,)
        ).fetchone()["count"]
        
        # 分页查询
        offset = (page - 1) * page_size
        rows = conn.execute("""
            SELECT d.id, d.city_id, d.name, d.description, d.duration, 
                   d.file_path, d.file_size, d.created_at,
                   c.name as city_name
            FROM dialects d
            JOIN cities c ON d.city_id = c.id
            WHERE d.city_id = ?
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        """, (city_id, page_size, offset)).fetchall()
        
        items = []
        for row in rows:
            items.append(Dialect(
                id=row["id"],
                cityId=row["city_id"],
                cityName=row["city_name"],
                name=row["name"],
                description=row["description"],
                duration=row["duration"],
                durationText=format_duration(row["duration"]),
                audioUrl=f"/audio/dialect/{row['file_path']}",
                fileSize=row["file_size"],
                fileSizeText=format_file_size(row["file_size"]),
                createdAt=row["created_at"]
            ))
        
        return ApiResponse(data=DialectListResponse(
            total=total,
            page=page,
            pageSize=page_size,
            items=items
        ))


@router.get("/search", response_model=ApiResponse)
async def search_dialects(
    keyword: str = Query(..., description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量")
):
    """搜索方言"""
    with get_db() as conn:
        search_pattern = f"%{keyword}%"
        
        # 获取总数
        total = conn.execute("""
            SELECT COUNT(*) as count 
            FROM dialects d
            JOIN cities c ON d.city_id = c.id
            WHERE c.name LIKE ? OR d.name LIKE ?
        """, (search_pattern, search_pattern)).fetchone()["count"]
        
        # 分页查询
        offset = (page - 1) * page_size
        rows = conn.execute("""
            SELECT d.id, d.city_id, d.name, d.duration, d.file_path,
                   c.name as city_name
            FROM dialects d
            JOIN cities c ON d.city_id = c.id
            WHERE c.name LIKE ? OR d.name LIKE ?
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        """, (search_pattern, search_pattern, page_size, offset)).fetchall()
        
        items = [
            {
                "id": row["id"],
                "cityId": row["city_id"],
                "cityName": row["city_name"],
                "name": row["name"],
                "duration": row["duration"],
                "audioUrl": f"/audio/dialect/{row['file_path']}"
            }
            for row in rows
        ]
        
        return ApiResponse(data={
            "total": total,
            "page": page,
            "pageSize": page_size,
            "items": items
        })


@router.get("/{dialect_id}", response_model=ApiResponse)
async def get_dialect_detail(dialect_id: str):
    """获取方言详情"""
    with get_db() as conn:
        row = conn.execute("""
            SELECT d.id, d.city_id, d.name, d.description, d.duration,
                   d.file_path, d.file_size, d.created_at,
                   c.name as city_name, p.name as province_name
            FROM dialects d
            JOIN cities c ON d.city_id = c.id
            JOIN provinces p ON c.province_id = p.id
            WHERE d.id = ?
        """, (dialect_id,)).fetchone()
        
        if not row:
            return ApiResponse(code=1201, message="方言不存在")
        
        data = Dialect(
            id=row["id"],
            cityId=row["city_id"],
            cityName=row["city_name"],
            name=row["name"],
            description=row["description"],
            duration=row["duration"],
            durationText=format_duration(row["duration"]),
            audioUrl=f"/audio/dialect/{row['file_path']}",
            fileSize=row["file_size"],
            fileSizeText=format_file_size(row["file_size"]),
            createdAt=row["created_at"]
        )
        
        # 添加省份名称（扩展字段）
        data_dict = data.model_dump()
        data_dict["provinceName"] = row["province_name"]
        
        return ApiResponse(data=data_dict)


# 导入工具函数
from utils import format_duration, format_file_size
