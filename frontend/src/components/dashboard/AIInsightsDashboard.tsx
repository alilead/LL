import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, Users, Target, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import aiInsightsService, { AIAnalytics, HighPriorityLead } from '@/services/aiInsightsService';

const AIInsightsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [highPriorityLeads, setHighPriorityLeads] = useState<HighPriorityLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [analyticsData, priorityLeads] = await Promise.all([
        aiInsightsService.getAnalytics(),
        aiInsightsService.getHighPriorityLeads(70, 5)
      ]);

      setAnalytics(analyticsData);
      setHighPriorityLeads(priorityLeads);

      if (refresh) {
        toast.success('AI dashboard refreshed!');
      }
    } catch (error) {
      console.error('Failed to load AI dashboard:', error);
      toast.error('Error loading AI dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Insights Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No AI analysis performed yet</p>
            <Button onClick={() => loadDashboardData(true)}>
              <Brain className="w-4 h-4 mr-2" />
              Load Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Insights Overview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
            >
                          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Insights */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {analytics.total_insights}
              </div>
              <div className="text-sm text-gray-600">Total Insights</div>
            </div>

            {/* Average Quality */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {analytics.avg_quality_score}
              </div>
              <div className="text-sm text-gray-600">Avg. Quality</div>
            </div>

            {/* Average Priority */}
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {analytics.avg_priority_score}
              </div>
              <div className="text-sm text-gray-600">Avg. Priority</div>
            </div>

            {/* Average Confidence */}
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(analytics.avg_confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Avg. Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.personality_distribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: aiInsightsService.getPersonalityColor(type) }}
                    />
                    <span className="font-medium">{type} Type</span>
                    <span className="text-sm text-gray-500">
                      ({aiInsightsService.getDiscDescription(type).split(' - ')[1]})
                    </span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Priority Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High Priority Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {highPriorityLeads.length > 0 ? (
              <div className="space-y-3">
                {highPriorityLeads.map((lead) => (
                  <div key={lead.lead_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{lead.lead_name}</div>
                      <div className="text-sm text-gray-600">
                        {lead.job_title} @ {lead.company}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: aiInsightsService.getPersonalityColor(lead.personality_type) }}
                        />
                        <span className={`text-sm font-medium ${aiInsightsService.getScoreColor(lead.priority_score)}`}>
                          {Math.round(lead.priority_score)}
                        </span>
                      </div>
                      <Badge className={aiInsightsService.getConfidenceBadgeColor(lead.confidence)}>
                        {aiInsightsService.formatConfidence(lead.confidence)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No high priority leads yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Provider Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(analytics.provider_distribution).map(([provider, count]) => {
              const getProviderInfo = (p: string) => {
                switch (p) {
                  case 'gemini':
                    return { name: 'Google Gemini', color: 'text-blue-600', bgColor: 'bg-blue-50' };
                  case 'huggingface':
                    return { name: 'Hugging Face', color: 'text-orange-600', bgColor: 'bg-orange-50' };
                  case 'rule_based':
                    return { name: 'Rule-based', color: 'text-gray-600', bgColor: 'bg-gray-50' };
                  default:
                    return { name: provider, color: 'text-gray-600', bgColor: 'bg-gray-50' };
                }
              };

              const info = getProviderInfo(provider);
              
              return (
                <div key={provider} className={`text-center p-4 ${info.bgColor} rounded-lg`}>
                  <div className={`text-2xl font-bold ${info.color}`}>{count}</div>
                  <div className="text-sm text-gray-600">{info.name}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsDashboard; 