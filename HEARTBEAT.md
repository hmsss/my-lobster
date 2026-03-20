# HEARTBEAT.md - CEO 心跳任务

每分钟检查以下事项：

## 1. 员工完成任务检查

检查 `memory/task-state.json`，发现员工完成时**自动转交下一阶段**：

```
如果 product-manager 完成：
  → 审核 PRD
  → 转交给全栈工程师

如果 engineering-full-stack-developer 完成：
  → 验证产出
  → 转交给测试工程师

如果 testing-senior-qa-engineer 完成：
  → 验收通过
  → 生成最终报告
```

## 2. 任务状态文件位置
- `/root/.openclaw/workspace/memory/task-state.json`

## 3. 执行原则
- 发现员工完成任务后，立即处理，不要等待
- 使用 sessions_send 分配任务
- 更新 task-state.json 状态
