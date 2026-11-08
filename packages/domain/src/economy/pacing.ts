// Copied from uma-rpg packages/domain/src/economy/pacing.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The pacing model (docs/design/pacing.md, D54): every timer, curve, price and payout outside the battle engine, in one
// place so a balance pass changes numbers here and the tests say what they mean in play time.

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE

// --- Professions (design §4, §8.5) ----------------------------------------------------------------------------------

/** Each Uma's one profession (D60, D144): **Craft Level**, raised by every job at the Wilds sites, the Workbench, the Forge
 * and the Lapidary. */
export const CRAFT_LABEL = 'Craft Level'
/** The short name, as in "Craft Lv 6". */
export const CRAFT_SHORT = 'Craft'
export const PROFESSION_MAX_LEVEL = 50

/** EXP from level L to L+1 (D96): 12 hours of work at Lv1, an eighth of an hour more each level, 18 at Lv49. Lv46
 * (grade 10) takes 79,650 EXP in all; Lv50 takes 88,200, 735 hours. Working without a break, every Uma gains about 2
 * levels a day early on and reaches Lv50 in about a month (24 days at a level-3 facility); aptitude doesn't matter
 * (D139). */
export const professionExpToNext = (level: number): number => 1425 + 15 * level

/** Craft EXP in: levels up, banking EXP at Lv50. */
export function grantProfessionExp(p: { level: number; exp: number }, exp: number): { level: number; exp: number } {
  let { level } = p
  let bank = p.exp + Math.max(0, Math.floor(exp))
  while (level < PROFESSION_MAX_LEVEL && bank >= professionExpToNext(level)) {
    bank -= professionExpToNext(level)
    level += 1
  }
  return { level, exp: bank }
}

/** Profession EXP per minute of work at her level: every job pays for its time, whatever it makes (§8.5). */
export const EXP_PER_MINUTE = 2

/** The Wilds' trios (D230, FL28): each v4 step takes 24 minutes at Lv1, falling evenly to 16 at Lv50 (D264: was 36 to 24,
 * two thirds, as a rank now takes half as many items again, so a place's hours hold). */
export const STEP_MINUTES = { atFirst: 24, atMax: 16 } as const
export const stepMinutes = (level: number): number => {
  const l = Math.min(PROFESSION_MAX_LEVEL, Math.max(1, Math.floor(level)))
  return STEP_MINUTES.atFirst - ((STEP_MINUTES.atFirst - STEP_MINUTES.atMax) * (l - 1)) / (PROFESSION_MAX_LEVEL - 1)
}
/** Minutes to make an item from `refined` refined items under the Wilds' trios. */
export const makeMinutesV4 = (level: number, refined: number): number => stepMinutes(level) * refined
/** Profession EXP a job pays per item: 2 a minute of its time at her level, before a facility's speed (D96, D139). */
export const jobExp = (minutes: number): number => Math.round(minutes * EXP_PER_MINUTE)

/** Gathering, crafting and cutting make 1–10 items a job (D65). */
export const MAX_JOB_COUNT = 10
/** Refining, at a quarter of the time, comes in these batches (D139): a ×40 refine takes as long as a 10-item gather. */
export const REFINE_BATCHES = [1, 4, 8, 20, 40] as const
/** The Wilds' job sizes (D233, D264): with every step the same length (FL28), a job of n steps takes about n × 16 minutes at
 * a place, so ×1 … ×30 run from about a quarter of an hour to about 8 hours (×3 one, ×10 about three, ×30 eight). */
export const JOB_SIZES = [1, 2, 3, 5, 10, 15, 20, 30] as const
/** A job's longest size, in steps: about 8 hours. */
export const JOB_STEPS_MOST = 30
/** The sizes offered for an item of `steps` steps (1 to gather or process; a made item's refined items): the brackets below
 * its longest, then the longest, about 8 hours at every forge (D273), so an Arms Gem (10) offers 1, 2 and 3, Armor Fittings (3)
 * up to 10, a Setting or a jewel (5) up to 6. */
export function jobSizes(steps: number): number[] {
  const most = Math.max(1, Math.round(JOB_STEPS_MOST / steps))
  return [...JOB_SIZES.filter((n) => n < most), most]
}
/** The most items one new job of a kind makes (a gather 30 since D264; a process keeps v1's 40 for queued jobs). */
export const maxJobCount = (kind: 'gather' | 'refine' | 'craft' | 'cut'): number =>
  kind === 'refine' ? REFINE_BATCHES.at(-1)! : kind === 'gather' ? JOB_SIZES.at(-1)! : MAX_JOB_COUNT
