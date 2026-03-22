---
name: novel-writing-command
description: 多Agent小说写作工作流。CEO调度+双阶段执行+实时播报，每个角色播报自己的状态，禁止静默执行。员工通过 Bot API 脚本自我播报。
invocations:
  - words:
      - 开始写小说
      - 写作任务
      - 长篇任务
      - 启动小说项目
    description: 多Agent小说写作任务下达与执行统筹
---

# novel-writing-command

## 核心原则

**三层隔离：**
- 老板（韩猛） ↔ CEO（我）：任务下达 / 成果汇报
- CEO ↔ 员工：通过飞书消息分配任务，不直接沟通
- 员工之间：**不直接沟通**

**🚨 强制规则：禁止静默执行。每个角色播报自己的状态。**

---

## 📌 总体流程

```
老板下达任务
↓
CEO 接收 → 理解需求 → 拆解分配
↓
员工 A 执行（自我播报）→ CEO 审核
    ├─ 不通过 → 打回 A 重做 → A 自我播报修改进度
    └─ 通过
↓
员工 B 执行（自我播报）→ CEO 最终审核
    ├─ 不通过 → ❗回退 A 重做
    └─ 通过 → 任务完成
↓
CEO 向老板汇报
```

---

## 👥 角色职责

| 角色 | Bot ID | 职责 |
|------|--------|------|
| CEO（我） | cli_a9203635d139dbcd | 调度+审核+决策 |
| 员工A narrative-designer | cli_a927295acd38dcee | 世界观/章纲/人物 |
| 员工B novel-writer | cli_a92317d3d5785cb6 | 正文批量生成 |
| content-planner | cli_a92319273c78dcca | 题材研究 |

---

## 📢 播报规范

**工作群 ID：** `oc_ca8c8228db2c4628c5ab9715c7425896`

---

### 🏢 CEO 自我播报

使用 `message` 工具（channel=feishu）发送，格式：

#### 接收任务后
```
【CEO播报】
任务已接收 ✅
需求理解：
- 目标：{任务目标}
- 关键点：{1-3个关键要素}
- 交付标准：{具体可衡量标准}
执行计划：
- 员工A（narrative-designer）：负责 xxx
- 员工B（novel-writer）：负责 xxx（第二阶段）
```

#### 分配任务时
```
【CEO播报】
👉 员工A：执行 xxx（第一阶段）
👉 员工B：执行 xxx（第二阶段/优化）
请员工A立即开始执行。
```

#### 审核结果（通过）
```
【CEO审核结果】
结果：✅ 通过
审核要点：
- {合格项1}
- {合格项2}
决策：→ 进入员工B阶段
```

#### 审核结果（不通过）
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

### 👨‍💻 员工 A 自我播报（narrative-designer）

使用 `exec` 运行脚本，自我 Bot 发消息：

```bash
node /root/.openclaw/workspace/skills/novel-writing-command/send-as-bot.js \
  "cli_a927295acd38dcee" \
  "squevfJj0VbpQyarqjzoceAATnRsQdS0" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "【员工A - narrative-designer】
内容：xxx"
```

#### 接收任务
```
【员工A - narrative-designer】
已接收CEO任务 ✅
任务内容：{任务描述}
开始执行
```

#### 执行进度
```
【员工A进度】
当前步骤：{当前步骤}
已完成：{已完成}
下一步：{下一步}
```

#### 完成提交
```
【员工A完成】
执行已完成 ✅
成果：
- {交付物1}
- {交付物2}
请求CEO审核
```

---

### 🧪 员工 B 自我播报（novel-writer）

使用 `exec` 运行脚本，自我 Bot 发消息：

```bash
node /root/.openclaw/workspace/skills/novel-writing-command/send-as-bot.js \
  "cli_a92317d3d5785cb6" \
  "cAMsLGIIWwuJV8c35uY3YerrgVjcAc8n" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "【员工B - novel-writer】
内容：xxx"
```

#### 接收任务
```
【员工B - novel-writer】
已接收任务 ✅
目标：在A基础上优化/补全 xxx
开始执行
```

#### 执行进度
```
【员工B进度】
优化点：{当前优化内容}
当前进展：{进展}
下一步：{下一步}
```

#### 完成提交
```
【员工B完成】
优化完成 ✅
优化内容：
- {优化点1}
- {优化点2}
请求CEO最终审核
```

---

## ⚠️ 员工任务模板（spawn 时使用）

spawn 员工时，task 内容必须包含以下三个步骤，**不得删减**：

### A类任务模板（narrative-designer）

```
## 任务：{具体任务}

## 步骤一：发群播报（接收任务）
exec 运行：
node /root/.openclaw/workspace/skills/novel-writing-command/send-as-bot.js \
  "cli_a927295acd38dcee" \
  "squevfJj0VbpQyarqjzoceAATnRsQdS0" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "【员工A - narrative-designer】
已接收CEO任务 ✅
任务内容：xxx
开始执行"

## 步骤二：执行过程中发进度播报（每完成一个子任务发一次）
exec 运行同样的脚本，内容改为进度格式。

## 步骤三：完成后
1. 将成果写入共享目录
2. 发完成播报（exec 脚本）
3. 向 CEO（韩猛）汇报：使用 message 工具（channel=feishu）发消息给 ou_5c1427fa290cd1f4ba3c5b24085a7a77
```

### B类任务模板（novel-writer）

```
## 任务：{具体任务}

## 步骤一：发群播报（接收任务）
exec 运行：
node /root/.openclaw/workspace/skills/novel-writing-command/send-as-bot.js \
  "cli_a92317d3d5785cb6" \
  "cAMsLGIIWwuJV8c35uY3YerrgVjcAc8n" \
  "oc_ca8c8228db2c4628c5ab9715c7425896" \
  "【员工B - novel-writer】
已接收优化任务 ✅
目标：在A基础上优化 xxx
开始执行"

## 步骤二：执行过程中发进度播报
exec 运行同样的脚本。

## 步骤三：完成后
1. 将成果写入共享目录
2. 发完成播报（exec 脚本）
3. 向 CEO 汇报：使用 message 工具（channel=feishu）发消息给 ou_5c1427fa290cd1f4ba3c5b24085a7a77
```

---

## 🔁 审核与回退机制

### 阶段一（A）
- ❌ 不通过 → A 继续执行（必须带修改方向）
- ✅ 通过 → 进入阶段二（B）

### 阶段二（B）
- ❌ 不通过 → ❗ 回退 A 重做
- ✅ 通过 → 任务完成

---

## 🚨 强制规则

1. **不允许静默** — 每步必须自我播报
2. **CEO 必须给结构化反馈** — 问题点 + 修改建议
3. **所有失败必须回到 A** — B 不修 Bug，A 负责兜底
4. **输出必须可交付**

---

## 📁 共享工作空间

**根目录：** `/root/.openclaw/workspace/shared/workspace-novel/`

```
shared/workspace-novel/
  MEMORY.md
  progress.md
  worldguide.md
  character-sheet.md
  foreshadowing-map.md
  outline.md
  chapters/
    001.md ...
  narrative-designer/progress.md
  novel-writer/progress.md
```

---

## 🎯 一句话总结

- **CEO** = 调度 + 审核 + 决策（自我播报）
- **员工A** = 执行 + 修复 + 兜底（自我 Bot 播报）
- **员工B** = 优化 + 提升（自我 Bot 播报）
- **全程必须像在直播工作**
