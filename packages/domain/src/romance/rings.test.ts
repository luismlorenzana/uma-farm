// The ring bench, the proposal and the wedding: the rings in the
// catalogue, the bench's opening and recipe, the proposal's ring, a better ring, the wedding's place, reception, guests
// and vow, the words, and the format's `wedding.places`. Invented ids only: the stand-ins 9000001–9000003.
import { describe, expect, it } from 'vitest'
import { DAYS_PER_YEAR } from '../farm/calendar'
import { diaryEntries, payDiary } from '../farm/diary'
import { DIARY_ROWS, RING_ROW } from '../farm/milestones'
import { GOOD_FAMILIES, GOODS, goodOf, isGoodId, isGoodOrRingId, RING_GOODS, RING_IDS, ringGrade, ringName } from '../goods/ids'
import { goodName } from '../goods/names'
import { priceOf } from '../goods/prices'
import { runNight, type NightContext } from '../night/end-day'
import { payBin, ship } from '../save/bin'
import { parseSaveV6 } from '../save/parse-v4'
import { newSave, newTodayV4, type Love, type SaveV4 } from '../save/v4'
import { addGoods, goodCount } from '../save/warehouse'
import { checkBible, type Step } from '../story/authored'
import { STAND_IN_BIBLE, STAND_IN_ROUTE, STAND_INS } from '../story/authored.fixture'
import { BENCH_SCENE_LINES } from '../story/bench'
import { storyPackFrom } from '../story/pack'
import { BENCH_SCENE, readScene, sceneDue } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { joinCast } from './meeting.fixture'
import {
  BENCH_WORDS, benchDue, benchGrades, benchOpen, benchPick, benchStock, betterRings, forgeRecipe, giveRing, heldRings, makeRing, MAKE_BONUS, ringPercent,
  type BenchInput,
} from './bench'
import { playEvent, type EventOutcome, type PlayScore } from './events'
import { costOf, isAnniversary } from './love'
import { ringBonus, romanceTerms } from './perk-terms'
import { readiness } from './ready'
import {
  anniversaryOf, CAKE_DAYS, nextHousehold, receptionDays, receptionDishes, vowFlag, weddingGuests, weddingPlaceFlag, weddingPlaceOf,
} from './wedding'
import { WEDDING_DEFAULTS, weddingPlaces } from '../story/placeholders'

const AT = '2026-11-11T10:00:00.000Z'
const LATER = '2026-11-11T21:30:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE]: readonly string[] = STAND_INS
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const context = (): NightContext => ({ story: PACK })

/** A named farm on `day`, the opening read and the stand-ins met (`joinCast`) at Friendship 0, living in town. */
function farm(day = 3): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, love: Partial<Love>, id = ONE): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const give = (save: SaveV4, good: string, stars = 1, count = 1): SaveV4 => ({ ...save, items: addGoods(save.items, good, stars, count) })
const bench = (save: SaveV4): SaveV4 => ({ ...save, buildings: { ...save.buildings, forge: 0 } })
const three = (...ids: string[]): BenchInput[] => ids.map((id) => ({ id, stars: 1 }))
const steps = (id: string): Step[] => json(STAND_IN_ROUTE.events.find((e) => e.id === id)!.steps)
const walk: PlayScore = { kind: 'walk', score: 80 }
const dance: PlayScore = { kind: 'rhythm', score: 95 }
const proposal = (ring?: string): EventOutcome => ({ event: { id: 'proposal', steps: steps('proposal') }, picks: [0, 0], plays: [walk], ...(ring ? { ring } : {}) })
const wedding = (place: string | undefined, reception: EventOutcome['reception'], picks = [0, 1]): EventOutcome =>
  ({ event: { id: 'wedding', steps: steps('wedding') }, picks, plays: [dance], ...(place ? { place } : {}), ...(reception !== undefined ? { reception } : {}) })
/** 9000001 the day after her Romance 10, the proposal waiting. */
const engagedSoon = (day = 20): SaveV4 => withLove(farm(day), { stage: 'proposal', level: 10, points: 40, last: day - 1 })
/** 9000001 engaged with an Iron Ring, the wedding Ready on `day`. */
const engaged = (day = 21): SaveV4 => withLove(farm(day), { stage: 'wedding', level: 10, points: 0, last: day - 1, ring: 3 })

describe('the rings', () => {
  it('are ten goods at their ★1 prices, Copper to Orichalcum Ring, apart from the 260 goods', () => {
    expect(RING_IDS).toEqual(['ring-g1', 'ring-g2', 'ring-g3', 'ring-g4', 'ring-g5', 'ring-g6', 'ring-g7', 'ring-g8', 'ring-g9', 'ring-g10'])
    expect(RING_GOODS.map((g) => g.price)).toEqual([205, 275, 340, 450, 580, 745, 950, 1220, 1555, 2025])
    expect(RING_GOODS.map((g) => goodName(g.id))).toEqual(['Copper Ring', 'Tin Ring', 'Iron Ring', 'Silver Ring', 'Cobalt Ring', 'Gold Ring', 'Platinum Ring',
      'Titanium Ring', 'Mythril Ring', 'Orichalcum Ring'])
    expect(goodOf('ring-g3')).toEqual({ id: 'ring-g3', family: 'rings', grade: 3, refined: false, crop: false, price: 340, input: null })
    expect([ringGrade('ring-g10'), ringGrade('iron-ingot'), ringName(5)]).toEqual([10, 0, 'Cobalt Ring'])
    expect([isGoodId('ring-g3'), isGoodOrRingId('ring-g3'), isGoodOrRingId('cedar-plank')]).toEqual([false, true, true])
  })

  it('sell at the bin like any good (no demand), and count in the Diary', () => {
    const save = give(farm(), 'ring-g3')
    const shipped = ship(save, 'ring-g3', 1, 1)
    expect(priceOf('ring-g3', 1, save.calendar.day)).toBe(340)
    const paid = payBin(shipped, save.calendar.day)
    expect(paid.gold).toBe(340)
    expect(paid.save.diary.shipped['ring-g3']).toBe(1)
    expect(diaryEntries(paid.save)).toBe(1)
    expect(parseSaveV6(json(paid.save))).toEqual(paid.save)
  })

  it('form the Diary\'s 30th row, ten rings shipped once each paying the row\'s gold', () => {
    expect(RING_ROW).toEqual({ id: 'row:rings', family: 'rings', refined: false, goods: RING_IDS })
    expect(DIARY_ROWS).toHaveLength(30)
    expect(DIARY_ROWS.at(-1)).toEqual(RING_ROW)
    const all = { ...farm(), diary: { ...farm().diary, shipped: Object.fromEntries(RING_IDS.map((id) => [id, 1])) } }
    const { save, paid } = payDiary(all)
    expect(paid).toEqual(['row:rings'])
    expect(save.gold).toBe(all.gold + 500)
    expect(payDiary(save).paid).toEqual([])
  })
})

describe('the bench opens', () => {
  it('the night after the first Romance 8, once; its scene plays the next morning, once; never before', () => {
    let save = { ...farm(5), memories: { [ONE]: ['f1', 'f2', 'r7'] } }
    expect(benchDue(save)).toBe(false)
    save = runNight(save, context())
    expect(save.buildings.forge).toBeUndefined()
    expect(benchOpen(save)).toBe(false)
    save = { ...save, summary: null, arrivals: [...STAND_INS], memories: { [ONE]: ['f1', 'f2', 'r7', 'r8'] } }
    expect(sceneDue(save)).toBeNull()
    save = runNight(save, context())
    expect(save.buildings.forge).toBe(0)
    expect(benchOpen(save)).toBe(true)
    expect(sceneDue(save)).toBeNull() // the summary first
    save = { ...save, summary: null }
    expect(sceneDue(save)).toBe(BENCH_SCENE)
    const read = readScene(save, BENCH_SCENE)
    expect(read.diary.read).toContain('scene:bench')
    expect(sceneDue(read)).toBeNull()
    const again = runNight({ ...read, memories: { ...read.memories, [TWO]: ['r8'] } }, context())
    expect(again.buildings.forge).toBe(0)
    expect(parseSaveV6(json(again))).toEqual(again)
  })
})

describe('making a ring', () => {
  it('3 Cedar Planks make an Iron Ring at ★1; no gold moves; one a day', () => {
    const save = give(bench(farm()), 'cedar-plank', 1, 4)
    expect(benchPick(save, 3)).toEqual(three('cedar-plank', 'cedar-plank', 'cedar-plank'))
    expect(benchGrades(save)).toEqual([3])
    const { save: made, ring } = makeRing(save, three('cedar-plank', 'cedar-plank', 'cedar-plank'))
    expect(ring).toBe('ring-g3')
    expect(made.items['ring-g3']).toEqual([1, 0, 0, 0, 0])
    expect(goodCount(made.items, 'cedar-plank')).toBe(1)
    expect(made.gold).toBe(save.gold)
    expect(made.today.ring).toBe(3)
    expect(parseSaveV6(json(made))).toEqual(made)
    const more = give(made, 'cedar-plank', 1, 3)
    expect(() => makeRing(more, three('cedar-plank', 'cedar-plank', 'cedar-plank'))).toThrow(BENCH_WORDS.today)
    const tomorrow = runNight(more, context())
    expect(tomorrow.today.ring).toBe(0)
    expect(makeRing(tomorrow, three('cedar-plank', 'cedar-plank', 'cedar-plank')).ring).toBe('ring-g3')
  })

  it('3 Salmon Fillets make a Cobalt Ring; any mix of refined goods of one grade works', () => {
    const fish = give(bench(farm()), 'salmon-fillet', 2, 3)
    expect(makeRing(fish, [{ id: 'salmon-fillet', stars: 2 }, { id: 'salmon-fillet', stars: 2 }, { id: 'salmon-fillet', stars: 2 }]).ring).toBe('ring-g5')
    const mix = give(give(give(bench(farm()), 'cedar-plank'), 'pearl-barley'), 'sardine-fillet')
    expect(makeRing(mix, three('cedar-plank', 'pearl-barley', 'sardine-fillet')).save.items['ring-g3']).toEqual([1, 0, 0, 0, 0])
  })

  it('refuses two goods, raw goods, mixed grades, goods not held, and a closed bench', () => {
    const save = give(give(give(bench(farm()), 'cedar-plank', 1, 3), 'cedar-log', 1, 3), 'birch-plank', 1, 3)
    expect(() => makeRing(save, three('cedar-plank', 'cedar-plank'))).toThrow(BENCH_WORDS.three)
    expect(() => makeRing(save, three('cedar-log', 'cedar-log', 'cedar-log'))).toThrow(BENCH_WORDS.three)
    expect(() => makeRing(save, three('cedar-plank', 'cedar-plank', 'birch-plank'))).toThrow(BENCH_WORDS.three)
    expect(() => makeRing(save, three('oak-plank', 'oak-plank', 'oak-plank'))).toThrow(BENCH_WORDS.short)
    expect(() => makeRing(save, [{ id: 'cedar-plank', stars: 2 }, { id: 'cedar-plank', stars: 1 }, { id: 'cedar-plank', stars: 1 }])).toThrow(BENCH_WORDS.short)
    const closed = give(farm(), 'cedar-plank', 1, 3)
    expect(() => makeRing(closed, three('cedar-plank', 'cedar-plank', 'cedar-plank'))).toThrow(BENCH_WORDS.closed)
  })

  it('takes the recipe, 2 ingots and a cut gem, once the Smelter and the Cutter stand', () => {
    expect(forgeRecipe(3)).toEqual({ ingot: 'iron-ingot', gem: 'cut-citrine' })
    const save = give(give(bench(farm()), 'iron-ingot', 1, 2), 'cut-citrine')
    const recipe = three('iron-ingot', 'iron-ingot', 'cut-citrine')
    expect(() => makeRing(save, recipe)).toThrow(BENCH_WORDS.mining)
    expect(benchPick(save, 3)).toBeNull()
    expect(benchPick({ ...save, buildings: { ...save.buildings, smelter: 1 } }, 3)).toBeNull()
    const built = { ...save, buildings: { ...save.buildings, smelter: 1, cutter: 1 } }
    expect(benchPick(built, 3)).toEqual(recipe)
    expect(makeRing(built, recipe).ring).toBe('ring-g3')
  })

  it('picks the lowest-value goods of the grade first, fewer stars first, any family', () => {
    const save = give(give(give(bench(farm()), 'sardine-fillet', 1, 3), 'cedar-plank', 2, 1), 'cedar-plank', 1, 1)
    const stock = benchStock(save, 3)
    expect(stock.map((s) => `${s.id}@${s.stars}`)).toEqual(['cedar-plank@1', 'cedar-plank@2', 'sardine-fillet@1'])
    expect(benchPick(save, 3)).toEqual([{ id: 'cedar-plank', stars: 1 }, { id: 'cedar-plank', stars: 2 }, { id: 'sardine-fillet', stars: 1 }])
  })
})

describe('the proposal', () => {
  it('isn\'t Ready before the day after Romance 10, nor without a ring', () => {
    const today = withLove(farm(20), { stage: 'proposal', level: 10, last: 20 })
    expect(readiness(give(today, 'ring-g3'), PACK, ONE).waits).toEqual({ kind: 'day' })
    expect(readiness(engagedSoon(), PACK, ONE).waits).toEqual({ kind: 'ring' })
    expect(readiness(give(engagedSoon(), 'ring-g3'), PACK, ONE).ready).toBe(true)
  })

  it('uses the ring you chose, sets her ring\'s grade and always succeeds: engaged', () => {
    const save = give(give(engagedSoon(), 'ring-g3'), 'ring-g5')
    expect(heldRings(save)).toEqual(['ring-g5', 'ring-g3'])
    const { save: after, card } = playEvent(save, PACK, ONE, proposal('ring-g3'))
    expect(after.love[ONE]).toMatchObject({ stage: 'wedding', level: 10, ring: 3, last: 20 })
    expect(goodCount(after.items, 'ring-g3')).toBe(0)
    expect(goodCount(after.items, 'ring-g5')).toBe(1)
    expect(card).toMatchObject({ rung: 'proposal', stage: 'engaged', ring: 'ring-g3', wedding: null })
    expect(card.next).toMatchObject({ rung: 'wedding', cost: 0 })
    // A Fine and the lesser options still succeed.
    const fine = playEvent(save, PACK, ONE, { ...proposal('ring-g5'), picks: [1, 1], plays: [{ kind: 'walk', score: 0 }] })
    expect(fine.save.love[ONE]).toMatchObject({ stage: 'wedding', ring: 5 })
    expect(parseSaveV6(json(after))).toEqual(after)
  })

  it('refuses without a ring chosen, or one not in the Warehouse', () => {
    const save = give(engagedSoon(), 'ring-g3')
    expect(() => playEvent(save, PACK, ONE, proposal())).toThrow('Choose a ring from the Warehouse.')
    expect(() => playEvent(save, PACK, ONE, proposal('ring-g4'))).toThrow('Choose a ring from the Warehouse.')
    expect(() => playEvent(save, PACK, ONE, proposal('cedar-plank'))).toThrow('Choose a ring from the Warehouse.')
  })
})

describe('a better ring', () => {
  it('takes a higher grade, gives the old one back at ★1, and raises her bonus once married', () => {
    const save = give(engaged(), 'ring-g5', 2)
    expect(betterRings(give(save, 'ring-g2'), ONE)).toEqual(['ring-g5'])
    const better = giveRing(save, ONE, 'ring-g5')
    expect(better.love[ONE]!.ring).toBe(5)
    expect(better.items['ring-g3']).toEqual([1, 0, 0, 0, 0])
    expect(goodCount(better.items, 'ring-g5')).toBe(0)
    expect(ringBonus({ stage: 'spouse', ring: 3 })).toBeCloseTo(0.03, 9)
    expect(ringBonus({ ...better.love[ONE]!, stage: 'spouse' })).toBeCloseTo(0.05, 9)
    expect([ringPercent(5), MAKE_BONUS]).toEqual([5, { rough: 0, fine: 1, great: 3, masterwork: 5 }])
  })

  it('refuses a ring no better than hers, and any before the proposal', () => {
    const save = give(give(engaged(), 'ring-g2'), 'ring-g3')
    expect(() => giveRing(save, ONE, 'ring-g2')).toThrow('A better ring: a higher grade than hers.')
    expect(() => giveRing(save, ONE, 'ring-g3')).toThrow('A better ring: a higher grade than hers.')
    expect(() => giveRing(give(farm(), 'ring-g5'), ONE, 'ring-g5')).toThrow('Her ring comes with the proposal.')
    expect(betterRings(give(farm(), 'ring-g5'), ONE)).toEqual([])
  })
})

describe('the wedding', () => {
  it('is Ready the day after the proposal and waits until you play it', () => {
    const played = playEvent(give(engagedSoon(), 'ring-g3'), PACK, ONE, proposal('ring-g3')).save
    expect(readiness(played, PACK, ONE)).toMatchObject({ rung: 'wedding', ready: false })
    const tomorrow = { ...played, calendar: { day: 21 }, today: newTodayV4() }
    expect(readiness(tomorrow, PACK, ONE).ready).toBe(true)
    expect(readiness({ ...tomorrow, calendar: { day: 30 } }, PACK, ONE).ready).toBe(true)
  })

  it('is held at one of her three places, its words kept as flags; another place is refused', () => {
    expect(weddingPlaces(PACK, ONE)).toEqual(['chapel-bell', 'orchard-bench', 'fields'])
    const { save, card } = playEvent(engaged(), PACK, ONE, wedding('fields', null))
    expect(card.wedding?.place).toBe('fields')
    expect(save.love[ONE]!.flags).toEqual(expect.arrayContaining([weddingPlaceFlag('fields'), vowFlag(2)]))
    expect(weddingPlaceOf(save.love[ONE]!.flags)).toBe('fields')
    expect(() => playEvent(engaged(), PACK, ONE, wedding('overlook', null))).toThrow('Choose one of her places.')
    expect(() => playEvent(engaged(), PACK, ONE, wedding(undefined, null))).toThrow('Choose one of her places.')
    expect(() => playEvent(engaged(), PACK, ONE, wedding('fields', undefined))).toThrow('Choose the reception.')
  })

  it('makes her a spouse: `wed` today, her ring\'s bonus in her own term, her anniversary a year on', () => {
    const { save, card } = playEvent(engaged(), PACK, ONE, wedding('chapel-bell', null))
    expect(save.love[ONE]).toMatchObject({ stage: 'spouse', level: 0, wed: 21, ring: 3, last: 21 })
    expect(card).toMatchObject({ rung: 'wedding', stage: 'married', ring: null })
    expect(card.next).toMatchObject({ rung: 's1', cost: costOf('s1') })
    expect(ringBonus(save.love[ONE])).toBeCloseTo(0.03, 9)
    expect(romanceTerms(save, PACK, ONE, 'fields')).toMatchObject({ ring: 0.03 })
    expect(anniversaryOf(21)).toBe(21 + DAYS_PER_YEAR)
    expect([isAnniversary(save.love[ONE]!, 21 + DAYS_PER_YEAR), isAnniversary(save.love[ONE]!, 22)]).toEqual([true, false])
    expect([nextHousehold(1), nextHousehold(5), nextHousehold(20)]).toEqual([5, 10, null])
    expect(parseSaveV6(json(save))).toEqual(save)
  })

  it('serves a ★3 dish for two days, used; no dish: the bakery\'s cake, one day; never shortens a meal', () => {
    expect([1, 2, 3, 4, 5].map(receptionDays)).toEqual([1, 1, 2, 2, 3])
    const dish = give(engaged(), 'dish-fish-3', 3)
    expect(receptionDishes(dish)).toEqual([{ dish: 'dish-fish-3', stars: 3, count: 1, days: 2 }])
    expect(() => playEvent(dish, PACK, ONE, wedding('fields', null))).toThrow('Choose a dish for the reception.')
    expect(() => playEvent(dish, PACK, ONE, wedding('fields', { dish: 'dish-fish-3', stars: 4 }))).toThrow('That dish isn’t in the Warehouse.')
    const served = playEvent(dish, PACK, ONE, wedding('fields', { dish: 'dish-fish-3', stars: 3 }))
    expect(served.card.wedding).toMatchObject({ dish: 'dish-fish-3', stars: 3, days: 2 })
    expect(goodCount(served.save.items, 'dish-fish-3')).toBe(0)
    expect(served.save.today.reception).toBe(2)
    expect(parseSaveV6(json(served.save))).toEqual(served.save)
    // It feeds those who live on the farm: the bride, in her room, and 9000002, a spouse in hers, whose meal running (4
    // days, 3 after tonight's count) it never shortens; 9000003 lives in town (1 day, none after it).
    const wed = withLove(served.save, { stage: 'spouse', level: 0, wed: 1, house: 0 }, TWO)
    const fed = { ...wed, roster: { ...wed.roster, [TWO]: { ...wed.roster[TWO]!, wellFed: 4 }, [THREE]: { ...wed.roster[THREE]!, wellFed: 1 } } }
    const morning = runNight(fed, context())
    expect([ONE, TWO, THREE].map((id) => morning.roster[id]!.wellFed)).toEqual([2, 3, 0])
    expect(morning.today.reception).toBe(0)
    const cake = playEvent(engaged(), PACK, ONE, wedding('fields', null))
    expect(cake.card.wedding).toMatchObject({ dish: null, stars: null, days: CAKE_DAYS })
    expect(runNight(cake.save, context()).roster[ONE]!.wellFed).toBe(1)
    // A second wedding the same day never shortens the first's reception.
    expect(playEvent({ ...engaged(), today: { ...engaged().today, reception: 2 } }, PACK, ONE, wedding('fields', null)).save.today.reception).toBe(2)
  })

  it('has every spouse on the farm and her two closest friends, wherever they live, as guests', () => {
    // Her friends live in town: where she is never gates an occasion.
    const save = engaged()
    expect(weddingGuests(save, PACK, ONE)).toEqual([TWO, THREE])
    const married = withLove(save, { stage: 'spouse', level: 0, wed: 10, ring: 2, house: 0 }, THREE)
    expect(weddingGuests(married, PACK, ONE)).toEqual([THREE, TWO])
    // A spouse waiting for a room comes as her friend.
    expect(weddingGuests(withLove(save, { stage: 'spouse', level: 0, wed: 10, ring: 2 }, THREE), PACK, ONE)).toEqual([TWO, THREE])
    expect(playEvent(save, PACK, ONE, wedding('fields', null)).card.wedding?.guests).toEqual([TWO, THREE])
  })

  it('falls back on her wedding beat\'s place and the farm\'s without her bible\'s places', () => {
    const { wedding: _wedding, ...bible } = STAND_IN_BIBLE
    const pack = storyPackFrom({ ...STAND_IN_FILES, umas: { [ONE]: bible } })
    expect(weddingPlaces(pack, ONE)).toEqual(['chapel-bell', 'fields', 'overlook'])
    expect(weddingPlaces(pack, TWO)).toEqual(WEDDING_DEFAULTS.slice(0, 3))
  })
})

describe('the words', () => {
  const all = (list: readonly Step[]): string[] => list.flatMap((s) => 'say' in s ? [s.line] : 'narrate' in s ? [s.narrate] : 'thought' in s ? [s.thought]
    : 'choice' in s ? s.choice.flatMap((o) => [o.text, ...all(o.then ?? [])]) : 'play' in s ? [...(s.play.prompt ? [s.play.prompt] : []), ...all(s.play.good ?? []), ...all(s.play.miss ?? [])] : [])

  it('fill everything but your name: the bench\'s scene and words, the proposal and the wedding', () => {
    const words = [
      ...BENCH_SCENE_LINES.beats.map((b) => b.line), BENCH_SCENE_LINES.title, ...Object.values(BENCH_WORDS),
      ...all(steps('proposal')), ...all(steps('wedding')),
    ]
    expect(words.length).toBeGreaterThan(10)
    // The protagonist is a man (the groom may be named); `{farmer}` is the one placeholder left to fill as a line shows.
    expect(words.filter((w) => /\{(?!farmer\})/.test(w))).toEqual([])
  })
})

describe('the format: `wedding.places`', () => {
  const ctx = { umas: new Set(STAND_INS) }
  const read = (wedding: unknown) => checkBible({ ...STAND_IN_BIBLE, wedding }, ONE, ctx)
  const issues = (wedding: unknown) => { const { errors, notes } = read(wedding); return [...errors, ...notes] }
  it('takes any number of known places, and none at all; an unknown one is skipped', () => {
    expect(issues(STAND_IN_BIBLE.wedding)).toEqual([])
    const { wedding: _wedding, ...without } = STAND_IN_BIBLE
    expect(checkBible(without, ONE, ctx)).toMatchObject({ errors: [], notes: [] })
    expect(issues({ places: ['fields', 'overlook'] })).toEqual([])
    expect(issues({ places: ['fields', 'fields', 'overlook'] })).toEqual(['wedding.places: fields is listed twice; once is kept'])
    expect(issues({ places: ['fields', 'moon', 'overlook'] })).toEqual(['wedding.places 2: moon isn’t one of the game’s places; skipped'])
    expect(read({ places: ['fields', 'moon', 'overlook'] }).value!.wedding).toEqual({ places: ['fields', 'overlook'] })
    expect(issues({ places: ['fields', 'town', 'overlook'], when: 'spring' })).toEqual([])
    expect(issues(['fields', 'town', 'overlook'])).toEqual(['wedding is { places: [places] }; skipped'])
    // With none it reads, the farm's places play.
    expect(issues({ places: [] })).toEqual(['wedding.places: none the game reads, so the farm’s places play'])
    const bible = read({ places: [] }).value!
    expect(weddingPlaces({ bibles: new Map([[ONE, bible]]) }, ONE)).toEqual(['chapel-bell', 'fields', 'overlook'])
  })
})

describe('save v4 grows in place', () => {
  it('parses `today.ring` and `today.reception`, her ring\'s grade from the proposal on, and rings and dishes in the Warehouse', () => {
    const save = give(give(engaged(), 'ring-g10', 1, 2), 'dish-grains-5', 5)
    const stored = json({ ...save, today: { ...save.today, ring: 10, reception: 3 }, bin: { 'ring-g2': [1, 0, 0, 0, 0] } })
    expect(parseSaveV6(stored)).toEqual(stored)
    const refuse = (change: (s: Record<string, any>) => void, message: string) => {
      const bad = json(save) as Record<string, any>
      change(bad)
      expect(() => parseSaveV6(bad)).toThrow(message)
    }
    refuse((s) => { s.today.ring = 11 }, 'save.today.ring')
    refuse((s) => { s.today.reception = 4 }, 'save.today.reception')
    refuse((s) => { delete s.today.ring }, 'save.today.ring')
    refuse((s) => { s.love[ONE].ring = 0 }, `save.love.${ONE}.ring`)
    refuse((s) => { s.love[ONE].ring = 11 }, `save.love.${ONE}.ring`)
    refuse((s) => { s.love[ONE].stage = 'proposal' }, `save.love.${ONE}.ring: only from the proposal on`)
    refuse((s) => { s.items['dish-fish-11'] = [1, 0, 0, 0, 0] }, 'unknown item')
  })

  it('keeps the rings apart from the 284 goods and their seventeen families', () => {
    expect([GOODS.length, GOOD_FAMILIES.length, DIARY_ROWS.length]).toEqual([284, 17, 30])
    expect(GOODS.some((g) => g.family === 'rings')).toBe(false)
  })
})

describe('a whole wedding day on the stand-in', () => {
  it('Romance 8 → the bench → a ring from planks → the proposal → the wedding with the bakery\'s cake → married 1/3', () => {
    let save = withLove({ ...farm(30), memories: { [ONE]: ['r8'] }, arrivals: [...STAND_INS] }, { stage: 'proposal', level: 10, points: 0, last: 29 })
    save = runNight(save, context())
    expect(benchOpen(save)).toBe(true)
    save = give({ ...save, summary: null }, 'cedar-plank', 1, 3)
    save = makeRing(readScene(save, BENCH_SCENE), three('cedar-plank', 'cedar-plank', 'cedar-plank')).save
    save = playEvent(save, PACK, ONE, proposal('ring-g3')).save
    save = runNight(save, context())
    const married = playEvent(save, PACK, ONE, wedding('orchard-bench', null))
    expect(married.save.love[ONE]).toMatchObject({ stage: 'spouse', ring: 3 })
    expect(Object.values(married.save.love).filter((l) => l.stage === 'spouse')).toHaveLength(1)
    const morning = runNight(married.save, context())
    expect(morning.roster[ONE]!.wellFed).toBe(1)
    expect(parseSaveV6(json(morning))).toEqual(morning)
  })
})
