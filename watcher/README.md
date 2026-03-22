# OpenClaw Agent Watcher

实时监听 OpenClaw Gateway 日志，提取 Agent 进度事件，节流摘要后推送到飞书群。

## 功能特性

- 🔄 **实时监听**：通过 `tail -F` 跟踪 Gateway 日志
- 📊 **事件解析**：自动解析 `[agent:nested]` 进度事件
- ⏱️ **智能节流**：30秒/agent 节流，避免刷屏
- 📝 **摘要生成**：自动生成 1-2 句进度摘要
- 🚀 **飞书推送**：直接调用飞书 API 发送到群聊
- 🔧 **Systemd 服务**：支持开机自启和自动重启

## 架构

```
┌─────────────────────┐
│   Gateway 日志       │
│  (JSONL 格式)        │
└──────────┬──────────┘
           │ tail -F
           ▼
┌─────────────────────┐
│   Log Parser        │
│  解析 agent:nested  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Throttler         │
│  30秒/agent 节流    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Summarizer        │
│  生成进度摘要       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Feishu API        │
│  推送到群聊         │
└─────────────────────┘
```

## 事件类型

| 事件 | 触发条件 | 消息模板 |
|------|---------|---------|
| 🚀 任务开始 | 检测到新 runId | `[Agent] 开始处理新任务` |
| 🔄 进度更新 | Agent 输出日志 | `[Agent] {摘要}` |
| ✅ 任务完成 | 检测到"完成"关键词 | `[Agent] 任务完成` |

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.js` | 主程序（Node.js） |
| `config.json` | 配置文件 |
| `watcher.sh` | 备用 Bash 版本 |
| `openclaw-watcher.service` | Systemd 服务配置 |

## 配置

编辑 `config.json`：

```json
{
  "enabled": true,
  "logFile": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
  "throttleMs": 30000,
  "feishu": {
    "chatId": "oc_xxx"
  },
  "agents": {
    "include": ["product-manager", "engineering-full-stack-developer", "testing-senior-qa-engineer"],
    "exclude": ["main"]
  }
}
```

### 配置项说明

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `enabled` | boolean | 是否启用 |
| `logFile` | string | 日志文件路径，支持 `YYYY-MM-DD` 占位符 |
| `throttleMs` | number | 节流间隔（毫秒），默认 30000 |
| `feishu.chatId` | string | 飞书群 ID |
| `agents.include` | string[] | 要监听的 Agent 列表 |
| `agents.exclude` | string[] | 要排除的 Agent 列表 |

### 飞书配置

飞书 API 配置从 `~/.openclaw/openclaw.json` 自动读取：

```json
{
  "channels": {
    "feishu": {
      "appId": "cli_xxx",
      "appSecret": "xxx"
    }
  }
}
```

## 安装

### 方式 1：直接运行

```bash
# 克隆仓库
git clone https://github.com/hmsss/my-lobster.git
cd my-lobster/watcher

# 安装依赖（Node.js 18+）
# 无需额外依赖，使用 Node.js 内置模块

# 运行
node index.js
```

### 方式 2：Systemd 服务（推荐）

```bash
# 复制服务文件
sudo cp openclaw-watcher.service /etc/systemd/system/

# 修改 ExecStart 路径
sudo sed -i 's|/root/.openclaw/workspace/watcher|/your/path/watcher|g' /etc/systemd/system/openclaw-watcher.service

# 启用并启动
sudo systemctl daemon-reload
sudo systemctl enable openclaw-watcher
sudo systemctl start openclaw-watcher

# 查看状态
sudo systemctl status openclaw-watcher

# 查看日志
sudo journalctl -u openclaw-watcher -f
```

## 使用

### 查看运行状态

```bash
systemctl status openclaw-watcher
```

### 查看实时日志

```bash
journalctl -u openclaw-watcher -f
```

### 重启服务

```bash
sudo systemctl restart openclaw-watcher
```

### 停止服务

```bash
sudo systemctl stop openclaw-watcher
```

## 日志格式

Watcher 监听的日志格式（JSONL）：

```json
{
  "0": "{\"subsystem\":\"agent:nested\"}",
  "1": "[agent:nested] session=agent:product-manager:feishu:group:oc_xxx run=uuid message content",
  "time": "2026-03-19T10:00:00.000+08:00"
}
```

## 自定义 Agent 名称

在 `index.js` 中修改 `AGENT_NAMES` 映射：

```javascript
const AGENT_NAMES = {
  'product-manager': '产品经理',
  'engineering-full-stack-developer': '全栈工程师',
  'testing-senior-qa-engineer': '测试工程师',
  'main': 'CEO'
};
```

## 消息示例

```
🚀 [全栈工程师] 开始处理新任务
🔄 [全栈工程师] 架构设计文档完成，现在编写接口文档
✅ [全栈工程师] 任务完成
```

## 故障排除

### Token 获取失败

检查飞书配置是否正确：

```bash
cat ~/.openclaw/openclaw.json | grep -A 5 feishu
```

### 日志文件不存在

确保 Gateway 正在运行：

```bash
ls -la /tmp/openclaw/openclaw-*.log
```

### 服务无法启动

检查 Node.js 路径：

```bash
which node
# 更新服务文件中的 ExecStart 路径
```

## License

MIT
