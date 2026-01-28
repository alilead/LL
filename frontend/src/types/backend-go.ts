// Backend-Go API Types

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expires_at: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  organization_id?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
}

// Lead types
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost'
}

// Deal types
export interface Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expected_close_date?: string;
  lead_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
}

export enum DealStage {
  LEAD = 'Lead',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost'
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  lead_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  user_id: string;
  created_at: string;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  lead_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
}

// Activity types
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  user_id: string;
  lead_id?: string;
  deal_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  NOTE = 'note',
  TASK = 'task',
  DEAL_CREATED = 'deal_created',
  DEAL_UPDATED = 'deal_updated',
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated'
}

// Note types
export interface Note {
  id: string;
  title?: string;
  content: string;
  user_id: string;
  lead_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
}

// File types
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  user_id: string;
  lead_id?: string;
  deal_id?: string;
  created_at: string;
}

// Email types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface EmailSend {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  template_id?: string;
  variables?: Record<string, string>;
}

// Credit types
export interface CreditBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: CreditTransactionType;
  description: string;
  created_at: string;
}

export enum CreditTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  BONUS = 'bonus'
}

// Admin types
export interface AdminStats {
  total_users: number;
  total_leads: number;
  total_deals: number;
  total_revenue: number;
  active_users_today: number;
  new_leads_today: number;
  deals_closed_today: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  external_apis: Record<string, 'up' | 'down'>;
  uptime: number;
  version: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Query parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}