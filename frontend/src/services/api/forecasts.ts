/**
 * Forecasting API Service
 */

import api from '@/lib/axios';

export interface ForecastPeriod {
  id: number;
  organization_id: number;
  period_type: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  start_date: string;
  end_date: string;
  is_closed: boolean;
  created_at: string;
}

export interface Forecast {
  id: number;
  period_id: number;
  user_id: number;
  territory_id?: number;
  pipeline_amount: number;
  best_case_amount: number;
  commit_amount: number;
  closed_amount: number;
  manager_adjusted_commit?: number;
  adjustment_reason?: string;
  ai_predicted_commit?: number;
  quota_amount?: number;
  status: 'draft' | 'submitted' | 'approved';
  submitted_at?: string;
  adjusted_by_id?: number;
  adjusted_at?: string;
  created_at: string;
  updated_at: string;
  quota_attainment?: number;
  final_commit_amount?: number;
}

export const forecastsAPI = {
  // Periods
  getPeriods: async (): Promise<ForecastPeriod[]> => {
    const response = await api.get('/forecasts/periods');
    return response.data;
  },

  getActivePeriod: async (): Promise<ForecastPeriod> => {
    const response = await api.get('/forecasts/periods/active');
    return response.data;
  },

  createPeriod: async (data: {
    period_type: string;
    start_date: string;
    end_date: string;
  }): Promise<ForecastPeriod> => {
    const response = await api.post('/forecasts/periods', data);
    return response.data;
  },

  closePeriod: async (id: number): Promise<ForecastPeriod> => {
    const response = await api.post(`/forecasts/periods/${id}/close`);
    return response.data;
  },

  // Forecasts
  getMyForecast: async (periodId: number): Promise<Forecast> => {
    const response = await api.get('/forecasts/my', { params: { period_id: periodId } });
    return response.data;
  },

  getForecasts: async (periodId: number, territoryId?: number): Promise<Forecast[]> => {
    const params: any = { period_id: periodId };
    if (territoryId) params.territory_id = territoryId;
    const response = await api.get('/forecasts', { params });
    return response.data;
  },

  getForecast: async (id: number): Promise<Forecast> => {
    const response = await api.get(`/forecasts/${id}`);
    return response.data;
  },

  createOrUpdateForecast: async (data: {
    period_id: number;
    territory_id?: number;
    pipeline_amount: number;
    best_case_amount: number;
    commit_amount: number;
    closed_amount: number;
  }): Promise<Forecast> => {
    const response = await api.post('/forecasts', data);
    return response.data;
  },

  submitForecast: async (id: number): Promise<Forecast> => {
    const response = await api.post(`/forecasts/${id}/submit`);
    return response.data;
  },

  adjustForecast: async (id: number, adjusted_commit: number, reason: string): Promise<Forecast> => {
    const response = await api.post(`/forecasts/${id}/adjust`, {
      manager_adjusted_commit: adjusted_commit,
      adjustment_reason: reason
    });
    return response.data;
  },

  // Rollups
  getRollup: async (periodId: number, level: string, entityId?: number): Promise<any> => {
    const params: any = { period_id: periodId, rollup_level: level };
    if (entityId) params.entity_id = entityId;
    const response = await api.get('/forecasts/rollup', { params });
    return response.data;
  }
};
