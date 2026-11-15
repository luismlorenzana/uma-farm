// The farm's progress: the Farm Rank's thresholds and points (income and resources only), the Diary's milestones and
// rows paying once, the night's goals check, and the opening playing once, the game's own lines with no Uma in them. Invented ids and an
// invented cast; the night runs with test kinds.
import { describe, expect, it } from 'vitest'
import { checkGoalsNight, depthsTonight, farmPointsOf, farmRankOpens, nextFarmRank, payDiary } from '../farm/diary'
import { FARM_RANK_POINTS, farmRankOf } from '../farm/farm'
import { DIARY_ROWS, MILESTONES, ROW_GOLD } from '../farm/milestones'
import type { Activity, Rank } from '../farm/ranks'
import { endDay, type NightContext } from '../night/end-day'
import { GOLD_SHIPPED } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'
import type { Calling, CastEntry } from './authored'
import { STAND_IN_CAST } from './authored.fixture'
import { PLACEHOLDER_OPENING } from './placeholders'
import { readScene, sceneDue } from './scenes'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const entry = (characterId: string, calling: Calling): CastEntry => ({ characterId, outfitId: `${characterId}01`, calling, paragraph: 'Invented.' })
/** An invented cast: the three on the farm. */
const STORY: NonNullable<NightContext['story']> = {
  cast: { ...STAND_IN_CAST, umas: [entry('1001', 'farming'), entry('1002', 'foraging'), entry('1003', 'fishing')] },
  bibles: new Map(), ties: { version: 1, ties: [] },
}
const CONTEXT: NightContext = { story: STORY }
const night = (save: SaveV4) => endDay(save, CONTEXT, LATER)

/** The farmer named and the three home on `day`, their arrivals and the opening scene read, with `counts`. */
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
/** A farm one night from Farm Rank 2: 10,000g shipped and a Hand, their milestones not paid yet. */
const ready = (): SaveV4 => ranked({ ...farm(7, { [GOLD_SHIPPED]: 10_000, 'tiles-harvested': 9 }), crops: { carrot: 20, potato: 2 } }, '1001', 'farming', 1)

describe('the Farm Rank', () => {
  it('reaches each rank at its threshold, never a point before', () => {
    FARM_RANK_POINTS.forEach((at, i) => {
      expect(farmRankOf(at)).toBe(i + 1)
      if (at > 0) expect(farmRankOf(at - 1)).toBe(i)
    })
    expect(farmRankOf(1e9)).toBe(10)
    expect(FARM_RANK_POINTS).toEqual([0, 150, 250, 950, 2150, 3750, 6250, 9750, 14750, 21750])
    expect(nextFarmRank(0)).toEqual({ rank: 2, points: 150 })
    expect(nextFarmRank(21_749)).toEqual({ rank: 10, points: 21_750 })
    expect(nextFarmRank(21_750)).toBeNull()
  })

  it('counts income and resources only: 1 a 100g shipped, 5 a good shipped once, 25 a milestone', () => {
    const save: SaveV4 = {
      ...farm(1, { [GOLD_SHIPPED]: 12_399 }), diary: { shipped: { carrot: 9, carp: 1, tomato: 0 }, milestones: ['shipped:10000', 'row:vegetables'], records: {}, read: [], notes: [] },
    }
    expect(farmPointsOf(save)).toEqual({ shipped: 123, entries: 10, milestones: 25, total: 158 })
    expect(farmPointsOf(newSave('u1', AT)).total).toBe(0)
  })

  it('opens what the rules gate on it: the places to build, the farmer\'s reach, beds and seeds', () => {
    expect(farmRankOpens(1)).toEqual(['The Mill to build (1,000g · 20 logs)', 'Dorm level 2 (5 beds)']) // tier-1 seeds, the Woods and the Pond are the start's
    expect(farmRankOpens(2)).toEqual([
      'The Coop to build (2,000g · 30 logs · 20 vegetables)', 'The Hills', 'The River', 'The Sea Pier (with the Dock)', 'Chickens at the rancher’s', 'Dorm level 3 (7 beds)',
      'New seeds at the shop',
    ])
    expect(farmRankOpens(3)).toEqual([
      'The Sawmill to build (1,500g · 40 logs)', 'The Barn to build (3,500g · 30 logs · 20 vegetables)', 'The Smokehouse to build (2,000g · 30 logs · 20 fish)',
      'The Kitchen to build (3,000g · 40 logs · 20 vegetables)', 'Plot 2 to clear (2,500g)', 'Station level 2 (2 loads a day)',
      'Ducks, Cows and Sheep at the rancher’s', 'Dorm level 4 (9 beds)',
    ])
    expect(farmRankOpens(4)).toEqual([
      'The Mine to build (10,000g · 60 planks)', 'The Smelter to build (8,000g · 40 planks · 40 logs)', 'Plot 3 to clear (5,000g)', 'Station level 3 (3 loads a day)',
      'Kitchen level 2 (8 dishes a play)',
      'The Old Forest', 'The Lake', 'Goats at the rancher’s',
      'The Mine’s and the Quarry’s floors to 15', 'Dorm level 5 (11 beds)', 'New seeds at the shop',
    ])
    expect(farmRankOpens(6)).toEqual([
      'The Dock to build (20,000g · 80 planks)', 'The Boat to build (30,000g · 60 planks · 30 fillets)', 'Plot 5 to clear (15,000g)', 'Station level 5 (5 loads a day)',
      'Kitchen level 4 (12 dishes a play)',
      'The Mountain', 'The Falls', 'Cashmere Goats at the rancher’s',
      'The Mine’s and the Quarry’s floors to 20', 'Dorm level 7 (17 beds)',
    ])
    expect(farmRankOpens(8).some((o) => o.startsWith('Dorm'))).toBe(false) // the Dorm for 20 tops out at level 8, Farm Rank 7
    expect(farmRankOpens(9)).toEqual(['Plot 8 to clear (50,000g)'])
    expect(farmRankOpens(10)).toEqual(['The World Tree', 'The Moon Pool', 'The Mine’s and the Quarry’s floors to 30', 'The farm’s gold crest'])
  })

  it('is recomputed at night step 8 from the save, and a rank reached is news in the morning', () => {
    const save = { ...farm(3), bin: { carrot: [50, 0, 0, 0, 0] as [number, number, number, number, number], potato: [50, 0, 0, 0, 0] as [number, number, number, number, number] } }
    const morning = night(save)
    // 50 Carrots at 70g and 50 Potatoes at 65g (Spring's demand), a crate each, pay 6,750g: 67 points, and 5 each for the entries.
    expect(morning.farm.points).toBe(77)
    expect(morning.summary!.news.filter((n) => n.kind === 'farm-rank')).toEqual([])
    const more = night({ ...morning, summary: null, bin: { 'emperor-pumpkin': [19, 0, 0, 0, 0] } })
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
    const depths = depthsTonight(['woods', 'hills', 'pond', 'moon'])
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
    expect(DIARY_ROWS).toHaveLength(30)
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

describe('the night\'s goals', () => {
  it('pays the Diary and recomputes the Farm Rank, with no chapter to complete', () => {
    const morning = night(ready())
    // 10,000g's and Hand's milestones (300g each) reach Farm Rank 2 (100 + 25 + 25 = 150); three Umas home cost 30g, and
    // four mouths with nothing cooked 120g of takeout.
    expect(morning.gold).toBe(500 - 120 - 30 + 300 + 300)
    expect(morning.farm.points).toBe(150)
    expect(morning.buildings.mill).toBeUndefined()
    expect(Object.keys(morning.roster)).toEqual(['1001', '1002', '1003'])
    expect(morning.summary!.news).toEqual([{ kind: 'farm-rank', rank: 2 }, { kind: 'milestone', id: 'shipped:10000' }, { kind: 'milestone', id: 'rank:hand' }])
    expect(parseSaveV5(json(morning))).toEqual(morning)
    expect(checkGoalsNight(morning, []).tonight).toEqual({ paid: [], ranks: [] })
  })

  it('reads an older v4\'s "chapter done" line and drops it, and refuses a goal line it does not know', () => {
    const morning = night(ready())
    const parse = (news: unknown[]) => parseSaveV5(json({ ...morning, summary: { ...morning.summary!, news } }))
    expect(parse([{ kind: 'chapter', chapter: 1 }, { kind: 'farm-rank', rank: 2 }]).summary!.news).toEqual([{ kind: 'farm-rank', rank: 2 }])
    expect(() => parse([{ kind: 'milestone', id: 'shipped:5' }])).toThrow('unknown milestone')
    expect(() => parse([{ kind: 'farm-rank', rank: 1 }])).toThrow('expected 2–10')
    expect(() => parse([{ kind: 'chapter', chapter: 9 }])).toThrow('expected 1–8')
    expect(() => parse([{ kind: 'built', place: 'fields' }])).toThrow('expected a place you build')
    expect(parse([{ kind: 'built', place: 'mill' }]).summary!.news).toEqual([{ kind: 'built', place: 'mill' }])
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

  it('reads an older v4\'s closing scene in the Diary\'s read list as nothing now', () => {
    const named = { ...newSave('u1', AT), farmer: { name: 'Robin' }, summary: null }
    expect(sceneDue({ ...named, diary: { ...named.diary, read: ['scene:1:open', 'scene:1:close'] } })).toBeNull()
  })

  it('the game\'s own opening holds no name: three narrated lines, the only name filled in {farmer}', () => {
    expect(PLACEHOLDER_OPENING).toHaveLength(3)
    const texts = PLACEHOLDER_OPENING.map((step) => ('narrate' in step ? step.narrate : ''))
    for (const text of texts) expect(text.replace(/\{farmer\}/g, '')).not.toMatch(/[{}]/)
    expect(texts.at(-1)).toContain('the Gate')
    // Every capitalised word is a place or good of the farm's, or plain English: a name from master data would be none
    // of these.
    const farmWords = ['Carrot', 'Gate', 'Fields']
    const english = ['Morning', 'The', 'One', 'And']
    const allowed = new Set([...farmWords, ...english])
    const words = texts.flatMap((t) => t.match(/\b[A-Z][a-z]*/g) ?? [])
    expect(words.filter((w) => !allowed.has(w))).toEqual([])
  })
})
