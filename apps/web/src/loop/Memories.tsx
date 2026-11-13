// Her Memories: an album an Uma at `?album=<characterId>` over any page,
// opened from her profile and the Diary's shelf. One tile a rung with an event (26), in four filters (Friend, Romance,
// Wed, Spouse): the played ones with her beat's caption on uma-art's Memory frame, the next marked, the rest locked; her
// arrival scene replays from the header. A tap on a played tile **replays it from any choice**: from the top or a
// choice point picked from its list, every option open, nothing paid or saved (`?memory=`, the event player). Loaded on
// demand.
import { choicePointsOf, type ChoiceOption, type Step } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Chip, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { memoryParam } from './EventPlayer'
import { ALBUM_FILTERS, albumTiles, choicePointWords, memoryCount, type AlbumFilter, type AlbumTile } from './event-view'

export default function Memories() {
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const save = useLoopSave()
  const pack = useStory()
  const master = useMaster()
  const id = params.get('album')
  const [filter, setFilter] = useState<AlbumFilter>('friend')
  const [picked, setPicked] = useState<{ tile: AlbumTile; points: { at: number; first: string }[] | null } | null>(null)
  const tiles = useMemo(() => (save && pack && id && save.love[id] ? albumTiles(save, pack, id) : null), [save, pack, id])
  if (!id || !save || !pack || !tiles) return null
  const name = (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const close = () => leave(withParam(location, 'album', null))
  const replay = (rung: string, from: number | null = null) => withParam(location, 'memory', memoryParam(id, rung, from))
  const open = (tile: AlbumTile) => {
    setPicked({ tile, points: null })
    void pack.route(id).then((route) => {
      const steps: readonly Step[] = route?.events.find((e) => e.id === tile.rung)?.steps ?? []
      const points = choicePointsOf(steps).map((at) => ({ at, first: (steps[at] as { choice: ChoiceOption[] }).choice[0]?.text ?? '' }))
      setPicked({ tile, points })
    }, () => setPicked({ tile, points: [] }))
  }
  const shown = tiles.filter((t) => t.filter === filter)
  return (
    <Sheet open onClose={close} title={`${name} · Memories`} label={`${name}: her Memories`}
      footer={<p className="text-center text-[13px] text-ink-soft">Tap a Memory: replay from any choice. Replays give no points.</p>}>
      <div className="space-y-3 pb-2" data-album={id}>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold tabular-nums" data-album-count>{memoryCount(save, id)}</span>
          {save.arrivals.includes(id) && (
            <Link to={replay('arrival')} state={{ back: true }} className="ml-auto grid min-h-11 place-items-center rounded-full px-3 text-[14px] font-semibold text-accent-strong" data-action="replay-arrival">
              Her arrival ›
            </Link>
          )}
        </div>
        <div className="flex gap-1" role="group" aria-label="Filters">
          {ALBUM_FILTERS.map((f) => (
            <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)} className="min-h-11! px-2.5!" data-album-filter={f.key}>{f.label}</Chip>
          ))}
        </div>
        <ul className="grid grid-cols-4 gap-2 max-[375px]:grid-cols-3" data-tiles={filter}>
          {shown.map((tile) => (
            <li key={tile.rung}>
              <button type="button" disabled={tile.state !== 'played'} onClick={() => open(tile)} data-tile={tile.rung} data-state={tile.state}
                className={`flex min-h-24 w-full flex-col items-center gap-1 rounded-md border p-1.5 text-center ${tile.state === 'next' ? 'border-[#c2385e] bg-[#c2385e]/5' : 'border-hairline'} ${tile.state === 'locked' ? 'opacity-50' : ''}`}>
                <span className="relative grid size-12 place-items-center">
                  <UiMark mark="hearts/memory-frame" scale={1} fallback={<span aria-hidden className="absolute inset-0 rounded-sm border-2 border-[#d9a227]" />} />
                  <span className="absolute text-[12px] font-bold">{tile.label}</span>
                </span>
                <span className="line-clamp-2 text-[11px] leading-tight">{tile.state === 'played' ? tile.caption : tile.state === 'next' ? 'Next' : 'Locked'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {picked && (
        <Sheet open onClose={() => setPicked(null)} title={picked.tile.caption ?? picked.tile.label} label="Replay from">
          <ul className="space-y-2 pb-2" data-replay-from={picked.tile.rung}>
            <li><Link to={replay(picked.tile.rung)} state={{ back: true }} onClick={() => setPicked(null)} className="flex min-h-12 items-center rounded-md border border-hairline px-4 text-[15px] font-semibold" data-action="replay-top">From the top</Link></li>
            {(picked.points ?? []).map((point, i) => (
              <li key={point.at}>
                <Link to={replay(picked.tile.rung, i + 1)} state={{ back: true }} onClick={() => setPicked(null)} className="flex min-h-12 items-center rounded-md border border-hairline px-4 text-[15px]" data-action="replay-choice" data-choice-point={i + 1}>
                  {choicePointWords(i + 1, point.first)}
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </Sheet>
  )
}
