import { availableDishes } from '../expeditions/stock'
import { round5 } from '../farm/round'
import { stationJobUnits } from '../gathering/ids'
import { discovered } from '../goods/discovery'
import { goodOf } from '../goods/ids'
import type { ExactMenuLine, FarmSave } from '../save/v4'
import { stockKey } from '../save/warehouse'
import { RECIPE_ROWS } from './recipe-rows'
import { restaurantGrade, restaurantId, type StockPortions } from './rules'

export interface ExactIngredient {
  id: string
  count: number
  grade: number
}

export interface RestaurantRecipe {
  id: string
  name: string
  grade: number
  ingredients: readonly ExactIngredient[]
  /** Production proof must include the exact ingredients and all of their ancestors. */
  proofs: readonly string[]
  price: number
  leafValue: number
}

const byId = new Map<string, RestaurantRecipe>()
function ancestors(id: string): string[] {
  const component = byId.get(id)
  if (component) return [id, ...component.proofs]
  const input = goodOf(id)?.input
  return input ? [id, ...ancestors(input)] : [id]
}

// Station value includes processing. Dish components are expanded back to their station-valued inputs.
function valueOf(id: string): { price: number; leafValue: number } {
  const dish = byId.get(id)
  if (dish) return dish
  const good = goodOf(id)!
  const value = Math.max(good.price, good.input ? goodOf(good.input)!.price * stationJobUnits(id) : 0)
  return { price: good.price, leafValue: value }
}

export const RESTAURANT_RECIPES: readonly RestaurantRecipe[] = RECIPE_ROWS.map(([name, ...rows], i) => {
  const id = restaurantId(i + 1)
  const ingredients = rows.map(([id, count, grade]) => ({ id, count, grade }))
  const proofs = [...new Set(ingredients.flatMap((ingredient) => ancestors(ingredient.id)))]
  const inputValue = ingredients.reduce((n, ingredient) => n + valueOf(ingredient.id).price * ingredient.count, 0)
  const leafValue = ingredients.reduce((n, ingredient) => n + valueOf(ingredient.id).leafValue * ingredient.count, 0)
  const price = Math.min(round5(inputValue * 1.15), Math.floor(leafValue * 1.35 / 5) * 5)
  const recipe = { id, name, grade: restaurantGrade(id), ingredients, proofs, price, leafValue }
  byId.set(id, recipe)
  return recipe
})

export const restaurantRecipe = (id: string): RestaurantRecipe | undefined => byId.get(id)
export const restaurantBasePrice = (id: string): number | undefined => byId.get(id)?.price

type DiscoverySave = Pick<FarmSave, 'workshops' | 'farm' | 'crops' | 'diary'>
export const missingRecipeProofs = (save: DiscoverySave, recipe: RestaurantRecipe): string[] =>
  recipe.proofs.filter((id) => !discovered(save, id))

export const knowsRestaurantRecipe = (save: DiscoverySave, recipe: RestaurantRecipe): boolean =>
  recipe.grade <= (save.workshops.restaurant?.cleared ?? 0) && recipe.proofs.every((id) => discovered(save, id))

export const knownRestaurantRecipes = (save: DiscoverySave): RestaurantRecipe[] =>
  RESTAURANT_RECIPES.filter((recipe) => knowsRestaurantRecipe(save, recipe))

type StockSave = Parameters<typeof availableDishes>[0]
export const exactHeld = (save: StockSave, id: string, stars: number): number =>
  restaurantGrade(id) ? availableDishes(save, stockKey(id, stars)) : save.items[id]?.[stars - 1] ?? 0

/** Prefer the lower stars first, and allow several lots at the required grade. */
export function exactMenuLine(save: StockSave, recipe: RestaurantRecipe, count: number, taken: ReadonlyMap<string, number> = new Map()): ExactMenuLine {
  const inputs: StockPortions[] = []
  for (const ingredient of recipe.ingredients) {
    let left = ingredient.count * count
    for (let stars = 1; stars <= 5 && left > 0; stars++) {
      const key = stockKey(ingredient.id, stars)
      const held = Math.max(0, exactHeld(save, ingredient.id, stars) - (taken.get(key) ?? 0))
      const use = Math.min(held, left)
      if (use > 0) inputs.push({ key, count: use })
      left -= use
    }
    // Represent a shortfall at ★1 so the normal menu check can report it.
    if (left > 0) {
      const key = stockKey(ingredient.id, 1)
      const lot = inputs.find((entry) => entry.key === key)
      if (lot) lot.count += left
      else inputs.push({ key, count: left })
    }
  }
  return { dish: recipe.id, count, inputs }
}
