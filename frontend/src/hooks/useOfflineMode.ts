/**
 * Offline Mode - Work Without Internet!
 *
 * SALESFORCE: No internet? Can't work! (USELESS!)
 * LEADLAB: Offline? Keep working! Syncs when back online! (AMAZING!)
 *
 * Sales reps in remote areas will love this!
 */

import { useState, useEffect, useCallback } from 'react';

export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'lead', 'deal', etc.
  data: any;
  timestamp: Date;
  retryCount: number;
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => {
    // Load queue from localStorage
    const saved = localStorage.getItem('leadlab-offline-queue');
    if (saved) {
      try {
        return JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem('leadlab-offline-queue', JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && syncStatus === 'idle') {
      syncQueue();
    }
  }, [isOnline, queue.length]);

  // Add item to offline queue
  const queueAction = useCallback((
    type: 'create' | 'update' | 'delete',
    entity: string,
    data: any
  ): string => {
    const id = `offline-${Date.now()}-${Math.random()}`;
    const item: OfflineQueueItem = {
      id,
      type,
      entity,
      data,
      timestamp: new Date(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, item]);
    return id;
  }, []);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Sync queue with server
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || !isOnline) return;

    setSyncStatus('syncing');

    const itemsToSync = [...queue];
    const successfulIds: string[] = [];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of itemsToSync) {
      try {
        // Mock API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500));

        // In real implementation:
        // await api[item.type](item.entity, item.data);

        successfulIds.push(item.id);
      } catch (error) {
        console.error('Failed to sync item:', error);

        // Retry logic
        if (item.retryCount < 3) {
          failedItems.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          // Max retries reached, keep in queue for manual review
          failedItems.push(item);
        }
      }
    }

    // Update queue
    setQueue(prev => [
      ...prev.filter(item => !successfulIds.includes(item.id)),
      ...failedItems,
    ]);

    setSyncStatus(failedItems.length > 0 ? 'error' : 'idle');
  }, [queue, isOnline]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    queueAction,
    removeFromQueue,
    syncQueue,
    clearQueue,
    syncStatus,
    hasOfflineChanges: queue.length > 0,
  };
}

/**
 * Offline indicator component
 */
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  offlineMode: ReturnType<typeof useOfflineMode>;
  className?: string;
}

export function OfflineIndicator({ offlineMode, className }: OfflineIndicatorProps) {
  if (offlineMode.isOnline && offlineMode.queue.length === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className={cn('fixed bottom-4 left-4 z-50', className)}>
      {!offlineMode.isOnline ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline Mode</span>
          {offlineMode.queue.length > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {offlineMode.queue.length} pending
            </span>
          )}
        </div>
      ) : offlineMode.syncStatus === 'syncing' ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Syncing changes...</span>
        </div>
      ) : offlineMode.syncStatus === 'error' ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Sync failed</span>
          <button
            onClick={offlineMode.syncQueue}
            className="ml-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
          >
            Retry
          </button>
        </div>
      ) : offlineMode.queue.length > 0 ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back online - syncing...</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Service Worker registration for PWA
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Install PWA prompt
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  return {
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
  };
}

/**
 * Install PWA banner
 */
import { Download, X } from 'lucide-react';

interface InstallPWABannerProps {
  installPrompt: ReturnType<typeof useInstallPrompt>;
}

export function InstallPWABanner({ installPrompt }: InstallPWABannerProps) {
  if (!installPrompt.showInstallPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">Install LeadLab</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get instant access and work offline by installing our app
            </p>
            <div className="flex gap-2">
              <button
                onClick={installPrompt.installPWA}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Install
              </button>
              <button
                onClick={installPrompt.dismissInstallPrompt}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={installPrompt.dismissInstallPrompt}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
