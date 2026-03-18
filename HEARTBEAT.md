# HEARTBEAT.md - CEO 心跳任务

每次心跳时检查以下内容：

## 1. 任务监控检查

检查是否有正在进行的任务需要监控。

**实现：**
1. 读取 `memory/task-monitors.json` 获取活跃监控列表
2. 对每个监控的 Agent：
   - 使用 sessions_list 查看该 Agent 的 lastActiveAt
   - 如果比上次检查时间更新，推送进度提醒到群
3. 更新 `memory/task-monitors.json` 的 lastCheckAt

## 2. 其他检查

（如有其他定期任务可在此添加）

---

如果没有任何需要检查的内容，回复：HEARTBEAT_OK
