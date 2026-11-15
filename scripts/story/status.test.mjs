// The story status on invented packs only (the stand-in's numbering, 9000001 on): per Uma, hers, the default and missing
// by part, what's left of her and the notes on the marker; every Uma with a route unless named. No real character, name
// or line.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { scaffold } from './scaffold.mjs'
import { parseArgs, status, statusLines, withRoute } from './status.mjs'

const id = (n) => String(9_000_000 + n)

async function packOf(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'story-status-'))
  t.after(() => rm(root, { recursive: true, force: true })) // Only this freshly created folder.
  const dir = join(root, 'story')
  for (const [name, value] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true })
    await writeFile(join(dir, name), `${JSON.stringify(value, null, 2)}\n`)
  }
  return { dir, env: { STORY_DIR: dir, STORY_PLATFORM_DIR: join(root, 'nowhere') } }
}

const invented = {
  'cast.json': { umas: [{ characterId: id(1), calling: 'fishing' }, { characterId: id(2), calling: 'farming' }, { characterId: id(3), calling: 'mining' }] },
  [`routes/${id(2)}.json`]: { events: [{ id: 'f1', steps: [{ narrate: 'An invented afternoon.' }, { choice: [{ text: 'Yes.', friendship: 2 }, { text: 'No.', friendship: 1 }] }] }] },
  [`routes/${id(3)}.json`]: { events: [{ id: 'f2', steps: [{ narrate: 'Another.' }, { choice: [{ text: 'Yes.', friendship: 2 }, { text: 'No.', friendship: 1 }] }] }] },
}

test('every Uma with a route, in the cast’s order: hers, the default and missing by part, and what’s left', async (t) => {
  const { env } = await packOf(t, invented)
  const lines = await status({ env, master: null })
  const said = lines.join('\n')
  assert.match(lines[0], /^Story status: .*story, every Uma with a route \(2 Umas\)$/)
  assert.match(said, new RegExp(`^${id(2)}\\s+0 · 0 · 2\\s+0 · 0 · 40\\s+1 · 0 · 69\\s+missing pieces$`, 'm'))
  assert.match(said, /0 of 2 complete \(nothing missing\); 0 all hers/)
  assert.match(said, new RegExp(`  ${id(2)}\\n    cast: missing schedule, chapters\\n    bible: missing favouriteLine, gifts, chats`))
  assert.match(said, /route: missing arrival, f2–f10, confession/)
  assert.ok(!said.includes(id(1)), 'no route, so not listed unless named')
  assert.deepEqual(withRoute({ cast: invented['cast.json'], routes: { [id(3)]: {}, [id(9)]: {}, [id(2)]: {} } }), [id(2), id(3), id(9)])
})

test('scaffolded, each named has her new pieces the default, missing only what the default story has no words for; a rewritten piece still marked is noted', async (t) => {
  const { dir, env } = await packOf(t, invented)
  // The scaffold names her from master data: an invented release.
  const master = join(dir, '..', 'release')
  await mkdir(join(master, 'data'), { recursive: true })
  await writeFile(join(master, 'manifest.json'), JSON.stringify({ sets: { characters: 'data/c.json', outfits: 'data/o.json' } }))
  await writeFile(join(master, 'data/c.json'), JSON.stringify({ items: [1, 2, 3].map((n) => ({ id: 9_000_000 + n, name: { en: `Invented ${n}` } })) }))
  await writeFile(join(master, 'data/o.json'), JSON.stringify({ items: [] }))
  await scaffold({ ids: `${id(1)},${id(2)}`, env: { ...env, STORY_MASTER_DIR: master }, log: () => {} })
  const lines = await status({ ids: `${id(1)},${id(2)}`, env: { ...env, STORY_MASTER_DIR: master } })
  const said = lines.join('\n')
  assert.match(said, new RegExp(`^${id(1)}\\s+Invented 1\\s+0 · 2 · 0\\s+0 · 37 · 3\\s+0 · 59 · 11\\s+missing pieces$`, 'm'))
  assert.match(said, new RegExp(`^${id(2)}\\s+Invented 2\\s+0 · 2 · 0\\s+0 · 37 · 3\\s+1 · 58 · 11\\s+missing pieces$`, 'm'))
  assert.match(said, /0 of 2 complete \(nothing missing\); 0 all hers/)
  // What the default story has no words for: hers to write.
  assert.match(said, /bible: missing greetings, smallTalk, giftLines; default/)
  assert.match(said, /route: missing flower-show-night, cooking-contest-night, animal-show-night, harvest-cup-night, anniversary, blossom-viewing, wishing-night, first-cold-evening, first-snow, longest-night, sweets-day; default/)
  assert.ok(!said.includes('Notes on the marker'))

  // A piece rewritten in her words, its marker left: noted. One unmarked: hers.
  const routeFile = join(dir, `routes/${id(1)}.json`)
  const route = JSON.parse(await readFile(routeFile, 'utf8'))
  route.events.find((e) => e.id === 'f4').steps.push({ narrate: 'Her own line.' })
  delete route.events.find((e) => e.id === 'f5').draft
  await writeFile(routeFile, JSON.stringify(route))
  const again = (await status({ ids: id(1), env, master: null })).join('\n')
  assert.match(again, new RegExp(`^${id(1)}\\s+0 · 2 · 0\\s+0 · 37 · 3\\s+1 · 58 · 11\\s+missing pieces$`, 'm'))
  assert.match(again, new RegExp(`Notes on the marker \\(1\\), which block nothing:\\n  - routes/${id(1)}.json: f4 is marked "draft": "default" but its words aren’t the default’s: rewritten\\? remove the marker`))
})

test('the whole cast with --all; the lines alone; the command line', async (t) => {
  const { env } = await packOf(t, invented)
  assert.match((await status({ all: true, env, master: null })).join('\n'), /the whole cast \(3 Umas\)/)
  const lines = statusLines({ cast: { umas: [] }, umas: {}, routes: {} }, [id(5)], new Map([[id(5), 'Invented Five']]))
  assert.match(lines.join('\n'), new RegExp(`^${id(5)}\\s+Invented Five\\s+0 · 0 · 2`, 'm'))
  assert.deepEqual(parseArgs(['--tier', '1']), { tier: '1' })
  assert.deepEqual(parseArgs(['--all', '--from', 'x']), { all: true, from: 'x' })
  assert.throws(() => parseArgs(['--all', '--ids', id(1)]), /one at a time/)
  assert.throws(() => parseArgs(['--every']), /Unknown: --every/)
})
