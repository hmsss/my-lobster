# Agent Interrupt Skill - 中断 Agent 任务

快速中断正在运行的 Agent 任务。

## 触发词

- `zk` - 中断当前正在运行的 Agent
- `zd` - 中断所有正在运行的 Agent
- `中断`
- `stop`
- `kill`

## 使用方式

### 中断单个 Agent
```
zk
zd-产品经理
stop product-manager
```

### 中断所有 Agent
```
zd -all
stop all
```

## 功能

1. **查看运行中的 Agent** - 检查哪些 Agent 正在执行任务
2. **中断单个 Agent** - 停止指定 Agent 的当前任务
3. `zd -all` - 中断所有正在运行的 Agent

## 实现方式

通过以下方式中断 Agent：

### 1. 发送中断消息
```javascript
sessions_send({
  sessionKey: "agent:{agent-id}:feishu:group:{chat-id}",
  message: "🛑 [系统] 任务已中断 - 老板取消了任务",
  timeoutSeconds: 10
})
```

### 2. 更新状态机
```bash
jq '.agents."{agent-id}".status = "idle"' /root/.openclaw/workspace/memory/task-state.json
```

### 3. 终止进程 (可选)
```bash
# 查找 agent 相关进程
ps aux | grep -E "node.*{agent-id}"
```

## 注意事项

- 中断操作**不会**删除已产生的文档
- 中断后 Agent 状态变为 `idle`，可以接受新任务
- 中断消息会推送到 Agent 所在的群聊
