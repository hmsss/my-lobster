# Project Delivery Skill - 项目交付管理

统一管理项目产出物的提交和交付流程。

## 功能

1. **员工产出提交** - 员工完成任务后，将产出物提交到本地仓库
2. **CEO 验收交付** - CEO 验收通过后，统一推送到远程仓库
3. **项目状态跟踪** - 记录项目进度和交付状态

## 触发词

- `提交产出`
- `验收交付`
- `项目状态`
- `推送仓库`

## 使用方式

### 员工：提交产出

```
提交产出 {项目名}
```

示例：
```
提交产出 tank-battle
提交产出 snake-game
```

### CEO：验收交付

```
验收 {项目名}
交付 {项目名}
```

示例：
```
验收 tank-battle
交付 snake-game
```

### CEO：推送到远程

```
推送仓库
```

### 查看项目状态

```
项目状态
```

## 工作流程

```
员工完成任务 → 提交产出（本地 commit）→ CEO 验收 → 推送远程
```

## 目录结构

```
my-lobster/
└── projects/{project-slug}/
    ├── CEO/
    │   ├── project-overview.md
    │   └── progress.md
    ├── product-manager/
    │   ├── prd.md
    │   └── analysis.md
    ├── engineering-full-stack-developer/
    │   ├── index.html
    │   └── README.md
    ├── testing-senior-qa-engineer/
    │   └── test-report.md
    └── delivery/
        └── final-report.md
```

## Agent 职责

| 角色 | 职责 | Git 操作 |
|------|------|---------|
| 产品经理 | PRD + 需求分析 | 本地 commit |
| 全栈工程师 | 代码 + 文档 | 本地 commit |
| 测试工程师 | 测试报告 | 本地 commit |
| CEO | 验收 + 推送 | 验收后 push |

## 配置

项目仓库：`/root/.openclaw/workspace/my-lobster`
远程地址：`https://github.com/hmsss/my-lobster`
