import api from './axios';

export interface LeadStage {
  id: number;
  name: string;
  description: string | null;
  order: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface LeadStageCreate {
  name: string;
  description?: string;
  order?: number;
  color: string;
}

export interface LeadStageUpdate extends Partial<LeadStageCreate> {}

export interface LeadStagesParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export const getLeadStages = async (params: LeadStagesParams = {}) => {
  const response = await api.get('/lead-stages', { params });
  return response.data;
};

export const getLeadStage = async (id: number) => {
  const response = await api.get(`/lead-stages/${id}`);
  return response.data;
};

export const createLeadStage = async (data: LeadStageCreate) => {
  const response = await api.post('/lead-stages', data);
  return response.data;
};

export const updateLeadStage = async (id: number, data: LeadStageUpdate) => {
  const response = await api.put(`/lead-stages/${id}`, data);
  return response.data;
};

export const deleteLeadStage = async (id: number) => {
  await api.delete(`/lead-stages/${id}`);
};

// Reorder lead stages
export const reorderLeadStages = async (stageIds: number[]) => {
  const response = await api.post('/lead-stages/reorder', { stage_ids: stageIds });
  return response.data;
};

export default {
  getLeadStages,
  getLeadStage,
  createLeadStage,
  updateLeadStage,
  deleteLeadStage,
  reorderLeadStages,
};
