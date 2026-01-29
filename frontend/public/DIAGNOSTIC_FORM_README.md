# Business Diagnostic Assessment Form

**File:** `diagnostic-form.html`  
**Live URL (when deployed):** `https://the-leadlab.com/diagnostic-form.html` or `/diagnostic-form.html`

## Features
- 8-step progressive assessment with progress bar
- Business Health Score (0–100) and Urgency/Priority Level (0–100)
- Download report as formatted text file
- LeadLab branding (indigo #4f46e5 + pink #ec4899)
- Mobile-responsive; honest, direct copy

## Backend integration (optional)
To save submissions to your API and send email notifications:
1. Uncomment the `fetch` block at the bottom of `diagnostic-form.html` (inside `submitForm()`).
2. Point it to your backend endpoint (e.g. `POST /api/v1/diagnostic`).
3. Add backend route + DB storage and/or Resend email as needed.
