// The landscape frame's two bars, on uma-kit's landscape variants for a left rail and a top bar: `AccountBar
// landscape="bar"` across the top of the page and `BottomBar side="left"` down the left edge, in `AppFrame
// landscape="rail-and-bar"` (Shell.tsx).
// - **The bar,** on top: the kit's chips, the date and season (the calendar) and the gold (the bin), and its sync chip
//   while offline or paused; at its right end the farm's own pair, the day's actions left and End the day, then the
//   kit's Menu. The actions left open nothing and grey at 0, so they aren't one of the kit's chips, which are links. When
//   the day's last action is spent, End the day opens by itself ("Out of actions").
// - **The rail,** down the left: Farm · Town · People · Book · Diary. A farm place's page (the Warehouse …)
//   keeps Farm lit.
import { actionsLeft, crewShiftEnabled, MORNING_ACTIONS, dateOf, dayActions, daySetState, eventActionsLeft, SEASON_NAMES, type DaySet, type FarmSave, type Season } from '@farm/domain'
import { AccountBar, BottomBar, withParam, type AccountBarProps, type BarTab, type CurrencyChip } from '@luismlorenzana/uma-kit/shell'
import {
  BookIcon, CarrotIcon, CoinIcon, HeartIcon, MoonIcon, StopwatchIcon, useReducedMotionSetting, VenueIcon,
  type IconComponent,
} from '@luismlorenzana/uma-kit/ui'
import { Link, useLocation } from 'react-router'
import { dateLabel, nudgeWords, SEASON_COLOR } from '../loop/words'
import { useGame, useLoopSave, type SyncStatus } from '../save/game'
import { useSpecialDays, useStoryYear } from '../story/story'
import { GoldCoin } from './Gold'

/** A season's dot: the date's mark where the pinned uma-art has no season mark. */
function SeasonDot({ season }: { season: Season }) {
  return <span aria-hidden className="inline-block size-3 rounded-full ring-1 ring-ink/15" style={{ background: SEASON_COLOR[season] }} />
}

const blank = <span className="inline-block h-3 w-5 rounded-full bg-sunken" />

/** The day's actions left, of the day's budget; faint once they're spent. On a special day, the event actions left
 * after them ("+3", a heart): only her events spend them. */
function ActionsChip({ save }: { save: FarmSave | null }) {
  const days = useSpecialDays()
  const left = save ? actionsLeft(save) : null
  const total = save ? dayActions(save) : null
  const events = save && days ? eventActionsLeft(save, days) : 0
  const time = left === null || total === null ? null : left === 0 ? 'Night' : left <= Math.floor(total / 2) ? 'Afternoon' : 'Morning'
  const split = save && crewShiftEnabled(save)
  const phaseLeft = split && time === 'Morning' ? Math.max(0, MORNING_ACTIONS - save.today.actions) : left
  const phaseTotal = split ? time === 'Night' ? null : MORNING_ACTIONS : total
  const label = left === null ? 'Actions left' : `Actions left: ${phaseLeft}${phaseTotal === null ? '' : ` of ${phaseTotal}`}${events > 0 ? `, and ${events} bonus event actions` : ''}. ${time}`
  return (
    <span role="img" aria-label={label}
      className="flex min-h-11 shrink-0 items-center justify-center" data-bar-chip="actions" data-day-part={time ?? undefined} data-actions={left ?? undefined} data-event-actions={events > 0 ? events : undefined}>
      <span aria-hidden className={`flex h-8 items-center gap-1 rounded-full border border-hairline bg-panel/90 px-2 text-[13px] shadow-1 ${left === 0 && events === 0 ? 'text-ink-faint' : 'text-ink'}`}>
        <StopwatchIcon size={16} />
        {time && <span className="text-[11px] leading-none text-ink-soft">{time}</span>}
        <span className={`font-display font-semibold tabular-nums ${left === 0 ? 'text-ink-faint' : ''}`}>{phaseLeft === null ? blank : phaseLeft}</span>
        {phaseTotal !== null && <span className="text-[11px] text-ink-faint">/{phaseTotal}</span>}
        {events > 0 && <span className="flex items-center gap-0.5 pl-0.5 font-display font-semibold text-[#c2385e] tabular-nums"><HeartIcon size={14} />+{events}</span>}
      </span>
    </span>
  )
}

/**
 * End the day, by the Menu: "All set", with a soft halo (still under reduced motion), once the day's actions are spent;
 * else "End day". It reads the save at its day, never the clock. Its name says what's left for VoiceOver.
 */
function EndDay({ set }: { set: DaySet | null }) {
  const location = useLocation()
  const reduced = useReducedMotionSetting()
  const allSet = set?.allSet ?? false
  return (
    <Link to={withParam(location, 'sheet', 'end')} aria-label={set && !allSet ? `End the day: ${nudgeWords(set)}` : allSet ? 'All set' : 'End day'}
      className="flex min-h-11 shrink-0 items-center justify-center px-0.5" data-bar-end>
      <span aria-hidden className="font-display relative flex h-8 items-center gap-1 rounded-full bg-accent pr-3 pl-2 text-[13px] font-bold text-accent-ink shadow-2">
        {allSet && <span data-glow={reduced ? 'still' : 'pulse'} className={`pointer-events-none absolute -inset-0.5 rounded-full shadow-[0_0_10px_3px_var(--color-accent)] ${reduced ? 'opacity-80' : 'animate-pulse'}`} />}
        <MoonIcon size={16} variant="duotone" accent="var(--color-panel)" />
        {allSet ? 'All set' : 'End day'}
      </span>
    </Link>
  )
}

/** The day's actions left and End the day, as the bar's right end has them: for a full-screen page's own strip (the
 * field's screen). */
export function DayActions() {
  const save = useLoopSave()
  return <><ActionsChip save={save} /><EndDay set={save ? daySetState(save) : null} /></>
}

/** The kit's sync chip, only while offline or paused; it opens Account. */
function syncChip(sync: SyncStatus): AccountBarProps['sync'] {
  if (sync === 'offline') return { state: 'offline', text: 'Offline', label: 'Offline: changes sync when you’re back', to: '/account' }
  if (sync === 'error') return { state: 'paused', text: 'Sync paused', label: 'Sync paused', to: '/account' }
  return undefined
}

/** The bar: thin, always on top of the page. The date's chip reads the day and its season ("3 Spring") by the season's
 * mark, and its name the whole date with the year and the next festival (the story's year, once the pack is in). */
export function FarmBar() {
  const location = useLocation()
  const day = useGame((s) => s.save?.calendar.day ?? null)
  const gold = useGame((s) => s.save?.gold ?? null)
  const sync = useGame((s) => s.sync)
  const year = useStoryYear()
  const save = useLoopSave()
  const set = save ? daySetState(save) : null
  const date = day === null ? null : dateOf(day, save?.calendar)
  const season = date?.season ?? 'spring'
  const chips: CurrencyChip[] = [
    {
      key: 'date', mark: `season/${season}`, fallback: <SeasonDot season={season} />, value: date?.day ?? null,
      extra: date ? ` ${SEASON_NAMES[date.season]}` : undefined,
      to: withParam(location, 'sheet', 'calendar'), label: day === null ? 'Calendar' : `Calendar: ${dateLabel(day, year, save?.calendar)}`,
    },
    {
      key: 'gold', mark: 'currency/gold', fallback: <GoldCoin />, value: gold,
      to: withParam(location, 'sheet', 'bin'), label: gold === null ? 'Gold' : `Gold: ${gold.toLocaleString('en-US')}g. The bin`,
    },
  ]
  return (
    <AccountBar landscape="bar" chips={chips} sync={syncChip(sync)}
      actions={<><ActionsChip save={save} /><EndDay set={set} /></>}
      menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
  )
}

export type RailPage = 'farm' | 'town' | 'people' | 'book' | 'diary'

const RAIL: readonly { key: RailPage; to: string; label: string; Icon: IconComponent }[] = [
  { key: 'farm', to: '/', label: 'Farm', Icon: CarrotIcon },
  { key: 'town', to: '/town', label: 'Town', Icon: VenueIcon },
  { key: 'people', to: '/library', label: 'Library', Icon: HeartIcon },
  { key: 'book', to: '/book', label: 'Ledger', Icon: CoinIcon },
  { key: 'diary', to: '/diary', label: 'Diary', Icon: BookIcon },
]

/** The rail page a path belongs to: the farm's places keep Farm lit; Account none. */
export function railPageOf(pathname: string): RailPage | null {
  // The field's screen is full screen, a farm place's: Farm stays lit behind it.
  if (pathname === '/town') return 'town'
  if (pathname === '/library' || pathname === '/hearts' || pathname === '/roster') return 'people'
  if (pathname === '/book') return 'book'
  if (pathname === '/diary') return 'diary'
  if (pathname === '/account') return null
  return 'farm'
}

/** The rail: the five pages, down the left edge by the thumb; the active one shows by the kit's marker on the rail's
 * inner edge and its two-tone icon. */
export function FarmRail({ page }: { page: RailPage | null }) {
  const tabs: BarTab[] = RAIL.map((tab) => ({ ...tab, active: page === tab.key }))
  return <BottomBar side="left" tabs={tabs} label="Pages" />
}
