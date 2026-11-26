const CACHE_NAME = "hadirupah-shell-v2";
const APP_BASE = new URL(self.registration.scope);
const APP_SHELL = ["", "index.html", "manifest.webmanifest", "icons/icon-192.svg", "icons/icon-512.svg"].map((path) => new URL(path, APP_BASE).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(APP_BASE.pathname)) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || (request.mode === "navigate" ? caches.match(new URL("index.html", APP_BASE).href) : Response.error())));
});
