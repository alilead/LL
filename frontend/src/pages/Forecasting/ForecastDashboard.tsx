import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forecastsAPI, Forecast, ForecastPeriod } from '@/services/api/forecasts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, Target, DollarSign, Award, Calendar,
  Loader2, CheckCircle, Send, Edit
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';

export const ForecastDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    pipeline_amount: '',
    best_case_amount: '',
    commit_amount: '',
    closed_amount: ''
  });

  // Fetch active period
  const { data: activePeriod, isLoading: isPeriodLoading } = useQuery({
    queryKey: ['forecast-periods', 'active'],
    queryFn: forecastsAPI.getActivePeriod
  });

  // Fetch my forecast
  const { data: myForecast, isLoading: isForecastLoading } = useQuery({
    queryKey: ['my-forecast', activePeriod?.id],
    queryFn: () => forecastsAPI.getMyForecast(activePeriod!.id),
    enabled: !!activePeriod
  });

  // Save forecast mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => forecastsAPI.createOrUpdateForecast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-forecast'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Forecast updated successfully'
      });
    }
  });

  // Submit forecast mutation
  const submitMutation = useMutation({
    mutationFn: (id: number) => forecastsAPI.submitForecast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-forecast'] });
      toast({
        title: 'Success',
        description: 'Forecast submitted for review'
      });
    }
  });

  const handleEdit = () => {
    if (myForecast) {
      setFormData({
        pipeline_amount: myForecast.pipeline_amount.toString(),
        best_case_amount: myForecast.best_case_amount.toString(),
        commit_amount: myForecast.commit_amount.toString(),
        closed_amount: myForecast.closed_amount.toString()
      });
    } else {
      setFormData({
        pipeline_amount: '0',
        best_case_amount: '0',
        commit_amount: '0',
        closed_amount: '0'
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!activePeriod) return;

    saveMutation.mutate({
      period_id: activePeriod.id,
      pipeline_amount: parseFloat(formData.pipeline_amount),
      best_case_amount: parseFloat(formData.best_case_amount),
      commit_amount: parseFloat(formData.commit_amount),
      closed_amount: parseFloat(formData.closed_amount)
    });
  };

  const quotaAttainment = myForecast && myForecast.quota_amount
    ? (myForecast.closed_amount / myForecast.quota_amount) * 100
    : 0;

  const finalCommit = myForecast?.manager_adjusted_commit || myForecast?.commit_amount || 0;

  if (isPeriodLoading || isForecastLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Forecast</h1>
            <p className="text-gray-600 mt-1">
              {activePeriod ? (
                <>
                  {activePeriod.period_type.charAt(0).toUpperCase() + activePeriod.period_type.slice(1)} Period: {' '}
                  {formatDate(activePeriod.start_date)} - {formatDate(activePeriod.end_date)}
                </>
              ) : (
                'No active forecast period'
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Forecast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Your Forecast</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pipeline">Pipeline Amount</Label>
                    <Input
                      id="pipeline"
                      type="number"
                      step="0.01"
                      value={formData.pipeline_amount}
                      onChange={(e) => setFormData({ ...formData, pipeline_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="best_case">Best Case Amount</Label>
                    <Input
                      id="best_case"
                      type="number"
                      step="0.01"
                      value={formData.best_case_amount}
                      onChange={(e) => setFormData({ ...formData, best_case_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commit">Commit Amount</Label>
                    <Input
                      id="commit"
                      type="number"
                      step="0.01"
                      value={formData.commit_amount}
                      onChange={(e) => setFormData({ ...formData, commit_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="closed">Closed Amount</Label>
                    <Input
                      id="closed"
                      type="number"
                      step="0.01"
                      value={formData.closed_amount}
                      onChange={(e) => setFormData({ ...formData, closed_amount: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="w-full"
                  >
                    {saveMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Forecast
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {myForecast && myForecast.status === 'draft' && (
              <Button onClick={() => submitMutation.mutate(myForecast.id)}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {myForecast && (
          <div className="flex gap-2">
            {myForecast.status === 'draft' && (
              <Badge variant="secondary">
                <Edit className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
            {myForecast.status === 'submitted' && (
              <Badge className="bg-blue-100 text-blue-800">
                <Send className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
            {myForecast.status === 'approved' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {myForecast.manager_adjusted_commit && (
              <Badge variant="outline">
                Manager Adjusted
              </Badge>
            )}
          </div>
        )}

        {/* Forecast Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(myForecast?.pipeline_amount || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total opportunity value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Best Case
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(myForecast?.best_case_amount || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Optimistic forecast</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Commit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(finalCommit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Your commitment</p>
              {myForecast?.manager_adjusted_commit && (
                <p className="text-xs text-orange-600 mt-1">
                  Manager: {formatCurrency(myForecast.manager_adjusted_commit)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Closed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(myForecast?.closed_amount || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Won deals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quota Performance */}
        {myForecast && myForecast.quota_amount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quota Attainment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Quota</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(myForecast.quota_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Closed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(myForecast.closed_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attainment</p>
                    <p className={`text-2xl font-bold ${quotaAttainment >= 100 ? 'text-green-600' : quotaAttainment >= 75 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {quotaAttainment.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${quotaAttainment >= 100 ? 'bg-green-600' : quotaAttainment >= 75 ? 'bg-blue-600' : 'bg-orange-600'}`}
                    style={{ width: `${Math.min(quotaAttainment, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!myForecast && activePeriod && (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No forecast yet</h3>
              <p className="text-gray-600 mb-4">
                Create your forecast for this period
              </p>
              <Button onClick={handleEdit}>
                <Plus className="h-4 w-4 mr-2" />
                Create Forecast
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default ForecastDashboard;
