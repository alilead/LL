import { getApiOrigin } from './lib/apiOrigin';

const DEFAULT_PROD_ORIGIN = 'https://api.the-leadlab.com';

/** API origin in production (normalized). In dev, empty — use relative /api/v1. */
export const API_URL = import.meta.env.DEV ? '' : getApiOrigin() || DEFAULT_PROD_ORIGIN;
export const API_BASE_URL = API_URL; // Alias for compatibility

export { getApiOrigin } from './lib/apiOrigin';

export const APP_CONFIG = {
  apiBaseUrl: API_URL || DEFAULT_PROD_ORIGIN,
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
    login: '/signin',
    register: '/register',
    dashboard: '/dashboard',
    leads: '/leads',
    profile: '/profile',
    settings: '/settings',
  }
};

export default APP_CONFIG;