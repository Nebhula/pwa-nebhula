// Nombre del caché (cámbialo cuando actualices el SW)
const CACHE_NAME = "nebhula-blog-cache-v1";

// Archivos que se precachean (ajusta según tu repo)
const PRECACHE_URLS = [
  "https://nebhula.github.io/pwa-nebhula/",
  "https://nebhula.github.io/pwa-nebhula/index.html",
  "https://nebhula.github.io/pwa-nebhula/offline.html",
  "https://nebhula.github.io/blog-pwa2/manifest.json",
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBYWMolBojmbzHqEg7elSOwHtfZy2MiQULekUyXdmU3EJpdECP3W1eakKqprrMQN_isBwxM1i2q6rwtZQwg7waQPP2bRlzWbHBeYsXA5z1oKjz_Csh_2UkPtcnKv_PvBNuUWJeNOOwCNGYqWu6DOFadWLgWWk_kZo6Tp7307A0YuiyRrIdGq0niNdelhw/s1600/A%C3%B1adir%20un%20poco%20de%20texto%20%2816%29%20%281%29.png"
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
          return caches.match("https://nebhula.github.io/pwa-nebhula/offline.html");
        }
      }))
  );
});
