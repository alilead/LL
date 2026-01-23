import api from '../axios';

// Types for email-related API requests and responses
export interface EmailAccount {
  id: number;
  email: string;
  display_name: string;
  provider_type: string;
  sync_status: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAccountCreate {
  email: string;
  display_name: string;
  provider_type: string;
  imap_host?: string;
  imap_port?: number;
  imap_use_ssl?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_use_ssl?: boolean;
  password: string;
}

export interface Email {
  id: number;
  subject: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  body_text?: string;
  body_html?: string;
  direction: 'incoming' | 'outgoing';
  status: 'unread' | 'read' | 'replied' | 'forwarded' | 'archived';
  sent_date: string;
  received_date?: string;
  is_important: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  email_account_id: number;
  lead_id?: number;
  deal_id?: number;
  created_at: string;
  updated_at: string;
}

export interface SendEmailRequest {
  account_id: number;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  template_id?: number;
  lead_id?: number;
  deal_id?: number;
}

export interface EmailListParams {
  skip?: number;
  limit?: number;
  account_id?: number;
  unread_only?: boolean;
  search?: string;
  status?: string;
  direction?: string;
}

export interface EmailSuggestion {
  id: number;
  type: 'task' | 'event' | 'follow_up';
  suggestion: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// Email Accounts API
export const emailAccountsAPI = {
  // Get all email accounts for current user
  getAccounts: async (): Promise<EmailAccount[]> => {
    const response = await api.get('/email/accounts');
    return response.data;
  },

  // Create new email account
  createAccount: async (accountData: EmailAccountCreate): Promise<EmailAccount> => {
    const response = await api.post('/email/accounts', accountData);
    return response.data;
  },

  // Delete email account
  deleteAccount: async (accountId: number): Promise<void> => {
    await api.delete(`/email/accounts/${accountId}`);
  },

  // Sync email account
  syncAccount: async (accountId: number): Promise<{ message: string }> => {
    const response = await api.post(`/email/accounts/${accountId}/sync`);
    return response.data;
  },

  // Test email account connection
  testConnection: async (accountData: EmailAccountCreate): Promise<{ status: string; message: string }> => {
    const response = await api.post('/email/accounts/test-connection', accountData);
    return response.data;
  },

  // Calendar sync methods
  syncCalendar: async (accountId: number) => {
    const response = await api.post(`/email/accounts/${accountId}/sync-calendar`);
    return response.data;
  },

  updateCalendarSettings: async (accountId: number, settings: {
    calendar_sync_enabled?: boolean;
    auto_sync_calendar_events?: boolean;
    calendar_url?: string;
  }) => {
    const response = await api.post(`/email/accounts/${accountId}/calendar-settings`, settings);
    return response.data;
  },

  // OAuth methods for calendar integration
};

// Emails API
export const emailsAPI = {
  // Get emails with filtering
  getEmails: async (params: EmailListParams = {}): Promise<Email[]> => {
    const response = await api.get('/email/emails', { params });
    return response.data;
  },

  // Get single email by ID
  getEmail: async (emailId: number): Promise<Email> => {
    const response = await api.get(`/email/emails/${emailId}`);
    return response.data;
  },

  // Mark email as read
  markAsRead: async (emailId: number): Promise<void> => {
    await api.post(`/email/emails/${emailId}/mark-read`);
  },

  // Mark email as unread
  markAsUnread: async (emailId: number): Promise<void> => {
    await api.post(`/email/emails/${emailId}/mark-unread`);
  },

  // Star/unstar email
  toggleStar: async (emailId: number): Promise<void> => {
    await api.post(`/email/emails/${emailId}/toggle-star`);
  },

  // Archive email
  archiveEmail: async (emailId: number): Promise<void> => {
    await api.post(`/email/emails/${emailId}/archive`);
  },

  // Delete email
  deleteEmail: async (emailId: number): Promise<void> => {
    await api.delete(`/email/emails/${emailId}`);
  },

  // Send email
  sendEmail: async (emailData: SendEmailRequest): Promise<{ message: string; email_id?: number }> => {
    const response = await api.post('/email/send', emailData);
    return response.data;
  },

  // Get email suggestions (AI-powered)
  getEmailSuggestions: async (emailId: number): Promise<EmailSuggestion[]> => {
    const response = await api.get(`/email/emails/${emailId}/suggestions`);
    return response.data;
  },

  // Create event from email
  createEventFromEmail: async (emailId: number, eventData: any): Promise<{ message: string; event_id: number }> => {
    const response = await api.post(`/email/emails/${emailId}/create-event`, eventData);
    return response.data;
  },

  // Create task from email
  createTaskFromEmail: async (emailId: number, taskData: any): Promise<{ message: string; task_id: number }> => {
    const response = await api.post(`/email/emails/${emailId}/create-task`, taskData);
    return response.data;
  },

  // Search emails
  searchEmails: async (query: string, accountId?: number): Promise<Email[]> => {
    const params: any = { search: query };
    if (accountId) {
      params.account_id = accountId;
    }
    const response = await api.get('/email/emails', { params });
    return response.data;
  },

  // Get email thread
  getEmailThread: async (emailId: number): Promise<Email[]> => {
    const response = await api.get(`/email/emails/${emailId}/thread`);
    return response.data;
  }
};

// Email Templates API (if needed)
export const emailTemplatesAPI = {
  // Get all templates
  getTemplates: async (params: { skip?: number; limit?: number; name?: string; is_active?: boolean } = {}): Promise<any[]> => {
    const response = await api.get('/email/templates', { params });
    return response.data;
  },

  // Create template
  createTemplate: async (templateData: any): Promise<any> => {
    const response = await api.post('/email/templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (templateId: number, templateData: any): Promise<any> => {
    const response = await api.put(`/email/templates/${templateId}`, templateData);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (templateId: number): Promise<void> => {
    await api.delete(`/email/templates/${templateId}`);
  }
};

// Export all email-related APIs
export const emailAPI = {
  accounts: emailAccountsAPI,
  emails: emailsAPI,
  templates: emailTemplatesAPI
}; 