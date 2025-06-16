import api from '../lib/axios';
import { Deal, DealCreate, DealUpdate } from '../types/deal';

export const dealService = {
  getDeals: async (params?: {
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  getDeal: async (dealId: number) => {
    const response = await api.get(`/deals/${dealId}`);
    return response.data;
  },

  createDeal: async (deal: DealCreate) => {
    const response = await api.post('/deals', deal);
    return response.data;
  },

  updateDeal: async (dealId: number, deal: DealUpdate) => {
    const response = await api.put(`/deals/${dealId}`, deal);
    return response.data;
  },

  deleteDeal: async (dealId: number) => {
    const response = await api.delete(`/deals/${dealId}`);
    return response.data;
  },

  getPipelineSummary: async () => {
    const response = await api.get('/deals/pipeline/summary');
    return response.data;
  },
};
