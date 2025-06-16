import axios from 'axios';

// Export the API URL directly without modifying it
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.the-leadlab.com';

export const APP_CONFIG = {
  apiBaseUrl: API_URL,
  apiRequestConfig: {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true
  },
  defaultPageSize: 10,
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  supportedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm:ss',
  defaultLocale: 'en',
  tokenKey: 'token',
  refreshTokenKey: 'refreshToken',
  userKey: 'user',
  themeKey: 'theme',
  defaultTheme: 'light',
  routes: {
    home: '/',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    leads: '/leads',
    profile: '/profile',
    settings: '/settings',
  }
};

export default APP_CONFIG;