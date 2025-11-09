# Complete Route Testing Checklist

## How to Test:
1. Start backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Visit each URL below
4. Mark which ones give 404 errors

## Public Routes (No Login Required):
- [ ] http://localhost:5173/ - HomePage
- [ ] http://localhost:5173/signin - SignIn
- [ ] http://localhost:5173/signup - SignUp
- [ ] http://localhost:5173/forgot-password - ForgotPassword
- [ ] http://localhost:5173/reset-password - ResetPassword
- [ ] http://localhost:5173/legal - Legal
- [ ] http://localhost:5173/contact - Contact

## Main Pages (Requires Login):
- [ ] http://localhost:5173/dashboard - ModernDashboard
- [ ] http://localhost:5173/leads - ModernLeads
- [ ] http://localhost:5173/tasks - ModernTasks
- [ ] http://localhost:5173/deals - ModernDeals
- [ ] http://localhost:5173/profile - ModernProfile

## Detail/Form Pages:
- [ ] http://localhost:5173/leads/form - ModernLeadForm (Create Lead)
- [ ] http://localhost:5173/leads/1 - ModernLeadDetail (Lead #1 detail)
- [ ] http://localhost:5173/tasks/new - ModernNewTask (Create Task)
- [ ] http://localhost:5173/deals/new - ModernNewDeal (Create Deal)

## Communication:
- [ ] http://localhost:5173/messages - ModernMessages
- [ ] http://localhost:5173/emails - ModernEmails
- [ ] http://localhost:5173/email-sequences - ModernEmailSequences
- [ ] http://localhost:5173/calendar - ModernCalendar

## Analytics & AI:
- [ ] http://localhost:5173/reports - ModernReports
- [ ] http://localhost:5173/ai-insights - ModernAIInsights

## Sales & CPQ:
- [ ] http://localhost:5173/cpq/quotes - ModernQuoteList
- [ ] http://localhost:5173/cpq/products - ModernProductList
- [ ] http://localhost:5173/forecasting - ModernForecasting

## Automation:
- [ ] http://localhost:5173/workflows - ModernWorkflows
- [ ] http://localhost:5173/conversations - ModernConversations (Call Intelligence)

## Settings & Admin:
- [ ] http://localhost:5173/settings - ModernSettings
- [ ] http://localhost:5173/customization - ModernCustomization
- [ ] http://localhost:5173/organization - ModernOrganization
- [ ] http://localhost:5173/territories - ModernTerritories
- [ ] http://localhost:5173/credits - ModernCredits
- [ ] http://localhost:5173/admin - AdminPanel

## Data Management:
- [ ] http://localhost:5173/data-import/wizard - ModernImportWizard
- [ ] http://localhost:5173/data-import/history - ModernImportHistory

## Total Routes: 35

---

## If you find 404 errors, please specify:
1. Which URL gives 404
2. What error message appears
3. What you clicked to get there

This will help me fix the exact problem.
