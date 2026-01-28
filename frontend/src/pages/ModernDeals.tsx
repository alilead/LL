/**
 * Modern Deals Page - Enterprise Sales Pipeline
 *
 * Features:
 * - Full backend integration
 * - Pipeline stages visualization
 * - Deal tracking and management
 * - Revenue forecasting
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/axios';
import {
  DollarSign,
  Plus,
  Filter,
  Search,
  TrendingUp,
  Calendar,
  User,
  MoreVertical,
  Loader2,
  Target
} from 'lucide-react';

interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date?: string;
  lead?: any;
  assigned_to?: any;
  created_at: string;
}

export function ModernDeals() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch deals from backend
  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['deals', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      return api.get('/deals/', { params });
    },
  });

  const deals: Deal[] = Array.isArray(dealsResponse?.data)
    ? dealsResponse.data
    : (dealsResponse?.data?.data || dealsResponse?.data?.results || []);

  const stages = [
    { id: 'qualification', name: 'Qualification', color: 'blue' },
    { id: 'proposal', name: 'Proposal', color: 'purple' },
    { id: 'negotiation', name: 'Negotiation', color: 'orange' },
    { id: 'closed_won', name: 'Closed Won', color: 'green' },
  ];

  const dealsByStage = stages.map((stage) => ({
    ...stage,
    deals: deals.filter((deal) => deal.stage === stage.id),
    totalValue: deals
      .filter((deal) => deal.stage === stage.id)
      .reduce((sum, deal) => sum + (deal.value || 0), 0),
  }));

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Deals
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your sales pipeline • ${(totalValue / 1000).toFixed(1)}K total value
            </p>
          </div>
          <button
            onClick={() => navigate('/deals/new')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Deal</span>
          </button>
        </div>

        {/* Toolbar */}
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
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
            <Filter className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-neutral-700 dark:text-neutral-300">Filters</span>
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealsByStage.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            {/* Stage Header */}
            <div className="bg-white dark:bg-neutral-800 rounded-t-xl p-4 border-x border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm">
                    {stage.name}
                  </h3>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {stage.deals.length}
                </span>
              </div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                ${(stage.totalValue / 1000).toFixed(1)}K
              </div>
            </div>

            {/* Deal Cards */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl border-x border-b border-neutral-200 dark:border-neutral-700 p-3 space-y-3 min-h-[400px]">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-50 text-sm mb-1">
                        {deal.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-semibold">${deal.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
                      <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">Probability</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {deal.probability}%
                      </span>
                    </div>
                    {deal.expected_close_date && (
                      <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(deal.expected_close_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
