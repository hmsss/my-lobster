#!/usr/bin/env node
/**
 * Web 计数器 - 功能测试脚本（修正版）
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

// 模拟计数器状态
class Counter {
    constructor() {
        this.count = 0;
        this.step = 1;
        this.steps = [1, 5, 10];
        this.min = -100;
        this.max = 100;
        this.history = [];
    }

    resetState() {
        this.count = 0;
        this.step = 1;
        this.min = -100;
        this.max = 100;
        this.history = [];
    }

    setStep(s) {
        if (this.steps.includes(s)) {
            this.step = s;
            return true;
        }
        return false;
    }

    canIncrease() {
        return this.count + this.step <= this.max;
    }

    canDecrease() {
        return this.count - this.step >= this.min;
    }

    isAtLimit() {
        return this.count === this.max || this.count === this.min;
    }

    increase() {
        if (!this.canIncrease()) return false;
        this.count += this.step;
        this.history.push({ type: 'plus', value: this.step });
        return true;
    }

    decrease() {
        if (!this.canDecrease()) return false;
        this.count -= this.step;
        this.history.push({ type: 'minus', value: this.step });
        return true;
    }

    reset() {
        this.count = 0;
        this.history = [];
    }

    clampCount() {
        if (this.count < this.min) this.count = this.min;
        if (this.count > this.max) this.count = this.max;
    }

    setMin(m) {
        this.min = m;
        this.clampCount();
    }

    setMax(m) {
        this.max = m;
        this.clampCount();
    }
}

console.log('【Web 计数器功能测试】\n');

const counter = new Counter();

// TC-001: 初始状态
console.log('--- 初始状态测试 ---');
counter.resetState();
test('TC-001 初始计数为 0', counter.count === 0, `count=${counter.count}`);
test('TC-001 初始步进为 1', counter.step === 1, `step=${counter.step}`);
test('TC-001 初始最小值为 -100', counter.min === -100, `min=${counter.min}`);
test('TC-001 初始最大值为 100', counter.max === 100, `max=${counter.max}`);
test('TC-001 初始历史为空', counter.history.length === 0, `length=${counter.history.length}`);

// TC-002: 增加按钮
console.log('\n--- 增加功能测试 ---');
counter.resetState();
counter.increase();
test('TC-002 首次增加 +1', counter.count === 1, `count=${counter.count}`);
test('TC-002 历史记录增加一条', counter.history.length === 1, `length=${counter.history.length}`);
test('TC-002 历史记录类型为 plus', counter.history[0].type === 'plus', `type=${counter.history[0].type}`);
test('TC-002 历史记录值为 1', counter.history[0].value === 1, `value=${counter.history[0].value}`);

counter.setStep(5);
counter.increase();
test('TC-002 步进为 5 时增加 +5', counter.count === 6, `count=${counter.count}`);

// TC-003: 减少按钮
console.log('\n--- 减少功能测试 ---');
counter.resetState();
counter.step = 1; // 确保步进为 1
counter.decrease();
test('TC-003 减少 -1', counter.count === -1, `count=${counter.count}`);
test('TC-003 历史记录类型为 minus', counter.history[0].type === 'minus', `type=${counter.history[0].type}`);

counter.setStep(10);
counter.decrease();
test('TC-003 步进为 10 时减少 -10', counter.count === -11, `count=${counter.count}`);

// TC-004: 重置按钮
console.log('\n--- 重置功能测试 ---');
counter.count = 50;
counter.history.push({ type: 'plus', value: 10 });
counter.reset();
test('TC-004 重置后计数为 0', counter.count === 0, `count=${counter.count}`);
test('TC-004 重置后历史清空', counter.history.length === 0, `length=${counter.history.length}`);

// TC-005: 步进设置
console.log('\n--- 步进设置测试 ---');
counter.resetState();
test('TC-005 步进选项包含 1', counter.steps.includes(1));
test('TC-005 步进选项包含 5', counter.steps.includes(5));
test('TC-005 步进选项包含 10', counter.steps.includes(10));

counter.setStep(5);
test('TC-005 设置步进为 5', counter.step === 5, `step=${counter.step}`);

counter.setStep(10);
test('TC-005 设置步进为 10', counter.step === 10, `step=${counter.step}`);

counter.setStep(1);
test('TC-005 设置步进为 1', counter.step === 1, `step=${counter.step}`);

// TC-006: 最大值限制
console.log('\n--- 最大值限制测试 ---');
counter.resetState();
counter.max = 10;
counter.step = 1;
test('TC-006 初始状态可增加', counter.canIncrease(), `count=${counter.count}, max=${counter.max}`);

counter.count = 9;
test('TC-006 count=9 时 canIncrease 为 true', counter.canIncrease());
counter.increase();
test('TC-006 count=9 增加后为 10', counter.count === 10, `count=${counter.count}`);
test('TC-006 count=10 时 canIncrease 为 false', !counter.canIncrease(), `canIncrease=false`);

counter.count = 10;
const increaseAtMax = counter.increase();
test('TC-006 达到最大值时 increase() 返回 false', increaseAtMax === false, `returned=${increaseAtMax}`);
test('TC-006 达到最大值时增加无效', counter.count === 10, `count=${counter.count}`);

// TC-007: 最小值限制
console.log('\n--- 最小值限制测试 ---');
counter.resetState();
counter.min = -10;
counter.step = 1;
test('TC-007 初始状态可减少', counter.canDecrease(), `count=${counter.count}, min=${counter.min}`);

counter.count = -9;
test('TC-007 count=-9 时 canDecrease 为 true', counter.canDecrease());
counter.decrease();
test('TC-007 count=-9 减少后为 -10', counter.count === -10, `count=${counter.count}`);
test('TC-007 count=-10 时 canDecrease 为 false', !counter.canDecrease(), `canDecrease=false`);

counter.count = -10;
const decreaseAtMin = counter.decrease();
test('TC-007 达到最小值时 decrease() 返回 false', decreaseAtMin === false, `returned=${decreaseAtMin}`);
test('TC-007 达到最小值时减少无效', counter.count === -10, `count=${counter.count}`);

// TC-008: clampCount 限制
console.log('\n--- 范围限制测试 ---');
counter.resetState();
counter.min = 0;
counter.max = 100;
counter.count = 50;
test('TC-008 正常值不受影响', counter.count === 50, `count=${counter.count}`);

counter.count = -5;
counter.clampCount();
test('TC-008 小于最小值时 clamp 到最小值', counter.count === 0, `count=${counter.count}`);

counter.count = 150;
counter.clampCount();
test('TC-008 大于最大值时 clamp 到最大值', counter.count === 100, `count=${counter.count}`);

// TC-009: 历史记录
console.log('\n--- 历史记录测试 ---');
counter.resetState();
counter.step = 1;
counter.increase(); // +1
counter.increase(); // +1
counter.decrease(); // -1
counter.increase(); // +1
test('TC-009 历史记录条数正确', counter.history.length === 4, `length=${counter.history.length}`);
test('TC-009 最新历史为 plus', counter.history[3].type === 'plus', `type=${counter.history[3].type}`);
test('TC-009 最新历史值为 1', counter.history[3].value === 1, `value=${counter.history[3].value}`);

// TC-010: 边界组合测试
console.log('\n--- 边界组合测试 ---');
counter.resetState();
counter.min = 0;
counter.max = 5;
counter.step = 10;
test('TC-010 step=10, min=0, max=5 时无法增加', !counter.canIncrease(), `canIncrease=${counter.canIncrease()}`);
counter.setStep(5);
test('TC-010 step=5, count=0 时可增加', counter.canIncrease());
counter.increase();
test('TC-010 增加后 count=5', counter.count === 5, `count=${counter.count}`);
test('TC-010 count=5 时无法继续增加', !counter.canIncrease(), `canIncrease=${counter.canIncrease()}`);

counter.setStep(10);
test('TC-010 step=10, count=5 时无法减少（会超过最小值）', !counter.canDecrease(), `canDecrease=${counter.canDecrease()}`);
counter.setStep(5);
test('TC-010 step=5, count=5 时可减少', counter.canDecrease());
counter.decrease();
test('TC-010 减少后 count=0', counter.count === 0, `count=${counter.count}`);

// TC-011: isAtLimit
console.log('\n--- 极限状态测试 ---');
counter.resetState();
counter.min = 0;
counter.max = 10;
counter.count = 0;
test('TC-011 count=0 时 isAtLimit', counter.isAtLimit(), `isAtLimit=${counter.isAtLimit()}`);
counter.count = 5;
test('TC-011 count=5 时不是极限', !counter.isAtLimit(), `isAtLimit=${counter.isAtLimit()}`);
counter.count = 10;
test('TC-011 count=10 时 isAtLimit', counter.isAtLimit(), `isAtLimit=${counter.isAtLimit()}`);

// TC-012: 按钮禁用逻辑
console.log('\n--- 按钮禁用测试 ---');
counter.resetState();
counter.min = 0;
counter.max = 10;
counter.step = 5;

counter.count = 0;
test('TC-012 count=0, step=5 时减按钮禁用', !counter.canDecrease(), `canDecrease=${counter.canDecrease()}`);
test('TC-012 count=0, step=5 时加按钮可用', counter.canIncrease(), `canIncrease=${counter.canIncrease()}`);

counter.count = 10;
test('TC-012 count=10, step=5 时加按钮禁用', !counter.canIncrease(), `canIncrease=${counter.canIncrease()}`);
test('TC-012 count=10, step=5 时减按钮可用', counter.canDecrease(), `canDecrease=${counter.canDecrease()}`);

// TC-013: 步进 5 和 10 测试
console.log('\n--- 步进值测试 ---');
counter.resetState();
counter.setStep(5);
counter.increase();
test('TC-013 步进 5 增加后 count=5', counter.count === 5, `count=${counter.count}`);
counter.setStep(10);
counter.increase();
test('TC-013 步进 10 增加后 count=15', counter.count === 15, `count=${counter.count}`);

// 输出结果
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
