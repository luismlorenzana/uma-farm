import { eventOf, replaySteps, type BookReplay, type FarmSave, type Step, type StoryOutfit, type StoryPack } from '@farm/domain'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { environment } from '../dialogue/scene-context'
import { SceneLookProvider } from '../dialogue/Bust'
import { LifeScene, lifeEnvironment, stepsForLife, type LifeKind } from '../loop/LifeScene'
import { Frame } from '../loop/ScenePlayer'
import type { MasterView } from '../master/master'
import { namer } from '../story/people'

export default function LibraryReplay({ save, pack, master, id, entry, onClose }: {
  save: FarmSave; pack: StoryPack; master: MasterView | null; id: string; entry: BookReplay; onClose: () => void
}) {
  const [scene, setScene] = useState<{ steps: readonly Step[]; outfit?: StoryOutfit } | null | 'missing'>(null)
  const day = entry.day ?? save.calendar.day
  const nameOf = namer(master, pack)
  useEffect(() => {
    let live = true
    setScene(null)
    const historical = { ...save, calendar: { day } }
    const event = entry.source === 'life'
      ? master ? stepsForLife(entry.script as LifeKind, historical, pack, master, id) : Promise.resolve(null)
      : eventOf(pack, id, entry.script, nameOf(id))
    void event.then(result => live && setScene(result?.steps.length ? result : 'missing'), () => live && setScene('missing'))
    return () => { live = false }
  }, [entry.key, day, master, pack, id]) // eslint-disable-line react-hooks/exhaustive-deps
  const title = `Replay · ${entry.title}`
  return createPortal(<Frame title={title} label={title} scene={`library:${entry.key}`} onSkip={onClose} skipping={false}>
    {scene === 'missing' ? <p role="status" className="p-4">Replay unavailable.</p>
      : !scene ? <p className="p-4">Loading scene…</p>
        : <SceneLookProvider value={{ own: scene.outfit, moments: entry.moments ?? [], day, leads: [id] }}>
          <LifeScene id={id} steps={replaySteps(scene.steps).filter(step => !('illustration' in step))} nameOf={nameOf}
            farmer={save.farmer.name} atmosphere={entry.source === 'life' || entry.script === 'wedding-night' ? lifeEnvironment(save, entry.script as LifeKind | 'wedding-night', day) : environment(save, 'fields', 'afternoon', day)} onDone={onClose} data={{ 'data-library-replay': entry.key }} />
        </SceneLookProvider>}
  </Frame>, document.body)
}
