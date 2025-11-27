#!/bin/bash
# ============================================================================
# SCHEDULED VALIDATION SCRIPT
# Task: 4.2.3 - Scheduled Automated Validation
# Purpose: Run validation suite on schedule with alerting and reporting
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_SCRIPT="$PROJECT_ROOT/scripts/run_validation_suite.ts"
OUTPUT_DIR="$PROJECT_ROOT/validation-reports/scheduled"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/scheduled-validation-$TIMESTAMP.log"

# Create directories
mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Alert configuration
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
TEAMS_WEBHOOK="${TEAMS_WEBHOOK:-}"

# Validation levels for different schedules
VALIDATION_LEVELS=(
    "full"      # Daily full validation
    "critical"  # Hourly critical validation
    "quick"     # Every 15 minutes quick validation
)

# Send alert function
send_alert() {
    local severity="$1"
    local message="$2"
    local details="$3"
    
    log "ALERT [$severity]: $message"
    
    # Email alert
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "$message\n\n$details" | mail -s "[$severity] Database Validation Alert" "$ALERT_EMAIL" 2>/dev/null || log "Failed to send email alert"
    fi
    
    # Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local payload=$(cat <<EOF
{
    "text": "[$severity] Database Validation Alert",
    "attachments": [
        {
            "color": "$([ "$severity" = "CRITICAL" ] && echo "danger" || echo "warning")",
            "fields": [
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Details",
                    "value": "$details",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK" 2>/dev/null || log "Failed to send Slack alert"
    fi
    
    # Microsoft Teams alert
    if [[ -n "$TEAMS_WEBHOOK" ]]; then
        local payload=$(cat <<EOF
{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "$([ "$severity" = "CRITICAL" ] && echo "ff0000" || echo "ffa500")",
    "summary": "[$severity] Database Validation Alert",
    "sections": [
        {
            "activityTitle": "[$severity] Database Validation Alert",
            "activitySubtitle": "$message",
            "text": "$details"
        }
    ]
}
EOF
)
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$TEAMS_WEBHOOK" 2>/dev/null || log "Failed to send Teams alert"
    fi
}

# Run validation suite
run_validation() {
    local level="$1"
    local description="$2"
    
    log "Starting $level validation - $description"
    
    local report_file="$OUTPUT_DIR/validation-$level-$TIMESTAMP.json"
    local start_time=$(date +%s)
    
    # Run validation
    if npx tsx "$VALIDATION_SCRIPT" --$level --json > "$report_file" 2>&1; then
        local exit_code=0
        local status="SUCCESS"
        log "$level validation completed successfully"
    else
        local exit_code=$?
        local status="FAILED"
        log "$level validation failed with exit code: $exit_code"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Parse validation results
    local critical_failures=0
    local total_scripts=0
    
    if [[ -f "$report_file" ]] && command -v jq >/dev/null 2>&1; then
        total_scripts=$(jq '.results | length' "$report_file" 2>/dev/null || echo "0")
        critical_failures=$(jq -r '.results[] | select(.status == "FAIL" and (.name | test("critical|permission|auth|migration"))) | .name' "$report_file" 2>/dev/null | wc -l || echo "0")
    fi
    
    # Generate summary
    local summary="Validation Level: $level
Description: $description
Duration: ${duration}s
Status: $status
Total Scripts: $total_scripts
Critical Failures: $critical_failures
Report: $(basename "$report_file")"
    
    log "Validation Summary: $summary"
    
    # Send alerts based on results
    if [[ $exit_code -ne 0 ]]; then
        if [[ $critical_failures -gt 0 ]]; then
            send_alert "CRITICAL" "$level validation failed with critical issues" "$summary"
        else
            send_alert "WARNING" "$level validation failed" "$summary"
        fi
    elif [[ $level == "full" ]]; then
        # Send success notification for daily full validation
        send_alert "INFO" "$level validation completed successfully" "$summary"
    fi
    
    # Cleanup old reports (keep last 30 days)
    find "$OUTPUT_DIR" -name "validation-*.json" -mtime +30 -delete 2>/dev/null || true
    
    return $exit_code
}

# Check if validation is needed based on schedule
should_run_validation() {
    local level="$1"
    local current_hour=$(date +%H)
    local current_minute=$(date +%M)
    
    case $level in
        "quick")
            # Every 15 minutes during business hours (8 AM - 8 PM)
            if [[ $current_hour -ge 08 && $current_hour -le 20 ]]; then
                [[ $((current_minute % 15)) -eq 0 ]]
            else
                return 1  # Don't run outside business hours
            fi
            ;;
        "critical")
            # Every hour
            return 0
            ;;
        "full")
            # Once daily at 2 AM
            [[ $current_hour -eq 02 && $current_minute -eq 00 ]]
            ;;
        *)
            return 1
            ;;
    esac
}

# Health check
health_check() {
    log "Running system health check..."
    
    # Check if required tools are available
    local missing_tools=()
    
    if ! command -v node >/dev/null 2>&1; then
        missing_tools+=("node")
    fi
    
    if ! command -v npx >/dev/null 2>&1; then
        missing_tools+=("npx")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        send_alert "CRITICAL" "Missing required tools" "Required tools not found: ${missing_tools[*]}"
        return 1
    fi
    
    # Check disk space
    local disk_usage=$(df "$OUTPUT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        send_alert "WARNING" "High disk usage" "Disk usage: ${disk_usage}%"
    fi
    
    # Check log file size
    local log_size=$(du -m "$LOG_FILE" 2>/dev/null | cut -f1 || echo "0")
    if [[ $log_size -gt 100 ]]; then
        log "Rotating large log file: $LOG_FILE"
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
    fi
    
    log "Health check completed"
    return 0
}

# Main execution
main() {
    local schedule_type="${1:-auto}"  # auto, quick, critical, full
    
    log "Starting scheduled validation (type: $schedule_type)"
    
    # Run health check
    if ! health_check; then
        exit 1
    fi
    
    local exit_code=0
    
    # Determine what to run
    case $schedule_type in
        "auto")
            # Run based on current time
            for level_info in "${VALIDATION_LEVELS[@]}"; do
                IFS='|' read -r level description <<< "$level_info"
                if should_run_validation "$level"; then
                    if ! run_validation "$level" "$description"; then
                        exit_code=1
                    fi
                fi
            done
            ;;
        "quick"|"critical"|"full")
            local description=$(echo "${VALIDATION_LEVELS[@]}" | tr ' ' '\n' | grep "$schedule_type" | cut -d'|' -f2)
            if [[ -n "$description" ]]; then
                run_validation "$schedule_type" "$description" || exit_code=1
            else
                log "Unknown validation level: $schedule_type"
                exit_code=1
            fi
            ;;
        *)
            log "Unknown schedule type: $schedule_type"
            exit_code=1
            ;;
    esac
    
    log "Scheduled validation completed with exit code: $exit_code"
    exit $exit_code
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            schedule_type="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--type TYPE]"
            echo "Types: auto (default), quick, critical, full"
            exit 0
            ;;
        *)
            log "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$schedule_type"