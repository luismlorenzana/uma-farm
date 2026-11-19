import { describe, expect, it } from 'vitest'
import { SEASONS, type Season } from '../farm/calendar'
import { RESTAURANT_RECIPES as recipes } from '../restaurant/recipes'
import { isRestaurantDish, restaurantId } from '../restaurant/rules'
import { goodOf } from './ids'
import { ingredientSources } from './sources'

/** An all-year station is limited by when its exact inputs can be produced. Goods can keep across seasons. */
function sourceSeasons(id: string, visiting: ReadonlySet<string> = new Set()): Set<Season> {
  if (visiting.has(id)) throw new Error(`Ingredient source cycle at ${id}`)
  const seen = new Set([...visiting, id])
  return new Set(ingredientSources(id).flatMap((source) => {
    const input = source.input ? sourceSeasons(source.input, seen) : null
    return source.seasons.filter((season) => input === null || input.has(season))
  }))
}

describe('the 120 authored Restaurant recipes', () => {
  it('has earlier, exact dish dependencies and a normal, reachable source for each stock and ancestor', () => {
    expect(recipes.map((r) => r.id)).toEqual(Array.from({ length: 120 }, (_, i) => restaurantId(i + 1)))
    const earlier = new Map<string, number>()
    const problems: string[] = []
    for (const [i, recipe] of recipes.entries()) {
      expect(recipe.grade).toBe(1 + Math.floor(i / 15))
      expect(new Set(recipe.ingredients.map(({ id }) => id)).size).toBe(recipe.ingredients.length)
      for (const { id, count, grade } of recipe.ingredients) {
        expect(count).toBeGreaterThan(0)
        const actual = isRestaurantDish(id) ? earlier.get(id) : goodOf(id)?.grade
        if (actual !== grade) problems.push(`${recipe.id}: ${id} G${grade} is ${actual === undefined ? 'unknown or not yet learned' : `G${actual}`}`)
        else if (isRestaurantDish(id) && actual >= recipe.grade) problems.push(`${recipe.id}: ${id} must be from an earlier stage`)
        else if (!earlier.has(id) && !sourceSeasons(id).size) problems.push(`${recipe.id}: ${id} G${grade} has no production route`)
      }
      earlier.set(recipe.id, recipe.grade)
    }
    expect(problems).toEqual([])
  })

  it.each(SEASONS)('keeps a fresh Stage 1 entry path in %s', (season) => {
    const entry = recipes.filter((recipe) => recipe.grade === 1 && recipe.ingredients.every(({ id }) => sourceSeasons(id).has(season)))
    expect(entry.length).toBeGreaterThan(0)
  })
})
