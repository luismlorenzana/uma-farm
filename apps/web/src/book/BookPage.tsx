// `/book`: the farm's book, the rail's ledger. First **the money**: the daily upkeep and tonight's food (the takeout the
// pantry and the cooks won't cover) beside an average night's income over the last seven nights (the nights as bars
// against the upkeep and food's line), what's left each night, what the upkeep counts, tonight's table (who eats, a staff
// meal served, from the pantry, takeout, and the kitchen a tap away: the Kitchen's sheet once it stands, else the
// farmhouse's), a short night's warning or half pace, and the loans with what's owed
// and when each clears. Then the cards,
// each a tap to its place: the gold (the bin), the Farm Rank (its sheet), the goods held (the Warehouse), who lives and
// is on the farm today (the People page's Work view) and what can be built now (the Diary's projects).
// Between them, the work board (`WorkBoard`): each farmhand's day and tasks. Its cards sit two to a row where they fit.
// Loaded on demand.
import {
  atHome, awayOn, averageIncome, farmProjects, farmRankOf, halfPace, INCOME_NIGHTS, knownRestaurantRecipes, loansOwed, placeBuilt, stockTotal, tableTonight, TAKEOUT_PRICE, upkeepOf, worksOn, type FarmSave,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { HelpButton } from '@luismlorenzana/uma-kit/ui'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { gold, loanWords, projectName, projectNames, upkeepLines } from '../loop/money-words'
import { useTalents } from '../loop/talents'
import { plural } from '../loop/words'
import { WorkBoard } from './WorkBoard'
import MealDishes from '../loop/MealDishes'

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
      <Link to={to} state={{ back: true }} className="flex min-h-[76px] items-center gap-2 rounded-md border border-hairline bg-panel px-3 py-2 shadow-1" data-book={data}>
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
  const pack = useStory()
  // On the farm today: the spouses in their rooms, and the farmhands on their farm day.
  const here = Object.keys(save.roster).filter((id) => !awayOn(save, id, save.calendar.day) && (atHome(save, id) || worksOn(save, pack, id))).length
  const met = Object.keys(save.roster).length
  const now = farmProjects(save).now.length
  return (
    <main className="@container absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4" data-page="book">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[22px] font-bold text-ink">Farm Book</h1>
        <HelpButton title="The farm’s book" label="About the book">
          <p>The farm’s accounts at a glance: its money, the work board, its gold, its Farm Rank, what it holds, who’s on it today and what you can build.</p>
          <p>Each night, after the bin pays, the farm pays its upkeep: a little for each place and house you’ve built, and each spouse living on the farm. A farmhand costs her meals on her farm days.</p>
          <p>Everyone who eats on the farm eats twice a night, from the pantry first. What it’s short is takeout, {gold(TAKEOUT_PRICE)} a meal, paid with the upkeep. Cook in the farmhouse kitchen, or set a farmhand to Cook.</p>
          <p>Short of it, the rest is owed. The first short night warns you; from the second, the farmhands work at half pace until it’s paid. Nobody leaves, and nothing is lost.</p>
          <p>The mayor’s office in town lends toward a build. Each night’s income repays a little, before the upkeep.</p>
          <p>Tap a card to open its place.</p>
        </HelpButton>
      </div>
      <Money save={save} />
      <WorkBoard save={save} />
      <ul className="grid gap-2 @lg:grid-cols-2 @3xl:grid-cols-3" data-book-cards>
        <Card to={withParam(location, 'sheet', 'bin')} title="Gold" figure={`${n(save.gold)}g`} line="The bin pays tonight" data="gold" />
        <Card to={withParam(location, 'sheet', 'rank')} title="Farm Rank" figure={rank} line={`${n(save.farm.points)} points`} data="rank" />
        <Card to="/warehouse" title="Goods" figure={n(goods)} line="In the Warehouse" data="goods" />
        <Card to="/hearts?view=work" title="On the farm today" figure={here} line={`${n(met)} met`} data="work" />
        <Card to="/diary" title="To build" figure={now} line="At this Farm Rank" data="projects" />
      </ul>
    </main>
  )
}

/** One of the money's three figures. */
function Figure({ title, figure, line, tone, data }: { title: string; figure: string; line: string; tone?: 'good' | 'bad'; data: string }) {
  return (
    <div className="min-w-0" data-money={data}>
      <span className="text-micro block">{title}</span>
      <span className={`font-display block text-[22px] leading-tight font-bold tabular-nums ${tone === 'bad' ? 'text-danger' : tone === 'good' ? 'text-success' : 'text-ink'}`} data-figure>{figure}</span>
      <span className="block truncate text-[12px] text-ink-soft" data-line>{line}</span>
    </div>
  )
}

/** The money: the daily upkeep beside an average night's income, what's left, the upkeep's parts, the last seven
 * nights against the upkeep, a short night's state and the loans. */
function Money({ save }: { save: FarmSave }) {
  const pack = useStory()
  const talents = useTalents()
  const location = useLocation()
  const names = projectNames(pack, save)
  const upkeep = upkeepOf(save)
  const table = tableTonight(save, talents.of, pack)
  const income = averageIncome(save)
  const nights = save.farm.income.length
  // The loans' shares come out of the night's income first, and only out of it.
  const shares = Math.min(income, save.farm.loans.reduce((sum, loan) => sum + Math.min(loan.nightly, loan.owed), 0))
  const left = income - table.gold - upkeep.gold - shares
  const parts = upkeepLines(upkeep)
  const owed = loansOwed(save)
  return (
    <section aria-label="The money" className="space-y-2 rounded-md border border-hairline bg-panel px-3 py-2 shadow-1" data-book="money">
      <div className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
        <Figure title="Upkeep a night" figure={gold(upkeep.gold)} line={upkeep.gold === 0 ? 'Nothing to keep up yet' : 'After the bin pays'} data="upkeep" />
        <Figure title="Food tonight" figure={gold(table.gold)} line={table.takeout > 0 ? `Takeout · ${plural(table.takeout, 'meal')}` : 'From the pantry'} tone={table.takeout > 0 ? undefined : 'good'} data="food" />
        <Figure title="Income a night" figure={gold(income)} line={nights === 0 ? 'No nights yet' : `Average of the last ${nights === 1 ? 'night' : `${Math.min(nights, INCOME_NIGHTS)} nights`}`} data="income" />
        <Figure title="Left each night" figure={`${left >= 0 ? '+' : '−'}${gold(Math.abs(left))}`} line={shares > 0 ? 'Less food, upkeep and loans' : 'Income less food and upkeep'} tone={left >= 0 ? 'good' : 'bad'} data="left" />
      </div>
      <div className="grid gap-x-4 gap-y-2 @lg:grid-cols-2">
        <Nights save={save} upkeep={upkeep.gold + table.gold} />
        <div className="space-y-1">
          {parts.length > 0 && (
            <ul className="text-[13px]" aria-label="What the upkeep counts" data-upkeep-parts>
              {parts.map((p) => (
                <li key={p.key} className="flex min-h-6 items-center justify-between gap-2" data-part={p.key}>
                  <span className="truncate text-ink-soft">{p.text}</span><span className="font-semibold tabular-nums">{gold(p.gold)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to={withParam(location, 'sheet', placeBuilt(save, 'kitchen') ? 'kitchen' : 'homestead')} state={{ back: true }} className="flex min-h-11 items-center justify-between gap-2 text-[13px]"
            data-table={table.mouths}>
            <span className="min-w-0 text-ink-soft">
              {table.mouths} at the table · {save.today.staff ? `staff meal for ${Math.min(save.today.staff.mouths, table.mouths)} · ` : ''}{plural(table.pantry + table.takeout, 'meal')} · {table.pantry} from the pantry{table.cooked > 0 ? ` (${table.cooked} cooked tonight)` : ''}
            </span>
            <span className="shrink-0 font-semibold">Kitchen ›</span>
          </Link>
          <MealDishes save={save} />
          {placeBuilt(save, 'restaurant') && <Link to={withParam(location, 'sheet', 'restaurant')}
            className="flex min-h-11 items-center justify-between gap-2 text-[13px]">
            <span className="text-ink-soft">{knownRestaurantRecipes(save).length}/120 recipes learned</span>
            <span className="font-semibold">Restaurant ›</span>
          </Link>}
        </div>
      </div>
      {save.farm.owed > 0 && (
        <p role="status" className="rounded-md bg-danger/15 px-3 py-2 text-[13px] font-semibold text-danger" data-short={save.farm.short}>
          Short of upkeep · {gold(save.farm.owed)} owed{halfPace(save) ? ' · farmhands at half pace until it’s paid' : ' · half pace from a second short night'}
        </p>
      )}
      <div data-loans={save.farm.loans.length}>
        <h2 className="text-micro">Loans{owed > 0 ? ` · ${gold(owed)} owed` : ''}</h2>
        {save.farm.loans.length === 0 ? (
          <p className="text-[13px] text-ink-soft" data-no-loans>None. The mayor’s office in town lends toward a build.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {save.farm.loans.map((loan) => (
              <li key={loan.for} className="flex min-h-11 flex-col justify-center py-1" data-loan={loan.for}>
                <span className="text-[14px] font-semibold">{projectName(loan.for, names)}</span>
                <span className="text-[12px] text-ink-soft">{loanWords(save, loan)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/** The last seven nights' income as bars, oldest first, with tonight's upkeep and food as a line across them. */
function Nights({ save, upkeep }: { save: FarmSave; upkeep: number }) {
  const nights = save.farm.income
  if (nights.length === 0) return <p className="text-[13px] text-ink-soft" data-nights={0}>Each night’s income shows here after the bin pays.</p>
  const top = Math.max(upkeep, ...nights, 1)
  const label = `The last ${nights.length === 1 ? 'night' : `${nights.length} nights`}: ${nights.map(gold).join(', ')}, against ${gold(upkeep)} of upkeep and food`
  return (
    <figure className="m-0" data-nights={nights.length}>
      <div className="relative flex h-14 items-end gap-1 border-b border-hairline" role="img" aria-label={label}>
        {nights.map((night, i) => (
          <span key={i} className={`min-w-0 flex-1 rounded-t-sm ${night >= upkeep ? 'bg-accent' : 'bg-danger/60'}`} style={{ height: `${Math.max(2, (night / top) * 100)}%` }}
            title={gold(night)} data-night={night} />
        ))}
        {upkeep > 0 && <span aria-hidden className="absolute inset-x-0 border-t-2 border-dashed border-ink-soft" style={{ bottom: `${(upkeep / top) * 100}%` }} data-upkeep-line />}
      </div>
      <figcaption className="flex justify-between pt-0.5 text-[11px] text-ink-faint">
        <span>{nights.length > 1 ? `${nights.length} nights ago` : ''}</span>
        <span>{upkeep > 0 ? '- - upkeep and food' : ''}</span>
        <span>Last night</span>
      </figcaption>
    </figure>
  )
}
