// =====================================================================
// AYVEX — Service worker
// 1) Çevrimdışı açılma: uygulama dosyaları önbelleğe alınır. Strateji "önce ağ":
//    internet varken her zaman en güncel dosya gelir (eski sürüm takılı kalmaz),
//    yoksa önbellekteki kopya kullanılır.
// 2) Bildirime tıklanınca açık uygulama sekmesine geçilir (yoksa yeni sekme açılır).
// Kullanıcı verisi burada tutulmaz; veri tarayıcıda (localStorage) ve Firestore'da.
// =====================================================================
const ONBELLEK = "ayvex-v1";
const KABUK = ["./", "index.html", "dashboard.css", "dashboard.js", "bulut.js", "manifest.webmanifest",
  "assets/ayvex-logo.webp", "assets/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK).then(c => c.addAll(KABUK)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

// Önbelleğe alınabilecek istekler: kendi dosyalarımız, Firebase kütüphaneleri ve fontlar.
// Firestore/Auth API çağrıları (googleapis.com) asla önbelleğe alınmaz.
function onbellekUygun(url) {
  if (url.origin === self.location.origin) return true;
  return url.hostname === "www.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  if (!onbellekUygun(url)) return;
  e.respondWith(
    fetch(istek)
      .then(cevap => {
        if (cevap && (cevap.ok || cevap.type === "opaque")) {
          const kopya = cevap.clone();
          caches.open(ONBELLEK).then(c => c.put(istek, kopya));
        }
        return cevap;
      })
      .catch(async () => {
        // ?v=... sürüm eki farklı olsa da önbellekteki kopyayı kullan
        const c = await caches.open(ONBELLEK);
        return (await c.match(istek)) || (await c.match(istek, { ignoreSearch: true })) ||
          (istek.mode === "navigate" ? c.match("index.html") : Response.error());
      })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const pencereler = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const acik = pencereler.find(p => new URL(p.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    if (acik) return acik.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});
