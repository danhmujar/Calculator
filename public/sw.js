// Service Worker — Percentage & Math Calculator PWA
const CACHE_NAME = 'calc-v13';
const MAX_CACHE_ITEMS = 50;

// App shell to pre-cache on install (CDN libs are cached on-demand via fetch handler)
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.svg',
    './frame.png',
    './screenshot-wide.png',
    // 3-Tier Architecture files
    './services/app.js',
    './ui/ui.js',
    './ui/styles.css',
    // Local Fonts
    './ui/fonts.css',
    './ui/fonts/font-0.woff2', './ui/fonts/font-1.woff2', './ui/fonts/font-10.woff2', './ui/fonts/font-11.woff2',
    './ui/fonts/font-12.woff2', './ui/fonts/font-13.woff2', './ui/fonts/font-14.woff2', './ui/fonts/font-15.woff2',
    './ui/fonts/font-16.woff2', './ui/fonts/font-17.woff2', './ui/fonts/font-18.woff2', './ui/fonts/font-19.woff2',
    './ui/fonts/font-2.woff2', './ui/fonts/font-20.woff2', './ui/fonts/font-21.woff2', './ui/fonts/font-22.woff2',
    './ui/fonts/font-23.woff2', './ui/fonts/font-24.woff2', './ui/fonts/font-25.woff2', './ui/fonts/font-26.woff2',
    './ui/fonts/font-27.woff2', './ui/fonts/font-28.woff2', './ui/fonts/font-29.woff2', './ui/fonts/font-3.woff2',
    './ui/fonts/font-30.woff2', './ui/fonts/font-31.woff2', './ui/fonts/font-4.woff2', './ui/fonts/font-5.woff2',
    './ui/fonts/font-6.woff2', './ui/fonts/font-7.woff2', './ui/fonts/font-8.woff2', './ui/fonts/font-9.woff2',
    // Scientific mode CDN libraries (version-pinned for offline SCI mode)
    'https://unpkg.com/mathlive@0.108.3',
    'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js'
];

// Helper to limit cache size (SW-M2)
const limitCacheSize = (name, maxItems) => {
    caches.open(name).then((cache) => {
        cache.keys().then((keys) => {
            if (keys.length > maxItems) {
                cache.delete(keys[0]).then(limitCacheSize(name, maxItems));
            }
        });
    });
};

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: hybrid strategy
//  - Same-origin (your files): NETWORK-FIRST → always get latest, cache as offline fallback
//  - CDN (fonts, mathlive, mathjs): CACHE-FIRST → they're version-pinned, no need to re-fetch
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // SW-L2 FIX: HTTPS enforcement (except for local dev)
    if (!url.startsWith('https://') && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        return;
    }

    const isFont = url.includes('/ui/fonts/');

    if (isFont) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                const fetched = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        limitCacheSize(CACHE_NAME, MAX_CACHE_ITEMS);
                    }).catch(err => console.warn('SW: Cache write failed', err));
                    return networkResponse.clone();
                });
                return cached || fetched;
            })
        );
        return;
    }

    const isOwnOrigin = url.startsWith(self.location.origin);

    if (isOwnOrigin) {
        // ── Network-first for own files ──
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Update cache with fresh copy
                    if (event.request.method === 'GET' && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                            limitCacheSize(CACHE_NAME, MAX_CACHE_ITEMS);
                        }).catch(err => console.warn('SW: Cache write failed', err));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Offline: serve from cache
                    return caches.match(event.request).then((cached) => {
                        if (cached) return cached;
                        // Last resort: serve index.html for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Network error occurred', { status: 408, statusText: 'Network error occurred' });
                    });
                })
        );
    } else {
        // ── Cache-first for CDN resources ──
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    if (event.request.method === 'GET' && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                            limitCacheSize(CACHE_NAME, MAX_CACHE_ITEMS);
                        }).catch(err => console.warn('SW: Cache write failed', err));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback for CDN resources if both cache and network fail
                    return new Response('Offline and resource not in cache', { status: 503 });
                });
            })
        );
    }
});
