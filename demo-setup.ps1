# Australian Auto Parts Platform - Demo Setup Script
# This script sets up the complete demo environment on Windows
# Usage: .\demo-setup.ps1

# ============================================================================
# CONFIGURATION
# ============================================================================

$ProjectRoot = Get-Location
$DemoName = "AusAutoPartsDemo"
$TempDir = Join-Path $env:TEMP $DemoName

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Australian Auto Parts Platform Demo Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

$Prerequisites = @(
    @{ Name = "Node.js"; Command = "node --version"; MinVersion = "18.0.0" },
    @{ Name = "PostgreSQL"; Command = "psql --version"; MinVersion = "15.0" },
    @{ Name = "Redis"; Command = "redis-cli --version"; MinVersion = "6.0" },
    @{ Name = "Docker"; Command = "docker --version"; MinVersion = "20.0" }
)

$MissingPrereqs = @()

foreach ($prereq in $Prerequisites) {
    try {
        $version = & cmd /c ($prereq.Command + " 2>&1")
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $($prereq.Name) found" -ForegroundColor Green
        } else {
            $MissingPrereqs += $prereq.Name
        }
    } catch {
        $MissingPrereqs += $prereq.Name
    }
}

if ($MissingPrereqs.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing prerequisites:" -ForegroundColor Red
    foreach ($missing in $MissingPrereqs) {
        Write-Host "   - $missing" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install missing prerequisites and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✓ All prerequisites found" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================

Write-Host "[2/6] Setting up environment..." -ForegroundColor Yellow

# Copy environment files
if (Test-Path "backend\.env.example") {
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Backend environment configured" -ForegroundColor Green
    } else {
        Write-Host "✓ Backend environment already exists, skipping copy" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠ Backend .env.example not found, using defaults" -ForegroundColor Yellow
}

if (Test-Path "frontend\.env.example") {
    if (-not (Test-Path "frontend\.env")) {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✓ Frontend environment configured" -ForegroundColor Green
    } else {
        Write-Host "✓ Frontend environment already exists, skipping copy" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠ Frontend .env.example not found, using defaults" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# DATABASE SETUP
# ============================================================================

Write-Host "[3/6] Setting up database..." -ForegroundColor Yellow

# Check if PostgreSQL is running
try {
    $pgStatus = & psql -h localhost -U postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL may not be running, attempting to start..." -ForegroundColor Yellow
        # Try to start PostgreSQL service (adjust service name as needed)
        try {
            Start-Service postgresql-x64-15 2>$null
            Start-Sleep -Seconds 5
            Write-Host "✓ PostgreSQL service started" -ForegroundColor Green
        } catch {
            Write-Host "❌ Could not start PostgreSQL service" -ForegroundColor Red
            Write-Host "Please start PostgreSQL manually and try again." -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and running." -ForegroundColor Red
    exit 1
}

# Run database setup
Set-Location "backend"
Write-Host "   Setting up database schema..." -ForegroundColor Gray
try {
    & npx prisma generate
    & npx prisma db push
    Write-Host "✓ Database schema created" -ForegroundColor Green
} catch {
    Write-Host "❌ Database setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

# Seed demo data
Write-Host "   Seeding demo data..." -ForegroundColor Gray
try {
    & npx ts-node prisma/seed.ts
    Write-Host "✓ Demo data seeded" -ForegroundColor Green
} catch {
    Write-Host "⚠ Demo data seeding failed, continuing..." -ForegroundColor Yellow
}

Set-Location $ProjectRoot
Write-Host ""

# ============================================================================
# DEPENDENCY INSTALLATION
# ============================================================================

Write-Host "[4/6] Installing dependencies..." -ForegroundColor Yellow

# Backend dependencies
Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
Set-Location "backend"
try {
    & npm install
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

# Frontend dependencies
Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
Set-Location "$ProjectRoot\frontend"
try {
    & npm install
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot
Write-Host ""

# ============================================================================
# BUILDING APPLICATIONS
# ============================================================================

Write-Host "[5/6] Building applications..." -ForegroundColor Yellow

# Build backend (if needed)
Write-Host "   Building backend..." -ForegroundColor Gray
Set-Location "backend"
try {
    & npm run build
    Write-Host "✓ Backend built successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend build failed, trying development mode..." -ForegroundColor Yellow
}

# Build frontend
Write-Host "   Building frontend..." -ForegroundColor Gray
Set-Location "$ProjectRoot\frontend"
try {
    & npm run build
    Write-Host "✓ Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot
Write-Host ""

# ============================================================================
# START DEMO ENVIRONMENT
# ============================================================================

Write-Host "[6/6] Starting demo environment..." -ForegroundColor Yellow

# Start Redis if not running
Write-Host "   Checking Redis..." -ForegroundColor Gray
try {
    $redisTest = & redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ Redis not running, attempting to start..." -ForegroundColor Yellow
        # Try to start Redis service
        try {
            Start-Service redis 2>$null
            Start-Sleep -Seconds 2
            Write-Host "✓ Redis service started" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not start Redis service" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠ Redis check failed" -ForegroundColor Yellow
}

# Start backend in background
Write-Host "   Starting backend server..." -ForegroundColor Gray
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:ProjectRoot\backend"
    & npm run dev
} -Name "BackendServer"

Start-Sleep -Seconds 3

# Check if backend started
if ((Get-Job -Name "BackendServer").State -eq "Running") {
    Write-Host "✓ Backend server started" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend server may not have started properly" -ForegroundColor Yellow
}

# Start frontend in background
Write-Host "   Starting frontend server..." -ForegroundColor Gray
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:ProjectRoot\frontend"
    & npm run dev
} -Name "FrontendServer"

Start-Sleep -Seconds 3

# Check if frontend started
if ((Get-Job -Name "FrontendServer").State -eq "Running") {
    Write-Host "✓ Frontend server started" -ForegroundColor Green
} else {
    Write-Host "⚠ Frontend server may not have started properly" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# DEMO READY
# ============================================================================

Write-Host "================================================" -ForegroundColor Green
Write-Host " DEMO ENVIRONMENT READY!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Demo URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3000/api-docs" -ForegroundColor White
Write-Host ""

Write-Host "📊 Demo Credentials:" -ForegroundColor Cyan
Write-Host "   Admin User: admin@demo.com / password123" -ForegroundColor White
Write-Host "   Test User:  user@demo.com / password123" -ForegroundColor White
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "2. Follow the demo script in DEMO_SCRIPT.md" -ForegroundColor White
Write-Host "3. Explore the fully functional auto parts platform!" -ForegroundColor White
Write-Host ""

Write-Host "🛑 To stop the demo:" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C or close this PowerShell window" -ForegroundColor White
Write-Host ""

Write-Host "Demo setup complete! 🎉" -ForegroundColor Green
Write-Host ""

# Keep PowerShell window open to show running servers
Read-Host "Press Enter to stop demo servers and exit"

# Cleanup
Write-Host "Stopping demo servers..." -ForegroundColor Yellow
Stop-Job -Name "BackendServer" -ErrorAction SilentlyContinue
Stop-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
Remove-Job -Name "BackendServer" -ErrorAction SilentlyContinue
Remove-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
Write-Host "✓ Demo servers stopped" -ForegroundColor Green