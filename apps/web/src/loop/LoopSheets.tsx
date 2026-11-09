// The loop's global sheets (F18 decisions 6 and 8, F19 decisions 7 and 8): `?sheet=end`, End the day; `?sheet=calendar`,
// the calendar from the account bar's date; `?sheet=bin`, the shipping bin from the map or the gold chip; `?sheet=shop`,
// the shop. Each opens over the page it was tapped on, so Back closes it. Loaded on demand when one opens.
import { DAYS_PER_SEASON, DAYS_PER_YEAR, daySetState, dateOf, FESTIVALS, nextFestival, SEASON_NAMES, SEASONS } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, TrophyIcon } from '@luismlorenzana/uma-kit/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLoopSave } from '../save/game'
import { endTheDay } from './actions'
import { BinSheet, ShopSheet } from './GoodsSheets'
import { useAskBeforeEnd } from './ask'
import { nudgeWords, SEASON_COLOR, shortDate, whenWords } from './words'

export default function LoopSheets({ sheet }: { sheet: 'end' | 'calendar' | 'bin' | 'shop' }) {
  const close = useClose()
  switch (sheet) {
    case 'end': return <EndDay />
    case 'calendar': return <CalendarSheet />
    case 'bin': return <BinSheet onClose={close} />
    case 'shop': return <ShopSheet onClose={close} />
  }
}

function useClose(): () => void {
  const location = useLocation()
  const leave = useLeave()
  return () => leave(withParam(location, 'sheet', null))
}

/**
 * End the day (CS6, decision 6): the tab opens `?sheet=end`. When all is set, or the Menu's switch skips the question, the
 * day ends at once; otherwise one line says what's left, with End anyway and Back. Either way the morning opens on the
 * farm. The day the tap meant is held, so a second tap or a save that moved on meanwhile ends nothing more.
 */
function EndDay() {
  const save = useLoopSave()
  const ask = useAskBeforeEnd()
  const navigate = useNavigate()
  const close = useClose()
  const day = useRef(save?.calendar.day ?? null)
  const started = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = useMemo(() => (save ? daySetState(save) : null), [save])
  const end = useCallback(async () => {
    if (started.current || day.current === null) return
    started.current = true
    setPending(true)
    setError(null)
    try {
      await endTheDay(day.current)
      navigate('/', { replace: true })
    } catch (err) {
      started.current = false
      setPending(false)
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.')
    }
  }, [navigate])
  const atOnce = set !== null && (set.allSet || !ask)
  useEffect(() => {
    if (atOnce) void end()
  }, [atOnce, end])
  if (!save || !set || (atOnce && error === null)) return null
  return (
    <Sheet
      open
      onClose={close}
      label="End the day"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={close}>Back</Button>
          <Button onClick={() => void end()} disabled={pending} data-action="end-anyway">{error ? 'Try again' : 'End anyway'}</Button>
        </div>
      }
    >
      <p className="py-1 font-display text-[18px] font-semibold" data-end-line>{nudgeWords(set)}</p>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </Sheet>
  )
}

/** The calendar (CS4, decision 8): the year and the season, the season's 12 days with today and its festival marked, and
 * the next festival with its countdown. */
function CalendarSheet() {
  const save = useLoopSave()
  const close = useClose()
  if (!save) return null
  const day = save.calendar.day
  const date = dateOf(day)
  const first = day - date.day + 1
  const festivals = FESTIVALS.filter((f) => f.season === date.season)
  const next = nextFestival(day)
  return (
    <Sheet open onClose={close} title={`${shortDate(day)} · Year ${date.year}`} label="Calendar">
      <div className="space-y-4 pb-2" data-calendar>
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Seasons">
          {SEASONS.map((season) => (
            <li key={season} aria-current={season === date.season ? 'true' : undefined}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full border text-[13px] font-semibold ${season === date.season ? 'border-hairline-strong bg-sunken text-ink' : 'border-transparent text-ink-faint'}`}>
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: SEASON_COLOR[season] }} />
              {SEASON_NAMES[season]}
            </li>
          ))}
        </ol>
        <ol className="grid grid-cols-6 gap-1.5" aria-label={`${SEASON_NAMES[date.season]}'s days`}>
          {Array.from({ length: DAYS_PER_SEASON }, (_, i) => {
            const d = i + 1
            const festival = festivals.find((f) => f.day === d)
            const today = d === date.day
            const tone = today ? 'bg-accent text-accent-ink' : d < date.day ? 'bg-sunken/60 text-ink-faint' : 'bg-sunken text-ink'
            return (
              <li key={d} data-day={first + i} data-today={today || undefined} data-festival={festival?.id}
                aria-label={`${SEASON_NAMES[date.season]} ${d}${today ? ', today' : ''}${festival ? `, ${festival.name}` : ''}`}
                className={`relative flex h-11 flex-col items-center justify-center rounded-sm font-display text-[15px] font-bold ${tone} ${festival ? 'ring-2 ring-inset' : ''}`}
                style={festival ? { ['--tw-ring-color' as string]: SEASON_COLOR[date.season] } : undefined}>
                {d}
                {festival && <TrophyIcon size={14} className="absolute right-0.5 bottom-0.5" />}
              </li>
            )
          })}
        </ol>
        <ul className="space-y-1 text-[14px]">
          {festivals.map((f) => (
            <li key={f.id} className="flex items-center gap-2"><TrophyIcon size={16} /> {f.name} · {SEASON_NAMES[f.season]} {f.day}</li>
          ))}
        </ul>
        <div className="rounded-md border border-hairline p-3">
          <p className="text-[12px] text-ink-soft">Next festival</p>
          <p className="font-display text-[17px] font-semibold" data-next-festival>{next.festival.name} · {shortDate(next.day)} · {whenWords(next.inDays)}</p>
        </div>
        <p className="text-[12px] text-ink-faint">Day {((day - 1) % DAYS_PER_YEAR) + 1} of {DAYS_PER_YEAR}. Days move only when you end them.</p>
      </div>
    </Sheet>
  )
}
