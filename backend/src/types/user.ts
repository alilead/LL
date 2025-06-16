export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  job_title?: string;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  organization_id: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_leads: number;
  total_payments: number;
  total_tokens_purchased: number;
  total_tokens_used: number;
}

export interface TokenTransaction {
  id: number;
  tokens: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'expiry' | 'transfer';
  description: string;
  created_at: string;
  expires_at?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: UserProfile;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company?: string;
  job_title?: string;
  organization_id: number;
}

export interface UserUpdateRequest {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  is_active?: boolean;
  is_admin?: boolean;
}
