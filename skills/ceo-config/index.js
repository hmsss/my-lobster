/**
 * CEO Config Skill - CEO 配置管理
 */

const fs = require('fs');
const { execSync } = require('child_process');

const WATCHER_CONFIG = '/root/.openclaw/workspace/watcher/config.json';

// Agent ID 映射
const AGENT_MAP = {
  'product-manager': '产品经理',
  'engineering-full-stack-developer': '全栈工程师',
  'testing-senior-qa-engineer': '测试工程师',
  'main': 'CEO'
};

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(WATCHER_CONFIG, 'utf8'));
  } catch {
    return { agentTargets: {} };
  }
}

function saveConfig(config) {
  fs.writeFileSync(WATCHER_CONFIG, JSON.stringify(config, null, 2));
}

function reloadWatcher() {
  try {
    execSync('systemctl restart openclaw-watcher', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  name: 'ceo-config',
  description: 'CEO 配置管理',

  /**
   * 设置推送目标
   * @param {string} agentIdOrName - Agent ID 或角色名
   * @param {string} targetId - 群聊ID (oc_xxx) 或 私聊ID (ou_xxx)
   */
  setTarget(agentIdOrName, targetId) {
    // 转换名称为 ID
    let agentId = agentIdOrName;
    for (const [id, name] of Object.entries(AGENT_MAP)) {
      if (agentIdOrName === name || agentIdOrName.includes(name)) {
        agentId = id;
        break;
      }
    }

    const config = readConfig();
    const type = targetId.startsWith('oc_') ? 'chat' : 'user';
    
    config.agentTargets = config.agentTargets || {};
    config.agentTargets[agentId] = { type, id: targetId };
    
    saveConfig(config);
    reloadWatcher();
    
    const agentName = AGENT_MAP[agentId] || agentId;
    console.log(`[CONFIG] ${agentName} -> ${type}:${targetId}`);
    return { success: true, agentId, target: { type, id: targetId } };
  },

  /**
   * 批量设置推送目标（协作任务）
   * @param {string} chatId - 群聊ID
   */
  setAllTargets(chatId) {
    const config = readConfig();
    config.agentTargets = config.agentTargets || {};
    
    for (const agentId of Object.keys(AGENT_MAP)) {
      config.agentTargets[agentId] = { type: 'chat', id: chatId };
    }
    
    saveConfig(config);
    reloadWatcher();
    
    console.log(`[CONFIG] 所有员工 -> chat:${chatId}`);
    return { success: true, targets: config.agentTargets };
  },

  /**
   * 清除推送目标
   * @param {string} agentId - Agent ID
   */
  clearTarget(agentId) {
    const config = readConfig();
    if (config.agentTargets?.[agentId]) {
      config.agentTargets[agentId] = { type: 'chat', id: null };
      saveConfig(config);
      reloadWatcher();
    }
    return { success: true };
  },

  /**
   * 查看状态
   */
  status() {
    const config = readConfig();
    console.log('\n========================================');
    console.log('  Watcher 推送配置');
    console.log('========================================');
    
    for (const [agentId, target] of Object.entries(config.agentTargets || {})) {
      if (target?.id) {
        const name = AGENT_MAP[agentId] || agentId;
        console.log(`${name} -> ${target.type}:${target.id}`);
      }
    }
    
    return config.agentTargets;
  },

  /**
   * 重载配置
   */
  reload() {
    const success = reloadWatcher();
    return { success, message: success ? '配置已重载' : '重载失败' };
  },

  /**
   * 获取 Agent 列表
   */
  listAgents() {
    return Object.entries(AGENT_MAP).map(([id, name]) => ({ id, name }));
  }
};
