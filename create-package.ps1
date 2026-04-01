# Australian Auto Parts Platform - Package Creation Script
# This script creates a clean ZIP package for email distribution on Windows
# Usage: .\create-package.ps1

# ============================================================================
# CONFIGURATION
# ============================================================================

$ProjectRoot = Get-Location
$PackageName = "AusAutoPartsPlatform-Oct2025.zip"
$OutputPath = Join-Path $ProjectRoot $PackageName

# Folders and files to EXCLUDE from the package
$ExcludePatterns = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    ".env",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "*.tmp",
    ".vscode",
    ".idea"
)

# ============================================================================
# BANNER
# ============================================================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Australian Auto Parts Platform" -ForegroundColor Cyan
Write-Host " Package Creation Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# VALIDATION
# ============================================================================

Write-Host "[1/5] Validating project structure..." -ForegroundColor Yellow

# Check if essential files exist
$EssentialFiles = @(
    "PACKAGE_README.md",
    "PROJECT_STATUS_REPORT.md",
    "project.md",
    "README.md",
    "HOW_TO_PACKAGE_AND_EMAIL.md"
)

$MissingFiles = @()
foreach ($file in $EssentialFiles) {
    if (-not (Test-Path $file)) {
        $MissingFiles += $file
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Host "❌ ERROR: Missing essential files:" -ForegroundColor Red
    foreach ($file in $MissingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please ensure all project files are present." -ForegroundColor Red
    exit 1
}

Write-Host "✓ All essential files found" -ForegroundColor Green

# Check if docs and requirements folders exist
$EssentialFolders = @("docs", "requirements", "backend")
$MissingFolders = @()
foreach ($folder in $EssentialFolders) {
    if (-not (Test-Path $folder)) {
        $MissingFolders += $folder
    }
}

if ($MissingFolders.Count -gt 0) {
    Write-Host "❌ ERROR: Missing essential folders:" -ForegroundColor Red
    foreach ($folder in $MissingFolders) {
        Write-Host "   - $folder" -ForegroundColor Red
    }
    exit 1
}

Write-Host "✓ All essential folders found" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CLEAN UP OLD PACKAGE
# ============================================================================

Write-Host "[2/5] Cleaning up old packages..." -ForegroundColor Yellow

if (Test-Path $OutputPath) {
    Write-Host "   Removing existing package: $PackageName" -ForegroundColor Gray
    Remove-Item $OutputPath -Force
    Write-Host "✓ Old package removed" -ForegroundColor Green
} else {
    Write-Host "✓ No old package to remove" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# COLLECT FILES
# ============================================================================

Write-Host "[3/5] Collecting files for package..." -ForegroundColor Yellow

# Get all files recursively
$AllFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File

# Filter out excluded files
$FilesToInclude = $AllFiles | Where-Object {
    $file = $_
    $shouldExclude = $false
    
    foreach ($pattern in $ExcludePatterns) {
        # Check if file path contains excluded pattern
        if ($file.FullName -like "*\$pattern\*" -or $file.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    -not $shouldExclude
}

Write-Host "   Total files found: $($AllFiles.Count)" -ForegroundColor Gray
Write-Host "   Files after filtering: $($FilesToInclude.Count)" -ForegroundColor Gray
Write-Host "   Excluded files: $($AllFiles.Count - $FilesToInclude.Count)" -ForegroundColor Gray

# Calculate total size
$TotalSize = ($FilesToInclude | Measure-Object -Property Length -Sum).Sum
$SizeMB = [math]::Round($TotalSize / 1MB, 2)

Write-Host "   Estimated package size: $SizeMB MB" -ForegroundColor Gray
Write-Host "✓ Files collected" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CREATE PACKAGE
# ============================================================================

Write-Host "[4/5] Creating ZIP package..." -ForegroundColor Yellow

try {
    # Create temporary folder for filtered files
    $TempFolder = Join-Path $env:TEMP "AusAutoPartsPlatform-Temp"
    
    if (Test-Path $TempFolder) {
        Remove-Item $TempFolder -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path $TempFolder -Force | Out-Null
    
    # Copy filtered files to temp folder
    Write-Host "   Copying files to temporary location..." -ForegroundColor Gray
    $CopiedCount = 0
    
    foreach ($file in $FilesToInclude) {
        $relativePath = $file.FullName.Substring($ProjectRoot.Path.Length + 1)
        $destPath = Join-Path $TempFolder $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $file.FullName -Destination $destPath -Force
        $CopiedCount++
        
        if ($CopiedCount % 100 -eq 0) {
            Write-Host "   Copied $CopiedCount files..." -ForegroundColor Gray
        }
    }
    
    Write-Host "   Copied $CopiedCount files" -ForegroundColor Gray
    
    # Create ZIP archive
    Write-Host "   Compressing files..." -ForegroundColor Gray
    Compress-Archive -Path "$TempFolder\*" -DestinationPath $OutputPath -CompressionLevel Optimal -Force
    
    # Clean up temp folder
    Write-Host "   Cleaning up temporary files..." -ForegroundColor Gray
    Remove-Item $TempFolder -Recurse -Force
    
    Write-Host "✓ Package created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to create package" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# VERIFY PACKAGE
# ============================================================================

Write-Host "[5/5] Verifying package..." -ForegroundColor Yellow

if (Test-Path $OutputPath) {
    $PackageInfo = Get-Item $OutputPath
    $PackageSizeMB = [math]::Round($PackageInfo.Length / 1MB, 2)
    
    Write-Host "✓ Package created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   File name: $($PackageInfo.Name)" -ForegroundColor Cyan
    Write-Host "   Location:  $($PackageInfo.FullName)" -ForegroundColor Cyan
    Write-Host "   Size:      $PackageSizeMB MB" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if size is reasonable for email
    if ($PackageSizeMB -gt 25) {
        Write-Host "⚠ WARNING: Package size exceeds typical email limit (25MB)" -ForegroundColor Yellow
        Write-Host "   Consider uploading to OneDrive, Google Drive, or Dropbox instead" -ForegroundColor Yellow
        Write-Host ""
    } elseif ($PackageSizeMB -gt 10) {
        Write-Host "⚠ Note: Package size is large but should work with most email services" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "❌ ERROR: Package file not found after creation" -ForegroundColor Red
    exit 1
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " PACKAGE READY FOR DISTRIBUTION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Attach $PackageName to your email" -ForegroundColor White
Write-Host "2. Or upload to cloud storage (OneDrive/Google Drive)" -ForegroundColor White
Write-Host "3. Recipients should extract and read PACKAGE_README.md first" -ForegroundColor White
Write-Host ""
Write-Host "Package Contents:" -ForegroundColor Yellow
Write-Host "- Complete project documentation (8,000+ lines)" -ForegroundColor White
Write-Host "- Working backend foundation (3,000+ lines)" -ForegroundColor White
Write-Host "- Business requirements and financial projections" -ForegroundColor White
Write-Host "- Technical architecture and API specifications" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions on emailing, see:" -ForegroundColor Yellow
Write-Host "   HOW_TO_PACKAGE_AND_EMAIL.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package created successfully! ✨" -ForegroundColor Green
Write-Host ""

# ============================================================================
# OPEN FOLDER
# ============================================================================

$OpenFolder = Read-Host "Would you like to open the folder containing the package? (Y/N)"
if ($OpenFolder -eq "Y" -or $OpenFolder -eq "y") {
    explorer.exe $ProjectRoot
}