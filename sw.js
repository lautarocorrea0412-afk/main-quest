/* ============================================================
   MAIN QUEST — sw.js (service worker)
   ------------------------------------------------------------
   Corre en segundo plano e intercepta las peticiones de red.
   Guarda una copia de los archivos de la app para que funcione
   sin internet (en el subte, en un avión, en Japón sin datos).

   IMPORTANTE: cuando cambiemos archivos en fases futuras,
   hay que subir el número de CACHE_VERSION para que los
   teléfonos descarguen la versión nueva.
   ============================================================ */

const CACHE_VERSION = "mq-fase2-paso1";

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css",
  "./js/app.js",
  "./js/store.js",
  "./js/missions.js",
  "./js/xp.js",
  "./js/engine.js",
  "./js/journal.js",
  "./js/economy.js",
  "./js/util.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

// Al instalarse: guardar los archivos base.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

// Al activarse: borrar caches de versiones viejas.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: primero cache, si no está, red (y se guarda).
// Así la app abre instantáneo y las tipografías quedan cacheadas.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copia = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copia));
        return response;
      }).catch(() => cached);
    })
  );
});
