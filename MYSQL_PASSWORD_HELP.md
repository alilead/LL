# MySQL Password Help

## Current Situation
- MySQL is installed and accessible
- Root password `147741_a` is not working
- Need to find the correct password or reset it

## Option 1: Check if you have the password saved somewhere

1. **MySQL Workbench**: If you use MySQL Workbench, check your saved connections
2. **phpMyAdmin**: Check if you have phpMyAdmin installed with saved credentials
3. **Other tools**: Check any database management tools you use
4. **Password managers**: Check if you saved it in a password manager

## Option 2: Try Common Default Passwords

Try these common defaults (one at a time):
- Empty password (just press Enter)
- `root`
- `password`
- `admin`
- `123456`

## Option 3: Reset MySQL Root Password

If you can't find the password, you can reset it:

### Windows Method:

1. **Stop MySQL Service:**
   ```powershell
   net stop MySQL80
   # or
   net stop MySQL
   # (Check the exact service name)
   ```

2. **Start MySQL in Safe Mode:**
   ```powershell
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   mysqld --init-file=C:\mysql-init.txt
   ```

3. **Create reset file** (`C:\mysql-init.txt`):
   ```
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
   ```

4. **Start MySQL normally** and delete the init file

### Alternative: Use MySQL Installer

If you installed MySQL via MySQL Installer:
1. Open MySQL Installer
2. Go to "Reconfigure" for your MySQL Server
3. You can reset the root password there

## Option 4: Check if there's a different user

Maybe you're not using `root`? Try:
```powershell
mysql -u admin -p
# or
mysql -u leadlab -p
```

## Option 5: Check MySQL Configuration File

MySQL might have a default password in the config:
- Location: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
- Look for `[client]` section

## Quick Test Commands

Try these to find the right password:

```powershell
# Test with empty password
mysql -u root -e "SELECT 1;"

# Test with common passwords
mysql -u root -proot -e "SELECT 1;"
mysql -u root -ppassword -e "SELECT 1;"
mysql -u root -padmin -e "SELECT 1;"
```

## Once You Have the Password

Run the setup script:
```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
.\run_database_setup.ps1 -Password "your_actual_password"
```

Or manually:
```powershell
Get-Content setup_database_simple.sql | mysql -u root -p
# (Enter password when prompted)
```
