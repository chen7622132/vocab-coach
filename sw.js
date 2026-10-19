const CACHE = 'vocab-coach-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (u.pathname.indexOf('/chat/completions') >= 0) return;   // API 绝不缓存
  if (e.request.method !== 'GET') return;

  // 页面导航：网络优先，拿不到才用缓存（保证改完代码刷新就是新版）
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(r){
        var copy = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return r;
      }).catch(function(){ return caches.match('./index.html'); })
    );
    return;
  }

  // 静态资源：缓存优先（离线可用）
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
