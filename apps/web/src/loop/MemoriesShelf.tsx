// The Diary's Memories shelf (CS38 as RM65 amends it): each Uma on the farm with her
// Memories' count, "4 of 26", opening her album (`?album=`). F54: the household scenes and the finale once played, each a
// replay (`?household=<id>&replay=1`). Loaded on demand with the Diary, the romance build only.
import { HOUSEHOLD_IDS, householdTitle, type SaveV4 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useMaster } from '../master/master'
import { storyReady, useStory } from '../story/story'
import { memoryCount } from './event-view'

export default function MemoriesShelf({ save }: { save: SaveV4 }) {
  const pack = useStory()
  const location = useLocation()
  useEffect(() => void storyReady().catch(() => undefined), [])
  const master = useMaster()
  const nameOf = (id: string): string => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const order = pack ? pack.cast.umas.map((u) => u.characterId) : []
  const ids = Object.keys(save.roster).sort((a, b) => (order.indexOf(a) + 1 || order.length + 1) - (order.indexOf(b) + 1 || order.length + 1) || a.localeCompare(b))
  const household = HOUSEHOLD_IDS.filter((id) => save.diary.read.includes(id))
  return (
    <Panel label="Memories" data-memories-shelf={ids.length}>
      <ul className="divide-y divide-hairline">
        {household.map((id) => (
          <li key={id}>
            <Link to={`${withParam(location, 'household', id)}&replay=1`} state={{ back: true }} className="flex min-h-12 items-center gap-2.5 py-1" data-shelf={id}>
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-[#d9a227]/15 text-[16px] text-[#b58a2a]">⌂</span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{householdTitle(id)}</span>
              <span className="shrink-0 text-[13px] text-ink-soft">Replay ›</span>
            </Link>
          </li>
        ))}
        {ids.map((id) => (
          <li key={id}>
            <Link to={withParam(location, 'album', id)} state={{ back: true }} className="flex min-h-12 items-center gap-2.5 py-1" data-shelf={id}>
              <FaceTile outfitId={id} size={32} label={nameOf(id)} round />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{nameOf(id)}</span>
              <span className="shrink-0 text-[13px] text-ink-soft tabular-nums">{memoryCount(save, id)} ›</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
