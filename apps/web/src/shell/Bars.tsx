// The farm's top and bottom bars on uma-kit (as uma-rpg's): the account's initial, which opens Account, and the sync chip.
// The Wilds (F5): no currencies; the bottom bar holds the Wilds, with its Ready count, the Warehouse and the menu. The
// loop's build (F18): the date chip, which opens the calendar, and Farm · Roster · End the day (raised) · Diary · Menu;
// F19's gold chip beside the date, which opens the bin.
import { dateOf, daySetState, type Season } from '@farm/domain'
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountBar, BottomBar, withParam, type BarTab, type CurrencyChip } from '@luismlorenzana/uma-kit/shell'
import { BookIcon, CardsIcon, CarrotIcon, MoonIcon, PickaxeIcon, ViewGridIcon } from '@luismlorenzana/uma-kit/ui'
import { useLocation, type Location } from 'react-router'
import { loopOn } from '../app/loop'
import { dateLabel, nudgeWords, SEASON_COLOR } from '../loop/words'
import { useGame, useLoopSave, useWildsSave } from '../save/game'
import { readyTotal } from '../wilds/ready'
import { GoldCoin } from './Gold'
import { useNow } from './useNow'

export type BarPage = 'wilds' | 'warehouse' | 'farm' | 'roster' | 'diary'

/** A season's dot: the date chip's mark until uma-art's season marks ship (F25). */
function SeasonDot({ season }: { season: Season }) {
  return <span aria-hidden className="inline-block size-3 rounded-full ring-1 ring-ink/15" style={{ background: SEASON_COLOR[season] }} />
}

/** The date (decision 8): the season's mark and the day of the season; its name says the year and the next festival. */
function dateChip(day: number | null, location: Location): CurrencyChip {
  const season = day === null ? 'spring' : dateOf(day).season
  return {
    key: 'date', mark: `season/${season}`, fallback: <SeasonDot season={season} />, value: day === null ? null : dateOf(day).day,
    to: withParam(location, 'sheet', 'calendar'), label: day === null ? 'Calendar' : `Calendar: ${dateLabel(day)}`,
  }
}

/** Gold (F19 decision 10): uma-art's coin (a plain "g" until F25) and the farm's gold; it opens the bin. */
function goldChip(gold: number | null, location: Location): CurrencyChip {
  return {
    key: 'gold', mark: 'currency/gold', fallback: <GoldCoin />, value: gold, to: withParam(location, 'sheet', 'bin'),
    label: gold === null ? 'Gold' : `Gold: ${gold.toLocaleString('en-US')}g. The bin`,
  }
}

export function FarmAccountBar() {
  const auth = useAuth()
  const location = useLocation()
  const sync = useGame((s) => s.sync)
  const day = useGame((s) => (s.save?.version === 3 ? s.save.calendar.day : null))
  const gold = useGame((s) => (s.save?.version === 3 ? s.save.gold : null))
  const name = auth.user?.name ?? auth.user?.email ?? 'Farm'
  return (
    <AccountBar
      initial={name.slice(0, 1).toUpperCase()}
      account={{ to: '/account', label: `Account: ${name}` }}
      chips={loopOn() ? [dateChip(day, location), goldChip(gold, location)] : []}
      sync={sync === 'offline' ? { state: 'offline', text: 'Offline', label: 'Offline: changes sync when you’re back', to: '/account' }
        : sync === 'error' ? { state: 'paused', text: 'Sync paused', label: 'Sync paused', to: '/account' } : undefined}
    />
  )
}

export function FarmBottomBar({ page }: { page: BarPage | null }) {
  return loopOn() ? <LoopBottomBar page={page} /> : <WildsBottomBar page={page} />
}

function WildsBottomBar({ page }: { page: BarPage | null }) {
  const location = useLocation()
  const save = useWildsSave()
  const now = useNow(15_000)
  const ready = readyTotal(save, now)
  const tabs: BarTab[] = [
    { key: 'wilds', to: '/', label: 'Wilds', Icon: PickaxeIcon, active: page === 'wilds', badge: ready, badgeLabel: `Wilds, ${ready} ready` },
    { key: 'warehouse', to: '/warehouse', label: 'Warehouse', Icon: ViewGridIcon, active: page === 'warehouse' },
  ]
  return <BottomBar label="Pages" tabs={tabs} menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
}

/**
 * The loop's bar (FC29, decision 6): Farm · Roster · End the day · Diary · Menu. End the day is the raised centre; it reads
 * "All set" and glows when nothing waits (CS6), else "End day" with the count of idle Umas and things to collect on the
 * disc. It reads the save at its day, never the clock. The badge and the glow are uma-kit 0.19.0's (uma-platform P112,
 * from F18's request); the tab's name carries the count for VoiceOver.
 */
function LoopBottomBar({ page }: { page: BarPage | null }) {
  const location = useLocation()
  const save = useLoopSave()
  const set = save ? daySetState(save) : null
  const badge = set?.badge ?? 0
  const tabs: BarTab[] = [
    { key: 'farm', to: '/', label: 'Farm', Icon: CarrotIcon, active: page === 'farm' },
    { key: 'roster', to: '/roster', label: 'Roster', Icon: CardsIcon, active: page === 'roster' },
    {
      key: 'end', to: withParam(location, 'sheet', 'end'), label: set?.allSet ? 'All set' : 'End day', Icon: MoonIcon, active: false, raised: true,
      badge, badgeLabel: set ? `End the day: ${nudgeWords(set)}` : undefined, glow: set?.allSet ?? false,
    },
    { key: 'diary', to: '/diary', label: 'Diary', Icon: BookIcon, active: page === 'diary' },
  ]
  return <BottomBar label="Pages" tabs={tabs} menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
}
