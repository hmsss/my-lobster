#!/bin/bash
# agent-interrupt.sh - 中断 Agent 任务的 CLI 工具
# 用法：
#   agent-interrupt.sh              # 中断当前正在运行的 Agent
#   agent-interrupt.sh -all         # 中断所有正在运行的 Agent
#   agent-interrupt.sh <agent-id>   # 中断指定的 Agent

set -e

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
TASK_STATE="$MEMORY_DIR/task-state.json"
AGENTS_DIR="/root/.openclaw/agents"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取正在运行的 Agent 列表
get_running_agents() {
    if [[ ! -f "$TASK_STATE" ]]; then
        echo ""
        return
    fi
    
    jq -r '.agents | to_entries[] | select(.value.status == "working") | .key' "$TASK_STATE" 2>/dev/null || echo ""
}

# 获取 Agent 名称
get_agent_name() {
    local agent_id="$1"
    case "$agent_id" in
        "product-manager") echo "产品经理" ;;
        "engineering-full-stack-developer") echo "全栈工程师" ;;
        "testing-senior-qa-engineer") echo "测试工程师" ;;
        "main") echo "CEO" ;;
        *) echo "$agent_id" ;;
    esac
}

# 发送中断消息到 Agent
send_interrupt_message() {
    local agent_id="$1"
    local agent_name=$(get_agent_name "$agent_id")
    
    # 查找 Agent 的活跃会话
    local sessions_file="$AGENTS_DIR/$agent_id/sessions/sessions.json"
    
    if [[ ! -f "$sessions_file" ]]; then
        log_warn "Agent $agent_name 没有活跃会话"
        return 1
    fi
    
    # 获取最新的群聊会话
    local session_key=$(jq -r 'to_entries[] | select(.key | contains("feishu:group")) | .key' "$sessions_file" 2>/dev/null | head -1)
    
    if [[ -z "$session_key" ]]; then
        log_warn "Agent $agent_name 没有群聊会话"
        return 1
    fi
    
    # 使用 sessions_send 发送中断消息
    # 这里需要通过 OpenClaw 的 API 发送
    log_info "发送中断消息到 $agent_name: $session_key"
    
    # 创建中断标记文件
    local interrupt_flag="$MEMORY_DIR/interrupt-$agent_id.flag"
    echo "{\"timestamp\":\"$(date -Iseconds)\",\"reason\":\"user_interrupt\"}" > "$interrupt_flag"
    
    return 0
}

# 更新 Agent 状态为 idle
update_agent_status() {
    local agent_id="$1"
    
    if [[ ! -f "$TASK_STATE" ]]; then
        log_warn "状态文件不存在"
        return 1
    fi
    
    # 使用 jq 更新状态
    local tmp_file=$(mktemp)
    jq --arg agent "$agent_id" '.agents[$agent].status = "idle" | .agents[$agent].currentTask = null | .agents[$agent].completedAt = (now | todate)' "$TASK_STATE" > "$tmp_file"
    mv "$tmp_file" "$TASK_STATE"
    
    log_info "已更新 $agent_id 状态为 idle"
}

# 中断单个 Agent
interrupt_agent() {
    local agent_id="$1"
    local agent_name=$(get_agent_name "$agent_id")
    
    log_info "正在中断 $agent_name ..."
    
    # 1. 发送中断消息
    send_interrupt_message "$agent_id"
    
    # 2. 更新状态
    update_agent_status "$agent_id"
    
    # 3. 尝试终止相关进程（可选）
    local pid=$(ps aux | grep -E "node.*$agent_id" | grep -v grep | awk '{print $2}' | head -1)
    if [[ -n "$pid" ]]; then
        log_warn "发现进程 $pid，发送 SIGTERM..."
        kill -TERM "$pid" 2>/dev/null || true
    fi
    
    log_info "✅ $agent_name 已中断"
}

# 中断所有 Agent
interrupt_all() {
    local running_agents=$(get_running_agents)
    
    if [[ -z "$running_agents" ]]; then
        log_info "没有正在运行的 Agent"
        return 0
    fi
    
    log_info "正在中断所有 Agent..."
    
    local count=0
    for agent_id in $running_agents; do
        interrupt_agent "$agent_id"
        ((count++))
    done
    
    log_info "✅ 已中断 $count 个 Agent"
}

# 显示状态
show_status() {
    echo ""
    echo "========================================"
    echo "  Agent 任务状态"
    echo "========================================"
    
    if [[ ! -f "$TASK_STATE" ]]; then
        echo "状态文件不存在"
        return
    fi
    
    jq -r '.agents | to_entries[] | "\(.key): \(.value.status) - \(.value.currentTask // "无任务")"' "$TASK_STATE" 2>/dev/null
    
    echo ""
}

# 显示所有员工详细工作状态
show_all_status() {
    echo ""
    echo "========================================"
    echo "  📊 员工工作状态总览"
    echo "========================================"
    echo ""
    
    if [[ ! -f "$TASK_STATE" ]]; then
        echo "❌ 状态文件不存在: $TASK_STATE"
        return 1
    fi
    
    # 定义所有员工（包括 CEO）
    local all_agents=("main" "product-manager" "engineering-full-stack-developer" "testing-senior-qa-engineer")
    
    for agent_id in "${all_agents[@]}"; do
        local agent_name=$(get_agent_name "$agent_id")
        local status=$(jq -r ".agents.\"$agent_id\".status // \"unknown\"" "$TASK_STATE" 2>/dev/null)
        local task=$(jq -r ".agents.\"$agent_id\".currentTask // \"无任务\"" "$TASK_STATE" 2>/dev/null)
        local progress=$(jq -r ".agents.\"$agent_id\".progress // \"-\"" "$TASK_STATE" 2>/dev/null)
        local started=$(jq -r ".agents.\"$agent_id\".startedAt // \"-\"" "$TASK_STATE" 2>/dev/null)
        local last_check=$(jq -r ".agents.\"$agent_id\".lastCheckAt // \"-\"" "$TASK_STATE" 2>/dev/null)
        
        # 状态颜色
        local status_icon status_color
        case "$status" in
            "working")
                status_icon="🔄"
                status_color="${YELLOW}"
                ;;
            "idle")
                status_icon="💤"
                status_color="${GREEN}"
                ;;
            "completed")
                status_icon="✅"
                status_color="${GREEN}"
                ;;
            "blocked")
                status_icon="🚫"
                status_color="${RED}"
                ;;
            *)
                status_icon="❓"
                status_color="${NC}"
                ;;
        esac
        
        echo -e "${status_color}${status_icon} ${agent_name}${NC}"
        echo "   状态: $status"
        echo "   任务: $task"
        if [[ "$status" == "working" ]]; then
            echo "   进度: $progress"
            echo "   开始: $started"
            echo "   最后检查: $last_check"
        fi
        echo ""
    done
    
    # 统计
    local working_count=$(jq '[.agents | to_entries[] | select(.value.status == "working")] | length' "$TASK_STATE" 2>/dev/null)
    local idle_count=$(jq '[.agents | to_entries[] | select(.value.status == "idle")] | length' "$TASK_STATE" 2>/dev/null)
    local completed_count=$(jq '[.agents | to_entries[] | select(.value.status == "completed")] | length' "$TASK_STATE" 2>/dev/null)
    
    echo "----------------------------------------"
    echo "📈 统计: 🔄工作中=$working_count | 💤空闲=$idle_count | ✅完成=$completed_count"
    echo "========================================"
    echo ""
}

# 主函数
main() {
    local arg="${1:-}"
    
    case "$arg" in
        -all|--all|all)
            interrupt_all
            ;;
        -status|status)
            show_status
            ;;
        -ai|ai|--all-status)
            show_all_status
            ;;
        -h|--help|help)
            echo "用法："
            echo "  agent-interrupt.sh          # 中断当前正在运行的 Agent"
            echo "  agent-interrupt.sh -all     # 中断所有正在运行的 Agent"
            echo "  agent-interrupt.sh <id>     # 中断指定的 Agent"
            echo "  agent-interrupt.sh -status  # 查看状态（简洁）"
            echo "  agent-interrupt.sh -ai      # 查看所有员工详细工作状态"
            ;;
        "")
            # 中断当前正在运行的 Agent
            local running=$(get_running_agents | head -1)
            if [[ -n "$running" ]]; then
                interrupt_agent "$running"
            else
                log_info "没有正在运行的 Agent"
            fi
            ;;
        *)
            # 中断指定的 Agent
            interrupt_agent "$arg"
            ;;
    esac
}

main "$@"
