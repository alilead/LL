import api from '@/lib/axios';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Enum-like constants for easier usage
export const TaskStatus = {
  PENDING: 'pending' as TaskStatus,
  IN_PROGRESS: 'in_progress' as TaskStatus,
  COMPLETED: 'completed' as TaskStatus,
  CANCELLED: 'cancelled' as TaskStatus,
};

export const TaskPriority = {
  LOW: 'low' as TaskPriority,
  MEDIUM: 'medium' as TaskPriority,
  HIGH: 'high' as TaskPriority,
  URGENT: 'urgent' as TaskPriority,
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  lead_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  lead_id?: string;
  deal_id?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
  lead_id?: string;
  deal_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

export const getTasks = async (filters?: TaskFilters): Promise<TaskListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  const response = await api.get(`/tasks?${params.toString()}`);
  return response.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: TaskCreateInput): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: TaskUpdateInput): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const completeTask = async (id: string): Promise<Task> => {
  const response = await api.patch(`/tasks/${id}/complete`);
  return response.data;
};

export const getTaskStats = async (): Promise<TaskStats> => {
  const response = await api.get('/tasks/stats');
  return response.data;
};

export const getMyTasks = async (filters?: Omit<TaskFilters, 'assigned_to'>): Promise<TaskListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  const response = await api.get(`/tasks/my?${params.toString()}`);
  return response.data;
};

export const bulkUpdateTasks = async (taskIds: string[], updates: TaskUpdateInput): Promise<{ message: string; updated_count: number }> => {
  const response = await api.patch('/tasks/bulk', {
    task_ids: taskIds,
    updates
  });
  return response.data;
};

export const tasksAPI = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTaskStats,
  getMyTasks,
  bulkUpdateTasks,
};

export default tasksAPI;
