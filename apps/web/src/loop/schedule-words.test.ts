// Where to find her, in words: her fixed schedule's days and places on her profile, a farmhand's farm days and town
// days, a spouse in her room on the farm, and who's in town on a calendar day. Invented ids and an invented pack only.
import { farmDay, newLove, newRosterUma, newSave, readStoryPack, storyOf, type SaveV4 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { daysWords, farmhandLines, findHer, seasonLines, townRows } from './schedule-words'

const AT = '2026-11-14T10:00:00.000Z'
const MASTER = { outfits: new Map(['9300001', '9300002', '9300003', '9300004'].map((id) => [id, `${id}01`])), lines: new Map<string, never>() }
const PACK = storyOf(readStoryPack({
  umas: {}, routes: {}, ties: { ties: [] },
  cast: {
    umas: [
      { characterId: '9300001', spot: 'cafe' },
      { characterId: '9300002', home: 'rose-cottage', job: { what: 'Bakes bread', at: 'bakery', days: [1, 2, 3, 4, 5, 6] }, routine: [{ at: 'library', days: [9] }] },
      { characterId: '9300003' },
    ],
  },
  town: { locations: [{ id: 'rose-cottage', name: 'Rose Cottage', kind: 'home' }, { id: 'bakery', name: 'The Bakery', kind: 'work' }] },
}).pack, MASTER)
/** The same town with a fourth Uma at work every day: a season her schedule leaves without a farm day. */
const BUSY = storyOf(readStoryPack({
  umas: {}, routes: {}, ties: { ties: [] },
  cast: {
    umas: [
      { characterId: '9300001', spot: 'cafe' }, { characterId: '9300002' }, { characterId: '9300003' },
      { characterId: '9300004', job: { what: 'Keeps the shop', at: 'bakery' } },
    ],
  },
  town: { locations: [{ id: 'bakery', name: 'The Bakery', kind: 'work' }] },
}).pack, MASTER)
const save = (day: number, more: Partial<SaveV4> = {}): SaveV4 => ({ ...newSave('u1', AT), calendar: { day }, ...more })
const hand = (day: number, id: string): SaveV4 => save(day, { roster: { [id]: { ...newRosterUma(1), farmhand: 1 } }, love: { [id]: { ...newLove(), level: 3 } } })

describe('where to find her', () => {
  it('says days in few words: runs of three or more as ranges', () => {
    expect(daysWords([1, 4, 7, 10])).toBe('1, 4, 7, 10')
    expect(daysWords([1, 2, 3, 4, 5, 6, 9, 11, 12])).toBe('1–6, 9, 11, 12')
  })

  it('reads her season: the default schedule\'s ten days, or the story\'s places, home the other days', () => {
    expect(seasonLines(PACK, '9300001', 'spring').map((l) => l.text)).toEqual(['The Café · 1, 4, 7, 10, 13, 16, 19, 22, 25, 28', 'The Harbour Inn · the other days'])
    expect(seasonLines(PACK, '9300002', 'spring').map((l) => l.text)).toEqual(['The Bakery, at work · 1–6', 'The Library · 9', 'The Harbour Inn · the other days'])
    // The third in the cast, no spot of her own: the Plaza, from day 3.
    expect(seasonLines(PACK, '9300003', 'winter').map((l) => l.text)).toEqual(['The Plaza · 3, 6, 9, 12, 15, 18, 21, 24, 27, 30', 'The Harbour Inn · the other days'])
  })

  it('today: where she is, or when she\'s next out; a farmhand on the farm on her farm days, in town on her town days', () => {
    expect(findHer(save(1), PACK, '9300001')).toMatchObject({ today: 'The Café', at: 'cafe', season: 'Spring', farm: false })
    expect(findHer(save(2), PACK, '9300001')).toMatchObject({ today: 'The Harbour Inn', at: 'harbour-inn' })
    expect(findHer(save(2), PACK, '9300002')).toMatchObject({ today: 'The Bakery, at work', at: 'bakery' })
    // A farmhand: her farm days are the days her schedule leaves free; her town days, her place in town.
    const days = [{ at: 'farm', text: 'On the farm · 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30' }, { at: 'cafe', text: 'The Café · 1, 4, 7, 10, 13, 16, 19, 22, 25, 28' }]
    expect(findHer(hand(2, '9300001'), PACK, '9300001')).toEqual({ today: 'On the farm', at: null, season: 'Spring', lines: days, farm: true })
    expect(findHer(hand(4, '9300001'), PACK, '9300001')).toEqual({ today: 'The Café', at: 'cafe', season: 'Spring', lines: days, farm: false })
    // Her job and her routine are her town days; a day at her home in town is a farm day.
    expect(farmhandLines(PACK, '9300002', 'spring').map((l) => l.text)).toEqual(['On the farm · 7, 8, 10–30', 'The Bakery, at work · 1–6', 'The Library · 9'])
    expect(findHer(hand(7, '9300002'), PACK, '9300002')).toMatchObject({ today: 'On the farm', farm: true })
    expect(findHer(hand(9, '9300002'), PACK, '9300002')).toMatchObject({ today: 'The Library', at: 'library', farm: false })
    // A season her schedule leaves without a farm day: the default schedule's other days.
    expect(farmhandLines(BUSY, '9300004', 'spring').map((l) => l.text)).toEqual(['On the farm · 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30', 'The Bakery, at work · 1, 4, 7, 10, 13, 16, 19, 22, 25, 28'])
    // A spouse in her room lives on the farm, every day.
    const wed = save(4, { roster: { 9300001: newRosterUma(1) }, love: { 9300001: { ...newLove(), stage: 'spouse', level: 1, wed: 2, house: 0 } } })
    expect(findHer(wed, PACK, '9300001')).toEqual({ today: 'On the farm', at: null, season: 'Every day', lines: [{ at: null, text: 'She lives on the farm' }], farm: true })
  })

  it('lists who\'s in town on a calendar day, by place in the map\'s order, met first; nobody on the farm', () => {
    const day = farmDay({ year: 1, season: 'spring', day: 1 })
    expect(townRows(save(day), PACK, day)).toEqual([
      { at: 'cafe', name: 'The Café', ids: ['9300001'] }, { at: 'bakery', name: 'The Bakery', ids: ['9300002'] },
      { at: 'harbour-inn', name: 'The Harbour Inn', ids: ['9300003'] },
    ])
    // A spouse in her room is on the farm, never in town.
    const home = save(day, { roster: { 9300001: newRosterUma(1) }, love: { 9300001: { ...newLove(), stage: 'spouse', level: 1, wed: 1, house: 0 } } })
    expect(townRows(home, PACK, day).map((r) => r.at)).toEqual(['bakery', 'harbour-inn'])
    // A farmhand is in town on her town day (Spring 1, at the Café), and off the map on her farm day (Spring 2's Bakery).
    expect(townRows(hand(day, '9300001'), PACK, day).map((r) => [r.at, r.ids])).toEqual([['cafe', ['9300001']], ['bakery', ['9300002']], ['harbour-inn', ['9300003']]])
    expect(townRows(hand(7, '9300002'), PACK, 7).flatMap((r) => r.ids)).not.toContain('9300002')
    expect(townRows(hand(6, '9300002'), PACK, 6).map((r) => [r.at, r.ids])).toContainEqual(['bakery', ['9300002']])
    expect(townRows(save(day), PACK, farmDay({ year: 1, season: 'spring', day: 3 })).map((r) => [r.at, r.ids])).toEqual([['plaza', ['9300003']], ['bakery', ['9300002']], ['harbour-inn', ['9300001']]])
  })
})
