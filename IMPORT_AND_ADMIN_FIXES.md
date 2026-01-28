# Import & Admin Page Fixes

## Issues Found

### 1. ✅ Import Route Mismatch
**Problem**: Frontend was calling `/api/v1/leads/import/csv` but backend had `/api/v1/leads/csv`

**Fix Applied**:
```python
# backend/app/api/v1/endpoints/leads_import.py
# Changed from:
@router.post("/csv", response_model=GenericResponse)

# To:
@router.post("/import/csv", response_model=GenericResponse)
```

### 2. Admin Page Location
**Admin Panel**: `/admin` or `/admin-panel`

**Backend Routes**:
- `/api/v1/admin/monitoring/stats` - Monitoring statistics
- `/api/v1/admin/monitoring/dashboard` - HTML dashboard
- `/api/v1/admin/import-leads` - Admin lead import
- `/api/v1/admin/leads/template` - Admin CSV template

**Frontend Page**: `frontend/src/pages/Admin/AdminPanel.tsx` exists

**Access Control**: Requires `user.is_superuser = true`

---

## How to Access Admin Page

### 1. Set User as Superuser
Run this SQL command to make your admin user a superuser:

```sql
UPDATE users SET is_superuser = 1 WHERE email = 'admin@the-leadlab.com';
```

Or via MySQL command line:
```bash
mysql -u root -p"admin123" leadlab -e "UPDATE users SET is_superuser = 1 WHERE email = 'admin@the-leadlab.com';"
```

### 2. Frontend Route
The admin page should be accessible at:
- `http://localhost:5173/admin`
- or `http://localhost:5173/admin-panel`

Check your router configuration in `frontend/src/App.tsx` or similar.

---

## Import Functionality

### Using the Import Feature:

1. **Download Template**:
   - Click "Download Template" button
   - Get `leads-import-template.csv`

2. **Fill Template**:
   ```csv
   FIRSTNAME,LASTNAME,COMPANY,JOB_TITLE,LOCATION,COUNTRY,EMAILS,TELEPHONE,MOBILE,LINKEDIN,WEBSITE,SECTOR,NOTE
   John,Doe,Tech Corp,Senior Developer,San Francisco,USA,john.doe@techcorp.com,+1-555-0123,+1-555-4567,https://linkedin.com/in/johndoe,https://techcorp.com,Technology,Sample lead
   ```

3. **Upload File**:
   - Click "Import" button
   - Select your CSV/Excel file
   - Click "Import Leads"

### Backend Endpoint:
```
POST /api/v1/leads/import/csv
Content-Type: multipart/form-data

Parameters:
- file: CSV/XLS/XLSX file
- assigned_user_id: User ID to assign leads to
- tag_id (optional): Tag to assign to imported leads
- new_tag_name (optional): Create new tag and assign
```

---

## Testing

### Test Import:
```bash
# After backend reloads (wait 10-15 seconds)
# Try importing your CSV file through the UI
```

### Check if admin user is superuser:
```bash
mysql -u root -p"admin123" leadlab -e "SELECT email, is_superuser FROM users WHERE email = 'admin@the-leadlab.com';"
```

Expected output:
```
email                   is_superuser
admin@the-leadlab.com   1
```

---

## If Import Still Fails

### Check Backend Logs For:
- File format errors
- Missing required fields
- Database constraints
- User permissions

### Common Issues:
1. **File format** - Must be CSV, XLS, or XLSX
2. **Required fields** - Email must be unique
3. **assigned_user_id** - Must match form data
4. **Organization** - User must have valid organization_id

---

## Next Steps

1. **Wait 10-15 seconds** for backend auto-reload
2. **Try importing** your CSV file
3. **Check browser console** for any errors
4. **Set is_superuser** to access admin panel
5. **Navigate to** `/admin` to access admin features

---

**Status**: ✅ Import route fixed, waiting for backend reload
**Admin Access**: Requires is_superuser = 1
**Files Modified**: `backend/app/api/v1/endpoints/leads_import.py`
