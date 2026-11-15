// The nudge: the day's actions left, the dry and ripe tiles; "All set" once the actions are spent.
import { describe, expect, it } from 'vitest'
import { plantTile, tillTile } from '../fields/fields'
import { fieldTiles, bareTile, newSave, START_CLEAR, type SaveV4 } from '../save/v4'
import { daySetState } from './nudge'

const AT = '2026-11-09T10:00:00.000Z'
const farm = (): SaveV4 => newSave('u1', AT)

describe('the nudge', () => {
  it('counts the actions left, and reads "All set" once they\'re spent', () => {
    expect(daySetState(farm())).toEqual({ allSet: false, left: 10, dry: 0, ripe: 0 })
    const spent = { ...farm(), today: { ...farm().today, actions: 10 } }
    expect(daySetState(spent)).toEqual({ allSet: true, left: 0, dry: 0, ripe: 0 })
  })

  it('counts the dry growing tiles and the ripe ones', () => {
    const [a, b] = START_CLEAR
    const planted = plantTile(tillTile(farm(), a!), a!, 'seed-carrot')
    const ripe = { ...planted, fields: { plots: [{ tiles: fieldTiles(planted).map((t, i) => (i === b ? { ...bareTile('tilled'), crop: 'carrot' as const, growth: 4, ready: true } : t)) }] } }
    expect(daySetState(ripe)).toEqual({ allSet: false, left: 8, dry: 1, ripe: 1 })
  })
})
