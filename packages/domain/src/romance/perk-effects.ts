// The perks' night and their bespoke three: night chores,
// morning items, the mentor, her signature dish and breakfast. The terms the shared rules read (the romance term, in her
// element, her keepsake) are `perk-terms.ts`'s.
//
//   Night chores (R7 2, S4 3; on the farm; her line's place open)
//     farming   waters one dry growing tile                                                        night step 2
//     the ranch +5 fondness to each animal in her building (the one she cares for, else the first) night step 3
//     foraging  one item from her rank's deepest forest area this season, at a day's haul's stars   night step 4
//     fishing   one fish from her deepest spot this season, the same way                           night step 4
//     mining    one ore (the Quarry's: a stone or a gem) from the dig's deepest floor, at a face's  night step 4
//     cooking, serving, forging: with their places' games
//   Morning items (R2 every 4th morning ★2+, S2 every 2nd ★3+; on the farm)                        night step 9
//   Mentor: the others at her place today ×1.10 rank points, one mentor a place               night step 6
//   Her signature dish: her loved good when it's a dish, else her line's dish kind at the grade of her line's best
//     place (the deepest area, spot or floor; the shop's vegetables; the farm's animals' goods), once, into
//     `workshops.recipes`                                                                          `playEvent`
//   Breakfast (S1): the crew well fed for the day when no meal runs (the house morning calls it)
//
// Counts are expected values: a fraction becomes a whole item by a seeded draw, `draw(uid, day, 'perk:<id>…', n)`, so a
// night replays the same. Loaded with the night and the romance's screens.
import { addBond, BOND_POINTS, placesToday } from '../farm/bonds'
import { awayOn } from '../expeditions/presence'
import { draw } from '../farm/draw'
import { opened } from '../farm/places'
import { rankQuality } from '../farm/rank-rules'
import { talentQuality, talentsD, type TalentOf } from '../farm/talents'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { harvestQuality } from '../fields/fields'
import { DIG_TOOL, digBuilt, digFloor, findOn, floorTopGrade } from '../gathering/digs'
import { GATHER_TOOL, gatherQuality, pickShare, sharesOn, termsOf } from '../gathering/kinds'
import { FISHING_SPOTS, FOREST_AREAS, type FishingSpotId, type ForestAreaId } from '../gathering/ids'
import { FISHERY, FOREST } from '../gathering/tables'
import { goodOf } from '../goods/ids'
import { drawStars, heartsQuality, quality } from '../goods/stars'
import type { ItemLine } from '../night/summary'
import { ANIMALS, animalsIn, heartsOf, homeBuilt, keptKinds } from '../ranch/ranch'
import { ANIMAL_HOME, DISH_FAMILIES, fieldTiles, isDishId, MAX_FONDNESS, RANCH_HOMES, type DigId, type RanchHome } from '../save/v4'
import type { SaveV4 } from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'
import { castOrder, type StoryPack } from '../story/pack'
import { favouriteOf, giftsOf } from '../story/placeholders'
import { deepestOpen, lineGood } from './days'
import { perkLineOf, type PerkLine } from './perks'
import { atHerLine, choresOf, hasPerk, homeOrHoused, keepsakeQuality, linePlaceOpen, morningDue, morningRule, onFarmForPerks, routeIndex, type PerkPack } from './perk-terms'

/** Umas in the cast's order, then by id: the order the night's perks go in. */
function inCastOrder(pack: Pick<StoryPack, 'cast'>, ids: readonly string[]): string[] {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return [...ids].sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
}

// --- Night chores -----------------------------------------------------------------------------------------

/** The lines whose perks act now, night chores and morning items with them: farming (chores at step 2), the ranch (step
 * 3), foraging, fishing and mining at the Mine or the Quarry (step 4), each once her line's place is open (before it,
 * her profile says "Opens when the Mine is built", or her place). Cooking, serving and forging bring theirs with their
 * places' games. */
export const CHORE_LINES: readonly PerkLine[] = ['farming', 'foraging', 'fishing', 'mining', 'quarry', 'ranch']

/** Her chores tonight: the F6, R7 and S4 perks' (`choresOf`, at most 3) while she's on the farm (a spouse in her room, or a
 * farmhand on her farm day: `onFarmForPerks`), her line's chores act and its place is open; else none. */
export function choresTonight(save: SaveV4, pack: PerkPack, id: string): number {
  const line = perkLineOf(pack, id)
  if (!line || !CHORE_LINES.includes(line) || !save.roster[id] || !onFarmForPerks(save, pack, id) || !linePlaceOpen(save, pack, id)) return 0
  return choresOf(save.love[id])
}

/** A chore's draws: `draw(uid, day, 'perk:<id>:chore', n)`. */
const choreDraw = (save: SaveV4, id: string, n: number): number => draw(save.account.uid, save.calendar.day, `perk:${id}:chore`, n)

/** One Uma's chores done tonight: the items they left, the dry tiles they watered, and a rancher's fondness (+5 a chore
 * to each animal in her building). */
export interface ChoresDone {
  id: string
  items: string[]
  watered: number
  fondness?: number
}

/**
 * Night step 2's farming chores: each farmer's chores, in the cast's order, each water one dry growing tile, picked by
 * `draw(uid, day, 'perk:<id>:chore', k)` among those still dry; a chore with none left does nothing. The tiles grow
 * tonight as if watered (`growTiles`).
 */
export function fieldChores(save: SaveV4, pack: PerkPack): { tiles: Set<number>; chores: ChoresDone[] } {
  const tiles = new Set<number>()
  const chores: ChoresDone[] = []
  const dry = fieldTiles(save).flatMap((t, i) => (t.crop !== null && !t.ready && !t.watered ? [i] : []))
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    if (perkLineOf(pack, id) !== 'farming') continue
    const n = choresTonight(save, pack, id)
    let done = 0
    for (let k = 0; k < n; k++) {
      const left = dry.filter((i) => !tiles.has(i))
      if (left.length === 0) break
      tiles.add(left[Math.floor(choreDraw(save, id, k) * left.length)]!)
      done++
    }
    if (done > 0) chores.push({ id, items: [], watered: done })
  }
  return { tiles, chores }
}

// --- The ranch's chores ------------------------------------------------------------------------------------

/** A rancher's chore: +5 fondness to each animal in her building. */
export const CHORE_FONDNESS = 5

/** Her building: the first Coop or Barn she cares for on the work board, built; else the first of them that stands; null
 * with neither. A rancher's chores, her morning item's stars and her keepsake read it. */
export function herBuilding(save: Pick<SaveV4, 'roster' | 'buildings'>, id: string): RanchHome | null {
  const cared = (save.roster[id]?.tasks ?? []).flatMap((t) => (t.kind === 'care' && homeBuilt(save, t.home) ? [t.home] : []))[0]
  return cared ?? RANCH_HOMES.find((home) => homeBuilt(save, home)) ?? null
}

/**
 * Night step 3's ranch chores, after the animals' night: each rancher's chores (1 from F6, 2 from R7, 3 from S4) give
 * each animal in her building +5 fondness, held to 200; a building with no animals gets none. In the cast's order.
 */
export function ranchChores(save: SaveV4, pack: PerkPack): { save: SaveV4; chores: ChoresDone[] } {
  let animals = save.ranch.animals
  const chores: ChoresDone[] = []
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    if (perkLineOf(pack, id) !== 'ranch') continue
    const n = choresTonight(save, pack, id)
    const home = herBuilding(save, id)
    if (n === 0 || home === null || animalsIn(save, home).length === 0) continue
    const fondness = CHORE_FONDNESS * n
    animals = animals.map((a) => (ANIMAL_HOME[a.kind] === home ? { ...a, fondness: Math.min(MAX_FONDNESS, a.fondness + fondness) } : a))
    chores.push({ id, items: [], watered: 0, fondness })
  }
  return { save: animals === save.ranch.animals ? save : { ...save, ranch: { ...save.ranch, animals } }, chores }
}

// --- The gathering's and the digs' chores ---------------------------------------------------------------

/** Where a gathering or a digging line's chores bring their goods from. */
const CHORE_PLACE: Partial<Record<PerkLine, 'forest' | 'fishery' | DigId>> = { foraging: 'forest', fishing: 'fishery', mining: 'mine', quarry: 'quarry' }

/** Her quality at a dig: a day's face's, her rank and talent in mining, the farm's Pick or Hammer, well fed and her
 * keepsake there. */
export function digQuality(save: SaveV4, pack: PerkPack, id: string, dig: DigId, talentOf: TalentOf = talentsD): number {
  const terms = termsOf(save, id, 'mining', talentOf, DIG_TOOL[dig])!
  return gatherQuality({ ...terms, keepsake: keepsakeQuality(save, pack, id, dig) }, terms.wellFed > 0)
}

/**
 * Night step 4's gathering chores: a forager's bring one item each from her rank's deepest forest area this
 * season, a fisher's one fish each from her deepest spot (`deepestOpen`); the good by the season's shares
 * (`draw(uid, day, 'perk:<id>:chore', 2k)`), its stars a day's haul's for her there (her rank, talent, tool, well fed and
 * keepsake; `draw(…, 2k + 1)`). A miner's bring one find each from the dig's deepest floor (the Mine's ore, the Quarry's
 * stone or gem: its grade `draw(…, 3k)`, its kind `draw(…, 3k + 1)`), at a face's stars there (`draw(…, 3k + 2)`); the
 * dig's count and stairs don't move. Straight into the Warehouse, in the cast's order.
 */
export function gatherChores(save: SaveV4, pack: PerkPack, talentOf: TalentOf = talentsD): { save: SaveV4; chores: ChoresDone[] } {
  let items = save.items
  const chores: ChoresDone[] = []
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    const line = perkLineOf(pack, id)
    const place = line ? CHORE_PLACE[line] : undefined
    const n = place ? choresTonight(save, pack, id) : 0
    if (!place || n === 0) continue
    if (place === 'mine' || place === 'quarry') {
      const q = digQuality(save, pack, id, place, talentOf)
      const floor = digFloor(save.places[place])
      const left: string[] = []
      for (let k = 0; k < n; k++) {
        const good = findOn(place, floor, choreDraw(save, id, 3 * k), choreDraw(save, id, 3 * k + 1))
        const stars = drawStars(q, choreDraw(save, id, 3 * k + 2))
        items = addGoods(items, good, stars, 1)
        left.push(stockKey(good, stars))
      }
      chores.push({ id, items: left, watered: 0 })
      continue
    }
    const activity = place === 'forest' ? 'foraging' : 'fishing'
    const terms = termsOf(save, id, activity, talentOf, GATHER_TOOL[place])!
    const where = deepestOpen(save, place, terms.rank)
    if (!where) continue
    const q = gatherQuality({ ...terms, keepsake: keepsakeQuality(save, pack, id, place) }, terms.wellFed > 0)
    const left: string[] = []
    for (let k = 0; k < n; k++) {
      const good = pickShare(sharesOn(place, where, save.calendar.day), choreDraw(save, id, 2 * k))
      const stars = drawStars(q, choreDraw(save, id, 2 * k + 1))
      items = addGoods(items, good, stars, 1)
      left.push(stockKey(good, stars))
    }
    chores.push({ id, items: left, watered: 0 })
  }
  return { save: items === save.items ? save : { ...save, items }, chores }
}

// --- Morning items ----------------------------------------------------------------------------------------

/** `lineGood`'s `n` for her morning item (her anniversary's is 0; the house item takes 2). */
export const MORNING_ITEM_N = 1

/** The animals' hearts in her building, on average (0 with none): a rancher's day's work. */
function meanHearts(save: SaveV4, id: string): number {
  const home = herBuilding(save, id)
  const animals = home ? animalsIn(save, home) : []
  return animals.length === 0 ? 0 : animals.reduce((sum, a) => sum + heartsOf(a.fondness), 0) / animals.length
}

/** Her line's quality: what a day's work at her line gives her items: a forager's and a fisher's day's haul
 * (rank, talent, the Axe or the Rod, well fed, keepsake), a farmer's tended harvest at crop level 1 (with the Hoe and her
 * keepsake), a miner's face (rank, talent, the Pick or the Hammer, well fed, keepsake), a rancher's goods (her building's
 * animals' hearts on average, and her keepsake there), any other line her rank and talent in it. */
export function lineQuality(save: SaveV4, pack: PerkPack, id: string, talentOf: TalentOf = talentsD): number {
  const uma = save.roster[id]
  const line = favouriteOf(pack, id)
  if (!uma || !line || line === 'expeditions') return 0
  if (line === 'mining') return digQuality(save, pack, id, perkLineOf(pack, id) === 'quarry' ? 'quarry' : 'mine', talentOf)
  if (line === 'ranch') {
    const home = herBuilding(save, id)
    return quality({ care: heartsQuality(meanHearts(save, id)), keepsake: home ? keepsakeQuality(save, pack, id, home) : 0 })
  }
  if (line === 'foraging' || line === 'fishing') {
    const place = line === 'foraging' ? 'forest' : 'fishery'
    const terms = termsOf(save, id, line, talentOf, GATHER_TOOL[place])!
    return gatherQuality({ ...terms, keepsake: keepsakeQuality(save, pack, id, place) }, uma.wellFed > 0)
  }
  if (line === 'farming') {
    return harvestQuality({ rank: uma.ranks.farming.rank, talent: talentOf(id, 'farming'), wellFed: uma.wellFed > 0, keepsake: keepsakeQuality(save, pack, id, 'fields') }, 1, save.tools.hoe)
  }
  return quality({ rank: rankQuality(uma.ranks[line].rank), talent: talentQuality(talentOf(id, line)) })
}

/**
 * Night step 9's morning items, the date already turned: each Uma on the farm this morning (a spouse in her room, or a
 * farmhand on her farm day: `onFarmForPerks`) whose morning it is by her
 * count (`morningRule`: every 4th morning from R2, every 2nd from S2) leaves one good of her line (`lineGood`, n = 1) in
 * the Warehouse, its stars her line's quality draw (`draw(uid, day, 'perk:<id>:item', 0)`) held at ★2 (★3 from S2). In
 * the cast's order. The house adds +1 on a morning in it.
 */
export function leaveMorningItems(save: SaveV4, pack: PerkPack, talentOf: TalentOf = talentsD): { save: SaveV4; lines: ItemLine[] } {
  const day = save.calendar.day
  let items = save.items
  const lines: ItemLine[] = []
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    const rule = morningRule(save.love[id])
    if (!rule || !onFarmForPerks(save, pack, id) || !morningDue(rule, day)) continue
    const stars = Math.max(rule.stars, drawStars(lineQuality(save, pack, id, talentOf), draw(save.account.uid, day, `perk:${id}:item`, 0)))
    const good = lineGood(save, pack, id, stars, MORNING_ITEM_N)
    items = addGoods(items, good.id, good.stars, 1)
    lines.push({ kind: 'item', id, items: [stockKey(good.id, good.stars)] })
  }
  return { save: items === save.items ? save : { ...save, items }, lines }
}

// --- Mentor -----------------------------------------------------------------------------------------------

/** A mentor's +10% rank points for the others at her place. */
export const MENTOR_POINTS = 1.1

/**
 * Night step 6's mentors: at each place worked today (`placesToday`: the jobs, and the Fields' tenders), the
 * Umas with Friendship 9 whose line's place it is (open) may mentor; the one with the most hearts (her place along the
 * route), then the cast's order, then her id, does. Everyone else who worked there today earns ×1.10 rank points; the
 * mentor herself doesn't. One mentor's bonus a place. Returns each mentee's factor.
 */
export function mentorsTonight(save: SaveV4, pack: PerkPack, worked: readonly { outfitId: string; place: string }[], tended: readonly { outfitId: string }[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const [place, ids] of placesToday(worked, tended)) {
    const mentor = mentorAt(save, pack, place, ids)
    if (mentor === null) continue
    for (const id of ids) if (id !== mentor) out.set(id, MENTOR_POINTS)
  }
  return out
}

/** Who mentors among the Umas at a place: Friendship 9 and the place her line's (open); the most hearts (her
 * place along the route), then the cast's order, then her id. Null when none can. */
export function mentorAt(save: SaveV4, pack: PerkPack, place: string, ids: readonly string[]): string | null {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return ids.filter((id) => save.love[id] && hasPerk(save.love[id], 'f9') && atHerLine(save, pack, id, place))
    .sort((a, b) => routeIndex(save.love[b]!) - routeIndex(save.love[a]!) || rank(a) - rank(b) || Number(a) - Number(b))[0] ?? null
}

// --- Her signature dish -----------------------------------------------------------------------------------

/** A dish's family: the eight dishes. */
export type DishFamily = typeof DISH_FAMILIES[number]
/** Her line's dish kind (the list): farming Salad, ranch Cake, mining Curry, fishing Grill, foraging Soup, cooking
 * Tart, serving Cookies, forging Bread. */
export const LINE_DISH: Readonly<Record<PerkLine, DishFamily>> = {
  farming: 'vegetables', ranch: 'sweets', mining: 'herbs-spices', quarry: 'herbs-spices', fishing: 'fish', foraging: 'mushrooms', cooking: 'fruits',
  serving: 'nuts-seeds', forging: 'grains',
}
/** A dish's id: `dish-<family>-<grade>` (uma-art's dishes atlas). */
export const dishId = (family: DishFamily, grade: number): string => `dish-${family}-${Math.min(10, Math.max(1, grade))}`

/** A share a place's goods must reach in some season to count toward its top grade: a rare catch doesn't (a Pond's koi). */
const TOP_SHARE = 10
/** A fishing spot's top grade: its fish's highest grade among those at 10% or more in some season. */
function spotGrade(spot: FishingSpotId): number {
  const fish = Object.values(FISHERY[spot].seasons).flatMap((shares) => shares.filter(([, p]) => p >= TOP_SHARE).map(([good]) => goodOf(good)?.grade ?? 1))
  return Math.max(1, ...fish)
}
/** The places a line has opened on the farm: the forest's areas and the Fishery's spots anyone has worked (the Diary's
 * depth milestones, the first always). */
const worked = (save: SaveV4, ids: readonly string[]): string[] => ids.filter((where, i) => i === 0 || save.diary.milestones.includes(`depth:${where}`))


/** The grade of her line's best place: the top grade of the deepest forest area anyone has worked (a
 * forager's), of the deepest fishing spot (a fisher's), of the deepest floor reached at the Mine or the Quarry (a
 * miner's, once it stands), of the goods the farm's animals give (a rancher's), of the shop's vegetables at its highest
 * open seed tier (a farmer's), of the dishes the Kitchen has cooked (a cook's); 1 for the Restaurant and the Forge until
 * their games are built, and for a dig not built, a farm with no animals or a Kitchen yet to cook. */
export function lineGrade(save: SaveV4, pack: PerkPack, id: string): number {
  const line = perkLineOf(pack, id)
  switch (line) {
    case 'mining': case 'quarry': {
      const dig = line === 'quarry' ? 'quarry' : 'mine'
      return digBuilt(save, dig) ? floorTopGrade(digFloor(save.places[dig])) : 1
    }
    case 'ranch': return Math.max(1, ...keptKinds(save).map((k) => goodOf(ANIMALS[k].good)?.grade ?? 1))
    case 'foraging': return Math.max(...worked(save, FOREST_AREAS).map((a) => FOREST[a as ForestAreaId].grades[1]))
    case 'fishing': return Math.max(...worked(save, FISHING_SPOTS).map((s) => spotGrade(s as FishingSpotId)))
    case 'farming': {
      const open = Object.values(SHOP_SEEDS).flat().filter((crop) => {
        const tier = CROPS[crop].tier
        return tier !== 'rare' && opened(save, tier === 1 ? { by: 'start' } : { by: 'farm-rank', rank: tier })
      })
      return Math.max(1, ...open.map((crop) => goodOf(crop)!).filter((g) => g.family === 'vegetables').map((g) => g.grade))
    }
    case 'cooking': return cookedGrade(save)
    default: return 1
  }
}

/** The top grade of the dishes the Kitchen has cooked (`farm.counts['cooked:<dish>']`), 1 before its first play: a
 * cook's best place. */
export function cookedGrade(save: Pick<SaveV4, 'farm'>): number {
  const grades = Object.keys(save.farm.counts).flatMap((k) => {
    const m = /^cooked:dish-[a-z-]+-(\d+)$/.exec(k)
    return m && (save.farm.counts[k] ?? 0) > 0 ? [Number(m[1])] : []
  })
  return Math.max(1, ...grades)
}

/** Her signature dish: her loved good when it's a dish, taken as is; else her line's dish kind at the grade
 * of her line's best place now. */
export function signatureDish(save: SaveV4, pack: PerkPack, id: string): string {
  const loved = giftsOf(pack, id).loved
  if (loved !== undefined && isDishId(loved)) return loved
  const line = perkLineOf(pack, id) ?? 'farming'
  return dishId(LINE_DISH[line], lineGrade(save, pack, id))
}

/** Friendship 4's perk, as `playEvent` gives it: her signature dish's recipe into `workshops.recipes` (the
 * Kitchen's list, which the Kitchen reads once it's built), once, and its id kept on her route (`love.dish`) for her
 * profile. A recipe the farm knows already stays once. Pure. */
export function giveSignatureDish(save: SaveV4, pack: PerkPack, id: string): { save: SaveV4; dish: string } {
  const love = save.love[id]
  if (!love) return { save, dish: '' }
  const dish = love.dish ?? signatureDish(save, pack, id)
  const recipes = save.workshops.recipes.includes(dish) ? save.workshops.recipes : [...save.workshops.recipes, dish]
  return { save: { ...save, workshops: { ...save.workshops, recipes }, love: { ...save.love, [id]: { ...love, dish } } }, dish }
}

// --- Breakfast -------------------------------------------------------------------------------------

/** A breakfast's well-fed days: one, as a Rough meal. */
export const BREAKFAST_DAYS = 1

/**
 * Breakfast, a spouse's S1 perk on a morning in her house (the house morning calls it): every Uma who
 * lives on the farm (a spouse in her room) with no well-fed days left starts the day well fed for one day. A meal running is never
 * shortened or extended, and a breakfast isn't a staff meal (no count moves: the staff meal stays the Kitchen's). Each
 * pair it feeds earns +5 bond (`addBond`, Romance 4's ×1.5 inside). Pure; never stamps.
 */
export function breakfast(save: SaveV4, pack: Pick<StoryPack, 'ties'>): { save: SaveV4; fed: string[] } {
  const fed = Object.keys(save.roster).filter((id) => homeOrHoused(save, id) && !awayOn(save, id, save.calendar.day) && save.roster[id]!.wellFed <= 0).sort((a, b) => Number(a) - Number(b))
  if (fed.length === 0) return { save, fed }
  let next: SaveV4 = { ...save, roster: { ...save.roster, ...Object.fromEntries(fed.map((id) => [id, { ...save.roster[id]!, wellFed: BREAKFAST_DAYS }])) } }
  for (let i = 0; i < fed.length; i++) for (let j = i + 1; j < fed.length; j++) next = addBond(next, pack, fed[i]!, fed[j]!, BOND_POINTS.breakfast).save
  return { save: next, fed }
}
