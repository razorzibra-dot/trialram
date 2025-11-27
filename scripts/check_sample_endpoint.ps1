Set-StrictMode -Version Latest
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host '--- Running: check sample nested endpoint' -ForegroundColor Cyan
try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:54321/rest/v1/deals?select=%2A,sale_items(%2A)' -Method GET -ErrorAction Stop
    # Ensure ConvertTo-Json output is captured as a single string
    $s = ($r | ConvertTo-Json -Depth 5 | Out-String)
    $len = $s.Length
    $preview = $s.Substring(0,[Math]::Min(1000,$len))
    Write-Host 'SAMPLE_ENDPOINT_OK' -ForegroundColor Green
    Write-Host $preview
} catch {
    Write-Host 'SAMPLE_ENDPOINT_FAILED' -ForegroundColor Yellow
    if ($_.Exception) { Write-Host $_.Exception.Message } else { Write-Host $_ }
}
