@echo off
REM Australian Auto Parts Platform - Quick Demo Launcher
REM This batch file provides a simple way to start the demo

echo ================================================
echo  Australian Auto Parts Platform Demo
echo ================================================
echo.

echo Starting demo environment...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is required to run this demo.
    echo Please install Windows PowerShell and try again.
    pause
    exit /b 1
)

REM Run the PowerShell setup script
powershell -ExecutionPolicy Bypass -File "%~dp0demo-setup.ps1"

echo.
echo Demo session ended.
pause