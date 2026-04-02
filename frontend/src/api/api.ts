/**
 * Shared API client for modules under `src/api/` (messages, reports, etc.).
 * Uses the same Vite dev proxy + prod VITE_API_URL as the rest of the app.
 */
export { default } from '@/lib/axios';
