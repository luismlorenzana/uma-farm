// The Dorm's page: `/dorm`. Beds used of beds, the
// next level with its cost and Farm Rank (**Upgrade · 1,000g**, its beds tomorrow), who's home and who's away on her
// off-season, and **Swap**: pick one home with nothing to do, then one away; she arrives tomorrow, and a swap can be
// called off until then. The pickers are uma-kit's, over the roster's rows. It's the Dorm for 20: eight levels, and a
// level that brings an arrival says so ("Level 4 · 9 beds · someone new arrives"), never who. Loaded on demand.
import { atHome, arriving, bedsAt, dormBought, DORM_LEVELS, leaving, nextDorm, swapBlock, type FarmSave } from '@farm/domain'
import { FaceTile, UmaPicker } from '@luismlorenzana/uma-kit/album'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { buyDormLevel, cancelDormSwap, swapUmas } from './actions'
import { goldWords } from './goods-view'
import { umaSheet } from './summary-words'
import { cardLines, UMA_FACETS, umaRows, type LoopUmaRow } from './roster-view'
import { useTalents } from './talents'
import { umaBadges } from './UmaMarks'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

export default function DormPage() {
  const save = useLoopSave()
  if (!save) return null
  return <Dorm save={save} />
}

function About() {
  return (
    <>
      <p>Beds cap who lives and works on the farm at once. Everyone else on the roster is away on her off-season: she keeps her ranks, and earns nothing.</p>
      <p>Upgrade the Dorm for more beds. You pay now; the beds come the next morning. Higher levels need a higher Farm Rank.</p>
      <p>Swap an Uma with nothing to do for one away, free, as often as you like. She leaves and the other arrives the next morning.</p>
      <p>Some levels bring someone new to the farm the morning they’re ready.</p>
    </>
  )
}

interface SwapRow extends LoopUmaRow {
  note: string
  block: string | null
}

function Dorm({ save }: { save: FarmSave }) {
  const leave = useLeave()
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const talents = useTalents()
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [swap, setSwap] = useState<{ step: 'out' } | { step: 'in'; out: string } | null>(null)
  const run = (action: Promise<unknown>, done?: string) => {
    setError(null)
    setNote(null)
    action.then(() => done && setNote(done), (err: unknown) => setError(errorWords(err)))
  }
  // A spouse in her house is on the farm, not away.
  const away = Object.keys(save.roster).filter((id) => !atHome(save, id))
  const rows = useMemo(() => umaRows(save, Object.keys(save.roster), view?.album ?? new Map(), talents.table), [save, view, talents.table])
  const byId = new Map(rows.map((row) => [row.id, row]))
  const status = (id: string): string => {
    if (leaving(save, id)) return 'Leaves tomorrow'
    if (arriving(save, id)) return 'Arrives tomorrow'
    if (!save.dorm.home.includes(id)) return 'Away'
    return swapBlock(save, id) ?? 'Idle'
  }
  const swapRows = (ids: readonly string[]): SwapRow[] => ids.flatMap((id) => {
    const row = byId.get(id)
    if (!row) return []
    const block = save.dorm.home.includes(id) ? swapBlock(save, id) : arriving(save, id) ? 'Arrives tomorrow' : null
    return [{ ...row, note: `${status(id)} · ${cardLines(row, null)[0]}`, block }]
  })
  const story = useStory()
  const bought = dormBought(save)
  const next = nextDorm(save)
  const beds = bedsAt(save.dorm.level)
  /** A level whose arrival hasn't come yet brings someone new (never who). */
  const bringsSomeone = (level: number): boolean => !!story?.cast.umas.some((u) => u.arrives?.kind === 'beds' && u.arrives.dormLevel === level && !save.roster[u.characterId])
  const arrivalWords = (level: number): string => (bringsSomeone(level) ? ' · someone new arrives' : '')
  const nameOf = (id: string) => view?.album.get(id)?.name ?? 'Uma'
  const canSwap = save.dorm.home.some((id) => swapBlock(save, id) === null) && away.some((id) => !arriving(save, id))
  return (
    <div className="absolute inset-0 flex flex-col" data-page="dorm">
      <PlaceHeader title="Dorm" onBack={() => leave('/')} about={<About />} words={{ back: 'Back to the farm', about: 'About the Dorm' }} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-3 pb-24">
          {(note || error) && (
            <p role="status" className={`rounded-md px-3 py-2 text-[14px] font-semibold ${error ? 'bg-danger/10 text-danger' : 'bg-success/15 text-success'}`} data-dorm-note>
              {error ?? note}
            </p>
          )}
          <section className="space-y-2 rounded-md border border-hairline bg-panel p-3" data-dorm-level={save.dorm.level} data-dorm-bought={bought}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-[17px] font-bold">Level {save.dorm.level}</h2>
              <p className="text-[14px] tabular-nums" data-beds>{save.dorm.home.length} of {beds} beds</p>
            </div>
            {bought > save.dorm.level && <p className="text-[13px] font-semibold text-success" data-upgrade-tomorrow>Level {bought} tomorrow · {bedsAt(bought)} beds{arrivalWords(bought)}</p>}
            {next ? (
              <div className="flex items-center justify-between gap-2 border-t border-hairline pt-2">
                <span className="min-w-0 text-[13px] text-ink-soft" data-next-level={next.level}>Level {next.level} · {next.beds} beds{arrivalWords(next.level)}{next.open ? '' : ` · Farm Rank ${next.farmRank}`}</span>
                <Button size="sm" className="shrink-0 whitespace-nowrap" disabled={!next.open || save.gold < next.cost} onClick={() => run(buyDormLevel(), `Level ${next.level} tomorrow`)} data-action="upgrade">
                  Upgrade · {goldWords(next.cost)}
                </Button>
              </div>
            ) : <p className="border-t border-hairline pt-2 text-[13px] text-ink-soft">The Dorm is at its top level.</p>}
            {next && next.open && save.gold < next.cost && <p className="text-[12px] text-ink-soft">Need {goldWords(next.cost - save.gold)} more</p>}
          </section>
          <section aria-label="The Dorm's levels" className="space-y-1" data-dorm-ladder>
            <h3 className="text-micro">Levels</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline">
              {DORM_LEVELS.map((l) => (
                <li key={l.level} className={`flex min-h-11 items-center gap-2 px-3 text-[13px] ${l.level <= bought ? 'text-ink' : 'text-ink-soft'}`} data-ladder-level={l.level}
                  data-brings={bringsSomeone(l.level) || undefined}>
                  <span className="w-14 shrink-0 font-semibold">Level {l.level}</span>
                  <span className="min-w-0 flex-1 truncate">{l.beds} beds{arrivalWords(l.level)}</span>
                  <span className="shrink-0 tabular-nums">{l.level <= bought ? (l.level <= save.dorm.level ? 'Built' : 'Tomorrow') : `${goldWords(l.cost)} · FR ${l.farmRank}`}</span>
                </li>
              ))}
            </ul>
          </section>
          {save.dorm.swaps.length > 0 && (
            <section aria-label="Swaps tomorrow" className="space-y-1">
              <h3 className="text-micro">Tomorrow</h3>
              <ul className="divide-y divide-hairline rounded-md border border-hairline">
                {save.dorm.swaps.map((s) => (
                  <li key={s.out} className="flex min-h-12 items-center gap-2 px-3" data-swap={`${s.out}:${s.in}`}>
                    <FaceTile outfitId={s.out} size={32} label={nameOf(s.out)} round />
                    <span aria-hidden>→</span>
                    <FaceTile outfitId={s.in} size={32} label={nameOf(s.in)} round />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{nameOf(s.in)} arrives tomorrow</span>
                    <Button variant="tertiary" size="sm" onClick={() => run(cancelDormSwap(s.out), 'Swap called off')} data-action="cancel-swap">Call off</Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <UmaList title={`On the farm · ${save.dorm.home.length}`} ids={save.dorm.home} nameOf={nameOf} status={status} rows={byId} where="home" />
          <Button className="w-full" variant="secondary" disabled={!canSwap} onClick={() => setSwap({ step: 'out' })} data-action="swap">
            {away.length === 0 ? 'Swap · nobody away' : 'Swap'}
          </Button>
          <UmaList title={`Away · ${away.length}`} ids={away} nameOf={nameOf} status={status} rows={byId} where="away" empty="Nobody away." />
        </div>
      </main>
      <UmaPicker<SwapRow>
        open={swap?.step === 'out'}
        rows={swapRows(save.dorm.home)}
        title="Who goes away?"
        facets={UMA_FACETS}
        disabled={(row) => row.block}
        describe={(row) => row.note}
        renderBadges={umaBadges}
        onPick={(ids) => ids[0] && setSwap({ step: 'in', out: ids[0] })}
        onClose={() => setSwap((now) => (now?.step === 'out' ? null : now))}
      />
      <UmaPicker<SwapRow>
        open={swap?.step === 'in'}
        rows={swapRows(away)}
        title={swap?.step === 'in' ? `Who comes home for ${nameOf(swap.out)}?` : 'Who comes home?'}
        facets={UMA_FACETS}
        disabled={(row) => row.block}
        describe={(row) => row.note}
        renderBadges={umaBadges}
        onPick={(ids) => {
          const out = swap?.step === 'in' ? swap.out : null
          if (out && ids[0]) run(swapUmas(out, ids[0]), `${nameOf(ids[0])} arrives tomorrow`)
          setSwap(null)
        }}
        onClose={() => setSwap((now) => (now?.step === 'in' ? null : now))}
      />
    </div>
  )
}

/** Who's home, or who's away: a row each, her face, name, best rank and what she's doing. */
function UmaList({ title, ids, nameOf, status, rows, where, empty }: {
  title: string
  ids: readonly string[]
  nameOf: (id: string) => string
  status: (id: string) => string
  rows: ReadonlyMap<string, LoopUmaRow>
  where: 'home' | 'away'
  empty?: string
}) {
  return (
    <section aria-label={title} className="space-y-1" data-dorm-list={where}>
      <h3 className="text-micro">{title}</h3>
      {ids.length === 0 ? <p className="text-[13px] text-ink-soft">{empty ?? 'Nobody.'}</p> : (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {ids.map((id) => {
            const row = rows.get(id)
            return (
              <li key={id}>
                <Link to={umaSheet(id)} state={{ back: true }} className="flex min-h-14 items-center gap-2.5 px-3 py-1" data-dorm-uma={id} data-status={status(id)}>
                  <FaceTile outfitId={id} size={40} label={nameOf(id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{nameOf(id)}</span>
                    <span className="block truncate text-[12px] text-ink-soft">{row ? cardLines(row, null)[0] : ''}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-ink-soft">{status(id)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
