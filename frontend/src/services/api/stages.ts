import api from '../axios';

export interface Stage {
  id: number;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  organization_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StageCreate {
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
}

export const stagesAPI = {
  getAll: async (): Promise<any> => {
    return api.get('/lead-stages/');
  },

  getById: async (id: number): Promise<any> => {
    return api.get(`/lead-stages/${id}/`);
  },

  create: async (data: StageCreate): Promise<any> => {
    return api.post('/lead-stages/', data);
  },

  update: async (id: number, data: Partial<StageCreate>): Promise<any> => {
    return api.put(`/lead-stages/${id}/`, data);
  },

  delete: async (id: number): Promise<any> => {
    return api.delete(`/lead-stages/${id}/`);
  },
};

export default stagesAPI;
