# LeadLab Database Setup Script for Windows
# This script will create the database and run migrations

param(
    [string]$MySQLUser = "root",
    [string]$MySQLPassword = "",
    [string]$MySQLHost = "localhost",
    [string]$MySQLPort = "3306",
    [string]$DatabaseName = "leadlab_db"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "LeadLab Database Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for password if not provided
if ([string]::IsNullOrEmpty($MySQLPassword)) {
    $securePassword = Read-Host "Enter MySQL root password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $MySQLPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Test MySQL connection
Write-Host "Testing MySQL connection..." -ForegroundColor Yellow
$testConnection = mysql -u $MySQLUser -p"$MySQLPassword" -h $MySQLHost -P $MySQLPort -e "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to connect to MySQL. Please check your credentials." -ForegroundColor Red
    Write-Host "Error: $testConnection" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MySQL connection successful!" -ForegroundColor Green
Write-Host ""

# Create database
Write-Host "Creating database '$DatabaseName'..." -ForegroundColor Yellow
$createDbQuery = "CREATE DATABASE IF NOT EXISTS $DatabaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u $MySQLUser -p"$MySQLPassword" -h $MySQLHost -P $MySQLPort -e $createDbQuery 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database '$DatabaseName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database might already exist or there was an error." -ForegroundColor Yellow
}

Write-Host ""

# Run setup script
$setupScript = Join-Path $PSScriptRoot "..\database\setup_database.sql"
if (Test-Path $setupScript) {
    Write-Host "Running database setup script..." -ForegroundColor Yellow
    Get-Content $setupScript | mysql -u $MySQLUser -p"$MySQLPassword" -h $MySQLHost -P $MySQLPort $DatabaseName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup script executed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some errors may have occurred. Check the output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Setup script not found at: $setupScript" -ForegroundColor Yellow
    Write-Host "Creating basic schema..." -ForegroundColor Yellow
    
    # Create basic schema if setup script doesn't exist
    $basicSchema = @"
USE $DatabaseName;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  website varchar(255),
  industry varchar(100),
  size enum('startup','small','medium','large','enterprise') DEFAULT 'small',
  status enum('active','inactive','trial') DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
"@
    
    $basicSchema | mysql -u $MySQLUser -p"$MySQLPassword" -h $MySQLHost -P $MySQLPort 2>&1
}

Write-Host ""

# Update .env file
Write-Host "Updating .env file with database credentials..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"
$databaseUrl = "mysql+pymysql://${MySQLUser}:${MySQLPassword}@${MySQLHost}:${MySQLPort}/${DatabaseName}?charset=utf8mb4"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $updatedContent = $envContent | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            "DATABASE_URL=$databaseUrl"
        } else {
            $_
        }
    }
    
    # Add DATABASE_URL if it doesn't exist
    if (-not ($envContent -match "^DATABASE_URL=")) {
        $updatedContent += "DATABASE_URL=$databaseUrl"
    }
    
    Set-Content -Path $envFile -Value $updatedContent -Encoding UTF8
    Write-Host "✅ .env file updated!" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found. Please add manually:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=$databaseUrl" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $DatabaseName" -ForegroundColor White
Write-Host "Host: ${MySQLHost}:${MySQLPort}" -ForegroundColor White
Write-Host "User: $MySQLUser" -ForegroundColor White
Write-Host ""
Write-Host "You can now restart the backend server to connect to the database." -ForegroundColor Yellow
