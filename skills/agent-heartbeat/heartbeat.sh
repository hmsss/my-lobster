#!/bin/bash
# heartbeat.sh - Bash版心跳脚本（备选，兼容性更好）
# 用法: ./heartbeat.sh <BotAppId> <BotAppSecret> <chatId> <agentName> [working_msg]

APP_ID="$1"
BOT_SECRET="$2"
CHAT_ID="$3"
AGENT_NAME="$4"
shift 4
WORKING_MSG="${*:-工作中}"

PID_FILE="/tmp/heartbeat-${AGENT_NAME}.pid"
LOG_FILE="/tmp/heartbeat-${AGENT_NAME}.log"
HEARTBEAT_URL="https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id"
TOKEN_URL="https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"

if [ -z "$APP_ID" ] || [ -z "$BOT_SECRET" ] || [ -z "$CHAT_ID" ] || [ -z "$AGENT_NAME" ]; then
  echo "用法: heartbeat.sh <AppId> <BotSecret> <chatId> <agentName> [working_msg]"
  exit 1
fi

# 写入PID
echo $$ > "$PID_FILE"

# 清理函数
cleanup() {
  rm -f "$PID_FILE"
  exit 0
}
trap cleanup SIGTERM SIGINT EXIT

# 获取token
get_token() {
  RESPONSE=$(curl -s -X POST "$TOKEN_URL" \
    -H "Content-Type: application/json" \
    -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$BOT_SECRET\"}")
  echo "$RESPONSE" | grep -o '"tenant_access_token":"[^"]*"' | cut -d'"' -f4
}

# 发送心跳
send_beat() {
  local count=$1
  local msg="【${AGENT_NAME}】${WORKING_MSG}... (${count})"
  
  TOKEN=$(get_token)
  if [ -z "$TOKEN" ]; then
    echo "[$AGENT_NAME] 获取token失败"
    return 1
  fi

  curl -s -X POST "$HEARTBEAT_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"receive_id\":\"$CHAT_ID\",\"msg_type\":\"text\",\"content\":{\"text\":\"$msg\"}}" > /dev/null
    
  echo "[$AGENT_NAME] 心跳 #$count 发送成功"
}

# 主循环
echo "[$AGENT_NAME] 心跳启动，每10秒一次，PID: $$"
count=0
while true; do
  send_beat $count
  count=$((count + 1))
  sleep 10 &
  wait $!
done
