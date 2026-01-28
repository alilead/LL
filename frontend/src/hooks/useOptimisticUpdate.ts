/**
 * Optimistic UI Updates - Instant Feedback
 *
 * SALESFORCE: Click → Spinner → Wait → Success/Error → UI updates (3-5 seconds)
 * LEADLAB: Click → UI updates instantly → Syncs in background (feels instant!)
 *
 * This is how modern apps should feel!
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface OptimisticUpdateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: any[];
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Optimistic update hook - Updates UI immediately, syncs in background
 *
 * @example
 * const updateLead = useOptimisticUpdate({
 *   mutationFn: (data) => api.updateLead(data),
 *   queryKey: ['leads'],
 *   updateFn: (oldLeads, newData) => oldLeads.map(l => l.id === newData.id ? newData : l),
 *   successMessage: 'Lead updated!',
 * });
 */
export function useOptimisticUpdate<TData = any, TVariables = any>({
  mutationFn,
  queryKey,
  updateFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: OptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, updateFn(previousData, variables));
      }

      // Return context with previous data
      return { previousData };
    },
    onError: (error: Error, variables: TVariables, context: any) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Show error toast
      if (errorMessage) {
        toast.error(errorMessage);
      }

      onError?.(error, variables);
    },
    onSuccess: (data: TData, variables: TVariables) => {
      // Show success toast
      if (successMessage) {
        toast.success(successMessage);
      }

      onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return mutation;
}

/**
 * Optimistic list operations (add, update, delete)
 */
export interface OptimisticListOptions<TItem> {
  queryKey: any[];
  getId: (item: TItem) => string | number;
}

export function useOptimisticList<TItem>({
  queryKey,
  getId,
}: OptimisticListOptions<TItem>) {
  const queryClient = useQueryClient();

  // Add item optimistically
  const addItem = useCallback(
    async (
      newItem: TItem,
      mutationFn: (item: TItem) => Promise<TItem>
    ) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot
      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      // Optimistic update
      if (previousData) {
        queryClient.setQueryData<TItem[]>(queryKey, [...previousData, newItem]);
      }

      try {
        // Perform mutation
        const result = await mutationFn(newItem);
        toast.success('Added successfully!');
        return result;
      } catch (error) {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Failed to add item');
        throw error;
      } finally {
        // Refetch
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey]
  );

  // Update item optimistically
  const updateItem = useCallback(
    async (
      updatedItem: TItem,
      mutationFn: (item: TItem) => Promise<TItem>
    ) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      if (previousData) {
        queryClient.setQueryData<TItem[]>(
          queryKey,
          previousData.map(item =>
            getId(item) === getId(updatedItem) ? updatedItem : item
          )
        );
      }

      try {
        const result = await mutationFn(updatedItem);
        toast.success('Updated successfully!');
        return result;
      } catch (error) {
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Failed to update item');
        throw error;
      } finally {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, getId]
  );

  // Delete item optimistically
  const deleteItem = useCallback(
    async (
      itemId: string | number,
      mutationFn: (id: string | number) => Promise<void>
    ) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      if (previousData) {
        queryClient.setQueryData<TItem[]>(
          queryKey,
          previousData.filter(item => getId(item) !== itemId)
        );
      }

      try {
        await mutationFn(itemId);
        toast.success('Deleted successfully!');
      } catch (error) {
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Failed to delete item');
        throw error;
      } finally {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, getId]
  );

  return {
    addItem,
    updateItem,
    deleteItem,
  };
}

/**
 * Optimistic field update - for inline editing
 */
export interface OptimisticFieldUpdateOptions<TItem> {
  queryKey: any[];
  itemId: string | number;
  getId: (item: TItem) => string | number;
}

export function useOptimisticFieldUpdate<TItem extends Record<string, any>>({
  queryKey,
  itemId,
  getId,
}: OptimisticFieldUpdateOptions<TItem>) {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const updateField = useCallback(
    async <K extends keyof TItem>(
      field: K,
      value: TItem[K],
      mutationFn: (field: K, value: TItem[K]) => Promise<void>
    ) => {
      // Mark field as pending
      setPendingUpdates(prev => new Set(prev).add(field as string));

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      // Optimistic update
      if (previousData) {
        queryClient.setQueryData<TItem[]>(
          queryKey,
          previousData.map(item =>
            getId(item) === itemId ? { ...item, [field]: value } : item
          )
        );
      }

      try {
        await mutationFn(field, value);
      } catch (error) {
        // Rollback
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error(`Failed to update ${String(field)}`);
        throw error;
      } finally {
        // Remove from pending
        setPendingUpdates(prev => {
          const next = new Set(prev);
          next.delete(field as string);
          return next;
        });

        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, itemId, getId]
  );

  const isFieldPending = useCallback(
    (field: keyof TItem) => pendingUpdates.has(field as string),
    [pendingUpdates]
  );

  return {
    updateField,
    isFieldPending,
    hasPendingUpdates: pendingUpdates.size > 0,
  };
}

/**
 * Batch optimistic updates - for bulk operations
 */
export function useBatchOptimisticUpdate<TItem>({
  queryKey,
  getId,
}: OptimisticListOptions<TItem>) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const batchUpdate = useCallback(
    async (
      itemIds: (string | number)[],
      updateFn: (item: TItem) => TItem,
      mutationFn: (ids: (string | number)[]) => Promise<void>
    ) => {
      setIsProcessing(true);

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      // Optimistic update
      if (previousData) {
        queryClient.setQueryData<TItem[]>(
          queryKey,
          previousData.map(item =>
            itemIds.includes(getId(item)) ? updateFn(item) : item
          )
        );
      }

      try {
        await mutationFn(itemIds);
        toast.success(`Updated ${itemIds.length} items successfully!`);
      } catch (error) {
        // Rollback
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Batch update failed');
        throw error;
      } finally {
        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, getId]
  );

  const batchDelete = useCallback(
    async (
      itemIds: (string | number)[],
      mutationFn: (ids: (string | number)[]) => Promise<void>
    ) => {
      setIsProcessing(true);

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      // Optimistic delete
      if (previousData) {
        queryClient.setQueryData<TItem[]>(
          queryKey,
          previousData.filter(item => !itemIds.includes(getId(item)))
        );
      }

      try {
        await mutationFn(itemIds);
        toast.success(`Deleted ${itemIds.length} items successfully!`);
      } catch (error) {
        // Rollback
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Batch delete failed');
        throw error;
      } finally {
        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey, getId]
  );

  return {
    batchUpdate,
    batchDelete,
    isProcessing,
  };
}

/**
 * Optimistic reorder - for drag & drop
 */
export function useOptimisticReorder<TItem>({
  queryKey,
}: {
  queryKey: any[];
}) {
  const queryClient = useQueryClient();

  const reorder = useCallback(
    async (
      sourceIndex: number,
      destinationIndex: number,
      mutationFn: (sourceIndex: number, destIndex: number) => Promise<void>
    ) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      // Optimistic reorder
      if (previousData) {
        const newData = [...previousData];
        const [removed] = newData.splice(sourceIndex, 1);
        newData.splice(destinationIndex, 0, removed);
        queryClient.setQueryData<TItem[]>(queryKey, newData);
      }

      try {
        await mutationFn(sourceIndex, destinationIndex);
      } catch (error) {
        // Rollback
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        toast.error('Reorder failed');
        throw error;
      } finally {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, queryKey]
  );

  return { reorder };
}
