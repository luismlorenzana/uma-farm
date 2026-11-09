// The Fields on the farm map (F20): their quick look, one row a block (its tender's face, what grows, what's Ready, and a
// locked block's Farm Rank and cost), Harvest all on every block, and Open the Fields; and their pips, one a block, each
// its tender's face ringed by the block's growth, at her talent (F21). Part of the farm map's chunk.
import { readyPlots, talentD, type FarmingTalentOf, type SaveV3 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import type { PipModel } from '@luismlorenzana/uma-kit/hub'
import { Button, LockedIcon } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link } from 'react-router'
import { harvestFields } from './actions'
import { blockLine, fieldsView, type OwnedBlock } from './fields-view'
import { FIELDS } from './summary-words'

/** A block's progress for its pip: its growing plots' growth toward Ready, on average; 1 once one is Ready. */
const progressOf = (block: OwnedBlock): number => {
  if (block.ready > 0) return 1
  const growing = block.plots.filter((p) => p.state === 'growing')
  return growing.length === 0 ? 0 : growing.reduce((sum, p) => sum + p.progress, 0) / growing.length
}

/** The Fields' pips: one an owned block, its tender's face (busy while it grows, Ready with a Ready plot) or a free dot. */
export function fieldsPips(save: SaveV3, talentOf: FarmingTalentOf = talentD): PipModel[] {
  return fieldsView(save, talentOf).flatMap((block): PipModel[] => {
    if (!block.owned) return []
    if (block.tender === null) return [block.ready > 0 ? { state: 'ready' } : { state: 'free' }]
    return [{
      state: block.ready > 0 ? 'ready' : 'busy', progress: progressOf(block), badge: block.id,
      face: <FaceTile outfitId={block.tender} size={24} label={`Block ${block.id}'s tender`} round />,
    }]
  })
}

/** The Fields' quick look. */
export function FieldsPeek({ save, talentOf = talentD }: { save: SaveV3; talentOf?: FarmingTalentOf }) {
  const blocks = fieldsView(save, talentOf)
  const ready = readyPlots(save)
  const [note, setNote] = useState<string | null>(null)
  return (
    <div className="space-y-2 p-4" data-peek="fields">
      <ul className="divide-y divide-hairline rounded-md border border-hairline">
        {blocks.map((block) => (
          <li key={block.id}>
            <Link to={FIELDS} state={{ back: true }} className="flex min-h-12 items-center gap-2.5 px-2.5 py-1" data-peek-block={block.id}>
              {block.owned && block.tender
                ? <FaceTile outfitId={block.tender} size={32} label={`Block ${block.id}'s tender`} round />
                : <span aria-hidden className={`grid size-8 place-items-center rounded-full border border-dashed text-[12px] ${block.owned ? 'border-hairline-strong text-ink-faint' : 'border-hairline text-ink-faint/70'}`}>{block.owned ? '—' : <LockedIcon size={14} />}</span>}
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] font-semibold ${block.owned ? '' : 'text-ink-soft'}`}>Block {block.id}</span>
                <span className="block truncate text-[12px] text-ink-soft">{blockLine(block)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {note && <p role="status" className="text-[13px] font-semibold text-success">{note}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" className="shrink-0" disabled={ready === 0}
          onClick={() => void harvestFields().then((n) => setNote(n > 0 ? `+${n} harvested` : null))} data-action="harvest-fields">
          {ready > 0 ? `Harvest all · ${ready}` : 'Harvest all'}
        </Button>
        <Link to={FIELDS} state={{ back: true }} className="flex min-h-12 flex-1 items-center justify-center rounded-md bg-accent px-3 font-display text-[15px] font-bold whitespace-nowrap text-accent-ink" data-action="open-fields">
          Open the Fields
        </Link>
      </div>
    </div>
  )
}
