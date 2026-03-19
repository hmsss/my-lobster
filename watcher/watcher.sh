#!/bin/bash
#
# OpenClaw Agent Watcher - 简化版
# 直接使用 tail + grep + curl 实现实时监听和推送
#

LOG_FILE="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
CHAT_ID="oc_ca8c8228db2c4628c5ab9715c7425896"
THROTTLE_FILE="/tmp/watcher_throttle"
THROTTLE_SEC=30

# Agent 名称映射
declare -A AGENT_NAMES
AGENT_NAMES["product-manager"]="产品经理"
AGENT_NAMES["engineering-full-stack-developer"]="全栈工程师"
AGENT_NAMES["testing-senior-qa-engineer"]="测试工程师"
AGENT_NAMES["main"]="CEO"

# 初始化节流文件
mkdir -p /tmp/watcher_state

# 推送到飞书
push_to_feishu() {
    local message="$1"
    echo "[FEISHU] $message"
    
    # TODO: 实现实际的飞书推送
    # 可以通过：
    # 1. 调用 Gateway 的 message 工具
    # 2. 使用飞书 Webhook
    # 3. 使用飞书 API
    
    # 示例：通过 Gateway RPC
    # curl -X POST "http://127.0.0.1:21351/rpc" \
    #   -H "Authorization: Bearer $GATEWAY_TOKEN" \
    #   -H "Content-Type: application/json" \
    #   -d "{\"jsonrpc\":\"2.0\",\"method\":\"message.send\",\"params\":{\"channel\":\"feishu\",\"target\":\"$CHAT_ID\",\"message\":\"$message\"},\"id\":1}"
}

# 检查节流
should_throttle() {
    local agent_id="$1"
    local state_file="/tmp/watcher_state/${agent_id}.last"
    
    if [ -f "$state_file" ]; then
        local last_time=$(cat "$state_file")
        local now=$(date +%s)
        local diff=$((now - last_time))
        
        if [ $diff -lt $THROTTLE_SEC ]; then
            return 0  # 应该节流
        fi
    fi
    
    date +%s > "$state_file"
    return 1  # 不节流
}

# 解析并处理日志行
process_line() {
    local line="$1"
    
    # 检查是否是 agent:nested 日志
    if echo "$line" | grep -q "\[agent:nested\]"; then
        # 提取 agent ID
        local agent_id=$(echo "$line" | grep -oP 'session=agent:\K[^:]+')
        local message=$(echo "$line" | sed 's/.*\[agent:nested\]//' | head -c 200)
        
        # 检查是否在白名单
        case "$agent_id" in
            "product-manager"|"engineering-full-stack-developer"|"testing-senior-qa-engineer")
                # 检测任务完成
                if echo "$message" | grep -qiE "完成|done|finished|completed|✅"; then
                    push_to_feishu "✅ [${AGENT_NAMES[$agent_id]}] 任务完成"
                    return
                fi
                
                # 检测新任务
                if echo "$message" | grep -qiE "开始|start|received"; then
                    push_to_feishu "🚀 [${AGENT_NAMES[$agent_id]}] 开始处理新任务"
                    return
                fi
                
                # 检查节流
                if should_throttle "$agent_id"; then
                    return
                fi
                
                # 生成进度摘要
                local summary=$(echo "$message" | head -c 100)
                if [ ${#summary} -gt 10 ]; then
                    push_to_feishu "🔄 [${AGENT_NAMES[$agent_id]}] $summary"
                fi
                ;;
        esac
    fi
}

# 主循环
echo "========================================"
echo "  OpenClaw Agent Watcher (Bash)"
echo "========================================"
echo "Log file: $LOG_FILE"
echo "Chat ID: $CHAT_ID"
echo "Throttle: ${THROTTLE_SEC}s"
echo ""

# 检查日志文件
if [ ! -f "$LOG_FILE" ]; then
    echo "Warning: Log file not found, will create when available"
fi

# 使用 tail -F 跟踪日志
tail -F -n 0 "$LOG_FILE" 2>/dev/null | while read -r line; do
    process_line "$line"
done
