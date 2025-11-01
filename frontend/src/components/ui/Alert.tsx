import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const alertVariants = {
  default: {
    container: 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
    icon: 'text-gray-600 dark:text-gray-400',
    IconComponent: Info
  },
  success: {
    container: 'border-green-200 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-900/20 dark:text-green-100',
    icon: 'text-green-600 dark:text-green-400',
    IconComponent: CheckCircle
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400',
    IconComponent: AlertCircle
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/20 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    IconComponent: XCircle
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    IconComponent: Info
  }
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, description, dismissible = false, onDismiss, children, ...props }, ref) => {
    const variantStyles = alertVariants[variant];
    const { IconComponent } = variantStyles;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-lg border p-4',
          variantStyles.container,
          className
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          <IconComponent 
            className={cn('h-5 w-5 mt-0.5 flex-shrink-0', variantStyles.icon)} 
          />
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-medium mb-1">
                {title}
              </h3>
            )}
            
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
            
            {children && (
              <div className={title || description ? 'mt-2' : ''}>
                {children}
              </div>
            )}
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                variantStyles.icon
              )}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

// Alert Title component
const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-sm font-medium mb-1', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

export { Alert, AlertDescription, AlertTitle };