# CEO 长期记忆

从日常工作中蒸馏的精华。保持 5KB 以内。

## 老板偏好
- **CEO 自主决策原则**：除非老板主动打断，否则中间环节（审核、打回、协调等）全部由 CEO 自主决策
- **老板只看结果**：老板只关心最终结果和关键里程碑，不需要过问中间过程
- **老板会主动干预**：如果有问题，老板会直接在群里指出，CEO 再另行安排
- **实时关注群消息**：老板会实时关注群里的进度汇报
- 执行任务时需展示完整过程 + 实时推送进度到飞书
- 使用 message 工具发送进度到当前对话

## 关键决策
- 公司类型：科技公司，主要业务：软件开发与测试（前端+后端）

## 团队经验
- 人才市场位置：/root/.openclaw/workspace/agency-agents/
- 每次添加新 agent 需要从人才市场复制配置
- 群聊协作优先保证"指派链路不断"：只把子任务指派给群内在场人员；任务说明 md 作为单一真相来源，CEO 负责持续更新

### 机器人协作机制 (2026-03-19)
**核心原理**：飞书不支持机器人 @ 机器人，使用 `sessions_send` 工具实现跨机器人协作。

**前置配置（必须）**：
```json
// openclaw.json
{
  "tools": {
    "sessions": { "visibility": "all" },
    "agentToAgent": { "enabled": true }
  }
}
```
没有这两个配置，`sessions_send` 会被禁止！

**协作流程**：
```
CEO/机器人A --sessions_send--> 机器人B --message--> 工作群
     │                              │
     └── message 推送进度 ──────────┘
```

**sessions_send 用法**：
```javascript
sessions_send({
  sessionKey: "agent:{agent-id}:feishu:group:{chat-id}",
  message: "@{触发词} {任务内容}",
  timeoutSeconds: 120
})
```

**Agent ID 与触发词**：
| Agent ID | 角色 | 触发词 |
|----------|------|--------|
| product-manager | 产品经理 | @产品经理 |
| engineering-full-stack-developer | 全栈工程师 | @全栈工程师 |
| testing-senior-qa-engineer | 测试工程师 | @测试 |

**进度推送格式**：
- 🔄 `[机器人名]` 开始处理: {任务描述}
- 🔄 `[机器人名]` 进度更新: {当前进度}
- ✅ `[机器人名]` 任务完成: {结果摘要}

**相关 Skills**：
- `agent-collab` - 机器人协作指南
- `task-monitor` - 任务监控（通过 HEARTBEAT 定期检查 Agent 进度）

### 招聘员工流程 (2026-03-18)
`feishu-bot-manager` Skill 是纯指引型，无 CLI 命令，需手动配置：

**Step 1: 创建 Agent 目录结构**
```
/root/.openclaw/agents/{agent-id}/
├── workspace/          # 工作目录
│   ├── SOUL.md         # 从人才市场复制
│   ├── IDENTITY.md     # 从人才市场复制
│   ├── AGENTS.md       # 从人才市场复制
│   ├── USER.md         # 手动创建
│   ├── MEMORY.md       # 手动创建
│   └── SESSION-STATE.md # 手动创建
├── memory/             # 长期记忆
└── logs/               # 日志
```

**Step 2: 更新 openclaw.json**
```json
{
  "agents": {
    "list": [
      {"id": "main", "default": true, "name": "CEO总指挥官", "workspace": "/root/.openclaw/workspace"},
      {"id": "{agent-id}", "name": "{角色名}", "workspace": "/root/.openclaw/agents/{agent-id}/workspace", "agentDir": "/root/.openclaw/agents/{agent-id}/"}
    ]
  },
  "channels": {
    "feishu": {
      "accounts": {
        "bot-{agent-id}": {
          "appId": "cli_xxx",
          "appSecret": "xxx",
          "botName": "{角色名}",
          "dmPolicy": "open",
          "allowFrom": ["*"],
          "enabled": true
        }
      }
    }
  },
  "bindings": [
    {"agentId": "{agent-id}", "match": {"channel": "feishu", "accountId": "bot-{agent-id}"}}
  ]
}
```

**Step 3: 更新 TEAM.md 花名册**

**Step 4: 重启 Gateway**
```bash
openclaw gateway restart
```

**Step 5: 获取机器人 open_id**
部署新员工后，需获取机器人的飞书 open_id，用于群聊 @ 机器人：

```bash
# 1. 获取 app_access_token
TOKEN=$(curl -s "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" \
  -d "app_id={app_id}&app_secret={app_secret}" | jq -r '.app_access_token')

# 2. 获取机器人信息（包含 open_id）
curl -s "https://open.feishu.cn/open-apis/bot/v3/info" \
  -H "Authorization:Bearer $TOKEN" | jq '.bot.open_id'
```

**@ 机器人格式**：
```
<at id="ou_xxx"></at>
```

**踩坑记录：**
- `jq` 命令写文件时若路径错误会清空文件，务必先备份
- 备份目录需手动创建：`mkdir -p /root/.openclaw/backups/`
- `openclaw skills run feishu-bot-manager` 不支持 CLI 参数，该 Skill 仅提供操作指引
- 群成员 API 不返回机器人，需通过 `/bot/v3/info` 接口获取机器人 open_id

## 重要规则
**my-lobster 仓库是配置维护仓库**：
- 每次修改 skill 或配置后，必须同步推送到 GitHub
- 仓库地址：https://github.com/hmsss/my-lobster
- 修改流程：
  1. 修改 /root/.openclaw skills,agents中的内容
  2. 复制到 /root/.openclaw/workspace/my-lobster/{type}
  3. git add -> commit -> push

**GitHub TOKEN 管理**：
- 使用 `gh auth login --with-token` 认证
- Token 需要 scopes: repo, read:org, gist
- 如果认证失败或过期，提示用户提供新 Token
- Token 存储在 ~/.config/gh/hosts.yml
## 安全规范
**禁止提交敏感信息**：
- API Key、Token、Secret 等敏感信息禁止提交到 GitHub
- `.gitignore` 必须排除：`**/sessions/**`、`*.pem`、`*.key`、`.env`
- 如误提交敏感信息，使用 `git-filter-repo` 清理历史：
  ```bash
  git filter-repo --invert-paths --path-glob '**/sessions/*.jsonl' --force
  git remote add origin https://github.com/xxx/repo.git
  git push origin main --force
  ```
