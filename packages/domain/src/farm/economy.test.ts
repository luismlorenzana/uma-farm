// Upkeep and loans: the night's upkeep after the bin and what it counts; a short night's warning, then half pace, and
// paying up; the book's last seven nights; the mayor's office's loans toward a build (in town, the gold short rounded
// up, a fee, a tenth a night from income only, before upkeep, one at a time and two from Farm Rank 4, the rank's limit)
// and repaying; a house built on a loan; a save from before upkeep loading as it was. The upkeep's nights stock the
// pantry with tonight's meals, so the takeout (`food.test.ts`) stays out of their sums. Invented ids; no story pack.
import { describe, expect, it } from 'vitest'
import { goToTown } from './actions'
import { buildLock } from './builds'
import {
  atPace, averageIncome, borrowFor, buildOrders, halfPace, loanClears, loanFee, loanLimit, loanLockWords, loanNightly, loanSlots, repayLoan, settleAccounts,
  UPKEEP_BUILDING, UPKEEP_RESIDENT, upkeepOf,
} from './economy'
import { placeBuilt } from './places'
import { endDay, runNight } from '../night/end-day'
import { ship } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { FARMHOUSE, farmHome, newLove, newRosterUma, newSave, type Love, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const LATER = '2026-11-14T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const logs = (n: number): SaveV4['items'] => ({ 'pine-log': [n, 0, 0, 0, 0] })

/** A spouse in her room in the Farmhouse (its two rooms). */
const spouse = (): Love => ({ ...newLove(), stage: 'spouse', level: 0, wed: 1, house: 0 })
/** A named farm with gold, goods, Farm Rank points and spouses living on the farm, in the Farmhouse's rooms. */
function farm(gold = 500, items: SaveV4['items'] = {}, points = 0, home: string[] = []): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, farmer: { name: 'Robin' }, gold, items: { ...save.items, ...items }, farm: { ...save.farm, points },
    roster: Object.fromEntries(home.map((id) => [id, newRosterUma(1)])), love: Object.fromEntries(home.map((id) => [id, spouse()])),
  }
}
/** Tonight's meals in the pantry, so the upkeep stands alone: two for the farmer and each spouse home. */
const fed = (save: SaveV4): SaveV4 => ({ ...save, farm: { ...save.farm, pantry: [{ day: save.calendar.day, stars: 1, meals: 2 * (farmHome(save).length + 1) }] } })
/** The pantry's line for a night that ate it all. */
const ate = (save: SaveV4) => ({ kind: 'pantry', meals: 2 * (farmHome(save).length + 1), spoiled: 0, fed: 0 })
/** The night as the game runs it, unstamped, with tonight's meals cooked. */
const night = (save: SaveV4): SaveV4 => runNight(fed(save), {})

describe('upkeep', () => {
  it('counts what you add: each place built and house, each spouse living on the farm; no Dorm beds, and no farmhand 10g', () => {
    expect(upkeepOf(farm())).toEqual({ places: 0, houses: 0, residents: 0, gold: 0 })
    const grown = {
      ...farm(500, {}, 0, ['101', '202']), buildings: { dorm: 2, mill: 1, sawmill: 1, coop: 0 },
      homestead: { ...newSave('u1', AT).homestead, houses: [FARMHOUSE, { name: 'Rose Cottage', extended: false }], slept: [0, 0] },
    }
    // The Mill and the Sawmill, House 1; two spouses in their rooms. The retired Dorm's level 2 counts nothing.
    expect(upkeepOf(grown)).toEqual({ places: 2, houses: 1, residents: 2, gold: 3 * UPKEEP_BUILDING + 2 * UPKEEP_RESIDENT })
    expect(upkeepOf(grown).gold).toBe(65)
    // A spouse in House 1 lives on the farm too; four farmhands (their meals are their cost) and a spouse waiting for a
    // room, who lives in town, add nothing.
    const hands = Object.fromEntries(['301', '302', '303', '304'].map((id) => [id, { ...newRosterUma(1), farmhand: 1 }]))
    const wed = {
      ...grown,
      love: { ...grown.love, 505: { ...spouse(), house: 1 }, 606: { ...spouse(), house: undefined }, ...Object.fromEntries(Object.keys(hands).map((id) => [id, newLove()])) },
      roster: { ...grown.roster, 505: newRosterUma(1), 606: newRosterUma(1), ...hands },
    }
    expect(upkeepOf(wed)).toMatchObject({ residents: 3, gold: 3 * UPKEEP_BUILDING + 3 * UPKEEP_RESIDENT })
  })

  it('is charged at night after the bin pays, and the book keeps the bin\'s pay of the last seven nights', () => {
    const save = { ...farm(100, { carrot: [6, 0, 0, 0, 0] }, 0, ['101', '202']), buildings: { dorm: 1, mill: 1 } }
    const morning = night(ship(save, 'carrot', 1, 6))
    const sold = morning.summary!.bin.reduce((n, s) => n + s.gold, 0)
    expect(sold).toBeGreaterThan(0)
    expect(morning.gold).toBe(100 + sold - 35)
    expect(morning.farm.income).toEqual([sold])
    expect(morning.summary!.money).toEqual([ate(save), { kind: 'upkeep', paid: 35, due: 35 }])
    expect(averageIncome(morning)).toBe(sold)
    let later = morning
    for (let n = 0; n < 8; n++) later = night(later)
    expect(later.farm.income).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(averageIncome({ farm: { ...later.farm, income: [100, 200, 0] } })).toBe(100)
  })

  it('charges a new farm no upkeep: only the farmer\'s takeout, 30g a night', () => {
    const morning = runNight(farm(), {})
    expect(morning.gold).toBe(470)
    expect(morning.summary!.money).toEqual([{ kind: 'takeout', meals: 2, paid: 30, due: 30 }])
    expect(morning.farm).toMatchObject({ owed: 0, short: 0, income: [0] })
    // With tonight's meals cooked, nothing at all.
    expect(night(farm()).gold).toBe(500)
  })
})

describe('short of upkeep', () => {
  // Two spouses home, the Mill and the Sawmill: 50g a night, on 55g.
  const poor = (): SaveV4 => ({ ...farm(55, {}, 0, ['101', '202']), buildings: { dorm: 1, mill: 1, sawmill: 1 } })

  it('warns the first morning, works at half pace from the second short night until it\'s paid, and loses nothing', () => {
    const first = night(poor())
    expect(first.gold).toBe(5)
    expect(first.farm).toMatchObject({ owed: 0, short: 0 })
    const second = night(first)
    // 50g due on 5g: 5g paid, 45g owed, a warning.
    expect(second.gold).toBe(0)
    expect(second.farm).toMatchObject({ owed: 45, short: 1 })
    expect(second.summary!.money).toEqual([ate(first), { kind: 'upkeep', paid: 5, due: 50 }, { kind: 'short', owed: 45, nights: 1 }])
    expect(halfPace(second)).toBe(false)
    expect(atPace(3, second)).toBe(3)
    const third = night(second)
    expect(third.farm).toMatchObject({ owed: 95, short: 2 })
    expect(third.summary!.money).toContainEqual({ kind: 'short', owed: 95, nights: 2 })
    expect(halfPace(third)).toBe(true)
    // Half their actions, rounded down, never below one; the farmer's own are never touched.
    expect([atPace(3, third), atPace(4, third), atPace(1, third), atPace(0, third)]).toEqual([1, 2, 1, 0])
    // Nobody leaves and nothing is lost: the spouses stay home, the Mill stands, the gold never goes below 0.
    expect(farmHome(third)).toEqual(['101', '202'])
    expect(third.buildings.mill).toBe(1)
    expect(third.gold).toBe(0)
    expect(parseSaveV5(json(third))).toEqual(third)
    // A good night pays it all: the owed and tonight's.
    const paid = night(ship({ ...third, items: { ...third.items, salmon: [3, 0, 0, 0, 0] } }, 'salmon', 1, 3))
    const sold = paid.summary!.bin.reduce((n, s) => n + s.gold, 0)
    expect(sold).toBeGreaterThanOrEqual(145)
    expect(paid.gold).toBe(sold - 145)
    expect(paid.farm).toMatchObject({ owed: 0, short: 0 })
    expect(paid.summary!.money).toEqual([ate(third), { kind: 'upkeep', paid: 145, due: 145 }, { kind: 'paid-up', owed: 95 }])
    expect(halfPace(paid)).toBe(false)
  })

  it('pays what it can and owes the rest, from any gold the farm holds', () => {
    const { save, lines } = settleAccounts({ ...poor(), gold: 20, farm: { ...poor().farm, owed: 10, short: 1 } }, 0)
    expect(save.gold).toBe(0)
    expect(save.farm).toMatchObject({ owed: 40, short: 2, income: [0] })
    expect(lines).toEqual([{ kind: 'upkeep', paid: 20, due: 60 }, { kind: 'short', owed: 40, nights: 2 }])
  })
})

describe('loans at the mayor\'s office', () => {
  it('lends toward a build in town: what it\'s short, rounded up to 100g, with a 10% fee, and orders it at once', () => {
    const save = farm(640, logs(20))
    expect(() => borrowFor(save, 'mill')).toThrow('The mayor’s office is in town.')
    const town = goToTown(save)
    const [mill] = buildOrders(town)
    expect(mill).toMatchObject({ project: 'mill', cost: 1000, own: 'Need 360g more', borrow: 400, lock: null })
    const lent = borrowFor(town, 'mill')
    expect(lent.gold).toBe(40)
    expect(lent.farm.builds).toEqual(['mill'])
    expect(lent.items['pine-log']).toBeUndefined()
    expect(lent.farm.loans).toEqual([{ for: 'mill', day: 1, lent: 400, fee: 40, owed: 440, nightly: 45 }])
    expect(lent.today.actions).toBe(1)
    expect(lent.account).toEqual(save.account)
    expect(loanClears(lent, lent.farm.loans[0]!)).toEqual({ nights: 10, day: 11 })
    expect(parseSaveV5(json(lent))).toEqual(lent)
  })

  it('builds the Mill early, and the nights\' income clears it before upkeep: none on a night with no sales', () => {
    let save = endDay(borrowFor(goToTown(farm(0, { ...logs(20), carp: [60, 0, 0, 0, 0] })), 'mill'), {}, LATER)
    expect(placeBuilt(save, 'mill')).toBe(true)
    expect(save.farm.loans[0]).toMatchObject({ lent: 1000, fee: 100, owed: 1100, nightly: 110 })
    // No sales: nothing repaid, and the Mill's upkeep (15g) is short on 0g.
    expect(save.summary!.money).toEqual([{ kind: 'loan', for: 'mill', paid: 0, left: 1100 }, { kind: 'takeout', meals: 2, paid: 0, due: 30 }, { kind: 'short', owed: 30, nights: 1 }])
    save = night(save)
    expect(save.summary!.money).toEqual([
      { kind: 'loan', for: 'mill', paid: 0, left: 1100 }, ate(save), { kind: 'upkeep', paid: 0, due: 45 }, { kind: 'short', owed: 45, nights: 2 },
    ])
    // Shipping pays the share first, then the upkeep owed.
    let nights = 0
    while (save.farm.loans.length > 0 && nights < 40) {
      save = night(ship(save, 'carp', 1, 4))
      nights++
    }
    expect(save.farm.loans).toEqual([])
    expect(save.summary!.money![0]).toMatchObject({ kind: 'loan', for: 'mill', left: 0 })
    expect(save.farm).toMatchObject({ owed: 0, short: 0 })
    expect(nights).toBeGreaterThanOrEqual(10)
  })

  it('takes a loan\'s share before upkeep, and only from the night\'s income', () => {
    const lent = { ...farm(500, {}, 0, ['101']), buildings: { dorm: 1, mill: 1 }, farm: { ...newSave('u1', AT).farm, loans: [{ for: 'mill', day: 1, lent: 400, fee: 40, owed: 440, nightly: 45 }] } }
    // 30g of income: 30g repaid, then 25g upkeep from the 500g held.
    const { save, lines } = settleAccounts({ ...lent, gold: 530 }, 30)
    expect(lines).toEqual([{ kind: 'loan', for: 'mill', paid: 30, left: 410 }, { kind: 'upkeep', paid: 25, due: 25 }])
    expect(save.gold).toBe(475)
    expect(save.farm.loans[0]!.owed).toBe(410)
  })

  it('holds one loan at a time, two from Farm Rank 4, and lends up to the Farm Rank\'s limit', () => {
    expect([loanLimit(farm()), loanSlots(farm())]).toEqual([1000, 1])
    expect([loanLimit(farm(0, {}, 950)), loanSlots(farm(0, {}, 950))]).toEqual([8000, 2])
    expect([loanFee(400), loanFee(1050), loanNightly(440), loanNightly(1100)]).toEqual([40, 110, 45, 110])
    // At Farm Rank 3: the Sawmill on a loan, then the Smokehouse waits for it.
    const fr3 = goToTown({ ...farm(0, { ...logs(70), carp: [20, 0, 0, 0, 0] }, 250), buildings: { dorm: 1, mill: 1 } })
    const one = borrowFor(fr3, 'sawmill')
    expect(one.farm.loans).toHaveLength(1)
    const smoke = buildOrders(one).find((o) => o.project === 'smokehouse')!
    expect(loanLockWords(smoke.lock)).toBe('One loan at a time: this one first.')
    expect(() => borrowFor(one, 'smokehouse')).toThrow('One loan at a time: this one first.')
    // Past the limit: House 1's 8,000g at Farm Rank 3 (4,000g).
    const wed = { ...fr3, roster: { 9001: newRosterUma(1) }, love: { 9001: { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1 } } }
    expect(() => borrowFor(wed, 'house:1', 'Rose Cottage')).toThrow('The office lends up to 4,000g at Farm Rank 3.')
    // With the gold there, build it yourself; a build's own lock stands.
    expect(() => borrowFor(goToTown(farm(1000, logs(20))), 'mill')).toThrow('You have the gold: build it.')
    expect(() => borrowFor(goToTown(farm(0)), 'mill')).toThrow('Need 20 logs more.')
    expect(() => borrowFor(goToTown(farm(0)), 'sawmill')).toThrow('Opens at Farm Rank 3.')
    // From Farm Rank 4, two at once.
    const fr4 = goToTown({ ...farm(0, { ...logs(70), carp: [20, 0, 0, 0, 0] }, 950), buildings: { dorm: 1, mill: 1 } })
    const two = borrowFor(borrowFor(fr4, 'sawmill'), 'smokehouse')
    expect(two.farm.loans.map((l) => l.for)).toEqual(['sawmill', 'smokehouse'])
    expect(two.farm.builds).toEqual(['sawmill', 'smokehouse'])
    expect(buildLock(two, 'smokehouse')).toEqual({ by: 'tonight' })
  })

  it('builds a house on a loan, named, at once', () => {
    const save = goToTown({ ...farm(3000, {}, 950), roster: { 9001: newRosterUma(1) }, love: { 9001: { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1 } } })
    const order = buildOrders(save).find((o) => o.project === 'house:1')!
    expect(order).toMatchObject({ cost: 8000, borrow: 5000, own: 'Need 5,000g more', lock: null })
    const built = borrowFor(save, 'house:1', 'Rose Cottage')
    expect(built.homestead.houses.map((h) => h.name)).toEqual(['Farmhouse', 'Rose Cottage'])
    expect(built.gold).toBe(0)
    expect(built.farm.loans).toEqual([{ for: 'house:1', day: 1, lent: 5000, fee: 500, owed: 5500, nightly: 550 }])
    expect(parseSaveV5(json(built))).toEqual(built)
  })

  it('offers no Dorm level: the Dorm is retired; a loan a save still holds toward one is repaid as any other', () => {
    const save = goToTown(farm(300))
    // Day 1: the Mill (short of logs, so no loan yet), and nothing else.
    expect(buildOrders(save).map((o) => [o.project, o.kind, o.borrow, loanLockWords(o.lock)])).toEqual([['mill', 'place', 0, 'Need 20 logs more.']])
    expect(() => borrowFor(save, 'dorm:2')).toThrow('The Dorm is retired.')
    const held = { ...save, gold: 1000, farm: { ...save.farm, loans: [{ for: 'dorm:2', day: 1, lent: 700, fee: 70, owed: 770, nightly: 80 }] } }
    expect(parseSaveV5(json(held))).toEqual(held)
    const morning = endDay(held, {}, LATER)
    expect(morning.farm.loans).toEqual([{ for: 'dorm:2', day: 1, lent: 700, fee: 70, owed: 770, nightly: 80 }])
    expect(repayLoan(held, 'dorm:2').farm.loans).toEqual([])
  })

  it('repays in full at the office, in town', () => {
    const lent = borrowFor(goToTown(farm(640, logs(20))), 'mill')
    expect(() => repayLoan(lent, 'mill')).toThrow('Need 400g more.')
    const rich = { ...lent, gold: 1000 }
    expect(() => repayLoan({ ...rich, today: { ...rich.today, town: false } }, 'mill')).toThrow('The mayor’s office is in town.')
    const repaid = repayLoan(rich, 'mill')
    expect(repaid.gold).toBe(560)
    expect(repaid.farm.loans).toEqual([])
    expect(() => repayLoan(repaid, 'mill')).toThrow('No loan for that.')
  })
})

describe('the save', () => {
  it('loads a save from before upkeep as it was: no loans, nothing owed, no nights, and its updatedAt kept', () => {
    const save = farm()
    const { loans: _l, owed: _o, short: _s, income: _i, ...older } = save.farm
    const read = parseSaveV5(json({ ...save, farm: older }))
    expect(read.farm).toEqual(save.farm)
    expect(read.account.updatedAt).toBe(AT)
    const morning = endDay(read, {}, LATER)
    expect(parseSaveV5(json({ ...morning, summary: { ...morning.summary!, money: undefined } })).summary).toEqual({ ...morning.summary!, money: undefined })
  })

  it('refuses a loan it can\'t carry, and upkeep owed without its nights', () => {
    const save = farm()
    const loan = { for: 'mill', day: 1, lent: 400, fee: 40, owed: 440, nightly: 45 }
    const bad = (farm: object) => () => parseSaveV5(json({ ...save, farm: { ...save.farm, ...farm } }))
    expect(bad({ loans: [loan] })).not.toThrow()
    expect(bad({ loans: [{ ...loan, for: 'fields' }] })).toThrow('expected a place you build, dorm:2 to dorm:8, or house:1 to house:6')
    expect(bad({ loans: [{ ...loan, for: 'house:7' }] })).toThrow('expected a place you build, dorm:2 to dorm:8, or house:1 to house:6')
    expect(bad({ loans: [loan, loan] })).toThrow('repeated')
    expect(bad({ loans: [loan, { ...loan, for: 'sawmill' }, { ...loan, for: 'dock' }] })).toThrow('expected 0–2 entries')
    expect(bad({ loans: [{ ...loan, owed: 0 }] })).toThrow('expected 1–440')
    expect(bad({ loans: [{ ...loan, day: 2 }] })).toThrow('expected 1–1')
    expect(bad({ owed: 40, short: 0 })).toThrow('expected short nights with upkeep owed, or neither')
    expect(bad({ income: [0, 0, 0, 0, 0, 0, 0, 0] })).toThrow('expected 0–7 entries')
  })
})
