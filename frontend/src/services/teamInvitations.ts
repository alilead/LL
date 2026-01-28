import api from '@/lib/axios';

// Backend-Go compatible TeamInvitation types
export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationCreateInput {
  email: string;
  role: string;
}

export interface InvitationListResponse {
  invitations: TeamInvitation[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface InvitationFilters {
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface InvitationAcceptInput {
  token: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Team Invitation API endpoints
export const getInvitations = async (filters?: InvitationFilters): Promise<InvitationListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/team-invitations?${params.toString()}`);
  return response.data;
};

export const getInvitation = async (id: string): Promise<TeamInvitation> => {
  const response = await api.get(`/team-invitations/${id}`);
  return response.data;
};

export const createInvitation = async (data: InvitationCreateInput): Promise<TeamInvitation> => {
  const response = await api.post('/team-invitations', data);
  return response.data;
};

export const resendInvitation = async (id: string): Promise<{ message: string }> => {
  const response = await api.post(`/team-invitations/${id}/resend`);
  return response.data;
};

export const cancelInvitation = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/team-invitations/${id}`);
  return response.data;
};

export const acceptInvitation = async (data: InvitationAcceptInput): Promise<{ message: string; user: any }> => {
  const response = await api.post('/team-invitations/accept', data);
  return response.data;
};

export const declineInvitation = async (token: string): Promise<{ message: string }> => {
  const response = await api.post('/team-invitations/decline', { token });
  return response.data;
};

export const validateInvitation = async (token: string): Promise<TeamInvitation> => {
  const response = await api.get(`/team-invitations/validate/${token}`);
  return response.data;
};

// teamInvitationsAPI export'u ekleniyor
export const teamInvitationsAPI = {
  getAll: async (filters?: InvitationFilters): Promise<InvitationListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/team-invitations?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<TeamInvitation> => {
    const response = await api.get(`/team-invitations/${id}`);
    return response.data;
  },

  create: async (data: InvitationCreateInput): Promise<TeamInvitation> => {
    const response = await api.post('/team-invitations', data);
    return response.data;
  },

  resend: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/team-invitations/${id}/resend`);
    return response.data;
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/team-invitations/${id}`);
    return response.data;
  },

  accept: async (data: InvitationAcceptInput): Promise<{ message: string; user: any }> => {
    const response = await api.post('/team-invitations/accept', data);
    return response.data;
  },

  decline: async (token: string): Promise<{ message: string }> => {
    const response = await api.post('/team-invitations/decline', { token });
    return response.data;
  },

  validate: async (token: string): Promise<TeamInvitation> => {
    const response = await api.get(`/team-invitations/validate/${token}`);
    return response.data;
  }
};

export default {
  getInvitations,
  getInvitation,
  createInvitation,
  resendInvitation,
  cancelInvitation,
  acceptInvitation,
  declineInvitation,
  validateInvitation,
};