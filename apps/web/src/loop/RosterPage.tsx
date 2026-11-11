// `/roster` (F18; F21 decision 7; F23 decision 11; FC19): M4's page. Everyone on the roster, home or away, as album cards
// on uma-kit's album chrome (`RosterAlbum`, which the romance build's Hearts tab shows as its Work view, F48 decision 8),
// with your hearts with her in each face's corner. A tap opens her sheet (`?uma=<id>`): your hearts with her, Chat and
// Gift, where she is, and her nine activities with talent, rank, points and the next challenge. The romance build sends
// `/roster` to the Hearts tab's Work view (F48 decision 2), so this page only ever plays a v3 save. Loaded on demand.
import { heartsOf, type FarmSave, type Temperament } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { HelpButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useLocation, useSearchParams } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { Hearts, TalkButtons } from './Affinity'
import { RosterAlbum, useRosterRows, WorkFacts, WorkSide } from './RosterAlbum'
import type { LoopUmaRow } from './roster-view'
import { umaBadges } from './UmaMarks'

export default function RosterPage() {
  const save = useLoopSave()
  if (!save) return null
  return (
    <main className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-28" data-page="roster">
      <div className="flex items-center justify-between gap-2 pb-2">
        <h1 className="font-display text-[22px] font-bold text-ink">Roster</h1>
        <HelpButton title="Talents and ranks" label="About talents and ranks">
          <p>Each Uma has a talent, G to S, in each activity, from her stats. Talent lifts her yield, her stars and how fast she ranks up.</p>
          <p>She climbs six ranks in each: Novice, Hand, Skilled, Expert, Master, Legend. A day of work earns rank points; a rank comes when its points are reached and its challenge is met, at night.</p>
          <p>Her favourite line (the mark on her face) earns ×1.2 rank points. She can work anywhere.</p>
          <p>The hearts are your affinity with her: chat once a day and give a gift once a day. Goods of her favourite line please her most. At 5 hearts she earns 5% more rank points, at 10 hearts 10%.</p>
          <p>Umas beyond the Dorm’s beds are away on their off-season. Swap them in at the Dorm.</p>
        </HelpButton>
      </div>
      <MasterGate>{(master) => <Roster save={save} master={master} />}</MasterGate>
    </main>
  )
}

function Roster({ save, master }: { save: FarmSave; master: MasterView }) {
  const location = useLocation()
  const leave = useLeave()
  const [params] = useSearchParams()
  const { rows, talents } = useRosterRows(save, master)
  const open = rows.find((row) => row.id === params.get('uma'))
  return (
    <>
      <RosterAlbum save={save} rows={rows} corner={(row) => (save.version === 3 ? heartBadge(row.affinity) : {})} />
      {open && <UmaSheet save={save} row={open} temperament={talents?.get(open.id)?.temperament ?? null} onClose={() => leave(withParam(location, 'uma', null))} />}
    </>
  )
}

/** Your hearts with her, in her face's top-right corner, once there's one (F23). */
function heartBadge(affinity: number) {
  const hearts = heartsOf(affinity)
  return hearts > 0 ? { topRight: <span className="rounded-full bg-white/90 px-1 text-[11px] font-bold text-[#c2385e] shadow-1 ring-1 ring-black/10" data-card-hearts={hearts}>♥{hearts}</span> } : {}
}

/** Her sheet: your hearts with her, Chat and Gift (F23), where she is, her favourite line, when she joined, and her nine
 * activities, each with talent, rank, points and the challenge toward her next rank. */
function UmaSheet({ save, row, temperament, onClose }: { save: FarmSave; row: LoopUmaRow; temperament: Temperament | null; onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title={row.name} label={`${row.name}: talents and ranks`}>
      <div className="flex items-center gap-3 pb-3" data-uma-sheet={row.id}>
        <FaceTile outfitId={row.id} size={56} badges={umaBadges(row)} label={row.name} />
        <WorkFacts row={row} />
      </div>
      {save.version === 3 && (
        <div className="space-y-2 pb-3">
          <Hearts affinity={row.affinity} />
          <TalkButtons save={save} outfitId={row.id} name={row.name} temperament={temperament} />
        </div>
      )}
      <WorkSide row={row} />
    </Sheet>
  )
}
