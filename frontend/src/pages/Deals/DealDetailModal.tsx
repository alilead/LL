import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { dealsAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Deal } from './types';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Info, User, Briefcase, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import usersAPI from '@/services/users';
import { leadsAPI } from '@/services/leads';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import * as React from "react";

// X butonu olmayan özel DialogContent bileşeni oluşturalım
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {/* X butonunu kaldırdık */}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
}

export function DealDetailModal({ deal, isOpen, onClose, refetch }: DealDetailModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user and lead data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData(deal);
      
      // Fetch assigned user data
      if (deal.assigned_to_id) {
        setIsLoading(true);
        usersAPI.getUser(deal.assigned_to_id)
          .then((data: any) => {
            setAssignedUser(data);
          })
          .catch((err: any) => {
            console.error('Error fetching user:', err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      
      // Fetch lead data
      if (deal.lead_id) {
        setIsLoading(true);
        leadsAPI.getLead(deal.lead_id)
          .then((data: any) => {
            setLeadData(data.data);
          })
          .catch((err: any) => {
            console.error('Error fetching lead:', err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [deal]);

  const updateDealMutation = useMutation({
    mutationFn: (data: Partial<Deal>) => dealsAPI.update(deal!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setIsEditing(false);
      onClose();
      if (refetch) refetch();
      navigate('/deals');
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update deal',
        variant: 'destructive',
      });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: () => dealsAPI.delete(deal!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      onClose();
      if (refetch) refetch();
      navigate('/deals');
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = () => {
    setFormData(deal || {});
    setIsEditing(true);
  };

  const handleSave = () => {
    updateDealMutation.mutate(formData);
  };

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    deleteDealMutation.mutate();
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, { bg: string, text: string, border: string }> = {
      'Lead': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      'Qualified': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
      'Proposal': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      'Closed_Won': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      'Closed_Lost': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
    };
    
    return statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  };

  if (!deal) return null;
  
  const statusStyle = getStatusColor(deal.status);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-[550px] p-0 overflow-hidden rounded-xl mx-3 sm:mx-0">
        {isDeleting ? (
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <DialogTitle className="text-xl font-semibold mb-2">Delete Deal</DialogTitle>
              <p className="text-gray-500">
                Are you sure you want to delete this deal? This action cannot be undone.
              </p>
            </div>
            
            <div className="border border-gray-100 rounded-lg p-4 mb-6 bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-1">{deal.name}</h4>
              <p className="text-gray-600">{formatAmount(deal.amount)}</p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleting(false)}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Deal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`${statusStyle.bg} px-6 py-4 border-b ${statusStyle.border}`}>
              <div className="flex justify-between items-center">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-800">
                    {isEditing ? 'Edit Deal' : 'Deal Details'}
                  </DialogTitle>
                </DialogHeader>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.text} border ${statusStyle.border} bg-white/80`}>
                  {deal.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">Deal Name</label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      className="border-gray-200 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                      className="border-gray-200 focus:border-primary min-h-[100px]"
                      placeholder="Enter deal description"
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className="text-sm font-medium text-gray-700 block mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <Input
                        id="amount"
                        type="text"
                        value={formData.amount || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) return;
                          if (parts[1] && parts[1].length > 2) return;
                          setFormData({ ...formData, amount: value });
                        }}
                        className="pl-8 border-gray-200 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="valid_until" className="text-sm font-medium text-gray-700 block mb-1">Valid Until</label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until ? new Date(formData.valid_until).toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="border-gray-200 focus:border-primary"
                    />
                  </div>
                  
                  {/* Display lead information in edit mode */}
                  {leadData && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-md font-medium text-gray-800 mb-2">Customer Information</h3>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Name:</span> {leadData.first_name} {leadData.last_name}
                      </p>
                      {leadData.company && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Company:</span> {leadData.company}
                        </p>
                      )}
                      {leadData.job_title && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Position:</span> {leadData.job_title}
                        </p>
                      )}
                      {leadData.email && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Email:</span> {leadData.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Deal Name</span>
                      <p className="font-medium text-gray-800">{deal.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Amount</span>
                      <p className="font-medium text-gray-800">
                        {formatAmount(deal.amount)}
                      </p>
                    </div>
                  </div>

                  {deal.description && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="text-gray-800 whitespace-pre-wrap">{deal.description || 'No description'}</p>
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  {leadData && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="w-full">
                        <span className="text-sm text-gray-500">Customer Information</span>
                        <p className="font-medium text-gray-800">
                          {leadData.first_name} {leadData.last_name}
                        </p>
                        {leadData.company && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Company:</span> {leadData.company}
                          </p>
                        )}
                        {leadData.job_title && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Position:</span> {leadData.job_title}
                          </p>
                        )}
                        {leadData.email && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {leadData.email}
                          </p>
                        )}
                        {leadData.linkedin && (
                          <div className="flex items-center mt-1">
                            <LinkIcon className="h-3 w-3 text-blue-500 mr-1" />
                            <a href={leadData.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Assigned To</span>
                        <p className="font-medium text-gray-800">
                          {assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : (deal.assigned_to_id ? `ID: ${deal.assigned_to_id}` : 'Not assigned')}
                        </p>
                      </div>
                    </div>

                    {deal.valid_until && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Valid Until</span>
                          <p className="font-medium text-gray-800">
                            {new Date(deal.valid_until).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-gray-200 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    className="border-gray-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                  >
                    Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleEdit}
                    className="border-gray-200 hover:bg-gray-100"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
