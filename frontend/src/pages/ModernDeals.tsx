/**
 * Modern Deals Page — pipeline aligned with backend Deal model / DealStatus enum.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/axios';
import {
  DollarSign,
  Plus,
  Filter,
  Search,
  Calendar,
  MoreVertical,
  Loader2,
} from 'lucide-react';

/** Backend DealStatus string values */
type DealStatusStr =
  | 'Lead'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

interface ApiDeal {
  id: number;
  name: string;
  amount: string | number;
  status: DealStatusStr;
  valid_until?: string | null;
  lead_id: number;
  assigned_to_id: number;
  currency_id: number;
  created_at: string;
}

interface DealListBody {
  items: ApiDeal[];
  total: number;
}

/** UI pipeline column keys */
type UiStageId =
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

const STAGES: { id: UiStageId; name: string; headerClass: string; dotClass: string }[] = [
  { id: 'qualification', name: 'Lead / Qualified', headerClass: 'bg-blue-500', dotClass: 'bg-blue-500' },
  { id: 'proposal', name: 'Proposal', headerClass: 'bg-purple-500', dotClass: 'bg-purple-500' },
  { id: 'negotiation', name: 'Negotiation', headerClass: 'bg-orange-500', dotClass: 'bg-orange-500' },
  { id: 'closed_won', name: 'Closed Won', headerClass: 'bg-green-500', dotClass: 'bg-green-500' },
  { id: 'closed_lost', name: 'Closed Lost', headerClass: 'bg-red-500', dotClass: 'bg-red-500' },
];

function mapStatusToUiStage(status: string): UiStageId {
  switch (status) {
    case 'Lead':
    case 'Qualified':
      return 'qualification';
    case 'Proposal':
      return 'proposal';
    case 'Negotiation':
      return 'negotiation';
    case 'Closed Won':
      return 'closed_won';
    case 'Closed Lost':
      return 'closed_lost';
    default:
      return 'qualification';
  }
}

const STATUS_WEIGHT: Record<string, number> = {
  Lead: 20,
  Qualified: 35,
  Proposal: 55,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
};

function toAmountNumber(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function ModernDeals() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: axiosResponse, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => api.get<DealListBody>('/deals/'),
  });

  const rawDeals: ApiDeal[] = axiosResponse?.data?.items ?? [];

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawDeals;
    return rawDeals.filter((d) => d.name.toLowerCase().includes(q));
  }, [rawDeals, searchQuery]);

  const dealsByStage = useMemo(() => {
    return STAGES.map((stage) => {
      const deals = filteredDeals.filter((d) => mapStatusToUiStage(d.status) === stage.id);
      const totalValue = deals.reduce((sum, d) => sum + toAmountNumber(d.amount), 0);
      return { ...stage, deals, totalValue };
    });
  }, [filteredDeals]);

  const totalValue = useMemo(
    () => filteredDeals.reduce((sum, d) => sum + toAmountNumber(d.amount), 0),
    [filteredDeals]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Deals</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your sales pipeline • ${formatMoney(totalValue)} total value • {filteredDeals.length}{' '}
              shown
              {searchQuery.trim() ? ` (${rawDeals.length} total)` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/deals/new')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Deal</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Filter className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-neutral-700 dark:text-neutral-300">Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {dealsByStage.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <div className="bg-white dark:bg-neutral-800 rounded-t-xl p-4 border-x border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${stage.dotClass}`} />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm">
                    {stage.name}
                  </h3>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{stage.deals.length}</span>
              </div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                ${formatMoney(stage.totalValue)}
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl border-x border-b border-neutral-200 dark:border-neutral-700 p-3 space-y-3 min-h-[320px]">
              {stage.deals.map((deal) => {
                const value = toAmountNumber(deal.amount);
                const weight = STATUS_WEIGHT[deal.status] ?? 0;
                return (
                  <div
                    key={deal.id}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-50 text-sm mb-1 truncate">
                          {deal.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <DollarSign className="w-3 h-3 shrink-0" />
                          <span className="font-semibold">${formatMoney(value)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-600 dark:text-neutral-400">Stage weight</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-50">{weight}%</span>
                      </div>
                      {deal.valid_until && (
                        <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                          <Calendar className="w-3 h-3 mr-1 shrink-0" />
                          Close by {new Date(deal.valid_until).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {stage.deals.length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
