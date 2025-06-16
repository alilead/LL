import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Deal } from '@/types/deal';
import dealsAPI from '@/services/api/deals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
  isOpen: boolean;
}

interface DealFormData {
  name: string;
  description: string;
  amount: number;
  currency_id: number;
  status: string;
  valid_until: string;
  assigned_to_id: number;
  lead_id: number;
}

interface DealUpdate {
  name?: string;
  description?: string;
  amount?: number;
  currency_id?: number;
  status?: string;
  valid_until?: string;
  assigned_to_id?: number;
  lead_id?: number;
}

export function DealDetail({ deal, onClose, isOpen }: DealDetailProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { data: dealData, isLoading } = useQuery({
    queryKey: ['deal', deal.id],
    queryFn: () => dealsAPI.getDeal(deal.id),
    initialData: deal,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache the data
  });

  const [formData, setFormData] = useState<DealFormData>({
    name: dealData.name,
    description: dealData.description || '',
    amount: dealData.amount,
    currency_id: dealData.currency_id,
    status: dealData.status,
    valid_until: dealData.valid_until || '',
    assigned_to_id: dealData.assigned_to_id,
    lead_id: dealData.lead_id,
  });

  // Update form data when dealData changes
  useEffect(() => {
    setFormData({
      name: dealData.name,
      description: dealData.description || '',
      amount: dealData.amount,
      currency_id: dealData.currency_id,
      status: dealData.status,
      valid_until: dealData.valid_until || '',
      assigned_to_id: dealData.assigned_to_id,
      lead_id: dealData.lead_id,
    });
  }, [dealData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      const updateData: DealUpdate = {
        name: formData.name,
        description: formData.description || undefined,
        amount: formData.amount,
        currency_id: formData.currency_id,
        status: formData.status,
        valid_until: formData.valid_until || undefined,
        assigned_to_id: formData.assigned_to_id,
        lead_id: formData.lead_id,
      };

      await dealsAPI.updateDeal(deal.id, updateData);
      
      // Invalidate and refetch all deal queries
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      await queryClient.invalidateQueries({ queryKey: ['deal', deal.id] });
      
      toast.success('Deal updated successfully');
      onClose(); // Just call onClose
      navigate('/deals'); // Navigate to deals page
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;

    try {
      setIsSubmitting(true);
      await dealsAPI.deleteDeal(deal.id);
      toast.success('Deal deleted successfully');
      onClose();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error(error?.response?.data?.detail || 'Failed to delete deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Deal Details - {dealData.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleSelectChange('status')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                name="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between space-x-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Deal'}
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 