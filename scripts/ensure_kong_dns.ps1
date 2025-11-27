<#
Ensure Kong DNS resolver env is present and restart Kong container.
Idempotent: will not duplicate env lines.
#>
param(
    [string]$ContainerName = "supabase_kong_CRMV9_NEWTHEME",
    [string]$Resolver = "127.0.0.11",
    [int]$ResolverTTL = 10
)

# Environment lines to ensure
$envLine = "KONG_DNS_RESOLVER=$Resolver"
$ttlLine = "KONG_RESOLVER_VALID_TTL=$ResolverTTL"
$envFile = "/home/kong/.kong_env"

Write-Host "Container: $ContainerName"

# Ensure docker is available
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker CLI not found. Install Docker Desktop and ensure docker is in PATH."
    exit 1
}

# Check container exists
$containers = docker ps -a --format "{{.Names}}" 2>&1
if (-not ($containers -match [regex]::Escape($ContainerName))) {
    Write-Error "Container '$ContainerName' not found. Available containers:`n$containers"
    exit 1
}

# Helper to check and append if missing
function Ensure-Line([string]$line) {
    $check = docker exec $ContainerName bash -lc "if [ -f $envFile ] && grep -Fxq '$line' $envFile; then echo 'FOUND'; else echo 'MISSING'; fi" 2>&1
    if ($check -match 'FOUND') {
        Write-Host "Already present: $line"
    } else {
        Write-Host "Adding: $line"
        # append as root
        docker exec -u root $ContainerName bash -lc "echo '$line' >> $envFile"
    }
}

Ensure-Line $envLine
Ensure-Line $ttlLine

Write-Host "Restarting Kong container: $ContainerName"
docker restart $ContainerName | Write-Host

Write-Host "Waiting 3s for Kong to initialize..."
Start-Sleep -Seconds 3

Write-Host "Recent Kong logs (tail 40):"
docker logs $ContainerName --tail 40

Write-Host "Done. Kong env ensured and container restarted."
