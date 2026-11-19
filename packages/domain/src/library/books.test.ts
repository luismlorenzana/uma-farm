import { describe, expect, it } from 'vitest'
import { GAME_DAYS } from '../farm/actions'
import { readHousehold } from '../romance/household'
import { parseSaveV5 } from '../save/parse-v4'
import type { SavePut } from '../save/save'
import { newLove, newRosterUma, newSave, type FarmSave } from '../save/v4'
import { castPack } from '../story/authored.fixture'
import { festivalsOf } from '../story/placeholders'
import { archivedDiscoveries, bookDiscoveries, bookHistory, bookScenes, finishLibraryChanges } from './books'
import { recordLibrary } from './receipts'

const AT = '2026-11-19T12:00:00.000Z'
const HER = '9000101'
const OTHER = '9000102'
const farm = (ids: readonly string[], day: number): FarmSave => ({
  ...newSave('library-proof', AT), calendar: { day }, farmer: { name: 'Robin' },
  roster: Object.fromEntries(ids.map(id => [id, newRosterUma(1)])),
  love: Object.fromEntries(ids.map(id => [id, newLove()])),
})
const copy = (save: FarmSave): FarmSave => JSON.parse(JSON.stringify(save))

describe('Uma Library evidence', () => {
  it('reads old route, diary and art intact and archives withdrawn receipts after a release', () => {
    const base = castPack([HER])
    const original = { ...base, scripted: new Map([[HER, new Set(['flower-show-night'])]]),
      bibles: new Map([[HER, { characterId: HER, profileFacts: [{ id: 'kite', text: 'She mends kites.', reveal: 'met' as const }] }]]) }
    const legacy: FarmSave = { ...farm([HER], 66), arrivals: [HER], memories: { [HER]: ['f1', 'f2'] },
      love: { [HER]: { ...newLove(), last: 40 } }, gallery: { [HER]: ['orchard'] } }
    const snapshot = copy(legacy)
    const old = bookScenes(legacy, base, HER, GAME_DAYS)
    expect(old.find(scene => scene.key === 'route:f1')).toMatchObject({ earned: true, variants: [{ day: null }] })
    expect(old.find(scene => scene.key === 'route:f2')).toMatchObject({ earned: true, variants: [{ day: 40 }] })
    expect(bookHistory(legacy, HER).recent).toEqual([])
    expect(finishLibraryChanges(legacy, legacy, original, GAME_DAYS)).toBe(legacy)
    expect(parseSaveV5(snapshot)).toEqual(legacy)

    let save = recordLibrary(legacy, HER, 'occasion:day:flower-show:flower-show:festival', { day: 10, activity: 'occasion:day:flower-show' })
    save = recordLibrary(save, HER, 'occasion:night:flower-show-night:flower-show-night:festival-night', { day: 10, activity: 'occasion:night:flower-show-night' })
    save = recordLibrary(save, HER, 'fact:note:kite', { day: 1 })
    const moved = { ...GAME_DAYS, festivals: festivalsOf(base).map(f => f.rule === 'flower-show' ? { ...f, day: 11, name: 'Bloom Fair' } : f) }
    const catalogue = bookScenes(parseSaveV5(copy(save)), base, HER, moved)
    expect(catalogue.find(scene => scene.key === 'occasion:day:flower-show')).toMatchObject({ title: 'Bloom Fair', earned: true, variants: [{ day: 10 }] })
    expect(catalogue.find(scene => scene.group === 'archive')).toMatchObject({ day: 10, earned: true, variants: [] })
    expect(archivedDiscoveries(save, HER, bookDiscoveries(save, base, HER, moved))).toEqual([
      { key: 'fact:note:kite', title: 'Archived discovery', day: 1, value: null },
    ])
  })

  it('keeps a completed group scene on the actual cast and keeps a skipped scene out of each book', () => {
    const base = castPack([HER, OTHER])
    const save = { ...farm([HER, OTHER], 76), homestead: { ...newSave('house', AT).homestead, married: 5 },
      love: { [HER]: { ...newLove(), stage: 'spouse' as const, wed: 60 }, [OTHER]: { ...newLove(), stage: 'spouse' as const, wed: 62 } } }
    const played = readHousehold(save, 'household:5', [HER])
    expect(bookScenes(played, base, HER, GAME_DAYS).find(scene => scene.key === 'shared:household:5')).toMatchObject({ earned: true, variants: [{ day: 76 }] })
    expect(bookScenes(played, base, OTHER, GAME_DAYS).some(scene => scene.group === 'shared')).toBe(false)
    expect(bookScenes(readHousehold(save, 'household:5'), base, HER, GAME_DAYS).some(scene => scene.group === 'shared')).toBe(false)
  })

  it('round-trips 50 books across devices with years of results and a bounded journal', () => {
    const ids = Array.from({ length: 50 }, (_, i) => String(9000101 + i))
    let save = farm(ids, 577)
    let entries = 0
    for (let day = 1; day <= 576; day++) {
      // Two actual evening slots per day on a large farm. Rotate the people and simulate years of occasions, too.
      for (const id of ids.slice((day * 2) % 50, (day * 2) % 50 + 2)) {
        save = recordLibrary(save, id, 'evening:fishing:date', { day, activity: 'evening:fishing', score: day % 3 ? 75 : 96 })
      }
      const date = (day - 1) % 48 + 1
      const occasion = date === 10 ? ['day:flower-show', 'flower-show:festival'] : date === 22 ? ['night:fishing-derby-night', 'derby-night:festival-night']
        : date === 1 && day > 1 ? ['day:new-year', 'new-year:new-year'] : null
      if (occasion) for (const id of ids) {
        save = recordLibrary(save, id, `occasion:${occasion[0]}:${occasion[1]}`, { day, activity: `occasion:${occasion[0]}` })
        entries++
      }
    }
    const upload: SavePut = { baseRevision: 18, save }
    const wire = JSON.stringify(upload)
    expect(entries).toBe(1750)
    expect(Buffer.byteLength(wire)).toBeLessThan(250_000)
    const second = parseSaveV5(JSON.parse(wire).save)
    expect(second).toEqual(save)
    expect(bookHistory(second, HER).recent).toHaveLength(32)
    expect(bookHistory(second, HER).totals['occasion:day:flower-show']).toEqual([12, 10, 538, null])
    expect(bookHistory(second, HER).totals['evening:fishing']?.[3]).toBe(96)
    expect(() => parseSaveV5({ ...copy(save), library: { outsider: save.library![HER] } })).toThrow()
    const damaged = copy(save)
    damaged.library![HER]!.recent[0]![0] = 578
    expect(() => parseSaveV5(damaged)).toThrow()
  })
})
