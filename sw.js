// Guia da Roça — guarda o app no aparelho para funcionar sem internet
const CACHE = 'guia-roca-v1';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;            // identificação (POST) vai direto para a internet
  const url = new URL(req.url);

  // Páginas: tenta a versão nova da internet, se não der usa a guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Arquivos do app e fontes: usa o guardado e atualiza por trás
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(salvo => {
      const rede = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
        return r;
      }).catch(() => salvo);
      return salvo || rede;
    }));
  }
});
