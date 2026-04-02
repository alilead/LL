/**
 * AI Insights — uses GET /api/v1/ai-insights/analytics and /high-priority
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/axios';
import {
  Brain,
  TrendingUp,
  Target,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { AIAnalytics, HighPriorityLead } from '@/services/aiInsightsService';

async function fetchAnalytics(): Promise<AIAnalytics> {
  const r = await api.get('/ai-insights/analytics');
  const body = r.data;
  if (body?.data) return body.data as AIAnalytics;
  return body as AIAnalytics;
}

async function fetchHighPriority(): Promise<HighPriorityLead[]> {
  const r = await api.get('/ai-insights/high-priority', {
    params: { min_score: 60, limit: 8 },
  });
  const body = r.data;
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

export function ModernAIInsights() {
  const {
    data: analytics,
    isLoading: loadingA,
    error: errA,
  } = useQuery({
    queryKey: ['ai-insights-analytics'],
    queryFn: fetchAnalytics,
  });

  const {
    data: highPriority = [],
    isLoading: loadingH,
  } = useQuery({
    queryKey: ['ai-insights-high-priority'],
    queryFn: fetchHighPriority,
  });

  const isLoading = loadingA || loadingH;
  const error = errA;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading AI insights…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>Could not load AI analytics. Ensure you are signed in and the API is available.</p>
        </div>
      </div>
    );
  }

  const a = analytics ?? {
    total_insights: 0,
    avg_quality_score: 0,
    avg_priority_score: 0,
    avg_confidence: 0,
    personality_distribution: {} as Record<string, number>,
    provider_distribution: {} as Record<string, number>,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          AI Insights
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Organization analytics from stored lead analyses (same data as lead-level insights).
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Analyses stored</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {a.total_insights}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg quality score</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {a.avg_quality_score?.toFixed(1) ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
            <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg priority score</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {a.avg_priority_score?.toFixed(1) ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Avg confidence</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {typeof a.avg_confidence === 'number' ? a.avg_confidence.toFixed(2) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Personality distribution
          </h2>
          {Object.keys(a.personality_distribution || {}).length === 0 ? (
            <p className="text-sm text-neutral-500">No personality breakdown yet — run analyses on leads.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(a.personality_distribution).map(([k, v]) => (
                <li key={k} className="flex justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">{k}</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            High-priority leads
          </h2>
          {highPriority.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No leads match the priority threshold yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {highPriority.map((row) => (
                <li key={row.lead_id}>
                  <Link
                    to={`/leads/${row.lead_id}`}
                    className="block rounded-lg border border-neutral-100 p-3 transition hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-700/50"
                  >
                    <div className="font-medium text-neutral-900 dark:text-neutral-50">
                      {row.lead_name}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                      {row.company ? <span>{row.company}</span> : null}
                      <span>
                        Priority{' '}
                        {typeof row.priority_score === 'number'
                          ? row.priority_score.toFixed(0)
                          : row.priority_score}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
