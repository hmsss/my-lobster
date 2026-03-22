# 工时填报系统 - 项目总览

## 项目目标
开发一个 Web 版工时填报系统，支持员工记录工时、管理员查看统计。

## 项目范围

### 核心功能
1. **工时填报**
   - 选择项目/任务
   - 填写时长（小时）
   - 选择日期
   - 备注说明

2. **工时记录管理**
   - 查看个人工时记录
   - 编辑/删除记录
   - 按日期、项目筛选

3. **统计报表**
   - 个人工时统计（按周/月）
   - 团队工时统计（管理员）
   - 项目工时汇总
   - 数据导出（CSV/Excel）

4. **权限管理**
   - 员工：填报自己的工时
   - 管理员：查看团队数据、导出报表

### 技术栈
- **前端**：React/Vue + Ant Design/Element UI
- **后端**：Node.js + Express/Koa
- **数据库**：SQLite/MySQL
- **部署**：单机部署（Docker）

### 非功能需求
- 响应时间 < 1s
- 支持并发用户数：50
- 数据备份机制

## 里程碑

| 阶段 | 产出 | 负责人 | 截止时间 |
|------|------|--------|---------|
| 需求分析 | PRD、需求分析文档 | 产品经理 | Day 1 |
| 技术设计 | 架构设计、接口文档 | 全栈工程师 | Day 2 |
| 开发实现 | 可运行系统 | 全栈工程师 | Day 5 |
| 测试验收 | 测试报告 | 测试工程师 | Day 6 |
| 交付上线 | 最终报告 | CEO | Day 7 |

## 项目目录
```
projects/time-tracking-system/
├── CEO/
│   ├── project-overview.md      # 本文档
│   ├── progress.md              # 进度跟踪
│   └── decisions.md             # 决策记录
├── product-manager/
│   ├── prd.md                   # 产品需求文档
│   └── analysis.md              # 需求分析
├── engineering-full-stack-developer/
│   ├── api-docs.md              # 接口文档
│   ├── architecture.md          # 架构设计
│   └── code/                    # 代码目录
├── testing-senior-qa-engineer/
│   ├── test-cases.md            # 测试用例
│   ├── test-report.md           # 测试报告
│   └── bugs.md                  # 缺陷记录
└── delivery/
    └── final-report.md          # 最终交付报告
```

## 预期产出
1. 可运行的 Web 应用
2. 完整的源代码（GitHub）
3. 部署文档
4. 用户手册
