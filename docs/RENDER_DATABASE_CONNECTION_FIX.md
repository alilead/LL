# Fix "Database connection error" on Render

The backend returns 500 and "Database connection error" when it cannot connect to the database. Fix it by ensuring the Render service has a valid **DATABASE_URL** and the database is reachable.

---

## 1. Open your backend service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Open the project that has your LeadLab backend (the one that serves `11-ec9p.onrender.com` or your API URL).
3. Click the **backend service** (e.g. "LL" or "leadlab-backend").

---

## 2. Check environment variables

1. In the left sidebar, click **Environment** (or **Environment Variables**).
2. Find **DATABASE_URL**.
   - If it is **missing** → you must add it (step 3).
   - If it is **present** → it may be wrong or the database may be down (steps 3–4).

---

## 3. Set or fix DATABASE_URL

**If your database is on Render (PostgreSQL):**

1. In the Render dashboard, open your **PostgreSQL** database service.
2. In **Connections**, copy the **Internal Database URL** (recommended for a backend in the same Render account).
3. In your **backend** service → **Environment**, set:
   - **Key:** `DATABASE_URL`
   - **Value:** the Internal Database URL you copied (starts with `postgresql://`).

**If your database is external (e.g. your own MySQL/Postgres):**

1. Build the URL in this form:
   - **PostgreSQL:** `postgresql://USER:PASSWORD@HOST:5432/DATABASE`
   - **MySQL:** `mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE`
2. Use the **public** host and port (the one reachable from the internet).
3. In your **backend** service → **Environment**, set **DATABASE_URL** to this value.
4. Ensure the database server allows connections from Render (firewall/security group; some providers allow “any” for public DBs).

**If you want Render to use your local database:**

Render runs in the cloud and **cannot** connect to `localhost` on your PC. You have two options:

- **Option A – Expose your local DB to the internet (temporary/dev only):**  
  Use a tunnel (e.g. [ngrok](https://ngrok.com)) to expose your local MySQL/Postgres port. Then set **DATABASE_URL** on Render to the tunnel URL (e.g. `mysql+pymysql://user:pass@abc123.ngrok.io:12345/leadlab`). Not recommended for production (your PC must stay on and the tunnel open).

- **Option B – Use Render Postgres and copy data from local (recommended):**  
  Keep **DATABASE_URL** on Render pointing at **Render PostgreSQL**. Create tables with `scripts/init_render_db.py`, then sync users/data from your local DB into Render (e.g. run a one-off export from local and import into Render, or use the app’s sign-up/reset-password flow on the live site). See [Users and access](USERS_AND_ACCESS.md) for step-by-step Option B (including `scripts/sync_local_to_render.py`).

---

## 4. Save and redeploy

1. Click **Save Changes** (or equivalent) in the Environment page.
2. Go to **Manual Deploy** → **Deploy latest commit** (or **Clear build cache & deploy** if you changed env vars and want a clean build).
3. Wait for the deploy to finish (status “Live” or “Deployed”).

---

## 5. Confirm the fix

1. Open **Logs** for the backend service.
2. In another tab, open your sign-in page and try to log in.
3. In Logs you should see either:
   - Successful requests (no DB error), or
   - The **exact** error (e.g. “connection refused”, “password authentication failed”). Use that to correct **DATABASE_URL** or the database (user, password, host, port, firewall).

**Optional – health check:**  
Call your backend health endpoint (e.g. `https://11-ec9p.onrender.com/api/v1/health`). If it returns 200, the app and DB connection are working.

---

## 6. If you see "relation \"users\" does not exist" (tables missing)

The database **connects** but the schema was never created (no `users`, `organizations`, etc.). Create all tables once using the init script.

1. **Get your Render database URL**
   - **From your PC:** use the **External Database URL** (so the script can reach Render’s Postgres). Render dashboard → PostgreSQL service → **Connections** → copy **External Database URL**.
   - **From inside Render** (e.g. a one-off job/shell): you can use the **Internal Database URL** instead.

2. **Run the init script from your machine (from the repo `backend` folder)**
   - **Windows (PowerShell):**
     ```powershell
     cd backend
     $env:DATABASE_URL = "postgresql://..."   # paste your Render DB URL
     py scripts/init_render_db.py
     ```
   - **Windows (cmd):**
     ```cmd
     cd backend
     set DATABASE_URL=postgresql://...
     py scripts/init_render_db.py
     ```
   - **Linux / Mac:**
     ```bash
     cd backend
     export DATABASE_URL="postgresql://..."
     python scripts/init_render_db.py
     ```

3. You should see: `Creating all tables...` then `Done. Tables created successfully.`

4. Try signing in again. If you have no users yet, create an account or run the reset-password script against the Render DB (with `DATABASE_URL` set to the same URL) to set a user password.

---

## 7. If you see "role \"...\" is not permitted to log in"

PostgreSQL is rejecting the database user (e.g. the role was disabled or credentials were rotated). Use a **fresh** connection URL from Render.

1. **Get a new connection URL from Render**
   - Render dashboard → your **PostgreSQL** service.
   - Open **Info** or **Connections**.
   - If you see **Reset database password** or **Regenerate credentials**, use it so the role is allowed to log in again. Then copy the new **Internal Database URL** (and **External** if you run scripts from your PC).
   - If there is no reset option, copy the **Internal Database URL** as shown now (Render may have updated it).

2. **Update the backend**
   - Backend service → **Environment** → set **DATABASE_URL** to the **exact** new Internal Database URL (no extra spaces, same user/password as in the dashboard).
   - **Save** → **Manual Deploy** → **Deploy latest commit**.

3. **Re-run init and reset if needed**
   - If you regenerated the password, the database may be empty again. Run `scripts/init_render_db.py` with the new **External** URL, then `scripts/reset_password.py` if you need to set a user password.

---

## Quick checklist

- [ ] Backend service has **DATABASE_URL** set in Environment.
- [ ] **DATABASE_URL** matches the database you intend to use (Render Internal URL or external URL).
- [ ] Database service is running (not suspended).
- [ ] Saved env and **redeployed** the backend after changing **DATABASE_URL**.
- [ ] If you see **"relation \"users\" does not exist"**: run `scripts/init_render_db.py` once with that **DATABASE_URL** (see section 6).
- [ ] If you see **"role \"...\" is not permitted to log in"**: use a fresh **Internal Database URL** from the PostgreSQL service (or reset DB password); update backend **DATABASE_URL** and redeploy (see section 7).
- [ ] Checked **Logs** for the real error if the issue persists.
