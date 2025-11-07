/**
 * Service Worker for Offline Support
 * 
 * 提供離線快取和資源管理功能
 */

const CACHE_NAME = 'imagetools-v4'; // 更新版本號（修正生產環境路徑）
const RUNTIME_CACHE = 'imagetools-runtime-v4';

// 需要快取的核心資源（生產環境路徑）
// 注意：JS/CSS 檔案有 hash，由 Vite 自動處理，不需要在這裡列出
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // 移除 /src/ 路徑（開發環境專用）
  // 動態資源會在 runtime 快取中處理
];

// 安裝事件：快取核心資源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installed successfully');
        return self.skipWaiting(); // 立即啟動新的 SW
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// 啟動事件：清理舊快取
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activated successfully');
        return self.clients.claim(); // 立即控制所有頁面
      })
  );
});

// Fetch 事件：快取策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 HTTP(S) 請求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 跳過 Chrome Extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 策略：Network First for HTML (總是取得最新版本)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 快取成功的回應
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 網路失敗時，嘗試從快取取得
          return caches.match(request);
        })
    );
    return;
  }

  // 策略：Network First for CSS (總是取得最新樣式)
  if (request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 快取成功的回應
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 網路失敗時，嘗試從快取取得
          return caches.match(request);
        })
    );
    return;
  }

  // 策略：Cache First for scripts and images (快速載入)
  if (request.destination === 'script' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // 快取中沒有，從網路取得並快取
          return fetch(request).then((response) => {
            // 只快取成功的回應
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // 其他請求：Network First
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// 訊息處理：手動快取清理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
  }
});
