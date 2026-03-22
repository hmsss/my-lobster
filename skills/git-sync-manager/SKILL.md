---
name: git-sync-manager
description: Git 提交同步管理器。当用户要求"提交代码"时，将 skills/ 更新同步到 GitHub 仓库，仅追加/覆盖，不删除任何历史内容。
invocations:
  - words:
      - 提交代码
      - 同步到仓库
      - 推送到github
      - 提交skill
      - 同步更新
    description: 将本地 skills 更新同步到 GitHub 仓库，保留完整历史
---

# git-sync-manager

当用户要求"提交代码"时，执行以下流程。

## 核心原则

**三不原则：**
- ✅ **只追加/覆盖** — 新增或更新已有文件
- ❌ **绝不删除** — 不删除远程任何文件
- ✅ **留痕** — 每个变更单独提交，保留完整历史记录

## 同步范围

**仅同步 skills/ 目录**（除非用户明确指定其他目录）

## 执行流程

### 第一步：确认远程仓库地址

从以下两个来源获取：
1. 读取 `/root/.openclaw/workspace/.git/config` 中的 remote origin URL
2. 如果没有配置，询问用户 GitHub 仓库地址

### 第二步：获取 GitHub Token

从以下来源获取（按优先级）：
1. 读取 `/root/.openclaw/workspace/.git-credentials`（如果存在）
2. 询问用户提供 GitHub Personal Access Token
3. 格式：`https://{token}@github.com/{owner}/{repo}.git`

### 第三步：添加 Remote（如果尚未配置）

```bash
git remote add origin https://{token}@github.com/{owner}/{repo}.git
```

### 第四步：检查远程已有内容

```bash
git ls-remote origin main
git fetch origin main
```

确认远程分支状态，避免强制覆盖。

### 第五步：仅 add/update skills/ 目录

```bash
git add skills/
git status
```

**关键：只 add `skills/` 目录，不碰其他文件。**

### 第六步：检查变更内容

```bash
git diff --cached --stat
```

确认：
- 没有删除任何文件
- 仅有 skills/ 目录下的变更
- 如果有其他目录变更，只 add skills/ 相关文件

### 第七步：提交（保留完整历史）

```bash
git commit -m "feat/update: {skill名称} - {简短描述}"
git push origin main
```

**提交信息规范：**
- `feat: {skill名}` — 新增 skill
- `fix: {skill名}` — 修复/修正 skill
- `update: {skill名}` — 更新 skill 内容
- `sync: {skill名}` — 同步更新

### 第八步：验证推送成功

```bash
git log --oneline origin/main -3
```

确认提交已出现在远程。

## 防误操作规则

1. **不删除远程文件** — 任何情况下不执行 `git rm` 或 force push 删除远程内容
2. **不覆盖非 skills/ 目录** — 除非用户明确指定
3. **先 fetch 再操作** — 确保基于最新远程状态
4. **检查 remote reject** — 如果 push 被拒，说明有更新，先 pull 再合并

## 错误处理

### remote rejected（有更新）

```bash
git pull origin main --no-rebase --allow-unrelated-histories
# 解决冲突后重新推送
git push origin main
```

### token 无效

重新询问用户提供有效的 GitHub Token。

## 参考：GitHub Token 权限要求

需要 `repo` 权限（Full control of private repositories）才能 push。

Token 格式：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
