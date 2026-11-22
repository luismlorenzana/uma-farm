import {
  benchOpen, commissionRing, goodCount, goodName, ringCommissionLock, ringCreditQuote, ringId, ringName,
  RING_COMMISSIONS, RING_DEPOSIT, type FarmSave,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { changeHomestead } from './homestead-actions'
import { CreditDetails } from './CreditPurchase'
import { gold } from './money-words'
import { shortDate } from './words'

export default function BenchSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const close = () => leave(withParam(location, 'sheet', null))
  return <Sheet open onClose={close} title="Ring Bench" label="The ring bench">
    {save && benchOpen(save) ? <Bench save={save} /> : <p>The Ring Bench opens the morning after Romance 8.</p>}
  </Sheet>
}

function Bench({ save }: { save: FarmSave }) {
  const [grade, selectGrade] = useState(1)
  const [financing, showFinancing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const pending = save.forge?.ringOrder
  const recipe = RING_COMMISSIONS[grade - 1]!
  const lock = ringCommissionLock(save, grade)
  const quote = ringCreditQuote(save, grade)
  const ready = (day: number) => shortDate(day, save.calendar)
  const order = (financed: boolean) => {
    setBusy(true)
    setMessage('')
    void changeHomestead(current => {
      if (financed && ringCreditQuote(current, grade).principal !== quote.principal) throw new Error('The quote changed. Review it again.')
      return commissionRing(current, grade, financed)
    }).then(() => {
      showFinancing(false)
      setMessage(`${recipe.name} ordered.`)
    }, (error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not place the order.'))
      .finally(() => setBusy(false))
  }
  return <div className="space-y-3" data-bench>
    {pending && <p className="rounded-md bg-sunken p-2 font-semibold" data-ring-due>On order · {ringName(pending.grade)} · {ready(pending.due)}</p>}
    <label className="grid gap-1 text-[14px]">Wedding ring
      <select className="min-h-11 rounded-sm border border-hairline bg-panel px-2" value={grade}
        onChange={event => { selectGrade(Number(event.currentTarget.value)); showFinancing(false) }}>
        {RING_COMMISSIONS.map(row => <option key={row.grade} value={row.grade}>{row.name} · {gold(row.gold)}</option>)}
      </select>
    </label>
    <section className="space-y-2 rounded-md border border-hairline p-3">
      <div className="flex items-center gap-2">
        <ItemIcon id={ringId(grade)} size={36} />
        <div>
          <p className="font-semibold">{recipe.name} · {gold(recipe.gold)}</p>
          <p className="text-[13px] text-ink-soft">Ready {ready(save.calendar.day + recipe.days)} · +{grade}% at her line</p>
        </div>
      </div>
      <ul className="text-[13px]">
        {recipe.materials.map(line => <li key={line.id}>{line.count} × {goodName(line.id)} · {grade === 1
          ? 'provided by the smith' : `${goodCount(save.items, line.id)} held`}</li>)}
      </ul>
      {lock ? <p className="text-[13px] text-ink-soft">{lock}</p> : <>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || save.gold < recipe.gold} onClick={() => order(false)}>Pay {gold(recipe.gold)}</Button>
          {(grade === 1 || save.gold < recipe.gold) && <Button variant="secondary" disabled={busy} onClick={() => showFinancing(!financing)} data-action="review-ring-credit">
            {grade === 1 ? `Finance · ${gold(RING_DEPOSIT)} down` : 'Review financing'}
          </Button>}
        </div>
        {financing && <>
          <CreditDetails quote={quote} />
          {quote.blocked && <p className="text-[13px] text-ink-soft">{quote.blocked}</p>}
          <Button disabled={busy || !!quote.blocked} onClick={() => order(true)} data-action="finance-ring">Confirm ring order</Button>
        </>}
      </>}
    </section>
    {message && <p role="status" className="text-[13px]">{message}</p>}
    <Link to="/?sheet=forge" state={{ back: true }} className="inline-flex min-h-11 items-center text-accent-strong">Forge workshop ›</Link>
  </div>
}

export function BenchPeek({ save }: { save: FarmSave }) {
  const ring = save.forge?.ringOrder
  return <div className="space-y-2 p-4" data-bench-peek>
    <p className="font-semibold">Ring Bench</p>
    <p className="text-[13px] text-ink-soft">{ring ? `${ringName(ring.grade)} · ready ${shortDate(ring.due, save.calendar)}` : 'Commission a wedding ring.'}</p>
    <Link to="/?sheet=bench" data-action="open-bench" className="inline-flex min-h-11 items-center font-semibold text-accent-strong">Open Ring Bench ›</Link>
  </div>
}
