// The Fields (F20; core spec CS11, CS12, CS26, CS28, CS30, CS31; FC8): four blocks of nine plots, planted and harvested
// by tapping, tended by an Uma who makes a block grow faster and better. Growth is night step 2 and withering step 7
// (`growFields`, `witherFields`); everything else is a player's change. None of these stamp `updatedAt`: the app stamps
// each tap and the night stamps once. Every star and seed back is a seeded draw (`draw`, CS8).
//
// F21's talents and ranks aren't in yet: a tender's farming rank is read from the save (`ranks.farming.rank`), and her
// talent from `talentOf`, which is D for everyone until F21 passes master data's (decision "left to the worker").
import { dateOf, isSeasonEnd, SEASON_NAMES, type Season } from '../farm/calendar'
import { draw } from '../farm/draw'
import { opened, type PlaceOpens } from '../farm/places'
import type { Rank } from '../farm/ranks'
import { cropLevelQuality, drawStars, quality, TENDED_QUALITY, toolQuality, WELL_FED_QUALITY } from '../goods/stars'
import { seedId, seedOf, type CropId } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { spendGold } from '../save/gold'
import { loopWorking } from '../save/loop-work'
import { LOOP_KINDS, type LoopKinds } from '../save/parse-v3'
import { SaveRuleError } from '../save/rules'
import { BLOCK_IDS, emptyPlot, newBlock, tendedBlock, type Block, type BlockId, type OutfitId, type Plot, type SaveV3 } from '../save/v3'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import { CROPS, GROWTH_SLACK, growsIn, readyAt, SHOP_SEEDS } from './crops'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6
const cropName = (crop: CropId): string => itemNameOf(crop)

// --- Blocks (CS12) ----------------------------------------------------------------------------------------------------

/** What opens each block and what it costs (CS12): A on day 1; B at Farm Rank 2 for 800g; C at FR4 for 3,000g; D at FR6
 * for 8,000g. */
export const BLOCK_RULES: Readonly<Record<BlockId, { opens: PlaceOpens; cost: number }>> = {
  A: { opens: { by: 'start' }, cost: 0 },
  B: { opens: { by: 'farm-rank', rank: 2 }, cost: 800 },
  C: { opens: { by: 'farm-rank', rank: 4 }, cost: 3000 },
  D: { opens: { by: 'farm-rank', rank: 6 }, cost: 8000 },
}

/** The farm's block, or undefined while it isn't bought. */
export const blockOf = (save: Pick<SaveV3, 'fields'>, id: BlockId): Block | undefined => save.fields.blocks.find((b) => b.id === id)

/** Whether a block can be bought on this save now: not owned, and its Farm Rank reached. Gold is checked by `buyBlock`. */
export const blockOpen = (save: Pick<SaveV3, 'fields' | 'farm'>, id: BlockId): boolean => !blockOf(save, id) && opened(save, BLOCK_RULES[id].opens)

/** Buys a block (CS12): refused when it's the farm's already (`bad-slot`), before its Farm Rank (`locked`) and when gold
 * is short (`no-gold`). Its nine plots come tilled and empty, and the blocks stay in A–D order. */
export function buyBlock<S extends SaveV3>(save: S, id: BlockId): S {
  if (blockOf(save, id)) throw new SaveRuleError('bad-slot', `Block ${id} is yours already.`)
  const rule = BLOCK_RULES[id]
  if (!opened(save, rule.opens)) throw new SaveRuleError('locked', rule.opens.by === 'farm-rank' ? `Opens at Farm Rank ${rule.opens.rank}.` : 'Not open yet.')
  const paid = spendGold(save, rule.cost)
  const blocks = [...save.fields.blocks, newBlock(id)].sort((a, b) => BLOCK_IDS.indexOf(a.id) - BLOCK_IDS.indexOf(b.id))
  return { ...paid, fields: { blocks } }
}

// --- Tenders (CS12, CS28, CS31; decisions 1–3) ---------------------------------------------------------------------

/** A talent's step (CS28): G 0, F 1, E 2, D 3, C 4, B 5, A 6, S 7. */
export type TalentStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
/** D: every Uma's farming talent until F21 reads them from master data. */
export const TALENT_D: TalentStep = 3
/** Her farming talent's step. F21 passes master data's; until then `talentD`. */
export type FarmingTalentOf = (outfitId: OutfitId) => TalentStep
export const talentD: FarmingTalentOf = () => TALENT_D

/** Quality points from a talent (CS26, CS28): G −0.75, F −0.5, E −0.25, D 0, C +0.25, B +0.5, A +0.75, S +1. */
export const talentQuality = (step: TalentStep): number => 0.25 * (step - TALENT_D)
/** Tended growth from a talent (CS28): +0.05 at B, +0.10 at A, +0.15 at S; nothing below B. */
export const talentGrowth = (step: TalentStep): number => round6(Math.max(0, step - 4) * 0.05)

/** Untended blocks grow 1 a night (CS12). */
export const UNTENDED_GROWTH = 1
/** A Novice tender's block grows 1.25 a night, +0.1 a rank: 1.75 at Legend (CS12, CS31). */
export const NOVICE_GROWTH = 1.25
export const RANK_GROWTH = 0.1
/** ×1.25 when the tender is well fed (CS12). */
export const WELL_FED_GROWTH = 1.25
/** +10% a Watering Can tier above Basic (CS12). Tools are Basic in M4, so it adds nothing yet. */
export const canFactor = (tier: number): number => 1 + 0.1 * (tier - 1)

/** A tended block's growth a night: (1.25 + 0.1 a rank + her talent's) × the Watering Can × well fed. */
export function tendedGrowth(rank: Rank, talent: TalentStep, canTier = 1, wellFed = false): number {
  return round6((NOVICE_GROWTH + RANK_GROWTH * rank + talentGrowth(talent)) * canFactor(canTier) * (wellFed ? WELL_FED_GROWTH : 1))
}

/** Seeds back (CS11, CS31): 5% untended, a tender's 10% at Novice +5% a rank (35% at Legend), and +5% a Hoe tier above
 * Basic either way. */
export const UNTENDED_SEEDS_BACK = 0.05
export const NOVICE_SEEDS_BACK = 0.1
export const RANK_SEEDS_BACK = 0.05
export const HOE_SEEDS_BACK = 0.05
export function seedsBackChance(rank: Rank | null, hoeTier = 1): number {
  return round6((rank === null ? UNTENDED_SEEDS_BACK : NOVICE_SEEDS_BACK + RANK_SEEDS_BACK * rank) + HOE_SEEDS_BACK * (hoeTier - 1))
}

/** What a block's tender brings to it: her farming rank, her talent and whether she's well fed. */
export interface TenderTerms {
  outfitId: OutfitId
  rank: Rank
  talent: TalentStep
  wellFed: boolean
}

/** The block's tender now, with her terms, or null when it's untended. */
export function tenderTerms(save: Pick<SaveV3, 'fields' | 'roster'>, id: BlockId, talentOf: FarmingTalentOf = talentD): TenderTerms | null {
  const outfitId = blockOf(save, id)?.tender ?? null
  const uma = outfitId === null ? undefined : save.roster[outfitId]
  if (outfitId === null || !uma) return null
  return { outfitId, rank: uma.ranks.farming.rank, talent: talentOf(outfitId), wellFed: uma.wellFed > 0 }
}

/** A block's growth tonight: its tender's rate, or 1 untended (CS12). */
export function blockGrowth(save: Pick<SaveV3, 'fields' | 'roster' | 'tools'>, id: BlockId, talentOf: FarmingTalentOf = talentD): number {
  const tender = tenderTerms(save, id, talentOf)
  return tender ? tendedGrowth(tender.rank, tender.talent, save.tools['watering-can'], tender.wellFed) : UNTENDED_GROWTH
}

/** A harvest's quality points (CS26, farming): a tender's rank (0.5 a rank), talent, +0.25 for tending and well fed's
 * +0.25; the crop's level and the Hoe whoever tends it. Untended at level 1 with a Basic Hoe is 0: always ★1. */
export function harvestQuality(tender: Omit<TenderTerms, 'outfitId'> | null, level: number, hoeTier = 1): number {
  const farm = { cropLevel: cropLevelQuality(level), tool: toolQuality(hoeTier) }
  if (!tender) return quality(farm)
  return quality({ ...farm, rank: 0.5 * tender.rank, talent: talentQuality(tender.talent), care: TENDED_QUALITY, ...(tender.wellFed ? { boost: WELL_FED_QUALITY } : {}) })
}

/** Whether an Uma is busy (decision 1): she tends a block, or holds a running uma-work job. The Fields' picker, the job
 * sheet and the Dorm's swaps read this one rule. */
export function isBusy(save: SaveV3, outfitId: OutfitId, kinds: LoopKinds = LOOP_KINDS): boolean {
  return tendedBlock(save, outfitId) !== null || loopWorking(save, kinds).has(outfitId)
}

/** Sets or clears a block's tender (decision 1). She must be on the farm with no running job; a tender of another block
 * moves here. She stays until moved, across nights. */
export function setTender<S extends SaveV3>(save: S, id: BlockId, outfitId: OutfitId | null, kinds: LoopKinds = LOOP_KINDS): S {
  if (!blockOf(save, id)) throw new SaveRuleError('bad-slot', `No Block ${id} yet.`)
  if (outfitId !== null) {
    if (!save.dorm.home.includes(outfitId) || !save.roster[outfitId]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
    if (loopWorking(save, kinds).has(outfitId)) throw new SaveRuleError('busy', 'She’s working.')
  }
  const blocks = save.fields.blocks.map((b): Block => {
    if (b.id === id) return { ...b, tender: outfitId }
    return outfitId !== null && b.tender === outfitId ? { ...b, tender: null } : b
  })
  return { ...save, fields: { blocks } }
}

// --- Crop levels (CS11) ----------------------------------------------------------------------------------------------

export const MAX_CROP_LEVEL = 10
/** Crop points from a harvested plot: 1, or 2 when it was planted from own seeds (CS11). */
export const cropPointsOf = (own: boolean): number => (own ? 2 : 1)
/** The points a crop level starts at: level L → L + 1 takes 20 × L, so 2 at 20, 3 at 60, 4 at 120, 5 at 200, 10 at 900. */
export const cropLevelStart = (level: number): number => 10 * level * (level - 1)
/** A crop's level, 1–10, from its points. */
export function cropLevelOf(points: number): number {
  let level = 1
  while (level < MAX_CROP_LEVEL && points >= cropLevelStart(level + 1)) level++
  return level
}
/** A crop's level on this farm. */
export const cropLevel = (save: Pick<SaveV3, 'crops'>, crop: CropId): number => cropLevelOf(save.crops[crop] ?? 0)

// --- Farming's challenges (CS30) -------------------------------------------------------------------------------------

/** What a harvest she tended counts toward her next farming rank's challenge (CS30), by her rank now: Hand, every crop;
 * Skilled, crops of ★3+; Expert, a crop of level 4+ (one is enough); Master, crops of ★5. Legend's is the Flower Show
 * (M6), so nothing yet. F21's `countChallenge` takes this over. */
export function farmingChallengeCount(rank: Rank, stars: readonly number[], level: number): number {
  switch (rank) {
    case 0: return stars.length
    case 1: return stars.filter((s) => s >= 3).length
    case 2: return level >= 4 ? 1 : 0
    case 3: return stars.filter((s) => s === 5).length
    default: return 0
  }
}
/** Each farming challenge's target, toward Hand … Legend (CS30), for the manual and F21. */
export const FARMING_CHALLENGES: readonly { rank: Rank; target: number; what: string }[] = [
  { rank: 1, target: 30, what: 'Harvest 30 crops she tended' },
  { rank: 2, target: 40, what: '40 crops of ★3+ she tended' },
  { rank: 3, target: 1, what: 'Tend a crop of level 4+ to harvest' },
  { rank: 4, target: 30, what: '30 crops of ★5' },
  { rank: 5, target: 1, what: '1st at a Flower Show with a crop she tended (M6)' },
]

// --- Planting and harvesting (CS12; decisions 3–5, 7, 9, 10) ---------------------------------------------------------

/** The counters F24's chapter goals read (decision 10). */
export const PLOTS_PLANTED = 'plots-planted'
export const PLOTS_HARVESTED = 'plots-harvested'

const seasonOf = (save: Pick<SaveV3, 'calendar'>): Season => dateOf(save.calendar.day).season
const bump = (counts: Record<string, number>, key: string, n: number): Record<string, number> => ({ ...counts, [key]: (counts[key] ?? 0) + n })

function ownedBlock(save: Pick<SaveV3, 'fields'>, id: BlockId): Block {
  const block = blockOf(save, id)
  if (!block) throw new SaveRuleError('bad-slot', `No Block ${id} yet.`)
  return block
}
function plotOf(block: Block, index: number): Plot {
  const plot = block.plots[index]
  if (!Number.isInteger(index) || !plot) throw new SaveRuleError('bad-slot', `No plot ${index + 1} in Block ${block.id}.`)
  return plot
}
function withPlots(save: SaveV3, id: BlockId, plots: Plot[]): SaveV3['fields'] {
  return { blocks: save.fields.blocks.map((b) => (b.id === id ? { ...b, plots } : b)) }
}
function inSeason(save: Pick<SaveV3, 'calendar'>, crop: CropId): void {
  if (!growsIn(crop, seasonOf(save))) {
    throw new SaveRuleError('out-of-season', `${cropName(crop)} grows in ${CROPS[crop].seasons.map((s) => SEASON_NAMES[s]).join(' and ')}.`)
  }
}

/** Plants one seed (`seed-<crop>` or `seed-<crop>-own`) in an empty plot (decisions 7 and 10): in season only, the seed
 * from the Warehouse, the crop's entry in `crops` made on its first planting, `plots-planted` up one. */
export function plant<S extends SaveV3>(save: S, id: BlockId, index: number, seed: string): S {
  const block = ownedBlock(save, id)
  const plot = plotOf(block, index)
  const what = seedOf(seed)
  if (!what) throw new SaveRuleError('no-items', 'That isn’t a seed.')
  if (plot.crop !== null) throw new SaveRuleError('bad-slot', 'That plot is planted.')
  inSeason(save, what.crop)
  const items = takeGoods(save.items, seed, 1, 1)
  const plots = block.plots.map((p, i): Plot => (i === index ? { crop: what.crop, growth: 0, ready: false, regrowing: false, own: what.own } : p))
  return {
    ...save, items, fields: withPlots(save, id, plots), crops: { ...save.crops, [what.crop]: save.crops[what.crop] ?? 0 },
    farm: { ...save.farm, counts: bump(save.farm.counts, PLOTS_PLANTED, 1) },
  }
}

/** Plants every empty plot of a block with one crop (decision 9): own seeds first, then the shop's, until the plots or
 * the seeds run out. Refused with no empty plot (`bad-slot`) or no seeds of it (`no-items`). */
export function plantAll<S extends SaveV3>(save: S, id: BlockId, crop: CropId): S {
  const block = ownedBlock(save, id)
  const empty = block.plots.flatMap((p, i) => (p.crop === null ? [i] : []))
  if (empty.length === 0) throw new SaveRuleError('bad-slot', `Block ${id} is planted.`)
  inSeason(save, crop)
  const own = goodCount(save.items, seedId(crop, true))
  const held = own + goodCount(save.items, seedId(crop))
  if (held === 0) throw new SaveRuleError('no-items', `No ${cropName(crop)} seeds.`)
  return empty.slice(0, held).reduce((next, index, n) => plant(next, id, index, seedId(crop, n < own)), save)
}

/** What a harvest brought: crops by star and own seeds back. */
export interface HarvestReceipt {
  /** Crops by star, ★1 … ★5. */
  stars: [number, number, number, number, number]
  seeds: number
  plots: number
}
const noReceipt = (): HarvestReceipt => ({ stars: [0, 0, 0, 0, 0], seeds: 0, plots: 0 })
/** A receipt's crops, every star. */
export const receiptItems = (receipt: HarvestReceipt): number => receipt.stars.reduce((a, b) => a + b, 0)

function harvestPlot(save: SaveV3, id: BlockId, index: number, talentOf: FarmingTalentOf, receipt: HarvestReceipt): SaveV3 {
  const block = ownedBlock(save, id)
  const plot = plotOf(block, index)
  if (plot.crop === null || !plot.ready) throw new SaveRuleError('not-ready', plot.crop === null ? 'Nothing planted there.' : 'Not ready yet.')
  const crop = CROPS[plot.crop]
  const day = save.calendar.day
  const uid = save.account.uid
  // Decision 3: the stars and challenges read the block's tender now; nobody tending is untended.
  const tender = tenderTerms(save, id, talentOf)
  const points = save.crops[crop.id] ?? 0
  const level = cropLevelOf(points)
  const q = harvestQuality(tender, level, save.tools.hoe)
  // Decision 4: one star draw a crop.
  const stars = Array.from({ length: crop.yield }, (_, n) => drawStars(q, draw(uid, day, `harvest:${id}:${index}`, n)))
  let items = stars.reduce((all, s) => addGoods(all, crop.id, s, 1), save.items)
  for (const s of stars) receipt.stars[s - 1]! += 1
  if (draw(uid, day, `seeds:${id}:${index}`, 0) < seedsBackChance(tender?.rank ?? null, save.tools.hoe)) {
    items = addGoods(items, seedId(crop.id, true), 1, 1)
    receipt.seeds += 1
  }
  receipt.plots += 1
  // Decision 5 and the call on regrowth out of season: a regrowing crop starts again at 0 while it's in season, else the
  // plot empties.
  const regrows = crop.regrows !== null && growsIn(crop.id, seasonOf(save))
  const next: Plot = regrows ? { crop: crop.id, growth: 0, ready: false, regrowing: true, own: plot.own } : emptyPlot()
  let roster = save.roster
  if (tender) {
    const uma = roster[tender.outfitId]!
    const farming = uma.ranks.farming
    const add = farmingChallengeCount(farming.rank, stars, level)
    if (add > 0) roster = { ...roster, [tender.outfitId]: { ...uma, ranks: { ...uma.ranks, farming: { ...farming, challenge: farming.challenge + add } } } }
  }
  return {
    ...save, items, roster, fields: withPlots(save, id, block.plots.map((p, i) => (i === index ? next : p))),
    crops: { ...save.crops, [crop.id]: points + cropPointsOf(plot.own) }, farm: { ...save.farm, counts: bump(save.farm.counts, PLOTS_HARVESTED, 1) },
  }
}

/** Harvests a Ready plot: each crop draws its stars into the Warehouse, a seed may come back, the crop gains its points
 * and the tender her challenge's count, `plots-harvested` rises, and a regrowing crop starts again. */
export function harvest(save: SaveV3, id: BlockId, index: number, talentOf: FarmingTalentOf = talentD): { save: SaveV3; receipt: HarvestReceipt } {
  const receipt = noReceipt()
  return { save: harvestPlot(save, id, index, talentOf, receipt), receipt }
}

/** Harvests every Ready plot of the given blocks (Harvest all; every block for the map's Collect all). Nothing Ready
 * changes nothing. */
export function harvestAll(save: SaveV3, ids: readonly BlockId[] = BLOCK_IDS, talentOf: FarmingTalentOf = talentD): { save: SaveV3; receipt: HarvestReceipt } {
  const receipt = noReceipt()
  let next = save
  for (const block of save.fields.blocks) {
    if (!ids.includes(block.id)) continue
    block.plots.forEach((plot, index) => {
      if (plot.ready) next = harvestPlot(next, block.id, index, talentOf, receipt)
    })
  }
  return { save: next, receipt }
}

// --- What a screen and the morning read ----------------------------------------------------------------------------

/** The seeds held that plant today, by id: own seeds first, then the shop's, by CS11's order. */
export function seedsInSeason(save: Pick<SaveV3, 'items' | 'calendar'>): { id: string; crop: CropId; own: boolean; count: number }[] {
  const season = seasonOf(save)
  return Object.keys(CROPS).flatMap((c) => {
    const crop = c as CropId
    if (!growsIn(crop, season)) return []
    return [true, false].flatMap((own) => {
      const count = goodCount(save.items, seedId(crop, own))
      return count > 0 ? [{ id: seedId(crop, own), crop, own, count }] : []
    })
  })
}

/** Empty plots that seeds held could fill today: the morning's nudge (CS5 §6). */
export function plotsToPlant(save: Pick<SaveV3, 'items' | 'calendar' | 'fields'>): number {
  const empty = save.fields.blocks.reduce((n, b) => n + b.plots.filter((p) => p.crop === null).length, 0)
  return Math.min(empty, seedsInSeason(save).reduce((n, s) => n + s.count, 0))
}

/** Nights left until a growing plot is Ready at its block's growth now; 0 once Ready. */
export function nightsLeft(plot: Plot, growth: number): number {
  if (plot.crop === null || plot.ready) return 0
  return Math.max(1, Math.ceil((readyAt(plot.crop, plot.regrowing) - plot.growth) / growth - GROWTH_SLACK))
}

/** The shop's seeds this season (CS4), each line opening at its tier's Farm Rank. */
export function seedLines(save: Pick<SaveV3, 'calendar'>): { id: string; price: number; opens: PlaceOpens }[] {
  return SHOP_SEEDS[seasonOf(save)].map((crop) => {
    const { tier, seed } = CROPS[crop]
    return { id: seedId(crop), price: seed!, opens: tier === 1 ? { by: 'start' } : { by: 'farm-rank', rank: tier as number } }
  })
}

// --- The night (CS7 steps 2 and 7) ---------------------------------------------------------------------------------

/** Crops that turned Ready tonight on a block. */
export interface Ripened {
  block: BlockId
  plots: number
}
/** Crops that withered on a season's last night, by block and crop. */
export interface Withered {
  block: BlockId
  crop: CropId
  plots: number
}

/**
 * Step 2 (CS7, CS12): every planted plot that isn't Ready grows by its block's rate; a plot whose growth reaches its
 * days − 0.5 turns Ready. A tender works the night only when her block has a growing plot (decision 2): those are
 * `tended`, for F21's rank points. Talents are F21's; until then D.
 */
export function growFields(save: SaveV3, talentOf: FarmingTalentOf = talentD): { save: SaveV3; tended: { outfitId: OutfitId; block: BlockId }[]; ripened: Ripened[] } {
  const tended: { outfitId: OutfitId; block: BlockId }[] = []
  const ripened: Ripened[] = []
  const blocks = save.fields.blocks.map((block): Block => {
    if (!block.plots.some((p) => p.crop !== null && !p.ready)) return block
    const rate = blockGrowth(save, block.id, talentOf)
    if (block.tender !== null && save.roster[block.tender]) tended.push({ outfitId: block.tender, block: block.id })
    let ripe = 0
    const plots = block.plots.map((plot): Plot => {
      if (plot.crop === null || plot.ready) return plot
      const growth = round6(plot.growth + rate)
      const ready = growth + GROWTH_SLACK >= readyAt(plot.crop, plot.regrowing)
      if (ready) ripe++
      return { ...plot, growth, ready }
    })
    if (ripe > 0) ripened.push({ block: block.id, plots: ripe })
    return { ...block, plots }
  })
  return { save: { ...save, fields: { blocks } }, tended, ripened }
}

/**
 * Step 7's withering (CS4, CS7; decision 6): on a season's last night, before the date turns, every crop still growing
 * that doesn't grow in the next season withers and its plot empties. Ready crops wait to be harvested. Corn carries
 * Summer → Autumn and Cabbage Winter → Spring; nothing else does.
 */
export function witherFields(save: SaveV3): { save: SaveV3; withered: Withered[] } {
  const day = save.calendar.day
  if (!isSeasonEnd(day)) return { save, withered: [] }
  const next = dateOf(day + 1).season
  const withered: Withered[] = []
  const blocks = save.fields.blocks.map((block): Block => {
    let changed = false
    const plots = block.plots.map((plot): Plot => {
      if (plot.crop === null || plot.ready || growsIn(plot.crop, next)) return plot
      changed = true
      const line = withered.find((w) => w.block === block.id && w.crop === plot.crop)
      if (line) line.plots++
      else withered.push({ block: block.id, crop: plot.crop, plots: 1 })
      return emptyPlot()
    })
    return changed ? { ...block, plots } : block
  })
  return { save: { ...save, fields: { blocks } }, withered }
}
