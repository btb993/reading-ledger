// My Book Nook: keeps the app opening offline and remembers book covers.
const SHELL = "ledger-shell-v36", COVERS = "ledger-covers-v2", SOUNDS = "ledger-sounds-v1";
const FILES = ["./", "index.html", "art.eef59d257e.js", "app.4df9a7693f.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon-64.png"];
// cache each file on its own, so one missing file can never stop the app from installing
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL, COVERS, SOUNDS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // the app itself: try the network first so updates arrive, fall back to the saved copy offline
  // sounds: download each one once, then play it from the saved copy (also offline)
  if (url.origin === location.origin && /\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.open(SOUNDS).then(async c => { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }));
    return;
  }
  // the app's code files carry their version in the name, so a saved copy is always the right one
  if (url.origin === location.origin && /\/(art|app)\.[\w.-]+\.js$/.test(url.pathname)) {
    e.respondWith(caches.open(SHELL).then(async c => { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; }));
    return;
  }
  // the page itself: open straight from the saved copy (no waiting on the network), then quietly check for a newer one
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (url.origin === location.origin && isPage) {
    e.respondWith(caches.open(SHELL).then(async c => {
      const hit = await c.match("index.html");
      const fresh = refreshPage(c, hit ? hit.clone() : null);
      if (hit) { e.waitUntil(fresh.catch(() => null)); return hit; }
      try { return await fresh; } catch { return Response.error(); }
    }));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); if (r.ok) caches.open(SHELL).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // covers, fonts and chart/sync libraries: use the saved copy if there is one,
  // and only save copies we know are good (never a hidden error page)
  if (/covers\.openlibrary\.org|archive\.org|books\.google\.com|amazon\.com|media-amazon\.com|gr-assets\.com|fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/.test(url.host)) {
    e.respondWith(caches.open(COVERS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try {
        const r = await fetch(req.url, { mode: "cors", credentials: "omit" });
        const type = r.headers.get("content-type") || "";
        if (r.ok && !/text\/html/.test(type) && +(r.headers.get("content-length") || 1000) > 200) c.put(req, r.clone());
        return r;
      } catch {
        try { return await fetch(req); } catch { return Response.error(); }
      }
    }));
  }
});

// the app asks us to keep a cover it has just shown successfully, or to forget one that turned out broken
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "keep-cover" && d.url) {
    e.waitUntil(caches.open(COVERS).then(async c => {
      if (await c.match(d.url)) return;
      try { const r = await fetch(d.url, { mode: "cors", credentials: "omit" }); if (r.ok) return c.put(d.url, r); } catch {}
      try { const r = await fetch(d.url, { mode: "no-cors", credentials: "omit" }); if (r.ok || r.type === "opaque") return c.put(d.url, r); } catch {}
    }));
  }
  if (d.type === "drop-cover" && d.url) e.waitUntil(caches.open(COVERS).then(c => c.delete(d.url)));
});

// ---- notifications: the familiar's daily check-in, letters, cheers and friend requests ----
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "My Book Nook", {
    body: d.body || "", icon: "icon-192.png", badge: "favicon-64.png", tag: d.tag || d.kind || "nook",
    data: { url: d.url || "./" }, renotify: d.kind === "letter" || d.kind === "cheer",
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const win = list.find(c => c.url.startsWith(self.registration.scope));
    if (win) { win.postMessage({ type: "notice-open", url }); return win.focus(); }
    return self.clients.openWindow(url);
  }));
});

// fetch the newest page; if it changed, save it with the code files it needs, then let open windows offer a reload
async function refreshPage(c, hit){
  const r = await fetch("index.html", { cache: "no-cache" }); if (!r.ok) { if (hit) return hit; throw new Error("offline"); }
  const text = await r.clone().text(), old = hit ? await hit.clone().text() : null;
  if (old !== text) {
    const need = [...text.matchAll(/src="((?:art|app)\.[\w.-]+\.js)"/g)].map(m => m[1]);
    await Promise.all(need.map(async f => { if (!(await c.match(f))) { const x = await fetch(f, { cache: "no-cache" }); if (x.ok) await c.put(f, x); } }));
    await c.put("index.html", r.clone());
    if (old !== null) { const v = (text.match(/data-ver="([\d.]+)"/) || [])[1]; (await self.clients.matchAll({ type: "window" })).forEach(w => w.postMessage({ type: "update-ready", v })); }
  }
  return r;
}
