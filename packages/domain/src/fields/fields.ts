// The field: a grid of tiles the farmer works by hand, one action a tile. A tile starts overgrown (weeds, a stone or a
// stump) or cleared; you clear it, till it, plant it, water it, and harvest it once it's ripe:
//
//   overgrown ──clear──► cleared ──till──► tilled ──plant (in season)──► a crop, growth 0
//                                                                         │ watered today ──night──► one stage on
//                                                                         ▼ its stages reach its days − 0.5
//                                                                       ripe ──harvest──► the Warehouse; the tile stays tilled
//
// A crop's stages are its growth days: a watered tile grows a stage that night and a dry one doesn't, so a 4-day Carrot
// is ripe after four watered nights. A season's last night withers what still grows out of season. Crops, seasons,
// prices, stars, seeds back and crop levels stay the crops' own (`crops.ts`, `goods/`). Growth is night step 2 and
// withering step 7 (`growTiles`, `witherTiles`); every other rule is the farmer's, spending the day's actions. None of
// these stamp `updatedAt`: the app stamps each tap and the night stamps once. Every star and seed back is a seeded draw.
import { spend } from '../farm/actions'
import { dateOf, isSeasonEnd, SEASON_NAMES, type Season } from '../farm/calendar'
import { draw } from '../farm/draw'
import type { PlaceOpens } from '../farm/places'
import { rankBenefits, rankQuality } from '../farm/rank-rules'
import type { Rank } from '../farm/ranks'
import { talentQuality, type TalentStep } from '../farm/talents'
import { cropLevelQuality, drawStars, quality, TENDED_QUALITY, toolQuality, WELL_FED_QUALITY } from '../goods/stars'
import { seedId, seedOf, type CropId } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { SaveRuleError } from '../save/rules'
import { bareTile, FIELD_TILES, isOvergrown, type FarmSave, type Overgrowth, type Tile } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import { CROPS, GROWTH_SLACK, growsIn, readyAt, SHOP_SEEDS } from './crops'

const cropName = (crop: CropId): string => itemNameOf(crop)

// --- Crop levels ----------------------------------------------------------------------------------------------

export const MAX_CROP_LEVEL = 10
/** Crop points from a harvested tile: 1, or 2 when it was planted from own seeds. */
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

// --- A harvest's stars and seeds back --------------------------------------------------------------------------

/** What a worker brings to a harvest: her farming rank, talent, whether she's well fed, and her keepsake. The farmer
 * brings none: his harvests read the crop's level and the Hoe only. A farmer Uma's line quality reads them
 * (`lineQuality`). */
export interface HarvestTerms {
  rank: Rank
  talent: TalentStep
  wellFed: boolean
  keepsake?: number
}

/** A harvest's quality points: the crop's level (+0.1 a level above 1) and the Hoe (+0.25 a tier above Basic); with a
 * worker's terms, her rank, talent, +0.25 for her care, well fed's +0.25 and her keepsake. The farmer's at crop level
 * 1 with a Basic Hoe is 0: always ★1. */
export function harvestQuality(worker: HarvestTerms | null, level: number, hoeTier = 1): number {
  const farm = { cropLevel: cropLevelQuality(level), tool: toolQuality(hoeTier) }
  if (!worker) return quality(farm)
  return quality({
    ...farm, rank: rankQuality(worker.rank), talent: talentQuality(worker.talent), care: TENDED_QUALITY, ...(worker.wellFed ? { boost: WELL_FED_QUALITY } : {}),
    ...(worker.keepsake ? { keepsake: worker.keepsake } : {}),
  })
}

/** Seeds back: 5% for the farmer, a worker's by her rank (10% at Novice … 35% at Legend), and +5% a Hoe tier above
 * Basic either way. */
export const FARMER_SEEDS_BACK = 0.05
export const HOE_SEEDS_BACK = 0.05
export function seedsBackChance(rank: Rank | null, hoeTier = 1): number {
  return Math.round(((rank === null ? FARMER_SEEDS_BACK : rankBenefits(rank).seedsBack) + HOE_SEEDS_BACK * (hoeTier - 1)) * 1e6) / 1e6
}

// --- The tiles -----------------------------------------------------------------------------------------------

/** The field's lifetime counters. */
export const TILES_CLEARED = 'tiles-cleared'
export const TILES_PLANTED = 'tiles-planted'
export const TILES_HARVESTED = 'tiles-harvested'

/** What clearing leaves: a stump a Pine Log, a stone a Limestone, each ★1; weeds nothing. */
export const CLEAR_FINDS: Readonly<Record<Overgrowth, string | null>> = { weeds: null, stone: 'limestone', stump: 'pine-log' }
/** The words for what covers a tile. */
export const GROUND_NAMES: Readonly<Record<Tile['ground'], string>> = { weeds: 'Weeds', stone: 'A stone', stump: 'A stump', clear: 'Cleared ground', tilled: 'Tilled soil' }

const seasonOf = (save: Pick<FarmSave, 'calendar'>): Season => dateOf(save.calendar.day).season
const bump = (counts: Record<string, number>, key: string, n = 1): Record<string, number> => ({ ...counts, [key]: (counts[key] ?? 0) + n })

/** The field's tile, or a refusal (`bad-slot`) for one that isn't there. */
export function tileAt(save: Pick<FarmSave, 'fields'>, index: number): Tile {
  const tile = Number.isInteger(index) ? save.fields.tiles[index] : undefined
  if (!tile) throw new SaveRuleError('bad-slot', `No tile ${index + 1} in the field.`)
  return tile
}
function withTile<S extends FarmSave>(save: S, index: number, tile: Tile): S['fields'] {
  return { tiles: save.fields.tiles.map((t, i) => (i === index ? tile : t)) }
}
function inSeason(save: Pick<FarmSave, 'calendar'>, crop: CropId): void {
  if (!growsIn(crop, seasonOf(save))) {
    throw new SaveRuleError('out-of-season', `${cropName(crop)} grows in ${CROPS[crop].seasons.map((s) => SEASON_NAMES[s]).join(' and ')}.`)
  }
}

/** Clears an overgrown tile: one action. A stump leaves a Pine Log and a stone a Limestone, ★1, in the Warehouse.
 * Refused on cleared ground or soil (`bad-slot`). */
export function clearTile<S extends FarmSave>(save: S, index: number): { save: S; found: string | null } {
  const tile = tileAt(save, index)
  if (!isOvergrown(tile.ground)) throw new SaveRuleError('bad-slot', 'It’s clear already.')
  const found = CLEAR_FINDS[tile.ground]
  const spent = spend(save, 'clear')
  return {
    save: {
      ...spent, fields: withTile(spent, index, bareTile('clear')), ...(found ? { items: addGoods(spent.items, found, 1, 1) } : {}),
      farm: { ...spent.farm, counts: bump(spent.farm.counts, TILES_CLEARED) },
    },
    found,
  }
}

/** Tills cleared ground: one action. Refused on an overgrown tile (`bad-slot`: clear it first) and on soil already
 * tilled. */
export function tillTile<S extends FarmSave>(save: S, index: number): S {
  const tile = tileAt(save, index)
  if (isOvergrown(tile.ground)) throw new SaveRuleError('bad-slot', 'Clear it first.')
  if (tile.ground === 'tilled') throw new SaveRuleError('bad-slot', 'It’s tilled already.')
  const spent = spend(save, 'till')
  return { ...spent, fields: withTile(spent, index, bareTile('tilled')) }
}

/** Plants one seed (`seed-<crop>` or `seed-<crop>-own`) in empty tilled soil: one action, in its crop's seasons only,
 * the seed from the Warehouse, the crop's entry in `crops` made on its first planting. */
export function plantTile<S extends FarmSave>(save: S, index: number, seed: string): S {
  const tile = tileAt(save, index)
  const what = seedOf(seed)
  if (!what) throw new SaveRuleError('no-items', 'That isn’t a seed.')
  if (tile.ground !== 'tilled') throw new SaveRuleError('bad-slot', 'Till it first.')
  if (tile.crop !== null) throw new SaveRuleError('bad-slot', 'It’s planted.')
  inSeason(save, what.crop)
  const items = takeGoods(save.items, seed, 1, 1)
  const spent = spend(save, 'plant')
  return {
    ...spent, items, fields: withTile(spent, index, { ...bareTile('tilled'), crop: what.crop, own: what.own }),
    crops: { ...spent.crops, [what.crop]: spent.crops[what.crop] ?? 0 }, farm: { ...spent.farm, counts: bump(spent.farm.counts, TILES_PLANTED) },
  }
}

/** Waters a growing tile: one action; it grows a stage tonight. Refused with nothing growing, once it's ripe and once
 * it's watered today. */
export function waterTile<S extends FarmSave>(save: S, index: number): S {
  const tile = tileAt(save, index)
  if (tile.crop === null) throw new SaveRuleError('bad-slot', 'Nothing grows there.')
  if (tile.ready) throw new SaveRuleError('bad-slot', 'It’s ripe: harvest it.')
  if (tile.watered) throw new SaveRuleError('bad-slot', 'Watered today.')
  const spent = spend(save, 'water')
  return { ...spent, fields: withTile(spent, index, { ...tile, watered: true }) }
}

/** What a harvest brought: crops by star and an own seed back. */
export interface HarvestReceipt {
  crop: CropId
  /** Crops by star, ★1 … ★5. */
  stars: [number, number, number, number, number]
  seeds: number
}
/** A receipt's crops, every star. */
export const receiptItems = (receipt: Pick<HarvestReceipt, 'stars'>): number => receipt.stars.reduce((a, b) => a + b, 0)

/** Harvests a ripe tile: one action. Each crop of its yield draws its stars (`draw(uid, day, 'harvest:<i>', n)`) into
 * the Warehouse, an own seed may come back (`'seeds:<i>'`), the crop gains its points, and a regrowing crop starts
 * again in season; otherwise the tile stays tilled and empty. */
export function harvestTile<S extends FarmSave>(save: S, index: number): { save: S; receipt: HarvestReceipt } {
  const tile = tileAt(save, index)
  if (tile.crop === null || !tile.ready) throw new SaveRuleError('not-ready', tile.crop === null ? 'Nothing grows there.' : 'Not ripe yet.')
  const crop = CROPS[tile.crop]
  const spent = spend(save, 'harvest')
  const { uid } = spent.account
  const day = spent.calendar.day
  const points = spent.crops[crop.id] ?? 0
  const q = harvestQuality(null, cropLevelOf(points), spent.tools.hoe)
  const stars = Array.from({ length: crop.yield }, (_, n) => drawStars(q, draw(uid, day, `harvest:${index}`, n)))
  const receipt: HarvestReceipt = { crop: crop.id, stars: [0, 0, 0, 0, 0], seeds: 0 }
  let items = stars.reduce((all, s) => addGoods(all, crop.id, s, 1), spent.items)
  for (const s of stars) receipt.stars[s - 1]! += 1
  if (draw(uid, day, `seeds:${index}`, 0) < seedsBackChance(null, spent.tools.hoe)) {
    items = addGoods(items, seedId(crop.id, true), 1, 1)
    receipt.seeds = 1
  }
  // A regrowing crop starts again at 0 while it's in season; otherwise the soil is left empty, still tilled.
  const regrows = crop.regrows !== null && growsIn(crop.id, seasonOf(spent))
  const next: Tile = regrows ? { ...bareTile('tilled'), crop: crop.id, regrowing: true, own: tile.own } : bareTile('tilled')
  return {
    save: {
      ...spent, items, fields: withTile(spent, index, next), crops: { ...spent.crops, [crop.id]: points + cropPointsOf(tile.own) },
      farm: { ...spent.farm, counts: bump(spent.farm.counts, TILES_HARVESTED) },
    },
    receipt,
  }
}

// --- What a screen and the morning read ----------------------------------------------------------------------------

/** The seeds held that plant today, by id: own seeds first, then the shop's, by the crop table's order. */
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

/** Empty tilled tiles that seeds held could fill today: the morning's nudge. */
export function tilesToPlant(save: Pick<FarmSave, 'items' | 'calendar' | 'fields'>): number {
  const empty = save.fields.tiles.filter((t) => t.ground === 'tilled' && t.crop === null).length
  return Math.min(empty, seedsInSeason(save).reduce((n, s) => n + s.count, 0))
}

/** A crop's stages from planting (or a harvest, regrowing) to ripe: its growth days, a stage a watered night. */
export const stagesOf = (crop: CropId, regrowing: boolean): number => Math.ceil(readyAt(crop, regrowing) - GROWTH_SLACK)

/** Watered nights left until a growing tile is ripe; 0 once it is. */
export function nightsLeft(tile: Pick<Tile, 'crop' | 'ready' | 'growth' | 'regrowing'>): number {
  if (tile.crop === null || tile.ready) return 0
  return Math.max(1, stagesOf(tile.crop, tile.regrowing) - tile.growth)
}

/** A growing tile's look, by how far it's grown: a seed, a sprout, half grown, nearly ripe, or ripe. */
export type CropLook = 'seed' | 'sprout' | 'growing' | 'nearly' | 'ripe'
export function cropLook(tile: Pick<Tile, 'crop' | 'ready' | 'growth' | 'regrowing'>): CropLook | null {
  if (tile.crop === null) return null
  if (tile.ready) return 'ripe'
  const share = tile.growth / stagesOf(tile.crop, tile.regrowing)
  return tile.growth === 0 ? 'seed' : share < 0.4 ? 'sprout' : share < 0.75 ? 'growing' : 'nearly'
}

/** The shop's seeds this season, each line opening at its tier's Farm Rank. */
export function seedLines(save: Pick<FarmSave, 'calendar'>): { id: string; price: number; opens: PlaceOpens }[] {
  return SHOP_SEEDS[seasonOf(save)].map((crop) => {
    const { tier, seed } = CROPS[crop]
    return { id: seedId(crop), price: seed!, opens: tier === 1 ? { by: 'start' } : { by: 'farm-rank', rank: tier as number } }
  })
}

// --- The night (steps 2 and 7) ---------------------------------------------------------------------------------

/** A crop that withered on a season's last night, and on how many tiles. */
export interface Withered {
  crop: CropId
  tiles: number
}

/**
 * Step 2: every growing tile watered today (or by a farmer's night chore, `chores`) grows a stage; one whose stages
 * reach its days − 0.5 turns ripe. A dry tile doesn't grow. Then every tile dries for the next day. `grew` counts the
 * tiles that grew, `ripened` those that turned ripe.
 */
export function growTiles<S extends FarmSave>(save: S, chores: ReadonlySet<number> = new Set()): { save: S; grew: number; ripened: number } {
  let grew = 0
  let ripened = 0
  const tiles = save.fields.tiles.map((tile, i): Tile => {
    if (tile.crop === null || tile.ready || !(tile.watered || chores.has(i))) return tile.watered ? { ...tile, watered: false } : tile
    const growth = tile.growth + 1
    const ready = growth + GROWTH_SLACK >= readyAt(tile.crop, tile.regrowing)
    grew++
    if (ready) ripened++
    return { ...tile, growth, ready, watered: false }
  })
  return { save: { ...save, fields: { tiles } }, grew, ripened }
}

/**
 * Step 7's withering: on a season's last night, before the date turns, every crop still growing that doesn't grow in the
 * next season withers, and its soil is left empty and tilled. Ripe crops wait to be harvested. Corn carries Summer →
 * Autumn and Cabbage Winter → Spring; nothing else does.
 */
export function witherTiles<S extends FarmSave>(save: S): { save: S; withered: Withered[] } {
  const day = save.calendar.day
  if (!isSeasonEnd(day)) return { save, withered: [] }
  const next = dateOf(day + 1).season
  const withered: Withered[] = []
  let changed = false
  const tiles = save.fields.tiles.map((tile): Tile => {
    if (tile.crop === null || tile.ready || growsIn(tile.crop, next)) return tile
    changed = true
    const line = withered.find((w) => w.crop === tile.crop)
    if (line) line.tiles++
    else withered.push({ crop: tile.crop, tiles: 1 })
    return bareTile('tilled')
  })
  return { save: changed ? { ...save, fields: { tiles } } : save, withered }
}

/** Whether a tile index is on the field. */
export const isTile = (index: number): boolean => Number.isInteger(index) && index >= 0 && index < FIELD_TILES
