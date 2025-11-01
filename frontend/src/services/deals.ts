import api from '../lib/axios';

// Backend-Go compatible Deal types
export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  status: string;
  priority: string;
  stage: string;
  lead_id?: string;
  organization_id: string;
  user_id: string;
  expected_close_date?: string;
  actual_close_date?: string;
  probability: number;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DealCreateInput {
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: string;
  lead_id?: string;
  expected_close_date?: string;
  probability: number;
  custom_fields?: Record<string, any>;
}

export interface DealUpdateInput extends Partial<DealCreateInput> {
  status?: string;
  priority?: string;
  actual_close_date?: string;
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface DealFilters {
  status?: string;
  stage?: string;
  priority?: string;
  user_id?: string;
  lead_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DealStats {
  total: number;
  open: number;
  won: number;
  lost: number;
  total_value: number;
  won_value: number;
  average_deal_size: number;
  win_rate: number;
}

// Deal API endpoints
export const getDeals = async (filters?: DealFilters): Promise<DealListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await api.get(`/deals?${params.toString()}`);
  return response.data;
};

export const getDeal = async (id: string): Promise<Deal> => {
  const response = await api.get(`/deals/${id}`);
  return response.data;
};

export const createDeal = async (data: DealCreateInput): Promise<Deal> => {
  const response = await api.post('/deals', data);
  return response.data;
};

export const updateDeal = async (id: string, data: DealUpdateInput): Promise<Deal> => {
  const response = await api.put(`/deals/${id}`, data);
  return response.data;
};

export const deleteDeal = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/deals/${id}`);
  return response.data;
};

export const getDealActivities = async (dealId: string): Promise<DealActivity[]> => {
  const response = await api.get(`/deals/${dealId}/activities`);
  return response.data;
};

export const addDealActivity = async (dealId: string, activity: {
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<DealActivity> => {
  const response = await api.post(`/deals/${dealId}/activities`, activity);
  return response.data;
};

export const getDealStats = async (): Promise<DealStats> => {
  const response = await api.get('/deals/stats');
  return response.data;
};

export const moveDealToStage = async (dealId: string, stage: string): Promise<Deal> => {
  const response = await api.patch(`/deals/${dealId}/stage`, { stage });
  return response.data;
};

export const bulkUpdateDeals = async (dealIds: string[], updates: DealUpdateInput): Promise<{ message: string; updated_count: number }> => {
  const response = await api.patch('/deals/bulk', {
    deal_ids: dealIds,
    updates
  });
  return response.data;
};

export default {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealActivities,
  addDealActivity,
  getDealStats,
  moveDealToStage,
  bulkUpdateDeals,
};
