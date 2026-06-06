const CACHE_NAME = 'kura-v1'

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// プッシュ通知を受信したときの処理
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Kura', body: event.data.text() }
  }

  const title = data.title || 'Kura'
  const options = {
    body: data.body || '新しい通知があります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'kura-notification',
    data: { url: data.url || '/dashboard' },
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [200, 100, 200] : [100],
    actions: data.urgent
      ? [{ action: 'open', title: '確認する' }]
      : [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// 通知をタップしたときの処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // すでに開いているタブがあればそこを表示
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // なければ新規タブで開く
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
