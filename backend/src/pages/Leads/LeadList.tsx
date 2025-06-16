import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '@/services/leads';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Plus, Users, ChevronDown, ChevronUp, ArrowUpDown, Search, X, UserPlus, Filter, Grid3X3, List, BookOpen, CalendarDays, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tag, getTags, createTag, update as updateTag, remove as removeTag, addTagToLead } from '@/services/tags';
import { useAuthStore } from '@/store/auth';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  flexRender,
  getPaginationRowModel,
  ColumnFiltersState,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/ui/PageContainer';
import debounce from 'lodash/debounce';
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string;
  job_title: string;
  location: string;
  sector: string;
  created_at: string;
  source?: string;
  country?: string;
}

interface CreateGroupPayload {
  lead_ids: number[];
  tag_id: number;
}

interface MutationError {
  message?: string;
  response?: {
    data?: {
      detail?: string;
    };
  };
}

interface FilterState {
  sector: string[];
  location: string[];
  source: string[];
  country: string[];
}

export function LeadList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rowSelection, setRowSelection] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const { user } = useAuthStore();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sector: [],
    location: [],
    source: [],
    country: []
  });
  const [availableFilters, setAvailableFilters] = useState<FilterState>({
    sector: [],
    location: [],
    source: [],
    country: []
  });
  
  // Bileşen içinde scroll pozisyonu kaydedilirken kullanılacak Ref
  const leadListRef = useRef<HTMLDivElement>(null);
  // Önceki scroll pozisyonu için ref kullan
  const scrollPositionRef = useRef<number>(0);
  // Scroll pozisyonu yüklendi mi kontrolü
  const scrollRestoredRef = useRef<boolean>(false);

  // Add debounced filter function
  const debouncedSetFilter = useCallback(
    debounce((column: any, value: string) => {
      column.setFilterValue(value);
    }, 300),
    []
  );

  // Fetch leads
  const { data: leadsData, isLoading: isLeadsLoading, refetch } = useQuery({
    queryKey: ['leads', selectedTag, searchText, page, pageSize, sorting, filters],
    queryFn: async () => {
      try {
        const [sortField] = sorting.length ? [sorting[0].id] : ['created_at'];
        const sortDirection = sorting.length ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

        // Convert filters to correct format
        const formattedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            // Join array values with commas for backend processing
            acc[key] = value.join(',');
          }
          return acc;
        }, {} as Record<string, any>);

        const params = {
          tag_id: selectedTag === 'all' ? undefined : Number(selectedTag),
          search: searchText,
          skip: page * pageSize,
          limit: pageSize,
          sort_by: sortField,
          sort_desc: sortDirection === 'desc',
          ...formattedFilters
        };

        const response = await leadsAPI.getLeads(params);
        
        // Debug empty results
        if (!response || !response.results || response.results.length === 0) {
          console.warn('No leads found in response:', response);
        } else {
        }
        
        return response;
      } catch (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Fetch tags
  const { data: tagsData, isLoading: isTagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        const fetchedTags = await getTags();
        return fetchedTags;
      } catch (error) {
        console.error('Error in tags query function:', error);
        return [];
      }
    },
    staleTime: 60000, // 1 minute cache
  });

  // Ensure tags is always an array
  const tags = Array.isArray(tagsData) ? tagsData : [];

  // Utility functions
  const handleMutationError = (error: MutationError, defaultMessage: string) => {
    console.error('Mutation error:', error);
    return error?.message || error?.response?.data?.detail || defaultMessage;
  };

  // State management
  const resetStates = () => {
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setSelectedLeads([]);
    setRowSelection({});
    setIsLoading(false);
  };

  // Mutations
  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return createTag(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      resetStates();
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });
    },
    onError: (error: MutationError) => {
      const errorMessage = handleMutationError(error, 'Failed to create tag');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  const addTagToLeadsMutation = useMutation({
    mutationFn: async ({ lead_ids, tag_id }: CreateGroupPayload) => {
      const results = [];

      // Add tags to all leads
      for (const lead_id of lead_ids) {
        try {
          const result = await addTagToLead({ 
            lead_id: Number(lead_id), 
            tag_id: Number(tag_id)
          });
          results.push(result);
        } catch (error) {
          console.error(`Error adding tag to lead ${lead_id}:`, error);
          throw error;
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      resetStates();
      toast({
        title: 'Success',
        description: 'Tags updated successfully',
      });
    },
    onError: (error: MutationError) => {
      console.error('Error in addTagToLeadsMutation:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update tags';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: removeTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete tag',
        variant: 'destructive',
      });
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      updateTag(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      setTagToEdit(null);
      toast({
        title: 'Success',
        description: 'Tag updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update tag',
        variant: 'destructive',
      });
    }
  });

  // Add removeFromGroup mutation
  const removeFromGroupMutation = useMutation({
    mutationFn: async ({ lead_ids, tag_id }: { lead_ids: number[], tag_id: number }) => {
      const results = [];
      for (const lead_id of lead_ids) {
        try {
          const result = await leadsAPI.removeFromGroup(lead_id, tag_id);
          results.push(result);
        } catch (error) {
          console.error(`Error removing lead ${lead_id} from group:`, error);
          throw error;
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      resetStates();
      toast({
        title: 'Success',
        description: 'Leads removed from group successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to remove leads from group',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (!isCreateGroupOpen) {
      setNewGroupName('');
    }
  }, [isCreateGroupOpen]);

  useEffect(() => {
    if (!leadsData?.results) return;

    const selected = Object.keys(rowSelection)
      .filter(index => leadsData.results[parseInt(index)])
      .map(index => leadsData.results[parseInt(index)]);

      rowSelection,
      dataLength: leadsData?.results?.length,
      selectedIndexes: Object.keys(rowSelection),
      selected
    });
    
    setSelectedLeads(selected);
  }, [rowSelection, leadsData?.results]);

  useEffect(() => {
    setRowSelection({});
    setSelectedLeads([]);
  }, [page, pageSize]);

  // Event handlers
  const handleCreateGroup = async () => {
    try {
      if (!newGroupName?.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a group name',
          variant: 'destructive',
        });
        return;
      }

      const validLeadIds = selectedLeads
        .filter(lead => lead?.id)
        .map(lead => lead.id);

      if (!validLeadIds.length) {
        toast({
          title: 'Error',
          description: 'Please select at least one lead',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      const newTag = await createTagMutation.mutateAsync({ 
        name: newGroupName.trim() 
      });

      if (newTag?.id) {
        await addTagToLeadsMutation.mutateAsync({
          lead_ids: validLeadIds,
          tag_id: newTag.id
        });
      }
    } catch (error: any) {
      const errorMessage = handleMutationError(error, 'Failed to create or assign group');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagChange = (value: string) => {
      selectedValue: value,
      isAll: value === 'all',
      tagDetails: tags?.find(tag => tag.id.toString() === value)
    });
    setSelectedTag(value);
    // Reset to first page when changing tag
    setPage(0);
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'first_name',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.original.first_name}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'last_name',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.original.last_name}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'sector',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sector
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.getValue("sector") || "-"}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.original.company}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'job_title',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Job Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.original.job_title}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div 
          className="px-4 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => navigateToDetail(row.original.id)}
        >
          {row.original.location}
        </div>
      ),
      enableSorting: true,
    }
  ];

  const table = useReactTable({
    data: leadsData?.results || [],
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: leadsData ? Math.ceil(leadsData.total / pageSize) : 0,
  });

  const renderDeleteConfirmationDialog = () => (
    <Dialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Delete Tag</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Are you sure you want to delete the tag <span className="font-medium">"{tagToDelete?.name}"</span>?
            <br />
            <span className="text-destructive">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setTagToDelete(null)}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (tagToDelete) {
                deleteTagMutation.mutate(tagToDelete.id);
                setTagToDelete(null);
              }
            }}
            className="min-w-[100px]"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderTagManagement = () => {
    if (!isEditingTags) return null;

    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Manage Tags</h3>
          <Button
            variant="outline"
            onClick={() => setIsEditingTags(false)}
          >
            Done
          </Button>
        </div>
        <div className="grid gap-4">
          {tags?.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
              {tagToEdit?.id === tag.id ? (
                <input
                  type="text"
                  className="border rounded px-2 py-1"
                  value={tagToEdit.name}
                  onChange={(e) => setTagToEdit({ ...tagToEdit, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateTagMutation.mutate({ id: tag.id, name: tagToEdit.name });
                    }
                  }}
                />
              ) : (
                <span>{tag.name}</span>
              )}
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (tagToEdit?.id === tag.id) {
                      updateTagMutation.mutate({ id: tag.id, name: tagToEdit.name });
                    } else {
                      setTagToEdit(tag);
                    }
                  }}
                >
                  {tagToEdit?.id === tag.id ? 'Save' : 'Edit'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setTagToDelete(tag)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAddToGroup = async () => {
    try {
      if (!selectedGroupId) {
        toast({
          title: 'Error',
          description: 'Please select a group',
          variant: 'destructive',
        });
        return;
      }

      const validLeadIds = selectedLeads
        .filter(lead => lead?.id)
        .map(lead => Number(lead.id)); // Ensure IDs are numbers

      if (!validLeadIds.length) {
        toast({
          title: 'Error',
          description: 'Please select at least one lead',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      // Use the mutation to add leads to group
      await addTagToLeadsMutation.mutateAsync({
        lead_ids: validLeadIds,
        tag_id: Number(selectedGroupId)
      });

      // Dialog'u kapat ve seçimleri sıfırla
      setIsAddToGroupOpen(false);
      setSelectedGroupId('');
      setRowSelection({});
      setSelectedLeads([]);

    } catch (error: any) {
      console.error('Error adding leads to group:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || error?.message || 'Failed to add leads to group',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add remove from group handler
  const handleRemoveFromGroup = async () => {
    try {
      if (!selectedTag || selectedTag === 'all') {
        toast({
          title: 'Error',
          description: 'Please select a group first',
          variant: 'destructive',
        });
        return;
      }

      const validLeadIds = selectedLeads
        .filter(lead => lead?.id)
        .map(lead => lead.id);

      if (!validLeadIds.length) {
        toast({
          title: 'Error',
          description: 'Please select at least one lead',
          variant: 'destructive',
        });
        return;
      }

      await removeFromGroupMutation.mutateAsync({
        lead_ids: validLeadIds,
        tag_id: parseInt(selectedTag)
      });
    } catch (error: any) {
      console.error('Error removing leads from group:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to remove leads from group',
        variant: 'destructive',
      });
    }
  };

  // Lead kartı için yeni bileşen
  const LeadCard = ({ lead }: { lead: any }) => {
    const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`;
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
        onClick={() => navigateToDetail(lead.id)}
        data-lead-id={lead.id}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12 bg-primary/10 text-primary">
              <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {lead.first_name} {lead.last_name}
              </h3>
              <Checkbox
                checked={Boolean(rowSelection[lead.id])}
                onCheckedChange={(value) => {
                  const newSelection = { ...rowSelection };
                  if (value) {
                    newSelection[lead.id] = true;
                  } else {
                    delete newSelection[lead.id];
                  }
                  setRowSelection(newSelection);
                }}
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              />
            </div>
            <div className="mt-1">
              <p className="text-sm text-gray-600 truncate">{lead.job_title}</p>
              <p className="text-sm text-gray-500 truncate">{lead.company}</p>
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
              {lead.location && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  {lead.location}
                </Badge>
              )}
              {lead.sector && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  {lead.sector}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Created on {format(new Date(lead.created_at), 'PP')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-gray-500">{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex space-x-2">
            {lead.email ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Check className="h-4 w-4 text-green-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email available</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Email missing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="flex flex-col space-y-4">
      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Primary Actions */}
          <Button onClick={() => navigate('new')} size="default" className="transition-all hover:scale-105 duration-200">
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>

          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                disabled={selectedLeads.length === 0}
                onClick={(e) => {
                  e.preventDefault();
                  setIsCreateGroupOpen(true);
                }}
                className={cn(
                  "transition-all duration-200",
                  selectedLeads.length > 0 ? "hover:bg-primary hover:text-white" : ""
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Create Group ({selectedLeads.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new group for selected leads ({selectedLeads.length} selected)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateGroupOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  disabled={isLoading || !newGroupName.trim() || selectedLeads.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddToGroupOpen} onOpenChange={setIsAddToGroupOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                disabled={selectedLeads.length === 0}
                onClick={(e) => {
                  e.preventDefault();
                  setIsAddToGroupOpen(true);
                }}
                className={cn(
                  "transition-all duration-200",
                  selectedLeads.length > 0 ? "hover:bg-blue-500 hover:text-white" : ""
                )}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add to Existing Group ({selectedLeads.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Existing Group</DialogTitle>
                <DialogDescription>
                  Add selected leads ({selectedLeads.length} selected) to an existing group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Select Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      className="max-h-[300px] overflow-y-auto scrollbar-visible"
                      style={{
                        scrollbarWidth: 'auto',
                        scrollbarColor: 'rgb(99 102 241) rgb(243 244 246)',
                        msOverflowStyle: 'auto'
                      }}
                    >
                      <div className="overflow-y-auto hover:overflow-y-auto">
                        {tags?.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddToGroupOpen(false);
                    setSelectedGroupId('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddToGroup}
                  disabled={isLoading || !selectedGroupId || selectedLeads.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Group'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedTag !== 'all' && (
            <Button 
              variant="outline"
              disabled={selectedLeads.length === 0}
              onClick={handleRemoveFromGroup}
              className={cn(
                "transition-all duration-200",
                selectedLeads.length > 0 ? "hover:bg-red-500 hover:text-white" : ""
              )}
            >
              <X className="w-4 h-4 mr-2" />
              Remove from Group ({selectedLeads.length})
            </Button>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
          <Button 
            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('table')}
            className="h-8 px-2"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('cards')}
            className="h-8 px-2"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Tag Filter */}
          <div className="w-[200px]">
            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="bg-white">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Filter by tag" />
                </div>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                className="max-h-[300px] overflow-y-auto scrollbar-visible"
                style={{
                  scrollbarWidth: 'auto',
                  scrollbarColor: 'rgb(99 102 241) rgb(243 244 246)',
                  msOverflowStyle: 'auto'
                }}
              >
                <SelectItem value="all">All Tags</SelectItem>
                {tags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag Management */}
          {user?.is_admin && (
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsEditingTags(!isEditingTags)}
              className="transition-all hover:bg-gray-100"
            >
              Manage Tags
            </Button>
          )}

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search in all columns..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 bg-white"
            />
            {searchText && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchText('')}
              >
                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>
          
          {/* Additional Filter Button */}
          <Button 
            variant="outline" 
            className={cn("bg-white", Object.values(filters).some(arr => arr.length > 0) && "bg-primary text-white")}
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters {Object.values(filters).some(arr => arr.length > 0) && `(${Object.values(filters).reduce((acc, curr) => acc + curr.length, 0)})`}
          </Button>
        </div>
      </div>
    </div>
  );

  const handleDelete = async (id: number) => {
    try {
      await leadsAPI.deleteLead(id);
      toast.success('Lead deleted successfully');
      // Invalidate and refetch leads query
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Force refetch the current page
      await refetch();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete lead');
    }
  };

  // Arama fonksiyonunu güncelle
  const handleSearch = (value: string) => {
    setSearchText(value);
    setGlobalFilter(value);
  };

  // Bileşen yüklendikten ve içerik render edildikten sonra scroll pozisyonunu geri yükle
  useEffect(() => {
    // Sayfa içeriğinin yüklenmesini beklemek için
    const scrollTimer = setTimeout(() => {
      // Detay sayfasından dönüyoruz mu?
      const isReturning = sessionStorage.getItem('returnToLeadList') === 'true';
      
      if (isReturning) {
        // Flag'i temizle
        sessionStorage.removeItem('returnToLeadList');
        
        // Kaydedilmiş scroll pozisyonunu al
        const savedPosition = sessionStorage.getItem('leadListScrollPosition');
        
        if (savedPosition) {
          const position = parseInt(savedPosition);
          
          // Scroll'u geri yükle - IntersectionObserver API'si ile element görünürlüğünü kontrol ediyoruz
          window.scrollTo({
            top: position,
            behavior: 'auto' // smooth scroll değil, ani geçiş
          });
          
          // Scroll pozisyonunun doğru uygulandığından emin olmak için kontrol et
          const checkScrollTimer = setTimeout(() => {
            if (Math.abs(window.scrollY - position) > 100) {
              window.scrollTo({
                top: position,
                behavior: 'auto'
              });
            } else {
            }
          }, 200);
          
          return () => clearTimeout(checkScrollTimer);
        }
      } else {
        // Yeni bir ziyarette en başa kaydır
        window.scrollTo(0, 0);
      }
    }, 300); // Yüksek öncelikli içerik yüklendikten sonra, ama tüm asenkron veri yüklenmeden önce
    
    return () => clearTimeout(scrollTimer);
  }, []);

  // Veri yüklendiğinde scroll pozisyonunu koru
  useEffect(() => {
    if (!isLeadsLoading && leadsData) {
      // Detay sayfasından dönüş sonrası veri yüklendiğinde scroll pozisyonunu tekrar kontrol et
      const isReturning = sessionStorage.getItem('returnToLeadList') === 'true';
      const savedPosition = sessionStorage.getItem('leadListScrollPosition');
      
      if (isReturning && savedPosition) {
        const position = parseInt(savedPosition);
        
        // Veri yüklemesi tamamlandıktan sonra bir kez daha scroll uygula
        setTimeout(() => {
          window.scrollTo({
            top: position,
            behavior: 'auto'
          });
        }, 100);
      }
    }
  }, [isLeadsLoading, leadsData]);

  // Son görüntülenen lead'in bulunduğu sayfayı bulmak için useEffect
  useEffect(() => {
    const lastViewedLeadId = sessionStorage.getItem('lastViewedLeadId');
    
    // Eğer son görüntülenen lead ID varsa ve liste yüklendiyse
    if (lastViewedLeadId && !isLeadsLoading && leadsData) {
      // Flag'i temizle
      sessionStorage.removeItem('lastViewedLeadId');
      sessionStorage.removeItem('returnToLeadList');
      
      
      // Şu anki parametreler için lead'in bulunduğu sayfayı bul
      const findLeadPage = async () => {
        const leadId = parseInt(lastViewedLeadId);
        
        // Önce mevcut sayfada lead var mı kontrol et
        const leadInCurrentPage = leadsData.results.find(lead => lead.id === leadId);
        if (leadInCurrentPage) {
          
          // Birkaç saniye sonra scroll et - sayfanın yüklenmesini bekle
          setTimeout(() => {
            const leadRow = document.querySelector(`[data-lead-id="${leadId}"]`);
            if (leadRow) {
              leadRow.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
          }, 300);
          
          return;
        }
        
        // Şu anki sayfada değilse, tüm sayfalarda ara
        let foundPage = -1;
        const params = {
          tag: selectedTag === 'all' ? undefined : selectedTag,
          search: searchText,
          limit: pageSize,
          sort_by: sorting.length ? sorting[0].id : 'created_at',
          sort_desc: sorting.length ? sorting[0].desc : true
        };
        
        // Maksimum 10 sayfa kontrol et (performance için)
        for (let p = 0; p < 10; p++) {
          try {
            const pageData = await leadsAPI.getLeads({
              ...params,
              skip: p * pageSize
            });
            
            if (pageData.results.some(lead => lead.id === leadId)) {
              foundPage = p;
              break;
            }
          } catch (error) {
            console.error(`Error checking page ${p}:`, error);
          }
        }
        
        if (foundPage >= 0) {
          // Sayfayı güncelle
          setPage(foundPage);
          
          // Sayfanın yüklenmesini bekle ve lead'i göster
          setTimeout(() => {
            const leadRow = document.querySelector(`[data-lead-id="${leadId}"]`);
            if (leadRow) {
              leadRow.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
          }, 1000);
        }
      };
      
      findLeadPage();
    }
  }, [isLeadsLoading, leadsData, page, pageSize, selectedTag, searchText, sorting]);

  // Detay sayfasına gidilirken lead ID'sini kaydet
  const navigateToDetail = (id: number) => {
    // Scroll pozisyonunu kaydet
    const currentScrollPosition = window.scrollY;
    sessionStorage.setItem('leadListScrollPosition', currentScrollPosition.toString());
    
    // Detail sayfasına git
    navigate(`/leads/${id}`, { 
      state: { 
        from: 'leadList',
        scrollPosition: currentScrollPosition
      } 
    });
  };

  // Add this after your existing useEffect hooks
  useEffect(() => {
    if (leadsData?.results) {
      const newFilters: FilterState = {
        sector: [],
        location: [],
        source: [],
        country: []
      };

      leadsData.results.forEach((lead: Lead) => {
        if (lead.sector && !newFilters.sector.includes(lead.sector)) {
          newFilters.sector.push(lead.sector);
        }
        if (lead.location && !newFilters.location.includes(lead.location)) {
          newFilters.location.push(lead.location);
        }
        if (lead.source && !newFilters.source.includes(lead.source)) {
          newFilters.source.push(lead.source);
        }
        if (lead.country && !newFilters.country.includes(lead.country)) {
          newFilters.country.push(lead.country);
        }
      });

      // Sort filter options alphabetically
      Object.keys(newFilters).forEach((key) => {
        newFilters[key as keyof FilterState].sort();
      });

      setAvailableFilters(newFilters);
    }
  }, [leadsData?.results]);

  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[type].includes(value)) {
        newFilters[type] = newFilters[type].filter(v => v !== value);
      } else {
        newFilters[type] = [...newFilters[type], value];
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      sector: [],
      location: [],
      source: [],
      country: []
    });
  };

  // Add this component for the filter dialog
  const FilterDialog = () => (
    <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filter Leads</DialogTitle>
          <DialogDescription>
            Select filters to narrow down your lead list
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Sector</h3>
              <div className="space-y-2">
                {availableFilters.sector.map((sector) => (
                  <div key={sector} className="flex items-center">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={filters.sector.includes(sector)}
                      onCheckedChange={() => handleFilterChange('sector', sector)}
                    />
                    <label htmlFor={`sector-${sector}`} className="ml-2 text-sm">
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Location</h3>
              <div className="space-y-2">
                {availableFilters.location.map((location) => (
                  <div key={location} className="flex items-center">
                    <Checkbox
                      id={`location-${location}`}
                      checked={filters.location.includes(location)}
                      onCheckedChange={() => handleFilterChange('location', location)}
                    />
                    <label htmlFor={`location-${location}`} className="ml-2 text-sm">
                      {location}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Source</h3>
              <div className="space-y-2">
                {availableFilters.source.map((source) => (
                  <div key={source} className="flex items-center">
                    <Checkbox
                      id={`source-${source}`}
                      checked={filters.source.includes(source)}
                      onCheckedChange={() => handleFilterChange('source', source)}
                    />
                    <label htmlFor={`source-${source}`} className="ml-2 text-sm">
                      {source}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Country</h3>
              <div className="space-y-2">
                {availableFilters.country.map((country) => (
                  <div key={country} className="flex items-center">
                    <Checkbox
                      id={`country-${country}`}
                      checked={filters.country.includes(country)}
                      onCheckedChange={() => handleFilterChange('country', country)}
                    />
                    <label htmlFor={`country-${country}`} className="ml-2 text-sm">
                      {country}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={() => setIsFiltersOpen(false)}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div ref={leadListRef}>
      <div id="lead-list-top-anchor" style={{ height: "1px", visibility: "hidden" }}></div>
      <PageContainer noPadding>
        {renderDeleteConfirmationDialog()}
        <div className="h-full flex flex-col">
          <div className="p-6 border-b bg-white sticky top-0 z-10 shadow-sm">
            {renderHeader()}
            {renderTagManagement()}
          </div>
          
          <div className="flex-1 bg-gray-50">
            {isLeadsLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="mt-2 text-gray-500">Loading leads...</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {viewMode === 'table' ? (
                  <div className="flex-1 overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                              <TableHead 
                                key={header.id}
                                className="whitespace-nowrap bg-white sticky top-0"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              data-lead-id={row.original.id}
                              className={cn(
                                "hover:bg-gray-50/50 transition-colors duration-200",
                                row.getIsSelected() ? "bg-primary/5" : "bg-white"
                              )}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell 
                                  key={cell.id}
                                  className="whitespace-nowrap"
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Search className="h-8 w-8 mb-2 opacity-50" />
                                <p>No leads found. Try adjusting your filters.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {leadsData?.results?.length ? (
                      leadsData.results.map((lead: any) => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))
                    ) : (
                      <div className="col-span-full flex items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Search className="h-8 w-8 mb-2 opacity-50" />
                          <p>No leads found. Try adjusting your filters.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className={page === 0 ? "opacity-50" : "hover:bg-primary hover:text-white transition-colors"}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {leadsData?.results.length
                        ? `${page * pageSize + 1}-${page * pageSize + leadsData.results.length} of ${leadsData.total}`
                        : '0 of 0'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!leadsData?.has_more}
                      className={!leadsData?.has_more ? "opacity-50" : "hover:bg-primary hover:text-white transition-colors"}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        const newSize = Number(value);
                        setPageSize(newSize);
                        setPage(0); // Reset to first page when changing page size
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[20, 50, 100, 200].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <FilterDialog />
      </PageContainer>
    </div>
  );
}

