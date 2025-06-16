import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Legal } from './pages/Legal'
import { Contact } from './pages/Contact'
import { Layout } from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import { AdminRoute } from './components/AdminRoute'
import { LeadsPage } from './pages/Leads'
import { LeadDetail } from './pages/Leads/LeadDetail'
import { DashboardPage } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'
import { ProfilePage } from './pages/ProfilePage'
import { TasksPage } from './pages/Tasks'
import { DealsPage } from './pages/Deals'
import NewTask from './pages/Tasks/NewTask'
import NewDeal from './pages/Deals/NewDeal'
import { LeadForm } from './pages/Leads/LeadForm'
import { AdminPanel } from './pages/Admin/AdminPanel'
import { Navigate } from 'react-router-dom'
import { LinkedInCallback } from './pages/Linkedin/Callback'
import { MessagesPage } from './pages/Messages'
import { ReportsPage } from './pages/Reports'
import { CalendarPage } from './pages/Calendar'
import { AIInsightsPage } from './pages/AIInsights'
import { CreditsPage } from './pages/Credits'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/legal',
    element: <Legal />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />
          },
          {
            path: '/admin',
            element: <AdminRoute><AdminPanel /></AdminRoute>
          },
          {
            path: '/leads',
            children: [
              { index: true, element: <LeadsPage /> },
              { path: 'form', element: <LeadForm /> },
              { path: 'new', element: <Navigate to="/leads/form" replace /> },
              { path: ':id', element: <LeadDetail /> },
            ],
          },
          {
            path: '/tasks',
            children: [
              { index: true, element: <TasksPage /> },
              { path: 'new', element: <NewTask /> }
            ]
          },
          {
            path: '/deals',
            element: <DealsPage />
          },
          {
            path: '/deals/new',
            element: <NewDeal />
          },
          {
            path: '/profile',
            element: <ProfilePage />
          },
          {
            path: '/messages',
            element: <MessagesPage />
          },
          {
            path: '/reports',
            element: <ReportsPage />
          },
          {
            path: '/calendar',
            element: <CalendarPage />
          },
          {
            path: '/ai-insights',
            element: <AIInsightsPage />
          },
          {
            path: '/credits',
            element: <CreditsPage />
          }
        ]
      }
    ]
  },
  {
    path: '/linkedin/callback',
    element: <LinkedInCallback />
  },
  {
    path: '*',
    element: <NotFound />,
  }
], {
  future: {
    v7_normalizeFormMethod: true,
  },
  basename: '/'
});
