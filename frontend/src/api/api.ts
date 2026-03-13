import axios from 'axios';

// API base URL
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create Axios instance
export const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If token expired, logout (don't redirect on login endpoint - let form show error)
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
