// The Dorm and the off-season (F23 decisions 3, 4 and 6; core spec CS34, CS36; D24 #11): beds cap who lives and works on
// the farm at once, 3 → 60. A level is bought at the Dorm (`buildings.dorm`, gold spent now) and takes effect the next
// morning (`dorm.level`, night step 8). The roster grows past the beds: an Uma beyond them is away on her off-season,
// keeping her ranks and your affinity, earning nothing. A swap brings one away home for one idle at home, the next
// morning; swaps are free and unlimited. On save v4 (F46, RM5) the Dorm has eight levels to 20 beds, its levels 4–8 each
// bringing an authored arrival; v3 keeps CS34's ten. Loaded with the loop's screens and the night.
import { isBusy } from '../fields/fields'
import { LOOP_KINDS } from '../gathering/kinds'
import { spendGold } from '../save/gold'
import type { LoopKinds } from '../save/parse-v3'
import { SaveRuleError } from '../save/rules'
import { leaving, newRosterUma, tendedBlock, type OutfitId, type SaveV3 } from '../save/v3'
import { newRosterUmaV4, type FarmSave } from '../save/v4'
import { BEDS, BEDS_V4, bedsFor, dormMaxLevel, farmRankOf } from './farm'

/** CS34: each level's cost and the Farm Rank it needs (level 1 comes with the farm). */
export const DORM_COSTS: readonly number[] = [0, 1000, 3000, 8000, 15000, 28000, 50000, 85000, 130000, 200000]
export const DORM_FARM_RANKS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/** One level of the Dorm: its beds, its cost and the Farm Rank it needs. */
export interface DormLevel {
  level: number
  beds: number
  cost: number
  farmRank: number
}
/** The Dorm's ten levels (CS34). */
export const DORM_LEVELS: readonly DormLevel[] = BEDS.map((beds, i) => ({ level: i + 1, beds, cost: DORM_COSTS[i]!, farmRank: DORM_FARM_RANKS[i]! }))
/** The Dorm for 20 (RM5; F46 decision 12): save v4's eight levels, CS34's costs and Farm Ranks kept level for level. */
export const DORM_LEVELS_V4: readonly DormLevel[] = BEDS_V4.map((beds, i) => ({ level: i + 1, beds, cost: DORM_COSTS[i]!, farmRank: DORM_FARM_RANKS[i]! }))
/** The levels from which a v4 Dorm level brings an authored arrival (RM4, RM5): 4–8. */
export const ARRIVAL_DORM_LEVELS: readonly number[] = [4, 5, 6, 7, 8]
/** A save's Dorm ladder, by its version (decision 12, never the web's switch). */
export const dormLevelsOf = (save: { version: number }): readonly DormLevel[] => (save.version >= 4 ? DORM_LEVELS_V4 : DORM_LEVELS)

/** The level bought: the next morning's level. */
export const dormBought = (save: Pick<FarmSave, 'buildings'>): number => save.buildings.dorm ?? 1
/** Beds free this morning: the level in effect's beds, less who's home (swaps go one for one). */
export const freeBeds = (save: Pick<FarmSave, 'dorm' | 'version'>): number => bedsFor(save.version, save.dorm.level) - save.dorm.home.length

/** The next level to buy, whether the Farm Rank opens it, or null at the top (level 10 on v3, 8 on v4). */
export function nextDorm(save: Pick<FarmSave, 'buildings' | 'farm' | 'version'>): (DormLevel & { open: boolean }) | null {
  const next = dormLevelsOf(save)[dormBought(save)]
  return next ? { ...next, open: farmRankOf(save.farm.points) >= next.farmRank } : null
}

/** Buys the Dorm's next level (decision 3): refused at level 10 (`bad-job`), before its Farm Rank (`locked`) and when
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

/** Why an Uma home can't be swapped out today, or null (decision 4): she leaves already, tends a block or holds a running
 * job (F20's `isBusy`). */
export function swapBlock(save: FarmSave, outfitId: OutfitId, kinds: LoopKinds = LOOP_KINDS): string | null {
  if (leaving(save, outfitId)) return 'Leaves tomorrow'
  const block = tendedBlock(save, outfitId)
  if (block) return `Tends Block ${block}`
  return isBusy(save, outfitId, kinds) ? 'Working' : null
}

/** Swaps an Uma home for one away (decision 4; CS36): the one home must have no running job and tend nothing; the one
 * away arrives the next morning, in her place. Until then the one leaving can't take work. Free and unlimited. */
export function swapDorm<S extends FarmSave>(save: S, out: OutfitId, into: OutfitId, kinds: LoopKinds = LOOP_KINDS): S {
  if (!save.roster[out] || !save.dorm.home.includes(out)) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (!save.roster[into]) throw new SaveRuleError('not-owned', 'She isn’t on the roster.')
  if (save.dorm.home.includes(into)) throw new SaveRuleError('bad-job', 'She’s on the farm already.')
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

/** An Uma joins the roster today (decision 6, CS35): home while a bed is free this morning, else away on her
 * off-season. On v3 a visitor keeps her affinity; on v4 (F46) her route starts with her arrival (`arrive`), and the
 * roster holds no affinity. */
export function joinRoster<S extends FarmSave>(save: S, outfitId: OutfitId, affinity = 0): { save: S; home: boolean } {
  if (save.roster[outfitId]) throw new SaveRuleError('bad-job', 'She’s on the roster already.')
  const home = freeBeds(save) > 0
  const dorm = home ? { ...save.dorm, home: [...save.dorm.home, outfitId] } : save.dorm
  if (save.version === 4) return { save: { ...save, roster: { ...save.roster, [outfitId]: newRosterUmaV4(save.calendar.day) }, dorm }, home }
  const v3: SaveV3 = save
  return {
    save: {
      ...save, roster: { ...v3.roster, [outfitId]: { ...newRosterUma(save.calendar.day), affinity } },
      visitors: v3.visitors.filter((v) => v.outfitId !== outfitId), dorm,
    },
    home,
  }
}

/** Night step 8 (decision 3): the level bought takes effect, then each swap: the Uma leaving goes away and the one
 * arriving comes home in her place. A tender who isn't home after it is cleared (none can be: a tender can't swap out). */
export function settleDormNight<S extends FarmSave>(save: S): { save: S; raised: number | null; home: OutfitId[] } {
  const level = Math.min(dormMaxLevel(save.version), Math.max(save.dorm.level, dormBought(save)))
  const into = new Map(save.dorm.swaps.map((s) => [s.out, s.in]))
  const home = save.dorm.home.map((id) => into.get(id) ?? id)
  const blocks = save.fields.blocks.map((b) => (b.tender !== null && !home.includes(b.tender) ? { ...b, tender: null } : b))
  return {
    save: { ...save, dorm: { level, home, swaps: [] }, fields: { blocks } },
    raised: level > save.dorm.level ? level : null,
    home: save.dorm.swaps.map((s) => s.in),
  }
}
