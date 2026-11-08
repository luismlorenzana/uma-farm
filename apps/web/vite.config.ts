import { mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** Writes which source modules each chunk renders to dist/.vite/chunks.json (never deployed), so the size check can refuse
 * a lazy module in the initial JS (scripts/check-size.mjs, copied from uma-rpg). */
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

export default defineConfig({
  plugins: [react(), tailwindcss(), chunkModules()],
  build: { manifest: true },
  server: { port: 5194, strictPort: true, proxy: { '/api': 'http://localhost:8101' } },
  test: { environment: 'node' },
})
