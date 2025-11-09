/**
 * Real-time Notifications System
 *
 * SALESFORCE: Email notifications hours later (USELESS!)
 * LEADLAB: Instant in-app notifications with actions! (MODERN!)
 *
 * Never miss important updates!
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  User,
  DollarSign,
  Mail,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { notificationsAPI } from '@/services/api/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type NotificationType =
  | 'lead_assigned'
  | 'deal_won'
  | 'deal_lost'
  | 'task_due'
  | 'email_received'
  | 'meeting_reminder'
  | 'mention'
  | 'milestone'
  | 'alert'
  | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  avatarUrl?: string;
  metadata?: any;
}

const notificationIcons: Record<NotificationType, any> = {
  lead_assigned: User,
  deal_won: DollarSign,
  deal_lost: TrendingUp,
  task_due: CheckCircle,
  email_received: Mail,
  meeting_reminder: Calendar,
  mention: MessageSquare,
  milestone: TrendingUp,
  alert: AlertCircle,
  info: Info,
};

const notificationColors: Record<NotificationType, string> = {
  lead_assigned: 'bg-blue-50 text-blue-600',
  deal_won: 'bg-green-50 text-green-600',
  deal_lost: 'bg-red-50 text-red-600',
  task_due: 'bg-orange-50 text-orange-600',
  email_received: 'bg-purple-50 text-purple-600',
  meeting_reminder: 'bg-yellow-50 text-yellow-600',
  mention: 'bg-pink-50 text-pink-600',
  milestone: 'bg-indigo-50 text-indigo-600',
  alert: 'bg-red-50 text-red-600',
  info: 'bg-gray-50 text-gray-600',
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  // Fetch notifications from backend
  const { data: backendNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll({ limit: 50 }),
    refetchInterval: 30000, // Refetch every 30 seconds (simulates real-time)
  });

  // Map backend notifications to frontend format
  const notifications: Notification[] = backendNotifications.map((n: any) => ({
    id: String(n.id),
    type: (n.type || 'info') as NotificationType,
    title: n.title,
    message: n.message,
    timestamp: new Date(n.created_at),
    read: n.is_read,
    actionUrl: n.link || undefined,
    actionLabel: n.link ? 'View Details' : undefined,
    metadata: n,
  }));

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // For now, this is client-side only. In production, you'd POST to backend
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/images/leadlab-logo.png',
      });
    }

    return newNotif.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      markAsReadMutation.mutate(numericId);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback((id: string) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      deleteNotificationMutation.mutate(numericId);
    }
  }, [deleteNotificationMutation]);

  const clearAll = useCallback(() => {
    // Delete all notifications one by one (or implement bulk delete on backend)
    notifications.forEach(n => {
      const numericId = parseInt(n.id, 10);
      if (!isNaN(numericId)) {
        deleteNotificationMutation.mutate(numericId);
      }
    });
  }, [notifications, deleteNotificationMutation]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Notification Bell Component
interface NotificationBellProps {
  notifications: ReturnType<typeof useNotifications>;
  className?: string;
}

export function NotificationBell({ notifications, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notifications.unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {notifications.unreadCount > 0 && (
                    <p className="text-xs text-gray-500">
                      {notifications.unreadCount} unread
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.notifications.length > 0 && (
                    <>
                      <button
                        onClick={notifications.markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={notifications.clearAll}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Bell className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type];

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                            !notification.read && 'bg-blue-50/50'
                          )}
                          onClick={() => {
                            notifications.markAsRead(notification.id);
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'p-2 rounded-lg flex-shrink-0',
                                notificationColors[notification.type]
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm text-gray-900">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                  {formatTime(notification.timestamp)}
                                </p>
                                {notification.actionLabel && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    {notification.actionLabel} →
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notifications.deleteNotification(notification.id);
                              }}
                              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.notifications.length > 0 && (
                <div className="p-3 border-t text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toast notification for new notifications
interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onClick?: () => void;
}

export function NotificationToast({
  notification,
  onClose,
  onClick,
}: NotificationToastProps) {
  const Icon = notificationIcons[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="w-80 bg-white rounded-lg shadow-xl border p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg flex-shrink-0',
            notificationColors[notification.type]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          {notification.actionLabel && (
            <p className="text-xs text-blue-600 font-medium mt-2">
              {notification.actionLabel} →
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  leadAssigned: boolean;
  dealWon: boolean;
  dealLost: boolean;
  taskDue: boolean;
  emailReceived: boolean;
  meetingReminder: boolean;
  mentions: boolean;
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('leadlab-notification-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getDefaultPreferences();
      }
    }
    return getDefaultPreferences();
  });

  useEffect(() => {
    localStorage.setItem('leadlab-notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  return {
    preferences,
    updatePreference,
  };
}

function getDefaultPreferences(): NotificationPreferences {
  return {
    email: true,
    push: true,
    inApp: true,
    leadAssigned: true,
    dealWon: true,
    dealLost: true,
    taskDue: true,
    emailReceived: true,
    meetingReminder: true,
    mentions: true,
  };
}
