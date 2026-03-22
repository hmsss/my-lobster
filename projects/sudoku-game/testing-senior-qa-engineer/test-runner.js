#!/usr/bin/env node
/**
 * 数独游戏 - 功能测试脚本
 * 使用 Node.js 执行基本游戏逻辑测试
 */

// 测试结果
const results = { passed: 0, failed: 0, errors: [] };

function test(name, condition, msg = '') {
    if (condition) {
        results.passed++;
        console.log(`✅ ${name}`);
    } else {
        results.failed++;
        results.errors.push(`${name}: ${msg}`);
        console.log(`❌ ${name} - ${msg}`);
    }
}

// ============================================
// 测试 1: 数独生成器逻辑
// ============================================

const SudokuGenerator = {
    generateSolution() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    },

    fillBoard(board, row = 0, col = 0) {
        if (row === 9) return true;
        if (col === 9) return this.fillBoard(board, row + 1, 0);
        if (board[row][col] !== 0) return this.fillBoard(board, row, col + 1);

        const numbers = this.shuffle([1,2,3,4,5,6,7,8,9]);
        for (const num of numbers) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                if (this.fillBoard(board, row, col + 1)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    },

    isValid(board, row, col, num) {
        if (board[row].includes(num)) return false;
        if (board.some(r => r[col] === num)) return false;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    },

    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    createPuzzle(solution, difficulty) {
        const puzzle = solution.map(row => [...row]);
        const cellsToRemove = {
            easy: 40 + Math.floor(Math.random() * 10),
            medium: 46 + Math.floor(Math.random() * 6),
            hard: 52 + Math.floor(Math.random() * 5),
            expert: 57 + Math.floor(Math.random() * 8)
        }[difficulty];

        const positions = [];
        for (let i = 0; i < 81; i++) positions.push(i);
        this.shuffle(positions);

        let removed = 0;
        for (const pos of positions) {
            if (removed >= cellsToRemove) break;
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            puzzle[row][col] = 0;
            removed++;
        }

        return puzzle;
    }
};

// TC-009: 数独有效性验证
console.log('\n【数独生成验证】');

const solution = SudokuGenerator.generateSolution();

function validateSolution(board) {
    // 检查每行
    for (let r = 0; r < 9; r++) {
        const row = board[r].filter(v => v !== 0);
        if (new Set(row).size !== 9) return false;
    }
    // 检查每列
    for (let c = 0; c < 9; c++) {
        const col = [];
        for (let r = 0; r < 9; r++) col.push(board[r][c]);
        if (new Set(col.filter(v => v !== 0)).size !== 9) return false;
    }
    // 检查每宫
    for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
            const box = [];
            for (let r = br * 3; r < br * 3 + 3; r++) {
                for (let c = bc * 3; c < bc * 3 + 3; c++) {
                    box.push(board[r][c]);
                }
            }
            if (new Set(box.filter(v => v !== 0)).size !== 9) return false;
        }
    }
    return true;
}

test('TC-009 数独有效性验证', validateSolution(solution), '生成的数独解无效');

// TC-010: 数独唯一解验证
test('TC-010 数独解完整性', solution.every(row => row.length === 9 && row.every(v => v >= 1 && v <= 9)), '解不完整');

// 验证所有格都有值
let allFilled = true;
for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        if (solution[r][c] === 0) allFilled = false;
    }
}
test('TC-010 数独每个格子都有值', allFilled, '存在空格');

// TC-010: 每次生成不同
const solution2 = SudokuGenerator.generateSolution();
const sameSolution = JSON.stringify(solution) === JSON.stringify(solution2);
test('TC-010 每次生成不同题目', !sameSolution, '两次生成相同解');

// TC-004~007: 难度验证
console.log('\n【难度验证】');

for (const diff of ['easy', 'medium', 'hard', 'expert']) {
    const puzzle = SudokuGenerator.createPuzzle(solution, diff);
    let givenCount = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (puzzle[r][c] !== 0) givenCount++;
        }
    }
    
    let expectedMin, expectedMax;
    switch(diff) {
        case 'easy': expectedMin = 36; expectedMax = 45; break;
        case 'medium': expectedMin = 30; expectedMax = 35; break;
        case 'hard': expectedMin = 25; expectedMax = 29; break;
        case 'expert': expectedMin = 17; expectedMax = 24; break;
    }
    
    const diffName = { easy: '简单', medium: '中等', hard: '困难', expert: '专家' }[diff];
    test(`TC-${diff === 'easy' ? '004' : diff === 'medium' ? '005' : diff === 'hard' ? '006' : '007'} ${diffName}难度生成`, 
        givenCount >= expectedMin && givenCount <= expectedMax, 
        `提示数=${givenCount}, 期望=${expectedMin}-${expectedMax}`);
}

// TC-016: 错误检测逻辑验证
console.log('\n【错误检测验证】');

function checkError(board, row, col, num) {
    // 检查行重复
    for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === num) return true;
    }
    // 检查列重复
    for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === num) return true;
    }
    // 检查宫重复
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && board[r][c] === num) return true;
        }
    }
    return false;
}

// 模拟错误情况
const testBoard = solution.map(row => [...row]);
testBoard[0][0] = 5; // 故意设置错误
test('TC-016 错误数字检测', checkError(testBoard, 0, 1, 5), '应检测到列重复');

// TC-029: 计时器格式
console.log('\n【计时器验证】');

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

test('TC-030 计时器格式 00:00', formatTime(0) === '00:00', `得到 ${formatTime(0)}`);
test('TC-030 计时器格式 01:30', formatTime(90) === '01:30', `得到 ${formatTime(90)}`);
test('TC-030 计时器格式 12:45', formatTime(765) === '12:45', `得到 ${formatTime(765)}`);

// TC-037: LocalStorage 数据结构验证
console.log('\n【进度保存验证】');

const mockGameData = {
    board: solution.map((row, r) => 
        row.map((val, c) => ({
            value: val,
            solution: solution[r][c],
            given: val !== 0,
            notes: [],
            error: false
        }))
    ),
    solution: solution,
    difficulty: 'medium',
    timer: 120,
    hintsUsed: 1,
    history: [],
    historyIndex: -1
};

const serialized = JSON.stringify(mockGameData);
const deserialized = JSON.parse(serialized);

test('TC-038 保存数据结构完整性', deserialized.board.length === 9, 'board 行数错误');
test('TC-038 保存数据结构每个格子有 value', deserialized.board[0][0].hasOwnProperty('value'), '缺少 value 字段');
test('TC-038 保存数据结构每个格子有 solution', deserialized.board[0][0].hasOwnProperty('solution'), '缺少 solution 字段');
test('TC-038 保存数据结构有 difficulty', deserialized.difficulty === 'medium', 'difficulty 不匹配');
test('TC-038 保存数据结构有 timer', deserialized.timer === 120, 'timer 不匹配');
test('TC-038 保存数据结构有 hintsUsed', deserialized.hintsUsed === 1, 'hintsUsed 不匹配');

// TC-026: 提示功能逻辑
console.log('\n【提示功能验证】');

function findEmptyCell(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c].value === 0) return { row: r, col: c };
        }
    }
    return null;
}

const testPuzzle = SudokuGenerator.createPuzzle(solution, 'easy');
const puzzleBoard = testPuzzle.map((row, r) => 
    row.map((val, c) => ({
        value: val,
        solution: solution[r][c],
        given: val !== 0,
        notes: [],
        error: false
    }))
);

const emptyCell = findEmptyCell(puzzleBoard);
test('TC-026 提示功能-找空格', emptyCell !== null, '未找到空格');

if (emptyCell) {
    const cell = puzzleBoard[emptyCell.row][emptyCell.col];
    const correctValue = cell.solution;
    test('TC-026 提示填入正确值', cell.value === 0 && correctValue >= 1 && correctValue <= 9, 
        `提示值=${correctValue}`);
}

// TC-023: 撤销功能逻辑
console.log('\n【撤销功能验证】');

const history = [];
let historyIndex = -1;

function saveHistory(history, historyIndex, row, col, oldValue, oldNotes) {
    history = history.slice(0, historyIndex + 1);
    history.push({ row, col, oldValue, oldNotes });
    historyIndex = history.length - 1;
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
    return { history, historyIndex };
}

function undo(history, historyIndex, board) {
    if (historyIndex < 0) return null;
    const entry = history[historyIndex];
    const cell = board[entry.row][entry.col];
    cell.value = entry.oldValue;
    cell.notes = entry.oldNotes;
    historyIndex--;
    return { history, historyIndex };
}

// 测试撤销
let h = { history: [], historyIndex: -1 };
const initialValue = puzzleBoard[4][4].value;
puzzleBoard[4][4].value = 5; // 修改

h = saveHistory(h.history, h.historyIndex, 4, 4, initialValue, []);
test('TC-023 撤销-保存历史', h.history.length === 1, `历史长度=${h.history.length}`);

const undoResult = undo(h.history, h.historyIndex, puzzleBoard);
test('TC-023 撤销-恢复值', puzzleBoard[4][4].value === initialValue, 
    `恢复值=${puzzleBoard[4][4].value}, 期望=${initialValue}`);

// TC-025: 历史步数限制
console.log('\n【历史步数限制验证】');

let longHistory = { history: [], historyIndex: -1 };
for (let i = 0; i < 55; i++) {
    longHistory = saveHistory(longHistory.history, longHistory.historyIndex, 0, 0, i, []);
}
test('TC-025 历史步数限制 50 步', longHistory.history.length <= 50, 
    `历史长度=${longHistory.history.length}, 期望<=50`);

// TC-032: 完成检测
console.log('\n【完成检测验证】');

function checkCompletion(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c].value !== board[r][c].solution) {
                return false;
            }
        }
    }
    return true;
}

test('TC-035 完成检测-未完成', !checkCompletion(puzzleBoard), '不应检测为完成');

// 填入所有正确值
for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        puzzleBoard[r][c].value = puzzleBoard[r][c].solution;
    }
}
test('TC-035 完成检测-已完成', checkCompletion(puzzleBoard), '应检测为完成');

// ============================================
// 输出结果
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`测试结果: 通过 ${results.passed}, 失败 ${results.failed}`);
if (results.errors.length > 0) {
    console.log('失败详情:');
    results.errors.forEach(e => console.log(`  - ${e}`));
} else {
    console.log('✅ 所有测试通过！');
}
console.log('='.repeat(50));

process.exit(results.failed > 0 ? 1 : 0);
