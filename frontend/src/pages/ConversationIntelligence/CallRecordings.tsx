import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsAPI, CallRecording } from '@/services/api/conversations';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import {
  Phone, Play, FileText, TrendingUp, MessageSquare, Users,
  Clock, CheckCircle, Loader2, AlertCircle, Mic
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const CallRecordings: React.FC = () => {
  const navigate = useNavigate();

  // Fetch recordings
  const { data: recordings, isLoading } = useQuery({
    queryKey: ['call-recordings'],
    queryFn: () => conversationsAPI.getRecordings()
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['call-analytics'],
    queryFn: () => conversationsAPI.getAnalytics()
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      processing: { variant: 'default', icon: Loader2, label: 'Processing' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
      failed: { variant: 'destructive', icon: AlertCircle, label: 'Failed' }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <Badge variant={style.variant} className={status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
        <Icon className={`h-3 w-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {style.label}
      </Badge>
    );
  };

  const getSentimentBadge = (score?: number) => {
    if (score === undefined || score === null) return null;

    let color = 'bg-gray-100 text-gray-800';
    let label = 'Neutral';

    if (score > 0.3) {
      color = 'bg-green-100 text-green-800';
      label = 'Positive';
    } else if (score < -0.3) {
      color = 'bg-red-100 text-red-800';
      label = 'Negative';
    }

    return (
      <Badge className={color}>
        {label} ({score.toFixed(2)})
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
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
            <h1 className="text-3xl font-bold">Conversation Intelligence</h1>
            <p className="text-gray-600 mt-1">
              AI-powered call analysis and insights
            </p>
          </div>
          <Button onClick={() => navigate('/conversations/upload')}>
            <Mic className="h-4 w-4 mr-2" />
            Upload Recording
          </Button>
        </div>

        {/* Analytics Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Calls</p>
                    <p className="text-2xl font-bold">{analytics.total_calls}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Analyzed</p>
                    <p className="text-2xl font-bold">{analytics.analyzed_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Duration</p>
                    <p className="text-2xl font-bold">{analytics.avg_duration_minutes.toFixed(1)}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Sentiment</p>
                    <p className="text-2xl font-bold">{analytics.avg_sentiment_score.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recordings List */}
        <div className="space-y-4">
          {recordings && recordings.length > 0 ? (
            recordings.map((recording) => (
              <Card key={recording.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/conversations/recordings/${recording.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Call Recording #{recording.id}
                        </h3>
                        {getStatusBadge(recording.transcription_status)}
                        {getSentimentBadge(recording.sentiment_score)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(recording.duration_seconds)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Lead #{recording.lead_id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{formatDate(recording.call_date)}</span>
                        </div>
                        {recording.analyzed_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Analyzed</span>
                          </div>
                        )}
                      </div>

                      {/* Keywords & Topics */}
                      {recording.keywords && recording.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {recording.keywords.slice(0, 5).map((kw: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {kw.keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {recording.topics && recording.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {recording.topics.slice(0, 3).map((topic: string, idx: number) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Transcript Preview */}
                      {recording.transcript && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {recording.transcript.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                      {recording.transcript && (
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Transcript
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Phone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No call recordings yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first call recording to get AI-powered insights
                </p>
                <Button onClick={() => navigate('/conversations/upload')}>
                  <Mic className="h-4 w-4 mr-2" />
                  Upload Recording
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default CallRecordings;
