// An occasion scene: `?occasion=<id>` over any page (the calendar's day panel opens it), today's occasion with her on the
// dialogue engine: New Year's (from the second year), the Flower Show or the Fishing Derby's night (`occasionOn`). It
// plays her route's event of that id, else the default story's, in her name (`herEventOf`); she wears the scene's own
// outfit when the story names one, else the occasion's moment's (the kimono at New Year's and the derby night, the garden
// party dress at the Flower Show), and she stays on the stage through the narration; her illustration shows where the
// story names one. A choice is wording only. Its end, or Skip, spends its action (the day's event actions
// first) and marks her played today (`playOccasion`); it pays nothing. With no occasion with her today it closes; with
// no action left it says so before it plays. Portaled above the kit's sheets (z-60). Loaded on demand.
import {
  actionCost, canSpendForEvent, festivalsOf, GAME_DAYS, illustrationAt, occasionMoments, occasionName, occasionWith, sceneSteps, type PlayedEvent, type PlayedOccasion, type SaveV4,
  type Step,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { ArtCue } from '../dialogue/Illustration'
import { lastSay, Line, nextSay } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { useSpecialDays, useStory } from '../story/story'
import { playOccasionOnce } from './event-actions'
import { Frame, placeName, silent, WordingChoice } from './ScenePlayer'

export default function OccasionPlayer({ id }: { id: string }) {
  const save = useLoopSave()
  const story = useStory()
  const special = useSpecialDays()
  const location = useLocation()
  const leave = useLeave()
  const close = () => leave(withParam(location, 'occasion', null))
  // Settled once, as it starts: playing it ends today's occasion with her.
  const [occasion, setOccasion] = useState<PlayedOccasion | null | 'none' | 'spent'>(null)
  const [event, setEvent] = useState<PlayedEvent | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (occasion !== null || !save || !story) return
    const days = special ?? GAME_DAYS
    const today = occasionWith(save, id, days.festivals)
    if (!today) return setOccasion('none')
    setOccasion(canSpendForEvent(save, actionCost('event'), days) ? today : 'spent')
  }, [occasion, save, story, special, id])
  useEffect(() => {
    if (occasion === 'none') close()
  }, [occasion]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!story || occasion === null || occasion === 'none' || occasion === 'spent') return
    let live = true
    void herEventOf(story, id, occasion).then((found) => live && setEvent(found), () => live && close())
    return () => { live = false }
  }, [story, occasion, id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || !story || occasion === null || occasion === 'none') return null
  if (occasion === 'spent') return createPortal(<NoActions onClose={close} />, document.body)
  const finish = () => {
    if (leaving) return
    setLeaving(true)
    void playOccasionOnce(id).then(close, (e: unknown) => {
      setLeaving(false)
      setError(e instanceof Error ? e.message : 'That didn’t work. Try again.')
    })
  }
  const title = occasionName(occasion, festivalsOf(story))
  return createPortal(
    <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>
      {(master) => (error
        ? <Failed error={error} onRetry={finish} onClose={close} />
        : event
          ? (
            <SceneLookProvider value={{ own: event.outfit, moments: occasionMoments(occasion), day: save.calendar.day, leads: [id] }}>
              <Scene save={save} id={id} title={`${title} · ${namer(master, story)(id)}`} steps={event.steps} nameOf={namer(master, story)} leaving={leaving} onDone={finish} />
            </SceneLookProvider>
          )
          : <div className="fixed inset-0 z-[60] bg-page" />)}
    </MasterGate>,
    document.body,
  )
}

/** The scene's steps, a choice's `then` spliced in after the pick (wording only); its title the occasion's, then the
 * place a `place` step names. */
function Scene({ save, id, title, steps, nameOf, leaving, onDone }: {
  save: SaveV4; id: string; title: string; steps: readonly Step[]; nameOf: (who: string) => string; leaving: boolean; onDone: () => void
}) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const place = shown.slice(0, cursor + 1).reduce<string | null>((p, s) => ('place' in s ? s.place : p), null)
  const step = shown[cursor]
  const done = cursor >= shown.length
  useEffect(() => {
    if (done) onDone()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  // She stays on the stage: the speaker, else her with her last line's face (at a choice, the last one to speak).
  const before = shown.slice(0, cursor)
  const last = lastSay(before) ?? { who: id, emote: null }
  const who = step && 'say' in step ? step.say : id
  const emote = step && 'say' in step ? step.emote ?? null : lastSay(before, id)?.emote ?? null
  return (
    <Frame title={place ? `${title} · ${placeName(place)}` : title} label={title} scene={`occasion:${id}`} onSkip={onDone} skipping={leaving}>
      {/* Her illustration where the story names one. */}
      <ArtCue owner={id} ask={step ? illustrationAt(shown, cursor) : null} steps={steps} />
      {step && 'choice' in step ? (
        <WordingChoice options={step.choice} farmer={save.farmer.name} bust={{ ...last, name: nameOf(last.who) }}
          onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
      ) : step ? (
        <Stage bust={{ who, name: nameOf(who), emote }} next={nextSay(shown, cursor + 1)} onTap={() => setAt(cursor + 1)}>
          <Line key={cursor} step={step} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} beat={cursor} typed />
        </Stage>
      ) : <div className="flex-1" />}
    </Frame>
  )
}

/** No action left today, of either kind: said before it plays, with Back. */
function NoActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex items-center justify-center bg-page/95 px-4" role="dialog" aria-modal="true" aria-label="No actions left" data-no-actions>
      <div className="w-full max-w-sm space-y-3 rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="font-display text-[18px] font-semibold">No actions left today.</p>
        <p className="text-[14px] text-ink-soft">An occasion takes one action.</p>
        <Button className="w-full" onClick={onClose} data-action="back">Back</Button>
      </div>
    </div>
  )
}

/** Saving it didn't work: Try again, or Back (it stays to play). */
function Failed({ error, onRetry, onClose }: { error: string; onRetry: () => void; onClose: () => void }) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex items-center justify-center bg-page/95 px-4" role="dialog" aria-modal="true" aria-label="Not saved" data-occasion-error>
      <div className="w-full max-w-sm space-y-3 rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="text-[15px] text-danger">{error}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button onClick={onRetry} data-action="try-again">Try again</Button>
        </div>
      </div>
    </div>
  )
}
