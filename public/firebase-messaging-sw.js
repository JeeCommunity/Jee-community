self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

const CACHE_NAME = 'jee-comm-cache-v1';

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optionally cache the response here
        return response;
      })
      .catch(() => {
        // Fallback for offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response('You are currently offline. Please check your internet connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
