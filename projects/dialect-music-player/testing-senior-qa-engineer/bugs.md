# 方言音乐播放器 - 缺陷记录

**Author**: 高级测试工程师
**Last Updated**: 2026-03-19
**Version**: 1.0

---

## Bug 列表

| Bug ID | 标题 | 严重程度 | 状态 | 模块 |
|--------|------|---------|------|------|
| [BUG-001](#bug-001-方言搜索接口路由冲突) | 方言搜索接口路由冲突 | 🔴 高 | 待修复 | 方言模块 |
| [BUG-002](#bug-002-音乐搜索接口潜在路由冲突风险) | 音乐搜索接口潜在路由冲突风险 | 🟡 中 | 待确认 | 音乐模块 |

---

## BUG-001: 方言搜索接口路由冲突

### 基本信息

| 字段 | 内容 |
|------|------|
| **Bug ID** | BUG-001 |
| **标题** | 方言搜索接口路由冲突 |
| **严重程度** | 🔴 高（P0 阻塞） |
| **优先级** | 紧急 |
| **影响模块** | 方言模块 |
| **发现时间** | 2026-03-19 02:30 |
| **发现者** | 高级测试工程师 |
| **状态** | 待修复 |

### 问题描述

方言搜索接口无法正常访问。调用 `GET /api/dialect/search?keyword=xxx` 时，FastAPI 框架将 URL 中的 `search` 字符串误认为是 `{dialect_id}` 路径参数，导致请求被错误路由到获取方言详情的接口。

### 复现步骤

1. 启动后端服务
2. 调用 `GET /api/dialect/search?keyword=成都`
3. 检查响应内容

### 实际结果

```json
{
  "code": 1201,
  "message": "方言不存在",
  "data": null
}
```

HTTP 状态码：200

### 预期结果

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

### 根本原因

FastAPI 路由定义顺序错误。在 `backend/routers/dialect.py` 文件中：

```python
# ❌ 当前代码（错误）
@router.get("/{dialect_id}")
async def get_dialect_detail(dialect_id: str):
    """获取方言详情"""
    ...

@router.get("/search")
async def search_dialects(keyword: str):
    """搜索方言"""
    ...
```

FastAPI 按照路由定义的顺序进行匹配。当 `/search` 定义在 `/{dialect_id}` 之后时，`search` 字符串会被当作 `dialect_id` 参数匹配到第一个路由。

### 影响范围

1. **用户无法使用方言搜索功能**
2. **API 文档与实际行为不符**
3. **影响用户体验**

### 修复建议

**方案一：调整路由顺序（推荐）**

修改 `backend/routers/dialect.py`：

```python
# ✅ 修复后代码
@router.get("/search")  # 固定路径路由放在前面
async def search_dialects(keyword: str):
    """搜索方言"""
    ...

@router.get("/{dialect_id}")  # 动态路径路由放在后面
async def get_dialect_detail(dialect_id: str):
    """获取方言详情"""
    ...
```

**方案二：修改路由路径**

将搜索接口路径改为不会被误匹配的形式：
- `/api/dialect/_search`（添加下划线前缀）
- `/api/dialect/query`（使用不同动词）

### 验证步骤

修复后需验证：
1. `GET /api/dialect/search?keyword=成都` 返回搜索结果
2. `GET /api/dialect/search?keyword=xyznotexist` 返回空列表
3. `GET /api/dialect/d001` 仍能正常获取方言详情

---

## BUG-002: 音乐搜索接口潜在路由冲突风险

### 基本信息

| 字段 | 内容 |
|------|------|
| **Bug ID** | BUG-002 |
| **标题** | 音乐搜索接口潜在路由冲突风险 |
| **严重程度** | 🟡 中（P1） |
| **优先级** | 中 |
| **影响模块** | 音乐模块 |
| **发现时间** | 2026-03-19 02:35 |
| **发现者** | 高级测试工程师 |
| **状态** | 待确认 |

### 问题描述

音乐模块的路由定义结构与方言模块相同，存在相同的潜在路由冲突风险。虽然当前测试中音乐搜索接口测试失败（原因待查），但代码结构本身存在隐患。

### 风险分析

检查 `backend/routers/music.py` 的路由定义：

```python
# 风险代码结构
@router.get("/list")          # 固定路径
@router.post("/upload")       # 固定路径
@router.get("/{music_id}")    # 动态路径
@router.patch("/{music_id}")  # 动态路径
@router.delete("/{music_id}") # 动态路径
@router.get("/search")        # ⚠️ 固定路径在动态路径之后
```

**问题**：`/search` 路由定义在 `/{music_id}` 之后，可能被拦截。

### 潜在影响

1. **当前未触发**：可能是因为测试顺序或其他原因暂未触发
2. **未来风险**：如果后续添加更多固定路径路由，可能触发与 BUG-001 相同的问题
3. **代码规范**：不符合 RESTful API 最佳实践

### 修复建议

**统一调整所有路由文件的路由顺序**

1. 在 `backend/routers/dialect.py` 中：
   - 将 `/search` 移到 `/{dialect_id}` 之前

2. 在 `backend/routers/music.py` 中：
   - 将 `/search` 移到 `/{music_id}` 之前

3. 建立 **路由定义规范**：
   ```
   # 推荐顺序：
   # 1. 固定路径 + GET
   # 2. 固定路径 + POST/PUT/DELETE
   # 3. 动态路径（/{id}）
   ```

### 验证步骤

1. 检查所有路由文件的定义顺序
2. 添加单元测试验证路由匹配
3. 使用 `curl` 或 Postman 测试所有路由端点

---

## Bug 统计

| 严重程度 | 数量 | 状态 |
|---------|------|------|
| 🔴 高 | 1 | BUG-001 |
| 🟡 中 | 1 | BUG-002 |
| 🟢 低 | 0 | - |
| **总计** | **2** | - |

---

## 修复优先级

1. **立即修复**：BUG-001（阻塞搜索功能）
2. **计划修复**：BUG-002（预防性修复）

---

**报告生成时间**: 2026-03-19 02:40
**测试工程师**: 高级测试工程师
