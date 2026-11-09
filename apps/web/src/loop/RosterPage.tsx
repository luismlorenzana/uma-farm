// `/roster` in the loop's build (F18): a plain album of the Umas on the farm, each with her best rank, until F21's talents
// and ranks and F23's Dorm give it filters, sorts and the off-season. Loaded on demand.
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { rosterView } from './roster-view'

export default function RosterPage() {
  const save = useLoopSave()
  if (!save) return null
  const view = rosterView(save)
  return (
    <main className="absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4" data-page="roster">
      <h1 className="font-display text-[22px] font-bold text-ink">Roster</h1>
      <Panel label={`On the farm · ${view.home.length}`}>
        <MasterGate>
          {(master) => (
            <ul className="grid grid-cols-3 gap-3 py-2">
              {view.home.map((uma) => {
                const name = master.album.get(uma.outfitId)?.name ?? 'Uma'
                return (
                  <li key={uma.outfitId} className="flex flex-col items-center gap-1 text-center" data-uma={uma.outfitId}>
                    <FaceTile outfitId={uma.outfitId} size={64} label={name} />
                    <span className="line-clamp-1 text-[13px] text-ink">{name}</span>
                    <span className="text-[12px] text-ink-soft">{uma.rank}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </MasterGate>
        {view.away > 0 && <p className="pb-2 text-[13px] text-ink-soft">{view.away} away</p>}
      </Panel>
    </main>
  )
}
