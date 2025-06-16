import { ReactNode } from 'react';
import { Header } from './layout/Header';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-white">
      <Header />
      <main 
        className={cn(
          "h-[calc(100vh-80px)] overflow-hidden",
          "transition-all duration-200 ease-in-out",
          className
        )}
      >
        <div className="h-full overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
