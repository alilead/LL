export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';

export interface LeadStage {
  id: number;
  name: string;
  description?: string;
  color: string;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  location?: string;
  linkedin?: string;
  country?: string;
  website?: string;
  sector?: string;
  unique_lead_id?: string;
  time_in_current_role?: string;
  lab_comments?: string;
  client_comments?: string;
  psychometrics?: Record<string, any>;
  wpi?: number;
  user_id: number;
  organization_id: number;
  stage_id: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
  visible: boolean;
  stage?: LeadStage;
  status: LeadStatus;
  is_verified: boolean;
}

export interface LeadCreate {
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  email?: string;
  telephone?: string;
  mobile?: string;
  location?: string;
  linkedin?: string;
  country?: string;
  website?: string;
  sector?: string;
  unique_lead_id?: string;
  time_in_current_role?: string;
  lab_comments?: string;
  client_comments?: string;
  psychometrics?: Record<string, any>;
  wpi?: number;
  stage_id: number;
  organization_id: number;
}

export interface LeadUpdate extends Partial<LeadCreate> {
  visible?: boolean;
  is_deleted?: boolean;
}

export interface LeadFilters {
  search?: string;
  stage_id?: number;
  sector?: string;
  country?: string;
  created_by?: number;
  user_id?: number;
  is_deleted?: boolean;
  visible?: boolean;
  min_wpi?: number;
  max_wpi?: number;
  created_after?: string;
  created_before?: string;
}
