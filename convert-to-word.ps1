# Australian Auto Parts Platform - Convert to Word Documents
# This script converts Markdown files to professionally formatted Word documents
# Requires: Pandoc (https://pandoc.org/installing.html)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ProjectRoot = Get-Location

# Files to convert
$FilesToConvert = @(
    @{Source="PACKAGE_README.md"; Output="01_PACKAGE_README.docx"; Title="Package Navigation Guide"},
    @{Source="PROJECT_STATUS_REPORT.md"; Output="02_PROJECT_STATUS_REPORT.docx"; Title="Project Status Report"},
    @{Source="project.md"; Output="03_EXECUTIVE_SUMMARY.docx"; Title="Executive Summary"},
    @{Source="README.md"; Output="04_DEVELOPER_QUICKSTART.docx"; Title="Developer Quickstart"},
    @{Source="docs/ARCHITECTURE.md"; Output="05_TECHNICAL_ARCHITECTURE.docx"; Title="Technical Architecture"},
    @{Source="docs/API_DESIGN.md"; Output="06_API_SPECIFICATION.docx"; Title="API Specification"},
    @{Source="docs/UI_UX_DESIGN.md"; Output="07_UI_UX_DESIGN.docx"; Title="UI/UX Design System"},
    @{Source="requirements/business_requirements.md"; Output="08_BUSINESS_REQUIREMENTS.docx"; Title="Business Requirements"},
    @{Source="requirements/technical_requirements.md"; Output="09_TECHNICAL_REQUIREMENTS.docx"; Title="Technical Requirements"},
    @{Source="backend/README.md"; Output="10_BACKEND_SETUP.docx"; Title="Backend Setup Guide"},
    @{Source="HOW_TO_PACKAGE_AND_EMAIL.md"; Output="11_PACKAGING_INSTRUCTIONS.docx"; Title="Packaging Instructions"}
)

$OutputFolder = Join-Path $ProjectRoot "word-documents"

# ============================================================================
# BANNER
# ============================================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Australian Auto Parts Platform" -ForegroundColor Cyan
Write-Host " Markdown to Word Conversion" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CHECK PANDOC
# ============================================================================

Write-Host "[1/3] Checking for Pandoc installation..." -ForegroundColor Yellow

$PandocInstalled = $false
$PandocPath = $null

# Try to find pandoc in PATH
try {
    $pandocVersion = pandoc --version 2>&1
    if ($pandocVersion -match "pandoc") {
        Write-Host "[OK] Pandoc is installed" -ForegroundColor Green
        $PandocInstalled = $true
        $PandocPath = "pandoc"
    }
} catch {
    # Pandoc not in PATH, check common installation locations
    $CommonLocations = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\JohnMacFarlane.Pandoc_Microsoft.Winget.Source_*\pandoc.exe",
        "$env:ProgramFiles\Pandoc\pandoc.exe",
        "$env:ProgramFiles (x86)\Pandoc\pandoc.exe",
        "$env:LOCALAPPDATA\Pandoc\pandoc.exe"
    )
    
    foreach ($location in $CommonLocations) {
        $found = Get-ChildItem -Path (Split-Path $location -Parent) -Filter "pandoc.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $PandocPath = $found.FullName
            Write-Host "[OK] Found Pandoc at: $PandocPath" -ForegroundColor Green
            $PandocInstalled = $true
            break
        }
    }
    
    if (-not $PandocInstalled) {
        Write-Host "[ERROR] Pandoc is not installed" -ForegroundColor Red
    }
}

if (-not $PandocInstalled) {
    Write-Host ""
    Write-Host "Pandoc is required to convert Markdown to Word documents." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Installation Options:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://pandoc.org/installing.html" -ForegroundColor White
    Write-Host "2. Or install via Chocolatey: choco install pandoc" -ForegroundColor White
    Write-Host "3. Or install via winget: winget install --id JohnMacFarlane.Pandoc" -ForegroundColor White
    Write-Host ""
    
    $install = Read-Host "Would you like to open the Pandoc download page? (Y/N)"
    if ($install -eq "Y" -or $install -eq "y") {
        Start-Process "https://pandoc.org/installing.html"
    }
    
    Write-Host ""
    Write-Host "After installing Pandoc, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# CREATE OUTPUT FOLDER
# ============================================================================

Write-Host "[2/3] Creating output folder..." -ForegroundColor Yellow

if (-not (Test-Path $OutputFolder)) {
    New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null
    Write-Host "[OK] Created folder: word-documents" -ForegroundColor Green
} else {
    Write-Host "[OK] Output folder exists" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# CONVERT FILES
# ============================================================================

Write-Host "[3/3] Converting Markdown files to Word..." -ForegroundColor Yellow
Write-Host ""

$SuccessCount = 0
$FailCount = 0

foreach ($file in $FilesToConvert) {
    $sourcePath = Join-Path $ProjectRoot $file.Source
    $outputPath = Join-Path $OutputFolder $file.Output
    
    if (-not (Test-Path $sourcePath)) {
        Write-Host "[SKIP] $($file.Source) (not found)" -ForegroundColor Yellow
        $FailCount++
        continue
    }
    
    Write-Host "Converting: $($file.Title)..." -ForegroundColor Gray
    
    try {
        # Convert with professional Word styling
        & $PandocPath $sourcePath `
            -o $outputPath `
            --from=markdown `
            --to=docx `
            --standalone `
            --toc `
            --toc-depth=3 `
            --metadata title="$($file.Title)" `
            --metadata subtitle="Australian Auto Parts Platform" `
            --metadata date="$(Get-Date -Format 'MMMM dd, yyyy')" `
            2>&1 | Out-Null
        
        if (Test-Path $outputPath) {
            $fileInfo = Get-Item $outputPath
            $sizeKB = [math]::Round($fileInfo.Length / 1KB, 1)
            Write-Host "[OK] Created: $($file.Output) ($sizeKB KB)" -ForegroundColor Green
            $SuccessCount++
        } else {
            Write-Host "[FAIL] $($file.Output)" -ForegroundColor Red
            $FailCount++
        }
    } catch {
        Write-Host "[ERROR] Converting $($file.Source): $($_.Exception.Message)" -ForegroundColor Red
        $FailCount++
    }
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " CONVERSION COMPLETE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "[OK] Successfully converted: $SuccessCount files" -ForegroundColor Green

if ($FailCount -gt 0) {
    Write-Host "[FAIL] Failed: $FailCount files" -ForegroundColor Red
}

Write-Host ""
Write-Host "Output Location:" -ForegroundColor Yellow
Write-Host "   $OutputFolder" -ForegroundColor Cyan
Write-Host ""

if ($SuccessCount -gt 0) {
    Write-Host "All Word documents have been created with:" -ForegroundColor Yellow
    Write-Host "- Professional formatting and styling" -ForegroundColor White
    Write-Host "- Automatic table of contents" -ForegroundColor White
    Write-Host "- Document titles and metadata" -ForegroundColor White
    Write-Host "- Numbered files for easy navigation" -ForegroundColor White
    Write-Host ""
    Write-Host "These documents are ready for professional distribution!" -ForegroundColor Green
    Write-Host ""
    
    $openFolder = Read-Host "Would you like to open the word-documents folder? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe $OutputFolder
    }
}

Write-Host ""
Write-Host "Conversion complete!" -ForegroundColor Green
Write-Host ""