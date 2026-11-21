// Check the approved launch roster through the same readers the game uses.
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStoryIndex, readPack, releasedStoryPack, STORY_INDEX, SOURCE } from './release.mjs'

const { LAUNCH_CAST } = await import('../../packages/domain/src/story/launch.ts')
const { readStoryPack, tiedPairs } = await import('../../packages/domain/src/story/pack.ts')
const { NIGHT_BEATS } = await import('../../packages/domain/src/story/authored.ts')
const { DUO_LIMIT, duoKey } = await import('../../packages/domain/src/save/long-game.ts')

export { LAUNCH_CAST }

export function launchDuoIssues(pack, roster = LAUNCH_CAST) {
  const issues = []
  const cast = new Set(pack.cast.umas.map(uma => uma.characterId))
  const launch = new Set(roster)
  const expansion = new Set(pack.world?.expansionCast ?? [])
  const pairs = pack.household?.duos ?? []
  const corePairs = pairs.filter(duo => duo.every(id => launch.has(id)))
  const target = roster.length * DUO_LIMIT / 2
  if (corePairs.length !== target) issues.push(`Expected ${target} unique launch duos, found ${corePairs.length}`)
  for (const id of roster) {
    if (!cast.has(id)) issues.push(`Launch cast is missing ${id}`)
    if (corePairs.filter(duo => duo.includes(id)).length !== DUO_LIMIT) issues.push(`${id}: expected ${DUO_LIMIT} launch partners`)
  }
  const ties = tiedPairs(pack.ties)
  for (const duo of pairs) {
    const key = duoKey(duo)
    if (duo.some(id => !launch.has(id) && !expansion.has(id))) issues.push(`${key}: outside the playable roster`)
    if (!ties.has(key)) issues.push(`${key}: missing tie`)
    for (let level = 1; level <= 5; level++) {
      if (!pack.pairs.get(key)?.has(level)) issues.push(`${key}: missing Bond ${level}`)
    }
    for (const id of duo) for (const beat of NIGHT_BEATS) {
      if (!pack.household?.duoLines?.[key]?.[id]?.[beat]) issues.push(`${key}: missing ${id} ${beat}`)
    }
  }
  return issues
}

async function checkRelease(dir) {
  const index = parseStoryIndex(JSON.parse(await readFile(join(dir, STORY_INDEX), 'utf8')))
  const pack = await releasedStoryPack(index, async (_name, file) => {
    const bytes = await readFile(join(dir, file.path))
    if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) {
      throw new Error(`${file.path}: content hash or size mismatch`)
    }
    return JSON.parse(bytes.toString('utf8'))
  })
  const issues = launchDuoIssues(pack)
  // Load each selected pair as the game does so indexed levels are checked against the corresponding file.
  for (const [a, b] of pack.household?.duos ?? []) {
    if (!(await pack.pair(a, b))) issues.push(`${a}:${b}: missing pair file`)
  }
  return { issues, label: `Release ${index.number ?? index.release}` }
}

async function main(args) {
  if (args.length === 1 && args[0] === '--roster') {
    console.log(JSON.stringify(LAUNCH_CAST))
    return
  }
  let result
  if (args[0] === '--release' && args.length === 2) result = await checkRelease(resolve(args[1]))
  else if (args.length === 0 || (args[0] === '--from' && args.length === 2)) {
    const read = await readPack(args[1] ?? SOURCE)
    const checked = readStoryPack(read.files)
    result = { issues: [...read.errors, ...checked.errors, ...launchDuoIssues(checked.pack)], label: 'Farm story source' }
  } else throw new Error('Usage: pnpm story:duos [--roster | --from <story directory> | --release <release directory>]')
  if (result.issues.length) throw new Error(result.issues.join('\n'))
  console.log(`${result.label}: 50 playable Umas, 75 launch duos, five bond levels and four nightly beats per member of every pair.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1 })
}
