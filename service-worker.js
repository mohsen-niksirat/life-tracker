const CACHE='lifetree-v3';
const ASSETS=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(
      ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Network-first for navigation (HTML pages) - always get fresh version
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(res=>{
        if(res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}
        return res;
      }).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }
  // Cache-first for static assets (icons, etc.)
  e.respondWith(
    caches.match(e.request).then(r=>{
      if(r)return r;
      return fetch(e.request).then(res=>{
        if(res.ok&&res.type==='basic'){
          const c=res.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request,c));
        }
        return res;
      }).catch(()=>{
        // Return cached index.html as fallback for any failed request
        return caches.match('./index.html');
      });
    })
  );
});

// Background sync for saving data when coming back online
self.addEventListener('sync',e=>{
  if(e.tag==='sync-data'){
    // Data is stored locally in IndexedDB, so no actual sync needed
    // This is a placeholder for future cloud sync
    console.log('Background sync triggered');
  }
});
