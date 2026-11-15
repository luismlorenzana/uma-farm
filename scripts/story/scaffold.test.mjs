// The story scaffold on invented packs only: a cast in the stand-in's numbering (9000001 on), an invented Ranker plan and
// invented master data, all in temporary folders. No real character, name or line. It writes only what's missing, marked
// "draft": "default", backs up every file it changes, and a second run writes nothing.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { releaseCheck, readPack } from './release.mjs'
import { parseArgs, scaffold } from './scaffold.mjs'
import { herName, herTemperament, parseIds, readMaster, StoryToolRefused, tierIds } from './umas.mjs'

const id = (n) => String(9_000_000 + n)
const NOW = new Date('2026-11-14T09:30:00.000Z')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

async function temp(t) {
  const dir = await mkdtemp(join(tmpdir(), 'story-scaffold-'))
  t.after(() => rm(dir, { recursive: true, force: true })) // Only this freshly created folder.
  return dir
}
async function write(dir, files) {
  for (const [name, value] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true })
    await writeFile(join(dir, name), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`)
  }
}

/** An invented world: a pack of three (the first with a route of her own), a Ranker plan whose Tier 1 is them and an
 * invented sister, and master data naming them. `env` points the tools at it. */
async function world(t, { plan = true, master = true } = {}) {
  const root = await temp(t)
  const pack = join(root, 'content/story')
  await write(pack, {
    'cast.json': { umas: [{ characterId: id(1), spot: 'harbour', calling: 'fishing' }, { characterId: id(2), calling: 'farming' }, { characterId: id(3) }] },
    'ties.json': { ties: [] },
    [`umas/${id(1)}.json`]: { characterId: id(1), favouriteLine: 'fishing', gifts: { loved: 'seashell' } },
    [`routes/${id(1)}.json`]: { characterId: id(1), events: [{ id: 'arrival', steps: [{ say: id(1), line: 'An invented hello.' }, { choice: [{ text: 'Hi.', friendship: 2 }, { text: 'Hey.', friendship: 1 }] }] }] },
  })
  const platform = join(root, 'uma-platform')
  if (plan) {
    await write(platform, {
      'content/authoring/ranker/plan.json': {
        boards: [
          { id: 'npcs', order: [{ tier: 'T1', characterId: 9_100_099 }] },
          { id: 'umas', order: [
            { order: 1, tier: 'T1', characterId: 9_000_002, outfitId: 900000201, sister: false },
            { order: 2, tier: 'T1', characterId: 9_000_001, outfitId: 900000101, sister: false },
            { order: 3, tier: 'T1', characterId: 9_000_003, outfitId: 900000301, sister: false },
            { order: 4, tier: 'T2', characterId: 9_000_001, outfitId: 900000102, sister: true },
          ] },
        ],
      },
    })
  }
  if (master) {
    const stats = (speed, stamina, power, guts, wit) => ({ star5: { speed, stamina, power, guts, wit } })
    const growth = { speed: 0, stamina: 0, power: 0, guts: 0, wit: 0 }
    await write(join(platform, 'content/release'), {
      'manifest.json': { sets: { characters: 'data/characters.0001.json', outfits: 'data/outfits.0001.json' } },
      'data/characters.0001.json': { set: 'characters', items: [1, 2, 3].map((n) => ({ id: 9_000_000 + n, name: { en: `Invented ${['Aster', 'Bryony', 'Corra'][n - 1]}` } })) },
      'data/outfits.0001.json': { set: 'outfits', items: [
        { id: 900000101, characterId: 9_000_001, variant: null, stats: stats(90, 90, 90, 90, 120), growthRatePercents: growth },
        { id: 900000102, characterId: 9_000_001, variant: 'summer', stats: stats(120, 90, 90, 90, 90), growthRatePercents: growth },
        { id: 900000201, characterId: 9_000_002, variant: null, stats: stats(90, 120, 90, 90, 90), growthRatePercents: growth },
        { id: 900000301, characterId: 9_000_003, variant: null, stats: stats(90, 90, 120, 90, 90), growthRatePercents: growth },
      ] },
    })
  }
  return { root, pack, platform, env: { STORY_DIR: pack, STORY_PLATFORM_DIR: platform } }
}

const quiet = () => {}
/** Every file under a folder, by its path in it. */
async function tree(dir) {
  if (!existsSync(dir)) return {}
  const out = {}
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) out[join(entry.parentPath ?? entry.path, entry.name).slice(dir.length + 1)] = await readFile(join(entry.parentPath ?? entry.path, entry.name), 'utf8')
  }
  return out
}

test('Tier n is the Ranker’s umas board, in its order; a sister is s<outfitId>; no plan says to name the Umas', async (t) => {
  const { platform, env } = await world(t)
  const plan = join(platform, 'content/authoring/ranker/plan.json')
  assert.deepEqual(await tierIds(1, plan), [id(2), id(1), id(3)])
  assert.deepEqual(await tierIds(2, plan), ['s900000102'])
  await assert.rejects(tierIds(3, plan), /Tier 3 is empty on the Ranker's umas board.*--ids/)
  await assert.rejects(tierIds(1, join(platform, 'nowhere.json')), (e) => e instanceof StoryToolRefused && /No Ranker plan at .*nowhere\.json.*STORY_RANKER_PLAN.*--ids <id,…>/.test(e.message))
  await assert.rejects(tierIds('one', plan), /--tier is a tier's number/)
  assert.deepEqual(parseIds(`${id(1)}, ${id(2)},${id(1)}`), [id(1), id(2)])
  assert.throws(() => parseIds('Aster'), /--ids is a list of character ids/)
  const master = await readMaster(join(platform, 'content/release'))
  assert.equal(herName(master, { umas: [] }, id(1)), 'Invented Aster')
  assert.equal(herName(master, { umas: [] }, 's900000102'), 'Invented Aster’s sister')
  assert.equal(herName(master, { umas: [{ characterId: 's900000102', name: 'Invented Dahlia' }] }, 's900000102'), 'Invented Dahlia')
  assert.deepEqual([id(1), id(2), id(3), 's900000102'].map((x) => herTemperament(master, { umas: [] }, x)), ['clever', 'steady', 'bold', 'breezy'])
  assert.equal(env.STORY_DIR.endsWith('content/story'), true)
})

test('a dry run lists every missing piece and writes nothing', async (t) => {
  const { pack, root, env } = await world(t)
  const before = await tree(pack)
  const lines = []
  const result = await scaffold({ tier: '1', dryRun: true, env, now: NOW, log: (l) => lines.push(l) })
  assert.deepEqual(await tree(pack), before)
  assert.equal(existsSync(join(root, 'content/story-backups')), false)
  const said = lines.join('\n')
  assert.match(said, /Scaffolding Tier 1 \(3 Umas\) in .* \(a dry run: nothing is written\)/)
  assert.match(said, new RegExp(`${id(1)} Invented Aster: would write 91 pieces \\(cast 2, bible 35, route 54\\)`))
  assert.match(said, new RegExp(`${id(3)} Invented Corra: would write 94 pieces \\(cast 2, bible 37, route 55\\)`))
  assert.match(said, /route: arrival, f1–f10, confession, r1–r10, proposal, wedding, invited-to-work, wedding-night, moving-in, s1–s5, hangouts \(walk/)
  assert.match(said, /279 pieces in 7 files would be written/)
  assert.deepEqual(result.files.sort(), ['cast.json', `routes/${id(1)}.json`, `routes/${id(2)}.json`, `routes/${id(3)}.json`, `umas/${id(1)}.json`, `umas/${id(2)}.json`, `umas/${id(3)}.json`])
})

test('writes what’s missing, backs up every file it changes first, and a second run writes nothing', async (t) => {
  const { pack, root, env } = await world(t)
  const before = await tree(pack)
  const first = await scaffold({ ids: `${id(1)},${id(3)}`, env, now: NOW, log: quiet })
  const backup = join(root, 'content/story-backups/2026-11-14T09-30-00Z')
  assert.equal(first.backup, backup)
  // The files as they were: the cast, her bible and her route; the files it made had nothing to back up.
  assert.deepEqual(await tree(backup), { 'cast.json': before['cast.json'], [`umas/${id(1)}.json`]: before[`umas/${id(1)}.json`], [`routes/${id(1)}.json`]: before[`routes/${id(1)}.json`] })
  const route = await readJson(join(pack, `routes/${id(1)}.json`))
  assert.deepEqual(route.events[0], JSON.parse(before[`routes/${id(1)}.json`]).events[0], 'her own arrival is untouched')
  assert.ok(route.events.slice(1).every((e) => e.draft === 'default'))
  assert.match(JSON.stringify(route), /Invented Aster/)
  const bible = await readJson(join(pack, `umas/${id(3)}.json`))
  assert.equal(bible.favouriteLine, 'mining', 'no calling: her line from her outfit’s stats in master data')
  assert.deepEqual(bible.draft, { favouriteLine: 'default', townLines: 'default', mornings: 'default', petName: 'default', wishes: 'default' })
  assert.deepEqual(first.refused, {})
  const cast = await readJson(join(pack, 'cast.json'))
  // Her schedule: the game's default as her routine, marked; no home and no job.
  assert.deepEqual(cast.umas[0], { characterId: id(1), spot: 'harbour', calling: 'fishing', routine: [{ at: 'harbour', days: [1, 4, 7, 10], draft: 'default' }], chapters: cast.umas[0].chapters })
  assert.deepEqual(cast.umas[2].routine, [{ at: 'plaza', days: [3, 6, 9, 12], draft: 'default' }], 'by her place in the cast: the third, no spot of her own')
  assert.equal(cast.umas[2].home, undefined)
  assert.equal(cast.umas[2].job, undefined)
  assert.equal(JSON.stringify(cast.umas[1]), JSON.stringify({ characterId: id(2), calling: 'farming' }), 'an Uma not named is untouched')
  // The game reads it whole.
  const check = releaseCheck((await readPack(pack)).files)
  assert.deepEqual(check.errors, [])
  assert.deepEqual(check.notes.filter((n) => /draft|marker/.test(n)), [])

  const after = await tree(pack)
  const lines = []
  const second = await scaffold({ ids: `${id(1)},${id(3)}`, env, now: new Date('2026-11-15T00:00:00.000Z'), log: (l) => lines.push(l) })
  assert.deepEqual(await tree(pack), after)
  assert.deepEqual(second.files, [])
  assert.equal(second.backup, null)
  assert.equal(existsSync(join(root, 'content/story-backups/2026-11-15T00-00-00Z')), false)
  assert.match(lines.join('\n'), /Nothing missing: nothing written/)
})

test('a file that isn’t JSON is never written over', async (t) => {
  const { pack, env } = await world(t)
  await writeFile(join(pack, `umas/${id(1)}.json`), '{ not json')
  const result = await scaffold({ ids: id(1), env, now: NOW, log: quiet })
  assert.equal(await readFile(join(pack, `umas/${id(1)}.json`), 'utf8'), '{ not json')
  assert.deepEqual(result.refused[id(1)], [`umas/${id(1)}.json isn’t a bible (an object), so none of its pieces is written`])
  assert.ok(result.files.includes(`routes/${id(1)}.json`))
})

test('no master data: a dry run lists by id, a real run is refused before it writes', async (t) => {
  const { pack, env } = await world(t, { master: false })
  const before = await tree(pack)
  const lines = []
  await scaffold({ tier: '1', dryRun: true, env, log: (l) => lines.push(l) })
  assert.match(lines.join('\n'), /No master data at .*: names unknown, so this dry run lists ids only/)
  await assert.rejects(scaffold({ tier: '1', env, log: quiet }), /No master data at .*STORY_MASTER_DIR/)
  assert.deepEqual(await tree(pack), before)
})

test('no plan: --tier says to name the Umas; the command line names them one way', async (t) => {
  const { env } = await world(t, { plan: false })
  await assert.rejects(scaffold({ tier: '1', env, log: quiet }), /No Ranker plan at .*--ids <id,…>/)
  assert.deepEqual(parseArgs(['--tier', '1', '--dry-run']), { dryRun: true, tier: '1' })
  assert.deepEqual(parseArgs(['--', '--ids', `${id(1)},${id(2)}`, '--from', 'x']), { dryRun: false, ids: `${id(1)},${id(2)}`, from: 'x' })
  assert.throws(() => parseArgs(['--dry-run']), /Name the Umas: --tier <n> or --ids <id,…>/)
  assert.throws(() => parseArgs(['--tier']), /--tier needs a value/)
  assert.throws(() => parseArgs(['--force']), /Unknown: --force/)
  await assert.rejects(scaffold({ tier: '1', ids: id(1), env, log: quiet }), /--tier or by --ids, not both/)
})
