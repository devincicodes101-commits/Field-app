const CACHE = "field-service-v1";
const SHELL = ["/", "/dashboard", "/login", "/offline"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const { request } = e;
  // Only handle GET requests
  if (request.method !== "GET") return;
  // Skip non-http(s)
  if (!request.url.startsWith("http")) return;
  // Skip Supabase API calls (always need fresh data)
  if (request.url.includes("supabase.co")) return;

  e.respondWith(
    fetch(request)
      .then(res => {
        // Cache successful navigation responses
        if (res.ok && request.mode === "navigate") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(cached =>
          cached ?? caches.match("/offline")
        )
      )
  );
});