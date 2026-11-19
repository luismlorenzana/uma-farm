import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SEASONS, type Season } from '../farm/calendar'
import { goodOf } from './ids'
import { ingredientSources } from './sources'

interface Ingredient { id: string; grade: number; count: number }
interface Recipe { id: string; grade: number; ingredients: Ingredient[] }

const packet = readFileSync(new URL('../../../../docs/handoff/tasks/F98-restaurant.md', import.meta.url), 'utf8')
const recipes: Recipe[] = []
let grade = 0
for (const line of packet.split(/\r?\n/)) {
  const stage = /^### ([1-8])\. /.exec(line)
  if (stage) grade = Number(stage[1])
  const row = /^\| (R\d{3}) \| [^|]+ \| ([^|]+) \|$/.exec(line)
  if (!row) continue
  const ingredients = [...row[2]!.matchAll(/(\d+) × `([a-zA-Z0-9-]+)` G(\d+)/g)]
    .map(([, count, id, grade]) => ({ id: id!, count: Number(count), grade: Number(grade) }))
  if (ingredients.length !== row[2]!.split(' + ').length) throw new Error(`Incomplete ingredients in ${row[1]}`)
  recipes.push({ id: row[1]!, grade, ingredients })
}

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
    expect(recipes.map((r) => r.id)).toEqual(Array.from({ length: 120 }, (_, i) => `R${String(i + 1).padStart(3, '0')}`))
    const earlier = new Map<string, number>()
    const problems: string[] = []
    for (const [i, recipe] of recipes.entries()) {
      expect(recipe.grade).toBe(1 + Math.floor(i / 15))
      for (const { id, count, grade } of recipe.ingredients) {
        expect(count).toBeGreaterThan(0)
        const actual = /^R\d{3}$/.test(id) ? earlier.get(id) : goodOf(id)?.grade
        if (actual !== grade) problems.push(`${recipe.id}: ${id} G${grade} is ${actual === undefined ? 'unknown or not yet learned' : `G${actual}`}`)
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
