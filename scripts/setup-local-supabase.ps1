# ============================================================================
# Local Supabase Setup Script for Windows
# ============================================================================
# This script automates the setup of local Supabase for development
#
# Usage:
#   .\scripts\setup-local-supabase.ps1
#
# What it does:
#   1. Checks for Docker
#   2. Installs Supabase CLI (if needed)
#   3. Initializes Supabase project
#   4. Starts local Supabase services
#   5. Displays credentials and URLs
#
# ============================================================================

param(
    [switch]$SkipDocker = $false,
    [switch]$SkipCLI = $false,
    [switch]$StartOnly = $false
)

# Colors for output
$Success = 'Green'
$Error = 'Red'
$Warning = 'Yellow'
$Info = 'Cyan'

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor $Info -NoNewline
}

function Write-Success {
    param([string]$Message)
    Write-Host "`n✅ $Message" -ForegroundColor $Success
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "`n❌ $Message" -ForegroundColor $Error
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "`n⚠️  $Message" -ForegroundColor $Warning
}

# ============================================================================
# STEP 1: Check Docker
# ============================================================================

if (-not $SkipDocker) {
    Write-Step "Checking Docker installation..."
    
    try {
        $dockerVersion = & docker --version
        Write-Success "Docker is installed: $dockerVersion"
        
        # Check if Docker daemon is running
        Write-Step "Checking Docker daemon..."
        & docker ps > $null 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker daemon is running"
        } else {
            Write-Warning-Custom "Docker daemon is not running. Please start Docker Desktop."
            Write-Host "Starting Docker in 5 seconds..."
            Start-Sleep -Seconds 5
            
            # Try to start Docker Desktop
            if (Test-Path "C:\Program Files\Docker\Docker\Docker.exe") {
                Write-Step "Starting Docker Desktop..."
                & "C:\Program Files\Docker\Docker\Docker.exe"
                Write-Host "Waiting for Docker to start (this may take a minute)..."
                Start-Sleep -Seconds 30
            }
        }
    } catch {
        Write-Error-Custom "Docker is not installed!"
        Write-Host @"
Please install Docker Desktop:
1. Download from: https://www.docker.com/products/docker-desktop
2. Install and follow the setup wizard
3. Restart this script after installation

"@
        exit 1
    }
}

# ============================================================================
# STEP 2: Check/Install Supabase CLI
# ============================================================================

if (-not $SkipCLI) {
    Write-Step "Checking Supabase CLI installation..."
    
    try {
        $supabaseVersion = & supabase --version 2>&1
        Write-Success "Supabase CLI is installed: $supabaseVersion"
    } catch {
        Write-Warning-Custom "Supabase CLI not found. Installing..."
        
        try {
            Write-Step "Installing Supabase CLI via npm..."
            & npm install -g supabase
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Supabase CLI installed successfully"
            } else {
                Write-Error-Custom "Failed to install Supabase CLI"
                exit 1
            }
        } catch {
            Write-Error-Custom "Error installing Supabase CLI: $_"
            exit 1
        }
    }
}

# ============================================================================
# STEP 3: Initialize Supabase (skip if already initialized)
# ============================================================================

if (-not $StartOnly) {
    if (-not (Test-Path "supabase/config.toml")) {
        Write-Step "Initializing Supabase project..."
        
        try {
            & supabase init
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Supabase project initialized"
            } else {
                Write-Error-Custom "Failed to initialize Supabase"
                exit 1
            }
        } catch {
            Write-Error-Custom "Error initializing Supabase: $_"
            exit 1
        }
    } else {
        Write-Success "Supabase project already initialized"
    }
}

# ============================================================================
# STEP 4: Start Supabase Services
# ============================================================================

Write-Step "Starting local Supabase services..."
Write-Host "`nThis may take 2-3 minutes on first run...`n"

try {
    & supabase start
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Supabase services started successfully!"
    } else {
        Write-Error-Custom "Failed to start Supabase services"
        exit 1
    }
} catch {
    Write-Error-Custom "Error starting Supabase: $_"
    exit 1
}

# ============================================================================
# STEP 5: Display Credentials and URLs
# ============================================================================

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ LOCAL SUPABASE IS RUNNING                              ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green

try {
    & supabase status
} catch {
    Write-Warning-Custom "Could not retrieve status. Services may still be starting..."
}

Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  QUICK START                                                   ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  1. In a new terminal, start the dev server:                   ║" -ForegroundColor Green
Write-Host "║     npm run dev                                                ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  2. Open your browser to http://localhost:5173               ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  3. Manage database via Studio:                               ║" -ForegroundColor Green
Write-Host "║     http://localhost:54323                                     ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  4. Test emails via Inbucket:                                 ║" -ForegroundColor Green
Write-Host "║     http://localhost:54324                                     ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  STOP SERVICES:                                                ║" -ForegroundColor Green
Write-Host "║     supabase stop                                              ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  VIEW LOGS:                                                    ║" -ForegroundColor Green
Write-Host "║     supabase logs                                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📚 Documentation: LOCAL_SUPABASE_SETUP.md`n" -ForegroundColor Cyan