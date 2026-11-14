// The farm's top and bottom bars on uma-kit (as uma-rpg's): the account's initial, which opens Account, and the sync chip;
// the date chip, which opens the calendar; the gold chip, which opens the bin; and the Farm Rank's chip, which
// opens its sheet. The bottom bar: Farm · Hearts · End the day (raised) · Diary · Menu.
import { dateOf, daySetState, farmRankOf, type Festival, type Season } from '@farm/domain'
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountBar, BottomBar, withParam, type BarTab, type CurrencyChip } from '@luismlorenzana/uma-kit/shell'
import { BookIcon, CarrotIcon, HeartIcon, MoonIcon } from '@luismlorenzana/uma-kit/ui'
import { useLocation, type Location } from 'react-router'
import { dateLabel, nudgeWords, SEASON_COLOR } from '../loop/words'
import { useGame, useLoopSave } from '../save/game'
import { useStoryYear } from '../story/story'
import { GoldCoin } from './Gold'

export type BarPage = 'farm' | 'hearts' | 'diary'

/** A season's dot: the date chip's mark until uma-art's season marks ship. */
function SeasonDot({ season }: { season: Season }) {
  return <span aria-hidden className="inline-block size-3 rounded-full ring-1 ring-ink/15" style={{ background: SEASON_COLOR[season] }} />
}

/** The date: the season's mark and the day of the season; its name says the year and the next festival (the story's
 * year, once the pack is in). */
function dateChip(day: number | null, location: Location, year: readonly Festival[] | undefined): CurrencyChip {
  const season = day === null ? 'spring' : dateOf(day).season
  return {
    key: 'date', mark: `season/${season}`, fallback: <SeasonDot season={season} />, value: day === null ? null : dateOf(day).day,
    to: withParam(location, 'sheet', 'calendar'), label: day === null ? 'Calendar' : `Calendar: ${dateLabel(day, year)}`,
  }
}

/** Gold: uma-art's coin (a plain "g" until it ships) and the farm's gold; it opens the bin. */
function goldChip(gold: number | null, location: Location): CurrencyChip {
  return {
    key: 'gold', mark: 'currency/gold', fallback: <GoldCoin />, value: gold, to: withParam(location, 'sheet', 'bin'),
    label: gold === null ? 'Gold' : `Gold: ${gold.toLocaleString('en-US')}g. The bin`,
  }
}

/** The Farm Rank's crest until the `farm/rank` ships: "FR" on a green shield. */
function RankCrest() {
  return (
    <span aria-hidden className="font-display inline-flex h-4 min-w-5 shrink-0 items-center justify-center rounded-[4px] bg-[#3f7d3a] px-0.5 text-[9px] leading-none font-bold text-white ring-1 ring-[#2c5a28]">
      FR
    </span>
  )
}

/** The Farm Rank: the crest and the rank; it opens the rank's sheet. The kit's tier crest stops at 3, so the
 * rank isn't drawn there. */
function rankChip(points: number | null, location: Location): CurrencyChip {
  const rank = points === null ? null : farmRankOf(points)
  return {
    key: 'farm-rank', mark: 'farm/rank', fallback: <RankCrest />, value: rank, to: withParam(location, 'sheet', 'rank'),
    label: rank === null ? 'Farm Rank' : `Farm Rank ${rank}: ${points!.toLocaleString('en-US')} points`,
  }
}

export function FarmAccountBar() {
  const auth = useAuth()
  const location = useLocation()
  const sync = useGame((s) => s.sync)
  const day = useGame((s) => s.save?.calendar.day ?? null)
  const gold = useGame((s) => s.save?.gold ?? null)
  const points = useGame((s) => s.save?.farm.points ?? null)
  const year = useStoryYear()
  const name = auth.user?.name ?? auth.user?.email ?? 'Farm'
  return (
    <AccountBar
      initial={name.slice(0, 1).toUpperCase()}
      account={{ to: '/account', label: `Account: ${name}` }}
      chips={[dateChip(day, location, year), goldChip(gold, location), rankChip(points, location)]}
      sync={sync === 'offline' ? { state: 'offline', text: 'Offline', label: 'Offline: changes sync when you’re back', to: '/account' }
        : sync === 'error' ? { state: 'paused', text: 'Sync paused', label: 'Sync paused', to: '/account' } : undefined}
    />
  )
}

/**
 * The bar: Farm · Hearts · End the day · Diary · Menu. Hearts (`/hearts`) is uma-kit's heart, no badge: its signals
 * are the morning, her Ready chip and her pip. End the day is the
 * raised centre; it reads "All set" and glows when nothing waits, else "End day" with the count of idle Umas and
 * things to collect on the disc. It reads the save at its day, never the clock. The badge and the glow are uma-kit
 * 0.19.0's (a request from this app); the tab's name carries the count for VoiceOver.
 */
export function FarmBottomBar({ page }: { page: BarPage | null }) {
  const location = useLocation()
  const save = useLoopSave()
  const set = save ? daySetState(save) : null
  const badge = set?.badge ?? 0
  const tabs: BarTab[] = [
    { key: 'farm', to: '/', label: 'Farm', Icon: CarrotIcon, active: page === 'farm' },
    { key: 'hearts', to: '/hearts', label: 'Hearts', Icon: HeartIcon, active: page === 'hearts' },
    {
      key: 'end', to: withParam(location, 'sheet', 'end'), label: set?.allSet ? 'All set' : 'End day', Icon: MoonIcon, active: false, raised: true,
      badge, badgeLabel: set ? `End the day: ${nudgeWords(set)}` : undefined, glow: set?.allSet ?? false,
    },
    { key: 'diary', to: '/diary', label: 'Diary', Icon: BookIcon, active: page === 'diary' },
  ]
  return <BottomBar label="Pages" tabs={tabs} menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
}
