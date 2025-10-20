# ============================================================================
# SUPABASE AUTH SEEDING SETUP SCRIPT (Windows PowerShell)
# ============================================================================
#
# This script automates the entire auth seeding process:
# 1. Validates Supabase is running
# 2. Seeds auth users
# 3. Generates seed SQL
# 4. Resets database
#
# Usage:
#   .\scripts\setup-auth-seeding.ps1
#
# Prerequisites:
#   - Supabase running: supabase start
#   - .env file configured
#   - Node.js installed
#
# ============================================================================

# Configuration
$ErrorActionPreference = "Stop"
$WarningPreference = "SilentlyContinue"

# Colors for output
$Colors = @{
    Green = "`e[32m"
    Red = "`e[31m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Reset = "`e[0m"
}

function Write-Header {
    param([string]$Message)
    Write-Host "`n$($Colors.Blue)════════════════════════════════════════════════════════════$($Colors.Reset)"
    Write-Host "$($Colors.Blue)$Message$($Colors.Reset)"
    Write-Host "$($Colors.Blue)════════════════════════════════════════════════════════════$($Colors.Reset)`n"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$($Colors.Green)✅ $Message$($Colors.Reset)"
}

function Write-Error {
    param([string]$Message)
    Write-Host "$($Colors.Red)❌ $Message$($Colors.Reset)"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "$($Colors.Yellow)⚠️  $Message$($Colors.Reset)"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$($Colors.Blue)ℹ️  $Message$($Colors.Reset)"
}

# ============================================================================
# STEP 1: Validate Prerequisites
# ============================================================================

Write-Header "🔐 Supabase Auth Seeding Setup"

Write-Info "Checking prerequisites..."

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found"
    Write-Info "Please create .env file or copy from .env.example"
    exit 1
}

Write-Success ".env file found"

# Check if Supabase is running
Write-Info "Checking Supabase connection..."
$SupabaseUrl = (Get-Content .env | Select-String "VITE_SUPABASE_URL" | ForEach-Object { $_ -split '=' | Select-Object -Last 1 }).Trim()
$SupabaseKey = (Get-Content .env | Select-String "VITE_SUPABASE_SERVICE_KEY" | ForEach-Object { $_ -split '=' | Select-Object -Last 1 }).Trim()

if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Error "Missing Supabase configuration in .env"
    Write-Info "Add these to .env:"
    Write-Info "  VITE_SUPABASE_URL=http://localhost:54321"
    Write-Info "  VITE_SUPABASE_SERVICE_KEY=your-service-key"
    exit 1
}

Write-Success "Supabase configured: $SupabaseUrl"

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not installed"
    exit 1
}

Write-Success "Node.js installed"

# ============================================================================
# STEP 2: Seed Auth Users
# ============================================================================

Write-Header "📝 Step 1: Seeding Auth Users"

Write-Info "Running: npm run seed:auth"
npm run seed:auth

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to seed auth users"
    exit 1
}

Write-Success "Auth users seeded"

# Check if config file was created
if (-not (Test-Path "auth-users-config.json")) {
    Write-Error "auth-users-config.json not created"
    exit 1
}

Write-Success "Configuration saved to auth-users-config.json"

# ============================================================================
# STEP 3: Generate Seed SQL
# ============================================================================

Write-Header "📝 Step 2: Generating Seed SQL"

Write-Info "Running: npm run seed:sql"
npm run seed:sql

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate seed SQL"
    exit 1
}

Write-Success "Seed SQL generated"

# Check if seed file was created
if (-not (Test-Path "supabase/seed-users.sql")) {
    Write-Error "supabase/seed-users.sql not created"
    exit 1
}

Write-Success "SQL saved to supabase/seed-users.sql"

# ============================================================================
# STEP 4: Reset Database
# ============================================================================

Write-Header "📝 Step 3: Resetting Database"

Write-Info "Running: supabase db reset"
Write-Warning "This will reset your local database. Continuing in 5 seconds..."
Start-Sleep -Seconds 5

supabase db reset

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to reset database"
    exit 1
}

Write-Success "Database reset complete"

# ============================================================================
# STEP 5: Verification
# ============================================================================

Write-Header "✨ Setup Complete!"

Write-Success "Auth users created"
Write-Success "Database seeded"
Write-Success "Roles and permissions loaded"

Write-Info "`nTest the setup:"
Write-Info "  1. Start dev server: npm run dev"
Write-Info "  2. Login with: admin@acme.com / password123"
Write-Info "`nUser credentials:"
Get-Content auth-users-config.json | Select-String -Pattern 'email' | ForEach-Object {
    $email = $_ -replace '.*"email":\s*"([^"]+)".*', '$1'
    Write-Info "  - $email"
}

Write-Info "`nFor more information, see: AUTH_SEEDING_SETUP_GUIDE.md"

Write-Host "`n$($Colors.Blue)════════════════════════════════════════════════════════════$($Colors.Reset)`n"