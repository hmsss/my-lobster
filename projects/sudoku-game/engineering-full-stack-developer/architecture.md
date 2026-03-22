# 数独 Web 游戏 - 架构设计

**Author**: 全栈工程师
**Last Updated**: 2026-03-20
**Version**: 1.0

---

## 1. 技术栈选型

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| **Vue 3** | 前端框架 | 组合式 API，响应式系统优秀 |
| **TypeScript** | 类型安全 | 代码健壮，IDE 支持好 |
| **Tailwind CSS** | 样式 | 原子化 CSS，开发效率高 |
| **Vite** | 构建工具 | 开发体验好，HMR 快 |
| **LocalStorage** | 进度保存 | 简单直接，无需后端 |

---

## 2. 数独生成算法

### 2.1 算法流程

```
1. 生成完整解
   ├── 使用回溯算法填满 9x9 格子
   ├── 每行、每列、每宫满足数独规则
   └── 保证唯一解

2. 挖空生成题目
   ├── 根据难度确定挖空数量
   │   ├── 简单: 挖 36-45 个
   │   ├── 中等: 挖 46-51 个
   │   ├── 困难: 挖 52-56 个
   │   └── 专家: 挖 57-64 个
   ├── 随机选择格子挖空
   └── 每次挖空后验证唯一解

3. 验证唯一解
   └── 使用求解器检查是否只有唯一解
```

### 2.2 核心算法实现

```typescript
// 生成完整数独解
function generateSolution(): number[][] {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  fillBoard(board);
  return board;
}

// 回溯填充
function fillBoard(board: number[][], row = 0, col = 0): boolean {
  if (row === 9) return true;
  if (col === 9) return fillBoard(board, row + 1, 0);
  if (board[row][col] !== 0) return fillBoard(board, row, col + 1);
  
  const numbers = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const num of numbers) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (fillBoard(board, row, col + 1)) return true;
      board[row][col] = 0;
    }
  }
  return false;
}

// 验证数字是否有效
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // 检查行
  if (board[row].includes(num)) return false;
  // 检查列
  if (board.some(r => r[col] === num)) return false;
  // 检查 3x3 宫
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }
  return true;
}
```

---

## 3. 数据结构设计

### 3.1 游戏状态

```typescript
interface Cell {
  value: number;          // 当前值 (0-9, 0 表示空)
  solution: number;       // 正确答案
  isGiven: boolean;       // 是否为初始提示
  notes: number[];        // 笔记数字
  isError: boolean;       // 是否错误
  isSelected: boolean;    // 是否选中
  isHighlighted: boolean; // 是否高亮
}

interface GameState {
  board: Cell[][];        // 9x9 棋盘
  difficulty: Difficulty; // 难度
  timer: number;          // 计时器（秒）
  isPaused: boolean;      // 是否暂停
  isCompleted: boolean;   // 是否完成
  hintsUsed: number;      // 已用提示次数
  history: HistoryEntry[]; // 操作历史
  historyIndex: number;   // 历史指针
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface HistoryEntry {
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
  oldNotes: number[];
  newNotes: number[];
}
```

### 3.2 本地存储结构

```typescript
interface SavedGame {
  board: Cell[][];
  difficulty: Difficulty;
  timer: number;
  hintsUsed: number;
  history: HistoryEntry[];
  historyIndex: number;
  savedAt: string;
}

interface GameStats {
  completedGames: number;
  averageTime: number;
  bestTimes: Record<Difficulty, number>;
}
```

---

## 4. 组件划分

```
src/
├── App.vue                 # 根组件
├── main.ts                 # 入口
│
├── components/
│   ├── SudokuBoard.vue     # 数独棋盘
│   ├── SudokuCell.vue      # 单个格子
│   ├── NumberPad.vue       # 数字键盘
│   ├── GameControls.vue    # 控制按钮
│   ├── GameTimer.vue       # 计时器
│   ├── DifficultySelect.vue # 难度选择
│   ├── PauseOverlay.vue    # 暂停遮罩
│   └── CompletionModal.vue # 完成弹窗
│
├── composables/
│   ├── useSudoku.ts        # 数独逻辑
│   ├── useTimer.ts         # 计时器
│   ├── useHistory.ts       # 撤销重做
│   └── useStorage.ts       # 本地存储
│
├── utils/
│   ├── sudokuGenerator.ts  # 数独生成
│   ├── sudokuSolver.ts     # 数独求解
│   └── validators.ts       # 校验函数
│
├── types/
│   └── index.ts            # 类型定义
│
└── stores/
    └── gameStore.ts        # 游戏状态
```

---

## 5. 核心流程

### 5.1 新游戏流程

```
用户选择难度
    │
    ▼
生成完整解 (generateSolution)
    │
    ▼
根据难度挖空 (createPuzzle)
    │
    ▼
验证唯一解 (hasUniqueSolution)
    │
    ▼
初始化游戏状态
    │
    ▼
开始计时
```

### 5.2 输入数字流程

```
用户点击/键盘输入
    │
    ▼
检查是否为提示格 → 是 → 忽略
    │
    否
    ▼
记录历史 (撤销支持)
    │
    ▼
更新格子值
    │
    ▼
校验是否正确
    │
    ├── 错误 → 标红（如开启校验）
    │
    └── 正确 → 清除笔记
    │
    ▼
检查是否完成
    │
    ├── 完成 → 显示完成界面
    │
    └── 未完成 → 继续游戏
```

---

## 6. 性能优化

| 优化项 | 方案 |
|--------|------|
| 数独生成 | 使用 Web Worker 避免阻塞 |
| 渲染优化 | 只重绘变化的格子 |
| 历史记录 | 限制最多 50 步 |
| 本地存储 | 防抖保存，避免频繁写入 |

---

## 7. 响应式设计

| 断点 | 布局 |
|------|------|
| ≥ 768px | PC 布局，棋盘居中 |
| < 768px | 移动布局，键盘底部固定 |

---

## 8. 开发计划

1. **阶段一**：数独生成算法 + 核心逻辑
2. **阶段二**：UI 组件 + 交互
3. **阶段三**：辅助功能（笔记、提示、撤销）
4. **阶段四**：存储、计时、完成检测
