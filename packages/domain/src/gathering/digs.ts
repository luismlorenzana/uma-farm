// The Mine and the Quarry, worked floor by floor in the farm loop's style.
//
//   work a face     1 action on the deepest floor reached: 2 finds, ores at the Mine, stones and gems at the Quarry
//   the stairs      each face on the deepest floor counts toward its stairs; found after 1 + ⌈floor ÷ 5⌉ faces, they're
//                   taken free, one floor down, as deep as the Farm Rank reaches
//   30 floors       a floor's grade is ⌈floor ÷ 3⌉: G1 on floors 1–3 … G10 on 28–30, so the finds grow rarer with depth
//
// A find's grade is the floor's 70%, the grade below 20% (the floor's own on floors 1–3) and the grade above 10% (held
// to G10); at the Quarry it's a stone 70% or a gem 30% of that grade. The deepest floor reached is kept in the save
// (`places`), with the faces worked toward its stairs. The farmer works as a Novice with a D talent and the farm's Pick
// (the Mine) or Hammer (the Quarry), so his finds are ★1 until the tools improve; his reach is the Farm Rank's, as the
// forest's: floor 5 at Farm Rank 1, 10 at 2, 15 at 4, 20 at 6, 25 at 8 and 30 at 10. A farmhand works the deepest floor
// too, and her faces count toward its stairs; the farmer takes them. Every pick is a seeded draw numbered by the farm's
// count of finds at the dig. Pure; never stamps. Loaded with the dig's screen and the night.
import { spend } from '../farm/actions'
import { draw } from '../farm/draw'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { RANK_BENEFITS } from '../farm/rank-rules'
import { GOODS, type GoodsFamily } from '../goods/ids'
import { drawStars, quality, toolQuality } from '../goods/stars'
import { SaveRuleError } from '../save/rules'
import { DEEPEST_FLOOR, type Dig, type DigId, type FarmSave, type ToolId } from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'
import { FARMER_REACH } from './hauls'

/** The digs' names. */
export const DIG_NAMES: Readonly<Record<DigId, string>> = { mine: 'Mine', quarry: 'Quarry' }
/** The tool each dig uses: the Pick, the Hammer. */
export const DIG_TOOL: Readonly<Record<DigId, ToolId>> = { mine: 'pick', quarry: 'hammer' }
/** A face's finds. */
export const FACE_FINDS = 2
/** Floors to a grade. */
export const FLOORS_A_GRADE = 3
/** A floor's grade: ⌈floor ÷ 3⌉, G1 … G10. */
export const gradeAt = (floor: number): number => Math.min(10, Math.max(1, Math.ceil(floor / FLOORS_A_GRADE)))
/** A find's grade by share: the floor's, the one below, the one above. */
export const GRADE_SHARES: readonly (readonly [step: number, percent: number])[] = [[0, 70], [-1, 20], [1, 10]]
/** What each dig gives, by share: the Mine ores; the Quarry stones and gems (crystals). */
export const DIG_FINDS: Readonly<Record<DigId, readonly (readonly [GoodsFamily, number])[]>> = {
  mine: [['ores', 100]],
  quarry: [['stones', 70], ['crystals', 30]],
}
/** The faces that find a floor's stairs: 1 + ⌈floor ÷ 5⌉ (2 on floors 1–5 … 7 on 26–29); the last floor has none. */
export const stairsAfter = (floor: number): number => 1 + Math.ceil(floor / 5)
/** The deepest floor each of an Uma's ranks reaches (Novice … Legend); the farmer's reach is the Farm Rank's, by
 * `FARMER_REACH`. */
export const RANK_FLOORS: readonly number[] = RANK_BENEFITS.map((b) => b.deepest.floor)
/** The lifetime count of a dig's finds: its draws' numbers. */
export const dugCount = (dig: DigId): string => `dug:${dig}`

/** Whether a dig stands. */
export const digBuilt = (save: Pick<FarmSave, 'buildings'>, dig: DigId): boolean => placeBuilt(save, dig)
/** The floor worked: the deepest reached, floor 1 before the first face. */
export const digFloor = (dig: Dig): number => Math.max(1, dig.deepest)
/** Whether the floor's stairs are found. */
export const stairsFound = (dig: Dig): boolean => digFloor(dig) < DEEPEST_FLOOR && dig.stairs >= stairsAfter(digFloor(dig))

/** The deepest floor the Farm Rank reaches: floor 5 at Farm Rank 1 … 30 at 10. */
export function reachFloor(save: Pick<FarmSave, 'farm'>): number {
  const rank = farmRankOf(save.farm.points)
  return RANK_FLOORS.reduce((deepest, floor, i) => (rank >= FARMER_REACH[i]! ? floor : deepest), RANK_FLOORS[0]!)
}
/** The Farm Rank a floor opens at for the farmer. */
export const floorRank = (floor: number): number => FARMER_REACH[RANK_FLOORS.findIndex((f) => floor <= f)] ?? FARMER_REACH.at(-1)!

/** Why the stairs can't be taken now, in words, or null: the dig's built, the stairs found, the floor below in reach. */
export function stairsLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'places'>, dig: DigId): string | null {
  if (!digBuilt(save, dig)) return 'Build it first.'
  const at = save.places[dig]
  const floor = digFloor(at)
  if (floor >= DEEPEST_FLOOR) return 'This is the deepest floor.'
  if (at.stairs < stairsAfter(floor)) {
    const left = stairsAfter(floor) - at.stairs
    return `Find the stairs first: ${left} more ${left === 1 ? 'face' : 'faces'}.`
  }
  return floor + 1 > reachFloor(save) ? `Floor ${floor + 1} opens at Farm Rank ${floorRank(floor + 1)}.` : null
}

/** Who works a face: her quality points and how many finds a face brings. */
export interface Digger {
  q: number
  count: number
}
/** The farmer's: Novice D with the farm's Pick or Hammer (★1 at Basic), two finds. */
export const farmerDigger = (save: Pick<FarmSave, 'tools'>, dig: DigId): Digger => ({ q: quality({ tool: toolQuality(save.tools[DIG_TOOL[dig]]) }), count: FACE_FINDS })

/** What a face brought: its floor, its finds (stock keys) and whether it found the stairs. */
export interface Face {
  dig: DigId
  floor: number
  items: string[]
  stairs: boolean
}

/** Works a face: one action on the deepest floor reached. Refused before the dig stands (`locked`). */
export function workFace<S extends FarmSave>(save: S, dig: DigId): { save: S; face: Face } {
  if (!digBuilt(save, dig)) throw new SaveRuleError('locked', 'Build it first.')
  return faceAt(spend(save, 'mine'), dig, farmerDigger(save, dig))
}

/** A face itself, spending nothing: `by.count` finds on the deepest floor (their grade `draw(uid, day, 'dig:<dig>', n)`,
 * at the Quarry their kind `'dig-kind:<dig>'`, their stars `'dig-stars:<dig>'`, n the farm's count of finds there), into
 * the Warehouse; the floor reached, and a face more toward its stairs. */
export function faceAt<S extends FarmSave>(save: S, dig: DigId, by: Digger): { save: S; face: Face } {
  const at = save.places[dig]
  const floor = digFloor(at)
  const before = save.farm.counts[dugCount(dig)] ?? 0
  const u = (what: string, k: number) => draw(save.account.uid, save.calendar.day, `${what}:${dig}`, before + k)
  let items = save.items
  const got: string[] = []
  for (let k = 0; k < by.count; k++) {
    const good = findOn(dig, floor, u('dig', k), u('dig-kind', k))
    const stars = drawStars(by.q, u('dig-stars', k))
    items = addGoods(items, good, stars, 1)
    got.push(stockKey(good, stars))
  }
  const need = floor < DEEPEST_FLOOR ? stairsAfter(floor) : 0
  const stairs = Math.min(need, at.stairs + 1)
  const places = { ...save.places, [dig]: { deepest: Math.max(at.deepest, floor), stairs } }
  const counts = { ...save.farm.counts, [dugCount(dig)]: before + got.length }
  return {
    save: { ...save, items, places, farm: { ...save.farm, counts } },
    face: { dig, floor, items: got, stairs: need > 0 && at.stairs < need && stairs >= need },
  }
}

/** Takes the stairs: free, one floor down, the faces toward the next floor's starting over. Refused by its lock
 * (`locked`). */
export function takeStairs<S extends FarmSave>(save: S, dig: DigId): S {
  const lock = stairsLock(save, dig)
  if (lock) throw new SaveRuleError('locked', lock)
  const floor = digFloor(save.places[dig]) + 1
  return { ...spend(save, 'stairs'), places: { ...save.places, [dig]: { deepest: floor, stairs: 0 } } }
}

/** One find on a floor, by two draws in [0, 1): its grade by `grade` (the floor's 70%, the one below 20%, the one above
 * 10%), its family by `kind` (the Quarry's stone 70% or gem 30%). A face's finds and a miner's night chores draw it. */
export function findOn(dig: DigId, floor: number, grade: number, kind: number): string {
  const g = Math.min(10, Math.max(1, gradeAt(floor) + pick(GRADE_SHARES, grade)))
  const family = pick(DIG_FINDS[dig], kind)
  return GOODS.find((x) => x.family === family && !x.refined && x.grade === g)!.id
}

/** A floor's top grade: the highest its faces find (the grade above the floor's, held to G10). */
export const floorTopGrade = (floor: number): number => Math.min(10, gradeAt(floor) + Math.max(...GRADE_SHARES.map(([step]) => step)))

/** A share's pick by a draw `u` in [0, 1). */
function pick<T>(shares: readonly (readonly [T, number])[], u: number): T {
  const total = shares.reduce((n, [, p]) => n + p, 0)
  let left = u * total
  for (const [value, p] of shares) {
    if (left < p) return value
    left -= p
  }
  return shares.at(-1)![0]
}

/** A floor's finds, most likely first, by family and grade: what its view shows. */
export function floorFinds(dig: DigId, floor: number): string[] {
  const grade = gradeAt(floor)
  const grades = [...new Set(GRADE_SHARES.map(([step]) => Math.min(10, Math.max(1, grade + step))))]
  return DIG_FINDS[dig].flatMap(([family]) => grades.map((g) => GOODS.find((x) => x.family === family && !x.refined && x.grade === g)!.id))
}
