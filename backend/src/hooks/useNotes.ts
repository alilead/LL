import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { NoteList, Note, NoteCreate } from '../types';

interface UseNotesParams {
  organization_id?: number;
  lead_id?: number;
  deal_id?: number;
  skip?: number;
  limit?: number;
}

export function useNotes(params: UseNotesParams) {
  const queryClient = useQueryClient();

  const queryKey = ['notes', params];

  const { data, isLoading, error } = useQuery<NoteList>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.organization_id) searchParams.set('organization_id', params.organization_id.toString());
      if (params.lead_id) searchParams.set('lead_id', params.lead_id.toString());
      if (params.deal_id) searchParams.set('deal_id', params.deal_id.toString());
      if (params.skip) searchParams.set('skip', params.skip.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());

      const response = await api.get(`/notes?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!params.organization_id
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note: NoteCreate) => {
      const response = await api.post('/notes', note);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...note }: Partial<Note> & { id: number }) => {
      const response = await api.put(`/notes/${id}`, note);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/notes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    data,
    isLoading,
    error,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending
  };
}
