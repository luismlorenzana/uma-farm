import { creditQuote, financeOrder, type CreditQuote, type FarmSave } from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { changeHomestead } from './homestead-actions'
import { gold } from './money-words'

export function CreditDetails({ quote }: { quote: CreditQuote }) {
  return <dl className="grid grid-cols-2 gap-x-3 text-[13px] tabular-nums">
    <dt>Total cost</dt><dd>{gold(quote.cost)}</dd>
    <dt>Pay now</dt><dd>{gold(quote.cash)}</dd>
    <dt>Borrow</dt><dd>{gold(quote.principal)}</dd>
    <dt>Fee</dt><dd>{gold(quote.fee)}</dd>
    <dt>Total owed</dt><dd>{gold(quote.owed)}</dd>
    <dt>Credit left</dt><dd>{gold(quote.left)}</dd>
  </dl>
}

export function CreditPurchase({ save, title, cost, lock, order, onDone }: {
  save: FarmSave; title: string; cost: number; lock?: string | null
  order: (s: FarmSave) => FarmSave; onDone?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (lock || save.gold >= cost) return null
  const quote = creditQuote(save, cost, save.gold)
  const submit = () => {
    setBusy(true)
    void changeHomestead(s => {
      if (s.gold !== quote.cash) throw new Error('The quote changed. Review it again.')
      return financeOrder(s, title, cost, quote.cash, funded => {
        const ordered = order(funded)
        if (funded.gold - ordered.gold !== cost) throw new Error('The purchase price changed. Review it again.')
        return ordered
      })
    }).then(() => {
      setOpen(false)
      setMessage('Purchased on credit.')
      onDone?.()
    }, (error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not complete the purchase.'))
      .finally(() => setBusy(false))
  }
  return <div className="space-y-1">
    {open ? <>
      <CreditDetails quote={quote} />
      <Button variant="secondary" disabled={busy || !!quote.blocked} onClick={submit}>Confirm financing</Button>
      <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Close quote</Button>
      {quote.blocked && <p className="text-[13px] text-ink-soft">{quote.blocked}</p>}
    </> : <Button variant="secondary" onClick={() => setOpen(true)}>Review financing</Button>}
    {message && <p role="status" className="text-[13px]">{message}</p>}
  </div>
}
