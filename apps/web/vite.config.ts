import { mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const buildId = (process.env.VITE_APP_BUILD_ID ?? process.env.GITHUB_SHA ?? 'local').slice(0, 12)

/** The HD-2D preview's files (F11, D73): every chunk holding three.js, uma-stage or the stage Home (with F12's figures), and
 * kit-farm's page. They build into `assets/stage/`, which the precache leaves out and a runtime cache keeps once loaded, so
 * only a player with the switch on downloads them (scripts/check-size.mjs checks the built service worker). */
const STAGE_DIR = 'assets/stage'
const STAGE_MODULE = /\/three\/build\/|\/@luismlorenzana\/uma-stage\/|\/src\/loop\/(FarmStage\.tsx|farm-stage\.ts|farm-kit\.ts|farm-figures\.ts|figure-looks\.ts)$/
const STAGE_ASSET = /\/uma-art\/kit-farm\//

/** Writes which source modules each chunk renders to dist/.vite/chunks.json (never deployed or precached), so the size
 * check can refuse a lazy module in the initial JS (scripts/check-size.mjs, copied from uma-rpg). */
function chunkModules(): Plugin {
  let root = ''
  return {
    name: 'farm-chunk-modules',
    apply: 'build',
    configResolved(config) { root = config.root },
    writeBundle(options, bundle) {
      const chunks: Record<string, string[]> = {}
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        chunks[output.fileName] = Object.entries(output.modules).filter(([id, m]) => m.renderedLength > 0 && !id.startsWith('\0'))
          .map(([id]) => relative(root, id.split('?')[0]!).split(sep).join('/'))
      }
      const dir = join(options.dir ?? join(root, 'dist'), '.vite')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'chunks.json'), `${JSON.stringify(chunks, null, 1)}\n`)
    },
  }
}

export default defineConfig(({ mode }) => {
  // A production build without the Firebase web config would run signed out and every API call would get a 401.
  // Fail the build instead (apps/web/.env.production is committed).
  if (mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID'].filter((k) => !env[k])
    if (missing.length > 0) throw new Error(`Production build is missing ${missing.join(', ')} (apps/web/.env.production)`)
  }
  return {
    define: { __APP_BUILD_ID__: JSON.stringify(buildId) },
    plugins: [
      react(),
      tailwindcss(),
      chunkModules(),
      VitePWA({
        // The kit's update prompt (Update ready · Restart) decides when a new build takes over.
        registerType: 'prompt',
        injectRegister: null,
        // Drawn by scripts/draw-icons.mjs. iOS keeps the icon it saw at Add to Home Screen.
        includeAssets: ['icons/icon-64.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Uma Farm',
          short_name: 'Uma Farm',
          description: 'Personal Uma farm',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          background_color: '#0f1620',
          theme_color: '#0f1620',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // The HD-2D preview is cached on first use instead (below); workbox's own default ignore kept.
          globIgnores: ['**/node_modules/**/*', `${STAGE_DIR}/**`],
          // "Work done" notifications (F6, uma-rpg's D63): the handlers live in public/push-sw.js.
          importScripts: ['push-sw.js'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/index.html',
          // /__/ is Firebase Hosting's reserved space (the redirect sign-in handler): never answer it with the app shell.
          navigateFallbackDenylist: [/^\/api\//, /^\/__\//],
          runtimeCaching: [
            {
              // Master data files are named by hash: cached for good once downloaded.
              urlPattern: ({ url }) => url.pathname.startsWith('/api/master/files/') || url.pathname.startsWith('/api/master/manifests/'),
              handler: 'CacheFirst',
              options: { cacheName: 'farm-master-files', expiration: { maxEntries: 4000 } },
            },
            {
              // The channel pointer moves with each release: the network first, the last one offline.
              urlPattern: ({ url }) => url.pathname.startsWith('/api/master/channels/'),
              handler: 'NetworkFirst',
              options: { cacheName: 'farm-master-channel', networkTimeoutSeconds: 4 },
            },
            {
              // The HD-2D preview (D73): named by hash, cached for good the first time it loads, so it works offline after.
              // Never an HTML page (Hosting's answer for a file a newer deploy removed) under a chunk's name.
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/stage/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'farm-stage',
                expiration: { maxEntries: 16 },
                plugins: [{
                  cacheWillUpdate: async ({ response }) => (response.status === 200 && !(response.headers.get('content-type') ?? '').includes('text/html') ? response : null),
                }],
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      // uma-kit's peers resolve to this app's copies (also when the kit is linked from uma-platform).
      dedupe: ['react', 'react-dom', 'react-router', 'motion'],
    },
    server: {
      port: 5194,
      strictPort: true,
      // `host: true` exposes the dev server on the LAN so the iPhone can load it directly.
      host: true,
      proxy: { '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:8101', changeOrigin: true } },
    },
    preview: { port: 5194 },
    build: {
      target: 'es2022',
      manifest: true,
      rollupOptions: {
        output: {
          chunkFileNames: (chunk) => `${chunk.moduleIds.some((id) => STAGE_MODULE.test(id)) ? STAGE_DIR : 'assets'}/[name]-[hash].js`,
          assetFileNames: (asset) => (asset.originalFileNames.some((file) => STAGE_ASSET.test(file)) ? `${STAGE_DIR}/kit-farm-[hash][extname]` : 'assets/[name]-[hash][extname]'),
        },
      },
    },
    // uma-kit is transformed with the app, so its links share the app's router (F18's bar test renders them). The romance
    // switch is off (F46 decision 4): M4's tests run unchanged, and a romance test turns it on with `vi.stubEnv`. The story
    // pack is the stand-in (F56 decision 5): no test reads farm-api; the loader's own tests stub this.
    test: { environment: 'jsdom', maxWorkers: 2, env: { VITE_FARM_ROMANCE: '0', VITE_FARM_STORY: 'stand-in' }, server: { deps: { inline: [/@luismlorenzana\/uma-kit/] } } },
  }
})
