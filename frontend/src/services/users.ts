import api from './axios';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  token_balance: number;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdate extends Partial<Omit<UserCreate, 'password'>> {}

export interface UsersParams {
  search?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  page?: number;
  per_page?: number;
}

export const getUsers = async (params: UsersParams = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUser = async (id: number) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: UserCreate) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id: number, data: UserUpdate) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  await api.delete(`/users/${id}`);
};

// Profile endpoints
export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data: UserUpdate) => {
  const response = await api.patch('/auth/me', data);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword,
};
