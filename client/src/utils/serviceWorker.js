// Service Worker registration and management utilities

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

// Register service worker
export function registerSW() {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
        navigator.serviceWorker.ready.then(() => {
          // Service worker ready
        });
      } else {
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Notify user about update
              showUpdateNotification();
            } else {
              showOfflineReadyNotification();
            }
          }
        });
      });
    })
    .catch((error) => {
      // SW registration failed
    });
}

function checkValidServiceWorker(swUrl) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      // No internet connection - offline mode
    });
}

// Unregister service worker
export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Check if service worker is supported
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

// Get service worker registration
export async function getServiceWorkerRegistration() {
  if ('serviceWorker' in navigator) {
    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('Failed to get service worker registration:', error);
      return null;
    }
  }
  return null;
}

// Request background sync
export async function requestBackgroundSync(tag = 'offline-sync') {
  try {
    const registration = await getServiceWorkerRegistration();
    if (registration && 'sync' in registration) {
      await registration.sync.register(tag);
      return true;
    }
  } catch (error) {
    // Background sync registration failed
  }
  return false;
}

// Show update notification
function showUpdateNotification() {
  // This would integrate with your notification system
  if (window.showNotification) {
    window.showNotification(
      'App Update Available',
      'A new version is available. Refresh to update.',
      'info',
      {
        actions: [
          {
            text: 'Refresh',
            action: () => window.location.reload()
          },
          {
            text: 'Later',
            action: () => {}
          }
        ]
      }
    );
  }
}

// Show offline ready notification
function showOfflineReadyNotification() {
  if (window.showNotification) {
    window.showNotification(
      'Ready for Offline Use',
      'This app has been cached and is ready to work offline.',
      'success'
    );
  }
}

// Service worker message handling
export function setupServiceWorkerMessaging() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_UPDATED':
          // Cache updated
          break;
        case 'OFFLINE_FALLBACK':
          // Serving offline fallback
          break;
        case 'SYNC_COMPLETE':
          // Background sync complete
          break;
        default:
          // Unknown service worker message
          break;
      }
    });
  }
}

// Send message to service worker
export async function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage(message);
      return true;
    } catch (error) {
      console.error('Failed to send message to service worker:', error);
      return false;
    }
  }
  return false;
}

// Cache management utilities
export const cacheManager = {
  // Clear all caches
  async clearAll() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  },

  // Get cache size
  async getSize() {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      } catch (error) {
        console.error('Failed to get cache size:', error);
      }
    }
    return null;
  },

  // List all caches
  async list() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const cacheInfo = [];
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          cacheInfo.push({
            name: cacheName,
            entries: keys.length,
            urls: keys.map(request => request.url)
          });
        }
        
        return cacheInfo;
      } catch (error) {
        console.error('Failed to list caches:', error);
      }
    }
    return [];
  }
};

// Initialize service worker
export function initServiceWorker() {
  if (import.meta.env.PROD) {
    registerSW();
  }
  
  setupServiceWorkerMessaging();
}

export default {
  registerSW,
  unregisterSW,
  isServiceWorkerSupported,
  getServiceWorkerRegistration,
  requestBackgroundSync,
  setupServiceWorkerMessaging,
  sendMessageToSW,
  cacheManager,
  initServiceWorker
};