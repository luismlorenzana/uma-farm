import { visitMemoryKey, type FarmSave, type Visit } from '@farm/domain'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { dateWords } from './words'
import { NightReplayLinks } from './NightReplayLinks'

export default function NightMemories({ save }: { save: FarmSave }) {
  const pack = useStory()
  const master = useMaster()
  if (!pack) return null
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const rows = new Map<string, { owner: string; index: number; visit: Visit }>()
  for (const [owner, heart] of Object.entries(save.longGame?.love ?? {})) {
    heart.memories.forEach((visit, index) => {
      const key = visitMemoryKey(visit)
      if (!rows.has(key) || visit.overnight) rows.set(key, { owner, index, visit })
    })
  }
  return <Panel label="Night memories">
    <ul className="divide-y divide-hairline">
      {[...rows.values()].sort((a, b) => b.visit.day - a.visit.day).map(({ owner, index, visit }) => <li
        key={visitMemoryKey(visit)} className="space-y-1 py-2">
        <strong>{visit.who.map(nameOf).join(' & ')}</strong>
        <p className="text-ink-soft">{visit.kind === 'anniversary' ? `Anniversary ${visit.anniversary}`
          : visit.kind === 'birthday' ? 'Birthday night' : 'Night visit'} · {dateWords(visit.day, save.calendar)}</p>
        <NightReplayLinks save={save} visit={visit} owner={owner} index={index} className="flex min-h-11 items-center px-2 text-accent-strong" />
      </li>)}
    </ul>
  </Panel>
}
