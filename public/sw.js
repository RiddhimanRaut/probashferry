const CACHE_NAME = "probashferry-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Let Firebase/Google API requests pass through to the network directly
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/__/auth/")) return;
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("firebaseio.com")) return;

  // Stale-while-revalidate: serve from cache immediately, update in background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);

        return cached || fetched;
      })
    )
  );
});
