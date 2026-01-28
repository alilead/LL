import api from '../axios';
// Lead duplicate tanımını ortadan kaldıralım
// import { Lead, LeadStage, LeadWithStats } from '@/types/leads';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Stage {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  email: string | null;
  telephone: string | null;
  mobile: string | null;
  location: string | null;
  linkedin: string | null;
  country: string | null;
  website: string | null;
  sector: string | null;
  unique_lead_id: string | null;
  time_in_current_role: string | null;
  lab_comments: string | null;
  client_comments: string | null;
  psychometrics: Record<string, any> | null;
  wpi: string | null;
  source: string | null;
  est_wealth_experience: string | null;
  organization_id: number;
  user_id: number;
  stage_id: number;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean;
  visible: boolean;
  full_name: string;
  stage: Stage | null;
  user: User | null;
  creator: User | null;
  tags: Tag[];
  notes: Note[];
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
  job_title?: string;
  location?: string;
  stage_id: number;
}

export interface LeadUpdate extends Partial<LeadCreate> {}

export interface LeadStage {
  id: number;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  organization_id: number;
  is_active: boolean;
}

export interface LeadWithStats extends Lead {
  stats?: {
    total_deals?: number;
    total_value?: number;
    win_rate?: number;
    avg_deal_size?: number;
  };
}

export interface LeadStats {
  total: number;
  new: number;
  qualified: number;
  contacted: number;
  converted: number;
  hot_prospects?: number;
  qualification_rate?: number;
}

interface LeadsParams {
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
  stage_id?: number;
  assigned_to_id?: number;
  tag?: string;
  skip?: number;
  limit?: number;
}

interface LeadQueryParams {
  search?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_desc?: boolean;
}

interface LeadResponse {
  success: boolean;
  message: string;
  data: Lead | Lead[]; 
}

// Geliştirilmiş mock leads verisi
const mockLeads: Lead[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  first_name: `Lead ${i + 1}`,
  last_name: `Sample`,
  email: `lead${i + 1}@example.com`,
  company: `Company ${i + 1}`,
  job_title: `Position ${i + 1}`,
  telephone: null,
  mobile: null,
  location: null,
  linkedin: null, 
  country: null,
  website: null,
  sector: null,
  unique_lead_id: `LEAD-${i + 1000}`,
  time_in_current_role: null,
  lab_comments: null,
  client_comments: null,
  psychometrics: null,
  wpi: null,
  source: null,
  est_wealth_experience: null,
  organization_id: 1,
  user_id: 1,
  stage_id: 1,
  created_by: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_deleted: false,
  visible: true,
  full_name: `Lead ${i + 1} Sample`,
  stage: { id: 1, name: 'New' },
  user: { id: 1, email: 'admin@example.com', first_name: 'Admin', last_name: 'User' },
  creator: { id: 1, email: 'admin@example.com', first_name: 'Admin', last_name: 'User' },
  tags: [],
  notes: []
}));

// Her zaman response verecek şekilde API çağrıları
export const getLeads = async (params: LeadQueryParams = {}): Promise<any> => {
  console.log('Getting leads with params:', params);
  try {
    // URL sonuna / ekleyerek yönlendirmeyi önleyelim
    const response = await api.get('/leads/', { params });
    console.log('Leads API response:', response.data);
    return response.data;
  } catch (error) {
    console.log('Error in getLeads:', error);
    throw error;
  }
};

export const getById = async (id: number): Promise<LeadResponse> => {
  try {
    const response = await api.get(`/leads/${id}/`);
    return response.data;
  } catch (error) {
    console.log('Error in getById:', error);
    throw error;
  }
};

export const create = async (data: Partial<Lead>): Promise<LeadResponse> => {
  try {
    const response = await api.post(`/leads/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

export const update = async (id: number, data: Partial<Lead>): Promise<LeadResponse> => {
  try {
    const response = await api.put(`/leads/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
};

export const remove = async (id: number): Promise<LeadResponse> => {
  try {
    const response = await api.delete(`/leads/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

const updateTags = async (id: number, data: { tags: number[] }) => {
  try {
    const response = await api.patch<Lead>(`/leads/${id}/tags/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating lead tags:', error);
    throw error;
  }
};

// leadsAPI export'u ekleniyor
export const leadsAPI = {
  getAll: async (params?: { 
    search?: string;
    sort_by?: string;
    sort_desc?: boolean;
    stage_id?: number;
    assigned_to_id?: number;
  }): Promise<any> => {
    return api.get('/leads/', { params });
  },

  getLeads: async (params?: { 
    search?: string;
    sort_by?: string;
    sort_desc?: boolean;
    stage_id?: number;
    assigned_to_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<any> => {
    const response = await api.get('/leads/', { params });
    const data = response.data;
    // Backend returns array, wrap it in expected format
    return {
      results: Array.isArray(data) ? data : data.results || [],
      total: Array.isArray(data) ? data.length : data.total || 0,
      page: params?.skip ? Math.floor(params.skip / (params.limit || 20)) : 0,
      limit: params?.limit || 20
    };
  },

  getById: async (id: number): Promise<any> => {
    return api.get(`/leads/${id}`);
  },

  create: async (data: Partial<Lead>): Promise<any> => {
    return api.post('/leads/', data);
  },

  update: async (id: number, data: Partial<Lead>): Promise<any> => {
    return api.put(`/leads/${id}`, data);
  },

  delete: async (id: number): Promise<any> => {
    return api.delete(`/leads/${id}`);
  },

  uploadCSV: async (formData: FormData): Promise<any> => {
    return api.post('/leads/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  exportCSV: async (params?: {
    search?: string;
    tag?: string;
    filters?: any;
  }): Promise<Blob> => {
    const response = await api.get('/leads/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/leads/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  requestInfo: async (data: { lead_id: number; field_name: string; notes?: string }): Promise<any> => {
    return await api.post('/requests/info-request', data);
  },

  getLeadStats: async (): Promise<LeadStats> => {
    const response = await api.get('/leads/stats');
    return response.data;
  }
};

export default leadsAPI;
