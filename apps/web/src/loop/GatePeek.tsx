// The Gate's quick look: the welcome list comes here, one a morning from day 1 (`gateVisitor`). Today's visitor, not met
// yet: her face, "‹name› is at the Gate." and **Say hello**, her first talk, which meets her and moves her in while a bed
// is free; her meeting scene plays next. Once met: "‹name› came by today." Then "Someone new comes tomorrow." while the
// welcome list has more, else "Meet everyone else in town." with the Town. Loaded with the farm map.
import { gateVisitor, welcomeVisitors, type FarmSave } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useState } from 'react'
import { Link } from 'react-router'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { sayHelloAtGate } from './actions'

/** Today's visitor and Say hello; then who comes next, never who. */
export function GatePeek({ save }: { save: FarmSave }) {
  const story = useStory()
  const master = useMaster()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visitor = story ? gateVisitor(save, story) : null
  const waiting = visitor !== null && !save.roster[visitor]
  const more = story ? welcomeVisitors(story).some((id) => id !== visitor && !save.roster[id]) : false
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const hello = (id: string) => {
    if (busy) return
    setBusy(true)
    setError(null)
    sayHelloAtGate(id).catch((err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work. Try again.')).finally(() => setBusy(false))
  }
  return (
    <div className="space-y-2 p-4" data-peek="gate" data-visitor={visitor ?? undefined} data-waiting={waiting || undefined}>
      {visitor && waiting && (
        <div className="space-y-2 pb-1">
          <p className="flex items-center gap-3 text-[15px] font-semibold">
            <FaceTile outfitId={visitor} size={48} label={nameOf(visitor)} round />
            <span className="min-w-0 flex-1">{nameOf(visitor)} is at the Gate.</span>
          </p>
          <button type="button" onClick={() => hello(visitor)} disabled={busy} data-action="hello"
            className="font-display grid min-h-12 w-full place-items-center rounded-md bg-accent text-[16px] font-bold text-accent-ink disabled:opacity-60">
            Say hello ›
          </button>
          {error && <p role="status" className="text-[13px] font-semibold text-danger">{error}</p>}
        </div>
      )}
      {visitor && !waiting && <p className="text-[15px] font-semibold" data-came>{nameOf(visitor)} came by today.</p>}
      {!waiting && (more
        ? <p className="text-[14px] text-ink-soft" data-next-visitor>Someone new comes tomorrow.</p>
        : <p className="text-[14px] text-ink-soft" data-everyone>Meet everyone else in <Link to="/town" className="font-semibold text-accent-strong underline">town</Link>.</p>)}
    </div>
  )
}
