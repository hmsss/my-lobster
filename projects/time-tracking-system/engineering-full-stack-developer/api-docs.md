# 工时填报系统 - API 接口文档

**Author**: 全栈工程师
**Last Updated**: 2026-03-19
**Version**: 1.0
**Base URL**: `http://localhost:8000`

---

## 目录

1. [通用说明](#1-通用说明)
2. [认证模块](#2-认证模块)
3. [工时模块](#3-工时模块)
4. [项目模块](#4-项目模块)
5. [统计模块](#5-统计模块)
6. [导出模块](#6-导出模块)
7. [错误码](#7-错误码)

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

除了登录接口外，其他接口都需要在请求头携带 JWT Token：

```
Authorization: Bearer {token}
```

### 1.3 日期时间格式

| 类型 | 格式 | 示例 |
|------|------|------|
| 日期 | YYYY-MM-DD | 2026-03-19 |
| 时间 | YYYY-MM-DD HH:mm:ss | 2026-03-19 10:30:00 |

---

## 2. 认证模块

### 2.1 用户登录

**POST** `/api/auth/login`

用户登录，获取 JWT Token。

#### 请求体

```json
{
  "username": "admin",
  "password": "admin123"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

#### 响应示例

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "role": "admin"
    }
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 1001 | 用户名或密码不能为空 |
| 1002 | 用户名或密码错误 |

---

### 2.2 获取当前用户信息

**GET** `/api/auth/me`

获取当前登录用户的详细信息。

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "系统管理员",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-03-19 10:00:00"
  }
}
```

---

### 2.3 修改密码

**PUT** `/api/auth/password`

修改当前用户密码。

#### 请求体

```json
{
  "oldPassword": "admin123",
  "newPassword": "newpassword123"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码（6-20位） |

#### 响应示例

```json
{
  "code": 0,
  "message": "密码修改成功",
  "data": null
}
```

---

## 3. 工时模块

### 3.1 提交工时

**POST** `/api/timesheet`

提交一条工时记录。

#### 请求体

```json
{
  "projectId": 1,
  "task": "功能开发",
  "hours": 4.5,
  "date": "2026-03-19",
  "note": "完成用户模块开发"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| projectId | integer | 是 | 项目ID |
| task | string | 是 | 任务名称（1-200字符） |
| hours | number | 是 | 时长（0 < hours ≤ 24，支持1位小数） |
| date | string | 是 | 工作日期（YYYY-MM-DD，不能超过今天，不能早于7天前） |
| note | string | 否 | 备注说明（最多500字符） |

#### 响应示例

```json
{
  "code": 0,
  "message": "提交成功",
  "data": {
    "id": 123,
    "projectId": 1,
    "projectName": "项目A",
    "task": "功能开发",
    "hours": 4.5,
    "date": "2026-03-19",
    "note": "完成用户模块开发",
    "createdAt": "2026-03-19 10:30:00"
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 2001 | 项目不存在或已归档 |
| 2002 | 日期超出允许范围 |
| 2003 | 时长不合法 |

---

### 3.2 获取工时列表

**GET** `/api/timesheet`

获取工时记录列表（普通用户只能查看自己的记录）。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| projectId | integer | 否 | 项目ID |
| userId | integer | 否 | 用户ID（管理员可指定查看他人） |
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 20，最大 50 |

#### 请求示例

```
GET /api/timesheet?startDate=2026-03-01&endDate=2026-03-19&projectId=1&page=1&pageSize=20
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 35,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": 123,
        "projectId": 1,
        "projectName": "项目A",
        "task": "功能开发",
        "hours": 4.5,
        "date": "2026-03-19",
        "note": "完成用户模块开发",
        "createdAt": "2026-03-19 10:30:00",
        "updatedAt": null
      },
      {
        "id": 122,
        "projectId": 2,
        "projectName": "项目B",
        "task": "测试",
        "hours": 3.0,
        "date": "2026-03-19",
        "note": null,
        "createdAt": "2026-03-19 09:00:00",
        "updatedAt": null
      }
    ]
  }
}
```

---

### 3.3 获取工时详情

**GET** `/api/timesheet/{id}`

获取单条工时记录详情。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | integer | 是 | 工时记录ID |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "userId": 1,
    "userName": "张三",
    "projectId": 1,
    "projectName": "项目A",
    "task": "功能开发",
    "hours": 4.5,
    "date": "2026-03-19",
    "note": "完成用户模块开发",
    "createdAt": "2026-03-19 10:30:00",
    "updatedAt": null
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 2004 | 工时记录不存在 |
| 2005 | 无权访问此记录 |

---

### 3.4 更新工时

**PUT** `/api/timesheet/{id}`

更新工时记录（只能修改自己的记录）。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | integer | 是 | 工时记录ID |

#### 请求体

```json
{
  "projectId": 1,
  "task": "功能开发（修改）",
  "hours": 5.0,
  "date": "2026-03-19",
  "note": "完成用户模块和权限模块"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 123,
    "projectId": 1,
    "projectName": "项目A",
    "task": "功能开发（修改）",
    "hours": 5.0,
    "date": "2026-03-19",
    "note": "完成用户模块和权限模块",
    "updatedAt": "2026-03-19 14:00:00"
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 2004 | 工时记录不存在 |
| 2005 | 无权修改此记录 |

---

### 3.5 删除工时

**DELETE** `/api/timesheet/{id}`

删除工时记录（只能删除自己的记录）。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | integer | 是 | 工时记录ID |

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
| 2004 | 工时记录不存在 |
| 2005 | 无权删除此记录 |

---

## 4. 项目模块

### 4.1 获取项目列表

**GET** `/api/projects`

获取项目列表。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | string | 否 | 状态筛选：active/archived/all，默认 active |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "项目A",
      "description": "XX客户项目",
      "status": "active",
      "createdAt": "2026-03-01 00:00:00"
    },
    {
      "id": 2,
      "name": "项目B",
      "description": "内部系统项目",
      "status": "active",
      "createdAt": "2026-03-05 00:00:00"
    }
  ]
}
```

---

### 4.2 创建项目

**POST** `/api/projects`

创建新项目（仅管理员）。

#### 请求体

```json
{
  "name": "项目C",
  "description": "新项目描述"
}
```

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | string | 是 | 项目名称（1-100字符） |
| description | string | 否 | 项目描述 |

#### 响应示例

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 3,
    "name": "项目C",
    "description": "新项目描述",
    "status": "active",
    "createdAt": "2026-03-19 10:30:00"
  }
}
```

#### 错误响应

| 错误码 | 描述 |
|--------|------|
| 3001 | 项目名称已存在 |
| 3002 | 无权限操作 |

---

### 4.3 更新项目

**PUT** `/api/projects/{id}`

更新项目信息（仅管理员）。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | integer | 是 | 项目ID |

#### 请求体

```json
{
  "name": "项目C（修改）",
  "description": "更新后的描述"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 3,
    "name": "项目C（修改）",
    "description": "更新后的描述",
    "status": "active"
  }
}
```

---

### 4.4 归档/激活项目

**POST** `/api/projects/{id}/archive`

归档项目（仅管理员）。归档后员工无法再填报此项目。

**POST** `/api/projects/{id}/activate`

激活项目（仅管理员）。激活后员工可以填报此项目。

#### 路径参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | integer | 是 | 项目ID |

#### 响应示例

```json
{
  "code": 0,
  "message": "归档成功",
  "data": {
    "id": 3,
    "name": "项目C",
    "status": "archived"
  }
}
```

---

## 5. 统计模块

### 5.1 个人工时统计

**GET** `/api/stats/personal`

获取当前用户的工时统计。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| type | string | 否 | 统计周期：week/month，默认 week |
| date | string | 否 | 基准日期，默认今天 |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "period": {
      "type": "week",
      "startDate": "2026-03-16",
      "endDate": "2026-03-22"
    },
    "summary": {
      "totalHours": 40.0,
      "totalDays": 5,
      "avgHoursPerDay": 8.0
    },
    "byProject": [
      {
        "projectId": 1,
        "projectName": "项目A",
        "hours": 24.0,
        "percentage": 60.0
      },
      {
        "projectId": 2,
        "projectName": "项目B",
        "hours": 16.0,
        "percentage": 40.0
      }
    ],
    "dailyTrend": [
      { "date": "2026-03-16", "hours": 8.0 },
      { "date": "2026-03-17", "hours": 8.5 },
      { "date": "2026-03-18", "hours": 7.5 },
      { "date": "2026-03-19", "hours": 8.0 },
      { "date": "2026-03-20", "hours": 8.0 }
    ]
  }
}
```

---

### 5.2 团队工时统计

**GET** `/api/stats/team`

获取团队工时统计（仅管理员）。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| type | string | 否 | 统计周期：week/month，默认 week |
| date | string | 否 | 基准日期，默认今天 |
| userIds | string | 否 | 用户ID列表，逗号分隔 |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "period": {
      "type": "week",
      "startDate": "2026-03-16",
      "endDate": "2026-03-22"
    },
    "summary": {
      "totalHours": 200.0,
      "totalUsers": 5,
      "avgHoursPerUser": 40.0
    },
    "byUser": [
      {
        "userId": 1,
        "userName": "张三",
        "hours": 42.0,
        "percentage": 21.0
      },
      {
        "userId": 2,
        "userName": "李四",
        "hours": 38.5,
        "percentage": 19.25
      }
    ],
    "byProject": [
      {
        "projectId": 1,
        "projectName": "项目A",
        "hours": 120.0,
        "percentage": 60.0
      }
    ]
  }
}
```

---

### 5.3 今日/本周/本月统计

**GET** `/api/stats/summary`

获取当前用户的快速统计（用于首页展示）。

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "today": 6.0,
    "week": 32.0,
    "month": 128.0
  }
}
```

---

## 6. 导出模块

### 6.1 导出工时数据

**GET** `/api/export`

导出工时数据（仅管理员）。

#### 请求参数

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| format | string | 否 | 导出格式：csv/excel，默认 excel |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| userIds | string | 否 | 用户ID列表，逗号分隔 |
| projectIds | string | 否 | 项目ID列表，逗号分隔 |

#### 响应

成功时返回文件下载：

- CSV 格式：Content-Type: text/csv
- Excel 格式：Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

#### 导出字段

| 字段 | 描述 |
|------|------|
| 员工姓名 | userName |
| 日期 | date |
| 项目 | projectName |
| 任务 | task |
| 时长(小时) | hours |
| 备注 | note |
| 提交时间 | createdAt |

---

## 7. 错误码

### 7.1 通用错误码 (1xxx)

| 错误码 | 描述 |
|--------|------|
| 1000 | 未知错误 |
| 1001 | 参数错误 |
| 1002 | 未授权（未登录或 Token 无效） |
| 1003 | 权限不足 |

### 7.2 认证模块错误码 (1xxx)

| 错误码 | 描述 |
|--------|------|
| 1101 | 用户名或密码错误 |
| 1102 | 用户已被禁用 |
| 1103 | 原密码错误 |
| 1104 | 新密码格式不正确 |

### 7.3 工时模块错误码 (2xxx)

| 错误码 | 描述 |
|--------|------|
| 2001 | 项目不存在或已归档 |
| 2002 | 日期超出允许范围（只能填报过去7天） |
| 2003 | 时长不合法（必须 > 0 且 ≤ 24） |
| 2004 | 工时记录不存在 |
| 2005 | 无权访问此记录 |

### 7.4 项目模块错误码 (3xxx)

| 错误码 | 描述 |
|--------|------|
| 3001 | 项目名称已存在 |
| 3002 | 无权限操作 |
| 3003 | 项目不存在 |

### 7.5 导出模块错误码 (4xxx)

| 错误码 | 描述 |
|--------|------|
| 4001 | 导出数据为空 |
| 4002 | 导出范围过大（最多10000条） |
| 4003 | 不支持的导出格式 |

---

## 8. 数据类型定义

### User（用户）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | integer | 用户ID |
| username | string | 用户名 |
| name | string | 员工姓名 |
| role | string | 角色：employee/admin |
| status | string | 状态：active/inactive |
| createdAt | string | 创建时间 |

### Project（项目）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | integer | 项目ID |
| name | string | 项目名称 |
| description | string | 项目描述 |
| status | string | 状态：active/archived |
| createdAt | string | 创建时间 |

### TimeEntry（工时记录）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | integer | 记录ID |
| userId | integer | 用户ID |
| userName | string | 用户姓名 |
| projectId | integer | 项目ID |
| projectName | string | 项目名称 |
| task | string | 任务名称 |
| hours | number | 时长（小时） |
| date | string | 工作日期 |
| note | string | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

---

## 9. 接口调用示例

### 9.1 完整登录流程

```javascript
// 1. 登录获取 Token
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
const { data } = await loginRes.json()

// 2. 存储 Token
localStorage.setItem('token', data.token)

// 3. 设置默认请求头
axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`

// 4. 获取用户信息
const userRes = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${data.token}` }
})
```

### 9.2 工时填报流程

```javascript
// 1. 获取项目列表
const projects = await fetch('/api/projects?status=active').then(r => r.json())

// 2. 提交工时
const entry = await fetch('/api/timesheet', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    projectId: 1,
    task: '功能开发',
    hours: 4.5,
    date: '2026-03-19',
    note: '完成用户模块'
  })
}).then(r => r.json())

// 3. 获取统计
const stats = await fetch('/api/stats/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json())
```

---

## 10. OpenAPI 规范

完整的 OpenAPI 3.0 规范可通过以下方式获取：

- **JSON 格式**: `GET /openapi.json`
- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`
