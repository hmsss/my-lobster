#!/usr/bin/env node
/**
 * feishu-bot-manager
 * 飞书机器人配置 + 员工生命周期管理
 *
 * 功能：
 * 1. 部署员工 - 添加飞书账户 + 绑定 Agent
 * 2. 解雇员工 - 移除绑定 + 禁用账户
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 配置路径
const HOME_DIR = os.homedir();
const CONFIG_PATH = path.join(HOME_DIR, '.openclaw', 'openclaw.json');
const BACKUP_DIR = path.join(HOME_DIR, '.openclaw', 'backups');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERR]${colors.reset} ${msg}`),
  step: (num, total, msg) => console.log(`\n${colors.cyan}[${num}/${total}]${colors.reset} ${msg}`),
  preview: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`),
  bold: (msg) => console.log(`${colors.bold}${msg}${colors.reset}`)
};

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function resolveWorkspaceRoot(options) {
  if (options.workspace) return path.resolve(options.workspace);
  if (process.env.OPENCLAW_WORKSPACE) return path.resolve(process.env.OPENCLAW_WORKSPACE);
  return process.cwd();
}

function resolveAgentDir(workspaceRoot, agentId) {
  if (!agentId) return null;
  return path.join(workspaceRoot, 'agency-agents', agentId);
}

function ensureAgentMemoryInfra(agentDir, agentId) {
  if (!agentDir) return;
  ensureDir(path.join(agentDir, 'memory', 'lessons'));

  const sessionPath = path.join(agentDir, 'SESSION-STATE.md');
  const memoryPath = path.join(agentDir, 'MEMORY.md');

  if (!fs.existsSync(sessionPath)) {
    fs.writeFileSync(
      sessionPath,
      `# SESSION-STATE.md -- ${agentId} 工作内存\n\n## 当前任务\n[无]\n\n## 关键上下文\n[无]\n\n## 待办事项\n- [ ] 无\n\n---\n*初始化创建*\n`,
      'utf8'
    );
  }

  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(
      memoryPath,
      `# ${agentId} 长期记忆\n\n保持 5KB 以内。只保留有复用价值的内容。\n\n## 工作模式\n[待记录]\n\n## 最佳实践\n[待记录]\n\n## 踩坑记录\n[待记录]\n`,
      'utf8'
    );
  }
}

function loadPersonaText(options) {
  const persona = options.persona && options.persona !== 'true' ? String(options.persona) : null;
  if (persona) return persona.trim();

  const personaPath =
    options.personapath && options.personapath !== 'true' ? String(options.personapath) : null;
  if (!personaPath) return null;

  const content = safeReadText(path.resolve(personaPath));
  if (!content) {
    log.warning(`未读取到 persona 文件: ${personaPath}`);
    return null;
  }
  return content.trim();
}

function inferDomainFromAgentId(agentId) {
  const id = String(agentId || '').toLowerCase();
  if (id.includes('recruit') || id.includes('hr') || id.includes('talent')) return '招聘/HR';
  if (id.includes('sales') || id.includes('outbound') || id.includes('crm')) return '销售';
  if (id.includes('marketing') || id.includes('content') || id.includes('growth')) return '市场/内容';
  if (id.includes('support') || id.includes('cs') || id.includes('customer')) return '客服/支持';
  if (id.includes('engineering') || id.includes('dev') || id.includes('backend') || id.includes('frontend'))
    return '研发';
  if (id.includes('product') || id.includes('pm')) return '产品';
  if (id.includes('design') || id.includes('ux') || id.includes('ui')) return '设计/体验';
  if (id.includes('testing') || id.includes('qa')) return '测试/质量';
  if (id.includes('ops') || id.includes('sre') || id.includes('infra')) return '运维/基础设施';
  return '通用';
}

function generatePersonaText(options, agentId) {
  const need = options.need && options.need !== 'true' ? String(options.need).trim() : '';
  const roleName = options.rolename && options.rolename !== 'true' ? String(options.rolename).trim() : '';
  const domain = inferDomainFromAgentId(agentId);

  if (!need) return null;

  const lines = [];
  lines.push(`# 自动生成画像（基于需求）`);
  lines.push('');
  if (roleName) lines.push(`- 角色名：${roleName}`);
  lines.push(`- 领域：${domain}`);
  lines.push(`- Agent ID：${agentId}`);
  lines.push('');
  lines.push('## 核心定位');
  lines.push(`你是一个面向“${domain}”场景的专业执行者，优先围绕以下需求交付结果：`);
  lines.push('');
  lines.push(need);
  lines.push('');
  lines.push('## 工作方式');
  lines.push('- 先把需求拆成可交付的 3-7 个小步骤，再逐步推进');
  lines.push('- 每一步都明确输入/输出/验收标准；信息不足就列出缺口并给出最小化假设');
  lines.push('- 避免泛泛而谈，默认用结构化清单输出');
  lines.push('');
  lines.push('## 输出偏好（默认）');
  lines.push('- 结论在前，细节在后');
  lines.push('- 给出可复制粘贴的内容（话术、清单、表格字段、流程步骤）');
  lines.push('- 明确风险点与替代方案');
  lines.push('');
  lines.push('## 专业边界');
  lines.push('- 不编造外部事实（如时间、政策、公司信息）；需要时要求提供来源或改为提出验证步骤');
  lines.push('- 不泄露私密信息到群聊/共享文件，除非用户明确授权');
  lines.push('');
  return lines.join('\n');
}

function injectPersona(agentDir, agentId, personaText) {
  if (!agentDir || !agentId || !personaText) return;

  const now = new Date().toISOString();
  const sessionPath = path.join(agentDir, 'SESSION-STATE.md');
  const memoryPath = path.join(agentDir, 'MEMORY.md');

  const sessionContent = safeReadText(sessionPath) || '';
  const memoryContent = safeReadText(memoryPath) || '';

  const upsertSection = (content, heading, newSectionText) => {
    const normalized = content || '';
    const startIdx = normalized.indexOf(heading);
    if (startIdx === -1) return normalized.trimEnd() + '\n\n' + newSectionText + '\n';

    const afterStart = startIdx + heading.length;
    const nextHeadingIdx = normalized.indexOf('\n## ', afterStart);
    if (nextHeadingIdx === -1) {
      return normalized.slice(0, startIdx).trimEnd() + '\n\n' + newSectionText + '\n';
    }

    return (
      normalized.slice(0, startIdx).trimEnd() +
      '\n\n' +
      newSectionText +
      '\n' +
      normalized.slice(nextHeadingIdx).trimStart()
    );
  };

  const block = [
    '## 候选人人设/画像',
    `*注入时间：${now}*`,
    '',
    personaText,
    ''
  ].join('\n');

  const nextSession = upsertSection(sessionContent, '## 候选人人设/画像', block);
  const nextMemory = upsertSection(memoryContent, '## 候选人人设/画像', block);

  fs.writeFileSync(sessionPath, nextSession, 'utf8');
  fs.writeFileSync(memoryPath, nextMemory, 'utf8');
}

// 读取配置
function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    log.error(`读取配置失败: ${err.message}`);
    process.exit(1);
  }
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    log.error(`保存配置失败: ${err.message}`);
    return false;
  }
}

// 创建备份
function createBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `openclaw.json.${timestamp}`);
    fs.copyFileSync(CONFIG_PATH, backupPath);
    return backupPath;
  } catch (err) {
    log.error(`创建备份失败: ${err.message}`);
    return null;
  }
}

// 显示路由方案说明
function showRoutingOptions() {
  console.log(`
${colors.bold}路由绑定方案${colors.reset}

${colors.bold}方案 1：账户级绑定${colors.reset}
  该飞书账户的所有消息 -> 指定 Agent
  适用：一个机器人专门服务一个 Agent

${colors.bold}方案 2：群聊级绑定${colors.reset}
  特定群聊的消息 -> 指定 Agent
  适用：把 Agent 绑定到特定群聊

${colors.yellow}提示：群聊级绑定优先级更高，会覆盖账户级绑定！${colors.reset}
`);
}

// 快速模式
async function quickMode(options) {
  console.log(`\n${colors.cyan}飞书机器人配置助手${colors.reset}\n`);
  
  const { 
    appid, 
    appsecret, 
    accountid,
    botname,
    agentid, 
    chatid,
    routingmode
  } = options;
  
  if (!appid || !appsecret) {
    log.error('需要提供 --app-id 和 --app-secret');
    process.exit(1);
  }
  
  const config = loadConfig();
  const accountId = accountid || `bot-${Date.now()}`;
  const workspaceRoot = resolveWorkspaceRoot(options);
  const agentDir = resolveAgentDir(workspaceRoot, agentid);
  const allowAutoPersona =
    (options.autopersona && options.autopersona !== 'false') ||
    (options.need && options.need !== 'true');
  const personaText =
    loadPersonaText(options) || (allowAutoPersona ? generatePersonaText(options, agentid) : null);
  
  // 创建备份
  const backupPath = createBackup();
  log.success(`配置已备份: ${path.basename(backupPath)}`);
  
  // 确保 channels.feishu.accounts 存在
  if (!config.channels) config.channels = {};
  if (!config.channels.feishu) config.channels.feishu = { enabled: true };
  if (!config.channels.feishu.accounts) config.channels.feishu.accounts = {};
  
  // 添加账户
  config.channels.feishu.accounts[accountId] = {
    appId: appid,
    appSecret: appsecret,
    botName: botname || 'Feishu Bot',
    dmPolicy: options.dmpolicy || 'open',
    allowFrom: ['*'],
    enabled: true
  };
  
  // 添加绑定
  if (!config.bindings) config.bindings = [];
  
  const mode = routingmode || 'account';
  
  if (mode === 'account' && agentid) {
    // 账户级绑定：该账户所有消息路由到指定 Agent
    config.bindings.push({
      agentId: agentid,
      match: {
        channel: 'feishu',
        accountId: accountId
      }
    });
    log.success(`已添加账户级绑定: ${agentid} ← ${accountId}`);
  } else if (mode === 'group' && agentid && chatid) {
    // 群聊级绑定：特定群聊消息路由到指定 Agent
    config.bindings.push({
      agentId: agentid,
      match: {
        channel: 'feishu',
        peer: { kind: 'group', id: chatid }
      }
    });
    log.success(`已添加群聊级绑定: ${agentid} ← ${chatid}`);
  }

  // 员工画像注入（可选）
  if (agentid) {
    if (!fs.existsSync(agentDir)) {
      log.warning(`未找到 Agent 目录（将跳过画像注入）: ${agentDir}`);
    } else {
      ensureAgentMemoryInfra(agentDir, agentid);
      if (personaText) {
        injectPersona(agentDir, agentid, personaText);
        log.success(`已注入候选人人设到: agency-agents/${agentid}/SESSION-STATE.md, MEMORY.md`);
      } else {
        log.info('未提供 --persona/--persona-path，且未提供 --need（或 --auto-persona），跳过画像注入');
      }
    }
  }
  
  saveConfig(config);
  log.success('配置已更新');
  
  // 设置会话绑定颗粒度
  log.info('设置会话绑定颗粒度...');
  try {
    execSync('openclaw config set session.dmScope "per-account-channel-peer"', { stdio: 'pipe' });
    log.success('会话绑定颗粒度已设置');
  } catch (err) {
    log.warning('设置 dmScope 失败，请手动执行:');
    console.log('  openclaw config set session.dmScope "per-account-channel-peer"');
  }
  
  // 重启
  log.warning('正在重启 Gateway...');
  try {
    execSync('openclaw gateway restart', { stdio: 'inherit' });
    log.success('Gateway 重启完成');
  } catch (err) {
    log.error(`重启失败: ${err.message}`);
    log.info('请手动执行: openclaw gateway restart');
  }
  
  // 完成提示
  console.log('\n' + '─'.repeat(50));
  log.success('配置完成！');
  console.log('\n配置摘要:');
  console.log(`  账户 ID: ${accountId}`);
  console.log(`  路由模式: ${mode}`);
  if (agentid) console.log(`  Agent: ${agentid}`);
  if (chatid) console.log(`  群聊: ${chatid}`);
  console.log('\n如配置有误，可从备份恢复:');
  console.log(`  cp ${backupPath} ${CONFIG_PATH}`);
  console.log('─'.repeat(50) + '\n');
}

// 解雇模式
function decommissionMode(options) {
  console.log(`\n${colors.cyan}员工解雇流程${colors.reset}\n`);

  const accountId = options.accountid;
  if (!accountId) {
    log.error('需要提供 --account-id 指定要解雇的员工账户');
    process.exit(1);
  }

  const config = loadConfig();

  const account = config.channels?.feishu?.accounts?.[accountId];
  if (!account) {
    log.error(`未找到账户: ${accountId}`);
    process.exit(1);
  }

  const backupPath = createBackup();
  log.success(`配置已备份: ${path.basename(backupPath)}`);

  // 禁用账户（保留配置但设为 disabled，比删除更安全）
  account.enabled = false;
  log.success(`已禁用账户: ${accountId}`);

  // 移除所有关联的 bindings
  const originalCount = (config.bindings || []).length;
  config.bindings = (config.bindings || []).filter(b => {
    const isAccountBinding = b.match?.accountId === accountId;
    if (isAccountBinding) {
      log.success(`已移除绑定: ${b.agentId} <- ${accountId}`);
    }
    return !isAccountBinding;
  });
  const removedCount = originalCount - config.bindings.length;

  saveConfig(config);
  log.success('配置已更新');

  // 重启
  log.warning('正在重启 Gateway...');
  try {
    execSync('openclaw gateway restart', { stdio: 'inherit' });
    log.success('Gateway 重启完成');
  } catch (err) {
    log.error(`重启失败: ${err.message}`);
    log.info('请手动执行: openclaw gateway restart');
  }

  console.log('\n' + '─'.repeat(50));
  log.success('解雇完成');
  console.log('\n解雇摘要:');
  console.log(`  账户 ID: ${accountId}`);
  console.log(`  移除绑定数: ${removedCount}`);
  console.log(`  账户状态: disabled`);
  console.log('\n请同步更新 TEAM.md 移除该员工记录。');
  console.log('如需恢复，可从备份还原:');
  console.log(`  cp ${backupPath} ${CONFIG_PATH}`);
  console.log('─'.repeat(50) + '\n');
}

// 处理命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-/g, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      options[key] = value;
      if (value !== 'true') i++;
    }
  }
  
  return options;
}

// 主入口
const options = parseArgs();

if (options.help || options.h) {
  showRoutingOptions();
  console.log(`
${colors.bold}用法:${colors.reset}
  node index.js [选项]

${colors.bold}部署员工:${colors.reset}
  --app-id <id>          飞书 App ID (必填)
  --app-secret <secret>  飞书 App Secret (必填)
  --account-id <id>      账户标识 (可选, 默认自动生成)
  --bot-name <name>      机器人名称 (可选)
  --dm-policy <policy>   DM 策略: open/pairing/allowlist (默认: open)
  --agent-id <id>        要绑定的 Agent ID (可选)
  --chat-id <id>         群聊 ID oc_xxx (群聊绑定时需要)
  --routing-mode <mode>  路由模式: account/group (默认: account)
  --workspace <path>     工作区根目录 (可选, 默认当前目录)
  --persona <text>       直接注入候选人人设文本 (可选)
  --persona-path <path>  从文件读取候选人人设文本 (可选)
  --need <text>          当未提供 persona 时，基于需求自动生成并注入画像 (可选)
  --role-name <text>     自动生成画像时可用：角色中文名 (可选)
  --auto-persona <bool>  强制启用自动生成画像 (默认: false；需配合 --need 才会生成)

${colors.bold}解雇员工:${colors.reset}
  --decommission         启用解雇模式
  --account-id <id>      要解雇的员工账户 ID (必填)

${colors.bold}其他:${colors.reset}
  --help, -h             显示帮助

${colors.bold}示例:${colors.reset}
  # 部署 - 账户级绑定
  node index.js --app-id cli_xxx --app-secret yyy --agent-id recruiter --routing-mode account

  # 部署 - 群聊级绑定
  node index.js --app-id cli_xxx --app-secret yyy --agent-id recruiter --chat-id oc_xxx --routing-mode group

  # 解雇员工
  node index.js --decommission --account-id bot-sales
`);
  process.exit(0);
}

if (options.decommission) {
  decommissionMode(options);
} else if (options.appid) {
  quickMode(options);
} else {
  log.error('请提供 --app-id (部署) 或 --decommission (解雇)，或使用 --help 查看帮助');
  process.exit(1);
}
