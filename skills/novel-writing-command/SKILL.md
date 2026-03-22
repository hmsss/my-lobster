---
name: novel-writing-command
description: 多Agent工作流规范。CEO 接收任务后理解需求、拆解分配，员工 A 执行、CEO 审核，不通过打回 A，通过后员工 B 优化/补全，CEO 最终审核。
invocations:
  - words:
      - 开始写小说
      - 写作任务
      - 长篇任务
      - 启动小说项目
      - 小说工作流
    description: 多Agent小说写作任务下达与执行统筹
---

# novel-writing-command

## 核心原则

**三层隔离：**
- 老板（韩猛） ↔ CEO（我）：任务下达 / 成果汇报
- CEO ↔ 员工：不直接沟通，通过 CEO 中转
- 员工之间：**不直接沟通**

**工作流核心：**
```
CEO 接收任务 → 理解需求 → 拆解分配
    ↓
员工 A 执行 → CEO 审核
    ├─ 不通过 → 打回 A 重做（循环，直到通过）
    └─ 通过
    ↓
员工 B 优化/补全 → CEO 最终审核
    ├─ 不通过 → 打回 A 重做 → A完成后 → CEO审核 → B继续
    └─ 通过 → 任务完成
    ↓
CEO 向老板汇报最终产物
```

---

## 流程详解

### Step 0：任务接收
CEO 接收老板的任务，先理解需求（题材/规模/方向），明确后才拆解。

### Step 1：CEO 任务拆解 & 分配

将任务拆解为阶段，确定员工角色：
- **员工 A**：策划/执行者（narrative-designer）
- **员工 B**：优化/补全者（novel-writer）

### Step 2：员工 A 执行

通过 `feishu_im_user_message` 以用户身份向员工 A 下达任务。

### Step 3：CEO 审核员工 A 的产出

CEO 检查：
- 交付物是否完整？
- 质量是否达标？
- 逻辑是否自洽？

**审核结果：**
- ❌ **不通过** → 打回员工 A 重做 → 回到 Step 3（循环）
- ✅ **通过** → Step 4

### Step 4：员工 B 优化/补全

CEO 向员工 B 下达任务。

### Step 5：CEO 最终审核员工 B 的产出

- ❌ **不通过** → 打回员工 A 重做 → A完成后 → CEO重审 → 回到 Step 4
- ✅ **通过** → Step 6

### Step 6：任务完成，CEO 向老板汇报

---

## 本次小说项目双阶段流程

### 阶段一：章纲策划（员工 A = narrative-designer）
```
CEO 下达任务 → narrative-designer 执行 → CEO 审核
    └─ 不通过 → 打回重做（循环）→ 通过后进入阶段二
```

### 阶段二：正文生成（员工 B = novel-writer）
```
CEO 下达任务 → novel-writer 执行 → CEO 最终审核
    └─ 不通过 → 打回 narrative-designer 重做 → 重审 → 继续novel-writer
```

---

## 审核清单（CEO 使用）

### 审核章纲/策划产出时
- [ ] 世界观设定完整且逻辑自洽？
- [ ] 人物弧光完整（动机/成长/结局）？
- [ ] 伏笔有埋有收？
- [ ] 章纲结构清晰、可执行？
- [ ] 字数/规模达标？

### 审核正文产出时
- [ ] 严格按章纲执行？
- [ ] 上下文逻辑自洽？
- [ ] 人物行为符合设定？
- [ ] 伏笔回收到位？
- [ ] 单章节字数达标（2000-5000字）？

---

## 共享工作空间

**根目录：** `/root/.openclaw/workspace/shared/workspace-novel/`

```
shared/workspace-novel/
  MEMORY.md              # 项目整体记忆
  progress.md            # 总进度追踪（CEO 更新）
  worldguide.md          # 世界观设定
  character-sheet.md      # 人物卡
  foreshadowing-map.md    # 伏笔地图
  outline.md              # 章纲
  state-snapshot.json    # 状态快照
  chapters/              # 正文目录
    001.md
    ...
  narrative-designer/
    progress.md
    SESSION-STATE.md
  novel-writer/
    progress.md
    SESSION-STATE.md
```

---

## 员工配置

| 员工 | 角色 | 飞书 Bot | 擅长领域 |
|------|------|---------|---------|
| narrative-designer | A（策划/执行） | cli_a927295acd38dcee | 世界观/章纲/伏笔 |
| novel-writer | B（优化/补全） | cli_a92317d3d5785cb6 | 正文批量生成 |
| content-planner | 支持 | cli_a92319273c78dcca | 题材研究 |

---

## 工作群

**群 ID：** `oc_ca8c8228db2c4628c5ab9715c7425896`

汇报时机：
- 每阶段审核通过后，在群里发进度
- 最终成果完成，向老板（韩猛）汇报
