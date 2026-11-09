// The loop's `/` until F18's map (F17): a plain page with the date, the gold, the Umas on the farm with their best rank,
// and the Warehouse's count. Loaded on demand, and only in the loop's build.
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { loopHomeView } from './home-view'

export default function LoopHome() {
  const save = useLoopSave()
  if (!save) return null
  const view = loopHomeView(save)
  return (
    <main className="absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4" data-page="farm">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[22px] font-bold text-ink">{view.date}<span className="ml-2 text-[14px] font-normal text-ink-soft">{view.year}</span></h1>
        <p className="font-display text-[20px] font-bold text-ink" aria-label={`Gold: ${view.gold}`}>{view.gold}</p>
      </div>
      <Panel label={`On the farm · ${view.home.length}`}>
        <MasterGate>
          {(master) => (
            <ul className="grid grid-cols-3 gap-3 py-2">
              {view.home.map((uma) => {
                const name = master.album.get(uma.outfitId)?.name ?? 'Uma'
                return (
                  <li key={uma.outfitId} className="flex flex-col items-center gap-1 text-center">
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
      <Panel label="Warehouse">
        <p className="py-2 text-ink">{view.stock.toLocaleString('en-US')} {view.stock === 1 ? 'item' : 'items'}</p>
      </Panel>
    </main>
  )
}
