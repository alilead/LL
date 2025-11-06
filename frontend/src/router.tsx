import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Legal } from './pages/Legal'
import { Contact } from './pages/Contact'
import { ModernLayout } from './components/ModernLayout'
import PrivateRoute from './components/PrivateRoute'
import { AdminRoute } from './components/AdminRoute'
import { ModernLeads } from './pages/ModernLeads'
import { ModernLeadDetail } from './pages/ModernLeadDetail'
import { ModernLeadForm } from './pages/ModernLeadForm'
import { ModernDashboard } from './pages/ModernDashboard'
import { ModernTasks } from './pages/ModernTasks'
import { ModernNewTask } from './pages/ModernNewTask'
import { ModernDeals } from './pages/ModernDeals'
import { ModernNewDeal } from './pages/ModernNewDeal'
import { ModernAIInsights } from './pages/ModernAIInsights'
import { NotFound } from './pages/NotFound'
import { ModernProfile } from './pages/ModernProfile'
import { AdminPanel } from './pages/Admin/AdminPanel'
import { Navigate } from 'react-router-dom'
import { LinkedInCallback } from './pages/Linkedin/Callback'
import { ModernMessages } from './pages/ModernMessages'
import { ModernReports } from './pages/ModernReports'
import { ModernCalendar } from './pages/ModernCalendar'
import { ModernCredits } from './pages/ModernCredits'
import { ModernSettings } from './pages/ModernSettings'
import { ModernEmails } from './pages/ModernEmails'
import { ModernCustomization } from './pages/ModernCustomization'
import { ModernOrganization } from './pages/ModernOrganization'
import { ModernTerritories } from './pages/ModernTerritories'
import { ModernEmailSequences } from './pages/ModernEmailSequences'
import { ModernQuoteList, ModernProductList } from './pages/ModernCPQ'
import { ModernForecasting } from './pages/ModernForecasting'
import { ModernWorkflows } from './pages/ModernWorkflows'
import { ModernConversations } from './pages/ModernConversations'
import { ModernImportWizard, ModernImportHistory } from './pages/ModernDataImport'

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
        element: <ModernLayout />,
        children: [
          {
            path: '/dashboard',
            element: <ModernDashboard />
          },
          {
            path: '/admin',
            element: <AdminRoute><AdminPanel /></AdminRoute>
          },
          {
            path: '/leads',
            element: <ModernLeads />
          },
          {
            path: '/leads/form',
            element: <ModernLeadForm />
          },
          {
            path: '/leads/new',
            element: <Navigate to="/leads/form" replace />
          },
          {
            path: '/leads/:id',
            element: <ModernLeadDetail />
          },
          {
            path: '/tasks',
            children: [
              { index: true, element: <ModernTasks /> },
              { path: 'new', element: <ModernNewTask /> }
            ]
          },
          {
            path: '/deals',
            element: <ModernDeals />
          },
          {
            path: '/deals/new',
            element: <ModernNewDeal />
          },
          {
            path: '/profile',
            element: <ModernProfile />
          },
          {
            path: '/messages',
            element: <ModernMessages />
          },
          {
            path: '/reports',
            element: <ModernReports />
          },
          {
            path: '/calendar',
            element: <ModernCalendar />
          },
          {
            path: '/ai-insights',
            element: <ModernAIInsights />
          },
          {
            path: '/credits',
            element: <ModernCredits />
          },
          {
            path: '/settings',
            element: <ModernSettings />
          },
          {
            path: '/emails',
            element: <ModernEmails />
          },
          {
            path: '/customization',
            element: <ModernCustomization />
          },
          {
            path: '/organization',
            element: <ModernOrganization />
          },
          {
            path: '/territories',
            element: <ModernTerritories />
          },
          {
            path: '/email-sequences',
            element: <ModernEmailSequences />
          },
          {
            path: '/cpq/quotes',
            element: <ModernQuoteList />
          },
          {
            path: '/cpq/products',
            element: <ModernProductList />
          },
          {
            path: '/forecasting',
            element: <ModernForecasting />
          },
          {
            path: '/workflows',
            element: <ModernWorkflows />
          },
          {
            path: '/conversations',
            element: <ModernConversations />
          },
          {
            path: '/data-import/wizard',
            element: <ModernImportWizard />
          },
          {
            path: '/data-import/history',
            element: <ModernImportHistory />
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
