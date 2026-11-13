// Farm Rank and chapter 1: the Farm Rank's thresholds and points, the Diary's
// milestones and rows paying once, chapter 1's goals from their counters and its completion at night with its authored
// arrival, and the two scenes playing once with Umas only in roles. Invented ids and an invented cast; the night runs with
// test kinds.
import { describe, expect, it } from 'vitest'
import { farmPointsOf, farmRankOpens, nextFarmRank, payDiary } from '../farm/diary'
import { FARM_RANK_POINTS, farmRankOf } from '../farm/farm'
import { DIARY_ROWS, MILESTONES, ROW_GOLD } from '../farm/milestones'
import type { Activity, Rank } from '../farm/ranks'
import type { MadeTonight } from '../gathering/kinds'
import { endDay, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { GOLD_SHIPPED } from '../save/bin'
import { parseSaveV4 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'
import type { Arrival, Calling, CastEntry } from './authored'
import { STAND_IN_CAST } from './authored.fixture'
import { CAST, CAST_IDS } from './cast'
import { CLOSING_SCENE, OPENING_SCENE, SCENES, sceneLines } from './chapter-1'
import { CHAPTER_1_GOALS, checkGoalsNight, depthsTonight, goalStates } from './chapters'
import { readScene, SCENE_IDS, sceneDue } from './scenes'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const entry = (characterId: string, calling: Calling, arrives: Arrival): CastEntry => ({ characterId, outfitId: `${characterId}01`, arrives, calling, paragraph: 'Invented.' })
/** An invented cast: the three on the farm, and 1030, chapter 1's authored arrival. */
const STORY: NonNullable<NightContext['story']> = {
  cast: {
    ...STAND_IN_CAST, opening: ['1001', '1002', '1003'],
    umas: [entry('1001', 'farming', { kind: 'opening' }), entry('1002', 'foraging', { kind: 'opening' }), entry('1003', 'fishing', { kind: 'opening' }),
      entry('1030', 'mining', { kind: 'chapter', chapter: 1 })],
  },
  bibles: new Map(), ties: { version: 1, ties: [] },
}
const CONTEXT: NightContext = { kinds: TEST_KINDS, story: STORY }
const night = (save: SaveV4) => endDay(save, CONTEXT, LATER)

/** The farmer named and the opening three home on `day`, their arrivals and the opening scene read, with `counts`. */
function farm(day = 1, counts: Record<string, number> = {}): SaveV4 {
  const save = newSave('u1', AT)
  const ids = ['1001', '1002', '1003']
  return {
    ...save, farmer: { name: 'Robin' }, calendar: { day }, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])),
    love: Object.fromEntries(ids.map((id) => [id, newLove()])), arrivals: ids,
    dorm: { level: 1, home: ids, swaps: [] }, diary: { ...save.diary, read: ['scene:1:open'] }, farm: { ...save.farm, counts },
  }
}
const ranked = (save: SaveV4, id: string, activity: Activity, rank: Rank): SaveV4 => ({
  ...save, roster: { ...save.roster, [id]: { ...save.roster[id]!, ranks: { ...save.roster[id]!.ranks, [activity]: { points: [0, 40, 160, 400, 900, 2000][rank]!, rank, challenge: 0 } } } },
})
/** Every goal of chapter 1 met but the Farm Rank: 9 harvested, 10,000g shipped, 10 home, two kinds, a Hand. */
const ready = (harvested = 9): SaveV4 => ranked({
  ...farm(7, { [GOLD_SHIPPED]: 10_000, 'plots-harvested': harvested, 'home:forest': 6, 'home:fishery': 4 }), crops: { carrot: 20, potato: 2 },
}, '1001', 'farming', 1)
const made = (kind: 'forage' | 'fish', item: string, items = 3): MadeTonight =>
  ({ outfitId: '1001', place: kind === 'forage' ? 'forest' : 'fishery', request: { kind, item, count: 1 }, items: Array.from({ length: items }, () => 'pine-log@1') })

describe('the Farm Rank', () => {
  it('reaches each rank at its threshold, never a point before', () => {
    FARM_RANK_POINTS.forEach((at, i) => {
      expect(farmRankOf(at)).toBe(i + 1)
      if (at > 0) expect(farmRankOf(at - 1)).toBe(i)
    })
    expect(farmRankOf(1e9)).toBe(10)
    expect(nextFarmRank(0)).toEqual({ rank: 2, points: 150 })
    expect(nextFarmRank(21_999)).toEqual({ rank: 10, points: 22_000 })
    expect(nextFarmRank(22_000)).toBeNull()
  })

  it('counts 1 a 100g shipped, 5 a good shipped once, 25 a milestone and 250 a chapter done', () => {
    const save: SaveV4 = {
      ...farm(1, { [GOLD_SHIPPED]: 12_399 }), diary: { shipped: { carrot: 9, carp: 1, tomato: 0 }, milestones: ['shipped:10000', 'row:vegetables'], records: {}, read: [] },
    }
    expect(farmPointsOf({ ...save, farm: { ...save.farm, chapter: 2 } })).toEqual({ shipped: 123, entries: 10, milestones: 25, chapters: 250, total: 408 })
    expect(farmPointsOf(newSave('u1', AT)).total).toBe(0)
  })

  it('opens what the rules gate on it: land, beds, seeds and stations', () => {
    expect(farmRankOpens(1)).toEqual(['Dorm level 2 (5 beds)']) // tier-1 seeds and Block A are the start's
    expect(farmRankOpens(2)).toEqual(['Block B (800g)', 'Dorm level 3 (7 beds)', 'New seeds at the shop'])
    expect(farmRankOpens(3)).toEqual(['Dorm level 4 (9 beds)', 'The Sawmill (1,500g)', 'The Smokehouse (2,000g)'])
    expect(farmRankOpens(4)).toEqual(['Block C (3,000g)', 'Dorm level 5 (11 beds)', 'New seeds at the shop'])
    expect(farmRankOpens(8).some((o) => o.startsWith('Dorm'))).toBe(false) // the Dorm for 20 tops out at level 8, Farm Rank 7
    expect(farmRankOpens(10)).toEqual(['The farm’s gold crest'])
  })

  it('is recomputed at night step 8 from the save, and a rank reached is news in the morning', () => {
    const save = { ...farm(3), bin: { carrot: [100, 0, 0, 0, 0] as [number, number, number, number, number] } }
    const morning = night(save)
    // 100 Carrots at 70g (Spring's demand) pay 7,000g: 70 points, and 5 for the entry.
    expect(morning.farm.points).toBe(75)
    expect(morning.summary!.news.filter((n) => n.kind === 'farm-rank')).toEqual([])
    const more = night({ ...morning, summary: null, bin: { 'emperor-pumpkin': [40, 0, 0, 0, 0] } })
    expect(farmRankOf(more.farm.points)).toBe(2)
    expect(more.summary!.news).toContainEqual({ kind: 'farm-rank', rank: 2 })
  })
})

describe('the Diary', () => {
  it('pays each milestone once, the night it is reached, with its gold', () => {
    const save = farm(2, { [GOLD_SHIPPED]: 10_000 })
    const once = payDiary(save)
    expect(once.paid).toEqual(['shipped:10000'])
    expect(once.save.gold).toBe(save.gold + 300)
    expect(payDiary(once.save).paid).toEqual([])
    expect(payDiary(once.save).save).toBe(once.save)
    // Every milestone id is unique.
    expect(new Set(MILESTONES.map((m) => m.id)).size).toBe(MILESTONES.length)
  })

  it('pays every milestone exactly once, however many come in one night', () => {
    const sixty = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [String(2001 + i), newRosterUma(1)]))
    const all = ranked({ ...farm(9, { [GOLD_SHIPPED]: 1_000_000 }), roster: { ...farm().roster, ...sixty }, crops: { carrot: 900 } }, '1001', 'mining', 5)
    const depths = new Set(MILESTONES.flatMap((m) => (m.kind === 'depth' ? [m.area] : [])))
    const once = payDiary(all, depths)
    expect(once.paid).toEqual(MILESTONES.map((m) => m.id))
    expect(once.save.gold).toBe(all.gold + MILESTONES.reduce((n, m) => n + m.gold, 0))
    expect(payDiary(once.save, depths).paid).toEqual([])
    expect(farmPointsOf(once.save).milestones).toBe(25 * MILESTONES.length)
  })

  it('pays a depth milestone for the Hills and none for the Woods or the Pond', () => {
    const depths = depthsTonight([made('forage', 'woods'), made('forage', 'hills'), made('fish', 'pond'), made('fish', 'river', 0)])
    expect([...depths].sort()).toEqual(['hills', 'pond', 'woods'])
    const { save, paid } = payDiary(farm(5), depths)
    expect(paid).toEqual(['depth:hills'])
    expect(save.gold).toBe(500 + 500)
    expect(payDiary(save, depths).paid).toEqual([])
  })

  it('pays the first rank reached in any activity, and the roster counted with its starters', () => {
    const five = { ...ranked(farm(4), '1002', 'fishing', 2), roster: { ...farm().roster, 1004: newRosterUma(3), 1005: newRosterUma(4) } }
    expect(payDiary(five).paid).toEqual(['recruited:5'])
    const skilled = ranked(farm(4), '1002', 'fishing', 2)
    expect(payDiary(skilled).paid).toEqual(['rank:hand', 'rank:skilled'])
    expect(payDiary(skilled).save.gold).toBe(500 + 300 + 600)
  })

  it('pays a crop at level 5 once, and level 10 apart', () => {
    expect(payDiary({ ...farm(), crops: { carrot: 199 } }).paid).toEqual([])
    expect(payDiary({ ...farm(), crops: { carrot: 200 } }).paid).toEqual(['crop-level:5'])
    expect(payDiary({ ...farm(), crops: { carrot: 900, mint: 1 } }).paid).toEqual(['crop-level:5', 'crop-level:10'])
  })

  it("pays a family's ten raw goods, and its ten refined ones, 500g once each", () => {
    const woods = DIARY_ROWS.find((r) => r.id === 'row:woods')!
    expect(woods.goods).toHaveLength(10)
    expect(DIARY_ROWS).toHaveLength(27)
    const nine = { ...farm(), diary: { ...farm().diary, shipped: Object.fromEntries(woods.goods.slice(0, 9).map((id) => [id, 1])) } }
    expect(payDiary(nine).paid).toEqual([])
    const ten = { ...nine, diary: { ...nine.diary, shipped: { ...nine.diary.shipped, [woods.goods[9]!]: 3 } } }
    const paid = payDiary(ten)
    expect(paid.paid).toEqual(['row:woods'])
    expect(paid.save.gold).toBe(500 + ROW_GOLD)
    expect(payDiary(paid.save).paid).toEqual([])
    // A row isn't a milestone: its goods are entries, 5 points each.
    expect(farmPointsOf(paid.save)).toMatchObject({ entries: 50, milestones: 0 })
  })
})

describe('chapter 1', () => {
  it('counts each goal from its counter, or the save', () => {
    const save = { ...farm(3, { 'plots-harvested': 4, [GOLD_SHIPPED]: 620, 'home:forest': 2, 'home:fishery': 1 }), crops: { carrot: 4 } }
    expect(goalStates(save)!.map((g) => [g.goal.id, g.have, g.done])).toEqual([
      ['harvest', 4, false], ['ship', 620, false], ['bring-home', 3, false], ['second-crop', 1, false], ['rank-hand', 0, false], ['farm-rank', 1, false],
    ])
    expect(goalStates(ready())!.filter((g) => !g.done).map((g) => g.goal.id)).toEqual(['farm-rank'])
    expect(CHAPTER_1_GOALS.map((g) => g.text)).toEqual([
      'Plant and harvest 9 crops', 'Ship 1,000g at the bin', 'Bring home 10 things from the Woods or the Pond', 'Grow a second kind of crop',
      'Rank an Uma up to Hand', 'Reach Farm Rank 2',
    ])
  })

  it('completes the night its last goal is met: 500g, the Mill\'s plans, its authored arrival and 250 points; chapter 2 opens', () => {
    const save = ready()
    const morning = night(save)
    // The night pays 10,000g's and Hand's milestones (300g each), reaching Farm Rank 2 (100 + 25 + 25 = 150), the last goal.
    expect(morning.farm.chapter).toBe(2)
    expect(morning.gold).toBe(500 + 300 + 300 + 500)
    expect(morning.buildings.mill).toBe(0)
    expect(morning.roster['1030']).toMatchObject({ joined: 8 })
    expect(morning.love['1030']).toBeDefined()
    expect(morning.dorm.home).not.toContain('1030') // three beds, all taken: she joins away
    expect(morning.summary!.hearts).toEqual([{ kind: 'arrived', id: '1030', home: false }])
    expect(morning.farm.points).toBe(150 + 250)
    expect(morning.farm.goals).toEqual(morning.farm.counts)
    expect(morning.summary!.news).toEqual([
      { kind: 'chapter', chapter: 1 }, { kind: 'farm-rank', rank: 2 }, { kind: 'milestone', id: 'shipped:10000' }, { kind: 'milestone', id: 'rank:hand' },
    ])
    expect(parseSaveV4(json(morning), 'save', TEST_KINDS)).toEqual(morning)
    // Chapter 2's goals come with the workshops: the Diary says Soon, and nothing completes again.
    expect(goalStates(morning)).toBeNull()
    expect(night({ ...morning, summary: null }).farm.chapter).toBe(2)
  })

  it('waits while a goal is short, and completes the night it is met', () => {
    const short = night(ready(8))
    expect(short.farm.chapter).toBe(1)
    expect(short.buildings.mill).toBeUndefined()
    expect(short.summary!.news).not.toContainEqual({ kind: 'chapter', chapter: 1 })
    // The ninth harvest comes in the day; that night completes it.
    const harvested = { ...short, summary: null, farm: { ...short.farm, counts: { ...short.farm.counts, 'plots-harvested': 9 } } }
    expect(night(harvested).farm.chapter).toBe(2)
  })

  it('pays no plans it already holds, and no arrival when the cast names none for the chapter', () => {
    const { save, tonight } = checkGoalsNight({ ...ready(), buildings: { ...ready().buildings, mill: 1 } }, [])
    expect(tonight.chapter).toBe(1)
    expect(save.buildings.mill).toBe(1)
    expect(Object.keys(save.roster)).toEqual(['1001', '1002', '1003'])
  })

  it('refuses a goal line it does not know', () => {
    const morning = night(ready())
    const bad = (line: unknown) => () => parseSaveV4(json({ ...morning, summary: { ...morning.summary!, news: [line] } }), 'save', TEST_KINDS)
    expect(bad({ kind: 'milestone', id: 'shipped:5' })).toThrow('unknown milestone')
    expect(bad({ kind: 'farm-rank', rank: 1 })).toThrow('expected 2–10')
    expect(bad({ kind: 'chapter', chapter: 9 })).toThrow('expected 1–8')
    expect(bad({ kind: 'chapter', chapter: 1, gold: 500 })).toThrow('unknown keys gold')
  })
})

describe('the scenes', () => {
  it('opens once the farmer is named, before day 1, once', () => {
    const fresh = newSave('u1', AT)
    expect(sceneDue(fresh)).toBeNull() // the farmer's name comes first
    const named = { ...fresh, farmer: { name: 'Robin' } }
    expect(sceneDue(named)).toBe('scene:1:open')
    const read = readScene(named, 'scene:1:open')
    expect(sceneDue(read)).toBeNull()
    expect(readScene(read, 'scene:1:open')).toBe(read)
    expect(read.diary.read).toEqual(['scene:1:open'])
  })

  it('closes the morning after the chapter, once the summary is put away, once', () => {
    const morning = night(ready())
    expect(sceneDue(morning)).toBeNull() // the summary first
    const put = { ...morning, summary: null }
    expect(sceneDue(put)).toBe('scene:1:close')
    // Then the chapter's arrival walks in with her own scene.
    expect(sceneDue(readScene(put, 'scene:1:close'))).toBe('arrival:1030')
    expect(SCENE_IDS.every((id) => SCENES[id].id === id)).toBe(true)
  })

  it('fills the newest hand\'s role with chapter 1\'s arrival, and drops it when nobody fills it', () => {
    expect(sceneLines(OPENING_SCENE, '1040').some((l) => l.speaker.kind === 'uma')).toBe(false)
    expect(sceneLines(CLOSING_SCENE, '1040').filter((l) => l.speaker.kind === 'uma')).toEqual([{ speaker: { kind: 'uma', outfitId: '1040' }, line: CLOSING_SCENE.beats[6]!.line }])
    expect(sceneLines(CLOSING_SCENE, null)).toHaveLength(CLOSING_SCENE.beats.length - 1)
  })

  it('holds no Uma name: Umas speak only in roles, and the only names filled in are {name} and {farmer}', () => {
    const texts = [...OPENING_SCENE.beats, ...CLOSING_SCENE.beats].map((b) => b.line)
    for (const beat of [...OPENING_SCENE.beats, ...CLOSING_SCENE.beats]) expect(['cast', 'newest-hand', 'narrator']).toContain(beat.speaker.kind)
    for (const text of texts) expect(text.replace(/\{name\}|\{farmer\}/g, '')).not.toMatch(/[{}]/)
    // Every capitalised word is the cast's, a place or good of the farm's, or plain English: a name from master data
    // would be none of these.
    const cast = CAST_IDS.flatMap((id) => CAST[id].name.split(' '))
    const farmWords = ['Umas', 'Carrot', 'Gate', 'Fields', 'Ben', 'Old']
    const english = ['Morning', 'The', 'Welcome', 'I', 'This', 'Here', 'A', 'Tap', 'And', 'Anything', 'Word', 'Keep', 'Build', 'May', 'That', 'He', 'You', 'Three',
      'Marta']
    const allowed = new Set([...cast, ...farmWords, ...english])
    const words = texts.flatMap((t) => t.match(/\b[A-Z][a-z]*/g) ?? [])
    expect(words.filter((w) => !allowed.has(w))).toEqual([])
  })
})
