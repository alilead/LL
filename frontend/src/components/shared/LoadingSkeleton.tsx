import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
  className,
  ...props
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700';
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
  const variantStyles = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const styles = cn(
    baseStyles,
    animationStyles[animation],
    variantStyles[variant],
    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={styles}
      style={style}
      {...props}
      role="status"
      aria-label="Loading..."
      data-testid="skeleton"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => {
  return (
    <div 
      className="flex space-x-4 p-4" 
      data-testid="table-row-skeleton"
    >
      {Array(columns)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${Math.floor(Math.random() * 30 + 70)}px` }}
          />
        ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div 
      className="p-4 border rounded-lg shadow-sm space-y-3"
      data-testid="card-skeleton"
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
};
