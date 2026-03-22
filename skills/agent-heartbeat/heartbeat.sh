#!/bin/bash
# agent-heartbeat/heartbeat.sh
# 用法: ./heartbeat.sh <BotAppId> <BotAppSecret> <chatId> <agentName> [working_msg]
# 每10秒发送一次心跳，失败自动重试，PID写入heartbeat.pid便于终止

BOT_APP_ID="$1"
BOT_APP_SECRET="$2"
CHAT_ID="$3"
AGENT_NAME="$4"
WORKING_MSG="${5:-工作中}"
PID_FILE="/tmp/heartbeat-$$.pid"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEND_BOT="$SCRIPT_DIR/../novel-writing-command/send-as-bot.js"

# 写入PID文件
echo $$ > "$PID_FILE"

# 设置信号捕获，收到TERM/SIGINT时删除PID文件并退出
cleanup() {
  rm -f "$PID_FILE"
  exit 0
}
trap cleanup SIGTERM SIGINT EXIT

# 心跳计数器
beat=0
max_retries=3
retry_delay=2

while true; do
  msg="【${AGENT_NAME}】${WORKING_MSG}... (${beat})"
  
  # 尝试发送，重试max_retries次
  for attempt in $(seq 1 $max_retries); do
    result=$(node "$SEND_BOT" "$BOT_APP_ID" "$BOT_APP_SECRET" "$CHAT_ID" "$msg" 2>&1)
    if echo "$result" | grep -q "SUCCESS"; then
      break
    fi
    if [ $attempt -lt $max_retries ]; then
      sleep $retry_delay
    fi
  done
  
  beat=$((beat + 1))
  sleep 10
done
