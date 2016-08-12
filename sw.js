var cacheName = ['v2'];

this.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll([
                '/public-transportation/data/GTFS/trips.txt',
                '/public-transportation/data/GTFS/stop_times.txt',
                '/public-transportation/app/images/arrow.png',
                '/public-transportation/app/images/train-logo.png',
                '/public-transportation/app/css/styles.css'
            ]);
        })
    );
});

this.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(
                keyList.map(function(key) {
                    if (cacheName.indexOf(key) === -1) {
                        return caches.delete(keyList);
                    }
                })
            );
        })
    );
});

this.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }

            return fetch(event.request);
        })
    );
});