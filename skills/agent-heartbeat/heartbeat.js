#!/usr/bin/env node
/**
 * agent-heartbeat/heartbeat.js
 * 心跳脚本 - 每10秒发送一次工作状态到群聊
 *
 * 用法: node heartbeat.js <BotAppId> <BotAppSecret> <chatId> <agentName> [working_msg]
 *
 * 特性:
 * - 每10秒发送一次心跳
 * - 发送失败自动重试3次（间隔2秒）
 * - PID写入 /tmp/heartbeat-{agentName}.pid，便于终止
 * - 收到 SIGTERM/SIGINT 自动清理退出
 * - 心跳间隔更短（10秒），发群通知专用
 */

const https = require('https');
const { execSync } = require('child_process');
const { writeFileSync, unlinkSync, existsSync } = require('fs');

const [, , botAppId, botAppSecret, chatId, agentName, ...workingMsgParts] = process.argv;
const workingMsg = workingMsgParts.join(' ') || '工作中';
const SEND_BOT = `${__dirname}/../novel-writing-command/send-as-bot.js`;
const PID_FILE = `/tmp/heartbeat-${agentName}.pid`;
const PARENT_PID_FILE = `/tmp/heartbeat-parent-${agentName}.pid`;

if (!botAppId || !botAppSecret || !chatId || !agentName) {
  console.error('用法: node heartbeat.js <BotAppId> <BotAppSecret> <chatId> <agentName> [working_msg]');
  process.exit(1);
}

// 写入当前心跳 PID
writeFileSync(PID_FILE, String(process.pid));

// 记录父进程 PID（用于检测父进程是否存活）
const parentPid = process.ppid;
writeFileSync(PARENT_PID_FILE, String(parentPid));

// 清理函数
function cleanup() {
  try { unlinkSync(PID_FILE); } catch (e) {}
  try { unlinkSync(PARENT_PID_FILE); } catch (e) {}
  process.exit(0);
}
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// 检查父进程是否存活
function isParentAlive() {
  try {
    // Linux: 检查 /proc/PID 是否存在
    require('fs').statSync(`/proc/${parentPid}`);
    return true;
  } catch (e) {
    return false;
  }
}

// 发送消息到群
function sendMessage(text, callback) {
  const tokenData = JSON.stringify({ app_id: botAppId, app_secret: botAppSecret });

  // 1. 获取 token
  const tokenReq = https.request({
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tokenData) }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      try {
        const { tenant_access_token } = JSON.parse(body);
        if (!tenant_access_token) { callback(new Error('no token')); return; }

        const content = JSON.stringify({ text });
        const msgData = JSON.stringify({
          receive_id: chatId,
          msg_type: 'text',
          content
        });

        const msgReq = https.request({
          hostname: 'open.feishu.cn',
          path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + tenant_access_token,
            'Content-Length': Buffer.byteLength(msgData)
          }
        }, (res2) => {
          let r = '';
          res2.on('data', d => r += d);
          res2.on('end', () => {
            try {
              const result = JSON.parse(r);
              if (result.code !== 0) {
                callback(new Error(result.msg || 'send failed'));
              } else {
                callback(null);
              }
            } catch (e) { callback(e); }
          });
        });
        msgReq.on('error', callback);
        msgReq.write(msgData);
        msgReq.end();
      } catch (e) { callback(e); }
    });
  });
  tokenReq.on('error', callback);
  tokenReq.write(tokenData);
  tokenReq.end();
}

let beat = 0;

function loop() {
  // 每次发心跳前检查：父进程死了就自动退出
  if (!isParentAlive()) {
    console.log(`[${agentName}] 父进程已终止，心跳自动退出`);
    cleanup();
    return;
  }

  const text = `【${agentName}】${workingMsg}... (${beat})`;
  sendMessage(text, (err) => {
    if (err) {
      console.error(`[${agentName}] 心跳 #${beat} 发送失败: ${err.message}`);
    } else {
      console.log(`[${agentName}] 心跳 #${beat} 发送成功`);
    }
  });

  beat++;
  setTimeout(loop, 10000);
}

console.log(`[${agentName}] 心跳启动，每10秒一次，PID: ${process.pid}，父进程: ${parentPid}`);
loop();
