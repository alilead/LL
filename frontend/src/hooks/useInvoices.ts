import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/axios';

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreateInput {
  customer_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status?: string;
}

export const useInvoices = () => {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/invoices');
      return response.data;
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceCreateInput) => {
      const response = await api.post('/invoices', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InvoiceCreateInput> }) => {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
};
