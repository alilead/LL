/**
 * Inline Editing Component
 *
 * SALESFORCE: Click → Modal pops up → Fill form → Save → Wait → Modal closes (10+ clicks)
 * LEADLAB: Double-click → Edit → Press Enter → Done (2 seconds)
 *
 * This is HUGE for productivity!
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string | number;
  onSave: (newValue: string) => Promise<void> | void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  formatter?: (value: string) => string; // Format display value
  validator?: (value: string) => boolean | string; // Validate before save
}

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  placeholder = 'Click to edit',
  className,
  displayClassName,
  inputClassName,
  disabled = false,
  required = false,
  maxLength,
  multiline = false,
  formatter,
  validator,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value || ''));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update internal value when prop changes
  useEffect(() => {
    setCurrentValue(String(value || ''));
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setError(null);

    // Validation
    if (required && !currentValue.trim()) {
      setError('This field is required');
      return;
    }

    if (validator) {
      const validationResult = validator(currentValue);
      if (validationResult !== true) {
        setError(typeof validationResult === 'string' ? validationResult : 'Invalid value');
        return;
      }
    }

    // No change, just cancel
    if (currentValue === String(value)) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(currentValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(String(value || ''));
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const displayValue = formatter ? formatter(String(value || '')) : String(value || '');

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group relative inline-flex items-center gap-2',
          !disabled && 'cursor-pointer',
          className
        )}
        onClick={() => !disabled && setIsEditing(true)}
        title={disabled ? undefined : 'Double-click to edit'}
      >
        <span
          className={cn(
            'min-w-[60px] rounded px-2 py-1 transition-colors',
            !disabled && 'group-hover:bg-accent/50',
            !value && 'text-muted-foreground italic',
            displayClassName
          )}
        >
          {displayValue || placeholder}
        </span>
        {!disabled && (
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </span>
        )}
      </div>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={cn('relative inline-flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1">
        <InputComponent
          ref={inputRef as any}
          type={multiline ? undefined : type}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Don't close if clicking save/cancel buttons
            setTimeout(() => {
              if (!isSaving) handleCancel();
            }, 200);
          }}
          placeholder={placeholder}
          disabled={isSaving}
          maxLength={maxLength}
          rows={multiline ? 3 : undefined}
          className={cn(
            'flex-1 rounded border border-input bg-background px-2 py-1 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50',
            multiline && 'resize-none',
            inputClassName
          )}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          title="Save (Enter)"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          title="Cancel (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <span className="text-xs text-muted-foreground">
        Press Enter to save, Esc to cancel
      </span>
    </div>
  );
}

// Preset inline editors for common use cases

export function InlineEditEmail({ value, onSave, ...props }: Omit<InlineEditProps, 'type' | 'validator'>) {
  const emailValidator = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val) || 'Invalid email address';
  };

  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      type="email"
      validator={emailValidator}
      {...props}
    />
  );
}

export function InlineEditPhone({ value, onSave, ...props }: Omit<InlineEditProps, 'type' | 'formatter'>) {
  const phoneFormatter = (val: string) => {
    // Format: (123) 456-7890
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return val;
  };

  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      type="tel"
      formatter={phoneFormatter}
      {...props}
    />
  );
}

export function InlineEditCurrency({ value, onSave, ...props }: Omit<InlineEditProps, 'type' | 'formatter'>) {
  const currencyFormatter = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? val : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      type="number"
      formatter={currencyFormatter}
      {...props}
    />
  );
}

export function InlineEditTextarea({ value, onSave, ...props }: Omit<InlineEditProps, 'multiline'>) {
  return (
    <InlineEdit
      value={value}
      onSave={onSave}
      multiline={true}
      {...props}
    />
  );
}
