'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  subscribeToVoterRegistrations,
  subscribeToDeviceStatus,
  subscribeToDedupMatches,
  subscribeToExceptions,
  subscribeToSyncBatches,
  subscribeToAuditLogs,
  createDashboardSubscription,
  type RealtimeSubscription,
} from '@/lib/realtime';

/**
 * Hook for subscribing to voter registration changes
 */
export function useVoterRegistrationsRealtime(
  onInsert?: (voter: Record<string, unknown>) => void,
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void,
  onDelete?: (voter: Record<string, unknown>) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToVoterRegistrations({
      onInsert,
      onUpdate,
      onDelete,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onInsert, onUpdate, onDelete]);
}

/**
 * Hook for subscribing to device status changes
 */
export function useDeviceStatusRealtime(
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToDeviceStatus({
      onUpdate,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onUpdate]);
}

/**
 * Hook for subscribing to dedup match changes
 */
export function useDedupMatchesRealtime(
  onInsert?: (match: Record<string, unknown>) => void,
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToDedupMatches({
      onInsert,
      onUpdate,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onInsert, onUpdate]);
}

/**
 * Hook for subscribing to exception changes
 */
export function useExceptionsRealtime(
  onInsert?: (exception: Record<string, unknown>) => void,
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToExceptions({
      onInsert,
      onUpdate,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onInsert, onUpdate]);
}

/**
 * Hook for subscribing to sync batch changes
 */
export function useSyncBatchesRealtime(
  onInsert?: (batch: Record<string, unknown>) => void,
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToSyncBatches({
      onInsert,
      onUpdate,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onInsert, onUpdate]);
}

/**
 * Hook for subscribing to new audit logs
 */
export function useAuditLogsRealtime(
  onInsert?: (log: Record<string, unknown>) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = subscribeToAuditLogs({
      onInsert,
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [onInsert]);
}

/**
 * Hook for dashboard real-time updates
 * Returns a refresh trigger that increments when any subscribed table changes
 */
export function useDashboardRealtime() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const subscription = createDashboardSubscription({
      onVoterChange: triggerRefresh,
      onDeviceChange: triggerRefresh,
      onDedupChange: triggerRefresh,
      onExceptionChange: triggerRefresh,
      onSyncChange: triggerRefresh,
    });

    setIsConnected(true);

    return () => {
      subscription.unsubscribeAll();
      setIsConnected(false);
    };
  }, [triggerRefresh]);

  return {
    refreshTrigger,
    lastUpdate,
    isConnected,
    manualRefresh: triggerRefresh,
  };
}

/**
 * Hook for tracking connection status
 */
export function useRealtimeConnection() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Check initial connection
    const checkConnection = async () => {
      try {
        const { data, error } = await import('@/lib/supabase').then(m =>
          m.supabase.from('system_stats').select('id').limit(1)
        );

        if (error) {
          setStatus('disconnected');
        } else {
          setStatus('connected');
        }
      } catch {
        setStatus('disconnected');
      }
    };

    checkConnection();

    // Recheck periodically
    const interval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return status;
}
