// Service Worker for Push Notifications
const CACHE_NAME = 'techverse-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/img/logo-192.png',
  '/img/logo-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event (basic caching strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'TechVerse Notification',
    body: 'You have a new notification',
    icon: '/img/logo-192.png',
    badge: '/img/badge-72.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    timestamp: notificationData.timestamp || Date.now(),
    vibrate: notificationData.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log('Notification displayed successfully');
      })
      .catch((error) => {
        console.error('Error displaying notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  // Handle different actions
  let url = '/';
  
  if (action) {
    switch (action) {
      case 'view-order':
        url = notificationData.url || `/orders/${notificationData.orderId}`;
        break;
      case 'track-order':
        url = `/orders/${notificationData.orderId}/tracking`;
        break;
      case 'shop-now':
        url = notificationData.url || '/products';
        break;
      case 'view-product':
        url = `/admin/products/${notificationData.productId}`;
        break;
      case 'restock':
        url = `/admin/inventory/${notificationData.productId}`;
        break;
      case 'review-activity':
        url = '/account/security';
        break;
      case 'secure-account':
        url = '/account/security/settings';
        break;
      case 'save-offer':
        // Handle saving offer locally
        saveOfferLocally(notificationData);
        return;
      case 'dismiss':
        return;
      default:
        url = notificationData.url || '/';
    }
  } else {
    // Default click behavior
    url = notificationData.url || '/';
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal analytics
  const notificationData = event.notification.data || {};
  
  // Send analytics data (if needed)
  if (notificationData.type) {
    // You could send this to your analytics service
    console.log('Notification dismissed:', notificationData.type);
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

// Message event (communication with main thread)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Helper functions
function saveOfferLocally(offerData) {
  // Save offer to IndexedDB or localStorage
  try {
    const offers = JSON.parse(localStorage.getItem('savedOffers') || '[]');
    offers.push({
      ...offerData,
      savedAt: Date.now()
    });
    localStorage.setItem('savedOffers', JSON.stringify(offers));
    console.log('Offer saved locally:', offerData);
  } catch (error) {
    console.error('Error saving offer locally:', error);
  }
}

async function handleBackgroundSync() {
  try {
    // Handle any pending offline actions
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await processAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Error processing background sync action:', error);
      }
    }
  } catch (error) {
    console.error('Error in background sync:', error);
  }
}

async function getPendingActions() {
  // Get pending actions from IndexedDB
  return [];
}

async function processAction(action) {
  // Process the action (API call, etc.)
  console.log('Processing action:', action);
}

async function removePendingAction(actionId) {
  // Remove processed action from IndexedDB
  console.log('Removing processed action:', actionId);
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');