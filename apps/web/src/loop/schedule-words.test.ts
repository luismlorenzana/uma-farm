// Where to find her, in words: her fixed schedule's days and places on her profile, a farmhand on the farm by day, and
// who's in town on a calendar day. Invented ids and an invented pack only.
import { farmDay, newRosterUma, newSave, readStoryPack, storyOf, type SaveV4 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { daysWords, findHer, seasonLines, townRows } from './schedule-words'

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
const save = (day: number, more: Partial<SaveV4> = {}): SaveV4 => ({ ...newSave('u1', AT), calendar: { day }, ...more })

describe('where to find her', () => {
  it('says days in few words: runs of three or more as ranges', () => {
    expect(daysWords([1, 4, 7, 10])).toBe('1, 4, 7, 10')
    expect(daysWords([1, 2, 3, 4, 5, 6, 9, 11, 12])).toBe('1–6, 9, 11, 12')
  })

  it('reads her season: the default schedule\'s four days, or the story\'s places, home the other days', () => {
    expect(seasonLines(PACK, '9300001', 'spring').map((l) => l.text)).toEqual(['The Café · 1, 4, 7, 10', 'At home · the other days'])
    expect(seasonLines(PACK, '9300002', 'spring').map((l) => l.text)).toEqual(['The Bakery, at work · 1–6', 'The Library · 9', 'Rose Cottage · the other days'])
    // The third in the cast, no spot of her own: the Plaza, from day 3.
    expect(seasonLines(PACK, '9300003', 'winter').map((l) => l.text)).toEqual(['The Plaza · 3, 6, 9, 12', 'At home · the other days'])
  })

  it('today: where she is, or when she\'s next out; a farmhand on the farm by day, after her job', () => {
    expect(findHer(save(1), PACK, '9300001')).toMatchObject({ today: 'The Café', at: 'cafe', season: 'Spring', farm: false })
    expect(findHer(save(2), PACK, '9300001')).toMatchObject({ today: 'At home · next out Spring 4', at: null })
    expect(findHer(save(2), PACK, '9300002')).toMatchObject({ today: 'The Bakery, at work', at: 'bakery' })
    const hand = save(2, { roster: { 9300001: { ...newRosterUma(1), farmhand: 1 } } })
    expect(findHer(hand, PACK, '9300001')).toMatchObject({ today: 'On the farm', farm: true, lines: [{ at: null, text: 'On the farm by day, after her job: Helps out at the Café' }] })
  })

  it('lists who\'s in town on a calendar day, by place in the map\'s order, met first; nobody on the farm', () => {
    const day = farmDay({ year: 1, season: 'spring', day: 1 })
    expect(townRows(save(day), PACK, day)).toEqual([
      { at: 'cafe', name: 'The Café', ids: ['9300001'] }, { at: 'bakery', name: 'The Bakery', ids: ['9300002'] },
    ])
    const home = save(day, { roster: { 9300001: newRosterUma(1) }, dorm: { level: 1, home: ['9300001'], swaps: [] } })
    expect(townRows(home, PACK, day).map((r) => r.at)).toEqual(['bakery'])
    expect(townRows(save(day), PACK, farmDay({ year: 1, season: 'spring', day: 3 })).map((r) => [r.at, r.ids])).toEqual([['plaza', ['9300003']], ['bakery', ['9300002']]])
  })
})
