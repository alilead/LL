import { api } from './api';

export interface Notification {
  id: number;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  user_id: number;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}

export const notificationsAPI = {
  getAll: async (params?: { 
    unread_only?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> => {
    try {
      const response = await api.get<NotificationListResponse>('/notifications', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch notifications');
    }
  },

  getNotifications: async ({ unread_only = false } = {}) => {
    const response = await api.get('/notifications', {
      params: { unread_only }
    });
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.detail || 'Failed to mark notification as read');
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/notifications/read-all');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.detail || 'Failed to mark all notifications as read');
    }
  }
};
