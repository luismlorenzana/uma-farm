// The bin's and the shop's sheets, drawn within the kit's `Sheet`. The bin (`?sheet=bin`,
// from the shipping bin on the map and the gold chip): today's lines with Take back (free), the night's estimate, and
// Ship, which opens the Warehouse to pick a crate from: one action ships it. The shop (`?sheet=shop`), in town: its
// lines on the kit's ExchangeRows, bought with gold once you've gone into town today, and its Recipes shelf once the Kitchen
// stands (a recipe for the Kitchen, known for good); before that, Go into town.
import { dishName, kitchenBuilt, recipeLock, recipeShelf, recipeWords, shopLines, type FarmSave, type ShopLine } from '@farm/domain'
import { ExchangeRows } from '@luismlorenzana/uma-kit/places'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { GoldMark } from '../shell/Gold'
import { buyLine, intoTown, takeBackLine } from './actions'
import { buyTheRecipe } from './kitchen-actions'
import { binView, easedWords, goldWords, saleWords, shopRows } from './goods-view'

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
          <GuideButton topic="economy" title="The shipping bin" label="How the bin works">
            <p>Pick what to ship from the Warehouse: one action ships the lot. It pays tonight, when you end the day.</p>
            <p>A good pays its price × its stars: ★1 ×1 up to ★5 ×2. The season’s demand adds 20%.</p>
            <p>Past 50 of one good in a night, each 50 more sells 10% lower, down to half. It stays eased a few days, back a step a night.</p>
            <p>Take anything back until the night, free. Seeds don’t sell.</p>
          </GuideButton>
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
                    {line.eased !== undefined && <span className="rounded-full bg-warning/15 px-1.5 font-semibold text-warning" data-eased={line.eased}>{easedWords(line.eased)}</span>}
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

/** The shop, in town: it lists the season's seeds once you've gone into town today, and its Recipes shelf once the
 * Kitchen stands; before that, Go into town. */
export function ShopSheet({ onClose }: { onClose: () => void }) {
  const save = useLoopSave()
  if (!save) return null
  return (
    <Sheet open onClose={onClose} title="Shop" label="The shop">
      <div className="space-y-3 pb-1" data-shop>
        <div className="flex justify-end"><GuideButton topic="shop" label="How the shop works" /></div>
        {save.today.town ? (
          <>
            <ShopList save={save} lines={shopLines(save)} />
            <RecipeShelf save={save} />
          </>
        ) : <IntoTown />}
      </div>
    </Sheet>
  )
}

/** The Recipes shelf, once the Kitchen stands: every recipe not known yet, kind by kind, each with what it takes, its
 * price and Buy (free once in town); a recipe is known for good. */
export function RecipeShelf({ save }: { save: FarmSave }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const shelf = recipeShelf(save)
  if (!kitchenBuilt(save)) return null
  const buy = (dish: string) => {
    setBusy(true)
    setError(null)
    buyTheRecipe(dish).catch((err: unknown) => setError(errorWords(err))).finally(() => setBusy(false))
  }
  return (
    <section className="space-y-1" aria-label="Recipes" data-recipe-shelf={shelf.length}>
      <h3 className="text-micro">Recipes · for the Kitchen</h3>
      {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
      {shelf.length === 0 ? <p className="text-[14px] text-ink-soft">You know every recipe.</p> : (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {shelf.map((r) => {
            const lock = recipeLock(save, r.dish)
            return (
              <li key={r.dish} className="flex min-h-12 items-center gap-2 px-2 py-1" data-shelf-recipe={r.dish}>
                <ItemIcon id={r.dish} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{dishName(r.dish)}</span>
                  <span className="block truncate text-[12px] text-ink-soft">{recipeWords(r.dish)}</span>
                </span>
                <Button size="sm" disabled={busy || lock !== null} onClick={() => buy(r.dish)} data-action="buy-recipe" data-why={lock ?? undefined}>
                  {r.price.toLocaleString('en-US')}g
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** A free visit from the shop shortcut, or a retry after arrival fails. */
export function IntoTown({ line = 'The shop is in town.' }: { line?: string }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="space-y-2 py-1" data-into-town>
      <p className="text-[15px]">{line}</p>
      <Button className="w-full" onClick={() => void intoTown().catch((err: unknown) => setError(errorWords(err)))} data-action="into-town">
        Go into town · Free
      </Button>
      {error && <p role="status" className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}
