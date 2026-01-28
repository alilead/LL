import api from '../lib/axios';
import { Task, TaskCreate, TaskUpdate } from '../types/task';

export const taskService = {
  getTasks: async (params?: {
    lead_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_desc?: boolean;
  }) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getTask: async (taskId: number) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (task: TaskCreate) => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  updateTask: async (taskId: number, task: TaskUpdate) => {
    const response = await api.put(`/tasks/${taskId}`, task);
    return response.data;
  },

  deleteTask: async (taskId: number) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  getOverdueTasks: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  getUpcomingTasks: async (days: number = 7) => {
    const response = await api.get('/tasks/upcoming', { params: { days } });
    return response.data;
  },
};
