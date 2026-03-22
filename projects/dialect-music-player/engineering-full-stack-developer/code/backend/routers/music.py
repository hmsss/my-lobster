"""音乐相关API路由"""
import os
from fastapi import APIRouter, Query, UploadFile, File, Form
 from database import get_db
from schemas import ApiResponse, Music, MusicListResponse, MusicUpdate
from config import MUSIC_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from utils import format_duration, format_file_size, generate_id, is_allowed_audio_type

router = APIRouter()


@router.post("/upload", response_model=ApiResponse)
async def upload_music(
    file: UploadFile = File(..., description="音乐文件"),
    name: str = Form(None, description="歌曲名称")
):
    """上传音乐文件"""
    # 检查文件类型
    if not is_allowed_audio_type(file.filename):
        return ApiResponse(code=2001, message="文件格式不支持， 仅支持 mp3, wav, ogg, m4a")
    
    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        return ApiResponse(code=2002, message=f"文件大小超过限制（最大 {MAX_FILE_SIZE // (1024*1024)}MB)")
    
    # 生成文件名和保存路径
    file_ext = file.filename.rsplit(".", 1)[-1].lower()
    music_id = generate_id("m_")
    filename = f"{music_id}.{file_ext}"
    file_path = os.path.join(MUSIC_DIR, filename)
    
    # 保存文件
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        return ApiResponse(code=2003, message=f"上传失败: {str(e)}")
    
    # 获取歌曲名称
    song_name = name or os.path.splitext(file.filename)[0]
    
    file_size = len(content)
    
    with get_db() as conn:
        conn.execute("""
            INSERT INTO musics (id, name, duration, file_path, file_size, file_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (music_id, song_name, 0, filename, file_size, file_ext))
    
    return ApiResponse(
        message="上传成功",
        data=Music(
            id=music_id,
            name=song_name,
            artist=None,
            album=None,
            duration=0,
            durationText="00:00",
            audioUrl=f"/audio/music/{filename}",
            fileSize=file_size,
            fileSizeText=format_file_size(file_size),
            fileType=file_ext,
            uploadTime=""
        )
    )


@router.get("/list", response_model=ApiResponse)
async def get_music_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=100, description="每页数量"),
    sort_by: str = Query("upload_time", description="排序字段"),
    order: str = Query("desc", description="排序方向")
):
    """获取音乐列表"""
    with get_db() as conn:
        valid_sort_fields = {"upload_time": "upload_time", "name": "name", "duration": "duration"}
        sort_field = valid_sort_fields.get(sort_by, "upload_time")
        order_direction = "DESC" if order == "desc" else "ASC"
        
        total = conn.execute("SELECT COUNT(*) as count FROM musics").fetchone()["count"]
        
        offset = (page - 1) * page_size
        rows = conn.execute(f"""
            SELECT id, name, artist, album, duration, file_path, file_size, file_type, upload_time
            FROM musics
            ORDER BY {sort_field} {order_direction}
            LIMIT ? OFFSET ?
        """, (page_size, offset)).fetchall()
        
        items = [
            Music(
                id=row["id"],
                name=row["name"],
                artist=row["artist"],
                album=row["album"],
                duration=row["duration"],
                durationText=format_duration(row["duration"]),
                audioUrl=f"/audio/music/{row['file_path']}",
                fileSize=row["file_size"],
                fileSizeText=format_file_size(row["file_size"]),
                fileType=row["file_type"],
                uploadTime=row["upload_time"]
            )
            for row in rows
        ]
        
        return ApiResponse(data=MusicListResponse(
            total=total,
            page=page,
            pageSize=page_size,
            items=items
        ))


@router.get("/search", response_model=ApiResponse)
async def search_music(
    keyword: str = Query(..., description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量")
):
    """搜索音乐"""
    with get_db() as conn:
        search_pattern = f"%{keyword}%"
        
        total = conn.execute("""
            SELECT COUNT(*) as count FROM musics
            WHERE name LIKE ? OR artist LIKE ?
        """, (search_pattern, search_pattern)).fetchone()["count"]
        
        offset = (page - 1) * page_size
        rows = conn.execute("""
            SELECT id, name, artist, album, duration, file_path
            FROM musics
            WHERE name LIKE ? OR artist LIKE ?
            ORDER BY upload_time DESC
            LIMIT ? OFFSET ?
        """, (search_pattern, search_pattern, page_size, offset)).fetchall()
        
        items = [
            {
                "id": row["id"],
                "name": row["name"],
                "artist": row["artist"],
                "album": row["album"],
                "duration": row["duration"],
                "audioUrl": f"/audio/music/{row['file_path']}"
            }
            for row in rows
        ]
        
        return ApiResponse(data={
            "total": total,
            "items": items
        })


@router.get("/{music_id}", response_model=ApiResponse)
async def get_music_detail(music_id: str):
    """获取音乐详情"""
    with get_db() as conn:
        row = conn.execute("""
            SELECT id, name, artist, album, duration, file_path, file_size, file_type, upload_time
            FROM musics
            WHERE id = ?
        """, (music_id,)).fetchone()
        
        if not row:
            return ApiResponse(code=2004, message="音乐不存在")
        
        return ApiResponse(data=Music(
            id=row["id"],
            name=row["name"],
            artist=row["artist"],
            album=row["album"],
            duration=row["duration"],
            durationText=format_duration(row["duration"]),
            audioUrl=f"/audio/music/{row['file_path']}",
            fileSize=row["file_size"],
            fileSizeText=format_file_size(row["file_size"]),
            fileType=row["file_type"],
            uploadTime=row["upload_time"]
        ))


@router.patch("/{music_id}", response_model=ApiResponse)
async def update_music(music_id: str, update_data: MusicUpdate):
    """更新音乐信息"""
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM musics WHERE id = ?", (music_id,)
        ).fetchone()
        if not existing:
            return ApiResponse(code=2004, message="音乐不存在")
        
        updates = []
        params = []
        if update_data.name is not None:
            updates.append("name = ?")
            params.append(update_data.name)
        if update_data.artist is not None:
            updates.append("artist = ?")
            params.append(update_data.artist)
        if update_data.album is not None:
            updates.append("album = ?")
            params.append(update_data.album)
        
        if updates:
            params.append(music_id)
            conn.execute(
                f"UPDATE musics SET {', '.join(updates)} where id = ?",
                params
            )
        
        row = conn.execute("""
            SELECT id, name, artist, album FROM musics WHERE id = ?
        """, (music_id,)).fetchone()
        
        return ApiResponse(
            message="更新成功",
            data={
                "id": row["id"],
                "name": row["name"],
                "artist": row["artist"],
                "album": row["album"]
            }
        )


@router.delete("/{music_id}", response_model=ApiResponse)
async def delete_music(music_id: str):
    """删除音乐"""
    with get_db() as conn:
        row = conn.execute(
            "SELECT file_path FROM musics WHERE id = ?", (music_id,)
        ).fetchone()
        
        if not row:
            return ApiResponse(code=2004, message="音乐不存在")
        
        file_path = os.path.join(MUSIC_DIR, row["file_path"])
        
        conn.execute("DELETE FROM musics WHERE id = ?", (music_id,))
        
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            return ApiResponse(code=2005, message=f"删除文件失败: {str(e)}")
        
        return ApiResponse(message="删除成功")
