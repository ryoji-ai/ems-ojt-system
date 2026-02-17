/**
 * 救急OJT教育システム - Service Worker
 * オフライン対応とキャッシュ管理
 */

const CACHE_NAME = 'ems-ojt-v6';
const CACHE_URLS = [
    '/ems-ojt-system/',
    '/ems-ojt-system/index.html',
    '/ems-ojt-system/manual.html',
    '/ems-ojt-system/css/style.css',
    '/ems-ojt-system/js/app.js',
    '/ems-ojt-system/js/questions-data.js',
    '/ems-ojt-system/js/monthly-goals.js',
    '/ems-ojt-system/manifest.json',
    '/ems-ojt-system/images/hero.png'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Install failed:', error);
            })
    );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim();
            })
    );
});

// リクエストの処理（Cache First戦略）
self.addEventListener('fetch', (event) => {
    // 外部URLはスキップ
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // キャッシュがあればそれを返す
                    console.log('[Service Worker] Serving from cache:', event.request.url);

                    // バックグラウンドで更新を試みる（Stale While Revalidate）
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, networkResponse);
                                    });
                            }
                        })
                        .catch(() => {
                            // ネットワークエラーは無視
                        });

                    return cachedResponse;
                }

                // キャッシュがなければネットワークから取得
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // 正常なレスポンスならキャッシュに保存
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);

                        // オフライン用のフォールバックページがあれば返す
                        if (event.request.mode === 'navigate') {
                            return caches.match('/ems-ojt-system/index.html');
                        }

                        throw error;
                    });
            })
    );
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    const options = {
        body: event.data ? event.data.text() : '新しい教材が追加されました',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('救急OJT教育システム', options)
    );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sync event:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(
            // データ同期処理をここに記述
            Promise.resolve()
        );
    }
});
