/*
 * Cache apenas de arquivos estáticos. Nunca cacheia /api/, Firebase Auth,
 * Firestore nem HTML de rotas — isso evita dados antigos e problemas de login.
 */
const CACHE = "cafe-queijo-static-v1";

const ESTATICOS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESTATICOS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const caminho = url.pathname;
  if (caminho.startsWith("/api/")) return;

  const ehEstatico =
    caminho.startsWith("/_next/static/") ||
    caminho === "/favicon.ico" ||
    ESTATICOS.includes(caminho);

  if (!ehEstatico) return;

  event.respondWith(
    caches.match(request).then((emCache) => {
      if (emCache) return emCache;

      return fetch(request).then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return resposta;
      });
    }),
  );
});
