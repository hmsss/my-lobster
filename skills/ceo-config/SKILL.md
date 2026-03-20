# CEO Config Skill - CEO 配置管理

管理 CEO 的工作配置，包括 watcher 推送目标、项目仓库等。

## 触发词

- `设置推送目标`
- `watcher 状态`
- `重载配置`

## 使用方式

### 设置推送目标

```
设置推送目标 {角色} {群聊ID}
```

示例：
```
设置推送目标 产品经理 oc_ca8c8228db2c4628c5ab9715c7425896
设置全栈工程师 oc_xxx
```

### 协作任务（批量设置）

```
协作任务 推送到 {群聊ID}
```

示例：
```
协作任务 推送到 oc_ca8c8228db2c4628c5ab9715c7425896
```

### 查看 watcher 状态

```
watcher 状态
```

### 重载 watcher 配置

```
重载 watcher 配置
```

### 清除推送目标

```
清除推送目标 {角色}
```

## 配置文件位置

- Watcher 配置：`/root/.openclaw/workspace/watcher/config.json`
- 项目仓库：`/root/.openclaw/workspace/my-lobster`

## Agent ID 映射

| 角色 | Agent ID |
|------|----------|
| 产品经理 | product-manager |
| 全栈工程师 | engineering-full-stack-developer |
| 测试工程师 | testing-senior-qa-engineer |
| CEO | main |

## ID 格式

- 群聊：`oc_xxx`
- 私聊：`ou_xxx`
