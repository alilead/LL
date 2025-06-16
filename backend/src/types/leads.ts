export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
  job_title?: string;
  linkedin?: string;
  mobile?: string;
  telephone?: string;
  location?: string;
  country?: string;
  website?: string;
  sector?: string;
  organization_id?: number;
  user_id?: number;
  stage_id?: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  visible?: boolean;
  psychometrics?: Record<string, any>;
  notes?: Array<any>;
  tags?: Array<any>;
  full_name?: string;
  stage?: {
    id: number;
    name: string;
    color?: string;
  };
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  creator?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface LeadStage {
  id: number;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  organization_id: number;
  is_active: boolean;
}

export interface LeadWithStats extends Lead {
  stats?: {
    total_deals?: number;
    total_value?: number;
    win_rate?: number;
    avg_deal_size?: number;
  };
} 