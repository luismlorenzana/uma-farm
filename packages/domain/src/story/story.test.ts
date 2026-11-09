// Farm Rank and chapter 1 (F24; core spec CS38, CS39, CS41, CS42): the Farm Rank's thresholds and points, the Diary's
// milestones and rows paying once, chapter 1's goals from their counters and its completion at night, and the two scenes
// playing once with Umas only in roles. Invented outfit ids with chosen talents; the night runs with test kinds.
import { describe, expect, it } from 'vitest'
import { farmPointsOf, farmRankOpens, nextFarmRank, payDiary } from '../farm/diary'
import { FARM_RANK_POINTS, farmRankOf } from '../farm/farm'
import { DIARY_ROWS, MILESTONES, ROW_GOLD } from '../farm/milestones'
import type { Activity, Rank } from '../farm/ranks'
import { TEMPERAMENTS, type TalentOf, type TalentStep } from '../farm/talents'
import type { MadeTonight } from '../gathering/kinds'
import { endDay, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { GOLD_SHIPPED } from '../save/bin'
import { parseSaveV3 } from '../save/parse-v3'
import { newRosterUma, newSave, type SaveV3 } from '../save/v3'
import { CAST, CAST_IDS } from './cast'
import { CLOSING_SCENE, firstHands, HELLO_LINES, newestHand, OPENING_SCENE, SCENES, sceneLines } from './chapter-1'
import { CHAPTER_1_GOALS, checkGoalsNight, depthsTonight, goalStates } from './chapters'
import { readScene, SCENE_IDS, sceneDue } from './scenes'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** An invented release of 40 outfits, 1001–1040: everyone D, except the few given talents. */
const RELEASE = Array.from({ length: 40 }, (_, i) => String(1001 + i))
const talents = (table: Readonly<Record<string, Partial<Record<Activity, TalentStep>>>>): TalentOf => (id, activity) => table[id]?.[activity] ?? 3
/** 1030 is the only C or better in anything: chapter 1's recruit. */
const TALENTS = talents({ 1030: { farming: 4, foraging: 4, fishing: 4 } })
const CONTEXT: NightContext = { roster: RELEASE.map((outfitId) => ({ outfitId, trade: 'physical', line: 'wood' as const })), kinds: TEST_KINDS, talentOf: TALENTS }
const night = (save: SaveV3) => endDay(save, CONTEXT, LATER)

/** The start's three home on `day`, the opening scene read, with `counts`. */
function farm(day = 1, counts: Record<string, number> = {}): SaveV3 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: { 1001: newRosterUma(1), 1002: newRosterUma(1), 1003: newRosterUma(1) },
    dorm: { level: 1, home: ['1001', '1002', '1003'], swaps: [] }, diary: { ...save.diary, read: ['scene:1:open'] }, farm: { ...save.farm, counts },
  }
}
const ranked = (save: SaveV3, id: string, activity: Activity, rank: Rank): SaveV3 => ({
  ...save, roster: { ...save.roster, [id]: { ...save.roster[id]!, ranks: { ...save.roster[id]!.ranks, [activity]: { points: [0, 40, 160, 400, 900, 2000][rank]!, rank, challenge: 0 } } } },
})
/** Every goal of chapter 1 met but the Farm Rank: 9 harvested, 10,000g shipped, 10 home, two kinds, a Hand. */
const ready = (harvested = 9): SaveV3 => ranked({
  ...farm(7, { [GOLD_SHIPPED]: 10_000, 'plots-harvested': harvested, 'home:forest': 6, 'home:fishery': 4 }), crops: { carrot: 20, potato: 2 },
}, '1001', 'farming', 1)
const made = (kind: 'forage' | 'fish', item: string, items = 3): MadeTonight =>
  ({ outfitId: '1001', place: kind === 'forage' ? 'forest' : 'fishery', request: { kind, item, count: 1 }, items: Array.from({ length: items }, () => 'pine-log@1') })

describe('the Farm Rank (CS39; decision 1)', () => {
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
    const save: SaveV3 = {
      ...farm(1, { [GOLD_SHIPPED]: 12_399 }), diary: { shipped: { carrot: 9, carp: 1, tomato: 0 }, milestones: ['shipped:10000', 'row:vegetables'], records: {}, read: [] },
    }
    expect(farmPointsOf({ ...save, farm: { ...save.farm, chapter: 2 } })).toEqual({ shipped: 123, entries: 10, milestones: 25, chapters: 250, total: 408 })
    expect(farmPointsOf(newSave('u1', AT)).total).toBe(0)
  })

  it('opens what the rules gate on it: land, beds, seeds and stations', () => {
    expect(farmRankOpens(1)).toEqual(['Dorm level 2 (5 beds)']) // tier-1 seeds and Block A are the start's
    expect(farmRankOpens(2)).toEqual(['Block B (800g)', 'Dorm level 3 (8 beds)', 'New seeds at the shop'])
    expect(farmRankOpens(3)).toEqual(['Dorm level 4 (12 beds)', 'The Sawmill (1,500g)', 'The Smokehouse (2,000g)'])
    expect(farmRankOpens(4)).toEqual(['Block C (3,000g)', 'Dorm level 5 (16 beds)', 'New seeds at the shop'])
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

describe('the Diary (CS38; decisions 2 and 3)', () => {
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
    expect(DIARY_ROWS).toHaveLength(26)
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

describe('chapter 1 (CS42; decisions 4 and 5)', () => {
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

  it('completes the night its last goal is met: 500g, the Mill\'s plans, a recruit and 250 points; chapter 2 opens', () => {
    const save = ready()
    const morning = night(save)
    // The night pays 10,000g's and Hand's milestones (300g each), reaching Farm Rank 2 (100 + 25 + 25 = 150), the last goal.
    expect(morning.farm.chapter).toBe(2)
    expect(morning.gold).toBe(500 + 300 + 300 + 500)
    expect(morning.buildings.mill).toBe(0)
    expect(morning.roster['1030']).toMatchObject({ joined: 8 })
    expect(morning.dorm.home).not.toContain('1030') // three beds, all taken: she joins away
    expect(morning.farm.points).toBe(150 + 250)
    expect(morning.farm.goals).toEqual(morning.farm.counts)
    expect(morning.summary!.news.slice(0, 5)).toEqual([
      { kind: 'chapter', chapter: 1 }, { kind: 'farm-rank', rank: 2 }, { kind: 'milestone', id: 'shipped:10000' }, { kind: 'milestone', id: 'rank:hand' },
      { kind: 'joined', outfitId: '1030', home: false },
    ])
    expect(parseSaveV3(json(morning), 'save', TEST_KINDS)).toEqual(morning)
    // Chapter 2's goals come with M5: the Diary says Soon, and nothing completes again.
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

  it('pays no plans it already holds, and no recruit when the release has none left', () => {
    const { save, tonight } = checkGoalsNight({ ...ready(), buildings: { ...ready().buildings, mill: 1 } }, ['1001', '1002', '1003'], TALENTS, [])
    expect(tonight.chapter).toBe(1)
    expect(save.buildings.mill).toBe(1)
    expect(Object.keys(save.roster)).toEqual(['1001', '1002', '1003'])
  })

  it('refuses a goal line it does not know', () => {
    const morning = night(ready())
    const bad = (line: unknown) => () => parseSaveV3(json({ ...morning, summary: { ...morning.summary!, news: [line] } }), 'save', TEST_KINDS)
    expect(bad({ kind: 'milestone', id: 'shipped:5' })).toThrow('unknown milestone')
    expect(bad({ kind: 'farm-rank', rank: 1 })).toThrow('expected 2–10')
    expect(bad({ kind: 'chapter', chapter: 9 })).toThrow('expected 1–8')
    expect(bad({ kind: 'chapter', chapter: 1, gold: 500 })).toThrow('unknown keys gold')
  })
})

describe('the scenes (CS42; decisions 6 and 7)', () => {
  it('opens once the start is picked, before day 1, once', () => {
    const fresh = newSave('u1', AT)
    expect(sceneDue(fresh)).toBeNull() // the start's picks come first
    const picked = { ...farm(), diary: { ...fresh.diary, read: [] } }
    expect(sceneDue(picked)).toBe('scene:1:open')
    const read = readScene(picked, 'scene:1:open')
    expect(sceneDue(read)).toBeNull()
    expect(readScene(read, 'scene:1:open')).toBe(read)
    expect(read.diary.read).toEqual(['scene:1:open'])
  })

  it('closes the morning after the chapter, once the summary is put away, once', () => {
    const morning = night(ready())
    expect(sceneDue(morning)).toBeNull() // the summary first
    const put = { ...morning, summary: null }
    expect(sceneDue(put)).toBe('scene:1:close')
    expect(sceneDue(readScene(put, 'scene:1:close'))).toBeNull()
    expect(SCENE_IDS.every((id) => SCENES[id].id === id)).toBe(true)
  })

  it('fills the roles from the roster: the first hands by joining, the newest hand, each hello by temperament', () => {
    const save = { ...farm(), roster: { ...farm().roster, 1001: newRosterUma(2), 1040: newRosterUma(8), 1020: newRosterUma(1) } }
    expect(firstHands(save)).toEqual(['1002', '1003', '1020'])
    expect(newestHand(save)).toBe('1040')
    const lines = sceneLines(OPENING_SCENE, save, (id) => (id === '1002' ? 'bold' : 'clever'))
    expect(lines.filter((l) => l.speaker.kind === 'uma')).toEqual([
      { speaker: { kind: 'uma', outfitId: '1002' }, line: HELLO_LINES.bold },
      { speaker: { kind: 'uma', outfitId: '1003' }, line: HELLO_LINES.clever },
      { speaker: { kind: 'uma', outfitId: '1020' }, line: HELLO_LINES.clever },
    ])
    expect(sceneLines(CLOSING_SCENE, save, () => 'steady').find((l) => l.speaker.kind === 'uma')).toEqual({ speaker: { kind: 'uma', outfitId: '1040' }, line: CLOSING_SCENE.beats[6]!.line })
    // A role nobody fills is dropped.
    expect(sceneLines(OPENING_SCENE, { roster: {} }, () => 'steady').some((l) => l.speaker.kind === 'uma')).toBe(false)
  })

  it('holds no Uma name: Umas speak only in roles, and the only name filled in is {name}', () => {
    const texts = [...OPENING_SCENE.beats, ...CLOSING_SCENE.beats].map((b) => b.line).concat(TEMPERAMENTS.map((t) => HELLO_LINES[t]))
    for (const beat of [...OPENING_SCENE.beats, ...CLOSING_SCENE.beats]) expect(['cast', 'first-hand', 'newest-hand', 'narrator']).toContain(beat.speaker.kind)
    for (const t of TEMPERAMENTS) expect(HELLO_LINES[t].match(/\{name\}/g)).toHaveLength(1)
    for (const text of texts) expect(text.replace(/\{name\}/g, '')).not.toMatch(/[{}]/)
    // Every capitalised word is the cast's, a place or good of the farm's, or plain English: a name from master data
    // would be none of these.
    const cast = CAST_IDS.flatMap((id) => CAST[id].name.split(' '))
    const farmWords = ['Umas', 'Carrot', 'Gate', 'Fields', 'Ben', 'Old']
    const english = ['Morning', 'The', 'Welcome', 'I', 'This', 'We', 'Here', 'A', 'Tap', 'Your', 'And', 'Anything', 'Word', 'Keep', 'Build', 'May', 'That',
      'He', 'Hi', 'Point', 'Weeds', 'Hello', 'Marta']
    const allowed = new Set([...cast, ...farmWords, ...english])
    const words = texts.flatMap((t) => t.match(/\b[A-Z][a-z]*/g) ?? [])
    expect(words.filter((w) => !allowed.has(w))).toEqual([])
  })
})
