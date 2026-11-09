// The initial JS budget (the platform's 180 KB rule, copied from uma-rpg's check, H16/D56). It measures the HTML entry and
// its static imports, not the largest asset: scenes and big libraries load on demand and are listed in LAZY_MODULES once
// they exist, so they can never render in the initial JS.
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

export const MAIN_JS_BUDGET = 180_000
/** Modules that must load on demand (F5): the Hub map's Phaser scene, which uma-kit imports only when a map mounts, and the
 * Wilds' screens, which the router loads with React.lazy; the loop's boot with its migration (F17); the loop's pages,
 * its sheets, its actions and the night (F18); the Fields' page, rules and crop table, and the morning's words (F20); and
 * the talents, the rank rules and their table, the roster's rows and the Umas' marks (F21); and the work operations and
 * their env, the forest's, the Fishery's and the stations' tables, kinds and build rule, and their screens (F22). Paths
 * match a module id exactly or as its suffix. */
export const LAZY_MODULES = [
  'phaser/dist/phaser.esm.js',
  '@luismlorenzana/uma-kit/dist/hub/scene/createHubGame.js',
  '@luismlorenzana/uma-kit/dist/hub/scene/HubScene.js',
  'src/wilds/WildsScreen.tsx',
  'src/places/work/WorkPage.tsx',
  'src/places/warehouse/WarehousePage.tsx',
  'src/loop/boot.ts',
  'domain/src/save/migrate-v3.ts',
  'src/loop/FarmMap.tsx',
  'src/loop/RosterPage.tsx',
  'src/loop/DiaryPage.tsx',
  'src/loop/LoopSheets.tsx',
  'src/loop/actions.ts',
  'domain/src/night/end-day.ts',
  'src/loop/FieldsPage.tsx',
  'src/loop/summary-words.ts',
  'domain/src/fields/fields.ts',
  'domain/src/fields/crops.ts',
  'domain/src/farm/talents.ts',
  'domain/src/farm/rank-rules.ts',
  'src/loop/talents.ts',
  'src/loop/roster-view.ts',
  'src/loop/UmaMarks.tsx',
  'domain/src/save/loop-work.ts',
  'domain/src/work/loop-env.ts',
  'domain/src/gathering/tables.ts',
  'domain/src/gathering/kinds.ts',
  'domain/src/gathering/stations.ts',
  'src/loop/WorkPlace.tsx',
  'src/loop/work-view.ts',
]

export function entrySrc(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].filter(([tag]) => /\btype\s*=\s*["']module["']/i.test(tag))
  const sources = scripts.flatMap(([tag]) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    return src ? [src] : []
  })
  if (sources.length !== 1) throw new Error('Expected one module entry in dist/index.html')
  return sources[0]
}
function assetPath(distDir, source) {
  if (typeof source !== 'string' || !/^\/?assets\/[\w.-]+\.js$/.test(source)) throw new Error(`Unsafe JS asset: ${source}`)
  const root = resolve(distDir), file = resolve(root, source.replace(/^\//, ''))
  if (!file.startsWith(root + sep)) throw new Error('JS asset leaves dist')
  return file
}

/** The lazy modules a static chunk renders, from `.vite/chunks.json` (chunk file → module paths). */
export function lazyInInitial(chunks, files, lazy = LAZY_MODULES) {
  return files.flatMap((file) => {
    const modules = chunks[file]
    if (!Array.isArray(modules)) throw new Error(`Chunk map is missing ${file}`)
    return modules.filter((id) => lazy.some((path) => id === path || id.endsWith(`/${path}`))).map((id) => `${id} (${file})`)
  })
}

export async function checkSize(distDir, budget = MAIN_JS_BUDGET, lazy = LAZY_MODULES) {
  const html = await readFile(resolve(distDir, 'index.html'), 'utf8')
  const src = entrySrc(html), entry = src.replace(/^\//, '')
  const manifest = JSON.parse(await readFile(resolve(distDir, '.vite/manifest.json'), 'utf8'))
  const main = Object.entries(manifest).find(([, node]) => node.isEntry && node.file === entry)
  if (!main) throw new Error('HTML entry is missing from the build manifest')
  const seen = new Set(), files = []
  const visit = (key) => {
    if (seen.has(key)) return
    seen.add(key)
    const node = manifest[key]
    if (!node) throw new Error(`Missing static chunk: ${key}`)
    assetPath(distDir, node.file)
    files.push(node.file)
    for (const dependency of node.imports ?? []) visit(dependency)
  }
  visit(main[0]) // Dynamic imports are excluded on purpose; static vendor splitting can't evade the budget.
  const sizes = await Promise.all(files.map(async (file) => ({ file, gzip: gzipSync(await readFile(assetPath(distDir, file))).byteLength })))
  const mainGzip = sizes.find((s) => s.file === entry).gzip
  const initialGzip = sizes.reduce((sum, s) => sum + s.gzip, 0)
  if (mainGzip > budget || initialGzip > budget) throw new Error(`Initial JS ${initialGzip} bytes gzip (main ${mainGzip}) exceeds ${budget}`)
  let chunks
  try {
    chunks = JSON.parse(await readFile(resolve(distDir, '.vite/chunks.json'), 'utf8'))
  } catch {
    throw new Error('Missing .vite/chunks.json (the chunkModules plugin in apps/web/vite.config.ts)')
  }
  const leaked = lazyInInitial(chunks, files, lazy)
  if (leaked.length > 0) throw new Error(`Initial JS renders modules that load on demand: ${leaked.join(', ')}`)
  return { entry, mainGzip, initialGzip, files: sizes, lazy: lazy.length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkSize(resolve(process.argv[2] ?? 'dist'))
    console.log(`Main JS: ${(result.mainGzip / 1000).toFixed(2)} KB gzip / ${MAIN_JS_BUDGET / 1000} KB budget`)
    console.log(`Initial JS: ${(result.initialGzip / 1000).toFixed(2)} KB gzip across ${result.files.length} static chunk(s)`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
