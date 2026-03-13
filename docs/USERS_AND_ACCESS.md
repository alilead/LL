# Users and access

How to check which users exist and set known passwords. **Passwords are not stored in the repo**; they are set via the reset script or sign-up.

---

## Check which users exist

From the repo `backend` folder, with `DATABASE_URL` set to the database you care about.

**Local DB (e.g. MySQL):**  
If your `backend/.env` has `DATABASE_URL` pointing at local MySQL, just run:

```powershell
cd backend
py scripts/list_users.py
```

If you need to override (e.g. .env currently points at Render), set the URL first:

```powershell
cd backend
# MySQL example:
$env:DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/leadlab?charset=utf8mb4"
py scripts/list_users.py
```

**Render DB:** use the External Database URL from Render in `DATABASE_URL`, then run the same command.

This prints: `id`, `email`, `username`, `is_active`, `created_at` for every user. No passwords.

---

## Set a known password for a user

Use the reset-password script so you can log in with a known password:

```powershell
cd backend
$env:DATABASE_URL = "postgresql://..."   # Internal/External URL for the DB
$env:RESET_EMAIL = "ali@the-lead-lab.com"
$env:RESET_PASSWORD = "YourSecurePassword123!"
py scripts/reset_password.py
```

- Defaults if you don’t set env vars: `RESET_EMAIL=ali@the-lead-lab.com`, `RESET_PASSWORD=LeadLab123!`
- The user must already exist (create via sign-up on the app, or run a seed script first).

---

## Known accounts (reference)

| Environment | Email | Password | Notes |
|-------------|--------|----------|--------|
| Local / Render (reset script default) | `ali@the-lead-lab.com` | Set via `reset_password.py` (default: `LeadLab123!`) | Use reset script after DB init or if you forgot. |
| Seed data (`app/db/seed.py`) | `admin@example.com` | `admin123` | Only if you ran that seed. |
| Seed data (`app/db/seed.py`) | `user@example.com` | `user123` | Only if you ran that seed. |
| Seed data (`app/seed.py`, MySQL) | `admin@teknoloji.com.tr` | `admin123` | Only if you ran that seed. |

**We do not have a single list of “all users and passwords”** because:

1. Passwords are not stored in the repo (security).
2. Users can be created by sign-up or by seed scripts; which DB you use (local vs Render) may have different users.

To make sure everything is correct:

1. **List users:** run `list_users.py` with `DATABASE_URL` pointing at the DB (e.g. Render External URL).
2. **Set passwords:** for each email you need to log in with, run `reset_password.py` with `RESET_EMAIL` and `RESET_PASSWORD`.
3. **Test login:** open the app, sign in with that email and the password you set.

---

## Make Render use the same users as local (Option B sync)

Render cannot point at your PC’s database. To have the same organizations and users (and **same passwords**) on Render:

1. **Render DB:** Fix Render Postgres (see [RENDER_DATABASE_CONNECTION_FIX.md](RENDER_DATABASE_CONNECTION_FIX.md)). Run `scripts/init_render_db.py` with **RENDER_DATABASE_URL** set to Render’s **External** URL so tables exist.
2. **Sync from local to Render:** From the repo `backend` folder, set both URLs and run the sync script:
   ```powershell
   cd backend
   $env:LOCAL_DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/leadlab?charset=utf8mb4"
   $env:RENDER_DATABASE_URL = "postgresql://...@....frankfurt-postgres.render.com/leadlab"
   py scripts/sync_local_to_render.py
   ```
   This copies organizations and users from local to Render and **copies password hashes** so the same passwords work on the live site.
3. **Render backend:** In the Render dashboard, set **DATABASE_URL** on the **backend** service to the **Internal** Database URL of Render Postgres. Save and redeploy.

Result: Render uses Render Postgres with the same orgs and users as local; you can log in with the same emails and passwords.

---

## Quick checklist

- [ ] `DATABASE_URL` is set (e.g. in `.env` or env vars) for the DB you care about.
- [ ] Run `py scripts/list_users.py` and note which emails exist.
- [ ] For each account you need, run `reset_password.py` with `RESET_EMAIL` and `RESET_PASSWORD`.
- [ ] Log in on the app with that email and password to confirm.
