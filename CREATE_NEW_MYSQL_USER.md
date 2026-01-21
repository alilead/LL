# Create New MySQL User for LeadLab

## Why Create a New User?

Instead of resetting the root password, we'll create a dedicated MySQL user for LeadLab. This is:
- ✅ More secure (not using root)
- ✅ Better practice
- ✅ Easier to manage

## Port Information

- **MySQL**: Port 3306 (standard, already running)
- **Backend**: Port 8000 (FastAPI)
- **Frontend**: Port 5173 (Vite)

All ports are correctly configured!

## Step 1: Create New MySQL User

You'll need MySQL root access **just once** to create the new user.

### Option A: Using PowerShell Script (Easiest)

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
.\create_leadlab_user.ps1
```

You'll be prompted for:
1. MySQL root password (to create the new user)
2. The script will create everything automatically

**OR** provide root password directly:
```powershell
.\create_leadlab_user.ps1 -RootPassword "your_root_password"
```

### Option B: Using SQL File

If you can access MySQL root (even temporarily):

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
Get-Content create_leadlab_user.sql | mysql -u root -p
```

Enter root password when prompted.

### Option C: Manual MySQL Commands

If you can connect to MySQL as root:

```sql
CREATE DATABASE IF NOT EXISTS leadlab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'leadlab_user'@'localhost' IDENTIFIED BY 'LeadLab123!';
GRANT ALL PRIVILEGES ON leadlab_db.* TO 'leadlab_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2: Run Database Setup

After creating the user, run the setup script with the NEW password:

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
.\run_database_setup.ps1 -Password "LeadLab123!"
```

This will:
- Create all tables
- Insert demo data
- Update your .env file

## Default Credentials

After setup, you'll have:

**MySQL User:**
- Username: `leadlab_user`
- Password: `LeadLab123!`
- Database: `leadlab_db`

**Application Login:**
- Admin: `admin@the-leadlab.com` / `admin123`
- Demo: `demo@the-leadlab.com` / `admin123`

## If You Still Can't Access Root

If you absolutely cannot get root access, you have two options:

1. **Reset MySQL root password** (see QUICK_DATABASE_SETUP.md)
2. **Reinstall MySQL** (last resort)

## Troubleshooting

### "Access denied for user 'root'"
- You need root access to create a new user
- Try resetting root password first
- Or use MySQL Installer to reconfigure

### "User already exists"
- That's okay! The script uses `CREATE USER IF NOT EXISTS`
- You can proceed to Step 2

### "Database already exists"
- That's also okay! The script uses `CREATE DATABASE IF NOT EXISTS`
- You can proceed to Step 2

## Next Steps After Setup

1. ✅ New MySQL user created
2. ✅ Database created
3. ✅ Tables and data inserted
4. ✅ .env file updated
5. 🎉 Restart backend and test!
