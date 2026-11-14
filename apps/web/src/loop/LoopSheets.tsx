// The loop's global sheets: `?sheet=end`, End the day;
// `?sheet=calendar`, the calendar from the account bar's date; `?sheet=bin`, the shipping bin from the map or the gold
// chip; `?sheet=shop`, the shop; `?sheet=rank`, the Farm Rank from its chip. Each opens over the page it was tapped on,
// so Back closes it. Loaded on demand when one opens. End the day opens **Tonight** while an evening slot is free and
// someone can spend it, and the night is a fade to dusk and back up on the morning (`night-fade.ts`).
import {
  DAYS_PER_SEASON, DAYS_PER_YEAR, daySetState, dateOf, ENTRY_POINTS, FARM_RANK_POINTS, farmPointsOf, farmRankOf, farmRankOpens, festivalsOf,
  GOLD_PER_POINT, MILESTONE_POINTS, nextFarmRank, nextFestival, SEASON_NAMES, SEASONS, tonightOpens,
} from '@farm/domain'
import { useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet, TrophyIcon, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { endTheDay } from './actions'
import { BinSheet, ShopSheet } from './GoodsSheets'
import { useAskBeforeEnd } from './ask'
import { withNightFade } from './night-fade'
import { nudgeWords, SEASON_COLOR, shortDate, whenWords } from './words'

const Tonight = lazy(() => import('./Tonight'))

export default function LoopSheets({ sheet }: { sheet: 'end' | 'calendar' | 'bin' | 'shop' | 'rank' }) {
  const close = useClose()
  switch (sheet) {
    case 'end': return <EndDay />
    case 'calendar': return <CalendarSheet />
    case 'bin': return <BinSheet onClose={close} />
    case 'shop': return <ShopSheet onClose={close} />
    case 'rank': return <RankSheet />
  }
}

function useClose(): () => void {
  const location = useLocation()
  const leave = useLeave()
  return () => {
    const params = new URLSearchParams(location.search)
    params.delete('sheet')
    const rest = params.toString()
    leave(`${location.pathname}${rest ? `?${rest}` : ''}`)
  }
}

/**
 * End the day: the tab opens `?sheet=end`. When all is set, or the Menu's switch skips the question, the
 * day ends at once; otherwise one line says what's left, with End anyway and Back. Either way the morning opens on the
 * farm. The day the tap meant is held, so a second tap or a save that moved on meanwhile ends nothing more. Tonight
 * opens first while an evening is free and someone can spend it, decided
 * once as the sheet opens (so a played evening doesn't end the day by itself), and the night fades through dusk.
 */
function EndDay() {
  const save = useLoopSave()
  const ask = useAskBeforeEnd()
  const navigate = useNavigate()
  const close = useClose()
  const reduced = useReducedMotionSetting()
  const pack = useStory()
  const day = useRef(save?.calendar.day ?? null)
  const started = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = useMemo(() => (save ? daySetState(save) : null), [save])
  // Tonight or the sheet, decided once the pack is in (the night waits for it anyway).
  const [tonight, setTonight] = useState<boolean | null>(null)
  useEffect(() => {
    if (tonight === null && save && pack) setTonight(tonightOpens(save, pack))
  }, [tonight, save, pack])
  const end = useCallback(async () => {
    if (started.current || day.current === null) return
    started.current = true
    setPending(true)
    setError(null)
    const night = async () => {
      await endTheDay(day.current!)
      navigate('/', { replace: true })
    }
    try {
      await withNightFade(night, reduced)
    } catch (err) {
      started.current = false
      setPending(false)
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.')
    }
  }, [navigate, reduced])
  const atOnce = set !== null && tonight === false && (set.allSet || !ask)
  useEffect(() => {
    if (atOnce) void end()
  }, [atOnce, end])
  if (!save || !set || tonight === null || (atOnce && error === null)) return null
  if (tonight && pack) {
    return <Suspense fallback={null}><Tonight save={save} pack={pack} pending={pending} error={error} onEnd={() => void end()} onBack={close} /></Suspense>
  }
  return (
    <Sheet
      open
      onClose={close}
      label="End the day"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={close} >Back</Button>
          <Button onClick={() => void end()} disabled={pending} data-action="end-anyway">{error ? 'Try again' : set.allSet ? 'End the day' : 'End anyway'}</Button>
        </div>
      }
    >
      <p className="py-1 font-display text-[18px] font-semibold" data-end-line>{set.allSet ? 'Out of actions' : nudgeWords(set)}</p>
      {set.allSet && <p className="text-[13px] text-ink-soft">Building, the evening and a shop you’re already in take no actions.</p>}
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </Sheet>
  )
}

/** The calendar: the year and the season, the season's 12 days with today and its festivals marked, each festival with
 * what happens at it (the story's line), and the next festival with its countdown. The festivals are the year's: the
 * game's five, or the story's (`festivalsOf`: renamed, moved or added). */
function CalendarSheet() {
  const save = useLoopSave()
  const close = useClose()
  const story = useStory()
  const year = festivalsOf(story)
  if (!save) return null
  const day = save.calendar.day
  const date = dateOf(day)
  const first = day - date.day + 1
  const festivals = year.filter((f) => f.season === date.season)
  const next = nextFestival(day, year)
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
        <ul className="space-y-1.5 text-[14px]">
          {festivals.map((f) => (
            <li key={f.id} data-festival-row={f.id}>
              <span className="flex items-center gap-2"><TrophyIcon size={16} /> {f.name} · {SEASON_NAMES[f.season]} {f.day}</span>
              {f.happens && <span className="block pl-6 text-[13px] text-ink-soft" data-festival-happens>{f.happens}</span>}
            </li>
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

/** The Farm Rank: the rank and its points, the way to the next with what it opens, and where the
 * points come from on this farm. Points are counted each night. */
function RankSheet() {
  const save = useLoopSave()
  const close = useClose()
  if (!save) return null
  const rank = farmRankOf(save.farm.points)
  const next = nextFarmRank(save.farm.points)
  const from = FARM_RANK_POINTS[rank - 1]!
  const share = next ? Math.min(1, (save.farm.points - from) / (next.points - from)) : 1
  const parts = farmPointsOf(save)
  const rows: [string, string, number][] = [
    ['Shipping', `1 per ${GOLD_PER_POINT}g`, parts.shipped],
    ['Diary entries', `${ENTRY_POINTS} each`, parts.entries],
    ['Milestones', `${MILESTONE_POINTS} each`, parts.milestones],
  ]
  return (
    <Sheet open onClose={close} title={`Farm Rank ${rank}`} label="Farm Rank">
      <div className="space-y-4 pb-2" data-rank-sheet={rank}>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-[20px] font-bold" data-points>{save.farm.points.toLocaleString('en-US')} points</p>
            <HelpButton title="The Farm Rank" label="About the Farm Rank">
              <p>The farm’s own rank, from what you earn and grow. Points come from shipping and the Diary (each good shipped once, and milestones); festivals and decorations add more later.</p>
              <p>Points are counted each night. A new rank offers places to build, with gold and the farm’s goods, and more land, beds and seeds.</p>
            </HelpButton>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)}
            aria-label={next ? `To Farm Rank ${next.rank}` : 'Top rank'}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
          </div>
          <p className="pt-1 text-[13px] text-ink-soft" data-next>
            {next ? `${(next.points - save.farm.points).toLocaleString('en-US')} more for Farm Rank ${next.rank} (${next.points.toLocaleString('en-US')})` : 'The top rank'}
          </p>
        </div>
        {next && (
          <section aria-label={`Farm Rank ${next.rank} opens`}>
            <h3 className="text-micro pb-1">Farm Rank {next.rank} opens</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline" data-opens>
              {farmRankOpens(next.rank).map((what) => <li key={what} className="flex min-h-11 items-center px-3 text-[15px]">{what}</li>)}
            </ul>
          </section>
        )}
        <section aria-label="Points so far">
          <h3 className="text-micro pb-1">Points so far</h3>
          <ul className="divide-y divide-hairline rounded-md border border-hairline">
            {rows.map(([what, rule, points]) => (
              <li key={what} className="flex min-h-11 items-center gap-2 px-3 text-[15px]" data-source={what}>
                <span className="flex-1">{what} <span className="text-[12px] text-ink-faint">· {rule}</span></span>
                <span className="font-semibold">{points.toLocaleString('en-US')}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Sheet>
  )
}
