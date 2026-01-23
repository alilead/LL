import { createBrowserRouter } from 'react-router-dom';
import { Settings } from '@/pages/Admin/Settings';

export const router = createBrowserRouter([
  {
    path: '/admin/settings',
    element: <Settings />,
  },
]); 