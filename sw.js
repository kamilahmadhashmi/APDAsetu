/* ==========================================================================
   AEGIS-MESH / AAPDASETU - DISASTER-RESILIENT OFFLINE SERVICE WORKER
   Caches all application shells and views to allow 100% offline operation
   during extreme natural disaster cellular and power grid collapse.
   ========================================================================== */

const CACHE_NAME = 'aapdasetu-disaster-v5';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/simulation',
  '/simulation/index.html',
  '/src/styles/main.css',
  '/simulation/css/smartphone.css',
  '/src/app.js',
  '/src/i18n.js',
  '/src/modals.js',
  '/src/services/crypto-service.js',
  '/src/services/offline-store.js',
  '/src/services/location-service.js',
  '/src/services/websocket-service.js',
  '/src/services/weather-ingress.js',
  '/src/services/flood-prediction.js',
  '/src/services/identity-service.js',
  '/src/services/hardware-mesh-bridge.js',
  '/src/services/lora-packet-codec.js',
  '/src/services/offline-map-cache.js',
  '/src/components/gis-map.js',
  '/src/components/ai-vision.js',
  '/src/components/mesh-network.js',
  '/src/components/routing-solver.js',
  '/src/components/architecture.js',
  '/src/components/voice-distress-modal.js',
  '/src/components/cap-alert-dialog.js',
  '/src/vendor/leaflet.js',
  '/src/vendor/leaflet.css',
  '/src/vendor/lucide.min.js',
  '/src/vendor/chart.umd.min.js',
  '/src/vendor/tailwind.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching essential offline disaster shell assets');
      return cache.addAll(OFFLINE_URLS).catch(err => {
        console.warn('[ServiceWorker] Some assets could not be pre-cached:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let WebSocket and API POST requests pass through
  if (event.request.method !== 'GET' || event.request.url.includes('/api/v1/incidents/ingest')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately, revalidate in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
