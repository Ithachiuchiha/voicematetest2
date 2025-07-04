const CACHE_NAME = 'voice-mate-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
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

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle background sync for offline data
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1',
        taskId: data.taskId,
        scheduleId: data.scheduleId
      },
      actions: [
        {
          action: 'complete',
          title: 'Mark as Done',
          icon: '/icon-192x192.png'
        },
        {
          action: 'snooze',
          title: 'Remind in 10 min',
          icon: '/icon-192x192.png'
        },
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'complete') {
    // Mark task as complete
    if (event.notification.data && event.notification.data.taskId) {
      // This would typically make an API call to mark the task as complete
      console.log('Task marked as complete:', event.notification.data.taskId);
    }
  } else if (event.action === 'snooze') {
    // Reschedule notification for 10 minutes later
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 10);
    
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        body: event.notification.body + ' (Snoozed)',
        icon: '/icon-192x192.png',
        vibrate: [100, 50, 100]
      });
    }, 10 * 60 * 1000); // 10 minutes
  } else if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
