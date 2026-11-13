// The perks' night and their bespoke three: night chores,
// morning items, the mentor, her signature dish and breakfast. The terms the shared rules read (the romance term, in her
// element, her keepsake) are `perk-terms.ts`'s.
//
//   Night chores (R7 2, S4 3; on the farm; her line's place open)
//     farming   +0.25 growth on the untended block with the most growing plots, else hers         night step 2
//     foraging  one item from her rank's deepest forest area this season, at a day's haul's stars   night step 4
//     fishing   one fish from her deepest spot this season, the same way                           night step 4
//     mining, the ranch, cooking, serving, forging: with their places
//   Morning items (R2 every 4th morning ★2+, S2 every 2nd ★3+; on the farm)                        night step 9
//   Mentor: the others at her place today ×1.10 rank points, one mentor a place               night step 6
//   Her signature dish: her loved good when it's a dish, else her line's dish kind at the grade of her line's best
//     place, once, into `workshops.recipes`                                                        `playEvent`
//   Breakfast (S1): the crew well fed for the day when no meal runs (the house morning calls it)
//
// Counts are expected values: a fraction becomes a whole item by a seeded draw, `draw(uid, day, 'perk:<id>…', n)`, so a
// night replays the same. Save v4 only. Loaded with the night and the romance's screens.
import { addBond, BOND_POINTS, placesToday } from '../farm/bonds'
import { draw } from '../farm/draw'
import { opened } from '../farm/places'
import { rankQuality } from '../farm/rank-rules'
import { talentQuality, talentsD, type TalentOf } from '../farm/talents'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { harvestQuality } from '../fields/fields'
import { GATHER_TOOL, gatherQuality, pickShare, sharesOn, termsOf } from '../gathering/kinds'
import { FISHING_SPOTS, FOREST_AREAS, type FishingSpotId, type ForestAreaId } from '../gathering/ids'
import { FISHERY, FOREST } from '../gathering/tables'
import { goodOf } from '../goods/ids'
import { drawStars, quality } from '../goods/stars'
import type { ItemLine } from '../night/summary'
import { DISH_FAMILIES, isDishId, type BlockId } from '../save/v3'
import type { SaveV4 } from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'
import { castOrder, favouriteOf, type StoryPack } from '../story/pack'
import { deepestOpen, lineGood } from './days'
import { perkLineOf, type PerkLine } from './perks'
import { atHerLine, choresOf, hasPerk, homeOrHoused, keepsakeQuality, linePlaceOpen, morningDue, morningRule, routeIndex, type PerkPack } from './perk-terms'

/** Umas in the cast's order, then by id: the order the night's perks go in. */
function inCastOrder(pack: Pick<StoryPack, 'cast'>, ids: readonly string[]): string[] {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return [...ids].sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
}

// --- Night chores -----------------------------------------------------------------------------------------

/** The lines whose night chores act now: farming (step 2), foraging and fishing (step 4). Mining, the ranch,
 * cooking, serving and forging bring theirs with their places; until then their profile says "Opens with
 * chapter n". */
export const CHORE_LINES: readonly PerkLine[] = ['farming', 'foraging', 'fishing']
/** A farming chore's growth on one block. */
export const CHORE_GROWTH = 0.25

/** Her chores tonight: the F6, R7 and S4 perks' (`choresOf`, at most 3) while she's on the farm, her line's chores
 * act and its place is open; else none. */
export function choresTonight(save: SaveV4, pack: PerkPack, id: string): number {
  const line = perkLineOf(pack, id)
  if (!line || !CHORE_LINES.includes(line) || !save.roster[id] || !homeOrHoused(save, id) || !linePlaceOpen(save, pack, id)) return 0
  return choresOf(save.love[id])
}

/** A chore's draws: `draw(uid, day, 'perk:<id>:chore', n)`. */
const choreDraw = (save: SaveV4, id: string, n: number): number => draw(save.account.uid, save.calendar.day, `perk:${id}:chore`, n)
const growingPlots = (block: SaveV4['fields']['blocks'][number]): number => block.plots.filter((p) => p.crop !== null && !p.ready).length

/** One Uma's chores done tonight: the items they left, and the growth they gave. */
export interface ChoresDone {
  id: string
  items: string[]
  growth: number
}

/**
 * Night step 2's farming chores: each farmer's chores, in the cast's order, each +0.25 growth to the untended
 * block with the most growing plots (a tie by `draw(uid, day, 'perk:<id>:chore', k)`), else to the block she tends while
 * it has a growing plot; a chore with neither does nothing. The growth joins the block's rate tonight (`growFields`).
 */
export function fieldChores(save: SaveV4, pack: PerkPack): { growth: Map<BlockId, number>; chores: ChoresDone[] } {
  const growth = new Map<BlockId, number>()
  const chores: ChoresDone[] = []
  const untended = save.fields.blocks.filter((b) => b.tender === null && growingPlots(b) > 0)
  const most = Math.max(0, ...untended.map(growingPlots))
  const tops = untended.filter((b) => growingPlots(b) === most)
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    if (perkLineOf(pack, id) !== 'farming') continue
    const n = choresTonight(save, pack, id)
    const own = save.fields.blocks.find((b) => b.tender === id && growingPlots(b) > 0)
    let done = 0
    for (let k = 0; k < n; k++) {
      const block = tops.length > 0 ? tops[Math.floor(choreDraw(save, id, k) * tops.length)]! : own
      if (!block) continue
      growth.set(block.id, Math.round(((growth.get(block.id) ?? 0) + CHORE_GROWTH) * 1e6) / 1e6)
      done++
    }
    if (done > 0) chores.push({ id, items: [], growth: done * CHORE_GROWTH })
  }
  return { growth, chores }
}

/** Where a gathering line's chores bring their goods from. */
const CHORE_PLACE: Partial<Record<PerkLine, 'forest' | 'fishery'>> = { foraging: 'forest', fishing: 'fishery' }

/**
 * Night step 4's gathering chores: a forager's bring one item each from her rank's deepest forest area this
 * season, a fisher's one fish each from her deepest spot (`deepestOpen`); the good by the season's shares
 * (`draw(uid, day, 'perk:<id>:chore', 2k)`), its stars a day's haul's for her there (her rank, talent, tool, well fed and
 * keepsake; `draw(…, 2k + 1)`). Straight into the Warehouse, in the cast's order.
 */
export function gatherChores(save: SaveV4, pack: PerkPack, talentOf: TalentOf = talentsD): { save: SaveV4; chores: ChoresDone[] } {
  let items = save.items
  const chores: ChoresDone[] = []
  for (const id of inCastOrder(pack, Object.keys(save.roster))) {
    const line = perkLineOf(pack, id)
    const place = line ? CHORE_PLACE[line] : undefined
    const n = place ? choresTonight(save, pack, id) : 0
    if (!place || n === 0) continue
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
    chores.push({ id, items: left, growth: 0 })
  }
  return { save: items === save.items ? save : { ...save, items }, chores }
}

// --- Morning items ----------------------------------------------------------------------------------------

/** `lineGood`'s `n` for her morning item (her anniversary's is 0; the house item takes 2). */
export const MORNING_ITEM_N = 1

/** Her line's quality: what a day's work at her line gives her items: a forager's and a fisher's day's haul
 * (rank, talent, the Axe or the Rod, well fed, keepsake), a farmer's tended harvest at crop level 1 (with the Hoe and her
 * keepsake), any other line her rank and talent in it. */
export function lineQuality(save: SaveV4, pack: PerkPack, id: string, talentOf: TalentOf = talentsD): number {
  const uma = save.roster[id]
  const line = favouriteOf(pack, id)
  if (!uma || !line || line === 'expeditions') return 0
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
 * Night step 9's morning items, the date already turned: each Uma on the farm whose morning it is by her
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
    if (!rule || !homeOrHoused(save, id) || !morningDue(rule, day)) continue
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
 * forager's), of the deepest fishing spot (a fisher's), of the shop's vegetables at its highest open seed tier (a
 * farmer's); 1 for mining, the ranch and the workshops until their chapters. */
export function lineGrade(save: SaveV4, pack: PerkPack, id: string): number {
  switch (perkLineOf(pack, id)) {
    case 'foraging': return Math.max(...worked(save, FOREST_AREAS).map((a) => FOREST[a as ForestAreaId].grades[1]))
    case 'fishing': return Math.max(...worked(save, FISHING_SPOTS).map((s) => spotGrade(s as FishingSpotId)))
    case 'farming': {
      const open = Object.values(SHOP_SEEDS).flat().filter((crop) => {
        const tier = CROPS[crop].tier
        return tier !== 'rare' && opened(save, tier === 1 ? { by: 'start' } : { by: 'farm-rank', rank: tier })
      })
      return Math.max(1, ...open.map((crop) => goodOf(crop)!).filter((g) => g.family === 'vegetables').map((g) => g.grade))
    }
    default: return 1
  }
}

/** Her signature dish: her loved good when it's a dish, taken as is; else her line's dish kind at the grade
 * of her line's best place now. */
export function signatureDish(save: SaveV4, pack: PerkPack, id: string): string {
  const loved = pack.bibles.get(id)?.gifts.loved
  if (loved !== undefined && isDishId(loved)) return loved
  const line = perkLineOf(pack, id) ?? 'farming'
  return dishId(LINE_DISH[line], lineGrade(save, pack, id))
}

/** Friendship 4's perk, as `playEvent` gives it: her signature dish's recipe into `workshops.recipes` (the
 * Kitchen's list, which the Kitchen reads from chapter 4), once, and its id kept on her route (`love.dish`) for her
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
 * Breakfast, a spouse's S1 perk on a morning in her house (the house morning calls it): every Uma on
 * the farm (home or housed) with no well-fed days left starts the day well fed for one day. A meal running is never
 * shortened or extended, and a breakfast isn't a staff meal (no count moves: chapter 4's goal stays the Kitchen's). Each
 * pair it feeds earns +5 bond (`addBond`, Romance 4's ×1.5 inside). Pure; never stamps.
 */
export function breakfast(save: SaveV4, pack: Pick<StoryPack, 'ties'>): { save: SaveV4; fed: string[] } {
  const fed = Object.keys(save.roster).filter((id) => homeOrHoused(save, id) && save.roster[id]!.wellFed <= 0).sort((a, b) => Number(a) - Number(b))
  if (fed.length === 0) return { save, fed }
  let next: SaveV4 = { ...save, roster: { ...save.roster, ...Object.fromEntries(fed.map((id) => [id, { ...save.roster[id]!, wellFed: BREAKFAST_DAYS }])) } }
  for (let i = 0; i < fed.length; i++) for (let j = i + 1; j < fed.length; j++) next = addBond(next, pack, fed[i]!, fed[j]!, BOND_POINTS.breakfast).save
  return { save: next, fed }
}
