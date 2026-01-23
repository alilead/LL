import api from './axios';

export interface Psychometric {
  id: number;
  lead_id: number;
  user_id: number;
  test_type: string;
  test_date: string;
  score: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export interface PsychometricCreate {
  lead_id: number;
  test_type: string;
  test_date: string;
  score: number;
  raw_data?: any;
}

export interface PsychometricUpdate extends Partial<PsychometricCreate> {}

export interface PsychometricsParams {
  lead_id?: number;
  user_id?: number;
  test_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export const getPsychometrics = async (params: PsychometricsParams = {}) => {
  const response = await api.get('/psychometrics', { params });
  return response.data;
};

export const getPsychometric = async (id: number) => {
  const response = await api.get(`/psychometrics/${id}`);
  return response.data;
};

export const createPsychometric = async (data: PsychometricCreate) => {
  const response = await api.post('/psychometrics', data);
  return response.data;
};

export const updatePsychometric = async (id: number, data: PsychometricUpdate) => {
  const response = await api.put(`/psychometrics/${id}`, data);
  return response.data;
};

export const deletePsychometric = async (id: number) => {
  await api.delete(`/psychometrics/${id}`);
};

// Get psychometric test types
export const getPsychometricTypes = async () => {
  const response = await api.get('/psychometrics/types');
  return response.data;
};

// Get psychometric statistics for a lead
export const getLeadPsychometricStats = async (leadId: number) => {
  const response = await api.get(`/psychometrics/stats/${leadId}`);
  return response.data;
};

export default {
  getPsychometrics,
  getPsychometric,
  createPsychometric,
  updatePsychometric,
  deletePsychometric,
  getPsychometricTypes,
  getLeadPsychometricStats,
};
