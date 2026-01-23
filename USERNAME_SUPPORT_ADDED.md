# Username Support Added to LeadLab

## ✅ Changes Completed

### Backend Changes

1. **User Model** (`backend/app/models/user.py`)
   - Added `username` field (optional, unique, indexed)
   - Field is nullable to support existing users

2. **Authentication Schema** (`backend/app/schemas/auth.py`)
   - Updated `UserLogin` to accept either `email` OR `username`
   - Added validation to ensure at least one is provided
   - Added `get_identifier()` method to return the login identifier

3. **CRUD Operations** (`backend/app/crud/crud_user.py` and `backend/app/crud/user.py`)
   - Added `get_by_username()` method
   - Added `get_by_email_or_username()` method (tries email first, then username)
   - Updated `authenticate()` to support both email and username

4. **Authentication Endpoint** (`backend/app/api/v1/endpoints/auth.py`)
   - Updated login endpoint to use `get_by_email_or_username()`
   - Updated error messages to say "email/username"
   - Updated response to include username field

5. **User Schemas** (`backend/app/schemas/user.py`)
   - Added `username` field to `UserBase`, `UserResponse`, etc.

### Frontend Changes

1. **SignIn Page** (`frontend/src/pages/SignIn.tsx`)
   - Added toggle between email and username login
   - Updated form to support both fields
   - Added "Use username/email instead" button

2. **Auth Service** (`frontend/src/services/auth.ts`)
   - Updated `LoginCredentials` interface to support optional email/username
   - Updated `UserInfo` interface to include username

3. **Auth Store** (`frontend/src/store/auth.ts`)
   - Updated `User` interface to include username

### Database Migration

Created migration file: `backend/migrations/add_username_to_users.sql`

## 📋 Next Steps

### 1. Run Database Migration

**Option A: Using PowerShell (Recommended)**
```powershell
cd C:\Users\attia\Downloads\tll\tll\leadlab\backend\migrations
Get-Content add_username_to_users.sql | mysql -u root -p
```

**Option B: Using MySQL Workbench**
- Open MySQL Workbench
- Connect to your database
- Open `backend/migrations/add_username_to_users.sql`
- Execute the script

**Option C: Direct MySQL Command**
```sql
ALTER TABLE users 
ADD COLUMN username VARCHAR(100) NULL AFTER email;

CREATE UNIQUE INDEX idx_users_username ON users(username);
```

### 2. Restart Backend Server

After running the migration, restart your backend server:
```powershell
# Stop current server (Ctrl+C)
# Then restart:
cd backend
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test the Feature

1. **Login with Email** (existing functionality)
   - Go to sign-in page
   - Enter email and password
   - Should work as before

2. **Login with Username** (new functionality)
   - Go to sign-in page
   - Click "Use username instead"
   - Enter username and password
   - Should authenticate successfully

## 🎯 How It Works

1. **User Registration**: Users can optionally set a username during registration
2. **Login**: Users can login with either:
   - Their email address
   - Their username (if set)
3. **Backend Logic**: 
   - Tries to find user by email first
   - If not found, tries username
   - Returns appropriate error if neither matches

## 📝 Notes

- Username is **optional** - existing users without usernames can still login with email
- Username must be **unique** - database enforces this with a unique index
- Email login still works for all users
- Users can set a username later through their profile settings (if that feature exists)

## 🔧 Optional: Auto-generate Usernames

If you want to auto-generate usernames from emails for existing users, you can run:

```sql
UPDATE users 
SET username = SUBSTRING_INDEX(email, '@', 1) 
WHERE username IS NULL;
```

This will create usernames from the part before the @ in email addresses.

---

**Status**: ✅ All code changes complete. Database migration pending.
