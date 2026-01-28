import api from './axios';

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitee: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface CalendlyEventType {
  uri: string;
  name: string;
  duration: number;
  scheduling_url: string;
  description_plain?: string;
  color?: string;
  active: boolean;
}

interface CalendlyUser {
  uri: string;
  name: string;
  email: string;
  timezone: string;
  avatar_url?: string;
  scheduling_url: string;
}

class CalendlyService {
  private baseURL = 'https://api.calendly.com';
  
  // OAuth URL'sini oluştur
  getAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'default'
    });
    
    return `https://auth.calendly.com/oauth/authorize?${params.toString()}`;
  }

  // Access token al
  async exchangeCodeForToken(code: string) {
    try {
      const response = await api.post('/calendly/token', { code });
      return response.data;
    } catch (error) {
      console.error('Calendly token exchange error:', error);
      throw error;
    }
  }

  // Kullanıcı bilgilerini getir
  async getCurrentUser(): Promise<CalendlyUser> {
    try {
      const response = await api.get('/calendly/user');
      return response.data;
    } catch (error) {
      console.error('Calendly get user error:', error);
      throw error;
    }
  }

  // Event types'ları getir
  async getEventTypes(): Promise<CalendlyEventType[]> {
    try {
      const response = await api.get('/calendly/event-types');
      return response.data.collection || [];
    } catch (error) {
      console.error('Calendly get event types error:', error);
      throw error;
    }
  }

  // Scheduled events'ları getir
  async getScheduledEvents(startDate?: string, endDate?: string): Promise<CalendlyEvent[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('min_start_time', startDate);
      if (endDate) params.append('max_start_time', endDate);
      
      const response = await api.get(`/calendly/events?${params.toString()}`);
      return response.data.collection || [];
    } catch (error) {
      console.error('Calendly get events error:', error);
      throw error;
    }
  }

  // Calendly bağlantısını kontrol et
  async checkConnection(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Calendly bağlantısını kaldır
  async disconnect(): Promise<void> {
    try {
      await api.delete('/calendly/disconnect');
    } catch (error) {
      console.error('Calendly disconnect error:', error);
      throw error;
    }
  }
}

export const calendlyService = new CalendlyService();
export type { CalendlyEvent, CalendlyEventType, CalendlyUser }; 