#!/usr/bin/env node
/**
 * 以指定 Bot 身份发送飞书消息
 * 用法: node send-as-bot.js <appId> <appSecret> <chatId> <message>
 */

const https = require('https');

const [,, appId, appSecret, chatId, ...msgParts] = process.argv;
const message = msgParts.join(' ');

if (!appId || !appSecret || !chatId || !message) {
  console.error('用法: node send-as-bot.js <appId> <appSecret> <chatId> <message>');
  process.exit(1);
}

const content = JSON.stringify({ text: message });

// 1. 获取 tenant access token
const tokenData = JSON.stringify({ app_id: appId, app_secret: appSecret });
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
    if (!token) { console.error('获取 token 失败'); process.exit(1); }

    // 2. 发送消息
    const msgData = JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: content
    });
    const msgReq = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(msgData)
      }
    }, (res2) => {
      let r = '';
      res2.on('data', d => r += d);
      res2.on('end', () => {
        const result = JSON.parse(r);
        if (result.code === 0) {
          console.log('SUCCESS:', result.data.message_id);
        } else {
          console.error('FAIL:', result.msg);
        }
      });
    });
    msgReq.write(msgData);
    msgReq.end();
  });
});
tokenReq.write(tokenData);
tokenReq.end();
