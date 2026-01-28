/**
 * Keyboard Macro Recorder - Record & Replay Actions!
 *
 * SALESFORCE: Repetitive tasks? Do them manually 100 times! (TORTURE!)
 * LEADLAB: Record once → Replay with one keystroke! (GENIUS!)
 *
 * Power users will worship this feature!
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface MacroAction {
  id: string;
  type: 'click' | 'keypress' | 'input' | 'navigation' | 'api_call';
  timestamp: number;
  target?: string; // CSS selector or ID
  value?: any;
  description: string;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  actions: MacroAction[];
  shortcut?: string; // e.g., "CMD+SHIFT+1"
  createdAt: Date;
  lastUsed?: Date;
  timesUsed: number;
}

interface MacroRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  currentActions: MacroAction[];
  startTime: number | null;
}

export function useKeyboardMacro() {
  const [state, setState] = useState<MacroRecorderState>({
    isRecording: false,
    isPaused: false,
    currentActions: [],
    startTime: null,
  });

  const [macros, setMacros] = useState<Macro[]>(() => {
    // Load saved macros from localStorage
    const saved = localStorage.getItem('leadlab-macros');
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          lastUsed: m.lastUsed ? new Date(m.lastUsed) : undefined,
        }));
      } catch (e) {
        console.error('Failed to load macros:', e);
      }
    }
    return [];
  });

  const actionIdRef = useRef(0);

  // Save macros to localStorage
  useEffect(() => {
    localStorage.setItem('leadlab-macros', JSON.stringify(macros));
  }, [macros]);

  // Start recording
  const startRecording = useCallback(() => {
    setState({
      isRecording: true,
      isPaused: false,
      currentActions: [],
      startTime: Date.now(),
    });
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Stop recording and save
  const stopRecording = useCallback(
    (name: string, description?: string, shortcut?: string): Macro => {
      const macro: Macro = {
        id: `macro-${Date.now()}`,
        name,
        description,
        actions: state.currentActions,
        shortcut,
        createdAt: new Date(),
        timesUsed: 0,
      };

      setMacros(prev => [...prev, macro]);

      setState({
        isRecording: false,
        isPaused: false,
        currentActions: [],
        startTime: null,
      });

      return macro;
    },
    [state.currentActions]
  );

  // Cancel recording
  const cancelRecording = useCallback(() => {
    setState({
      isRecording: false,
      isPaused: false,
      currentActions: [],
      startTime: null,
    });
  }, []);

  // Add action to current recording
  const recordAction = useCallback(
    (action: Omit<MacroAction, 'id' | 'timestamp'>) => {
      if (!state.isRecording || state.isPaused) return;

      const newAction: MacroAction = {
        ...action,
        id: `action-${actionIdRef.current++}`,
        timestamp: Date.now() - (state.startTime || 0),
      };

      setState(prev => ({
        ...prev,
        currentActions: [...prev.currentActions, newAction],
      }));
    },
    [state.isRecording, state.isPaused, state.startTime]
  );

  // Play macro
  const playMacro = useCallback(
    async (macroId: string, onAction?: (action: MacroAction) => Promise<void>) => {
      const macro = macros.find(m => m.id === macroId);
      if (!macro) return;

      // Update last used and times used
      setMacros(prev =>
        prev.map(m =>
          m.id === macroId
            ? { ...m, lastUsed: new Date(), timesUsed: m.timesUsed + 1 }
            : m
        )
      );

      // Play actions with delays
      for (let i = 0; i < macro.actions.length; i++) {
        const action = macro.actions[i];
        const nextAction = macro.actions[i + 1];

        // Execute action callback if provided
        if (onAction) {
          await onAction(action);
        }

        // Wait for the delay until next action
        if (nextAction) {
          const delay = nextAction.timestamp - action.timestamp;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    },
    [macros]
  );

  // Delete macro
  const deleteMacro = useCallback((macroId: string) => {
    setMacros(prev => prev.filter(m => m.id !== macroId));
  }, []);

  // Update macro
  const updateMacro = useCallback((macroId: string, updates: Partial<Macro>) => {
    setMacros(prev =>
      prev.map(m => (m.id === macroId ? { ...m, ...updates } : m))
    );
  }, []);

  // Duplicate macro
  const duplicateMacro = useCallback((macroId: string, newName?: string) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;

    const newMacro: Macro = {
      ...macro,
      id: `macro-${Date.now()}`,
      name: newName || `${macro.name} (Copy)`,
      createdAt: new Date(),
      timesUsed: 0,
      lastUsed: undefined,
    };

    setMacros(prev => [...prev, newMacro]);
    return newMacro;
  }, [macros]);

  // Export macro
  const exportMacro = useCallback((macroId: string): string => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return '';
    return JSON.stringify(macro, null, 2);
  }, [macros]);

  // Import macro
  const importMacro = useCallback((macroJson: string): Macro | null => {
    try {
      const imported = JSON.parse(macroJson);
      const newMacro: Macro = {
        ...imported,
        id: `macro-${Date.now()}`,
        createdAt: new Date(),
        timesUsed: 0,
        lastUsed: undefined,
      };
      setMacros(prev => [...prev, newMacro]);
      return newMacro;
    } catch (e) {
      console.error('Failed to import macro:', e);
      return null;
    }
  }, []);

  // Keyboard shortcuts for macros
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any macro shortcut matches
      macros.forEach(macro => {
        if (!macro.shortcut) return;

        // Parse shortcut (e.g., "CMD+SHIFT+1")
        const parts = macro.shortcut.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const needsMeta = parts.includes('cmd') || parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        const matches =
          e.key.toLowerCase() === key &&
          (needsMeta ? e.metaKey || e.ctrlKey : true) &&
          (needsShift ? e.shiftKey : true) &&
          (needsAlt ? e.altKey : true);

        if (matches) {
          e.preventDefault();
          playMacro(macro.id);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [macros, playMacro]);

  return {
    // Recording state
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    currentActions: state.currentActions,

    // Recording controls
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    recordAction,

    // Macros
    macros,
    playMacro,
    deleteMacro,
    updateMacro,
    duplicateMacro,

    // Import/Export
    exportMacro,
    importMacro,
  };
}

// Macro helper functions

/**
 * Record click action
 */
export function recordClick(
  target: string,
  description: string,
  recordAction: (action: Omit<MacroAction, 'id' | 'timestamp'>) => void
) {
  recordAction({
    type: 'click',
    target,
    description,
  });
}

/**
 * Record keypress action
 */
export function recordKeypress(
  key: string,
  description: string,
  recordAction: (action: Omit<MacroAction, 'id' | 'timestamp'>) => void
) {
  recordAction({
    type: 'keypress',
    value: key,
    description,
  });
}

/**
 * Record input action
 */
export function recordInput(
  target: string,
  value: any,
  description: string,
  recordAction: (action: Omit<MacroAction, 'id' | 'timestamp'>) => void
) {
  recordAction({
    type: 'input',
    target,
    value,
    description,
  });
}

/**
 * Record navigation action
 */
export function recordNavigation(
  url: string,
  description: string,
  recordAction: (action: Omit<MacroAction, 'id' | 'timestamp'>) => void
) {
  recordAction({
    type: 'navigation',
    value: url,
    description,
  });
}

/**
 * Record API call action
 */
export function recordApiCall(
  endpoint: string,
  method: string,
  data: any,
  description: string,
  recordAction: (action: Omit<MacroAction, 'id' | 'timestamp'>) => void
) {
  recordAction({
    type: 'api_call',
    value: { endpoint, method, data },
    description,
  });
}

/**
 * Macro library component
 */
import { Play, Trash2, Copy, Download, Upload, Edit, Circle } from 'lucide-react';

interface MacroLibraryProps {
  macroRecorder: ReturnType<typeof useKeyboardMacro>;
  onPlayMacro?: (macroId: string) => void;
  className?: string;
}

export function MacroLibrary({ macroRecorder, onPlayMacro, className }: MacroLibraryProps) {
  const [editingMacro, setEditingMacro] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newShortcut, setNewShortcut] = useState('');

  const handlePlay = (macroId: string) => {
    if (onPlayMacro) {
      onPlayMacro(macroId);
    } else {
      macroRecorder.playMacro(macroId);
    }
  };

  const handleExport = (macroId: string) => {
    const json = macroRecorder.exportMacro(macroId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macro-${macroId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const json = e.target?.result as string;
        macroRecorder.importMacro(json);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveEdit = (macroId: string) => {
    macroRecorder.updateMacro(macroId, {
      name: newName,
      shortcut: newShortcut || undefined,
    });
    setEditingMacro(null);
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Macro Library</h3>
        <button
          onClick={handleImport}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Recording indicator */}
      {macroRecorder.isRecording && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-red-600 fill-current animate-pulse" />
            <span className="text-sm font-medium text-red-900">
              Recording... ({macroRecorder.currentActions.length} actions)
            </span>
          </div>
        </div>
      )}

      {/* Macros list */}
      <div className="space-y-2">
        {macroRecorder.macros.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No macros yet</p>
            <p className="text-xs mt-1">Record your first macro to automate repetitive tasks!</p>
          </div>
        ) : (
          macroRecorder.macros.map(macro => (
            <div
              key={macro.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
            >
              {editingMacro === macro.id ? (
                <>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                    placeholder="Macro name"
                  />
                  <input
                    type="text"
                    value={newShortcut}
                    onChange={(e) => setNewShortcut(e.target.value)}
                    className="w-32 px-2 py-1 border rounded text-sm"
                    placeholder="CMD+SHIFT+1"
                  />
                  <button
                    onClick={() => handleSaveEdit(macro.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingMacro(null)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{macro.name}</div>
                    <div className="text-xs text-gray-500">
                      {macro.actions.length} actions
                      {macro.shortcut && ` • Shortcut: ${macro.shortcut}`}
                      {macro.timesUsed > 0 && ` • Used ${macro.timesUsed} times`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePlay(macro.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Play macro"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingMacro(macro.id);
                        setNewName(macro.name);
                        setNewShortcut(macro.shortcut || '');
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Edit macro"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => macroRecorder.duplicateMacro(macro.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Duplicate macro"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExport(macro.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Export macro"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => macroRecorder.deleteMacro(macro.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete macro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
