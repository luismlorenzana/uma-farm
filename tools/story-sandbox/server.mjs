#!/usr/bin/env node
// The Farm Story Sandbox: a local-only page for reading, playing and checking uma-farm's story
// (docs/design/story-sandbox.md). It binds to loopback and reads, on every request:
// - F40's private story in content/story/ (the world, the cast, the ties, the bibles, routes and pairs), checked by the
//   domain's own validator (`story/authored.ts`), with the Umas' faces from the cast pack;
// - the chapter drafts in docs/story/ (original, in git) and the game's story in @farm/domain.
// Its only write is the owner's reviews, to the private content/story/reviews.json.
import { createServer } from 'node:http'
import { readdir, readFile, realpath, rename, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGame } from './lib/game.mjs'
import {
  BEAT_HEARTS, BOND_HEARTS, BUBBLE_LINE_LIMIT, CONVERSATION_TARGET, DISTANCES, LAYERS, SAMPLE_CREW, SCENE_LINE_LIMIT, SPEAKERS,
  crossCheck, parseBeats, parseChapter, parseConversations,
} from './lib/model.mjs'
import { packUmas, parseCastPack } from './lib/pack.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const drafts = resolve(process.env.UMA_FARM_STORY ?? join(repo, 'docs/story'))
/** The private side (ignored by git): F40's story, the cast pack and the reviews. */
const content = resolve(process.env.UMA_FARM_CONTENT ?? join(repo, 'content/story'))
const domain = join(repo, 'packages/domain/src')
const port = Number(process.env.UMA_FARM_STORY_PORT ?? 4321)
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port')

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
}
/** The page's files; the model is the tested one, shared with the server. */
const pages = {
  '/': 'public/index.html', '/app.js': 'public/app.js', '/app.css': 'public/app.css', '/views.js': 'public/views.js', '/player.js': 'public/player.js',
  '/bonds.js': 'public/bonds.js', '/people.js': 'public/people.js', '/model.js': 'lib/model.mjs',
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const maybeJson = async (path, fallback) => { try { return await readJson(path) } catch (e) { if (e.code === 'ENOENT') return fallback; throw e } }
const maybeText = async (path) => { try { return await readFile(path, 'utf8') } catch (e) { if (e.code === 'ENOENT') return null; throw e } }

async function inside(root, path) {
  const [base, file] = await Promise.all([realpath(root), realpath(resolve(root, path))])
  if (!file.startsWith(base + sep)) throw Object.assign(new Error('Outside the content folder'), { status: 403 })
  return file
}

/** The newest cast pack copied here, or null. */
async function currentPack() {
  const packs = []
  for (const id of (await readdir(join(content, 'pack')).catch(() => [])).filter((n) => /^[a-z0-9-]+$/.test(n))) {
    try { packs.push(parseCastPack(await readJson(join(content, 'pack', id, 'pack.json')))) } catch { /* not a pack */ }
  }
  return packs.sort((a, b) => String(b.exportedAt).localeCompare(String(a.exportedAt)))[0] ?? null
}

/** F40's story as it stands: each file with the domain validator's issues. The cast's ids are the export's Umas. */
async function storyState(game, errors) {
  const pack = await currentPack()
  const umas = pack ? packUmas(pack) : []
  const v = game.ok ? game.validator : null
  const ctx = { umas: new Set(umas.map((u) => u.id)) }
  const file = async (name, check) => {
    try {
      const data = await maybeJson(join(content, name), null)
      return data === null ? null : { file: `content/story/${name}`, data, issues: v ? check(data) : ['The game’s validator didn’t load'] }
    } catch (e) { errors.push({ file: `content/story/${name}`, error: e.message }); return null }
  }
  const folder = async (dir, check) => {
    const out = []
    for (const name of (await readdir(join(content, dir)).catch(() => [])).filter((n) => n.endsWith('.json')).sort()) {
      const entry = await file(`${dir}/${name}`, check)
      if (entry) out.push(entry)
    }
    return out
  }
  const bibles = await folder('umas', (d) => v.bibleIssues(d, ctx))
  const bibleOf = (id) => bibles.find((b) => b.data.characterId === id)?.data ?? null
  return {
    pack: pack ? { id: pack.id, exportedAt: pack.exportedAt } : null,
    umas,
    world: await maybeText(join(content, 'world.md')),
    cast: await file('cast.json', (d) => v.castIssues(d, ctx)),
    ties: await file('ties.json', (d) => v.tiesIssues(d, ctx)),
    bibles,
    routes: await folder('routes', (d) => v.routeIssues(d, bibleOf(d?.characterId), ctx)),
    pairs: await folder('pairs', (d) => v.pairIssues(d, ctx)),
    // F54: the household's scenes, house lines and finale.
    household: await file('household.json', (d) => v.householdIssues(d, ctx)),
  }
}

async function state() {
  const { validator, ...game } = await loadGame(domain)
  const errors = []
  const chapters = []
  for (const name of (await readdir(join(drafts, 'chapters')).catch(() => [])).filter((n) => n.endsWith('.json')).sort()) {
    try { chapters.push({ file: `docs/story/chapters/${name}`, ...parseChapter(await readJson(join(drafts, 'chapters', name)), game) }) } catch (e) { errors.push({ file: `docs/story/chapters/${name}`, error: e.message }) }
  }
  chapters.sort((a, b) => a.chapter.chapter - b.chapter.chapter)
  let beats = []
  try { beats = parseBeats(await maybeJson(join(drafts, 'beats.json'), { schemaVersion: 1, kind: 'farm-story-beats', beats: [] }), game) } catch (e) { errors.push({ file: 'docs/story/beats.json', error: e.message }) }
  let conversations = []
  try { conversations = parseConversations(await maybeJson(join(drafts, 'conversations.json'), { schemaVersion: 1, kind: 'farm-conversations', templates: [] }), game) } catch (e) { errors.push({ file: 'docs/story/conversations.json', error: e.message }) }
  const story = await storyState({ ...game, validator }, errors)
  const reviews = await maybeJson(join(content, 'reviews.json'), { schemaVersion: 1, items: {} })
  return {
    game, story, chapters, beats, conversations, errors, reviews,
    cross: crossCheck(chapters.map((c) => c.chapter), beats.map((b) => b.beat), conversations.map((c) => c.template), game),
    speakers: SPEAKERS, layers: LAYERS, crew: SAMPLE_CREW, distances: DISTANCES, beatHearts: BEAT_HEARTS, bondHearts: BOND_HEARTS,
    target: CONVERSATION_TARGET, limits: { scene: SCENE_LINE_LIMIT, bubble: BUBBLE_LINE_LIMIT },
  }
}

async function body(request) {
  const chunks = []; let size = 0
  for await (const chunk of request) { size += chunk.length; if (size > 64 * 1024) throw Object.assign(new Error('Too large'), { status: 413 }); chunks.push(chunk) }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

let reviewWrite = Promise.resolve()
/** The owner's verdict on a file or an event (F40: liked, rework, question, and a note), to the private reviews.json. */
async function saveReview(input) {
  const ok = input && typeof input.item === 'string' && /^[A-Za-z0-9._:/-]{1,120}$/.test(input.item) &&
    (input.status === null || ['liked', 'rework', 'question'].includes(input.status)) && typeof input.note === 'string' && input.note.length <= 4000
  if (!ok) throw Object.assign(new Error('Invalid review'), { status: 400 })
  const work = reviewWrite.then(async () => {
    const path = join(content, 'reviews.json')
    const current = await maybeJson(path, { schemaVersion: 1, items: {} })
    if (input.status === null && !input.note.trim()) delete current.items[input.item]
    else current.items[input.item] = { status: input.status, note: input.note, updatedAt: new Date().toISOString() }
    current.items = Object.fromEntries(Object.entries(current.items).sort(([a], [b]) => a.localeCompare(b)))
    await writeFile(path + '.part', JSON.stringify(current, null, 2) + '\n')
    await rename(path + '.part', path)
    return current
  })
  reviewWrite = work.catch(() => undefined)
  return work
}

function send(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(data))
}

const server = createServer((request, response) => {
  (async () => {
    const host = request.headers.host
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return send(response, 403, { error: 'Use the loopback URL' })
    response.setHeader('x-content-type-options', 'nosniff')
    response.setHeader('content-security-policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
    const url = new URL(request.url ?? '/', `http://${host}`)
    if (request.method === 'PUT' && url.pathname === '/api/reviews') {
      const sameOrigin = (!request.headers.origin || request.headers.origin === `http://${host}`) && request.headers['sec-fetch-site'] !== 'cross-site'
      if (!sameOrigin || request.headers['content-type']?.split(';')[0] !== 'application/json') return send(response, 403, { error: 'Save from the local page' })
      return send(response, 200, await saveReview(await body(request)))
    }
    if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed' })
    if (url.pathname === '/api/state') return send(response, 200, await state())
    // An Uma's picture, only when the pack lists it.
    const img = url.pathname.match(/^\/img\/([a-z0-9-]+)\/([A-Za-z0-9._-]+\.(?:png|webp|jpg))$/)
    if (img) {
      const pack = parseCastPack(await readJson(join(content, 'pack', img[1], 'pack.json')))
      if (!pack.characters.some((c) => Object.values(c.images ?? {}).includes(`images/${img[2]}`))) return send(response, 404, { error: 'Not a pack image' })
      const file = await inside(join(content, 'pack', img[1], 'images'), img[2])
      response.writeHead(200, { 'content-type': types[extname(file)], 'cache-control': 'max-age=86400' })
      return response.end(await readFile(file))
    }
    const page = pages[url.pathname]
    if (!page) return send(response, 404, { error: 'Not found' })
    response.writeHead(200, { 'content-type': types[extname(page)], 'cache-control': 'no-cache' })
    response.end(await readFile(join(here, page)))
  })().catch((error) => {
    if (response.headersSent) return response.end()
    send(response, error.status ?? (error.code === 'ENOENT' ? 404 : 500), { error: error.message })
  })
})
server.listen(port, '127.0.0.1', () => console.log(`Farm Story Sandbox: http://127.0.0.1:${port}  (story: ${content})`))
