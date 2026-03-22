---
name: feishu-bot-manager
description: 飞书机器人与员工生命周期管理，支持招聘、解雇和机器人路由配置
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
4. 向用户展示 Top 3-5 候选人

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
- 读取 `/root/.openclaw/TEAM.md` 了解当前在岗员工及其角色
- 检查 `shared/handoff/{你的agent-id}/` 是否有待处理任务说明或附件

### 工作原则
- CEO 分配给你的任务优先完成，其次再处理来自其他员工的协助请求
- 完成任务后通过飞书向 CEO 汇报结果，并在项目目录与公共仓库中更新文档与代码
- 遇到超出你职责范围或权限范围的问题，向 CEO 报告，不自行跨团队"乱加协调对象"

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

以上仅为参考。根据 Agent 的实际职责灵活判断，一个 Agent 可以装备多个技能。

**安装命令：**

先查看 `/root/.openclaw/workspace/my-lobster/skills` 是否有 skill，如果有优先使用；否则：
```bash
openclaw skills install <skill-name>
```

---

## Phase 4: 飞书应用配置

用户需要在飞书开放平台为该 Agent 创建一个独立的飞书应用，并提供以下凭证：

| 参数 | 必填 | 说明 |
|------|------|------|
| App ID | 是 | 飞书应用 ID，格式 `cli_xxx` |
| App Secret | 是 | 飞书应用密钥 |
| 机器人名称 | 否 | 默认使用 Agent 的中文角色名 |
| DM 策略 | 否 | `open`/`pairing`/`allowlist`，默认 `open` |

---

## Phase 5: 绑定上岗

**重要：** `openclaw skills run feishu-bot-manager` 不支持 `--app-id` 等参数，无法用 CLI 部署。必须手动编辑 `openclaw.json`。

### 步骤一：备份配置

```bash
mkdir -p ~/.openclaw/backups
cp ~/.openclaw/openclaw.json ~/.openclaw/backups/openclaw.json.$(date +%Y-%m-%d).bak
```

### 步骤二：修改 openclaw.json

需要修改三个地方：`channels.feishu`、`agents.list`、`bindings`。

**修改前的 channels.feishu 结构（单账户模式）：**
```json
"channels": {
  "feishu": {
    "enabled": true,
    "appId": "cli_xxx",        ← 删除
    "appSecret": "xxx",        ← 删除
    "domain": "feishu",
    "groupPolicy": "open",
    ...
  }
}
```

**修改后的 channels.feishu 结构（多账户模式）：**
```json
"channels": {
  "feishu": {
    "enabled": true,
    "domain": "feishu",
    "defaultAccount": "main",
    "groupPolicy": "open",
    "streaming": true,
    "footer": {
      "elapsed": true,
      "status": true
    },
    "accounts": {
      "main": {
        "appId": "cli_主应用ID",
        "appSecret": "主应用Secret",
        "botName": "主应用机器人名称"
      },
      "{agent-id}": {
        "appId": "cli_新应用ID",
        "appSecret": "新应用Secret",
        "botName": "机器人名称"
      }
    }
  }
}
```

**在 `agents.list` 中追加新 Agent：**
```json
"agents": {
  "defaults": { ... },
  "list": [
    {
      "id": "main",
      "default": true,
      "name": "CEO总指挥官",
      "workspace": "/root/.openclaw/workspace"
    },
    {
      "id": "{agent-id}",
      "name": "{机器人名称}",
      "workspace": "/root/.openclaw/workspace/agency-agents/{agent-id}/workspace",
      "agentDir": "/root/.openclaw/workspace/agency-agents/{agent-id}"
    }
  ]
}
```

**在 `bindings` 中追加路由规则：**
```json
"bindings": [
  {
    "agentId": "main",
    "match": {
      "channel": "feishu",
      "accountId": "main"
    }
  },
  {
    "agentId": "{agent-id}",
    "match": {
      "channel": "feishu",
      "accountId": "{agent-id}"
    }
  }
]
```

### 步骤三：创建员工 workspace 目录

```bash
mkdir -p /root/.openclaw/workspace/agency-agents/{agent-id}/workspace
cp /root/.openclaw/workspace/agency-agents/{agent-id}/AGENTS.md \
   /root/.openclaw/workspace/agency-agents/{agent-id}/SOUL.md \
   /root/.openclaw/workspace/agency-agents/{agent-id}/IDENTITY.md \
   /root/.openclaw/workspace/agency-agents/{agent-id}/MEMORY.md \
   /root/.openclaw/workspace/agency-agents/{agent-id}/workspace/
```

### 步骤四：重启 Gateway

```bash
openclaw gateway restart
```

等待约 10-30 秒后验证配置是否生效。

---

## Phase 6: 团队组网

### 6.1 更新团队花名册

`TEAM.md` 每次有新 Agent 上岗必须更新：

```markdown
| Agent ID | 角色 | 类型 | 飞书 Bot | 擅长领域 | 状态 |
|----------|------|------|---------|---------|------|
| (CEO) | 总指挥官 | permanent | 主 Agent | 任务分析、人员调度、团队管理 | active |
| {agent-id} | {角色名} | permanent/temporary | {account-id} | {核心能力} | active |
```

### 6.2 创建记忆基础设施

```bash
mkdir -p /root/.openclaw/workspace/agency-agents/{agent-id}/memory/lessons
touch /root/.openclaw/workspace/agency-agents/{agent-id}/SESSION-STATE.md
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

### 6.3 文件协作通道

创建共享目录结构：
```
/root/.openclaw/workspace/
shared/
  handoff/
    {agent-id}/      # 每个 agent 一个任务收件箱
  data/              # 共享数据
  reports/           # 共享报告
```

```bash
mkdir -p /root/.openclaw/workspace/shared/handoff/{agent-id}
mkdir -p /root/.openclaw/workspace/shared/data
mkdir -p /root/.openclaw/workspace/shared/reports
```

---

## 防循环机制

1. **单次转发上限**：一个任务最多被转发 2 次
2. **不回弹**：不得将任务转回给发起者
3. **人工兜底**：超过转发上限或无人能处理时，直接告知用户需要人工介入
4. **冷却期**：协作群中同一话题讨论超 3 轮没有结论时，停止并请求 CEO 决策

---

## Phase 7: 解雇员工

### 执行步骤

1. CEO 向用户建议解雇，用户确认
2. 手动修改 `openclaw.json`：
   - 将该账户的 `enabled` 设为 `false`（不删除配置以便恢复）
   - 从 `bindings` 中移除该 Agent 的绑定
3. 更新 `TEAM.md`：将该员工状态改为 `decommissioned` 或移除
4. 通知团队（若有协作群）
5. 重启 Gateway：`openclaw gateway restart`

### 恢复

如果需要重新启用，将 `openclaw.json` 中该账户的 `enabled` 改回 `true`，重新添加 binding，然后重启 Gateway。

---

## 快速场景参考

| 场景 | Phase 2 | Phase 3 | Phase 5 |
|------|---------|---------|---------|
| 飞书审批机器人 | 搜索 `engineering-feishu-*` | github | 手动配置 openclaw.json |
| 客服应答机器人 | 搜索 `support-*` | summarize, tencent-docs | 手动配置 openclaw.json |
| 营销内容助手 | 搜索 `marketing-content-*` | tencent-docs, tencent-cos-skill | 手动配置 openclaw.json |
| 团队协作群 | 选已上岗的多个 Agent | -- | 群聊级绑定 |

---

## 注意事项

- **必须手动编辑 openclaw.json**：`openclaw skills run feishu-bot-manager -- --app-id ...` 不支持部署参数，无法用于绑定 Agent
- **保留现有配置**：已有 appId/appSecret 和 bindings 不动
- **必须包含 main Agent**：`agents.list` 中必须包含 main 的配置
- **先备份再修改**：每次改 openclaw.json 前先备份
- **重启 Gateway**：配置写入后必须重启才能生效，约 10-30 秒恢复
- **恢复**：如出问题可从 `~/.openclaw/backups/` 恢复

### 常见告警与处理

- **Config warnings: `plugins.entries.skillhub` disabled but config is present**
  - 含义：`openclaw.json` 里存在 `plugins.entries.skillhub` 配置，但当前环境不允许加载该插件
  - 处理：从 `openclaw.json` 删除 `plugins.entries.skillhub` 节点后重启 Gateway

- **重启 Gateway 阶段出现 `SIGTERM`**
  - 含义：重启进程被外部中止（端口占用、执行超时）
  - 处理：直接重试一次；或手动 `openclaw gateway stop` 后再 `openclaw gateway start`
