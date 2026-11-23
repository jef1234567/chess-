const V="salle-armes-v3";
const FICHIERS=["./","index.html","chess.js","css/app.css","js/puzzles.js","js/lichess.js","js/profile.js","js/sound.js","js/board.js","js/app.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","fonts/uncial.woff2","fonts/nunito-400.woff2","fonts/nunito-700.woff2","fonts/nunito-800.woff2","fonts/symbols.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FICHIERS)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
