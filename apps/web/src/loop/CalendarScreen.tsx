// The calendar screen (`?sheet=calendar`, from the bar's date): the year at a glance, laid out sideways over the whole
// screen. On top, the date and year, the four seasons (this one marked, the others a tap away), the day's actions with a
// special day's event actions, and Close. Below, the season's 12 days as a grid of 6 × 2: each day its number, its marks
// (a festival's trophy, New Year's spark, a holiday's ribbon, a minor day's dot), its one label (the festival, New
// Year's, the story's day) and the faces of the Umas with an event that day (three, or two and "+n"); today in the accent
// colour, days gone by faded. Beside it, the chosen day's panel: its festival and what happens at it, New Year's, the
// story's holidays and minor days with their lines, the special day's event actions, and everyone with an event that day
// with why (the occasion, her birthday, your anniversary, her event Ready or likely Ready). A face that's only a guess
// (likely Ready on a day ahead) is drawn faint in its cell, so the date's own stand out. Today's rows play: the occasion
// scene (`?occasion=`, one action, the event actions first) and her Ready event (`?event=`). Under them, **In town**: who's
// there that day, a row a place with its first faces and "+n", from every Uma's fixed schedule (`townDay`). Then the next
// festival and the day of the year. The days are read live (`seasonDays`); looking is free. Loaded on demand.
import {
  actionsLeft, canPlanWedding, celebrationDate, celebrationTitle, dateDayOf, dateOf, dayActions, DAYS_PER_YEAR, eventActionsLeft, EXPEDITION_REGIONS, farmDay, festivalsOf,
  householdReady, isFarmContest, nextFestival, NO_BIRTHDAYS, noPack, NIGHT_VISITS, nightVisits, planWedding, playedToday, SEASON_NAMES, SEASONS, seasonDays, weekdayOf, weekdayShort,
  type CalendarDay, type DayFace, type FarmSave, type Season, type SpecialDays, type StoryPack,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, ChevronLeftIcon, ChevronRightIcon, CloseIcon, HeartIcon, RibbonIcon, SparkIcon, StopwatchIcon, TrophyIcon } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { GuideButton } from '../guide/Guide'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useSpecialDays, useStory } from '../story/story'
import { cellFaces, cellLabel, cellMarks, dayHeading, eventActionWords, faceWords, faintFace } from './calendar-view'
import { townRows, type TownRow } from './schedule-words'
import { SEASON_COLOR, shortDate, whenWords } from './words'
import { changeHomestead } from './homestead-actions'

export default function CalendarScreen({ onClose }: { onClose: () => void }) {
  const save = useLoopSave()
  const story = useStory()
  const special = useSpecialDays()
  const master = useMaster()
  const location = useLocation()
  const request = new URLSearchParams(location.search).get('weddingPlan')
  const planner = request && canPlanWedding(save?.love[request]) ? request : null
  const today = save?.calendar.day ?? 1
  const [picked, setPicked] = useState(() => planner ? save?.love[planner]?.weddingDay ?? today + 1 : today)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const suppressTapUntil = useRef(0)
  const start = save?.calendar.start ?? 1
  const selected = Math.max(start, picked)
  const { year, season } = dateOf(selected, save?.calendar)
  const pack = useMemo(() => story ?? noPack(), [story])
  const days = useMemo((): SpecialDays => special ?? { festivals: festivalsOf(story), birthdays: NO_BIRTHDAYS }, [special, story])
  const list = useMemo(() => (save ? seasonDays(save, pack, days, season, year) : []), [save, pack, days, season, year])
  if (!save) return null
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const chosen = list.find(d => d.day === selected)!
  const pick = (s: Season, y = year) => {
    const now = dateOf(today, save.calendar)
    setPicked(s === now.season && y === now.year ? today : farmDay({ year: y, season: s, day: 1 }, save.calendar))
  }
  const shiftSeason = (offset: -1 | 1) => {
    const index = SEASONS.indexOf(season) + offset
    const nextYear = year + Math.floor(index / SEASONS.length)
    if (nextYear < 1) return
    const nextSeason = SEASONS[(index + SEASONS.length) % SEASONS.length]!
    pick(nextSeason, nextYear)
  }
  return createPortal(
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-50 flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="Calendar" data-calendar>
      <Header save={save} days={days} season={season} onSeason={pick} onClose={onClose} />
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <section className="flex min-w-0 flex-[3] flex-col rounded-md border border-hairline bg-sunken/40 px-1.5 pb-1.5" aria-label="Season overview"
          style={{ borderTopColor: SEASON_COLOR[season], borderTopWidth: 3 }}>
          <div className="flex shrink-0 items-center justify-between gap-1">
            <button type="button" className="min-h-11 min-w-11 rounded-sm text-ink-soft" onClick={() => pick(season, year - 1)} disabled={year === 1} aria-label="Previous year">‹</button>
            <p className="font-display truncate text-[15px] font-bold" data-calendar-year>{SEASON_NAMES[season]} · Year {year}</p>
            <button type="button" className="min-h-11 min-w-11 rounded-sm text-ink-soft" onClick={() => pick(season, year + 1)} aria-label="Next year">›</button>
            <button type="button" className="ml-auto min-h-11 rounded-sm px-2 text-[13px] font-bold text-accent" onClick={() => setPicked(today)} data-action="calendar-today">Today</button>
            <GuideButton topic="calendar" label="How the calendar works" />
          </div>
          <ol className="grid min-h-0 min-w-0 flex-1 touch-pan-y auto-rows-[minmax(56px,1fr)] grid-cols-6 gap-1 overflow-y-auto overscroll-contain select-none" aria-label={`${SEASON_NAMES[season]}’s days`} data-calendar-grid={season}
            onTouchStart={(event) => {
              const finger = event.touches.length === 1 ? event.touches[0] : undefined
              swipe.current = finger ? { x: finger.clientX, y: finger.clientY } : null
            }}
            onTouchCancel={() => { swipe.current = null }}
            onTouchEnd={(event) => {
              const from = swipe.current, to = event.changedTouches[0]
              swipe.current = null
              if (!from || !to) return
              const dx = to.clientX - from.x, dy = to.clientY - from.y
              if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
              suppressTapUntil.current = performance.now() + 250
              shiftSeason(dx < 0 ? 1 : -1)
            }}
            onClickCapture={(event) => {
              if (event.detail > 0 && performance.now() < suppressTapUntil.current) event.stopPropagation()
            }}>
            {list.map((d) => <Cell key={d.day} day={d} chosen={d.day === chosen.day} nameOf={nameOf} onPick={() => setPicked(d.day)} />)}
          </ol>
        </section>
        <DayPanel save={save} pack={pack} days={days} day={chosen} nameOf={nameOf} planner={planner}
          previous={() => setPicked(Math.max(start, selected - 1))} nextDay={() => setPicked(selected + 1)} />
      </div>
    </div>,
    document.body,
  )
}

/** The date and year, the seasons, the day's actions and Close. */
function Header({ save, days, season, onSeason, onClose }: { save: FarmSave; days: SpecialDays; season: Season; onSeason: (s: Season) => void; onClose: () => void }) {
  const today = save.calendar.day
  const date = dateOf(today, save.calendar)
  const events = eventActionsLeft(save, days)
  return (
    <header className="flex min-h-12 shrink-0 items-center gap-1 pr-1 pl-3">
      <h2 className="font-display shrink-0 text-[17px] font-bold whitespace-nowrap" data-calendar-title>{shortDate(today, save.calendar)} · Year {date.year}</h2>
      <ol className="flex min-w-0 flex-1 justify-center gap-0.5" aria-label="Seasons">
        {SEASONS.map((s) => (
          <li key={s}>
            <button type="button" onClick={() => onSeason(s)} aria-pressed={s === season} aria-label={`${SEASON_NAMES[s]}${s === date.season ? ', this season' : ''}`} data-season={s}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold ${s === season ? 'bg-sunken text-ink ring-1 ring-hairline-strong' : 'text-ink-faint'}`}>
              <span aria-hidden className={`size-2.5 rounded-full ${s === date.season ? 'ring-2 ring-ink/40' : ''}`} style={{ background: SEASON_COLOR[s] }} />
              {SEASON_NAMES[s]}
            </button>
          </li>
        ))}
      </ol>
      <span role="img" className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-hairline bg-panel px-2 text-[13px]"
        aria-label={`Actions left: ${actionsLeft(save)} of ${dayActions(save)}${events > 0 ? `, and ${events} for events` : ''}`} data-calendar-actions>
        <StopwatchIcon size={14} /><span className="font-display font-semibold tabular-nums">{actionsLeft(save)}</span>
        {events > 0 && <span className="flex items-center gap-0.5 font-display font-semibold text-[#c2385e]"><HeartIcon size={14} />+{events}</span>}
      </span>
      <button type="button" onClick={onClose} aria-label="Close the calendar" className="grid min-h-11 min-w-11 shrink-0 place-items-center text-ink-soft" data-action="close">
        <CloseIcon size={20} />
      </button>
    </header>
  )
}

/** A day of the grid: its number and marks, its label, and its faces. */
function Cell({ day, chosen, nameOf, onPick }: { day: CalendarDay; chosen: boolean; nameOf: (id: string) => string; onPick: () => void }) {
  const marks = cellMarks(day)
  const label = cellLabel(day)
  const { shown, more } = cellFaces(day.faces)
  const today = day.when === 'today'
  const tone = today ? 'bg-accent text-accent-ink' : day.when === 'past' ? 'bg-sunken/50 text-ink-faint' : 'bg-panel text-ink'
  const ring = day.festival ? { ['--tw-ring-color' as string]: SEASON_COLOR[day.date.season] } : undefined
  const words = [
    `${SEASON_NAMES[day.date.season]} ${day.date.day}`, today ? 'today' : null, label,
    day.faces.length > 0 ? `${day.faces.length} with an event: ${day.faces.map((f) => nameOf(f.id)).join(', ')}` : null,
  ].filter(Boolean).join(', ')
  return (
    <li className="min-h-0 min-w-0">
      <button type="button" onClick={onPick} aria-label={words} aria-pressed={chosen} data-day={day.day} data-today={today || undefined} data-festival={day.festival?.id}
        data-faces={day.faces.length} data-more={more || undefined} data-weddings={day.weddings.length || undefined}
        className={`flex h-full w-full min-w-0 flex-col items-stretch gap-0.5 overflow-hidden rounded-sm border p-1 text-left shadow-1 ${tone} ${chosen ? 'border-ink/60 border-2' : 'border-hairline'} ${day.festival ? 'ring-2 ring-inset' : ''}`}
        style={ring}>
        <span className="flex items-center gap-0.5">
          <span className="font-display text-[15px] leading-none font-bold">{day.date.day}</span>
          <span className="hidden text-[10px] leading-none opacity-70 md:inline">{weekdayShort(weekdayOf(day.day))}</span>
          <span className="min-w-0 flex-1" />
          {marks.newYear && <SparkIcon size={14} aria-hidden />}
          {marks.festival && <TrophyIcon size={14} aria-hidden />}
          {marks.holiday && <RibbonIcon size={14} aria-hidden />}
          {day.weddings.length > 0 && <HeartIcon size={14} aria-hidden />}
          {day.celebrations.length > 0 && !marks.newYear && <SparkIcon size={14} aria-hidden />}
          {marks.minor && <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />}
        </span>
        {label && <span className="truncate text-[10px] leading-tight font-semibold" data-cell-label>{label}</span>}
        {marks.eventActions > 0 && day.when !== 'past' && <span className={`text-[10px] leading-tight font-semibold ${today ? '' : 'text-[#c2385e]'}`} data-cell-events>♥+{marks.eventActions}</span>}
        <span className="mt-auto flex items-center -space-x-2" data-cell-faces>
          {shown.map((f) => (
            <span key={f.id} className={`rounded-avatar block size-[22px] shrink-0 ring-1 ring-panel ${faintFace(f, day) ? 'opacity-45' : ''}`} data-cell-face={f.id} data-faint={faintFace(f, day) || undefined}>
              <Avatar id={f.id} size={22} label={nameOf(f.id)} />
            </span>
          ))}
          {more > 0 && <span className="rounded-avatar grid size-[22px] shrink-0 place-items-center bg-sunken text-[11px] font-bold text-ink ring-1 ring-panel" data-more>+{more}</span>}
        </span>
      </button>
    </li>
  )
}

/** The chosen day: what it holds, its event actions, everyone with an event on it (today's to play), and who's in town. */
function DayPanel({ save, pack, days, day, nameOf, planner, previous, nextDay }: {
  save: FarmSave; pack: StoryPack; days: SpecialDays; day: CalendarDay; nameOf: (id: string) => string; planner: string | null
  previous(): void; nextDay(): void
}) {
  const today = save.calendar.day
  const next = nextFestival(today, days.festivals, save.calendar)
  const events = eventActionWords(day, eventActionsLeft(save, days))
  const played = day.when === 'today' ? playedToday(save).filter((id) => save.roster[id]) : []
  const town = useMemo(() => townRows(save, pack, day.day), [save, pack, day.day])
  const greater = celebrationDate(save, 'greater-festival')
  const ready = householdReady(save)
  const shifts = day.when !== 'past' && (day.crew.farm.length > 0 || day.crew.off.length > 0)
  const empty = !planner && !shifts && !day.festival && !day.newYear && !day.storyDays.length
    && !day.faces.length && !played.length && !town.length && !day.celebrations.length && !day.trips.length
  return (
    <aside className="flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden rounded-md border border-hairline bg-panel" aria-label={dayHeading(day, today)} data-day-panel={day.day}>
      <div className="flex shrink-0 items-center justify-between border-b border-hairline">
        <button type="button" onClick={previous} disabled={day.day === (save.calendar.start ?? 1)} aria-label="Previous day"
          className="grid size-11 shrink-0 place-items-center text-ink-soft disabled:opacity-40"><ChevronLeftIcon size={20} /></button>
        <h3 className="min-w-0 text-center font-display text-[16px] leading-tight font-bold" data-day-heading>{dayHeading(day, today)}
          {Boolean(pack.town?.professions?.length) && <span className="ml-2 text-[13px] text-ink-soft">{weekdayShort(weekdayOf(day.day))}</span>}
        </h3>
        <button type="button" onClick={nextDay} aria-label="Next day"
          className="grid size-11 shrink-0 place-items-center text-ink-soft"><ChevronRightIcon size={20} /></button>
      </div>
      <div key={day.day} className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-3" data-day-scroll>
      {planner && <WeddingPlanner save={save} day={day.day} id={planner} name={nameOf(planner)} />}
      {events && <p className="flex items-center gap-1 pt-0.5 text-[13px] font-semibold text-[#c2385e]" data-day-events><HeartIcon size={14} />{events}</p>}
      <ul className="space-y-1.5 pt-2 text-[14px]">
        {day.celebrations.map(id => <li key={id}>
          {ready.includes(id) ? <Link className="flex min-h-11 items-center gap-2 font-semibold text-accent" to={`/?household=${id}`} state={{ back: true }}>
            <SparkIcon size={16} />{celebrationTitle(id)} ›
          </Link> : <span className="flex items-center gap-2"><SparkIcon size={16} />{celebrationTitle(id)}</span>}
        </li>)}
        {day.newYear && <li className="flex items-center gap-2" data-entry="new-year"><SparkIcon size={16} /> New Year’s</li>}
        {day.festival && (
          <li data-entry="festival" data-festival-row={day.festival.id}>
            <span className="flex items-center gap-2"><TrophyIcon size={16} /> {day.festival.name}</span>
            {day.festival.happens && <span className="block pl-6 text-[13px] text-ink-soft" data-festival-happens>{day.festival.happens}</span>}
            {day.when === 'today' && day.festival.rule && isFarmContest(day.festival.rule) && <Link className="flex min-h-11 items-center pl-6 font-semibold text-accent"
              to={`/?sheet=festival&contest=${day.festival.rule}`}>Contest ›</Link>}
          </li>
        )}
        {day.storyDays.map((d) => (
          <li key={d.id} data-entry={d.kind} data-story-day={d.id}>
            <span className="flex items-center gap-2">{d.kind === 'holiday' ? <RibbonIcon size={16} /> : <span aria-hidden className="mx-1.5 size-1.5 rounded-full bg-ink-soft" />} {d.name}</span>
            {d.line && <span className="block pl-6 text-[13px] text-ink-soft">{d.line}</span>}
          </li>
        ))}
        {day.trips.map(trip => <li key={`${trip.region}:${trip.direction}:${trip.party[0]}`} data-entry="expedition">
          <span className="font-semibold">{trip.direction === 'returning' ? 'Returns' : 'Departs'} · {EXPEDITION_REGIONS[trip.region].name}</span>
          <span className="block text-[12px] text-ink-soft">{trip.party.map(nameOf).join(', ')}</span>
        </li>)}
      </ul>
      {day.faces.length > 0 && (
        <section className="pt-3" aria-label="With an event">
          <h4 className="text-micro pb-1">{day.when === 'ahead' ? 'With an event, as things stand' : 'With an event'}</h4>
          <ul className="divide-y divide-hairline">
            {day.faces.map((f) => <FaceRow key={f.id} face={f} day={day} save={save} days={days} name={nameOf(f.id)} />)}
          </ul>
        </section>
      )}
      {played.length > 0 && <p className="pt-2 text-[13px] text-ink-soft" data-played>Played today: {played.map(nameOf).join(', ')}</p>}
      {shifts && <section className="space-y-1 pt-3" aria-label="Farm and days off">
        {day.crew.farm.length > 0 && <CrewRow label="Farm shift" ids={day.crew.farm} nameOf={nameOf} />}
        {day.crew.off.length > 0 && <CrewRow label="Day off" ids={day.crew.off} nameOf={nameOf} />}
      </section>}
      {town.length > 0 && <InTown rows={town} nameOf={nameOf} />}
      {empty && <p className="pt-2 text-[14px] text-ink-soft" data-day-empty>{day.when === 'past' ? 'A quiet day.' : 'Nothing marked yet.'}</p>}
      <div className="mt-auto space-y-0.5 pt-3 text-[12px] text-ink-faint">
        {greater && <p data-greater-date>Greater Festival · {shortDate(greater, save.calendar)} · Year {dateOf(greater, save.calendar).year}</p>}
        <p data-next-festival>Next festival: {next.festival.name} · {shortDate(next.day, save.calendar)} · {whenWords(next.inDays)}</p>
        <p>Day {((dateDayOf(today, save.calendar) - 1) % DAYS_PER_YEAR) + 1} of {DAYS_PER_YEAR}. Days move only when you end them.</p>
      </div>
      </div>
    </aside>
  )
}

function WeddingPlanner({ save, day, id, name }: { save: FarmSave; day: number; id: string; name: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const planned = save.love[id]?.weddingDay
  const setDay = async (next: number | null) => {
    setBusy(true)
    setError(null)
    try { await changeHomestead(current => planWedding(current, id, next)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Try again.') }
    finally { setBusy(false) }
  }
  return <section className="my-2 space-y-1.5 rounded-md border border-hairline bg-sunken/40 p-2" aria-label="Wedding planner" data-wedding-planner>
    <p className="font-semibold">{name} · Wedding plan</p>
    {planned && <p className="text-[13px] text-ink-soft" data-planned-date>{shortDate(planned, save.calendar)} · Year {dateOf(planned, save.calendar).year}</p>}
    <p className="text-[12px] text-ink-soft">{save.love[id]?.stage === 'wedding' ? 'The ceremony opens on the planned day.' : 'Finish the proposal to hold the ceremony.'}</p>
    <div className="flex flex-wrap gap-1">
      <Button disabled={busy || day <= save.calendar.day || day === planned} onClick={() => void setDay(day)} data-action="save-wedding-date">
        {day === planned ? 'Date saved' : 'Save this date'}
      </Button>
      {planned && <Button variant="secondary" disabled={busy} onClick={() => void setDay(null)}>Clear</Button>}
    </div>
    {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
  </section>
}

function CrewRow({ label, ids, nameOf }: { label: string; ids: string[]; nameOf: (id: string) => string }) {
  return <details className="rounded-sm border border-hairline px-2 text-[13px]">
    <summary className="min-h-11 cursor-pointer py-2.5 font-semibold">{label} · {ids.length}</summary>
    <p className="pb-2 text-ink-soft">{ids.map(nameOf).join(', ')}</p>
  </details>
}

/** How many faces a place's row shows before "+n". */
const TOWN_FACES = 5

/** Who's in town that day, and where: a row a place, its name, its first faces (met first) and how many more. Every Uma
 * keeps a fixed schedule, so a day ahead shows who'll be there. */
function InTown({ rows, nameOf }: { rows: readonly TownRow[]; nameOf: (id: string) => string }) {
  const count = rows.reduce((n, r) => n + r.ids.length, 0)
  return (
    <section className="pt-3" aria-label="In town" data-in-town={count}>
      <h4 className="text-micro pb-1">In town · {count}</h4>
      <ul className="space-y-1">
        {rows.map((r) => {
          const { shown, more } = cellFaces(r.ids, TOWN_FACES)
          return (
            <li key={r.at} className="flex min-h-7 items-center gap-2" aria-label={`${r.name}: ${r.ids.map(nameOf).join(', ')}`} data-town-row={r.at} data-count={r.ids.length}>
              <span className="w-[42%] shrink-0 truncate text-[12px] font-semibold">{r.name}</span>
              <span className="flex min-w-0 flex-1 items-center -space-x-1.5">
                {shown.map((id) => (
                  <span key={id} className="rounded-avatar block size-[22px] shrink-0 ring-1 ring-panel" data-town-face={id}>
                    <Avatar id={id} size={22} label={nameOf(id)} />
                  </span>
                ))}
                {more > 0 && <span className="rounded-avatar grid size-[22px] shrink-0 place-items-center bg-sunken text-[10px] font-bold text-ink ring-1 ring-panel">+{more}</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** One Uma with an event that day: her face and name, why, and today what to play. */
function FaceRow({ face, day, save, days, name }: { face: DayFace; day: CalendarDay; save: FarmSave; days: SpecialDays; name: string }) {
  const location = useLocation()
  const why = faceWords(face, day)
  // Today's next occasion with her: the day's, then a festival's night.
  const next = face.occasions[0] ?? null
  const now = day.when === 'today'
  const can = actionsLeft(save) + eventActionsLeft(save, days) > 0
  const canVisit = now && face.night && nightVisits(save).length < NIGHT_VISITS
  return (
    <li className="flex min-h-12 items-center gap-2 py-1" data-face={face.id} data-reasons={face.reasons.join(' ')}>
      <span className="block size-9 shrink-0"><Avatar id={face.id} size={36} label={name} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{name}</span>
        <span className="block text-[12px] text-ink-soft">{save.love[face.id]?.wed === day.day ? why.replace('Wedding planned', 'Wedding held') : why}</span>
        {face.night && <span className="block text-[12px] font-semibold text-accent">
          {[face.night.birthday && 'Birthday night', face.night.anniversary && 'Anniversary night'].filter(Boolean).join(' · ')}
        </span>}
      </span>
      {now && face.reasons.includes('occasion') && (can
        ? <Link to={withParam(location, 'occasion', face.id)} state={{ back: true }} aria-label={`Play ${next?.name ?? 'the occasion'} with ${name} · 1 action`} data-action="play-occasion" data-occasion={next?.id}
          className="grid min-h-11 shrink-0 place-items-center rounded-sm bg-[#c2385e] px-2.5 text-[13px] font-bold text-white">Play · 1</Link>
        : <span className="shrink-0 text-[12px] text-ink-faint" data-no-actions>No actions</span>)}
      {now && face.reasons.includes('ready') && (
        <Link to={withParam(location, 'event', face.id)} state={{ back: true }} aria-label={`Play ${name}’s event · 1 action`} data-action="play-event"
          className="grid min-h-11 shrink-0 place-items-center rounded-sm border-2 border-[#c2385e] px-2 text-[13px] font-bold text-[#c2385e]">Event ›</Link>
      )}
      {canVisit && <Link to={`/?visits=${face.id}`} state={{ back: true }} aria-label={`Night visits with ${name}`}
        className="grid min-h-11 shrink-0 place-items-center rounded-sm border border-hairline-strong px-2 text-[13px] font-bold text-accent">Night ›</Link>}
    </li>
  )
}
