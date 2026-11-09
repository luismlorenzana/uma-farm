// The Warehouse by stars (F19 decision 9): `/warehouse` in the loop's build. Families in tabs, each good with its five
// star counts, its price at each star today and "In demand" when it is; a tap opens its sheet (family, grade, what it
// refines into or from, and Ship). With `?pick=bin` it's the bin's pick mode (decision 8): a tap on a star ships one,
// Ship all ships the good's every star, and Done goes back to the bin. Drawn on the kit's Chip, Sheet and Button: the
// kit's ShelfView holds one count and one price per item, and a good has five. Loaded on demand, loop's build only.
import { binTotal, type SaveV3 } from '@farm/domain'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button, Chip, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { shipEvery, shipGood } from './actions'
import { firstTab, goldWords, starWords, warehouseTabs, type GoodRow, type Shelf, type StarCell } from './goods-view'

export default function WarehousePage() {
  const save = useLoopSave()
  const [params] = useSearchParams()
  if (!save) return null
  return <Warehouse save={save} picking={params.get('pick') === 'bin'} />
}

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

function Warehouse({ save, picking }: { save: SaveV3; picking: boolean }) {
  const leave = useLeave()
  const tabs = useMemo(() => warehouseTabs(save), [save])
  const [shelf, setShelf] = useState<Shelf>(() => firstTab(tabs, picking))
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tab = tabs.find((t) => t.shelf === shelf) ?? tabs[0]!
  const openRow = open === null ? undefined : tabs.flatMap((t) => t.rows).find((row) => row.id === open)
  const run = (action: Promise<unknown>) => {
    setError(null)
    action.catch((err: unknown) => setError(errorWords(err)))
  }
  const ship = (id: string, stars: number) => run(shipGood(id, stars))
  const shipAll = (id: string) => run(shipEvery(id))
  const tonight = binTotal(save.bin, save.calendar.day)
  return (
    <div className="absolute inset-0 flex flex-col" data-page="warehouse" data-pick={picking || undefined}>
      <PlaceHeader
        title={picking ? 'Ship to the bin' : 'Warehouse'}
        onBack={() => leave(picking ? '/?sheet=bin' : '/')}
        about={<><p>Everything the farm holds, by stars. A good sells for its price × its stars: ★1 ×1 up to ★5 ×2.</p><p>The season’s demand adds 20%. Tap a good to ship it to the bin, which pays tonight.</p></>}
        words={{ back: picking ? 'Back to the bin' : 'Back to the farm', about: 'About the Warehouse' }}
      />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-3 pb-24">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]" role="group" aria-label="Families">
            {tabs.map((t) => (
              <Chip key={t.shelf} selected={t.shelf === tab.shelf} className="min-h-11" onClick={() => setShelf(t.shelf)} data-shelf={t.shelf}>
                {t.label}
                {t.count > 0 && <span className="tabular-nums text-ink-faint">{t.count}</span>}
              </Chip>
            ))}
          </div>
          {tab.rows.length === 0 && <p className="rounded-md border border-hairline bg-panel p-4 text-center text-[14px] text-ink-soft">Nothing here yet.</p>}
          <ul className="space-y-1.5" data-shelf-rows={tab.shelf}>
            {tab.rows.map((row) => (
              <li key={row.id}>
                <GoodLine row={row} picking={picking} onOpen={() => setOpen(row.id)} onShip={ship} onShipAll={shipAll} />
              </li>
            ))}
          </ul>
          {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
        </div>
      </main>
      {picking && (
        // The bottom bar's raised End the day disc stands above the bar, so the pick bar keeps clear of it.
        <div className="border-t border-hairline bg-panel/95 px-4 pt-2 pb-7" data-pick-bar>
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-[14px]" data-estimate={tonight}>
              {tonight > 0 ? <>In the bin: <b>about {goldWords(tonight)}</b> tonight</> : 'Tap a star to ship one.'}
            </p>
            <Button onClick={() => leave('/?sheet=bin')} data-action="done">Done</Button>
          </div>
        </div>
      )}
      <GoodSheet row={openRow} onClose={() => setOpen(null)} onShip={ship} onShipAll={shipAll} error={error} />
    </div>
  )
}

/** A good's five stars: its count at each and its price today. In pick mode (or its sheet) each is a button that ships
 * one; otherwise they're read only. */
function StarCells({ row, onShip }: { row: GoodRow; onShip?: (id: string, stars: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1" data-stars={row.id}>
      {row.cells.map((cell) => {
        const body = <CellBody cell={cell} />
        const label = `${row.name} ${starWords(cell.stars)}: ${cell.count}${cell.price === null ? '' : `, ${goldWords(cell.price)} each`}`
        return onShip && row.sells ? (
          <button key={cell.stars} type="button" disabled={cell.count === 0} onClick={() => onShip(row.id, cell.stars)} aria-label={`Ship one: ${label}`}
            data-ship={`${row.id}@${cell.stars}`}
            className="flex min-h-12 flex-col items-center justify-center rounded-sm border border-hairline-strong bg-panel leading-tight shadow-1 disabled:opacity-40">
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

function CellBody({ cell }: { cell: StarCell }) {
  return (
    <>
      <span className="text-[11px] text-ink-soft">{starWords(cell.stars)}</span>
      <span className="font-display text-[15px] font-bold tabular-nums">{cell.count}</span>
      {cell.price !== null && <span className="text-[11px] tabular-nums text-ink-soft">{goldWords(cell.price)}</span>}
    </>
  )
}

function DemandTag() {
  return <span className="shrink-0 rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success" data-demand>In demand</span>
}

/** A good's row: its icon, name, total and demand over its five stars. */
function GoodLine({ row, picking, onOpen, onShip, onShipAll }: {
  row: GoodRow; picking: boolean; onOpen: () => void; onShip: (id: string, stars: number) => void; onShipAll: (id: string) => void
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
        {row.sells && <Button variant="secondary" size="sm" onClick={() => onShipAll(row.id)} data-action="ship-all">Ship all</Button>}
      </div>
      {row.sells ? <StarCells row={row} onShip={onShip} /> : <p className="text-[12px] text-ink-soft">{row.facts}</p>}
    </div>
  )
}

/** A good's sheet: its family, grade and form, what it refines into or from, its stars, and Ship. */
function GoodSheet({ row, onClose, onShip, onShipAll, error }: {
  row: GoodRow | undefined; onClose: () => void; onShip: (id: string, stars: number) => void; onShipAll: (id: string) => void; error: string | null
}) {
  return (
    <Sheet
      open={row !== undefined}
      onClose={onClose}
      title={row?.name}
      footer={row?.sells
        ? <Button className="w-full" onClick={() => onShipAll(row.id)} data-action="ship-all">Ship all · {goldWords(row.worth)}</Button>
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
          {row.sells && <p className="text-micro">Ship: tap a star to ship one</p>}
          <StarCells row={row} onShip={row.sells ? onShip : undefined} />
          {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </Sheet>
  )
}
