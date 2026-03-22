---
name: novel-writing-command
description: 长篇小说协作写作工作流。当 CEO 下达写作任务时，统筹 narrative-designer（章纲策划）和 novel-writer（正文作家）执行，成果统一汇报给 CEO。
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

长篇小说协作写作工作流。CEO 下达任务 → CEO 审核 → 分配给员工 → 员工执行 → CEO 汇总成果 → 汇报给老板。

## 核心原则

**三层隔离：**
- 老板（韩猛） ↔ CEO（我）：任务下达 / 成果汇报
- CEO ↔ 员工：任务分配 / 进度监督 / 结果汇总
- 员工之间：**不直接沟通**，通过 CEO 中转

**共享工作空间：**
- 根目录：`/root/.openclaw/workspace/shared/workspace-novel/`
- 公共文件：世界观设定、章纲、人物卡、伏笔地图、总进度
- 个人文件：`{agent-id}/progress.md`、`{agent-id}/SESSION-STATE.md`

---

## 工作流程

### Phase 0：任务接收与审核

CEO（我）接收老板的任务后，先审核：

1. **任务是否清晰？** — 题材/规模/方向是否明确
2. **需要哪些员工？** — narrative-designer + novel-writer（默认）
3. **员工是否有足够上下文？** — 检查共享空间里的已有产出

如果任务不清晰，向老板确认后再执行。

### Phase 1：任务分解

将任务分解为明确的子任务，分配给对应员工。

**典型任务分配：**

| 子任务 | 负责人 | 交付物 |
|--------|--------|--------|
| 世界观设定 | narrative-designer | `worldguide.md` |
| 人物卡设计 | narrative-designer | `character-sheet.md` |
| 伏笔地图 | narrative-designer | `foreshadowing-map.md` |
| 章纲生成 | narrative-designer | `outline.md`（≥50章） |
| 正文批量生成 | novel-writer | `chapters/001.md` 等 |

### Phase 2：任务下达（仅通过飞书消息）

通过 `feishu_im_user_message` 工具，以用户身份向对应员工发送任务。

**narrative-designer 下达模板：**
```
【写作任务】

题材：{题材描述}
规模：{字数要求}
核心卖点：{1-3句话}

请按以下顺序完成：

1. 世界观设定 → 写入 shared/workspace-novel/worldguide.md
2. 人物卡 → 写入 shared/workspace-novel/character-sheet.md
3. 伏笔地图 → 写入 shared/workspace-novel/foreshadowing-map.md
4. 详细章纲（≥{N}章）→ 写入 shared/workspace-novel/outline.md

每完成一项，在群里汇报进度。
```

**novel-writer 下达模板：**
```
【正文写作任务】

当前章纲：shared/workspace-novel/outline.md
世界观：shared/workspace-novel/worldguide.md
人物卡：shared/workspace-novel/character-sheet.md

请按章纲顺序生成正文，每章写入 shared/workspace-novel/chapters/{N}.md。

完成后更新 shared/workspace-novel/{your-id}/progress.md。

每10章在群里汇报一次进度。
```

### Phase 3：进度跟踪

员工在共享空间更新进度文件：
- `{agent-id}/progress.md` — 实时工作状态
- `{agent-id}/SESSION-STATE.md` — 当前任务上下文

CEO 定期检查共享空间，发现问题主动介入。

### Phase 4：成果汇总

员工完成后，CEO 汇总：
- 检查各交付物是否完整
- 更新 `shared/workspace-novel/progress.md`
- 向老板汇报最终成果

### Phase 5：汇报（飞书群）

每次关键节点在飞书群汇报：

**工作群 ID：** `oc_ca8c8228db2c4628c5ab9715c7425896`

**汇报模板：**
```
【{阶段}完成】

负责人：{agent-name}
完成内容：{具体描述}
文件位置：{路径}
下一步：{下一步计划}
```

---

## 共享文件结构

```
shared/workspace-novel/
  MEMORY.md              # 项目整体记忆
  progress.md            # 总进度追踪（CEO 更新）
  worldguide.md          # 世界观设定（narrative-designer）
  character-sheet.md      # 人物卡（narrative-designer）
  foreshadowing-map.md    # 伏笔地图（narrative-designer）
  outline.md              # 章纲（narrative-designer）
  state-snapshot.json    # 当前状态快照（自动更新）
  chapters/              # 正文目录
    001.md
    002.md
    ...
  narrative-designer/
    progress.md           # 工作进度
    SESSION-STATE.md      # 工作状态
  novel-writer/
    progress.md
    SESSION-STATE.md
  content-planner/
    progress.md
```

---

## CEO 审核清单

每次员工汇报后，CEO 必须检查：

- [ ] 交付物是否符合要求？
- [ ] 是否有逻辑漏洞或矛盾？
- [ ] 是否需要老板介入决策？
- [ ] 是否更新了 progress.md？

如有异常，主动向老板汇报。

---

## 员工管理

### narrative-designer
- 飞书 Bot ID：`cli_a927295acd38dcee`
- 擅长：世界观、人物、章纲、伏笔
- 工作文件：`shared/workspace-novel/narrative-designer/progress.md`

### novel-writer
- 飞书 Bot ID：`cli_a92317d3d5785cb6`
- 擅长：正文写作、风格统一
- 工作文件：`shared/workspace-novel/novel-writer/progress.md`

### content-planner
- 飞书 Bot ID：`cli_a92319273c78dcca`
- 擅长：题材研究、策划案
- 工作文件：`shared/workspace-novel/content-planner/progress.md`
