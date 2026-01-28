/**
 * Enhanced Toast Notification System
 *
 * SALESFORCE: Basic alerts, no context, disappear too fast, can't undo
 * LEADLAB: Rich toasts with actions, progress bars, undo buttons, stack management
 *
 * This is how notifications should work!
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface EnhancedToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // 0 = persistent
  action?: ToastAction;
  onClose?: () => void;
  progress?: number; // 0-100 for progress bar
}

interface ToastStore {
  toasts: EnhancedToastItem[];
  addToast: (toast: Omit<EnhancedToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<EnhancedToastItem>) => void;
  clearAll: () => void;
}

// Global toast store
let toastStore: ToastStore = {
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
  updateToast: () => {},
  clearAll: () => {},
};

// Toast hook
export function useEnhancedToast() {
  const [toasts, setToasts] = useState<EnhancedToastItem[]>([]);

  const addToast = useCallback((toast: Omit<EnhancedToastItem, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: EnhancedToastItem = {
      ...toast,
      id,
      duration: toast.duration !== undefined ? toast.duration : 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (if not persistent)
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<EnhancedToastItem>) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Update global store
  useEffect(() => {
    toastStore = { toasts, addToast, removeToast, updateToast, clearAll };
  }, [toasts, addToast, removeToast, updateToast, clearAll]);

  return { toasts, addToast, removeToast, updateToast, clearAll };
}

// Standalone toast functions (for use outside React components)
export const enhancedToast = {
  success: (message: string, options?: Partial<Omit<EnhancedToastItem, 'id' | 'type' | 'message'>>) =>
    toastStore.addToast({ type: 'success', message, ...options }),

  error: (message: string, options?: Partial<Omit<EnhancedToastItem, 'id' | 'type' | 'message'>>) =>
    toastStore.addToast({ type: 'error', message, ...options }),

  warning: (message: string, options?: Partial<Omit<EnhancedToastItem, 'id' | 'type' | 'message'>>) =>
    toastStore.addToast({ type: 'warning', message, ...options }),

  info: (message: string, options?: Partial<Omit<EnhancedToastItem, 'id' | 'type' | 'message'>>) =>
    toastStore.addToast({ type: 'info', message, ...options }),

  loading: (message: string, options?: Partial<Omit<EnhancedToastItem, 'id' | 'type' | 'message'>>) =>
    toastStore.addToast({ type: 'loading', message, duration: 0, ...options }),

  // Promise-based toast
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    const loadingId = toastStore.addToast({
      type: 'loading',
      message: messages.loading,
      duration: 0,
    });

    try {
      const data = await promise;
      toastStore.removeToast(loadingId);
      toastStore.addToast({
        type: 'success',
        message: typeof messages.success === 'function' ? messages.success(data) : messages.success,
      });
      return data;
    } catch (error) {
      toastStore.removeToast(loadingId);
      toastStore.addToast({
        type: 'error',
        message:
          typeof messages.error === 'function'
            ? messages.error(error as Error)
            : messages.error,
      });
      throw error;
    }
  },

  // Update existing toast
  update: (id: string, updates: Partial<EnhancedToastItem>) => {
    toastStore.updateToast(id, updates);
  },

  // Remove toast
  dismiss: (id: string) => {
    toastStore.removeToast(id);
  },

  // Custom toast
  custom: (toast: Omit<EnhancedToastItem, 'id'>) => toastStore.addToast(toast),
};

// Toast icons
const toastIcons: Record<ToastType, any> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

// Toast colors
const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  },
  loading: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
  },
};

// Single toast component
interface ToastItemProps {
  toast: EnhancedToastItem;
  onClose: () => void;
}

function EnhancedToastItemComponent({ toast, onClose }: ToastItemProps) {
  const Icon = toastIcons[toast.type];
  const colors = toastColors[toast.type];

  const handleClose = () => {
    toast.onClose?.();
    onClose();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
      className={cn(
        'w-full max-w-md rounded-lg border shadow-lg overflow-hidden',
        colors.bg,
        colors.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('flex-shrink-0', colors.icon)}>
            <Icon
              className={cn('w-5 h-5', toast.type === 'loading' && 'animate-spin')}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="font-semibold text-gray-900 mb-1">{toast.title}</p>
            )}
            <p className="text-sm text-gray-700">{toast.message}</p>

            {/* Action Button */}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  handleClose();
                }}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        {toast.progress !== undefined && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="bg-blue-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${toast.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Toast container
interface EnhancedToastContainerProps {
  position?: ToastPosition;
  maxToasts?: number;
}

export function EnhancedToastContainer({
  position = 'top-right',
  maxToasts = 5,
}: EnhancedToastContainerProps) {
  const { toasts, removeToast } = useEnhancedToast();

  const positionClasses: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  // Limit displayed toasts
  const displayedToasts = toasts.slice(-maxToasts);

  return (
    <div className={cn('fixed z-50 flex flex-col gap-2', positionClasses[position])}>
      <AnimatePresence mode="popLayout">
        {displayedToasts.map(toast => (
          <EnhancedToastItemComponent
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Undo toast helper
export function undoToast(
  message: string,
  onUndo: () => void,
  duration: number = 5000
): string {
  return enhancedToast.custom({
    type: 'info',
    title: 'Action completed',
    message,
    duration,
    action: {
      label: 'Undo',
      onClick: onUndo,
    },
  });
}

// Progress toast helper
export function progressToast(message: string): {
  update: (progress: number) => void;
  complete: (message?: string) => void;
  error: (message?: string) => void;
} {
  let toastId = enhancedToast.loading(message, { progress: 0 });

  return {
    update: (progress: number) => {
      enhancedToast.update(toastId, { progress });
    },
    complete: (successMessage?: string) => {
      enhancedToast.dismiss(toastId);
      if (successMessage) {
        enhancedToast.success(successMessage);
      }
    },
    error: (errorMessage?: string) => {
      enhancedToast.dismiss(toastId);
      if (errorMessage) {
        enhancedToast.error(errorMessage);
      }
    },
  };
}
