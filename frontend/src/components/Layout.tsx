import { ReactNode } from 'react';
import { MainLayout } from './layout/MainLayout';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Navigate } from 'react-router-dom';
import ScrollManager from './ScrollManager';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return (
    <>
      <ScrollManager />
      <MainLayout>
        {children || <Outlet />}
      </MainLayout>
    </>
  );
}
