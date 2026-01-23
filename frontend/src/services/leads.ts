import api from '../lib/axios';

// Backend-Go compatible Lead types
export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  linkedin_url?: string;
  location?: string;
  country?: string;
  website?: string;
  sector?: string;
  source?: string;
  status: string;
  stage_id: string;
  organization_id: string;
  user_id: string;
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LeadCreateInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  linkedin_url?: string;
  location?: string;
  country?: string;
  website?: string;
  sector?: string;
  source?: string;
  stage_id: string;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface LeadUpdateInput extends Partial<LeadCreateInput> {
  status?: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface LeadFilters {
  status?: string;
  stage_id?: string;
  source?: string;
  company?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadStats {
  total: number;
  new: number;
  qualified: number;
  contacted: number;
  converted: number;
}

// Lead API endpoints
export const getLeads = async (filters?: LeadFilters): Promise<LeadListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/leads?${params.toString()}`);
  return response.data;
};

export const getLead = async (id: string): Promise<Lead> => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

export const createLead = async (data: LeadCreateInput): Promise<Lead> => {
  const response = await api.post('/leads', data);
  return response.data;
};

export const updateLead = async (id: string, data: LeadUpdateInput): Promise<Lead> => {
  const response = await api.put(`/leads/${id}`, data);
  return response.data;
};

export const deleteLead = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};

export const getLeadActivities = async (leadId: string): Promise<LeadActivity[]> => {
  const response = await api.get(`/leads/${leadId}/activities`);
  return response.data;
};

export const addLeadActivity = async (leadId: string, activity: {
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<LeadActivity> => {
  const response = await api.post(`/leads/${leadId}/activities`, activity);
  return response.data;
};

export const bulkUpdateLeads = async (leadIds: string[], updates: LeadUpdateInput): Promise<{ message: string; updated_count: number }> => {
  const response = await api.patch('/leads/bulk', {
    lead_ids: leadIds,
    updates
  });
  return response.data;
};

export const importLeads = async (file: File): Promise<{ message: string; imported_count: number; errors?: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/leads/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const exportLeads = async (filters?: LeadFilters): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/leads/export?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getLeadStats = async (): Promise<LeadStats> => {
  const response = await api.get('/leads/stats');
  return response.data;
};

export const leadsAPI = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadActivities,
  addLeadActivity,
  bulkUpdateLeads,
  importLeads,
  exportLeads,
  getLeadStats,
};

export default leadsAPI;
