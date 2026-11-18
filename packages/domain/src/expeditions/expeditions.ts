import { actionsLeft, spend } from '../farm/actions'
import { addBond, BOND_POINTS } from '../farm/bonds'
import { draw } from '../farm/draw'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { countChallenge, rankBenefits, rankQuality } from '../farm/rank-rules'
import { talentPower, talentQuality, talentsD, type TalentOf } from '../farm/talents'
import { GOODS } from '../goods/ids'
import { drawStars } from '../goods/stars'
import { SaveRuleError } from '../save/rules'
import { REGION_IDS, type Expedition, type ExpeditionOutcome, type ExpeditionReturn, type FarmSave, type RegionId } from '../save/v4'
import { addGoods, parseStockKey, stockKey, takeGoods } from '../save/warehouse'
import type { StoryPack } from '../story/pack'
import { bookedForExpedition, leavingOn } from './presence'
import { availableDishes, supplyOf } from './stock'

export const EXPEDITION_FAMILIES = ['hides-scales', 'bones-horns', 'essences'] as const
type LootFamily = typeof EXPEDITION_FAMILIES[number]

export interface ExpeditionRegion {
  name: string
  level: number
  days: number
  rank: number
  need: number
  tiers: readonly [number, number]
  family: LootFamily
}

export const EXPEDITION_REGIONS: Readonly<Record<RegionId, ExpeditionRegion>> = {
  'old-fort-ruins': { name: 'Old Fort Ruins', level: 1, days: 2, rank: 7, need: 46, tiers: [1, 2], family: 'bones-horns' },
  'echo-cave': { name: 'Echo Cave', level: 5, days: 2, rank: 7, need: 57, tiers: [2, 3], family: 'hides-scales' },
  'hilltop-track': { name: 'Hilltop Track', level: 10, days: 3, rank: 8, need: 128, tiers: [3, 5], family: 'essences' },
  'misty-marsh': { name: 'Misty Marsh', level: 15, days: 3, rank: 8, need: 164, tiers: [4, 6], family: 'hides-scales' },
  'sunken-temple': { name: 'Sunken Temple', level: 20, days: 4, rank: 9, need: 200, tiers: [5, 7], family: 'bones-horns' },
  'ember-peak': { name: 'Ember Peak', level: 25, days: 4, rank: 9, need: 238, tiers: [7, 9], family: 'essences' },
  'sky-ruins': { name: 'Sky Ruins', level: 30, days: 5, rank: 10, need: 304, tiers: [8, 10], family: 'essences' },
}
export const EXPEDITION_WORDS: Readonly<Record<ExpeditionOutcome, string>> = { great: 'Great', success: 'Success', retreat: 'Retreat' }
export const MAX_EXPEDITION_PARTY = 4
export const MAX_EXPEDITION_SUPPLIES = 8
export const EXPEDITION_LOG_SIZE = 20
export const SUPPLY_POWER = 2
export const EXPEDITION_GOODS_PER_DAY = 3
export const EXPEDITION_POINTS_PER_DAY = 10
export const EXPEDITION_BONUS = { great: 20, success: 10, retreat: 0 } as const
export const EXPEDITION_LOOT = { great: 1.5, success: 1, retreat: 0.5 } as const
export const EXPEDITION_THRESHOLDS = { great: 1.25, success: 1 } as const

export const expeditionSlots = (rank: number): number => Math.min(3, Math.max(0, rank - 6))

export function expeditionMemberPower(save: FarmSave, id: string, talentOf: TalentOf = talentsD): number {
  const uma = save.roster[id]
  return uma ? rankBenefits(uma.ranks.expeditions.rank).expeditionPower + talentPower(talentOf(id, 'expeditions')) : 0
}

export function expeditionPower(save: FarmSave, party: readonly string[], supplies: readonly string[], talentOf: TalentOf = talentsD): number {
  return party.reduce((sum, id) => sum + expeditionMemberPower(save, id, talentOf), 0)
    + supplies.reduce((sum, item) => sum + (supplyOf(item)?.stars ?? 0) * SUPPLY_POWER, 0)
}

export function expeditionResult(power: number, need: number, u: number): ExpeditionOutcome {
  const ratio = power * (0.9 + 0.2 * u) / need
  return ratio >= EXPEDITION_THRESHOLDS.great ? 'great' : ratio >= EXPEDITION_THRESHOLDS.success ? 'success' : 'retreat'
}

export function expeditionMemberBlock(save: FarmSave, id: string): string | null {
  if (save.roster[id]?.farmhand === undefined) return 'Only farmhands can go.'
  if (bookedForExpedition(save, id)) return 'Already in a party.'
  if (save.today.assistant === id || save.today.cook === id || save.workshops.current?.assistant === id) return 'Cooking today.'
  return null
}

export function expeditionBlock(save: FarmSave, region: RegionId, party: readonly string[], supplies: readonly string[]): string | null {
  const rank = farmRankOf(save.farm.points)
  if (!placeBuilt(save, 'expeditions')) return 'Build the Expedition post first.'
  if (!save.today.town) return 'Go into town first.'
  if (!REGION_IDS.includes(region)) return 'Choose a region.'
  if (rank < EXPEDITION_REGIONS[region].rank) return `Farm Rank ${EXPEDITION_REGIONS[region].rank}.`
  if (save.expeditions.length >= expeditionSlots(rank)) return 'All party slots are full.'
  if (party.length < 1 || party.length > MAX_EXPEDITION_PARTY || new Set(party).size !== party.length) return 'Choose 1–4 different farmhands.'
  for (const id of party) {
    const block = expeditionMemberBlock(save, id)
    if (block) return block
  }
  if (supplies.length > MAX_EXPEDITION_SUPPLIES) return 'Pack at most 8 dishes.'
  const chosen = new Map<string, number>()
  for (const key of supplies) {
    if (!supplyOf(key)) return 'Pack dishes from the Kitchen.'
    const count = (chosen.get(key) ?? 0) + 1
    if (count > availableDishes(save, key)) return 'Not enough of that dish.'
    chosen.set(key, count)
  }
  return actionsLeft(save) < 1 ? 'No actions left today.' : null
}

export function sendExpedition<S extends FarmSave>(save: S, region: RegionId, party: readonly string[], supplies: readonly string[]): S {
  const block = expeditionBlock(save, region, party, supplies)
  if (block) throw new SaveRuleError('bad-job', block)
  const left = save.calendar.day
  const trip = { region, party: [...party], supplies: [...supplies], left, back: left + EXPEDITION_REGIONS[region].days }
  return { ...spend(save, 'expedition'), expeditions: [...save.expeditions, trip] }
}

/** After the farmhands' shift, pack the reserved dishes. The meals are included in the night's food bill. */
export function packExpeditions(save: FarmSave): FarmSave {
  let items = save.items
  for (const trip of leavingOn(save, save.calendar.day)) {
    for (const key of trip.supplies) {
      const at = supplyOf(key)
      if (at) items = takeGoods(items, at.id, at.stars, 1)
    }
  }
  return items === save.items ? save : { ...save, items }
}

function outcome(save: FarmSave, trip: Expedition, n: number, talentOf: TalentOf, day: number): ExpeditionReturn {
  const region = EXPEDITION_REGIONS[trip.region]
  const random = (key: string, i: number) => draw(save.account.uid, day, key, i)
  const result = expeditionResult(expeditionPower(save, trip.party, trip.supplies, talentOf), region.need, random('expedition', n))
  const days = trip.back - trip.left
  const count = Math.round(EXPEDITION_GOODS_PER_DAY * trip.party.length * days * EXPEDITION_LOOT[result])
  const quality = trip.party.reduce((sum, id) => sum + rankQuality(save.roster[id]?.ranks.expeditions.rank ?? 0)
    + talentQuality(talentOf(id, 'expeditions')), 0) / trip.party.length + (result === 'great' ? 1 : 0)
  const others = EXPEDITION_FAMILIES.filter((family) => family !== region.family)
  const loot: Record<string, number> = {}
  for (let i = 0; i < count; i++) {
    const slot = n * 100 + i
    const u = random('expedition-family', slot)
    const family = u < 0.6 ? region.family : others[u < 0.8 ? 0 : 1]!
    const [low, high] = region.tiers
    const tier = low + Math.floor(random('expedition-tier', slot) * (high - low + 1))
    const id = GOODS.find((good) => good.family === family && good.grade === tier)!.id
    const key = stockKey(id, drawStars(quality, random('expedition-stars', slot)))
    loot[key] = (loot[key] ?? 0) + 1
  }
  return { region: trip.region, party: trip.party, left: trip.left, back: trip.back, result, loot }
}

/** Settle each due party once, before the rank and Diary checks. Returns in the same morning follow booking order. */
export function returnExpeditions(save: FarmSave, day: number, talentOf: TalentOf = talentsD, pack: Pick<StoryPack, 'ties'> = { ties: { ties: [] } }): {
  save: FarmSave; returns: ExpeditionReturn[]
} {
  const due = save.expeditions.filter((trip) => trip.back <= day)
  if (due.length === 0) return { save, returns: [] }
  const returns = due.map((trip, i) => outcome(save, trip, i, talentOf, day))
  let next = { ...save, expeditions: save.expeditions.filter((trip) => trip.back > day) }
  for (const log of returns) {
    const days = log.back - log.left
    const level = EXPEDITION_REGIONS[log.region].level
    let items = next.items
    for (const [key, count] of Object.entries(log.loot)) {
      const { id, stars } = parseStockKey(key)!
      items = addGoods(items, id, stars, count)
    }
    next = { ...next, items }
    for (const [i, id] of log.party.entries()) {
      const uma = next.roster[id]
      if (!uma) continue
      const rank = uma.ranks.expeditions
      const points = rank.points + EXPEDITION_POINTS_PER_DAY * days + EXPEDITION_BONUS[log.result]
      next = { ...next, roster: { ...next.roster, [id]: { ...uma, ranks: { ...uma.ranks, expeditions: { ...rank, points } } } } }
      next = countChallenge(next, id, 'expeditions', { kind: 'expedition', result: log.result, level, region: log.region })
      for (const other of log.party.slice(i + 1)) {
        if (next.roster[other]) next = addBond(next, pack, id, other, BOND_POINTS.party * days).save
      }
    }
  }
  return { save: { ...next, expeditionLog: [...returns, ...(save.expeditionLog ?? [])].slice(0, EXPEDITION_LOG_SIZE) }, returns }
}
