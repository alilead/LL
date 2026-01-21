# Quick Database Setup Guide

## Current Situation
- ✅ MySQL is installed and running
- ✅ MySQL Workbench connection exists (just needs correct password)
- ✅ Both setup scripts are ready
- ❌ Need correct MySQL root password

## Step 1: Get Your MySQL Password

### Option A: Try to Remember/Find It
- Check password managers
- Check any setup notes
- Try variations of `147741_a` (maybe with different characters)

### Option B: Reset MySQL Root Password

**Quick Reset Method:**

1. **Stop MySQL Service:**
   ```powershell
   net stop MySQL80
   # or check service name:
   Get-Service | Where-Object {$_.Name -like "*mysql*"}
   ```

2. **Create a reset file** (`C:\mysql-reset.txt`):
   ```
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
   FLUSH PRIVILEGES;
   ```

3. **Start MySQL with reset file:**
   ```powershell
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   mysqld --init-file=C:\mysql-reset.txt
   ```
   (Run in a separate terminal, let it start)

4. **Stop that MySQL instance** (Ctrl+C)

5. **Start MySQL normally:**
   ```powershell
   net start MySQL80
   ```

6. **Test new password:**
   ```powershell
   mysql -u root -pNewPassword123! -e "SELECT 1;"
   ```

## Step 2: Run Database Setup

Once you have the correct password, run:

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
.\run_database_setup.ps1 -Password "your_password_here"
```

This will:
- ✅ Create the `leadlab_db` database
- ✅ Create all required tables
- ✅ Insert demo data (organizations, users, lead stages, sample leads)
- ✅ Update your `.env` file with the database connection

## Step 3: Verify in MySQL Workbench

After setup, you can:
1. Connect to MySQL in Workbench with your password
2. See the new `leadlab_db` database
3. Browse the tables and data

## Step 4: Test Backend Connection

Restart your backend server and check:
```powershell
curl http://localhost:8000/health
```

Should show: `"database": "connected"`

## Which Script to Use?

**Use `run_database_setup.ps1`** - It's simpler and uses the correct SQL file.

The `setup_database.ps1` is more complex and tries to use a different SQL file path.
