/**
 * Auto-save Hook - No More Save Buttons!
 *
 * SALESFORCE: Must click Save → Wait → Hope it worked → Check for errors
 * LEADLAB: Type → Auto-saves → Done (like Google Docs)
 *
 * This is how data entry should work!
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'lodash';

export interface AutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // Debounce delay in ms (default 1000ms)
  enabled?: boolean; // Enable/disable auto-save
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  hasUnsavedChanges: boolean;
}

/**
 * Auto-save hook that saves data after a delay
 *
 * @example
 * const { status, save, reset } = useAutoSave({
 *   data: formData,
 *   onSave: async (data) => await api.updateLead(data),
 *   delay: 1000,
 * });
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 1000,
  enabled = true,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: AutoSaveOptions<T>): {
  status: AutoSaveStatus;
  save: () => Promise<void>;
  reset: () => void;
} {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const previousDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Save function
  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsSaving(true);
      setError(null);
      onSaveStart?.();

      await onSave(data);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      previousDataRef.current = data;
      onSaveSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Save failed');
      setError(error);
      onSaveError?.(error);
    } finally {
      setIsSaving(false);
    }
  }, [data, enabled, onSave, onSaveStart, onSaveSuccess, onSaveError]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(save, delay),
    [save, delay]
  );

  // Auto-save when data changes
  useEffect(() => {
    if (!enabled) return;

    // Check if data actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (hasChanged) {
      setHasUnsavedChanges(true);
      debouncedSave();
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && enabled) {
        // Cancel debounce and save immediately
        debouncedSave.cancel();
        onSave(data).catch(console.error);
      }
    };
  }, []); // Only on unmount

  // Reset function
  const reset = useCallback(() => {
    setLastSaved(null);
    setError(null);
    setHasUnsavedChanges(false);
    debouncedSave.cancel();
  }, [debouncedSave]);

  return {
    status: {
      isSaving,
      lastSaved,
      error,
      hasUnsavedChanges,
    },
    save,
    reset,
  };
}

/**
 * Auto-save indicator component
 */
interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  className?: string;
}

export function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return 'Not saved yet';

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 5) return 'Saved just now';
    if (diff < 60) return `Saved ${diff}s ago`;
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    return `Saved at ${date.toLocaleTimeString()}`;
  };

  if (status.isSaving) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Saving...
      </div>
    );
  }

  if (status.error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        Failed to save
      </div>
    );
  }

  if (status.hasUnsavedChanges) {
    return (
      <div className={`flex items-center gap-2 text-sm text-orange-600 ${className}`}>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        Unsaved changes
      </div>
    );
  }

  if (status.lastSaved) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        {formatLastSaved(status.lastSaved)}
      </div>
    );
  }

  return null;
}

/**
 * Form auto-save hook - specialized for forms
 */
export interface FormAutoSaveOptions<T extends Record<string, any>> {
  formData: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  delay?: number;
  fields?: (keyof T)[]; // Only auto-save specific fields
}

export function useFormAutoSave<T extends Record<string, any>>({
  formData,
  onSave,
  enabled = true,
  delay = 1000,
  fields,
}: FormAutoSaveOptions<T>) {
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef<T>(formData);

  // Filter data if specific fields are specified
  const getTrackedData = useCallback(() => {
    if (!fields) return formData;

    const tracked: Partial<T> = {};
    fields.forEach(field => {
      tracked[field] = formData[field];
    });
    return tracked as T;
  }, [formData, fields]);

  const trackedData = getTrackedData();

  const autoSave = useAutoSave({
    data: trackedData,
    onSave,
    delay,
    enabled: enabled && isDirty,
    onSaveSuccess: () => {
      setIsDirty(false);
      initialDataRef.current = formData;
    },
  });

  // Track if form is dirty
  useEffect(() => {
    const hasChanged = JSON.stringify(trackedData) !== JSON.stringify(initialDataRef.current);
    setIsDirty(hasChanged);
  }, [trackedData]);

  return {
    ...autoSave,
    isDirty,
    markClean: () => {
      setIsDirty(false);
      initialDataRef.current = formData;
    },
  };
}

/**
 * Save on blur hook - save when input loses focus
 */
export function useSaveOnBlur<T>(
  data: T,
  onSave: (data: T) => Promise<void>
) {
  const [isSaving, setIsSaving] = useState(false);
  const previousDataRef = useRef<T>(data);

  const handleBlur = useCallback(async () => {
    // Check if data changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (!hasChanged) return;

    try {
      setIsSaving(true);
      await onSave(data);
      previousDataRef.current = data;
    } catch (error) {
      console.error('Save on blur failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave]);

  return {
    onBlur: handleBlur,
    isSaving,
  };
}

/**
 * Prevent navigation with unsaved changes
 */
export function usePreventNavigationWithUnsaved(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
}
