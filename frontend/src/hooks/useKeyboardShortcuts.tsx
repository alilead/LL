/**
 * Global Keyboard Shortcuts Hook
 *
 * POWER USER FEATURE:
 * - Salesforce: Mouse-only, slow navigation
 * - LeadLab: Keyboard shortcuts for everything, 10x faster
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;  // CMD on Mac
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'editing';
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation (G + letter)
    {
      key: 'g+d',
      description: 'Go to Dashboard',
      action: () => navigate('/dashboard'),
      category: 'navigation',
    },
    {
      key: 'g+l',
      description: 'Go to Leads',
      action: () => navigate('/leads'),
      category: 'navigation',
    },
    {
      key: 'g+o',
      description: 'Go to Deals (Opportunities)',
      action: () => navigate('/deals'),
      category: 'navigation',
    },
    {
      key: 'g+t',
      description: 'Go to Tasks',
      action: () => navigate('/tasks'),
      category: 'navigation',
    },
    {
      key: 'g+c',
      description: 'Go to Calendar',
      action: () => navigate('/calendar'),
      category: 'navigation',
    },
    {
      key: 'g+r',
      description: 'Go to Reports',
      action: () => navigate('/reports'),
      category: 'navigation',
    },
    {
      key: 'g+s',
      description: 'Go to Settings',
      action: () => navigate('/settings'),
      category: 'navigation',
    },

    // Quick Actions (CMD + letter)
    {
      key: 'n',
      meta: true,
      description: 'Create New Lead',
      action: () => navigate('/leads/new'),
      category: 'actions',
    },
    {
      key: 'd',
      meta: true,
      description: 'Create New Deal',
      action: () => navigate('/deals/new'),
      category: 'actions',
    },
    {
      key: 't',
      meta: true,
      description: 'Create New Task',
      action: () => navigate('/tasks/new'),
      category: 'actions',
    },
    {
      key: 'm',
      meta: true,
      description: 'Open Messages',
      action: () => navigate('/messages'),
      category: 'actions',
    },
    {
      key: 'f',
      meta: true,
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      category: 'navigation',
    },

    // Editing Shortcuts
    {
      key: 'e',
      description: 'Edit Current Item',
      action: () => {
        const editButton = document.querySelector('[data-action="edit"]') as HTMLElement;
        if (editButton) {
          editButton.click();
        } else {
          toast.error('No item selected to edit');
        }
      },
      category: 'editing',
    },
    {
      key: 's',
      meta: true,
      description: 'Save Changes',
      action: () => {
        const saveButton = document.querySelector('[data-action="save"]') as HTMLElement;
        if (saveButton) {
          saveButton.click();
        }
      },
      category: 'editing',
    },

    // Navigation within lists
    {
      key: 'j',
      description: 'Next Item',
      action: () => {
        // Focus next item in list
        const active = document.activeElement;
        if (active?.nextElementSibling) {
          (active.nextElementSibling as HTMLElement).focus();
        }
      },
      category: 'navigation',
    },
    {
      key: 'k',
      description: 'Previous Item',
      action: () => {
        // Focus previous item in list
        const active = document.activeElement;
        if (active?.previousElementSibling) {
          (active.previousElementSibling as HTMLElement).focus();
        }
      },
      category: 'navigation',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except CMD+K for search)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Allow CMD+K even in inputs
    if (isInput && !((event.metaKey || event.ctrlKey) && event.key === 'k')) {
      // But allow other CMD shortcuts
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
    }

    // Check for sequential keys (like g+d)
    const lastKey = (window as any).__lastKeyPressed;
    const currentTime = Date.now();
    const lastKeyTime = (window as any).__lastKeyTime || 0;

    // If keys pressed within 1 second, consider it a sequence
    if (lastKey && currentTime - lastKeyTime < 1000) {
      const sequence = `${lastKey}+${event.key.toLowerCase()}`;

      const shortcut = shortcuts.find(s =>
        s.key === sequence &&
        !s.meta &&
        !s.ctrl &&
        !s.shift &&
        !s.alt
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
        (window as any).__lastKeyPressed = null;
        return;
      }
    }

    // Store last key for sequential shortcuts
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      (window as any).__lastKeyPressed = event.key.toLowerCase();
      (window as any).__lastKeyTime = currentTime;
    }

    // Check for single key shortcuts
    const shortcut = shortcuts.find(s => {
      const keyMatches = s.key === event.key.toLowerCase();
      const metaMatches = s.meta ? (event.metaKey || event.ctrlKey) : true;
      const ctrlMatches = s.ctrl ? event.ctrlKey : true;
      const shiftMatches = s.shift ? event.shiftKey : true;
      const altMatches = s.alt ? event.altKey : true;

      return keyMatches && metaMatches && ctrlMatches && shiftMatches && altMatches;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts, navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Keyboard Shortcuts Help Dialog Component
export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shortcuts } = useKeyboardShortcuts();

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    editing: 'Editing',
  };

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.meta) parts.push('⌘'); // CMD symbol
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');

    // Handle sequential keys (like g+d)
    if (shortcut.key.includes('+')) {
      const keys = shortcut.key.split('+');
      return keys.map(k => k.toUpperCase()).join(' then ');
    }

    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background border-b px-6 py-4">
          <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          <p className="text-sm text-muted-foreground mt-1">Work 10x faster with keyboard shortcuts</p>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">{categoryLabels[category as keyof typeof categoryLabels]}</h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent/50">
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-3 py-1 text-xs font-semibold bg-muted rounded border">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd> to toggle this help
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
