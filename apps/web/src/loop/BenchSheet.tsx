// The ring bench, `?sheet=bench` from the Forge's quick look: one row a grade you can make now with the three goods it would take (a tap on one swaps it for another of the
// grade's goods), "→ Iron Ring"; the recipe greyed until the Smelter and the Cutter stand; her bonus once married; and **Make an Iron
// Ring · 1 a day** in the thumb zone. A made ring is ★1 in the Warehouse; the bench says "One ring a day." until tomorrow.
// Also the Forge's quick look once the bench stands (`BenchPeek`). Loaded on demand.
import { benchOpen, BENCH_WORDS, goodCount, goodName, ringName, sceneSpeaker, starterRingLock, STARTER_RING_GOOD, STARTER_RING_LOGS, type BenchInput, type SaveV4 } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { makeRingOnce, makeStarterRingOnce } from './bench-actions'
import { BENCH_TEXT, benchRows, forgePairWords, forgeRecipeWords, makeWords, pickWords, swapOptions, type BenchRow } from './bench-view'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { PersonBust } from '../dialogue/Bust'

const RING = '#b58a2a'

/** `?sheet=bench`: the bench over the farm. Closed, it closes itself. */
export default function BenchSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const close = () => leave(withParam(location, 'sheet', null))
  const shut = !!save && !benchOpen(save)
  useEffect(() => {
    if (shut) close()
  }, [shut]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || !benchOpen(save)) return null
  return <Bench save={save} onClose={close} />
}

function Bench({ save, onClose }: { save: SaveV4; onClose: () => void }) {
  const [swapped, setSwapped] = useState<Record<number, BenchInput[]>>({})
  const [open, setOpen] = useState<{ grade: number; slot: number } | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ring: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rows = benchRows(save, swapped)
  const grade = chosen !== null && rows.some((r) => r.grade === chosen) ? chosen : rows[0]?.grade ?? null
  const row = rows.find((r) => r.grade === grade) ?? null
  const madeToday = save.today.ring > 0
  // The town's smith, who keeps the bench: her name from master data, the role's words without it.
  const master = useMaster()
  const story = useStory()
  const smith = story ? sceneSpeaker(story, save, 'ida-stone') : null
  const smithName = smith ? namer(master.status === 'ready' ? master.view : null, story)(smith) : 'Self-service'
  const forge = forgeRecipeWords(save)
  const starterLock = starterRingLock(save)
  const make = async (starter = false) => {
    if (busy || (!starter && !row) || (starter && starterLock)) return
    setBusy(true)
    setError(null)
    try {
      const ring = starter ? await makeStarterRingOnce() : await makeRingOnce(row!.pick)
      setNote({ ring })
      setSwapped({})
      setOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t work. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title={BENCH_TEXT.title}
      label="The ring bench"
      footer={
        <div className="space-y-1.5">
          {error && <p className="text-[13px] text-danger" data-bench-error>{error}</p>}
          {madeToday
            ? <p className="text-center text-[14px] font-semibold text-ink-soft" data-bench-made={save.today.ring}>{BENCH_WORDS.today} {ringName(save.today.ring)} made today ✓</p>
            : row && <Button className="w-full" disabled={busy} onClick={() => void make()} data-action="make-ring">{makeWords(row.grade)}</Button>}
        </div>
      }
    >
      <div className="space-y-3 pb-2" data-bench>
        <div className="flex items-center gap-3">
          {smith && <PersonBust who={smith} name={smithName} size={60} />}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold" data-smith>{smithName}</p>
            <p className="text-[13px] text-ink-soft">{BENCH_TEXT.rule}</p>
          </div>
          <GuideButton topic="rings" title="The ring bench" label="About the ring bench">
            {BENCH_TEXT.help.map((p) => <p key={p}>{p}</p>)}
          </GuideButton>
        </div>
        {note && (
          <p className="flex items-center gap-2 rounded-md bg-sunken px-3 py-2 text-[14px] font-semibold" data-bench-note={note.ring}>
            <ItemIcon id={note.ring} size={28} /> {goodName(note.ring)} · in the Warehouse, ★1
          </p>
        )}
        {!madeToday && <section className="space-y-1 rounded-md border border-hairline p-3" aria-label="Starter ring">
          <p className="font-semibold">Copper Ring from the Woods</p>
          <p className="text-[13px] text-ink-soft">Pine Logs · {Math.min(goodCount(save.items, STARTER_RING_GOOD), STARTER_RING_LOGS)}/{STARTER_RING_LOGS}. Any stars. No gold.</p>
          {starterLock
            ? <Link to="/?peek=forest" state={{ back: true }} className="flex min-h-11 items-center font-semibold text-accent-strong">{starterLock} ›</Link>
            : <Button variant="secondary" disabled={busy} onClick={() => void make(true)} data-action="starter-ring">Make a Copper Ring</Button>}
        </section>}
        {rows.length === 0 && starterLock && !note && <p className="text-[14px] text-ink-soft" data-bench-none>{BENCH_TEXT.none}</p>}
        {rows.length > 0 && (
          <ul className="space-y-2" data-bench-rows={rows.length}>
            {rows.map((r) => (
              <RowView key={r.grade} save={save} row={r} chosen={r.grade === grade} open={open?.grade === r.grade ? open.slot : null}
                onChoose={() => setChosen(r.grade)} onOpen={(slot) => { setChosen(r.grade); setOpen(open?.grade === r.grade && open.slot === slot ? null : { grade: r.grade, slot }) }}
                onSwap={(slot, input) => { setSwapped({ ...swapped, [r.grade]: r.pick.map((p, i) => (i === slot ? input : p)) }); setOpen(null) }} />
            ))}
          </ul>
        )}
        <p className={`text-[13px] ${forge.open ? 'text-ink' : 'text-ink-faint'}`} data-forge-recipe={forge.open ? 'open' : 'greyed'}>
          {forge.text}{forge.open && row ? ` (G${row.grade}: ${forgePairWords(row.grade)})` : ''}
        </p>
        <div className="rounded-md border border-hairline p-3 text-[13px]" data-bench-bonus>
          <p className="font-semibold" style={{ color: RING }}>{BENCH_TEXT.bonus}</p>
          <p className="text-ink-soft">{BENCH_TEXT.merge}</p>
        </div>
      </div>
    </Sheet>
  )
}

/** One grade's row: its three (each a tap to swap), "→ Iron Ring", and the swap list under it while one is open. */
function RowView({ save, row, chosen, open, onChoose, onOpen, onSwap }: {
  save: SaveV4; row: BenchRow; chosen: boolean; open: number | null; onChoose: () => void; onOpen: (slot: number) => void; onSwap: (slot: number, input: BenchInput) => void
}) {
  return (
    <li className={`rounded-md border-2 ${chosen ? '' : 'border-hairline'}`} style={chosen ? { borderColor: RING } : undefined} data-bench-row={row.grade} data-chosen={chosen || undefined}>
      <div className="flex items-center gap-2 p-2">
        <div className="flex gap-1">
          {row.pick.map((p, i) => (
            <button key={i} type="button" onClick={() => onOpen(i)} aria-label={`${pickWords([p])} ★${p.stars}, tap to swap`} aria-expanded={open === i}
              className={`relative grid size-11 place-items-center rounded-sm bg-sunken ${open === i ? 'ring-2 ring-accent' : ''}`} data-slot={i} data-input={`${p.id}@${p.stars}`}>
              <ItemIcon id={p.id} size={28} />
              {p.stars > 1 && <span className="absolute right-0 bottom-0 rounded-full bg-panel px-0.5 text-[10px] font-bold">★{p.stars}</span>}
            </button>
          ))}
        </div>
        <button type="button" onClick={onChoose} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" data-action="choose-row">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] text-ink-soft">{pickWords(row.pick)} (G{row.grade})</span>
            <span className="block text-[14px] font-semibold">→ {row.name}</span>
            <span className="block text-[12px] text-ink-faint">{row.bonus}</span>
          </span>
          <ItemIcon id={row.ring} size={32} />
        </button>
      </div>
      {open !== null && (
        <ul className="divide-y divide-hairline border-t border-hairline" data-swap={open}>
          {swapOptions(save, row.grade, row.pick, open).map((s) => (
            <li key={`${s.id}@${s.stars}`}>
              <button type="button" onClick={() => onSwap(open, { id: s.id, stars: s.stars })} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-[14px]" data-option={`${s.id}@${s.stars}`}>
                <ItemIcon id={s.id} size={24} />
                <span className="min-w-0 flex-1 truncate">{pickWords([s])} ★{s.stars}</span>
                <span className="shrink-0 text-[12px] text-ink-soft tabular-nums">{s.left} left · {s.value}g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** The Forge's quick look once the bench stands: "Ring bench · one ring a day" and the way in. */
export function BenchPeek({ save }: { save: SaveV4 }) {
  const made = save.today.ring > 0
  return (
    <div className="space-y-3 p-4" data-peek="forge" data-bench-peek>
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        <UiMark mark="farm/ring-bench" scale={2} fallback={<span aria-hidden>◎</span>} /> Ring bench · one ring a day
      </p>
      <p className="text-[14px] text-ink-soft">{made ? `${ringName(save.today.ring)} made today ✓` : 'Three refined goods of one grade make a ring of that grade.'}</p>
      <Link to="/?sheet=bench" className="font-display grid min-h-12 place-items-center rounded-md text-[16px] font-bold text-white"
        style={{ background: RING }} data-action="open-bench">
        {made ? 'See the bench ›' : 'Make a ring ›'}
      </Link>
    </div>
  )
}
