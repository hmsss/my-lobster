---
name: gateway-autoresume
description: 网关重启自动恢复 Skill。网关重启后自动查询未完成任务，继续执行并给出结论。触发词：网关重启、恢复任务、resume tasks、autoresume
---

# gateway-autoresume

网关重启后自动恢复未完成任务的 Skill。

## 功能

1. **重启检测**：通过 cron job 定期检查网关状态
2. **任务恢复**：查询未完成任务，继续执行
3. **结论输出**：向用户报告恢复状态和任务进度

## 部署

### 方式一：定时检查（推荐）

创建 cron job 定期检查网关是否刚刚重启：

```
检查频率：每 5 分钟检查一次
检查内容：网关状态 + 上次运行记录
```

### 方式二：重启钩子

在网关启动时自动触发任务检查。

## 任务状态存储

任务状态存储在 `memory/gateway-tasks.json`：

```json
{
  "lastGatewayStart": "2026-03-17T17:00:00Z",
  "pendingTasks": [
    {
      "id": "task-001",
      "description": "部署 feishu-bot",
      "status": "pending",
      "assignedTo": "feishu-bot-001",
      "createdAt": "2026-03-17T16:50:00Z"
    }
  ],
  "completedTasks": []
}
```

## 执行流程

### Step 1: 检查网关状态

使用 `openclaw gateway status` 检查网关是否运行。

### Step 2: 读取任务状态

读取 `memory/gateway-tasks.json` 获取未完成任务列表。

### Step 3: 恢复任务

对于每个 pending 任务：
- 如果是 subagent 任务，使用 `subagents list` 检查状态
- 如果是外部任务，尝试继续执行
- 更新任务状态

### Step 4: 输出结论

向用户报告：

```
🔄 网关已重启，正在恢复任务...

恢复的任务：
1. [任务描述] - [状态]

当前进度：[已完成/总数]
```

## 注意事项

- 此 Skill 需要文件系统写入权限
- 敏感任务（如密钥相关）不会被自动恢复，需要用户确认
- 任务恢复超时设置为 5 分钟
