import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { QueryClient } from 'react-query';

const queryClient = new QueryClient();

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState([]);
  const queryClient = useQueryClient();

  const { refetch } = useQuery(['leads'], async () => {
    const response = await api.get('/leads');
    setLeads(response.data);
  });

  const deleteLead = async (id: number) => {
    try {
      await api.delete(`/leads/${id}?confirm=true`);
      toast.success('Lead deleted successfully');
      // Invalidate and refetch leads query
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Force refetch the current page
      refetch();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete lead');
    }
  };

  return (
    <div>
      {/* Render your leads component here */}
    </div>
  );
};

export default LeadsPage; 