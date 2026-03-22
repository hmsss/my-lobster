---
name: novel-writing-command
description: 多Agent小说写作工作流。CEO调度+双阶段执行+实时播报，所有角色在群内实时汇报，禁止静默执行。
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

**🚨 强制规则：禁止静默执行，所有关键动作必须群内实时播报**

---

## 标准工作流

```
老板下达任务
↓
CEO 接收 → 理解需求 → 拆解分配
↓
员工 A 执行 → CEO 审核
    ├─ 不通过 → 打回 A 重做（带修改方向）→ 循环
    └─ 通过
↓
员工 B 执行（优化/补全）→ CEO 最终审核
    ├─ 不通过 → ❗回退 A 重做 → A完成后 → CEO重审 → B继续
    └─ 通过 → 任务完成
↓
CEO 向老板汇报最终产物
```

---

## 🚨 强制规则

1. **不允许静默** — 每个关键动作必须群内播报
2. **CEO 必须给结构化反馈** — 禁止"不行"/"再改改"，必须：问题点 + 修改建议
3. **所有失败必须回到 A** — B 不修 Bug，A 负责兜底
4. **输出必须可交付** — 可运行/可验证/有结果

---

## 📢 播报规范

**工作群 ID：** `oc_ca8c8228db2c4628c5ab9715c7425896`

---

### CEO 播报

#### 1️⃣ 接收任务后

```
【CEO播报】
任务已接收 ✅

需求理解：
- 目标：{任务目标}
- 关键点：{1-3个关键要素}
- 交付标准：{具体可衡量标准}

执行计划：
- 员工A：负责 xxx（第一阶段）
- 员工B：负责 xxx（第二阶段/优化）
```

#### 2️⃣ 分配任务时

```
【CEO播报】
任务分配如下：

👉 员工A：执行 xxx（第一阶段）
👉 员工B：执行 xxx（第二阶段/优化）

请员工A立即开始执行。
```

#### 3️⃣ 审核结果时（通过）

```
【CEO审核结果】

结果：✅ 通过

审核要点：
- {合格项1}
- {合格项2}

决策：→ 进入员工B阶段
```

#### 4️⃣ 审核结果时（不通过）

```
【CEO审核结果】

结果：❌ 不通过

问题：
- {问题点1}
- {问题点2}

决策：→ 员工A继续执行（修改方向如下）

修改建议：
- {具体修改方向1}
- {具体修改方向2}
```

---

### 👨‍💻 员工 A 播报（narrative-designer）

#### 1️⃣ 接收任务

```
【员工A - narrative-designer】
已接收CEO任务 ✅
任务内容：{具体任务描述}
开始执行
```

#### 2️⃣ 执行过程（每阶段必须播报）

```
【员工A进度】
当前步骤：{当前执行步骤}
已完成：{已完成内容}
下一步：{下一步计划}
```

#### 3️⃣ 完成提交

```
【员工A完成】
执行已完成 ✅

成果：
- {交付物1}
- {交付物2}

请求CEO审核
```

---

### 🧪 员工 B 播报（novel-writer）

#### 1️⃣ 接收任务

```
【员工B - novel-writer】
已接收优化任务 ✅
目标：在A基础上优化/补全 xxx
开始执行
```

#### 2️⃣ 执行过程

```
【员工B进度】
优化点：{当前优化内容}
当前进展：{进展描述}
下一步：{下一步}
```

#### 3️⃣ 完成提交

```
【员工B完成】
优化完成 ✅

优化内容：
- {优化点1}
- {优化点2}

请求CEO最终审核
```

---

## 🔁 审核与回退机制

### 阶段一（A = narrative-designer）
- ❌ 不通过 → A 继续执行（必须带修改方向）
- ✅ 通过 → 进入阶段二（B）

### 阶段二（B = novel-writer）
- ❌ 不通过 → ❗ 回退 A（重新执行）
- ✅ 通过 → 任务完成

---

## ⚠️ 员工 sub-agent 任务模板（spawn 时使用）

spawn sub-agent 时，task 内容必须包含以下播报指令，**不得删减**：

### A类任务模板（narrative-designer）

```
## 任务：{具体任务}

## 执行要求

### 第一步：接收任务后立即发送群播报
使用 feishu_im_user_message 工具，以用户身份发送：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工A - narrative-designer】\n已接收CEO任务 ✅\n任务内容：{任务描述}\n开始执行"}

### 第二步：执行过程中发送进度播报（每完成一个子任务发送一次）
发送格式：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工A进度】\n当前步骤：{当前步骤}\n已完成：{已完成}\n下一步：{下一步}"}

### 第三步：全部完成后
1. 将成果写入：/root/.openclaw/workspace/shared/workspace-novel/{对应文件}
2. 发送完成播报：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工A完成】\n执行已完成 ✅\n\n成果：\n- {交付物1}\n- {交付物2}\n\n请求CEO审核"}
3. 通过 feishu_im_user_message 向 CEO（韩猛，open_id: ou_5c1427fa290cd1f4ba3c5b24085a7a77）发送完成通知

## 输出路径
- {具体文件路径}

## 禁止事项
- 不得跳过群内播报
- 不得直接与 novel-writer 沟通
- 不得在群里发送与任务无关的内容
```

### B类任务模板（novel-writer）

```
## 任务：{具体任务}

## 执行要求

### 第一步：接收任务后立即发送群播报
使用 feishu_im_user_message 工具，以用户身份发送：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工B - novel-writer】\n已接收优化任务 ✅\n目标：在A基础上优化/补全 xxx\n开始执行"}

### 第二步：执行过程中发送进度播报
发送格式：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工B进度】\n优化点：{当前优化内容}\n当前进展：{进展}\n下一步：{下一步}"}

### 第三步：完成后
1. 将成果写入：/root/.openclaw/workspace/shared/workspace-novel/{对应文件}
2. 发送完成播报：
- receive_id_type: chat_id
- receive_id: oc_ca8c8228db2c4628c5ab9715c7425896
- msg_type: text
- content: {"text": "【员工B完成】\n优化完成 ✅\n\n优化内容：\n- {优化点1}\n- {优化点2}\n\n请求CEO最终审核"}
3. 通过 feishu_im_user_message 向 CEO（韩猛，open_id: ou_5c1427fa290cd1f4ba3c5b24085a7a77）发送完成通知

## 输出路径
{具体文件路径}

## 禁止事项
- 不得跳过群内播报
- 不得修改 A 的原始策划案（如需修改，向 CEO 报告）
- 不得在群里发送与任务无关的内容
```

---

## 📁 共享工作空间

**根目录：** `/root/.openclaw/workspace/shared/workspace-novel/`

```
shared/workspace-novel/
  MEMORY.md              # 项目整体记忆
  progress.md            # 总进度追踪
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

## 👥 员工配置

| 员工 | 角色 | 飞书 Bot | 职责 |
|------|------|---------|------|
| narrative-designer | A（执行/兜底） | cli_a927295acd38dcee | 章纲/世界观/人物 |
| novel-writer | B（优化/补全） | cli_a92317d3d5785cb6 | 正文批量生成 |
| content-planner | 支持 | cli_a92319273c78dcca | 题材研究 |

---

## 🎯 一句话总结

- **CEO** = 调度 + 审核 + 决策
- **员工A** = 执行 + 修复 + 兜底（核心）
- **员工B** = 优化 + 提升（锦上添花）
- **全程必须像在直播工作**
