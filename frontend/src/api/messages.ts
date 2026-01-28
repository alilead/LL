import api from './api';

export interface ConversationUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  last_login?: string;
  last_activity?: string;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  organization_id: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_email: string;
}

export interface ConversationSummary {
  user: ConversationUser;
  last_message?: Message;
  unread_count: number;
}

export interface ConversationMessages {
  user: ConversationUser;
  messages: Message[];
  total_count: number;
}

export interface MessageCreate {
  content: string;
  receiver_id: number;
}

export const messagesApi = {
  // Get all conversations for current user
  getConversations: async (): Promise<ConversationSummary[]> => {
    const response = await api.get<ConversationSummary[]>('/messages/conversations');
    return response.data;
  },

  // Get conversation with specific user
  getConversation: async (partnerId: number, skip = 0, limit = 50): Promise<ConversationMessages> => {
    const response = await api.get<ConversationMessages>(`/messages/conversation/${partnerId}?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Send message
  sendMessage: async (messageData: MessageCreate): Promise<Message> => {
    const response = await api.post<Message>('/messages/send', messageData);
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (partnerId: number): Promise<{ marked_count: number }> => {
    const response = await api.post<{ marked_count: number }>(`/messages/mark-read/${partnerId}`);
    return response.data;
  },

  // Get all organization users for starting new conversations
  getOrganizationUsers: async (): Promise<ConversationUser[]> => {
    const response = await api.get<ConversationUser[]>('/messages/users');
    return response.data;
  }
}; 