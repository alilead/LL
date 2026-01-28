/**
 * Data Import/Export API Service
 */

import api from '@/lib/axios';

export interface ImportJob {
  id: number;
  organization_id: number;
  created_by_id?: number;
  source_type: string;
  source_name?: string;
  entity_type: string;
  file_path?: string;
  status: string;
  field_mapping?: Record<string, string>;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  skipped_records: number;
  error_log?: any[];
  import_summary?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  deduplicate: boolean;
  update_existing: boolean;
}

export interface ImportProgress {
  job_id: number;
  status: string;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  skipped_records: number;
  progress_percentage: number;
  estimated_time_remaining?: number;
}

export interface CSVPreview {
  headers: string[];
  sample_rows: string[][];
  total_rows: number;
  detected_fields: Record<string, string>;
}

export interface CRMConnection {
  id: number;
  organization_id: number;
  crm_type: string;
  connection_name: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_status?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExportJob {
  id: number;
  organization_id: number;
  entity_type: string;
  format: string;
  status: string;
  file_url?: string;
  total_records: number;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

export const dataImportAPI = {
  // Import Jobs
  getImportJobs: async (status?: string): Promise<ImportJob[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/data-import/jobs', { params });
    return response.data;
  },

  getImportJob: async (jobId: number): Promise<ImportJob> => {
    const response = await api.get(`/data-import/jobs/${jobId}`);
    return response.data;
  },

  getImportProgress: async (jobId: number): Promise<ImportProgress> => {
    const response = await api.get(`/data-import/jobs/${jobId}/progress`);
    return response.data;
  },

  getImportRecords: async (jobId: number, status?: string): Promise<any[]> => {
    const params = status ? { status } : {};
    const response = await api.get(`/data-import/jobs/${jobId}/records`, { params });
    return response.data;
  },

  // CSV Import
  uploadCSVForPreview: async (
    file: File,
    hasHeader: boolean = true,
    delimiter: string = ',',
    encoding: string = 'utf-8'
  ): Promise<CSVPreview> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/data-import/csv/upload', formData, {
      params: { has_header: hasHeader, delimiter, encoding },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importCSV: async (
    file: File,
    entityType: string,
    fieldMapping?: Record<string, string>,
    hasHeader: boolean = true,
    delimiter: string = ',',
    encoding: string = 'utf-8',
    deduplicate: boolean = true,
    updateExisting: boolean = false
  ): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append('file', file);

    const params: any = {
      entity_type: entityType,
      has_header: hasHeader,
      delimiter,
      encoding,
      deduplicate,
      update_existing: updateExisting
    };

    if (fieldMapping) {
      params.field_mapping = JSON.stringify(fieldMapping);
    }

    const response = await api.post('/data-import/csv/import', formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // CRM Connections
  getCRMConnections: async (crmType?: string): Promise<CRMConnection[]> => {
    const params = crmType ? { crm_type: crmType } : {};
    const response = await api.get('/data-import/connections', { params });
    return response.data;
  },

  createCRMConnection: async (data: {
    crm_type: string;
    connection_name: string;
    credentials: any;
    api_endpoint?: string;
    sync_settings?: any;
  }): Promise<CRMConnection> => {
    const response = await api.post('/data-import/connections', data);
    return response.data;
  },

  updateCRMConnection: async (
    connectionId: number,
    data: Partial<CRMConnection>
  ): Promise<CRMConnection> => {
    const response = await api.put(`/data-import/connections/${connectionId}`, data);
    return response.data;
  },

  deleteCRMConnection: async (connectionId: number): Promise<void> => {
    await api.delete(`/data-import/connections/${connectionId}`);
  },

  testCRMConnection: async (connectionId: number): Promise<any> => {
    const response = await api.post(`/data-import/connections/${connectionId}/test`);
    return response.data;
  },

  // CRM Imports
  importFromSalesforce: async (data: {
    connection_id: number;
    entity_type: string;
    soql_query?: string;
    import_all?: boolean;
    field_mapping?: Record<string, string>;
  }): Promise<ImportJob> => {
    const response = await api.post('/data-import/salesforce/import', data);
    return response.data;
  },

  importFromHubSpot: async (data: {
    connection_id: number;
    entity_type: string;
    list_id?: number;
    import_all?: boolean;
    field_mapping?: Record<string, string>;
  }): Promise<ImportJob> => {
    const response = await api.post('/data-import/hubspot/import', data);
    return response.data;
  },

  importFromPipedrive: async (data: {
    connection_id: number;
    entity_type: string;
    filter_id?: number;
    import_all?: boolean;
    field_mapping?: Record<string, string>;
  }): Promise<ImportJob> => {
    const response = await api.post('/data-import/pipedrive/import', data);
    return response.data;
  },

  // Export
  createExport: async (data: {
    entity_type: string;
    format?: string;
    filters?: any;
  }): Promise<ExportJob> => {
    const response = await api.post('/data-import/export', data);
    return response.data;
  },

  getExportJob: async (jobId: number): Promise<ExportJob> => {
    const response = await api.get(`/data-import/export/${jobId}`);
    return response.data;
  },

  // Statistics
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/data-import/statistics');
    return response.data;
  }
};
