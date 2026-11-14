// The wedding night, played inside the event player right after the wedding, before the Married stage-up: her route's
// `wedding-night` event, else the default story's, on the dialogue engine. She wears its outfit (the wedding night's,
// unless her story names another), on a night backdrop; she stays on the stage through the narration with the face of her
// last line. Tender and never explicit: it fades to morning. Its choices are wording only, and it pays nothing and saves
// nothing (the wedding already has). Skip, in the player's frame, ends it. Loaded with the event player.
import { sceneSteps, type PlayedEvent, type SaveV4, type Step } from '@farm/domain'
import { useEffect, useState } from 'react'
import { SceneLookProvider } from '../dialogue/Bust'
import { lastSay, Line, nextSay } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import { MasterGate } from '../master/MasterGate'
import { herEventOf, namer } from '../story/people'
import { useStory } from '../story/story'
import { silent, WordingChoice } from './ScenePlayer'

/** The night's backdrop: a lamp-lit room after dark. */
const NIGHT = <span aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #1d2742 0%, #3b3358 65%, #6b4a5e 100%)' }} data-backdrop="night" />

export function WeddingNight({ save, id, onDone }: { save: SaveV4; id: string; onDone: () => void }) {
  const story = useStory()
  const [event, setEvent] = useState<PlayedEvent | null>(null)
  useEffect(() => {
    if (!story) return
    let live = true
    void herEventOf(story, id, 'wedding-night').then((found) => live && setEvent(found), () => live && onDone())
    return () => { live = false }
  }, [story, id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!event || !story) return <div className="flex-1" />
  return (
    <SceneLookProvider value={{ own: event.outfit ?? 'wedding-night', moments: ['wedding-night'], day: save.calendar.day, leads: [id] }}>
      <MasterGate>{(master) => <Night id={id} steps={event.steps} nameOf={namer(master, story)} farmer={save.farmer.name} onDone={onDone} />}</MasterGate>
    </SceneLookProvider>
  )
}

function Night({ id, steps, nameOf, farmer, onDone }: { id: string; steps: readonly Step[]; nameOf: (who: string) => string; farmer: string; onDone: () => void }) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const shown = sceneSteps(steps, picks)
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const step = shown[cursor]
  const done = cursor >= shown.length
  useEffect(() => { if (done) onDone() }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!step) return <div className="flex-1" />
  const before = shown.slice(0, cursor)
  const speaker = 'say' in step ? step.say : null
  // She stays on the stage: the speaker, else her with her last line's face.
  const bust = speaker ?? id
  const emote = 'say' in step ? step.emote ?? null : lastSay(before, id)?.emote ?? null
  const choice = 'choice' in step && picks.length <= before.filter((s) => 'choice' in s).length ? step.choice : null
  if (choice) {
    return <WordingChoice options={choice} farmer={farmer} bust={{ who: bust, name: nameOf(bust), emote }} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
  }
  return (
    <Stage bust={{ who: bust, name: nameOf(bust), emote }} backdrop={NIGHT} next={nextSay(shown, cursor + 1)} onTap={() => setAt(cursor + 1)} data={{ 'data-wedding-night': true }}>
      <Line key={cursor} step={step} nameOf={nameOf} farmer={farmer} onNext={() => setAt(cursor + 1)} beat={cursor} typed />
    </Stage>
  )
}
