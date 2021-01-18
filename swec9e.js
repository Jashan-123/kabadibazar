var fileversions = self.location.search.split('=')[1]||Math.round(Math.random()*1000)/100;
var VERSION = fileversions;
var NAME = "JNKRT";


// importScripts('/static/junkart-web-app/cache-manifest');
var urls_to_cache = [
    '/view/ratecard',
    '/css/lib/bootstrap.min.css',
    '/css/lib/font-awesome.min.css',
    '/css/junkart.css?v='+fileversions,
    '/css/pickup-form.css?v='+fileversions,
    '/css/main.css?v='+fileversions,
    '/css/carousel.css',
    '/js/newPickForm.js?v='+fileversions,
    '/js/lib/bootstrap.min.js',
    '/js/lib/jquery-2.2.0.min.js',
    '/js/popupProfile.js?v='+fileversions,
    '/js/signup.js',
    '/js/login.js',
    '/images/header_logo.png',
    '/html/no-internet-fallback.html'
];

self.addEventListener('install', function(event){
    var CACHE_NAME = NAME+'-v'+VERSION;
    console.log('[service worker] installing cache.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache){
                return cache.addAll(urls_to_cache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    var CACHE_NAME = NAME+'-v'+VERSION;
    e.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(cacheNames.map(function(cacheName) {
                if(!cacheName.includes(NAME)){
                    return null;
                }
                if (cacheName !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', cacheName);
                    return caches.delete(cacheName);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    var staticUrl = req.url.split('/')[3].match(/images|css|js|html|fonts|vendors/);
    if(staticUrl && staticUrl.length){
        e.respondWith(cacheFirstStrategy(req));
    }else{
        e.respondWith(smartNetworkStrategy(req));
    }
});

function smartNetworkStrategy(req){
    return fetch(req)
        .then(function(fetchRes){
            var staticUrl = req.url.split('/')[3].match(/images|css|js|html|fonts|vendors/);
            if(staticUrl && staticUrl.length){
                var CACHE_NAME = NAME+'-v'+VERSION;
                var fetchResClone = fetchRes.clone();
                caches.open(CACHE_NAME).then(function(cache){
                    cache.put(req.clone(), fetchResClone);
                });
            }
            return fetchRes;
        }).catch(function(err){
            console.log(err);
            return caches.match('/html/no-internet-fallback.html').then(function(fallbackPage){
                return fallbackPage;
            });
        });
}

function cacheFirstStrategy(req){
    return caches.match(req)
        .then(function(res){
            if(res){return res;}
            return smartNetworkStrategy(req);
        });
}
