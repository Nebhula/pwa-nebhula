// Nombre del caché
const CACHE_NAME = "nebhula-blog-cache-v2";

// Archivos que se precachean
const PRECACHE_URLS = [
  "https://nebhula.github.io/pwa-nebhula/",
  "https://nebhula.github.io/pwa-nebhula/index.html",
  "https://nebhula.github.io/pwa-nebhula/offline.html",
  "https://nebhula.github.io/pwa-nebhula/manifest.json",
  "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBYWMolBojmbzHqEg7elSOwHtfZy2MiQULekUyXdmU3EJpdECP3W1eakKqprrMQN_isBwxM1i2q6rwtZQwg7waQPP2bRlzWbHBeYsXA5z1oKjz_Csh_2UkPtcnKv_PvBNuUWJeNOOwCNGYqWu6DOFadWLgWWk_kZo6Tp7307A0YuiyRrIdGq0niNdelhw/s1600/A%C3%B1adir%20un%20poco%20de%20texto%20%2816%29%20%281%29.png"
];

// Instalación: cachear archivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
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
    ).then(() => self.clients.claim())
  );
});

// Fetch: red primero, luego caché
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then(res => {
        if (res) return res;
        if (event.request.destination === "document") {
          return caches.match("https://nebhula.github.io/pwa-nebhula/offline.html");
        }
      }))
  );
});

// Notificaciones push (para cuando las implementes)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6LtWFIoY8Zkum1GFIoSL2ymoft6wh5_TVeWXp4Cf5mxCgRrjll0R5rTFwqPtVHhyQHIXP7lD6KE4XIRyldW22T91PqXdPzRxW710eDHr99wF9nJilrxEvAe0k85YphNduj5_UPqwtjj_Sc0an756MKYpNI4Otxn4gGupSBr-AJIwFR-rOvn1KtWwFZClt/s1600/NEBHULAICON192.png',
      badge: '/badge.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
