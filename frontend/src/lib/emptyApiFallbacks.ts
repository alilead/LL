/**
 * Shapes must match real API responses so React Query pages don't read empty arrays from wrong keys.
 */
export const EMPTY_LEAD_LIST_PAGE = {
  results: [] as unknown[],
  total: 0,
  page: 0,
  size: 0,
  has_more: false,
};
