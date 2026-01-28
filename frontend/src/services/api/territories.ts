/**
 * Territory Management API Service
 */

import api from '@/lib/axios';

export interface Territory {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  parent_id?: number;
  path?: string;
  level: number;
  is_active: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  full_path: string;
  children_count: number;
  members_count: number;
  children?: Territory[];
  members?: TerritoryMember[];
}

export interface TerritoryMember {
  id: number;
  territory_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TerritoryRule {
  id: number;
  territory_id: number;
  rule_type: string;
  conditions: Record<string, any>;
  priority: number;
  is_active: boolean;
  auto_assign: boolean;
}

export interface TerritoryQuota {
  id: number;
  territory_id: number;
  year: number;
  quarter?: number;
  quota_amount: number;
  actual_amount: number;
  currency: string;
  attainment_percent: number;
}

export interface CreateTerritoryRequest {
  name: string;
  description?: string;
  parent_id?: number;
}

export interface UpdateTerritoryRequest {
  name?: string;
  description?: string;
  parent_id?: number;
  is_active?: boolean;
}

export const territoriesAPI = {
  // Get all territories
  getAll: async (): Promise<Territory[]> => {
    const response = await api.get('/territories');
    return response.data;
  },

  // Get territory hierarchy
  getHierarchy: async (): Promise<Territory[]> => {
    const response = await api.get('/territories/hierarchy');
    return response.data;
  },

  // Get territory by ID
  getById: async (id: number): Promise<Territory> => {
    const response = await api.get(`/territories/${id}`);
    return response.data;
  },

  // Create territory
  create: async (data: CreateTerritoryRequest): Promise<Territory> => {
    const response = await api.post('/territories', data);
    return response.data;
  },

  // Update territory
  update: async (id: number, data: UpdateTerritoryRequest): Promise<Territory> => {
    const response = await api.put(`/territories/${id}`, data);
    return response.data;
  },

  // Delete territory
  delete: async (id: number): Promise<void> => {
    await api.delete(`/territories/${id}`);
  },

  // Get territory members
  getMembers: async (territoryId: number): Promise<TerritoryMember[]> => {
    const response = await api.get(`/territories/${territoryId}/members`);
    return response.data;
  },

  // Add member to territory
  addMember: async (territoryId: number, userId: number, role: string): Promise<TerritoryMember> => {
    const response = await api.post(`/territories/${territoryId}/members`, {
      user_id: userId,
      role
    });
    return response.data;
  },

  // Remove member from territory
  removeMember: async (territoryId: number, memberId: number): Promise<void> => {
    await api.delete(`/territories/${territoryId}/members/${memberId}`);
  },

  // Get territory rules
  getRules: async (territoryId: number): Promise<TerritoryRule[]> => {
    const response = await api.get(`/territories/${territoryId}/rules`);
    return response.data;
  },

  // Create territory rule
  createRule: async (territoryId: number, rule: Partial<TerritoryRule>): Promise<TerritoryRule> => {
    const response = await api.post(`/territories/${territoryId}/rules`, rule);
    return response.data;
  },

  // Get territory quotas
  getQuotas: async (territoryId: number): Promise<TerritoryQuota[]> => {
    const response = await api.get(`/territories/${territoryId}/quotas`);
    return response.data;
  },

  // Set territory quota
  setQuota: async (territoryId: number, year: number, quarter: number | null, amount: number): Promise<TerritoryQuota> => {
    const response = await api.post(`/territories/${territoryId}/quotas`, {
      year,
      quarter,
      quota_amount: amount
    });
    return response.data;
  },

  // Get territory statistics
  getStatistics: async (territoryId: number): Promise<any> => {
    const response = await api.get(`/territories/${territoryId}/statistics`);
    return response.data;
  }
};
