// Basic type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

// Form tipleri
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
  validation?: {
    required?: string;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
}

// UI component types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export interface InputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// API endpoint tipleri
export interface Endpoints {
  auth: {
    login: string;
    register: string;
    logout: string;
    refreshToken: string;
    forgotPassword: string;
    resetPassword: string;
  };
  users: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    get: (id: string) => string;
  };
  [key: string]: any;
}

// Store tipleri
export interface RootState {
  auth: AuthState;
  ui: UiState;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface UiState {
  theme: 'light' | 'dark';
  language: string;
  notifications: Notification[];
  modal: {
    isOpen: boolean;
    type: string | null;
    data: any;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Servis tipleri
export interface HttpClient {
  get: <T>(url: string, params?: any) => Promise<T>;
  post: <T>(url: string, data: any) => Promise<T>;
  put: <T>(url: string, data: any) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
  patch: <T>(url: string, data: any) => Promise<T>;
}

export interface StorageService {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  remove: (key: string) => void;
  clear: () => void;
}

// Helper type definitions
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;
