# 数独 Web 游戏

## 项目结构

```
sudoku-game/
└── engineering-full-stack-developer/
    ├── architecture.md    # 架构设计
    ├── index.html         # 完整游戏（单文件 Vue 3 应用）
    ├── code/              # Vue 项目脚手架（可选扩展）
    └── README.md
```

## 运行方式

直接在浏览器中打开 `index.html` 即可运行。

或者使用 HTTP 服务器：

```bash
cd /root/.openclaw/workspace/my-lobster/projects/sudoku-game/engineering-full-stack-developer
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## 已实现功能

### 核心功能 (P0)
- ✅ 数独生成（4 种难度）
- ✅ 数字输入（点击 + 键盘 1-9）
- ✅ 实时校验（错误标红）
- ✅ 笔记模式（标记候选数字）
- ✅ 撤销功能
- ✅ 计时器
- ✅ 暂停功能
- ✅ 完成检测
- ✅ 进度保存（LocalStorage）

### 辅助功能 (P1)
- ✅ 提示功能（3 次，+30 秒惩罚）
- ✅ 高亮相同数字
- ✅ 进度显示（进度条）
- ✅ 难度选择界面

## 操作说明

### 鼠标/触屏
- 点击空格选中
- 点击数字键盘输入
- 点击 ⌫ 清除

### 键盘快捷键
| 按键 | 功能 |
|------|------|
| 1-9 | 填入数字 |
| 0/Delete/Backspace | 清空格子 |
| ↑↓←→ | 移动选中格 |
| N | 切换笔记模式 |
| Ctrl+Z | 撤销 |

## 技术实现

- **框架**: Vue 3（CDN 引入）
- **样式**: 原生 CSS
- **存储**: LocalStorage
- **算法**: 回溯法生成数独解

## 难度说明

| 难度 | 提示数 | 平均时间 |
|------|--------|----------|
| 简单 | 36-45 | 5-10 分钟 |
| 中等 | 30-35 | 10-20 分钟 |
| 困难 | 25-29 | 20-40 分钟 |
| 专家 | 17-24 | 40+ 分钟 |
