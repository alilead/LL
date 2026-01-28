import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Deal {
  id: number;
  name: string;
  description: string;
  amount: string;
  status: string;
  valid_until: string;
  lead_id: number;
  assigned_to_id: number;
  currency_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
}

interface DealDetailProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DealDetail({ deal, isOpen, onClose }: DealDetailProps) {
  if (!deal) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px]">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="text-xl font-semibold">{deal.name}</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm">{deal.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amount</h3>
              <p className="mt-1 text-sm">{formatCurrency(parseFloat(deal.amount))}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm capitalize">{deal.status.toLowerCase().replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
              <p className="mt-1 text-sm">{formatDate(deal.valid_until)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-sm">{formatDate(deal.created_at)}</p>
            </div>
          </div>

          {(deal.accepted_at || deal.rejected_at) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {deal.accepted_at ? 'Accepted' : 'Rejected'} At
                </h3>
                <p className="mt-1 text-sm">
                  {formatDate(deal.accepted_at || deal.rejected_at)}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
