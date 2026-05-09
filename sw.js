// Nombre del caché (cámbialo cuando actualices el SW)
const CACHE_NAME = "nebhula-blog-cache-v1";

// Archivos que se precachean (ajusta según tu repo)
const PRECACHE_URLS = [
  "https://nebhula.github.io/pwa-nebhula/",
  "https://nebhula.github.io/pwa-nebhula/index.html",
  "https://nebhula.github.io/pwa-nebhula/offline.html",
  "https://nebhula.github.io/pwa-nebhula/manifest.json",
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

// ===== NOTIFICACIONES =====
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'INICIAR_NOTIFICACIONES') {
        iniciarNotificaciones(event.data.canalesSeguidos);
    }
});

function iniciarNotificaciones(canalesSeguidos) {
    if (self.notificationInterval) clearInterval(self.notificationInterval);
    
    self.notificationInterval = setInterval(function() {
        fetch('https://agregador-noticias.josema-mera37.workers.dev/api/noticias?t=' + Date.now())
            .then(function(res) { return res.json(); })
            .then(function(noticias) {
                var request = indexedDB.open('nebhula-notif', 1);
                request.onsuccess = function(e) {
                    var db = e.target.result;
                    var tx = db.transaction('config', 'readonly');
                    var store = tx.objectStore('config');
                    var getReq = store.get('ultima_notificacion');
                    getReq.onsuccess = function() {
                        var ultimaNotificacion = (getReq.result && getReq.result.valor) || '0';
                        var nuevas = noticias.filter(function(n) {
                            return new Date(n.createdAt).getTime() > parseInt(ultimaNotificacion) && canalesSeguidos.indexOf(n.dominio) !== -1;
                        });
                        if (nuevas.length > 0) {
                            var masReciente = nuevas.reduce(function(max, n) {
                                return new Date(n.createdAt).getTime() > max ? new Date(n.createdAt).getTime() : max;
                            }, 0);
                            var writeTx = db.transaction('config', 'readwrite');
                            var writeStore = writeTx.objectStore('config');
                            writeStore.put({ id: 'ultima_notificacion', valor: masReciente.toString() });
                            
                            self.registration.showNotification('🔥 Nebhula', {
                                body: nuevas.length + ' noticia(s) nueva(s) de tus canales',
                                icon: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6LtWFIoY8Zkum1GFIoSL2ymoft6wh5_TVeWXp4Cf5mxCgRrjll0R5rTFwqPtVHhyQHIXP7lD6KE4XIRyldW22T91PqXdPzRxW710eDHr99wF9nJilrxEvAe0k85YphNduj5_UPqwtjj_Sc0an756MKYpNI4Otxn4gGupSBr-AJIwFR-rOvn1KtWwFZClt/s1600/NEBHULAICON192.png',
                                tag: 'nebhula-news',
                                vibrate: [200, 100, 200]
                            });
                        }
                    };
                };
                request.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains('config')) {
                        db.createObjectStore('config', { keyPath: 'id' });
                    }
                };
            });
    }, 900000);
}
