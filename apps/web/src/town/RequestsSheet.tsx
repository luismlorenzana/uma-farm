import {
  acceptRequest, boardOpen, CAFE_TUTORIAL, cancelRequest, dateOf, deliverRequest, FISHERY, FISHING_SPOTS,
  FOREST, FOREST_AREAS, goodName, goodOf, ingredientSources, requestCards, requestDeliveryLock, STATION_JOBS,
  stationJobOf, taskLock, workKey, type FarmSave, type FarmTask, type RequestCard,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { changeHomestead } from '../loop/homestead-actions'
import { gold } from '../loop/money-words'
import { shortDate } from '../loop/words'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { orderLink } from '../book/work-plan'
import { MasterGate } from '../master/MasterGate'
import { namer } from '../story/people'

function workFor(save: FarmSave, good: string): string {
  const season = dateOf(save.calendar.day, save.calendar).season
  const job = stationJobOf(good)
  const tasks: FarmTask[] = job ? [{ kind: 'load', station: STATION_JOBS[job].station }]
    : [...FISHING_SPOTS.filter(spot => FISHERY[spot].seasons[season].some(([id]) => id === good)).map(spot => ({ kind: 'fish' as const, spot })),
      ...FOREST_AREAS.filter(area => FOREST[area].seasons[season].some(([id]) => id === good)).map(area =>
        goodOf(good)?.family === 'woods' ? { kind: 'chop' as const, area } : { kind: 'forage' as const, area })]
  const task = tasks.find(candidate => !taskLock(save, candidate))
  return task ? orderLink(workKey(task)) : '/book?view=work'
}

const SLOT_NAMES = { food: 'Food', makers: 'Makers', town: 'Town' }

export default function RequestsSheet() {
  const save = useLoopSave()
  const pack = useStory()
  const location = useLocation()
  const leave = useLeave()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (!save) return null
  const cards = requestCards(save, pack)
  const act = async (card: RequestCard, action: 'accept' | 'cancel' | 'deliver') => {
    if (busy) return
    setBusy(true)
    try {
      await changeHomestead(current => action === 'accept' ? acceptRequest(current, pack, card.slot, card.id)
        : action === 'deliver' ? deliverRequest(current, pack, card.slot, card.id) : cancelRequest(current, card.slot, card.id))
      setMessage(action === 'deliver' ? `${card.title} delivered. Payment tonight.` : action === 'accept' ? 'Accepted. Surplus shipping will keep its stock.' : 'Order cancelled. Stock released.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the order.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open size="wide" title="Town requests" label="Town requests" onClose={() => leave(withParam(location, 'sheet', null))}>
      <div className="space-y-2" data-requests>
        {message && <p role="status" className="rounded-md bg-panel p-2 text-sm">{message}</p>}
        {(save.farm.requests?.pending ?? 0) > 0 && <p className="text-sm font-semibold">{gold(save.farm.requests!.pending)} due tonight</p>}
        {!boardOpen(save) ? <p className="text-sm">Meet five Umas to open the board · {Object.keys(save.roster).length}/5</p> : (
          <MasterGate>{master => {
            const nameOf = pack ? namer(master, pack) : (id: string) => id
            return <div className="grid gap-2 sm:grid-cols-2">
              {(['food', 'makers', 'town'] as const).map(slot => {
                const card = cards.find(entry => entry.slot === slot)
                if (!card) return <div key={slot} className="rounded-md border border-hairline p-2"><h3 className="text-micro">{SLOT_NAMES[slot]}</h3><p className="text-sm text-ink-soft">No order right now.</p></div>
                const lock = requestDeliveryLock(save, card)
                const good = goodOf(card.item)
                const grade = good?.grade
                const source = grade && ingredientSources(card.item)[0]
                return (
                  <section key={slot} className="space-y-1 rounded-lg border border-hairline bg-panel p-2" data-request={card.id} data-status={card.status}>
                    <p className="text-micro">{SLOT_NAMES[slot]} · {card.worker ? nameOf(card.worker) : 'Town counter'}</p>
                    <h3 className="text-[15px] font-bold">{card.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <ItemIcon id={card.item} size={28} />
                      <span>{card.count} × {goodName(card.item)}{grade && !good?.base ? ` G${grade}` : ''}{card.stars > 1 ? ` · ★${card.stars}+` : ''}</span>
                    </div>
                    <p className="text-xs text-ink-soft">
                      {card.status === 'delivered' ? `Delivered · ${gold(card.payment)}` : `${card.held}/${card.count} held · ${card.due === null ? card.id === CAFE_TUTORIAL ? 'No deadline' : '7 days to deliver' : `Due ${shortDate(card.due, save.calendar)}`}${card.held === card.count ? ` · ${gold(card.payment)}` : ` · about ${gold(card.payment)}`}`}
                    </p>
                    {(card.status === 'offered' || card.status === 'cancelled') && <Button disabled={busy} onClick={() => void act(card, 'accept')}>Accept</Button>}
                    {card.status === 'accepted' && <>
                      <div className="flex flex-wrap gap-1">
                        <Button disabled={busy || !!lock} onClick={() => void act(card, 'deliver')}>Deliver · 1 action</Button>
                        <Button variant="secondary" disabled={busy} onClick={() => void act(card, 'cancel')}>Cancel</Button>
                      </div>
                      {lock && <p className="text-xs text-ink-soft">{lock}</p>}
                    </>}
                    {card.status === 'expired' && <p className="text-xs text-ink-soft">Expired · check again next week</p>}
                    {source && card.held < card.count && card.status !== 'delivered' && <p className="text-xs text-ink-soft">{source.label}</p>}
                    {card.status !== 'delivered' && card.held < card.count && <Link className="inline-grid min-h-11 items-center text-xs font-semibold underline"
                      to={grade ? workFor(save, card.item) : '/?sheet=kitchen'} state={{ back: true }}>{grade ? 'Open Work board' : 'Open Kitchen'} ›</Link>}
                  </section>
                )
              })}
            </div>
          }}</MasterGate>)}
      </div>
    </Sheet>
  )
}
