// A level reached overnight: `?level=<characterId>:<s2|s4>` from the morning's
// "♥ Stand-in 1 · Spouse 2, reached overnight". First her level's scene on the dialogue engine: her route's `s2` or `s4`,
// else the default story's (it writes both), in the day's outfit unless it names one; Skip, or its end, goes on. Then the
// level-up card: her last line of the scene, her perk (S2: her morning item every second morning; S4: a third night chore)
// and her next rung, one Continue. A level with no scene to play shows the card alone, as before ("no event"). A stale one
// (she isn't there) closes. Portaled to the body above the kit's sheets (z-60), like the players. Loaded on demand.
import { nightLevelCard, type PlayedEvent, type Step } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { useStory } from '../story/story'
import { LevelUpCard } from './EventCards'
import { LifeScene } from './LifeScene'
import { Frame } from './ScenePlayer'

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
  // Her level's scene, read once as it opens; `played` once it's ended (or there's none to play), with its steps as
  // played (a choice's answer in), for her last line on the card.
  const [event, setEvent] = useState<PlayedEvent | null>(null)
  const [played, setPlayed] = useState(false)
  const [shown, setShown] = useState<readonly Step[] | null>(null)
  const card = asked && save && pack ? nightLevelCard(save, pack, asked.id, asked.rung, event && event.steps.length > 0 ? shown ?? event.steps : null) : null
  const gone = !asked || (save && pack !== null && card === null)
  useEffect(() => {
    if (gone) close()
  }, [gone]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pack || !asked) return
    let live = true
    void herEventOf(pack, asked.id, asked.rung).then((found) => {
      if (!live) return
      setEvent(found)
      if (found.steps.length === 0) setPlayed(true)
    }, () => live && setPlayed(true))
    return () => { live = false }
  }, [pack, asked?.id, asked?.rung]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!card || !asked || !save || !pack) return null
  const scene = event && event.steps.length > 0 && !played ? event : null
  if (!played && !event) return null
  if (scene) {
    return createPortal(
      <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>
        {(master) => {
          const nameOf = namer(master, pack)
          const title = `${asked.rung === 's2' ? 'Spouse 2' : 'Spouse 4'} · ${nameOf(asked.id)}`
          return (
            <Frame title={title} label={title} scene={`level:${asked.rung}:${asked.id}`} onSkip={() => setPlayed(true)} skipping={false}>
              <SceneLookProvider value={{ own: scene.outfit, moments: [], day: save.calendar.day, leads: [asked.id] }}>
                <LifeScene id={asked.id} steps={scene.steps} nameOf={nameOf} farmer={save.farmer.name} onDone={(steps) => { setShown(steps); setPlayed(true) }}
                  data={{ 'data-night-scene': asked.rung }} />
              </SceneLookProvider>
            </Frame>
          )
        }}
      </MasterGate>,
      document.body,
    )
  }
  return createPortal(
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="A level reached overnight" data-night-level={asked.rung}>
      <header className="flex min-h-12 items-center px-4"><p className="text-[13px] font-semibold text-ink-soft">Overnight</p></header>
      <MasterGate skeleton={null}>
        {(master) => <LevelUpCard card={card} id={asked.id} name={master.album.get(asked.id)?.name ?? 'An Uma'} love={save.love[asked.id]!} pack={pack} farmer={save.farmer.name} onContinue={close} />}
      </MasterGate>
    </div>,
    document.body,
  )
}
