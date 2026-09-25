// Bayad service worker: works offline, picks up updates when online.
const CACHE = "bayad-v2"; // bump only when icons or sw.js change; index.html updates on its own
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    // Network first so updates show up; cached copy when offline.
    e.respondWith(fetch(req.url, {cache: "no-cache", credentials: "same-origin"}).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("index.html", c)); } return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Icons, fonts: cache first, fill cache as they load.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
