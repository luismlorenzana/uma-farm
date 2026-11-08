// Copied from uma-rpg apps/web/src/places/work/PlaceV4.tsx at 30a322a (F5, FM2): a place's What step and quick look line.
// A gathering place offers its line's ten raw items, a workbench its ten refined ones, a making place its item's grades
// (the Lapidary's Planet and Moon rows), each with the picked item's card.
import { isMakingPlaceV4, isProcessingPlaceV4, madeRecipeV4, placeSpecV4, stockName, type FarmWorld } from '@farm/domain'
import type { JobSelection } from '@luismlorenzana/uma-kit/work'
import { ItemIcon } from '../../items/ItemIcon'
import { itemFacts, materialPair } from '../../items/words'
import { gatherTiles, makeGroups, peekLine, processTiles, type LineTile, type MadeChip, type MadeGroup } from './place-view'

export function What({ selection, placeId, world, onPick }: {
  selection: JobSelection; placeId: string; world: FarmWorld; onPick: (job: string) => void
}) {
  const place = placeSpecV4(placeId)!
  const level = selection.outfitId ? world.umas[selection.outfitId]?.craft.level ?? 1 : 1
  if (!isMakingPlaceV4(place)) {
    const processing = isProcessingPlaceV4(place)
    const tiles = processing ? processTiles(place.line, level) : gatherTiles(place.line, level)
    const picked = tiles.find((t) => t.id === selection.job) ?? tiles[0]!
    return (
      <div className="space-y-2.5" data-what={placeId}>
        <LineTiles label={processing ? 'Process' : 'Gather'} tiles={tiles} picked={picked.id} onPick={onPick} small={processing} />
        <MaterialCard world={world} id={picked.id} locked={picked.locked} />
      </div>
    )
  }
  const groups = makeGroups(placeId, level)
  const chip = groups.flatMap((g) => g.chips).find((c) => c.id === selection.job) ?? groups[0]!.chips[0]!
  return (
    <div className="space-y-3" data-what={placeId}>
      <section className="space-y-1" aria-label="Make">
        <h4 className="text-[11px] font-semibold text-ink-soft">Make</h4>
        <MadeChips groups={groups} picked={chip.id} onPick={onPick} />
      </section>
      <RecipeCard world={world} id={chip.id} locked={chip.locked} />
    </div>
  )
}

/** Ten tiles of one line, G1–G10, in two rows of five. */
function LineTiles({ label, tiles, picked, onPick, small }: {
  label: string; tiles: LineTile[]; picked: string | null; onPick: (id: string) => void; small?: boolean
}) {
  return (
    <div className="grid grid-cols-5 gap-1" role="group" aria-label={label}>
      {tiles.map((t) => (
        <button key={t.id} type="button" disabled={t.locked !== null} onClick={() => onPick(t.id)} aria-pressed={t.id === picked}
          aria-label={`${stockName(t.id)}, G${t.grade}${t.locked ? `, ${t.locked}` : ''}`} data-line-tile={t.id}
          className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-sm border px-0.5 py-1 ${t.id === picked ? 'border-accent bg-accent-wash ring-1 ring-accent' : 'border-transparent bg-raised'} disabled:opacity-40`}>
          <ItemIcon id={t.id} size={small ? 24 : 28} />
          <span className="text-[10px] font-semibold leading-3">G{t.grade}</span>
        </button>
      ))}
    </div>
  )
}

/** A making place's grade chips: two rows of five (uma-rpg's row of ten, widened to 44 pt targets), or the Lapidary's
 * Planet and Moon rows of five. */
function MadeChips({ groups, picked, onPick }: { groups: MadeGroup[]; picked: string | null; onPick: (id: string) => void }) {
  return (
    <div className="space-y-1.5">
      {groups.map((group) => (
        <div key={group.key} className="flex items-center gap-1.5">
          {group.label && <span className="w-12 shrink-0 text-[11px] font-semibold text-ink-soft">{group.label}</span>}
          <div className="grid flex-1 grid-cols-5 gap-1" role="group" aria-label={group.label ?? 'Grade'}>
            {group.chips.map((c) => <Chip key={c.id} chip={c} on={c.id === picked} onPick={() => onPick(c.id)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function Chip({ chip, on, onPick }: { chip: MadeChip; on: boolean; onPick: () => void }) {
  return (
    <button type="button" disabled={chip.locked !== null} onClick={onPick} aria-pressed={on} data-grade-chip={chip.grade}
      aria-label={`${stockName(chip.id)}${chip.locked ? `, ${chip.locked}` : ''}`}
      className={`min-h-11 rounded-sm text-[12px] font-semibold ${on ? 'bg-accent text-accent-ink' : 'bg-raised text-ink-soft'} disabled:opacity-35`}>
      {chip.label}
    </button>
  )
}

/** A raw or refined item's card: "Metal · G3 · refined · Refined from Iron Ore", what's held, its gate. */
function MaterialCard({ world, id, locked }: { world: FarmWorld; id: string; locked: string | null }) {
  const pair = materialPair(id)
  return (
    <div className="rounded-sm bg-raised p-2.5" data-selected-item={id}>
      <p className="flex items-center gap-2 text-[14px] font-semibold">
        <ItemIcon id={id} size={32} />
        <span className="min-w-0 flex-1 truncate">{stockName(id)}</span>
        <span className="text-[12px] font-normal text-ink-faint">Have {world.items[id] ?? 0}</span>
      </p>
      <p className="mt-0.5 text-[12px] text-ink-soft">{itemFacts(id)}{pair ? ` · ${pair}` : ''}{locked ? ` · ${locked}` : ''}</p>
    </div>
  )
}

/** A made item's card: "Arms Gem G3 · Metal · G3 · made" and "Iron Ingot ×10 (12)". */
function RecipeCard({ world, id, locked }: { world: FarmWorld; id: string; locked: string | null }) {
  const recipe = Object.entries(madeRecipeV4(id))
  return (
    <div className="rounded-sm bg-raised p-2.5" data-recipe={id}>
      <p className="flex items-center gap-2 text-[14px] font-semibold">
        <ItemIcon id={id} size={28} />
        <span className="min-w-0 flex-1 truncate">{stockName(id)}</span>
        <span className="text-[12px] font-normal text-ink-faint">Have {world.items[id] ?? 0}</span>
      </p>
      <p className="mt-0.5 text-[12px] text-ink-soft">{itemFacts(id)}{locked ? ` · ${locked}` : ''}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
        {recipe.map(([input, count]) => (
          <li key={input} className="flex items-center gap-1 rounded-sm bg-panel px-2 py-1">
            <ItemIcon id={input} size={18} />{stockName(input)} ×{count} <span className="text-ink-faint">({world.items[input] ?? 0})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The quick look's line: a gathering place's or workbench's ten icons; a making place's grade chips. */
export function PeekLine({ placeId }: { placeId: string }) {
  const peek = peekLine(placeId)
  if ('icons' in peek) {
    return (
      <p className="flex flex-wrap items-center gap-1" aria-label={peek.icons.map(stockName).join(', ')}>
        {peek.icons.map((id) => <ItemIcon key={id} id={id} size={22} />)}
      </p>
    )
  }
  const first = peek.chips[0]!.id
  const label = first.startsWith('jewel-') ? 'Planet and Moon Jewels I–V' : `${stockName(first).replace(/ G1$/, '')} G1–G10`
  return (
    <div className="flex items-center gap-1.5">
      <ItemIcon id={first} size={24} />
      <span className="flex flex-wrap gap-0.5" aria-label={label}>
        {peek.chips.map((c) => <span key={c.id} aria-hidden className="min-w-5 rounded-xs bg-sunken px-0.5 text-center text-[10px] font-semibold leading-4">{c.label}</span>)}
      </span>
    </div>
  )
}
