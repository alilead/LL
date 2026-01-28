export interface Deal {
  id: number;
  name: string;
  description: string;
  amount: string;
  status: string;
  valid_until: string | null;
  lead_id: number;
  lead_name?: string;
  company_name?: string;
  assigned_to_id: number;
  currency_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
}
