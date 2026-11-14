// The Dorm: beds cap who lives and works on the farm at once, 3 → 20. A level is bought at the Dorm (`buildings.dorm`,
// gold spent now) and takes effect the next morning (`dorm.level`, night step 8). The roster is everyone you've met, and
// it grows past the beds: one beyond them lives in town as a friend, keeping her ranks and her route, earning nothing.
// Invite to the farm (`romance/meeting.ts`) brings her into a free bed; a swap brings one from town home for one idle at
// home, the next morning, free and unlimited. The Dorm's levels bring beds only. Loaded with the loop's screens and the
// night.
import { isBusy } from '../fields/fields'
import { LOOP_KINDS } from '../gathering/kinds'
import { spendGold } from '../save/gold'
import type { LoopKinds } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { housed, leaving, newRosterUma, tendedBlock, type FarmSave, type OutfitId } from '../save/v4'
import { BEDS, bedsAt, DORM_MAX_LEVEL, farmRankOf } from './farm'

/** Each level's cost and the Farm Rank it needs (level 1 comes with the farm). */
export const DORM_COSTS: readonly number[] = [0, 1000, 3000, 8000, 15000, 28000, 50000, 85000]
export const DORM_FARM_RANKS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7]

/** One level of the Dorm: its beds, its cost and the Farm Rank it needs. */
export interface DormLevel {
  level: number
  beds: number
  cost: number
  farmRank: number
}
/** The Dorm for 20: its eight levels. */
export const DORM_LEVELS: readonly DormLevel[] = BEDS.map((beds, i) => ({ level: i + 1, beds, cost: DORM_COSTS[i]!, farmRank: DORM_FARM_RANKS[i]! }))

/** The level bought: the next morning's level. */
export const dormBought = (save: Pick<FarmSave, 'buildings'>): number => save.buildings.dorm ?? 1
/** Beds free this morning: the level in effect's beds, less who's home (swaps go one for one). */
export const freeBeds = (save: Pick<FarmSave, 'dorm'>): number => bedsAt(save.dorm.level) - save.dorm.home.length

/** The next level to buy, whether the Farm Rank opens it, or null at the top (level 8). */
export function nextDorm(save: Pick<FarmSave, 'buildings' | 'farm'>): (DormLevel & { open: boolean }) | null {
  const next = DORM_LEVELS[dormBought(save)]
  return next ? { ...next, open: farmRankOf(save.farm.points) >= next.farmRank } : null
}

/** Buys the Dorm's next level: refused at level 8 (`bad-job`), before its Farm Rank (`locked`) and when
 * gold is short (`no-gold`). The gold goes now; the beds come the next morning. A level bought today can be followed by
 * the next. */
export function buyDorm<S extends FarmSave>(save: S): S {
  const next = nextDorm(save)
  if (!next) throw new SaveRuleError('bad-job', 'The Dorm is at its top level.')
  if (!next.open) throw new SaveRuleError('locked', `Opens at Farm Rank ${next.farmRank}.`)
  return { ...spendGold(save, next.cost), buildings: { ...save.buildings, dorm: next.level } }
}

/** She arrives tomorrow: a swap brings her home. */
export const arriving = (save: Pick<FarmSave, 'dorm'>, outfitId: OutfitId): boolean => save.dorm.swaps.some((s) => s.in === outfitId)

/** Why an Uma home can't be swapped out today, or null: she leaves already, tends a block or holds a running
 * job (`isBusy`). */
export function swapBlock(save: FarmSave, outfitId: OutfitId, kinds: LoopKinds = LOOP_KINDS): string | null {
  if (leaving(save, outfitId)) return 'Leaves tomorrow'
  const block = tendedBlock(save, outfitId)
  if (block) return `Tends Block ${block}`
  return isBusy(save, outfitId, kinds) ? 'Working' : null
}

/** Swaps an Uma home for one living in town: the one home must have no running job and tend nothing; the one in town
 * arrives the next morning, in her place. Until then the one leaving can't take work. Free and unlimited. */
export function swapDorm<S extends FarmSave>(save: S, out: OutfitId, into: OutfitId, kinds: LoopKinds = LOOP_KINDS): S {
  if (!save.roster[out] || !save.dorm.home.includes(out)) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (!save.roster[into]) throw new SaveRuleError('not-owned', 'She isn’t on the roster.')
  if (save.dorm.home.includes(into)) throw new SaveRuleError('bad-job', 'She’s on the farm already.')
  if (housed(save, into)) throw new SaveRuleError('bad-job', 'She lives in her house.')
  if (arriving(save, into)) throw new SaveRuleError('busy', 'She arrives tomorrow.')
  if (leaving(save, out)) throw new SaveRuleError('busy', 'She leaves tomorrow.')
  const block = tendedBlock(save, out)
  if (block) throw new SaveRuleError('busy', `She tends Block ${block}.`)
  if (isBusy(save, out, kinds)) throw new SaveRuleError('busy', 'She’s working.')
  return { ...save, dorm: { ...save.dorm, swaps: [...save.dorm.swaps, { out, in: into }] } }
}

/** Calls off a swap before the night: she stays. */
export function cancelSwap<S extends FarmSave>(save: S, out: OutfitId): S {
  if (!leaving(save, out)) throw new SaveRuleError('bad-job', 'No swap to call off.')
  return { ...save, dorm: { ...save.dorm, swaps: save.dorm.swaps.filter((s) => s.out !== out) } }
}

/** An Uma joins the roster today, the day you met her: home while a bed is free this morning, else she lives in town.
 * Her route starts with meeting her (`meet`). */
export function joinRoster<S extends FarmSave>(save: S, id: OutfitId): { save: S; home: boolean } {
  if (save.roster[id]) throw new SaveRuleError('bad-job', 'She’s on the roster already.')
  const home = freeBeds(save) > 0
  const dorm = home ? { ...save.dorm, home: [...save.dorm.home, id] } : save.dorm
  return { save: { ...save, roster: { ...save.roster, [id]: newRosterUma(save.calendar.day) }, dorm }, home }
}

/** Night step 8: the level bought takes effect, then each swap: the Uma leaving goes to town and the one
 * arriving comes home in her place. A tender who isn't home after it is cleared (none can be: a tender can't swap out). */
export function settleDormNight<S extends FarmSave>(save: S): { save: S; raised: number | null; home: OutfitId[] } {
  const level = Math.min(DORM_MAX_LEVEL, Math.max(save.dorm.level, dormBought(save)))
  const into = new Map(save.dorm.swaps.map((s) => [s.out, s.in]))
  const home = save.dorm.home.map((id) => into.get(id) ?? id)
  // A spouse in her house tends on.
  const blocks = save.fields.blocks.map((b) => (b.tender !== null && !home.includes(b.tender) && !housed(save, b.tender) ? { ...b, tender: null } : b))
  return {
    save: { ...save, dorm: { level, home, swaps: [] }, fields: { blocks } },
    raised: level > save.dorm.level ? level : null,
    home: save.dorm.swaps.map((s) => s.in),
  }
}
