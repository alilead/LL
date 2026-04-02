const DEFAULT_PROD_ORIGIN = 'https://api.the-leadlab.com'

/**
 * API origin only (e.g. https://api.the-leadlab.com), never including /api/v1.
 * Strips a mistaken trailing /api/v1 from VITE_API_URL so requests are not doubled.
 * In dev returns '' so `${origin}/api/v1/...` becomes a same-origin /api/v1 path (Vite proxy).
 */
export function getApiOrigin(): string {
  if (import.meta.env.DEV) return ''
  const raw = (import.meta.env.VITE_API_URL || DEFAULT_PROD_ORIGIN).trim().replace(/\/+$/, '')
  return raw.replace(/\/api\/v1$/i, '')
}
