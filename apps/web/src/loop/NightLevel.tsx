// A level reached overnight: `?level=<characterId>:<s2|s4>` from the morning's
// "♥ Stand-in 1 · Spouse 2, reached overnight", the level-up card over any page: no event, her perk (S2: her morning
// item every second morning; S4: a third night chore) and her next rung, one Continue. A stale one (she isn't there)
// closes. Portaled to the body above the kit's sheets (z-60), like the players. Loaded on demand.
import { nightLevelCard } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { LevelUpCard } from './EventCards'

/** `<id>:<s2|s4>`, or null. */
export function parseLevelParam(value: string | null): { id: string; rung: 's2' | 's4' } | null {
  const [id, rung, ...rest] = (value ?? '').split(':')
  return id && /^\d+$/.test(id) && (rung === 's2' || rung === 's4') && rest.length === 0 ? { id, rung } : null
}

export default function NightLevel({ value }: { value: string }) {
  const save = useLoopSave()
  const pack = useStory()
  const location = useLocation()
  const leave = useLeave()
  const close = () => leave(withParam(location, 'level', null))
  const asked = parseLevelParam(value)
  const card = asked && save && pack ? nightLevelCard(save, pack, asked.id, asked.rung) : null
  const gone = !asked || (save && pack !== null && card === null)
  useEffect(() => {
    if (gone) close()
  }, [gone]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!card || !asked || !save || !pack) return null
  return createPortal(
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="A level reached overnight" data-night-level={asked.rung}>
      <header className="flex min-h-12 items-center px-4"><p className="text-[13px] font-semibold text-ink-soft">Overnight</p></header>
      <MasterGate skeleton={null}>
        {(master) => <LevelUpCard card={card} id={asked.id} name={master.album.get(asked.id)?.name ?? 'An Uma'} love={save.love[asked.id]!} pack={pack} farmer={save.farmer.name} onContinue={close} />}
      </MasterGate>
    </div>,
    document.body,
  )
}
