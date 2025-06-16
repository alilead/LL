import api from './axios';

export interface Activity {
  id: number;
  title: string;
  description: string | null;
  type: string;
  due_date: string;
  duration: number;
  lead_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityCreate {
  title: string;
  description?: string;
  type: string;
  due_date: string;
  duration?: number;
  lead_id: number;
  user_id: number;
}

export interface ActivityUpdate extends Partial<ActivityCreate> {}

export interface ActivitiesParams {
  search?: string;
  sort_by?: string;
  sort_order?: string;
  type?: string;
  lead_id?: number;
  user_id?: number;
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
}

export const getAll = async (params: ActivitiesParams = {}) => {
  const response = await api.get('/activities', { params });
  return response.data;
};

export const getById = async (id: number) => {
  const response = await api.get(`/activities/${id}`);
  return response.data;
};

export const create = async (data: ActivityCreate) => {
  const response = await api.post('/activities', data);
  return response.data;
};

export const update = async (id: number, data: ActivityUpdate) => {
  const response = await api.put(`/activities/${id}`, data);
  return response.data;
};

export const remove = async (id: number) => {
  await api.delete(`/activities/${id}`);
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
