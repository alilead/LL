/**
 * Dashboard Builder API Service
 */

import api from '@/lib/axios';

export interface DashboardWidget {
  id?: number;
  dashboard_id?: number;
  name: string;
  widget_type: 'chart' | 'table' | 'metric' | 'list';
  data_source: string;
  configuration: any;
  created_at?: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  created_by_id?: number;
  layout?: any[];
  is_default: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  widgets?: DashboardWidget[];
}

export const dashboardsAPI = {
  getAll: async (is_public?: boolean): Promise<Dashboard[]> => {
    const params: any = {};
    if (is_public !== undefined) params.is_public = is_public;
    const response = await api.get('/dashboards', { params });
    return response.data;
  },

  getDefault: async (): Promise<Dashboard> => {
    const response = await api.get('/dashboards/default');
    return response.data;
  },

  getById: async (id: number): Promise<Dashboard> => {
    const response = await api.get(`/dashboards/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    is_default?: boolean;
    is_public?: boolean;
    widgets?: Omit<DashboardWidget, 'id' | 'dashboard_id' | 'created_at'>[];
  }): Promise<Dashboard> => {
    const response = await api.post('/dashboards', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Dashboard>): Promise<Dashboard> => {
    const response = await api.put(`/dashboards/${id}`, data);
    return response.data;
  },

  updateLayout: async (id: number, layout: any[]): Promise<Dashboard> => {
    const response = await api.put(`/dashboards/${id}/layout`, { layout });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/dashboards/${id}`);
  },

  clone: async (id: number, newName: string): Promise<Dashboard> => {
    const response = await api.post(`/dashboards/${id}/clone`, null, {
      params: { new_name: newName }
    });
    return response.data;
  },

  // Widgets
  getWidgets: async (dashboardId: number): Promise<DashboardWidget[]> => {
    const response = await api.get(`/dashboards/${dashboardId}/widgets`);
    return response.data;
  },

  createWidget: async (dashboardId: number, widget: Omit<DashboardWidget, 'id' | 'dashboard_id' | 'created_at'>): Promise<DashboardWidget> => {
    const response = await api.post(`/dashboards/${dashboardId}/widgets`, widget);
    return response.data;
  },

  updateWidget: async (widgetId: number, data: Partial<DashboardWidget>): Promise<DashboardWidget> => {
    const response = await api.put(`/dashboards/widgets/${widgetId}`, data);
    return response.data;
  },

  deleteWidget: async (widgetId: number): Promise<void> => {
    await api.delete(`/dashboards/widgets/${widgetId}`);
  },

  getWidgetData: async (widgetId: number): Promise<any> => {
    const response = await api.get(`/dashboards/widgets/${widgetId}/data`);
    return response.data;
  },

  setDefault: async (id: number): Promise<Dashboard> => {
    const response = await api.post(`/dashboards/${id}/set-default`);
    return response.data;
  }
};
