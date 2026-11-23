// Her life's short scenes on the dialogue engine, the Uma loop's: the wedding night's and moving in's (inside the event
// player, after the wedding), an evening's (inside the evening, after its play), and over any page at `?life=`:
//   `?life=morning:<id>`        the night's companion greets you, in pajamas, a short scene: right after the night, and
//                                from the morning's ☾ line (her temperament's greeting, the same all morning);
//   `?life=moving-in:<id>`      moving in: her route's `moving-in`, else the default story's, from the morning's
//                                "moved into" line (a spouse who waited for a room);
//   `?life=invited-to-work:<id>` the invitation to work: her route's `invited-to-work`, else the default story's (at the
//                                farm gate, in the day's outfit), right after you invite her, the action spent;
//   `?life=breakfast:<id>`,     a meal's scene: one spouse's line as you sit down, after you cook it;
//   `?life=dinner:<id>`
//   `?life=talk:<id>`           today's talk with her (`todaysTalk`): her greeting, then her line or a small talk, your
//                                lines under your name with her staying on the stage; right after a talk, on the farm or
//                                in town.
// She stays on the stage through the narration with the face of her last line; a choice is wording only. Her
// illustrations show full screen where the story names one, and by the default mapping: the wedding night's two, a night
// in's, and the night's companion's before her morning greeting. They pay nothing and save nothing (an illustration seen
// joins her gallery); Skip, or the end, closes. A `?life=` link plays only what the game has given you (`mayPlayLife`:
// the morning after her night, her wedding day or the morning she moved in, the day you invited her, a meal cooked today
// that she ate, a talk today); any other closes quietly. Portaled above the sheets (z-60). Loaded on demand.
import {
  birthdaysOf, townDay, greetingScene, illustrate, illustrationAt, mayPlayLife, mealScene, sceneSteps, todaysTalk, YOU, type FarmSave, type IllustratedScene, type Meal, type Moment, type SaveV4, type Step,
  type StoryOutfit, type StoryPack,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect, useMemo, useState } from 'react'
import { EnvironmentProvider, useEnvironment } from '../dialogue/SceneBackground'
import { environment, environmentAt, type SceneEnvironment } from '../dialogue/scene-context'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { ArtCue } from '../dialogue/Illustration'
import { lastSay, Line, nextSay } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { outfitFor, useStory } from '../story/story'
import { Frame, silent, WordingChoice } from './ScenePlayer'
import { talentTable } from './talents'

/**
 * A short scene's steps, played: each line with the speaker's bust; she (`id`) stays on the stage through narration with
 * her last line's face; a choice is wording only, its `then` spliced in. `onDone` at its end, with the steps as played.
 */
export function LifeScene({ id, steps: written, nameOf, farmer, atmosphere, illustrated = null, onDone, data = {}, walkOn }: {
  id: string; steps: readonly Step[]; nameOf: (who: string) => string; farmer: string; atmosphere?: SceneEnvironment; onDone: (played: readonly Step[]) => void
  /** Which of her illustrated scenes this is (the wedding night, a night in, the morning greeting): her illustrations by
   * the default mapping, unless the story names its own. */
  illustrated?: IllustratedScene | null
  walkOn?: React.ReactNode
  data?: { [key: `data-${string}`]: string | number | boolean | undefined }
}) {
  const inherited = useEnvironment()
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const steps = useMemo(() => illustrate(illustrated, written), [written, illustrated])
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const step = shown[cursor]
  const done = cursor >= shown.length
  useEffect(() => {
    if (done) onDone(shown)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  // Her illustration while it's up (the story's own, or the default mapping's); down at the end.
  const art = <ArtCue owner={id} ask={step ? illustrationAt(shown, cursor) : null} steps={steps} />
  if (!step) return <>{art}<div className="flex-1" /></>
  const before = shown.slice(0, cursor)
  // The farmer is never drawn: on your line (a small talk's `you`) she stays on the stage with her last face.
  const speaker = 'say' in step && step.say !== YOU ? step.say : null
  const bust = speaker ?? id
  const emote = speaker !== null && 'say' in step ? step.emote ?? null : lastSay(before, id)?.emote ?? null
  const next = nextSay(shown, cursor + 1)
  const current = environmentAt(shown, cursor, atmosphere ?? inherited)
  if ('choice' in step) {
    return <EnvironmentProvider value={current}>{art}<WordingChoice options={step.choice} farmer={farmer} bust={{ who: bust, name: nameOf(bust), emote }} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} /></EnvironmentProvider>
  }
  return (
    <>
      {art}
      <Stage bust={{ who: bust, name: nameOf(bust), emote }} environment={current} walkOn={walkOn} next={next?.who === YOU ? null : next} onTap={() => setAt(cursor + 1)} data={data}>
        <Line key={cursor} step={step} nameOf={nameOf} farmer={farmer} onNext={() => setAt(cursor + 1)} beat={cursor} typed />
      </Stage>
    </>
  )
}

// --- `?life=` -------------------------------------------------------------------------------------------------------

export type LifeKind = 'morning' | 'moving-in' | 'invited-to-work' | 'talk' | Meal
const LIFE = /^(morning|moving-in|invited-to-work|talk|breakfast|dinner):(s?\d{1,12})$/
/** What `?life=` asks for: its kind and her id. */
export function parseLife(value: string | null): { kind: LifeKind; id: string } | null {
  const m = value ? LIFE.exec(value) : null
  return m ? { kind: m[1] as LifeKind, id: m[2]! } : null
}
/** The link that plays one: `?life=<kind>:<id>`. */
export const lifeParam = (kind: LifeKind, id: string): string => `${kind}:${id}`

/** A scene's titles and look by its kind. */
const TITLES: Readonly<Record<LifeKind, string>> = { morning: 'Morning', 'moving-in': 'Moving in', 'invited-to-work': 'Invited to work', talk: 'Talk', breakfast: 'Breakfast', dinner: 'Dinner' }
const MOMENTS: Readonly<Record<LifeKind, Moment[]>> = { morning: ['night-in'], 'moving-in': [], 'invited-to-work': [], talk: [], breakfast: [], dinner: [] }

/** The scene `?life=` plays: its steps (her route's moving-in and invitation are read on demand), with her outfit when it
 * names one. */
export async function stepsForLife(kind: LifeKind, save: SaveV4, story: StoryPack, master: MasterView, id: string): Promise<{ steps: readonly Step[]; outfit?: StoryOutfit }> {
  const name = namer(master, story)(id)
  switch (kind) {
    case 'morning': return { steps: greetingScene(save, story, id, talentTable(master).get(outfitFor(id))?.temperament ?? 'steady', name), outfit: 'pajamas' }
    case 'moving-in': case 'invited-to-work': {
      const event = await herEventOf(story, id, kind)
      return { steps: event.steps, ...(event.outfit ? { outfit: event.outfit } : {}) }
    }
    case 'talk': {
      // `{name}` is hers (the default story's talks), filled here as her profile and the town fill it; the line fills
      // `{farmer}`.
      const steps = todaysTalk(save, story, id, talentTable(master).get(outfitFor(id))?.temperament ?? 'steady', birthdaysOf(story, master.birthdays)).steps
      return { steps: steps.map((s) => ('say' in s ? { ...s, line: s.line.split('{name}').join(name) } : s)) }
    }
    default: return { steps: mealScene(save, story, id, kind, name) }
  }
}

export function lifeEnvironment(save: FarmSave, kind: LifeKind | 'wedding-night', day: number, talkAt?: string | null) {
  if (kind === 'morning') return environment(save, 'bedroom', 'morning', day)
  if (kind === 'wedding-night') return environment(save, 'bedroom', 'night', day)
  if (kind === 'moving-in') return environment(save, 'home-threshold', 'morning', day)
  if (kind === 'breakfast' || kind === 'dinner') return environment(save, 'home-table', kind === 'breakfast' ? 'morning' : 'night', day)
  return environment(save, kind === 'talk' ? talkAt ?? 'fields' : 'gate', undefined, day)
}

export default function LifePlayer({ value }: { value: string }) {
  const save = useLoopSave()
  const story = useStory()
  const location = useLocation()
  const leave = useLeave()
  const asked = parseLife(value)
  const close = () => leave(withParam(location, 'life', null))
  // Settled once, as it opens (`mayPlayLife`): a link the game hasn't given you closes, with no scene and no picture.
  const [allowed, setAllowed] = useState<boolean | null>(null)
  useEffect(() => {
    if (allowed === null && save) setAllowed(!!asked && mayPlayLife(save, asked.kind, asked.id))
  }, [save, allowed, asked?.kind, asked?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (allowed === false) close()
  }, [allowed]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || !story || !asked || allowed !== true) return null
  return createPortal(
    <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>
      {(master) => <Played kind={asked.kind} id={asked.id} save={save} story={story} master={master} onClose={close} />}
    </MasterGate>,
    document.body,
  )
}

function Played({ kind, id, save, story, master, onClose }: { kind: LifeKind; id: string; save: SaveV4; story: StoryPack; master: MasterView; onClose: () => void }) {
  // Read once, as it starts: the morning's greeting and a meal's line are the day's draw.
  const [scene, setScene] = useState<{ steps: readonly Step[]; outfit?: StoryOutfit } | null>(null)
  useEffect(() => {
    let live = true
    void stepsForLife(kind, save, story, master, id).then((found) => live && setScene(found), () => live && onClose())
    return () => { live = false }
  }, [kind, id]) // eslint-disable-line react-hooks/exhaustive-deps
  const names = namer(master, story)
  // A small talk's `you` is the farmer, by name.
  const nameOf = (who: string) => (who === YOU ? save.farmer.name || 'You' : names(who))
  const title = `${TITLES[kind]} · ${nameOf(id)}`
  const location = useLocation()
  const talkAt = kind === 'talk' ? (location.pathname === '/town' ? townDay(save, story).where.get(id) ?? 'plaza' : 'fields') : null
  const atmosphere = lifeEnvironment(save, kind, save.calendar.day, talkAt)
  return (
    <Frame title={title} label={title} scene={`life:${kind}:${id}`} onSkip={onClose} skipping={false}>
      {scene
        ? (
          <SceneLookProvider value={{ own: scene.outfit, moments: MOMENTS[kind], day: save.calendar.day, leads: [id] }}>
            <LifeScene id={id} steps={scene.steps} nameOf={nameOf} farmer={save.farmer.name} atmosphere={atmosphere} onDone={() => {
              const bible = story.bibles.get(id)
              if (kind === 'moving-in' || kind === 'invited-to-work' || (kind === 'morning' && bible?.mornings?.length)
                || ((kind === 'breakfast' || kind === 'dinner') && bible?.meals?.[kind]?.length)) {
                void import('./actions').then(actions => actions.readLifeOnce(id, kind, save.calendar.day)).catch(() => undefined)
              }
              onClose()
            }}
              illustrated={kind === 'morning' ? 'companion' : null} data={{ 'data-life': kind }} />
          </SceneLookProvider>
        )
        : <div className="flex-1" />}
    </Frame>
  )
}
