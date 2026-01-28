export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: number;
  lead_id?: number;
  organization_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export type TaskCreate = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<TaskCreate>;

export interface TaskList {
  items: Task[];
  total: number;
}
