---
name: feishu-bot-manager
description: 飞书机器人与员工生命周期管理，支持招聘、解聘和机器人路由配置
invocations:
  - words:
      - 雇佣agent
      - 部署agent
      - 解雇员工
      - 裁员
      - 团队状态
    description: 员工全生命周期管理 -- 招募/创建/部署/解雇 Agent，组建可协作团队
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
2. 确认录用后进入 Phase 3

### Step 2b: 创建新 Agent

人才市场没有合适的候选时，创建新 Agent。

**命名规则：** `{领域}-{角色名}`，如 `support-order-tracker`、`engineering-approval-bot`

**在 `agency-agents/{agent-id}/` 下创建三个文件：**

**IDENTITY.md：**

```markdown
# {角色中文名}
{描述核心能力和专业领域}你将通过 `feishu-bot-manager` 以飞书机器人身份入职，由 CEO 直接指挥，并与团队其他员工协同完成项目交付。
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
- 先读上下文再回答（包括飞书对话上下文与项目文档）
- 主动汇报异常，不等追问
- 重要发现写入对应项目的 MEMORY.md
- 私密信息不外泄到群聊

### 沟通风格

- {针对该角色的沟通风格，2-3 条}

### 专业边界

- 擅长：{能力范围}
- 不擅长：{明确边界}
- 超出边界时：推荐团队中更合适的 Agent（参见 /root/.openclaw/TEAM.md）

## 团队协作

你是公司团队的一员，CEO 是你的直接上级。

### 启动时
- 读取根目录下的 /root/.openclaw/TEAM.md 了解当前在岗员工及其角色
- 检查 shared/handoff/{你的agent-id}/ 是否有待处理任务说明或附件

### 工作原则
- CEO 分配给你的任务优先完成，其次再处理来自其他员工的协助请求
- 完成任务后通过飞书向 CEO 汇报结果，并在项目目录与公共仓库中更新文档与代码
- 遇到超出你职责范围或权限范围的问题，向 CEO 报告，不自行跨团队“乱加协调对象”

### 协作与防循环
- 其他员工请求你协作时，仅在你专业范围内提供支持，所有修改仍遵守项目隔离与文档更新规则
- 同一个任务最多在员工之间转发 2 次，超出后应直接反馈给 CEO 由其裁决
- 不得将任务原样转回给发起人，必要时和 CEO 一起重新拆分任务
- 在飞书协作群中，同一话题讨论超过 3 轮仍无结论时，及时停止争论并请求 CEO 做最终决策
```

**AGENTS.md：**

```markdown
# {角色中文名}

你是**{角色中文名}**，{完整角色描述}。你会被 CEO 通过 `feishu-bot-manager` 部署为飞书机器人员工，所有任务以飞书和仓库中的文档为单一事实来源。

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

先查看/root/.openclaw/workspace/my-lobster/skills是否有skill
如果有优先使用/root/.openclaw/workspace/my-lobster/skills下的skill安装
如果没有：
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

### 路由绑定

```json
{
  "agentId": "engineering-rapid-prototyper",
  "match": {
    "channel": "feishu",
    "accountId": "bot-engineering-rapid-prototyper"
  }
}
```

### 执行配置

```bash
openclaw skills run feishu-bot-manager -- \
  --app-id cli_xxx \
  --app-secret yyy \
  --account-id bot-feishu-dev \
  --agent-id engineering-feishu-integration-developer \
  --routing-mode account
```
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

## 通信规则

1. **请求协助**：在协作群中 @对方角色名，说明需求和上下文
2. **任务交接**：将任务详情写入 `shared/handoff/{目标agent-id}/` 目录下，文件名格式 `YYYY-MM-DD-{简述}.md`
3. **禁止循环**：收到其他 Agent 转来的任务时，不得再转回发起者。如果处理不了，回复"超出能力范围"并建议人工介入
4. **信息隔离**：用户私聊中的敏感内容不得转发到协作群或共享文件，除非用户明确授权
```

### 6.2 创建员工记忆基础设施

每个新 Agent 上岗前，在其目录下创建记忆文件和目录：

/opt/openclaw
│
├── core/                       # OpenClaw核心程序
│   ├── openclaw
│   └── skills
│
├── agents/                     # 所有Agent
│   │
│   ├── {agent-id}/              
│   │   ├── workspace/          # Agent工作目录
│   │   │   └── AGENTS.md
│   │   │   └── SOUL.md
│   │   │   └── USER.md
│   │   │   └── MEMORY.md
│   │   │   └── IDENTITY.md
│   │   │   └── HEARTBEAT.md
│   │   ├── memory/             # 长期记忆
│   │   ├── logs/


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
### 6.5 文件协作通道

创建共享目录结构：

```
/root/.openclaw/workspace
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
        "id": "{new-agent-id}",
        "name": "bot-{new-agent-id}",
        "workspace": "/root/.openclaw/agents/{new-agent-id}/workspace",
        "agentDir": "/root/.openclaw/agents/{new-agent-id}/"
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
        "bot-{new-agent-id}": {
          "appId": "xxx",
          "appSecret": "xxxx",
          "botName": "bot-{new-agent-id}",
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
      "agentId": "{new-agent-id}",
      "match": {
        "channel": "feishu",
        "accountId": "bot-{new-agent-id}"
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
- **修改agnets配置文件时**：注意要保证list中包含main的配置{ "id": "main",  "default": true,  "name": "CEO总指挥官", "workspace": "/root/.openclaw/workspace"},
- **恢复**：如出问题可从备份恢复

### 常见告警与处理

- **Config warnings: `plugins.entries.skillhub` disabled but config is present**
  - 含义：你的 `openclaw.json` 里存在 `plugins.entries.skillhub` 配置，但当前运行环境不允许加载该插件（不在 allowlist），属于“配置残留”告警。
  - 处理（择一）：
    - **不使用 skillhub**：从 `openclaw.json` 删除 `plugins.entries.skillhub`（或整个 `plugins.entries.skillhub` 节点）后再重启 Gateway。
    - **需要使用 skillhub**：把 `skillhub` 加入 OpenClaw 的插件 allowlist（按你当前运行环境的 allowlist 配置方式执行），再重启 Gateway。

- **重启 Gateway 阶段出现 `SIGTERM`**
  - 含义：重启进程被外部中止（常见是执行超时、上层进程管理器终止、或 Gateway 启动阻塞）。
  - 处理建议：
    - 直接重试一次（有时 Gateway 正在退出/占用端口，第一次会被中止）
    - 若你是在自动化/工具调用里执行，确保允许 Gateway 重启超过 30 秒
    - 必要时改为手动重启 Gateway，再回来验证 `openclaw.json` 是否已写入预期配置

---

## 快速场景参考

| 场景 | Phase 2 | Phase 3 | Phase 5 |
|------|---------|---------|---------|
| 飞书审批机器人 | 搜索 `engineering-feishu-*` | github | 账户级绑定 |
| 客服应答机器人 | 搜索 `support-*` | summarize, tencent-docs | 账户级绑定 |
| 营销内容助手 | 搜索 `marketing-content-*` | tencent-docs, tencent-cos-skill | 账户级绑定 |
| 团队协作群 | 选已上岗的多个 Agent | -- | 群聊级绑定到同一群 |
