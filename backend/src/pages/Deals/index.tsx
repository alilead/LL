import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, DollarSign, TrendingUp, TrendingDown, BarChart4, Calendar, MoreHorizontal, Users } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { dealsAPI } from '@/services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from '@/hooks/use-toast';
import { DealDetailModal } from './DealDetailModal';
import { Deal } from './types';
import { PageContainer } from '@/components/ui/PageContainer';

const DEAL_STAGES = [
  { value: 'Lead', label: 'Lead', color: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-600', apiValue: 'Lead' },
  { value: 'Qualified', label: 'Qualified', color: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-600', apiValue: 'Qualified' },
  { value: 'Proposal', label: 'Proposal', color: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-600', apiValue: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation', color: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-600', apiValue: 'Negotiation' },
  { value: 'Closed_Won', label: 'Closed Won', color: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-600', apiValue: 'Closed Won' },
  { value: 'Closed_Lost', label: 'Closed Lost', color: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-600', apiValue: 'Closed Lost' },
];

function DealsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        const response = await dealsAPI.getAll();
        setError(null);
        return {
          items: Array.isArray(response.data) ? response.data : response.data?.items || [],
          total: Array.isArray(response.data) ? response.data.length : response.data?.total || 0
        };
      } catch (error: any) {
        console.error('Error fetching deals:', error);
        setError('Failed to load deals');
        return { items: [], total: 0 };
      }
    },
  });

  // Deal analytics
  const dealAnalytics = useMemo(() => {
    if (!dealsData?.items) return null;

    const deals = dealsData.items;
    const getAmount = (deal: Deal) => parseFloat(deal.amount) || 0;

    // Status eşleşmelerini kontrol eden yardımcı fonksiyon
    const matchesStatus = (deal: Deal, status: string) => {
      return deal.status === status || 
             (status === 'Closed_Won' && deal.status === 'Closed Won') ||
             (status === 'Closed_Lost' && deal.status === 'Closed Lost');
    };

    return {
      totalValue: deals.reduce((sum, deal) => sum + getAmount(deal), 0),
      totalDeals: deals.length,
      wonDeals: deals.filter(deal => matchesStatus(deal, 'Closed_Won')).length,
      wonValue: deals
        .filter(deal => matchesStatus(deal, 'Closed_Won'))
        .reduce((sum, deal) => sum + getAmount(deal), 0),
      lostDeals: deals.filter(deal => matchesStatus(deal, 'Closed_Lost')).length,
      lostValue: deals
        .filter(deal => matchesStatus(deal, 'Closed_Lost'))
        .reduce((sum, deal) => sum + getAmount(deal), 0),
      stageAnalytics: DEAL_STAGES.map(stage => ({
        stage: stage.label,
        value: stage.value,
        count: deals.filter(deal => matchesStatus(deal, stage.value)).length,
        amount: deals
          .filter(deal => matchesStatus(deal, stage.value))
          .reduce((sum, deal) => sum + getAmount(deal), 0),
      })),
    };
  }, [dealsData?.items]);

  const updateDealMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) => {
      return dealsAPI.update(data.id, { status: data.status });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: 'Success',
        description: 'Deal status updated successfully',
      });
    },
    onError: (error: any) => {
      console.error('Update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update deal status',
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStage = result.source.droppableId;
    const destinationStage = result.destination.droppableId;
    
    if (sourceStage === destinationStage) return;

    const dealId = parseInt(result.draggableId);
    
    // API için doğru formatta status değeri belirleyelim
    const stageInfo = DEAL_STAGES.find(stage => stage.value === destinationStage);
    
    if (!stageInfo) {
      console.error('Unknown destination stage:', destinationStage);
      toast({
        title: 'Error',
        description: 'Unknown deal stage',
        variant: 'destructive',
      });
      return;
    }
    
    // API'ye gönderilecek değeri kullan
    const apiStatus = stageInfo.apiValue;
    
    // Log detaylı bilgileri
      dealId,
      sourceStage,
      destinationStage,
      apiStatus,
    });

    // Güncellemek için toast göster
    toast({
      title: 'Updating...',
      description: `Moving deal to ${stageInfo.label}`,
    });

    // API'ye apiValue değerini gönderelim
    updateDealMutation.mutate({ id: dealId, status: apiStatus });
  };

  // Filter deals by search term
  const filteredDeals = dealsData?.items?.filter((deal: Deal) =>
    deal.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group deals by stage
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    // Backend "Closed Won" formatında gönderiyor, ama frontend "Closed_Won" olarak filtreliyor
    // Bu yüzden her iki formatı da kontrol edelim
    acc[stage.value] = filteredDeals?.filter(
      (deal: Deal) => {
        // Önce kendi formatımızı kontrol edelim
        if (deal.status === stage.value) {
          return true;
        }
        
        // Backend formatını kontrol edelim
        if (stage.value === 'Closed_Won' && deal.status === 'Closed Won') {
          return true;
        }
        
        if (stage.value === 'Closed_Lost' && deal.status === 'Closed Lost') {
          return true;
        }
        
        return false;
      }
    ) || [];
    return acc;
  }, {} as Record<string, Deal[]>);

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Deals Pipeline</h1>
            <p className="text-gray-500 mt-1">Manage and track your sales opportunities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search deals..."
                className="pl-9 h-10 bg-white border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => navigate('/deals/new')} 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white h-10 px-4"
            >
              <Plus className="h-4 w-4" /> New Deal
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
            <p className="text-gray-500">Loading deals...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-600 flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : dealAnalytics ? (
          <>
            {/* Analytics Cards - Enhanced with more visual appeal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                  <h3 className="text-sm font-medium text-blue-700 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Pipeline Overview
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {formatAmount(dealAnalytics.totalValue.toString())}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">{dealAnalytics.totalDeals} Total Deals</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                      <BarChart4 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2">
                  <h3 className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Won Deals
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-emerald-600">
                        {formatAmount(dealAnalytics.wonValue.toString())}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">{dealAnalytics.wonDeals} Deals</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-rose-50 border-b border-rose-100 px-4 py-2">
                  <h3 className="text-sm font-medium text-rose-700 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Lost Deals
                  </h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-rose-600">
                        {formatAmount(dealAnalytics.lostValue.toString())}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-500">{dealAnalytics.lostDeals} Deals</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                      <TrendingDown className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stage Analytics - Enhanced with more visual hierarchy */}
            <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden mb-8">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-gray-500" /> Pipeline Analysis
                </h2>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {dealAnalytics.stageAnalytics.map((stage) => (
                    <div 
                      key={stage.stage} 
                      className={`text-center p-4 rounded-lg ${DEAL_STAGES.find(s => s.label === stage.stage)?.color || 'bg-gray-50'} border ${DEAL_STAGES.find(s => s.label === stage.stage)?.borderColor || 'border-gray-200'}`}
                    >
                      <p className={`text-sm font-medium mb-1 ${DEAL_STAGES.find(s => s.label === stage.stage)?.textColor || 'text-gray-700'}`}>
                        {stage.stage}
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {formatAmount(stage.amount.toString())}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        {stage.count} {stage.count === 1 ? 'Deal' : 'Deals'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Kanban Board - Enhanced styling */}
            <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 px-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" /> Deal Stages
              </h2>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {DEAL_STAGES.map((stage) => (
                    <Droppable key={stage.value} droppableId={stage.value}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex flex-col gap-3"
                        >
                          <div className={`p-3 rounded-lg ${stage.color} border ${stage.borderColor} shadow-sm`}>
                            <h3 className={`font-medium ${stage.textColor} flex items-center justify-between`}>
                              <span>{stage.label}</span>
                              <span className="text-sm bg-white/80 px-2 py-0.5 rounded-full">
                                {dealsByStage[stage.value]?.length || 0}
                              </span>
                            </h3>
                          </div>

                          <div className="flex flex-col gap-2 min-h-[300px]">
                            {dealsByStage[stage.value]?.length === 0 ? (
                              <div className="h-24 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                <p className="text-sm text-gray-400">No deals</p>
                              </div>
                            ) : (
                              dealsByStage[stage.value]?.map((deal: Deal, dealIndex: number) => (
                                <Draggable
                                  key={deal.id.toString()}
                                  draggableId={deal.id.toString()}
                                  index={dealIndex}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="border border-gray-200 bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                                      onClick={() => {
                                        setSelectedDeal(deal);
                                        setIsDetailOpen(true);
                                      }}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-800">{deal.name}</h4>
                                        <button className="text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 rounded-full p-1 focus:outline-none">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <p className={`text-sm font-medium mb-3 ${stage.textColor}`}>
                                        {formatAmount(deal.amount)}
                                      </p>
                                      
                                      {deal.description && (
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                          {deal.description}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-col gap-1.5 mt-3">
                                        {deal.lead_name && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Users className="h-3 w-3 text-gray-400" />
                                            <span className="truncate">{deal.lead_name}</span>
                                          </div>
                                        )}
                                        
                                        {deal.company_name && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                              <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                            </svg>
                                            <span className="truncate">{deal.company_name}</span>
                                          </div>
                                        )}
                                        
                                        {deal.valid_until && (
                                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            <span>Valid until: {new Date(deal.valid_until).toLocaleDateString()}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="mt-3 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                          <span className="text-gray-500">Pipeline Progress</span>
                                          <span className={`font-medium ${stage.textColor}`}>
                                            {DEAL_STAGES.findIndex(s => s.value === stage.value) + 1}/{DEAL_STAGES.length}
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                          <div 
                                            className={`h-1.5 rounded-full ${stage.textColor.replace('text', 'bg')}`}
                                            style={{ 
                                              width: `${Math.round(((DEAL_STAGES.findIndex(s => s.value === stage.value) + 1) / DEAL_STAGES.length) * 100)}%` 
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
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
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Deals Found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first deal</p>
            <Button 
              onClick={() => navigate('/deals/new')} 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white mx-auto"
            >
              <Plus className="h-4 w-4" /> Create New Deal
            </Button>
          </div>
        )}

        <DealDetailModal
          deal={selectedDeal}
          isOpen={isDetailOpen}
          onClose={() => {
            setSelectedDeal(null);
            setIsDetailOpen(false);
          }}
        />
      </div>
    </PageContainer>
  );
}

export { DealsPage };