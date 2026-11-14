// The Warehouse by stars: `/warehouse`. Families in tabs, each good with its five star counts, its price at each star
// today and "In demand" when it is; a tap opens its sheet (family, grade, what it refines into or from, and Ship all ·
// 1 action). With `?pick=bin` it's the bin's pick mode: a tap on a star puts one in the crate, All puts the good's every
// star in, and Ship · 1 action ships the crate, then goes back to the bin. Drawn on the kit's Chip, Sheet and Button:
// the kit's ShelfView holds one count and one price per item, and a good has five. Loaded on demand.
import { actionsLeft, binTotal, priceOf, type CrateLine, type FarmSave } from '@farm/domain'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button, Chip, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { shipPicked } from './actions'
import { firstTab, goldWords, starWords, warehouseTabs, type GoodRow, type Shelf, type StarCell } from './goods-view'

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
  const worth = lines.reduce((n, l) => n + priceOf(l.id, l.stars, save.calendar.day) * l.count, 0)
  const ship = (toShip: readonly CrateLine[], after: () => void) => {
    setBusy(true)
    setError(null)
    shipPicked(toShip).then(after, (err: unknown) => setError(errorWords(err))).finally(() => setBusy(false))
  }
  const shipAll = (row: GoodRow) => ship(row.cells.flatMap((c) => (c.count > 0 ? [{ id: row.id, stars: c.stars, count: c.count }] : [])), () => setOpen(null))
  const tonight = binTotal(save.bin, save.calendar.day)
  const left = actionsLeft(save)
  return (
    <div className="absolute inset-0 flex flex-col" data-page="warehouse" data-pick={picking || undefined}>
      <PlaceHeader
        title={picking ? 'Ship to the bin' : 'Warehouse'}
        onBack={() => leave(picking ? '/?sheet=bin' : '/')}
        about={<><p>Everything the farm holds, by stars. A good sells for its price × its stars: ★1 ×1 up to ★5 ×2.</p><p>The season’s demand adds 20%. Pick goods for a crate: one action ships it, and the bin pays tonight.</p></>}
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
            })} data-action="ship-crate">Ship · 1 action</Button>
          </div>
        </div>
      )}
      <GoodSheet row={openRow} onClose={() => setOpen(null)} onShipAll={shipAll} busy={busy || left === 0} error={error} />
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

/** A good's row: its icon, name, total and demand over its five stars. */
function GoodLine({ row, picking, crate, onOpen, onPick, onPickAll }: {
  row: GoodRow; picking: boolean; crate: Readonly<Record<string, number>>; onOpen: () => void; onPick: (id: string, stars: number) => void; onPickAll: (id: string) => void
}) {
  const head = (
    <span className="flex min-h-9 items-center gap-2.5">
      <ItemIcon id={row.id} size={32} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{row.name}</span>
      {row.demand && <DemandTag />}
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
function GoodSheet({ row, onClose, onShipAll, busy, error }: {
  row: GoodRow | undefined; onClose: () => void; onShipAll: (row: GoodRow) => void; busy: boolean; error: string | null
}) {
  return (
    <Sheet
      open={row !== undefined}
      onClose={onClose}
      title={row?.name}
      footer={row?.sells
        ? <Button className="w-full" disabled={busy} onClick={() => onShipAll(row)} data-action="ship-all">Ship all · {goldWords(row.worth)} · 1 action</Button>
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
            </div>
          </div>
          <StarCells row={row} />
          {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </Sheet>
  )
}
