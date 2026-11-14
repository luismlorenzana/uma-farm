// The mayor's office (`/town?at=mayor&sheet=mayor`, from **Order a build** or **Borrow or repay** at her post), a wide
// side panel in two columns: **Order a build**, every build the office can order today (the places offered at your Farm
// Rank, the Dorm's next level, the next house once its wedding has come), each with **Build** when the gold and goods are
// there, else **Borrow 400g · Build** when only gold is short and the office lends, else why not; and **Loans**, the
// office's terms at your Farm Rank and each loan with what's owed, its share a night, when it clears, and **Repay**.
// Ordering with your own gold is the Build card's rule and needs no town; the office is where you borrow, free once
// you're in town. Loaded on demand with the town.
import {
  buildCostWords, buildOrders, DORM_LEVELS, farmRankOf, HOUSE_NAME_MAX, houseNameIssue, LOAN_FEE, loanFee, LOAN_NIGHTS, loanLimit, loanLockWords, loanSlots, TWO_LOANS_FROM, type BuildOrder,
  type FarmSave,
} from '@farm/domain'
import { Button, HelpButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { borrowAndBuild, buildPlace, buyDormLevel, repayTheLoan } from '../loop/actions'
import { buildHouseNamed } from '../loop/homestead-actions'
import { HOMESTEAD_TEXT } from '../loop/homestead-view'
import { gold, loanWords, projectInSentence, projectName, projectNames, type ProjectNames } from '../loop/money-words'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'

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

/** What a build costs, in words: a place's gold and goods, a Dorm level's beds, a house's gold. */
function costWords(order: BuildOrder): string {
  if (order.place) return buildCostWords(order.place)
  const level = DORM_LEVELS.find((l) => `dorm:${l.level}` === order.project)
  return level ? `${gold(order.cost)} · ${level.beds} beds` : `${gold(order.cost)} · 2 rooms`
}

/** Order a build: each build with Build, Borrow and build, or why not. */
function Orders({ save, names, busy, run }: { save: FarmSave; names: ProjectNames; busy: boolean; run: Run }) {
  const orders = buildOrders(save)
  return (
    <section aria-label="Order a build" data-orders={orders.length}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-micro">Order a build</h3>
        <HelpButton title="Ordering a build" label="How ordering works">
          <p>Build anything the Farm Rank offers with your own gold and goods, here or at its place on the farm.</p>
          <p>Short of gold? The office lends what it’s short, rounded up to 100g, with a {Math.round(LOAN_FEE * 100)}% fee, and orders it at once. You bring the goods.</p>
          <p>A place stands tomorrow morning; a Dorm level’s beds come tomorrow; a house stands at once.</p>
        </HelpButton>
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
  const house = order.kind === 'house'
  const issue = house ? houseNameIssue(name) : null
  const what = projectName(order.project, names)
  const tonight = order.place !== null && save.farm.builds.includes(order.place.id)
  const done = (lent: boolean) => `${upper(projectInSentence(order.project, names))} ${house ? 'stands' : order.kind === 'dorm' ? 'is ready tomorrow' : 'stands tomorrow'}${lent ? ', on a loan' : ''}.`
  const own = () => run(() => (order.kind === 'place' ? buildPlace(order.place!.id) : order.kind === 'dorm' ? buyDormLevel() : buildHouseNamed(name)), done(false))
  const borrow = () => run(() => borrowAndBuild(order.project, name), done(true))
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
              <Button className="w-full" disabled={busy || issue !== null} onClick={borrow} data-action="borrow">Borrow {gold(order.borrow)} · Build</Button>
              <p className="text-[12px] text-ink-soft" data-order-terms>{order.own} · {gold(order.borrow + loanFee(order.borrow))} owed, a tenth a night from income</p>
            </>
          ) : (
            <p className="text-[13px] text-ink-soft" data-order-why>{why ?? order.own}</p>
          )}
        </>
      )}
    </li>
  )
}

/** The office's terms at your Farm Rank, and each loan with Repay. */
function Loans({ save, names, busy, run }: { save: FarmSave; names: ProjectNames; busy: boolean; run: Run }) {
  const rank = farmRankOf(save.farm.points)
  const slots = loanSlots(save)
  return (
    <section aria-label="Loans" data-office-loans={save.farm.loans.length}>
      <h3 className="text-micro">Loans</h3>
      <p className="pb-1 text-[13px] text-ink-soft" data-terms>
        Up to {gold(loanLimit(save))} at Farm Rank {rank} · {slots === 1 ? `one at a time (two from Farm Rank ${TWO_LOANS_FROM})` : 'two at a time'} · {Math.round(LOAN_FEE * 100)}% fee · a
        tenth a night from income, for about {LOAN_NIGHTS} nights
      </p>
      {save.farm.loans.length === 0 ? <p className="text-[14px] text-ink-soft" data-no-loans>No loans.</p> : (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {save.farm.loans.map((loan) => {
            const short = loan.owed - save.gold
            return (
              <li key={loan.for} className="space-y-1.5 px-3 py-2" data-office-loan={loan.for}>
                <span className="block text-[15px] font-semibold">{projectName(loan.for, names)}</span>
                <span className="block text-[12px] text-ink-soft">{loanWords(save, loan)}</span>
                <Button variant="secondary" className="w-full" disabled={busy || short > 0} data-action="repay"
                  onClick={() => run(() => repayTheLoan(loan.for), `The loan for ${projectInSentence(loan.for, names)} is repaid.`)}>
                  {short > 0 ? `Repay · need ${gold(short)} more` : `Repay · ${gold(loan.owed)}`}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
