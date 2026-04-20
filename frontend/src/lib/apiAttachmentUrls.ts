import { getApiOrigin } from './apiOrigin';

/**
 * Absolute API URL for /api/v1/... paths.
 * In dev, origin is empty → same-origin `/api/v1/...` (Vite proxy).
 * In prod, uses VITE_API_URL / api.the-leadlab.com so links are not sent to the static site host.
 */
export function apiV1Url(pathAfterV1: string): string {
  const segment = pathAfterV1.startsWith('/') ? pathAfterV1 : `/${pathAfterV1}`;
  const origin = getApiOrigin();
  return origin ? `${origin}/api/v1${segment}` : `/api/v1${segment}`;
}

export function messageAttachmentUrl(storedName: string): string {
  return apiV1Url(`/messages/attachments/${encodeURIComponent(storedName)}`);
}

export function taskAttachmentUrl(taskId: number, storedName: string): string {
  return apiV1Url(`/tasks/${taskId}/attachments/${encodeURIComponent(storedName)}`);
}

export async function fetchAttachmentWithAuth(url: string): Promise<Blob> {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Attachment request failed: ${res.status}`);
  }
  return res.blob();
}

/** Open attachment in a new tab using the session token (plain href cannot send Authorization). */
export async function openAttachmentInNewTab(url: string): Promise<void> {
  const blob = await fetchAttachmentWithAuth(url);
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
