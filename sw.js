// My Book Nook: keeps the app opening offline and remembers book covers.
const SHELL = "ledger-shell-v2", COVERS = "ledger-covers-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL, COVERS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // the app itself: try the network first so updates arrive, fall back to the saved copy offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // covers, fonts and chart/sync libraries: use the saved copy if there is one
  if (/covers\.openlibrary\.org|archive\.org|fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/.test(url.host)) {
    e.respondWith(caches.open(COVERS).then(async c => { const hit = await c.match(req); if (hit) return hit; try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; } catch { return hit || Response.error(); } }));
  }
});
