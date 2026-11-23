// The farm settles food, upkeep, arrears, and project credit against actual sales each night.
import { farmRankOf } from './farm'
import { BUILD_PLACES, farmPlace, placeBuilt, type BuildPlace, type FarmPlaceId } from './places'
import { buildLock, buildLockWords, buildNeeds, payBuild } from './builds'
import { buildHouse, houseOpensWords, nextLot } from '../romance/homestead'
import { earnGold, spendGold } from '../save/gold'
import { GOODS } from '../goods/ids'
import { addGoods } from '../save/warehouse'
import { materialQuote, type MaterialQuote } from './credit-supplies'
import { CREDIT_SWEEP, FARM_CREDIT, creditLeft, issueCredit, payCredit } from './credit'
import { SaveRuleError } from '../save/rules'
import { DORM_LOAN, farmHome, HOUSE_LOAN, INCOME_NIGHTS, MAX_LOANS, type FarmSave, type Loan, type NightAccount } from '../save/v4'
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

/** Legacy repayment terms remain on loans opened before the shared credit line. */
/** A night's share: a tenth of what's owed when it's taken, rounded up to 5g, so it clears in ten nights of income. */
export const LOAN_NIGHTS = 10

export const loanLimit = (_save?: Pick<FarmSave, 'farm'>): number => FARM_CREDIT
export const loanSlots = (_save?: Pick<FarmSave, 'farm'>): number => MAX_LOANS
export const loanNightly = (owed: number): number => Math.ceil(owed / LOAN_NIGHTS / 5) * 5
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
  | { by: 'limit'; limit: number }

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
  materials: MaterialQuote[]
  cash: number
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
  const limit = creditLeft(save)
  if (borrow > limit) return { by: 'limit', limit }
  return null
}

/** A build paid with gold only (a house): its order. */
function goldOrder(save: FarmSave, project: string, kind: 'house', cost: number, budget: number): BuildOrder {
  const cash = Math.min(cost, budget)
  const borrow = cost - cash
  return { project, kind, place: null, cost, own: needGold(cost - save.gold), borrow, cash, materials: [], lock: loanLock(save, null, borrow) }
}

/** The builds the office can order today, in the Diary's order: the places offered at your Farm Rank whose games are
 * built and that don't stand yet (one paid today says "Builds tonight"), then the next house once its wedding has come. */
export function buildOrders(save: FarmSave, deposit = save.gold): BuildOrder[] {
  const budget = Number.isSafeInteger(deposit) ? Math.max(0, Math.min(save.gold, deposit)) : save.gold
  const rank = farmRankOf(save.farm.points)
  const places = BUILD_PLACES.filter((p) => p.opens.game && p.opens.rank <= rank && !placeBuilt(save, p.id)).map((place): BuildOrder => {
    const cost = place.opens.cost.gold
    const lock = buildLock(save, place.id)
    const lines = buildNeeds(save, place).filter(({ goods, have }) => have < goods.count)
    const materials = lines.flatMap(({ goods, have }) => {
      const quotes = GOODS.filter(good => good.family === goods.family && good.refined === goods.refined)
        .flatMap(good => materialQuote(save, good.id, goods.count - have) ?? [])
        .sort((a, b) => a.unit - b.unit)
      return quotes.slice(0, 1)
    })
    const build = lock?.by === 'short' && materials.length === lines.length ? null : lockButGold(save, place.id)
    const total = cost + materials.reduce((sum, line) => sum + line.count * line.unit, 0)
    const cash = Math.min(budget, total)
    const borrow = build ? 0 : total - cash
    return { project: place.id, kind: 'place', place, cost, own: buildLockWords(lock), borrow, cash, materials, lock: loanLock(save, build, borrow) }
  })
  const lot = nextLot(save)
  const house = lot && lot.open ? [goldOrder(save, `house:${lot.n}`, 'house', lot.cost, budget)] : []
  return [...places, ...house]
}

/** A loan's lock in the player's words, or null when the office lends now. */
export function loanLockWords(lock: LoanLock | null): string | null {
  if (!lock) return null
  switch (lock.by) {
    case 'town': return 'The mayor’s office is in town.'
    case 'build': return `${lock.words}.`
    case 'enough': return 'You have the gold: build it.'
    case 'slots': return 'All three loan slots are in use.'
    case 'limit': return `You have ${lock.limit.toLocaleString('en-US')}g of credit left.`
  }
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

/** Buys an eligible build and opens its credit note in the same save change. */
export function borrowFor<S extends FarmSave>(save: S, project: string, name = '', expected?: number, deposit?: number): S {
  if (!save.today.town) throw new SaveRuleError('locked', loanLockWords({ by: 'town' })!)
  if (deposit !== undefined && (!Number.isSafeInteger(deposit) || deposit < 0 || deposit > save.gold)) {
    throw new SaveRuleError('bad-count', 'Choose a deposit within the gold you hold.')
  }
  const order = buildOrders(save, deposit).find((o) => o.project === project)
  if (!order) throw new SaveRuleError('locked', notAnOrder(save, project))
  if (order.lock) throw new SaveRuleError(order.lock.by === 'enough' || order.lock.by === 'slots' ? 'bad-job' : 'locked', loanLockWords(order.lock)!)
  if (expected !== undefined && order.borrow !== expected) throw new SaveRuleError('locked', 'The quote changed. Review it again.')
  const issued = issueCredit(save, loanName(project), 'project', order.cash + order.borrow, order.cash, project)
  let items = issued.items
  for (const line of order.materials) items = addGoods(items, line.id, 1, line.count)
  const prepared = { ...issued, items }
  const funded = order.cost - order.cash
  const lent = funded >= 0 ? earnGold(prepared, funded) : spendGold(prepared, -funded)
  switch (order.kind) {
    case 'place': return payBuild(lent, order.place!.id)
    case 'house': return buildHouse(lent, name) as S
  }
}

/** Pays the full balance or a chosen portion of one note at the office. */
export function repayLoan<S extends FarmSave>(save: S, project: string, amount?: number): S {
  if (!save.today.town) throw new SaveRuleError('locked', loanLockWords({ by: 'town' })!)
  const loan = save.farm.loans.find((l) => l.for === project)
  if (!loan) throw new SaveRuleError('bad-job', 'No loan for that.')
  const payment = amount ?? loan.owed
  if (payment > save.gold) throw new SaveRuleError('no-gold', `Need ${(payment - save.gold).toLocaleString('en-US')}g more.`)
  return payCredit(save, loan, payment, 'manual')
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
 * nights. Takeout, upkeep and arrears reserve their cash first. Each loan draws in order from the night's remaining
 * income and spare cash. When a bill is short, the farm pays takeout first and counts consecutive short nights.
 */
export function settleAccounts<S extends FarmSave>(save: S, income: number, food: FoodBill | null = null, restaurant = 0, townOrders = 0): { save: S; lines: MoneyLine[] } {
  const lines: MoneyLine[] = townOrders ? [{ kind: 'town-orders', gold: townOrders }] : []
  let gold = save.gold
  const takeout = (food?.takeout ?? 0) * TAKEOUT_PRICE
  const due = upkeepOf(save).gold + save.farm.owed
  let share = Math.min(income, Math.max(0, gold - takeout - due))
  let account = save
  const pay = (loan: Loan, amount: number) => {
    if (amount > 0) account = payCredit(account, loan, amount, 'automatic')
    gold -= amount
    lines.push({ kind: 'loan', for: loan.for, paid: amount, left: loan.owed - amount, ...(loan.credit ? { title: loan.credit.title } : {}) })
  }
  let afterBills = Math.max(0, income - takeout - due)
  for (const loan of save.farm.loans.filter(loan => !loan.credit)) {
    const paid = Math.min(loan.nightly, loan.owed, share)
    pay(loan, paid)
    share -= paid
    afterBills = Math.max(0, afterBills - paid)
  }
  const repaymentBudget = Math.floor(afterBills * CREDIT_SWEEP)
  share = Math.min(share, repaymentBudget)
  for (const loan of save.farm.loans.filter(loan => loan.credit)) {
    const paid = Math.min(loan.owed, share)
    pay(loan, paid)
    share -= paid
  }
  if (food?.staff) lines.push({ kind: 'staff', mouths: food.staff.mouths, days: food.staff.days })
  if (food && (food.pantry > 0 || food.spoiled > 0)) lines.push({ kind: 'pantry', meals: food.pantry, spoiled: food.spoiled, fed: food.fed })
  const bought = Math.min(gold, takeout)
  gold -= bought
  if (takeout > 0) lines.push({ kind: 'takeout', meals: food!.takeout, paid: bought, due: takeout })
  const paid = Math.min(gold, due)
  gold -= paid
  const owed = due - paid + takeout - bought
  const short = owed > 0 ? save.farm.short + 1 : 0
  if (due > 0) lines.push({ kind: 'upkeep', paid, due })
  if (owed > 0) lines.push({ kind: 'short', owed, nights: short })
  else if (save.farm.owed > 0) lines.push({ kind: 'paid-up', owed: save.farm.owed })
  const book = [...save.farm.income, income].slice(-INCOME_NIGHTS)
  const record: NightAccount = { day: save.calendar.day, shipping: income - restaurant - townOrders, ...(restaurant ? { restaurant } : {}), ...(townOrders ? { townOrders } : {}),
    ...(repaymentBudget ? { repaymentBudget } : {}), food: bought, upkeep: paid, loans: save.gold - gold - bought - paid, owed }
  const accounts = [...(save.farm.accounts ?? []).filter(entry => entry.day < record.day), record].slice(-INCOME_NIGHTS)
  return { save: { ...account, gold, farm: { ...account.farm, owed, short, income: book, accounts } }, lines }
}
