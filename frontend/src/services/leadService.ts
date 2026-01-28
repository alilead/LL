import api from '../lib/axios';
import { Lead, LeadCreate, LeadUpdate } from '../types/lead';
import { InfoRequest, InfoRequestCreate, InfoRequestUpdate } from '../types/infoRequest';

export const leadService = {
  getLeads: async (params?: {
    search?: string;
    sector?: string;
    country?: string;
    min_wpi?: number;
    max_wpi?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getLead: async (id: number) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  createLead: async (lead: LeadCreate) => {
    const response = await api.post('/leads', lead);
    return response.data;
  },

  updateLead: async (id: number, lead: LeadUpdate) => {
    const response = await api.put(`/leads/${id}`, lead);
    return response.data;
  },

  deleteLead: async (id: number) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  searchLeads: async (params: {
    search?: string;
    sector?: string;
    country?: string;
    min_wpi?: number;
    max_wpi?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/leads/search', { params });
    return response.data;
  },

  exportLeads: async (params?: {
    search?: string;
    sector?: string;
    country?: string;
    min_wpi?: number;
    max_wpi?: number;
  }) => {
    const response = await api.get('/leads/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  importLeads: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Info Request methods
  createInfoRequest: async (request: InfoRequestCreate) => {
    const response = await api.post('/info-requests', request);
    return response.data;
  },

  getInfoRequests: async (params?: {
    lead_id?: number;
    status?: string;
    assigned_to?: number;
  }) => {
    const response = await api.get('/info-requests', { params });
    return response.data;
  },

  updateInfoRequest: async (id: number, data: InfoRequestUpdate) => {
    const response = await api.put(`/info-requests/${id}`, data);
    return response.data;
  },

  deleteInfoRequest: async (id: number) => {
    const response = await api.delete(`/info-requests/${id}`);
    return response.data;
  },
};
