/**
 * Modern Tasks Page - Enterprise Grade Task Management
 *
 * Features:
 * - Full backend integration
 * - Kanban board view
 * - List view with filters
 * - Priority management
 * - Due date tracking
 * - Assignment management
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/services/axios';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  MoreVertical,
  Loader2
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  assigned_to?: any;
  lead?: any;
  created_at: string;
}

export function ModernTasks() {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tasks from backend
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      return api.get('/tasks/', { params });
    },
  });

  const tasks: Task[] = Array.isArray(tasksResponse?.data)
    ? tasksResponse.data
    : (tasksResponse?.data?.data || tasksResponse?.data?.results || []);

  const statuses = [
    { id: 'pending', name: 'To Do', color: 'blue' },
    { id: 'in_progress', name: 'In Progress', color: 'yellow' },
    { id: 'completed', name: 'Completed', color: 'green' },
  ];

  const tasksByStatus = statuses.map((status) => ({
    ...status,
    tasks: tasks.filter((task) => task.status === status.id),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-neutral-600 bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Tasks
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage and track your tasks • {tasks.length} total tasks
            </p>
          </div>
          <button
            onClick={() => navigate('/tasks/new')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
              <Filter className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <span className="text-neutral-700 dark:text-neutral-300">Filters</span>
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
                view === 'kanban'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Board</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tasksByStatus.map((status) => (
            <div key={status.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${status.color}-500`} />
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">
                    {status.name}
                  </h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {status.tasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {status.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-50 text-sm flex-1">
                        {task.title}
                      </h4>
                      <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
                        <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {status.tasks.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-50">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {statuses.find(s => s.id === task.status)?.name || task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-50">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-50">
                    {task.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              No tasks found. Click "New Task" to create your first task.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
