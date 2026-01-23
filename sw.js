// Service Worker for Airline Flight Tracker PWA
const CACHE_NAME = 'flight-tracker-v1';
const STATIC_CACHE_NAME = 'flight-tracker-static-v1';
const DYNAMIC_CACHE_NAME = 'flight-tracker-dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = ['/', '/index.html', '/app.js', '/manifest.json'];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.includes('/api/') || url.hostname.includes('wifi') || url.hostname.includes('inflight')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If we get a response, cache it for later
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cached response, return a custom offline response
            return new Response(
              JSON.stringify({
                error: 'offline',
                message: 'You are offline. Showing cached data if available.',
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // Handle static files with cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If it's a navigation request and we're offline, serve the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Offline and no cache available');
        });
    })
  );
});

// Handle background sync for when connectivity returns
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'flight-data-sync') {
    event.waitUntil(syncFlightData());
  }
});

// Function to sync flight data when connection is restored
function syncFlightData() {
  return self.registration
    .getNotifications()
    .then(() => {
      // Notify clients that connectivity has been restored
      return self.clients.matchAll();
    })
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CONNECTIVITY_RESTORED',
          message: 'Internet connection restored. Refreshing flight data...',
        });
      });
    });
}

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Flight status update available',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Flight Status',
        icon: '/manifest.json',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/manifest.json',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('Flight Tracker', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(self.clients.openWindow('/'));
  }
});
