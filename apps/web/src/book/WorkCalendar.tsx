import {
  dateOf, DAYS_PER_SEASON, TOOL_NAMES, toolTierName, SEASON_NAMES, SEASONS, TASK_NAMES, turnOnDate, weekdayOf, weekdayShort,
  workDayRecord, type FarmSave, type Season, type StoryPack, type TalentOf, type WorkDayRecord, type WorkTotals,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'
import { CalendarFaces } from '../loop/CalendarFaces'
import { CALENDAR_GRID, CALENDAR_PAGE_SIZE, cellFaces } from '../loop/calendar-view'
import { byRelationship } from '../loop/relationship-order'
import { useTalents } from '../loop/talents'
import { plural, SEASON_COLOR, shortDate } from '../loop/words'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { nightWords } from './board-words'
import { forecastCrewOn, workRows } from './work-plan'
import { JobList } from './JobList'

const LAST_PAGE = Math.ceil(DAYS_PER_SEASON / CALENDAR_PAGE_SIZE) - 1
const coveredTone = 'bg-emerald-100 text-emerald-900'
const missingTone = 'bg-amber-100 text-amber-950'
const neutral = 'opacity-80'
const total = (counts: WorkTotals | undefined): number => Object.values(counts ?? {}).reduce((sum, n) => sum + n, 0)

function workOn(save: FarmSave, day: number, pack: StoryPack | null, talents: TalentOf) {
  const forecast = forecastCrewOn(save, day, pack, talents)
  return { ...forecast, record: workDayRecord(forecast.snapshot, forecast.lines, forecast.needs) }
}

export default function WorkCalendar({ save }: { save: FarmSave }) {
  const location = useLocation()
  const leave = useLeave()
  const master = useMaster()
  const story = useStory()
  const { of: talents } = useTalents()
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const today = save.calendar.day
  const current = dateOf(today, save.calendar)
  const [selected, setSelected] = useState(current)
  const [page, setPage] = useState(Math.floor((current.day - 1) / CALENDAR_PAGE_SIZE))
  const touch = useRef<{ x: number; y: number } | null>(null)
  const { year, season } = selected
  const first = page * CALENDAR_PAGE_SIZE
  const days = useMemo(() => {
    const history = new Map(save.farm.workHistory?.map(row => [row.day, row]))
    const compare = byRelationship(save)
    return Array.from({ length: Math.min(CALENDAR_PAGE_SIZE, DAYS_PER_SEASON - first) }, (_, i) => {
      const day = turnOnDate({ year, season, day: first + i + 1 }, save.calendar)
      const live = day !== null && day >= today ? workOn(save, day, story, talents) : null
      live?.lines.sort((a, b) => compare(a.id, b.id))
      return { day, live, record: live?.record ?? (day !== null ? history.get(day) : undefined) }
    })
  }, [first, year, season, save, today, story, talents])
  const choose = (s: Season, y = year, n = s === current.season && y === current.year ? current.day : 1) => {
    setSelected({ season: s, year: y, day: n })
    setPage(Math.floor((n - 1) / CALENDAR_PAGE_SIZE))
  }
  const changePage = (step: -1 | 1) => setPage(value => Math.max(0, Math.min(LAST_PAGE, value + step)))
  const chosenNumber = selected.day > first && selected.day <= first + days.length ? selected.day : first + 1
  const chosen = days[chosenNumber - first - 1]!
  const rows = chosen.live ? workRows(chosen.live.snapshot, chosen.live, chosen.live.needs) : []
  const budget = chosen.live?.lines.reduce((sum, line) => sum + line.actions, 0) ?? 0
  const spent = chosen.live?.lines.reduce((sum, line) => sum + line.spent, 0) ?? 0
  const isToday = chosen.day === today
  const actual = isToday && !!save.today.crew
  const recorded = chosen.day !== null && chosen.day < today
  const lines = chosen.live?.lines ?? []
  return createPortal(<div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-50 flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="Work calendar" data-work-calendar>
    <header className="flex shrink-0 items-center gap-1 px-2">
      <h1 className="font-display mr-auto whitespace-nowrap text-[18px] font-bold">Work calendar</h1>
      {SEASONS.map(s => <button type="button" key={s} aria-pressed={s === season} onClick={() => choose(s)}
        className={"min-h-11 rounded-md px-2 text-[13px] font-semibold " + (s === season ? 'bg-accent text-accent-ink' : 'text-ink-soft')}>{SEASON_NAMES[s]}</button>)}
      <button type="button" aria-label="Close work calendar" onClick={() => leave(withParam(location, 'workCalendar', null))} className="grid size-11 place-items-center"><CloseIcon size={20} /></button>
    </header>
    <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
      <section className="flex min-w-0 flex-[3] flex-col rounded-md border border-hairline bg-sunken/40 px-1.5 pb-1.5" aria-label="Work by day" style={{ borderTopColor: SEASON_COLOR[season], borderTopWidth: 3 }}>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="min-h-11 min-w-11 disabled:opacity-40" onClick={() => choose(season, year - 1)} disabled={year <= 1} aria-label="Previous year">‹</button>
          <strong className="font-display text-[15px]">Year {year}</strong>
          <button type="button" className="min-h-11 min-w-11" onClick={() => choose(season, year + 1)} aria-label="Next year">›</button>
          <button type="button" className="ml-auto min-h-11 px-2 text-[13px] font-bold text-accent" onClick={() => choose(current.season, current.year)}>Today</button>
        </div>
        <ol className={CALENDAR_GRID} data-work-calendar-grid
          onTouchStart={event => { const p = event.touches[0]; touch.current = p ? { x: p.clientX, y: p.clientY } : null }}
          onTouchCancel={() => { touch.current = null }}
          onTouchEnd={event => {
            const start = touch.current; touch.current = null
            const end = event.changedTouches[0]
            if (!start || !end) return
            const dx = end.clientX - start.x
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(end.clientY - start.y)) changePage(dx < 0 ? 1 : -1)
          }}>
          {days.map(({ day, record, live }, i) => {
            const n = first + i + 1
            const covered = record ? total(record.covered) : null
            const missing = record ? total(record.missing) : null
            const crew = live?.lines.filter(line => line.tasks > 0 || line.forge) ?? []
            const { shown, more } = cellFaces(crew)
            return <li key={n} className="min-h-0 min-w-0">
              <button type="button" aria-pressed={n === chosenNumber} onClick={() => choose(season, year, n)}
                aria-label={SEASON_NAMES[season] + ' ' + n + (record ? ', ' + record.allocated + ' allocated, ' + missing + ' missing' : ', no record')}
                data-work-day={n} data-allocated={record?.allocated} data-covered={covered ?? undefined} data-missing={missing ?? undefined}
                className={'flex min-h-11 h-full w-full flex-col gap-1 overflow-hidden rounded-sm border border-hairline p-1 text-left '
                  + (day === today ? 'bg-accent text-accent-ink' : 'bg-panel') + (n === chosenNumber ? ' ring-2 ring-inset ring-ink/65' : '')}>
                <span className="flex items-baseline gap-1"><strong className="font-display text-[16px] leading-none">{n}</strong>{day && <small className="text-[9px] opacity-75">{weekdayShort(weekdayOf(day))}</small>}</span>
                {record ? <span className="grid gap-0.5 text-[10px] leading-tight font-bold tabular-nums">
                  <span className={'flex justify-between gap-0.5 rounded px-0.5 ' + coveredTone}><span>Orders</span>{record.allocated}</span>
                  <span className={'flex justify-between gap-0.5 rounded px-0.5 ' + (missing ? missingTone : neutral)}><span>Open</span>{missing}</span>
                </span> : <span className="text-[11px] opacity-70">—</span>}
                <CalendarFaces shown={shown} more={more} nameOf={nameOf} />
              </button>
            </li>
          })}
        </ol>
        <div className="flex shrink-0 items-center justify-between text-[12px] text-ink-soft">
          <button type="button" onClick={() => changePage(-1)} disabled={!page} aria-label="Earlier work dates" className="grid size-11 place-items-center disabled:opacity-40"><ChevronLeftIcon size={16} /></button>
          <span data-work-calendar-range>Days {first + 1}–{Math.min(first + CALENDAR_PAGE_SIZE, DAYS_PER_SEASON)} of {DAYS_PER_SEASON}</span>
          <button type="button" onClick={() => changePage(1)} disabled={page === LAST_PAGE} aria-label="Later work dates" className="grid size-11 place-items-center disabled:opacity-40"><ChevronRightIcon size={16} /></button>
        </div>
      </section>
      <aside className="min-w-0 flex-[2] overflow-y-auto rounded-md border border-hairline bg-panel p-2 text-[13px]" aria-label="Selected day's work" data-work-day-detail>
        <h2 className="font-display text-[17px] font-bold">{chosen.day !== null ? shortDate(chosen.day, save.calendar) : SEASON_NAMES[season] + ' ' + chosenNumber}</h2>
        <p className="text-ink-soft">{recorded ? 'End-of-day record' : actual ? 'Morning shift complete' : isToday ? 'Today’s shift forecast' : chosen.day === null ? 'Date added later' : 'Forecast using current crops, stock and orders'}</p>
        {[...save.forge?.installed ?? [], ...save.forge?.tool ? [save.forge.tool] : []].filter(order => order.due === chosen.day).map(order =>
          <Link key={order.tool} className="flex min-h-11 items-center font-semibold" to={`/?sheet=forge&tool=${order.tool}`}>{toolTierName(order.tier)} {TOOL_NAMES[order.tool]} ready ›</Link>)}
        {chosen.record ? <WorkDetails record={chosen.record} /> : <p className="py-2">No shift recorded.</p>}
        {chosen.live && <>
          <p className="mb-2" data-calendar-action-budget>{plural(lines.length, 'worker')} · {spent}/{budget} actions {actual ? 'used' : 'forecast'} · {budget - spent} free</p>
          <JobList rows={rows} nameOf={nameOf} />
        </>}
        {chosen.live && !lines.length && <p className="my-2 text-ink-soft">No crew on the farm this day.</p>}
        {lines.length > 0 && <><h3 className="mt-2 font-semibold">Crew on the farm</h3><ul>
          {lines.map(line => <li key={line.id} className="flex flex-col border-b border-hairline py-1"><strong>{nameOf(line.id)}</strong>
            <span>{plural(line.tasks + (line.forge ?? 0), 'order')}{line.forge ? ' · Forge assistant' : ''} · {line.spent ? nightWords(line) : '0 of ' + plural(line.actions, 'action') + ' used'}</span>
          </li>)}
        </ul></>}
        {chosen.live && <Link to="/book?view=work" className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent">Edit work orders</Link>}
      </aside>
    </div>
  </div>, document.body)
}

function WorkDetails({ record }: { record: WorkDayRecord }) {
  const words = (rows: WorkTotals) => Object.entries(rows).map(([task, count]) => count + ' ' + TASK_NAMES[task as keyof typeof TASK_NAMES]).join(' · ')
  return <div className="my-2 space-y-1">
    <div className={'rounded px-1.5 py-1 ' + coveredTone}><strong>✓ {record.allocated} allocated</strong>{total(record.covered) > 0 && <p>{words(record.covered)} worked</p>}</div>
    <div className={'rounded px-1.5 py-1 ' + (total(record.missing) ? missingTone : 'bg-sunken text-ink-soft')}>
      <strong>{total(record.missing)} missing</strong>{total(record.missing) > 0 && <p>{words(record.missing)}</p>}
    </div>
  </div>
}
