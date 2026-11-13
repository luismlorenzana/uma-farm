// The ladders and points: the costs and the route, RM13's worked
// days, gifts by her tastes, chats, praise and its causes, her line at night, banking, birthdays, anniversaries, the
// rank-point factor, Ready and the morning's lines. Invented ids only: the stand-ins 9000001–9000003 and casts of 9000004
// onward built here; birthdays are invented dates.
import { describe, expect, it } from 'vitest'
import { dateOf, DAYS_PER_YEAR } from '../farm/calendar'
import { affinityPoints, loveRankFactor, rankPointsForDay, tickRankRules } from '../farm/rank-rules'
import { TALENT_D } from '../farm/talents'
import { CHAT_LINES } from '../farm/visitors'
import { harvest, plant, setTender } from '../fields/fields'
import { SHOP_SEEDS } from '../fields/crops'
import { FOREST } from '../gathering/tables'
import { goodCount, addGoods } from '../save/warehouse'
import { endDay, runNight, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV4 } from '../save/parse-v4'
import { newSave, pairKey } from '../save/v3'
import { newLove, newSaveV4, type Love, type SaveV4 } from '../save/v4'
import { bibleIssues, castIssues, type Cast, type CastEntry, type Trigger, type UmaBible } from '../story/authored'
import { STAND_IN_BIBLE, STAND_IN_CAST, STAND_INS } from '../story/authored.fixture'
import { readScene } from '../story/scenes'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import { canPraise, chatLineV4, chatSet, chatV4, DISLIKED_LINE, festivalTogether, giftPreview, giftV4, payLines, praiseV4, tasteKnown } from './acts'
import { joinOpening } from './arrivals'
import { BOND_HEARTS, bondHearts } from '../farm/bonds'
import { ANNIVERSARY_STARS, birthdaysOf, dayOfYear, farmBirthday, heartDays, isBirthday, lineGood, NO_BIRTHDAYS } from './days'
import {
  addLove, advance, bar, costOf, dayFactor, isAnniversary, LADDER_COLOURS, ladderOf, levelWords, nextRung, NIGHT_RUNGS, ROUTE_POINTS, ROUTE_RUNGS, rungName,
  WAITING_RUNGS,
} from './love'
import { earnPraise } from './praise'
import { RING_IDS } from '../goods/ids'
import { readiness, WAIT_ORDER } from './ready'

const AT = '2026-11-11T10:00:00.000Z'
const LATER = '2026-11-11T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const BIRTHDAYS = birthdaysOf(PACK, new Map())
const context = (birthdays = BIRTHDAYS, story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK): NightContext => ({ roster: [], kinds: TEST_KINDS, story, birthdays })

/** A named v4 farm on `day`, the opening read and the stand-ins home at Friendship 0., their ties seeded and
 * already listed on an earlier morning, so a night's Hearts show only its own lines. */
function farm(day = 1): SaveV4 {
  const fresh = { ...newSaveV4('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
/** Her route set by hand. */
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const give = (save: SaveV4, good: string, stars = 1, count = 1): SaveV4 => ({ ...save, items: addGoods(save.items, good, stars, count) })
/** 9000001's bible with her F1 behind another trigger. */
function packWithTrigger(trigger: Trigger, rung = 'f1'): StoryPack {
  const bible: UmaBible = { ...json(STAND_IN_BIBLE), route: json(STAND_IN_BIBLE).route.map((b) => (b.id === rung ? { ...b, trigger } : b)) }
  return { ...PACK, bibles: new Map([[ONE, bible]]) }
}
/** A pack whose cast is the stand-ins plus `more` (invented ids 9000004 on, no bibles). */
function packWith(...more: Omit<CastEntry, 'paragraph' | 'outfitId'>[]): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, ...more.map((u) => ({ ...u, outfitId: `${u.characterId}01`, paragraph: 'Invented.' }))] }
  return { ...PACK, cast }
}

describe('the ladders and their costs (RM11, RM12; decision 2)', () => {
  it('costs RM12\'s table: 160 + 40n a heart, 3,800 a ladder, 600 a spouse level, 10,600 a route; the waiting rungs free', () => {
    const hearts = (letter: string) => Array.from({ length: 10 }, (_, i) => costOf(`${letter}${i + 1}`))
    expect(hearts('f')).toEqual([200, 240, 280, 320, 360, 400, 440, 480, 520, 560])
    expect(hearts('r')).toEqual(hearts('f'))
    expect(hearts('f').reduce((a, b) => a + b)).toBe(3800)
    expect([1, 2, 3, 4, 5].map((n) => costOf(`s${n}`))).toEqual([600, 600, 600, 600, 600])
    expect(WAITING_RUNGS.map(costOf)).toEqual([0, 0, 0])
    // 26 rungs with an event, and S2 and S4, which come at night.
    expect(ROUTE_RUNGS).toHaveLength(28)
    expect(ROUTE_RUNGS.filter((r) => !NIGHT_RUNGS.includes(r))).toHaveLength(26)
    expect(ROUTE_POINTS).toBe(10_600)
    expect(() => costOf('f11')).toThrow('No rung f11')
  })

  it('walks the whole route through `advance`: F10 to the confession, romance, the proposal, the wedding, S1–S5, then done', () => {
    let love: Love = { ...newLove(), points: ROUTE_POINTS + 5 }
    const seen: string[] = []
    for (let day = 1; nextRung(love) !== null; day++) {
      seen.push(`${nextRung(love)}:${levelWords(love)}`)
      love = advance(love, day)
    }
    expect(seen.map((s) => s.split(':')[0])).toEqual(ROUTE_RUNGS)
    expect(seen.slice(0, 2)).toEqual(['f1:New friend', 'f2:Friend · F1'])
    expect(seen[10]).toBe('confession:Friend · F10')
    expect(seen[11]).toBe('r1:Partner')
    expect(seen[21]).toBe('proposal:Partner · R10')
    expect(seen[22]).toBe('wedding:Engaged')
    expect(seen[23]).toBe('s1:Spouse')
    expect(seen[24]).toBe('s2:Spouse · S1')
    expect(love).toMatchObject({ stage: 'spouse', level: 5, points: 5, last: 28, wed: 23 })
    expect(levelWords(love)).toBe('Spouse · S5')
    expect(bar(love)).toEqual({ rung: null, points: 0, cost: 0, banked: 0, full: false })
    expect(() => advance(love, 29)).toThrow('Her route is complete.')
    expect(levelWords({ stage: 'confession', level: 10, friend: true })).toBe('Close friend')
    expect(rungName('f3')).toBe('Friendship 3')
    expect(rungName('confession')).toBe('Her confession')
    expect(rungName('s2')).toBe('Spouse 2')
    expect(NIGHT_RUNGS).toEqual(['s2', 's4'])
  })

  it('draws the bar in its stage\'s colour, and refuses to advance a bar short of its cost', () => {
    expect((['friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const).map(ladderOf))
      .toEqual(['friendship', 'friendship', 'romance', 'romance', 'romance', 'spouse'])
    expect(Object.keys(LADDER_COLOURS)).toEqual(['friendship', 'romance', 'spouse'])
    expect(() => advance({ ...newLove(), points: 199 }, 2)).toThrow('Her bar isn’t full yet.')
    // "Not yet" is cleared when the confession is finally accepted.
    expect(advance({ ...newLove(), stage: 'confession', level: 10, friend: true, points: 40 }, 9)).toEqual({ ...newLove(), stage: 'romance', level: 0, points: 40, last: 9 })
  })
})

describe('points and banking (RM13, RM14; decisions 2, 3)', () => {
  it('plays RM13\'s worked days: +75, +55, +55, +45 make Friendship 1 Ready on day 3 at 230; it plays and F2 shows 117 of 240', () => {
    let save = farm(1)
    save = addLove(save, ONE, 75, 'arrival').save
    save = setTender(plant(save, 'A', 0, 'seed-carrot'), 'A', ONE, TEST_KINDS)
    for (const day of [1, 2]) {
      save = chatV4(give(save, 'carrot'), ONE).save
      save = giftV4(save, PACK, ONE, 'carrot', 1).save
      save = endDay(save, context(), LATER)
      expect(save.calendar.day).toBe(day + 1)
    }
    expect(bar(save.love[ONE]!)).toEqual({ rung: 'f1', points: 185, cost: 200, banked: 0, full: false })
    expect(readiness(save, PACK, ONE)).toEqual({ rung: 'f1', ready: false, waits: { kind: 'bar' } })
    save = chatV4(give(save, 'carrot'), ONE).save
    save = giftV4(save, PACK, ONE, 'carrot', 1).save
    expect(save.love[ONE]!.points).toBe(230)
    expect(bar(save.love[ONE]!)).toEqual({ rung: 'f1', points: 200, cost: 200, banked: 30, full: true })
    expect(readiness(save, PACK, ONE)).toEqual({ rung: 'f1', ready: true, waits: null })
    // It plays (F49 pays +50, its choice and grade after the cost): 30 banked + 87 = 117 of 240.
    save = { ...save, love: { ...save.love, [ONE]: advance(save.love[ONE]!, save.calendar.day) } }
    save = addLove(save, ONE, 87, 'event').save
    expect(bar(save.love[ONE]!)).toEqual({ rung: 'f2', points: 117, cost: 240, banked: 0, full: false })
    expect(levelWords(save.love[ONE]!)).toBe('Friend · F1')
    expect(parseSaveV4(json(save))).toEqual(save)
  })

  it('banks points past a full bar, carries them over, never decays, and adds nothing once S5 has played', () => {
    let save = withLove(farm(5), ONE, { points: 450 })
    expect(bar(save.love[ONE]!)).toMatchObject({ points: 200, banked: 250, full: true })
    for (let i = 0; i < 3; i++) save = endDay(save, context(NO_BIRTHDAYS), LATER)
    expect(save.love[ONE]!.points).toBe(450)
    const played = advance(save.love[ONE]!, save.calendar.day)
    expect(bar(played)).toEqual({ rung: 'f2', points: 240, cost: 240, banked: 10, full: true })
    // A waiting rung banks every point into the next ladder.
    expect(bar({ ...newLove(), stage: 'confession', level: 10, points: 120 })).toEqual({ rung: 'confession', points: 0, cost: 0, banked: 120, full: true })
    const done = withLove(save, ONE, { stage: 'spouse', level: 5, points: 3, wed: 2 })
    expect(addLove(done, ONE, 50, 'chat')).toEqual({ save: done, paid: 0 })
    expect(chatV4(done, ONE).paid).toBe(0)
    expect(() => addLove(save, ONE, -5, 'chat')).toThrow('Points are never taken away.')
    expect(() => addLove(save, '9000009', 5, 'chat')).toThrow('She isn’t on the farm.')
  })
})

describe('chats (RM18; decision 4)', () => {
  it('pays +15 once a day, home or away, with her temperament\'s lines before F1 and her own set by stage from F1, the same all day', () => {
    let save = farm(3)
    save = { ...save, dorm: { ...save.dorm, home: [ONE, TWO] } } // 9000003 away
    const talked = chatV4(save, THREE)
    expect(talked.paid).toBe(15)
    expect(() => chatV4(talked.save, THREE)).toThrow('You’ve talked today.')
    const line = chatLineV4(save, PACK, ONE, 'steady')
    expect(CHAT_LINES.steady).toContain(line)
    expect(chatLineV4(talked.save, PACK, ONE, 'steady')).toBe(line)
    const chats = STAND_IN_BIBLE.chats!
    expect(chats.friend).toContain(chatLineV4(withLove(save, ONE, { level: 1 }), PACK, ONE, 'steady'))
    expect(chats.friend).toContain(chatLineV4(withLove(save, ONE, { stage: 'confession', level: 10 }), PACK, ONE, 'steady'))
    expect(chats.partner).toContain(chatLineV4(withLove(save, ONE, { stage: 'romance', level: 1 }), PACK, ONE, 'steady'))
    expect(chats.spouse).toContain(chatLineV4(withLove(save, ONE, { stage: 'spouse', level: 0, wed: 1 }), PACK, ONE, 'steady'))
    expect([chatSet(newLove()), chatSet({ stage: 'romance', level: 0 }), chatSet({ stage: 'wedding', level: 10 })]).toEqual([null, 'friend', 'partner'])
    // A bible without chats (9000002 has none at all) keeps the temperament's lines.
    expect(CHAT_LINES.bold).toContain(chatLineV4(withLove(save, TWO, { level: 3 }), PACK, TWO, 'bold'))
  })
})

describe('gifts (RM15, RM16; decision 5)', () => {
  it('pays her taste × its stars: a ★3 liked 36, a ★5 loved on her birthday 252, a disliked 0 and never a fall; one a day', () => {
    const save = give(give(give(farm(2), 'carrot', 3), 'limestone'), 'pine-log')
    const liked = giftV4(save, PACK, ONE, 'carrot', 3)
    expect([liked.paid, liked.taste]).toEqual([36, 'liked'])
    expect(liked.save.love[ONE]!.points).toBe(36)
    expect(goodCount(liked.save.items, 'carrot')).toBe(0)
    expect(() => giftV4(liked.save, PACK, ONE, 'limestone', 1)).toThrow('One gift a day.')
    const disliked = giftV4(save, PACK, ONE, 'limestone', 1)
    expect([disliked.paid, disliked.taste, disliked.save.love[ONE]!.points]).toEqual([0, 'disliked', 0])
    expect(DISLIKED_LINE).toBe('She thanks you, a little puzzled.')
    expect(giftV4(save, PACK, ONE, 'pine-log', 1).paid).toBe(10)
    // Her birthday, Spring 4 in the stand-in cast: ×3.
    const birthday = give(farm(4), 'golden-carrot', 5)
    expect(isBirthday(BIRTHDAYS, ONE, 4)).toBe(true)
    expect(giftV4(birthday, PACK, ONE, 'golden-carrot', 5, BIRTHDAYS).paid).toBe(252)
    expect(giftV4(birthday, PACK, ONE, 'golden-carrot', 5).paid).toBe(84)
    // Away, she still takes a gift; seeds aren't gifts, and the Warehouse must hold it.
    expect(() => giftV4(save, PACK, ONE, 'seed-carrot', 1)).toThrow('That isn’t a gift.')
    expect(() => giftV4(save, PACK, ONE, 'potato', 1)).toThrow()
  })

  it('shows her loved good from F1, a given good\'s taste once learnt, and every taste from F7; "?" before', () => {
    let save = give(farm(2), 'potato', 2)
    const love = () => save.love[ONE]!
    expect(tasteKnown(PACK, love(), ONE, 'golden-carrot')).toBe(false)
    expect(giftPreview(save, PACK, ONE, 'potato', 2)).toBeNull()
    save = withLove(save, ONE, { level: 1 })
    expect(tasteKnown(PACK, love(), ONE, 'golden-carrot')).toBe(true)
    expect(giftPreview(save, PACK, ONE, 'golden-carrot', 1)).toBe(60)
    expect(giftPreview(save, PACK, ONE, 'potato', 2)).toBeNull()
    save = giftV4(save, PACK, ONE, 'potato', 2).save
    expect(love().known).toEqual(['potato'])
    expect(giftPreview(save, PACK, ONE, 'potato', 2)).toBe(33)
    expect(giftPreview(save, PACK, ONE, 'limestone', 1)).toBeNull()
    save = withLove(save, ONE, { level: 7 })
    expect(giftPreview(save, PACK, ONE, 'limestone', 1)).toBe(0)
    expect(giftPreview(save, PACK, ONE, 'pine-log', 4)).toBe(13)
    expect(parseSaveV4(json(save))).toEqual(save)
  })
})

describe('praise (RM13; decision 6)', () => {
  it('is earned by a ★3+ harvest from her block, pays +20 once, and clears at night', () => {
    let save = setTender(plant(farm(3), 'A', 0, 'seed-carrot'), 'A', ONE, TEST_KINDS)
    save.fields.blocks[0]!.plots[0] = { ...save.fields.blocks[0]!.plots[0]!, growth: 4, ready: true }
    expect(canPraise(save, ONE)).toBe(false)
    expect(() => praiseV4(save, ONE)).toThrow('Nothing to praise yet today.')
    // A Legend's crops are ★3 or better.
    const legend = { ...save, roster: { ...save.roster, [ONE]: { ...save.roster[ONE]!, ranks: { ...save.roster[ONE]!.ranks, farming: { points: 0, rank: 5 as const, challenge: 0 } } } } }
    const picked = harvest(legend, 'A', 0)
    expect(picked.receipt.stars.slice(2).reduce((a, b) => a + b)).toBeGreaterThan(0)
    expect(picked.save.today.praise).toEqual([ONE])
    // A Novice's crops here are ★1 or ★2: no praise.
    expect(harvest(save, 'A', 0).save.today.praise).toEqual([])
    const paid = praiseV4(picked.save, ONE)
    expect(paid.paid).toBe(20)
    expect(canPraise(paid.save, ONE)).toBe(false)
    expect(() => praiseV4(paid.save, ONE)).toThrow('You’ve praised her today.')
    const night = runNight(paid.save, context())
    expect([night.today.praise, night.today.praised]).toEqual([[], []])
    // A workshop play calls the same rule; v3 is never touched.
    expect(earnPraise(save, TWO).today.praise).toEqual([TWO])
    const v3 = newSave('u1', AT)
    expect(earnPraise(v3, TWO)).toBe(v3)
  })

  it('is earned overnight by a ★3+ item from her work, or a rank-up', () => {
    let save = farm(3)
    // 9000002 gathers at the forest at foraging rank 2: a ★3 Pine Log by morning.
    save = { ...save, roster: { ...save.roster, [TWO]: { ...save.roster[TWO]!, ranks: { ...save.roster[TWO]!.ranks, foraging: { points: 0, rank: 2 as const, challenge: 0 } } } } }
    save = startLoopJob(save, { outfitId: TWO, place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 1 } }, AT, TEST_KINDS)
    // 9000003's fishing points are full and her challenge met: she ranks up tonight.
    save = { ...save, roster: { ...save.roster, [THREE]: { ...save.roster[THREE]!, ranks: { ...save.roster[THREE]!.ranks, fishing: { points: 100, rank: 0 as const, challenge: 30 } } } } }
    const morning = runNight(save, context())
    expect(morning.summary!.ranks).toContainEqual({ kind: 'rank-up', outfitId: THREE, activity: 'fishing', rank: 1 })
    expect(morning.today.praise).toEqual([TWO, THREE])
    expect(parseSaveV4(json(morning), 'save', TEST_KINDS)).toEqual(morning)
  })
})

describe('her line at night (RM6, RM23; decision 8)', () => {
  it('pays +10 for a day at one of her line\'s places, tending for a farmer, once a night; nothing elsewhere', () => {
    const save = farm(3)
    const { save: paid, paid: who } = payLines(save, PACK, [
      { outfitId: TWO, place: 'forest' }, { outfitId: TWO, place: 'sawmill' }, { outfitId: THREE, place: 'forest' }, { outfitId: ONE, place: 'mill' },
    ], [{ outfitId: ONE }])
    expect(who).toEqual([{ id: ONE, points: 10 }, { id: TWO, points: 10 }])
    expect(paid.love[THREE]!.points).toBe(0)
    expect(payLines(save, PACK, [{ outfitId: ONE, place: 'mill' }], []).paid).toEqual([])
    // At night: 9000002 at the forest is paid at step 6.
    const working = startLoopJob(save, { outfitId: TWO, place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 2 } }, AT, TEST_KINDS)
    expect(runNight(working, context()).love[TWO]!.points).toBe(10)
    expect(runNight(working, { ...context(), story: undefined }).love[TWO]!.points).toBe(0)
  })
})

describe('a festival together (decision 9)', () => {
  it('pays +50 to each Uma on its team or entry, once a festival a year each', () => {
    const save = farm(10)
    const once = festivalTogether(save, [ONE, TWO, ONE, '9000009'], 'flower-show', 1)
    expect(once.paid).toEqual([{ id: ONE, points: 50 }, { id: TWO, points: 50 }])
    expect(once.save.love[ONE]!.festivals).toEqual(['flower-show:1'])
    expect(festivalTogether(once.save, [ONE], 'flower-show', 1).paid).toEqual([])
    expect(parseSaveV4(json(once.save))).toEqual(once.save)
  })
})

describe('birthdays (RM16; decision 10)', () => {
  it('maps RM16\'s six dates onto the 48-day year', () => {
    const at = (month: number, day: number) => { const d = dateOf(farmBirthday(month, day)); return `${d.season} ${d.day}` }
    expect([at(3, 1), at(4, 1), at(5, 31), at(2, 14), at(8, 15), at(12, 31)]).toEqual(['spring 1', 'spring 5', 'spring 12', 'winter 10', 'summer 10', 'winter 4'])
    expect([dayOfYear(1), dayOfYear(48), dayOfYear(49), dayOfYear(100)]).toEqual([1, 48, 1, 4])
  })

  it('reads master data\'s set, the cast\'s own birthday winning; and the format checks a cast birthday', () => {
    const master = new Map([[ONE, { month: 8, day: 15 }], [TWO, { month: 12, day: 31 }]])
    expect([...birthdaysOf(PACK, master)]).toEqual([[ONE, 4], [TWO, 40]])
    expect([...birthdaysOf(PACK, new Map())]).toEqual([[ONE, 4]])
    expect(isBirthday(BIRTHDAYS, ONE, 4 + DAYS_PER_YEAR)).toBe(true)
    const cast = json(STAND_IN_CAST) as unknown as { umas: Record<string, unknown>[] }
    cast.umas[1]!.birthday = { month: 2, day: 30 }
    cast.umas[2]!.birthday = { month: 13, day: 1 }
    expect(castIssues(cast, { umas: new Set(STAND_INS) })).toEqual([
      'Uma 2 (9000002): a birthday is { month: 1–12, day } on a real date (RM16)',
      'Uma 3 (9000003): a birthday is { month: 1–12, day } on a real date (RM16)',
    ])
  })

  it('writes her ★ line the day before and on the day', () => {
    const eve = runNight(farm(2), context())
    expect(eve.calendar.day).toBe(3)
    expect(eve.summary!.hearts).toEqual([{ kind: 'birthday', id: ONE, when: 'tomorrow' }])
    const day = runNight(eve, context())
    expect(day.summary!.hearts).toEqual([{ kind: 'birthday', id: ONE, when: 'today' }])
    expect(runNight(day, context()).summary!.hearts).toEqual([])
    expect(parseSaveV4(json(day))).toEqual(day)
    // Without master data's birthdays (or the cast's), no line.
    expect(runNight(farm(2), context(NO_BIRTHDAYS)).summary!.hearts).toEqual([])
  })
})

describe('anniversaries (RM17; decision 11)', () => {
  const wed = 5
  const married = (day: number, id = ONE, pack = PACK) => {
    const base = pack === PACK ? farm(day) : joinOpening(readScene({ ...newSaveV4('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }, 'scene:1:open'), pack)
    return withLove(base, id, { stage: 'spouse', level: 1, wed, points: 0 })
  }

  it('none in her wedding\'s year; ×2 that day from year 2 on, the evening\'s ×1.5 apart', () => {
    const love = married(wed).love[ONE]!
    expect([wed, wed + 1, wed + DAYS_PER_YEAR - 1].map((d) => isAnniversary(love, d))).toEqual([false, false, false])
    expect([wed + DAYS_PER_YEAR, wed + 2 * DAYS_PER_YEAR].map((d) => isAnniversary(love, d))).toEqual([true, true])
    expect(dayFactor(love, wed + DAYS_PER_YEAR, 'chat')).toBe(2)
    expect(dayFactor(love, wed + DAYS_PER_YEAR, 'evening')).toBe(1)
    const save = married(wed + DAYS_PER_YEAR)
    expect(chatV4(save, ONE).paid).toBe(30)
    expect(chatV4(married(wed + DAYS_PER_YEAR + 1), ONE).paid).toBe(15)
    // A gift on her birthday and her anniversary both: ×3 and ×2, each once.
    expect(dayFactor(love, wed + DAYS_PER_YEAR, 'gift', true)).toBe(6)
  })

  it('leaves a ★5 item of her line that morning, with the line the day before', () => {
    const eve = runNight(married(wed + DAYS_PER_YEAR - 2), context(NO_BIRTHDAYS))
    // F50: a spouse whose favourite kind is open asks you out each morning, §4's second place. (F51: a spouse also has
    // Romance 2's morning items, every 4th morning; F54: she takes the Farmhouse's room and its mornings: not this test's.)
    expect(eve.summary!.hearts.filter((h) => h.kind === 'invite' || h.kind === 'anniversary')).toEqual([{ kind: 'invite', id: ONE, evening: 'stargazing' }, { kind: 'anniversary', id: ONE, when: 'tomorrow', item: null }])
    const day = runNight(eve, context(NO_BIRTHDAYS))
    const line = day.summary!.hearts.find((h) => h.kind === 'anniversary')!
    expect(line).toMatchObject({ kind: 'anniversary', id: ONE, when: 'today' })
    const item = (line as { item: string }).item
    expect(SHOP_SEEDS[dateOf(day.calendar.day).season]).toContain(item) // a farmer's: a crop of the season
    expect(day.items[item]![ANNIVERSARY_STARS - 1]).toBe(1)
    expect(parseSaveV4(json(day))).toEqual(day)
  })

  it('picks a forager\'s good from her deepest area, and a ★5 crop when her line\'s place isn\'t open', () => {
    const forager = withLove(married(wed + DAYS_PER_YEAR), TWO, { stage: 'spouse', level: 1, wed })
    const good = lineGood(forager, PACK, TWO, 5)
    expect(FOREST.woods.seasons.spring.map(([id]) => id)).toContain(good.id)
    const hills = { ...forager, roster: { ...forager.roster, [TWO]: { ...forager.roster[TWO]!, ranks: { ...forager.roster[TWO]!.ranks, foraging: { points: 0, rank: 1 as const, challenge: 0 } } } } }
    const deeper = Array.from({ length: 6 }, (_, n) => lineGood(hills, PACK, TWO, 5, n).id)
    expect(deeper.every((id) => FOREST.hills.seasons.spring.some(([g]) => g === id))).toBe(true)
    // A miner before chapter 3: a crop of the season.
    const pack = packWith({ characterId: '9000004', arrives: { kind: 'chapter', chapter: 1 }, calling: 'mining' })
    const miner = withLove(married(wed + DAYS_PER_YEAR, ONE, pack), ONE, {})
    const joined = { ...miner, roster: { ...miner.roster, '9000004': miner.roster[ONE]! }, love: { ...miner.love, '9000004': { ...newLove(), stage: 'spouse' as const, level: 1, wed } } }
    const { save, lines } = heartDays(joined, pack, NO_BIRTHDAYS)
    const mined = lines.find((l) => l.id === '9000004')!
    expect(SHOP_SEEDS.spring).toContain((mined as { item: string }).item)
    expect(save.items[(mined as { item: string }).item]![4]).toBeGreaterThan(0)
  })
})

describe('the rank-point factor (RM18; decision 12)', () => {
  it('is ×1.05 from Friendship 5 and ×1.10 from Friendship 10 on v4; v3\'s affinity factor unchanged', () => {
    const at = (stage: Love['stage'], level: number) => loveRankFactor({ stage, level })
    expect([at('friendship', 0), at('friendship', 4), at('friendship', 5), at('friendship', 9), at('confession', 10), at('romance', 0), at('spouse', 5)])
      .toEqual([1, 1, 1.05, 1.05, 1.1, 1.1, 1.1])
    const terms = () => ({ talent: TALENT_D, favourite: false })
    const save = withLove(withLove(farm(3), ONE, { level: 5 }), TWO, { stage: 'romance', level: 2 })
    const { paid } = tickRankRules(save, [{ outfitId: ONE, activity: 'farming' }, { outfitId: TWO, activity: 'foraging' }, { outfitId: THREE, activity: 'fishing' }], terms)
    expect(paid.map((p) => p.points)).toEqual([10.5, 11, 10])
    expect([affinityPoints(499), affinityPoints(500), affinityPoints(1000)]).toEqual([1, 1.05, 1.1])
    expect(rankPointsForDay({ talent: TALENT_D, favourite: false, wellFed: false, heartsFactor: affinityPoints(1000) })).toBe(11)
  })
})

describe('Ready (RM24; decisions 1 and 13)', () => {
  const full = (save: SaveV4, id: string = ONE) => withLove(save, id, { points: 200 })

  it('needs all four: her bar full, home, no event today, its setup met', () => {
    const save = full(farm(3))
    expect(readiness(save, PACK, ONE)).toEqual({ rung: 'f1', ready: true, waits: null })
    expect(readiness(withLove(save, ONE, { points: 199 }), PACK, ONE).waits).toEqual({ kind: 'bar' })
    expect(readiness({ ...save, dorm: { ...save.dorm, home: [TWO, THREE] } }, PACK, ONE).waits).toEqual({ kind: 'away' })
    expect(readiness({ ...save, today: { ...save.today, events: [ONE] } }, PACK, ONE).waits).toEqual({ kind: 'today' })
    expect(readiness(withLove(save, ONE, { last: 3 }), PACK, ONE).waits).toEqual({ kind: 'today' })
    expect(() => readiness(save, PACK, '9000009')).toThrow('She isn’t on the farm.')
  })

  it('reads each setup kind: working, an item, a bond, a chapter; a place before its chapter opens with it', () => {
    const save = full(farm(3))
    const forest = packWithTrigger({ kind: 'working', activity: 'foraging' })
    expect(readiness(save, forest, ONE).waits).toEqual({ kind: 'setup', setup: { kind: 'working', activity: 'foraging' } })
    const working = startLoopJob(save, { outfitId: ONE, place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 1 } }, AT, TEST_KINDS)
    expect(readiness(working, forest, ONE).ready).toBe(true)
    const fields = packWithTrigger({ kind: 'working', activity: 'farming' })
    expect(readiness(save, fields, ONE).ready).toBe(false)
    const tending = setTender(plant(save, 'A', 0, 'seed-carrot'), 'A', ONE, TEST_KINDS)
    expect(readiness(tending, fields, ONE).ready).toBe(true)
    const item = packWithTrigger({ kind: 'item', good: 'golden-carrot' })
    expect(readiness(save, item, ONE).waits).toMatchObject({ kind: 'setup' })
    expect(readiness(give(save, 'golden-carrot', 4), item, ONE).ready).toBe(true)
    const bond = packWithTrigger({ kind: 'bond', with: TWO, level: 2 })
    expect(readiness({ ...save, bonds: { [pairKey(ONE, TWO)]: 149 } }, bond, ONE).waits).toMatchObject({ kind: 'setup' })
    expect(readiness({ ...save, bonds: { [pairKey(ONE, TWO)]: 150 } }, bond, ONE).ready).toBe(true)
    expect(BOND_HEARTS.map(bondHearts)).toEqual([1, 2, 3, 4, 5])
    const chapter = packWithTrigger({ kind: 'chapter', chapter: 2 })
    expect(readiness(save, chapter, ONE).waits).toEqual({ kind: 'opens', chapter: 2 })
    expect(readiness({ ...save, farm: { ...save.farm, chapter: 2 } }, chapter, ONE).ready).toBe(true)
    const mine = packWithTrigger({ kind: 'working', activity: 'mining' })
    expect(readiness(withLove(save, ONE, { points: 0 }), mine, ONE).waits).toEqual({ kind: 'opens', chapter: 3 })
    expect(readiness({ ...save, farm: { ...save.farm, chapter: 3 } }, mine, ONE).waits).toMatchObject({ kind: 'setup' })
  })

  it('makes a waiting rung Ready the day after the rung before, the proposal only with a ring', () => {
    const confession = withLove(farm(9), ONE, { stage: 'confession', level: 10, last: 9, points: 30 })
    expect(readiness(confession, PACK, ONE)).toEqual({ rung: 'confession', ready: false, waits: { kind: 'day' } })
    const tomorrow = { ...confession, calendar: { day: 10 } }
    expect(readiness(tomorrow, PACK, ONE).ready).toBe(true)
    expect(readiness(withLove(tomorrow, ONE, { friend: true }), PACK, ONE).waits).toEqual({ kind: 'friend' })
    const proposal = withLove(tomorrow, ONE, { stage: 'proposal', level: 10 })
    expect(readiness(proposal, PACK, ONE).waits).toEqual({ kind: 'ring' })
    expect(RING_IDS).toHaveLength(10)
    const wedding = withLove(tomorrow, ONE, { stage: 'wedding', level: 10, ring: 4 })
    expect(readiness(wedding, PACK, ONE).ready).toBe(true)
    // S2 and S4 have no event: they come at night once their bar fills.
    const s2 = withLove(tomorrow, ONE, { stage: 'spouse', level: 1, wed: 2, points: 600 })
    expect(readiness(s2, PACK, ONE).waits).toEqual({ kind: 'night' })
    expect(readiness(withLove(s2, ONE, { points: 10 }), PACK, ONE).waits).toEqual({ kind: 'bar' })
    expect(readiness(withLove(s2, ONE, { level: 5 }), PACK, ONE)).toEqual({ rung: null, ready: false, waits: { kind: 'done' } })
  })

  it('says an unscripted event is still being written: 9000002\'s Friendship 1', () => {
    const save = full(farm(3), TWO)
    expect(readiness(save, PACK, TWO)).toEqual({ rung: 'f1', ready: false, waits: { kind: 'unwritten' } })
  })

  it('documents every wait, in the order it\'s said', () => {
    expect(WAIT_ORDER.map((w) => w.kind).sort()).toEqual(['away', 'bar', 'day', 'done', 'friend', 'night', 'opens', 'ring', 'setup', 'today', 'unwritten'])
  })
})

describe('the morning\'s Hearts lines (decision 14)', () => {
  it('parse strictly: off the roster, a line twice, an item the day before and words are refused', () => {
    const save = farm(3)
    save.summary = { day: 3, bin: [], work: [], ranks: [], news: [], nudges: [], hearts: [
      { kind: 'birthday', id: ONE, when: 'today' }, { kind: 'anniversary', id: TWO, when: 'today', item: 'carrot' },
      { kind: 'anniversary', id: THREE, when: 'tomorrow', item: null }, { kind: 'arrived', id: ONE, home: true },
    ] }
    expect(parseSaveV4(json(save)).summary).toEqual(save.summary)
    const refuse = (hearts: unknown[], message: string) => expect(() => parseSaveV4({ ...json(save), summary: { ...json(save.summary), hearts } })).toThrow(message)
    refuse([{ kind: 'birthday', id: '9000009', when: 'today' }], 'save.summary.hearts.0.id: expected an Uma on the roster')
    refuse([{ kind: 'birthday', id: ONE, when: 'today' }, { kind: 'birthday', id: ONE, when: 'tomorrow' }], 'save.summary.hearts.1: repeated')
    refuse([{ kind: 'birthday', id: ONE, when: 'today', words: 'Hi' }], 'save.summary.hearts.0: unknown keys words')
    refuse([{ kind: 'birthday', id: ONE, when: 'soon' }], 'save.summary.hearts.0.when: expected one of')
    refuse([{ kind: 'anniversary', id: ONE, when: 'tomorrow', item: 'carrot' }], 'save.summary.hearts.0.item: expected null the day before')
    refuse([{ kind: 'anniversary', id: ONE, when: 'today', item: 'nope' }], 'save.summary.hearts.0.item: unknown good')
  })
})

describe('the format\'s chats (decision 16)', () => {
  it('takes 3–20 lines a stage under the line rules', () => {
    const ctx = { umas: new Set(STAND_INS) }
    expect(bibleIssues(STAND_IN_BIBLE, ctx)).toEqual([])
    const bad = json(STAND_IN_BIBLE) as unknown as { chats: Record<string, unknown> }
    bad.chats = { friend: ['One.', 'Two.'], partner: ['Hi, {name}.', 'Yes, sir.', 'x'.repeat(161)], spouse: ['A.', 'B.', 'C.'], extra: [] }
    expect(bibleIssues(bad, ctx)).toEqual([
      'chats.extra: a chat set is friend, partner or spouse',
      'chats.friend: 3–20 lines',
      'chats.partner 1: unknown placeholder {name} ({farmer} only)',
      'chats.partner 2: “sir” genders the farmer (RS2)',
      'chats.partner 3: a line of 1–160 characters',
    ])
  })
})
