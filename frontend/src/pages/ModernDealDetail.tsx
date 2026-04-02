/**
 * Full-page deal view (opened from the pipeline board).
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/axios';
import { ArrowLeft, Calendar, DollarSign, Loader2, User } from 'lucide-react';

interface ApiDeal {
  id: number;
  name: string;
  amount: string | number;
  status: string;
  valid_until?: string | null;
  lead_id: number;
  assigned_to_id: number;
  currency_id: number;
  created_at: string;
}

export function ModernDealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dealId = Number(id);

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const r = await api.get<ApiDeal>(`/deals/${dealId}/`);
      return r.data;
    },
    enabled: Number.isFinite(dealId) && dealId > 0,
  });

  if (!Number.isFinite(dealId) || dealId <= 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <p className="text-neutral-600 dark:text-neutral-400">Invalid deal.</p>
        <button
          type="button"
          onClick={() => navigate('/deals')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Back to deals
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <p className="text-neutral-600 dark:text-neutral-400">Could not load this deal.</p>
        <button
          type="button"
          onClick={() => navigate('/deals')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Back to deals
        </button>
      </div>
    );
  }

  const amount =
    typeof deal.amount === 'number' ? deal.amount : parseFloat(String(deal.amount)) || 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <button
        type="button"
        onClick={() => navigate('/deals')}
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to pipeline
      </button>

      <div className="max-w-2xl rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">{deal.name}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Status: {deal.status}</p>

        <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neutral-400" />
            <span className="font-semibold">${amount.toLocaleString()}</span>
          </div>
          {deal.valid_until && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Close by {new Date(deal.valid_until).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-neutral-400" />
            <span>
              Lead #{deal.lead_id} · Assigned user #{deal.assigned_to_id}
            </span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/leads/${deal.lead_id}`)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Open lead
          </button>
        </div>
      </div>
    </div>
  );
}
