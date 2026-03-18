# HEARTBEAT.md - CEO 心跳任务

每次心跳时执行以下检查：

## 1. 任务监控检查（每 1 分钟）

检查所有正在进行的任务，让 Agent 主动汇报进度。

**实现：**
1. 读取 `memory/task-monitors.json` 获取活跃监控列表
2. 对每个监控的 Agent：
   - 使用 sessions_send 发送进度查询消息：
     ```
     sessions_send({
       sessionKey: "agent:{agent-id}:feishu:group:{chat-id}",
       message: "@{触发词} 请简要汇报当前任务进度（1-2句话）",
       timeoutSeconds: 30
     })
     ```
3. 更新 `memory/task-monitors.json` 的 lastCheckAt

## 2. 任务完成检测

如果 Agent 已完成并汇报，自动删除该监控任务。

## 3. 简化群消息

群消息只用于通知，不用于详细内容：
- ✅ "产品经理已完成需求分析，文档：`projects/xxx/prd.md`"
- ❌ "产品经理完成需求分析：1. xxx 2. xxx 3. xxx..."（太长）

详细内容通过文档传递，不是消息口述。

---

如果没有任何需要检查的内容，回复：HEARTBEAT_OK
