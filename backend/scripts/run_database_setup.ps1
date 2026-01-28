# LeadLab Database Setup - PowerShell Script
# Usage: .\run_database_setup.ps1 [-Password "your_password"]

param(
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LeadLab Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptPath "setup_database_simple.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: SQL file not found at: $sqlFile" -ForegroundColor Red
    exit 1
}

# Get password if not provided
if ([string]::IsNullOrEmpty($Password)) {
    Write-Host "Enter MySQL root password:" -ForegroundColor Yellow -NoNewline
    $securePassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host ""
Write-Host "Running database setup script..." -ForegroundColor Yellow
Write-Host ""

# Method 1: Try with password as parameter (if MySQL supports it)
try {
    $sqlContent = Get-Content $sqlFile -Raw
    $sqlContent | mysql -u root -p"$Password" 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Default login credentials:" -ForegroundColor Cyan
        Write-Host "  Admin: admin@the-leadlab.com / admin123" -ForegroundColor White
        Write-Host "  Demo:  demo@the-leadlab.com / admin123" -ForegroundColor White
        exit 0
    }
} catch {
    Write-Host "⚠️  Method 1 failed, trying alternative method..." -ForegroundColor Yellow
}

# Method 2: Create temporary file with password and use it
Write-Host ""
Write-Host "Trying alternative method..." -ForegroundColor Yellow

$tempConfig = [System.IO.Path]::GetTempFileName()
$configContent = @"
[client]
user=root
password=$Password
"@
Set-Content -Path $tempConfig -Value $configContent

try {
    Get-Content $sqlFile | mysql --defaults-file="$tempConfig" 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Default login credentials:" -ForegroundColor Cyan
        Write-Host "  Admin: admin@the-leadlab.com / admin123" -ForegroundColor White
        Write-Host "  Demo:  demo@the-leadlab.com / admin123" -ForegroundColor White
    } else {
        Write-Host "❌ Database setup failed. Please check your MySQL password and try again." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running database setup: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file
    if (Test-Path $tempConfig) {
        Remove-Item $tempConfig -Force
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
