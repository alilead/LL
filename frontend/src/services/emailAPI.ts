import api from './axios';

export interface EmailAccount {
  id: number;
  email: string;
  display_name: string;
  provider_type: string;
  is_active: boolean;
  calendar_sync_enabled: boolean;
  last_sync_at: string;
  created_at: string;
}

export interface EmailMessage {
  id: number;
  subject: string;
  from_address: string;
  from_name: string;
  to_address: string;
  body_text: string;
  body_html: string;
  received_date: string;
  sent_date: string;
  is_read: boolean;
  is_important: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  folder_name: string;
  email_account_id: number;
  organization_id: number;
}

export interface EmailFolder {
  name: string;
  count: number;
  unread: number;
}

export interface EmailAttachment {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  download_url: string;
}

export interface SendEmailData {
  account_id: number;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: File[];
}

export interface CreateEmailAccountData {
  email: string;
  password: string;
  provider_type: string;
  imap_server?: string;
  imap_port?: number;
  smtp_server?: string;
  smtp_port?: number;
  display_name?: string;
}

export interface EmailAccountSettings {
  calendar_sync_enabled: boolean;
  auto_sync_calendar_events: boolean;
  calendar_url?: string;
}

const emailAPI = {
  // Email Account Management
  async getAccounts(): Promise<EmailAccount[]> {
    const response = await api.get(`/email/accounts`);
    return response.data;
  },

  async createAccount(data: CreateEmailAccountData): Promise<EmailAccount> {
    const response = await api.post(`/email/accounts`, data);
    return response.data;
  },

  async updateAccount(id: number, data: Partial<CreateEmailAccountData>): Promise<EmailAccount> {
    const response = await api.put(`/email/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: number): Promise<void> {
    await api.delete(`/email/accounts/${id}`);
  },

  async testConnection(data: CreateEmailAccountData): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/email/accounts/test`, data);
    return response.data;
  },

  // Email Management
  async getEmails(accountId: number, folder: string = 'inbox', page: number = 1, limit: number = 50): Promise<{
    emails: EmailMessage[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    const response = await api.get(`/email/emails`, {
      params: { account_id: accountId, folder, page, limit }
    });
    return response.data;
  },

  async getEmailById(emailId: number): Promise<EmailMessage> {
    const response = await api.get(`/email/emails/${emailId}`);
    return response.data;
  },

  async sendEmail(data: SendEmailData): Promise<EmailMessage> {
    const formData = new FormData();
    formData.append('account_id', data.account_id.toString());
    formData.append('to', data.to);
    formData.append('subject', data.subject);
    formData.append('body', data.body);
    
    if (data.cc) formData.append('cc', data.cc);
    if (data.bcc) formData.append('bcc', data.bcc);
    
    if (data.attachments) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post(`/email/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async markAsRead(emailId: number): Promise<void> {
    await api.post(`/email/emails/${emailId}/mark-read`);
  },

  async markAsUnread(emailId: number): Promise<void> {
    // Backend'te unread endpoint'i yoksa mark-read'i false ile çağırmalıyız
    await api.post(`/email/emails/${emailId}/mark-read`, { is_read: false });
  },

  async toggleStar(emailId: number): Promise<void> {
    // Backend'te star endpoint'i tanımlı değil, bu endpoint'i backend'te eklemek gerekiyor
    await api.patch(`/email/emails/${emailId}/star`);
  },

  async deleteEmail(emailId: number): Promise<void> {
    await api.delete(`/email/emails/${emailId}`);
  },

  async moveToFolder(emailId: number, folder: string): Promise<void> {
    await api.patch(`/email/emails/${emailId}/move`, {
      folder
    });
  },

  // Folders - Backend'te bu endpoint'ler yok, geçici olarak boş array döndür
  async getFolders(accountId: number): Promise<EmailFolder[]> {
    // Backend'te folders endpoint'i yok, geçici çözüm
    return [
      { name: 'inbox', count: 0, unread: 0 },
      { name: 'sent', count: 0, unread: 0 },
      { name: 'draft', count: 0, unread: 0 },
      { name: 'trash', count: 0, unread: 0 }
    ];
  },

  // Attachments - Backend'te bu endpoint'ler yok
  async getAttachments(accountId: number, emailId: number): Promise<EmailAttachment[]> {
    // Backend'te attachments endpoint'i yok, geçici çözüm
    return [];
  },

  async downloadAttachment(accountId: number, emailId: number, attachmentId: number): Promise<string> {
    // Backend'te download endpoint'i yok, geçici çözüm
    return `/emails/${emailId}/attachments/${attachmentId}/download`;
  },

  // Calendar Integration
  async syncCalendar(accountId: number): Promise<void> {
    await api.post(`/email/accounts/${accountId}/sync-calendar`);
  },

  async getCalendarSettings(accountId: number): Promise<EmailAccountSettings> {
    // Backend'te get calendar settings endpoint'i yok, geçici çözüm
    return {
      calendar_sync_enabled: false,
      auto_sync_calendar_events: false
    };
  },

  async updateCalendarSettings(accountId: number, settings: EmailAccountSettings): Promise<EmailAccountSettings> {
    const response = await api.post(`/email/accounts/${accountId}/calendar-settings`, settings);
    return response.data;
  },

  // Search - Backend'te search endpoint'i yok
  async searchEmails(accountId: number, query: string, folder?: string): Promise<EmailMessage[]> {
    // Backend'te search endpoint'i yok, geçici olarak normal email listesini döndür
    const response = await api.get(`/email/emails`, {
      params: { account_id: accountId, limit: 100 }
    });
    // Frontend'te filtreleme yapabiliriz
    return response.data.filter((email: EmailMessage) => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.body_text?.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Real-time updates
  subscribeToEmailUpdates(accountId: number, callback: (email: EmailMessage) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll implement polling in the component
    return () => {}; // Return unsubscribe function
  }
};

export default emailAPI;