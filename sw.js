/* Service worker della Scheda D&D 5e.
   Cambia il numero di versione qui sotto quando aggiorni i file, così i dispositivi ricaricano la copia nuova. */
const V = "scheda-dnd-v3";
const SHELL = ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png", "icon-180.png"];
const CDN = ["https://www.gstatic.com/firebasejs/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  /* pagina: prima la rete (così arrivano gli aggiornamenti), se manca la rete la copia salvata */
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(x => { const cp = x.clone(); caches.open(V).then(c => c.put("index.html", cp)); return x; }).catch(() => caches.match("index.html")));
    return;
  }
  /* file dell'app: copia salvata, altrimenti rete */
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(V).then(c => c.put(r, cp)); } return x; })));
    return;
  }
  /* librerie Firebase e font: copia salvata subito, aggiornata in secondo piano */
  if (CDN.some(p => r.url.startsWith(p))) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(h => {
      const n = fetch(r).then(x => { if (x.ok) c.put(r, x.clone()); return x; }).catch(() => h);
      return h || n;
    })));
  }
  /* tutto il resto (accesso, database) passa direttamente dalla rete */
});
