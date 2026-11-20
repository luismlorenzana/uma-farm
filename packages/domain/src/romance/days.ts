// Birthdays and anniversaries.
//
// The cast's birthday or master date supplies its order in the year. The launch cast is spread over all 48 dates.
// Expansion members fill the least occupied dates without changing existing birthdays. A raw date maps by quarters:
//
//   March–May Spring · June–August Summer · September–November Autumn · December–February Winter
//   season day = 4 × (the month's place in its season, 0–2) + ⌈min(day, 31) ÷ 8⌉, held to 1–4
//
// On her birthday a gift pays ×3 (and an evening ×1.5). Her anniversary is her wedding's day of the year from year 2
// of her marriage: every act pays ×2 (the evening ×1.5 instead), and that morning she leaves a ★5 item of her line in the
// Warehouse (`lineGood`). The morning says each the day before and on the day (step 9). Loaded with the night and the
// romance's screens.
import { dateDayOf, dateOf, DAYS_PER_SEASON, DAYS_PER_YEAR, type FarmClock } from '../farm/calendar'
import { draw } from '../farm/draw'
import type { Rank } from '../farm/ranks'
import { SHOP_SEEDS } from '../fields/crops'
import { digBuilt, digFloor, findOn } from '../gathering/digs'
import { FISHING_SPOTS, FOREST_AREAS, type FishingSpotId, type ForestAreaId } from '../gathering/ids'
import { pickShare, placeLock, sharesOn } from '../gathering/kinds'
import { FISHERY, FOREST } from '../gathering/tables'
import type { AnniversaryLine, BirthdayLine } from '../night/summary'
import { ANIMALS, keptKinds } from '../ranch/ranch'
import type { SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { castOrder, type StoryPack } from '../story/pack'
import { LAUNCH_CAST } from '../story/launch'
import { birthdayOf } from '../story/placeholders'
import { isAnniversary } from './love'
import { perkLineOf } from './perks'

/** A day's place in the farm's year, 1–48. */
export const dayOfYear = (day: number): number => ((day - 1) % DAYS_PER_YEAR) + 1

/** A real date's farm day of the year: 1 March is Spring 1 (1), 14 February Winter 10 (46). */
export function farmBirthday(month: number, day: number): number {
  const season = month >= 3 && month <= 5 ? 0 : month >= 6 && month <= 8 ? 1 : month >= 9 && month <= 11 ? 2 : 3
  const place = season < 3 ? month - 3 * (season + 1) : month % 12
  const quarter = Math.min(4, Math.max(1, Math.ceil(Math.min(day, 31) / 8)))
  return season * DAYS_PER_SEASON + 4 * place + quarter
}

/** A birthday as a calendar date. */
export interface MonthDay {
  month: number
  day: number
}
/** Each Uma's birthday as a day of the farm's year, by character id. */
export type Birthdays = ReadonlyMap<string, number>
export const NO_BIRTHDAYS: Birthdays = new Map()

/** Small story packs retain their written dates. A full cast spreads its birthdays across the farm year. */
export function birthdaysOf(pack: Pick<StoryPack, 'cast'>, master: ReadonlyMap<string, MonthDay>): Birthdays {
  const out = new Map<string, number>()
  const launch = new Map(LAUNCH_CAST.map((id, i) => [id, i]))
  const rows = pack.cast.umas.map(({ characterId: id }, i) => {
    const rank = launch.get(id)
    const suggested = 1 + Math.floor(rank === undefined ? i * DAYS_PER_YEAR / pack.cast.umas.length : rank * DAYS_PER_YEAR / LAUNCH_CAST.length)
    return { id, date: birthdayOf(pack, id, master), suggested }
  })
  if (rows.length < DAYS_PER_YEAR) {
    for (const { id, date } of rows) if (date) out.set(id, farmBirthday(date.month, date.day))
    return out
  }
  const ordinal = (row: typeof rows[number]) => row.date ? ((row.date.month + 9) % 12) * 32 + row.date.day : row.suggested * 8
  const ordered = rows.slice().sort((a, b) => ordinal(a) - ordinal(b) || a.id.localeCompare(b.id))
  const core = ordered.filter(row => launch.has(row.id))
  const first = core.length === LAUNCH_CAST.length ? core : ordered
  const load = Array<number>(DAYS_PER_YEAR + 1).fill(0)
  first.forEach(({ id }, i) => {
    const day = 1 + Math.floor((i + 0.5) * DAYS_PER_YEAR / first.length)
    out.set(id, day)
    load[day]!++
  })
  for (const { id, date, suggested } of ordered) {
    if (out.has(id)) continue
    const ideal = date ? farmBirthday(date.month, date.day) : suggested
    let best = 1
    for (let day = 2; day <= DAYS_PER_YEAR; day++) {
      if (load[day]! < load[best]! || (load[day] === load[best] && Math.abs(day - ideal) < Math.abs(best - ideal))) best = day
    }
    out.set(id, best)
    load[best]!++
  }
  return out
}

/** Whether a farm day is her birthday. */
export const isBirthday = (birthdays: Birthdays, id: string, day: number, clock?: FarmClock): boolean =>
  birthdays.get(id) === dayOfYear(dateDayOf(day, clock))

// --- An item of her line -----------------------------------------------------

/** A good at its stars. */
export interface LineGood {
  id: string
  stars: number
}

/** The deepest area or spot she can work now, by her rank there (`placeLock`): the forest's last open area; the Fishery's
 * open spot with the highest rank, the sea's waiting for the Dock and the Boat. Her night chores read it too. */
export function deepestOpen(save: SaveV4, place: 'forest' | 'fishery', rank: Rank): string | null {
  const ids: readonly string[] = place === 'forest' ? FOREST_AREAS : FISHING_SPOTS
  const opens = (where: string) => (place === 'forest' ? FOREST[where as ForestAreaId].opens : FISHERY[where as FishingSpotId].opens)
  const open = ids.filter((where) => placeLock(save, place, where, rank) === null)
  return open.reduce<string | null>((best, where) => (best === null || opens(where) >= opens(best) ? where : best), null)
}

/**
 * A good of her line at `stars`: a crop of the season for a farmer, a good of her foraging rank's
 * deepest area this season for a forager, a fish of her deepest spot this season for a fisher, a find of the dig's
 * deepest floor for a miner (the Mine's ore, the Quarry's stone or gem, its kind `draw(uid, day, 'line-kind:<id>', n)`),
 * a good of an animal the farm keeps for a rancher (its kinds evenly); each pick a seeded draw
 * (`draw(uid, day, 'line:<id>', n)`), the forest's and the Fishery's by their seasons' shares, the season's six shop crops
 * evenly. Cooking, serving and forging bring theirs with their places' games; until then, and whenever her line's place
 * isn't open (a dig not built, a farm with no animals), it's a crop of the season, so an anniversary is never empty. The
 * morning items reuse it with their own `n`.
 */
export function lineGood(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string, stars: number, n = 0): LineGood {
  const day = save.calendar.day
  const u = draw(save.account.uid, day, `line:${id}`, n)
  const ranks = save.roster[id]?.ranks
  const line = perkLineOf(pack, id)
  if (ranks && (line === 'foraging' || line === 'fishing')) {
    const place = line === 'foraging' ? 'forest' : 'fishery'
    const where = deepestOpen(save, place, ranks[line].rank)
    if (where) return { id: pickShare(sharesOn(place, where, dateDayOf(day, save.calendar)), u), stars }
  }
  if (line === 'mining' || line === 'quarry') {
    const dig = line === 'quarry' ? 'quarry' : 'mine'
    if (digBuilt(save, dig)) return { id: findOn(dig, digFloor(save.places[dig]), u, draw(save.account.uid, day, `line-kind:${id}`, n)), stars }
  }
  if (line === 'ranch') {
    const kinds = keptKinds(save)
    if (kinds.length > 0) return { id: ANIMALS[kinds[Math.floor(u * kinds.length)]!].good, stars }
  }
  const crops = SHOP_SEEDS[dateOf(day, save.calendar).season]
  return { id: crops[Math.floor(u * crops.length)]!, stars }
}

/** Her anniversary's item: ★5. */
export const ANNIVERSARY_STARS = 5

// --- The morning's lines --------------------------------------------------------------------

/**
 * Night step 9, the date already turned: each Uma on the roster, in the cast's order, whose
 * birthday or anniversary is today or tomorrow gets her line; an anniversary today leaves its ★5 item of her line in the
 * Warehouse. Today's lines come before tomorrow's, birthdays before anniversaries.
 */
export function heartDays(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, birthdays: Birthdays): { save: SaveV4; lines: (BirthdayLine | AnniversaryLine)[] } {
  const day = save.calendar.day
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const ids = Object.keys(save.roster).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
  let items = save.items
  const lines: (BirthdayLine | AnniversaryLine)[] = []
  for (const when of ['today', 'tomorrow'] as const) {
    const on = when === 'today' ? day : day + 1
    for (const id of ids) if (isBirthday(birthdays, id, on, save.calendar)) lines.push({ kind: 'birthday', id, when })
    for (const id of ids) {
      const love = save.love[id]
      if (!love || !isAnniversary(love, on)) continue
      if (when === 'tomorrow') {
        lines.push({ kind: 'anniversary', id, when, item: null })
        continue
      }
      const item = lineGood(save, pack, id, ANNIVERSARY_STARS)
      items = addGoods(items, item.id, item.stars, 1)
      lines.push({ kind: 'anniversary', id, when, item: item.id })
    }
  }
  return { save: items === save.items ? save : { ...save, items }, lines }
}
