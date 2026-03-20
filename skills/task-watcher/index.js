/**
 * Task Watcher Skill - 配合 watcher 服务的协作任务通知管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = '/root/.openclaw/workspace/watcher/config.json';
const OPENCLAW_CONFIG = '/root/.openclaw/openclaw.json';

// Agent ID 映射
const AGENT_MAP = {
  'product-manager': '产品经理',
  'engineering-full-stack-developer': '全栈工程师',
  'testing-senior-qa-engineer': '测试工程师'
};

/**
 * 读取 watcher 配置
 */
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[ERROR] Failed to read config:', e.message);
  }
  return {
    enabled: true,
    throttleMs: 5000,
    agents: { include: [], exclude: ['main'] },
    agentTargets: {}
  };
}

/**
 * 保存 watcher 配置
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('[CONFIG] Saved successfully');
    return true;
  } catch (e) {
    console.error('[ERROR] Failed to save config:', e.message);
    return false;
  }
}

/**
 * 获取 watcher 状态
 */
function getWatcherStatus() {
  try {
    const result = execSync('systemctl is-active openclaw-watcher 2>/dev/null || echo "inactive"', { encoding: 'utf8' }).trim();
    return result === 'active';
  } catch (e) {
    return false;
  }
}

/**
 * 重载 watcher 配置
 */
function reloadWatcher() {
  try {
    execSync('systemctl restart openclaw-watcher', { encoding: 'utf8' });
    console.log('[WATCHER] Reloaded successfully');
    return true;
  } catch (e) {
    console.error('[ERROR] Failed to reload watcher:', e.message);
    return false;
  }
}

/**
 * 获取飞书配置
 */
function getFeishuConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf8'));
    return {
      appId: config.channels?.feishu?.appId,
      appSecret: config.channels?.feishu?.appSecret,
      accounts: config.channels?.feishu?.accounts || {}
    };
  } catch (e) {
    return null;
  }
}

// ============================================
// 导出工具函数
// ============================================

module.exports = {
  name: 'task-watcher',
  description: '配合 watcher 服务的协作任务通知管理',

  /**
   * 设置 agent 的推送目标
   * @param {string} agentId - Agent ID
   * @param {string} targetId - 目标 ID (oc_xxx 或 ou_xxx)
   * @param {string} type - 类型: 'chat' 或 'user'，默认自动识别
   */
  setTarget(agentId, targetId, type = null) {
    const config = readConfig();
    
    // 自动识别类型
    if (!type) {
      type = targetId.startsWith('oc_') ? 'chat' : (targetId.startsWith('ou_') ? 'user' : 'chat');
    }
    
    if (!config.agentTargets) {
      config.agentTargets = {};
    }
    
    config.agentTargets[agentId] = { type, id: targetId };
    
    if (saveConfig(config)) {
      const agentName = AGENT_MAP[agentId] || agentId;
      console.log(`[SET] ${agentName} -> ${type}:${targetId}`);
      return { success: true, agentId, target: { type, id: targetId } };
    }
    return { success: false };
  },

  /**
   * 批量设置推送目标
   * @param {object} targets - { agentId: targetId } 映射
   */
  setTargets(targets) {
    const config = readConfig();
    
    for (const [agentId, targetId] of Object.entries(targets)) {
      const type = targetId.startsWith('oc_') ? 'chat' : (targetId.startsWith('ou_') ? 'user' : 'chat');
      config.agentTargets[agentId] = { type, id: targetId };
      const agentName = AGENT_MAP[agentId] || agentId;
      console.log(`[SET] ${agentName} -> ${type}:${targetId}`);
    }
    
    if (saveConfig(config)) {
      return { success: true, targets: config.agentTargets };
    }
    return { success: false };
  },

  /**
   * 查看 watcher 状态和配置
   */
  status() {
    const isRunning = getWatcherStatus();
    const config = readConfig();
    
    console.log('\n========================================');
    console.log('  Watcher Status');
    console.log('========================================');
    console.log(`Service: ${isRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`Enabled: ${config.enabled ? 'Yes' : 'No'}`);
    console.log(`Throttle: ${config.throttleMs}ms`);
    console.log('\nAgent Targets:');
    
    for (const [agentId, target] of Object.entries(config.agentTargets || {})) {
      if (target.id) {
        const agentName = AGENT_MAP[agentId] || agentId;
        console.log(`  ${agentName} -> ${target.type}:${target.id}`);
      }
    }
    
    return {
      running: isRunning,
      enabled: config.enabled,
      throttleMs: config.throttleMs,
      targets: config.agentTargets
    };
  },

  /**
   * 重载 watcher 配置
   */
  reload() {
    const success = reloadWatcher();
    return { success, message: success ? 'Watcher reloaded' : 'Failed to reload' };
  },

  /**
   * 清除所有推送目标配置
   */
  clearTargets() {
    const config = readConfig();
    config.agentTargets = {};
    if (saveConfig(config)) {
      console.log('[CLEAR] All targets cleared');
      return { success: true };
    }
    return { success: false };
  },

  /**
   * 获取支持的 agent 列表
   */
  listAgents() {
    return Object.entries(AGENT_MAP).map(([id, name]) => ({ id, name }));
  }
};
