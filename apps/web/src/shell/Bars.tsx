// The landscape frame's two bars. uma-kit's AccountBar and BottomBar draw a landscape stage's rails the other way round
// (the account and chips down the left, the actions down the right), so until the kit has the farm's layout (a thin bar
// on top, the pages down the left) the farm draws its own from the kit's pieces: its chip, its marks, its numbers and
// its icons.
// - **The bar,** on top: the date and season (the calendar), the actions left (a placeholder until the day has a budget
//   of actions), the gold (the bin) and the sync chip when something isn't synced; at its right end, End the day and the
//   Menu.
// - **The rail,** down the left: Farm · Town · People · Book · Diary. A farm place's page (the Fields, the Warehouse …)
//   keeps Farm lit.
import { dateOf, daySetState, type DaySet, type Festival, type Season } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import {
  AnimatedNumber, BookIcon, CarrotIcon, CoinIcon, HeartIcon, MenuIcon, MoonIcon, OfflineIcon, StopwatchIcon, UiMark, useReducedMotionSetting, VenueIcon,
  type IconComponent,
} from '@luismlorenzana/uma-kit/ui'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { dateLabel, nudgeWords, SEASON_COLOR, shortDate } from '../loop/words'
import { useGame, useLoopSave } from '../save/game'
import { useStoryYear } from '../story/story'
import { GoldCoin } from './Gold'

/** A season's dot: the date's mark until uma-art's season marks ship. */
function SeasonDot({ season }: { season: Season }) {
  return <span aria-hidden className="inline-block size-3 rounded-full ring-1 ring-ink/15" style={{ background: SEASON_COLOR[season] }} />
}

/** The kit's bar chip: a 44 pt link around a 32 pt pill. */
function BarChip({ to, label, children, className = '', data }: { to: string; label: string; children: ReactNode; className?: string; data?: string }) {
  return (
    <Link to={to} state={{ back: true }} aria-label={label} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center" data-bar-chip={data}>
      <span aria-hidden className={`flex h-8 items-center gap-1 rounded-full border border-hairline bg-panel/90 px-2 text-[13px] text-ink shadow-1 ${className}`}>
        {children}
      </span>
    </Link>
  )
}

const blank = <span className="inline-block h-3 w-5 rounded-full bg-sunken" />

/** The date and the season; its name says the year and the next festival (the story's year, once the pack is in). */
function DateChip({ day, year }: { day: number | null; year: readonly Festival[] | undefined }) {
  const location = useLocation()
  const season = day === null ? 'spring' : dateOf(day).season
  return (
    <BarChip to={withParam(location, 'sheet', 'calendar')} label={day === null ? 'Calendar' : `Calendar: ${dateLabel(day, year)}`} data="date">
      <UiMark mark={`season/${season}`} fallback={<SeasonDot season={season} />} />
      <span className="font-display font-semibold whitespace-nowrap">{day === null ? blank : shortDate(day)}</span>
    </BarChip>
  )
}

/** The actions left today: a placeholder until the day has its budget of actions. */
function ActionsChip() {
  return (
    <span role="img" aria-label="Actions left: not counted yet" className="flex min-h-11 shrink-0 items-center justify-center" data-bar-chip="actions" data-actions="placeholder">
      <span aria-hidden className="flex h-8 items-center gap-1 rounded-full border border-dashed border-hairline-strong px-2 text-[13px] text-ink-faint">
        <StopwatchIcon size={16} />
        <span className="font-display font-semibold">—</span>
      </span>
    </span>
  )
}

/** Gold: uma-art's coin (a plain "g" until it ships) and the farm's gold; it opens the bin. */
function GoldChip({ gold }: { gold: number | null }) {
  const location = useLocation()
  return (
    <BarChip to={withParam(location, 'sheet', 'bin')} label={gold === null ? 'Gold' : `Gold: ${gold.toLocaleString('en-US')}g. The bin`} data="gold">
      <UiMark mark="currency/gold" fallback={<GoldCoin />} />
      <span className="font-display font-semibold">{gold === null ? blank : <AnimatedNumber value={gold} />}</span>
    </BarChip>
  )
}

/** The sync chip, only while offline or paused; it opens Account. */
function SyncChip() {
  const sync = useGame((s) => s.sync)
  if (sync !== 'offline' && sync !== 'error') return null
  return sync === 'offline'
    ? <BarChip to="/account" label="Offline: changes sync when you’re back" className="text-ink-soft" data="sync"><OfflineIcon size={16} /><span className="text-[12px] font-semibold whitespace-nowrap">Offline</span></BarChip>
    : <BarChip to="/account" label="Sync paused" className="text-ink-soft" data="sync"><span className="text-[12px] font-semibold whitespace-nowrap">Sync paused</span></BarChip>
}

/**
 * End the day, at the bar's right end: "All set", with a soft halo (still under reduced motion), when nothing waits;
 * else "End day" with the count of idle Umas and things to collect. It reads the save at its day, never the clock. Its
 * name carries the count for VoiceOver.
 */
function EndDay({ set }: { set: DaySet | null }) {
  const location = useLocation()
  const reduced = useReducedMotionSetting()
  const badge = set?.badge ?? 0
  const allSet = set?.allSet ?? false
  return (
    <Link to={withParam(location, 'sheet', 'end')} aria-label={badge > 0 && set ? `End the day: ${nudgeWords(set)}` : allSet ? 'All set' : 'End day'}
      className="flex min-h-11 shrink-0 items-center justify-center px-0.5" data-bar-end>
      <span aria-hidden className="font-display relative flex h-8 items-center gap-1 rounded-full bg-accent pr-3 pl-2 text-[13px] font-bold text-accent-ink shadow-2">
        {allSet && <span data-glow={reduced ? 'still' : 'pulse'} className={`pointer-events-none absolute -inset-0.5 rounded-full shadow-[0_0_10px_3px_var(--color-accent)] ${reduced ? 'opacity-80' : 'animate-pulse'}`} />}
        <MoonIcon size={16} variant="duotone" accent="var(--color-panel)" />
        {allSet ? 'All set' : 'End day'}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-success px-1 text-center text-[10px] leading-4 font-bold text-ink-on-dark ring-2 ring-panel">{badge}</span>
        )}
      </span>
    </Link>
  )
}

/** The Menu, "Every place". */
function MenuButton() {
  const location = useLocation()
  return (
    <Link to={withParam(location, 'sheet', 'menu')} state={{ back: true }} aria-label="Every place"
      className="flex min-h-11 shrink-0 items-center gap-1 px-2 text-ink-soft" data-bar-menu>
      <MenuIcon size={20} />
      <span className="text-[12px] font-semibold">Menu</span>
    </Link>
  )
}

/** The bar: thin, always on top of the page. */
export function FarmBar() {
  const day = useGame((s) => s.save?.calendar.day ?? null)
  const gold = useGame((s) => s.save?.gold ?? null)
  const year = useStoryYear()
  const save = useLoopSave()
  const set = save ? daySetState(save) : null
  return (
    <header className="pr-safe relative z-20 flex shrink-0 items-center gap-0.5 border-b border-hairline bg-panel/95 pl-1 backdrop-blur" data-farm-bar>
      <DateChip day={day} year={year} />
      <ActionsChip />
      <GoldChip gold={gold} />
      <SyncChip />
      <span className="min-w-0 flex-1" />
      <EndDay set={set} />
      <MenuButton />
    </header>
  )
}

export type RailPage = 'farm' | 'town' | 'people' | 'book' | 'diary'

const RAIL: readonly { key: RailPage; to: string; label: string; Icon: IconComponent }[] = [
  { key: 'farm', to: '/', label: 'Farm', Icon: CarrotIcon },
  { key: 'town', to: '/town', label: 'Town', Icon: VenueIcon },
  { key: 'people', to: '/hearts', label: 'People', Icon: HeartIcon },
  { key: 'book', to: '/book', label: 'Book', Icon: CoinIcon },
  { key: 'diary', to: '/diary', label: 'Diary', Icon: BookIcon },
]

/** The rail page a path belongs to: the farm's places keep Farm lit; Account none. */
export function railPageOf(pathname: string): RailPage | null {
  if (pathname === '/town') return 'town'
  if (pathname === '/hearts' || pathname === '/roster') return 'people'
  if (pathname === '/book') return 'book'
  if (pathname === '/diary') return 'diary'
  if (pathname === '/account') return null
  return 'farm'
}

/** The rail: the five pages, down the left edge by the thumb. The active one shows by its marker on the rail's inner
 * edge and its two-tone icon, as the kit's rail does. */
export function FarmRail({ page }: { page: RailPage | null }) {
  return (
    <nav aria-label="Pages" className="pt-safe pb-safe pl-safe relative z-20 flex shrink-0 flex-col justify-center gap-0.5 border-r border-hairline bg-panel" data-farm-rail>
      {RAIL.map(({ key, to, label, Icon }) => {
        const active = page === key
        return (
          <Link key={key} to={to} aria-label={label} aria-current={active ? 'page' : undefined} data-rail={key}
            className="relative flex h-14 w-16 flex-col items-center justify-center gap-0.5 px-1">
            {active && <span aria-hidden className="absolute top-1/2 right-0 h-8 w-[3px] -translate-y-1/2 rounded-l-full bg-accent" />}
            <Icon size={24} variant={active ? 'duotone' : 'line'} className={active ? 'text-ink' : 'text-ink-faint'} />
            <span className={`max-w-full truncate text-[11px] font-semibold ${active ? 'text-ink' : 'text-ink-faint'}`}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
