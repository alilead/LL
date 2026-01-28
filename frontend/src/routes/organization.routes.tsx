import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const OrganizationDashboard = lazy(() => import('@/components/organization/OrganizationDashboard'));
const OrganizationSettings = lazy(() => import('@/components/organization/OrganizationSettings'));
const UserManagement = lazy(() => import('@/components/organization/UserManagement'));

export const organizationRoutes = [
  {
    path: '/organization',
    element: <Navigate to="/organization/dashboard" replace />
  },
  {
    path: '/organization/dashboard',
    element: <OrganizationDashboard />
  },
  {
    path: '/organization/settings',
    element: <OrganizationSettings />
  },
  {
    path: '/organization/users',
    element: <UserManagement />
  }
];
