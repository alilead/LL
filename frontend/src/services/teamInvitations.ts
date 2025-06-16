import api from '@/lib/axios';

export interface TeamInvitationCreate {
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'manager' | 'member' | 'viewer';
  message?: string;
}

export interface TeamInvitationUpdate {
  first_name?: string;
  last_name?: string;
  role?: 'manager' | 'member' | 'viewer';
  message?: string;
}

export interface TeamInvitationAccept {
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'manager' | 'member' | 'viewer';
  status: string;
  invitation_token: string;
  organization_id: number;
  invited_by_id: number;
  invited_by_name: string;
  organization_name: string;
  message?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface TeamInvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

export interface TeamInvitationToken {
  invitation: TeamInvitation;
  is_valid: boolean;
  is_expired: boolean;
}

export const teamInvitationsAPI = {
  // Create a new team invitation
  createInvitation: (data: TeamInvitationCreate) =>
    api.post<TeamInvitation>('/team-invitations', data),

  // Get all invitations for the organization
  getInvitations: () =>
    api.get<TeamInvitation[]>('/team-invitations'),

  // Get invitation by token (public endpoint)
  getInvitationByToken: (token: string) =>
    api.get<TeamInvitationToken>(`/team-invitations/token/${token}`),

  // Accept invitation and create user account
  acceptInvitation: (token: string, data: TeamInvitationAccept) =>
    api.post<{ user: any; access_token: string; token_type: string }>(`/team-invitations/accept/${token}`, data),

  // Cancel invitation (admin only)
  cancelInvitation: (invitationId: number) =>
    api.delete(`/team-invitations/${invitationId}`),

  // Resend invitation (admin only)
  resendInvitation: (invitationId: number) =>
    api.post(`/team-invitations/${invitationId}/resend`),

  // Get invitation statistics
  getStats: () =>
    api.get<TeamInvitationStats>('/team-invitations/stats'),
};

export default teamInvitationsAPI; 