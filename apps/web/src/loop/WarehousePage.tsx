// The Warehouse by stars: `/warehouse`. Families in tabs, each good with its five star counts, its price at each star
// today and "In demand" when it is; a tap opens its sheet (family, grade, what it refines into or from, and Ship all ·
// 1 action). With `?pick=bin` it's the bin's pick mode: a tap on a star puts one in the crate, All puts the good's every
// star in, and Ship · 1 action ships the crate, then goes back to the bin. Drawn on the kit's Chip, Sheet and Button:
// the kit's ShelfView holds one count and one price per item, and a good has five. Loaded on demand.
import { actionsLeft, binTotal, CARROT_GRADES, carrotGood, carrotGradeOf, crateWorth, discovered, MAX_SEED_TARGET, nextCarrotGrade, SEED_BATCH, SEED_KNOWLEDGE, seedOutput, type CarrotGrade, type CrateLine, type FarmSave } from '@farm/domain'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button, Chip, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { reserveCarrots, saveSeeds, shipPicked } from './actions'
import { Notes, useAct } from './FarmPanels'
import { easedWords, firstTab, goldWords, starWords, warehouseTabs, type GoodRow, type Shelf, type StarCell } from './goods-view'

export default function WarehousePage() {
  const save = useLoopSave()
  const [params] = useSearchParams()
  if (!save) return null
  return <Warehouse save={save} picking={params.get('pick') === 'bin'} />
}

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
const crateKey = (id: string, stars: number) => `${id}@${stars}`

/** The crate's lines from what's picked. */
function crateLines(crate: Readonly<Record<string, number>>): CrateLine[] {
  return Object.entries(crate).flatMap(([key, count]) => {
    const at = key.lastIndexOf('@')
    return count > 0 ? [{ id: key.slice(0, at), stars: Number(key.slice(at + 1)), count }] : []
  })
}

function Warehouse({ save, picking }: { save: FarmSave; picking: boolean }) {
  const leave = useLeave()
  const tabs = useMemo(() => warehouseTabs(save), [save])
  const [shelf, setShelf] = useState<Shelf>(() => firstTab(tabs, picking))
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [crate, setCrate] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const tab = tabs.find((t) => t.shelf === shelf) ?? tabs[0]!
  const rows = tabs.flatMap((t) => t.rows)
  const openRow = open === null ? undefined : rows.find((row) => row.id === open)
  const held = (id: string, stars: number) => rows.find((r) => r.id === id)?.cells[stars - 1]?.count ?? 0
  const pick = (id: string, stars: number) => setCrate((c) => {
    const key = crateKey(id, stars)
    return (c[key] ?? 0) < held(id, stars) ? { ...c, [key]: (c[key] ?? 0) + 1 } : c
  })
  const pickAll = (id: string) => setCrate((c) => ({ ...c, ...Object.fromEntries([1, 2, 3, 4, 5].map((s) => [crateKey(id, s), held(id, s)])) }))
  const lines = crateLines(crate)
  const picked = lines.reduce((n, l) => n + l.count, 0)
  const usesReserve = CARROT_GRADES.some((grade) => {
    const id = carrotGood(grade)
    const floor = save.farm.reserves?.[id] ?? 0
    const moving = lines.filter((line) => line.id === id).reduce((n, line) => n + line.count, 0)
    return floor > 0 && moving > 0 && moving > (rows.find((row) => row.id === id)?.total ?? 0) - floor
  })
  const worth = crateWorth(save, lines)
  const ship = (toShip: readonly CrateLine[], after: () => void) => {
    setBusy(true)
    setError(null)
    shipPicked(toShip).then(after, (err: unknown) => setError(errorWords(err))).finally(() => setBusy(false))
  }
  const shipAll = (row: GoodRow) => ship(row.cells.flatMap((c) => (c.count > 0 ? [{ id: row.id, stars: c.stars, count: c.count }] : [])), () => setOpen(null))
  const tonight = binTotal(save.bin, save.calendar.day, save.farm.market)
  const left = actionsLeft(save)
  return (
    <div className="absolute inset-0 flex flex-col" data-page="warehouse" data-pick={picking || undefined}>
      <PlaceHeader
        title={picking ? 'Ship to the bin' : 'Warehouse'}
        onBack={() => leave(picking ? '/?sheet=bin' : '/')}
        about={<><p>Everything the farm holds, by stars. A good sells for its price × its stars: ★1 ×1 up to ★5 ×2.</p><p>The season’s demand adds 20%. Pick goods for a crate: one action ships it, and the bin pays tonight.</p><p>Past 50 of one good in a night, each 50 more sells 10% lower, down to half, and it stays eased a few days.</p></>}
        words={{ back: picking ? 'Back to the bin' : 'Back to the farm', about: 'About the Warehouse' }}
      />
      <main className="@container min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-3 pb-6">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]" role="group" aria-label="Families">
            {tabs.map((t) => (
              <Chip key={t.shelf} selected={t.shelf === tab.shelf} className="min-h-11" onClick={() => setShelf(t.shelf)} data-shelf={t.shelf}>
                {t.label}
                {t.count > 0 && <span className="tabular-nums text-ink-faint">{t.count}</span>}
              </Chip>
            ))}
          </div>
          {!picking && tab.shelf === 'crops' && (
            <div className="flex flex-wrap items-center gap-2 text-[13px]" aria-label="Carrot discoveries">
              <span className="font-semibold">Carrot discoveries</span>
              {CARROT_GRADES.map((grade) => (
                <Button key={grade} variant="secondary" size="sm" className="min-h-11" data-carrot-discovery={grade} onClick={() => setOpen(carrotGood(grade))}>
                  G{grade} · {discovered(save, carrotGood(grade)) ? 'Discovered' : 'Undiscovered'}
                </Button>
              ))}
            </div>
          )}
          {tab.rows.length === 0 && <p className="rounded-md border border-hairline bg-panel p-4 text-center text-[14px] text-ink-soft">Nothing here yet.</p>}
          <ul className="grid gap-1.5 @xl:grid-cols-2" data-shelf-rows={tab.shelf}>
            {tab.rows.map((row) => (
              <li key={row.id}>
                <GoodLine row={row} picking={picking} crate={crate} onOpen={() => setOpen(row.id)} onPick={pick} onPickAll={pickAll} />
              </li>
            ))}
          </ul>
          {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
        </div>
      </main>
      {picking && (
        <div className="border-t border-hairline bg-panel/95 px-4 py-2" data-pick-bar>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-[14px]" data-crate={picked}>
              {picked > 0 ? <>Crate: <b>{picked}</b> · about {goldWords(worth)}</> : tonight > 0 ? <>In the bin: <b>about {goldWords(tonight)}</b> tonight</> : 'Tap a star to put one in the crate.'}
            </p>
            {picked > 0 && <Button variant="secondary" onClick={() => setCrate({})} data-action="clear-crate">Clear</Button>}
            <Button disabled={busy || picked === 0 || left === 0} onClick={() => ship(lines, () => {
              setCrate({})
              leave('/?sheet=bin')
            })} data-action="ship-crate">{usesReserve ? 'Ship with reserve' : 'Ship'} · 1 action</Button>
          </div>
        </div>
      )}
      <GoodSheet save={save} row={openRow} grade={open ? carrotGradeOf(open) : undefined} onClose={() => setOpen(null)} onShipAll={shipAll} busy={busy || left === 0} error={error} />
    </div>
  )
}

/** A good's five stars: its count at each and its price today. In pick mode each is a button that puts one in the
 * crate, its count what's left after the crate; otherwise they're read only. */
function StarCells({ row, crate, onPick }: { row: GoodRow; crate?: Readonly<Record<string, number>>; onPick?: (id: string, stars: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1" data-stars={row.id}>
      {row.cells.map((cell) => {
        const inCrate = crate?.[crateKey(row.id, cell.stars)] ?? 0
        const body = <CellBody cell={{ ...cell, count: cell.count - inCrate }} picked={inCrate} />
        const label = `${row.name} ${starWords(cell.stars)}: ${cell.count}${cell.price === null ? '' : `, ${goldWords(cell.price)} each`}`
        return onPick && row.sells ? (
          <button key={cell.stars} type="button" disabled={cell.count - inCrate === 0} onClick={() => onPick(row.id, cell.stars)} aria-label={`Put one in the crate: ${label}`}
            data-pick={`${row.id}@${cell.stars}`}
            className="relative flex min-h-12 flex-col items-center justify-center rounded-sm border border-hairline-strong bg-panel leading-tight shadow-1 disabled:opacity-40">
            {body}
          </button>
        ) : (
          <div key={cell.stars} aria-label={label} className={`flex min-h-12 flex-col items-center justify-center rounded-sm bg-sunken leading-tight ${cell.count === 0 ? 'opacity-45' : ''}`}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

function CellBody({ cell, picked = 0 }: { cell: StarCell; picked?: number }) {
  return (
    <>
      <span className="text-[11px] text-ink-soft">{starWords(cell.stars)}</span>
      <span className="font-display text-[15px] font-bold tabular-nums">{cell.count}</span>
      {cell.price !== null && <span className="text-[11px] tabular-nums text-ink-soft">{goldWords(cell.price)}</span>}
      {picked > 0 && <span className="absolute -top-1.5 -right-1 rounded-full bg-accent px-1 text-[10px] leading-4 font-bold text-accent-ink" data-picked={picked}>+{picked}</span>}
    </>
  )
}

function DemandTag() {
  return <span className="shrink-0 rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success" data-demand>In demand</span>
}
/** A flood's ease on a good's price: "Eased −20%". */
export function EasedTag({ percent }: { percent: number }) {
  return <span className="shrink-0 rounded-full bg-warning/15 px-1.5 text-[11px] font-semibold text-warning" data-eased={percent}>{easedWords(percent)}</span>
}

/** A good's row: its icon, name, total and demand over its five stars. */
function GoodLine({ row, picking, crate, onOpen, onPick, onPickAll }: {
  row: GoodRow; picking: boolean; crate: Readonly<Record<string, number>>; onOpen: () => void; onPick: (id: string, stars: number) => void; onPickAll: (id: string) => void
}) {
  const head = (
    <span className="flex min-h-9 items-center gap-2.5">
      <ItemIcon id={row.id} size={32} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{row.name}</span>
      {row.demand && <DemandTag />}
      {row.eased > 0 && <EasedTag percent={row.eased} />}
      <span className="font-display shrink-0 text-lg font-semibold tabular-nums" aria-label={`${row.total} held`}>{row.total}</span>
    </span>
  )
  if (!picking) {
    return (
      <button type="button" onClick={onOpen} data-item={row.id} className="w-full space-y-1.5 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-left shadow-1">
        {head}
        <StarCells row={row} />
      </button>
    )
  }
  return (
    <div className="space-y-1.5 rounded-sm border border-hairline bg-panel px-2 py-1.5 shadow-1" data-item={row.id}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">{head}</div>
        {row.sells && <Button variant="secondary" size="sm" onClick={() => onPickAll(row.id)} data-action="pick-all">All</Button>}
      </div>
      {row.sells ? <StarCells row={row} crate={crate} onPick={onPick} /> : <p className="text-[12px] text-ink-soft">{row.facts}</p>}
    </div>
  )
}

/** A good's sheet: its family, grade and form, what it refines into or from, its stars, and Ship all · 1 action. */
function GoodSheet({ save, row, grade, onClose, onShipAll, busy, error }: {
  save: FarmSave; row: GoodRow | undefined; grade: CarrotGrade | undefined; onClose: () => void; onShipAll: (row: GoodRow) => void; busy: boolean; error: string | null
}) {
  const reserved = row ? Math.min(row.total, save.farm.reserves?.[row.id] ?? 0) : 0
  return (
    <Sheet
      open={row !== undefined || grade !== undefined}
      onClose={onClose}
      title={grade ? `Carrot G${grade}` : row?.name}
      footer={row?.sells
        ? <Button className="w-full" disabled={busy} onClick={() => onShipAll(row)} data-action="ship-all">{reserved ? 'Ship all, including reserve' : 'Ship all'} · {goldWords(row.worth)} · 1 action</Button>
        : undefined}
    >
      {row && (
        <div className="space-y-3 pb-1" data-good={row.id}>
          <div className="flex items-center gap-3">
            <ItemIcon id={row.id} size={64} />
            <div className="min-w-0 space-y-0.5 text-[14px]">
              <p>{row.facts}</p>
              {row.pair && <p className="text-ink-soft">{row.pair}</p>}
              {row.demand && <p><DemandTag /> <span className="text-[12px] text-ink-soft">+20% this season</span></p>}
              {row.eased > 0 && <p><EasedTag percent={row.eased} /> <span className="text-[12px] text-ink-soft">A flood: back a step a night</span></p>}
            </div>
          </div>
          <StarCells row={row} />
          {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
      {grade && <CarrotSeedPanel key={grade} save={save} grade={grade} held={row?.total ?? 0} />}
    </Sheet>
  )
}

function CarrotSeedPanel({ save, grade, held }: { save: FarmSave; grade: CarrotGrade; held: number }) {
  const id = carrotGood(grade)
  const floor = save.farm.reserves?.[id] ?? 0
  const [reserve, setReserve] = useState(floor)
  const [count, setCount] = useState(1)
  const { note, error, busy, run } = useAct(id)
  const max = Math.min(SEED_BATCH, held)
  const next = nextCarrotGrade(grade)
  const canImprove = seedOutput(save, grade, true) !== undefined
  const takesReserve = count > held - floor
  const locked = busy || actionsLeft(save) === 0 || !Number.isInteger(count) || count < 1 || count > max
  const convert = (improve: boolean) => run(saveSeeds(grade, improve, count, takesReserve)
    .then(() => `Saved ${count} × Carrot G${improve ? next : grade} seed`))
  return (
    <div className="space-y-2 border-t border-hairline pt-2" aria-label="Carrot seed and reserve">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2 text-[14px]">Reserve G{grade}
          <input type="number" min={0} max={MAX_SEED_TARGET} value={reserve} onChange={(e) => setReserve(Number(e.currentTarget.value))}
            className="min-h-11 w-16 rounded-sm border border-hairline-strong bg-panel px-2" />
        </label>
        <Button variant="secondary" size="sm" disabled={busy || reserve === floor || !Number.isInteger(reserve) || reserve < 0 || reserve > MAX_SEED_TARGET}
          onClick={() => run(reserveCarrots(grade, reserve).then(() => 'Reserve saved'))}>Set reserve</Button>
      </div>
      {held > 0 ? (
        <>
          <label className="flex min-h-11 items-center gap-2 text-[14px]">Carrots for seed
            <input type="number" min={1} max={max} value={count} onChange={(e) => setCount(Number(e.currentTarget.value))}
              className="min-h-11 w-16 rounded-sm border border-hairline-strong bg-panel px-2" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" size="sm" disabled={locked} onClick={() => convert(false)}>{takesReserve ? 'Use reserve for' : 'Save'} G{grade} seed · 1</Button>
            {next && <Button size="sm" disabled={locked || !canImprove} onClick={() => convert(true)}>{takesReserve ? 'Use reserve to reach' : 'Improve to'} G{next} seed · 1</Button>}
          </div>
          {grade !== 3 && !canImprove && <p className="text-[12px] text-ink-soft">Improve at {SEED_KNOWLEDGE[grade]} crop points · {save.crops.carrot ?? 0} now</p>}
        </>
      ) : <p className="text-[13px] text-ink-soft">No G{grade} carrots held.</p>}
      {!discovered(save, id) && (
        <p className="text-[12px] text-ink-soft">
          {grade === 1 ? 'Spring · Grow Carrot from the shop’s seed.'
            : `Spring · Plant G${grade} seed, or assign Harvesting ${grade === 2 ? 4 : 7} to upgrade G${grade - 1}.`}
        </p>
      )}
      <Notes note={note} error={error} />
    </div>
  )
}
