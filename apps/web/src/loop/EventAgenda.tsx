import {
  actionCost, agendaLink, calendarDay, canSpendForEvent, communityEvent, dateOf, eventActionsLeft, eventPreparation, festivalNameOf,
  festivalsOf, goodName, householdReady, householdTitle, nightVisits, NIGHT_VISITS, NO_BIRTHDAYS, noPack, occasionFund,
  parseStockKey, setFestivalPlan, upcomingEvent, visitFestival, type EventStock, type FarmSave, type SpecialDays, type StoryPack,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, TrophyIcon } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useSpecialDays, useStory } from '../story/story'
import { byRelationship } from './relationship-order'
import { changeHomestead } from './homestead-actions'
import { gold } from './money-words'
import { shortDate } from './words'
import festivalGreen from '../world/festival-green.webp'

const button = 'inline-flex min-h-11 items-center rounded-md border border-hairline px-2.5 text-[13px] font-semibold text-accent'
const section = 'space-y-1.5 rounded-lg border border-hairline bg-panel p-2.5'
const labels = ['1st', '2nd', '3rd']
const lotText = ({ key, count }: EventStock) => {
  const at = parseStockKey(key)!
  return `${count} × ${goodName(at.id)} ★${at.stars}`
}
type Community = NonNullable<ReturnType<typeof communityEvent>>

function eventRoute(location: { pathname: string; search: string }, params: Record<string, string | null>): string {
  const query = new URLSearchParams(location.search)
  for (const [key, value] of Object.entries(params)) value === null ? query.delete(key) : query.set(key, value)
  return location.pathname + (query.size ? '?' + query : '')
}

export default function EventAgenda() {
  const save = useLoopSave()
  const story = useStory()
  const special = useSpecialDays()
  const master = useMaster()
  const location = useLocation()
  const leave = useLeave()
  const query = new URLSearchParams(location.search)
  const requested = Number(query.get('eventDay'))
  const today = save?.calendar.day ?? 1
  const askedDay = Number.isSafeInteger(requested) && requested > 0 && requested <= today + 120 ? requested : null
  const [day, setDay] = useState(askedDay ?? today)
  const [tab, setTab] = useState<'today' | 'coming' | 'results'>(query.get('eventView') === 'results' ? 'results' : askedDay && askedDay > today ? 'coming' : 'today')
  if (!save) return null
  const days: SpecialDays = special ?? { festivals: festivalsOf(story), birthdays: NO_BIRTHDAYS }
  const pack = story ?? noPack()
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const current = communityEvent(save, days, today, pack)
  const selected = communityEvent(save, days, day, pack)
  const close = () => {
    for (const key of ['sheet', 'eventDay', 'eventView']) query.delete(key)
    leave(location.pathname + (query.size ? '?' + query : ''))
  }
  const chooseDay = (value: number) => { setDay(value); setTab(value === today ? 'today' : 'coming') }
  const coming = Array.from({ length: 120 }, (_, index) => communityEvent(save, days, today + index + 1, pack))
    .filter((event): event is Community => event !== null).slice(0, 6)
  return <Sheet open size="wide" title="Festivals & occasions" label="Festivals & occasions" onClose={close}>
    <div className="space-y-2 pb-2" data-event-agenda data-event-tab={tab}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Event views">
        {(['today', 'coming', 'results'] as const).map(key => <Button key={key} size="md" variant={tab === key ? 'primary' : 'secondary'}
          onClick={() => { setTab(key); if (key === 'today') setDay(today); if (key === 'coming' && day === today) setDay(coming[0]?.day ?? today) }}>
          {key === 'today' ? 'Today' : key === 'coming' ? 'Coming up' : 'Results'}
        </Button>)}
      </div>
      {tab === 'results' ? <Results save={save} days={days} nameOf={nameOf} /> : <>
        {tab === 'coming' && <div className="flex gap-1 overflow-x-auto" aria-label="Upcoming dates">
          {coming.map(event => <button key={event.key} type="button" aria-pressed={day === event.day}
            className={button + ' shrink-0'} onClick={() => chooseDay(event.day)}>{shortDate(event.day, save.calendar)} · {event.name}</button>)}
        </div>}
        {selected ? <CommunityCard key={selected.key} event={selected} save={save} days={days} story={pack} nameOf={nameOf} /> : !current && tab === 'today'
          ? <p className="px-1 text-sm text-ink-soft">No town festival today.</p> : null}
        <Personal day={day} save={save} days={days} pack={pack} nameOf={nameOf} />
        <Link to={eventRoute(location, { calendarDay: String(day), sheet: 'calendar' })} state={{ back: true }} className={button}>Open Calendar ›</Link>
      </>}
    </div>
  </Sheet>
}

function CommunityCard({ event, save, days, story, nameOf }: {
  event: Community; save: FarmSave; days: SpecialDays; story: StoryPack; nameOf: (id: string) => string
}) {
  const location = useLocation()
  const [choice, setChoice] = useState(0)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const plan = save.eventJournal?.plan
  const pinned = plan !== undefined && plan.id === event.rule && plan.day === event.day
  const prep = event.rule ? eventPreparation(save, event.rule, event.day, days, story) : null
  const entry = event.rule === 'cooking-contest' ? withParam(location, 'sheet', 'contest')
    : eventRoute(location, { contest: event.rule, sheet: 'festival' })
  const payment = event.today && event.rule ? Math.min(3, event.actions) : 3
  const act = async (rule: (save: FarmSave) => FarmSave) => {
    if (busy) return
    setBusy(true)
    try { await changeHomestead(rule); setNote('') }
    catch (err) { setNote(err instanceof Error ? err.message : 'Try again.') }
    finally { setBusy(false) }
  }
  const suggest = prep?.stock[choice] ?? prep?.stock[0] ?? []
  const receipt = event.receipt
  const allowPlan = event.rule && event.status !== 'results' && event.status !== 'continue' && event.day >= save.calendar.day
  return <section className={section} data-community-event={event.id} data-event-phase={event.status}>
    <img src={festivalGreen} alt="" width={1200} height={400} className="h-20 w-full rounded-md object-cover" />
    <p className="text-micro">{shortDate(event.day, save.calendar)} · {event.venue}</p>
    <h3 className="font-display text-xl font-bold flex items-center gap-2"><TrophyIcon size={16} />{event.name}</h3>
    <p className="text-sm text-ink-soft">{event.host ? nameOf(event.host) : event.venue + ' noticeboard'}</p>
    {event.visited && <p className="text-sm" data-event-greeting>{event.judged
      ? event.judged.place ? 'The judging is finished. The results are posted by the gate.' : 'The judges have closed the round. There’s still time to walk the exhibits.'
      : event.invite}</p>}
    <div className="flex flex-wrap gap-1.5">
      {event.today && <Button disabled={busy || event.visited} variant="secondary" onClick={() => void act(s => visitFestival(s, event.id, event.day, days))}
        data-action="visit-festival">{event.visited ? 'Visited ✓' : 'Visit free'}</Button>}
      {event.today && event.rule && <Link className={button} to={entry} state={{ back: true }} data-festival-enter={event.rule}>
        {event.status === 'continue' ? 'Continue ›' : event.status === 'results' ? 'Judging results ›'
          : prep?.missing || prep?.lock ? 'See what’s missing ›' : `Enter · ${payment} festival${payment < 3 ? ' + ' + (3 - payment) + ' regular' : ''} ›`}
      </Link>}
      {event.today && <Link className={button} to={'/town?at=' + event.place} state={{ back: true }}>Go to venue ›</Link>}
      {event.status === 'past' && !event.visited && <span className="text-sm text-ink-soft">This date has passed. Look for it in Coming up.</span>}
    </div>
    {!!prep && event.status !== 'results' && <div className="space-y-1" data-event-preparation>
      <p className="text-sm">{event.entry}</p>
      {event.today && <p className="text-xs text-ink-soft">{save.today.eventFunding ? 'Contest ' + event.actions + '/3' : 'Event pool ' + event.actions} · Regular {event.regular}{save.today.eventFunding ? ' · Social ' + eventActionsLeft(save, days, 'social') + '/1' : ''}</p>}
      <p className="text-xs text-ink-soft">First prize {gold(prep.first)} · 150 Farm Rank points{prep.target !== null ? ' · Target ' + prep.target : ''}</p>
      {(prep.missing || prep.lock) && <p className="text-xs text-warning">{prep.missing ?? prep.lock}</p>}
      {prep.steps.map(step => step.to
        ? <Link key={step.text} className={button + ' mr-1'} to={step.to} state={{ back: true }}>{step.text} ›</Link>
        : <p key={step.text} className="text-sm">{step.text}</p>)}
    </div>}
    {allowPlan && <div className="space-y-1">
      {pinned && <p className="text-xs font-semibold" data-event-protected>{plan.stock.length ? 'Protected · ' + plan.stock.map(lotText).join(' · ') : 'Pinned to What Next and the Work Calendar'}</p>}
      {!!prep?.stock.length && <label className="block text-xs">Exhibit lots
        <select className="mt-1 min-h-11 w-full rounded border border-hairline bg-panel px-2 text-sm"
          value={Math.min(choice, prep.stock.length - 1)} onChange={e => setChoice(Number(e.target.value))}>
          {prep.stock.map((set, index) => <option value={index} key={set.map(row => row.key).join(',')}>{set.map(lotText).join(' · ')}</option>)}
        </select></label>}
      <div className="flex flex-wrap gap-1.5">
        {!pinned && <Button size="md" variant="secondary" disabled={busy} data-action="pin-festival"
          onClick={() => void act(s => setFestivalPlan(s, { id: event.rule!, day: event.day, stock: [] }, days))}>Pin plan</Button>}
        {!!suggest.length && <Button size="md" variant="secondary" disabled={busy} data-action="protect-festival-stock"
          onClick={() => void act(s => setFestivalPlan(s, { id: event.rule!, day: event.day, stock: suggest }, days))}>{pinned && plan.stock.length ? 'Replace reserved lots' : 'Protect these lots'}</Button>}
        {pinned && <Button size="md" variant="secondary" disabled={busy} data-action="release-festival-stock"
          onClick={() => void act(s => setFestivalPlan(s, null, days))}>Release plan</Button>}
      </div>
      {(suggest.length > 0 || pinned) && <p className="text-xs text-ink-soft">Protected stock stays here until entered, released, or the date passes.</p>}
      {plan && !pinned && <p className="text-xs text-ink-soft">Pinning this event releases the previous plan’s stock.</p>}
    </div>}
    {receipt && <p className="text-sm">Score {receipt.score ?? '—'} · {receipt.place ? labels[receipt.place - 1] : 'No placement'} · {gold(receipt.gold)}</p>}
    {note && <p role="status" className="text-sm text-danger">{note}</p>}
  </section>
}

function Personal({ day, save, days, pack, nameOf }: { day: number; save: FarmSave; days: SpecialDays; pack: StoryPack; nameOf: (id: string) => string }) {
  const location = useLocation()
  const date = calendarDay(save, pack, days, day)
  const today = date.when === 'today'
  const faces = date.faces.filter(face => face.night || face.occasions.length || face.reasons.some(reason => reason !== 'ready')).sort((a,b) => byRelationship(save)(a.id,b.id))
  const household = today ? householdReady(save) : date.celebrations
  if (!faces.length && !household.length) return null
  return <section className={section} aria-label="With an Uma">
    <h3 className="text-micro">With an Uma · {shortDate(day, save.calendar)}</h3>
    {household.map(id => <div key={id} className="text-sm">{today
      ? <Link className={button} to={withParam(location, 'household', id)} state={{ back: true }}>{householdTitle(id)} ›</Link> : householdTitle(id)}</div>)}
    {faces.map(face => <div key={face.id} className="grid gap-1 border-b border-hairline py-1.5" data-agenda-uma={face.id}>
      <strong className="text-sm">{nameOf(face.id)}</strong>
      <div className="flex flex-wrap gap-1.5">
        {face.reasons.includes('birthday') && <span className="text-xs">Birthday{today && save.eventJournal?.birthdays?.[face.id] === date.date.year ? ' · Celebrated' : ''}
          {today && save.today.eventFunding ? ' · Personal ' + eventActionsLeft(save, days, `birthday:${face.id}`) + '/1' : ''}</span>}
        {today && face.reasons.includes('birthday') && !save.today.gifts.includes(face.id) && <Link className={button} to={'/hearts?uma=' + face.id} state={{ back: true }}>Gift ›</Link>}
        {face.reasons.includes('anniversary') && <span className="text-xs">Anniversary</span>}
        {face.reasons.includes('wedding') && (today
          ? <Link className={button} to={withParam(location, 'event', face.id)} state={{ back: true }}>Wedding ›</Link> : <span className="text-xs">Wedding</span>)}
        {face.occasions.map(scene => {
          const fund = occasionFund(scene, face.id, days)
          const covered = (!save.today.eventFunding || fund) && eventActionsLeft(save, days, fund) >= 1
          return today && canSpendForEvent(save, actionCost('event'), days, fund)
            ? <Link key={scene.id} className={button} to={eventRoute(location, { occasion: face.id, occasionId: scene.id })}
              state={{ back: true }} data-agenda-occasion={scene.id}>{scene.name} · {covered ? 'Bonus' : '1 action'} ›</Link>
            : <span key={scene.id} className="text-xs text-ink-soft">{scene.name}{today ? ' · No action left' : ''}</span>
        })}
        {face.night && <span className="text-xs">{[face.night.birthday && 'Birthday night', face.night.anniversary && (face.reasons.includes('anniversary') ? 'Anniversary night' : 'Anniversary visit due')].filter(Boolean).join(' · ')}</span>}
        {today && face.night && nightVisits(save).length < NIGHT_VISITS && <Link className={button} to={withParam(location, 'visits', face.id)}
          state={{ back: true }}>Night visit ›</Link>}
      </div>
    </div>)}
  </section>
}

function Results({ save, days, nameOf }: { save: FarmSave; days: SpecialDays; nameOf: (id: string) => string }) {
  const now = dateOf(save.calendar.day, save.calendar).year
  const [year, setYear] = useState(now)
  const receipts = (save.eventJournal?.results ?? []).filter(row => dateOf(row.day, save.calendar).year === year)
  const recorded = save.farm.festivals.filter(row => dateOf(row.day, save.calendar).year === year &&
    !receipts.some(receipt => receipt.id === row.id && receipt.day === row.day))
  const visits = (save.eventJournal?.visits ?? []).filter(row => dateOf(row.day, save.calendar).year === year)
  return <section className={section} data-event-results={year}>
    <div className="flex items-center justify-between gap-1">
      <Button size="md" variant="secondary" disabled={year <= 1} onClick={() => setYear(year - 1)} aria-label="Previous year">‹</Button>
      <strong>Year {year} · {gold(receipts.reduce((n, row) => n + row.gold, 0))} in recorded prizes</strong>
      <Button size="md" variant="secondary" disabled={year >= now} onClick={() => setYear(year + 1)} aria-label="Next year">›</Button>
    </div>
    {receipts.map(row => <article className="border-b border-hairline py-2 text-sm" key={row.id + row.day} data-event-receipt={row.id}>
      <h3 className="font-bold">{festivalNameOf(days.festivals, row.id)} · {shortDate(row.day, save.calendar)}</h3>
      <p>{row.place ? labels[row.place - 1] : 'No placement'} · {row.score ?? '—'} vs {row.rivals.join(' / ')} · {gold(row.gold)} · {row.points} Farm Rank points</p>
      {row.stock.length > 0 && <p className="text-xs text-ink-soft">Entered {row.stock.map(lotText).join(' · ')} · shipping value {gold(row.cost)}</p>}
      {row.staff.length > 0 && <p className="text-xs">Crew: {row.staff.map(nameOf).join(', ')}{row.credit.length > 0 ? ' · Legend credit: ' + row.credit.map(nameOf).join(', ') : ''}</p>}
      {!(save.eventJournal?.results ?? []).some(prior => prior.id === row.id && prior.day < row.day)
        && !save.farm.festivals.some(prior => prior.id === row.id && prior.day < row.day) && <p className="text-xs text-accent">First entry ribbon</p>}
      {save.diary.records['festival:' + row.id] === row.score && <p className="text-xs text-accent">Personal best</p>}
      {row.staff.map(id => <Link key={id} className={button + ' mr-1'} to={'/library?uma=' + id} state={{ back: true }}>{nameOf(id)}’s Library ›</Link>)}
    </article>)}
    {recorded.map(row => <p key={row.id + row.day} className="text-sm">{festivalNameOf(days.festivals, row.id)} · {shortDate(row.day, save.calendar)} · {labels[row.place - 1]} · Score {row.score}</p>)}
    {visits.map(row => <Link className={button + ' mr-1'} key={row.id + row.day} to={agendaLink(row.day, '/diary')} state={{ back: true }}>
      Visited · {row.id === 'new-year' ? 'New Year’s' : festivalNameOf(days.festivals, row.id)} · {shortDate(row.day, save.calendar)} ›</Link>)}
    {!receipts.length && !recorded.length && !visits.length && <p className="text-sm text-ink-soft">No festival records this year.</p>}
  </section>
}

export function FestivalNotice({ save, story, days, within, dismissible = false }: {
  save: FarmSave; story: StoryPack | null; days: SpecialDays; within?: number; dismissible?: boolean
}) {
  const event = upcomingEvent(save, days, story)
  const plan = save.eventJournal?.plan
  const target = plan ? communityEvent(save, days, plan.day, story) ?? event : event
  const [dismissed, setDismissed] = useState<string | null>(null)
  if (!target || (!plan && within !== undefined && target.day - save.calendar.day > within) || dismissed === target.key + ':' + save.calendar.day) return null
  return <div className="flex items-center gap-1">
    <Link className={button + ' min-w-0'} to={agendaLink(target.day)} state={{ back: true }} data-festival-notice={target.id}>
      {shortDate(target.day, save.calendar)} · {target.name}{plan ? ' · ' + (plan.stock.length ? 'Protected entry' : 'Working toward entry') : ''} ›
    </Link>
    {dismissible && !plan && <button type="button" className="min-h-11 min-w-11" aria-label="Hide this reminder today"
      onClick={() => setDismissed(target.key + ':' + save.calendar.day)}>×</button>}
  </div>
}
