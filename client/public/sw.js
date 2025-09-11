// Service Worker para RestaurantePro PWA
const CACHE_NAME = 'restaurantepro-v1.1.0';
const STATIC_CACHE_NAME = 'restaurantepro-static-v1.1.0';

// Arquivos para cache (apenas arquivos que existem)
const STATIC_ASSETS = [
  '/',
  '/customer-panel',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        // Cache individual assets mais robustamente
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            fetch(asset)
              .then(response => {
                if (response.ok) {
                  return cache.put(asset, response);
                } else {
                  console.warn(`SW: Failed to fetch ${asset}: ${response.status}`);
                }
              })
              .catch(error => {
                console.warn(`SW: Failed to cache ${asset}:`, error);
              })
          )
        );
      })
      .catch((error) => {
        console.error('SW: Error opening cache', error);
      })
  );
  
  // Força a ativação imediata
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assume controle de todos os clientes imediatamente
  event.waitUntil(clients.claim());
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia para recursos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls - Network Only (sem cache por segurança)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Se offline, retorna resposta genérica (sem cache de dados sensíveis)
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            message: 'Você está offline. Conecte-se para atualizar os dados.' 
          }),
          { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Cache First para assets (imagens, CSS, JS)
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network First para outras requisições
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Página offline genérica
        if (request.mode === 'navigate') {
          return caches.match('/customer-panel').then((response) => {
            return response || new Response('Offline - RestaurantePro');
          });
        }
      });
    })
  );
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    event.ports[0].postMessage({ success: true });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ 
          cacheSize: keys.length,
          cacheName: CACHE_NAME 
        });
      });
    });
  }
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar dados offline
      console.log('SW: Performing background sync')
    );
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('SW: Push message received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('RestaurantePro', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click received', event);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/customer-panel')
    );
  }
});