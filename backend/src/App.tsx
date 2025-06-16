import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import PrivateRoute from './components/PrivateRoute';
import { LinkedInCallback } from './pages/Linkedin/Callback'
import ScrollManager from './components/ScrollManager';

// Lazy loaded components
// Auth & Public Pages
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const SignIn = lazy(() => import('./pages/SignIn').then(module => ({ default: module.SignIn })));
const SignUp = lazy(() => import('./pages/SignUp').then(module => ({ default: module.SignUp })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Legal = lazy(() => import('./pages/Legal').then(module => ({ default: module.Legal })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));

// Layout Components
const Layout = lazy(() => import('./components/Layout').then(module => ({ default: module.Layout })));

// Admin Pages
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

// Main Feature Pages
const DashboardPage = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(module => ({ default: module.SettingsPage })));

// Leads Management
const LeadsPage = lazy(() => import('./pages/Leads').then(module => ({ default: module.LeadsPage })));
const LeadDetailPage = lazy(() => import('./pages/Leads/LeadDetail').then(module => ({ default: module.LeadDetail })));
const LeadFormPage = lazy(() => import('./pages/Leads/LeadForm').then(module => ({ default: module.LeadForm })));

// Tasks Management
const TasksPage = lazy(() => import('./pages/Tasks').then(module => ({ default: module.TasksPage })));
const NewTaskPage = lazy(() => import('./pages/Tasks/NewTask').then(module => ({ default: module.NewTaskPage })));

// Calendar Management
const CalendarPage = lazy(() => import('./pages/Calendar').then(module => ({ default: module.CalendarPage })));
const NewEventPage = lazy(() => import('./pages/Calendar/NewEvent').then(module => ({ default: module.NewEventPage })));

// Deals Management
const DealsPage = lazy(() => import('./pages/Deals').then(module => ({ default: module.DealsPage })));
const NewDealPage = lazy(() => import('./pages/Deals/NewDeal').then(module => ({ default: module.NewDealPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <ScrollManager />
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/linkedin/callback" element={<LinkedInCallback />} />

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* Admin Routes */}
                  <Route path="/admin/*" element={<AdminPanel />} />

                  {/* Main Routes */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Leads Routes */}
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/leads/new" element={<LeadFormPage />} />
                  <Route path="/leads/edit/:id" element={<LeadFormPage />} />
                  <Route path="/leads/:id" element={<LeadDetailPage />} />

                  {/* Tasks Routes */}
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/new" element={<NewTaskPage />} />

                  {/* Calendar Routes */}
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/calendar/new" element={<NewEventPage />} />

                  {/* Deals Routes */}
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/deals/new" element={<NewDealPage />} />
                </Route>
              </Route>

              {/* Fallback Route */}
              <Route
                path="*"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/signin" replace />
                  )
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;