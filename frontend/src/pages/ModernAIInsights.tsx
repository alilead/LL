/**
 * Modern AI Insights Page
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/axios';
import { Brain, TrendingUp, Target, Zap, Loader2 } from 'lucide-react';

export function ModernAIInsights() {
  const { data: insightsResponse, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.get('/ai/insights'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          AI Insights
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Intelligent recommendations powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Lead Scoring
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            AI-powered lead prioritization based on conversion probability
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Forecasting
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Predictive analytics for revenue and pipeline trends
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Recommendations
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Smart suggestions for next best actions
          </p>
        </div>
      </div>
    </div>
  );
}
