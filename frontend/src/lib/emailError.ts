import axios from 'axios';

type EmailErrorDetail = {
  code?: string;
  message?: string;
  retryable?: boolean;
};

export function extractEmailErrorMessage(error: unknown): { title: string; description: string } {
  const axiosDetail = axios.isAxiosError(error) ? (error.response?.data?.detail as EmailErrorDetail | string | undefined) : undefined;
  const detailMessage = typeof axiosDetail === 'string' ? axiosDetail : axiosDetail?.message;
  const retryableHint = typeof axiosDetail === 'object' && axiosDetail?.retryable ? ' This appears temporary. Please try again.' : '';
  const codeHint = typeof axiosDetail === 'object' && axiosDetail?.code ? ` [${axiosDetail.code}]` : '';
  const fallback = error instanceof Error ? error.message : 'Please try again.';

  return {
    title: `Failed to send email${codeHint}`,
    description: `${detailMessage || fallback}${retryableHint}`,
  };
}
