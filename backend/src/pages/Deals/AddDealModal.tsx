import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  value: z.string().min(1, 'Value is required'),
  currency: z.string().min(1, 'Currency is required'),
  stage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  expected_close_date: z.string().min(1, 'Expected close date is required'),
});

type DealFormData = z.infer<typeof dealSchema>;

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: number;
}

export function AddDealModal({ isOpen, onClose, leadId }: AddDealModalProps) {
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: 'new',
      probability: 0,
      currency: 'USD',
    },
  });

  const onSubmit = async (data: DealFormData) => {
    try {
      // API çağrısı yapılacak
      const dealData = {
        ...data,
        value: parseFloat(data.value),
        lead_id: leadId,
        organization_id: user?.organization_id,
        created_by: user?.id,
      };
      
      toast.success('Deal created successfully');
      onClose();
    } catch (error) {
      toast.error('An error occurred while creating the deal');
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      New Deal
                    </Dialog.Title>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                      {/* Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          {...register('title')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          {...register('description')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Value */}
                        <div>
                          <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Value
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            id="value"
                            {...register('value')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          {errors.value && (
                            <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
                          )}
                        </div>

                        {/* Currency */}
                        <div>
                          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Currency
                          </label>
                          <select
                            id="currency"
                            {...register('currency')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="TRY">TRY</option>
                          </select>
                        </div>
                      </div>

                      {/* Stage */}
                      <div>
                        <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Stage
                        </label>
                        <select
                          id="stage"
                          {...register('stage')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="new">New</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="closed_won">Won</option>
                          <option value="closed_lost">Lost</option>
                        </select>
                      </div>

                      {/* Probability */}
                      <div>
                        <label htmlFor="probability" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Probability (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          id="probability"
                          {...register('probability', { valueAsNumber: true })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      {/* Expected Close Date */}
                      <div>
                        <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Expected Close Date
                        </label>
                        <input
                          type="date"
                          id="expected_close_date"
                          {...register('expected_close_date')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.expected_close_date && (
                          <p className="mt-1 text-sm text-red-600">{errors.expected_close_date.message}</p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          {isSubmitting ? 'Creating...' : 'Create'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
