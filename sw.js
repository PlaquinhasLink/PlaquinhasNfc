// Service worker do Plaquê.
// Estratégia: rede primeiro. O app sempre carrega a versão mais nova do site;
// o cache só serve de reserva quando o celular está sem internet.
// r.html (redirecionamento do QR Code), relatorio.html e chamadas ao Supabase
// NÃO passam por aqui: vão sempre direto para a rede.
const CACHE = 'plaque-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add('./index.html')).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isApp = req.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  if (!isApp) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
        }
        return res;
      })
      .catch(() => caches.match('./index.html'))
  );
});
