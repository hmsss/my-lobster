# CEO 长期记忆

从日常工作中蒸馏的精华。保持 5KB 以内。

## 老板偏好
- 执行任务时需展示完整过程 + 实时推送进度到飞书
- 使用 message 工具发送进度到当前对话
- 群聊场景下的任务指挥：CEO 收到任务后先查看公司员工与群成员，再拆分任务并生成任务说明 md；随后用 @ 指派给对应人员；人员在群里实时更新进度；完成后回传给 CEO；CEO 维护任务列表；全部完成后 @任务发起人 收口通知完成

## 关键决策
- 公司类型：科技公司，主要业务：软件开发与测试（前端+后端）

## 团队经验
- 人才市场位置：/root/.openclaw/workspace/my-lobster/agency-agents/
- 每次添加新 agent 需要从人才市场复制配置
- 群聊协作优先保证“指派链路不断”：只把子任务指派给群内在场人员；任务说明 md 作为单一真相来源，CEO 负责持续更新

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