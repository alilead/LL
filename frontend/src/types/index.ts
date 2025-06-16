export * from './auth';
export * from './lead';
export * from './note';
export * from './organization';
export * from './user';

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  linkedin: string | null;
  location: string | null;
  telephone: string | null;
  mobile: string | null;
  content: string | null; // From notes table
  est_wealth_experience: string | null;
  un_lead_id: string | null;
  ll_comments: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface LeadListResponse {
  data: Lead[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}
