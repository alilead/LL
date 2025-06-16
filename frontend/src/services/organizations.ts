import api from './axios';

export interface Organization {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export const getOrganizations = async () => {
  const response = await api.get('/organizations/');
  return response.data;
};

export const createOrganization = async (data: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post('/organizations/', data);
  return response.data;
};

export const updateOrganization = async (id: number, data: Partial<Organization>) => {
  const response = await api.patch(`/organizations/${id}/`, data);
  return response.data;
};

export const deleteOrganization = async (id: number) => {
  await api.delete(`/organizations/${id}/`);
};

export default {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
};
