import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI, type LeadStats } from '@/services/api/leads';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Loader2, Plus, Users, Search, X, UserPlus, Filter, Grid3X3, List, 
  BookOpen, CalendarDays, Check, AlertCircle, Mail, Phone, MapPin, 
  Building2, Briefcase, Star, MoreVertical, Edit, Trash2, Eye,
  Download, Upload, Settings, Clock, TrendingUp, ChevronDown,
  Zap, Target, UserCheck, Award, Globe
} from 'lucide-react';
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
import throttle from 'lodash/throttle';
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
  stage?: {
    id: number;
    name: string;
  };
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
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // Default to table view
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
  
  // Mobile detection
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // Global scroll position storage (survives component unmount)
  const scrollPositions = useRef<Map<string, number>>(
    (window as any).__leadListScrollPositions || new Map()
  );
  
  // Make it global so it survives component unmount
  (window as any).__leadListScrollPositions = scrollPositions.current;

  // Save scroll and navigate
  const saveScrollAndNavigate = (leadId: number) => {
    const scrollPos = window.scrollY;
    const pageKey = `page-${page}`;
    scrollPositions.current.set(pageKey, scrollPos);
    console.log(`💾 Saving scroll: ${scrollPos} for page: ${page}`);
    navigate(`/leads/${leadId}`);
  };

  // Track scroll continuously for current page
  useEffect(() => {
    const handleScroll = () => {
      const pageKey = `page-${page}`;
      scrollPositions.current.set(pageKey, window.scrollY);
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [page]);



  // Add debounced filter function
  const debouncedSetFilter = useCallback(
    debounce((column: any, value: string) => {
      column.setFilterValue(value);
    }, 300),
    []
  );

  // Fetch leads
  const { data: leadsData, isLoading: isLeadsLoading, refetch } = useQuery({
    queryKey: ['leads', selectedTag, debouncedSearchText, page, pageSize, sorting, filters],
    queryFn: async () => {
      try {
        const [sortField] = sorting.length ? [sorting[0].id] : ['created_at'];
        const sortDirection = sorting.length ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

        // Convert filters to correct format
        const formattedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            acc[key] = value.join(',');
          }
          return acc;
        }, {} as Record<string, any>);

        const params = {
          tag_id: selectedTag === 'all' ? undefined : Number(selectedTag),
          search: debouncedSearchText,
          skip: page * pageSize,
          limit: pageSize,
          sort_by: sortField,
          sort_desc: sortDirection === 'desc',
          ...formattedFilters
        };

        const response = await leadsAPI.getLeads(params);
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
        console.error('Error fetching tags:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  const tags = tagsData || [];

  // Extract unique values for filters from lead data
  useEffect(() => {
    if (leadsData?.results?.length) {
      const uniqueSectors = [...new Set(
        leadsData.results
          .map(lead => lead.sector)
          .filter(Boolean)
      )].sort();
      
      const uniqueLocations = [...new Set(
        leadsData.results
          .map(lead => lead.location)
          .filter(Boolean)
      )].sort();
      
      const uniqueSources = [...new Set(
        leadsData.results
          .map(lead => lead.source)
          .filter(Boolean)
      )].sort();
      
      const uniqueCountries = [...new Set(
        leadsData.results
          .map(lead => lead.country)
          .filter(Boolean)
      )].sort();

      setAvailableFilters({
        sector: uniqueSectors,
        location: uniqueLocations,
        source: uniqueSources,
        country: uniqueCountries
      });
    }
  }, [leadsData?.results]);

  // Restore scroll position when data loads
  useEffect(() => {
    if (leadsData?.results?.length) {
      const pageKey = `page-${page}`;
      const savedScrollPosition = scrollPositions.current.get(pageKey);
      
      console.log(`🔍 Looking for scroll position for page: ${page}`);
      console.log(`📍 Found saved position: ${savedScrollPosition}`);
      console.log(`🗂️ All saved positions:`, Array.from(scrollPositions.current.entries()));
      
      if (savedScrollPosition !== undefined && savedScrollPosition > 0) {
        console.log(`🚀 Restoring scroll to: ${savedScrollPosition}`);
        
        // Multiple restore attempts
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScrollPosition);
        });
        
        setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
          console.log(`📋 Current scroll after restore: ${window.scrollY}`);
        }, 50);
        
        setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
        }, 200);
      } else {
        console.log(`❌ No scroll position saved for page: ${page}`);
      }
    }
  }, [leadsData?.results, page]);

  // Fetch lead statistics - REMOVED because now shown in dashboard
  // const { data: leadStatsData, isLoading: isLoadingStats } = useQuery({
  //   queryKey: ['leadStats'],
  //   queryFn: leadsAPI.getLeadStats,
  //   refetchOnWindowFocus: false,
  // });

  // Lead statistics computation - REMOVED because now shown in dashboard
  // const leadStats = useMemo(() => {
  //   // ... calculation logic moved to dashboard
  // }, [leadStatsData, leadsData]);

  // Stats Cards - REMOVED because now shown in dashboard
  // const StatsCards = () => (
  //   // ... stats cards UI moved to dashboard
  // );

  // Enhanced Modern Lead Card Component
  const ModernLeadCard = ({ lead }: { lead: Lead }) => {
    const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`;
    const isSelected = Boolean(rowSelection[lead.id]);
    
    return (
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-l-4",
        isSelected ? "border-l-blue-500 shadow-md bg-blue-50/30" : "border-l-gray-200 hover:border-l-blue-400"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {lead.email && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {lead.first_name} {lead.last_name}
                </CardTitle>
                <p className="text-sm text-gray-600 font-medium truncate">{lead.job_title}</p>
                <p className="text-sm text-gray-500 truncate flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  {lead.company}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isSelected}
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
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => saveScrollAndNavigate(lead.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Lead
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent 
          className="pt-0 space-y-4"
          onClick={() => saveScrollAndNavigate(lead.id)}
        >
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            {lead.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-blue-500" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                <span className="truncate">{lead.location}</span>
              </div>
            )}
          </div>

          {/* Tags and Badges */}
          <div className="flex flex-wrap gap-2">
            {lead.sector && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Briefcase className="w-3 h-3 mr-1" />
                {lead.sector}
              </Badge>
            )}
            {lead.source && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                {lead.source}
              </Badge>
            )}
            {lead.country && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Globe className="w-3 h-3 mr-1" />
                {lead.country}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Added {format(new Date(lead.created_at), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-gray-600">Priority</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Modern Header Component
  const ModernHeader = () => (
    <div className="bg-white border-b shadow-sm">
      <div className="px-6 py-4">
        {/* Top Row - Title and Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Leads Management
            </h1>
            <p className="text-gray-600 mt-1">Manage and track your potential customers</p>
          </div>
          <div className="flex items-center space-x-3">

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => navigate('new')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards moved to Dashboard */}

        {/* Filters and Search Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, company, or email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Tag Filter */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-48 h-10 bg-gray-50 border-gray-200">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Filter by tag" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Leads</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <Button 
              variant="outline" 
              onClick={() => setIsFiltersOpen(true)}
              className="h-10 bg-gray-50 border-gray-200 hover:bg-gray-100"
            >
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
              {Object.values(filters).some(f => f.length > 0) && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  Active
                </Badge>
              )}
            </Button>
          </div>

          {/* View Mode and Actions */}
          <div className="flex items-center space-x-3">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0); // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Page Info */}
            {leadsData?.total ? (
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md border">
                Page {page + 1} of {Math.ceil(leadsData.total / pageSize)} 
                <span className="text-gray-400 ml-1">
                  ({((page * pageSize) + 1)}-{Math.min((page + 1) * pageSize, leadsData.total)} of {leadsData.total})
                </span>
              </div>
            ) : null}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Bulk Actions */}
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center space-x-2 animate-in slide-in-from-right duration-300">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {Object.keys(rowSelection).length} selected
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Group
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Mutation helper functions
  const handleMutationError = (error: MutationError, defaultMessage: string) => {
    console.error('Mutation error:', error);
    return error?.message || error?.response?.data?.detail || defaultMessage;
  };

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
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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
      console.log('Adding leads to tag:', { lead_ids, tag_id });
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
        description: 'Group created and leads assigned successfully',
      });
    },
    onError: (error: MutationError) => {
      console.error('Error in addTagToLeadsMutation:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to assign leads to group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update selectedLeads when rowSelection changes
  useEffect(() => {
    if (!leadsData?.results) return;

    const selectedLeadIds = Object.keys(rowSelection).map(id => parseInt(id));
    const selected = leadsData.results.filter(lead => selectedLeadIds.includes(lead.id));

    console.log('Row selection changed:', {
      rowSelection,
      dataLength: leadsData?.results?.length,
      selectedLeadIds,
      selected
    });
    
    setSelectedLeads(selected);
  }, [rowSelection, leadsData?.results]);

  // Reset selections when page changes
  useEffect(() => {
    setRowSelection({});
    setSelectedLeads([]);
  }, [page, pageSize]);

  const handleCreateGroup = async () => {
    console.log('🚀 handleCreateGroup called');
    console.log('🔤 newGroupName:', newGroupName);
    console.log('📋 selectedLeads:', selectedLeads);
    console.log('🔢 rowSelection:', rowSelection);
    
    try {
      if (!newGroupName?.trim()) {
        console.log('❌ No group name provided');
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

      console.log('✅ validLeadIds:', validLeadIds);

      if (!validLeadIds.length) {
        console.log('❌ No valid leads selected');
        toast({
          title: 'Error',
          description: 'Please select at least one lead',
          variant: 'destructive',
        });
        return;
      }

      console.log('⏳ Starting group creation...');
      setIsLoading(true);

      console.log('🏷️ Creating tag with name:', newGroupName.trim());
      const newTag = await createTagMutation.mutateAsync({ 
        name: newGroupName.trim() 
      });

      console.log('✅ Tag created:', newTag);

      if (newTag?.id) {
        console.log('🔗 Adding leads to tag:', {
          lead_ids: validLeadIds,
          tag_id: newTag.id
        });
        await addTagToLeadsMutation.mutateAsync({
          lead_ids: validLeadIds,
          tag_id: newTag.id
        });
        console.log('✅ Leads added to tag successfully');
      }
    } catch (error: any) {
      console.error('💥 Error in handleCreateGroup:', error);
      const errorMessage = handleMutationError(error, 'Failed to create or assign group');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 handleCreateGroup finished');
    }
  };



  // Import leads from CSV
  const handleImportLeads = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('assigned_user_id', user?.id.toString() || '1');

      await leadsAPI.uploadCSV(formData);
      
      toast.success('Leads imported successfully');
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      refetch(); // Refresh the leads list
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import leads');
    } finally {
      setIsImporting(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await leadsAPI.downloadTemplate();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads-import-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <ModernHeader />
      
      <div className="w-full px-6 py-6 space-y-6">
        {isLeadsLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600 font-medium">Loading your leads...</p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {leadsData?.results?.length ? (
              leadsData.results.map((lead: Lead) => (
                <ModernLeadCard key={lead.id} lead={lead} />
              ))
            ) : (
              <div className="col-span-full">
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first lead or adjusting your filters.</p>
                    <Button onClick={() => navigate('new')} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Lead
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card className="w-full overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={Object.keys(rowSelection).length === leadsData?.results?.length}
                        onCheckedChange={(value) => {
                          if (value) {
                            const newSelection = {};
                            leadsData?.results?.forEach((lead: Lead) => {
                              newSelection[lead.id] = true;
                            });
                            setRowSelection(newSelection);
                          } else {
                            setRowSelection({});
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsData?.results?.map((lead: Lead) => {
                    const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`;
                    const isSelected = Boolean(rowSelection[lead.id]);
                    
                    return (
                      <TableRow 
                        key={lead.id} 
                        className={cn(
                          "hover:bg-gray-50 cursor-pointer transition-colors",
                          isSelected && "bg-blue-50"
                        )}
                        onClick={() => saveScrollAndNavigate(lead.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(value) => {
                              const newSelection = { ...rowSelection };
                              if (value) {
                                newSelection[lead.id] = true;
                              } else {
                                delete newSelection[lead.id];
                              }
                              setRowSelection(newSelection);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{lead.job_title}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.company}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.email ? (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 mr-2 text-blue-500" />
                              {lead.email}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-green-500" />
                              {lead.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.sector && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {lead.sector}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(new Date(lead.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => saveScrollAndNavigate(lead.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {leadsData?.results?.length ? (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {page * pageSize + 1}-{page * pageSize + leadsData.results.length} of {leadsData.total} leads
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, Math.ceil((leadsData.total || 0) / pageSize)) }, (_, i) => {
                  const pageNum = page - 2 + i;
                  if (pageNum < 0 || pageNum >= Math.ceil((leadsData.total || 0) / pageSize)) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!leadsData?.has_more}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Dialogs and Modals */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group for {Object.keys(rowSelection).length} selected leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
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
              disabled={!newGroupName.trim() || Object.keys(rowSelection).length === 0 || isLoading}
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

      {/* Advanced Filters Dialog */}
      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Filter leads by multiple criteria to find exactly what you're looking for
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Sector</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableFilters.sector.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={filters.sector.includes(sector)}
                      onCheckedChange={() => {
                        const newFilters = { ...filters };
                        if (newFilters.sector.includes(sector)) {
                          newFilters.sector = newFilters.sector.filter(s => s !== sector);
                        } else {
                          newFilters.sector.push(sector);
                        }
                        setFilters(newFilters);
                      }}
                    />
                    <Label htmlFor={`sector-${sector}`} className="text-sm font-normal">
                      {sector}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">Location</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableFilters.location.map((location) => (
                  <div key={location} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location}`}
                      checked={filters.location.includes(location)}
                      onCheckedChange={() => {
                        const newFilters = { ...filters };
                        if (newFilters.location.includes(location)) {
                          newFilters.location = newFilters.location.filter(l => l !== location);
                        } else {
                          newFilters.location.push(location);
                        }
                        setFilters(newFilters);
                      }}
                    />
                    <Label htmlFor={`location-${location}`} className="text-sm font-normal">
                      {location}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">Source</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableFilters.source.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={filters.source.includes(source)}
                      onCheckedChange={() => {
                        const newFilters = { ...filters };
                        if (newFilters.source.includes(source)) {
                          newFilters.source = newFilters.source.filter(s => s !== source);
                        } else {
                          newFilters.source.push(source);
                        }
                        setFilters(newFilters);
                      }}
                    />
                    <Label htmlFor={`source-${source}`} className="text-sm font-normal">
                      {source}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">Country</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableFilters.country.map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country}`}
                      checked={filters.country.includes(country)}
                      onCheckedChange={() => {
                        const newFilters = { ...filters };
                        if (newFilters.country.includes(country)) {
                          newFilters.country = newFilters.country.filter(c => c !== country);
                        } else {
                          newFilters.country.push(country);
                        }
                        setFilters(newFilters);
                      }}
                    />
                    <Label htmlFor={`country-${country}`} className="text-sm font-normal">
                      {country}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilters({ sector: [], location: [], source: [], country: [] })}>
              Clear All
            </Button>
            <Button onClick={() => setIsFiltersOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import leads. You can download a template to see the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center">
              <Button 
                variant="outline" 
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsImportDialogOpen(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportLeads}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

