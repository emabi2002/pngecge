'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Device } from '@/lib/device-service';

export type DeviceChangeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  device: Device;
  oldDevice?: Device;
  timestamp: Date;
};

interface UseDeviceRealtimeOptions {
  onInsert?: (device: Device) => void;
  onUpdate?: (device: Device, oldDevice: Device) => void;
  onDelete?: (device: Device) => void;
  onAnyChange?: (event: DeviceChangeEvent) => void;
  enabled?: boolean;
}

interface UseDeviceRealtimeReturn {
  isConnected: boolean;
  lastEvent: DeviceChangeEvent | null;
  eventCount: number;
  reconnect: () => void;
}

/**
 * Custom hook for real-time device subscriptions
 * Subscribes to INSERT, UPDATE, DELETE events on the devices table
 */
export function useDeviceRealtime(options: UseDeviceRealtimeOptions = {}): UseDeviceRealtimeReturn {
  const { onInsert, onUpdate, onDelete, onAnyChange, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DeviceChangeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handlePayload = useCallback((
    payload: RealtimePostgresChangesPayload<Device>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    let event: DeviceChangeEvent | null = null;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          event = {
            type: 'INSERT',
            device: newRecord as Device,
            timestamp: new Date(),
          };
          optionsRef.current.onInsert?.(newRecord as Device);
        }
        break;

      case 'UPDATE':
        if (newRecord && oldRecord) {
          event = {
            type: 'UPDATE',
            device: newRecord as Device,
            oldDevice: oldRecord as Device,
            timestamp: new Date(),
          };
          optionsRef.current.onUpdate?.(newRecord as Device, oldRecord as Device);
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          event = {
            type: 'DELETE',
            device: oldRecord as Device,
            timestamp: new Date(),
          };
          optionsRef.current.onDelete?.(oldRecord as Device);
        }
        break;
    }

    if (event) {
      setLastEvent(event);
      setEventCount((prev) => prev + 1);
      optionsRef.current.onAnyChange?.(event);
    }
  }, []);

  const subscribe = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription
    const channel = supabase
      .channel('devices-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        handlePayload
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for devices table');
        } else if (status === 'CLOSED') {
          console.log('❌ Real-time subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('⚠️ Real-time subscription error');
        }
      });

    channelRef.current = channel;
  }, [handlePayload]);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconnecting real-time subscription...');
    subscribe();
  }, [subscribe]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    subscribe();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('🔌 Unsubscribing from devices real-time...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, subscribe]);

  return {
    isConnected,
    lastEvent,
    eventCount,
    reconnect,
  };
}

/**
 * Hook for subscribing to a specific device's changes
 */
export function useDeviceRealtimeSingle(
  deviceUid: string | null,
  options: Omit<UseDeviceRealtimeOptions, 'onInsert' | 'onDelete'> = {}
): UseDeviceRealtimeReturn {
  const { onUpdate, onAnyChange, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DeviceChangeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const reconnect = useCallback(() => {
    if (!deviceUid) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription for specific device
    const channel = supabase
      .channel(`device-${deviceUid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `device_uid=eq.${deviceUid}`,
        },
        (payload) => {
          const { new: newRecord, old: oldRecord } = payload;
          if (newRecord && oldRecord) {
            const event: DeviceChangeEvent = {
              type: 'UPDATE',
              device: newRecord as Device,
              oldDevice: oldRecord as Device,
              timestamp: new Date(),
            };
            setLastEvent(event);
            setEventCount((prev) => prev + 1);
            onUpdate?.(newRecord as Device, oldRecord as Device);
            onAnyChange?.(event);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [deviceUid, onUpdate, onAnyChange]);

  useEffect(() => {
    if (!enabled || !deviceUid) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    reconnect();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, deviceUid, reconnect]);

  return {
    isConnected,
    lastEvent,
    eventCount,
    reconnect,
  };
}

export default useDeviceRealtime;
