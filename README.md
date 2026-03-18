# my-lobster

新装 OpenClaw（龙虾）的初始化工作区仓库。克隆到本地后作为 OpenClaw 工作区使用，即可获得预设的 Agent 身份、技能和「AI 无人公司」工作流。

## 仓库里有什么

- **工作区配置**：根目录的 `AGENTS.md`、`SOUL.md`、`USER.md`、`TEAM.md` 等，定义主 Agent 的加载规则、记忆和协作方式。
- **技能 (skills/)**：飞书机器人管理、心跳进度、公司初始化、记忆、搜索、文档等技能，按需由 Agent 调用。
- **人才市场 (agency-agents/)**：可招募的 Agent 目录，供「AI 无人公司」从市场雇佣或创建新员工。

## 使用方式

1. 将本仓库克隆到你的 OpenClaw 工作区目录（或把现有 OpenClaw 工作区指向本仓库路径）。
2. 启动 OpenClaw，主 Agent 会按 `AGENTS.md` 加载本工作区的身份与记忆。
3. 若希望以「AI 无人公司」模式运行（你当老板、Agent 当 CEO 调度员工），对 Agent 说：**初始化公司**、**启动 CEO 模式** 等，触发 `init-company` 技能，完成 CEO 身份与团队基础设施创建。
4. 之后通过「添加飞书机器人」「雇佣 agent」等触发 `feishu-bot-manager` 招募与部署员工。

## 目录结构概要

```
.
├── AGENTS.md          # 工作区规则（会话启动、记忆、红线）
├── SOUL.md            # 主 Agent 身份（初始化公司后为 CEO）
├── USER.md            # 用户/老板侧信息
├── TEAM.md            # 团队花名册（初始化后生成）
├── memory/            # 日记与长期记忆（初始化后生成）
├── agency-agents/     # 人才市场，可雇佣的 Agent
├── agents/            # 雇佣的 Agent（公司雇佣员工）
├── shared/            # 协作目录（初始化后生成：handoff/data/reports）
└── skills/            # 技能
    ├── init-company           # 公司初始化，主 Agent 变 CEO
    ├── feishu-bot-manager      # 飞书机器人/员工全生命周期
    ├── heartbeat               # 执行过程进度心跳
    ├── memory-lancedb-pro-skill-main  # 向量记忆技能（需配合插件）
    └── ...
```

## 依赖与前置

- 已安装并配置 OpenClaw，工作区指向本仓库根目录。
- 使用飞书相关技能前，需在飞书开放平台创建应用并配置好 App ID / App Secret。
- 使用 `memory-lancedb-pro` 语义记忆前，需安装对应插件并配置嵌入服务。

## 分支说明

默认分支为 `main`。克隆或拉取时使用 `main` 即可。
