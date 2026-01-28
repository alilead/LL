import api from '../../lib/axios';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  priority: string;
  status: string;
  lead_id?: number;
  lead?: Lead;
  assigned_to_id?: number;
  assigned_to?: User;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date: string;
  priority: string;
  status: string;
  lead_id?: number;
  assigned_to_id?: number;
  organization_id: number;
}

export interface TasksParams {
  lead_id?: number;
  status?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_desc?: boolean;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
}

const create = async (data: TaskCreate) => {
  const response = await api.post('/tasks/', {
    ...data,
    organization_id: data.organization_id
  });
  return response.data;
};

const getTask = async (id: number): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

const getTasks = async (params: TasksParams = {}): Promise<TaskListResponse> => {
  const response = await api.get('/tasks/', { params });
  return response.data;
};

const updateTask = async (id: number, data: Partial<Task>): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

const tasksAPI = {
  create,
  getTask,
  getTasks,
  updateTask,
  deleteTask
};

export default tasksAPI;
