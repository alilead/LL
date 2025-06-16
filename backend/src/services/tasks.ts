import api from './axios';
import { User } from './api/users';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  assigned_to_id: number;
  assigned_to?: User;
  organization_id: number;
  lead_id: number;
  lead?: {
    id: number;
    first_name: string;
    last_name: string;
    company?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to_id: number;
  organization_id: number;
  lead_id: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to_id?: number;
  lead_id?: number;
}

export interface TasksParams {
  lead_id?: number;
  status?: TaskStatus;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_desc?: boolean;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
}

async function getTasks(params: TasksParams = {}): Promise<TaskListResponse> {
  const response = await api.get('/tasks/', { params });
  return response.data;
}

async function getTask(id: number): Promise<Task> {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
}

async function createTask(data: TaskCreate): Promise<Task> {
  const response = await api.post('/tasks', data);
  return response.data;
}

async function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
}

async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

async function getOverdueTasks(): Promise<TaskListResponse> {
  const response = await api.get('/tasks/overdue');
  return response.data;
}

async function getUpcomingTasks(days: number = 7): Promise<TaskListResponse> {
  const response = await api.get('/tasks/upcoming', {
    params: { days }
  });
  return response.data;
}

export const tasksAPI = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getOverdueTasks,
  getUpcomingTasks,
};
