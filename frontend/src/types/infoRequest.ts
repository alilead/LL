export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface InfoRequest {
  id: number;
  lead_id: number;
  field_name: string;
  note?: string;
  status: RequestStatus;
  requested_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface InfoRequestCreate {
  lead_id: number;
  field_name: string;
  note?: string;
}

export interface InfoRequestUpdate {
  status: RequestStatus;
  assigned_to?: number;
  note?: string;
}
