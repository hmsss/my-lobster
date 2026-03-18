#!/usr/bin/env python3
"""
方言音乐播放器 - 接口自动化测试
Author: 高级测试工程师
Date: 2026-03-19
"""

import pytest
import requests
import os
import tempfile
import io

# 配置
BASE_URL = "http://localhost:8000"
TIMEOUT = 10


class TestHealthCheck:
    """健康检查测试"""
    
    def test_health_endpoint(self):
        """测试健康检查接口"""
        resp = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
    
    def test_root_endpoint(self):
        """测试根路径"""
        resp = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert "version" in data


class TestRegionAPI:
    """地区模块测试"""
    
    def test_get_provinces_success(self):
        """TC-REG-001: 获取省份列表"""
        resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0
        
        # 验证字段
        province = data["data"][0]
        assert "id" in province
        assert "name" in province
        assert "pinyin" in province
        assert "cityCount" in province
    
    def test_get_cities_success(self):
        """TC-REG-002: 获取城市列表 - 正常场景"""
        # 先获取一个省份ID
        provinces_resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        provinces = provinces_resp.json()["data"]
        assert len(provinces) > 0
        province_id = provinces[0]["id"]
        
        # 获取城市列表
        resp = requests.get(
            f"{BASE_URL}/api/regions/cities",
            params={"province_id": province_id},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert isinstance(data["data"], list)
        
        # 验证字段
        if len(data["data"]) > 0:
            city = data["data"][0]
            assert "id" in city
            assert "provinceId" in city
            assert "name" in city
            assert "dialectCount" in city
    
    def test_get_cities_province_not_exist(self):
        """TC-REG-003: 获取城市列表 - 省份不存在"""
        resp = requests.get(
            f"{BASE_URL}/api/regions/cities",
            params={"province_id": "notexist_province"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 1101
        assert "省份不存在" in data["message"]
    
    def test_get_cascade_data(self):
        """TC-REG-004: 获取省市级联数据"""
        resp = requests.get(f"{BASE_URL}/api/regions/cascade", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert isinstance(data["data"], list)
        
        # 验证级联结构
        if len(data["data"]) > 0:
            province = data["data"][0]
            assert "value" in province
            assert "label" in province
            assert "children" in province
            assert isinstance(province["children"], list)
    
    def test_get_cities_missing_province_id(self):
        """TC-REG-005: 获取城市列表 - 缺少必要参数"""
        resp = requests.get(f"{BASE_URL}/api/regions/cities", timeout=TIMEOUT)
        assert resp.status_code == 422  # Unprocessable Entity


class TestDialectAPI:
    """方言模块测试"""
    
    def test_get_dialect_list_success(self):
        """TC-DIA-001: 获取方言列表 - 正常场景"""
        # 先获取一个有方言的城市ID
        provinces_resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        provinces = provinces_resp.json()["data"]
        
        city_with_dialect = None
        for province in provinces:
            cities_resp = requests.get(
                f"{BASE_URL}/api/regions/cities",
                params={"province_id": province["id"]},
                timeout=TIMEOUT
            )
            cities = cities_resp.json()["data"]
            for city in cities:
                if city["dialectCount"] > 0:
                    city_with_dialect = city
                    break
            if city_with_dialect:
                break
        
        if not city_with_dialect:
            pytest.skip("没有找到包含方言的城市")
        
        # 获取方言列表
        resp = requests.get(
            f"{BASE_URL}/api/dialect/list",
            params={"city_id": city_with_dialect["id"]},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "total" in data["data"]
        assert "page" in data["data"]
        assert "pageSize" in data["data"]
        assert "items" in data["data"]
        assert data["data"]["total"] > 0
        
        # 验证字段
        item = data["data"]["items"][0]
        assert "id" in item
        assert "cityId" in item
        assert "cityName" in item
        assert "name" in item
        assert "duration" in item
        assert "durationText" in item
        assert "audioUrl" in item
    
    def test_get_dialect_list_city_not_exist(self):
        """TC-DIA-002: 获取方言列表 - 城市不存在"""
        resp = requests.get(
            f"{BASE_URL}/api/dialect/list",
            params={"city_id": "notexist_city"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 1102
        assert "城市不存在" in data["message"]
    
    def test_get_dialect_list_pagination(self):
        """TC-DIA-003: 获取方言列表 - 分页"""
        # 获取一个有方言的城市
        provinces_resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        provinces = provinces_resp.json()["data"]
        
        city_with_dialect = None
        for province in provinces:
            cities_resp = requests.get(
                f"{BASE_URL}/api/regions/cities",
                params={"province_id": province["id"]},
                timeout=TIMEOUT
            )
            cities = cities_resp.json()["data"]
            for city in cities:
                if city["dialectCount"] > 0:
                    city_with_dialect = city
                    break
            if city_with_dialect:
                break
        
        if not city_with_dialect:
            pytest.skip("没有找到包含方言的城市")
        
        # 测试分页
        resp = requests.get(
            f"{BASE_URL}/api/dialect/list",
            params={"city_id": city_with_dialect["id"], "page": 1, "page_size": 2},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["page"] == 1
        assert data["data"]["pageSize"] == 2
    
    def test_get_dialect_detail_success(self):
        """TC-DIA-004: 获取方言详情 - 正常场景"""
        # 先获取一个方言ID
        provinces_resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        provinces = provinces_resp.json()["data"]
        
        dialect_id = None
        for province in provinces:
            cities_resp = requests.get(
                f"{BASE_URL}/api/regions/cities",
                params={"province_id": province["id"]},
                timeout=TIMEOUT
            )
            cities = cities_resp.json()["data"]
            for city in cities:
                if city["dialectCount"] > 0:
                    dialects_resp = requests.get(
                        f"{BASE_URL}/api/dialect/list",
                        params={"city_id": city["id"]},
                        timeout=TIMEOUT
                    )
                    dialects = dialects_resp.json()["data"]["items"]
                    if len(dialects) > 0:
                        dialect_id = dialects[0]["id"]
                        break
            if dialect_id:
                break
        
        if not dialect_id:
            pytest.skip("没有找到方言数据")
        
        # 获取详情
        resp = requests.get(
            f"{BASE_URL}/api/dialect/{dialect_id}",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["id"] == dialect_id
        assert "provinceName" in data["data"]
    
    def test_get_dialect_detail_not_exist(self):
        """TC-DIA-005: 获取方言详情 - 方言不存在"""
        resp = requests.get(
            f"{BASE_URL}/api/dialect/notexist_dialect",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 1201
        assert "方言不存在" in data["message"]
    
    def test_search_dialects_success(self):
        """TC-DIA-006: 搜索方言 - 正常场景"""
        # 使用常见的城市名搜索
        resp = requests.get(
            f"{BASE_URL}/api/dialect/search",
            params={"keyword": "成都"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "total" in data["data"]
        assert "items" in data["data"]
    
    def test_search_dialects_no_result(self):
        """TC-DIA-008: 搜索方言 - 无匹配结果"""
        resp = requests.get(
            f"{BASE_URL}/api/dialect/search",
            params={"keyword": "xyz123notexist456"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["total"] == 0
        assert len(data["data"]["items"]) == 0


class TestMusicAPI:
    """音乐模块测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """每个测试方法前的设置"""
        self.uploaded_music_ids = []
    
    def teardown_method(self):
        """每个测试方法后的清理"""
        # 清理上传的音乐
        for music_id in self.uploaded_music_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/music/{music_id}",
                    timeout=TIMEOUT
                )
            except:
                pass
    
    def create_test_mp3(self, size_kb=100):
        """创建测试用的 MP3 文件"""
        # 创建一个简单的测试文件（不是真正的 MP3，但扩展名正确）
        content = b"ID3" + os.urandom(size_kb * 1024 - 3)  # 模拟 MP3 文件头
        return io.BytesIO(content)
    
    def test_upload_music_success(self):
        """TC-MUS-001: 上传音乐 - 正常场景（MP3）"""
        file = self.create_test_mp3(size_kb=100)
        files = {"file": ("test_song.mp3", file, "audio/mpeg")}
        
        resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "id" in data["data"]
        assert "name" in data["data"]
        assert "audioUrl" in data["data"]
        assert "fileType" in data["data"]
        assert data["data"]["fileType"] == "mp3"
        
        # 记录以便清理
        self.uploaded_music_ids.append(data["data"]["id"])
    
    def test_upload_music_with_custom_name(self):
        """TC-MUS-002: 上传音乐 - 带自定义名称"""
        file = self.create_test_mp3(size_kb=50)
        files = {"file": ("test_song.mp3", file, "audio/mpeg")}
        
        resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            data={"name": "我的自定义歌曲"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["name"] == "我的自定义歌曲"
        
        self.uploaded_music_ids.append(data["data"]["id"])
    
    def test_upload_music_unsupported_format(self):
        """TC-MUS-003: 上传音乐 - 不支持的文件格式"""
        content = b"This is a text file"
        file = io.BytesIO(content)
        files = {"file": ("test.txt", file, "text/plain")}
        
        resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 2001
        assert "文件格式不支持" in data["message"]
    
    def test_upload_music_file_too_large(self):
        """TC-MUS-004: 上传音乐 - 文件过大"""
        # 创建一个 21MB 的文件（超过 20MB 限制）
        file = self.create_test_mp3(size_kb=21 * 1024)
        files = {"file": ("large_song.mp3", file, "audio/mpeg")}
        
        resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 2002
        assert "文件大小超过限制" in data["message"]
    
    def test_upload_music_wav_format(self):
        """TC-MUS-005: 上传音乐 - WAV 格式"""
        content = b"RIFF" + os.urandom(1024 * 100 - 4)
        file = io.BytesIO(content)
        files = {"file": ("test.wav", file, "audio/wav")}
        
        resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["fileType"] == "wav"
        
        self.uploaded_music_ids.append(data["data"]["id"])
    
    def test_get_music_list_success(self):
        """TC-MUS-006: 获取音乐列表 - 正常场景"""
        resp = requests.get(f"{BASE_URL}/api/music/list", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "total" in data["data"]
        assert "page" in data["data"]
        assert "pageSize" in data["data"]
        assert "items" in data["data"]
    
    def test_get_music_list_sorting(self):
        """TC-MUS-007: 获取音乐列表 - 排序功能"""
        # 按名称升序
        resp = requests.get(
            f"{BASE_URL}/api/music/list",
            params={"sort_by": "name", "order": "asc"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        
        # 验证排序
        items = data["data"]["items"]
        if len(items) > 1:
            names = [item["name"] for item in items]
            assert names == sorted(names)
    
    def test_get_music_detail_success(self):
        """TC-MUS-008: 获取音乐详情 - 正常场景"""
        # 先上传一首歌
        file = self.create_test_mp3(size_kb=50)
        files = {"file": ("test_detail.mp3", file, "audio/mpeg")}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        music_id = upload_resp.json()["data"]["id"]
        self.uploaded_music_ids.append(music_id)
        
        # 获取详情
        resp = requests.get(
            f"{BASE_URL}/api/music/{music_id}",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["id"] == music_id
    
    def test_get_music_detail_not_exist(self):
        """TC-MUS-009: 获取音乐详情 - 音乐不存在"""
        resp = requests.get(
            f"{BASE_URL}/api/music/notexist_music",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 2004
        assert "音乐不存在" in data["message"]
    
    def test_update_music_success(self):
        """TC-MUS-010: 更新音乐信息 - 正常场景"""
        # 先上传一首歌
        file = self.create_test_mp3(size_kb=50)
        files = {"file": ("test_update.mp3", file, "audio/mpeg")}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        music_id = upload_resp.json()["data"]["id"]
        self.uploaded_music_ids.append(music_id)
        
        # 更新信息
        update_data = {
            "name": "更新后的歌曲名",
            "artist": "测试艺术家",
            "album": "测试专辑"
        }
        resp = requests.patch(
            f"{BASE_URL}/api/music/{music_id}",
            json=update_data,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["name"] == "更新后的歌曲名"
        assert data["data"]["artist"] == "测试艺术家"
        assert data["data"]["album"] == "测试专辑"
    
    def test_update_music_not_exist(self):
        """TC-MUS-011: 更新音乐信息 - 音乐不存在"""
        update_data = {"name": "新名称"}
        resp = requests.patch(
            f"{BASE_URL}/api/music/notexist_music",
            json=update_data,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 2004
    
    def test_delete_music_success(self):
        """TC-MUS-012: 删除音乐 - 正常场景"""
        # 先上传一首歌
        file = self.create_test_mp3(size_kb=50)
        files = {"file": ("test_delete.mp3", file, "audio/mpeg")}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        music_id = upload_resp.json()["data"]["id"]
        
        # 删除
        resp = requests.delete(
            f"{BASE_URL}/api/music/{music_id}",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        
        # 验证已删除
        detail_resp = requests.get(
            f"{BASE_URL}/api/music/{music_id}",
            timeout=TIMEOUT
        )
        assert detail_resp.json()["code"] == 2004
    
    def test_delete_music_not_exist(self):
        """TC-MUS-013: 删除音乐 - 音乐不存在"""
        resp = requests.delete(
            f"{BASE_URL}/api/music/notexist_music",
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 2004
    
    def test_search_music(self):
        """TC-MUS-014: 搜索音乐"""
        # 先上传一首歌
        file = self.create_test_mp3(size_kb=50)
        files = {"file": ("测试搜索歌曲.mp3", file, "audio/mpeg")}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            data={"name": "测试搜索歌曲"},
            files=files,
            timeout=TIMEOUT
        )
        self.uploaded_music_ids.append(upload_resp.json()["data"]["id"])
        
        # 搜索
        resp = requests.get(
            f"{BASE_URL}/api/music/search",
            params={"keyword": "测试搜索"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "total" in data["data"]
        assert "items" in data["data"]


class TestAudioAccess:
    """音频文件访问测试"""
    
    def test_access_dialect_audio(self):
        """TC-AUD-001: 访问方言音频文件"""
        # 获取一个方言的音频URL
        provinces_resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        provinces = provinces_resp.json()["data"]
        
        audio_url = None
        for province in provinces:
            cities_resp = requests.get(
                f"{BASE_URL}/api/regions/cities",
                params={"province_id": province["id"]},
                timeout=TIMEOUT
            )
            cities = cities_resp.json()["data"]
            for city in cities:
                if city["dialectCount"] > 0:
                    dialects_resp = requests.get(
                        f"{BASE_URL}/api/dialect/list",
                        params={"city_id": city["id"]},
                        timeout=TIMEOUT
                    )
                    dialects = dialects_resp.json()["data"]["items"]
                    if len(dialects) > 0:
                        audio_url = dialects[0]["audioUrl"]
                        break
            if audio_url:
                break
        
        if not audio_url:
            pytest.skip("没有找到方言音频文件")
        
        # 访问音频文件
        resp = requests.get(f"{BASE_URL}{audio_url}", timeout=TIMEOUT)
        assert resp.status_code == 200
        assert "audio" in resp.headers.get("Content-Type", "")
    
    def test_access_music_audio(self):
        """TC-AUD-002: 访问音乐文件"""
        # 上传一个音乐文件
        content = b"ID3" + os.urandom(1024 * 50 - 3)
        file = io.BytesIO(content)
        files = {"file": ("test_access.mp3", file, "audio/mpeg")}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/music/upload",
            files=files,
            timeout=TIMEOUT
        )
        
        if upload_resp.json()["code"] != 0:
            pytest.skip("上传失败")
        
        audio_url = upload_resp.json()["data"]["audioUrl"]
        music_id = upload_resp.json()["data"]["id"]
        
        try:
            # 访问音频文件
            resp = requests.get(f"{BASE_URL}{audio_url}", timeout=TIMEOUT)
            assert resp.status_code == 200
            assert "audio" in resp.headers.get("Content-Type", "")
        finally:
            # 清理
            requests.delete(f"{BASE_URL}/api/music/{music_id}", timeout=TIMEOUT)
    
    def test_access_nonexistent_audio(self):
        """TC-AUD-003: 访问不存在的音频文件"""
        resp = requests.get(
            f"{BASE_URL}/audio/dialect/notexist.mp3",
            timeout=TIMEOUT
        )
        assert resp.status_code == 404


class TestValidation:
    """参数校验测试"""
    
    def test_pagination_page_zero(self):
        """TC-VAL-001: 分页参数边界值 - page=0"""
        resp = requests.get(
            f"{BASE_URL}/api/music/list",
            params={"page": 0},
            timeout=TIMEOUT
        )
        assert resp.status_code == 422
    
    def test_pagination_page_negative(self):
        """TC-VAL-001: 分页参数边界值 - page=-1"""
        resp = requests.get(
            f"{BASE_URL}/api/music/list",
            params={"page": -1},
            timeout=TIMEOUT
        )
        assert resp.status_code == 422
    
    def test_pagination_pagesize_zero(self):
        """TC-VAL-001: 分页参数边界值 - page_size=0"""
        resp = requests.get(
            f"{BASE_URL}/api/music/list",
            params={"page_size": 0},
            timeout=TIMEOUT
        )
        assert resp.status_code == 422
    
    def test_pagination_pagesize_exceed_max(self):
        """TC-VAL-001: 分页参数边界值 - page_size 超过最大值"""
        resp = requests.get(
            f"{BASE_URL}/api/music/list",
            params={"page_size": 101},
            timeout=TIMEOUT
        )
        assert resp.status_code == 422


class TestResponseFormat:
    """响应格式测试"""
    
    def test_success_response_format(self):
        """TC-COM-001: 成功响应格式验证"""
        resp = requests.get(f"{BASE_URL}/api/regions/provinces", timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        
        # 验证响应格式
        assert "code" in data
        assert "message" in data
        assert "data" in data
        assert data["code"] == 0
        assert isinstance(data["message"], str)
    
    def test_error_response_format(self):
        """TC-COM-001: 错误响应格式验证"""
        resp = requests.get(
            f"{BASE_URL}/api/regions/cities",
            params={"province_id": "notexist"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # 验证错误响应格式
        assert "code" in data
        assert "message" in data
        assert data["code"] != 0
        assert isinstance(data["message"], str)


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])
