const CACHE_NAME = "soil2sky-v1";
const STATIC_ASSETS = [
  "/",
  "/plan/status",
  "/plan/hardware",
  "/plan/fund",
  "/farmer",
  "/plan/metrics",
  "/plan/data-use",
  "/manifest.json",
  "/favicon.ico",
  "/samples/soil_plotA_before.csv",
  "/samples/soil_plotA_after.csv",
  "/samples/weather_plotA.json",
  "/samples/drone_plotA_before.jpg",
  "/samples/drone_plotA_after.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkRes) => {
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== "basic") {
          return networkRes;
        }
        const cloned = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return networkRes;
      }).catch(() => {
        // Offline fallback to root if navigation
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
