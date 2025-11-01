import api from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  preferences?: Record<string, any>;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  preferences?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// User API endpoints
export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateProfile = async (data: UserUpdateInput): Promise<UserProfile> => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordInput): Promise<{ message: string }> => {
  const response = await api.post('/users/me/change-password', data);
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: UserUpdateInput): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deactivateUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.patch(`/api/v1/users/${id}/deactivate`);
  return response.data;
};

export const activateUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.patch(`/api/v1/users/${id}/activate`);
  return response.data;
};

export default {
  getCurrentUser,
  updateProfile,
  changePassword,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
};
