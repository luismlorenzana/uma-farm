// The ring bench (F53 decisions 3 and 5; romance spec RM38's mockup), `?sheet=bench` from the Forge's quick look on a v4
// farm: one row a grade you can make now with the three goods it would take (a tap on one swaps it for another of the
// grade's goods), "→ Iron Ring"; CS25's recipe greyed "Opens with chapter 3"; her bonus once married; and **Make an Iron
// Ring · 1 a day** in the thumb zone. A made ring is ★1 in the Warehouse; the bench says "One ring a day." until tomorrow.
// Also the Forge's quick look on v4 once the bench stands (`BenchPeek`). Loaded on demand, the romance build only.
import { benchOpen, BENCH_WORDS, goodName, ringName, type BenchInput, type SaveV4 } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { makeRingOnce } from './bench-actions'
import { BENCH_TEXT, benchRows, forgePairWords, forgeRecipeWords, makeWords, pickWords, swapOptions, type BenchRow } from './bench-view'
import { CastBust } from './ScenePlayer'

const RING = '#b58a2a'

/** `?sheet=bench`: the bench over the farm. Closed, or on v3, it closes itself. */
export default function BenchSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const close = () => leave(withParam(location, 'sheet', null))
  const shut = !!save && (save.version !== 4 || !benchOpen(save))
  useEffect(() => {
    if (shut) close()
  }, [shut]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || save.version !== 4 || !benchOpen(save)) return null
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
  const forge = forgeRecipeWords(save.farm.chapter)
  const make = async () => {
    if (!row || busy) return
    setBusy(true)
    setError(null)
    try {
      const ring = await makeRingOnce(row.pick)
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
            : <Button className="w-full" disabled={!row || busy} onClick={() => void make()} data-action="make-ring">{row ? makeWords(row.grade) : 'Nothing to make yet'}</Button>}
        </div>
      }
    >
      <div className="space-y-3 pb-2" data-bench>
        <div className="flex items-center gap-3">
          <CastBust id="ida-stone" size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">Ida Stone</p>
            <p className="text-[13px] text-ink-soft">{BENCH_TEXT.rule}</p>
          </div>
          <HelpButton title="The ring bench" label="About the ring bench">
            {BENCH_TEXT.help.map((p) => <p key={p}>{p}</p>)}
          </HelpButton>
        </div>
        {note && (
          <p className="flex items-center gap-2 rounded-md bg-sunken px-3 py-2 text-[14px] font-semibold" data-bench-note={note.ring}>
            <ItemIcon id={note.ring} size={28} /> {goodName(note.ring)} · in the Warehouse, ★1
          </p>
        )}
        {rows.length === 0 && !note && <p className="text-[14px] text-ink-soft" data-bench-none>{BENCH_TEXT.none}</p>}
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

/** The Forge's quick look on v4 once the bench stands (decision 3): "Ring bench · one ring a day" and the way in. */
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
