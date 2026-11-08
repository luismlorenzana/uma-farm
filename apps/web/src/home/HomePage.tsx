// Home (F3): the farm's name, who is signed in, the save's sync state and master data's release, which proves the path
// from uma-platform's bucket. The Wilds map replaces this body in F5.
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useMaster } from '../master/master'
import { useGame } from '../save/game'
import { syncWords } from './sync-words'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line/60 py-2 last:border-b-0">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-semibold" data-row={label}>{value}</span>
    </div>
  )
}

export function HomePage() {
  const auth = useAuth()
  const state = useGame()
  const master = useMaster()
  const release = master.status === 'ready' ? master.manifest.version : master.status === 'error' ? (master.offline ? 'Offline' : 'Unavailable') : 'Loading…'
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <h1 className="text-center font-display text-3xl font-bold tracking-tight">uma-farm</h1>
      <Panel label="Farm">
        <Row label="Signed in" value={auth.user?.email ?? auth.user?.name ?? 'Local'} />
        <Row label="Save" value={syncWords(state)} />
        <Row label="Master data" value={release} />
      </Panel>
    </div>
  )
}
