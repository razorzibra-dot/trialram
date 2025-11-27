# Helper to start Supabase, ensure Kong DNS and run quick health checks
Set-StrictMode -Version Latest
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host '--- Running: supabase start' -ForegroundColor Cyan
# Start Supabase in a background process to avoid blocking this script
try {
    $supProc = Start-Process -FilePath 'supabase' -ArgumentList 'start' -WorkingDirectory $scriptDir -NoNewWindow -PassThru -ErrorAction Stop
    Write-Host "Started supabase (PID: $($supProc.Id)). Waiting briefly for services to initialize..." -ForegroundColor Green
} catch {
    Write-Host "Failed to start supabase with Start-Process; falling back to direct call: $_" -ForegroundColor Yellow
    supabase start
}

Write-Host '--- Running: scripts\ensure_kong_dns.ps1' -ForegroundColor Cyan
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ensure_kong_dns.ps1

Start-Sleep -Seconds 5

Write-Host '--- Checking: auth health at http://127.0.0.1:54321/auth/v1/health' -ForegroundColor Cyan
try {
    $h = Invoke-RestMethod -Uri 'http://127.0.0.1:54321/auth/v1/health' -Method GET -ErrorAction Stop
    Write-Host 'AUTH_HEALTH_OK' -ForegroundColor Green
    $h | ConvertTo-Json -Depth 4 | Write-Host
} catch {
    Write-Host 'AUTH_HEALTH_FAILED' -ForegroundColor Yellow
    if ($_.Exception) { Write-Host $_.Exception.Message } else { Write-Host $_ }
}

Write-Host '--- Checking sample nested endpoint: /rest/v1/deals?select=%2A,sale_items(%2A)' -ForegroundColor Cyan
try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:54321/rest/v1/deals?select=%2A,sale_items(%2A)' -Method GET -ErrorAction Stop
    if ($null -eq $r) { Write-Host 'SAMPLE_ENDPOINT_OK: null' } else {
        Write-Host 'SAMPLE_ENDPOINT_OK' -ForegroundColor Green
        $json = $r | ConvertTo-Json -Depth 4
        if ($json.Length -gt 800) { $json = $json.Substring(0,800) + '... (truncated)' }
        Write-Host $json
    }
} catch {
    Write-Host 'SAMPLE_ENDPOINT_FAILED' -ForegroundColor Yellow
    if ($_.Exception) { Write-Host $_.Exception.Message } else { Write-Host $_ }
}

Write-Host '--- Infra checks complete.' -ForegroundColor Cyan
