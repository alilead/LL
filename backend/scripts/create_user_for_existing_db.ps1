# Create New MySQL User for Existing Database
# This preserves all existing data and users
# Usage: .\create_user_for_existing_db.ps1 [-RootPassword "root_password"] [-NewPassword "new_password"]

param(
    [string]$RootPassword = "",
    [string]$NewPassword = "LeadLab123!",
    [string]$NewUser = "leadlab_user",
    [string]$DatabaseName = "leadlab_db"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create MySQL User for Existing Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will create a NEW MySQL user to access your EXISTING database." -ForegroundColor Yellow
Write-Host "All your existing users and data will be preserved!" -ForegroundColor Green
Write-Host ""
Write-Host "Database: $DatabaseName" -ForegroundColor White
Write-Host "New User: $NewUser" -ForegroundColor White
Write-Host "New Password: $NewPassword" -ForegroundColor White
Write-Host ""
Write-Host "You'll need MySQL root access temporarily to create the user." -ForegroundColor Yellow
Write-Host ""

# Get root password if not provided
if ([string]::IsNullOrEmpty($RootPassword)) {
    Write-Host "Enter MySQL ROOT password (to create new user):" -ForegroundColor Yellow -NoNewline
    $securePassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $RootPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

Write-Host ""
Write-Host "Creating new MySQL user..." -ForegroundColor Yellow
Write-Host ""

# Create SQL commands - ONLY creates user, does NOT create database
$createUserSQL = @"
-- Create new MySQL user
CREATE USER IF NOT EXISTS '$NewUser'@'localhost' IDENTIFIED BY '$NewPassword';

-- Grant access to EXISTING database (preserves all data)
GRANT ALL PRIVILEGES ON $DatabaseName.* TO '$NewUser'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user was created
SELECT 'User created successfully!' as Status;
SELECT User, Host FROM mysql.user WHERE User = '$NewUser';
SELECT 'User can now access database: $DatabaseName' as Note;
"@

# Try to execute
try {
    # Method 1: Using password parameter
    $result = $createUserSQL | mysql -u root -p"$RootPassword" 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $result
        Write-Host ""
        Write-Host "✅ MySQL user created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New MySQL Credentials:" -ForegroundColor Cyan
        Write-Host "  Username: $NewUser" -ForegroundColor White
        Write-Host "  Password: $NewPassword" -ForegroundColor White
        Write-Host "  Database: $DatabaseName (existing)" -ForegroundColor White
        Write-Host ""
        
        # Update .env file
        Write-Host "Updating .env file..." -ForegroundColor Yellow
        $envFile = Join-Path (Split-Path (Split-Path $PSScriptRoot)) ".env"
        $databaseUrl = "mysql+pymysql://${NewUser}:${NewPassword}@localhost:3306/${DatabaseName}?charset=utf8mb4"
        
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
            Write-Host "✅ .env file updated with new credentials!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Updated DATABASE_URL in .env:" -ForegroundColor Cyan
            Write-Host "  DATABASE_URL=$databaseUrl" -ForegroundColor White
        } else {
            Write-Host "⚠️  .env file not found at: $envFile" -ForegroundColor Yellow
            Write-Host "Please add this line manually:" -ForegroundColor Yellow
            Write-Host "DATABASE_URL=$databaseUrl" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Setup Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ All existing users and data are preserved!" -ForegroundColor Green
        Write-Host "✅ You can now use the new user credentials" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next step: Restart your backend server" -ForegroundColor Yellow
        Write-Host ""
        exit 0
    } else {
        Write-Host "❌ Failed to create user. Error:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  - Incorrect root password" -ForegroundColor White
        Write-Host "  - Database '$DatabaseName' doesn't exist" -ForegroundColor White
        Write-Host "  - MySQL service not running" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
