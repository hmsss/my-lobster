const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const https = require('https');

// ============================================
// 配置
// ============================================

const CONFIG_FILE = '/root/.openclaw/workspace/watcher/config.json';
const DEFAULT_OPENCLAW_CONFIG = '/root/.openclaw/openclaw.json';
const DEFAULT_AGENTS_ROOT_DIR = '/root/.openclaw/agents';

const DEFAULT_CONFIG = {
  enabled: true,
  throttleMs: 5000,
  openclawConfigPath: DEFAULT_OPENCLAW_CONFIG,
  agentsRootDir: DEFAULT_AGENTS_ROOT_DIR,
  agents: {
    include: [],
    exclude: []
  },
  agentTargets: {}
};

// Agent 名称映射
let AGENT_NAMES = {
  'product-manager': '产品经理',
  'engineering-full-stack-developer': '全栈工程师',
  'testing-senior-qa-engineer': '测试工程师',
  main: 'CEO'
};

// ============================================
// 状态
// ============================================

let config = { ...DEFAULT_CONFIG };
let feishuConfig = null;
let feishuAccounts = {};
const tokenCache = new Map();

// 核心索引
let sessionAccountIndex = new Map();
let agentActiveTarget = new Map();

// 追踪状态
const filePositions = new Map();  // filepath -> lastPosition
const agentLastActivity = new Map(); // agentId -> { lastMessage, lastTime, runId }
const throttleState = new Map();  // agentId -> lastPushTime

// ============================================
// 配置加载
// ============================================

function loadOpenclawConfig() {
  const p = config.openclawConfigPath || DEFAULT_OPENCLAW_CONFIG;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function safeReadJson(p) {
  try {
    if (!p || !fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function refreshFeishuConfig(openclawConfig) {
  if (openclawConfig.channels?.feishu) {
    feishuConfig = {
      appId: openclawConfig.channels.feishu.appId,
      appSecret: openclawConfig.channels.feishu.appSecret
    };
    feishuAccounts = openclawConfig.channels.feishu.accounts || {};
  }
}

function refreshAgentsFromOpenclaw(openclawConfig) {
  const list = openclawConfig?.agents?.list;
  if (!Array.isArray(list)) return;

  const nextNames = { ...AGENT_NAMES };
  for (const a of list) {
    if (a?.id && a.name) nextNames[a.id] = a.name;
  }
  AGENT_NAMES = nextNames;

  if (Array.isArray(config.agents?.include) && config.agents.include.length > 0) return;

  const exclude = new Set([...(config.agents?.exclude || [])]);
  config.agents.include = list.map(a => a?.id).filter(Boolean).filter(id => !exclude.has(id));
}

function refreshSessionIndexes() {
  const agentsRoot = config.agentsRootDir || DEFAULT_AGENTS_ROOT_DIR;
  if (!fs.existsSync(agentsRoot)) return;

  const nextAccountIndex = new Map();
  const nextActiveTarget = new Map();

  try {
    const dirs = fs.readdirSync(agentsRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agentId of dirs) {
      const sessionsFile = path.join(agentsRoot, agentId, 'sessions', 'sessions.json');
      const idx = safeReadJson(sessionsFile);
      if (!idx || typeof idx !== 'object') continue;

      for (const [sessionKey, sessionData] of Object.entries(idx)) {
        if (typeof sessionKey !== 'string' || !sessionKey.startsWith('agent:')) continue;

        const parts = sessionKey.split(':');
        if (parts.length < 5) continue;

        const sessionAgentId = parts[1];
        const provider = parts[2];
        const chatType = parts[3];
        const targetId = parts.slice(4).join(':');

        // 只处理飞书渠道的会话
        const channel = sessionData?.deliveryContext?.channel || sessionData?.lastChannel;
        if (channel !== 'feishu') continue;
        if (chatType !== 'direct' && chatType !== 'group') continue;
        if (!targetId) continue;

        // 构建 accountIndex
        const accountId = sessionData?.deliveryContext?.accountId 
                       || sessionData?.lastAccountId 
                       || sessionData?.origin?.accountId;
        if (accountId && typeof accountId === 'string') {
          if (!nextAccountIndex.has(sessionAgentId)) nextAccountIndex.set(sessionAgentId, new Map());
          nextAccountIndex.get(sessionAgentId).set(targetId, accountId);
        }

        // 构建 activeTarget（优先选择有 accountId 的群聊）
        const updatedAt = Number(sessionData?.updatedAt || 0);
        if (updatedAt > 0) {
          // 重新获取 accountId（确保在 activeTarget 逻辑中可用）
          const targetAccountId = sessionData?.deliveryContext?.accountId 
                          || sessionData?.lastAccountId 
                          || sessionData?.origin?.accountId;
          const hasAccountId = !!targetAccountId;
          
          const current = nextActiveTarget.get(sessionAgentId);
          
          // 修正类型：oc_ 开头的一定是群聊，ou_ 开头的是用户
          const actualType = targetId.startsWith('oc_') ? 'chat' : (targetId.startsWith('ou_') ? 'user' : (chatType === 'direct' ? 'user' : 'chat'));
          
          // 选择条件：
          // 1. 如果当前没有目标，直接设置
          // 2. 如果新目标有 accountId 且当前没有，优先选择新的
          // 3. 如果都有或都没有 accountId，按 updatedAt 选择最新的
          const shouldUpdate = !current 
            || (hasAccountId && !current.hasAccountId)
            || (hasAccountId === current.hasAccountId && updatedAt > current.updatedAt);
          
          if (shouldUpdate) {
            nextActiveTarget.set(sessionAgentId, {
              type: actualType,
              id: targetId,
              updatedAt,
              hasAccountId
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('[CONFIG] Failed to refresh sessions:', e.message);
  }

  sessionAccountIndex = nextAccountIndex;
  agentActiveTarget = nextActiveTarget;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      config = { ...DEFAULT_CONFIG, ...userConfig };
    }
    
    const openclawConfig = loadOpenclawConfig();
    refreshFeishuConfig(openclawConfig);
    refreshAgentsFromOpenclaw(openclawConfig);
    refreshSessionIndexes();

    console.log('[CONFIG] Loaded successfully');
    console.log(`[CONFIG] Agents: ${config.agents.include.join(', ')}`);
    printAgentTargets();
  } catch (e) {
    console.error('[CONFIG] Failed to load:', e.message);
  }
}

function printAgentTargets() {
  // 优先显示手动配置
  for (const [agentId, target] of Object.entries(config.agentTargets || {})) {
    if (target?.id) {
      console.log(`[CONFIG]   ${agentId} -> manual: ${target.type}:${target.id}`);
    }
  }
  // 显示自动解析（仅当没有手动配置时）
  for (const [agentId, target] of agentActiveTarget) {
    if (!config.agentTargets?.[agentId]?.id) {
      console.log(`[CONFIG]   ${agentId} -> auto: ${target.type}:${target.id}`);
    }
  }
}

// ============================================
// 飞书 API
// ============================================

async function getTenantAccessToken(appId, appSecret) {
  const cached = tokenCache.get(appId);
  if (cached && Date.now() < cached.expireAtMs) return cached.token;
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ app_id: appId, app_secret: appSecret });
    
    const req = https.request({
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            const expireAtMs = Date.now() + (result.expire - 300) * 1000;
            tokenCache.set(appId, { token: result.tenant_access_token, expireAtMs });
            resolve(result.tenant_access_token);
          } else {
            reject(new Error(`Auth failed: ${result.msg}`));
          }
        } catch (e) { reject(e); }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function resolveFeishuApp(agentId, targetId) {
  if (agentId && targetId) {
    const accountMap = sessionAccountIndex.get(agentId);
    if (accountMap) {
      const accountId = accountMap.get(targetId);
      if (accountId) {
        const acct = feishuAccounts?.[accountId];
        if (acct?.appId && acct?.appSecret) {
          return { appId: acct.appId, appSecret: acct.appSecret, accountId };
        }
      }
    }
  }

  if (agentId !== 'main') {
    const accountId = `bot-${agentId}`;
    const acct = feishuAccounts?.[accountId];
    if (acct?.appId && acct?.appSecret) {
      return { appId: acct.appId, appSecret: acct.appSecret, accountId };
    }
  }

  const botMain = feishuAccounts?.['bot-main'];
  if (botMain?.appId && botMain?.appSecret) {
    return { appId: botMain.appId, appSecret: botMain.appSecret, accountId: 'bot-main' };
  }
  if (feishuConfig?.appId && feishuConfig?.appSecret) {
    return { appId: feishuConfig.appId, appSecret: feishuConfig.appSecret, accountId: 'main' };
  }

  return null;
}

function getAgentTarget(agentId) {
  // 优先使用手动配置
  const manualTarget = config.agentTargets?.[agentId];
  if (manualTarget?.id) {
    console.log(`[ROUTER] ${agentId} -> manual: ${manualTarget.type}:${manualTarget.id}`);
    return manualTarget;
  }

  // 自动解析（备用）
  const autoTarget = agentActiveTarget.get(agentId);
  if (autoTarget) {
    console.log(`[ROUTER] ${agentId} -> auto: ${autoTarget.type}:${autoTarget.id}`);
    return { type: autoTarget.type, id: autoTarget.id };
  }

  return null;
}

async function sendFeishuMessage(agentId, text) {
  if (!feishuConfig) {
    console.error('[FEISHU] No feishu config');
    return;
  }

  const target = getAgentTarget(agentId);
  if (!target) {
    console.error(`[FEISHU] No target for agent ${agentId}`);
    return;
  }

  const { type, id: targetId } = target;
  const receiveIdType = type === 'user' ? 'open_id' : 'chat_id';

  const app = resolveFeishuApp(agentId, targetId);
  if (!app) {
    console.error('[FEISHU] No app credentials');
    return;
  }

  try {
    const token = await getTenantAccessToken(app.appId, app.appSecret);
    
    const data = JSON.stringify({
      receive_id: targetId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    });
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'open.feishu.cn',
        port: 443,
        path: `/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.code === 0) {
              console.log(`[FEISHU] Sent to ${type}:${targetId}`);
              resolve(result);
            } else {
              console.error('[FEISHU] Send failed:', result.msg, `target=${type}:${targetId}`);
              resolve(null); // 不 reject，避免崩溃
            }
          } catch (e) { 
            console.error('[FEISHU] Parse error:', e.message);
            resolve(null);
          }
        });
      });
      
      req.on('error', (e) => {
        console.error('[FEISHU] Request error:', e.message);
        reject(e);
      });
      req.write(data);
      req.end();
    });
  } catch (e) {
    console.error('[FEISHU] Failed:', e.message);
  }
}

// ============================================
// Sessions 文件监听
// ============================================

function shouldProcessAgent(agentId) {
  if (config.agents.exclude.includes(agentId)) return false;
  if (config.agents.include.length > 0 && !config.agents.include.includes(agentId)) return false;
  return true;
}

function shouldThrottle(agentId) {
  const now = Date.now();
  const lastPush = throttleState.get(agentId) || 0;
  return (now - lastPush) < config.throttleMs;
}

function extractAgentIdFromPath(filepath) {
  // /root/.openclaw/agents/{agentId}/sessions/{sessionId}.jsonl
  const match = filepath.match(/\/agents\/([^/]+)\/sessions\//);
  return match ? match[1] : null;
}

function processSessionLine(agentId, line) {
  if (!line || !line.trim()) return;

  try {
    const entry = JSON.parse(line);
    
    // 只处理 assistant 消息
    if (entry.type !== 'message' || entry.message?.role !== 'assistant') return;

    const content = entry.message?.content;
    if (!Array.isArray(content)) return;

    const textContent = content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    if (!textContent || textContent.length < 10) return;

    console.log(`[AGENT] ${agentId}: ${textContent.substring(0, 50)}...`);

    // 更新活动状态
    const now = Date.now();
    const prev = agentLastActivity.get(agentId);
    
    // 生成/继承 runId
    let runId = prev?.runId;
    const timeSinceLast = prev ? now - prev.lastTime : Infinity;
    
    // 如果超过 5 分钟没有活动，认为是新任务
    if (!runId || timeSinceLast > 5 * 60 * 1000) {
      runId = `run-${Date.now()}`;
      
      // 新任务开始
      if (shouldProcessAgent(agentId)) {
        const agentName = AGENT_NAMES[agentId] || agentId;
        sendFeishuMessage(agentId, `开始处理新任务`);
      }
    }

    agentLastActivity.set(agentId, {
      lastMessage: textContent,
      lastTime: now,
      runId
    });

    // 检测任务完成
    const completionKeywords = ['完成', '已完成', '任务完成', 'done', 'finished', 'completed'];
    const isComplete = completionKeywords.some(kw => textContent.toLowerCase().includes(kw));

    if (isComplete) {
      if (shouldProcessAgent(agentId)) {
        const agentName = AGENT_NAMES[agentId] || agentId;
        sendFeishuMessage(agentId, `任务完成`);
      }
      agentLastActivity.delete(agentId);
      return;
    }

    // 节流 + 推送进度
    if (shouldThrottle(agentId)) return;
    if (!shouldProcessAgent(agentId)) return;

    // 生成摘要
    const agentName = AGENT_NAMES[agentId] || agentId;
    // 移除消息前缀 [xxx] 以及格式化符号
    let summary = textContent.replace(/^\[.*?]\s*/, '').replace(/\*\*/g, '').replace(/`/g, '');
    if (summary.length > 100) {
      summary = summary.substring(0, 100) + '...';
    }

    sendFeishuMessage(agentId, `${summary}`);
    throttleState.set(agentId, Date.now());

  } catch (e) {
    // 忽略解析错误
  }
}

function watchAgentSessionsDir(agentId, dirPath) {
  if (!fs.existsSync(dirPath)) return;

  console.log(`[WATCH] Watching ${agentId} sessions: ${dirPath}`);

  // 初始化：扫描现有 jsonl 文件，记录位置
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
  for (const file of files) {
    const filepath = path.join(dirPath, file);
    const stat = fs.statSync(filepath);
    filePositions.set(filepath, stat.size);
  }

  // 使用 fs.watch 监听目录变化
  fs.watch(dirPath, (eventType, filename) => {
    if (!filename || !filename.endsWith('.jsonl')) return;

    const filepath = path.join(dirPath, filename);
    
    if (eventType === 'change' || fs.existsSync(filepath)) {
      const lastPos = filePositions.get(filepath) || 0;
      
      try {
        const stat = fs.statSync(filepath);
        if (stat.size <= lastPos) return;

        // 读取新增内容
        const fd = fs.openSync(filepath, 'r');
        const buffer = Buffer.alloc(stat.size - lastPos);
        fs.readSync(fd, buffer, 0, buffer.length, lastPos);
        fs.closeSync(fd);

        filePositions.set(filepath, stat.size);

        // 逐行处理
        const newContent = buffer.toString('utf8');
        const lines = newContent.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          processSessionLine(agentId, line);
        }
      } catch (e) {
        // 文件可能被删除或锁定
      }
    }
  });
}

function startWatching() {
  const agentsRoot = config.agentsRootDir || DEFAULT_AGENTS_ROOT_DIR;
  if (!fs.existsSync(agentsRoot)) {
    console.log(`[WATCH] Agents directory not found: ${agentsRoot}`);
    return;
  }

  const dirs = fs.readdirSync(agentsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const agentId of dirs) {
    if (!shouldProcessAgent(agentId)) continue;

    const sessionsDir = path.join(agentsRoot, agentId, 'sessions');
    if (fs.existsSync(sessionsDir)) {
      watchAgentSessionsDir(agentId, sessionsDir);
    }
  }

  // 定期刷新 sessions 索引
  setInterval(() => {
    refreshSessionIndexes();
  }, 10000);
}

// ============================================
// 启动
// ============================================

console.log('========================================');
console.log('  OpenClaw Agent Watcher v5');
console.log('  (Sessions File Watcher)');
console.log('========================================');

loadConfig();

if (!feishuConfig) {
  console.error('[ERROR] No feishu config');
  process.exit(1);
}

if (config.enabled) {
  console.log('[INIT] Testing feishu connection...');
  getTenantAccessToken(feishuConfig.appId, feishuConfig.appSecret)
    .then(() => {
      console.log('[INIT] Feishu connection OK');
      startWatching();
    })
    .catch((e) => {
      console.error('[INIT] Feishu connection failed:', e.message);
      startWatching();
    });
} else {
  console.log('[WATCHER] Disabled');
}
