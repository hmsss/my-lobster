---
name: feishu-bot-manager
description: 飞书机器人与员工生命周期管理，支持招聘、解聘和机器人路由配置
invocations:
  - words:
      - 添加飞书机器人
      - 配置飞书机器人
      - 新增飞书账户
      - feishu bot
      - 飞书绑定agent
      - 雇佣agent
      - 部署agent
      - 组建团队
      - 新建agent上岗
      - 解雇员工
      - 裁员
      - 团队状态
    description: 员工全生命周期管理 -- 招募/创建/部署/解雇 Agent，配置飞书机器人，组建可协作团队
---

# feishu-bot-manager

员工全生命周期管理。招人、装备、配岗、组网、解雇，一条龙。

员工分为两类：
- **长期员工（permanent）**：常驻团队，长期在岗
- **临时员工（temporary）**：为特定任务招聘，任务完成后由 CEO 建议是否解雇

```
招聘流程：需求分析 -> 人才市场搜索 -> 录用/创建 -> 装备技能 -> 配置飞书应用 -> 绑定上岗 -> 团队组网
解雇流程：CEO 建议 -> 用户确认 -> 执行解雇 -> 更新花名册
```

---

## Phase 1: 需求分析

向用户确认：

1. **这个 Agent 要做什么？** -- 一句话描述职责
2. **需要什么专业能力？** -- 可选，如"熟悉飞书审批流"、"懂内容运营"
3. **是否需要与现有 Agent 协作？** -- 如果是，确认协作方式（共享群聊、文件协作、任务转发）

---

## Phase 2: Agent 获取 -- 先雇佣，后创建

### Step 1: 人才市场搜索

人才市场位于 `agency-agents/` 目录。

**搜索方法：**

1. 扫描 `agency-agents/` 所有子目录名称（格式 `{领域}-{角色}`），用关键词初筛
2. 对命中的候选（不超过 10 个），读取 `IDENTITY.md` 精筛
3. 如需进一步确认，读取 `AGENTS.md` 前 30 行了解核心使命
4. 向用户展示 Top 3-5 候选人：

```
人才市场搜索结果：

1. engineering-feishu-integration-developer
   飞书开放平台全栈集成工程师，精通机器人、审批流、多维表格
   匹配度：高

2. support-support-responder
   客户支持应答专家，擅长工单处理和问题分类
   匹配度：中

未找到完全匹配？可选择"创建新 Agent"。
```

### Step 2a: 录用现有 Agent

用户选中候选后：

1. 该 Agent 的目录名即为 `agentId`
2. 将人才市场预设人设复制到agent
3. 确认录用后进入 Phase 3

### Step 2b: 创建新 Agent

人才市场没有合适的候选时，创建新 Agent。

**命名规则：** `{领域}-{角色名}`，如 `support-order-tracker`、`engineering-approval-bot`

**在 `agency-agents/{agent-id}/` 下创建三个文件：**

**IDENTITY.md：**

```markdown
# {角色中文名}
{一句话，不超过 50 字，描述核心能力和专业领域}
```

**SOUL.md：**

```markdown
## 你的身份与记忆

- **角色**：{角色描述}
- **个性**：{2-3 个性格关键词}
- **经验**：{核心经验描述}

## 关键规则

### 行为准则

- 简洁高效，不说废话
- 先读上下文再回答
- 主动汇报异常，不等追问
- 重要发现写入 MEMORY.md
- 私密信息不外泄到群聊

### 沟通风格

- {针对该角色的沟通风格，2-3 条}

### 专业边界

- 擅长：{能力范围}
- 不擅长：{明确边界}
- 超出边界时：推荐团队中更合适的 Agent（参见 TEAM.md）
```

**注意：创建完 SOUL.md 后，必须追加"记忆系统 + 团队协作"片段。见 Phase 6。**

**AGENTS.md：**

```markdown
# {角色中文名}

你是**{角色中文名}**，{完整角色描述}。

## 核心使命

### {能力模块 1}
- {具体能力}

### {能力模块 2}
- {具体能力}

## 工作流程

### 第一步：{流程}
### 第二步：{流程}

## 成功指标

- {可衡量标准}
```

---

## Phase 3: 技能装备

根据 Agent 角色，推荐并安装匹配的 Skill。

### 技能推荐参考

| Agent 领域 | 推荐技能 | 说明 |
|-----------|---------|------|
| engineering-* | github | 代码仓库管理 |
| engineering-* | tencentcloud-lighthouse-skill | 服务器运维 |
| marketing-* / support-* | tencent-docs | 文档协作 |
| marketing-* | tencent-cos-skill | 素材资源管理 |
| 需要信息检索的角色 | openclaw-tavily-search | 联网搜索 |
| 需要浏览器操作的角色 | agent-browser | 网页自动化 |
| 需要内容总结的角色 | summarize | 长文摘要 |
| 需要笔记/知识库的角色 | obsidian | 知识管理 |
| 需要天气信息的角色 | weather | 天气查询 |
| 所有角色（推荐） | elite-longterm-memory | 跨会话记忆系统 |

以上仅为参考。根据 Agent 的实际职责灵活判断，一个 Agent 可以装备多个技能。

**安装命令：**

```bash
openclaw skills install <skill-name>
```

**已安装的技能** 可通过查看 `.clawhub/lock.json` 确认，避免重复安装。

---

## Phase 4: 飞书应用配置

用户需要在飞书开放平台为该 Agent 创建一个独立的飞书应用。

**引导用户提供：**

| 参数 | 必填 | 说明 |
|------|------|------|
| App ID | 是 | 飞书应用 ID，格式 `cli_xxx` |
| App Secret | 是 | 飞书应用密钥 |
| 账户 ID | 否 | 账户标识，默认 `bot-{agentId}` |
| 机器人名称 | 否 | 默认使用 Agent 的中文角色名 |
| DM 策略 | 否 | `open`/`pairing`/`allowlist`，默认 `open` |

---

## Phase 5: 绑定上岗

### 路由绑定方案

**方案 1：账户级绑定** -- 该飞书 Bot 的所有消息路由到 Agent

```json
{ "agentId": "engineering-feishu-integration-developer", "match": { "channel": "feishu", "accountId": "bot-feishu-dev" } }
```

**方案 2：群聊级绑定** -- 特定群聊的消息路由到 Agent

```json
{ "agentId": "engineering-feishu-integration-developer", "match": { "channel": "feishu", "peer": { "kind": "group", "id": "oc_xxx" } } }
```

群聊级优先级更高，会覆盖账户级。

### 执行配置

```bash
openclaw skills run feishu-bot-manager -- \
  --app-id cli_xxx \
  --app-secret yyy \
  --account-id bot-feishu-dev \
  --agent-id engineering-feishu-integration-developer \
  --routing-mode account
```

群聊级绑定追加 `--chat-id oc_xxx --routing-mode group`。

---

## Phase 6: 团队组网

这是整个流程的关键环节。每个 Agent 不是孤岛，他们需要知道彼此的存在、能力和联系方式。

### 6.1 更新团队花名册

团队花名册位于工作区根目录 `TEAM.md`。每次有新 Agent 上岗，必须更新。

**如果 `TEAM.md` 不存在，按以下格式创建：**

```markdown
# Team Roster

团队花名册。CEO 和所有员工在会话启动时应读取此文件。

## 成员列表

| Agent ID | 角色 | 类型 | 飞书 Bot | 擅长领域 | 状态 |
|----------|------|------|---------|---------|------|
| {agent-id} | {中文角色名} | permanent/temporary | {account-id} | {核心能力关键词} | active |

## 协作群

| 群名称 | 群 ID | 用途 | 成员 |
|--------|-------|------|------|
| {群名} | {oc_xxx} | {用途描述} | {agent-id-1}, {agent-id-2}, ... |

## 通信规则

1. **请求协助**：在协作群中 @对方角色名，说明需求和上下文
2. **任务交接**：将任务详情写入 `shared/handoff/{目标agent-id}/` 目录下，文件名格式 `YYYY-MM-DD-{简述}.md`
3. **禁止循环**：收到其他 Agent 转来的任务时，不得再转回发起者。如果处理不了，回复"超出能力范围"并建议人工介入
4. **信息隔离**：用户私聊中的敏感内容不得转发到协作群或共享文件，除非用户明确授权
```

### 6.2 创建员工记忆基础设施

每个新 Agent 上岗前，在其目录下创建记忆文件和目录：

```bash
mkdir -p agency-agents/{agent-id}/memory/lessons
touch agency-agents/{agent-id}/SESSION-STATE.md
touch agency-agents/{agent-id}/MEMORY.md
```

**SESSION-STATE.md 初始内容：**

```markdown
# SESSION-STATE.md -- {角色名} 工作内存

## 当前任务
[无]

## 关键上下文
[无]

## 待办事项
- [ ] 无

---
*初始化创建*
```

**MEMORY.md 初始内容：**

```markdown
# {角色名} 长期记忆

保持 5KB 以内。只保留有复用价值的内容。

## 工作模式
[待记录]

## 最佳实践
[待记录]

## 踩坑记录
[待记录]
```

### 6.3 注入记忆系统与团队意识

每个 Agent 的 `SOUL.md` 末尾必须追加 `references/SOUL-team-awareness.md` 中的完整片段。

该片段包含两部分：
1. **记忆系统** -- SESSION-STATE.md 用法、WAL 协议、日志写入规范、启动加载顺序
2. **团队协作** -- 工作原则、进度心跳、防循环规则、协作群配置

追加时，将花括号占位符替换为实际值（agent-id、角色名、群 ID、成员列表等）。

### 6.4 配置协作群

如果用户需要 Agent 之间通过飞书群实时沟通：

1. 用户在飞书中创建一个群，将所有 Agent 的机器人添加到群中
2. 为每个 Agent 配置群聊级绑定，指向同一个群 ID：

```bash
# 为 Agent A 添加协作群绑定
openclaw skills run feishu-bot-manager -- \
  --app-id cli_aaa --app-secret secret_a \
  --account-id bot-agent-a \
  --agent-id agent-a \
  --chat-id oc_team_group \
  --routing-mode group

# 为 Agent B 添加协作群绑定
openclaw skills run feishu-bot-manager -- \
  --app-id cli_bbb --app-secret secret_b \
  --account-id bot-agent-b \
  --agent-id agent-b \
  --chat-id oc_team_group \
  --routing-mode group
```

3. 更新 TEAM.md 中的"协作群"表格

### 6.5 文件协作通道

创建共享目录结构：

```
shared/
  handoff/           # 任务交接
    {agent-id}/      # 每个 agent 一个收件箱
  data/              # 共享数据
  reports/           # 共享报告
```

Agent 通过文件系统进行异步协作。写入 `shared/handoff/{目标agent-id}/` 即为向该 Agent 发起任务。

---

## 防循环机制

Agent 之间通信存在死循环风险。以下规则写入每个 Agent 的 SOUL.md：

1. **单次转发上限**：一个任务最多被转发 2 次（A->B->C 可以，A->B->C->D 不行）
2. **不回弹**：不得将任务转回给发起者
3. **人工兜底**：超过转发上限或无人能处理时，直接告知用户需要人工介入
4. **冷却期**：同一话题在协作群中被讨论超过 3 轮没有结论时，停止讨论并请求用户决策

---

## 配置结构

完成后 `openclaw.json` 的典型状态：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "CEO总指挥官",
        "workspace": "/root/.openclaw/workspace"
      },
      {
        "id": "engineering-senior-developer",
        "name": "bot-engineering-rapid-prototyper",
        "workspace": "/root/.openclaw/workspaces/engineering-senior-developer",
        "agentDir": "/root/.openclaw/agents/engineering-senior-developer/agent"

      }
    ]
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "xxx",
      "appSecret": "xxxx",
      "domain": "feishu",
      "accounts": {
        "bot-engineering-rapid-prototyper": {
          "appId": "xxx",
          "appSecret": "xxxx",
          "botName": "bot-engineering-rapid-prototyper",
          "dmPolicy": "open",
          "allowFrom": [
            "*"
          ],
          "enabled": true
        },
        "default": {
          "groupPolicy": "open"
        }
      }
    }
  },
  "bindings": [
    {
      "agentId": "engineering-rapid-prototyper",
      "match": {
        "channel": "feishu",
        "accountId": "bot-engineering-rapid-prototyper"
      }
    }
  ]
}
```

---

## Phase 7: 解雇员工

当 CEO 认为某个临时员工不再需要时，执行解雇流程。

### 解雇条件

- 临时员工的任务已完成
- CEO 向用户建议解雇，用户确认

### 执行步骤

1. 调用 CLI 解雇命令：

```bash
openclaw skills run feishu-bot-manager -- \
  --decommission \
  --account-id bot-xxx
```

2. CLI 会自动：
   - 禁用该飞书账户（设 `enabled: false`，不删除配置以便恢复）
   - 移除所有关联的 binding
   - 重启 Gateway

3. 手动更新 `TEAM.md`：将该员工状态改为 `decommissioned` 或从列表移除

4. 通知团队：如有协作群，告知其他员工该同事已离岗

### 恢复

如果需要重新启用已解雇的员工，手动将 `openclaw.json` 中该账户的 `enabled` 改回 `true`，重新添加 binding，然后重启 Gateway。或从备份恢复。

---

## CLI 参数参考

```bash
openclaw skills run feishu-bot-manager -- [options]
```

### 部署员工

| 参数 | 必填 | 说明 |
|------|------|------|
| --app-id | 是 | 飞书 App ID (cli_xxx) |
| --app-secret | 是 | 飞书 App Secret |
| --account-id | 否 | 账户标识，默认 bot-{timestamp} |
| --bot-name | 否 | 机器人名称 |
| --dm-policy | 否 | open/pairing/allowlist，默认 open |
| --agent-id | 否 | 绑定的 Agent ID |
| --chat-id | 否 | 群聊 ID (oc_xxx) |
| --routing-mode | 否 | account/group，默认 account |
| --workspace | 否 | 工作区根目录（默认当前目录；用于定位 agency-agents/） |
| --persona | 否 | 直接注入候选人人设/画像文本到该 Agent 的 SESSION-STATE.md 和 MEMORY.md |
| --persona-path | 否 | 从文件读取候选人人设/画像文本并注入（路径可为相对/绝对） |
| --need | 否 | 当未提供 persona 时：基于需求自动生成候选人人设/画像并注入（推荐） |
| --role-name | 否 | 自动生成画像时可用：角色中文名（更贴合） |
| --auto-persona | 否 | 强制启用自动生成画像（默认 false；仍需提供 need 才会生成） |

### 解雇员工

| 参数 | 必填 | 说明 |
|------|------|------|
| --decommission | 是 | 启用解雇模式 |
| --account-id | 是 | 要解雇的员工账户 ID |

---

## 注意事项

- **保留现有配置**：已有 appId/appSecret 和 bindings 不动
- **自动备份**：修改前自动备份 openclaw.json 到 `~/.openclaw/backups/`
- **dmScope**：自动设置为 `per-account-channel-peer`
- **重启 Gateway**：配置写入后自动重启，约 10-30 秒恢复
- **恢复**：如出问题可从备份恢复

---

## 快速场景参考

| 场景 | Phase 2 | Phase 3 | Phase 5 |
|------|---------|---------|---------|
| 飞书审批机器人 | 搜索 `engineering-feishu-*` | github | 账户级绑定 |
| 客服应答机器人 | 搜索 `support-*` | summarize, tencent-docs | 账户级绑定 |
| 营销内容助手 | 搜索 `marketing-content-*` | tencent-docs, tencent-cos-skill | 账户级绑定 |
| 团队协作群 | 选已上岗的多个 Agent | -- | 群聊级绑定到同一群 |
