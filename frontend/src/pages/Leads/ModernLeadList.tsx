import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Loader2, Plus, Users, Search, Filter, Grid3X3, List, 
  BookOpen, Check, Mail, MapPin, Building2, Briefcase, 
  Star, MoreVertical, Edit, Trash2, Eye, Download, Upload,
  Clock, TrendingUp, Zap, Target, UserCheck, Globe
} from 'lucide-react';

// Services
import { leadsAPI } from '@/services/leads';
import { getTags } from '@/services/tags';

// Components
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Utils
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types
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

export function ModernLeadList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rowSelection, setRowSelection] = useState({});
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Fetch leads
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['leads', selectedTag, searchText, page, pageSize],
    queryFn: async () => {
      const params = {
        tag_id: selectedTag === 'all' ? undefined : Number(selectedTag),
        search: searchText,
        skip: page * pageSize,
        limit: pageSize,
        sort_by: 'created_at',
        sort_desc: true,
      };
      return await leadsAPI.getLeads(params);
    },
    refetchOnWindowFocus: false,
  });

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    refetchOnWindowFocus: false,
  });

  const tags = tagsData || [];

  // Modern Lead Card Component
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
                  <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
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
          onClick={() => navigate(`/leads/${lead.id}`)}
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
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => navigate('new')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-900">{leadsData?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Qualified</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.floor((leadsData?.total || 0) * 0.35)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Hot Prospects</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.floor((leadsData?.total || 0) * 0.15)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Conversion Rate</p>
                  <p className="text-2xl font-bold text-orange-900">23.4%</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <SelectContent>
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
            </Button>
          </div>

          {/* View Mode and Actions */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button 
                variant={viewMode === 'cards' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      
      <div className="p-6">
        {isLeadsLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600 font-medium">Loading your leads...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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

      {/* Create Group Dialog */}
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
              <label htmlFor="groupName" className="text-sm font-medium">Group Name</label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setIsCreateGroupOpen(false);
                setNewGroupName('');
                setRowSelection({});
                toast({ title: "Success", description: "Group created successfully!" });
              }}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 