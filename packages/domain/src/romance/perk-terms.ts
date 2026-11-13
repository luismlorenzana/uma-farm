// The perks' terms: what a perk reached gives,
// and where. **Most perks are read from her level, never stored**: each effect asks `hasPerk(love, rung)`.
// This file holds the terms the shared rules read (a haul's plan, a harvest, a block's growth, the night's extras), so it
// imports nothing from them; the night's own effects (chores, morning items, the mentor, her signature dish, breakfast)
// are `perk-effects.ts`'s.
//
//   The romance term on any one job, one capped number:
//     her own   F3 +10%, R5 +10%, her ring +1–15% once married, at her line's place      held to +35%
//     the crew  the best dream at this place +5% (never summed), the household +5% at 5
//               married and +5% more at 15                                               held to +15%
//     together                                                                           held to +40%
//   In her element stays in the bond term, outside the cap: ×1.2 for ×1.1.
//   Her keepsake: +0.25 quality at her line's place, +0.5 from S5.
//
// A perk at her line's place works only once that place is open (RM36: "Opens with chapter n"). Rules on save v4 only;
// the shared rules call these only for a v4 save with the pack, so v3's numbers never move. Loaded with the night and the
// romance's screens.
import type { FarmPlaceId } from '../farm/places'
import { marriedCount, type Love, type SaveV4 } from '../save/v4'
import { linePlaces, type StoryPack } from '../story/pack'
import { nextRung, ROUTE_RUNGS } from './love'
import { lineChapter, PERKS, perkLineOf, type PerkId } from './perks'

/** What the perks read of the story pack: her favourite line (her bible, else her calling) and so her line's places. */
export type PerkPack = Pick<StoryPack, 'cast' | 'bibles'>

// --- Reached ----------------------------------------------------------------------------------------------

/** Her place along the route: her next rung's index in `ROUTE_RUNGS`, the route's length once it's complete. */
export const routeIndex = (love: Pick<Love, 'stage' | 'level'>): number => {
  const rung = nextRung(love)
  return rung === null ? ROUTE_RUNGS.length : ROUTE_RUNGS.indexOf(rung)
}

/** Whether she has reached a rung, and so its perk: its event played (S2 and S4 at night). Read from her
 * level, never stored. */
export const hasPerk = (love: Pick<Love, 'stage' | 'level'> | undefined, rung: string): boolean =>
  !!love && ROUTE_RUNGS.indexOf(rung) >= 0 && ROUTE_RUNGS.indexOf(rung) < routeIndex(love)

/** A perk's rung by its id. */
export const rungOfPerk = (id: PerkId): string => PERKS.find((p) => p.id === id)!.rung

/** Whether she's on the farm tonight: home in the Dorm, or a spouse in her house. Away does nothing. */
export const homeOrHoused = (save: Pick<SaveV4, 'dorm' | 'love'>, id: string): boolean => {
  const love = save.love[id]
  return save.dorm.home.includes(id) || (love?.stage === 'spouse' && love.house !== undefined)
}

/** Whether her line's place is open on this farm: open from the start, or its chapter reached. */
export function linePlaceOpen(save: Pick<SaveV4, 'farm'>, pack: PerkPack, id: string): boolean {
  const line = perkLineOf(pack, id)
  if (line === null) return false
  const chapter = lineChapter(line)
  return chapter === null || save.farm.chapter >= chapter
}

/** Whether `place` is one of her line's places (RM6's table: the Fields, the forest and the Sawmill, the Fishery and the
 * Smokehouse, …) and open. */
export const atHerLine = (save: Pick<SaveV4, 'farm'>, pack: PerkPack, id: string, place: string): boolean =>
  linePlaces(pack, id).includes(place as FarmPlaceId) && linePlaceOpen(save, pack, id)

// --- The romance term -------------------------------------------------------------

/** F3's and R5's +10% each at her line. */
export const LINE_BONUS = 0.1
/** Her own line bonuses' cap: F3, R5 and her ring. */
export const OWN_CAP = 0.35
/** Her dream (S3): +5% for anyone at her line's place, the best one at a place. */
export const DREAM_BONUS = 0.05
/** The household: +5% crew-wide at 5 married, +5% more at 15. */
export const HOUSEHOLD: readonly { married: number; bonus: number }[] = [{ married: 5, bonus: 0.05 }, { married: 15, bonus: 0.05 }]
/** The crew's cap: a dream and the household. */
export const CREW_CAP = 0.15
/** Every romance bonus on any one job, added. */
export const ROMANCE_CAP = 0.4

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

/** The romance term's parts on one job, each as a share: `line` (F3 + R5) and `ring` before her cap, `own`
 * after it; `dream` and `household` before the crew's cap, `crew` after it; `total` the sum held to 40%. `held` says a cap
 * cut something. */
export interface RomanceTerms {
  line: number
  ring: number
  own: number
  dream: number
  household: number
  crew: number
  total: number
  held: boolean
}

/** Her ring's bonus as a share: once she's married, `love.ring` percent at her line. On v4 `love.ring` is her ring's
 * grade (F53 decision 6: +1% a grade, every ring a Rough make until M6's merge game adds its +1/+3/+5). */
export const ringBonus = (love: Pick<Love, 'stage' | 'ring'> | undefined): number => (love?.stage === 'spouse' && love.ring !== undefined ? love.ring / 100 : 0)

/** The household's share by spouses on the farm: 0, 5% from 5 married, 10% from 15. */
export const householdBonus = (married: number): number => round6(HOUSEHOLD.reduce((sum, h) => sum + (married >= h.married ? h.bonus : 0), 0))

/** Whether her dream acts: her S3 event is in `memories`, and it's still hers (her S3 reached). */
export const dreamActs = (save: Pick<SaveV4, 'love' | 'memories'>, id: string): boolean => hasPerk(save.love[id], 's3') && (save.memories[id] ?? []).includes('s3')

/** The best dream at a place (RM34: never summed): +5% when any Uma's dream acts and the place is her line's, open. */
export function dreamAt(save: Pick<SaveV4, 'love' | 'memories' | 'farm'>, pack: PerkPack, place: string): number {
  return Object.keys(save.love).some((d) => dreamActs(save, d) && atHerLine(save, pack, d, place)) ? DREAM_BONUS : 0
}

/** The romance term on `id`'s work at `place`: her own (F3 and R5 at her line's place, her ring once
 * married) held to 35%, the crew's (the best dream at this place, the household by `marriedCount`) held to 15%, the sum
 * held to 40%. Her own counts only at her line's place, open; the crew's anywhere an Uma works. */
export function romanceTerms(save: Pick<SaveV4, 'love' | 'memories' | 'farm'>, pack: PerkPack, id: string, place: string): RomanceTerms {
  const love = save.love[id]
  const mine = atHerLine(save, pack, id, place)
  const line = mine ? (hasPerk(love, 'f3') ? LINE_BONUS : 0) + (hasPerk(love, 'r5') ? LINE_BONUS : 0) : 0
  const ring = mine ? ringBonus(love) : 0
  const own = Math.min(OWN_CAP, round6(line + ring))
  const dream = dreamAt(save, pack, place)
  const household = householdBonus(marriedCount(save))
  const crew = Math.min(CREW_CAP, round6(dream + household))
  const total = Math.min(ROMANCE_CAP, round6(own + crew))
  return { line: round6(line), ring, own, dream, household, crew, total, held: own < round6(line + ring) || crew < round6(dream + household) || total < round6(own + crew) }
}

/** The romance term as one number: what `nightExtras` and a harvest's extra crop read. */
export const romanceBonus = (save: Pick<SaveV4, 'love' | 'memories' | 'farm'>, pack: PerkPack, id: string, place: string): number =>
  romanceTerms(save, pack, id, place).total

// --- In her element -----------------------------------------------------------------------------------

/** In her element: CS17's bond factor ×1.2 in place of ×1.1, outside the cap. */
export const IN_ELEMENT = 1.2
/** Whether she's in her element at `place`: Friendship 8 reached and the place her line's, open. Beside a
 * 3-heart partner is the bond term's own check (`farm/bonds.ts`). */
export const inElement = (save: Pick<SaveV4, 'love' | 'farm'>, pack: PerkPack, id: string, place: string): boolean =>
  hasPerk(save.love[id], 'f8') && atHerLine(save, pack, id, place)

// --- Her keepsake (S5) --------------------------------------------------------------------------------

/** Her keepsake's quality (CS26's `keepsake` source): +0.25 from F10, +0.5 from S5. */
export const KEEPSAKE_QUALITY = 0.25
export const KEEPSAKE_GROWN = 0.5
/** Her keepsake's quality on her work at `place`: at her line's place, open, from F10; 0 anywhere else. Read
 * when her job is planned or when the block she tends is harvested. */
export function keepsakeQuality(save: Pick<SaveV4, 'love' | 'farm'>, pack: PerkPack, id: string, place: string): number {
  const love = save.love[id]
  if (!hasPerk(love, 'f10') || !atHerLine(save, pack, id, place)) return 0
  return hasPerk(love, 's5') ? KEEPSAKE_GROWN : KEEPSAKE_QUALITY
}

// --- Night chores and morning items' counts --------------------------------------------------------

/** Night chores a night: 1 from F6, 2 from R7, 3 from S4, never more. */
export const MAX_CHORES = 3
export const choresOf = (love: Pick<Love, 'stage' | 'level'> | undefined): number =>
  hasPerk(love, 's4') ? 3 : hasPerk(love, 'r7') ? 2 : hasPerk(love, 'f6') ? 1 : 0

/** Her morning items' rule: every 4th morning at ★2+ from R2; from S2 every 2nd at ★3+, counted from the day
 * she reached each; null before R2. */
export interface MorningRule {
  every: number
  stars: number
  from: number
}
export const MORNING_ITEMS = { r2: { every: 4, stars: 2 }, s2: { every: 2, stars: 3 } } as const
export function morningRule(love: Pick<Love, 'stage' | 'level' | 'morning'> | undefined): MorningRule | null {
  if (!love) return null
  const rule = hasPerk(love, 's2') ? MORNING_ITEMS.s2 : hasPerk(love, 'r2') ? MORNING_ITEMS.r2 : null
  return rule ? { ...rule, from: love.morning ?? 0 } : null
}
/** Whether her morning item is due this morning: a whole number of her rule's mornings after the day her count started. */
export const morningDue = (rule: MorningRule, day: number): boolean => day > rule.from && (day - rule.from) % rule.every === 0
/** The mornings until her next item (0 when it's this morning's). */
export const morningsToItem = (rule: MorningRule, day: number): number => {
  if (day <= rule.from) return rule.from + rule.every - day
  const into = (day - rule.from) % rule.every
  return into === 0 ? 0 : rule.every - into
}
