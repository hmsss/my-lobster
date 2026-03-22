# Task Watcher Skill

配合 watcher 服务，实现协作任务的通知精准推送。

## 触发词

- 设置推送目标、设置 watcher 掌握推送目标、 watcher 状态 }
- 重载配置
- 测试推送

## 快速使用

### 设置推送目标

```
设置 {角色} 推送到 {群聊ID/私聊ID}
```

示例：
- 设置产品经理推送到群 oc_ca8c8228db2c4628c5ab9715c7425896
- 设置全栈工程师推送到私聊 ou_xxx

### 查看 watcher 状态

```
watcher 状态
```

### 重载配置

```
重载 watcher 配置
```

### 清除所有目标

```
清除所有推送目标
```

## 配置文件位置

`/root/.openclaw/workspace/watcher/config.json`

## Agent ID 映射

| 角色 | Agent ID |
|------|----------|
| 产品经理 | product-manager |
| 全栈工程师 | engineering-full-stack-developer |
| 测试工程师 | testing-senior-qa-engineer |

## ID 格式

- 群聊：`oc_xxx` (32 位十六进制)
- 私聊：`ou_xxx` (32 位十六进制)
