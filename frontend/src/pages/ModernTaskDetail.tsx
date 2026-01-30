/**
 * Modern Task Detail Page
 * Full-page view for a single task (handles /tasks/:id after create or direct link).
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import tasksAPI from '@/services/api/tasks';
import { TaskDetailModal } from './Tasks/TaskDetailModal';

export function ModernTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const taskId = id ? parseInt(id, 10) : NaN;

  const { data: task, isLoading, error, isError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksAPI.getTask(taskId),
    enabled: Number.isInteger(taskId) && taskId > 0,
  });

  const handleClose = () => {
    navigate('/tasks');
  };

  if (!id || !Number.isInteger(taskId) || taskId <= 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">Invalid task ID</p>
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">Loading task...</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Task not found. It may have been deleted or you don't have access.
        </p>
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={handleClose}
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tasks
      </button>
      <TaskDetailModal task={task} isOpen={true} onClose={handleClose} />
    </div>
  );
}
