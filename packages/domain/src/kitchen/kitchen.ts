// The stove's plays and the Kitchen. Every batch the farmer cooks can be played at the stove, from day one, and the
// Kitchen, a building from Farm Rank 3, cooks dishes from recipes once a day and serves them as the staff meal.
//
//   at the stove     **At the stove · 1**, beside the plain batch in the farmhouse kitchen: a 30 s play on the same two
//                    goods; its tier makes 6, 8, 9 or 12 meals, their stars the goods' +0, +0, +1, +2. Never worse than
//                    the plain batch
//   the Kitchen      offered at Farm Rank 3 (3,000g · 40 logs · 20 vegetables); its levels, bought there as a station's
//                    (the level the next morning), cook 6, 8, 10, 12 or 15 dishes a play
//   its play         once a day, 1 action, 60 s: a menu of up to three known recipes sharing the level's base, each
//                    ingredient at one good and one star; round(base × tier × the assistant's term) dishes (+ a cook's
//                    night chores), the extra over the base shared by largest remainder; each dish's stars its inputs'
//                    average, rounded down, + the tier's lift, held to ★5
//   the assistant    optional: a farmhand with an action tonight; one of her actions tonight is the play's; her term is
//                    her Cooking's yield × her cooking rank's workshop yield × her line's +10% (+20% from R5); a point of
//                    Cooking practice, and cooking's challenges (`play` by its tier, `dishes` by the stars made)
//   the staff meal   at the Kitchen, once a day, free: one dish for every three mouths tonight, the most stars first, then
//                    the most held; those mouths eat it in place of their two meals, and every Uma among them is well
//                    fed by the lowest stars served, on the reception's table (★1–2 through tomorrow, ★3–4 two days, ★5
//                    three)
//
//   the Contest      on the Cooking Contest's day, **Enter the Cooking Contest · 3**: one dish cooked live, 60 s, then
//                    judged (`kitchen/contest.ts`)
//
// **Start is the commitment:** it spends the action, takes the inputs and keeps the play in `workshops.current`; its end
// settles it from its taps, replayed against its seed. A play left unfinished (✕, or leaving mid-play) settles as Rough
// the next time the app opens, or at the night's start: a Contest's dish is judged as Rough there too. The seed is the
// account's, the day's and the farm's count of plays (`farm.counts.plays`), so every play differs and a replay is the
// same. Pure; never stamps.
import { actionCost, actionsLeft, spend, spendForEvent, type SpecialDays } from '../farm/actions'
import { discoverOutput } from '../goods/discovery'
import { goodName } from '../goods/names'
import { exactHeld, knowsRestaurantRecipe, restaurantRecipe } from '../restaurant/recipes'
import { draw } from '../farm/draw'
import { farmRankOf } from '../farm/farm'
import { aptitudeOf, aptitudeYield, handDay } from '../farm/farmhands'
import { addMeals, BATCH_MEALS, batchBlock, batchStars, foodHeld, handsAtTable, mouthsTonight, plainBatch, type FoodHeld } from '../farm/food'
import { placeBuilt } from '../farm/places'
import { countChallenge, rankBenefits, type PlayGrade } from '../farm/rank-rules'
import { talentsD, type TalentOf } from '../farm/talents'
import { itemNameOf } from '../items/lines'
import { levelLockWords, type LevelLock } from '../gathering/stations'
import { atHerLine, choresOf, hasPerk, LINE_BONUS, onFarmForPerks, type PerkPack } from '../romance/perk-terms'
import { perkLineOf } from '../romance/perks'
import { receptionDays } from '../romance/wedding'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { isDishId, MENU_RECIPES, type ExactMenuLine, type FarmSave, type LegacyMenuLine, type MenuLine, type PlayInProgress, type StaffMeal, type StovePlay } from '../save/v4'
import { bookedForExpedition } from '../expeditions/presence'
import { availableDishes } from '../expeditions/stock'
import { addGoods, parseStockKey, stockKey, takeGoods } from '../save/warehouse'
import { worksOn, type SchedulePack } from '../town/town'
import { CONTEST_ACTIONS, contestBlock, judgeContest, type ContestBoard, type ContestEntry } from './contest'
import { dishStars, isMainOf, isSideOf, kitchenBuilt, knownRecipes, knowsRecipe, MAINS_A_DISH, recipeOf, SIDES_A_DISH } from './recipes'
import { KITCHEN_LEVELS, KITCHEN_MAX_LEVEL, type KitchenLevel } from './levels'
import { playStove, PLAY_TIERS, seedFrom, STOVE_SECONDS, stoveScore, tierCount, tierOf, type PlayTier, type StoveTap } from './stove'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

// --- The Kitchen's levels ---------------------------------------------------------------------------------------------

/** The Kitchen's level in effect today: 0 before it's built. */
export const kitchenLevel = (save: Pick<FarmSave, 'buildings'>): number => (kitchenBuilt(save) ? Math.min(KITCHEN_MAX_LEVEL, save.buildings.kitchen!) : 0)
/** The dishes a play makes at its level today, before its tier: its base. */
export const kitchenBase = (save: Pick<FarmSave, 'buildings'>): number => KITCHEN_LEVELS[kitchenLevel(save) - 1]?.dishes ?? 0
/** A level bought today, standing the next morning. */
export const kitchenLevelTonight = (save: Pick<FarmSave, 'buildings' | 'farm'>): boolean => kitchenBuilt(save) && save.farm.builds.includes('kitchen')
/** The Kitchen's next level to buy: the one after today's (after tomorrow's, once one is bought today); null at the top or
 * before it's built. */
export function nextKitchenLevel(save: Pick<FarmSave, 'buildings' | 'farm'>): KitchenLevel | null {
  const level = kitchenLevel(save)
  return level === 0 ? null : KITCHEN_LEVELS[level + (kitchenLevelTonight(save) ? 1 : 0)] ?? null
}
/** Why the Kitchen's next level can't be bought now (a station's words), or null when it can. */
export function kitchenLevelLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'gold'>): LevelLock | null {
  if (!kitchenBuilt(save)) return { by: 'built' }
  if (kitchenLevelTonight(save)) return { by: 'tonight', level: kitchenLevel(save) + 1 }
  const next = nextKitchenLevel(save)
  if (!next) return { by: 'top' }
  if (farmRankOf(save.farm.points) < next.farmRank) return { by: 'farm-rank', rank: next.farmRank }
  return save.gold < next.cost ? { by: 'gold', short: next.cost - save.gold } : null
}
/** Buys the Kitchen's next level: its gold now, the level the next morning (`farm.builds`, night step 8). Takes no
 * action. Refused with the lock's words, as a station's. Never stamps. */
export function upgradeKitchen<S extends FarmSave>(save: S): S {
  const lock = kitchenLevelLock(save)
  if (lock) throw new SaveRuleError(lock.by === 'farm-rank' ? 'locked' : lock.by === 'gold' ? 'no-gold' : 'bad-job', `${levelLockWords(lock)!}.`)
  const paid = spendGold(save, nextKitchenLevel(save)!.cost)
  return { ...paid, farm: { ...paid.farm, builds: [...paid.farm.builds, 'kitchen'] } }
}

// --- The stove's seed and its play under way --------------------------------------------------------------------------

/** The farm's count of plays at the stove: the seed's `n`. */
export const PLAYS_COUNT = 'plays'
/** The next play's seed, four digits: `draw(uid, day, 'stove', plays)`. */
export const stoveSeed = (save: Pick<FarmSave, 'account' | 'calendar' | 'farm'>): number =>
  seedFrom(draw(save.account.uid, save.calendar.day, 'stove', save.farm.counts[PLAYS_COUNT] ?? 0))
/** A play under way, or null. */
export const playUnderWay = (save: Pick<FarmSave, 'workshops'>): PlayInProgress | null => save.workshops.current
/** Whether the Kitchen has been played today. */
export const kitchenPlayedToday = (save: Pick<FarmSave, 'workshops' | 'calendar'>): boolean => save.workshops.played.kitchen === save.calendar.day

/** A play starts: a seed from the count, the count one more, and the play under way. */
function begin<S extends FarmSave>(save: S, play: Omit<PlayInProgress, 'workshop' | 'day' | 'seed'>): S {
  const seed = stoveSeed(save)
  const counts = { ...save.farm.counts, [PLAYS_COUNT]: (save.farm.counts[PLAYS_COUNT] ?? 0) + 1 }
  return { ...save, farm: { ...save.farm, counts }, workshops: { ...save.workshops, current: { workshop: 'kitchen', day: save.calendar.day, seed, ...play } } }
}

/** **At the stove · 1**: a batch played at the farmhouse stove. One action; its two goods (`picks`, stock keys; the
 * plain rule's when none) out of the Warehouse now, and the play under way, 30 s on its seed. Refused as the plain batch
 * is (`batchBlock`), while a play is under way (`busy`), and with no action left. Never stamps. */
export function startStoveBatch<S extends FarmSave>(save: S, picks: readonly string[] | null = null): S {
  if (save.workshops.current || save.workshops.restaurant?.shift) throw new SaveRuleError('busy', 'A play is under way.')
  const block = batchBlock(save, picks)
  if (block) throw new SaveRuleError(block === 'A batch takes two goods.' ? 'bad-count' : block === 'Only food goes in a batch.' ? 'bad-job' : 'no-items', block)
  const goods = [...(picks ?? plainBatch(save)!)]
  let items = save.items
  for (const key of goods) {
    const at = parseStockKey(key)!
    items = takeGoods(items, at.id, at.stars, 1)
  }
  return begin({ ...spend(save, 'batch'), items }, { play: 'batch', length: STOVE_SECONDS.batch, goods })
}

/** **Enter the Cooking Contest · 3**, at the Kitchen on its day: three actions (the festival day's event actions first,
 * then the day's own), two of the recipe's main and one side out of the Warehouse now, the cook's action tonight
 * (`today.cook`), and its dish under way, 60 s on its seed. Refused with its block's words (`contestBlock`): not today
 * (`not-ready`), no Kitchen (`locked`), entered or a play under way (`busy`), actions short (`no-actions`), an ingredient
 * short (`no-items`), the recipe or the cook (`bad-job`). Never stamps. */
export function enterContest<S extends FarmSave>(save: S, entry: ContestEntry, days: SpecialDays): S {
  const block = contestBlock(save, days, entry)
  if (block) {
    const reason = block === 'No contest today.' ? 'not-ready' : block.startsWith('Build') ? 'locked' : block === 'One entry a Contest.' || block === 'A play is under way.' ? 'busy'
      : block.startsWith('Entering') ? 'no-actions' : block.startsWith('Short') ? 'no-items' : 'bad-job'
    throw new SaveRuleError(reason, block)
  }
  const spent = spendForEvent(save, CONTEST_ACTIONS, days)
  const main = parseStockKey(entry.main)!
  const side = parseStockKey(entry.side)!
  const items = takeGoods(takeGoods(spent.items, main.id, main.stars, MAINS_A_DISH), side.id, side.stars, SIDES_A_DISH)
  const today = entry.cook === null ? spent.today : { ...spent.today, cook: entry.cook }
  const menu: MenuLine[] = [{ dish: entry.dish, count: 1, main: entry.main, side: entry.side }]
  return begin({ ...spent, items, today }, { play: 'contest', length: STOVE_SECONDS.contest, menu, ...(entry.cook === null ? {} : { assistant: entry.cook }) })
}

// --- The menu ---------------------------------------------------------------------------------------------------------

/** The goods held that are a recipe's main (its good of its grade, raw or refined) or side (any good of its side's
 * family), a row a good and star, the most held first, then fewer stars, then the cheapest. */
function heldFor(save: Pick<FarmSave, 'items'>, fits: (id: string) => boolean): FoodHeld[] {
  return foodHeld(save).filter((r) => fits(r.id)).sort((a, b) => b.count - a.count || a.stars - b.stars || a.price - b.price || a.id.localeCompare(b.id))
}
/** A recipe's mains held, the default first: the star held most, ties the lower. */
export const mainsHeld = (save: Pick<FarmSave, 'items'>, dish: string): FoodHeld[] => {
  const recipe = recipeOf(dish)
  return recipe ? heldFor(save, (id) => isMainOf(recipe, id)) : []
}
/** A recipe's sides held, the default first: the star held most, ties the lower. */
export const sidesHeld = (save: Pick<FarmSave, 'items'>, dish: string): FoodHeld[] => {
  const recipe = recipeOf(dish)
  return recipe ? heldFor(save, (id) => isSideOf(recipe, id)) : []
}
/** A recipe on the menu with `count` dishes, its main and side the defaults: the star held most (ties the lower) that
 * still covers it after what the rest of the menu takes (`taken`), else the star held most; with none held, its main's
 * raw good ★1 and its side's first good ★1, so the refusal can say what's short. */
export function menuLine(save: Pick<FarmSave, 'items'>, dish: string, count: number, taken: ReadonlyMap<string, number> = new Map()): LegacyMenuLine {
  const recipe = recipeOf(dish)!
  const pick = (rows: FoodHeld[], need: number) => (rows.find((r) => r.count - (taken.get(r.key) ?? 0) >= need) ?? rows[0])?.key
  const main = pick(mainsHeld(save, dish), MAINS_A_DISH * count) ?? stockKey(recipe.mains[0]!, 1)
  const side = pick(sidesHeld(save, dish), SIDES_A_DISH * count) ?? stockKey(SIDE_FALLBACK[recipe.side] ?? recipe.mains[0]!, 1)
  return { dish, count, main, side }
}
/** A side's good to name when none is held: the family's first. */
const SIDE_FALLBACK: Readonly<Partial<Record<string, string>>> = { 'herbs-spices': 'basil', vegetables: 'carrot', 'eggs-milk': 'egg', grains: 'wheat' }

/** The base shared evenly over `n` recipes: the remainder to the first. */
export const shareEvenly = (base: number, n: number): number[] => Array.from({ length: n }, (_, i) => Math.floor(base / n) + (i < base % n ? 1 : 0))

/** How many dishes of a recipe the Warehouse can make on its own: two of its best-held main and one of its best-held
 * side a dish. */
export function canMake(save: Pick<FarmSave, 'items'>, dish: string): number {
  const main = mainsHeld(save, dish)[0]?.count ?? 0
  const side = sidesHeld(save, dish)[0]?.count ?? 0
  return Math.min(Math.floor(main / MAINS_A_DISH), Math.floor(side / SIDES_A_DISH))
}

/** The menu to start: up to three known recipes the Warehouse can make the most of (the known order on a tie), sharing
 * the base evenly, each ingredient at its default after what the lines before it take; with none it can make, the first
 * known. Empty before the Kitchen. */
export function defaultMenu(save: Pick<FarmSave, 'items' | 'buildings' | 'workshops'>): LegacyMenuLine[] {
  const base = kitchenBase(save)
  const known = knownRecipes(save)
  if (base === 0 || known.length === 0) return []
  const making = known.map((dish, i) => ({ dish, i, can: canMake(save, dish) })).filter((r) => r.can > 0).sort((a, b) => b.can - a.can || a.i - b.i).slice(0, MENU_RECIPES)
  const dishes = (making.length > 0 ? making.sort((a, b) => a.i - b.i).map((r) => r.dish) : [known[0]!])
  const shares = shareEvenly(base, dishes.length)
  const menu: LegacyMenuLine[] = []
  for (const [i, dish] of dishes.entries()) menu.push(menuLine(save, dish, shares[i]!, menuTakes(menu)))
  return menu
}

/** The goods a menu takes, by stock key: two of each main and one of each side a dish. */
export function menuTakes(menu: readonly MenuLine[]): Map<string, number> {
  const takes = new Map<string, number>()
  for (const line of menu) {
    if ('inputs' in line) {
      for (const { key, count } of line.inputs) takes.set(key, (takes.get(key) ?? 0) + count)
      continue
    }
    takes.set(line.main, (takes.get(line.main) ?? 0) + MAINS_A_DISH * line.count)
    takes.set(line.side, (takes.get(line.side) ?? 0) + SIDES_A_DISH * line.count)
  }
  return takes
}

/** Why a menu can't be cooked, or null: a recipe once each, known, one to three, sharing the level's base whole; each
 * ingredient its recipe's main or side, held: "Short 2 Carp." */
type MenuSave = Pick<FarmSave, 'items' | 'buildings' | 'workshops'> & Partial<Pick<FarmSave, 'calendar' | 'expeditions' | 'crops' | 'farm' | 'diary'>>

function exactBlock(save: MenuSave, line: ExactMenuLine): string | null {
  const recipe = restaurantRecipe(line.dish)
  if (!recipe || !save.farm || !save.crops || !save.diary
    || !knowsRestaurantRecipe({ workshops: save.workshops, farm: save.farm, crops: save.crops, diary: save.diary }, recipe)) return 'You don’t know that recipe.'
  const remaining = new Map(recipe.ingredients.map(({ id, count }) => [id, count * line.count]))
  const keys = new Set<string>()
  for (const { key, count } of line.inputs) {
    const at = parseStockKey(key)
    const need = at ? remaining.get(at.id) : undefined
    if (!at || need === undefined || !Number.isInteger(count) || count < 1 || count > need || keys.has(key)) return 'Choose the exact recipe ingredients.'
    keys.add(key)
    remaining.set(at.id, need - count)
  }
  return [...remaining.values()].some((count) => count > 0) ? 'Choose the exact recipe ingredients.' : null
}

export function menuBlock(save: MenuSave, menu: readonly MenuLine[]): string | null {
  const base = kitchenBase(save)
  if (menu.length === 0) return 'Choose a recipe.'
  if (menu.length > MENU_RECIPES) return `${MENU_RECIPES} recipes at most.`
  if (new Set(menu.map((l) => l.dish)).size !== menu.length) return 'A recipe once on the menu.'
  for (const line of menu) {
    if (!Number.isInteger(line.count) || line.count < 1) return 'Each recipe makes a dish or more.'
    if ('inputs' in line) {
      const block = exactBlock(save, line)
      if (block) return block
      continue
    }
    const recipe = recipeOf(line.dish)
    if (!recipe || !knowsRecipe(save, line.dish)) return 'You don’t know that recipe.'
    const main = parseStockKey(line.main)
    const side = parseStockKey(line.side)
    if (!main || !isMainOf(recipe, main.id)) return `That isn’t a main for ${line.dish}.`
    if (!side || !isSideOf(recipe, side.id)) return `That isn’t a side for ${line.dish}.`
  }
  const made = menu.reduce((n, l) => n + l.count, 0)
  if (menu.some((line) => 'inputs' in line) ? made > base : made !== base) return `The menu shares ${base} dishes.`
  for (const [key, need] of menuTakes(menu)) {
    const at = parseStockKey(key)!
    const held = exactHeld(save, at.id, at.stars)
    if (held < need) return `Short ${need - held} ${goodName(at.id)}.`
  }
  return null
}

// --- The assistant ----------------------------------------------------------------------------------------------------

/** Her line's +10% at the Kitchen as its assistant: F2's, and R5's more, once the Kitchen stands. */
export function kitchenPerk(save: Pick<FarmSave, 'love' | 'buildings'>, pack: PerkPack | null, id: string): number {
  if (!pack || !atHerLine(save, pack, id, 'kitchen')) return 0
  const love = save.love[id]
  return round6((hasPerk(love, 'f2') ? LINE_BONUS : 0) + (hasPerk(love, 'r5') ? LINE_BONUS : 0))
}
/** Her term on the Kitchen's play: her Cooking's yield × her cooking rank's workshop yield × (1 + her line's bonus). */
export function assistantTerm(save: FarmSave, id: string, talentOf: TalentOf = talentsD, pack: PerkPack | null = null): number {
  const uma = save.roster[id]
  if (!uma) return 1
  const level = aptitudeOf(uma, 'cook', (a) => talentOf(id, a)).level
  return round6(aptitudeYield(level) * rankBenefits(uma.ranks.cooking.rank).workshopYield * (1 + kitchenPerk(save, pack, id)))
}
/** Why she can't assist today's play, or null: a farmhand on the farm today (her farm day: `pack` reads her schedule) with
 * an action tonight. */
export function assistantLock(save: FarmSave, id: string, pack: SchedulePack | null = null): string | null {
  const day = handDay(save, id)
  if (!day) return 'Only a farmhand assists.'
  if (bookedForExpedition(save, id)) return 'She’s in an expedition party.'
  if (!worksOn(save, pack, id)) return 'She’s in town today.'
  if (save.today.server === id) return 'She’s serving today.'
  return day.actions - day.kitchen < 1 ? 'She has no action left tonight.' : null
}

/** A cook's night chores on the Kitchen's play: each cook on the farm today (her line cooking; a spouse in her room, or a
 * farmhand on her farm day) adds a dish
 * for each of her chores (1 from F6, 2 from R7, 3 from S4), once the Kitchen stands. They don't bank. */
export function cooksDishes(save: FarmSave, pack: PerkPack | null): number {
  if (!pack || !kitchenBuilt(save)) return 0
  return Object.keys(save.roster).filter((id) => perkLineOf(pack, id) === 'cooking' && onFarmForPerks(save, pack, id)).reduce((n, id) => n + choresOf(save.love[id]), 0)
}

// --- The Kitchen's play -----------------------------------------------------------------------------------------------

/** Why the Kitchen can't be played now, or null: built, once a day, no play under way, an action, the menu, the
 * assistant. */
export function kitchenPlayBlock(save: FarmSave, menu: readonly MenuLine[], assistant: string | null = null): string | null {
  if (!placeBuilt(save, 'kitchen')) return 'Build the Kitchen first.'
  if (kitchenPlayedToday(save)) return 'The Kitchen plays once a day.'
  if (save.workshops.current || save.workshops.restaurant?.shift) return 'A play is under way.'
  if (actionsLeft(save) < actionCost('kitchen')) return 'No actions left today.'
  const block = menuBlock(save, menu)
  if (block) return block
  return assistant === null ? null : assistantLock(save, assistant)
}

/** **Play the Kitchen · 1**: once a day, one action; the menu's inputs out of the Warehouse now, and the play under way,
 * 60 s on its seed, with its assistant (one of her actions tonight is the play's). Refused with its block's words: not
 * built (`locked`), played today or a play under way (`busy`), the menu (`no-items` short, `bad-job` else), the
 * assistant (`bad-job`), no action left (`no-actions`). Never stamps. */
export function startKitchenPlay<S extends FarmSave>(save: S, menu: readonly MenuLine[], assistant: string | null = null): S {
  if (!placeBuilt(save, 'kitchen')) throw new SaveRuleError('locked', 'Build the Kitchen first.')
  if (kitchenPlayedToday(save)) throw new SaveRuleError('busy', 'The Kitchen plays once a day.')
  if (save.workshops.current || save.workshops.restaurant?.shift) throw new SaveRuleError('busy', 'A play is under way.')
  const spent = spend(save, 'kitchen')
  const block = menuBlock(save, menu) ?? (assistant === null ? null : assistantLock(save, assistant))
  if (block) throw new SaveRuleError(block.startsWith('Short') ? 'no-items' : 'bad-job', block)
  let items = spent.items
  for (const [key, n] of menuTakes(menu)) {
    const at = parseStockKey(key)!
    items = takeGoods(items, at.id, at.stars, n)
  }
  const played = { ...spent.workshops.played, kitchen: save.calendar.day }
  const today = assistant === null ? spent.today : { ...spent.today, assistant }
  const next = { ...spent, items, today, workshops: { ...spent.workshops, played } }
  return begin(next, { play: 'kitchen', length: STOVE_SECONDS.kitchen,
    menu: menu.map((line) => 'inputs' in line ? { ...line, inputs: line.inputs.map((input) => ({ ...input })) } : { ...line }),
    ...(assistant === null ? {} : { assistant }) })
}

function menuStars(line: MenuLine, lift: number): number {
  if (!('inputs' in line)) return dishStars(line.main, line.side, lift)
  const count = line.inputs.reduce((n, input) => n + input.count, 0)
  const stars = line.inputs.reduce((n, input) => n + input.count * parseStockKey(input.key)!.stars, 0)
  return Math.min(5, Math.floor(stars / count) + lift)
}

/** The dishes a play makes: round(base × the tier's factor × the assistant's term) plus a cook's chores, the extra over
 * the base shared by largest remainder (ties to the menu's order); each line's dishes at its inputs' stars (two mains and
 * a side, averaged, rounded down) + the tier's lift, held to ★5. */
export function kitchenMakes(menu: readonly MenuLine[], tier: Pick<PlayTier, 'factor' | 'lift'>, term = 1, extra = 0): { dish: string; stars: number; count: number }[] {
  const base = menu.reduce((n, l) => n + l.count, 0)
  if (base === 0) return []
  const total = Math.max(base, Math.floor(base * tier.factor * term + 0.5 + 1e-9)) + extra
  const exact = menu.map((l) => (l.count * total) / base)
  const counts = exact.map((x) => Math.floor(x + 1e-9))
  let left = total - counts.reduce((a, b) => a + b, 0)
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x + 1e-9) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (left <= 0) break
    counts[i]! += 1
    left--
  }
  return menu.map((l, i) => ({ dish: l.dish, stars: menuStars(l, tier.lift), count: counts[i]! }))
}

// --- A play's end -----------------------------------------------------------------------------------------------------

/** What a play made: its score (0 when it was left unfinished), its tier, and a batch's meals, the Kitchen's dishes or the
 * Contest's dish with its judging. */
export interface PlayResult {
  play: StovePlay
  score: number
  grade: PlayGrade
  /** Left unfinished: Rough, its taps never counted. */
  stopped: boolean
  meals: number
  /** A batch's meals' stars. */
  stars: number
  dishes: { dish: string; stars: number; count: number }[]
  /** The Contest's board: its score, place, the rivals, the gold and the Farm Rank points. */
  contest?: ContestBoard
}
/** What a play's end reads beyond the save: the talents (the assistant's Cooking) and the story pack (her line's +10%,
 * a cook's chores). */
export interface PlayContext {
  readonly talentOf?: TalentOf
  readonly story?: PerkPack | null
}

/**
 * A play's end: its taps replayed against its seed give its score and tier (`taps` null: left unfinished, Rough). A batch
 * puts its meals into the pantry, cooked the play's day (6, 8, 9 or 12; the goods' stars + the tier's lift). The
 * Kitchen's dishes go into the Warehouse, `farm.counts['cooked:<dish>']` rise, `workshops.best.kitchen` keeps the best
 * score, and its assistant gets a point of Cooking practice and counts toward cooking's challenges. Refused with no play
 * under way (`bad-job`). Never stamps.
 */
export function finishPlay<S extends FarmSave>(save: S, taps: readonly StoveTap[] | null, context: PlayContext = {}): { save: S; result: PlayResult } {
  const play = save.workshops.current
  if (!play) throw new SaveRuleError('bad-job', 'No play under way.')
  const score = taps ? stoveScore(playStove(play.seed, play.length * 1000, taps)) : 0
  const tier = taps ? tierOf(score) : PLAY_TIERS[0]!
  const workshops = { ...save.workshops, current: null }
  if (play.play === 'batch') {
    const goods = play.goods ?? []
    const meals = tierCount(BATCH_MEALS, tier)
    const stars = batchStars(goods, tier.lift)
    const next = { ...save, workshops, farm: { ...save.farm, pantry: addMeals(save.farm.pantry, play.day, stars, meals) } }
    return { save: next, result: { play: 'batch', score, grade: tier.grade, stopped: !taps, meals, stars, dishes: [] } }
  }
  if (play.play === 'contest') return finishContest(save, play, score, tier, !taps)
  const menu = play.menu ?? []
  const term = play.assistant ? assistantTerm(save, play.assistant, context.talentOf, context.story ?? null) : 1
  const dishes = kitchenMakes(menu, tier, term, cooksDishes(save, context.story ?? null))
  let items = save.items
  const counts = { ...save.farm.counts }
  for (const d of dishes) {
    if (d.count <= 0) continue
    items = addGoods(items, d.dish, d.stars, d.count)
    counts[`cooked:${d.dish}`] = (counts[`cooked:${d.dish}`] ?? 0) + d.count
  }
  const best = taps ? { ...workshops.best, kitchen: Math.max(workshops.best.kitchen ?? 0, score) } : workshops.best
  let next = save
  for (const dish of dishes) if (dish.count > 0) next = discoverOutput(next, dish.dish)
  next = { ...next, items, farm: { ...next.farm, counts }, workshops: { ...workshops, best } }
  if (play.assistant && next.roster[play.assistant]) {
    const id = play.assistant
    const uma = next.roster[id]!
    next = { ...next, roster: { ...next.roster, [id]: { ...uma, practice: { ...uma.practice, cook: (uma.practice?.cook ?? 0) + 1 } } } }
    next = countChallenge(next, id, 'cooking', { kind: 'play', grade: tier.grade })
    next = countChallenge(next, id, 'cooking', { kind: 'dishes', stars: dishes.flatMap((d) => Array.from({ length: d.count }, () => d.stars)) })
  }
  return { save: next, result: { play: 'kitchen', score, grade: tier.grade, stopped: !taps, meals: 0, stars: 0, dishes } }
}

/** The Contest's end: its one dish at its stars (the ingredients' average + the tier's lift) into the Warehouse
 * (`farm.counts['cooked:<dish>']` one more), its cook's point of Cooking practice, then the judging. */
function finishContest<S extends FarmSave>(save: S, play: PlayInProgress, score: number, tier: PlayTier, stopped: boolean): { save: S; result: PlayResult } {
  const line = play.menu![0]!
  const stars = menuStars(line, tier.lift)
  const counts = { ...save.farm.counts, [`cooked:${line.dish}`]: (save.farm.counts[`cooked:${line.dish}`] ?? 0) + 1 }
  const proof = discoverOutput(save, line.dish)
  let next: S = { ...proof, workshops: { ...save.workshops, current: null }, items: addGoods(save.items, line.dish, stars, 1), farm: { ...proof.farm, counts } }
  const cook = play.assistant && next.roster[play.assistant] ? play.assistant : null
  if (cook) {
    const uma = next.roster[cook]!
    next = { ...next, roster: { ...next.roster, [cook]: { ...uma, practice: { ...uma.practice, cook: (uma.practice?.cook ?? 0) + 1 } } } }
  }
  const judged = judgeContest(next, play.day, stars, score, cook)
  return { save: judged.save, result: { play: 'contest', score, grade: tier.grade, stopped, meals: 0, stars: 0, dishes: [{ dish: line.dish, stars, count: 1 }], contest: judged.board } }
}

/** A play left unfinished, settled as Rough: the next time the app opens, or at the night's start. Nothing under way:
 * the save as it was. */
export const settleUnfinished = <S extends FarmSave>(save: S, context: PlayContext = {}): S => (save.workshops.current ? finishPlay(save, null, context).save : save)

// --- The staff meal ---------------------------------------------------------------------------------------------------

/** One dish for every three mouths. */
export const MOUTHS_A_DISH = 3

/** A dish held, at its stars. */
export interface DishHeld {
  key: string
  id: string
  stars: number
  count: number
}
/** The dishes in the Warehouse, a row a dish and star: the most stars first, then the most held, then the id. */
export function dishesHeld(save: Parameters<typeof availableDishes>[0]): DishHeld[] {
  return Object.entries(save.items).filter(([id]) => isDishId(id))
    .flatMap(([id, row]) => row.flatMap((_, s) => {
      const key = stockKey(id, s + 1)
      const count = availableDishes(save, key)
      return count > 0 ? [{ key, id, stars: s + 1, count }] : []
    }))
    .sort((a, b) => b.stars - a.stars || b.count - a.count || a.id.localeCompare(b.id))
}

/** Tonight's table: its mouths (the farmer, the spouses in their rooms and the farmhands on their farm day: `pack` reads
 * their schedules, and with none every farmhand counts) and the dishes a staff meal takes for them. */
export function staffTable(save: Pick<FarmSave, 'love' | 'roster' | 'calendar'> & Partial<Pick<FarmSave, 'expeditions'>>, pack: SchedulePack | null = null): { mouths: number; dishes: number } {
  const mouths = mouthsTonight(save, handsAtTable(save, pack))
  return { mouths, dishes: Math.ceil(mouths / MOUTHS_A_DISH) }
}
/** The staff meal's dishes by the plain rule: the most stars first, then the most held; null when the Warehouse holds too
 * few. */
export function staffPicks(save: Pick<FarmSave, 'items' | 'love' | 'roster' | 'calendar'> & Partial<Pick<FarmSave, 'expeditions'>>, pack: SchedulePack | null = null): string[] | null {
  const { dishes } = staffTable(save, pack)
  const units = dishesHeld(save).flatMap((r) => Array.from({ length: Math.min(r.count, dishes) }, () => r.key))
  return units.length >= dishes ? units.slice(0, dishes) : null
}
/** The well-fed days a staff meal gives, by the lowest stars served: the reception's table. */
export const staffDays = (keys: readonly string[]): number => receptionDays(Math.min(...keys.map((k) => parseStockKey(k)?.stars ?? 1)))

/** Why the staff meal can't be served now, or null: the Kitchen built, once a day, dishes enough (the picks, held). */
export function staffBlock(save: FarmSave, picks: readonly string[] | null = null, pack: SchedulePack | null = null): string | null {
  if (!kitchenBuilt(save)) return 'Build the Kitchen first.'
  if (save.today.staff) return 'Served today.'
  const { dishes } = staffTable(save, pack)
  const keys = picks ?? staffPicks(save, pack)
  if (!keys) {
    const held = dishesHeld(save).reduce((n, r) => n + r.count, 0)
    return `Short ${dishes - held} dish${dishes - held === 1 ? '' : 'es'}.`
  }
  if (keys.length !== dishes) return `The table takes ${dishes} dish${dishes === 1 ? '' : 'es'}.`
  for (const key of new Set(keys)) {
    const at = parseStockKey(key)
    if (!at || !isDishId(at.id)) return 'Only dishes go on the table.'
    if (availableDishes(save, key) < keys.filter((k) => k === key).length) return 'Not enough in the Warehouse.'
  }
  return null
}

/** **Serve the staff meal**, at the Kitchen, once a day, free: one dish for every three mouths tonight (the plain rule's
 * when none are chosen) out of the Warehouse, and `today.staff` holds its mouths and well-fed days; `farm.counts.meals`
 * one more. Tonight those mouths eat it in place of their two meals (`eatTonight`). Refused with its block's words: not
 * built (`locked`), served today (`busy`), dishes short (`no-items`), the wrong count (`bad-count`). Never stamps. */
export function serveStaffMeal<S extends FarmSave>(save: S, picks: readonly string[] | null = null, pack: SchedulePack | null = null): S {
  const block = staffBlock(save, picks, pack)
  if (block) throw new SaveRuleError(block.startsWith('Build') ? 'locked' : block === 'Served today.' ? 'busy' : block.startsWith('The table') ? 'bad-count' : 'no-items', block)
  const keys = picks ?? staffPicks(save, pack)!
  let items = save.items
  for (const key of keys) {
    const at = parseStockKey(key)!
    items = takeGoods(items, at.id, at.stars, 1)
  }
  const staff: StaffMeal = { mouths: staffTable(save, pack).mouths, days: staffDays(keys) }
  const counts = { ...save.farm.counts, [STAFF_MEALS]: (save.farm.counts[STAFF_MEALS] ?? 0) + 1 }
  return { ...save, items, today: { ...save.today, staff }, farm: { ...save.farm, counts } }
}
/** The staff meals served, all time (`farm.counts.meals`). */
export const STAFF_MEALS = 'meals'

/** An ingredient in words: "Carp ★2". */
export const ingredientName = (key: string): string => {
  const at = parseStockKey(key)
  return at ? `${itemNameOf(at.id)} ★${at.stars}` : key
}
