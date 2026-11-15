// The farmhouse kitchen, on the homestead's sheet (the farm map's Farmhouse opens it): the pantry, tonight's table as the
// farm stands (who eats, what the pantry and the cooks cover, the takeout), and **Cook a batch · 1**: two goods of food
// you choose, the plain rule's two picked to start, four meals into the pantry. The Kitchen (Phase 2.3) adds its
// minigame. Part of the homestead's chunk.
import {
  actionCost, actionsLeft, BATCH_GOODS, BATCH_MEALS, batchBlock, batchStars, foodHeld, itemNameOf, MEALS_A_DAY, pantryMeals, plainBatch, tableTonight, TAKEOUT_PRICE,
  WELL_FED_STARS, type FoodHeld, type SaveV4,
} from '@farm/domain'
import { Button, HelpButton } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { ItemIcon } from '../items/ItemIcon'
import { useStory } from '../story/story'
import { gold } from './money-words'
import { useTalents } from './talents'
import { plural } from './words'

/** Two picks at most: a tap adds one (a good held twice can be picked twice); with two picked, a tap on a picked good
 * takes one back, and on another swaps out the first. */
export function pickFood(picks: readonly string[], row: Pick<FoodHeld, 'key' | 'count'>): string[] {
  const mine = picks.filter((k) => k === row.key).length
  if (picks.length < BATCH_GOODS && mine < row.count) return [...picks, row.key]
  if (mine > 0) {
    const at = picks.lastIndexOf(row.key)
    return picks.filter((_, i) => i !== at)
  }
  return [...picks.slice(1), row.key]
}

/** The kitchen: the pantry, tonight's table and the batch. */
export function Kitchen({ save, busy, onCook }: { save: SaveV4; busy: boolean; onCook: (picks: string[]) => void }) {
  const pack = useStory()
  const talents = useTalents()
  const table = useMemo(() => tableTonight(save, talents.of, pack), [save, talents.of, pack])
  const held = foodHeld(save)
  const [chosen, setChosen] = useState<string[] | null>(null)
  // Your picks while they're still held, else the plain rule's.
  const picks = chosen && batchBlock(save, chosen) === null ? chosen : plainBatch(save) ?? []
  const why = actionsLeft(save) < actionCost('batch') ? 'No actions left today.' : batchBlock(save, picks.length === BATCH_GOODS ? picks : null)
  const stored = pantryMeals(save)
  return (
    <section className="space-y-1.5" aria-label="The kitchen" data-kitchen>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-micro">Kitchen</h3>
        <HelpButton title="The kitchen" label="How food works">
          <p>Everyone who eats on the farm eats twice a day, at night: you, everyone living on the farm, and every farmhand who works that day.</p>
          <p>They eat from the pantry first. Whatever it’s short is takeout, {gold(TAKEOUT_PRICE)} a meal, paid with the upkeep.</p>
          <p>Cook a batch here: one action, two goods of food, four meals. Meals keep two days. A meal of ★2 or more leaves an Uma who eats it well fed: one more action the next day.</p>
          <p>A farmhand on Cook cooks for everyone: bigger batches as her Cooking grows.</p>
        </HelpButton>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <p data-pantry={stored}><span className="font-semibold">Pantry · </span>{stored > 0 ? plural(stored, 'meal') : 'empty'}</p>
        <p className="text-right" data-table={table.mouths}><span className="font-semibold">Tonight · </span>{table.mouths} at the table · {plural(table.mouths * MEALS_A_DAY, 'meal')}</p>
      </div>
      <p className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${table.takeout > 0 ? 'bg-danger/10 text-danger' : 'bg-success/15 text-success'}`} data-takeout={table.gold}>
        {table.takeout > 0 ? `Takeout tonight · ${plural(table.takeout, 'meal')} · ${gold(table.gold)}` : 'The pantry covers tonight'}
        {table.cooked > 0 ? <span className="font-normal"> · the cook adds {table.cooked}</span> : null}
      </p>
      {held.length === 0 ? (
        <p className="text-[13px] text-ink-soft" data-no-food>{batchBlock(save)}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5" aria-label="Goods of food" data-food={held.length}>
          {held.map((row) => {
            const n = picks.filter((k) => k === row.key).length
            return (
              <li key={row.key}>
                <button type="button" aria-pressed={n > 0} onClick={() => setChosen(pickFood(picks, row))} disabled={busy}
                  className={`flex min-h-11 w-full items-center gap-1.5 rounded-md border px-2 text-left text-[13px] ${n > 0 ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`}
                  data-food-key={row.key}>
                  <ItemIcon id={row.id} size={24} />
                  <span className="min-w-0 flex-1 truncate">{itemNameOf(row.id)} ★{row.stars}</span>
                  <span className="shrink-0 text-[12px] text-ink-soft tabular-nums">{n > 0 ? `${n}/${row.count}` : `×${row.count}`}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <Button className="w-full" disabled={busy || why !== null} onClick={() => onCook(picks)} data-action="cook-batch" data-why={why ?? undefined}>
        {`Cook a batch · ${actionCost('batch')}`}
      </Button>
      {held.length > 0 && (
        <p className="text-[12px] text-ink-faint" data-batch>
          {why ?? `${plural(BATCH_MEALS, 'meal')} ★${batchStars(picks)} from ${picks.map((k) => itemNameOf(k.slice(0, k.lastIndexOf('@')))).join(' and ')}${batchStars(picks) >= WELL_FED_STARS ? ': well fed' : ''}`}
        </p>
      )}
    </section>
  )
}
