import React from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/axios';

interface LeadEditFormProps {
  lead: {
    id: number;
    first_name: string;
    last_name: string;
    company: string;
    job_title: string;
    location: string;
    country: string;
    email: string;
    phone: string;
    mobile: string;
    linkedin: string;
    website: string;
    sector: string;
    client_comments?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const LeadEditForm: React.FC<LeadEditFormProps> = ({ lead, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      company: lead.company || '',
      job_title: lead.job_title || '',
      location: lead.location || '',
      country: lead.country || '',
      email: lead.email || '',
      phone: lead.phone || '',
      mobile: lead.mobile || '',
      linkedin: lead.linkedin || '',
      website: lead.website || '',
      sector: lead.sector || '',
      client_comments: lead.client_comments || '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Veriyi düzgün formata dönüştür
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        company: data.company,
        job_title: data.job_title,
        location: data.location,
        country: data.country,
        email: data.email,
        telephone: data.phone, // phone -> telephone dönüşümü
        mobile: data.mobile,
        linkedin: data.linkedin,
        website: data.website,
        sector: data.sector,
        client_comments: data.client_comments,
      };
      
      
      // Doğrudan API isteği gönder - eğik çizgisiz
      const response = await api.put(`/leads/${lead.id}`, updateData);
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      await queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update lead',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">First Name</label>
          <Input {...register('first_name')} />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Last Name</label>
          <Input {...register('last_name')} />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input {...register('company')} />
          {errors.company && (
            <p className="text-sm text-red-500">{errors.company.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Job Title</label>
          <Input {...register('job_title')} />
          {errors.job_title && (
            <p className="text-sm text-red-500">{errors.job_title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input {...register('location')} />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Country</label>
          <Input {...register('country')} />
          {errors.country && (
            <p className="text-sm text-red-500">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...register('email')} />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <Input {...register('phone')} />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mobile</label>
          <Input {...register('mobile')} />
          {errors.mobile && (
            <p className="text-sm text-red-500">{errors.mobile.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">LinkedIn</label>
          <Input {...register('linkedin')} />
          {errors.linkedin && (
            <p className="text-sm text-red-500">{errors.linkedin.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Website</label>
          <Input {...register('website')} />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sector</label>
          <Input {...register('sector')} />
          {errors.sector && (
            <p className="text-sm text-red-500">{errors.sector.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Note</label>
        <Textarea 
          {...register('client_comments')} 
          className="min-h-[100px]"
          placeholder="Add a note about this lead..."
        />
        {errors.client_comments && (
          <p className="text-sm text-red-500">{errors.client_comments.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Lead'}
        </Button>
      </div>
    </form>
  );
};
