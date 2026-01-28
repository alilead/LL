import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '../services/api';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  source: string | null;
  telephone: string | null;
  mobile: string | null;
  stage_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface LeadFilters {
  organization_id?: number;
  user_id?: number;
  stage_id?: number;
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
}

interface UseLeadsParams {
  skip?: number;
  limit?: number;
  filters?: LeadFilters;
}

interface LeadList {
  items: Lead[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}

export function useLeads(params?: UseLeadsParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['leads', params];

  const { data, isLoading, error } = useQuery<LeadList>({
    queryKey,
    queryFn: async () => {
      const response = await leadsAPI.getAll({
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        search: params?.filters?.search,
        sort_by: params?.filters?.sort_by,
        sort_desc: params?.filters?.sort_desc,
        stage_id: params?.filters?.stage_id,
      });
      
      return {
        items: response.data.data,
        total: response.data.total,
        page: response.data.page,
        size: response.data.size,
        has_more: response.data.has_more,
      };
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: leadsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Lead oluşturulurken bir hata oluştu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) =>
      leadsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Lead güncellenirken bir hata oluştu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: leadsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead başarıyla silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Lead silinirken bir hata oluştu');
    },
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}

export function useLead(id: string) {
  const { user } = useAuth();

  const queryKey = ['lead', id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await leadsAPI.getById(parseInt(id));
      return response.data;
    },
    enabled: !!user && !!id,
  });
}
