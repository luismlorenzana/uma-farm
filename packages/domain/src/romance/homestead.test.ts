// Married life: the houses and their prices, rooms and moves, the
// night's house, shared houses' bonds, S2 and S4 at night, the house's morning, the household milestones, scenes, the
// finale and the Festival of Vows, and the format's `household.json` and `wishes`. Invented ids only: the stand-ins
// 9000001–9000003 and 9000004 on.
import { describe, expect, it } from 'vitest'
import { bondOf } from '../farm/bonds'
import { DAYS_PER_YEAR } from '../farm/calendar'
import { runNight, type NightContext } from '../night/end-day'
import { parseSaveV6 } from '../save/parse-v4'
import { FINALE_MARRIED, marriedCount, newLove, newRosterUma, newSave, onFarm, residentsOf, roomsOf, vowsOn, type Love, type SaveV4 } from '../save/v4'
import { checkBible, checkHousehold, type Household, type Step, type UmaBible } from '../story/authored'
import { STAND_IN_BIBLE, STAND_INS } from '../story/authored.fixture'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { DEFAULT_EVENTS } from '../story/default-story'
import { eventOf, householdOf, placeholderHouseholdBeat, wishesOf } from '../story/placeholders'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { joinCast } from './meeting.fixture'
import { birthdaysOf } from './days'
import { eveningSlots, homeTonight, slotsLeft, tonightOpens } from './evening'
import { playEvent } from './events'
import {
  breakfastTomorrow, buildHouse, defaultHouse, EXTENSION_COSTS, extendHouse, FURNITURE, homeOf, HOUSE_COSTS, MISSES_NIGHTS, moveSpouse, nextLot, placeFurniture,
  roomFor, roomsInAll, sleepAt, sleepRows, swapRooms, takeRoom, waitingForRooms,
} from './homestead'
import {
  anotherNight, HOUSE_POINTS, HOUSE_TEMPLATES, householdNight, householdPlay, householdReady, houseLineOf, levelsTonight, missesLine, nightLevelCard, noteTheNight, readHousehold,
  spousesInOrder, VOWS_POINTS,
} from './household'
import { sceneSteps } from './love'
import { readiness } from './ready'

const AT = '2026-11-11T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** Her lines said in a scene, its own (not a choice's). */
const says = (steps: readonly Step[]): string[] => steps.flatMap((s) => ('say' in s ? [s.line] : []))
const BIRTHDAYS = birthdaysOf(PACK, new Map())
const context = (story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK): NightContext => ({ story, birthdays: BIRTHDAYS })

/** A named farm on `day`, the opening read and the stand-ins met (`joinCast`) at Friendship 0, rich enough to build. */
function farm(day = 30, gold = 1_000_000): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day }, gold }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
/** A spouse married on `wed`, waiting for a room (living in town). */
const spouse = (save: SaveV4, id: string, wed = 2, love: Partial<Love> = {}): SaveV4 => withLove(save, id, { stage: 'spouse', level: 0, points: 0, wed, ...love })
/** `n` more invented spouses (9000004 on), married on day 1 in id order, each waiting for a room (living in town). */
function more(save: SaveV4, n: number, from = 9000004): SaveV4 {
  const ids = Array.from({ length: n }, (_, i) => String(from + i))
  return {
    ...save,
    roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])) },
    love: { ...save.love, ...Object.fromEntries(ids.map((id) => [id, { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1 }])) },
  }
}
/** 9000001's bible with other wishes. */
function packWishing(wishes: UmaBible['wishes'], id = ONE): StoryPack {
  const bible: UmaBible = { ...json(STAND_IN_BIBLE), characterId: id }
  if (wishes) bible.wishes = wishes
  else delete bible.wishes
  return { ...PACK, bibles: new Map([...PACK.bibles, [id, bible]]) }
}
const NO_WISHES = packWishing(undefined)

describe('the houses', () => {
  it('costs the table: 408,000g for six, 612,000g extended; 2 rooms, 4 extended, 26 in all', () => {
    expect(HOUSE_COSTS).toEqual([8000, 20000, 40000, 70000, 110000, 160000])
    expect(EXTENSION_COSTS).toEqual([4000, 10000, 20000, 35000, 55000, 80000])
    expect(HOUSE_COSTS.reduce((a, b) => a + b)).toBe(408_000)
    expect(HOUSE_COSTS.reduce((a, b) => a + b) + EXTENSION_COSTS.reduce((a, b) => a + b)).toBe(612_000)
    expect([roomsOf({ extended: false }), roomsOf({ extended: true })]).toEqual([2, 4])
    let save = more(spouse(farm(), ONE), 5)
    for (let n = 1; n <= 6; n++) save = extendHouse(buildHouse(save, `House ${'abcdef'[n - 1]}`), n)
    expect(roomsInAll(save)).toEqual({ rooms: 26, taken: 0 })
    expect(save.gold).toBe(1_000_000 - 612_000)
    expect(nextLot(save)).toBeNull()
  })

  it('has the Farmhouse\'s two rooms from day 1, and house n to build from the n-th wedding', () => {
    const save = farm()
    expect(save.homestead.houses).toEqual([{ name: 'Farmhouse', extended: false }])
    expect(roomsOf(save.homestead.houses[0]!)).toBe(2)
    expect(nextLot(save)).toEqual({ n: 1, cost: 8000, open: false })
    expect(() => buildHouse(save, 'Rose Cottage')).toThrow('Opens with your first wedding.')
    expect(() => extendHouse(save, 0)).toThrow('The Farmhouse keeps its two rooms.')
    const wed = spouse(save, ONE)
    expect(nextLot(wed)).toEqual({ n: 1, cost: 8000, open: true })
    const built = buildHouse(wed, '  Rose   Cottage ')
    expect(built.homestead.houses[1]).toEqual({ name: 'Rose Cottage', extended: false })
    expect(built.homestead.slept).toEqual([0, 0])
    expect(built.gold).toBe(1_000_000 - 8000)
    expect(nextLot(built)).toEqual({ n: 2, cost: 20000, open: false })
    expect(() => buildHouse(built, 'Wren Hollow')).toThrow('Opens with your second wedding.')
    expect(nextLot(spouse(built, TWO, 3))).toEqual({ n: 2, cost: 20000, open: true })
    expect(parseSaveV6(json(built))).toEqual(built)
  })

  it('names a house by the letters rule, 1–20 characters, once; and refuses short gold', () => {
    const wed = spouse(farm(), ONE)
    expect(() => buildHouse(wed, '')).toThrow('Enter a name')
    expect(() => buildHouse(wed, 'House 7')).toThrow('Letters, spaces')
    expect(() => buildHouse(wed, 'A'.repeat(21))).toThrow('20 characters at most')
    expect(() => buildHouse(wed, 'farmhouse')).toThrow('Another house has that name.')
    expect(() => buildHouse({ ...wed, gold: 7999 }, 'Rose Cottage')).toThrow('Not enough gold')
    expect(buildHouse(wed, 'Wren’s Nook').homestead.houses[1]!.name).toBe('Wren’s Nook')
    const bad = json(buildHouse(wed, 'Rose Cottage'))
    bad.homestead.houses[1]!.name = 'Rose Cottage 2'
    expect(() => parseSaveV6(bad)).toThrow('save.homestead.houses.1.name')
    const renamed = json(wed)
    renamed.homestead.houses[0]!.name = 'Big House'
    expect(() => parseSaveV6(renamed)).toThrow('expected the Farmhouse')
  })
})

describe('rooms', () => {
  it('gives her the Farmhouse at her wedding, at once: she moves onto the farm', () => {
    const save = farm(30)
    expect(onFarm(save, ONE)).toBe(false)
    const wed = playWedding(save, NO_WISHES)
    expect(wed.love[ONE]!.house).toBe(0)
    expect(residentsOf(wed, 0)).toEqual([ONE])
    // On the farm: jobs and tending (`onFarm`), Ready and evenings (home).
    expect(onFarm(wed, ONE)).toBe(true)
    expect(homeTonight(wed, ONE)).toBe(true)
    expect(readiness(wed, PACK, ONE).waits?.kind).not.toBe('away')
    expect(parseSaveV6(json(wed))).toEqual(wed)
  })

  it('defaults to her closest friend\'s house when it has room, else the first with room, the Farmhouse first', () => {
    let save = spouse(spouse(farm(), ONE), TWO, 3)
    save = moveSpouse(buildHouse(save, 'Rose Cottage'), ONE, 1)
    // 9000002's closest friend is 9000001 (a strength-3 tie): Rose Cottage.
    expect(roomFor(save, NO_WISHES, TWO)).toBe(1)
    // 9000003's closest is 9000001 too (strength 2): Rose Cottage, while it has room.
    expect(roomFor(save, NO_WISHES, THREE)).toBe(1)
    const full = moveSpouse(save, TWO, 1)
    expect(roomFor(full, NO_WISHES, THREE)).toBe(0) // the Farmhouse first among the rest
  })

  it('gives an own-house wisher an empty house first, and passes her house over for others while another has room', () => {
    const wishing = packWishing(['own-house'])
    let save = buildHouse(spouse(spouse(farm(), ONE), TWO, 3), 'Rose Cottage')
    save = moveSpouse(save, TWO, 0)
    expect(roomFor(save, wishing, ONE)).toBe(1)
    save = moveSpouse(save, ONE, 1)
    expect(homeOf(save, wishing, ONE)).toEqual({ house: 1, name: 'Rose Cottage', needs: false, wish: false })
    // 9000003's closest friend lives in Rose Cottage, which 9000001 keeps: the Farmhouse instead.
    expect(roomFor(spouse(save, THREE, 4), wishing, THREE)).toBe(0)
    const shared = moveSpouse(spouse(save, THREE, 4), THREE, 1)
    expect(homeOf(shared, wishing, ONE)!.wish).toBe(true)
    expect(wishesOf(PACK, ONE)).toEqual(['own-house', 'birthday-alone'])
  })

  it('has her live in town with no room free ("Needs a room"), and moves her in the morning after a house is built', () => {
    let save = more(spouse(spouse(farm(30), TWO, 2), THREE, 3), 0)
    save = moveSpouse(moveSpouse(save, TWO, 0), THREE, 0)
    const wed = playWedding(save, NO_WISHES)
    expect(wed.love[ONE]!.house).toBeUndefined()
    expect(onFarm(wed, ONE)).toBe(false)
    expect(wed.dorm).toEqual(save.dorm)
    expect(homeOf(wed, NO_WISHES, ONE)).toMatchObject({ needs: true })
    expect(waitingForRooms(wed)).toEqual([ONE])
    // Nothing free overnight: she waits.
    expect(runNight(wed, context(NO_WISHES)).love[ONE]!.house).toBeUndefined()
    // House 1 built today: she moves in the next morning, and the morning says so.
    const built = buildHouse(wed, 'Rose Cottage')
    expect(built.love[ONE]!.house).toBeUndefined()
    const next = runNight(built, context(NO_WISHES))
    expect(next.love[ONE]!.house).toBe(1)
    expect(onFarm(next, ONE)).toBe(true)
    expect(next.summary!.hearts).toContainEqual({ kind: 'moved', id: ONE, house: 1 })
    expect(parseSaveV6(json(next))).toEqual(next)
  })

  it('moves a spouse to a free room, and swaps two, at once and free; refuses a full house', () => {
    let save = buildHouse(spouse(spouse(spouse(farm(), ONE), TWO, 3), THREE, 4), 'Rose Cottage')
    save = moveSpouse(moveSpouse(moveSpouse(save, ONE, 0), TWO, 0), THREE, 1)
    const gold = save.gold
    expect(() => moveSpouse(save, THREE, 0)).toThrow('No room free there.')
    expect(() => moveSpouse(save, THREE, 1)).toThrow('She lives there already.')
    const swapped = swapRooms(save, ONE, THREE)
    expect([swapped.love[ONE]!.house, swapped.love[THREE]!.house]).toEqual([1, 0])
    expect(swapped.gold).toBe(gold)
    expect(() => swapRooms(save, ONE, TWO)).toThrow('They share a house already.')
    expect(() => moveSpouse(farm(), ONE, 0)).toThrow('Only a spouse has a room.')
    // A spouse waiting for a room moves in from town.
    expect(moveSpouse(spouse(farm(), ONE), ONE, 0).love[ONE]!.house).toBe(0)
  })

  it('refuses a full house\'s extra resident and a house for anyone but a spouse', () => {
    const save = moveSpouse(moveSpouse(spouse(spouse(spouse(farm(), ONE), TWO, 3), THREE, 4), ONE, 0), TWO, 0)
    const crowded = json(save)
    crowded.love[THREE]!.house = 0
    expect(() => parseSaveV6(crowded)).toThrow('save.homestead.houses.0: expected at most 2 residents')
    // A spouse in her house with a Dorm bed (a save from before the Dorm retired) loads, the bed cleared.
    const bed = json(save)
    bed.dorm.home.push(ONE)
    expect(parseSaveV6(bed).dorm.home).toEqual([])
    const friend = json(farm())
    friend.love[ONE]!.house = 0
    expect(() => parseSaveV6(friend)).toThrow('save.love.9000001.house: only a spouse')
  })
})

describe('the night', () => {
  it('defaults Sleep at to the house slept in least lately, ties the lower number; your pick is noted, then cleared', () => {
    let save = buildHouse(spouse(spouse(farm(30), ONE), TWO, 3), 'Rose Cottage')
    save = moveSpouse(moveSpouse(save, ONE, 0), TWO, 1)
    expect(defaultHouse(save)).toBe(0) // both never: the lower number
    const night1 = noteTheNight(save)
    expect(night1.night).toEqual({ house: 0, alone: null, companion: ONE })
    expect(night1.save.homestead.slept).toEqual([30, 0])
    expect(defaultHouse(night1.save)).toBe(1)
    const picked = sleepAt(night1.save, 0)
    expect(noteTheNight(picked)).toMatchObject({ night: { house: 0, alone: null }, save: { homestead: { tonight: null } } })
    expect(() => sleepAt(save, 4)).toThrow('That house isn’t built.')
    // Before the first wedding nothing is noted.
    expect(noteTheNight(farm()).night).toBeNull()
  })

  it('pays +10 bond a night to each pair sharing a house', () => {
    let save = buildHouse(spouse(spouse(spouse(farm(30), ONE), TWO, 3), THREE, 4), 'Rose Cottage')
    save = moveSpouse(moveSpouse(moveSpouse(save, TWO, 0), THREE, 0), ONE, 1)
    const before = bondOf(save, TWO, THREE)
    const next = runNight(save, context(NO_WISHES))
    expect(bondOf(next, TWO, THREE)).toBe(before + 10)
    expect(bondOf(next, ONE, TWO)).toBe(bondOf(save, ONE, TWO))
  })

  it('reaches S2 and S4 at night when their 600 is full, with the morning\'s line; never S3 or S5', () => {
    const save = spouse(spouse(spouse(farm(30), ONE, 2, { level: 1, points: 600 }), TWO, 3, { level: 3, points: 650 }), THREE, 4, { level: 2, points: 600 })
    const { save: leveled, levels } = levelsTonight(save)
    expect(levels).toEqual([{ kind: 'level', id: ONE, rung: 's2' }, { kind: 'level', id: TWO, rung: 's4' }])
    expect(leveled.love[ONE]).toMatchObject({ level: 2, points: 0, morning: 30 })
    expect(leveled.love[TWO]).toMatchObject({ level: 4, points: 50 })
    expect(leveled.love[THREE]).toMatchObject({ level: 2, points: 600 }) // S3 is an event
    expect(readiness(save, PACK, ONE).waits?.kind).toBe('night')
    const morning = runNight(save, context())
    expect(morning.summary!.hearts.filter((h) => h.kind === 'level')).toEqual(levels)
    expect(parseSaveV6(json(morning))).toEqual(morning)
  })

  it('plays S2\'s and S4\'s scene from the morning: her route\'s, else the default story\'s, then the card', async () => {
    const save = spouse(spouse(farm(30), ONE, 2, { level: 1, points: 600 }), TWO, 3, { level: 3, points: 650 })
    const { save: leveled } = levelsTonight(save)
    // The default story writes both: her name filled in, tender, paying nothing.
    const s2 = await eventOf(PACK, TWO, 's2', 'Robin')
    expect(s2).toMatchObject({ id: 's2', written: false })
    expect(s2.steps[0]).toEqual({ narrate: DEFAULT_EVENTS.s2!.moment })
    for (const s of s2.steps) if ('choice' in s) expect(s.choice.every((o) => !o.friendship && !o.romance)).toBe(true)
    expect((await eventOf(PACK, ONE, 's4')).steps[0]).toEqual({ narrate: DEFAULT_EVENTS.s4!.moment })
    // Her route's own replaces it.
    const own = { ...PACK, route: async () => ({ events: [{ id: 's2', steps: [{ narrate: 'Her own noon.' }, { say: TWO, line: 'Lunch!', emote: 'happy' as const }] }] }) }
    expect(await eventOf(own, TWO, 's2')).toEqual({ id: 's2', steps: [{ narrate: 'Her own noon.' }, { say: TWO, line: 'Lunch!', emote: 'happy' }], written: true })
    // The card after it: her last line, no "no event"; without a scene, as built.
    const card = nightLevelCard(leveled, PACK, TWO, 's4', s2.steps)!
    expect(card).toMatchObject({ rung: 's4', night: true, scene: true, perk: 'night-chore-3' })
    expect(card.line).toBe(says(s2.steps).at(-1))
    // As played, a choice's answer in: her last line is the answer's.
    const played = sceneSteps(s2.steps, [0])
    expect(nightLevelCard(leveled, PACK, TWO, 's4', played)!.line).toBe(says(played).at(-1))
    expect(says(played).at(-1)).not.toBe(says(s2.steps).at(-1))
    expect(nightLevelCard(leveled, PACK, ONE, 's2')).toMatchObject({ rung: 's2', night: true, line: null })
    expect(nightLevelCard(leveled, PACK, ONE, 's2')!.scene).toBeUndefined()
  })
})

describe('the house\'s morning', () => {
  /** 9000001 and 9000002 in the Farmhouse, married on day 2, 9000003 home in the Dorm. */
  const house = (love: Partial<Love> = {}) => moveSpouse(moveSpouse(spouse(spouse(farm(30), ONE, 2, love), TWO, 3, love), ONE, 0), TWO, 0)

  it('pays +30 to each resident of the house slept in, and says so', () => {
    const save = house()
    const next = runNight(save, context(NO_WISHES))
    const line = next.summary!.hearts.find((h) => h.kind === 'house')
    expect(line).toEqual({ kind: 'house', house: 0, umas: [ONE, TWO], paid: 60, breakfast: 0, items: 0 })
    expect(next.love[ONE]!.points).toBe(save.love[ONE]!.points + HOUSE_POINTS)
    expect(parseSaveV6(json(next))).toEqual(next)
  })

  it('serves her breakfast once (S1), only to those with no meal left; ☕ on Sleep at the day before', () => {
    const save = house({ level: 1 })
    expect(breakfastTomorrow(save, 0)).toBe(true)
    expect(sleepRows(save, NO_WISHES, BIRTHDAYS)[0]).toMatchObject({ house: 0, residents: [ONE, TWO], breakfast: true, nights: null })
    const next = runNight(save, context(NO_WISHES))
    // It feeds those who live on the farm: the two in the Farmhouse, not 9000003 in town.
    expect(next.summary!.hearts.find((h) => h.kind === 'house')).toMatchObject({ breakfast: 2 })
    expect([ONE, TWO, THREE].map((id) => next.roster[id]!.wellFed)).toEqual([1, 1, 0])
    // A meal running (a reception today): no breakfast, no ☕.
    const fed = { ...save, today: { ...save.today, reception: 2 } }
    expect(breakfastTomorrow(fed, 0)).toBe(false)
    expect(runNight(fed, context(NO_WISHES)).summary!.hearts.find((h) => h.kind === 'house')).toMatchObject({ breakfast: 0 })
  })

  it('leaves one more morning item for each resident at S2, in her own item line', () => {
    const save = house({ level: 2, morning: 29 })
    const next = runNight(save, context(NO_WISHES))
    expect(next.summary!.hearts.find((h) => h.kind === 'house')).toMatchObject({ items: 2 })
    const items = next.summary!.hearts.filter((h) => h.kind === 'item')
    // Day 31 is an every-2nd morning from day 29: her count's item, then the house's.
    expect(items.map((h) => (h as { items: string[] }).items.length)).toEqual([2, 2])
    for (const line of items) for (const key of (line as { items: string[] }).items) expect(Number(key.split('@')[1])).toBeGreaterThanOrEqual(3)
    expect(parseSaveV6(json(next))).toEqual(next)
  })

  it('draws a house line from the pack, else the templates by temperament', () => {
    const named = (id: string) => `Stand-in ${Number(id) - 9_000_000}`
    const ones = Array.from({ length: 20 }, (_, d) => houseLineOf('u1', d, [ONE], PACK.household, () => 'steady', named)!)
    expect(ones.every((l) => PACK.household!.houseLines![ONE]!.includes(l.text))).toBe(true)
    const threes = Array.from({ length: 20 }, (_, d) => houseLineOf('u1', d, [THREE], PACK.household, () => 'clever', named)!)
    expect(threes.every((l) => HOUSE_TEMPLATES.clever.map((t) => t.replaceAll('{name}', 'Stand-in 3')).includes(l.text))).toBe(true)
    expect(houseLineOf('u1', 3, [], PACK.household, () => 'clever', named)).toBeNull()
    for (const lines of Object.values(HOUSE_TEMPLATES)) {
      expect(lines).toHaveLength(3)
      for (const line of lines) expect(line).toContain('{name}')
    }
  })

  it('invites you warmly to a house not slept in for 8 nights; Another night puts it away; never a penalty', () => {
    let save = buildHouse(spouse(spouse(farm(40), ONE), TWO, 3), 'Rose Cottage')
    save = moveSpouse(moveSpouse(save, ONE, 0), TWO, 1)
    save = { ...save, homestead: { ...save.homestead, slept: [39, 40 - MISSES_NIGHTS], tonight: 0 } }
    expect(sleepRows(save, NO_WISHES, BIRTHDAYS).map((r) => r.nights)).toEqual([null, 8])
    const next = runNight(save, context(NO_WISHES))
    expect(next.summary!.hearts).toContainEqual({ kind: 'misses', house: 1 })
    expect(missesLine(next)).toEqual({ kind: 'misses', house: 1 })
    const away = anotherNight(next)
    expect(away.summary!.hearts.some((h) => h.kind === 'misses')).toBe(false)
    expect(away.love).toBe(next.love)
  })

  it('gives her birthday morning to her alone in her room: only her +30, breakfast and item', () => {
    const birthday = BIRTHDAYS.get(ONE)!
    let save = house({ level: 2, morning: birthday - 3 })
    save = { ...save, calendar: { day: birthday } }
    const rows = sleepRows(save, PACK, BIRTHDAYS)
    expect(rows.at(-1)).toMatchObject({ house: 0, residents: [ONE], alone: ONE })
    save = sleepAt(save, 0, ONE, BIRTHDAYS)
    expect(() => sleepAt({ ...save, calendar: { day: birthday + 1 } }, 0, ONE, BIRTHDAYS)).toThrow('Her room is hers on her birthday.')
    const next = runNight(save, context())
    expect(next.summary!.hearts.find((h) => h.kind === 'house')).toMatchObject({ umas: [ONE], paid: 30, items: 1 })
    expect(next.love[TWO]!.points).toBe(save.love[TWO]!.points)
  })
})

describe('the household', () => {
  /** `n` married spouses, all invented, on day `day`, away (the Dorm holds 20). */
  const marriedFarm = (n: number, day = 30) => more(farm(day), n, 9000004)

  it('announces each milestone once as the count passes it, gives the furniture at 5 and opens House 1 at 1', () => {
    const one = runNight(marriedFarm(1), context())
    expect(one.summary!.news).toContainEqual({ kind: 'household', married: 1 })
    expect(one.homestead).toMatchObject({ married: 1, furniture: [] })
    expect(runNight(one, context()).summary!.news.some((n) => n.kind === 'household')).toBe(false)
    const five = householdNight(more(one, 4, 9000010))
    expect(five.news).toEqual([{ kind: 'household', married: 5 }])
    expect(five.save.homestead.furniture).toEqual([null, null, null, null, null])
    const placed = placeFurniture(five.save, 0, 0)
    expect(placed.homestead.furniture).toEqual([0, null, null, null, null])
    expect(() => placeFurniture(placed, 1, 0)).toThrow('That house has a piece already.')
    expect(() => placeFurniture(one, 0, 0)).toThrow('The furniture comes at 5 married.')
    expect(FURNITURE).toHaveLength(5)
    expect(parseSaveV6(json(placed))).toEqual(placed)
  })

  it('makes household scenes Ready from the morning after 5, 10 and 15, once each, never auto-played', () => {
    const four = runNight(marriedFarm(4), context())
    expect(householdReady(four)).toEqual([])
    const five = runNight(more(four, 1, 9000020), context())
    expect(householdReady(five)).toEqual(['household:5'])
    const play = householdPlay(five, householdOf(PACK), 'household:5')!
    // Invented spouses without a beat say the game's one line, between the pack's open and close.
    expect(play.parts.map((p) => p.who)).toEqual([null, ...spousesInOrder(five), null])
    expect(play.parts[1]!.steps).toEqual(placeholderHouseholdBeat(5, spousesInOrder(five)[0]!))
    const read = readHousehold(five, 'household:5')
    expect(householdReady(read)).toEqual([])
    expect(readHousehold(read, 'household:5')).toBe(read)
    const fifteen = runNight(more(read, 10, 9000030), context())
    expect(householdReady(fifteen)).toEqual(['household:10', 'household:15'])
    expect(parseSaveV6(json(fifteen))).toEqual(fifteen)
  })

  it('plays each spouse\'s beat in wedding order', () => {
    const save = moveSpouse(spouse(spouse(farm(), TWO, 5), ONE, 7), TWO, 0)
    const play = householdPlay(save, householdOf(PACK), 'household:10')!
    expect(play.parts.map((p) => p.who)).toEqual([null, TWO, ONE, null])
    expect(play.title).toBe('Household scene 2')
  })

  it('opens the finale once, the morning after the 20th wedding, then the Festival of Vows each later year', () => {
    const nineteen = runNight(marriedFarm(19, 50), context())
    expect(nineteen.homestead.finale).toBe(0)
    const wed = more(nineteen, 1, 9000100)
    expect(householdReady(wed)).not.toContain('finale')
    const morning = runNight(wed, context())
    expect(marriedCount(morning)).toBe(FINALE_MARRIED)
    expect(morning.homestead.finale).toBe(52)
    expect(morning.summary!.news).toContainEqual({ kind: 'household', married: 20 })
    expect(householdReady(morning)).toContain('finale')
    const finale = householdPlay(morning, householdOf(PACK), 'finale')!
    expect(finale.play).toEqual({ game: 'dance', prompt: 'Lead the harvest dance.' })
    expect(finale.title).toBe('The Great Harvest')
    const done = readHousehold(morning, 'finale')
    expect(householdReady(done)).not.toContain('finale')
    // A year on: every spouse +50 and a festival night.
    const eve: SaveV4 = { ...done, calendar: { day: 52 + DAYS_PER_YEAR - 1 }, summary: null }
    const vows = runNight(eve, context())
    expect(vowsOn(vows.homestead, vows.calendar.day)).toBe(true)
    const line = vows.summary!.hearts.find((h) => h.kind === 'vows')
    expect(line).toEqual({ kind: 'vows', spouses: 20, paid: 20 * VOWS_POINTS })
    expect(eveningSlots(vows)).toMatchObject({ vows: true })
    expect(slotsLeft(vows).festival).toBe(true)
    expect(parseSaveV6(json(vows))).toEqual(vows)
    const after = runNight(vows, context())
    expect(after.summary!.hearts.some((h) => h.kind === 'vows')).toBe(false)
  })

  it('opens Tonight once anyone is married (Sleep at)', () => {
    expect(tonightOpens({ ...farm(), today: { ...farm().today, evenings: [] } }, PACK)).toBe(false)
    expect(tonightOpens(moveSpouse(spouse(farm(), ONE), ONE, 0), PACK)).toBe(true)
  })
})

describe('the format: household.json and wishes', () => {
  const ctx = { umas: new Set(STAND_INS) }
  const household = () => json(STAND_IN_FILES.household) as Household

  it('reads the stand-in household and 9000001\'s wishes clean', () => {
    expect(checkHousehold(household(), ctx)).toMatchObject({ errors: [], notes: [] })
    expect(checkBible(STAND_IN_BIBLE, ONE, ctx)).toMatchObject({ errors: [], notes: [] })
    expect(PACK.household!.scenes!.map((s) => s.at)).toEqual([5, 10, 15])
  })

  it('reads a scene or the finale without a beat for every Uma: hers is skipped as it plays', () => {
    const missing = household()
    delete missing.scenes![0]!.each![THREE]
    delete missing.finale!.each![TWO]
    expect(checkHousehold(missing, ctx)).toMatchObject({ errors: [], notes: [] })
  })

  it('skips a scene written twice and a line too long; a speaker outside the scene\'s and a stranger\'s lines are notes; a bad wish is skipped', () => {
    const h = household()
    h.scenes![1]!.at = 5
    h.scenes![0]!.open!.push({ say: ONE, line: 'Hello.' })
    h.houseLines![ONE] = ['x'.repeat(121), 'Good morning, sir.']
    h.houseLines!['9000099'] = ['Hi.']
    const read = checkHousehold(h, ctx)
    expect(read.errors).toEqual([
      'Household scene at 5: written twice; the later one is skipped',
      'houseLines 9000001 1: its line is 121 characters; the screen shows 120; skipped',
    ])
    expect(read.notes).toContain('Household scene at 5 open, step 4: 9000001 isn’t one who speaks here (one outside the cast and the town’s people shows as “An Uma”)')
    // The protagonist is a man: a word that genders him is no note.
    expect(read.notes.filter((n) => n.startsWith('houseLines 9000001 2'))).toEqual([])
    expect(read.notes).toContain('houseLines 9000099: not in the cast')
    expect(read.value!.scenes!.map((s) => s.at)).toEqual([5, 15])
    expect(read.value!.houseLines![ONE]).toEqual(['Good morning, sir.'])
    const wish = checkBible({ ...json(STAND_IN_BIBLE), wishes: ['own-house', 'own-house', 'a-pony'] }, ONE, ctx)
    expect(wish.errors).toEqual(['wishes 3: a-pony isn’t one of own-house and birthday-alone; skipped'])
    expect(wish.notes).toEqual(['wishes: own-house is listed twice; once is kept'])
    expect(wish.value!.wishes).toEqual(['own-house'])
  })

  it('plays a household with only some of its parts: no open or close, a finale with no play', () => {
    const h: Household = { scenes: [{ at: 5, each: { [ONE]: [{ say: ONE, line: 'Home.' }] } }], finale: { each: {} } }
    expect(checkHousehold(h, ctx)).toMatchObject({ errors: [], notes: [] })
    const save = { ...spouse(farm(), ONE), homestead: { ...spouse(farm(), ONE).homestead, married: 5 } }
    expect(householdPlay(save, h, 'household:5')).toMatchObject({ play: null, parts: [{ who: null, steps: [] }, { who: ONE }, { who: null, steps: [] }] })
    expect(householdPlay(save, h, 'finale')).toMatchObject({ play: null })
    expect(householdPlay(save, { houseLines: {} }, 'household:10')).toBeNull()
  })
})

/** 9000001's wedding played on `save` with her default room (the stand-in's script). */
function playWedding(save: SaveV4, pack: StoryPack): SaveV4 {
  const ready = withLove(save, ONE, { stage: 'wedding', level: 10, points: 0, last: save.calendar.day - 1, ring: 3 })
  const route = STAND_IN_FILES.routes[ONE] as { events: { id: string; steps: never[] }[] }
  const steps = json(route.events.find((e) => e.id === 'wedding')!.steps)
  return playEvent(ready, pack, ONE, { event: { id: 'wedding', steps }, picks: [0, 1], plays: [{ kind: 'rhythm', score: 95 }], place: 'chapel-bell', reception: null }).save
}

describe('a wedding\'s room', () => {
  it('takes a wedding\'s room through takeRoom: none free, she keeps her bed', () => {
    const save = moveSpouse(moveSpouse(spouse(spouse(spouse(farm(), ONE), TWO, 3), THREE, 4), TWO, 0), THREE, 0)
    expect(takeRoom(save, NO_WISHES, ONE)).toEqual({ save, house: null })
  })
})
