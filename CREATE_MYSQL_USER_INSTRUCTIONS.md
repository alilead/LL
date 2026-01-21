# Create MySQL User for Existing Database - Instructions

## What This Does

This script creates a **NEW MySQL user** that can access your **EXISTING database**. It:
- ✅ Creates new user: `leadlab_user` with password: `LeadLab123!`
- ✅ Grants access to your existing `leadlab_db` database
- ✅ **Preserves ALL existing users and data**
- ✅ Updates your `.env` file automatically

## How to Run

### Option 1: PowerShell Script (Recommended)

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
.\create_user_for_existing_db.ps1
```

You'll be prompted for your MySQL root password.

**OR** provide the password directly:
```powershell
.\create_user_for_existing_db.ps1 -RootPassword "your_root_password"
```

### Option 2: SQL File (Alternative)

If you can access MySQL Workbench or command line:

```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\scripts
Get-Content create_user_for_existing_db.sql | mysql -u root -p
```

Enter root password when prompted.

### Option 3: Manual MySQL Commands

If you can connect to MySQL as root:

```sql
-- Create new user
CREATE USER IF NOT EXISTS 'leadlab_user'@'localhost' IDENTIFIED BY 'LeadLab123!';

-- Grant access to existing database
GRANT ALL PRIVILEGES ON leadlab_db.* TO 'leadlab_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

Then manually update your `.env` file:
```
DATABASE_URL=mysql+pymysql://leadlab_user:LeadLab123!@localhost:3306/leadlab_db?charset=utf8mb4
```

## What Happens

1. **Script runs** → Creates new MySQL user
2. **Grants access** → User can access existing `leadlab_db` database
3. **Updates .env** → Automatically updates `DATABASE_URL` in `backend/.env`
4. **All data preserved** → Your existing users and data remain intact

## After Running

1. **Restart your backend server** (if it's running)
2. **Test the connection**:
   ```powershell
   curl http://localhost:8000/health
   ```
   Should show: `"database": "connected"`

## New Credentials

After running the script, you'll have:

- **MySQL Username**: `leadlab_user`
- **MySQL Password**: `LeadLab123!`
- **Database**: `leadlab_db` (your existing database)
- **Connection String**: Updated in `.env` file

## Troubleshooting

### "Access denied for user 'root'"
- Make sure you're using the correct MySQL root password
- Try resetting MySQL root password if needed

### "Database 'leadlab_db' doesn't exist"
- Check your actual database name:
  ```sql
  SHOW DATABASES;
  ```
- Update the script with the correct database name

### "User already exists"
- That's okay! The script uses `CREATE USER IF NOT EXISTS`
- You can proceed - it will just grant permissions

## Important Notes

- ✅ **No data loss** - This only creates a user, doesn't touch your database
- ✅ **All users preserved** - Your existing application users remain
- ✅ **All data preserved** - Everything in your database stays intact
- ✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` checks

## Next Steps

After creating the user:
1. ✅ User created
2. ✅ .env file updated
3. 🔄 Restart backend server
4. 🎉 Test connection!
