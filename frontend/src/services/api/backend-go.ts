import api from '../../api/api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  UserProfile,
  Lead,
  Deal,
  Task,
  Notification,
  Event,
  Activity,
  Note,
  FileUpload,
  EmailTemplate,
  EmailSend,
  CreditBalance,
  CreditTransaction,
  AdminStats,
  SystemHealth,
  ApiResponse,
  PaginatedResponse,
  QueryParams
} from '../../types/backend-go';

// Backend-Go API Integration Service
// This service provides a complete interface to the backend-go API endpoints

// ============================================================================
// AUTH SERVICE
// ============================================================================
export const authAPI = {
  // Authentication endpoints
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
  
  register: (userData: RegisterData) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', userData),
  
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refresh_token: refreshToken }),
  
  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password }),
  
  verifyEmail: (token: string) =>
    api.post<ApiResponse<null>>('/auth/verify-email', { token }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<null>>('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
};

// ============================================================================
// USER SERVICE
// ============================================================================
export const userAPI = {
  // User management endpoints
  getProfile: () => api.get<ApiResponse<UserProfile>>('/users/profile'),
  
  updateProfile: (userData: Partial<UserProfile>) => api.put<ApiResponse<UserProfile>>('/users/profile', userData),
  
  getUsers: (params?: QueryParams) => api.get<PaginatedResponse<User>>('/users', { params }),
  
  getUserById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  
  createUser: (userData: Partial<User>) => api.post<ApiResponse<User>>('/users', userData),
  
  updateUser: (id: string, userData: Partial<User>) => api.put<ApiResponse<User>>(`/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}`),
  
  getUserSettings: () => api.get<ApiResponse<any>>('/users/settings'),
  
  updateUserSettings: (settings: any) => api.put<ApiResponse<any>>('/users/settings', settings),
};

// ============================================================================
// LEAD SERVICE
// ============================================================================
export const leadAPI = {
  // Lead management endpoints
  getLeads: (params?: QueryParams) => api.get<PaginatedResponse<Lead>>('/leads', { params }),
  
  getLeadById: (id: string) => api.get<ApiResponse<Lead>>(`/leads/${id}`),
  
  createLead: (leadData: Partial<Lead>) => api.post<ApiResponse<Lead>>('/leads', leadData),
  
  updateLead: (id: string, leadData: Partial<Lead>) => api.put<ApiResponse<Lead>>(`/leads/${id}`, leadData),
  
  deleteLead: (id: string) => api.delete<ApiResponse<null>>(`/leads/${id}`),
  
  getLeadActivities: (id: string) => api.get<PaginatedResponse<Activity>>(`/leads/${id}/activities`),
  
  getLeadNotes: (id: string) => api.get<PaginatedResponse<Note>>(`/leads/${id}/notes`),
  
  assignLead: (id: string, userId: string) => api.post<ApiResponse<Lead>>(`/leads/${id}/assign`, { user_id: userId }),
  
  updateLeadStatus: (id: string, status: string) => api.patch<ApiResponse<Lead>>(`/leads/${id}/status`, { status }),
  
  bulkUpdateLeads: (leadIds: string[], updates: Partial<Lead>) =>
    api.patch<ApiResponse<Lead[]>>('/leads/bulk', { lead_ids: leadIds, updates }),
  
  importLeads: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number; errors: string[] }>>('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  exportLeads: (params?: QueryParams) => api.get('/leads/export', { params, responseType: 'blob' }),
};

// ============================================================================
// DEAL SERVICE
// ============================================================================
export const dealAPI = {
  // Deal management endpoints
  getDeals: (params?: QueryParams) => api.get<PaginatedResponse<Deal>>('/deals', { params }),
  
  getDealById: (id: string) => api.get<ApiResponse<Deal>>(`/deals/${id}`),
  
  createDeal: (dealData: Partial<Deal>) => api.post<ApiResponse<Deal>>('/deals', dealData),
  
  updateDeal: (id: string, dealData: Partial<Deal>) => api.put<ApiResponse<Deal>>(`/deals/${id}`, dealData),
  
  deleteDeal: (id: string) => api.delete<ApiResponse<null>>(`/deals/${id}`),
  
  getDealActivities: (id: string) => api.get<PaginatedResponse<Activity>>(`/deals/${id}/activities`),
  
  updateDealStage: (id: string, stage: string) => api.patch<ApiResponse<Deal>>(`/deals/${id}/stage`, { stage }),
  
  getDealPipeline: () => api.get<ApiResponse<any>>('/deals/pipeline'),
  
  getDealStats: (params?: QueryParams) => api.get<ApiResponse<any>>('/deals/stats', { params }),
};

// ============================================================================
// TASK SERVICE
// ============================================================================
export const taskAPI = {
  // Task management endpoints
  getTasks: (params?: any) => api.get('/tasks', { params }),
  
  getTaskById: (id: string) => api.get(`/tasks/${id}`),
  
  createTask: (taskData: any) => api.post('/tasks', taskData),
  
  updateTask: (id: string, taskData: any) => api.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  
  completeTask: (id: string) => api.patch(`/tasks/${id}/complete`),
  
  assignTask: (id: string, userId: string) => api.post(`/tasks/${id}/assign`, { user_id: userId }),
  
  getTasksByUser: (userId: string) => api.get(`/tasks/user/${userId}`),
  
  getOverdueTasks: () => api.get('/tasks/overdue'),
};

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
export const notificationAPI = {
  // Notification management endpoints
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  
  getNotificationById: (id: string) => api.get(`/notifications/${id}`),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
  
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  updateSettings: (settings: any) => api.put('/notifications/settings', settings),
};

// ============================================================================
// EVENT SERVICE
// ============================================================================
export const eventAPI = {
  // Event management endpoints
  getEvents: (params?: any) => api.get('/events', { params }),
  
  getEventById: (id: string) => api.get(`/events/${id}`),
  
  createEvent: (eventData: any) => api.post('/events', eventData),
  
  updateEvent: (id: string, eventData: any) => api.put(`/events/${id}`, eventData),
  
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  
  getEventsByDate: (date: string) => api.get(`/events/date/${date}`),
  
  getUpcomingEvents: (limit?: number) => api.get('/events/upcoming', { params: { limit } }),
};

// ============================================================================
// ACTIVITY SERVICE
// ============================================================================
export const activityAPI = {
  // Activity tracking endpoints
  getActivities: (params?: any) => api.get('/activities', { params }),
  
  getActivityById: (id: string) => api.get(`/activities/${id}`),
  
  createActivity: (activityData: any) => api.post('/activities', activityData),
  
  getActivitiesByEntity: (entityType: string, entityId: string) =>
    api.get(`/activities/${entityType}/${entityId}`),
  
  getRecentActivities: (limit?: number) => api.get('/activities/recent', { params: { limit } }),
};

// ============================================================================
// NOTE SERVICE
// ============================================================================
export const noteAPI = {
  // Note management endpoints
  getNotes: (params?: any) => api.get('/notes', { params }),
  
  getNoteById: (id: string) => api.get(`/notes/${id}`),
  
  createNote: (noteData: any) => api.post('/notes', noteData),
  
  updateNote: (id: string, noteData: any) => api.put(`/notes/${id}`, noteData),
  
  deleteNote: (id: string) => api.delete(`/notes/${id}`),
  
  getNotesByEntity: (entityType: string, entityId: string) =>
    api.get(`/notes/${entityType}/${entityId}`),
};

// ============================================================================
// FILE SERVICE
// ============================================================================
export const fileAPI = {
  // File management endpoints
  uploadFile: (file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getFiles: (params?: any) => api.get('/files', { params }),
  
  getFileById: (id: string) => api.get(`/files/${id}`),
  
  deleteFile: (id: string) => api.delete(`/files/${id}`),
  
  downloadFile: (id: string) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  
  getFilesByEntity: (entityType: string, entityId: string) =>
    api.get(`/files/${entityType}/${entityId}`),
};

// ============================================================================
// EMAIL SERVICE
// ============================================================================
export const emailAPI = {
  // Email management endpoints
  getEmails: (params?: any) => api.get('/email', { params }),
  
  getEmailById: (id: string) => api.get(`/email/${id}`),
  
  sendEmail: (emailData: any) => api.post('/email/send', emailData),
  
  createTemplate: (templateData: any) => api.post('/email/templates', templateData),
  
  getTemplates: () => api.get('/email/templates'),
  
  updateTemplate: (id: string, templateData: any) => api.put(`/email/templates/${id}`, templateData),
  
  deleteTemplate: (id: string) => api.delete(`/email/templates/${id}`),
  
  getEmailStats: (params?: any) => api.get('/email/stats', { params }),
};

// ============================================================================
// CREDITS SERVICE
// ============================================================================
export const creditAPI = {
  // Credits management endpoints
  getCredits: () => api.get('/credits'),
  
  getCreditHistory: (params?: any) => api.get('/credits/history', { params }),
  
  purchaseCredits: (amount: number, paymentMethod: any) =>
    api.post('/credits/purchase', { amount, payment_method: paymentMethod }),
  
  getCreditPackages: () => api.get('/credits/packages'),
};

// ============================================================================
// ADMIN SERVICE
// ============================================================================
export const adminAPI = {
  // Admin management endpoints
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  
  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),
  
  getSystemLogs: (params?: any) => api.get('/admin/logs', { params }),
  
  getSystemHealth: () => api.get('/admin/health'),
  
  getSystemMetrics: () => api.get('/admin/metrics'),
  
  resetMetrics: () => api.post('/admin/metrics/reset'),
};

// ============================================================================
// HEALTH & SYSTEM
// ============================================================================
export const systemAPI = {
  // System health and monitoring
  getHealth: () => api.get('/health'),
  
  getVersion: () => api.get('/version'),
  
  getMetrics: () => api.get('/metrics'),
};

// ============================================================================
// COMBINED EXPORT
// ============================================================================
export const backendGoAPI = {
  auth: authAPI,
  user: userAPI,
  lead: leadAPI,
  deal: dealAPI,
  task: taskAPI,
  notification: notificationAPI,
  event: eventAPI,
  activity: activityAPI,
  note: noteAPI,
  file: fileAPI,
  email: emailAPI,
  credit: creditAPI,
  admin: adminAPI,
  system: systemAPI,
};

export default backendGoAPI;