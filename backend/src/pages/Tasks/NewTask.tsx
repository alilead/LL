import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import React from 'react';
import { useAuthStore } from '@/store/auth';

// API imports
import tasksAPI from '@/services/api/tasks';
import leadsAPI, { Lead } from '@/services/api/leads';
import usersAPI, { User } from '@/services/api/users';
import api from '@/services/axios';

interface NewTaskForm {
  title: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
  lead_id: number;
  assigned_to_id: number;
}

const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const TASK_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const NewTaskPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<NewTaskForm>();

  // Debug auth state
  useEffect(() => {
      currentUser, 
      isAuthenticated, 
      hasToken: !!token,
      organization_id: currentUser?.organization_id
    });
  }, [currentUser, isAuthenticated, token]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setValue('assigned_to_id', user.id);
    setUserPopoverOpen(false);
  };

  // Fetch organization users
  const { data: usersData, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['organization-users', currentUser?.organization_id],
    queryFn: async () => {
      try {
        if (!currentUser?.organization_id) {
          throw new Error('Organization ID is required');
        }

        const response = await usersAPI.getAll({
          organization_id: currentUser.organization_id
        });

        if (!response || !response.items) {
          console.warn('No data or items in response');
          return [];
        }

        return response.items.filter((user: User) => user.is_active);
      } catch (error: any) {
        console.error('Error fetching organization users:', error);
        throw new Error(error.message || 'Failed to fetch organization users');
      }
    },
    enabled: !!currentUser?.organization_id
  });

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    
    
    return usersData.filter((user: User) => {
      // Check if user has required fields
      if (!user || !user.first_name || !user.last_name) {
        console.warn('Skipping invalid user:', user);
        return false;
      }
      
      // Filter by search term if provided
      if (!userSearchTerm) return true;
      
      const userFullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return userFullName.includes(userSearchTerm.toLowerCase());
    });
  }, [usersData, userSearchTerm]) || [];

  // User selection component
  const renderUserSelect = () => (
    <div className="space-y-2">
      <label htmlFor="assigned_to_id" className="block text-sm font-medium text-gray-700">
        Assign To
      </label>
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
                  <div className="text-xs mt-1 text-gray-500">
                    Debug info: {JSON.stringify({
                      errorName: usersError.name,
                      errorStack: usersError.stack?.split('\n')[0] || 'No stack'
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchUsers()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <div className="flex flex-col">
                  <span>No users found</span>
                  <span className="text-xs mt-2">Debug: {JSON.stringify({
                    hasUsersData: !!usersData,
                    usersDataLength: usersData?.length || 0,
                    searchTerm: userSearchTerm || 'none'
                  }, null, 2)}</span>
                </div>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  onClick={() => {
                    handleUserSelect(user);
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
      {errors.assigned_to_id && (
        <p className="text-sm text-red-500">Please select a user</p>
      )}
    </div>
  );

  // Fetch leads for search
  const { data: leadsData, isLoading: isLoadingLeads, error: leadsError } = useQuery({
    queryKey: ['leads-search', searchTerm],
    queryFn: async () => {
      try {
          search: searchTerm,
          limit: 50,
          skip: 0,
          sort_by: 'first_name',
          sort_desc: false
        });
        
        const response = await leadsAPI.getLeads({ 
          search: searchTerm,
          limit: 50,
          skip: 0,
          sort_by: 'first_name',
          sort_desc: false
        });
        
        
        if (response.items) {
        }
        
        if (response.results) {
        }
        
        return response;
      } catch (error: any) {
        console.error('Error fetching leads:', error);
        throw new Error(error.message || 'Failed to fetch leads');
      }
    },
    enabled: true,
  });

  // Filter leads based on search - using a more robust approach to handle different API response structures
  const filteredLeads = React.useMemo(() => {
    // Check if we have any data
    if (!leadsData) return [];
    
    // Get leads array from response, with type safety
    let leads: Lead[] = [];
    
    // Try different response structures
    if (leadsData.items && Array.isArray(leadsData.items)) {
      leads = leadsData.items as Lead[];
    } else if (leadsData.results && Array.isArray(leadsData.results)) {
      leads = leadsData.results as Lead[];
    } else if (Array.isArray(leadsData)) {
      leads = leadsData as Lead[];
    }
    
    
    if (leads.length === 0) {
      return [];
    }
    
    // Apply text search filtering
    return leads.filter((lead: Lead) => 
      searchTerm 
        ? `${lead.first_name || ''} ${lead.last_name || ''} ${lead.company || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true
    );
  }, [leadsData, searchTerm]);
  
  // useEffect to log full response data for debugging
  useEffect(() => {
    // When leadsData changes, log it for debugging
    if (leadsData) {
    }
  }, [leadsData]);

  // Get current user profile for debugging
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/v1/auth/me');
        return response.data;
      } catch (error) {
        console.error('Error fetching current user profile:', error);
        return null;
      }
    },
  });

  // Get leads from various possible structures in the API response
  const onSubmit = async (data: NewTaskForm) => {
    setIsSubmitting(true);
    try {
      if (!currentUser?.organization_id) {
        throw new Error('Organization ID is required');
      }
      
      await tasksAPI.create({
        ...data,
        lead_id: selectedLead?.id,
        assigned_to_id: selectedUser?.id,
        organization_id: currentUser.organization_id
      });
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
        <h1 className="text-2xl font-bold">New Task</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <Input
            id="title"
            {...register("title", { required: "Title is required" })}
            placeholder="Enter task title"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <textarea
            id="description"
            {...register("description")}
            className="w-full min-h-[100px] p-2 border rounded-md"
            placeholder="Enter task description"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
          <Input
            id="due_date"
            type="datetime-local"
            {...register("due_date", { required: "Due date is required" })}
          />
          {errors.due_date && (
            <p className="text-sm text-red-500">{errors.due_date.message}</p>
          )}
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">Priority</label>
            <Select
              onValueChange={(value) => setValue('priority', value)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">Status</label>
            <Select
              onValueChange={(value) => setValue('status', value)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Assigned To */}
        {renderUserSelect()}

        {/* Lead Selection */}
        <div className="space-y-2">
          <label htmlFor="lead_id" className="block text-sm font-medium text-gray-700">
            Associated Lead
          </label>
          <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-white hover:bg-gray-50"
                disabled={isLoadingLeads}
              >
                {isLoadingLeads ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Loading leads...
                  </div>
                ) : selectedLead ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                        {selectedLead.first_name[0]}{selectedLead.last_name[0]}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedLead.first_name} {selectedLead.last_name}</span>
                        {selectedLead.company && (
                          <span className="text-xs text-gray-500">{selectedLead.company}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <span>Select lead...</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="px-3 py-2 border-b">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {isLoadingLeads ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                      Loading leads...
                    </div>
                  </div>
                ) : leadsError ? (
                  <div className="p-4 text-center text-sm text-red-500">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="font-medium">Error loading leads</span>
                      <span className="text-xs">{leadsError.message}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : filteredLeads?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>No leads found</span>
                      <span className="text-xs mt-2">Debug: {JSON.stringify({
                        hasLeadsData: !!leadsData,
                        responseType: leadsData ? typeof leadsData : 'undefined',
                        hasItems: !!(leadsData && leadsData.items),
                        hasResults: !!(leadsData && leadsData.results),
                        isArray: !!(leadsData && Array.isArray(leadsData)),
                        firstFewProperties: leadsData ? 
                          Object.keys(leadsData).slice(0, 5).reduce((obj: Record<string, any>, key) => {
                            obj[key] = typeof leadsData[key] === 'object' ? 
                              `${Array.isArray(leadsData[key]) ? 'Array' : 'Object'} with ${Array.isArray(leadsData[key]) ? leadsData[key].length : Object.keys(leadsData[key]).length} items` : 
                              leadsData[key];
                            return obj;
                          }, {}) : 
                          'no data',
                        leadItems: leadsData?.items ? `Array with ${leadsData.items.length} leads` : 'no items',
                        leadResults: leadsData?.results ? `Array with ${leadsData.results.length} leads` : 'no results',
                      }, null, 2)}</span>
                    </div>
                  </div>
                ) : (
                  filteredLeads?.map((lead) => (
                    <div
                      key={lead.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => {
                        setSelectedLead(lead);
                        setValue('lead_id', lead.id);
                        setLeadPopoverOpen(false);
                      }}
                    >
                      <div className="flex items-center w-full">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                          {lead.company && (
                            <span className="text-xs text-gray-500">{lead.company}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.lead_id && (
            <p className="text-sm text-red-500">Please select a lead</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </div>
  );
};

export default NewTaskPage;
