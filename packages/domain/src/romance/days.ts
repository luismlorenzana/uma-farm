// Birthdays and anniversaries (F47 decisions 10, 11 and 14; romance spec RM16, RM17, RM23 step 9).
//
// Her birthday is master data's character set (`birthday: { month, day }`), read at runtime and never in git; the cast
// file's optional `birthday` wins where present. A real date maps onto the 48-day year by quarters of the month:
//
//   March–May Spring · June–August Summer · September–November Autumn · December–February Winter
//   season day = 4 × (the month's place in its season, 0–2) + ⌈min(day, 31) ÷ 8⌉, held to 1–4
//
// On her birthday a gift pays ×3 (and an evening ×1.5, F50). Her anniversary is her wedding's day of the year from year 2
// of her marriage: every act pays ×2 (the evening ×1.5 instead), and that morning she leaves a ★5 item of her line in the
// Warehouse (`lineGood`). The morning says each the day before and on the day (step 9). Loaded with the night and the
// romance's screens.
import { dateOf, DAYS_PER_SEASON, DAYS_PER_YEAR } from '../farm/calendar'
import { draw } from '../farm/draw'
import type { Rank } from '../farm/ranks'
import { SHOP_SEEDS } from '../fields/crops'
import { FISHING_SPOTS, FOREST_AREAS, type FishingSpotId, type ForestAreaId } from '../gathering/ids'
import { pickShare, placeLock, sharesOn } from '../gathering/kinds'
import { FISHERY, FOREST } from '../gathering/tables'
import type { AnniversaryLine, BirthdayLine } from '../night/summary'
import type { SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { castOrder, favouriteOf, type StoryPack } from '../story/pack'
import { isAnniversary } from './love'

/** A day's place in the farm's year, 1–48. */
export const dayOfYear = (day: number): number => ((day - 1) % DAYS_PER_YEAR) + 1

/** A real date's farm day of the year (RM16): 1 March is Spring 1 (1), 14 February Winter 10 (46). */
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
/** Each Uma's birthday as a day of the farm's year (decision 10), by character id. */
export type Birthdays = ReadonlyMap<string, number>
export const NO_BIRTHDAYS: Birthdays = new Map()

/** The cast's birthdays (decision 10): her cast entry's `birthday` where it has one, else master data's character set's;
 * none for someone neither holds. */
export function birthdaysOf(pack: Pick<StoryPack, 'cast'>, master: ReadonlyMap<string, MonthDay>): Birthdays {
  const out = new Map<string, number>()
  for (const u of pack.cast.umas) {
    const date = u.birthday ?? master.get(u.characterId)
    if (date) out.set(u.characterId, farmBirthday(date.month, date.day))
  }
  return out
}

/** Whether a farm day is her birthday. */
export const isBirthday = (birthdays: Birthdays, id: string, day: number): boolean => birthdays.get(id) === dayOfYear(day)

// --- An item of her line (decision 11; RM32's morning-item column) -----------------------------------------------------

/** A good at its stars. */
export interface LineGood {
  id: string
  stars: number
}

/** The deepest area or spot she can work now, by her rank there (`placeLock`): the forest's last open area; the Fishery's
 * open spot with the highest rank, the sea's waiting for chapter 7 and the boat. Her night chores read it too (F51). */
export function deepestOpen(save: SaveV4, place: 'forest' | 'fishery', rank: Rank): string | null {
  const ids: readonly string[] = place === 'forest' ? FOREST_AREAS : FISHING_SPOTS
  const opens = (where: string) => (place === 'forest' ? FOREST[where as ForestAreaId].opens : FISHERY[where as FishingSpotId].opens)
  const open = ids.filter((where) => placeLock(save, place, where, rank) === null)
  return open.reduce<string | null>((best, where) => (best === null || opens(where) >= opens(best) ? where : best), null)
}

/**
 * A good of her line at `stars` (decision 11; RM32): a crop of the season for a farmer, a good of her foraging rank's
 * deepest area this season for a forager, a fish of her deepest spot this season for a fisher; each pick a seeded draw
 * (`draw(uid, day, 'line:<id>', n)`), the forest's and the Fishery's by their seasons' shares, the season's six shop crops
 * evenly. Mining, the ranch, cooking, serving and forging bring theirs with their places (M5, M6); until then, and
 * whenever her line's place isn't open, it's a crop of the season, so an anniversary is never empty. F51's morning items
 * reuse it with their own `n`.
 */
export function lineGood(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string, stars: number, n = 0): LineGood {
  const day = save.calendar.day
  const u = draw(save.account.uid, day, `line:${id}`, n)
  const ranks = save.roster[id]?.ranks
  const line = favouriteOf(pack, id)
  if (ranks && (line === 'foraging' || line === 'fishing')) {
    const place = line === 'foraging' ? 'forest' : 'fishery'
    const where = deepestOpen(save, place, ranks[line].rank)
    if (where) return { id: pickShare(sharesOn(place, where, day), u), stars }
  }
  const crops = SHOP_SEEDS[dateOf(day).season]
  return { id: crops[Math.floor(u * crops.length)]!, stars }
}

/** Her anniversary's item: ★5 (RM17). */
export const ANNIVERSARY_STARS = 5

// --- The morning's lines (decision 14; RM23 step 9) --------------------------------------------------------------------

/**
 * Night step 9 (decisions 11 and 14), the date already turned: each Uma on the roster, in the cast's order, whose
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
    for (const id of ids) if (isBirthday(birthdays, id, on)) lines.push({ kind: 'birthday', id, when })
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
