import api from './axios';

export interface HealthCheck {
  status: string;
  version: string;
  database: {
    status: string;
    latency: number;
  };
  cache: {
    status: string;
    latency: number;
  };
}

let healthCheckInterval: number | null = null;

export const startHealthMonitoring = (interval: number = 60000) => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  const checkHealth = async () => {
    try {
      const response = await api.get('/health');
      const health = response.data;

      if (health.status !== 'healthy') {
        console.error('API health check failed:', health);
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  // İlk kontrolü hemen yap
  checkHealth();
  
  // Periyodik kontrolleri başlat
  healthCheckInterval = window.setInterval(checkHealth, interval);

  // Sayfa kapandığında interval'i temizle
  window.addEventListener('beforeunload', () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
  });
};

export const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

export const checkHealth = async (): Promise<HealthCheck> => {
  const response = await api.get('/health');
  return response.data;
};

export default {
  checkHealth,
  startHealthMonitoring,
  stopHealthMonitoring
};
