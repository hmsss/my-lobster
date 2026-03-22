---
name: agent-heartbeat
description: Agent工作心跳监听。当某个Agent开始工作时，自动在群里每10秒发送一次心跳，停止工作时自动关闭。
invocations:
  - words:
      - 开启心跳
      - 启动心跳监听
      - 工作状态监听
    description: 启动Agent工作心跳，在群里实时播报工作状态
---

# agent-heartbeat

## 功能

当某个 Agent 开始工作时，自动在群里每 10 秒发送一次心跳，告知群里该 Agent 正在执行什么任务。工作时结束，心跳自动关闭。

## 心跳格式

```
【{中文名}】{工作中描述}... (计数)
```

例：
```
【叙事架构师】生成章纲... (1)
【写手】生成正文... (5)
```

## 工作原理

```
Agent 开始工作
    ↓
启动 heartbeat.js 后台进程（每10秒发一次）
    ↓
Agent 完成工作，父进程结束
    ↓
后台 heartbeat 进程收到 SIGTERM，自动退出
```

## 启动心跳

在 Agent 的任务模板里，第一步不是"发群播报"，而是**启动心跳**：

### 启动心跳脚本

```bash
# 后台启动心跳（$! 记录 PID 备用）
node /root/.openclaw/workspace/skills/agent-heartbeat/heartbeat.js \
  "{BotAppId}" \
  "{BotAppSecret}" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "{中文名}" \
  "{工作中描述}" &

HEARTBEAT_PID=$!
```

### 停止心跳

工作完成后，杀死心跳进程：

```bash
kill $HEARTBEAT_PID 2>/dev/null
# 或通过 PID 文件
PID_FILE="/tmp/heartbeat-{中文名}.pid"
[ -f "$PID_FILE" ] && kill $(cat "$PID_FILE") 2>/dev/null && rm "$PID_FILE"
```

---

## 各 Agent 心跳参数

| Agent | BotAppId | BotAppSecret | 中文名 |
|-------|----------|--------------|--------|
| 内容策划 | cli_a92319273c78dcca | dW66idnGC1gEEAX0rJTyEgPn61JgtMoy | 内容策划 |
| 叙事架构师 | cli_a927295acd38dcee | squevfJj0VbpQyarqjzoceAATnRsQdS0 | 叙事架构师 |
| 写手 | cli_a92317d3d5785cb6 | cAMsLGIIWwuJV8c35uY3YerrgVjcAc8n | 写手 |

---

## 完整 Agent 任务模板（含心跳）

### 示例：叙事架构师任务

```
## 任务：{具体任务}

## 步骤一：启动心跳（后台运行）
nohup node /root/.openclaw/workspace/skills/agent-heartbeat/heartbeat.js \
  "cli_a927295acd38dcee" \
  "squevfJj0VbpQyarqjzoceAATnRsQdS0" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "叙事架构师" \
  "生成章纲" > /tmp/heartbeat-narrative-designer.log 2>&1 &

HEARTBEAT_PID=$!

## 步骤二：发群播报（接收任务）
node ...send-as-bot.js ... "【叙事架构师】已接收任务，开始执行"

## 步骤三：执行工作中（心跳持续每10秒自动发）

## 步骤四：完成后 - 先停心跳，再发完成播报
kill $HEARTBEAT_PID 2>/dev/null
sleep 1
node ...send-as-bot.js ... "【叙事架构师完成】..."
```

---

## 终止所有心跳（应急用）

```bash
pkill -f "heartbeat.js" && echo "所有心跳已关闭"
```

或按 Agent 名终止：
```bash
kill $(cat /tmp/heartbeat-叙事架构师.pid) 2>/dev/null && rm /tmp/heartbeat-叙事架构师.pid
```

---

## 注意事项

- 心跳是后台进程，不阻塞主任务执行
- 心跳进程会在父任务结束时自动被 SIGTERM 回收
- 心跳 PID 写入 `/tmp/heartbeat-{中文名}.pid`
- 发送失败自动重试 3 次，间隔 2 秒
- 心跳消息含计数，方便判断工作进度（计数快=工作快）
