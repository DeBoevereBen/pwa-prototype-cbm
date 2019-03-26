// The name of the cache group.
const CACHE = `v1.0.1`;
let FALLBACK = "";
let NOTFOUND = "";
const OFFLINE_IMG = `<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
<title id="offline-title">Offline</title>
<path fill="rgba(145,145,145,0.5)" d="M0 0h400v225H0z" />
<text fill="rgba(0,0,0,0.33)" font-family="Helvetica Neue,Arial,sans-serif" font-size="27" text-anchor="middle" x="200" y="113" dominant-baseline="central">
Offline, image not cached yet.
</text>
</svg>`
// The path needs to be where the projects resides in.
const BASE_PATH = "";

/**
 * The files you want to cache in an Array;
 */
let filesToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}styles.css`,
  `${BASE_PATH}dist/bundle.min.js`,
  `${BASE_PATH}404.html`,
  `${BASE_PATH}offline.html`
];

/**
 * Gets called on FIRST visit to the website.
 * Here we can precache our static files we want to cache.
 */
this.addEventListener("install", installEvent => {
  console.log("[ServiceWorker] installing");
  self.skipWaiting();
  installEvent.waitUntil(
    caches
      .open(CACHE)
      .then(staticCache => {
        return staticCache.addAll(filesToCache);
      })
      .catch(error => {
        // console.error("Error opening cache in install", error);
      })
  );
});

/**
 * When installation is done, activate is called. Here you can delete
 * old cache versions, update to a new version and immediately claim
 * the service-worker.
 */
self.addEventListener("activate", event => {
  console.log("[Serviceworker] Actived");
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== CACHE) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function () {
        console.log("[ServiceWorker] Claiming clients for version", CACHE);
        return self.clients.claim();
      })
  );
  FALLBACK = caches.match(`${BASE_PATH}offline.html`);
  NOTFOUND = caches.match(`${BASE_PATH}404.html`);
});

/**
 * Here we listen to all fetch request. There are multiple methods
 * of replying. In our case now we work with cache first - then network.
 * And in the occassion the network fails (no connectivity) we have a
 * fallback (offline.html or index.html without images).
 */
self.addEventListener("fetch", function (event) {
  let request = event.request;
  if (request.headers.get("Accept").includes("json")) {
    // skip handling;
    event.respondWith(this.fromNetwork(request));
  } else {
    event.respondWith(this.fromCache(request));
    // Update the cache with the new fetch requests
    event.waitUntil(this.updateCache(request));
  }
});

function fromNetwork(request) {
  return fetch(request).then(response => {
    return response;
  }).catch(err => {

  })
}

/**
 * Getting the date from cache IF it isn't exist
 * we get it from the network. In case the network is down
 * we show an offline.html.
 */
function fromCache(request) {
  return caches.open(CACHE).then(staticCache => {
    return staticCache.match(request).then(responseFromCache => {
      if (responseFromCache) {
        return responseFromCache;
      }
      return fetch(request)
        .then(response => {
          if (response.status === 404) {
            return caches.match(`${BASE_PATH}404.html`);
          }
          return response;
        })
        .catch(error => {
          if (request.url.match(/\.(jpe?g|png|gif|svg)$/i)) {
            return new Response(OFFLINE_IMG, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' } });
          }
          return caches.match(`${BASE_PATH}offline.html`);
        });
    });
  });
}

/**
 * Call this function to return a fallback html incase no
 * responses are available.
 */
function useFallback() {
  return Promise.resolve(
    new Response(FALLBACK, {
      headers: {
        "Content-Type": "text/html"
      }
    })
  );
}

/**
 * This function updates the cache with all the
 * new fetch request, specifically cache if the
 * request is an image.
 */
function updateCache(request) {
  return caches.open(CACHE).then(staticCache => {
    return fetch(request).then(response => {
      if (request.url.indexOf("data") > -1) {
        return response;
      }
      if (response.status !== 404) {
        return staticCache.put(request, response.clone()).then(_ => {
          return response;
        });
      }
    });
  });
}
