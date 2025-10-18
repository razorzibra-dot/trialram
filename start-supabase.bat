@echo off
REM Batch script to start CRM Application with Supabase
REM Usage: start-supabase.bat

setlocal enabledelayedexpansion

cls
echo.
echo ===================================================================
echo.      PDS-CRM Application with Supabase Backend
echo.
echo ===================================================================
echo.

REM Get script directory
cd /d "%~dp0"

echo Configuration:
echo    • API Mode: Supabase ^(http://localhost:54321^)
echo    • Dev Server: http://localhost:5000
echo    • Real-time enabled: YES
echo.

REM Check if Supabase CLI is installed
echo Checking dependencies...
where supabase >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Supabase CLI found
    set SUPABASE_INSTALLED=1
) else (
    echo    ⚠ Supabase CLI not found
    echo.
    echo Installation: npm install -g supabase
    echo.
    set SUPABASE_INSTALLED=0
)

where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✓ npm found
) else (
    echo    ✗ npm not found - install Node.js
    pause
    exit /b 1
)

echo.
echo Starting Application...
echo.

REM Check environment file
if exist ".env" (
    echo ✓ .env configuration loaded
) else (
    echo ✗ .env file not found
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo.

if %SUPABASE_INSTALLED% EQU 1 (
    echo Running in split terminal mode:
    echo    • Terminal 1: Supabase backend
    echo    • Terminal 2: Development server
    echo.
    echo Options:
    echo    1) Start Supabase + Dev Server ^(recommended^)
    echo    2) Start only Dev Server ^(Supabase already running^)
    echo    3) Exit
    echo.
    
    set /p choice="Select option (1-3): "
    
    if "!choice!"=="1" (
        echo.
        echo Starting Supabase local instance...
        echo This will run in the background. Press Ctrl+C to stop.
        echo.
        call supabase start
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo ✓ Supabase started!
            echo.
            echo Now starting development server...
            echo.
            call npm run dev
        )
    ) else if "!choice!"=="2" (
        echo.
        echo Starting development server...
        echo Make sure Supabase is running in another terminal!
        echo.
        call npm run dev
    ) else if "!choice!"=="3" (
        echo Cancelled.
        exit /b 0
    ) else (
        echo Invalid option.
        pause
        exit /b 1
    )
) else (
    echo ⚠ Supabase CLI not installed. Starting dev server only...
    echo.
    echo To use Supabase, run: npm install -g supabase
    echo Then run this script again.
    echo.
    call npm run dev
)

pause