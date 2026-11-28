// Runway Zero offline worker, written by scripts/pages/pwa.ts at build time. Do not edit.
const CACHE = "rz-offline-e0d4919ba0e4";
const PAGES = ["/ground-school.html","/glossary.html"];
const FILES = ["/assets/analytics-OatvUVQ2.js","/assets/barlow-condensed-latin-600-normal-DepVgxBB.woff2","/assets/barlow-condensed-latin-700-normal-v1xN8_Wq.woff2","/assets/barlow-condensed-latin-ext-600-normal-18ESti3H.woff2","/assets/barlow-condensed-latin-ext-700-normal-CwuXbfVR.woff2","/assets/barlow-condensed-vietnamese-600-normal-A5AYRdjN.woff2","/assets/barlow-condensed-vietnamese-700-normal-DYeBwlKR.woff2","/assets/barlow-latin-400-normal-qiz4-Cze.woff2","/assets/barlow-latin-600-normal-DILqtrty.woff2","/assets/barlow-latin-ext-400-normal-HxX4XjxC.woff2","/assets/barlow-latin-ext-600-normal-B8NK_A3D.woff2","/assets/barlow-vietnamese-400-normal-Dpl4UHAZ.woff2","/assets/barlow-vietnamese-600-normal-DcjprdFV.woff2","/assets/glossary-CTxLo_S3.css","/assets/glossary-ZMnlm2qq.js","/assets/ground-C1r38XK8.js","/assets/progress-ccE91w-W.js","/assets/pwa-BabgPCBS.css","/assets/pwa-ClKDh_MO.js","/assets/readback-LDUMrcmX.js","/assets/recent-DMdapN6t.js","/assets/style-D5Js0Z9m.css","/assets/terms-C-mpBqrW.js","/favicon.svg","/glossary.html","/ground-school.html","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png","/manifest.webmanifest"];
const KEEP = new Set(FILES);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rz-offline-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Pages: try the network first (so updates show), but fall back to the saved copy when offline
// or when the network is too slow to answer in 4 seconds.
function page(req, path) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (res) => {
      if (!answered && res) {
        answered = true;
        resolve(res);
      }
    };
    const timer = setTimeout(() => caches.match(path).then(answer), 4000);
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(path, copy));
        }
        clearTimeout(timer);
        answer(res);
      })
      .catch(() => {
        clearTimeout(timer);
        caches.match(path).then((r) => answer(r || Response.error()));
      });
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    if (PAGES.includes(url.pathname)) e.respondWith(page(req, url.pathname));
    return;
  }
  // Files of the offline pages: saved copy first, they never change under the same name.
  if (KEEP.has(url.pathname)) e.respondWith(caches.match(url.pathname, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
