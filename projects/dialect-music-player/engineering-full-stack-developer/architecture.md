# 方言音乐播放器 - 架构设计

**Author**: 全栈工程师
**Last Updated**: 2026-03-19
**Version**: 1.0

---

## 1. 系统概览

### 1.1 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|---------|---------|
| **前端框架** | React 18 + TypeScript | 类型安全，生态丰富，团队熟悉 |
| **UI 组件库** | Ant Design 5.x | 内置 Cascader 级联选择器，开箱即用 |
| **音频播放** | Howler.js | 跨浏览器兼容性好，API 简洁，支持多格式 |
| **状态管理** | Zustand | 轻量级，适合中小型应用，无 Provider 包裹 |
| **HTTP 请求** | Axios | 成熟稳定，拦截器支持完善 |
| **构建工具** | Vite | 开发体验好，HMR 快，构建速度快 |
| **后端框架** | FastAPI (Python) | 高性能，自动生成 OpenAPI 文档，开发效率高 |
| **数据库** | SQLite | 轻量级，无需额外部署，适合 Demo/MVP |
| **文件存储** | 本地文件系统 | 简单直接，无需云存储成本 |

### 1.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React 应用                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  方言模块   │  │  音乐模块   │  │  播放器     │     │   │
│  │  │  Dialect    │  │  Music      │  │  Player     │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │         │                │                │             │   │
│  │         └────────────────┴────────────────┘             │   │
│  │                          │                              │   │
│  │              ┌───────────┴───────────┐                  │   │
│  │              │     Zustand Store     │                  │   │
│  │              │   (全局播放状态管理)   │                  │   │
│  │              └───────────────────────┘                  │   │
│  │                          │                              │   │
│  │              ┌───────────┴───────────┐                  │   │
│  │              │      Howler.js        │                  │   │
│  │              │    (音频播放引擎)      │                  │   │
│  │              └───────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI 后端服务                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API 路由层                           │  │
│  │  /api/dialect/*  │  /api/music/*  │  /api/regions/*      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      服务层                               │  │
│  │  DialectService  │  MusicService  │  RegionService       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      数据访问层                           │  │
│  │              SQLite (SQLite3 Python)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        文件系统                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │  data/dialect/   │  │  data/music/                     │    │
│  │  (方言音频文件)   │  │  (用户上传的音乐文件)             │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型设计

### 2.1 数据库表结构

#### 2.1.1 省份表 (provinces)

```sql
CREATE TABLE provinces (
    id TEXT PRIMARY KEY,           -- 省份代码，如 'sichuan'
    name TEXT NOT NULL,            -- 省份名称，如 '四川省'
    pinyin TEXT,                   -- 拼音，用于排序
    sort_order INTEGER DEFAULT 0   -- 排序权重
);
```

#### 2.1.2 城市表 (cities)

```sql
CREATE TABLE cities (
    id TEXT PRIMARY KEY,           -- 城市代码，如 'chengdu'
    province_id TEXT NOT NULL,     -- 所属省份
    name TEXT NOT NULL,            -- 城市名称
    pinyin TEXT,                   -- 拼音
    sort_order INTEGER DEFAULT 0,  -- 排序权重
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);
```

#### 2.1.3 方言音频表 (dialects)

```sql
CREATE TABLE dialects (
    id TEXT PRIMARY KEY,           -- 方言ID，如 'd001'
    city_id TEXT NOT NULL,         -- 所属城市
    name TEXT NOT NULL,            -- 方言名称
    description TEXT,              -- 描述
    duration INTEGER NOT NULL,     -- 时长（秒）
    file_path TEXT NOT NULL,       -- 文件路径
    file_size INTEGER,             -- 文件大小（字节）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);
```

#### 2.1.4 音乐表 (musics)

```sql
CREATE TABLE musics (
    id TEXT PRIMARY KEY,           -- 音乐ID
    name TEXT NOT NULL,            -- 歌曲名称
    artist TEXT,                   -- 艺术家
    album TEXT,                    -- 专辑
    duration INTEGER,              -- 时长（秒）
    file_path TEXT NOT NULL,       -- 文件路径
    file_size INTEGER,             -- 文件大小
    file_type TEXT,                -- 文件类型 (mp3, wav, etc.)
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.5 播放历史表 (play_history) - P1

```sql
CREATE TABLE play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,       -- 'dialect' 或 'music'
    item_id TEXT NOT NULL,         -- 关联的方言或音乐ID
    item_name TEXT NOT NULL,       -- 快照名称
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  provinces  │       │   cities    │       │  dialects   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)     │
│ name        │  └───<│ province_id │  └───<│ city_id     │
│ pinyin      │       │ name        │       │ name        │
│ sort_order  │       │ pinyin      │       │ description │
└─────────────┘       │ sort_order  │       │ duration    │
                      └─────────────┘       │ file_path   │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐
│   musics    │       │play_history │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ name        │       │ item_type   │
│ artist      │       │ item_id     │
│ album       │       │ item_name   │
│ duration    │       │ played_at   │
│ file_path   │       └─────────────┘
│ file_size   │
│ file_type   │
│ upload_time │
└─────────────┘
```

---

## 3. 前端架构设计

### 3.1 目录结构

```
frontend/
├── src/
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 根组件
│   ├── index.css                # 全局样式
│   │
│   ├── components/              # 通用组件
│   │   ├── Layout/              # 布局组件
│   │   │   ├── Header.tsx       # 顶部导航
│   │   │   ├── PlayerBar.tsx    # 底部播放器
│   │   │   └── index.tsx        # 主布局
│   │   └── AudioPlayer/         # 音频播放器组件
│   │       ├── PlayerControls.tsx   # 播放控制
│   │       ├── ProgressBar.tsx      # 进度条
│   │       ├── VolumeControl.tsx    # 音量控制
│   │       └── hooks/
│   │           └── useAudioPlayer.ts  # 播放器 Hook
│   │
│   ├── pages/                   # 页面组件
│   │   ├── Dialect/             # 方言模块
│   │   │   ├── index.tsx        # 方言页面
│   │   │   ├── RegionSelector.tsx   # 省市选择器
│   │   │   └── DialectList.tsx      # 方言列表
│   │   └── Music/               # 音乐模块
│   │       ├── index.tsx        # 音乐页面
│   │       ├── MusicUploader.tsx    # 上传组件
│   │       └── MusicList.tsx        # 音乐列表
│   │
│   ├── store/                   # 状态管理 (Zustand)
│   │   ├── playerStore.ts       # 播放器状态
│   │   ├── dialectStore.ts      # 方言模块状态
│   │   └── musicStore.ts        # 音乐模块状态
│   │
│   ├── services/                # API 服务
│   │   ├── api.ts               # Axios 实例
│   │   ├── dialectService.ts    # 方言 API
│   │   └── musicService.ts      # 音乐 API
│   │
│   ├── types/                   # TypeScript 类型
│   │   ├── dialect.ts           # 方言相关类型
│   │   ├── music.ts             # 音乐相关类型
│   │   └── common.ts            # 通用类型
│   │
│   └── utils/                   # 工具函数
│       ├── audioUtils.ts        # 音频处理工具
│       └── formatUtils.ts       # 格式化工具
│
├── public/
│   └── favicon.ico
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 3.2 核心模块设计

#### 3.2.1 播放器状态管理 (Zustand)

```typescript
// store/playerStore.ts
import { create } from 'zustand';

interface PlayerState {
  // 当前播放信息
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  
  // 播放模式
  mode: 'dialect' | 'music';
  playlist: Track[];
  currentIndex: number;
  
  // Actions
  setTrack: (track: Track, playlist?: Track[]) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  prev: () => void;
}
```

#### 3.2.2 音频播放器 Hook (基于 Howler.js)

```typescript
// components/AudioPlayer/hooks/useAudioPlayer.ts
import { Howl } from 'howler';
import { useEffect, useRef, useCallback } from 'react';

export function useAudioPlayer(url: string | null) {
  const soundRef = useRef<Howl | null>(null);
  
  // 播放控制
  const play = useCallback(() => soundRef.current?.play(), []);
  const pause = useCallback(() => soundRef.current?.pause(), []);
  const seek = useCallback((time: number) => soundRef.current?.seek(time), []);
  const setVolume = useCallback((v: number) => soundRef.current?.volume(v), []);
  
  // 生命周期管理
  useEffect(() => {
    if (url) {
      soundRef.current = new Howl({
        src: [url],
        html5: true,  // 大文件使用 HTML5 Audio
        onend: () => { /* 播放完成回调 */ }
      });
    }
    return () => soundRef.current?.unload();
  }, [url]);
  
  return { play, pause, seek, setVolume };
}
```

#### 3.2.3 省市选择器组件

```typescript
// pages/Dialect/RegionSelector.tsx
import { Cascader } from 'antd';

interface RegionSelectorProps {
  onChange: (cityId: string) => void;
}

// 使用 Ant Design Cascader 组件
// 数据格式：[{ value: 'sichuan', label: '四川省', children: [...] }]

export function RegionSelector({ onChange }: RegionSelectorProps) {
  return (
    <Cascader
      options={regionData}
      onChange={(value) => onChange(value[1])}
      placeholder="选择省市"
      showSearch
    />
  );
}
```

---

## 4. 后端架构设计

### 4.1 目录结构

```
backend/
├── main.py                      # FastAPI 入口
├── config.py                    # 配置文件
├── database.py                  # 数据库连接
├── models/                      # 数据模型
│   ├── __init__.py
│   ├── region.py               # 省市模型
│   ├── dialect.py              # 方言模型
│   └── music.py                # 音乐模型
│
├── schemas/                     # Pydantic 模型
│   ├── __init__.py
│   ├── region.py
│   ├── dialect.py
│   └── music.py
│
├── routers/                     # API 路由
│   ├── __init__.py
│   ├── dialect.py              # 方言相关接口
│   ├── music.py                # 音乐相关接口
│   └── region.py               # 地区接口
│
├── services/                    # 业务逻辑
│   ├── __init__.py
│   ├── dialect_service.py
│   ├── music_service.py
│   └── region_service.py
│
├── data/                        # 数据目录
│   ├── app.db                  # SQLite 数据库
│   ├── dialect/                # 方言音频文件
│   │   ├── sichuan/
│   │   └── guangdong/
│   └── music/                  # 音乐文件
│
├── scripts/                     # 脚本
│   ├── init_db.py              # 初始化数据库
│   └── seed_data.py            # 填充示例数据
│
├── requirements.txt
└── README.md
```

### 4.2 API 路由设计

```python
# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import dialect, music, region

app = FastAPI(title="方言音乐播放器 API")

# 静态文件服务（音频文件）
app.mount("/audio", StaticFiles(directory="data"), name="audio")

# 注册路由
app.include_router(region.router, prefix="/api/regions", tags=["地区"])
app.include_router(dialect.router, prefix="/api/dialect", tags=["方言"])
app.include_router(music.router, prefix="/api/music", tags=["音乐"])
```

---

## 5. 关键流程设计

### 5.1 方言播放流程

```
用户操作                    前端处理                      后端处理
   │                          │                            │
   │  1. 选择省市             │                            │
   ├─────────────────────────>│                            │
   │                          │  GET /api/dialect/list     │
   │                          ├───────────────────────────>│
   │                          │                            │ 查询数据库
   │                          │<───────────────────────────┤ 返回方言列表
   │  2. 显示方言列表         │                            │
   │<─────────────────────────┤                            │
   │                          │                            │
   │  3. 点击播放             │                            │
   ├─────────────────────────>│                            │
   │                          │ 更新 playerStore           │
   │                          │ Howler 加载音频            │
   │                          │ (音频URL: /audio/dialect/) │
   │  4. 开始播放             │                            │
   │<─────────────────────────┤                            │
```

### 5.2 音乐上传流程

```
用户操作                    前端处理                      后端处理
   │                          │                            │
   │  1. 选择文件             │                            │
   ├─────────────────────────>│                            │
   │                          │ 校验文件类型/大小          │
   │                          │                            │
   │  2. 上传文件             │                            │
   │                          │ POST /api/music/upload     │
   │                          ├───────────────────────────>│
   │                          │                            │ 保存文件
   │                          │                            │ 解析音频元数据
   │                          │                            │ 写入数据库
   │                          │<───────────────────────────┤ 返回音乐信息
   │  3. 显示在列表中         │                            │
   │<─────────────────────────┤                            │
```

### 5.3 模块切换流程

```
用户操作                    前端处理
   │                          │
   │  切换到"音乐"标签        │
   ├─────────────────────────>│
   │                          │ 更新 URL (/music)
   │                          │ 保持 playerStore 状态
   │                          │ 渲染 Music 组件
   │                          │ 播放器继续播放（不中断）
   │<─────────────────────────┤
```

---

## 6. 文件存储方案

### 6.1 目录结构

```
data/
├── app.db                      # SQLite 数据库
├── dialect/                    # 方言音频
│   ├── sichuan/               # 按省份分目录
│   │   ├── chengdu_001.mp3
│   │   └── chengdu_002.mp3
│   ├── guangdong/
│   │   ├── guangzhou_001.mp3
│   │   └── shenzhen_001.mp3
│   └── ...
│
└── music/                      # 用户上传的音乐
    ├── m_001.mp3
    ├── m_002.mp3
    └── ...
```

### 6.2 文件命名规则

- **方言**：`{省份}/{城市}_{序号}.mp3`
- **音乐**：`{uuid}.{ext}`（上传时生成唯一 ID）

### 6.3 文件访问

通过 FastAPI 静态文件服务访问：
- 方言音频：`GET /audio/dialect/sichuan/chengdu_001.mp3`
- 音乐文件：`GET /audio/music/m_001.mp3`

---

## 7. 性能优化策略

### 7.1 前端优化

| 优化项 | 方案 |
|--------|------|
| 首屏加载 | 路由懒加载、代码分割 |
| 音频加载 | 使用 HTML5 Audio（`html5: true`），避免大文件阻塞 |
| 列表渲染 | 虚拟滚动（如列表过长） |
| 静态资源 | Vite 自动压缩、Gzip |

### 7.2 后端优化

| 优化项 | 方案 |
|--------|------|
| 数据库索引 | 为 `city_id`、`province_id` 创建索引 |
| 音频流式传输 | 使用 Range 请求支持音频拖动 |
| 文件上传 | 限制单文件大小（建议 20MB 以内） |

---

## 8. 安全考虑

### 8.1 文件上传安全

- 限制文件类型：仅允许 `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`
- 限制文件大小：最大 20MB
- 文件重命名：使用 UUID 避免路径穿越攻击

### 8.2 API 安全

- CORS 配置：限制允许的源
- 输入校验：使用 Pydantic 校验所有输入

---

## 9. 部署方案

### 9.1 开发环境

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

### 9.2 生产环境（推荐）

使用 Docker Compose 一键部署：

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 10. 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 方言音频数据缺失 | 高 | V1 使用占位音频，标注为演示版 |
| 浏览器音频兼容性 | 中 | Howler.js 自动处理兼容性，使用 MP3 格式 |
| 大文件上传占用内存 | 中 | 使用流式上传，限制文件大小 |
| SQLite 并发限制 | 低 | V1 无用户系统，单机部署足够 |

---

## 11. 后续扩展方向

1. **用户系统**：添加注册/登录，支持云端同步
2. **云端存储**：将音频文件迁移到 OSS/S3
3. **数据库升级**：从 SQLite 迁移到 PostgreSQL
4. **移动端 App**：基于 React Native 或 Flutter
5. **社交功能**：分享、评论、收藏
