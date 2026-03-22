# 任务分配表：方言音乐播放器

## 🎯 总任务
开发 Web 版音乐播放器，支持音乐播放 + 各地方言播放

---

## 📋 任务一：需求分析

**负责人**：<at id="ou_8e87857eac385d570500e70743bffb98"></at> 产品经理Alex

**任务内容**：
1. 梳理功能需求
   - 音乐播放模块：播放控制、列表管理、进度条、音量
   - 方言播放模块：省市区三级联动、地区选择、方言列表
2. 调研方言数据源
   - 是否有现成的方言音频 API？
   - 需要覆盖哪些省份/城市？
   - 音频格式、时长要求
3. 输出 PRD 文档
   - 文件位置：`product-manager/prd.md`
   - 包含：功能清单、用户故事、界面原型描述、数据需求

**产出文件**：
- `product-manager/prd.md`（必须）
- `product-manager/analysis.md`（可选，调研结果）

**截止**：今日内完成初稿

---

## 📋 任务二：技术方案与开发

**负责人**：<at id="ou_8ea89102d9cd89fd29c17319b003f0f5"></at> 全栈工程师

**任务内容**：
1. 等待 PRD 完成后，设计技术方案
2. 选型：前端框架、UI 库、音频播放方案
3. 开发实现
4. 输出接口文档、架构文档

**产出文件**：
- `engineering-full-stack-developer/architecture.md`（必须）
- `engineering-full-stack-developer/api-docs.md`（必须）
- `engineering-full-stack-developer/code/`（代码目录）

**截止**：待产品确认后开始

---

## 📋 任务三：测试验收

**负责人**：<at id="ou_4faa99d8c90c53496061c1a5f60b7d46"></at> 高级测试工程师

**任务内容**：
1. 等待开发完成后，编写测试用例
2. 执行功能测试
3. 输出测试报告

**产出文件**：
- `testing-senior-qa-engineer/test-cases.md`
- `testing-senior-qa-engineer/test-report.md`

**截止**：待开发完成后开始

---

## 📁 项目目录
```
/root/.openclaw/workspace/my-lobster/projects/dialect-music-player/
├── CEO/                     # 项目总览、进度
├── product-manager/         # 产品需求
├── engineering-full-stack-developer/  # 开发
├── testing-senior-qa-engineer/        # 测试
└── delivery/                # 最终交付
```

---

## 📌 协作规则
1. 完成任务后在群里汇报进度
2. 有问题及时 @CEO 沟通
3. 文档放在对应目录，不要放错
