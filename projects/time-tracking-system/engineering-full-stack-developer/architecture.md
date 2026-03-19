# 工时填报系统 - 架构设计

**Author**: 全栈工程师
**Last Updated**: 2026-03-19
**Version**: 1.0

---

## 1. 系统概览

### 1.1 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|---------|---------|
| **前端框架** | React 18 + TypeScript | 类型安全，生态丰富，团队熟悉 |
| **UI 组件库** | Ant Design 5.x | 企业级 UI，表单/表格组件完善 |
| **状态管理** | Zustand | 轻量级，适合中小型应用 |
| **HTTP 请求** | Axios | 成熟稳定，拦截器支持完善 |
| **构建工具** | Vite | 开发体验好，HMR 快 |
| **图表库** | ECharts | 统计图表需求，功能强大 |
| **后端框架** | FastAPI (Python) | 高性能，自动生成 OpenAPI 文档 |
| **数据库** | SQLite | 轻量级，无需额外部署，适合单企业场景 |
| **认证方案** | JWT Token | 无状态，前后端分离友好 |
| **密码加密** | bcrypt | 行业标准，安全性高 |

### 1.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React 应用                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  工时填报   │  │  工时记录   │  │  统计报表   │     │   │
│  │  │  TimeEntry  │  │  TimeList   │  │  Statistics │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │  项目管理   │  │  团队工时   │  (管理员专属)         │   │
│  │  │  Project    │  │  TeamView   │                      │   │
│  │  └─────────────┘  └─────────────┘                      │   │
│  │         │                │                │             │   │
│  │         └────────────────┴────────────────┘             │   │
│  │                          │                              │   │
│  │              ┌───────────┴───────────┐                  │   │
│  │              │     Zustand Store     │                  │   │
│  │              │   (用户状态/权限管理)   │                  │   │
│  │              └───────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API + JWT Token
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI 后端服务                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    中间件层                               │  │
│  │  CORS │ JWT认证 │ 请求日志 │ 异常处理                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API 路由层                           │  │
│  │  /api/auth/*  │  /api/timesheet/*  │  /api/projects/*    │  │
│  │  /api/stats/* │  /api/export/*                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      服务层                               │  │
│  │  AuthService │ TimesheetService │ ProjectService         │  │
│  │  StatsService │ ExportService                            │  │
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
│  │  data/app.db     │  │  exports/                        │    │
│  │  (SQLite数据库)   │  │  (导出文件临时目录)               │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型设计

### 2.1 数据库表结构

#### 2.1.1 用户表 (users)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,     -- 用户名（登录名）
    password VARCHAR(255) NOT NULL,           -- 密码（bcrypt加密）
    name VARCHAR(100) NOT NULL,               -- 员工姓名
    role VARCHAR(20) NOT NULL DEFAULT 'employee',  -- 角色：employee/admin
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 状态：active/inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

#### 2.1.2 项目表 (projects)

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,               -- 项目名称
    description TEXT,                         -- 项目描述
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 状态：active/archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_projects_status ON projects(status);
```

#### 2.1.3 工时记录表 (time_entries)

```sql
CREATE TABLE time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                 -- 用户ID
    project_id INTEGER NOT NULL,              -- 项目ID
    task VARCHAR(200) NOT NULL,               -- 任务名称
    hours DECIMAL(4,1) NOT NULL,              -- 时长（小时，支持1位小数）
    work_date DATE NOT NULL,                  -- 工作日期
    note TEXT,                                -- 备注说明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 索引
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, work_date);
CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, work_date);
CREATE INDEX idx_time_entries_date ON time_entries(work_date);
```

### 2.2 ER 图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │ time_entries │       │   projects   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │    ┌──│ id (PK)      │
│ username     │  │    │ user_id (FK) │◄───┘  │ name         │
│ password     │  └───►│ project_id   │◄──────│ description  │
│ name         │       │ task         │       │ status       │
│ role         │       │ hours        │       │ created_at   │
│ status       │       │ work_date    │       └──────────────┘
│ created_at   │       │ note         │
│ updated_at   │       │ created_at   │
└──────────────┘       │ updated_at   │
                       └──────────────┘

关系说明：
- User 1:N TimeEntry  （一个用户有多条工时记录）
- Project 1:N TimeEntry（一个项目有多条工时记录）
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
│   │   │   ├── AppLayout.tsx    # 主布局（侧边栏+内容区）
│   │   │   └── Header.tsx       # 顶部导航
│   │   └── PrivateRoute.tsx     # 路由守卫
│   │
│   ├── pages/                   # 页面组件
│   │   ├── Login/               # 登录页
│   │   │   └── index.tsx
│   │   ├── TimeEntry/           # 工时填报
│   │   │   ├── index.tsx        # 填报页面
│   │   │   └── EntryForm.tsx    # 填报表单
│   │   ├── TimeList/            # 工时记录
│   │   │   ├── index.tsx        # 记录列表
│   │   │   └── EntryEditModal.tsx # 编辑弹窗
│   │   ├── Statistics/          # 统计报表
│   │   │   └── index.tsx        # 个人统计
│   │   ├── TeamTimeList/        # 团队工时（管理员）
│   │   │   └── index.tsx
│   │   ├── ProjectManage/       # 项目管理（管理员）
│   │   │   ├── index.tsx        # 项目列表
│   │   │   └── ProjectForm.tsx  # 项目表单
│   │   └── Dashboard/           # 首页
│   │       └── index.tsx        # 仪表盘
│   │
│   ├── store/                   # 状态管理 (Zustand)
│   │   ├── authStore.ts         # 认证状态
│   │   └── userStore.ts         # 用户信息
│   │
│   ├── services/                # API 服务
│   │   ├── api.ts               # Axios 实例
│   │   ├── authService.ts       # 认证 API
│   │   ├── timesheetService.ts  # 工时 API
│   │   ├── projectService.ts    # 项目 API
│   │   ├── statsService.ts      # 统计 API
│   │   └── exportService.ts     # 导出 API
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAuth.ts           # 认证相关
│   │   └── usePermission.ts     # 权限判断
│   │
│   ├── types/                   # TypeScript 类型
│   │   ├── user.ts              # 用户类型
│   │   ├── timesheet.ts         # 工时类型
│   │   ├── project.ts           # 项目类型
│   │   └── common.ts            # 通用类型
│   │
│   └── utils/                   # 工具函数
│       ├── formatUtils.ts       # 格式化工具
│       ├── dateUtils.ts         # 日期工具
│       └── storageUtils.ts      # 本地存储工具
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

#### 3.2.1 认证状态管理 (Zustand)

```typescript
// store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)
```

#### 3.2.2 权限控制

```typescript
// hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuthStore()
  
  const isAdmin = user?.role === 'admin'
  
  const canManageProjects = isAdmin
  const canViewTeamTime = isAdmin
  const canExport = isAdmin
  
  return {
    isAdmin,
    canManageProjects,
    canViewTeamTime,
    canExport,
  }
}
```

#### 3.2.3 路由配置

```typescript
// App.tsx 路由结构
const routes = [
  { path: '/login', element: <Login />, public: true },
  { 
    path: '/', 
    element: <AppLayout />,
    children: [
      { path: '', element: <Dashboard /> },
      { path: 'entry', element: <TimeEntry /> },
      { path: 'records', element: <TimeList /> },
      { path: 'statistics', element: <Statistics /> },
      { path: 'team', element: <TeamTimeList />, adminOnly: true },
      { path: 'projects', element: <ProjectManage />, adminOnly: true },
    ]
  },
]
```

---

## 4. 后端架构设计

### 4.1 目录结构

```
backend/
├── main.py                      # FastAPI 入口
├── config.py                    # 配置文件
├── database.py                  # 数据库连接
├── auth.py                      # JWT 认证工具
│
├── models/                      # 数据模型
│   ├── __init__.py
│   ├── user.py
│   ├── project.py
│   └── timesheet.py
│
├── schemas/                     # Pydantic 模型
│   ├── __init__.py
│   ├── user.py
│   ├── project.py
│   ├── timesheet.py
│   └── common.py
│
├── routers/                     # API 路由
│   ├── __init__.py
│   ├── auth.py                  # 认证接口
│   ├── timesheet.py             # 工时接口
│   ├── project.py               # 项目接口
│   ├── stats.py                 # 统计接口
│   └── export.py                # 导出接口
│
├── services/                    # 业务逻辑
│   ├── __init__.py
│   ├── auth_service.py
│   ├── timesheet_service.py
│   ├── project_service.py
│   ├── stats_service.py
│   └── export_service.py
│
├── middleware/                  # 中间件
│   ├── __init__.py
│   └── auth_middleware.py
│
├── data/                        # 数据目录
│   ├── app.db                   # SQLite 数据库
│   └── exports/                 # 导出文件目录
│
├── scripts/                     # 脚本
│   ├── init_db.py               # 初始化数据库
│   └── seed_data.py             # 填充初始数据
│
├── requirements.txt
└── README.md
```

### 4.2 API 路由设计

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="工时填报系统 API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(timesheet.router, prefix="/api/timesheet", tags=["工时"])
app.include_router(project.router, prefix="/api/projects", tags=["项目"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])
app.include_router(export_router, prefix="/api/export", tags=["导出"])
```

---

## 5. 关键流程设计

### 5.1 用户登录流程

```
用户输入用户名密码
    │
    ▼
前端发送 POST /api/auth/login
    │
    ▼
后端验证用户名密码
    │
    ├─── 失败 ──→ 返回 401 错误
    │
    ▼ 成功
生成 JWT Token (有效期 24h)
    │
    ▼
返回 Token + 用户信息
    │
    ▼
前端存储 Token (localStorage)
    │
    ▼
设置 Axios 默认 Header
    │
    ▼
跳转到首页
```

### 5.2 工时提交流程

```
用户填写工时表单
    │
    ▼
前端校验
├── 项目必选
├── 任务必填
├── 时长 > 0 且 ≤ 24
└── 日期在有效范围内
    │
    ▼
发送 POST /api/timesheet
Header: Authorization: Bearer {token}
    │
    ▼
后端验证 Token
    │
    ▼
解析用户身份
    │
    ▼
业务校验
├── 项目是否存在且为 active
├── 日期是否在允许范围内
└── 时长是否合法
    │
    ▼
保存到数据库
    │
    ▼
返回成功 + 记录详情
    │
    ▼
前端显示成功提示
刷新统计数据
```

### 5.3 权限校验流程

```
请求到达后端
    │
    ▼
检查是否需要认证
    │
    ├── 不需要 ──→ 直接处理请求
    │
    ▼ 需要
从 Header 提取 Token
    │
    ├── 无 Token ──→ 返回 401
    │
    ▼ 有 Token
验证 Token 有效性
    │
    ├── 无效/过期 ──→ 返回 401
    │
    ▼ 有效
解析用户信息
    │
    ▼
检查接口权限
    │
    ├── 无权限 ──→ 返回 403
    │
    ▼ 有权限
处理请求
```

---

## 6. 安全设计

### 6.1 认证方案

| 项目 | 方案 |
|------|------|
| 认证方式 | JWT Token |
| Token 有效期 | 24 小时 |
| Token 存储 | 前端 localStorage |
| Token 传输 | Authorization Header: Bearer {token} |
| 密码加密 | bcrypt，salt rounds = 10 |

### 6.2 权限控制

| 角色 | 权限 |
|------|------|
| employee | 填报工时、查看/编辑自己的记录、查看个人统计 |
| admin | 所有 employee 权限 + 管理项目、查看团队工时、导出报表 |

### 6.3 数据隔离

- 普通用户只能查询/修改自己的工时记录
- 管理员可查询所有记录
- SQL 查询强制带 user_id 条件（普通用户）

---

## 7. 性能优化策略

### 7.1 前端优化

| 优化项 | 方案 |
|--------|------|
| 路由懒加载 | React.lazy + Suspense |
| 列表分页 | 每页 20 条，避免一次加载过多 |
| 图表优化 | ECharts 按需引入组件 |
| 防抖节流 | 搜索输入、表单提交 |

### 7.2 后端优化

| 优化项 | 方案 |
|--------|------|
| 数据库索引 | user_id + work_date 复合索引 |
| 分页查询 | LIMIT + OFFSET |
| 统计缓存 | 可选 Redis（V2） |
| 连接池 | SQLite 使用连接上下文管理 |

---

## 8. 部署方案

### 8.1 开发环境

```bash
# 后端
cd backend
pip install -r requirements.txt
python main.py

# 前端
cd frontend
npm install
npm run dev
```

### 8.2 生产环境

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

## 9. 技术风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| SQLite 并发限制 | 低 | 单企业场景，并发量小 |
| JWT 无法主动失效 | 中 | 设置较短有效期 + 前端清除 |
| 导出大文件内存占用 | 中 | 分批导出，限制最大条数 |
| 密码安全 | 高 | bcrypt 加密 + 强制首次修改 |

---

## 10. 后续扩展方向

1. **工时审批流程**：添加工时审批状态和流程
2. **通知提醒**：集成钉钉/企微推送填报提醒
3. **周报生成**：自动生成周报摘要
4. **数据库升级**：从 SQLite 迁移到 PostgreSQL
5. **多租户支持**：支持多企业独立数据
