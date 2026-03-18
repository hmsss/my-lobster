"""地区相关API路由"""
from fastapi import APIRouter, Query
from database import get_db
from schemas import ApiResponse, Province, City, CascadeOption

router = APIRouter()


@router.get("/provinces", response_model=ApiResponse)
async def get_provinces():
    """获取所有省份列表"""
    with get_db() as conn:
        rows = conn.execute("""
            SELECT p.id, p.name, p.pinyin, p.sort_order,
                   (SELECT COUNT(*) FROM cities c WHERE c.province_id = p.id) as city_count
            FROM provinces p
            ORDER BY p.sort_order, p.pinyin
        """).fetchall()
        
        data = [
            Province(
                id=row["id"],
                name=row["name"],
                pinyin=row["pinyin"],
                cityCount=row["city_count"]
            )
            for row in rows
        ]
        
        return ApiResponse(data=data)


@router.get("/cities", response_model=ApiResponse)
async def get_cities(province_id: str = Query(..., description="省份ID")):
    """获取指定省份的城市列表"""
    with get_db() as conn:
        # 检查省份是否存在
        province = conn.execute(
            "SELECT id FROM provinces WHERE id = ?", (province_id,)
        ).fetchone()
        if not province:
            return ApiResponse(code=1101, message="省份不存在")
        
        rows = conn.execute("""
            SELECT c.id, c.province_id, c.name, c.pinyin, c.sort_order,
                   (SELECT COUNT(*) FROM dialects d WHERE d.city_id = c.id) as dialect_count
            FROM cities c
            WHERE c.province_id = ?
            ORDER BY c.sort_order, c.pinyin
        """, (province_id,)).fetchall()
        
        data = [
            City(
                id=row["id"],
                provinceId=row["province_id"],
                name=row["name"],
                pinyin=row["pinyin"],
                dialectCount=row["dialect_count"]
            )
            for row in rows
        ]
        
        return ApiResponse(data=data)


@router.get("/cascade", response_model=ApiResponse)
async def get_cascade_data():
    """获取省市级联数据（用于级联选择器）"""
    with get_db() as conn:
        # 获取所有省份
        provinces = conn.execute("""
            SELECT id, name, pinyin, sort_order
            FROM provinces
            ORDER BY sort_order, pinyin
        """).fetchall()
        
        data = []
        for province in provinces:
            # 获取该省份的所有城市
            cities = conn.execute("""
                SELECT id, name, pinyin, sort_order
                FROM cities
                WHERE province_id = ?
                ORDER BY sort_order, pinyin
            """, (province["id"],)).fetchall()
            
            province_option = CascadeOption(
                value=province["id"],
                label=province["name"],
                children=[
                    CascadeOption(value=city["id"], label=city["name"])
                    for city in cities
                ]
            )
            data.append(province_option)
        
        return ApiResponse(data=data)
