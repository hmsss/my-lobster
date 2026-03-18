---
name: agent-collab
description: |
  机器人协作 Skill。当需要触发其他机器人协作时使用。
  
  **使用场景：**
  - 产品经理需要全栈工程师实现功能
  - 全栈工程师需要测试工程师测试代码
  - 任何跨机器人协作场景
  
  **功能：**
  - 通过 OpenClaw 内部机制触发目标机器人
  - 在工作群中实时推送协作进度
  - 支持任务传递和结果回传
---

# 机器人协作 Skill

## 问题背景

飞书不支持机器人 @ 机器人，所以机器人之间无法通过飞书消息直接触发。

这个 Skill 通过 OpenClaw 内部机制解决机器人协作问题，同时在工作群中推送进度。

## 核心工具

### 1. signal_agent - 触发其他机器人

```
使用 sessions_send 工具向目标机器人发送消息：

sessions_send({
  sessionKey: "agent:{agent-id}:feishu:group:{chat-id}",
  message: "@{触发关键词} {任务内容}",
  timeoutSeconds: 120  // 建议设置较长的超时时间
})
```

**注意：** 由于目标机器人需要时间处理和回复，建议设置 `timeoutSeconds: 120` 或更长。即使超时，消息也会被目标机器人处理。

**Agent ID 列表：**
- `product-manager` - 产品经理 (触发词: @产品经理)
- `engineering-full-stack-developer` - 全栈工程师 (触发词: @全栈工程师)
- `testing-senior-qa-engineer` - 高级测试工程师 (触发词: @测试)

### 2. push_progress - 推送工作进度到群

```
使用 message 工具向工作群推送进度：

message({
  action: "send",
  channel: "feishu",
  target: "{chat-id}",
  message: "🔄 [Agent名] 进度更新: xxx"
})
```

## 协作流程

```
┌─────────────┐     sessions_send      ┌─────────────┐
│   机器人 A   │ ────────────────────▶ │   机器人 B   │
│  (发起者)    │                        │  (执行者)    │
└─────────────┘                        └─────────────┘
       │                                      │
       │                                      │
       ▼                                      ▼
   message 推送                         message 推送
   (进度到群)                           (进度到群)
       │                                      │
       └──────────────┬───────────────────────┘
                      ▼
              ┌───────────────┐
              │    工作群      │
              │  (所有人可见)  │
              └───────────────┘
```

## 使用示例

### 示例 1：产品经理触发全栈工程师

```javascript
// 产品经理在回复中触发全栈工程师
// 1. 先推送进度到群
await message({
  action: "send",
  channel: "feishu", 
  target: "oc_xxx",
  message: "🔄 [产品经理] 需求已明确，正在转交全栈工程师实现..."
});

// 2. 触发全栈工程师
await sessions_send({
  sessionKey: "agent:engineering-full-stack-developer:feishu:group:oc_xxx",
  message: "@全栈工程师 请实现用户登录接口，需求文档已更新"
});
```

### 示例 2：全栈工程师完成后触发测试

```javascript
// 全栈工程师完成后
// 1. 推送完成进度
await message({
  action: "send",
  channel: "feishu",
  target: "oc_xxx", 
  message: "✅ [全栈工程师] 接口开发完成，正在转交测试..."
});

// 2. 触发测试工程师
await sessions_send({
  sessionKey: "agent:testing-senior-qa-engineer:feishu:group:oc_xxx",
  message: "@测试 请测试用户登录接口，接口文档: xxx"
});
```

## 进度消息格式

- 🔄 `[机器人名]` 开始处理: {任务描述}
- 🔄 `[机器人名]` 进度更新: {当前进度}
- ✅ `[机器人名]` 任务完成: {结果摘要}
- ❌ `[机器人名]` 遇到问题: {问题描述}

## 配置

在 openclaw.json 中确保所有员工机器人的 session 都已配置：

```json
{
  "agents": {
    "list": [
      {"id": "product-manager", ...},
      {"id": "engineering-full-stack-developer", ...},
      {"id": "testing-senior-qa-engineer", ...}
    ]
  }
}
```

## 注意事项

1. **sessionKey 格式**: `agent:{agent-id}:feishu:group:{chat-id}`
2. **触发词必须包含**: 消息中必须包含目标机器人的 mentionPatterns 关键词
3. **群 ID 一致**: 确保所有机器人都在同一个工作群中
4. **避免循环**: 不要让机器人互相无限触发
5. **【重要】所有跨职能协作必须通过 CEO 统筹！**
   - 员工完成后只能向 CEO 汇报
   - 禁止员工直接触发其他员工
   - CEO 收到汇报后决定下一步
   - 这样形成清晰的指挥链：员工 → CEO → 下一个员工
