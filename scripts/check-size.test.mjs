import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import test from 'node:test'
import { checkSize, devOnlyInBuild, entrySrc, LAZY_MODULES, lazyInInitial, MAIN_JS_BUDGET, precacheUrls, stagePrecacheProblems } from './check-size.mjs'

async function fixture(fn, { mainBytes = 1_000, chunks = { 'assets/main.js': ['src/main.tsx'] }, lazyFile = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'size-test-'))
  try {
    await mkdir(join(root, '.vite'))
    await mkdir(join(root, 'assets'))
    await writeFile(join(root, 'index.html'), '<script crossorigin src="/assets/main.js" type="module"></script>')
    const manifest = { 'index.html': { file: 'assets/main.js', isEntry: true, dynamicImports: ['lazy'] }, lazy: { file: 'assets/lazy.js' } }
    await writeFile(join(root, '.vite/manifest.json'), JSON.stringify(manifest))
    await writeFile(join(root, 'assets/main.js'), noise(mainBytes))
    if (lazyFile) await writeFile(join(root, 'assets/lazy.js'), noise(400_000))
    if (chunks) await writeFile(join(root, '.vite/chunks.json'), JSON.stringify(chunks))
    await fn(root)
  } finally { await rm(root, { recursive: true, force: true }) } // Only this freshly created fixture directory.
}
// Incompressible text: random bytes as base64, so gzip can't shrink it below the budget.
const noise = (length) => randomBytes(length).toString('base64').slice(0, length)

test('the budget is the platform rule, 180 KB', () => assert.equal(MAIN_JS_BUDGET, 180_000))

test('a small entry passes, and a large lazy chunk does not count', () => fixture(async (root) => {
  const result = await checkSize(root)
  assert.equal(result.entry, 'assets/main.js')
}, { lazyFile: true }))

test('an entry over the budget fails', () => fixture(async (root) => {
  await assert.rejects(checkSize(root), /exceeds 180000/)
}, { mainBytes: 400_000 }))

test('a missing chunk map fails', () => fixture(async (root) => {
  await assert.rejects(checkSize(root), /chunks\.json/)
}, { chunks: null }))

test('a lazy module rendered in the initial JS fails', () => {
  assert.deepEqual(lazyInInitial({ 'assets/main.js': ['src/scene/engine.ts'] }, ['assets/main.js'], ['src/scene/engine.ts']),
    ['src/scene/engine.ts (assets/main.js)'])
})

test('the Hub scene and its Phaser load on demand, by suffix through pnpm\'s store, and the scene player too', () => {
  const scene = '../../node_modules/.pnpm/@luismlorenzana+uma-kit@0.17.0_x/node_modules/@luismlorenzana/uma-kit/dist/hub/scene/createHubGame.js'
  const phaser = '../../node_modules/.pnpm/phaser@4.2.1/node_modules/phaser/dist/phaser.esm.js'
  assert.equal(lazyInInitial({ 'assets/main.js': [scene, phaser, 'src/loop/ScenePlayer.tsx', 'src/main.tsx'] }, ['assets/main.js'], LAZY_MODULES).length, 3)
})

test('the HD-2D farm\'s stage, three.js and the farm\'s design load on demand, by suffix through pnpm\'s store', () => {
  const three = '../../node_modules/.pnpm/three@0.187.0/node_modules/three/build/three.module.js'
  const band = '../../node_modules/.pnpm/@luismlorenzana+uma-stage@0.3.0_x/node_modules/@luismlorenzana/uma-stage/dist/esm/stage/bandStage.js'
  const modules = [three, band, 'src/loop/FarmStage.tsx', 'src/loop/farm-stage.ts', '../../packages/domain/src/farm/stage.ts', 'src/app/stage-switch.ts', 'src/main.tsx']
  assert.equal(lazyInInitial({ 'assets/main.js': modules }, ['assets/main.js'], LAZY_MODULES).length, 5)
})

test('kit-farm\'s loader and its atlas load on demand with the stage', () => {
  const atlas = '../../node_modules/.pnpm/@luismlorenzana+uma-art@2.27.0/node_modules/@luismlorenzana/uma-art/kit-farm/atlas.json'
  assert.equal(lazyInInitial({ 'assets/main.js': ['src/loop/farm-kit.ts', atlas, 'src/main.tsx'] }, ['assets/main.js'], LAZY_MODULES).length, 2)
})

// A built service worker's shape, minified as workbox writes it.
const sw = (urls, route = true) => `define(["./workbox-1"],(function(s){s.precacheAndRoute([${urls.map((u) => `{url:"${u}",revision:null}`).join(',')}],{}),`
  + (route ? 's.registerRoute((({url:s,sameOrigin:e})=>e&&s.pathname.startsWith("/assets/stage/")),new s.CacheFirst({cacheName:"farm-stage"}),"GET")' : '') + '}));'
const manifest = {
  'index.html': { file: 'assets/index.js', isEntry: true, dynamicImports: ['src/loop/FarmMap.tsx'] },
  'src/loop/FarmMap.tsx': { file: 'assets/FarmMap.js', imports: ['index.html'], dynamicImports: ['src/loop/FarmStage.tsx'] },
  'src/loop/FarmStage.tsx': { file: 'assets/stage/FarmStage.js', imports: ['index.html', 'src/loop/FarmMap.tsx'] },
  'atlas.png': { file: 'assets/stage/kit-farm.png' },
}

test('the HD-2D preview stays out of the precache, cached on first use instead', () => {
  assert.deepEqual(precacheUrls(sw(['index.html', 'assets/index.js'])), ['index.html', 'assets/index.js'])
  assert.deepEqual(stagePrecacheProblems(sw(['index.html', 'assets/index.js', 'assets/FarmMap.js']), manifest), [])
  assert.deepEqual(stagePrecacheProblems(sw(['assets/index.js', 'assets/stage/FarmStage.js', 'assets/stage/kit-farm.png']), manifest),
    ['assets/stage/FarmStage.js is precached', 'assets/stage/kit-farm.png is precached'])
  assert.deepEqual(stagePrecacheProblems(sw(['assets/index.js'], false), manifest), ['no runtime route for /assets/stage/'])
})

test('no precached chunk imports a stage chunk statically, or it would miss offline', () => {
  const shared = { ...manifest, 'src/loop/FarmMap.tsx': { file: 'assets/FarmMap.js', imports: ['index.html', 'src/loop/FarmStage.tsx'] } }
  assert.deepEqual(stagePrecacheProblems(sw(['assets/index.js']), shared), ['assets/FarmMap.js imports assets/stage/FarmStage.js statically'])
})

test('the HTML must have exactly one module entry', () => {
  assert.equal(entrySrc('<script type="module" src="/assets/a.js"></script>'), '/assets/a.js')
  assert.throws(() => entrySrc('<script src="/a.js"></script>'))
})

test("no chunk of a production build holds the tests' stand-in pack, lazy or not", async () => {
  const standIn = ['../../packages/domain/src/story/stand-in.ts', '../../packages/domain/src/story/stand-in/routes/9000001.json']
  assert.deepEqual(devOnlyInBuild({ 'assets/main.js': ['src/main.tsx'], 'assets/load.js': ['src/story/load.ts', ...standIn] }),
    standIn.map((id) => `${id} (assets/load.js)`))
  assert.deepEqual(devOnlyInBuild({ 'assets/load.js': ['src/story/load.ts', '../../packages/domain/src/story/release.ts', '../../packages/domain/src/story/placeholders.ts'] }), [])
  await fixture(async (root) => {
    await assert.rejects(checkSize(root), /stand-in: \.\.\/\.\.\/packages\/domain\/src\/story\/stand-in\.ts \(assets\/lazy\.js\)/)
  }, { chunks: { 'assets/main.js': ['src/main.tsx'], 'assets/lazy.js': [standIn[0]] } })
})
