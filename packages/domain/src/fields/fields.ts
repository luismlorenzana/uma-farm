// The Fields: four blocks of nine plots, planted and harvested
// by tapping, tended by an Uma who makes a block grow faster and better. Growth is night step 2 and withering step 7
// (`growFields`, `witherFields`); everything else is a player's change. None of these stamp `updatedAt`: the app stamps
// each tap and the night stamps once. Every star and seed back is a seeded draw (`draw`).
//
// A tender's farming rank is read from the save (`ranks.farming.rank`) and her talent from `talentOf`, master data's as
// F21 reads it (`TalentOf`, passed by the night and the app); the rules default to D for tests. CS31's table
// (`rankBenefits`) drives tended growth, quality and seeds back, and F21's `countChallenge` counts a harvest.
import { SIDE_BY_SIDE, tendsSideBySide } from '../farm/bonds'
import { IN_ELEMENT, inElement, keepsakeQuality, romanceBonus, type PerkPack } from '../romance/perk-terms'
import { dateOf, isSeasonEnd, SEASON_NAMES, type Season } from '../farm/calendar'
import { draw } from '../farm/draw'
import { opened, type PlaceOpens } from '../farm/places'
import { earnPraise } from '../romance/praise'
import { countChallenge, rankBenefits, rankQuality } from '../farm/rank-rules'
import type { Rank } from '../farm/ranks'
import { TALENT_D, talentGrowth, talentQuality, type TalentStep } from '../farm/talents'
import { cropLevelQuality, drawStars, quality, TENDED_QUALITY, toolQuality, WELL_FED_QUALITY } from '../goods/stars'
import { seedId, seedOf, type CropId } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { spendGold } from '../save/gold'
import { loopWorking } from '../save/loop-work'
import { LOOP_KINDS } from '../gathering/kinds'
import type { LoopKinds } from '../save/parse-v3'
import { SaveRuleError } from '../save/rules'
import { atHome, BLOCK_IDS, emptyPlot, leaving, newBlock, tendedBlock, type Block, type BlockId, type OutfitId, type Plot, type SaveV3 } from '../save/v3'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import { CROPS, GROWTH_SLACK, growsIn, readyAt, SHOP_SEEDS } from './crops'
import type { FarmSave, SaveV4 } from '../save/v4'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6
const cropName = (crop: CropId): string => itemNameOf(crop)

// --- Blocks ----------------------------------------------------------------------------------------------------

/** What opens each block and what it costs: A on day 1; B at Farm Rank 2 for 800g; C at FR4 for 3,000g; D at FR6
 * for 8,000g. */
export const BLOCK_RULES: Readonly<Record<BlockId, { opens: PlaceOpens; cost: number }>> = {
  A: { opens: { by: 'start' }, cost: 0 },
  B: { opens: { by: 'farm-rank', rank: 2 }, cost: 800 },
  C: { opens: { by: 'farm-rank', rank: 4 }, cost: 3000 },
  D: { opens: { by: 'farm-rank', rank: 6 }, cost: 8000 },
}

/** The farm's block, or undefined while it isn't bought. */
export const blockOf = (save: Pick<FarmSave, 'fields'>, id: BlockId): Block | undefined => save.fields.blocks.find((b) => b.id === id)

/** Whether a block can be bought on this save now: not owned, and its Farm Rank reached. Gold is checked by `buyBlock`. */
export const blockOpen = (save: Pick<FarmSave, 'fields' | 'farm'>, id: BlockId): boolean => !blockOf(save, id) && opened(save, BLOCK_RULES[id].opens)

/** Buys a block: refused when it's the farm's already (`bad-slot`), before its Farm Rank (`locked`) and when gold
 * is short (`no-gold`). Its nine plots come tilled and empty, and the blocks stay in A–D order. */
export function buyBlock<S extends FarmSave>(save: S, id: BlockId): S {
  if (blockOf(save, id)) throw new SaveRuleError('bad-slot', `Block ${id} is yours already.`)
  const rule = BLOCK_RULES[id]
  if (!opened(save, rule.opens)) throw new SaveRuleError('locked', rule.opens.by === 'farm-rank' ? `Opens at Farm Rank ${rule.opens.rank}.` : 'Not open yet.')
  const paid = spendGold(save, rule.cost)
  const blocks = [...save.fields.blocks, newBlock(id)].sort((a, b) => BLOCK_IDS.indexOf(a.id) - BLOCK_IDS.indexOf(b.id))
  return { ...paid, fields: { blocks } }
}

// --- Tenders ---------------------------------------------------------------------

/** Her farming talent's step: F21 passes master data's (`TalentOf` read in farming); `talentD` in tests. */
export type FarmingTalentOf = (outfitId: OutfitId) => TalentStep
export const talentD: FarmingTalentOf = () => TALENT_D

/** Untended blocks grow 1 a night. */
export const UNTENDED_GROWTH = 1
/** ×1.25 when the tender is well fed. */
export const WELL_FED_GROWTH = 1.25
/** +10% a Watering Can tier above Basic. Tools are Basic in M4, so it adds nothing yet. */
export const canFactor = (tier: number): number => 1 + 0.1 * (tier - 1)

/** A tended block's growth a night: (her rank's, CS31: 1.25 at Novice … 1.75 at Legend, + her talent's) × the Watering
 * Can × well fed. */
export function tendedGrowth(rank: Rank, talent: TalentStep, canTier = 1, wellFed = false): number {
  return round6((rankBenefits(rank).tendedGrowth + talentGrowth(talent)) * canFactor(canTier) * (wellFed ? WELL_FED_GROWTH : 1))
}

/** Seeds back: 5% untended, a tender's by her rank (10% at Novice … 35% at Legend), and +5% a Hoe tier
 * above Basic either way. */
export const UNTENDED_SEEDS_BACK = 0.05
export const HOE_SEEDS_BACK = 0.05
export function seedsBackChance(rank: Rank | null, hoeTier = 1): number {
  return round6((rank === null ? UNTENDED_SEEDS_BACK : rankBenefits(rank).seedsBack) + HOE_SEEDS_BACK * (hoeTier - 1))
}

/** What a block's tender brings to it: her farming rank, her talent and whether she's well fed; on save v4 with the pack,
 * her keepsake's quality when the Fields are her line's place. */
export interface TenderTerms {
  outfitId: OutfitId
  rank: Rank
  talent: TalentStep
  wellFed: boolean
  keepsake?: number
}

/** The story pack the Fields read on a v4 farm: a tender's line, for her keepsake, in her element and the romance
 * term. Null on v3, or before the pack loads: the Fields then work as F20's and F52's. */
type FieldsStory = PerkPack | null
/** What the perks read of a v4 save beside the Fields' own parts; a v3 save has none of them. */
type V4Parts = { version?: number; love?: SaveV4['love']; memories?: SaveV4['memories']; farm?: FarmSave['farm'] }
const v4Story = (save: Pick<FarmSave, 'version'>, story: FieldsStory): PerkPack | null => (save.version === 4 ? story : null)

/** The block's tender now, with her terms, or null when it's untended. */
export function tenderTerms(save: Pick<FarmSave, 'fields' | 'roster'> & V4Parts, id: BlockId, talentOf: FarmingTalentOf = talentD, story: FieldsStory = null): TenderTerms | null {
  const outfitId = blockOf(save, id)?.tender ?? null
  const uma = outfitId === null ? undefined : save.roster[outfitId]
  if (outfitId === null || !uma) return null
  const terms: TenderTerms = { outfitId, rank: uma.ranks.farming.rank, talent: talentOf(outfitId), wellFed: uma.wellFed > 0 }
  const keepsake = story && save.version === 4 && save.love && save.farm ? keepsakeQuality({ love: save.love, farm: save.farm }, story, outfitId, 'fields') : 0
  return keepsake > 0 ? { ...terms, keepsake } : terms
}

/** A block's growth tonight: its tender's rate, or 1 untended; on save v4, ×1.1 side by side (F52 decision 7:
 * its tender has a 3-heart partner tending another growing block, `tendsSideBySide`), ×1.2 for a farmer in her element
 * (F51 decision 4: Friendship 8, the Fields her line's place, with the pack). */
export function blockGrowth(save: Pick<FarmSave, 'version' | 'fields' | 'roster' | 'tools' | 'bonds'> & V4Parts, id: BlockId, talentOf: FarmingTalentOf = talentD, story: FieldsStory = null): number {
  const tender = tenderTerms(save, id, talentOf)
  if (!tender) return UNTENDED_GROWTH
  const rate = tendedGrowth(tender.rank, tender.talent, save.tools['watering-can'], tender.wellFed)
  if (!tendsSideBySide(save, id)) return rate
  const pack = v4Story(save, story)
  const element = pack && save.love && save.farm && inElement({ love: save.love, farm: save.farm }, pack, tender.outfitId, 'fields')
  return round6(rate * (element ? IN_ELEMENT : SIDE_BY_SIDE))
}

/** A harvest's quality points (farming): a tender's rank (`rankQuality`, 0.5 a rank), talent (`talentQuality`),
 * +0.25 for tending and well fed's +0.25, and on v4 her keepsake; the crop's level and the Hoe whoever tends it.
 * Untended at level 1 with a Basic Hoe is 0: always ★1. */
export function harvestQuality(tender: Omit<TenderTerms, 'outfitId'> | null, level: number, hoeTier = 1): number {
  const farm = { cropLevel: cropLevelQuality(level), tool: toolQuality(hoeTier) }
  if (!tender) return quality(farm)
  return quality({
    ...farm, rank: rankQuality(tender.rank), talent: talentQuality(tender.talent), care: TENDED_QUALITY, ...(tender.wellFed ? { boost: WELL_FED_QUALITY } : {}),
    ...(tender.keepsake ? { keepsake: tender.keepsake } : {}),
  })
}

/** Whether an Uma is busy: she tends a block, or holds a running uma-work job. The Fields' picker, the job
 * sheet and the Dorm's swaps read this one rule. */
export function isBusy(save: FarmSave, outfitId: OutfitId, kinds: LoopKinds = LOOP_KINDS): boolean {
  return tendedBlock(save, outfitId) !== null || loopWorking(save, kinds).has(outfitId)
}

/** Sets or clears a block's tender. She must be on the farm with no running job; a tender of another block
 * moves here. She stays until moved, across nights. */
export function setTender<S extends FarmSave>(save: S, id: BlockId, outfitId: OutfitId | null, kinds: LoopKinds = LOOP_KINDS): S {
  if (!blockOf(save, id)) throw new SaveRuleError('bad-slot', `No Block ${id} yet.`)
  if (outfitId !== null) {
    // F54 decision 4: a spouse in her house is on the farm too.
    if (!atHome(save, outfitId) || !save.roster[outfitId]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
    if (leaving(save, outfitId)) throw new SaveRuleError('busy', 'She leaves tomorrow.')
    if (loopWorking(save, kinds).has(outfitId)) throw new SaveRuleError('busy', 'She’s working.')
  }
  const blocks = save.fields.blocks.map((b): Block => {
    if (b.id === id) return { ...b, tender: outfitId }
    return outfitId !== null && b.tender === outfitId ? { ...b, tender: null } : b
  })
  return { ...save, fields: { blocks } }
}

// --- Crop levels ----------------------------------------------------------------------------------------------

export const MAX_CROP_LEVEL = 10
/** Crop points from a harvested plot: 1, or 2 when it was planted from own seeds. */
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
export const cropLevel = (save: Pick<FarmSave, 'crops'>, crop: CropId): number => cropLevelOf(save.crops[crop] ?? 0)

// --- Planting and harvesting ---------------------------------------------------------

/** The counters F24's chapter goals read. */
export const PLOTS_PLANTED = 'plots-planted'
export const PLOTS_HARVESTED = 'plots-harvested'

const seasonOf = (save: Pick<FarmSave, 'calendar'>): Season => dateOf(save.calendar.day).season
const bump = (counts: Record<string, number>, key: string, n: number): Record<string, number> => ({ ...counts, [key]: (counts[key] ?? 0) + n })

function ownedBlock(save: Pick<FarmSave, 'fields'>, id: BlockId): Block {
  const block = blockOf(save, id)
  if (!block) throw new SaveRuleError('bad-slot', `No Block ${id} yet.`)
  return block
}
function plotOf(block: Block, index: number): Plot {
  const plot = block.plots[index]
  if (!Number.isInteger(index) || !plot) throw new SaveRuleError('bad-slot', `No plot ${index + 1} in Block ${block.id}.`)
  return plot
}
function withPlots(save: FarmSave, id: BlockId, plots: Plot[]): SaveV3['fields'] {
  return { blocks: save.fields.blocks.map((b) => (b.id === id ? { ...b, plots } : b)) }
}
function inSeason(save: Pick<FarmSave, 'calendar'>, crop: CropId): void {
  if (!growsIn(crop, seasonOf(save))) {
    throw new SaveRuleError('out-of-season', `${cropName(crop)} grows in ${CROPS[crop].seasons.map((s) => SEASON_NAMES[s]).join(' and ')}.`)
  }
}

/** Plants one seed (`seed-<crop>` or `seed-<crop>-own`) in an empty plot: in season only, the seed
 * from the Warehouse, the crop's entry in `crops` made on its first planting, `plots-planted` up one. */
export function plant<S extends FarmSave>(save: S, id: BlockId, index: number, seed: string): S {
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

/** Plants every empty plot of a block with one crop: own seeds first, then the shop's, until the plots or
 * the seeds run out. Refused with no empty plot (`bad-slot`) or no seeds of it (`no-items`). */
export function plantAll<S extends FarmSave>(save: S, id: BlockId, crop: CropId): S {
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
  /** Crops by star, ★1 … ★5, the perks' extra crops among them. */
  stars: [number, number, number, number, number]
  seeds: number
  plots: number
  /** Extra crops from the romance term, already in `stars`. */
  perks: number
}
const noReceipt = (): HarvestReceipt => ({ stars: [0, 0, 0, 0, 0], seeds: 0, plots: 0, perks: 0 })
/** A receipt's crops, every star. */
export const receiptItems = (receipt: HarvestReceipt): number => receipt.stars.reduce((a, b) => a + b, 0)

/** A tended plot's chance of one extra crop at harvest: the romance term on its tender's work at the
 * Fields (her own when farming is her line, plus the crew's), on save v4 with the pack; 0 untended or on v3. */
export function extraCropChance(save: FarmSave, tender: OutfitId | null, story: FieldsStory = null): number {
  return save.version === 4 && story && tender !== null ? romanceBonus(save, story, tender, 'fields') : 0
}

function harvestPlot<S extends FarmSave>(save: S, id: BlockId, index: number, talentOf: FarmingTalentOf, receipt: HarvestReceipt, story: FieldsStory): S {
  const block = ownedBlock(save, id)
  const plot = plotOf(block, index)
  if (plot.crop === null || !plot.ready) throw new SaveRuleError('not-ready', plot.crop === null ? 'Nothing planted there.' : 'Not ready yet.')
  const crop = CROPS[plot.crop]
  const day = save.calendar.day
  const uid = save.account.uid
  // Decision 3: the stars and challenges read the block's tender now; nobody tending is untended.
  const tender = tenderTerms(save, id, talentOf, v4Story(save, story))
  const points = save.crops[crop.id] ?? 0
  const level = cropLevelOf(points)
  const q = harvestQuality(tender, level, save.tools.hoe)
  // Decision 4: one star draw a crop.
  const stars = Array.from({ length: crop.yield }, (_, n) => drawStars(q, draw(uid, day, `harvest:${id}:${index}`, n)))
  // F51 decision 3: a tended plot's chance of one extra crop, a copy of one of its crops (the plot's stars).
  const chance = extraCropChance(save, tender?.outfitId ?? null, story)
  const extra = chance > 0 && draw(uid, day, `perk:harvest:${id}:${index}`, 0) < chance
    ? [stars[Math.floor(draw(uid, day, `perk:harvest:${id}:${index}`, 1) * stars.length)]!] : []
  let items = [...stars, ...extra].reduce((all, s) => addGoods(all, crop.id, s, 1), save.items)
  for (const s of [...stars, ...extra]) receipt.stars[s - 1]! += 1
  receipt.perks += extra.length
  if (draw(uid, day, `seeds:${id}:${index}`, 0) < seedsBackChance(tender?.rank ?? null, save.tools.hoe)) {
    items = addGoods(items, seedId(crop.id, true), 1, 1)
    receipt.seeds += 1
  }
  receipt.plots += 1
  // Decision 5 and the call on regrowth out of season: a regrowing crop starts again at 0 while it's in season, else the
  // plot empties.
  const regrows = crop.regrows !== null && growsIn(crop.id, seasonOf(save))
  const next: Plot = regrows ? { crop: crop.id, growth: 0, ready: false, regrowing: true, own: plot.own } : emptyPlot()
  // CS30: the harvest counts toward her next farming rank's challenge.
  const roster = tender ? countChallenge(save, tender.outfitId, 'farming', { kind: 'harvest', stars, level }).roster : save.roster
  const harvested: S = {
    ...save, items, roster, fields: withPlots(save, id, block.plots.map((p, i) => (i === index ? next : p))),
    crops: { ...save.crops, [crop.id]: points + cropPointsOf(plot.own) }, farm: { ...save.farm, counts: bump(save.farm.counts, PLOTS_HARVESTED, 1) },
  }
  // F47 decision 6 (b), save v4: a ★3+ crop from the block she tends earns her praise today.
  return tender && stars.some((s) => s >= 3) ? earnPraise(harvested, tender.outfitId) : harvested
}

/** Harvests a Ready plot: each crop draws its stars into the Warehouse, a seed may come back, the crop gains its points
 * and the tender her challenge's count (`countChallenge`), `plots-harvested` rises, and a regrowing crop starts again. On
 * save v4 with the pack, her keepsake lifts the stars and the romance term may add a crop. */
export function harvest<S extends FarmSave>(save: S, id: BlockId, index: number, talentOf: FarmingTalentOf = talentD, story: FieldsStory = null): { save: S; receipt: HarvestReceipt } {
  const receipt = noReceipt()
  return { save: harvestPlot(save, id, index, talentOf, receipt, story), receipt }
}

/** Harvests every Ready plot of the given blocks (Harvest all; every block for the map's Collect all). Nothing Ready
 * changes nothing. */
export function harvestAll<S extends FarmSave>(save: S, ids: readonly BlockId[] = BLOCK_IDS, talentOf: FarmingTalentOf = talentD, story: FieldsStory = null): { save: S; receipt: HarvestReceipt } {
  const receipt = noReceipt()
  let next = save
  for (const block of save.fields.blocks) {
    if (!ids.includes(block.id)) continue
    block.plots.forEach((plot, index) => {
      if (plot.ready) next = harvestPlot(next, block.id, index, talentOf, receipt, story)
    })
  }
  return { save: next, receipt }
}

// --- What a screen and the morning read ----------------------------------------------------------------------------

/** The seeds held that plant today, by id: own seeds first, then the shop's, by CS11's order. */
export function seedsInSeason(save: Pick<FarmSave, 'items' | 'calendar'>): { id: string; crop: CropId; own: boolean; count: number }[] {
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
export function plotsToPlant(save: Pick<FarmSave, 'items' | 'calendar' | 'fields'>): number {
  const empty = save.fields.blocks.reduce((n, b) => n + b.plots.filter((p) => p.crop === null).length, 0)
  return Math.min(empty, seedsInSeason(save).reduce((n, s) => n + s.count, 0))
}

/** Nights left until a growing plot is Ready at its block's growth now; 0 once Ready. */
export function nightsLeft(plot: Plot, growth: number): number {
  if (plot.crop === null || plot.ready) return 0
  return Math.max(1, Math.ceil((readyAt(plot.crop, plot.regrowing) - plot.growth) / growth - GROWTH_SLACK))
}

/** The shop's seeds this season, each line opening at its tier's Farm Rank. */
export function seedLines(save: Pick<FarmSave, 'calendar'>): { id: string; price: number; opens: PlaceOpens }[] {
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
 * Step 2: every planted plot that isn't Ready grows by its block's rate; a plot whose growth reaches its
 * days − 0.5 turns Ready. A tender works the night only when her block has a growing plot: those are
 * `tended`, for F21's rank points (night step 6). On save v4 the pack gives a farmer in her element ×1.2, and
 * `extra` is the night's farming chores' growth by block (+0.25 each), added to the block's rate tonight.
 */
export function growFields<S extends FarmSave>(save: S, talentOf: FarmingTalentOf = talentD, story: FieldsStory = null, extra: ReadonlyMap<BlockId, number> = new Map()): { save: S; tended: { outfitId: OutfitId; block: BlockId }[]; ripened: Ripened[] } {
  const tended: { outfitId: OutfitId; block: BlockId }[] = []
  const ripened: Ripened[] = []
  const blocks = save.fields.blocks.map((block): Block => {
    if (!block.plots.some((p) => p.crop !== null && !p.ready)) return block
    const chores = extra.get(block.id)
    const rate = chores ? round6(blockGrowth(save, block.id, talentOf, story) + chores) : blockGrowth(save, block.id, talentOf, story)
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
 * Step 7's withering: on a season's last night, before the date turns, every crop still growing
 * that doesn't grow in the next season withers and its plot empties. Ready crops wait to be harvested. Corn carries
 * Summer → Autumn and Cabbage Winter → Spring; nothing else does.
 */
export function witherFields<S extends FarmSave>(save: S): { save: S; withered: Withered[] } {
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
