const CACHE_NAME = "probashferry-v5";

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
  // Only handle same-origin GET requests for static assets
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only cache same-origin requests — let all external requests (Firebase, Google APIs) pass through
  if (url.origin !== self.location.origin) return;

  // Don't cache API routes or auth handlers
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/__/")) return;

  // Stale-while-revalidate for same-origin static assets only
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
