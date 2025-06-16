import api from './api';

export interface ReportFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  userIds?: number[];
  leadStatuses?: string[];
  opportunityStages?: string[];
  customFilters?: Record<string, any>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  recipients: string[];
}

export interface ReportRequest {
  reportType: string;
  reportFormat: 'pdf' | 'csv' | 'excel' | 'json';
  startDate?: string;
  endDate?: string;
  organizationId?: number;
  filters?: ReportFilters;
  schedule?: ReportSchedule;
}

export interface DashboardStats {
  leadFunnel: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    opportunities: number;
    wonDeals: number;
    conversionRates: Record<string, number>;
  };
  salesPerformance: {
    totalRevenue: number;
    averageDealSize: number;
    winRate: number;
    salesCycleLength: number;
    topPerformers: Array<{
      userId: number;
      name: string;
      revenue: number;
      deals: number;
    }>;
  };
  taskCompletion: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  opportunityPipeline: {
    totalValue: number;
    stageDistribution: Record<string, number>;
    averageStageTime: Record<string, number>;
    winProbability: Record<string, number>;
  };
  systemHealth?: {
    systemUptime: number;
    apiResponseTime: number;
    errorRate: number;
    storageUsage: Record<string, number>;
    activeSessions: number;
  };
  userActivity?: {
    activeUsers: number;
    totalActions: number;
    averageActionsPerUser: number;
    mostActiveUsers: Array<{
      userId: number;
      name: string;
      actions: number;
    }>;
    activityBreakdown: Record<string, number>;
  };
}

export interface ReportResponse {
  id: number;
  reportType: string;
  reportFormat: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export const reportsApi = {
  // Dashboard istatistiklerini getir
  getDashboardStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<DashboardStats>(`/reports/dashboard?${params.toString()}`);
    return response.data;
  },

  // Özel rapor oluştur
  generateReport: async (request: ReportRequest) => {
    const response = await api.post<ReportResponse>('/reports/generate', request);
    return response.data;
  },

  // Zamanlanmış raporları listele
  getScheduledReports: async (skip = 0, limit = 100) => {
    const response = await api.get<ReportResponse[]>(`/reports/scheduled?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Yeni zamanlanmış rapor oluştur
  scheduleReport: async (request: ReportRequest) => {
    const response = await api.post<ReportResponse>('/reports/schedule', request);
    return response.data;
  },

  // Zamanlanmış raporu sil
  deleteScheduledReport: async (reportId: number) => {
    const response = await api.delete<ReportResponse>(`/reports/schedule/${reportId}`);
    return response.data;
  }
};
