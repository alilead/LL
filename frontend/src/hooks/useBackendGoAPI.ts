import { useState, useCallback } from 'react';
import { backendGoAPI } from '../services/api/backend-go';
import type { ApiError } from '../types/backend-go';

// Generic API hook for backend-go integration
export function useBackendGoAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async <T>(
    apiCall: () => Promise<{ data: T }>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      return response.data;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.response?.data?.message || err.message || 'An error occurred',
        code: err.response?.data?.code,
        details: err.response?.data?.details
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
    api: backendGoAPI
  };
}

// Specific hooks for common operations
export function useAuth() {
  const { execute, loading, error, clearError } = useBackendGoAPI();

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    return execute(() => backendGoAPI.auth.login(credentials));
  }, [execute]);

  const register = useCallback(async (userData: { email: string; password: string; name: string }) => {
    return execute(() => backendGoAPI.auth.register(userData));
  }, [execute]);

  const logout = useCallback(async () => {
    return execute(() => backendGoAPI.auth.logout());
  }, [execute]);

  return {
    login,
    register,
    logout,
    loading,
    error,
    clearError
  };
}

export function useLeads() {
  const { execute, loading, error, clearError } = useBackendGoAPI();

  const getLeads = useCallback(async (params?: any) => {
    return execute(() => backendGoAPI.lead.getLeads(params));
  }, [execute]);

  const getLead = useCallback(async (id: string) => {
    return execute(() => backendGoAPI.lead.getLeadById(id));
  }, [execute]);

  const createLead = useCallback(async (leadData: any) => {
    return execute(() => backendGoAPI.lead.createLead(leadData));
  }, [execute]);

  const updateLead = useCallback(async (id: string, leadData: any) => {
    return execute(() => backendGoAPI.lead.updateLead(id, leadData));
  }, [execute]);

  const deleteLead = useCallback(async (id: string) => {
    return execute(() => backendGoAPI.lead.deleteLead(id));
  }, [execute]);

  return {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    loading,
    error,
    clearError
  };
}

export function useDeals() {
  const { execute, loading, error, clearError } = useBackendGoAPI();

  const getDeals = useCallback(async (params?: any) => {
    return execute(() => backendGoAPI.deal.getDeals(params));
  }, [execute]);

  const getDeal = useCallback(async (id: string) => {
    return execute(() => backendGoAPI.deal.getDealById(id));
  }, [execute]);

  const createDeal = useCallback(async (dealData: any) => {
    return execute(() => backendGoAPI.deal.createDeal(dealData));
  }, [execute]);

  const updateDeal = useCallback(async (id: string, dealData: any) => {
    return execute(() => backendGoAPI.deal.updateDeal(id, dealData));
  }, [execute]);

  const deleteDeal = useCallback(async (id: string) => {
    return execute(() => backendGoAPI.deal.deleteDeal(id));
  }, [execute]);

  return {
    getDeals,
    getDeal,
    createDeal,
    updateDeal,
    deleteDeal,
    loading,
    error,
    clearError
  };
}

export function useUsers() {
  const { execute, loading, error, clearError } = useBackendGoAPI();

  const getProfile = useCallback(async () => {
    return execute(() => backendGoAPI.user.getProfile());
  }, [execute]);

  const updateProfile = useCallback(async (userData: any) => {
    return execute(() => backendGoAPI.user.updateProfile(userData));
  }, [execute]);

  const getUsers = useCallback(async (params?: any) => {
    return execute(() => backendGoAPI.user.getUsers(params));
  }, [execute]);

  return {
    getProfile,
    updateProfile,
    getUsers,
    loading,
    error,
    clearError
  };
}