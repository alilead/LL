import api from '@/lib/axios';

// Backend-Go compatible Stage types
export interface Stage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StageCreateInput {
  name: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface StageUpdateInput extends Partial<StageCreateInput> {
  is_active?: boolean;
}

export interface StageListResponse {
  stages: Stage[];
  total: number;
}

// Stage API endpoints
export const getStages = async (): Promise<StageListResponse> => {
  const response = await api.get('/stages');
  return response.data;
};

export const getStage = async (id: string): Promise<Stage> => {
  const response = await api.get(`/stages/${id}`);
  return response.data;
};

export const createStage = async (data: StageCreateInput): Promise<Stage> => {
  const response = await api.post('/stages', data);
  return response.data;
};

export const updateStage = async (id: string, data: StageUpdateInput): Promise<Stage> => {
  const response = await api.put(`/stages/${id}`, data);
  return response.data;
};

export const deleteStage = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/v1/stages/${id}`);
  return response.data;
};

export const reorderStages = async (stageOrders: { id: string; order: number }[]): Promise<{ message: string }> => {
  const response = await api.patch('/stages/reorder', {
    stage_orders: stageOrders
  });
  return response.data;
};

export default {
  getStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
};