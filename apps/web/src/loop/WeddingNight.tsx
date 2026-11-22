// The wedding night and moving in, played inside the event player right after the wedding, before the Married stage-up:
// - **the wedding night**: her route's `wedding-night` event, else the default story's, on the dialogue engine. She wears
//   its outfit (the wedding night's, unless her story names another), on a night backdrop; she stays on the stage through
//   the narration with the face of her last line. With her illustrations it shows `wedding-night`, then
//   `wedding-night-end` as it fades. Tender and never explicit: it fades to morning;
// - **moving in**, the morning after: her route's `moving-in`, else the default story's, as she moves into the room she
//   took (your home, or a house built for her). One who's still waiting for a room moves in the morning a room is free,
//   and the morning's line plays it then (`?life=moving-in:<id>`).
// Their choices are wording only, and they pay nothing and save nothing (the wedding already has). Skip, in the player's
// frame, ends each. Loaded with the event player.
import type { Moment, PlayedEvent, SaveV4, StoryOutfit } from '@farm/domain'
import { useEffect, useState } from 'react'
import { SceneLookProvider } from '../dialogue/Bust'
import { MasterGate } from '../master/MasterGate'
import { herEventOf, namer } from '../story/people'
import { useStory } from '../story/story'
import { LifeScene, lifeEnvironment } from './LifeScene'

/** Her life's event after the wedding: the wedding night, or moving in. */
export type AfterWedding = 'wedding-night' | 'moving-in'
const LOOK: Readonly<Record<AfterWedding, { own: StoryOutfit | undefined; moments: Moment[] }>> = {
  'wedding-night': { own: 'wedding-night', moments: ['wedding-night'] },
  'moving-in': { own: undefined, moments: [] },
}

export function WeddingNight({ save, id, event: which = 'wedding-night', onDone }: { save: SaveV4; id: string; event?: AfterWedding; onDone: () => void }) {
  const story = useStory()
  const [event, setEvent] = useState<PlayedEvent | null>(null)
  useEffect(() => {
    if (!story) return
    let live = true
    void herEventOf(story, id, which).then((found) => live && setEvent(found), () => live && onDone())
    return () => { live = false }
  }, [story, id, which]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!event || !story) return <div className="flex-1" />
  const look = LOOK[which]
  return (
    <SceneLookProvider value={{ own: event.outfit ?? look.own, moments: look.moments, day: save.calendar.day, leads: [id] }}>
      <MasterGate>
        {(master) => (
          <LifeScene key={which} id={id} steps={event.steps} nameOf={namer(master, story)} farmer={save.farmer.name} onDone={() => {
            void import('./actions').then(actions => actions.readLifeOnce(id, which, save.calendar.day)).catch(() => undefined)
            onDone()
          }} illustrated={which === 'wedding-night' ? 'wedding-night' : null}
            atmosphere={lifeEnvironment(save, which, save.calendar.day)} data={which === 'wedding-night' ? { 'data-wedding-night': true } : { 'data-moving-in': true }} />
        )}
      </MasterGate>
    </SceneLookProvider>
  )
}
