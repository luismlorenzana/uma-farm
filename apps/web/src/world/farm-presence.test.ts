import { newLove, newRosterUma, newSave, STAND_IN_FILES, storyPackFrom, talentsD, type FarmSave } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { farmPresence } from './farm-presence'
import { currentTownDay } from './town-places'

const DAY = 3
const pack = storyPackFrom(STAND_IN_FILES)
const base = newSave('world', '2026-11-23T12:00:00.000Z')
const ids = (count: number) => Array.from({ length: count }, (_, index) => String(5000 + index))

describe('the world reads actual crew and household presence', () => {
  it.each([10, 20, 50])('projects %i workers once into their actual job region', count => {
    const cast = ids(count)
    const orders = ['water:0', 'forage:woods', 'fish:pond', 'care:coop', 'cook', 'load:mill']
    const jobs = cast.flatMap((id, index) => [
      { id, key: 'ship-surplus', actions: 1 },
      { id, key: orders[index % orders.length]!, actions: 2 },
    ])
    const save: FarmSave = {
      ...base, calendar: { ...base.calendar, day: DAY },
      today: { ...base.today, dayParts: true, crew: { jobs, worked: [], lines: [], gathered: [], tended: [], made: [] } },
      roster: Object.fromEntries(cast.map(id => [id, { ...newRosterUma(1), farmhand: 1 }])),
    }
    const { actors } = farmPresence(save, null, talentsD)
    expect(actors.size).toBe(count)
    expect([...actors.values()].slice(0, 6).map(actor => [actor.region, actor.door])).toEqual([
      ['farm', 'fields:0'], ['forest', 'forest:woods'], ['pond', 'fishery:pond'],
      ['barns', 'coop'], ['work', 'kitchen'], ['farm', 'mill'],
    ])
    expect([...actors.values()].every(actor => actor.outfit === 'farm-work' && !actor.planned)).toBe(true)
    expect(farmPresence({ ...save, today: { ...save.today, actions: 5 } }, null, talentsD).actors.size).toBe(0)
  })

  it('moves a resident to her assigned home at night and respects an expedition leaving today', () => {
    const id = pack.cast.umas[0]!.characterId
    const departing = pack.cast.umas[1]!.characterId
    const save: FarmSave = {
      ...base, calendar: { ...base.calendar, day: DAY },
      today: { ...base.today, dayParts: true, actions: 10 },
      homestead: { ...base.homestead, houses: [...base.homestead.houses, { name: 'Maple Lodge', extended: false }] },
      roster: { [id]: newRosterUma(1), [departing]: newRosterUma(1) },
      love: {
        [id]: { ...newLove(), stage: 'spouse', wed: 1, house: 1 },
        [departing]: { ...newLove(), stage: 'spouse', wed: 2, house: 0 },
      },
      expeditions: [{ region: 'old-fort-ruins', party: [departing], supplies: [], left: DAY, back: DAY + 2 }],
    }
    const { actors } = farmPresence(save, pack, talentsD)
    expect(actors.get(id)).toMatchObject({ door: 'house:1', outfit: 'pajamas' })
    expect(actors.has(departing)).toBe(false)
    expect(currentTownDay(save, pack).where.has(id)).toBe(false)
    expect(currentTownDay(save, pack).where.has(departing)).toBe(false)
  })
})
