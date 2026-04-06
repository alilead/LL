/**
 * CPQ quote routes: new + detail/edit (read-only summary until full editor exists).
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cpqAPI } from '@/services/api/cpq';

export function ModernQuoteNewPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-8">
      <Button
        type="button"
        variant="ghost"
        className="mb-4 min-h-[44px]"
        onClick={() => navigate('/cpq/quotes')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to quotes
      </Button>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">New quote</h1>
      <p className="max-w-lg text-neutral-600 dark:text-neutral-400">
        Use the quotes list to manage quotes when the full editor is available, or create via the API.
      </p>
    </div>
  );
}

export function ModernQuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isEdit = pathname.endsWith('/edit');
  const quoteId = Number(id);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => cpqAPI.getQuote(quoteId),
    enabled: Number.isFinite(quoteId) && quoteId > 0,
  });

  if (!Number.isFinite(quoteId) || quoteId <= 0) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-neutral-600 dark:text-neutral-400">Invalid quote.</p>
        <Button type="button" className="mt-4 min-h-[44px]" onClick={() => navigate('/cpq/quotes')}>
          Quotes
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-neutral-600 dark:text-neutral-400">Quote not found or unavailable.</p>
        <Button type="button" className="mt-4 min-h-[44px]" onClick={() => navigate('/cpq/quotes')}>
          Back to quotes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4 md:p-8">
      <Button
        type="button"
        variant="ghost"
        className="mb-4 min-h-[44px]"
        onClick={() => navigate('/cpq/quotes')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Quote {quote.quote_number}</h1>
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        {isEdit ? 'Edit' : 'View'} · Status: {quote.status}
      </p>
      <div className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Total</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-50">
              {quote.total_amount} {quote.currency}
            </dd>
          </div>
          {quote.valid_until && (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Valid until</dt>
              <dd>{new Date(quote.valid_until).toLocaleDateString()}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Created</dt>
            <dd>{new Date(quote.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
