// Upkeep and loans: the farm has to pay its way. What you add to the farm costs a little each night, and the mayor's
// office lends toward a build so it can stand ahead of the gold.
//
//   the night, step 1   the bin pays
//   the night, step 2   the farmhands work ──► the farm eats (`farm/food.ts`) ──► the bill: each loan takes its share of
//                       the night's income ──► the takeout, then the upkeep, with anything owed
//   upkeep a night      15g each place built and each house · 10g each spouse living on the farm (in her room). The
//                       start's own places are free. A farmhand's cost is her meals on her farm days (`farm/food.ts`).
//   takeout             15g a meal the pantry was short, from the first night: a new farm's farmer eats two (30g)
//   short of it         what gold there is pays, takeout first; the rest is owed, takeout and upkeep alike; the first
//                       short night warns in the morning, and from the second the farmhands work at half pace (`halfPace`)
//                       until it's paid. Nobody leaves, nobody goes hungry, and nothing is lost: gold never goes below 0.
//   loans               at the mayor's office, in town: borrow what a place or a house is short of gold (rounded up to 100g), up to the Farm Rank's limit; one loan at a time, two from Farm
//                       Rank 4; a 10% fee; each night's income repays up to a tenth of it, before upkeep; repay the
//                       rest at the office any time.
//
// The book keeps the bin's pay on each of the last seven nights, so the Book can set an average day's income beside the
// daily upkeep. Ordering a build stays where it is (its Build card, free, no town needed): the office adds the loan.
// Pure; never stamps. Loaded with the night, the Book, the projects and the town.
import { farmRankOf } from './farm'
import { BUILD_PLACES, farmPlace, placeBuilt, type BuildPlace, type FarmPlaceId } from './places'
import { buildLock, buildLockWords, payBuild } from './builds'
import { buildHouse, houseOpensWords, nextLot } from '../romance/homestead'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { DORM_LOAN, farmHome, HOUSE_LOAN, INCOME_NIGHTS, MAX_LOANS, type FarmSave, type Loan } from '../save/v4'
import type { MoneyLine } from '../night/summary'
import { TAKEOUT_PRICE } from './food'

// --- Upkeep ----------------------------------------------------------------------------------------------------------

/** Upkeep a night: each place built and each house; each spouse living on the farm, in her room. */
export const UPKEEP_BUILDING = 15
export const UPKEEP_RESIDENT = 10

/** What the farm's upkeep counts tonight, and its gold. */
export interface Upkeep {
  /** Places built: the Mill, the Sawmill … the Dock and the Boat (the start's own places are free). */
  places: number
  /** Houses built on the homestead (the Farmhouse is free). */
  houses: number
  /** The spouses living on the farm, each in her room. A farmhand isn't one: her meals on her farm days are her cost. */
  residents: number
  gold: number
}
export function upkeepOf(save: Pick<FarmSave, 'buildings' | 'homestead' | 'love' | 'roster'>): Upkeep {
  const places = BUILD_PLACES.filter((p) => placeBuilt(save, p.id)).length
  const houses = Math.max(0, save.homestead.houses.length - 1)
  const residents = farmHome(save).filter((id) => save.roster[id]).length
  return { places, houses, residents, gold: (places + houses) * UPKEEP_BUILDING + residents * UPKEEP_RESIDENT }
}

/** An average night's income: the bin's pay over the nights the book keeps (the last seven, fewer on a new farm),
 * rounded; 0 before the first night. */
export function averageIncome(save: Pick<FarmSave, 'farm'>): number {
  const nights = save.farm.income
  return nights.length === 0 ? 0 : Math.round(nights.reduce((a, b) => a + b, 0) / nights.length)
}

/** From this many short nights in a row, the farmhands work at half pace. The first warns. */
export const HALF_PACE_FROM = 2
/** Whether the farmhands work at half pace: upkeep owed since the second short night in a row, until it's paid. The
 * farmhands' day reads it through `atPace` (`farm/farmhands.ts`); the farmer's own ten are never touched. */
export const halfPace = (save: Pick<FarmSave, 'farm'>): boolean => save.farm.short >= HALF_PACE_FROM
/** A farmhand's actions at the farm's pace: half, rounded down, at half pace, never below one. */
export const atPace = (actions: number, save: Pick<FarmSave, 'farm'>): number =>
  halfPace(save) && actions > 0 ? Math.max(1, Math.floor(actions / 2)) : actions

// --- Loans -----------------------------------------------------------------------------------------------------------

/** The most the office lends at each Farm Rank, 1–10: every place at its rank, and the houses with some gold of your
 * own. */
export const LOAN_LIMITS: readonly number[] = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000, 50_000, 80_000, 120_000, 160_000]
/** Two loans at once from this Farm Rank; one before. */
export const TWO_LOANS_FROM = 4
/** The fee: a tenth of the loan, rounded up to 10g, owed with it. */
export const LOAN_FEE = 0.1
/** A night's share: a tenth of what's owed when it's taken, rounded up to 5g, so it clears in ten nights of income. */
export const LOAN_NIGHTS = 10
/** A loan is what the build is short of, rounded up to this. */
export const LOAN_STEP = 100

export const loanLimit = (save: Pick<FarmSave, 'farm'>): number => LOAN_LIMITS[farmRankOf(save.farm.points) - 1] ?? LOAN_LIMITS[0]!
export const loanSlots = (save: Pick<FarmSave, 'farm'>): number => (farmRankOf(save.farm.points) >= TWO_LOANS_FROM ? MAX_LOANS : 1)
export const loanFee = (lent: number): number => Math.ceil((lent * LOAN_FEE) / 10) * 10
export const loanNightly = (owed: number): number => Math.ceil(owed / LOAN_NIGHTS / 5) * 5
/** What a build short of `short` gold borrows: rounded up to 100g, never past its cost. */
export const loanFor = (short: number, cost: number): number => Math.min(cost, Math.ceil(short / LOAN_STEP) * LOAN_STEP)

/** The words for a loan's project: the place's own name (the app swaps in the world's) or "House 2"; a loan a save still
 * holds toward the retired Dorm, "Dorm level 2". */
export function loanName(project: string): string {
  const house = HOUSE_LOAN.exec(project)
  if (house) return `House ${house[1]}`
  const dorm = DORM_LOAN.exec(project)
  return dorm ? `Dorm level ${dorm[1]}` : farmPlace(project)?.name ?? project
}

/** Why the office can't lend toward a build now, in order: you're not in town, the build's own lock (its goods, paid
 * already), enough gold already (just build it), the loans held, the Farm Rank's limit. */
export type LoanLock =
  | { by: 'town' }
  | { by: 'build'; words: string }
  | { by: 'enough' }
  | { by: 'slots'; slots: number }
  | { by: 'limit'; limit: number; rank: number }

/** One build the office can order: a place offered at your Farm Rank (its game built), or the next house once its
 * wedding has come. Its cost, what you'd borrow, and what stands in the way of each way to pay. */
export interface BuildOrder {
  /** A place's id, or `house:<n>`. */
  project: string
  kind: 'place' | 'house'
  /** The place, for a place. */
  place: BuildPlace | null
  cost: number
  /** Paying it yourself: null when you can now; else its words ("Need 400g more", "Need 20 logs more", "Builds
   * tonight"). */
  own: string | null
  /** What a loan would be: the gold short, rounded up to 100g; 0 when the gold is there. */
  borrow: number
  /** Borrowing toward it: null when you can now. */
  lock: LoanLock | null
}

const RICH = Number.MAX_SAFE_INTEGER / 4
/** A place's lock but for the gold: its goods, built or paid today. */
const lockButGold = (save: FarmSave, id: FarmPlaceId): string | null => buildLockWords(buildLock({ ...save, gold: RICH }, id))
const needGold = (short: number): string | null => (short > 0 ? `Need ${short.toLocaleString('en-US')}g more` : null)

function loanLock(save: FarmSave, build: string | null, borrow: number): LoanLock | null {
  if (!save.today.town) return { by: 'town' }
  if (build) return { by: 'build', words: build }
  if (borrow === 0) return { by: 'enough' }
  const slots = loanSlots(save)
  if (save.farm.loans.length >= slots) return { by: 'slots', slots }
  const limit = loanLimit(save)
  if (borrow > limit) return { by: 'limit', limit, rank: farmRankOf(save.farm.points) }
  return null
}

/** A build paid with gold only (a house): its order. */
function goldOrder(save: FarmSave, project: string, kind: 'house', cost: number): BuildOrder {
  const borrow = loanFor(Math.max(0, cost - save.gold), cost)
  return { project, kind, place: null, cost, own: needGold(cost - save.gold), borrow, lock: loanLock(save, null, borrow) }
}

/** The builds the office can order today, in the Diary's order: the places offered at your Farm Rank whose games are
 * built and that don't stand yet (one paid today says "Builds tonight"), then the next house once its wedding has come. */
export function buildOrders(save: FarmSave): BuildOrder[] {
  const rank = farmRankOf(save.farm.points)
  const places = BUILD_PLACES.filter((p) => p.opens.game && p.opens.rank <= rank && !placeBuilt(save, p.id)).map((place): BuildOrder => {
    const cost = place.opens.cost.gold
    const build = lockButGold(save, place.id)
    const borrow = build ? 0 : loanFor(Math.max(0, cost - save.gold), cost)
    return { project: place.id, kind: 'place', place, cost, own: buildLockWords(buildLock(save, place.id)), borrow, lock: loanLock(save, build, borrow) }
  })
  const lot = nextLot(save)
  const house = lot && lot.open ? [goldOrder(save, `house:${lot.n}`, 'house', lot.cost)] : []
  return [...places, ...house]
}

/** A loan's lock in the player's words, or null when the office lends now. */
export function loanLockWords(lock: LoanLock | null): string | null {
  if (!lock) return null
  switch (lock.by) {
    case 'town': return 'The mayor’s office is in town.'
    case 'build': return `${lock.words}.`
    case 'enough': return 'You have the gold: build it.'
    case 'slots': return lock.slots === 1 ? 'One loan at a time: this one first.' : 'Two loans at a time: one of these first.'
    case 'limit': return `The office lends up to ${lock.limit.toLocaleString('en-US')}g at Farm Rank ${lock.rank}.`
  }
}

/** A new loan: lent `lent` today, its fee owed with it, a tenth a night. */
export function newLoan(project: string, day: number, lent: number): Loan {
  const fee = loanFee(lent)
  return { for: project, day, lent, fee, owed: lent + fee, nightly: loanNightly(lent + fee) }
}

/** Why a project isn't among today's orders, in words: not offered at this Farm Rank, its game not built, built
 * already, the house's turn; the retired Dorm's levels are built no more. */
function notAnOrder(save: FarmSave, project: string): string {
  const house = HOUSE_LOAN.exec(project)
  if (house) return nextLot(save)?.n === Number(house[1]) ? houseOpensWords(Number(house[1])) : 'Not the next house.'
  if (DORM_LOAN.test(project)) return 'The Dorm is retired.'
  const place = farmPlace(project)
  return place && BUILD_PLACES.some((p) => p.id === place.id) ? `${buildLockWords(buildLock(save, place.id)) ?? 'Built'}.` : 'Not something to build.'
}

/** Borrows toward a build and orders it, in one: the office lends what it's short of gold (rounded up to 100g), and
 * the build is paid at once (a place with the farm's own goods too, standing the next morning; a house, standing at
 * once, named `name`). Free once you're in town. Refused out of town
 * (`locked`), for the build's own lock (`locked`), with the gold already there and with the loans held (`bad-job`), and
 * past the Farm Rank's limit (`locked`). Never stamps. */
export function borrowFor<S extends FarmSave>(save: S, project: string, name = ''): S {
  if (!save.today.town) throw new SaveRuleError('locked', loanLockWords({ by: 'town' })!)
  const order = buildOrders(save).find((o) => o.project === project)
  if (!order) throw new SaveRuleError('locked', notAnOrder(save, project))
  if (order.lock) throw new SaveRuleError(order.lock.by === 'enough' || order.lock.by === 'slots' ? 'bad-job' : 'locked', loanLockWords(order.lock)!)
  const lent: S = { ...save, gold: save.gold + order.borrow, farm: { ...save.farm, loans: [...save.farm.loans, newLoan(project, save.calendar.day, order.borrow)] } }
  switch (order.kind) {
    case 'place': return payBuild(lent, order.place!.id)
    case 'house': return buildHouse(lent, name) as S
  }
}

/** Repays a loan in full at the office: what's owed leaves the farm's gold, and the loan is cleared. Free once you're in
 * town. Refused out of town (`locked`), for no such loan (`bad-job`) and when gold is short (`no-gold`). Never stamps. */
export function repayLoan<S extends FarmSave>(save: S, project: string): S {
  if (!save.today.town) throw new SaveRuleError('locked', loanLockWords({ by: 'town' })!)
  const loan = save.farm.loans.find((l) => l.for === project)
  if (!loan) throw new SaveRuleError('bad-job', 'No loan for that.')
  if (save.gold < loan.owed) throw new SaveRuleError('no-gold', `Need ${(loan.owed - save.gold).toLocaleString('en-US')}g more.`)
  const paid = spendGold(save, loan.owed)
  return { ...paid, farm: { ...paid.farm, loans: paid.farm.loans.filter((l) => l !== loan) } }
}

/** The nights a loan still needs at its share a night, and the morning it clears if each night's income covers its
 * share (the projects list's "about"). */
export function loanClears(save: Pick<FarmSave, 'calendar'>, loan: Loan): { nights: number; day: number } {
  const nights = Math.ceil(loan.owed / loan.nightly)
  return { nights, day: save.calendar.day + nights }
}

/** What the farm owes the office in all. */
export const loansOwed = (save: Pick<FarmSave, 'farm'>): number => save.farm.loans.reduce((n, l) => n + l.owed, 0)

// --- The night -------------------------------------------------------------------------------------------------------

/** What the farm ate tonight, for the bill: meals from the pantry, meals spoiled, the Umas well fed, and the meals bought
 * in. */
export interface FoodBill {
  pantry: number
  spoiled: number
  fed: number
  takeout: number
  /** Tonight's staff meal: the mouths who ate it and its well-fed days; absent with none. */
  staff?: { mouths: number; days: number } | null
}

/**
 * Night step 2, after the farm eats: the farm's bill. The night's `income` (the bin's pay) joins the book's last seven
 * nights; each loan, in the order taken, takes its share from what's left of that income (none on a night with no
 * sales), and one that's paid off goes; then the takeout (15g a meal the pantry was short), then the upkeep with
 * anything owed from before. What gold there is pays, takeout first; the rest is owed, and the short nights in a row
 * count on (0 once it's all paid). Gold never goes below 0.
 */
export function settleAccounts<S extends FarmSave>(save: S, income: number, food: FoodBill | null = null): { save: S; lines: MoneyLine[] } {
  const lines: MoneyLine[] = []
  let gold = save.gold
  let share = income
  const loans: Loan[] = []
  for (const loan of save.farm.loans) {
    const paid = Math.min(loan.nightly, loan.owed, share, gold)
    gold -= paid
    share -= paid
    lines.push({ kind: 'loan', for: loan.for, paid, left: loan.owed - paid })
    if (loan.owed - paid > 0) loans.push({ ...loan, owed: loan.owed - paid })
  }
  if (food?.staff) lines.push({ kind: 'staff', mouths: food.staff.mouths, days: food.staff.days })
  if (food && (food.pantry > 0 || food.spoiled > 0)) lines.push({ kind: 'pantry', meals: food.pantry, spoiled: food.spoiled, fed: food.fed })
  const takeout = (food?.takeout ?? 0) * TAKEOUT_PRICE
  const bought = Math.min(gold, takeout)
  gold -= bought
  if (takeout > 0) lines.push({ kind: 'takeout', meals: food!.takeout, paid: bought, due: takeout })
  const due = upkeepOf(save).gold + save.farm.owed
  const paid = Math.min(gold, due)
  gold -= paid
  const owed = due - paid + takeout - bought
  const short = owed > 0 ? save.farm.short + 1 : 0
  if (due > 0) lines.push({ kind: 'upkeep', paid, due })
  if (owed > 0) lines.push({ kind: 'short', owed, nights: short })
  else if (save.farm.owed > 0) lines.push({ kind: 'paid-up', owed: save.farm.owed })
  const book = [...save.farm.income, income].slice(-INCOME_NIGHTS)
  return { save: { ...save, gold, farm: { ...save.farm, loans, owed, short, income: book } }, lines }
}
