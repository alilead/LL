import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className, noPadding = false }: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full h-full',
        !noPadding && 'p-6',
        'animate-in fade-in duration-300',
        className
      )}
    >
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
} 