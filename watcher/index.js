const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const https = require('https');
const http = require('http');

// ============================================
// 配置
// ============================================

const CONFIG_FILE = '/root/.openclaw/workspace/watcher/config.json';
const OPENCLAW_CONFIG = '/root/.openclaw/openclaw.json';

const DEFAULT_CONFIG = {
  enabled: true,
  logFile: '/tmp/openclaw/openclaw-YYYY-MM-DD.log',
  throttleMs: 30000,
  feishu: {
    chatId: 'oc_ca8c8228db2c4628c5ab9715c7425896'
  },
  agents: {
    include: ['product-manager', 'engineering-full-stack-developer', 'testing-senior-qa-engineer'],
    exclude: ['main']
  }
};

// Agent 名称映射
const AGENT_NAMES = {
  'product-manager': '产品经理',
  'engineering-full-stack-developer': '全栈工程师',
  'testing-senior-qa-engineer': '测试工程师',
  'main': 'CEO'
};

// ============================================
// 状态
// ============================================

let config = { ...DEFAULT_CONFIG };
let feishuConfig = null;
let tenantAccessToken = null;
let tokenExpireTime = 0;

const throttleState = new Map();      // agentId -> lastPushTime
const runState = new Map();           // runId -> { agentId, startTime }
const agentEventBuffer = new Map();   // agentId -> events[]

// ============================================
// 初始化
// ============================================

function loadConfig() {
  try {
    // 加载 watcher 配置
    if (fs.existsSync(CONFIG_FILE)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      config = { ...DEFAULT_CONFIG, ...userConfig };
    }
    
    // 加载飞书配置
    const openclawConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf8'));
    if (openclawConfig.channels?.feishu) {
      feishuConfig = {
        appId: openclawConfig.channels.feishu.appId,
        appSecret: openclawConfig.channels.feishu.appSecret
      };
      console.log('[CONFIG] Feishu config loaded from openclaw.json');
    }
    
    console.log('[CONFIG] Loaded successfully');
    console.log(`[CONFIG] Throttle: ${config.throttleMs}ms`);
    console.log(`[CONFIG] Agents: ${config.agents.include.join(', ')}`);
  } catch (e) {
    console.error('[CONFIG] Failed to load:', e.message);
  }
}

// ============================================
// 飞书 API
// ============================================

/**
 * 获取 tenant_access_token
 */
async function getTenantAccessToken() {
  // 检查缓存
  if (tenantAccessToken && Date.now() < tokenExpireTime) {
    return tenantAccessToken;
  }
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: feishuConfig.appId,
      app_secret: feishuConfig.appSecret
    });
    
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            tenantAccessToken = result.tenant_access_token;
            // 提前 5 分钟过期
            tokenExpireTime = Date.now() + (result.expire - 300) * 1000;
            console.log('[FEISHU] Token refreshed, expires in', result.expire, 's');
            resolve(tenantAccessToken);
          } else {
            console.error('[FEISHU] Auth failed:', result);
            reject(new Error(`Auth failed: ${result.msg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 发送文本消息到飞书群
 */
async function sendFeishuMessage(text) {
  if (!feishuConfig) {
    console.error('[FEISHU] No feishu config');
    return;
  }
  
  try {
    const token = await getTenantAccessToken();
    
    const data = JSON.stringify({
      receive_id: config.feishu.chatId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    });
    
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.code === 0) {
              console.log('[FEISHU] Message sent successfully');
              resolve(result);
            } else {
              console.error('[FEISHU] Send failed:', result.msg);
              reject(new Error(result.msg));
            }
          } catch (e) {
            reject(e);
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
// 日志解析
// ============================================

function getTodayLogFile() {
  const today = new Date().toISOString().split('T')[0];
  return config.logFile.replace('YYYY-MM-DD', today);
}

function parseLogLine(line) {
  try {
    const log = JSON.parse(line);
    const message = log['1'] || log['0'] || '';
    
    // agent:nested 日志
    const agentMatch = message.match(/\[agent:nested\]\s+session=agent:([^:]+):[^\s]+\s+run=([^\s]+)\s+(.*)/);
    if (agentMatch) {
      return {
        type: 'agent:nested',
        agentId: agentMatch[1],
        runId: agentMatch[2],
        message: agentMatch[3].trim(),
        timestamp: log.time || new Date().toISOString()
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// ============================================
// 事件处理
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

function generateSummary(agentId, events) {
  const agentName = AGENT_NAMES[agentId] || agentId;
  
  if (events.length === 0) return null;
  
  // 过滤有意义的消息
  const meaningfulEvents = events.filter(e => {
    const msg = e.message.toLowerCase();
    return msg.length > 5 && 
           !msg.includes('tool call') && 
           !msg.includes('tool done') &&
           !msg.includes('channel=webchat');
  });
  
  if (meaningfulEvents.length === 0) {
    const toolCalls = events.filter(e => e.message.includes('tool')).length;
    if (toolCalls > 0) {
      return `🔄 [${agentName}] 工作中... (已调用 ${toolCalls} 个工具)`;
    }
    return null;
  }
  
  // 取最后一条有意义的消息
  const lastEvent = meaningfulEvents[meaningfulEvents.length - 1];
  let summary = lastEvent.message;
  
  // 清理消息
  summary = summary.replace(/\*\*/g, '').replace(/`/g, '');
  
  // 截断过长消息
  if (summary.length > 80) {
    summary = summary.substring(0, 80) + '...';
  }
  
  return `🔄 [${agentName}] ${summary}`;
}

async function handleAgentEvent(event) {
  const { agentId, runId, message } = event;
  
  if (!shouldProcessAgent(agentId)) return;
  
  // 初始化事件缓冲
  if (!agentEventBuffer.has(agentId)) {
    agentEventBuffer.set(agentId, []);
  }
  
  // 检测任务开始
  if (!runState.has(runId)) {
    runState.set(runId, { agentId, startTime: Date.now() });
    const agentName = AGENT_NAMES[agentId] || agentId;
    await sendFeishuMessage(`🚀 [${agentName}] 开始处理新任务`);
    return;
  }
  
  // 缓冲事件
  agentEventBuffer.get(agentId).push(event);
  
  // 检测任务完成
  const completionKeywords = ['完成', '已完成', '任务完成', 'done', 'finished', 'completed', '✅'];
  if (completionKeywords.some(kw => message.toLowerCase().includes(kw))) {
    const agentName = AGENT_NAMES[agentId] || agentId;
    await sendFeishuMessage(`✅ [${agentName}] 任务完成`);
    runState.delete(runId);
    agentEventBuffer.delete(agentId);
    throttleState.delete(agentId);
    return;
  }
  
  // 节流检查
  if (shouldThrottle(agentId)) {
    return;
  }
  
  // 生成摘要并推送
  const events = agentEventBuffer.get(agentId);
  const summary = generateSummary(agentId, events);
  if (summary) {
    await sendFeishuMessage(summary);
    agentEventBuffer.set(agentId, []);
    throttleState.set(agentId, Date.now());
  }
}

// ============================================
// 主循环
// ============================================

function startWatcher() {
  const logFile = getTodayLogFile();
  
  console.log(`[WATCHER] Starting to watch: ${logFile}`);
  
  // 检查文件是否存在
  if (!fs.existsSync(logFile)) {
    console.log(`[WATCHER] Log file not found, waiting...`);
    setTimeout(startWatcher, 5000);
    return;
  }
  
  const tail = spawn('tail', ['-F', '-n', '0', logFile]);
  
  const rl = readline.createInterface({
    input: tail.stdout,
    crlfDelay: Infinity
  });
  
  rl.on('line', (line) => {
    const event = parseLogLine(line);
    if (event && event.type === 'agent:nested') {
      handleAgentEvent(event);
    }
  });
  
  tail.stderr.on('data', (data) => {
    console.error(`[TAIL ERROR] ${data}`);
  });
  
  tail.on('close', (code) => {
    console.log(`[WATCHER] Tail process exited with code ${code}`);
    setTimeout(startWatcher, 5000);
  });
  
  // 优雅退出
  const shutdown = () => {
    console.log('[WATCHER] Shutting down...');
    tail.kill();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ============================================
// 启动
// ============================================

console.log('========================================');
console.log('  OpenClaw Agent Watcher v2');
console.log('  (Feishu API Push)');
console.log('========================================');

loadConfig();

if (!feishuConfig) {
  console.error('[ERROR] No feishu config found in openclaw.json');
  process.exit(1);
}

if (config.enabled) {
  // 先测试飞书连接
  console.log('[INIT] Testing feishu connection...');
  getTenantAccessToken()
    .then(() => {
      console.log('[INIT] Feishu connection OK');
      startWatcher();
    })
    .catch((e) => {
      console.error('[INIT] Feishu connection failed:', e.message);
      // 即使失败也启动，后续会重试
      startWatcher();
    });
} else {
  console.log('[WATCHER] Disabled in config');
}
