#!/bin/bash
# ============================================================================
# CI/CD VALIDATION INTEGRATION SCRIPT
# Task: 4.2.2 - CI/CD Integration for Automated Validation
# Purpose: Run validation suite in CI/CD pipelines with proper exit codes
# ============================================================================

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_SCRIPT="$PROJECT_ROOT/scripts/run_validation_suite.ts"
OUTPUT_DIR="$PROJECT_ROOT/validation-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Parse command line arguments
VALIDATION_LEVEL="full"  # full, critical, quick
OUTPUT_FORMAT="json"
UPLOAD_REPORTS="false"
ENVIRONMENT="development"

while [[ $# -gt 0 ]]; do
    case $1 in
        --level)
            VALIDATION_LEVEL="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --upload)
            UPLOAD_REPORTS="true"
            shift
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --level LEVEL     Validation level: full|critical|quick (default: full)"
            echo "  --format FORMAT   Output format: txt|json (default: json)"
            echo "  --upload          Upload reports to external storage"
            echo "  --env ENV         Environment: development|staging|production (default: development)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Environment validation
if [[ -z "${VITE_SUPABASE_URL:-}" ]] || [[ -z "${VITE_SUPABASE_SERVICE_KEY:-}" ]]; then
    log_error "Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY"
    exit 1
fi

log_info "Starting CI Validation Suite"
log_info "Level: $VALIDATION_LEVEL"
log_info "Format: $OUTPUT_FORMAT"
log_info "Environment: $ENVIRONMENT"
log_info "Timestamp: $TIMESTAMP"

# Check if validation script exists
if [[ ! -f "$VALIDATION_SCRIPT" ]]; then
    log_error "Validation script not found: $VALIDATION_SCRIPT"
    exit 1
fi

# Determine which suite to run based on validation level
SUITE_FILTER=""
case $VALIDATION_LEVEL in
    "critical")
        SUITE_FILTER="--suite=environment-health-check --suite=permission-system-validation --suite=auth-synchronization-check --suite=migration-status-check"
        log_info "Running critical validations only"
        ;;
    "quick")
        SUITE_FILTER="--suite=environment-health-check --suite=auth-synchronization-check"
        log_info "Running quick validations"
        ;;
    "full"|*)
        log_info "Running full validation suite"
        SUITE_FILTER=""
        ;;
esac

# Run validation suite
REPORT_FILE="$OUTPUT_DIR/validation-report-$TIMESTAMP.$OUTPUT_FORMAT"
VALIDATION_START=$(date +%s)

log_info "Executing validation suite..."

# Execute validation with proper error handling
if npx tsx "$VALIDATION_SCRIPT" $SUITE_FILTER --$OUTPUT_FORMAT > "$REPORT_FILE" 2>&1; then
    VALIDATION_EXIT_CODE=0
    log_success "Validation suite completed successfully"
else
    VALIDATION_EXIT_CODE=$?
    log_warning "Validation suite completed with warnings/errors (exit code: $VALIDATION_EXIT_CODE)"
fi

VALIDATION_END=$(date +%s)
VALIDATION_DURATION=$((VALIDATION_END - VALIDATION_START))

log_info "Validation duration: ${VALIDATION_DURATION}s"

# Generate CI-specific summary
SUMMARY_FILE="$OUTPUT_DIR/ci-summary-$TIMESTAMP.json"
cat > "$SUMMARY_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENVIRONMENT",
  "validation_level": "$VALIDATION_LEVEL",
  "duration_seconds": $VALIDATION_DURATION,
  "exit_code": $VALIDATION_EXIT_CODE,
  "report_file": "$(basename "$REPORT_FILE")",
  "ci_build": {
    "build_number": "${CI_BUILD_NUMBER:-unknown}",
    "commit_sha": "${CI_COMMIT_SHA:-unknown}",
    "branch": "${CI_BRANCH:-unknown}",
    "trigger": "${CI_TRIGGER:-manual}"
  }
}
EOF

# Upload reports if requested
if [[ "$UPLOAD_REPORTS" == "true" ]]; then
    log_info "Uploading validation reports..."
    
    # Example upload to S3 (customize based on your infrastructure)
    if [[ -n "${S3_BUCKET:-}" ]]; then
        aws s3 cp "$REPORT_FILE" "s3://$S3_BUCKET/validation-reports/$(basename "$REPORT_FILE")" || log_warning "Failed to upload report to S3"
        aws s3 cp "$SUMMARY_FILE" "s3://$S3_BUCKET/validation-reports/$(basename "$SUMMARY_FILE")" || log_warning "Failed to upload summary to S3"
    fi
    
    # Example upload to Artifactory (customize based on your infrastructure)
    if [[ -n "${ARTIFACTORY_URL:-}" ]]; then
        curl -X PUT -u "${ARTIFACTORY_USER}:${ARTIFACTORY_PASSWORD}" \
             -T "$REPORT_FILE" \
             "${ARTIFACTORY_URL}/validation-reports/$(basename "$REPORT_FILE)" || log_warning "Failed to upload to Artifactory"
    fi
fi

# Display summary
log_info "════════════════════════════════════════════════════════════════"
log_info "                    CI VALIDATION SUMMARY"
log_info "════════════════════════════════════════════════════════════════"
log_info "Environment: $ENVIRONMENT"
log_info "Validation Level: $VALIDATION_LEVEL"
log_info "Duration: ${VALIDATION_DURATION}s"
log_info "Exit Code: $VALIDATION_EXIT_CODE"

if [[ -f "$REPORT_FILE" ]]; then
    log_info "Report: $REPORT_FILE"
    log_info "Summary: $SUMMARY_FILE"
    
    # Display first few lines of report for quick review
    if [[ "$OUTPUT_FORMAT" == "txt" ]]; then
        log_info "Report Preview (first 20 lines):"
        head -20 "$REPORT_FILE" | while read -r line; do
            echo "  $line"
        done
        if [[ $(wc -l < "$REPORT_FILE") -gt 20 ]]; then
            log_info "  ... (see full report in $REPORT_FILE)"
        fi
    fi
fi

log_info "════════════════════════════════════════════════════════════════"

# GitHub Actions integration
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
    log_info "GitHub Actions integration detected"
    
    # Set GitHub output
    echo "validation-exit-code=$VALIDATION_EXIT_CODE" >> $GITHUB_OUTPUT
    echo "validation-duration=$VALIDATION_DURATION" >> $GITHUB_OUTPUT
    echo "validation-report=$REPORT_FILE" >> $GITHUB_OUTPUT
    
    # Create GitHub summary
    if [[ $VALIDATION_EXIT_CODE -eq 0 ]]; then
        echo "## ✅ Database Validation Passed" >> $GITHUB_STEP_SUMMARY
    else
        echo "## ❌ Database Validation Failed" >> $GITHUB_STEP_SUMMARY
    fi
    
    echo "- Environment: $ENVIRONMENT" >> $GITHUB_STEP_SUMMARY
    echo "- Level: $VALIDATION_LEVEL" >> $GITHUB_STEP_SUMMARY
    echo "- Duration: ${VALIDATION_DURATION}s" >> $GITHUB_STEP_SUMMARY
    echo "- Report: [View Report]($REPORT_FILE)" >> $GITHUB_STEP_SUMMARY
fi

# GitLab CI integration
if [[ -n "${GITLAB_CI:-}" ]]; then
    log_info "GitLab CI integration detected"
    
    # Create GitLab CI report
    echo "validation_duration=$VALIDATION_DURATION" > validation-metrics.txt
    echo "validation_exit_code=$VALIDATION_EXIT_CODE" >> validation-metrics.txt
fi

# Jenkins integration
if [[ -n "${JENKINS_URL:-}" ]]; then
    log_info "Jenkins integration detected"
    
    # Archive validation reports
    if [[ -d "$OUTPUT_DIR" ]]; then
        log_info "Archiving validation reports..."
        # Jenkins archive pattern would be configured in Jenkins job
    fi
fi

# Determine final exit code based on validation level and results
FINAL_EXIT_CODE=0

if [[ $VALIDATION_EXIT_CODE -ne 0 ]]; then
    case $VALIDATION_LEVEL in
        "critical")
            FINAL_EXIT_CODE=2  # Critical validation failure
            log_error "Critical validation failed - deployment should be blocked"
            ;;
        "quick")
            FINAL_EXIT_CODE=1  # Non-critical validation failure
            log_warning "Quick validation failed - consider running full validation"
            ;;
        "full")
            FINAL_EXIT_CODE=1  # Non-critical validation failure
            log_warning "Full validation failed - review reports and fix issues"
            ;;
    esac
fi

log_info "Final exit code: $FINAL_EXIT_CODE"

if [[ $FINAL_EXIT_CODE -eq 0 ]]; then
    log_success "✅ CI Validation completed successfully"
else
    log_error "❌ CI Validation failed (exit code: $FINAL_EXIT_CODE)"
    log_info "Check validation reports for details: $OUTPUT_DIR"
fi

exit $FINAL_EXIT_CODE