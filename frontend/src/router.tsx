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
import { LeadDetail } from './pages/Leads/LeadDetail'
import { ModernDashboard } from './pages/ModernDashboard'
import { ModernTasks } from './pages/ModernTasks'
import { ModernDeals } from './pages/ModernDeals'
import { ModernAIInsights } from './pages/ModernAIInsights'
import { NotFound } from './pages/NotFound'
import { ProfilePage } from './pages/ProfilePage'
import NewTask from './pages/Tasks/NewTask'
import NewDeal from './pages/Deals/NewDeal'
import { LeadForm } from './pages/Leads/LeadForm'
import { AdminPanel } from './pages/Admin/AdminPanel'
import { Navigate } from 'react-router-dom'
import { LinkedInCallback } from './pages/Linkedin/Callback'
import { ModernMessages } from './pages/ModernMessages'
import { ModernReports } from './pages/ModernReports'
import { ModernCalendar } from './pages/ModernCalendar'
import { ModernCredits } from './pages/ModernCredits'
import { ModernSettings } from './pages/ModernSettings'
import { ModernEmails } from './pages/ModernEmails'
import CustomizationPage from './pages/Customization'
import { OrganizationPage } from './pages/OrganizationPage'
import { TerritoryList } from './pages/Territories'
import { SequenceList } from './pages/EmailSequences'
import { QuoteList, ProductList } from './pages/CPQ'
import { ForecastDashboard } from './pages/Forecasting'
import { WorkflowList } from './pages/Workflows'
import { CallRecordings } from './pages/ConversationIntelligence'
import { ImportWizard, ImportHistory } from './pages/DataImport'

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
            element: <LeadForm />
          },
          {
            path: '/leads/new',
            element: <Navigate to="/leads/form" replace />
          },
          {
            path: '/leads/:id',
            element: <LeadDetail />
          },
          {
            path: '/tasks',
            children: [
              { index: true, element: <ModernTasks /> },
              { path: 'new', element: <NewTask /> }
            ]
          },
          {
            path: '/deals',
            element: <ModernDeals />
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
            element: <CustomizationPage />
          },
          {
            path: '/organization',
            element: <OrganizationPage />
          },
          {
            path: '/territories',
            element: <TerritoryList />
          },
          {
            path: '/email-sequences',
            element: <SequenceList />
          },
          {
            path: '/cpq/quotes',
            element: <QuoteList />
          },
          {
            path: '/cpq/products',
            element: <ProductList />
          },
          {
            path: '/forecasting',
            element: <ForecastDashboard />
          },
          {
            path: '/workflows',
            element: <WorkflowList />
          },
          {
            path: '/conversations',
            element: <CallRecordings />
          },
          {
            path: '/data-import/wizard',
            element: <ImportWizard />
          },
          {
            path: '/data-import/history',
            element: <ImportHistory />
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
