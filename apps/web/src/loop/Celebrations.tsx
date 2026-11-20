import type { FarmClock } from '@farm/domain'
import {
  CELEBRATIONS, celebrationDate, celebrationTitle, chooseTradition, COHORTS, dateOf, festivalGiftWindow, giveFestivalGift, householdReady,
  itemNameOf, parseStockKey, pledgeFestivalGift, preparingFestival, workStock, type FarmSave,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { changeHomestead } from './homestead-actions'
import { shortDate } from './words'

export const longDate = (day: number, clock?: FarmClock): string => `${shortDate(day, clock)} · Year ${dateOf(day, clock).year}`

export function Celebrations({ save, nameOf }: { save: FarmSave; nameOf: (id: string) => string }) {
  const location = useLocation()
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!save.longGame) return null
  const ready = householdReady(save)
  const gifts = save.longGame.gifts ?? []
  const window = festivalGiftWindow(save)
  const open = window !== null && !gifts.some(gift => festivalGiftWindow({ ...save, calendar: { ...save.calendar, day: gift.day } }) === window)
  const stock = Object.entries(workStock(save.items))
  const run = async (rule: (save: FarmSave) => FarmSave) => {
    setBusy(true); setError(null)
    try { await changeHomestead(rule) }
    catch (err) { setError(err instanceof Error ? err.message : 'Try again.') }
    finally { setBusy(false) }
  }
  return <details className="rounded-md border border-hairline px-3 pb-2" data-celebrations>
    <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Celebrations · {save.longGame.weddings.length}/50</summary>
    <ul className="grid gap-1 sm:grid-cols-2">
      {CELEBRATIONS.map(id => {
        const day = celebrationDate(save, id)
        const held = save.longGame?.celebrations[id]
        const play = ready.includes(id)
        return <li key={id} className="rounded-md bg-sunken/40 p-2">
          <p className="font-semibold">{celebrationTitle(id)}</p>
          <p className="text-[12px] text-ink-soft">{held ? longDate(held, save.calendar) + ' · Held' : day ? longDate(day, save.calendar) : id === 'greater-festival' ? 'One year after the fiftieth wedding' : id.slice(7) + ' spouses'}</p>
          {(held || play) && <Link to={withParam(location, 'household', id) + (held ? '&replay=1' : '')} state={{ back: true }}
            className="flex min-h-11 items-center font-semibold text-accent">{play ? 'Celebrate ›' : 'Replay ›'}</Link>}
        </li>
      })}
    </ul>
    {(preparingFestival(save) || gifts.length > 0) && <section className="space-y-2 pt-3" aria-label="Festival preparations">
      <h3 className="font-semibold">Greater Festival preparations</h3>
      <p className="text-[13px]">{gifts.length}/4 contributions</p>
      {gifts.length > 0 && <ul className="text-[13px]">
        {gifts.map(gift => <li key={gift.day}>{giftName(gift.key)} · {longDate(gift.day, save.calendar)}{gift.crew.length > 0 && ' · ' + gift.crew.map(nameOf).join(', ')}</li>)}
      </ul>}
      {preparingFestival(save) && <>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Festival contribution" className="min-h-11 min-w-0 flex-1 rounded-md border border-hairline bg-panel px-2" value={key} onChange={event => setKey(event.target.value)} disabled={!open || busy}>
          <option value="">Choose an item</option>
          {stock.map(([id, count]) => <option key={id} value={id}>{giftName(id)} · {count} held</option>)}
        </select>
        <Button disabled={busy || !open || !key} onClick={() => void run(s => giveFestivalGift(s, key))}>Contribute</Button>
        <Button variant="secondary" disabled={busy || !open || !key} onClick={() => void run(s => pledgeFestivalGift(s, key))}>Pledge next delivery</Button>
      </div>
      {save.longGame.pledge && <div className="flex items-center justify-between gap-2">
        <p className="text-[13px]">Awaiting {giftName(save.longGame.pledge.key)}</p>
        <Button variant="secondary" disabled={busy} onClick={() => void run(s => pledgeFestivalGift(s, null))}>Cancel pledge</Button>
      </div>}
      <label className="flex items-center gap-2 text-[13px]">Tradition
        <select className="min-h-11 min-w-0 flex-1 rounded-md border border-hairline bg-panel px-2" value={save.longGame.tradition ?? ''}
          disabled={busy} onChange={event => {
            const chosen = COHORTS.find(n => String(n) === event.target.value)
            if (chosen !== undefined) void run(s => chooseTradition(s, chosen))
          }}>
          <option value="" disabled>Remember a celebration</option>
          {COHORTS.filter(n => n < 50 && save.longGame?.celebrations[`cohort:${n}`]).map(n => <option key={n} value={n}>{celebrationTitle(`cohort:${n}`)}</option>)}
        </select>
      </label>
      </>}
      {error && <p role="alert" className="text-danger">{error}</p>}
    </section>}
  </details>
}

const giftName = (key: string): string => {
  const stock = parseStockKey(key)
  return stock ? `${itemNameOf(stock.id)} ★${stock.stars}` : key
}
