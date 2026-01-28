import api from '@/lib/axios';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings?: Record<string, any>;
  subscription_plan?: string;
  subscription_status?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreateInput {
  name: string;
  domain?: string;
  settings?: Record<string, any>;
}

export interface OrganizationUpdateInput {
  name?: string;
  domain?: string;
  settings?: Record<string, any>;
  subscription_plan?: string;
  subscription_status?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  permissions?: string[];
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InviteCreateInput {
  email: string;
  role: string;
  permissions?: string[];
}

// Organization API endpoints
export const getOrganization = async (): Promise<Organization> => {
  const response = await api.get('/organizations/current');
  return response.data;
};

export const updateOrganization = async (data: OrganizationUpdateInput): Promise<Organization> => {
  const response = await api.put('/organizations/current', data);
  return response.data;
};

export const getOrganizationMembers = async (): Promise<OrganizationMember[]> => {
  const response = await api.get('/organizations/current/members');
  return response.data;
};

export const inviteMember = async (data: InviteCreateInput): Promise<OrganizationInvite> => {
  const response = await api.post('/organizations/current/invites', data);
  return response.data;
};

export const getInvites = async (): Promise<OrganizationInvite[]> => {
  const response = await api.get('/organizations/current/invites');
  return response.data;
};

export const cancelInvite = async (inviteId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/v1/organizations/current/invites/${inviteId}`);
  return response.data;
};

export const removeMember = async (memberId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/v1/organizations/current/members/${memberId}`);
  return response.data;
};

export const updateMemberRole = async (memberId: string, role: string, permissions?: string[]): Promise<OrganizationMember> => {
  const response = await api.patch(`/api/v1/organizations/current/members/${memberId}`, {
    role,
    permissions
  });
  return response.data;
};

export default {
  getOrganization,
  updateOrganization,
  getOrganizationMembers,
  inviteMember,
  getInvites,
  cancelInvite,
  removeMember,
  updateMemberRole,
};
