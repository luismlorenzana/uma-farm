// The roster after the Dorm (F95): everyone you meet lives in town, and only a spouse in her room lives on the farm. A
// save from before keeps the Dorm's shape: loading clears who was home and the swaps, never stamps the save and changes
// nothing else; a morning's Dorm news is read and dropped. Invented ids; the night runs with no story pack.
import { describe, expect, it } from 'vitest'
import { buildSummary, endDay, runNight, type Night, type NightContext } from '../night/end-day'
import { meet } from '../romance/meeting'
import { parseSaveV6 } from '../save/parse-v4'
import { atHome, farmHome, newLove, newRosterUma, newSave, onFarm, type SaveV4 } from '../save/v4'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const CONTEXT: NightContext = {}

/** `ids` on the roster with their routes begun, on `day`. */
function farm(ids: readonly string[], day = 1): SaveV4 {
  const save = newSave('u1', AT)
  return { ...save, calendar: { day }, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])), love: Object.fromEntries(ids.map((id) => [id, newLove()])) }
}

describe('a save from before the Dorm retired', () => {
  // As the owner's farm stood: one Uma in the Dorm at Friendship 0, not a farmhand, the Dorm at level 1 with nothing
  // bought; and, to be sure, a farm with a level bought, a farmhand in a bed, a swap waiting and a spouse in her room.
  const owner = { ...farm(['1001', '1002'], 9), dorm: { level: 1, home: ['1001'], swaps: [] } }
  const busy: SaveV4 = {
    ...farm(['1001', '1002', '1003', '1004'], 30),
    roster: { '1001': { ...newRosterUma(1), farmhand: 5, tasks: [{ kind: 'forage', area: 'woods' }] }, '1002': newRosterUma(1), '1003': newRosterUma(2), '1004': newRosterUma(3) },
    love: { '1001': newLove(), '1002': newLove(), '1003': newLove(), '1004': { ...newLove(), stage: 'spouse', level: 1, wed: 20, house: 0 } },
    buildings: { dorm: 2 }, dorm: { level: 2, home: ['1001', '1002'], swaps: [{ out: '1002', in: '1003' }] },
    homestead: { ...newSave('u1', AT).homestead, married: 1 },
  }

  it('loads with everyone who lived in the Dorm living in town: account.updatedAt unchanged, and nothing else changed', () => {
    for (const stored of [owner, busy]) {
      const raw = json(stored)
      const loaded = parseSaveV6(raw)
      expect(loaded.dorm).toEqual({ level: stored.dorm.level, home: [], swaps: [] })
      expect(loaded.account).toEqual(stored.account)
      expect(loaded.account.updatedAt).toBe(AT)
      // Nothing else in the save moved: the roster (her ladders, ranks, farmhand flag, board), love, the Dorm's level.
      expect({ ...loaded, dorm: stored.dorm }).toEqual(stored)
      expect(raw).toEqual(json(stored))
      for (const id of stored.dorm.home) expect(atHome(loaded, id), id).toBe(false)
    }
  })

  it('keeps the Dorm level and the level bought, and still refuses a level above it', () => {
    const loaded = parseSaveV6(json(busy))
    expect(loaded.dorm.level).toBe(2)
    expect(loaded.buildings.dorm).toBe(2)
    expect(() => parseSaveV6(json({ ...busy, dorm: { ...busy.dorm, level: 3 } }))).toThrow('save.dorm.level')
    expect(() => parseSaveV6(json({ ...busy, dorm: { ...busy.dorm, home: 'x' } }))).toThrow('save.dorm.home')
  })

  it('has only the spouse in her room on the farm', () => {
    const loaded = parseSaveV6(json(busy))
    expect(farmHome(loaded)).toEqual(['1004'])
    expect(['1001', '1002', '1003', '1004'].map((id) => onFarm(loaded, id))).toEqual([false, false, false, true])
  })
})

describe('meeting her', () => {
  it('names anyone who joined in the night in the morning\'s Hearts (the night meets nobody now); met, she lives in town', () => {
    const save = farm(['1001', '1002'], 2)
    // A stand-in for a night's arrivals: two join, each living in town.
    const arrivals = { run: (n: Night) => ({ ...n, save: meet(meet(n.save, '1030').save, '1031').save }) }
    const morning = runNight(save, CONTEXT, [arrivals, { run: buildSummary }])
    expect(morning.summary!.hearts).toEqual([{ kind: 'arrived', id: '1030', home: false }, { kind: 'arrived', id: '1031', home: false }])
    expect(farmHome(morning)).toEqual([])
    expect(morning.dorm).toEqual({ level: 1, home: [], swaps: [] })
    expect(parseSaveV6(json(morning))).toEqual(morning)
  })
})

describe('the morning\'s retired Dorm news', () => {
  it('is read strictly and dropped: a level 2–8, Umas on the roster; the old roster kinds are refused', () => {
    const morning = endDay(farm(['1001']), CONTEXT, LATER)
    const news = (...lines: unknown[]) => () => parseSaveV6(json({ ...morning, summary: { ...morning.summary!, news: lines } }))
    expect(news({ kind: 'dorm', level: 1 })).toThrow('save.summary.news.0.level')
    expect(news({ kind: 'dorm', level: 9 })).toThrow('save.summary.news.0.level')
    expect(news({ kind: 'home', umas: ['1002'] })).toThrow('save.summary.news.0.umas.0')
    for (const kind of ['joined', 'gate', 'left']) expect(news({ kind, outfitId: '1001' }), kind).toThrow('save.summary.news.0.kind')
    expect(news({ kind: 'dorm', level: 8 }, { kind: 'home', umas: ['1001'] }, { kind: 'season', season: 'spring' })().summary!.news).toEqual([{ kind: 'season', season: 'spring' }])
  })
})
