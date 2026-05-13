const CACHE_NAME = "nebhula-blog-cache-v3";

const PRECACHE_URLS = [
  "https://nebhula.github.io/pwa-nebhula/",
  "https://nebhula.github.io/pwa-nebhula/index.html",
  "https://nebhula.github.io/pwa-nebhula/offline.html",
  "https://nebhula.github.io/pwa-nebhula/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

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

// ========== NOTIFICACIONES PUSH ==========
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6LtWFIoY8Zkum1GFIoSL2ymoft6wh5_TVeWXp4Cf5mxCgRrjll0R5rTFwqPtVHhyQHIXP7lD6KE4XIRyldW22T91PqXdPzRxW710eDHr99wF9nJilrxEvAe0k85YphNduj5_UPqwtjj_Sc0an756MKYpNI4Otxn4gGupSBr-AJIwFR-rOvn1KtWwFZClt/s1600/NEBHULAICON192.png',
      badge: '/badge.png',
      tag: 'nebhula-news'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
