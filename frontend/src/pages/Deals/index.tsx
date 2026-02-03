import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Grid3X3,
  List,
  Kanban,
  Settings,
  Download,
  Star,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { PageContainer } from '@/components/layout/PageContainer';
import dealsAPI from '@/services/api/deals';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from './types';
import { DealDetailModal } from './DealDetailModal';

// Professional deal stages with enterprise colors
const DEAL_STAGES = [
  { 
    value: 'Lead', 
    label: 'Lead', 
    color: 'bg-gray-50', 
    borderColor: 'border-gray-300', 
    textColor: 'text-gray-800',
    badgeColor: 'bg-gray-200 text-gray-800',
    icon: Star,
    description: 'Initial prospect contact',
    probability: 10
  },
  { 
    value: 'Qualified', 
    label: 'Qualified', 
    color: 'bg-indigo-50', 
    borderColor: 'border-indigo-300', 
    textColor: 'text-indigo-800',
    badgeColor: 'bg-indigo-200 text-indigo-800',
    icon: Target,
    description: 'Prospect meets criteria',
    probability: 25
  },
  { 
    value: 'Proposal', 
    label: 'Proposal', 
    color: 'bg-yellow-50', 
    borderColor: 'border-yellow-400', 
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-200 text-yellow-800',
    icon: Clock,
    description: 'Formal proposal submitted',
    probability: 50
  },
  { 
    value: 'Negotiation', 
    label: 'Negotiation', 
    color: 'bg-orange-50', 
    borderColor: 'border-orange-400', 
    textColor: 'text-orange-800',
    badgeColor: 'bg-orange-200 text-orange-800',
    icon: Zap,
    description: 'Terms under discussion',
    probability: 75
  },
  { 
    value: 'Closed Won', 
    label: 'Closed Won', 
    color: 'bg-green-50', 
    borderColor: 'border-green-400', 
    textColor: 'text-green-800',
    badgeColor: 'bg-green-200 text-green-800',
    icon: CheckCircle2,
    description: 'Deal successfully closed',
    probability: 100
  },
  { 
    value: 'Closed Lost', 
    label: 'Closed Lost', 
    color: 'bg-red-50', 
    borderColor: 'border-red-400', 
    textColor: 'text-red-800',
    badgeColor: 'bg-red-200 text-red-800',
    icon: XCircle,
    description: 'Deal was not successful',
    probability: 0
  }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Deals' },
  { value: 'my-deals', label: 'My Deals' },
  { value: 'high-value', label: 'High Value (>$10k)' },
  { value: 'hot-leads', label: 'Hot Leads' },
  { value: 'closing-soon', label: 'Closing Soon' },
  { value: 'overdue', label: 'Overdue' }
];

export const DealsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filter states
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState('all');

  // Data fetching
  const { data: dealsData, isLoading, refetch } = useQuery({
    queryKey: ['deals', searchTerm, selectedFilter],
    queryFn: () => dealsAPI.getDeals(),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Mutations
  const updateDealMutation = useMutation({
    mutationFn: ({ dealId, stage }: { dealId: number; stage: string }) =>
      dealsAPI.updateDeal(dealId, { status: stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Success', description: 'Deal updated successfully' });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: (dealId: number) => dealsAPI.deleteDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Success', description: 'Deal deleted successfully' });
    },
  });

  // Data processing - support both { items, total } and nested { data: { items } }
  const rawDeals = dealsData?.items ?? dealsData?.data?.items ?? (Array.isArray(dealsData?.data) ? dealsData.data : []) ?? [];
  const allDeals: Deal[] = Array.isArray(rawDeals) ? rawDeals : [];

  // Filter deals based on search term and selected filter
  const deals = React.useMemo(() => {
    let filtered = allDeals;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((deal: Deal) => 
        deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.amount?.toString().includes(searchTerm)
      );
    }

    // Apply selected filter
    switch (selectedFilter) {
      case 'my-deals':
        if (user?.id) {
          filtered = filtered.filter((deal: Deal) => deal.assigned_to_id === user.id);
        }
        break;
      case 'high-value':
        filtered = filtered.filter((deal: Deal) => parseFloat(deal.amount) > 10000);
        break;
      case 'hot-leads':
        filtered = filtered.filter((deal: Deal) => 
          deal.status === 'Qualified' || deal.status === 'Proposal'
        );
        break;
      case 'closing-soon':
        filtered = filtered.filter((deal: Deal) => {
          if (!deal.valid_until) return false;
          const closeDate = new Date(deal.valid_until);
          const today = new Date();
          const diffTime = closeDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays >= 0;
        });
        break;
      case 'overdue':
        filtered = filtered.filter((deal: Deal) => {
          if (!deal.valid_until) return false;
          const closeDate = new Date(deal.valid_until);
          const today = new Date();
          return closeDate < today && deal.status !== 'Closed Won' && deal.status !== 'Closed Lost';
        });
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Apply advanced filters
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((deal: Deal) => {
        const dealDate = new Date(deal.created_at);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;
        
        if (fromDate && dealDate < fromDate) return false;
        if (toDate && dealDate > toDate) return false;
        return true;
      });
    }

    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter((deal: Deal) => {
        const amount = parseFloat(deal.amount);
        const min = amountRange.min ? parseFloat(amountRange.min) : null;
        const max = amountRange.max ? parseFloat(amountRange.max) : null;
        
        if (min && amount < min) return false;
        if (max && amount > max) return false;
        return true;
      });
    }

    if (selectedStages.length > 0) {
      filtered = filtered.filter((deal: Deal) => selectedStages.includes(deal.status));
    }

    return filtered;
  }, [allDeals, searchTerm, selectedFilter, user?.id, dateRange, amountRange, selectedStages]);
  
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage.value] = deals.filter((deal: Deal) => deal.status === stage.value);
    return acc;
  }, {} as Record<string, Deal[]>);

  // Analytics calculations
  const analytics = {
    totalDeals: deals.length,
    totalValue: deals.reduce((sum: number, deal: Deal) => sum + parseFloat(deal.amount), 0),
    wonDeals: deals.filter((deal: Deal) => deal.status === 'Closed Won').length,
    wonValue: deals
      .filter((deal: Deal) => deal.status === 'Closed Won')
      .reduce((sum: number, deal: Deal) => sum + parseFloat(deal.amount), 0),
    conversionRate: deals.length > 0 ? 
      (deals.filter((deal: Deal) => deal.status === 'Closed Won').length / deals.length) * 100 : 0,
    avgDealSize: deals.length > 0 ?
      deals.reduce((sum: number, deal: Deal) => sum + parseFloat(deal.amount), 0) / deals.length : 0
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageInfo = (status: string) => {
    return DEAL_STAGES.find(stage => stage.value === status) || DEAL_STAGES[0];
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const dealId = parseInt(draggableId);
    const newStage = destination.droppableId;

    updateDealMutation.mutate({ dealId, stage: newStage });
  };

  const handleDealSelect = (dealId: number) => {
    if (selectedDeals.includes(dealId)) {
      setSelectedDeals(selectedDeals.filter(id => id !== dealId));
    } else {
      setSelectedDeals([...selectedDeals, dealId]);
    }
  };

  const handleBulkDelete = () => {
    selectedDeals.forEach(dealId => {
      deleteDealMutation.mutate(dealId);
    });
    setSelectedDeals([]);
  };

  // Export deals to CSV
  const handleExportDeals = () => {
    if (!deals || deals.length === 0) {
      toast({
        title: "No deals to export",
        description: "Please add some deals first or adjust your filters.",
        variant: "destructive"
      });
      return;
    }

    const csvHeaders = ['ID', 'Name', 'Description', 'Amount', 'Status', 'Lead Name', 'Company', 'Valid Until'];
    const csvData = deals.map(deal => [
      deal.id,
      `"${deal.name.replace(/"/g, '""')}"`,
      `"${(deal.description || '').replace(/"/g, '""')}"`,
      deal.amount,
      deal.status,
      `"${deal.lead_name || 'N/A'}"`,
      `"${deal.company_name || 'N/A'}"`,
      deal.valid_until || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `deals-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `${deals.length} deals exported to CSV file.`
      });
    }
  };

  // Professional Analytics Dashboard
  const AnalyticsCards = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Key performance metrics for your sales pipeline</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="p-2 bg-slate-100 rounded-lg mr-3">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
          <div>
                <p className="text-sm font-medium text-gray-600">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalValue)}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {analytics.totalDeals} active opportunities
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Closed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.wonValue)}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {analytics.wonDeals} deals won this period
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Conversion rate this quarter
        </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Deal Size</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.avgDealSize)}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Mean opportunity value
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Professional Deal Card Component - Fixed Text Overflow Issues
  const DealCard = ({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) => {
    const stageInfo = getStageInfo(deal.status);
    const StageIcon = stageInfo.icon;

    return (
      <Card className={`group hover:shadow-md transition-all duration-200 ${isDragging ? 'shadow-xl border-indigo-200 transform rotate-1' : ''} cursor-pointer bg-white border-gray-200 hover:border-gray-300 h-[200px] overflow-hidden`}>
        <CardContent className="p-3 h-full flex flex-col">
          <div className="flex items-start justify-between mb-2 min-h-0 pt-2">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded ${stageInfo.color}`}>
                  <StageIcon className="h-3 w-3 text-gray-800" />
                </div>
                <Badge variant="secondary" className="bg-gray-200 text-gray-800 text-xs font-medium border-0 px-2 py-1 max-w-[100px] truncate">
                  {deal.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-1 max-w-[160px] truncate">
                {deal.lead_name || deal.name || 'Unknown Deal'}
              </h3>
              <p className="text-lg font-bold text-gray-900 mb-2 truncate max-w-[160px]">
                ${deal.amount?.toLocaleString() || '0'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex-shrink-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-3 w-3" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />

          {/* Date Section */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs truncate max-w-[140px]">
                Close: {deal.valid_until ? new Date(deal.valid_until).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Progress</span>
              <span className="text-xs text-gray-500">{getStageInfo(deal.status).probability}%</span>
            </div>
            <Progress value={getStageInfo(deal.status).probability} className="w-full h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Table View Component
  const TableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Deals Table</h2>
        <p className="text-sm text-gray-600 mt-1">All deals in a sortable table format</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <Checkbox />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deals.map((deal) => {
              const stageInfo = getStageInfo(deal.status);
              const StageIcon = stageInfo.icon;
              
              return (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox 
                      checked={selectedDeals.includes(deal.id)}
                      onCheckedChange={() => handleDealSelect(deal.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-lg ${stageInfo.color} mr-3`}>
                        <StageIcon className={`h-4 w-4 ${stageInfo.textColor}`} />
                      </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{deal.name}</div>
                        <div className="text-sm text-gray-500">ID: {deal.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-[150px] truncate">{deal.company_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-[150px] truncate">{deal.lead_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(parseFloat(deal.amount))}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${stageInfo.badgeColor} text-xs`}>
                      {stageInfo.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {deal.valid_until ? new Date(deal.valid_until).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsDetailOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/deals/${deal.id}/edit`)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDealMutation.mutate(deal.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Deals List</h2>
        <p className="text-sm text-gray-600 mt-1">Compact list view of all deals</p>
      </div>
      <div className="divide-y divide-gray-200">
        {deals.map((deal) => {
          const stageInfo = getStageInfo(deal.status);
          const StageIcon = stageInfo.icon;
          
          return (
            <div key={deal.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => {
              setSelectedDeal(deal);
              setIsDetailOpen(true);
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                   <Checkbox 
                     checked={selectedDeals.includes(deal.id)}
                     onCheckedChange={() => handleDealSelect(deal.id)}
                   />
                  
                  <div className={`p-2 rounded-lg ${stageInfo.color} flex-shrink-0`}>
                    <StageIcon className={`h-4 w-4 ${stageInfo.textColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{deal.name}</h3>
                      <Badge className={`${stageInfo.badgeColor} text-xs flex-shrink-0`}>
                        {stageInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      {deal.company_name && (
                        <span className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{deal.company_name}</span>
                        </span>
                      )}
                      {deal.lead_name && (
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{deal.lead_name}</span>
                        </span>
                      )}
                      {deal.valid_until && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(deal.valid_until).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
            </div>

                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(deal.amount))}</div>
                    <div className="text-xs text-gray-500">{stageInfo.probability}% probability</div>
              </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/deals/${deal.id}/edit`);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDealMutation.mutate(deal.id);
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Kanban View Component - Full Screen Version
  const KanbanView = () => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Drag and drop deals between stages</p>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage.value] || [];
              const StageIcon = stage.icon;

              return (
                <div key={stage.value} className="min-w-0 w-full">
                  <div className="mb-4">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`p-1.5 rounded-lg ${stage.color} border ${stage.borderColor} flex-shrink-0`}>
                            <StageIcon className={`h-3 w-3 ${stage.textColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{stage.label}</h3>
                            <p className="text-xs text-gray-500 truncate">{stage.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{stageDeals.length}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {formatCurrency(stageDeals.reduce((sum, deal) => sum + parseFloat(deal.amount), 0))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-medium text-gray-700">{stage.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className={`h-1 rounded-full ${stage.value === 'Lead' ? 'bg-gray-400' : stage.value === 'Qualified' ? 'bg-indigo-400' : stage.value === 'Proposal' ? 'bg-yellow-400' : stage.value === 'Negotiation' ? 'bg-orange-400' : stage.value === 'Closed Won' ? 'bg-green-400' : 'bg-red-400'}`}
                          style={{ width: `${stage.probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <Droppable droppableId={stage.value}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[300px] max-h-[500px] overflow-y-auto p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-gray-50 border-2 border-dashed border-gray-300' : ''
                        }`}
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <DealCard deal={deal} isDragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {stageDeals.length === 0 && (
                          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                            <div className="text-center">
                              <StageIcon className="h-5 w-5 mx-auto mb-1 opacity-50" />
                              <p className="text-[10px]">No deals</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );

  // Main Component Return - Full Screen Layout
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="h-full max-w-none p-4 space-y-4 w-full">
        {/* Professional Header - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Deal Management</h1>
                <p className="text-gray-600">Track and manage your sales opportunities through the pipeline</p>
              </div>
              
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ['deals'] });
                          refetch();
                        }}
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh deal data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        onClick={handleExportDeals}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export pipeline data to CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button onClick={() => navigate('/deals/new')} className="bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
                                        </div>
                                        </div>
                                      </div>
                                    </div>

        {/* Analytics - Full Width */}
        <AnalyticsCards />

        {/* Professional Toolbar - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Row 1: Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Filter deals" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`whitespace-nowrap transition-colors ${
                      showFilters 
                        ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Advanced Filters</span>
                  </Button>
                          </div>
                        </div>

              {/* Row 2: View Controls and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* View Tabs */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium hidden sm:inline">View:</span>
                  <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <TabsList className="grid w-full max-w-[240px] grid-cols-3 bg-gray-100 border-0 h-8">
                      <TabsTrigger 
                        value="kanban" 
                        className="flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 px-1.5 py-1 text-xs sm:text-sm min-w-0 h-6"
                      >
                        <Kanban className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">Pipeline</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="table" 
                        className="flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 px-1.5 py-1 text-xs sm:text-sm min-w-0 h-6"
                      >
                        <Grid3X3 className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">Table</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="list" 
                        className="flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 px-1.5 py-1 text-xs sm:text-sm min-w-0 h-6"
                      >
                        <List className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">List</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Selected Items Actions */}
                {selectedDeals.length > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border">
                    <span className="text-sm text-gray-700 font-medium">
                      {selectedDeals.length} selected
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkDelete} 
                      className="bg-white text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      placeholder="To" 
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      className="text-xs"
                    />
                  </div>
                </div>
                
                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                      className="text-xs"
                    />
                  </div>
                </div>
                
                {/* Deal Stages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deal Stages</label>
                  <Select 
                    value={selectedStages.join(',')} 
                    onValueChange={(value) => setSelectedStages(value ? value.split(',') : [])}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select stages" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Actions */}
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: '', to: '' });
                      setAmountRange({ min: '', max: '' });
                      setSelectedStages([]);
                      setAssignedTo('all');
                    }}
                    className="flex-1 text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="flex-1 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Full Width */}
        <div className="min-h-[700px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading deals...</p>
              </div>
            </div>
          ) : deals.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first deal or adjust your filters.</p>
                <Button onClick={() => navigate('/deals/new')} className="bg-blue-600 text-white border border-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Deal
            </Button>
          </div>
            </Card>
          ) : (
            <Tabs value={viewMode} className="w-full">
              <TabsContent value="kanban" className="mt-0">
                <KanbanView />
              </TabsContent>
              
              <TabsContent value="table" className="mt-0">
                <TableView />
              </TabsContent>
              
              <TabsContent value="list" className="mt-0">
                <ListView />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Deal Detail Modal */}
        <DealDetailModal
          deal={selectedDeal}
          isOpen={isDetailOpen}
          onClose={() => {
          setIsDetailOpen(false);
            setSelectedDeal(null);
          }}
        refetch={refetch}
        />
      </div>
  );
};