###############################################################################
# deploy-from-windows.ps1
# Windows PowerShell script to deploy aus-auto-parts-platform to remote server
# 
# This script:
# - Uses SCP to copy project files to the remote server
# - SSHs into the server and executes the deployment script
# - Handles password authentication
# - Opens Chrome with both GUI URLs when deployment completes
#
# Usage: 
#   .\deploy-from-windows.ps1
#   .\deploy-from-windows.ps1 -ServerIP "192.168.1.110" -Password "your-password"
#
###############################################################################

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP = "192.168.1.110",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root",
    
    [Parameter(Mandatory=$false)]
    [SecureString]$Password,
    
    [Parameter(Mandatory=$false)]
    [int]$BackendPort = 3000,
    
    [Parameter(Mandatory=$false)]
    [int]$FrontendPort = 8080,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBrowserOpen
)

###############################################################################
# Configuration
###############################################################################

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$RemoteProjectDir = "/opt/aus-auto-parts-platform"

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "`n================================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "================================================================`n" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

###############################################################################
# Check Prerequisites
###############################################################################

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check if running on Windows
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-ErrorMsg "PowerShell 5.0 or higher is required"
        exit 1
    }
    Write-Success "PowerShell version: $($PSVersionTable.PSVersion)"
    
    # Check if project directory exists
    if (-not (Test-Path $ProjectDir)) {
        Write-ErrorMsg "Project directory not found: $ProjectDir"
        exit 1
    }
    Write-Success "Project directory found: $ProjectDir"
    
    # Check for required files
    $requiredFiles = @(
        "docker-compose.prod.yml",
        "backend/Dockerfile",
        "frontend/Dockerfile",
        "deploy-to-server.sh"
    )
    
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $ProjectDir $file
        if (-not (Test-Path $filePath)) {
            Write-ErrorMsg "Required file not found: $file"
            exit 1
        }
    }
    Write-Success "All required files present"
    
    # Check for plink (PuTTY) or native SSH
    $script:UseNativeSSH = $false
    $script:UsePlink = $false
    
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        $script:UseNativeSSH = $true
        Write-Success "Using native SSH client"
    } elseif (Get-Command plink -ErrorAction SilentlyContinue) {
        $script:UsePlink = $true
        Write-Success "Using PuTTY plink for SSH"
    } else {
        Write-Warning "Neither native SSH nor PuTTY found"
        Write-Info "Attempting to use native OpenSSH (Windows 10+)..."
        $script:UseNativeSSH = $true
    }
    
    # Check for pscp (PuTTY) or native SCP
    $script:UseNativeSCP = $false
    $script:UsePscp = $false
    
    if (Get-Command scp -ErrorAction SilentlyContinue) {
        $script:UseNativeSCP = $true
        Write-Success "Using native SCP client"
    } elseif (Get-Command pscp -ErrorAction SilentlyContinue) {
        $script:UsePscp = $true
        Write-Success "Using PuTTY pscp for file transfer"
    } else {
        Write-Warning "Neither native SCP nor PuTTY pscp found"
        Write-Info "Attempting to use native SCP (Windows 10+)..."
        $script:UseNativeSCP = $true
    }
}

###############################################################################
# Get Password Securely
###############################################################################

function Get-ServerPassword {
    if (-not $Password) {
        Write-Info "Please enter the server password"
        $script:Password = Read-Host "Password for ${Username}@${ServerIP}" -AsSecureString
    }
    
    # Convert SecureString to plain text for commands
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $script:PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

###############################################################################
# Test Server Connection
###############################################################################

function Test-ServerConnection {
    Write-Header "Testing Server Connection"
    
    Write-Info "Testing connection to ${ServerIP}..."
    
    if (Test-Connection -ComputerName $ServerIP -Count 2 -Quiet) {
        Write-Success "Server is reachable via ping"
    } else {
        Write-Warning "Server did not respond to ping (may be blocked)"
    }
    
    # Test SSH connection
    Write-Info "Testing SSH connection..."
    
    if ($script:UseNativeSSH) {
        $testCommand = "echo 'SSH_TEST_OK'"
        $env:SSHPASS = $PlainPassword
        
        try {
            # Use -o StrictHostKeyChecking=no to avoid host key prompt
            $result = ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
                         "${Username}@${ServerIP}" "$testCommand" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "SSH connection successful"
            } else {
                Write-ErrorMsg "SSH connection failed"
                Write-Info "Result: $result"
                exit 1
            }
        } catch {
            Write-ErrorMsg "SSH connection error: $_"
            exit 1
        }
    } else {
        # Using PuTTY plink
        Write-Info "Using PuTTY for connection test..."
        $result = echo y | plink -pw $PlainPassword "${Username}@${ServerIP}" "echo 'SSH_TEST_OK'" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "SSH connection successful"
        } else {
            Write-ErrorMsg "SSH connection failed: $result"
            exit 1
        }
    }
}

###############################################################################
# Copy Project Files to Server
###############################################################################

function Copy-ProjectToServer {
    Write-Header "Copying Project Files to Server"
    
    Write-Info "Creating remote directory structure..."
    
    $mkdirCommand = "mkdir -p $RemoteProjectDir"
    
    if ($script:UseNativeSSH) {
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
            "${Username}@${ServerIP}" "$mkdirCommand" 2>&1 | Out-Null
    } else {
        echo y | plink -pw $PlainPassword "${Username}@${ServerIP}" "$mkdirCommand" 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Remote directory created"
    } else {
        Write-ErrorMsg "Failed to create remote directory"
        exit 1
    }
    
    # Files and directories to copy
    $itemsToCopy = @(
        "docker-compose.prod.yml",
        "deploy-to-server.sh",
        "backend",
        "frontend"
    )
    
    Write-Info "Copying files to server (this may take a few minutes)..."
    
    foreach ($item in $itemsToCopy) {
        $itemPath = Join-Path $ProjectDir $item
        
        if (-not (Test-Path $itemPath)) {
            Write-Warning "Item not found, skipping: $item"
            continue
        }
        
        Write-Info "Copying: $item"
        
        if ($script:UseNativeSCP) {
            # Native SCP - use recursive for directories
            if (Test-Path $itemPath -PathType Container) {
                scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
                    -r "$itemPath" "${Username}@${ServerIP}:${RemoteProjectDir}/" 2>&1 | Out-Null
            } else {
                scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
                    "$itemPath" "${Username}@${ServerIP}:${RemoteProjectDir}/" 2>&1 | Out-Null
            }
        } else {
            # PuTTY pscp
            if (Test-Path $itemPath -PathType Container) {
                pscp -pw $PlainPassword -r "$itemPath" "${Username}@${ServerIP}:${RemoteProjectDir}/" 2>&1 | Out-Null
            } else {
                pscp -pw $PlainPassword "$itemPath" "${Username}@${ServerIP}:${RemoteProjectDir}/" 2>&1 | Out-Null
            }
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Copied: $item"
        } else {
            Write-ErrorMsg "Failed to copy: $item"
            exit 1
        }
    }
    
    Write-Success "All files copied successfully"
}

###############################################################################
# Make Deployment Script Executable
###############################################################################

function Set-DeploymentScriptPermissions {
    Write-Header "Setting Script Permissions"
    
    $chmodCommand = "chmod +x ${RemoteProjectDir}/deploy-to-server.sh"
    
    if ($script:UseNativeSSH) {
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
            "${Username}@${ServerIP}" "$chmodCommand" 2>&1 | Out-Null
    } else {
        echo y | plink -pw $PlainPassword "${Username}@${ServerIP}" "$chmodCommand" 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment script is now executable"
    } else {
        Write-ErrorMsg "Failed to set script permissions"
        exit 1
    }
}

###############################################################################
# Execute Deployment on Server
###############################################################################

function Invoke-RemoteDeployment {
    Write-Header "Executing Deployment on Server"
    
    Write-Info "Running deployment script on remote server..."
    Write-Info "This may take several minutes as Docker builds the containers..."
    Write-Warning "Please be patient and do not interrupt the process`n"
    
    $deployCommand = "cd $RemoteProjectDir && sudo ./deploy-to-server.sh"
    
    if ($script:UseNativeSSH) {
        ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `
            -t "${Username}@${ServerIP}" "$deployCommand"
    } else {
        echo y | plink -pw $PlainPassword -t "${Username}@${ServerIP}" "$deployCommand"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment completed successfully on server"
    } else {
        Write-ErrorMsg "Deployment script encountered errors"
        Write-Warning "Check the output above for details"
        exit 1
    }
}

###############################################################################
# Verify Deployment
###############################################################################

function Test-Deployment {
    Write-Header "Verifying Deployment"
    
    Write-Info "Testing backend health endpoint..."
    Start-Sleep -Seconds 3
    
    try {
        $backendUrl = "http://${ServerIP}:${BackendPort}/api/v1/health"
        $response = Invoke-WebRequest -Uri $backendUrl -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend is responding: $backendUrl"
        } else {
            Write-Warning "Backend responded with status: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Could not verify backend health (may still be starting)"
        Write-Info "Error: $_"
    }
    
    Write-Info "Testing frontend..."
    
    try {
        $frontendUrl = "http://${ServerIP}:${FrontendPort}"
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is responding: $frontendUrl"
        } else {
            Write-Warning "Frontend responded with status: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Could not verify frontend (may still be starting)"
        Write-Info "Error: $_"
    }
}

###############################################################################
# Open Browser
###############################################################################

function Open-ApplicationInBrowser {
    if ($SkipBrowserOpen) {
        Write-Info "Skipping browser launch (SkipBrowserOpen flag set)"
        return
    }
    
    Write-Header "Opening Application in Browser"
    
    $frontendUrl = "http://${ServerIP}:${FrontendPort}"
    $backendUrl = "http://${ServerIP}:${BackendPort}/api/v1/health"
    
    Write-Info "Opening frontend in Chrome..."
    
    # Try to find Chrome
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
    )
    
    $chromeExe = $null
    foreach ($path in $chromePaths) {
        if (Test-Path $path) {
            $chromeExe = $path
            break
        }
    }
    
    if ($chromeExe) {
        Start-Sleep -Seconds 2
        Start-Process $chromeExe -ArgumentList $frontendUrl
        Write-Success "Opened frontend: $frontendUrl"
        
        Start-Sleep -Seconds 1
        Start-Process $chromeExe -ArgumentList $backendUrl
        Write-Success "Opened backend health: $backendUrl"
    } else {
        Write-Warning "Chrome not found, opening with default browser..."
        Start-Process $frontendUrl
        Start-Sleep -Seconds 1
        Start-Process $backendUrl
    }
}

###############################################################################
# Display Summary
###############################################################################

function Show-DeploymentSummary {
    Write-Host "`n"
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     DEPLOYMENT COMPLETE - AUS AUTO PARTS PLATFORM              ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "`n"
    
    Write-Host "Frontend GUI:" -ForegroundColor Cyan
    Write-Host "  http://${ServerIP}:${FrontendPort}" -ForegroundColor Green
    Write-Host "`n"
    
    Write-Host "Backend API:" -ForegroundColor Cyan
    Write-Host "  http://${ServerIP}:${BackendPort}" -ForegroundColor Green
    Write-Host "  Health Check: http://${ServerIP}:${BackendPort}/api/v1/health" -ForegroundColor Green
    Write-Host "`n"
    
    Write-Host "SSH Access:" -ForegroundColor Cyan
    Write-Host "  ssh ${Username}@${ServerIP}" -ForegroundColor Yellow
    Write-Host "  Project directory: $RemoteProjectDir" -ForegroundColor Yellow
    Write-Host "`n"
    
    Write-Host "Management Commands (run via SSH):" -ForegroundColor Cyan
    Write-Host "  View logs:     docker logs -f aus-auto-parts-backend" -ForegroundColor Yellow
    Write-Host "  Stop all:      cd $RemoteProjectDir `&`& docker compose -f docker-compose.prod.yml down" -ForegroundColor Yellow
    Write-Host "  Start all:     cd $RemoteProjectDir `&`& docker compose -f docker-compose.prod.yml up -d" -ForegroundColor Yellow
    Write-Host "  Restart all:   cd $RemoteProjectDir `&`& docker compose -f docker-compose.prod.yml restart" -ForegroundColor Yellow
    Write-Host "`n"
    
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "`n"
}

###############################################################################
# Main Execution
###############################################################################

function Main {
    try {
        Write-Header "AUS AUTO PARTS PLATFORM - WINDOWS DEPLOYMENT SCRIPT"
        
        Test-Prerequisites
        Get-ServerPassword
        Test-ServerConnection
        Copy-ProjectToServer
        Set-DeploymentScriptPermissions
        Invoke-RemoteDeployment
        Test-Deployment
        Open-ApplicationInBrowser
        Show-DeploymentSummary
        
    } catch {
        $errorMessage = $_.Exception.Message
        $errorStack = $_.ScriptStackTrace
        Write-ErrorMsg "Deployment failed: $errorMessage"
        Write-Host $errorStack -ForegroundColor Red
        exit 1
    } finally {
        # Clear password from memory
        if ($PlainPassword) {
            $PlainPassword = $null
        }
    }
}

# Execute main function
Main