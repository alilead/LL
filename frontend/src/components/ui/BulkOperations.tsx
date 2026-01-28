/**
 * Bulk Operations Component
 *
 * SALESFORCE: Select one → Edit → Save → Select another → Edit → Save (SLOW!)
 * LEADLAB: Select all → Bulk edit → Save once → Done (10x FASTER!)
 *
 * Power users LOVE this!
 */

import { useState, useCallback } from 'react';
import {
  Check,
  X,
  Trash2,
  Archive,
  Mail,
  Tag,
  UserPlus,
  Download,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import toast from 'react-hot-toast';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (selectedIds: string[]) => Promise<void> | void;
  variant?: 'default' | 'destructive' | 'success';
  requiresConfirmation?: boolean;
  confirmMessage?: string;
}

interface BulkOperationsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  totalCount?: number;
  entityName?: string; // e.g., "leads", "deals"
  actions?: BulkAction[];
  className?: string;
}

export function BulkOperationsBar({
  selectedIds,
  onClearSelection,
  totalCount,
  entityName = 'items',
  actions = [],
  className,
}: BulkOperationsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = useCallback(async (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    // Confirmation
    if (action.requiresConfirmation) {
      const message = action.confirmMessage ||
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedIds.length} ${entityName}?`;

      if (!window.confirm(message)) return;
    }

    try {
      setIsProcessing(true);
      await action.action(selectedIds);
      toast.success(`${action.label} completed for ${selectedIds.length} ${entityName}`);
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action.label.toLowerCase()}`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, entityName, onClearSelection]);

  if (selectedIds.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'bg-primary text-primary-foreground rounded-lg shadow-2xl',
        'border border-primary-foreground/20',
        'px-6 py-3',
        'flex items-center gap-4',
        'animate-in slide-in-from-bottom-4',
        className
      )}
    >
      {/* Selection Count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-primary-foreground/20 rounded-full">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold">
            {selectedIds.length} {entityName} selected
          </div>
          {totalCount && (
            <div className="text-xs opacity-80">
              {selectedIds.length} of {totalCount}
            </div>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-primary-foreground/20" />

      {/* Quick Actions */}
      {actions.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            {actions.slice(0, 3).map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium',
                  'transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  action.variant === 'destructive'
                    ? 'hover:bg-destructive/20'
                    : action.variant === 'success'
                    ? 'hover:bg-green-500/20'
                    : 'hover:bg-primary-foreground/10'
                )}
                title={action.label}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  action.icon
                )}
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>

          {/* More Actions Dropdown */}
          {actions.length > 3 && (
            <>
              <div className="h-6 w-px bg-primary-foreground/20" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
                    disabled={isProcessing}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span>More</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {actions.slice(3).map((action, index) => (
                    <div key={action.id}>
                      {index > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => handleAction(action)}
                        className={cn(
                          action.variant === 'destructive' && 'text-destructive'
                        )}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </>
      )}

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium hover:bg-primary-foreground/10 transition-colors ml-2"
        title="Clear selection"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  );
}

// Hook for managing bulk selection
export function useBulkSelection<T extends { id: string | number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string | number) => {
    const idStr = String(id);
    setSelectedIds(prev =>
      prev.includes(idStr)
        ? prev.filter(i => i !== idStr)
        : [...prev, idStr]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => String(item.id)));
    }
  }, [items, selectedIds.length]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string | number) => {
    return selectedIds.includes(String(id));
  }, [selectedIds]);

  const isAllSelected = selectedIds.length === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    selectedCount: selectedIds.length,
  };
}

// Checkbox component for bulk selection
export function BulkSelectCheckbox({
  checked,
  onChange,
  indeterminate = false,
  className,
  ...props
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        ref={(input) => {
          if (input) input.indeterminate = indeterminate;
        }}
        className={cn(
          'w-4 h-4 rounded border-gray-300 text-primary',
          'focus:ring-2 focus:ring-primary focus:ring-offset-0',
          'cursor-pointer',
          className
        )}
        {...props}
      />
    </div>
  );
}

// Common bulk actions for leads
export const leadBulkActions: BulkAction[] = [
  {
    id: 'assign',
    label: 'Assign Owner',
    icon: <UserPlus className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Show modal to select owner
      console.log('Assign to:', ids);
    },
  },
  {
    id: 'tag',
    label: 'Add Tags',
    icon: <Tag className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Show modal to add tags
      console.log('Add tags to:', ids);
    },
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Show email composer
      console.log('Send email to:', ids);
    },
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Export to CSV
      console.log('Export:', ids);
    },
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Archive items
      console.log('Archive:', ids);
    },
    requiresConfirmation: true,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    action: async (ids) => {
      // TODO: Delete items
      console.log('Delete:', ids);
    },
    variant: 'destructive',
    requiresConfirmation: true,
    confirmMessage: 'This action cannot be undone. Delete selected items?',
  },
];
