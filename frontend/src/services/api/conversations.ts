/**
 * Conversation Intelligence API Service
 */

import api from '@/lib/axios';

export interface CallRecording {
  id: number;
  organization_id: number;
  user_id: number;
  lead_id: number;
  recording_url: string;
  duration_seconds: number;
  transcript?: string;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  sentiment_score?: number;
  keywords?: any[];
  topics?: string[];
  action_items?: any[];
  key_moments?: any[];
  competitor_mentions?: any[];
  call_date: string;
  created_at: string;
  analyzed_at?: string;
}

export interface ConversationInsight {
  id: number;
  recording_id: number;
  insight_type: string;
  description: string;
  confidence_score: number;
  timestamp: number;
  created_at: string;
}

export interface CallAnalytics {
  total_calls: number;
  total_duration_minutes: number;
  avg_duration_minutes: number;
  avg_sentiment_score: number;
  transcribed_count: number;
  analyzed_count: number;
  common_keywords: any[];
  common_topics: string[];
}

export const conversationsAPI = {
  getRecordings: async (userId?: number, leadId?: number): Promise<CallRecording[]> => {
    const params: any = {};
    if (userId) params.user_id = userId;
    if (leadId) params.lead_id = leadId;
    const response = await api.get('/conversations/recordings', { params });
    return response.data;
  },

  getRecording: async (id: number): Promise<CallRecording> => {
    const response = await api.get(`/conversations/recordings/${id}`);
    return response.data;
  },

  createRecording: async (data: {
    user_id: number;
    lead_id: number;
    recording_url: string;
    duration_seconds: number;
    call_date: string;
  }): Promise<CallRecording> => {
    const response = await api.post('/conversations/recordings', data);
    return response.data;
  },

  transcribeRecording: async (id: number, language?: string): Promise<CallRecording> => {
    const response = await api.post(`/conversations/recordings/${id}/transcribe`, {}, {
      params: { language: language || 'en-US' }
    });
    return response.data;
  },

  analyzeRecording: async (id: number, options?: any): Promise<any> => {
    const response = await api.post(`/conversations/recordings/${id}/analyze`, {
      recording_id: id,
      analyze_sentiment: true,
      extract_keywords: true,
      identify_topics: true,
      detect_action_items: true,
      find_key_moments: true,
      detect_competitors: true,
      ...options
    });
    return response.data;
  },

  getInsights: async (recordingId: number, insightType?: string): Promise<ConversationInsight[]> => {
    const params: any = {};
    if (insightType) params.insight_type = insightType;
    const response = await api.get(`/conversations/recordings/${recordingId}/insights`, { params });
    return response.data;
  },

  getAnalytics: async (userId?: number, dateFrom?: string, dateTo?: string): Promise<CallAnalytics> => {
    const params: any = {};
    if (userId) params.user_id = userId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/conversations/analytics', { params });
    return response.data;
  },

  getCompetitorMentions: async (dateFrom?: string, dateTo?: string): Promise<any[]> => {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const response = await api.get('/conversations/analytics/competitors', { params });
    return response.data;
  }
};
