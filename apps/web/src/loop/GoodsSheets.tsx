// The bin's and the shop's sheets, drawn within the kit's `Sheet`. The bin (`?sheet=bin`,
// from the shipping bin on the map and the gold chip): today's lines with Take back (free), the night's estimate, and
// Ship, which opens the Warehouse to pick a crate from: one action ships it. The shop (`?sheet=shop`), in town: its
// lines on the kit's ExchangeRows, bought with gold once you've gone into town today; before that, Go into town.
import { actionsLeft, shopLines, type FarmSave, type ShopLine } from '@farm/domain'
import { ExchangeRows } from '@luismlorenzana/uma-kit/places'
import { Button, HelpButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { GoldMark } from '../shell/Gold'
import { buyLine, intoTown, takeBackLine } from './actions'
import { binView, goldWords, saleWords, shopRows } from './goods-view'

/** The Warehouse to pick a crate from: one action ships it. */
export const PICK_PATH = '/warehouse?pick=bin'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

/** The shipping bin. */
export function BinSheet({ onClose }: { onClose: () => void }) {
  const save = useLoopSave()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!save) return null
  const view = binView(save)
  const back = (id: string, stars: number, count: number) => {
    setBusy(true)
    setError(null)
    takeBackLine(id, stars, count).catch((err: unknown) => setError(errorWords(err))).finally(() => setBusy(false))
  }
  return (
    <Sheet
      open
      onClose={onClose}
      title="Shipping bin"
      label="The shipping bin"
      footer={<Button className="w-full" onClick={() => navigate(PICK_PATH, { state: { back: true } })} data-action="ship">Ship · 1 action</Button>}
    >
      <div className="space-y-3 pb-1" data-bin>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[18px] font-semibold" data-estimate={view.total}>
            {view.lines.length > 0 ? `About ${goldWords(view.total)} tonight` : 'Empty'}
          </p>
          <HelpButton title="The shipping bin" label="How the bin works">
            <p>Pick what to ship from the Warehouse: one action ships the lot. It pays tonight, when you end the day.</p>
            <p>A good pays its price × its stars: ★1 ×1 up to ★5 ×2. The season’s demand adds 20%.</p>
            <p>Take anything back until the night, free. Seeds don’t sell.</p>
          </HelpButton>
        </div>
        {view.lines.length === 0 && <p className="text-[14px] text-ink-soft">Tap Ship to pick goods. They pay tonight.</p>}
        {view.lines.length > 0 && (
          <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="In the bin">
            {view.lines.map((line) => (
              <li key={`${line.id}@${line.stars}`} className="flex min-h-14 items-center gap-2.5 px-2.5 py-1.5" data-bin-line={`${line.id}@${line.stars}`}>
                <ItemIcon id={line.id} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{saleWords(line)}</span>
                  <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    {goldWords(line.gold)}
                    {line.demand && <span className="rounded-full bg-success/15 px-1.5 font-semibold text-success" data-demand>In demand</span>}
                  </span>
                </span>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => back(line.id, line.stars, line.count)} data-action="take-back">Take back</Button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
      </div>
    </Sheet>
  )
}

/** The shop's lines: each with its price and gate, a quantity, and Buy · 180g, refused when gold is short. */
export function ShopList({ save, lines }: { save: FarmSave; lines: readonly ShopLine[] }) {
  const rows = shopRows(save, lines)
  if (rows.length === 0) return <p className="py-2 text-[15px] text-ink-soft" data-shop-empty>Nothing for sale yet.</p>
  return (
    <ExchangeRows
      rows={rows.map((row) => ({
        key: row.line.id, icon: <ItemIcon id={row.line.id} size={32} />, name: row.name, price: { mark: <GoldMark />, amount: row.line.price },
        ...(row.gate ? { disabled: row.gate } : {}),
      }))}
      balance={save.gold}
      onBuy={async (picked, qty) => {
        const line = rows.find((row) => row.line.id === picked.key)!.line
        await buyLine(line, qty)
      }}
      words={{ buy: 'Buy {n} ·', short: 'Need {n}g more', cantBuy: 'Couldn’t buy.' }}
    />
  )
}

/** The shop, in town: it lists the season's seeds once you've gone into town today; before that, Go into town. */
export function ShopSheet({ onClose }: { onClose: () => void }) {
  const save = useLoopSave()
  if (!save) return null
  return (
    <Sheet open onClose={onClose} title="Shop" label="The shop">
      <div className="pb-1" data-shop>
        {save.today.town ? <ShopList save={save} lines={shopLines(save)} /> : <IntoTown save={save} />}
      </div>
    </Sheet>
  )
}

/** The shop is in town: one action goes there, and it's open for the rest of the day. */
export function IntoTown({ save, line = 'The shop is in town.' }: { save: FarmSave; line?: string }) {
  const [error, setError] = useState<string | null>(null)
  const left = actionsLeft(save)
  return (
    <div className="space-y-2 py-1" data-into-town>
      <p className="text-[15px]">{line}</p>
      <Button className="w-full" disabled={left === 0} onClick={() => void intoTown().catch((err: unknown) => setError(errorWords(err)))} data-action="into-town">
        Go into town · 1 action
      </Button>
      {left === 0 && <p className="text-[13px] text-ink-soft">No actions left today.</p>}
      {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}
