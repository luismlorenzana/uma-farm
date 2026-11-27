/* Retire the old unverified file copies when the updated worker takes over.
 * The manifest route still uses this cache so an offline launch can read its release. */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (!await caches.has('farm-master-files')) return
    const cache = await caches.open('farm-master-files')
    const legacy = (await cache.keys()).filter(request => {
      const url = new URL(request.url)
      return url.origin === self.location.origin && url.pathname.startsWith('/api/master/files/')
    })
    await Promise.all(legacy.map(request => cache.delete(request)))
  })().catch(() => undefined))
})
