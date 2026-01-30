'use client';

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New content available, refresh to update');
            // Optionally show a notification to the user
            dispatchEvent(new CustomEvent('pwa-update-available'));
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    console.log('[PWA] All service workers unregistered');
    return true;
  } catch (error) {
    console.error('[PWA] Failed to unregister service workers:', error);
    return false;
  }
}

/**
 * Check if app is installed as PWA
 */
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return;
    }
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  });
}

/**
 * Save data for offline sync
 */
export async function saveForOfflineSync(data: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pngec-brs-offline', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-registrations')) {
        db.createObjectStore('pending-registrations', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-registrations'], 'readwrite');
      const store = transaction.objectStore('pending-registrations');

      const addRequest = store.add({
        data,
        timestamp: new Date().toISOString(),
      });

      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => {
        console.log('[PWA] Data saved for offline sync');
        resolve();
      };
    };
  });
}

/**
 * Get pending offline data count
 */
export async function getPendingOfflineCount(): Promise<number> {
  return new Promise((resolve) => {
    const request = indexedDB.open('pngec-brs-offline', 1);

    request.onerror = () => resolve(0);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('pending-registrations')) {
        resolve(0);
        return;
      }

      const transaction = db.transaction(['pending-registrations'], 'readonly');
      const store = transaction.objectStore('pending-registrations');
      const countRequest = store.count();

      countRequest.onerror = () => resolve(0);
      countRequest.onsuccess = () => resolve(countRequest.result);
    };
  });
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string = 'sync-registrations'): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PWA] Background sync failed:', error);
    return false;
  }
}

/**
 * Check for app updates
 */
export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
}
