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
 */

const https = require('https');
const { spawn, execSync } = require('child_process');

const [, , botAppId, botAppSecret, chatId, agentName, ...workingMsgParts] = process.argv;
const workingMsg = workingMsgParts.join(' ') || '工作中';

if (!botAppId || !botAppSecret || !chatId || !agentName) {
  console.error('用法: node heartbeat.js <BotAppId> <BotAppSecret> <chatId> <agentName> [working_msg]');
  process.exit(1);
}

const SEND_BOT = `${__dirname}/../novel-writing-command/send-as-bot.js`;
const PID_FILE = `/tmp/heartbeat-${agentName}.pid`;

// 写入 PID
require('fs').writeFileSync(PID_FILE, String(process.pid));

// 清理函数
function cleanup() {
  try { require('fs').unlinkSync(PID_FILE); } catch (e) {}
  process.exit(0);
}
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// 获取 token 并发送消息
function sendHeartbeat(beat) {
  const text = `【${agentName}】${workingMsg}... (${beat})`;
  const content = JSON.stringify({ text });
  
  // 1. 获取 token
  const tokenData = JSON.stringify({ app_id: botAppId, app_secret: botAppSecret });
  
  const tokenReq = https.request({
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tokenData) }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const token = JSON.parse(body).tenant_access_token;
      if (!token) { retry(beat, 0); return; }
      
      // 2. 发送消息
      const msgData = JSON.stringify({ receive_id: chatId, msg_type: 'text', content });
      const msgReq = https.request({
        hostname: 'open.feishu.cn',
        path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'Content-Length': Buffer.byteLength(msgData) }
      }, (res2) => {
        let r = '';
        res2.on('data', d => r += d);
        res2.on('end', () => {
          const result = JSON.parse(r);
          if (result.code !== 0) {
            console.error(`[${agentName}] 发送失败: ${result.msg}, 重试中...`);
            retry(beat, 0);
          } else {
            console.log(`[${agentName}] 心跳 #${beat} 发送成功`);
          }
        });
      });
      msgReq.on('error', () => { retry(beat, 0); });
      msgReq.write(msgData);
      msgReq.end();
    });
  });
  tokenReq.on('error', () => { retry(beat, 0); });
  tokenReq.write(tokenData);
  tokenReq.end();
}

function retry(beat, attempt) {
  if (attempt < 3) {
    setTimeout(() => sendHeartbeat(beat), 2000);
  }
}

let beat = 0;
function loop() {
  sendHeartbeat(beat);
  beat++;
  setTimeout(loop, 10000);
}

console.log(`[${agentName}] 心跳启动，每10秒一次，PID: ${process.pid}`);
loop();
