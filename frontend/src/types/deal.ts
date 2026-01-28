export type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Deal {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency_id: number;
  status: string;
  valid_until: string | null;
  assigned_to_id: number;
  lead_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
}

export type DealCreate = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
export type DealUpdate = Partial<DealCreate>;

export interface DealList {
  items: Deal[];
  total: number;
}

export interface PipelineStats {
  total_value: number;
  total_deals: number;
  stage_stats: {
    [key in DealStage]: {
      count: number;
      value: number;
    };
  };
  currency_stats: {
    [key: string]: {
      count: number;
      value: number;
    };
  };
}
