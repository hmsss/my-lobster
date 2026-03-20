# 数独游戏 - 需求分析

**Author**: Alex (产品经理)
**Last Updated**: 2026-03-20
**Version**: 1.0

---

## 1. 数独生成算法调研

### 1.1 数独生成原理

```
┌─────────────────────────────────────────────────────┐
│              数独生成基本流程                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  步骤 1: 生成完整数独（填满 81 格）                 │
│     ↓                                               │
│  步骤 2: 随机移除部分数字                          │
│     ↓                                               │
│  步骤 3: 验证唯一解                                │
│     ↓                                               │
│  步骤 4: 调整移除数量直到满足难度要求              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 主流算法对比

#### 算法 A：回溯法（Backtracking）
```
原理：
1. 从空白数独开始
2. 逐格填入数字，验证合法性
3. 不合法则回溯，尝试下一个数字
4. 直到填满所有格子

优点：
• 保证生成有效数独
• 实现简单
• 可控制难度

缺点：
• 生成速度较慢
• 复杂度高

时间复杂度：O(9^81) 最坏情况
实际性能：10-500ms（取决于实现）
```

#### 算法 B：模板法（Pattern-based）
```
原理：
1. 预定义若干数独模板
2. 对模板进行变换（行交换、列交换、数字映射）
3. 生成新数独

变换方式：
• 行交换（同行块内交换）
• 列交换（同列块内交换）
• 数字映射（1→2, 2→3...）
• 旋转/镜像

优点：
• 生成速度快（< 10ms）
• 保证有效

缺点：
• 多样性受限
• 可能产生相似题目

适用场景：
• 快速生成大量题目
• 不要求高度随机性
```

#### 算法 C：挖洞法（Digging Holes）
```
原理：
1. 生成完整数独
2. 按策略"挖掉"部分数字
3. 每挖一个验证唯一解
4. 直到满足难度要求

挖洞策略：
• 对称挖洞（美观）
• 随机挖洞（快速）
• 约束挖洞（控制难度）

优点：
• 可精确控制难度
• 保证唯一解

缺点：
• 需要多次验证
• 生成时间较长

适用场景：
• 需要精确难度控制
• 高质量题目
```

### 1.3 推荐算法方案

**V1 推荐：回溯法 + 挖洞法**

```
┌─────────────────────────────────────────────────────┐
│              推荐算法流程                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. 使用回溯法生成完整数独                         │
│     - 随机选择空格                                 │
│     - 随机尝试 1-9                                │
│     - 递归回溯                                     │
│                                                     │
│  2. 按难度挖洞                                     │
│     - 简单：保留 36-45 个数字                     │
│     - 中等：保留 30-35 个数字                     │
│     - 困难：保留 25-29 个数字                     │
│     - 专家：保留 17-24 个数字                     │
│                                                     │
│  3. 对称挖洞（可选）                               │
│     - 中心对称                                     │
│     - 更美观                                       │
│                                                     │
│  4. 验证唯一解                                     │
│     - 使用回溯求解器                               │
│     - 确保只有一个解                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**代码示例（伪代码）**：
```typescript
// 生成完整数独
function generateFullSudoku(): number[][] {
  const board = createEmptyBoard();
  fillBoard(board, 0, 0);
  return board;
}

// 回溯填充
function fillBoard(board: number[][], row: number, col: number): boolean {
  if (row === 9) return true; // 填满

  const [nextRow, nextCol] = getNextCell(row, col);
  const numbers = shuffle([1,2,3,4,5,6,7,8,9]);

  for (const num of numbers) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (fillBoard(board, nextRow, nextCol)) {
        return true;
      }
      board[row][col] = 0;
    }
  }
  return false;
}

// 挖洞生成题目
function createPuzzle(full: number[][], difficulty: string): number[][] {
  const puzzle = copyBoard(full);
  const cellsToRemove = getRemovalCount(difficulty);
  const positions = shuffle(getAllPositions());

  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    // 验证唯一解
    if (!hasUniqueSolution(puzzle)) {
      puzzle[row][col] = backup; // 恢复
    }
  }

  return puzzle;
}
```

### 1.4 性能优化

| 优化策略 | 说明 |
|----------|------|
| 预生成题目池 | 后台生成一批题目，用户开始时直接取用 |
| 缓存结果 | 已生成的数独缓存，避免重复计算 |
| Web Worker | 在后台线程生成，不阻塞 UI |
| 懒加载 | 首次进入时预生成下一题 |

---

## 2. 数独求解算法

### 2.1 求解器用途

1. **验证唯一解**：确保生成的题目只有一个解
2. **提示功能**：为玩家提供正确答案
3. **校验答案**：检查玩家填入是否正确

### 2.2 求解算法

**回溯求解器**：
```typescript
function solveSudoku(board: number[][]): number[][] | null {
  const empty = findEmptyCell(board);
  if (!empty) return board; // 已填满

  const [row, col] = empty;
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      const result = solveSudoku(board);
      if (result) return result;
      board[row][col] = 0;
    }
  }
  return null; // 无解
}
```

**唯一解验证**：
```typescript
function hasUniqueSolution(board: number[][]): boolean {
  let solutions = 0;

  function countSolutions(b: number[][]): boolean {
    const empty = findEmptyCell(b);
    if (!empty) {
      solutions++;
      return solutions > 1; // 找到第二个解就停止
    }

    const [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
      if (isValid(b, row, col, num)) {
        b[row][col] = num;
        if (countSolutions(b)) return true;
        b[row][col] = 0;
      }
    }
    return false;
  }

  countSolutions(copyBoard(board));
  return solutions === 1;
}
```

---

## 3. 性能需求分析

### 3.1 关键性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 数独生成时间 | < 500ms | 从点击到显示题目 |
| 题目切换时间 | < 100ms | 已预生成时 |
| 输入响应时间 | < 50ms | 点击/键盘输入 |
| 校验计算时间 | < 10ms | 实时校验 |
| 求解器时间 | < 100ms | 提示功能 |

### 3.2 性能测试场景

| 场景 | 测试方法 | 通过标准 |
|------|----------|----------|
| 生成 100 道题 | 批量生成 | 平均 < 300ms |
| 连续输入 50 次 | 快速点击 | 无卡顿 |
| 大量笔记 | 每格 9 个笔记 | 渲染正常 |
| 长时间游戏 | 30 分钟 | 内存稳定 |

### 3.3 优化策略

#### 渲染优化
| 策略 | 说明 |
|------|------|
| 虚拟 DOM | Vue 3 自动优化 |
| 防抖输入 | 避免频繁更新 |
| CSS Grid | 高效布局 |

#### 存储优化
| 策略 | 说明 |
|------|------|
| LocalStorage | 保存当前进度 |
| IndexedDB | 保存历史记录 |
| 压缩存储 | 减少存储空间 |

---

## 4. 数据模型

### 4.1 游戏状态

```typescript
interface SudokuGame {
  // 题目
  puzzle: number[][];        // 原始题目（0 表示空）
  solution: number[][];      // 完整答案
  current: number[][];       // 当前状态

  // 笔记
  notes: Map<string, Set<number>>;  // "row,col" -> 候选数

  // 元数据
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  startTime: Date;
  elapsedTime: number;       // 秒
  hintsUsed: number;

  // 历史
  history: HistoryEntry[];
  historyIndex: number;
}

interface HistoryEntry {
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
  oldNotes: Set<number>;
  newNotes: Set<number>;
}
```

### 4.2 统计数据

```typescript
interface GameStats {
  totalGames: number;
  completedGames: number;
  abandonedGames: number;

  // 按难度
  easy: { completed: number; bestTime: number; avgTime: number };
  medium: { completed: number; bestTime: number; avgTime: number };
  hard: { completed: number; bestTime: number; avgTime: number };
  expert: { completed: number; bestTime: number; avgTime: number };

  // 总计
  totalTime: number;
  totalHints: number;
}
```

### 4.3 每日挑战

```typescript
interface DailyChallenge {
  date: string;              // "2026-03-20"
  puzzle: number[][];
  solution: number[][];
  difficulty: string;
  seed: number;              // 随机种子，确保同一天相同
}
```

---

## 5. 技术架构

### 5.1 前端架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Views     │  │  Components │  │   Store     │         │
│  │             │  │             │  │  (Pinia)    │         │
│  │ - Home      │  │ - SudokuGrid│  │             │         │
│  │ - Game      │  │ - NumPad    │  │ - gameStore │         │
│  │ - Settings  │  │ - Timer     │  │ - statsStore│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Core Logic (纯函数)                │       │
│  │  - generator.ts  (数独生成)                    │       │
│  │  - solver.ts     (求解/校验)                   │       │
│  │  - validator.ts  (合法性检查)                  │       │
│  └─────────────────────────────────────────────────┘       │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Storage Layer                      │       │
│  │  - LocalStorage (当前进度)                      │       │
│  │  - IndexedDB    (历史记录)                      │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 模块划分

| 模块 | 职责 |
|------|------|
| generator | 数独题目生成 |
| solver | 求解和验证 |
| validator | 合法性检查 |
| store | 状态管理 |
| storage | 数据持久化 |
| ui | 界面组件 |

---

## 6. 难度设计分析

### 6.1 难度因素

| 因素 | 影响 |
|------|------|
| 提示数 | 越少越难 |
| 提示分布 | 不均匀更难 |
| 所需技巧 | 高级技巧更难 |

### 6.2 推荐难度配置

| 难度 | 提示数 | 挖洞策略 | 预期时间 |
|------|--------|----------|----------|
| 简单 | 36-45 | 对称挖洞，优先边缘 | 5-10 min |
| 中等 | 30-35 | 对称挖洞，均匀分布 | 10-20 min |
| 困难 | 25-29 | 随机挖洞，需高级技巧 | 20-40 min |
| 专家 | 17-24 | 最少提示，需推理链 | 40+ min |

### 6.3 难度验证

生成后验证题目是否满足难度要求：
```typescript
function estimateDifficulty(puzzle: number[][]): string {
  const hintCount = countHints(puzzle);

  if (hintCount >= 36) return 'easy';
  if (hintCount >= 30) return 'medium';
  if (hintCount >= 25) return 'hard';
  return 'expert';
}
```

---

## 7. 风险评估

### 7.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 生成算法慢 | 中 | 中 | 预生成 + Web Worker |
| 唯一解验证慢 | 低 | 中 | 优化求解器 |
| 移动端性能差 | 低 | 高 | 充分测试 + 优化 |

### 7.2 体验风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 题目太难/太简单 | 中 | 中 | 难度测试 + 调整 |
| 操作不流畅 | 低 | 高 | 性能优化 |
| 进度丢失 | 低 | 高 | 自动保存 |

---

## 8. 建议与结论

### 8.1 技术选型建议

| 组件 | 推荐 | 原因 |
|------|------|------|
| 前端框架 | Vue 3 | 轻量、响应式 |
| 样式 | Tailwind CSS | 快速开发 |
| 状态管理 | Pinia | 简单、TypeScript 友好 |
| 存储 | LocalStorage + IndexedDB | 无需后端 |

### 8.2 开发优先级

**第一阶段（MVP）**：
- [x] 数独生成算法
- [x] 基础 UI
- [x] 数字输入
- [x] 校验功能
- [x] 计时器

**第二阶段**：
- [ ] 笔记模式
- [ ] 撤销/重做
- [ ] 提示功能
- [ ] 难度选择

**第三阶段**：
- [ ] 每日挑战
- [ ] 统计数据
- [ ] 排行榜

### 8.3 结论

数独游戏项目 **技术可行**，算法成熟，实现难度中等。建议采用回溯法 + 挖洞法生成题目，使用 Vue 3 + TypeScript 开发，确保良好的性能和用户体验。

**关键成功因素**：
1. 高效的数独生成算法
2. 流畅的移动端体验
3. 完善的辅助功能
