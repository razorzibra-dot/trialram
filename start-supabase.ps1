# PowerShell Script to Start CRM Application with Supabase
# Usage: ./start-supabase.ps1

Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🚀  PDS-CRM Application with Supabase Backend             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   • API Mode: Supabase (http://localhost:54321)" -ForegroundColor Green
Write-Host "   • Dev Server: http://localhost:5000" -ForegroundColor Green
Write-Host "   • Real-time enabled: YES" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
$supabaseInstalled = $null -ne (Get-Command supabase -ErrorAction SilentlyContinue)

if ($supabaseInstalled) {
    Write-Host "   ✓ Supabase CLI found" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Supabase CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📦 Installation Instructions:" -ForegroundColor Cyan
    Write-Host "   Run: npm install -g supabase" -ForegroundColor Gray
    Write-Host ""
}

$npmInstalled = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
if ($npmInstalled) {
    Write-Host "   ✓ npm found" -ForegroundColor Green
} else {
    Write-Host "   ✗ npm not found - please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Application..." -ForegroundColor Cyan
Write-Host ""

# Check environment file
if (Test-Path ".env") {
    Write-Host "✓ .env configuration loaded" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($supabaseInstalled) {
    Write-Host "📝 Note: Running in split terminal mode:" -ForegroundColor Yellow
    Write-Host "   • Terminal 1: Supabase backend" -ForegroundColor Gray
    Write-Host "   • Terminal 2: Development server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Waiting for user choice..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "   1) Start Supabase + Dev Server (recommended)" -ForegroundColor Green
    Write-Host "   2) Start only Dev Server (Supabase already running)" -ForegroundColor Green
    Write-Host "   3) Exit" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Select option (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "🗄️  Starting Supabase local instance..." -ForegroundColor Cyan
            Write-Host "This will run in the background. Press Ctrl+C to stop." -ForegroundColor Gray
            Write-Host ""
            supabase start
            Write-Host ""
            Write-Host "✓ Supabase started!" -ForegroundColor Green
            Write-Host ""
            # Ensure Kong DNS resolver is configured so the API gateway resolves
            # upstream service addresses after container restarts. This calls the
            # idempotent helper script added at `scripts/ensure_kong_dns.ps1`.
            $ensureScript = Join-Path $scriptDir 'scripts\ensure_kong_dns.ps1'
            if (Test-Path $ensureScript) {
                Write-Host "Ensuring Kong DNS resolver config via $ensureScript..." -ForegroundColor Cyan
                pwsh -NoProfile -ExecutionPolicy Bypass -File $ensureScript
            } else {
                Write-Host "Warning: $ensureScript not found; skipping Kong DNS ensure step." -ForegroundColor Yellow
            }

            Write-Host "Now starting development server..." -ForegroundColor Cyan
            Write-Host ""
            npm run dev
        }
        "2" {
            Write-Host ""
            Write-Host "Starting development server..." -ForegroundColor Cyan
            Write-Host "Make sure Supabase is running in another terminal!" -ForegroundColor Yellow
            Write-Host ""
            npm run dev
        }
        "3" {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "Invalid option. Exiting." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "⚠️  Supabase CLI not installed. Starting dev server only..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To use Supabase, run: npm install -g supabase" -ForegroundColor Gray
    Write-Host "Then run this script again." -ForegroundColor Gray
    Write-Host ""
    npm run dev
}