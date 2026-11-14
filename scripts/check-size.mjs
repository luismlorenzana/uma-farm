// The initial JS budget (the platform's 180 KB rule, copied from uma-rpg's check). It measures the HTML entry and
// its static imports, not the largest asset: scenes and big libraries load on demand and are listed in LAZY_MODULES once
// they exist, so they can never render in the initial JS.
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

export const MAIN_JS_BUDGET = 180_000
/** Modules that must load on demand: the Hub map's Phaser scene, which uma-kit imports only when a map mounts; the
 * farm's pages, its sheets, its actions and the night; the Fields' page, rules and crop table, and the morning's words;
 * the talents, the rank rules and their table, the roster's rows and the Umas' marks; the work operations and their
 * env, the forest's, the Fishery's and the stations' tables, kinds and build rule, and their screens; the Dorm's rules
 * and page, the Gate's quick look and the chats' fallback lines; and the Diary's counts, the chapters, the scenes'
 * lines, the scene player and the goals' words; and the name sheet, the story pack with its placeholders, the format
 * and validator, arrivals and her points; and her route
 * on her sheet with its words, the acts, praise, birthdays and anniversaries, Ready and bond hearts; and the Hearts
 * tab, her profile, the shared roster album, the stand-in marks, the tab's view model and the perks' words; and the
 * pair player and the Diary's Conversations (with bonds' rules in `farm/bonds.ts`); and the event player, the five
 * plays' rules and their sheet, the level-up and stage-up cards, the events' rules and actions, her Memories' album and
 * the Diary's shelf, with uma-art's emote atlas; and the evening's rules, its words, its actions, its player, Tonight,
 * the morning's invitation answers and the night's fade; and the perks' terms and effects; and the ring
 * bench's rules, sheet, view, actions and scene, and the wedding's rules; and the homestead's and the household's
 * rules, the homestead's sheet, view, actions and map rows, the morning's house answer, the night level's card and the
 * household player; and the story pack's delivery, its index and released pack; and the HD-2D farm's stage:
 *three.js, uma-stage's band stage and its stand-in kit, the stage Home, its helpers and the farm's design, and
 * kit-farm's loader with its atlas; and the Umas on the stage, their figures and looks.
 * Paths
 * match a module id exactly or as its suffix. */
export const LAZY_MODULES = [
  'phaser/dist/phaser.esm.js',
  '@luismlorenzana/uma-kit/dist/hub/scene/createHubGame.js',
  '@luismlorenzana/uma-kit/dist/hub/scene/HubScene.js',
  'src/loop/FarmMap.tsx',
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
  'domain/src/farm/dorm.ts',
  'domain/src/romance/chats.ts',
  'src/loop/DormPage.tsx',
  'src/loop/GatePeek.tsx',
  'domain/src/farm/diary.ts',
  'domain/src/story/chapters.ts',
  'domain/src/story/chapter-1.ts',
  'domain/src/story/cast.ts',
  'src/loop/ScenePlayer.tsx',
  'src/loop/goal-words.ts',
  'src/loop/NameSheet.tsx',
  'src/story/load.ts',
  'domain/src/story/stand-in.ts',
  'domain/src/story/pack.ts',
  'domain/src/story/placeholders.ts',
  'domain/src/story/authored.ts',
  'domain/src/romance/arrivals.ts',
  'domain/src/romance/love.ts',
  'src/loop/Love.tsx',
  'src/loop/love-words.ts',
  'domain/src/romance/acts.ts',
  'domain/src/romance/praise.ts',
  'domain/src/romance/days.ts',
  'domain/src/romance/ready.ts',
  'domain/src/farm/bonds.ts',
  'src/loop/HeartsPage.tsx',
  'src/loop/HeartProfile.tsx',
  'src/loop/HeartMarks.tsx',
  'src/loop/hearts-view.ts',
  'src/loop/RosterAlbum.tsx',
  'domain/src/romance/perks.ts',
  'src/loop/PairPlayer.tsx',
  'src/loop/Conversations.tsx',
  'src/loop/EventPlayer.tsx',
  'src/loop/PlaySheet.tsx',
  'src/loop/EventCards.tsx',
  'src/loop/event-view.ts',
  'src/loop/event-actions.ts',
  'src/loop/Memories.tsx',
  'src/loop/MemoriesShelf.tsx',
  'domain/src/romance/events.ts',
  'domain/src/romance/plays/grade.ts',
  'domain/src/romance/plays/cast.ts',
  'domain/src/romance/plays/rhythm.ts',
  'domain/src/romance/plays/pick.ts',
  'domain/src/romance/plays/walk.ts',
  'domain/src/romance/plays/choose.ts',
  'domain/src/romance/plays/which.ts',
  'uma-art/emote/atlas.json',
  'domain/src/romance/evening.ts',
  'src/loop/evening-view.ts',
  'src/loop/evening-actions.ts',
  'src/loop/EveningPlayer.tsx',
  'src/loop/Tonight.tsx',
  'src/loop/InviteAnswer.tsx',
  'src/loop/night-fade.ts',
  'domain/src/romance/perk-terms.ts',
  'domain/src/romance/perk-effects.ts',
  'domain/src/romance/bench.ts',
  'domain/src/romance/wedding.ts',
  'domain/src/story/bench.ts',
  'src/loop/BenchSheet.tsx',
  'src/loop/BenchScene.tsx',
  'src/loop/bench-view.ts',
  'src/loop/bench-actions.ts',
  'domain/src/romance/homestead.ts',
  'domain/src/romance/household.ts',
  'src/loop/homestead-view.ts',
  'src/loop/homestead-actions.ts',
  'src/loop/HomesteadSheet.tsx',
  'src/loop/homestead-map.tsx',
  'src/loop/HouseAnswer.tsx',
  'src/loop/NightLevel.tsx',
  'src/loop/HouseholdPlayer.tsx',
  'src/story/delivery.ts',
  'domain/src/story/release.ts',
  'three/build/three.module.js',
  'three/build/three.core.js',
  '@luismlorenzana/uma-stage/dist/esm/stage/bandStage.js',
  '@luismlorenzana/uma-stage/dist/esm/world/standInFarm.js',
  'src/loop/FarmStage.tsx',
  'src/loop/farm-stage.ts',
  'domain/src/farm/stage.ts',
  'src/loop/farm-kit.ts',
  'uma-art/kit-farm/atlas.json',
  'src/loop/farm-figures.ts',
  'src/loop/figure-looks.ts',
]

/** Where the HD-2D preview builds (apps/web/vite.config.ts): out of the precache, cached on first use. */
export const STAGE_DIR = 'assets/stage/'

/** The precache's URLs, read from the built service worker (workbox's `precacheAndRoute` list). */
export function precacheUrls(sw) {
  return [...sw.matchAll(/\{url:"([^"]+)",revision:(?:"[^"]*"|null)\}/g)].map((m) => m[1])
}

/** What's wrong with the preview's place in the service worker: a stage file precached, no runtime route for them, or a
 * chunk outside the stage that imports one statically (it would miss offline). `manifest` is Vite's build manifest. */
export function stagePrecacheProblems(sw, manifest) {
  const problems = precacheUrls(sw).filter((url) => url.startsWith(STAGE_DIR)).map((url) => `${url} is precached`)
  if (!sw.includes(`pathname.startsWith("/${STAGE_DIR}")`)) problems.push(`no runtime route for /${STAGE_DIR}`)
  const stage = (key) => manifest[key]?.file?.startsWith(STAGE_DIR) ?? false
  for (const [key, node] of Object.entries(manifest)) {
    if (stage(key) || !node.file?.endsWith('.js')) continue
    for (const dep of node.imports ?? []) if (stage(dep)) problems.push(`${node.file} imports ${manifest[dep].file} statically`)
  }
  return problems
}

/** The preview's built files and their sizes, after checking they're out of the precache. */
export async function checkStage(distDir) {
  const sw = await readFile(resolve(distDir, 'sw.js'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(distDir, '.vite/manifest.json'), 'utf8'))
  const problems = stagePrecacheProblems(sw, manifest)
  const files = [...new Set(Object.values(manifest).map((node) => node.file).filter((file) => file?.startsWith(STAGE_DIR)))]
  if (!files.some((file) => file.endsWith('.js'))) problems.push(`no stage chunk under ${STAGE_DIR}`)
  if (problems.length > 0) throw new Error(`The HD-2D preview's precache: ${problems.join('; ')}`)
  const precached = precacheUrls(sw)
  const sized = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(assetPath(distDir, file, /^assets\/stage\/[\w.-]+\.(js|png)$/))
    return { file, bytes: bytes.byteLength, gzip: file.endsWith('.js') ? gzipSync(bytes).byteLength : null }
  }))
  return { files: sized, precached: precached.length }
}

/** Modules no production build may hold at all: the invented stand-in pack is the tests' only. A path ending in `/` is a
 * folder. */
export const DEV_ONLY_MODULES = ['domain/src/story/stand-in.ts', 'domain/src/story/stand-in/']

/** The dev-only modules any chunk renders. */
export function devOnlyInBuild(chunks, devOnly = DEV_ONLY_MODULES) {
  return Object.entries(chunks).flatMap(([file, modules]) => modules
    .filter((id) => devOnly.some((path) => (path.endsWith('/') ? id.includes(`/${path}`) || id.startsWith(path) : id === path || id.endsWith(`/${path}`))))
    .map((id) => `${id} (${file})`))
}

export function entrySrc(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].filter(([tag]) => /\btype\s*=\s*["']module["']/i.test(tag))
  const sources = scripts.flatMap(([tag]) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    return src ? [src] : []
  })
  if (sources.length !== 1) throw new Error('Expected one module entry in dist/index.html')
  return sources[0]
}
function assetPath(distDir, source, pattern = /^\/?assets\/[\w.-]+\.js$/) {
  if (typeof source !== 'string' || !pattern.test(source)) throw new Error(`Unsafe JS asset: ${source}`)
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
  const devOnly = devOnlyInBuild(chunks)
  if (devOnly.length > 0) throw new Error(`The build holds the tests' stand-in: ${devOnly.join(', ')}`)
  return { entry, mainGzip, initialGzip, files: sizes, lazy: lazy.length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkSize(resolve(process.argv[2] ?? 'dist'))
    console.log(`Main JS: ${(result.mainGzip / 1000).toFixed(2)} KB gzip / ${MAIN_JS_BUDGET / 1000} KB budget`)
    console.log(`Initial JS: ${(result.initialGzip / 1000).toFixed(2)} KB gzip across ${result.files.length} static chunk(s)`)
    const stage = await checkStage(resolve(process.argv[2] ?? 'dist'))
    for (const f of stage.files) console.log(`Stage, not precached: ${f.file} ${(f.bytes / 1000).toFixed(2)} KB${f.gzip === null ? '' : ` (${(f.gzip / 1000).toFixed(2)} KB gzip)`}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
