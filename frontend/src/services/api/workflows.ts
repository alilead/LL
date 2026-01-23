/**
 * Workflow Automation API Service
 */

import api from '@/lib/axios';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  trigger_type: string;
  trigger_object: string;
  flow_definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  entry_criteria?: any;
  is_active: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: number;
  workflow_id: number;
  trigger_record_type: string;
  trigger_record_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  execution_log?: any;
  error_message?: string;
  duration_ms?: number;
}

export const workflowsAPI = {
  getAll: async (is_active?: boolean): Promise<Workflow[]> => {
    const params: any = {};
    if (is_active !== undefined) params.is_active = is_active;
    const response = await api.get('/workflows', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Workflow> => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_object: string;
    flow_definition: any;
    entry_criteria?: any;
    is_active?: boolean;
  }): Promise<Workflow> => {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  activate: async (id: number): Promise<Workflow> => {
    const response = await api.post(`/workflows/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: number): Promise<Workflow> => {
    const response = await api.post(`/workflows/${id}/deactivate`);
    return response.data;
  },

  triggerManually: async (id: number, recordType: string, recordId: number): Promise<WorkflowExecution> => {
    const response = await api.post(`/workflows/${id}/trigger`, {
      record_type: recordType,
      record_id: recordId
    });
    return response.data;
  },

  getExecutions: async (workflowId: number, status?: string): Promise<WorkflowExecution[]> => {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get(`/workflows/${workflowId}/executions`, { params });
    return response.data;
  },

  getExecution: async (executionId: number): Promise<WorkflowExecution> => {
    const response = await api.get(`/workflows/executions/${executionId}`);
    return response.data;
  },

  cancelExecution: async (executionId: number): Promise<WorkflowExecution> => {
    const response = await api.post(`/workflows/executions/${executionId}/cancel`);
    return response.data;
  },

  getStatistics: async (workflowId: number): Promise<any> => {
    const response = await api.get(`/workflows/${workflowId}/statistics`);
    return response.data;
  }
};
