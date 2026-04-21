import api from '@/lib/axios';

export type CalendarIntegration = {
  id: number;
  provider: string;
  provider_account_email?: string | null;
  sync_enabled: boolean;
  sync_direction: string;
  last_synced_at?: string | null;
  last_error?: string | null;
  is_active: boolean;
};

type CalendarIntegrationListResponse = {
  items: CalendarIntegration[];
  total: number;
};

type OAuthInitResponse = {
  authorization_url: string;
  provider: string;
};

export const calendarIntegrationsAPI = {
  list: async (): Promise<CalendarIntegration[]> => {
    const response = await api.get<CalendarIntegrationListResponse>('/calendar-integrations');
    return response.data.items || [];
  },
  initOAuth: async (provider: 'google' | 'outlook' | 'apple' | 'caldav' = 'google'): Promise<OAuthInitResponse> => {
    const response = await api.post<OAuthInitResponse>('/calendar-integrations/oauth/init', { provider });
    return response.data;
  },
  disconnect: async (integrationId: number): Promise<void> => {
    await api.post(`/calendar-integrations/${integrationId}/disconnect`);
  },
  sync: async (integrationId: number): Promise<void> => {
    await api.post(`/calendar-integrations/${integrationId}/sync`);
  },
};
