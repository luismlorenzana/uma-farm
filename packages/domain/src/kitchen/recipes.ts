// The Kitchen's recipes: the 80 dishes (`dish-<family>-<grade>`, uma-art's dishes atlas, named by `dishName`), each two
// of its main and one side:
//
//   its main   its family's good of its grade, raw or refined (two a dish)
//   its side   one good of its side's family, any grade, raw or refined, any stars
//   known      Carrot Salad, Carp Grill and Button Mushroom Soup once the Kitchen stands (Farm Rank 1's goods); more from
//              the shop's Recipes shelf (10 × its main's ★1 price, to 50g), her Friendship 4 (her signature dish) and a
//              request's recipe extra. A recipe is known for good (`workshops.recipes`)
//
// Pure; never stamps. Loaded with the Kitchen's sheet, the shop and the night.
import { goodOf, GOODS, type GoodsFamily } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { placeBuilt } from '../farm/places'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { DISH_FAMILIES, isDishId, type FarmSave } from '../save/v4'
import { MAX_STARS, parseStockKey } from '../save/warehouse'

/** A dish's family: the eight kinds. */
export type DishKind = typeof DISH_FAMILIES[number]
/** The kinds in the recipes' order: Salad, Grill, Soup, Curry, Bread, Cake, Tart, Cookies. */
export const RECIPE_KINDS: readonly DishKind[] = ['vegetables', 'fish', 'mushrooms', 'herbs-spices', 'grains', 'sweets', 'fruits', 'nuts-seeds']
/** Each kind's side: any herb or spice, any vegetable, any egg or milk, any grain. */
export const RECIPE_SIDE: Readonly<Record<DishKind, GoodsFamily>> = {
  vegetables: 'herbs-spices', fish: 'herbs-spices', mushrooms: 'vegetables', 'herbs-spices': 'vegetables',
  grains: 'eggs-milk', sweets: 'eggs-milk', fruits: 'grains', 'nuts-seeds': 'grains',
}
/** Each side in the player's words. */
export const SIDE_WORDS: Readonly<Partial<Record<GoodsFamily, string>>> = {
  'herbs-spices': 'any herb or spice', vegetables: 'any vegetable', 'eggs-milk': 'any egg or milk', grains: 'any grain',
}
/** Two of its main a dish, one side. */
export const MAINS_A_DISH = 2
export const SIDES_A_DISH = 1
/** A recipe costs this many times its main's ★1 price, to 50g. */
export const RECIPE_PRICE_FACTOR = 10
export const RECIPE_PRICE_STEP = 50

/** One recipe: its dish, its kind and grade, its mains (the raw good of its grade, and its refined form where there is
 * one), its side's family and its price at the shop. */
export interface Recipe {
  dish: string
  kind: DishKind
  grade: number
  mains: readonly string[]
  side: GoodsFamily
  price: number
}

const priceOf = (raw: string): number => Math.round((RECIPE_PRICE_FACTOR * goodOf(raw)!.price) / RECIPE_PRICE_STEP) * RECIPE_PRICE_STEP
/** The 80 recipes, kind by kind in the recipes' order, G1 → G10. */
export const RECIPES: readonly Recipe[] = RECIPE_KINDS.flatMap((kind) => Array.from({ length: 10 }, (_, i): Recipe => {
  const grade = i + 1
  const mains = GOODS.filter((g) => g.family === kind && g.grade === grade).sort((a, b) => Number(a.refined) - Number(b.refined)).map((g) => g.id)
  return { dish: `dish-${kind}-${grade}`, kind, grade, mains, side: RECIPE_SIDE[kind], price: priceOf(mains[0]!) }
}))
const BY_DISH = new Map(RECIPES.map((r) => [r.dish, r]))
/** A dish's recipe, or undefined for anything else. */
export const recipeOf = (dish: string): Recipe | undefined => BY_DISH.get(dish)

/** A recipe's ingredients in words: "2 Carrot + any herb or spice", "2 Wheat or Wheat Flour + any egg or milk". */
export function recipeWords(dish: string): string {
  const r = recipeOf(dish)
  return r ? `2 ${r.mains.map((m) => itemNameOf(m)).join(' or ')} + ${SIDE_WORDS[r.side] ?? r.side}` : ''
}

/** A dish's stars from its ingredients (stock keys): its two mains' and its side's stars averaged, rounded down, + the
 * play's lift, held to ★5. The Kitchen's dishes and the Cooking Contest's. */
export function dishStars(main: string, side: string, lift: number): number {
  const m = parseStockKey(main)?.stars ?? 1
  const s = parseStockKey(side)?.stars ?? 1
  return Math.min(MAX_STARS, Math.floor((MAINS_A_DISH * m + SIDES_A_DISH * s) / (MAINS_A_DISH + SIDES_A_DISH)) + lift)
}

/** Whether a good is a recipe's main: its family's good of its grade, raw or refined. */
export const isMainOf = (recipe: Recipe, id: string): boolean => recipe.mains.includes(id)
/** Whether a good is a recipe's side: any good of its side's family. */
export const isSideOf = (recipe: Recipe, id: string): boolean => goodOf(id)?.family === recipe.side

/** The recipes known when the Kitchen stands: Carrot Salad, Carp Grill and Button Mushroom Soup. */
export const START_RECIPES: readonly string[] = ['dish-vegetables-1', 'dish-fish-1', 'dish-mushrooms-1']

/** Whether the Kitchen stands on this save. */
export const kitchenBuilt = (save: Pick<FarmSave, 'buildings'>): boolean => placeBuilt(save, 'kitchen')

/** The recipes the farm knows, in order: once the Kitchen stands, its first three, then each learnt in the order learnt;
 * before it, only those learnt (her signature dishes wait in the Kitchen's list). */
export function knownRecipes(save: Pick<FarmSave, 'buildings' | 'workshops'>): string[] {
  const learnt = save.workshops.recipes.filter(isDishId)
  return kitchenBuilt(save) ? [...new Set([...START_RECIPES, ...learnt])] : learnt
}
/** Whether the farm knows a recipe. */
export const knowsRecipe = (save: Pick<FarmSave, 'buildings' | 'workshops'>, dish: string): boolean => knownRecipes(save).includes(dish)

/** The shop's Recipes shelf once the Kitchen stands: every recipe not known yet, in the recipes' order; none before. */
export const recipeShelf = (save: Pick<FarmSave, 'buildings' | 'workshops'>): Recipe[] =>
  (kitchenBuilt(save) ? RECIPES.filter((r) => !knowsRecipe(save, r.dish)) : [])

/** Why a recipe can't be bought now, or null: out of town, the Kitchen not built, not a recipe, known, gold short. */
export function recipeLock(save: Pick<FarmSave, 'buildings' | 'workshops' | 'today' | 'gold'>, dish: string): string | null {
  const recipe = recipeOf(dish)
  if (!recipe) return 'That isn’t a recipe.'
  if (!kitchenBuilt(save)) return 'Build the Kitchen first.'
  if (knowsRecipe(save, dish)) return 'Known already.'
  if (!save.today.town) return 'The shop is in town.'
  return save.gold < recipe.price ? `Need ${(recipe.price - save.gold).toLocaleString('en-US')}g more.` : null
}

/** Buys a recipe at the shop's Recipes shelf: its gold, and it's known for good. Free of actions, once in town. Refused
 * out of town and before the Kitchen (`locked`), for what isn't a recipe or is known (`bad-job`), gold short
 * (`no-gold`). Never stamps. */
export function buyRecipe<S extends FarmSave>(save: S, dish: string): S {
  const lock = recipeLock(save, dish)
  if (lock) throw new SaveRuleError(lock.startsWith('Need') ? 'no-gold' : lock === 'Known already.' || lock === 'That isn’t a recipe.' ? 'bad-job' : 'locked', lock)
  const paid = spendGold(save, recipeOf(dish)!.price)
  return { ...paid, workshops: { ...paid.workshops, recipes: [...paid.workshops.recipes, dish] } }
}

/** The 80 recipes' prices, all told: the workshops' first gold sink. */
export const RECIPES_GOLD = RECIPES.reduce((n, r) => n + r.price, 0)
