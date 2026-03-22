---
name: novel-writing-command
description: 长篇小说协作写作工作流。CEO 下达任务给员工，CEO 审核每个产出物，通过后才进入下一步骤，形成「执行→审核→通过/打回」循环。
invocations:
  - words:
      - 开始写小说
      - 写作任务
      - 长篇任务
      - 启动小说项目
      - 小说工作流
    description: 长篇小说写作任务下达与执行统筹
---

# novel-writing-command

## 核心原则

**三层隔离：**
- 老板（韩猛） ↔ CEO（我）：任务下达 / 成果汇报
- CEO ↔ 员工：任务分配 / 审核产出 / 结果汇总
- 员工之间：**不直接沟通**，通过 CEO 中转

**工作流核心：每步必须 CEO 审核，通过才到下一步**

```
员工执行 → CEO 审核
    ├─ 通过 → 下一步或任务完成
    └─ 不通过 → 员工重新执行 → CEO 再次审核（循环直到通过）
```

---

## 标准工作流（员工执行阶段）

### Step 1：CEO 下达任务给员工 A

通过 `feishu_im_user_message` 以用户身份发送任务。

### Step 2：员工 A 执行

员工在自己的环境中完成任务。

### Step 3：CEO 审核员工 A 的产出

CEO 检查：
- 交付物是否完整？
- 质量是否达标？
- 是否有逻辑漏洞？

**审核结果：**
- ✅ **通过** → Step 4（下达任务给员工 B 或任务完成）
- ❌ **不通过** → Step 2（打回员工 A 重做，重新执行）

### Step 4（可选）：CEO 下达任务给员工 B

员工 B 开始执行。

### Step 5：CEO 审核员工 B 的产出

同上循环。

### Step 6：任务完成，CEO 向老板汇报

---

## 本次小说项目流程

**当前状态：等待 narrative-designer 完成**

### 阶段一：章纲策划（narrative-designer）
```
CEO 下达任务 → narrative-designer 执行 → CEO 审核
    ├─ 通过 → 阶段二
    └─ 不通过 → narrative-designer 重做 → CEO 再次审核
```

### 阶段二：正文生成（novel-writer）
```
CEO 下达任务 → novel-writer 执行 → CEO 审核
    ├─ 通过 → 继续下一批章节
    └─ 不通过 → novel-writer 重做 → CEO 再次审核
```

### 阶段三：终审（如有）
CEO 汇总全部成果，向老板汇报。

---

## 共享工作空间

**根目录：** `/root/.openclaw/workspace/shared/workspace-novel/`

```
shared/workspace-novel/
  MEMORY.md              # 项目整体记忆
  progress.md            # 总进度追踪（CEO 更新）
  worldguide.md          # 世界观设定（narrative-designer）
  character-sheet.md      # 人物卡（narrative-designer）
  foreshadowing-map.md    # 伏笔地图（narrative-designer）
  outline.md              # 章纲（narrative-designer）
  state-snapshot.json    # 状态快照
  chapters/              # 正文目录（novel-writer）
    001.md
    ...
  narrative-designer/
    progress.md           # 工作进度
    SESSION-STATE.md
  novel-writer/
    progress.md
    SESSION-STATE.md
  content-planner/
    progress.md
```

**进度文件实时更新规则：**
- 员工每次产出后立即更新自己的 `progress.md`
- CEO 审核通过后更新 `progress.md` 全局状态

---

## 员工配置

| 员工 | 飞书 Bot | 擅长领域 | 当前状态 |
|------|---------|---------|---------|
| narrative-designer | cli_a927295acd38dcee | 世界观/章纲/伏笔 | 🔄 章纲生成中 |
| novel-writer | cli_a92317d3d5785cb6 | 正文批量生成 | ⏳ 待启动 |
| content-planner | cli_a92319273c78dcca | 题材研究 | ⏳ 待命 |

---

## 审核清单（CEO 审核产出时使用）

- [ ] 交付物文件是否已写入正确路径？
- [ ] 内容是否完整（世界观/人物/章纲各要素齐全）？
- [ ] 逻辑是否自洽？（特别是世界观设定有无矛盾）
- [ ] 字数/规模是否达标？
- [ ] 伏笔是否有埋有收？
- [ ] 可以向老板汇报"通过"吗？

如有不通过，明确指出问题，打回员工重做。

---

## 工作群

**群 ID：** `oc_ca8c8228db2c4628c5ab9715c7425896`

**汇报时机：**
- 每个阶段审核通过后，在群里发进度汇报
- 最终成果完成后，向老板（韩猛）汇报
