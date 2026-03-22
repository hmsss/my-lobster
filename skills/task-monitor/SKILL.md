---
name: task-monitor
description: |
  任务监控 Skill。用于自动监控 Agent 任务进度并推送到群。
  
  **使用场景：**
  - CEO 发布任务后自动创建监控
  - 定时检查目标 Agent 的会话状态
  - 发现新消息时推送到工作群
  - 任务完成后删除监控
  
  **与 cron 配合：**
  - 创建任务时同时创建 cron job
  - cron job 定期检查 Agent 状态
  - 任务完成后删除 cron job
---

# 任务监控 Skill

## 核心概念

当 CEO 发布任务给某个 Agent 时，自动创建一个定时监控任务，定期检查该 Agent 的状态并推送进度。

## 工作流程

```
┌──────────────┐     sessions_send      ┌──────────────┐
│     CEO      │ ────────────────────▶ │  目标 Agent  │
│              │                        │              │
│  创建任务     │                        │   执行任务    │
│  创建监控     │                        │              │
└──────────────┘                        └──────────────┘
       │                                       │
       │ cron job                              │
       ▼                                       ▼
┌──────────────┐                        ┌──────────────┐
│  定时检查     │ ◀──── 检查状态 ────▶  │  更新状态     │
│  (每2分钟)    │                        │              │
└──────────────┘                        └──────────────┘
       │
       │ 发现新消息
       ▼
┌──────────────┐
│  推送到群     │
│  message()   │
└──────────────┘
```

## 使用方法

### 1. 发布任务时创建监控

```javascript
// CEO 发布任务时
const targetAgent = "engineering-full-stack-developer";
const chatId = "oc_xxx";

// 1. 发送任务给目标 Agent
await sessions_send({
  sessionKey: `agent:${targetAgent}:feishu:group:${chatId}`,
  message: "@全栈工程师 请实现 xxx 功能",
  timeoutSeconds: 120
});

// 2. 创建定时监控任务
await cron({
  action: "add",
  job: {
    name: `monitor-${targetAgent}-${Date.now()}`,
    sessionTarget: "main",
    schedule: { kind: "every", everyMs: 120000 }, // 每2分钟
    payload: {
      kind: "agentTurn",
      message: `/monitor-agent ${targetAgent} ${chatId}`
    }
  }
});
```

### 2. 监控命令（写入 CEO 的 HEARTBEAT.md）

在 `/root/.openclaw/workspace/HEARTBEAT.md` 中添加：

```markdown
## 任务监控

如果有 `/monitor-agent {agent-id} {chat-id}` 命令：

1. 使用 sessions_history 获取该 Agent 的最新消息
2. 如果有新消息（比上次检查更新），推送到群：
   ```
   message({
     action: "send",
     channel: "feishu",
     target: "{chat-id}",
     message: "🔄 [{Agent名}] 有新进度，请查看群消息"
   })
   ```
3. 记录最后检查时间到 memory/task-monitor.json
```

### 3. 任务完成后删除监控

当 CEO 收到 Agent 的完成汇报后：

```javascript
// 删除该 Agent 的监控任务
const jobs = await cron({ action: "list" });
const monitorJob = jobs.find(j => j.name.startsWith(`monitor-${agentId}-`));
if (monitorJob) {
  await cron({ action: "remove", jobId: monitorJob.id });
}
```

## 配置示例

### openclaw.json 添加监控配置

```json
{
  "taskMonitor": {
    "enabled": true,
    "checkIntervalMs": 120000,
    "maxActiveMonitors": 10
  }
}
```

## 监控状态存储

`memory/task-monitor.json`:

```json
{
  "monitors": {
    "engineering-full-stack-developer": {
      "chatId": "oc_xxx",
      "startedAt": "2026-03-18T15:00:00Z",
      "lastCheckAt": "2026-03-18T15:10:00Z",
      "lastMessageId": "om_xxx",
      "cronJobId": "job_xxx"
    }
  }
}
```

## 实现步骤

1. **创建监控函数** - 在 CEO 的 HEARTBEAT.md 中添加监控逻辑
2. **发布任务时自动创建** - 修改 CEO 的 SOUL.md，在 sessions_send 后自动创建 cron
3. **完成时自动删除** - 修改 CEO 的 SOUL.md，收到汇报后删除 cron

## 注意事项

- 监控间隔建议 2-5 分钟，避免过于频繁
- 最多同时监控 10 个 Agent
- 任务完成后必须删除监控，避免资源浪费
