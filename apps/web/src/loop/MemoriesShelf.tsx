// The Diary's Memories shelf (F49 decision 12; romance spec RM56, CS38 as RM65 amends it): each Uma on the farm with her
// Memories' count, "4 of 26", opening her album (`?album=`). Loaded on demand with the Diary, the romance build only.
import type { SaveV4 } from '@farm/domain'
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
  return (
    <Panel label="Memories" data-memories-shelf={ids.length}>
      <ul className="divide-y divide-hairline">
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
