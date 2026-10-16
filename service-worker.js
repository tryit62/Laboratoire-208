/* Ordre V207: activation demandée par le joueur, pas de purge du stockage local. */
const CACHE='ordre-terminal-v220';
const PREFIX='ordre-terminal-';
const CORE=['./index.html','./style.css','./app.js','./manifest.webmanifest','./service-worker.js'];
const OPTIONAL=['./','./order-logo.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./division-1-oeil-fendu.png','./division-2-flamme-inversee.png','./division-3-main-cassee.png','./division-4-spirale-os.png','./division-5-sablier-noir.png','./ceremony.html','./ceremonie.mp3','./oeil.png','./flamme.png','./main.png','./spirale.png','./sablier.png','./ordre.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(CORE);
 await Promise.allSettled(OPTIONAL.map(x=>cache.add(x)));
 // One-time migration from V206, whose application has no update notification listener.
 // For V208 and later, remove the next line to require player approval.
 await self.skipWaiting();
})()));
self.addEventListener('message',e=>{if(e.data?.type==='ORDRE_ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);
 if(req.mode==='navigate'){
  // Online first for HTML navigation, offline fallback to cached index.
  e.respondWith(fetch(req).catch(async()=>await caches.match('./index.html')||Response.error()));return;
 }
 // V219: always fetch fresh JS/CSS while online; cached files only when offline.
 if(url.pathname.endsWith('/app.js')||url.pathname.endsWith('/style.css')){
  e.respondWith(fetch(req).then(async r=>{if(r.ok){const c=await caches.open(CACHE);await c.put(req,r.clone())}return r}).catch(async()=>await caches.match(req)||await caches.match(url.origin+url.pathname)||Response.error()));return;
 }
 e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
