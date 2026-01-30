'use client';

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types for real-time events
export type TableName =
  | 'voter_registrations'
  | 'dedup_matches'
  | 'exceptions'
  | 'devices'
  | 'sync_batches'
  | 'audit_logs';

export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface SubscriptionOptions {
  table: TableName;
  event?: ChangeEvent;
  filter?: string;
  onInsert?: (payload: Record<string, unknown>) => void;
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
  onDelete?: (payload: Record<string, unknown>) => void;
  onAny?: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;
}

/**
 * Subscribe to real-time changes on a table
 */
export function subscribeToTable(options: SubscriptionOptions): RealtimeSubscription {
  const { table, event = '*', filter, onInsert, onUpdate, onDelete, onAny } = options;

  const channelName = `${table}-changes-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: event,
        schema: 'public',
        table: table,
        filter: filter,
      },
      (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        // Call the appropriate handler based on event type
        if (onAny) {
          onAny(payload);
        }

        switch (payload.eventType) {
          case 'INSERT':
            if (onInsert) {
              onInsert(payload.new);
            }
            break;
          case 'UPDATE':
            if (onUpdate) {
              onUpdate({
                old: payload.old,
                new: payload.new,
              });
            }
            break;
          case 'DELETE':
            if (onDelete) {
              onDelete(payload.old);
            }
            break;
        }
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Subscribe to voter registration changes
 */
export function subscribeToVoterRegistrations(handlers: {
  onInsert?: (voter: Record<string, unknown>) => void;
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
  onDelete?: (voter: Record<string, unknown>) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'voter_registrations',
    ...handlers,
  });
}

/**
 * Subscribe to device status changes
 */
export function subscribeToDeviceStatus(handlers: {
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'devices',
    ...handlers,
  });
}

/**
 * Subscribe to deduplication matches
 */
export function subscribeToDedupMatches(handlers: {
  onInsert?: (match: Record<string, unknown>) => void;
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'dedup_matches',
    ...handlers,
  });
}

/**
 * Subscribe to exceptions
 */
export function subscribeToExceptions(handlers: {
  onInsert?: (exception: Record<string, unknown>) => void;
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'exceptions',
    ...handlers,
  });
}

/**
 * Subscribe to sync batch updates
 */
export function subscribeToSyncBatches(handlers: {
  onInsert?: (batch: Record<string, unknown>) => void;
  onUpdate?: (payload: { old: Record<string, unknown>; new: Record<string, unknown> }) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'sync_batches',
    ...handlers,
  });
}

/**
 * Subscribe to audit logs (new entries only)
 */
export function subscribeToAuditLogs(handlers: {
  onInsert?: (log: Record<string, unknown>) => void;
}): RealtimeSubscription {
  return subscribeToTable({
    table: 'audit_logs',
    event: 'INSERT',
    ...handlers,
  });
}

/**
 * Create a dashboard subscription that tracks multiple tables
 */
export function createDashboardSubscription(handlers: {
  onVoterChange?: () => void;
  onDeviceChange?: () => void;
  onDedupChange?: () => void;
  onExceptionChange?: () => void;
  onSyncChange?: () => void;
}): { unsubscribeAll: () => void } {
  const subscriptions: RealtimeSubscription[] = [];

  if (handlers.onVoterChange) {
    subscriptions.push(
      subscribeToVoterRegistrations({
        onInsert: handlers.onVoterChange,
        onUpdate: handlers.onVoterChange,
        onDelete: handlers.onVoterChange,
      })
    );
  }

  if (handlers.onDeviceChange) {
    subscriptions.push(
      subscribeToDeviceStatus({
        onUpdate: handlers.onDeviceChange,
      })
    );
  }

  if (handlers.onDedupChange) {
    subscriptions.push(
      subscribeToDedupMatches({
        onInsert: handlers.onDedupChange,
        onUpdate: handlers.onDedupChange,
      })
    );
  }

  if (handlers.onExceptionChange) {
    subscriptions.push(
      subscribeToExceptions({
        onInsert: handlers.onExceptionChange,
        onUpdate: handlers.onExceptionChange,
      })
    );
  }

  if (handlers.onSyncChange) {
    subscriptions.push(
      subscribeToSyncBatches({
        onInsert: handlers.onSyncChange,
        onUpdate: handlers.onSyncChange,
      })
    );
  }

  return {
    unsubscribeAll: () => {
      for (const sub of subscriptions) {
        sub.unsubscribe();
      }
    },
  };
}
