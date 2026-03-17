# 踩坑和教训

记录所有犯过的错误，避免重复。

---

## 2026-03-17 feishu-bot-manager 删除主 Agent 问题

### 问题描述
使用 `feishu-bot-manager` 添加新的 bot (backend-dev) 后，CEO (main) agent 从配置中消失。

### 原因分析
初步怀疑是以下原因之一：
1. feishu-bot.sh 脚本在某个版本中可能覆盖了 agents.list 而不是追加
2. 配置文件被错误覆盖
3. openclaw doctor --fix 自动修复时可能影响了配置

### 解决方案
手动恢复 main agent 到配置：
```bash
jq '.agents.list = [{"id": "main", ...}, {"id": "backend-dev", ...}]' openclaw.json
```

### 预防措施
1. 添加 bot 前备份配置
2. 添加 bot 后检查 agents.list 是否完整
3. 更新 feishu-bot-manager 脚本，添加验证逻辑
