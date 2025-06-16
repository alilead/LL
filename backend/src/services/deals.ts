import api from './axios';
import { Deal } from '@/pages/Deals/types';

export type DealCreate = Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'accepted_at' | 'rejected_at'>;
export type DealUpdate = Partial<DealCreate>;

export interface DealsParams {
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
  lead_id?: number;
  assigned_to_id?: number;
  page?: number;
  per_page?: number;
}

export const getDeals = async (params: DealsParams = {}) => {
  const response = await api.get('/deals/', { params });
  return response.data;
};

export const getDeal = async (id: number) => {
  const response = await api.get(`/deals/${id}/`);
  return response.data;
};

export const createDeal = async (data: DealCreate) => {
  const response = await api.post('/deals/', data);
  return response.data;
};

export const updateDeal = async (id: number, data: DealUpdate) => {
  const response = await api.patch(`/deals/${id}/`, data);
  return response.data;
};

export const deleteDeal = async (id: number) => {
  const response = await api.delete(`/deals/${id}/`);
  return response.data;
};

export default {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
};
