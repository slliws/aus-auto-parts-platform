# Database Setup Script for Australian Auto Parts Platform
# This script sets up PostgreSQL database and runs Prisma migrations

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Auto Parts Platform - Database Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
$pgRunning = $false
try {
    $result = psql -U postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pgRunning = $true
        Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ PostgreSQL is not accessible" -ForegroundColor Red
}

if (-not $pgRunning) {
    Write-Host "`nPostgreSQL is not running or not accessible." -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
    Write-Host "`nOptions:" -ForegroundColor Cyan
    Write-Host "1. Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15`n" -ForegroundColor White
    
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

# Check if database exists
Write-Host "`nChecking if database exists..." -ForegroundColor Yellow
$dbExists = $false
try {
    $result = psql -U postgres -lqt 2>&1 | Select-String -Pattern "auto_parts_platform"
    if ($result) {
        $dbExists = $true
        Write-Host "✓ Database 'auto_parts_platform' exists" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not check database existence" -ForegroundColor Yellow
}

# Create database if it doesn't exist
if (-not $dbExists) {
    Write-Host "`nCreating database 'auto_parts_platform'..." -ForegroundColor Yellow
    try {
        psql -U postgres -c "CREATE DATABASE auto_parts_platform;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database created successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create database" -ForegroundColor Red
            Write-Host "You may need to create it manually: CREATE DATABASE auto_parts_platform;" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Error creating database: $_" -ForegroundColor Red
    }
}

# Install dependencies
Write-Host "`nInstalling npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host "`nGenerating Prisma Client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
npm run db:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migrations completed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Migration failed" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check DATABASE_URL in .env file" -ForegroundColor White
    Write-Host "2. Ensure PostgreSQL is running on localhost:5432" -ForegroundColor White
    Write-Host "3. Verify postgres user password is 'postgres'" -ForegroundColor White
    exit 1
}

# Seed database (optional)
Write-Host "`nDo you want to seed the database with sample data? (y/n): " -ForegroundColor Cyan -NoNewline
$seedChoice = Read-Host
if ($seedChoice -eq 'y') {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Seeding failed (this is optional)" -ForegroundColor Yellow
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "`nYou can now start the development server with: npm run dev`n" -ForegroundColor White