// F4's check (R2, R4): every line runs gather → process → make from G1 to G10 over the save, each grade opening at Craft
// Lv 5g − 4, the made item landing in the Warehouse on a fake clock.
import { describe, expect, it } from 'vitest'
import { PLACES_V4 } from '../economy/places-v4'
import { gradeUnlockLevel } from '../items/catalog'
import { lineItemId, MATERIAL_LINES, type MaterialLine } from '../items/lines'
import { MADE_IDENTITIES } from '../items/made-id'
import { madeRecipeV4 } from '../items/made-v4'
import { newSave, type Save } from './save'
import { collectWorker, startJob } from './work'

const T0 = Date.parse('2026-11-08T00:00:00.000Z')
const DAY = 24 * 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
const UMA = '101'

const places = (line: MaterialLine) => {
  const row = PLACES_V4.filter((p) => p.line === line)
  return { gather: row[0]!, process: row[1]!, make: row[2]! }
}
/** The made item of a line at a grade: its making place's one item there (a Planet Jewel on odd grades, a Moon Jewel on even). */
const madeAt = (line: MaterialLine, grade: number) =>
  MADE_IDENTITIES.find((m) => places(line).make.made.includes(m.line) && m.grade === grade)!

/** Her at a Craft Level, everything else empty. */
const at = (level: number): Save => ({ ...newSave('u1', iso(T0)), umas: { [UMA]: { craft: { level, exp: 0 } } } })

/** Starts and collects one job a day after it started. */
function run(save: Save, placeId: string, item: string, count: number, day: number): Save {
  const started = startJob(save, placeId, 0, { outfitId: UMA }, item, count, iso(T0 + day * DAY))
  return collectWorker(started, UMA, iso(T0 + (day + 1) * DAY)).save
}

describe('every line from G1 to G10 (R2, R4)', () => {
  for (const line of MATERIAL_LINES) {
    it(`runs ${line}: gather, process, make at every grade`, () => {
      const { gather, process, make } = places(line)
      for (let grade = 1; grade <= 10; grade++) {
        const level = gradeUnlockLevel(grade)
        const made = madeAt(line, grade)
        const need = Object.values(madeRecipeV4(made.id))[0]!
        const raw = lineItemId(line, grade, false), refined = lineItemId(line, grade, true)
        // The gate: a level below opens nothing of this grade.
        if (grade > 1) expect(() => startJob(at(level - 1), gather.id, 0, { outfitId: UMA }, raw, 1, iso(T0))).toThrow(`Needs Craft Lv${level}`)
        let save = run(at(level), gather.id, raw, need, 0)
        expect(save.items[raw], raw).toBe(need)
        save = run(save, process.id, refined, need, 2)
        expect(save.items, refined).toEqual({ [refined]: need })
        save = run(save, make.id, made.id, 1, 4)
        expect(save.items, made.id).toEqual({ [made.id]: 1 })
        expect(save.umas[UMA]!.craft.level, made.id).toBeGreaterThanOrEqual(level)
      }
    })
  }

  it('makes every made item once over the five lines', () => {
    const made = MATERIAL_LINES.flatMap((line) => Array.from({ length: 10 }, (_, i) => madeAt(line, i + 1).id))
    expect(new Set(made).size).toBe(50)
    expect(made.sort()).toEqual(MADE_IDENTITIES.map((m) => m.id).sort())
  })
})
