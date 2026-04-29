---
name: feishu-bot-manager
description: 飞书机器人与员工生命周期管理，支持招聘、解聘和机器人路由配置
invocations:
  - words:
      - 雇佣agent
      - 部署agent
      - 解雇员工
      - 裁员
      - 招聘
      - 团队状态
    description: 员工全生命周期管理 -- 招募/创建/部署/解雇 Agent，组建可协作团队
---

# feishu-bot-manager

员工全生命周期管理。招人、装备、配岗、组网、解雇，一条龙。

员工分为两类：
- **长期员工（permanent）**：常驻团队，长期在岗
- **临时员工（temporary）**：为特定任务招聘，任务完成后由 CEO 建议是否解雇

```
招聘流程：需求分析 -> 人才市场搜索 -> 确认方案 -> 审批密钥 ->
创建 Agent -> 配置飞书账号 -> 绑定上岗 -> 团队组网
```

---

## Phase 1: 需求分析

向用户确认：
1. 这个 Agent 要做什么？
2. 需要什么专业能力？
3. 是否需要与现有 Agent 协作？

---

## Phase 2: 人才市场搜索

人才市场位于 `/root/.openclaw/workspace/my-lobster/agency-agents/`。

搜索方法：
1. 扫描目录名（格式 `{领域}-{角色}`）初筛
2. 读取 `IDENTITY.md` 精筛
3. 展示 Top 3-5 候选人

---

## Phase 3: 提交人员方案

必须包含：
- 角色名、来源、类型、职责
- 推荐技能
- **需要用户提供的飞书应用密钥（App ID + App Secret）**

等待用户确认后再执行。

---

## Phase 4: 创建 Agent

使用 `openclaw agents add` 命令：

```bash
openclaw agents add {agent-id} \
  --workspace /root/.openclaw/agents/{agent-id}/workspace \
  --agent-dir /root/.openclaw/agents/{agent-id} \
  --bind feishu:{account-id} \
  --non-interactive
```

参数：
| 参数 | 必填 | 说明 |
|------|------|------|
| `{agent-id}` | 是 | 唯一标识 |
| `--workspace` | 是 | 工作区目录 |
| `--agent-dir` | 是 | Agent 状态目录 |
| `--bind` | 否 | 格式 `feishu:{account-id}` |
| `--non-interactive` | 是 | 禁用交互 |

---

## Phase 5: 复制人设文件

```bash
cp /root/.openclaw/workspace/my-lobster/agency-agents/{agent-id}/IDENTITY.md \
   /root/.openclaw/agents/{agent-id}/workspace/
cp /root/.openclaw/workspace/my-lobster/agency-agents/{agent-id}/SOUL.md \
   /root/.openclaw/agents/{agent-id}/workspace/
cp /root/.openclaw/workspace/my-lobster/agency-agents/{agent-id}/AGENTS.md \
   /root/.openclaw/agents/{agent-id}/workspace/
```

创建初始记忆文件：

```bash
cat > /root/.openclaw/agents/{agent-id}/workspace/SESSION-STATE.md << 'EOF'
# SESSION-STATE.md -- {角色名} 工作内存

## 当前任务
[无]

## 关键上下文
[无]

## 待办事项
- [ ] 无

---
*初始化创建*
EOF
```

---

## Phase 6: 配置飞书账号（关键！）

**必须使用 `openclaw config set` 命令**，不要直接写文件（Gateway 会覆盖配置）。

```bash
# 添加账号到 accounts
openclaw config set channels.feishu.accounts.{account-id}.appId "cli_xxx"
openclaw config set channels.feishu.accounts.{account-id}.appSecret "xxxxxx"
openclaw config set channels.feishu.accounts.{account-id}.botName "{agent-id}"
openclaw config set channels.feishu.accounts.{account-id}.dmPolicy "open"
openclaw config set channels.feishu.accounts.{account-id}.allowFrom '["*"]'
openclaw config set channels.feishu.accounts.{account-id}.enabled true

# 设置 defaultAccount
openclaw config set channels.feishu.defaultAccount "default"

# 验证
openclaw config get channels.feishu.accounts
```

**配置结构：**
```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "defaultAccount": "default",
      "appId": "cli_main_app",
      "appSecret": "main_secret",
      "domain": "feishu",
      "groupPolicy": "open",
      "accounts": {
        "default": {
          "appId": "cli_main_app",
          "appSecret": "main_secret"
        },
        "{account-id}": {
          "appId": "cli_new_app",
          "appSecret": "new_secret",
          "botName": "{agent-id}",
          "dmPolicy": "open",
          "allowFrom": ["*"],
          "enabled": true
        }
      }
    }
  }
}
```

---

## Phase 7: 绑定上岗

Binding 在 `openclaw agents add --bind` 时自动创建，也可在 `bindings` 中手动添加：

```json
{
  "type": "route",
  "agentId": "{agent-id}",
  "match": {
    "channel": "feishu",
    "accountId": "{account-id}"
  }
}
```

---

## Phase 8: 更新团队花名册

更新 `TEAM.md`，添加新员工记录。

---

## Phase 9: 重启 Gateway

```bash
systemctl --user restart openclaw-gateway
```

或使用 `openclaw gateway restart`。

---

## 验证命令

```bash
# 验证 Agent 和绑定
openclaw agents list --bindings

# 验证飞书配置
openclaw config get channels.feishu

# 检查飞书连接
openclaw channels status --probe
```

---

## 解雇流程

1. 用户确认解雇
2. 将账号 `enabled` 设为 `false`：`openclaw config set channels.feishu.accounts.{account-id}.enabled false`
3. 从 `bindings` 移除对应条目
4. 重启 Gateway
5. 更新 `TEAM.md`

---

## 常见问题

### 配置文件被重置
- **原因**：直接用文本编辑器写入 `openclaw.json`，Gateway 进程会覆盖
- **解决**：使用 `openclaw config set` 命令写入

### 飞书账号状态 unknown
- 检查飞书开放平台是否开启了"使用长连接接收事件"
- 检查 App ID/Secret 是否正确
- 检查账号是否在 `accounts` 中正确配置

### 消息路由到错误 Agent
- 检查 `bindings` 中 `accountId` 是否与 `accounts` 中的 key 一致
- 检查 `defaultAccount` 是否设置正确
