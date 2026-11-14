// `/book`: the farm's book, the rail's ledger. For now it gathers what the farm already keeps, each a tap to its place:
// the gold (the bin), the Farm Rank (its sheet), the goods held (the Warehouse), who lives and works on the farm (the
// People page's Work view, and the Dorm's beds) and what can be built now (the Diary's projects). Upkeep, loans and
// the work board join it as the game grows them. Its cards sit two to a row where they fit. Loaded on demand.
import { bedsAt, farmProjects, farmRankOf, stockTotal, type FarmSave } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { HelpButton } from '@luismlorenzana/uma-kit/ui'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useLoopSave } from '../save/game'

const n = (value: number): string => value.toLocaleString('en-US')

export default function BookPage() {
  const save = useLoopSave()
  if (!save) return null
  return <Book save={save} />
}

/** One card: a heading, its figure and a line, the whole card a tap to its place. */
function Card({ to, title, figure, line, data }: { to: string; title: string; figure: ReactNode; line: string; data: string }) {
  return (
    <li>
      <Link to={to} state={{ back: true }} className="flex min-h-[76px] items-center gap-3 rounded-md border border-hairline bg-panel px-3 py-2 shadow-1" data-book={data}>
        <span className="min-w-0 flex-1">
          <span className="text-micro block">{title}</span>
          <span className="font-display block text-[20px] font-bold text-ink tabular-nums" data-figure>{figure}</span>
          <span className="block truncate text-[12px] text-ink-soft" data-line>{line}</span>
        </span>
        <span aria-hidden className="shrink-0 text-ink-faint">›</span>
      </Link>
    </li>
  )
}

function Book({ save }: { save: FarmSave }) {
  const location = useLocation()
  const rank = farmRankOf(save.farm.points)
  const goods = stockTotal(save.items)
  const home = save.dorm.home.length
  const beds = bedsAt(save.dorm.level)
  const met = Object.keys(save.roster).length
  const now = farmProjects(save).now.length
  return (
    <main className="@container absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4" data-page="book">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[22px] font-bold text-ink">Book</h1>
        <HelpButton title="The farm’s book" label="About the book">
          <p>The farm’s accounts at a glance: its gold, its Farm Rank, what it holds, who lives on it and what you can build.</p>
          <p>Tap a card to open its place.</p>
        </HelpButton>
      </div>
      <ul className="grid gap-2 @lg:grid-cols-2 @3xl:grid-cols-3" data-book-cards>
        <Card to={withParam(location, 'sheet', 'bin')} title="Gold" figure={`${n(save.gold)}g`} line="The bin pays tonight" data="gold" />
        <Card to={withParam(location, 'sheet', 'rank')} title="Farm Rank" figure={rank} line={`${n(save.farm.points)} points`} data="rank" />
        <Card to="/warehouse" title="Goods" figure={n(goods)} line="In the Warehouse" data="goods" />
        <Card to="/hearts?view=work" title="Umas on the farm" figure={home} line={`${n(met)} met`} data="work" />
        <Card to="/dorm" title="Dorm" figure={`${home}/${beds}`} line="Beds used" data="dorm" />
        <Card to="/diary" title="To build" figure={now} line="At this Farm Rank" data="projects" />
      </ul>
    </main>
  )
}
