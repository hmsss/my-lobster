# 方言音乐播放器

## 项目结构

```
code/
├── backend/           # 后端 (FastAPI)
│   ├── main.py       # 入口文件
│   ├── config.py     # 配置
│   ├── database.py   # 数据库
│   ├── routers/      # API 路由
│   ├── schemas/      # 数据模型
│   ├── data/         # 数据目录
│   └── requirements.txt
│
└── frontend/         # 前端 (React + Vite)
    └── src/
        ├── App.tsx           # 主应用
        ├── pages/            # 页面组件
        ├── components/       # 通用组件
        ├── store/            # 状态管理
        ├── services/         # API 服务
        └── hooks/            # 自定义 Hooks
```

## 快速开始

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python main.py
```

后端将运行在 http://localhost:8000

API 文档: http://localhost:8000/docs

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 http://localhost:5173

## 功能

- **方言模块**: 省市级联选择 → 方言列表 → 播放
- **音乐模块**: 上传本地音乐 → 播放列表 → 播放/删除
- **底部播放器**: 播放控制、进度条、音量调节、上一首/下一首

## 技术栈

- 后端: FastAPI + SQLite
- 前端: React + TypeScript + Ant Design + Howler.js + Zustand
- 构建: Vite
