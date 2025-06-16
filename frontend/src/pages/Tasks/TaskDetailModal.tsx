import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { tasksAPI, TaskPriority, TaskStatus, Task } from '@/services/tasks';
import { toast } from 'react-hot-toast';
import usersAPI, { User } from '@/services/api/users';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    return str.toLowerCase().split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Fetch current task data - this will allow us to refresh it after updates
  const { data: currentTaskData, refetch: refetchTaskDetails, error: taskDetailError } = useQuery({
    queryKey: ['task-details', task?.id],
    queryFn: async () => {
      if (!task?.id) return null;
      try {
        return await tasksAPI.getTask(task.id);
      } catch (error) {
        console.error('Error fetching task details:', error);
        // Return the original task object if there's an error fetching updated details
        return task;
      }
    },
    enabled: !!task?.id && isOpen,
    staleTime: 0, // Always refetch when needed
  });

  // Use the most up-to-date task data
  const currentTask = currentTaskData || task;

  // Safe date formatting function
  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Safe ISO format function for datetime-local input
  const safeISOFormat = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error formatting ISO date:', dateString, error);
      return '';
    }
  };

  // Fetch users for assignment
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['organization-users'],
    queryFn: async () => {
      try {
        const response = await usersAPI.getAll();
        return response.items || [];
      } catch (error: any) {
        console.error('Error fetching users:', error);
        throw new Error(error.message || 'Failed to fetch users');
      }
    },
  });

  // Filter users based on search
  const filteredUsers = usersData?.filter((user: User) => 
    userSearchTerm ? 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearchTerm.toLowerCase()) :
    true
  ) || [];

  useEffect(() => {
    if (currentTask && !isEditing) {
      setFormData({
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        status: currentTask.status,
        due_date: currentTask.due_date,
        assigned_to_id: currentTask.assigned_to?.id,
        lead_id: currentTask.lead?.id,
      });
      if (currentTask.assigned_to) {
        setSelectedUser(currentTask.assigned_to);
      }
    }
  }, [currentTask, isEditing]);

  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksAPI.updateTask(task!.id, data),
    onSuccess: async () => {
      // Invalidate both the specific task query and the general tasks list
      queryClient.invalidateQueries({ queryKey: ['task-details', task?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Immediately refetch the task details to update the UI
      await refetchTaskDetails();
      
      setIsEditing(false);
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksAPI.deleteTask(currentTask!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete task. Please try again later');
      console.error('Error deleting task:', error);
    },
  });

  const handleEdit = () => {
    setFormData(currentTask || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTaskMutation.mutate(formData);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteTaskMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  if (!currentTask) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              <span>{isEditing ? 'Edit Task' : 'Task Details'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {isEditing ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium">Title</label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TaskPriority) => 
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskPriority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {capitalizeFirstLetter(priority)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border-gray-200 focus:border-blue-500 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TaskStatus) => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {capitalizeFirstLetter(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={safeISOFormat(formData.due_date)}
                      onChange={(e) => {
                        try {
                          const isoDate = new Date(e.target.value).toISOString();
                          setFormData({ ...formData, due_date: isoDate });
                        } catch (error) {
                          console.error('Error converting date input:', error);
                          // Keep the previous value if there's an error
                        }
                      }}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="assigned_to" className="text-sm font-medium">Assigned To</label>
                    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-white hover:bg-gray-50"
                          disabled={isLoadingUsers}
                        >
                          {isLoadingUsers ? (
                            <div className="flex items-center">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                              Loading users...
                            </div>
                          ) : selectedUser ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</span>
                                  {selectedUser.job_title && (
                                    <span className="text-xs text-gray-500">{selectedUser.job_title}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <span>Select user...</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="px-3 py-2 border-b">
                          <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-2">
                            <Search className="w-4 h-4 text-gray-500" />
                            <Input
                              placeholder="Search users..."
                              value={userSearchTerm}
                              onChange={(e) => setUserSearchTerm(e.target.value)}
                              className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                            />
                          </div>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto">
                          {isLoadingUsers ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                              <div className="flex items-center justify-center">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                                Loading users...
                              </div>
                            </div>
                          ) : usersError ? (
                            <div className="p-4 text-center text-sm text-red-500">
                              <div className="flex flex-col items-center space-y-2">
                                <span className="font-medium">Error loading users</span>
                                <span className="text-xs">{usersError.message}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.reload()}
                                >
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No users found</div>
                          ) : (
                            filteredUsers.map((user: User) => (
                              <div
                                key={user.id}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setFormData(prev => ({ ...prev, assigned_to_id: user.id }));
                                  setUserPopoverOpen(false);
                                }}
                              >
                                <div className="flex items-center w-full">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                                    {user.first_name[0]}{user.last_name[0]}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                                    {user.job_title && (
                                      <span className="text-xs text-gray-500">{user.job_title}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSave}
                    className="hover:bg-gray-100"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Task Header */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{currentTask.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Created on {safeFormatDate(currentTask.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${currentTask.priority === TaskPriority.LOW ? 'bg-gray-100 text-gray-800' :
                        currentTask.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-800' :
                        currentTask.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'}`}>
                      {capitalizeFirstLetter(currentTask.priority)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${currentTask.status === TaskStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                        currentTask.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                        currentTask.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {capitalizeFirstLetter(currentTask.status)}
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="mt-1 text-sm text-gray-900">{currentTask.description || 'No description provided'}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {safeFormatDate(currentTask.due_date)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {safeFormatDate(currentTask.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                      {currentTask.assigned_to ? (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {currentTask.assigned_to.first_name[0]}{currentTask.assigned_to.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {currentTask.assigned_to.first_name} {currentTask.assigned_to.last_name}
                            </p>
                            {currentTask.assigned_to.job_title && (
                              <p className="text-xs text-gray-500">{currentTask.assigned_to.job_title}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">Not assigned</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Associated Lead</h4>
                      {currentTask.lead ? (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {currentTask.lead.first_name[0]}{currentTask.lead.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {currentTask.lead.first_name} {currentTask.lead.last_name}
                            </p>
                            {currentTask.lead.company && (
                              <p className="text-xs text-gray-500">{currentTask.lead.company}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">No lead associated</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="hover:bg-gray-100"
                  >
                    Edit Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteClick}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Delete Task
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Delete Task
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmDelete}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
