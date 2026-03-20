# Team Collab Skill - 团队协作规范

所有员工共享的协作规范，包括任务接收、进度汇报、状态管理。

## 触发词

- `收到任务`
- `进度汇报`
- `任务完成`
- `更新状态`

## 适用角色

- 产品经理 (product-manager)
- 全栈工程师 (engineering-full-stack-developer)
- 测试工程师 (testing-senior-qa-engineer)

## 工作流程

### 1. 接收任务

收到 CEO 任务后 **30 秒内必须确认**：

```javascript
await message({
  action: "send",
  channel: "feishu",
  target: "{群ID}",
  message: `✅ [{角色}] 收到任务

**任务**：{任务描述}
**预计完成**：{时间}`
});
```

### 2. 更新状态

开始工作时更新状态机：

```bash
jq '.agents."{agent-id}".status = "working"' /root/.openclaw/workspace/memory/task-state.json
```

### 3. 进度汇报

工作过程中每 **30 秒** 推送一次进度：

```javascript
await message({
  action: "send",
  channel: "feishu",
  target: "{群ID}",
  message: `🔄 [{角色}] 进度更新

**已完成**：{xxx}
**进行中**：{xxx}
**下一步**：{xxx}`
});
```

### 4. 任务完成

完成后汇报并更新状态：

```javascript
await message({
  action: "send",
  channel: "feishu",
  target: "{群ID}",
  message: `✅ [{角色}] 任务完成

**产出**：{文件列表}
@CEO 请检查。`
});
```

```bash
jq '.agents."{agent-id}".status = "completed"' /root/.openclaw/workspace/memory/task-state.json
```

## 项目目录结构

```
/root/.openclaw/workspace/my-lobster/projects/{project-slug}/
├── CEO/                    # 项目总览、进度
├── product-manager/        # PRD、需求分析
├── engineering-full-stack-developer/  # 代码、接口文档
├── testing-senior-qa-engineer/        # 测试用例、报告
└── delivery/               # 最终交付
```

## 禁止行为

- ❌ **禁止直接触发其他员工** - 产出交给 CEO 检查
- ❌ **禁止在消息里写长内容** - 详细内容写文档
- ❌ **禁止跳过 CEO** - 等待 CEO 检查通过

## 协作触发

使用 `sessions_send` 触发其他员工：

```javascript
sessions_send({
  sessionKey: "agent:{目标agent-id}:feishu:group:{群id}",
  message: "@{触发词} {任务内容}",
  timeoutSeconds: 120
})
```

**触发词映射**：
- `@产品经理` → product-manager
- `@全栈工程师` → engineering-full-stack-developer
- `@测试` → testing-senior-qa-engineer

## 角色产出

| 角色 | 必须产出 |
|------|---------|
| 产品经理 | prd.md, analysis.md |
| 全栈工程师 | 代码, api-docs.md, README.md |
| 测试工程师 | test-cases.md, test-report.md |
