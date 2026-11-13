// The proposal and the wedding: the parts `playEvent` adds to
// F49's big scenes, and what their screens read.
//
//   the proposal  Ready the day after Romance 10 with a ring in the Warehouse; Play › asks which ring (the best grade
//                 preselected), the authored event plays, it always succeeds: the ring leaves the Warehouse, `love.ring`
//                 is its grade, and she's engaged (the wedding's wait)
//   the wedding   Ready the next day and waits until you play it: the place first (one of three her bible names), the
//                 authored event on that place's card with its vow line, then the reception: any dish in the Warehouse
//                 (★1–2 one well-fed day, ★3–4 two, ★5 three for everyone on the farm tomorrow), or with none Marta's
//                 bakery sends a cake (one day); every spouse and her two closest friends attend; she's a spouse
//
// Every word says spouse, partner, vows, your wedding, you. Pure. Loaded with the events.
import { DAYS_PER_YEAR } from '../farm/calendar'
import { tiesOf } from '../farm/bonds'
import { SaveRuleError } from '../save/rules'
import { goodCount } from '../save/warehouse'
import { isDishId } from '../save/v3'
import type { SaveV4 } from '../save/v4'
import type { StoryPlace } from '../story/authored'
import { castOrder, type StoryPack } from '../story/pack'
import { homeOrHoused } from './perk-terms'

// --- The wedding's place ---------------------------------------------------------------------------------

/** The places a wedding falls back on without her bible's `wedding.places`: after her wedding beat's. */
export const WEDDING_DEFAULTS: readonly StoryPlace[] = ['chapel-bell', 'fields', 'overlook', 'orchard-bench']
/** Her wedding's three places: her bible's `wedding.places`, else her wedding beat's place and the
 * farm's defaults, three different. */
export function weddingPlaces(pack: Pick<StoryPack, 'bibles'>, id: string): StoryPlace[] {
  const bible = pack.bibles.get(id)
  if (bible?.wedding) return [...bible.wedding.places]
  const beat = bible?.route.find((b) => b.id === 'wedding')?.place
  return [...new Set([...(beat ? [beat] : []), ...WEDDING_DEFAULTS])].slice(0, 3)
}
/** The flag a wedding keeps of its place, so a later scene's words and a replay can name it. */
export const weddingPlaceFlag = (place: string): string => `wedding:${place}`
/** The place her wedding was held at, from her flags; null before it. */
export const weddingPlaceOf = (flags: readonly string[]): string | null => flags.find((f) => f.startsWith('wedding:'))?.slice('wedding:'.length) ?? null
/** The flag a wedding keeps of its vow line: `vow:<n>`, the option taken at its last choice point, 1–3. */
export const vowFlag = (n: number): string => `vow:${n}`

// --- The reception ---------------------------------------------------------------------------------------

/** A dish's well-fed days at the reception, by its stars (CS22's 1–3, read from the dish's stars since the Warehouse holds
 * no play tier): ★1–2 one, ★3–4 two, ★5 three. */
export const receptionDays = (stars: number): number => (stars >= 5 ? 3 : stars >= 3 ? 2 : 1)
/** Marta's bakery's cake, with no dish in the Warehouse (no Kitchen before M5): a Rough meal, one day. */
export const CAKE_DAYS = 1
/** The reception: a dish at its stars, or null for Marta's cake. */
export type Reception = { dish: string; stars: number } | null

/** A dish the reception could serve. */
export interface ReceptionDish { dish: string; stars: number; count: number; days: number }
/** The dishes in the Warehouse at each star, the most days first, then fewer stars, then the id. */
export function receptionDishes(save: Pick<SaveV4, 'items'>): ReceptionDish[] {
  return Object.entries(save.items).filter(([id]) => isDishId(id))
    .flatMap(([dish, row]) => row.flatMap((count, i): ReceptionDish[] => (count > 0 ? [{ dish, stars: i + 1, count, days: receptionDays(i + 1) }] : [])))
    .sort((a, b) => b.days - a.days || a.stars - b.stars || a.dish.localeCompare(b.dish))
}
/** The days a reception gives, or refused: a dish held at those stars, or the cake only with no dish held. */
export function receptionOf(save: Pick<SaveV4, 'items'>, reception: Reception): number {
  if (reception === null) {
    if (receptionDishes(save).length > 0) throw new SaveRuleError('bad-job', 'Choose a dish for the reception.')
    return CAKE_DAYS
  }
  if (!isDishId(reception.dish) || (save.items[reception.dish]?.[reception.stars - 1] ?? 0) < 1) throw new SaveRuleError('no-items', 'That dish isn’t in the Warehouse.')
  return receptionDays(reception.stars)
}

/** Night step 9: today's reception feeds everyone on the farm (home, or a spouse in her house) for its days,
 * never shortening a meal already running. Who it fed, in id order. */
export function serveReception(save: SaveV4, days: number): { save: SaveV4; fed: string[] } {
  if (days <= 0) return { save, fed: [] }
  const fed = Object.keys(save.roster).filter((id) => homeOrHoused(save, id) && save.roster[id]!.wellFed < days).sort((a, b) => Number(a) - Number(b))
  if (fed.length === 0) return { save, fed }
  return { save: { ...save, roster: { ...save.roster, ...Object.fromEntries(fed.map((id) => [id, { ...save.roster[id]!, wellFed: days }])) } }, fed }
}

// --- The guests ------------------------------------------------------------------------------------------

/** Her closest friends who come to her wedding: two. */
export const WEDDING_FRIENDS = 2
/** Who attends her wedding: every spouse on the farm in the cast's order, then her two closest friends
 * among the Umas on the farm (F52's order). Never her; each once. They have no lines. */
export function weddingGuests(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>, id: string): string[] {
  const here = (other: string) => other !== id && !!save.roster[other] && homeOrHoused(save, other)
  const order = castOrder(pack)
  const rank = (x: string) => (order.includes(x) ? order.indexOf(x) : order.length)
  const spouses = Object.keys(save.love).filter((other) => here(other) && save.love[other]!.stage === 'spouse')
    .sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
  const friends = tiesOf(pack, save, id).map((t) => t.with).filter(here).slice(0, WEDDING_FRIENDS)
  return [...new Set([...spouses, ...friends])]
}

// --- After it --------------------------------------------------------------------------------------

/** Her anniversary: her wedding's day a year on (F47's `isAnniversary`). */
export const anniversaryOf = (wed: number): number => wed + DAYS_PER_YEAR
/** RM45's household milestones, by the number married: scenes at 5, 10 and 15, the finale at 20. */
export const HOUSEHOLD_AT: readonly number[] = [5, 10, 15, 20]
/** The next household milestone past `married`, or null after the finale's. */
export const nextHousehold = (married: number): number | null => HOUSEHOLD_AT.find((n) => n > married) ?? null

/** Whether the proposal's ring is held. */
export const ringHeld = (save: Pick<SaveV4, 'items'>, ring: string): boolean => goodCount(save.items, ring) > 0
