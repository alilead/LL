import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Calendar, Clock, User, Building, Filter, CheckCircle, AlertCircle, Loader2, List, BarChart2, XCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/hooks/use-toast';
import { TaskPriority, TaskStatus, tasksAPI, Task } from '@/services/tasks';
import { format, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns';
import { TaskDetailModal } from './TaskDetailModal';
import { PageContainer } from '@/components/ui/PageContainer';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

const TASK_STATUSES = [
  { value: TaskStatus.PENDING, label: 'Pending', color: 'bg-yellow-50 border-yellow-200', icon: '⏳', textColor: 'text-yellow-700', iconColor: 'text-yellow-500' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-50 border-blue-200', icon: '🔄', textColor: 'text-blue-700', iconColor: 'text-blue-500' },
  { value: TaskStatus.COMPLETED, label: 'Completed', color: 'bg-green-50 border-green-200', icon: '✅', textColor: 'text-green-700', iconColor: 'text-green-500' },
  { value: TaskStatus.CANCELLED, label: 'Cancelled', color: 'bg-gray-50 border-gray-200', icon: '❌', textColor: 'text-gray-700', iconColor: 'text-gray-500' },
];

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-green-50 text-green-700',
  MEDIUM: 'bg-yellow-50 text-yellow-700',
  HIGH: 'bg-orange-50 text-orange-700',
  URGENT: 'bg-red-50 text-red-700'
};

const priorityIcons: Record<TaskPriority, string> = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  URGENT: '🔴'
};

// Tarih formatlama fonksiyonu
const formatDate = (date: string) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
};

// Zaman formatlama fonksiyonu
const formatTime = (date: string) => {
  return format(new Date(date), 'HH:mm');
};

// Due date status
const getDueDateStatus = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = differenceInDays(due, today);
  
  if (diff < 0) return { label: 'Overdue', color: 'text-red-500' };
  if (diff === 0) return { label: 'Due today', color: 'text-orange-500' };
  if (diff <= 2) return { label: 'Coming soon', color: 'text-yellow-500' };
  return { label: 'Upcoming', color: 'text-green-500' };
};

const getTasks = async () => {
  try {
    const response = await tasksAPI.getTasks({
      sort_by: 'due_date',
      sort_desc: false,
    });
    return {
      items: response.items || [],
      total: response.total || 0
    };
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

const updateTask = async (data: { id: number; status: TaskStatus }) =>
  tasksAPI.updateTask(data.id, { status: data.status });

interface TasksByStatus {
  [key: string]: Task[];
}

export function TasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const {
    data: tasksData,
    isLoading,
    error,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      refetchTasks();
      toast({
        title: 'Success',
        description: 'Task status updated',
      });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  });

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Görev detaylarını açmadan önce kullanıcı izinlerini kontrol et
  const handleTaskClick = (task: Task) => {
    // Önce kullanıcının bu göreve erişim izni olup olmadığını kontrol et
    tasksAPI.getTask(task.id)
      .then(response => {
        setSelectedTask(response);
        setIsDetailOpen(true);
      })
      .catch(error => {
        console.error('Error fetching task details:', error);
        setErrorMessage('Bu görev detaylarına erişim izniniz bulunmuyor. Lütfen yöneticinize başvurun.');
        setErrorModalOpen(true);
        // Hata olsa bile task listeleri yenileyin
        refetchTasks();
      });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !tasksData?.items) return;

    const taskId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as TaskStatus;
    
    const sourceStatus = TASK_STATUSES.find(s => s.value === result.source.droppableId)?.label;
    const destStatus = TASK_STATUSES.find(s => s.value === newStatus)?.label;
    
    toast({
      title: 'Moving task',
      description: `From ${sourceStatus} to ${destStatus}`,
    });
    
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  // Filter tasks based on search term and priority
  const filteredTasks = useMemo(() => {
    if (!tasksData?.items) return [];
    
    return tasksData.items.filter((task: any) => {
      // Search filter
      const searchMatch = !searchTerm ? true : (
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.lead ? 
          `${task.lead.first_name} ${task.lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.lead.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          task.lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.lead.last_name.toLowerCase().includes(searchTerm.toLowerCase())
          : false)
      );
      
      // Priority filter
      const priorityMatch = priorityFilter === 'all' ? true : task.priority === priorityFilter;
      
      return searchMatch && priorityMatch;
    });
  }, [tasksData?.items, searchTerm, priorityFilter]);

  // Task metrics
  const taskMetrics = useMemo(() => {
    if (!filteredTasks) return null;
    
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const pendingTasks = filteredTasks.filter(task => task.status === TaskStatus.PENDING).length;
    const inProgressTasks = filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const cancelledTasks = filteredTasks.filter(task => task.status === TaskStatus.CANCELLED).length;
    const overdueTasks = filteredTasks.filter(task => {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      return dueDate < today && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
    }).length;
    
    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      cancelled: cancelledTasks,
      overdue: overdueTasks,
      completionRate
    };
  }, [filteredTasks]);

  // Group tasks by status
  const tasksByStatus: TasksByStatus = useMemo(() => {
    if (!filteredTasks) return {};
    
    return filteredTasks.reduce((acc: TasksByStatus, task: Task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as TasksByStatus);
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Failed to load tasks</h3>
          <p className="text-sm">Please try again later or contact support</p>
          <Button 
            onClick={() => refetchTasks()} 
            variant="outline" 
            className="mt-4 border-red-200 text-red-500 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding>
      <div className="h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="p-6 border-b bg-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-500 mt-1">Manage and organize your daily activities</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-md p-1">
                <Button 
                  variant={viewMode === 'board' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('board')} 
                  size="sm" 
                  className="gap-1 px-2 py-1 h-8"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Board</span>
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  onClick={() => setViewMode('list')} 
                  size="sm" 
                  className="gap-1 px-2 py-1 h-8"
                >
                  <List className="w-4 h-4" />
                  <span>List</span>
                </Button>
              </div>
              <Button 
                onClick={() => navigate('/tasks/new')} 
                size="sm" 
                className="gap-1 bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </Button>
            </div>
          </div>

          {/* Task Metrics */}
          {taskMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card className="p-3 border border-gray-100 bg-gray-50/50">
                <div className="font-medium text-xs text-gray-500 uppercase mb-1">Total</div>
                <div className="text-2xl font-bold text-gray-900">{taskMetrics.total}</div>
              </Card>
              <Card className="p-3 border border-green-100 bg-green-50/50">
                <div className="font-medium text-xs text-green-600 uppercase mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-600">{taskMetrics.completed}</div>
              </Card>
              <Card className="p-3 border border-yellow-100 bg-yellow-50/50">
                <div className="font-medium text-xs text-yellow-600 uppercase mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{taskMetrics.pending}</div>
              </Card>
              <Card className="p-3 border border-blue-100 bg-blue-50/50">
                <div className="font-medium text-xs text-blue-600 uppercase mb-1">In Progress</div>
                <div className="text-2xl font-bold text-blue-600">{taskMetrics.inProgress}</div>
              </Card>
              <Card className="p-3 border border-red-100 bg-red-50/50">
                <div className="font-medium text-xs text-red-600 uppercase mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{taskMetrics.overdue}</div>
              </Card>
              <Card className="p-3 border border-indigo-100 bg-indigo-50/50">
                <div className="font-medium text-xs text-indigo-600 uppercase mb-1">Completion</div>
                <div className="text-2xl font-bold text-indigo-600">{taskMetrics.completionRate}%</div>
              </Card>
            </div>
          )}

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-lg border border-gray-200 p-1">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tasks by title, description, lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-0 focus:ring-0 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Filter by priority" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">🟢</span> Low
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">🟡</span> Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500">🟠</span> High
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">🔴</span> Urgent
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Task Board View */}
        {viewMode === 'board' && (
          <div className="flex-1 p-6 overflow-x-auto bg-gray-50">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-[800px]">
                {TASK_STATUSES.map((status) => (
                  <Droppable key={status.value} droppableId={status.value}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-3 rounded-xl ${snapshot.isDraggingOver ? 'bg-gray-100/80 transition-colors duration-200' : ''}`}
                      >
                        <div className={`p-4 rounded-lg ${status.color} border shadow-sm`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{status.icon}</span>
                            <div className="flex-1">
                              <h3 className={`font-medium ${status.textColor}`}>
                                {status.label}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {tasksByStatus[status.value]?.length || 0} tasks
                                </span>
                                {status.value === TaskStatus.COMPLETED && taskMetrics && (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                    {taskMetrics.completionRate}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 min-h-[300px] p-2">
                          {tasksByStatus[status.value]?.length === 0 ? (
                            <div className="h-40 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                                  <path d="M12 12H19.5M19.5 12L16.5 9M19.5 12L16.5 15M19 6V5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-500 mb-1">No tasks</p>
                              <p className="text-xs text-gray-400">Drag and drop tasks here</p>
                            </div>
                          ) : (
                            tasksByStatus[status.value]?.map((task: any, taskIndex: number) => {
                              const dueStatus = getDueDateStatus(task.due_date);
                              return (
                                <Draggable
                                  key={task.id.toString()}
                                  draggableId={task.id.toString()}
                                  index={taskIndex}
                                >
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-4 cursor-pointer hover:shadow-md transition-all duration-200 border 
                                        ${snapshot.isDragging ? 'shadow-lg border-primary/20 bg-white/90' : 'border-gray-100 hover:border-gray-200 bg-white'} 
                                        hover:translate-y-[-2px] relative`}
                                      onClick={() => {
                                        handleTaskClick(task);
                                      }}
                                    >
                                      {/* Priority Indicator */}
                                      <div className="absolute top-0 right-0 w-3 h-3 transform translate-x-1/3 -translate-y-1/3">
                                        <span className="block h-full w-full rounded-full">
                                          {priorityIcons[task.priority as TaskPriority]}
                                        </span>
                                      </div>

                                      {/* Lead Info */}
                                      {task.lead && (
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <div className="text-sm font-medium text-primary">
                                              {task.lead.first_name[0]}{task.lead.last_name[0]}
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">
                                              {task.lead.first_name} {task.lead.last_name}
                                            </div>
                                            {task.lead.company && (
                                              <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                <Building className="h-3 w-3" />
                                                {task.lead.company}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Title and Description */}
                                      <div className="mb-3">
                                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{task.title}</h4>
                                        {task.description && (
                                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                            {task.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Meta Information */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Calendar className="w-3 h-3" />
                                          <span>{formatDate(task.due_date)}</span>
                                          <span>·</span>
                                          <Clock className="w-3 h-3" />
                                          <span>{formatTime(task.due_date)}</span>
                                        </div>
                                        <Badge className={`text-xs ${dueStatus.color}`}>
                                          {dueStatus.label}
                                        </Badge>
                                      </div>
                                    </Card>
                                  )}
                                </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* List header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 font-medium text-sm text-gray-500">
                <div className="col-span-5">Task</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Lead</div>
              </div>
              
              {/* List body */}
              <div className="divide-y divide-gray-100">
                {filteredTasks.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No tasks found</p>
                  </div>
                ) : (
                  filteredTasks.map((task: Task) => {
                    const dueStatus = getDueDateStatus(task.due_date);
                    const statusInfo = TASK_STATUSES.find(s => s.value === task.status);
                    
                    return (
                      <div 
                        key={task.id} 
                        className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          handleTaskClick(task);
                        }}
                      >
                        <div className="col-span-5">
                          <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                          {task.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center">
                          <div className={`flex flex-col ${dueStatus.color}`}>
                            <div className="text-sm">{formatDate(task.due_date)}</div>
                            <div className="text-xs text-gray-500">{formatTime(task.due_date)}</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge className={priorityColors[task.priority as TaskPriority]}>
                            {priorityIcons[task.priority as TaskPriority]} {task.priority}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge className={`bg-opacity-50 ${statusInfo?.color} ${statusInfo?.textColor}`}>
                            {statusInfo?.icon} {statusInfo?.label}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex items-center">
                          {task.lead ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center" title={`${task.lead.first_name} ${task.lead.last_name}`}>
                              <div className="text-sm font-medium text-primary">
                                {task.lead.first_name[0]}{task.lead.last_name[0]}
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            isOpen={isDetailOpen}
            task={selectedTask}
            onClose={() => {
              refetchTasks();
              setTimeout(() => {
                setIsDetailOpen(false);
                setSelectedTask(null);
              }, 100);
            }}
          />
        )}

        {/* Error Modal */}
        <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Erişim Hatası</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">{errorMessage}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => setErrorModalOpen(false)} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Tamam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}

export default TasksPage;