import { earnGold, spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { MAX_LOANS, type FarmSave, type Loan, type FinanceEntry } from '../save/v4'

export const FARM_CREDIT = 100_000
export const LOAN_FEE = 0.1
export const CREDIT_SWEEP = 0.2
export const loanFee = (principal: number): number => Math.ceil(principal / 100) * 10
export const remainingPrincipal = (loan: Loan): number => Math.min(loan.lent, loan.owed)

export const creditLeft = (save: Pick<FarmSave, 'farm'>): number =>
  Math.max(0, FARM_CREDIT - save.farm.loans.reduce((sum, loan) => sum + remainingPrincipal(loan), 0))

export interface CreditQuote {
  cost: number
  cash: number
  principal: number
  fee: number
  owed: number
  left: number
  blocked: string | null
}

export function creditQuote(save: Pick<FarmSave, 'gold' | 'farm'>, cost: number, cash: number): CreditQuote {
  const principal = cost - cash
  const available = creditLeft(save)
  const blocked = !Number.isSafeInteger(cost) || !Number.isSafeInteger(cash) || cash < 0 || principal < 1 ? 'Choose a positive loan amount.'
    : save.gold < cash ? 'You need more gold for the deposit.'
    : save.farm.loans.length >= MAX_LOANS ? 'All three loan slots are in use.'
    : principal > available ? 'This is more than your remaining credit.'
    : null
  const fee = loanFee(Math.max(0, principal))
  return { cost, cash, principal, fee, owed: principal + fee, left: Math.max(0, available - principal), blocked }
}

export function financeEntry<S extends FarmSave>(save: S, entry: Omit<FinanceEntry, 'day'>): S {
  const financeLog = [...(save.farm.financeLog ?? []), { day: save.calendar.day, ...entry }].slice(-28)
  return { ...save, farm: { ...save.farm, financeLog } }
}

export function issueCredit<S extends FarmSave>(
  save: S, title: string, kind: NonNullable<Loan['credit']>['kind'], cost: number, cash: number, project?: string,
): S {
  const quote = creditQuote(save, cost, cash)
  if (quote.blocked) throw new SaveRuleError('locked', quote.blocked)
  const sequence = (save.farm.counts['credit-sequence'] ?? 0) + 1
  const loan: Loan = {
    for: project ?? `credit:${sequence}`,
    day: save.calendar.day, lent: quote.principal, fee: quote.fee, owed: quote.owed, nightly: 0,
    credit: { title, kind },
  }
  if (save.farm.loans.some(existing => existing.for === loan.for)) throw new SaveRuleError('bad-job', 'This loan is already open.')
  return financeEntry({
    ...save,
    farm: { ...save.farm, loans: [...save.farm.loans, loan], counts: { ...save.farm.counts, 'credit-sequence': sequence } },
  }, { title, kind: 'borrowed', amount: quote.principal, for: loan.for })
}

export function financeOrder<S extends FarmSave>(
  save: S, title: string, cost: number, cash: number, order: (funded: S) => S,
): S {
  const issued = issueCredit(save, title, 'project', cost, cash)
  return order(earnGold(issued, cost - cash))
}

export function borrowGold<S extends FarmSave>(save: S, amount: number): S {
  if (!save.today.town) throw new SaveRuleError('locked', 'Loans are at the mayor’s office.')
  return earnGold(issueCredit(save, 'Gold advance', 'gold', amount, 0), amount)
}

export function payCredit<S extends FarmSave>(save: S, loan: Loan, amount: number, kind: 'manual' | 'automatic'): S {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > loan.owed) {
    throw new SaveRuleError('bad-count', 'Choose a whole amount up to the outstanding balance.')
  }
  const paid = spendGold(save, amount)
  const owed = loan.owed - amount
  const next = { ...paid, farm: { ...paid.farm, loans: paid.farm.loans.flatMap(item =>
    item.for !== loan.for ? [item] : owed > 0 ? [{ ...item, owed }] : [],
  ) } }
  return financeEntry(next, {
    for: loan.for, title: loan.credit?.title ?? loan.for, amount, kind: owed === 0 ? 'cleared' : kind,
  })
}
