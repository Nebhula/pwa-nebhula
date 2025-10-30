// Nombre del caché (cámbialo cuando actualices el SW)
const CACHE_NAME = "nebhula-blog-cache-v1";

// Archivos que se precachean (ajusta según tu repo)
const PRECACHE_URLS = [
  "https://nebhula.github.io/blog-pwa2/",
  "https://nebhula.github.io/blog-pwa2/index.html",
  "https://nebhula.github.io/blog-pwa2/offline.html",
  "https://nebhula.github.io/blog-pwa2/manifest.json",
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjm71ehhtmnHuqJqP7ZBMGXZXWgtkqoyxh-NLaQiHTHuyjbnTtL-gC7mTw1Tsft-QQ4Wcw5gRE_6WgXC2S1_ep8yJVyC21gnYg__nH9iJ2uUVSFgRszTrviCOix_as_Nj4bY05jbk7gBvlX_4T7cQiMhw3HdygVW76XkvIO72sQgcRFyqZqaYlfqAiVRZY/s1600/nebhula%20%2872%29.png"
];

// Durante la instalación: cachear todo
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// Activación: limpiar cachés viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: intentar red de primero, luego cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonamos respuesta para guardar en cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(res => {
        if (res) return res;
        // Si no está en cache, devolvemos offline.html si es una página
        if (event.request.destination === "document") {
          return caches.match("https://nebhula.github.io/blog-pwa2/offline.html");
        }
      }))
  );
});
