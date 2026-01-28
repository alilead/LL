/**
 * Undo/Redo System - Time Travel for CRM!
 *
 * SALESFORCE: No undo! Delete by mistake? YOU'RE SCREWED!
 * LEADLAB: CMD+Z to undo ANYTHING! Even bulk deletes! (MIND BLOWN!)
 *
 * This is how apps should work in 2025!
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Action {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  queryKeys?: any[][]; // Query keys to invalidate after undo/redo
}

interface UndoRedoState {
  past: Action[];
  future: Action[];
  isUndoing: boolean;
  isRedoing: boolean;
}

const MAX_HISTORY = 50; // Keep last 50 actions

/**
 * Global undo/redo system
 */
export function useUndoRedo() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    future: [],
    isUndoing: false,
    isRedoing: false,
  });

  // Add action to history
  const addAction = useCallback((action: Action) => {
    setState(prev => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), action],
      future: [], // Clear future when new action is performed
      isUndoing: false,
      isRedoing: false,
    }));
  }, []);

  // Undo last action
  const undo = useCallback(async () => {
    if (state.past.length === 0 || state.isUndoing) return;

    const action = state.past[state.past.length - 1];

    setState(prev => ({ ...prev, isUndoing: true }));

    try {
      await action.undo();

      // Invalidate affected queries
      if (action.queryKeys) {
        action.queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      setState(prev => ({
        past: prev.past.slice(0, -1),
        future: [action, ...prev.future],
        isUndoing: false,
        isRedoing: false,
      }));

      toast.success(`Undone: ${action.description}`);
    } catch (error) {
      console.error('Undo failed:', error);
      toast.error('Failed to undo action');
      setState(prev => ({ ...prev, isUndoing: false }));
    }
  }, [state.past, state.isUndoing, queryClient]);

  // Redo last undone action
  const redo = useCallback(async () => {
    if (state.future.length === 0 || state.isRedoing) return;

    const action = state.future[0];

    setState(prev => ({ ...prev, isRedoing: true }));

    try {
      await action.redo();

      // Invalidate affected queries
      if (action.queryKeys) {
        action.queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      setState(prev => ({
        past: [...prev.past, action],
        future: prev.future.slice(1),
        isUndoing: false,
        isRedoing: false,
      }));

      toast.success(`Redone: ${action.description}`);
    } catch (error) {
      console.error('Redo failed:', error);
      toast.error('Failed to redo action');
      setState(prev => ({ ...prev, isRedoing: false }));
    }
  }, [state.future, state.isRedoing, queryClient]);

  // Clear history
  const clear = useCallback(() => {
    setState({
      past: [],
      future: [],
      isUndoing: false,
      isRedoing: false,
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+Z / CTRL+Z - Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // CMD+SHIFT+Z / CTRL+SHIFT+Z - Redo
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // CMD+Y / CTRL+Y - Redo (alternative)
      else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo: state.past.length > 0 && !state.isUndoing,
    canRedo: state.future.length > 0 && !state.isRedoing,
    isUndoing: state.isUndoing,
    isRedoing: state.isRedoing,
    pastActions: state.past,
    futureActions: state.future,
    addAction,
    undo,
    redo,
    clear,
  };
}

/**
 * Create undoable actions for common operations
 */

// Create action
export function createAction(
  type: string,
  description: string,
  undo: () => Promise<void>,
  redo: () => Promise<void>,
  queryKeys?: any[][]
): Action {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type,
    description,
    timestamp: new Date(),
    undo,
    redo,
    queryKeys,
  };
}

// Create undoable action
export interface UndoableCreateOptions<T> {
  item: T;
  createFn: (item: T) => Promise<T>;
  deleteFn: (id: string | number) => Promise<void>;
  getId: (item: T) => string | number;
  getDescription: (item: T) => string;
  queryKeys: any[][];
}

export function createUndoableCreate<T>({
  item,
  createFn,
  deleteFn,
  getId,
  getDescription,
  queryKeys,
}: UndoableCreateOptions<T>): Action {
  let createdId: string | number;

  return createAction(
    'create',
    `Created ${getDescription(item)}`,
    async () => {
      // Undo: Delete the created item
      await deleteFn(createdId);
    },
    async () => {
      // Redo: Create the item again
      const created = await createFn(item);
      createdId = getId(created);
    },
    queryKeys
  );
}

// Update undoable action
export interface UndoableUpdateOptions<T> {
  oldItem: T;
  newItem: T;
  updateFn: (item: T) => Promise<T>;
  getDescription: (item: T) => string;
  queryKeys: any[][];
}

export function createUndoableUpdate<T>({
  oldItem,
  newItem,
  updateFn,
  getDescription,
  queryKeys,
}: UndoableUpdateOptions<T>): Action {
  return createAction(
    'update',
    `Updated ${getDescription(newItem)}`,
    async () => {
      // Undo: Restore old values
      await updateFn(oldItem);
    },
    async () => {
      // Redo: Apply new values
      await updateFn(newItem);
    },
    queryKeys
  );
}

// Delete undoable action
export interface UndoableDeleteOptions<T> {
  item: T;
  deleteFn: (id: string | number) => Promise<void>;
  createFn: (item: T) => Promise<T>;
  getId: (item: T) => string | number;
  getDescription: (item: T) => string;
  queryKeys: any[][];
}

export function createUndoableDelete<T>({
  item,
  deleteFn,
  createFn,
  getId,
  getDescription,
  queryKeys,
}: UndoableDeleteOptions<T>): Action {
  const itemId = getId(item);

  return createAction(
    'delete',
    `Deleted ${getDescription(item)}`,
    async () => {
      // Undo: Restore the deleted item
      await createFn(item);
    },
    async () => {
      // Redo: Delete the item again
      await deleteFn(itemId);
    },
    queryKeys
  );
}

// Batch delete undoable action
export interface UndoableBatchDeleteOptions<T> {
  items: T[];
  deleteFn: (ids: (string | number)[]) => Promise<void>;
  createFn: (item: T) => Promise<T>;
  getId: (item: T) => string | number;
  queryKeys: any[][];
}

export function createUndoableBatchDelete<T>({
  items,
  deleteFn,
  createFn,
  getId,
  queryKeys,
}: UndoableBatchDeleteOptions<T>): Action {
  const itemIds = items.map(getId);

  return createAction(
    'batch-delete',
    `Deleted ${items.length} items`,
    async () => {
      // Undo: Restore all deleted items
      for (const item of items) {
        await createFn(item);
      }
    },
    async () => {
      // Redo: Delete all items again
      await deleteFn(itemIds);
    },
    queryKeys
  );
}

// Field update undoable action
export interface UndoableFieldUpdateOptions<T> {
  itemId: string | number;
  field: keyof T;
  oldValue: any;
  newValue: any;
  updateFieldFn: (id: string | number, field: keyof T, value: any) => Promise<void>;
  itemName: string;
  queryKeys: any[][];
}

export function createUndoableFieldUpdate<T>({
  itemId,
  field,
  oldValue,
  newValue,
  updateFieldFn,
  itemName,
  queryKeys,
}: UndoableFieldUpdateOptions<T>): Action {
  return createAction(
    'field-update',
    `Changed ${String(field)} in ${itemName}`,
    async () => {
      // Undo: Restore old value
      await updateFieldFn(itemId, field, oldValue);
    },
    async () => {
      // Redo: Apply new value
      await updateFieldFn(itemId, field, newValue);
    },
    queryKeys
  );
}

/**
 * Undo/Redo history viewer component
 */
import { Undo2, Redo2, Clock } from 'lucide-react';

interface UndoRedoHistoryProps {
  undoRedo: ReturnType<typeof useUndoRedo>;
  className?: string;
}

export function UndoRedoHistory({ undoRedo, className }: UndoRedoHistoryProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">History</h3>
        <div className="flex gap-2">
          <button
            onClick={undoRedo.undo}
            disabled={!undoRedo.canUndo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (CMD+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={undoRedo.redo}
            disabled={!undoRedo.canRedo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (CMD+SHIFT+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Future actions (redoable) */}
        {undoRedo.futureActions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3 p-2 rounded bg-gray-50 opacity-50"
          >
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">{action.description}</p>
              <p className="text-xs text-gray-400">{formatTime(action.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Current state indicator */}
        {undoRedo.futureActions.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex-1 border-t border-blue-500" />
            <span className="text-xs font-medium text-blue-600">Current</span>
            <div className="flex-1 border-t border-blue-500" />
          </div>
        )}

        {/* Past actions (undoable) */}
        {[...undoRedo.pastActions].reverse().map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
          >
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{action.description}</p>
              <p className="text-xs text-gray-500">{formatTime(action.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {undoRedo.pastActions.length === 0 && undoRedo.futureActions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Undo/Redo toolbar buttons
 */
interface UndoRedoToolbarProps {
  undoRedo: ReturnType<typeof useUndoRedo>;
  className?: string;
}

export function UndoRedoToolbar({ undoRedo, className }: UndoRedoToolbarProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={undoRedo.undo}
        disabled={!undoRedo.canUndo}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo (CMD+Z)"
      >
        <Undo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Undo</span>
      </button>
      <button
        onClick={undoRedo.redo}
        disabled={!undoRedo.canRedo}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Redo (CMD+SHIFT+Z)"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Redo</span>
      </button>
    </div>
  );
}
