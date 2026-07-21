const CACHE_PREFIX = "mishima-lab-";
const CACHE_NAME = `${CACHE_PREFIX}shell-v3-2026-07-21`;
const scopeUrl = new URL(self.registration.scope);
const scopedUrl = (path) => new URL(path, scopeUrl).toString();
const PRECACHE_URLS = [
  scopedUrl("./"),
  scopedUrl("index.html"),
  scopedUrl("manifest.webmanifest"),
  scopedUrl("mishima-lab-icon.svg"),
];

const cacheProductionShell = async () => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE_URLS);
  const shell = await cache.match(scopedUrl("./"));
  if (!shell) throw new Error("Production shell was not cached.");
  const html = await shell.text();
  const discoveredAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], scopeUrl))
    .filter((url) => url.origin === scopeUrl.origin && !url.pathname.endsWith("/sw.js"))
    .map((url) => url.toString());
  await cache.addAll([...new Set(discoveredAssets)]);
};

self.addEventListener("install", (event) => {
  event.waitUntil(cacheProductionShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

const cacheSuccessfulResponse = async (request, response) => {
  if (!response || !response.ok || response.type !== "basic") return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
};

const navigationResponse = async (request) => {
  try {
    return await cacheSuccessfulResponse(request, await fetch(request));
  } catch {
    return await caches.match(scopedUrl("./"))
      ?? await caches.match(scopedUrl("index.html"))
      ?? Response.error();
  }
};

const assetResponse = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheSuccessfulResponse(request, await fetch(request));
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin || url.pathname.endsWith("/sw.js")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (["script", "style", "image", "font", "manifest"].includes(request.destination)) {
    event.respondWith(assetResponse(request));
  }
});
