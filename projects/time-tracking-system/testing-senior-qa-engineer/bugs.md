# 工时填报系统 - 缺陷记录

**项目**：工时填报系统
**测试日期**：2026-03-20
**测试工程师**：高级测试工程师

---

## 缺陷列表

| Bug ID | 标题 | 严重程度 | 优先级 | 状态 | 负责人 |
|--------|------|---------|--------|------|--------|
| BUG-001 | 日期校验失效-未来日期可提交 | 🔴 高 | P0 | ✅ 已关闭 | 开发工程师 |
| BUG-002 | 日期校验失效-超过7天前可提交 | 🔴 高 | P0 | ✅ 已关闭 | 开发工程师 |
| BUG-003 | 未认证响应格式不一致 | 🟡 中 | P1 | 待修复 | 开发工程师 |

---

## BUG-001：日期校验失效-未来日期可提交

### 基本信息
| 项目 | 内容 |
|------|------|
| Bug ID | BUG-001 |
| 标题 | 日期校验失效-未来日期可提交 |
| 严重程度 | 🔴 高 |
| 优先级 | P0 |
| 状态 | ✅ 已关闭 |
| 发现日期 | 2026-03-20 |
| 修复日期 | 2026-03-20 |
| 验证日期 | 2026-03-20 |
| 修复版本 | 7c80998 |
| 发现者 | 高级测试工程师 |

### 环境信息
- **测试环境**：本地开发环境
- **浏览器**：N/A（接口测试）
- **后端版本**：v1.0

### 描述
根据 API 文档，工时填报日期"不能超过今天"，但实际测试发现可以提交未来日期的工时记录。

### 复现步骤
1. 登录系统获取 Token
2. 调用 POST /api/timesheet
3. date 参数填写未来日期（如 2026-03-30）

**请求示例**：
```bash
curl -X POST http://localhost:8000/api/timesheet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"projectId":1,"task":"test","hours":4,"date":"2026-03-30"}'
```

### 预期结果
```json
{
  "code": 2002,
  "message": "日期超出允许范围",
  "data": null
}
```

### 实际结果
```json
{
  "code": 0,
  "message": "提交成功",
  "data": {
    "id": 5,
    "projectId": 1,
    "projectName": "项目A",
    "task": "test",
    "hours": 4,
    "date": "2026-03-30",
    "note": null,
    "createdAt": null
  }
}
```

### 影响范围
- 员工可以预先填写未来工时
- 影响工时数据真实性和统计准确性
- 可能被恶意利用

### 建议修复方案
在后端 `routers/timesheet.py` 的创建工时接口中添加日期校验：
```python
from datetime import datetime, date

work_date = datetime.strptime(entry.date, "%Y-%m-%d").date()
today = date.today()

if work_date > today:
    raise HTTPException(status_code=400, detail={
        "code": 2002,
        "message": "日期超出允许范围（不能超过今天）"
    })
```

---

## BUG-002：日期校验失效-超过7天前可提交

### 基本信息
| 项目 | 内容 |
|------|------|
| Bug ID | BUG-002 |
| 标题 | 日期校验失效-超过7天前可提交 |
| 严重程度 | 🔴 高 |
| 优先级 | P0 |
| 状态 | ✅ 已关闭 |
| 发现日期 | 2026-03-20 |
| 修复日期 | 2026-03-20 |
| 验证日期 | 2026-03-20 |
| 修复版本 | 7c80998 |
| 发现者 | 高级测试工程师 |

### 环境信息
- **测试环境**：本地开发环境
- **浏览器**：N/A（接口测试）
- **后端版本**：v1.0

### 描述
根据 API 文档，工时填报日期"不能早于7天前"，但实际测试发现可以提交超过7天前的工时记录。

### 复现步骤
1. 登录系统获取 Token
2. 调用 POST /api/timesheet
3. date 参数填写10天前日期（如 2026-03-01）

**请求示例**：
```bash
curl -X POST http://localhost:8000/api/timesheet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"projectId":1,"task":"test","hours":4,"date":"2026-03-01"}'
```

### 预期结果
```json
{
  "code": 2002,
  "message": "日期超出允许范围",
  "data": null
}
```

### 实际结果
```json
{
  "code": 0,
  "message": "提交成功",
  "data": {
    "id": 6,
    "projectId": 1,
    "projectName": "项目A",
    "task": "test",
    "hours": 4,
    "date": "2026-03-01",
    "note": null,
    "createdAt": null
  }
}
```

### 影响范围
- 员工可以补填很久之前的工时
- 影响工时数据准确性和追溯性
- 可能导致历史数据被篡改

### 建议修复方案
在后端 `routers/timesheet.py` 的创建工时接口中添加日期校验：
```python
from datetime import datetime, date, timedelta

work_date = datetime.strptime(entry.date, "%Y-%m-%d").date()
today = date.today()
min_date = today - timedelta(days=7)

if work_date < min_date:
    raise HTTPException(status_code=400, detail={
        "code": 2002,
        "message": "日期超出允许范围（只能填报过去7天内）"
    })
```

---

## BUG-003：未认证响应格式不一致

### 基本信息
| 项目 | 内容 |
|------|------|
| Bug ID | BUG-003 |
| 标题 | 未认证响应格式不一致 |
| 严重程度 | 🟡 中 |
| 优先级 | P1 |
| 状态 | 待修复 |
| 发现日期 | 2026-03-20 |
| 发现者 | 高级测试工程师 |

### 环境信息
- **测试环境**：本地开发环境
- **浏览器**：N/A（接口测试）
- **后端版本**：v1.0

### 描述
根据 API 文档，所有接口应返回统一的 JSON 格式 `{code, message, data}`，但未携带 Token 时返回 FastAPI 默认格式 `{"detail":"Not authenticated"}`。

### 复现步骤
调用任意需要认证的接口，不携带 Authorization 头：
```bash
curl http://localhost:8000/api/auth/me
```

### 预期结果
```json
{
  "code": 1002,
  "message": "未授权",
  "data": null
}
```

### 实际结果
```json
{
  "detail": "Not authenticated"
}
```

### 影响范围
- 前端错误处理逻辑可能失效
- 不符合 API 文档规范

### 建议修复方案
在 `main.py` 中添加自定义异常处理器：
```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 401:
        return JSONResponse(
            status_code=401,
            content={"code": 1002, "message": "未授权", "data": None}
        )
    if exc.status_code == 403:
        return JSONResponse(
            status_code=403,
            content={"code": 1003, "message": "权限不足", "data": None}
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": 1000, "message": exc.detail, "data": None}
    )
```

---

## 修复验证清单

| Bug ID | 修复版本 | 验证结果 | 验证人 | 验证日期 |
|--------|---------|---------|--------|---------|
| BUG-001 | 7c80998 | ✅ 通过 | 高级测试工程师 | 2026-03-20 |
| BUG-002 | 7c80998 | ✅ 通过 | 高级测试工程师 | 2026-03-20 |
| BUG-003 | - | 待验证 | - | - |
