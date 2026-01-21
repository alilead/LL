# MySQL Database Setup Instructions

## Quick Setup

### Option 1: Using PowerShell Script (Recommended for Windows)

1. **Open PowerShell**

2. **Navigate to the backend scripts directory:**
   ```powershell
   cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
   ```

3. **Run the PowerShell script:**
   ```powershell
   .\run_database_setup.ps1
   ```
   
   You will be prompted for your MySQL root password.
   
   **OR** provide the password directly:
   ```powershell
   .\run_database_setup.ps1 -Password "your_mysql_password"
   ```

### Option 1b: Using MySQL Command Line (Alternative)

1. **Open PowerShell**

2. **Navigate to the backend scripts directory:**
   ```powershell
   cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
   ```

3. **Run the SQL script using PowerShell pipe:**
   ```powershell
   Get-Content setup_database_simple.sql | mysql -u root -p
   ```
   
   You will be prompted for your MySQL root password.

### Option 2: Using MySQL Workbench or phpMyAdmin

1. **Open MySQL Workbench** (or your preferred MySQL client)

2. **Connect to your MySQL server** with root credentials

3. **Open the SQL script:**
   - File: `backend/scripts/setup_database_simple.sql`

4. **Execute the script**

### Option 3: Manual Step-by-Step

If you prefer to run commands manually:

```bash
# 1. Connect to MySQL
mysql -u root -p

# 2. Create the database
CREATE DATABASE IF NOT EXISTS leadlab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. Use the database
USE leadlab_db;

# 4. Run the setup script
SOURCE C:/Users/attia/Downloads/tll/tll/leadlab/backend/scripts/setup_database_simple.sql;
```

## Verify Setup

After running the setup, verify the database was created:

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'leadlab_db';"
mysql -u root -p leadlab_db -e "SHOW TABLES;"
```

You should see:
- Database: `leadlab_db`
- Tables: `organizations`, `users`, `lead_stages`, `leads`

## Update .env File

The `.env` file should already have the database URL configured. If you need to update it:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/leadlab_db?charset=utf8mb4
```

Replace `YOUR_PASSWORD` with your actual MySQL root password.

## Test Database Connection

After setup, restart the backend server and check the health endpoint:

```bash
# Check backend health
curl http://localhost:8000/health
```

The response should show:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

## Default Login Credentials

After setup, you can log in with:

- **Admin User:**
  - Email: `admin@the-leadlab.com`
  - Password: `admin123`

- **Demo User:**
  - Email: `demo@the-leadlab.com`
  - Password: `admin123`

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'

- Make sure you're using the correct MySQL root password
- Try resetting MySQL root password if needed

### Error: Database already exists

- The script uses `CREATE DATABASE IF NOT EXISTS`, so it's safe to run multiple times
- If you want to start fresh, drop the database first:
  ```sql
  DROP DATABASE IF EXISTS leadlab_db;
  ```

### Error: Can't connect to MySQL server

- Make sure MySQL service is running:
  ```powershell
  Get-Service | Where-Object {$_.Name -like "*mysql*"}
  ```
- Start MySQL service if needed

## Next Steps

Once the database is set up:

1. ✅ Database created and tables initialized
2. ✅ Default users and demo data inserted
3. ✅ Backend can connect to database
4. ✅ Frontend can communicate with backend
5. 🎉 Ready to use LeadLab!
