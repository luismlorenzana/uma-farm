// Build financing, gold and goods advances, and manual payments from the mayor's office.
import {
  borrowGold, borrowMaterials, buildCostWords, buildOrders, creditLeft, creditQuote, goodName, HOUSE_NAME_MAX, houseNameIssue,
  loanLockWords, loanSlots, materialOptions, materialQuote, type BuildOrder, type FarmSave, type Loan,
} from '@farm/domain'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useState } from 'react'
import { borrowAndBuild, buildPlace, repayTheLoan } from '../loop/actions'
import { buildHouseNamed } from '../loop/homestead-actions'
import { HOMESTEAD_TEXT } from '../loop/homestead-view'
import { gold, loanWords, projectInSentence, projectName, projectNames, type ProjectNames } from '../loop/money-words'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { changeHomestead } from '../loop/homestead-actions'
import { CreditDetails } from '../loop/CreditPurchase'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
const upper = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

export default function MayorSheet({ title, onClose }: { title: string; onClose: () => void }) {
  const save = useLoopSave()
  const pack = useStory()
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!save) return null
  const names = projectNames(pack, save)
  const run = (job: () => Promise<unknown>, done: string) => {
    setBusy(true)
    setNote(null)
    job().then(() => setNote(done), (err: unknown) => setNote(errorWords(err))).finally(() => setBusy(false))
  }
  return (
    <Sheet open onClose={onClose} size="wide" title={title} label="The mayor’s office"
      footer={<p className="min-h-5 text-center text-[13px] text-ink-soft" role={note ? 'status' : undefined} data-mayor-note>{note ?? `${gold(save.gold)} held`}</p>}>
      <div className="@container pb-1" data-mayor>
        <div className="grid gap-4 @xl:grid-cols-2">
          <Orders save={save} names={names} busy={busy} run={run} />
          <Loans save={save} names={names} busy={busy} run={run} />
        </div>
      </div>
    </Sheet>
  )
}

type Run = (job: () => Promise<unknown>, done: string) => void

/** What a build costs, in words: a place's gold and goods, a house's gold. */
function costWords(order: BuildOrder): string {
  return order.place ? buildCostWords(order.place) : `${gold(order.cost)} · 2 rooms`
}

/** Order a build: each build with Build, Borrow and build, or why not. */
function Orders({ save, names, busy, run }: { save: FarmSave; names: ProjectNames; busy: boolean; run: Run }) {
  const orders = buildOrders(save)
  return (
    <section aria-label="Order a build" data-orders={orders.length}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-micro">Order a build</h3>
        <GuideButton topic="builds" title="Ordering a build" label="How ordering works">
          <p>Build anything the Farm Rank offers with your own gold and goods, here or at its place on the farm.</p>
          <p>Review a credit quote for the gold you need and any materials available from a supplier.</p>
          <p>A place stands tomorrow morning; a house stands at once.</p>
        </GuideButton>
      </div>
      {orders.length === 0 ? <p className="py-2 text-[14px] text-ink-soft" data-no-orders>Nothing to build at this rank.</p> : (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {orders.map((order) => <OrderRow key={order.project} save={save} order={order} names={names} busy={busy} run={run} />)}
        </ul>
      )}
    </section>
  )
}

function OrderRow({ save, order, names, busy, run }: { save: FarmSave; order: BuildOrder; names: ProjectNames; busy: boolean; run: Run }) {
  const [name, setName] = useState('')
  const [review, setReview] = useState(false)
  const [deposit, setDeposit] = useState(order.cash)
  const nextQuote = review ? buildOrders(save, deposit).find(row => row.project === order.project) ?? order : order
  const house = order.kind === 'house'
  const issue = house ? houseNameIssue(name) : null
  const what = projectName(order.project, names)
  const tonight = order.place !== null && save.farm.builds.includes(order.place.id)
  const done = (lent: boolean) => `${upper(projectInSentence(order.project, names))} ${house ? 'stands' : 'stands tomorrow'}${lent ? ', on a loan' : ''}.`
  const own = () => run(() => (order.kind === 'place' ? buildPlace(order.place!.id) : buildHouseNamed(name)), done(false))
  const borrow = () => run(() => borrowAndBuild(order.project, name, nextQuote.borrow, deposit), done(true))
  // Why borrowing can't help now: the build's own lock, else the office's.
  const why = order.own !== null && order.lock !== null && order.lock.by !== 'enough' ? (order.lock.by === 'build' ? order.own : loanLockWords(order.lock)) : null
  return (
    <li className="space-y-1.5 px-3 py-2" data-order={order.project} data-own={order.own === null || undefined} data-borrow={order.lock === null ? order.borrow : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold">{what}</span>
        <span className="text-right text-[12px] text-ink-soft">{costWords(order)}</span>
      </div>
      {tonight ? <p className="text-[13px] text-ink-soft" data-order-why>Builds tonight</p> : (
        <>
          {house && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={HOMESTEAD_TEXT.placeholder} maxLength={40} autoComplete="off" autoCapitalize="words"
              spellCheck={false} aria-label={`${what}'s name`} title={`Up to ${HOUSE_NAME_MAX} letters`}
              className="min-h-11 w-full rounded-md border border-hairline-strong bg-panel px-3 text-[15px] placeholder:text-ink-faint" data-order-name />
          )}
          {order.own === null ? (
            <Button className="w-full" disabled={busy || issue !== null} onClick={own} data-action="order-build">Build · {gold(order.cost)}</Button>
          ) : order.lock === null ? (
            <>
              {review ? <>
                <label className="flex items-center gap-2 text-[13px]">Pay from savings
                  <input type="number" min="0" max={save.gold} value={deposit} className="min-h-11 w-28 border border-hairline bg-panel px-2"
                    onChange={event => setDeposit(Number(event.currentTarget.value))} />
                </label>
                <CreditDetails quote={creditQuote(save, nextQuote.cash + nextQuote.borrow, nextQuote.cash)} />
                {nextQuote.lock && <p className="text-[13px]">{loanLockWords(nextQuote.lock)}</p>}
                {order.materials.map(line => <p key={line.id} className="text-[12px]">{line.count} × {goodName(line.id)} · {gold(line.unit)} each</p>)}
                <Button className="w-full" disabled={busy || issue !== null || !!nextQuote.lock || deposit < 0 || deposit > save.gold || !Number.isSafeInteger(deposit)} onClick={borrow} data-action="borrow">Confirm and build</Button>
              </> : <Button className="w-full" disabled={busy} onClick={() => setReview(true)} data-action="review-build-credit">Review financing · {gold(order.borrow)}</Button>}
            </>
          ) : (
            <p className="text-[13px] text-ink-soft" data-order-why>{why ?? order.own}</p>
          )}
        </>
      )}
    </li>
  )
}

function Loans({ save, names, busy, run }: { save: FarmSave; names: ProjectNames; busy: boolean; run: Run }) {
  return <section className="space-y-2" aria-label="Loans" data-office-loans={save.farm.loans.length}>
    <div className="flex items-center justify-between">
      <h3 className="text-micro">Loans</h3>
      <GuideButton topic="loans" label="How loans work" />
    </div>
    <p className="text-[13px]" data-terms>{gold(creditLeft(save))} credit left · {loanSlots(save) - save.farm.loans.length} slots free</p>
    <p className="text-[13px] text-ink-soft">10% once · 20% of nightly sales left after bills</p>
    <Advance save={save} busy={busy} run={run} />
    {save.farm.loans.length === 0 && <p className="text-[13px] text-ink-soft" data-no-loans>No loans.</p>}
    <ul className="space-y-2">
      {save.farm.loans.map(loan => <LoanRow loan={loan} key={loan.for} save={save} names={names} busy={busy} run={run} />)}
    </ul>
    {(save.farm.financeLog ?? []).filter(row => row.kind === 'cleared').slice(-4).reverse().map((row, index) =>
      <p className="text-[13px] text-ink-soft" key={`${row.for}-${index}`}>{row.title} · Paid off</p>)}
  </section>
}

function LoanRow({ loan, save, names, busy, run }: { loan: Loan; save: FarmSave; names: ProjectNames; busy: boolean; run: Run }) {
  const [amount, setAmount] = useState('')
  const [partial, showPartial] = useState(false)
  const requested = Number(amount)
  const max = Math.min(save.gold, loan.owed)
  const last = save.farm.financeLog?.filter(row => row.for === loan.for && row.kind !== 'borrowed').at(-1)
  const pay = (goldPaid: number) => run(() => repayTheLoan(loan.for, goldPaid), `${gold(goldPaid)} repaid.`)
  return <li className="space-y-1 rounded-md border border-hairline p-2" data-office-loan={loan.for}>
    <p className="font-semibold">{loan.credit?.title ?? projectName(loan.for, names)}</p>
    <p className="text-[13px] text-ink-soft">{gold(loan.lent)} borrowed · {gold(loan.fee)} fee</p>
    <p className="text-[13px]">{loanWords(save, loan)}</p>
    {last && <p className="text-[13px] text-ink-soft">Last payment · {gold(last.amount)}</p>}
    <div className="flex flex-wrap gap-1">
      <Button variant="secondary" disabled={busy || !max} onClick={() => showPartial(!partial)} data-action="partial-payment">Pay any amount</Button>
      <Button variant="secondary" disabled={busy || max < loan.owed} onClick={() => pay(loan.owed)} data-action="repay">Pay off · {gold(loan.owed)}</Button>
    </div>
    {partial && <label className="flex flex-wrap items-center gap-2 text-[13px]">Payment
      <input className="min-h-11 w-24 border border-hairline bg-panel px-2" type="number" min="1" max={max} value={amount}
        onChange={event => setAmount(event.currentTarget.value)} />
      <Button disabled={busy || !Number.isSafeInteger(requested) || requested < 1 || requested > max} onClick={() => pay(requested)}>Confirm payment</Button>
      {requested > 0 && requested <= max && <span>{gold(loan.owed - requested)} owed after payment · {gold(save.gold - requested)} held</span>}
    </label>}
  </li>
}

function Advance({ save, busy, run }: { save: FarmSave; busy: boolean; run: Run }) {
  const [id, select] = useState('')
  const [amount, setAmount] = useState('1000')
  const [review, setReview] = useState(false)
  const n = Number(amount)
  const supplies = materialOptions(save)
  const goods = id ? materialQuote(save, id, n) : null
  const cost = id ? (goods?.unit ?? 0) * (goods?.count ?? 0) : n
  const quote = creditQuote(save, cost, 0)
  return <details className="rounded-md border border-hairline p-2">
    <summary className="min-h-11 cursor-pointer font-semibold">Borrow gold or materials</summary>
    <div className="space-y-2">
      <select aria-label="What to borrow" className="min-h-11 w-full border border-hairline bg-panel px-2" value={id} onChange={event => {
        const value = event.currentTarget.value
        select(value); setAmount(value ? '1' : '1000'); setReview(false)
      }}>
        <option value="">Gold advance</option>
        {supplies.map(line => <option key={line.id} value={line.id}>{goodName(line.id)} · {gold(line.unit)} each</option>)}
      </select>
      <label className="flex items-center gap-2 text-[13px]">{id ? 'Quantity' : 'Gold'}
        <input type="number" className="min-h-11 w-28 border border-hairline bg-panel px-2" value={amount} min="1" onChange={event => {
          setAmount(event.currentTarget.value); setReview(false)
        }} />
      </label>
      {review ? <>
        <CreditDetails quote={quote} />
        {quote.blocked && <p className="text-[13px] text-ink-soft">{quote.blocked}</p>}
        <Button disabled={busy || !!quote.blocked} onClick={() => run(
          () => changeHomestead(s => id ? borrowMaterials(s, id, n) : borrowGold(s, n)), 'Advance received.',
        )}>Confirm advance</Button>
      </> : <Button variant="secondary" disabled={busy || !Number.isSafeInteger(n) || n < 1 || (!!id && !goods)} onClick={() => setReview(true)}>Review quote</Button>}
    </div>
  </details>
}
