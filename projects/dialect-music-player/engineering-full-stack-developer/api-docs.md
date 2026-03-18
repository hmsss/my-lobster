# 方言音乐播放器 - API 接口文档

**Author**: 全栈工程师
**Last Updated**: 2026-03-19
**Version**: 1.0
**Base URL**: `http://localhost:8000`

---

## 目录

1. [通用说明](#1-通用说明)
2. [地区模块](#2-地区模块)
3. [方言模块](#3-方言模块)
4. [音乐模块](#4-音乐模块)
5. [错误码](#5-错误码)

---

## 1. 通用说明

### 1.1 响应格式

所有接口统一使用 JSON 格式响应：

**成功响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**：
```json
{
  "code": 1001,
  "message": "参数错误",
  "data": null
}
```

### 1.2 认证说明

V1 版本无用户认证，所有接口公开访问。

### 1.3 日期时间格式

使用 ISO 8601 格式：`2026-03-19T10:30:00+08:00`

---

## 2. 地区模块

### 2.1 获取省份列表

**GET** `/api/regions/provinces`

获取所有省份列表。

#### 请求参数

无

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "sichuan",
      "name": "四川省",
      "pinyin": "sichuan",
      "cityCount": 5
    },
    {
      "id": "guangdong",
      "name": "广东省",
      "pinyin": "guangdong",
      "cityCount": 8
    }
  ]
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 省份唯一标识 |
| name | string | 省份名称 |
| pinyin | string | 拼音（用于排序） |
| cityCount | number | 该省份数据库中的城市数量 |

---

### 2.2 获取城市列表

**GET** `/api/regions/cities`

获取指定省份的城市列表。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| province_id | string | 是 | 省份ID |

#### 请求示例

```
GET /api/regions/cities?province_id=sichuan
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "chengdu",
      "provinceId": "sichuan",
      "name": "成都市",
      "pinyin": "chengdu",
      "dialectCount": 3
    },
    {
      "id": "leshan",
      "provinceId": "sichuan",
      "name": "乐山市",
      "pinyin": "leshan",
      "dialectCount": 2
    }
  ]
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 城市唯一标识 |
| provinceId | string | 所属省份ID |
| name | string | 城市名称 |
| pinyin | string | 拼音 |
| dialectCount | number | 该城市的方言音频数量 |

---

### 2.3 获取省市级联数据

**GET** `/api/regions/cascade`

获取用于级联选择器的完整省市数据（一次性获取）。

#### 请求参数

无

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "value": "sichuan",
      "label": "四川省",
      "children": [
        { "value": "chengdu", "label": "成都市" },
        { "value": "leshan", "label": "乐山市" }
      ]
    },
    {
      "value": "guangdong",
      "label": "广东省",
      "children": [
        { "value": "guangzhou", "label": "广州市" },
        { "value": "shenzhen", "label": "深圳市" }
      ]
    }
  ]
}
```

---

## 3. 方言模块

### 3.1 获取方言列表

**GET** `/api/dialect/list`

获取指定城市的方言音频列表。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| city_id | string | 是 | 城市ID |
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 20，最大 50 |

#### 请求示例

```
GET /api/dialect/list?city_id=chengdu&page=1&page_size=20
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "d001",
        "cityId": "chengdu",
        "cityName": "成都市",
        "name": "成都话 - 日常对话",
        "description": "成都本地人的日常对话录音，包含问候、购物、问路等场景",
        "duration": 120,
        "durationText": "02:00",
        "audioUrl": "/audio/dialect/sichuan/chengdu_001.mp3",
        "fileSize": 1920000,
        "fileSizeText": "1.83 MB",
        "createdAt": "2026-03-19T10:00:00+08:00"
      },
      {
        "id": "d002",
        "cityId": "chengdu",
        "cityName": "成都市",
        "name": "成都话 - 茶馆龙门阵",
        "description": "成都茶馆里的典型龙门阵对话",
        "duration": 180,
        "durationText": "03:00",
        "audioUrl": "/audio/dialect/sichuan/chengdu_002.mp3",
        "fileSize": 2880000,
        "fileSizeText": "2.75 MB",
        "createdAt": "2026-03-19T10:00:00+08:00"
      }
    ]
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 方言唯一标识 |
| cityId | string | 所属城市ID |
| cityName | string | 城市名称（冗余，方便显示） |
| name | string | 方言名称 |
| description | string | 方言描述 |
| duration | number | 时长（秒） |
| durationText | string | 格式化时长（mm:ss） |
| audioUrl | string | 音频文件URL（相对路径） |
| fileSize | number | 文件大小（字节） |
| fileSizeText | string | 格式化文件大小 |
| createdAt | string | 创建时间 |

---

### 3.2 获取方言详情

**GET** `/api/dialect/{dialect_id}`

获取单个方言的详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| dialect_id | string | 是 | 方言ID |

#### 请求示例

```
GET /api/dialect/d001
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "d001",
    "cityId": "chengdu",
    "cityName": "成都市",
    "provinceName": "四川省",
    "name": "成都话 - 日常对话",
    "description": "成都本地人的日常对话录音，包含问候、购物、问路等场景",
    "duration": 120,
    "durationText": "02:00",
    "audioUrl": "/audio/dialect/sichuan/chengdu_001.mp3",
    "fileSize": 1920000,
    "fileSizeText": "1.83 MB",
    "createdAt": "2026-03-19T10:00:00+08:00"
  }
}
```

---

### 3.3 搜索方言

**GET** `/api/dialect/search`

按关键词搜索方言（P1 功能）。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（匹配城市名或方言名） |
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 20 |

#### 请求示例

```
GET /api/dialect/search?keyword=成都
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "d001",
        "cityId": "chengdu",
        "cityName": "成都市",
        "name": "成都话 - 日常对话",
        "duration": 120,
        "audioUrl": "/audio/dialect/sichuan/chengdu_001.mp3"
      }
    ]
  }
}
```

---

## 4. 音乐模块

### 4.1 上传音乐

**POST** `/api/music/upload`

上传音乐文件到服务器。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| file | file | 是 | 音乐文件（支持 mp3, wav, ogg, m4a） |
| name | string | 否 | 歌曲名称（不填则使用文件名） |

#### 请求示例

```
POST /api/music/upload
Content-Type: multipart/form-data

file: [音频文件]
name: "我的歌曲"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "id": "m_abc123",
    "name": "我的歌曲",
    "artist": null,
    "album": null,
    "duration": 210,
    "durationText": "03:30",
    "audioUrl": "/audio/music/m_abc123.mp3",
    "fileSize": 3360000,
    "fileSizeText": "3.20 MB",
    "fileType": "mp3",
    "uploadTime": "2026-03-19T10:30:00+08:00"
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 2001 | 文件格式不支持 |
| 2002 | 文件大小超过限制（最大 20MB） |
| 2003 | 上传失败 |

---

### 4.2 获取音乐列表

**GET** `/api/music/list`

获取已上传的音乐列表。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 50 |
| sort_by | string | 否 | 排序字段：upload_time（默认）、name、duration |
| order | string | 否 | 排序方向：desc（默认）、asc |

#### 请求示例

```
GET /api/music/list?page=1&page_size=50&sort_by=upload_time&order=desc
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 10,
    "page": 1,
    "pageSize": 50,
    "items": [
      {
        "id": "m_abc123",
        "name": "我的歌曲",
        "artist": null,
        "album": null,
        "duration": 210,
        "durationText": "03:30",
        "audioUrl": "/audio/music/m_abc123.mp3",
        "fileSize": 3360000,
        "fileSizeText": "3.20 MB",
        "fileType": "mp3",
        "uploadTime": "2026-03-19T10:30:00+08:00"
      }
    ]
  }
}
```

---

### 4.3 获取音乐详情

**GET** `/api/music/{music_id}`

获取单个音乐的详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| music_id | string | 是 | 音乐ID |

#### 请求示例

```
GET /api/music/m_abc123
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "m_abc123",
    "name": "我的歌曲",
    "artist": null,
    "album": null,
    "duration": 210,
    "durationText": "03:30",
    "audioUrl": "/audio/music/m_abc123.mp3",
    "fileSize": 3360000,
    "fileSizeText": "3.20 MB",
    "fileType": "mp3",
    "uploadTime": "2026-03-19T10:30:00+08:00"
  }
}
```

---

### 4.4 更新音乐信息

**PATCH** `/api/music/{music_id}`

更新音乐的元数据（名称、艺术家、专辑）。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| music_id | string | 是 | 音乐ID |

#### 请求体

```json
{
  "name": "新歌曲名",
  "artist": "艺术家",
  "album": "专辑名"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": "m_abc123",
    "name": "新歌曲名",
    "artist": "艺术家",
    "album": "专辑名"
  }
}
```

---

### 4.5 删除音乐

**DELETE** `/api/music/{music_id}`

删除指定的音乐文件。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| music_id | string | 是 | 音乐ID |

#### 响应示例

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 2004 | 音乐不存在 |
| 2005 | 删除文件失败 |

---

### 4.6 搜索音乐

**GET** `/api/music/search`

按关键词搜索音乐（P1 功能）。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（匹配歌曲名、艺术家） |

#### 请求示例

```
GET /api/music/search?keyword=周杰伦
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 2,
    "items": [
      {
        "id": "m_abc123",
        "name": "稻香",
        "artist": "周杰伦",
        "album": "魔杰座",
        "duration": 223,
        "audioUrl": "/audio/music/m_abc123.mp3"
      }
    ]
  }
}
```

---

## 5. 错误码

### 5.1 通用错误码 (1xxx)

| 错误码 | 描述 | 处理建议 |
|--------|------|---------|
| 1000 | 未知错误 | 联系管理员 |
| 1001 | 参数错误 | 检查请求参数 |
| 1002 | 资源不存在 | 检查资源ID是否正确 |
| 1003 | 请求方法不允许 | 检查HTTP方法 |
| 1004 | 请求频率过高 | 稍后重试 |

### 5.2 地区模块错误码 (1xxx)

| 错误码 | 描述 |
|--------|------|
| 1101 | 省份不存在 |
| 1102 | 城市不存在 |

### 5.3 方言模块错误码 (1xxx)

| 错误码 | 描述 |
|--------|------|
| 1201 | 方言不存在 |
| 1202 | 音频文件不存在 |

### 5.4 音乐模块错误码 (2xxx)

| 错误码 | 描述 |
|--------|------|
| 2001 | 文件格式不支持（仅支持 mp3, wav, ogg, m4a） |
| 2002 | 文件大小超过限制（最大 20MB） |
| 2003 | 上传失败 |
| 2004 | 音乐不存在 |
| 2005 | 删除文件失败 |
| 2006 | 文件名包含非法字符 |

---

## 6. 音频文件访问

音频文件通过静态文件服务访问，支持 Range 请求（用于音频拖动）。

### 6.1 方言音频

```
GET /audio/dialect/{province}/{filename}
```

示例：
```
GET /audio/dialect/sichuan/chengdu_001.mp3
```

### 6.2 音乐文件

```
GET /audio/music/{filename}
```

示例：
```
GET /audio/music/m_abc123.mp3
```

---

## 7. 接口调用示例

### 7.1 完整播放方言流程

```javascript
// 1. 获取省市级联数据
const regions = await fetch('/api/regions/cascade').then(r => r.json());

// 2. 用户选择城市后，获取方言列表
const dialects = await fetch('/api/dialect/list?city_id=chengdu')
  .then(r => r.json());

// 3. 使用音频URL播放
const audio = new Howl({
  src: ['http://localhost:8000' + dialects.data.items[0].audioUrl],
  html5: true
});
audio.play();
```

### 7.2 完整上传音乐流程

```javascript
// 1. 选择文件并上传
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', '我的歌曲');

const result = await fetch('/api/music/upload', {
  method: 'POST',
  body: formData
}).then(r => r.json());

// 2. 获取音乐列表
const musics = await fetch('/api/music/list').then(r => r.json());

// 3. 播放上传的音乐
const audio = new Howl({
  src: ['http://localhost:8000' + result.data.audioUrl],
  html5: true
});
audio.play();
```

---

## 8. OpenAPI 规范

完整的 OpenAPI 3.0 规范可通过以下方式获取：

- **JSON 格式**: `GET /openapi.json`
- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`

---

## 附录：数据类型定义

### Province（省份）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 省份ID |
| name | string | 省份名称 |
| pinyin | string | 拼音 |
| cityCount | number | 城市数量 |

### City（城市）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 城市ID |
| provinceId | string | 省份ID |
| name | string | 城市名称 |
| pinyin | string | 拼音 |
| dialectCount | number | 方言数量 |

### Dialect（方言）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 方言ID |
| cityId | string | 城市ID |
| cityName | string | 城市名称 |
| name | string | 方言名称 |
| description | string | 描述 |
| duration | number | 时长（秒） |
| durationText | string | 格式化时长 |
| audioUrl | string | 音频URL |
| fileSize | number | 文件大小（字节） |
| fileSizeText | string | 格式化文件大小 |
| createdAt | string | 创建时间 |

### Music（音乐）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 音乐ID |
| name | string | 歌曲名称 |
| artist | string | 艺术家 |
| album | string | 专辑 |
| duration | number | 时长（秒） |
| durationText | string | 格式化时长 |
| audioUrl | string | 音频URL |
| fileSize | number | 文件大小（字节） |
| fileSizeText | string | 格式化文件大小 |
| fileType | string | 文件类型 |
| uploadTime | string | 上传时间 |
