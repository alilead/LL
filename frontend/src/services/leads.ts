import { api } from '../lib/axios';

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  job_title: string | null;
  company: string | null;
  linkedin: string | null;
  location: string | null;
  country: string | null;
  website: string | null;
  sector: string | null;
  unique_lead_id: string | null;
  time_in_current_role: string | null;
  lab_comments: string | null;
  client_comments: string | null;
  psychometrics: any | null;
  wpi: number | null;
  telephone: string | null;
  mobile: string | null;
  est_wealth_experience: string | null;
  user_id: number;
  organization_id: number;
  stage_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  visible: boolean;
  source: string | null;
  communications?: Array<{
    id: number;
    content: string;
    created_at: string;
    type: string;
  }>;
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email?: string;
  job_title?: string;
  company?: string;
  linkedin?: string;
  location?: string;
  country?: string;
  website?: string;
  sector?: string;
  unique_lead_id?: string;
  time_in_current_role?: string;
  lab_comments?: string;
  client_comments?: string;
  psychometrics?: any;
  wpi?: number;
  telephone?: string;
  mobile?: string;
  est_wealth_experience?: string;
  stage_id: number;
}

export interface LeadUpdate extends Partial<LeadCreate> {}

export interface LeadsParams {
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
  stage_id?: number;
  user_id?: number;
  tag?: string;
  tag_id?: number;
  skip?: number;
  limit?: number;
  page?: number;
  is_admin?: boolean;
}

export interface LeadResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface LeadListResponse {
  results: Lead[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}

export interface LeadStats {
  total: number;
  qualified: number;
  hot_prospects: number;
  qualification_rate: number;
}

async function getLeads(params: LeadsParams = {}) {
  try {
    if (params.skip === undefined && params.page !== undefined) {
      params.skip = params.page * (params.limit || 20);
    }

    if (!params.limit) {
      params.limit = 20;
    }

    if (params.tag_id) {
      params.tag = params.tag_id.toString();
      delete params.tag_id;
    }

    // Format array parameters correctly
    const formattedParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        // If it's an array, send it as a single parameter
        acc[key] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('Sending API request with params:', formattedParams);
    const response = await api.get<Lead[]>('/leads/', { 
      params: formattedParams,
      paramsSerializer: params => {
        return Object.entries(params)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}=${value.join(',')}`;
            }
            return `${key}=${value}`;
          })
          .join('&');
      }
    });
    console.log('API response:', response.data);
    
    const leads = response.data;
    const total = leads.length;
    const page = params.page || 0;
    const size = params.limit;
    
    return {
      results: leads,
      total,
      page,
      size,
      has_more: leads.length === size
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

const getLead = async (id: number): Promise<LeadResponse> => {
  try {
    console.log(`Fetching lead with ID: ${id}`);
    
    const response = await api.get<LeadResponse>(`/leads/${id}/`);
    
    console.log(`Successfully retrieved lead: ${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching lead ${id}:`, error);
    
    // If we got a 401 or 404, return an empty lead object so the UI doesn't crash
    return {
      success: false,
      data: {
        id: id,
        first_name: "Error",
        last_name: "Loading",
        email: null,
        job_title: null,
        company: null,
        linkedin: null,
        location: null,
        country: null,
        website: null,
        sector: null,
        unique_lead_id: null,
        time_in_current_role: null,
        lab_comments: null,
        client_comments: null,
        psychometrics: null,
        wpi: null,
        telephone: null,
        mobile: null,
        est_wealth_experience: null,
        user_id: 0,
        organization_id: 0,
        stage_id: 0,
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        visible: true,
        source: null
      },
      message: `Error loading lead: ${error.message || 'Unknown error'}`
    };
  }
};

const createLead = async (data: LeadCreate) => {
  const response = await api.post<LeadResponse>('/leads/', data);
  return response.data;
};

const updateLead = async (id: number, data: LeadUpdate) => {
  const response = await api.patch<LeadResponse>(`/leads/${id}/`, data);
  return response.data;
};

const deleteLead = async (id: number) => {
  return api.delete(`/leads/${id}/`);
}

async function updateTags(leadId: number, tagIds: number[]) {
  return api.post(`/leads/${leadId}/tags/`, { tags: tagIds });
}

export const updateTagsInBulk = async (lead_ids: number[], tags: number[]) => {
  return api.post('/leads/bulk/tags', { leadIds: lead_ids, tags });
};

export const getLeadStats = async (): Promise<LeadStats> => {
  try {
    const response = await api.get<LeadStats>('/leads/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching lead statistics:', error);
    throw error;
  }
};

export const leadsAPI = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  updateTags,
  updateTagsInBulk,
  removeFromGroup: async (leadId: number, tagId: number) => {
    const response = await api.delete(`/tags/leads/${leadId}/tags/${tagId}`);
    return response.data;
  },
  uploadCSV: async (formData: FormData) => {
    const response = await api.post('/leads/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/leads/template', {
      responseType: 'blob',
    });
    return response.data;
  },
  getLeadStats
};
