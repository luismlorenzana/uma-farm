// Save v3's parse: strict keys, explicit paths, every id checked. Outfit ids are checked by form, as in
// v2: the API has no master data, and an outfit a later release drops still parses. The parts v4 shares live in
// `parse-loop.ts`; the public names re-export from here, where they always were.
import { ACTIVITIES } from '../farm/ranks'
import { isCropId, isGoodId, isWarehouseId, type CropId } from '../goods/ids'
import type { MorningSummary, NewsLine } from '../night/summary'
import { LOOP_REQUESTS } from '../gathering/ids'
import { amount, count, list, object, parseAccount, record } from './parse'
import {
  counts, day, fail, member, none, outfit, parseBinLines, parseBonds, parseBoard, parseBuildings, parseDiary, parseDig, parseDorm, parseExpeditions,
  parseFarm, parseFields, parseNewsLines, parseNudges, parseRanch, parseRankLines, parseRanks, parseTools, parseVisitors, parseWarehouse, parseWork,
  parseWorkLines, parseWorkshops, unique, type LoopRequestKinds,
} from './parse-loop'
import type { RosterUma, SaveV3 } from './v3'

export { LOOP_SLOTS, LOOP_WORK_PLACES } from './parse-loop'
export type { LoopKind, LoopKinds, LoopPlaceId, LoopRequestKind, LoopRequestKinds } from './parse-loop'

export const SAVE_V3_KEYS = [
  'version', 'account', 'calendar', 'gold', 'start', 'today', 'roster', 'dorm', 'visitors', 'items', 'bin', 'work', 'fields', 'crops', 'ranch',
  'places', 'buildings', 'tools', 'workshops', 'expeditions', 'bonds', 'board', 'diary', 'farm', 'summary',
] as const

// --- The roster -----------------------------------------------------------------------------------------------------

function parseRoster(value: unknown, path: string, today: number): Record<string, RosterUma> {
  const out: Record<string, RosterUma> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    outfit(id, at)
    const u = object(raw, at, ['joined', 'ranks', 'affinity', 'wellFed'])
    const joined = day(u.joined, `${at}.joined`)
    if (joined > today) fail(`${at}.joined`, 'after today')
    out[id] = { joined, ranks: parseRanks(u.ranks, `${at}.ranks`), affinity: amount(u.affinity, `${at}.affinity`), wellFed: count(u.wellFed, `${at}.wellFed`) }
  }
  return out
}

// --- The morning summary: ids and counts only, the morning it was built for ---------------------

function parseSummary(value: unknown, path: string, today: number, roster: ReadonlySet<string>): MorningSummary {
  const o = object(value, path, ['day', 'bin', 'work', 'ranks', 'bonds', 'news', 'nudges'])
  if (o.day !== today) fail(`${path}.day`, 'expected today: a summary is the morning it opens on')
  return {
    day: today, bin: parseBinLines(o.bin, `${path}.bin`), work: parseWorkLines(o.work, `${path}.work`), ranks: parseRankLines(o.ranks, `${path}.ranks`, roster),
    bonds: none(o.bonds, `${path}.bonds`), news: parseNewsLines(o.news, `${path}.news`, roster) as NewsLine[], nudges: parseNudges(o.nudges, `${path}.nudges`, roster),
  }
}

/** Parses a save v3. `kinds` is the work kinds' requests (`LOOP_REQUESTS`; tests pass their own kinds). */
export function parseSaveV3(value: unknown, path = 'save', kinds: LoopRequestKinds = LOOP_REQUESTS): SaveV3 {
  const o = object(value, path, SAVE_V3_KEYS)
  if (o.version !== 3) fail(`${path}.version`, 'expected 3')
  const c = object(o.calendar, `${path}.calendar`, ['day'])
  const today = day(c.day, `${path}.calendar.day`)
  const roster = parseRoster(o.roster, `${path}.roster`, today)
  const ids = new Set(Object.keys(roster))
  const buildings = parseBuildings(o.buildings, `${path}.buildings`)
  const s = object(o.start, `${path}.start`, ['redraws'])
  const t = object(o.today, `${path}.today`, ['chats', 'gifts'])
  const visitors = parseVisitors(o.visitors, `${path}.visitors`, ids)
  const met = new Set([...ids, ...visitors.map((v) => v.outfitId)])
  const talked = (raw: unknown, at: string) => unique(list(raw, at, 0, met.size).map((v, i) => member(v, `${at}.${i}`, met, 'expected an Uma on the roster or a visitor')), at)
  const crops = counts(o.crops, `${path}.crops`, isCropId, 'unknown crop') as Partial<Record<CropId, number>>
  return {
    version: 3,
    account: parseAccount(o.account, `${path}.account`),
    calendar: { day: today },
    gold: count(o.gold, `${path}.gold`),
    start: { redraws: count(s.redraws, `${path}.start.redraws`) },
    today: { chats: talked(t.chats, `${path}.today.chats`), gifts: talked(t.gifts, `${path}.today.gifts`) },
    roster,
    dorm: parseDorm(o.dorm, `${path}.dorm`, ids, buildings.dorm),
    visitors,
    items: parseWarehouse(o.items, `${path}.items`, isWarehouseId),
    bin: parseWarehouse(o.bin, `${path}.bin`, isGoodId),
    work: parseWork(o.work, `${path}.work`, ids, kinds),
    fields: parseFields(o.fields, `${path}.fields`, ids),
    crops,
    ranch: parseRanch(o.ranch, `${path}.ranch`, ids),
    places: (() => {
      const p = object(o.places, `${path}.places`, ['mine', 'quarry'])
      return { mine: parseDig(p.mine, `${path}.places.mine`), quarry: parseDig(p.quarry, `${path}.places.quarry`) }
    })(),
    buildings,
    tools: parseTools(o.tools, `${path}.tools`),
    workshops: parseWorkshops(o.workshops, `${path}.workshops`, ids),
    expeditions: parseExpeditions(o.expeditions, `${path}.expeditions`, ids),
    bonds: parseBonds(o.bonds, `${path}.bonds`, ids),
    board: parseBoard(o.board, `${path}.board`),
    diary: parseDiary(o.diary, `${path}.diary`),
    farm: parseFarm(o.farm, `${path}.farm`),
    summary: o.summary === null ? null : parseSummary(o.summary, `${path}.summary`, today, ids),
  }
}
