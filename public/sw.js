const CACHE='fixihub-static-v2';
const ASSETS=['/offline.html','/favicon.svg','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin)return;
 // Never cache authentication, Supabase responses, receipts, or customer/admin HTML.
 if(r.mode==='navigate'){event.respondWith(fetch(r).catch(()=>caches.match('/offline.html')));return;}
 if(ASSETS.includes(u.pathname))event.respondWith(caches.match(r).then(hit=>hit||fetch(r)));
});
