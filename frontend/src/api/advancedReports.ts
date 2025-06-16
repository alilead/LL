import apiClient from '../services/axios';

// Types
export interface LeadSourceReport {
  source: string;
  total_leads: number;
  qualified_leads: number;
  conversion_rate: number;
  total_value: number;
}

export interface SalesFunnelReport {
  stage_name: string;
  lead_count: number;
  conversion_rate: number;
  average_time_in_stage: number;
  drop_off_rate: number;
}

export interface PerformanceReport {
  user_name: string;
  user_email: string;
  total_leads: number;
  qualified_leads: number;
  deals_closed: number;
  total_revenue: number;
  activities_completed: number;
  tasks_completed: number;
}

export interface TimeSeriesData {
  date: string;
  leads_created: number;
  deals_closed: number;
  revenue: number;
  activities: number;
}

export interface GeographicReport {
  country: string;
  city?: string;
  lead_count: number;
  deal_count: number;
  total_value: number;
  conversion_rate: number;
}

export interface DetailedAnalytics {
  lead_sources: LeadSourceReport[];
  sales_funnel: SalesFunnelReport[];
  user_performance: PerformanceReport[];
  time_series: TimeSeriesData[];
  geographic_data: GeographicReport[];
  summary_metrics: Record<string, any>;
}

export interface LeadLifecycleAnalysis {
  stages: LeadStageMetrics[];
  conversion_rates: ConversionRate[];
  average_times: StageTime[];
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

// Enhanced types for new endpoints
export interface KPIMetric {
  name: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  target_value?: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface ConversionFunnelStage {
  stage_name: string;
  stage_order: number;
  lead_count: number;
  conversion_rate: number;
  drop_off_count: number;
  drop_off_rate: number;
  average_time_days: number;
}

export interface UserPerformanceDetail {
  user_id: number;
  user_name: string;
  user_email: string;
  total_leads: number;
  qualified_leads: number;
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  total_revenue: number;
  conversion_rate: number;
  average_deal_size: number;
  activities_count: number;
  tasks_completed: number;
  response_time_hours: number;
}

export interface LeadSourceMetrics {
  source: string;
  total_leads: number;
  qualified_leads: number;
  deals_created: number;
  deals_won: number;
  total_revenue: number;
  cost_per_lead: number;
  roi_percentage: number;
  conversion_rate: number;
  quality_score: number;
}

export interface PipelineHealthMetrics {
  stage_name: string;
  lead_count: number;
  total_value: number;
  average_deal_size: number;
  stage_velocity_days: number;
  bottleneck_risk: 'low' | 'medium' | 'high';
  forecasted_close_rate: number;
}

export interface GeographicInsights {
  country: string;
  region?: string;
  city?: string;
  lead_count: number;
  deal_count: number;
  total_revenue: number;
  average_deal_size: number;
  conversion_rate: number;
  market_penetration: number;
}

export interface SectorAnalysis {
  sector: string;
  lead_count: number;
  deal_count: number;
  total_revenue: number;
  average_deal_size: number;
  conversion_rate: number;
  growth_rate: number;
  market_share: number;
}

export interface ActivityReport {
  user_name: string;
  user_email: string;
  total_activities: number;
  calls_made: number;
  meetings_held: number;
  emails_sent: number;
  tasks_completed: number;
  average_response_time: number;
  activity_success_rate: number;
}

export interface KPIDashboardResponse {
  kpi_metrics: KPIMetric[];
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

export interface LeadStageMetrics {
  stage_name: string;
  lead_count: number;
  percentage: number;
  average_time_days: number;
}

export interface ConversionRate {
  from_stage: string;
  to_stage: string;
  rate: number;
  lead_count: number;
}

export interface StageTime {
  stage_name: string;
  average_days: number;
  median_days: number;
}

export interface Bottleneck {
  stage_name: string;
  risk_level: string;
  lead_count: number;
  suggestions: string[];
}

interface AnalyticsParams {
  start_date: string;
  end_date: string;
  include_team?: boolean;
}

interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  include_team?: boolean;
}

// API Service
export const advancedReportsApi = {
  // Get comprehensive analytics
  async getComprehensiveAnalytics(params: AnalyticsParams): Promise<DetailedAnalytics> {
    const response = await apiClient.get('/advanced-reports/analytics/comprehensive', {
      params
    });
    return response.data;
  },

  // Get lead lifecycle analysis
  async getLeadLifecycleAnalysis(params: Omit<AnalyticsParams, 'include_team'>): Promise<LeadLifecycleAnalysis> {
    const response = await apiClient.get('/advanced-reports/lead-lifecycle', {
      params
    });
    return response.data;
  },

  // Export analytics as CSV
  async exportAnalyticsCSV(reportType: string, params: DateRangeParams): Promise<Blob> {
    const response = await apiClient.get('/advanced-reports/export/csv', {
      params: {
        report_type: reportType,
        ...params
      },
      responseType: 'blob'
    });
    return response.data;
  },

  // New enhanced endpoints
  async getKPIDashboard(params: DateRangeParams = {}): Promise<KPIDashboardResponse> {
    const response = await apiClient.get('/advanced-reports/kpi-dashboard-simple', {
      params
    });
    return response.data;
  },

  async getConversionFunnel(params: DateRangeParams = {}): Promise<ConversionFunnelStage[]> {
    const response = await apiClient.get('/advanced-reports/conversion-funnel', {
      params
    });
    return response.data;
  },

  async getUserPerformance(params: DateRangeParams = {}): Promise<UserPerformanceDetail[]> {
    const response = await apiClient.get('/advanced-reports/user-performance', {
      params
    });
    return response.data;
  },

  async getLeadSourceAnalysis(params: DateRangeParams = {}): Promise<LeadSourceMetrics[]> {
    const response = await apiClient.get('/advanced-reports/lead-sources', {
      params
    });
    return response.data;
  },

  async getPipelineHealth(): Promise<PipelineHealthMetrics[]> {
    const response = await apiClient.get('/advanced-reports/pipeline-health');
    return response.data;
  },

  async getGeographicInsights(params: DateRangeParams = {}): Promise<GeographicInsights[]> {
    const response = await apiClient.get('/advanced-reports/geographic-insights', {
      params
    });
    return response.data;
  },

  async getSectorAnalysis(params: DateRangeParams = {}): Promise<SectorAnalysis[]> {
    const response = await apiClient.get('/advanced-reports/sector-analysis', {
      params
    });
    return response.data;
  },

  async getActivityPerformance(params: DateRangeParams = {}): Promise<ActivityReport[]> {
    const response = await apiClient.get('/advanced-reports/activity-performance', {
      params
    });
    return response.data;
  }
}; 