// The scene player: a full-screen sheet over the farm, played on the dialogue engine (`dialogue/`): her bust on the left
// (her portrait in the scene's outfit, her face changing with each line's emote; else her master-data bust, the emote
// as a bubble; a role's lettered disc while no one plays it), the speaker's name and one line on the right; a tap goes
// on, and **Skip** ends it. It plays **the opening's lines** on day 1, after the farmer's name: the pack's
// `opening.json`, else the game's three (`openingOf`), one to a tap, `{farmer}` filled, in the day's season. Its title
// line names where you are when the world names it ("Day 1 · ‹farm›, ‹town›", `openingTitle`), until a `place` step
// names a place. Played through or skipped from its first line, it's read once (`diary.read`), and the farm opens on
// Home: two taps for the game's own.
// It loads master data itself, for the Umas' names and busts; Skip works without it.
//
// It also plays the scene of **meeting her** (her arrival scene) from the story pack, the format's steps: `say` (her
// bust, the line with `{farmer}` filled, her face the emote's), `narrate`, `thought` (italic), `place` (the title
// line), `wait`, `flag` and `choice`, whose options show their gain before the tap (+30 for the best, +10 for the
// rest). She wears the scene's own `outfit` when the story names one, else the day's season. Skip jumps to the choice,
// never past it, so every meeting pays +50 and its choice (one the pack writes without one pays +50 alone). It plays as
// soon as she's met: right after you introduce yourself in town. It ends on where she lives: in town, where you met
// her. Its frame and steps also play the pair
// conversations (`PairPlayer.tsx`) and the household's scenes. Loaded on demand. The ring bench's scene (`scene:bench`)
// plays here too, its player loaded on demand (`BenchScene.tsx`). The frame hosts her illustration
// (`dialogue/Illustration.tsx`): her meeting opens on hers, full screen, when she has one, and ends on her bust.
import {
  ARRIVAL_POINTS, arrivalOf, atHome, BENCH_SCENE, choicePoints, farmPlace, illustrate, illustrationAt, openingOf, pathFlags, placeholderEvent, sceneSteps,
  withFarmer, worldNamesOf, type ChoiceOption, type OpeningSceneId, type PlayedEvent, type SaveV4, type SceneId, type Step, type WorldNamesPlayed,
} from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { ArtCue, ArtHost, useArtHeader } from '../dialogue/Illustration'
import { lastSay, Line, nextSay } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { useStory } from '../story/story'
import { finishArrivalScene, readSceneOnce, seeIllustrationOnce } from './actions'

import { EnvironmentProvider, useEnvironment } from '../dialogue/SceneBackground'
import { environment, environmentAt, type SceneEnvironment } from '../dialogue/scene-context'

const BenchScene = lazy(() => import('./BenchScene'))

export default function ScenePlayer({ scene }: { scene: SceneId }) {
  const save = useLoopSave()
  if (!save) return null
  if (scene === BENCH_SCENE) return <Suspense fallback={null}><BenchScene save={save} /></Suspense>
  const arrival = arrivalOf(scene)
  if (arrival) return <ArrivalPlayer save={save} id={arrival} />
  return <OpeningPlayer scene={scene as OpeningSceneId} />
}

/** The sheet's frame: the title line, Skip, and what plays. The pair conversations and the household's scenes play in
 * it too. */
export function Frame({ title, label, scene, onSkip, skipping, atmosphere, children }: { atmosphere?: SceneEnvironment; title: string; label: string; scene: string; onSkip: () => void; skipping: boolean; children: React.ReactNode }) {
  const inherited = useEnvironment()
  return (
    <EnvironmentProvider value={atmosphere ?? inherited}>
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={label} data-scene={scene}>
      <ArtHost onSeen={seeIllustrationOnce}>
        <FrameHeader title={title} onSkip={onSkip} skipping={skipping} />
        {children}
      </ArtHost>
    </div>
    </EnvironmentProvider>
  )
}

/** The frame's title line and Skip: light over her illustration. */
function FrameHeader({ title, onSkip, skipping }: { title: string; onSkip: () => void; skipping: boolean }) {
  return (
    <header className={`flex min-h-12 items-center justify-between gap-2 px-4 ${useArtHeader()}`}>
      <p className="text-micro text-ink-soft" data-scene-title>{title}</p>
      <button type="button" onClick={onSkip} disabled={skipping} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink-soft" data-action="skip">
        Skip
      </button>
    </header>
  )
}

function OpeningPlayer({ scene }: { scene: OpeningSceneId }) {
  const save = useLoopSave()
  const story = useStory()
  const navigate = useNavigate()
  const location = useLocation()
  const [leaving, setLeaving] = useState(false)
  // The lines are read once, when the opening starts (the pack is in by then: the boot waits for it).
  const [lines, setLines] = useState<readonly Step[] | null>(() => (story ? openingOf(story) : null))
  useEffect(() => {
    if (!lines && story) setLines(openingOf(story))
  }, [lines, story])
  const [at, setAt] = useState(0)
  if (!save) return null
  /** Played through or skipped: the opening is read, once, and the farm opens on Home. */
  const finish = () => {
    if (leaving) return
    setLeaving(true)
    if (location.pathname !== '/') navigate('/', { replace: true })
    void readSceneOnce(scene).catch(() => setLeaving(false))
  }
  const shown = lines ?? []
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const place = shown.slice(0, cursor + 1).reduce<string | null>((p, s) => ('place' in s ? s.place : p), null)
  const title = openingTitle(place, worldNamesOf(story))
  const step = lines ? shown[cursor] : undefined
  return (
    <SceneLookProvider value={{ day: save.calendar.day }}>
      <Frame atmosphere={environmentAt(shown, cursor, environment(save, 'gate', 'morning'))} title={title} label="The opening" scene={scene} onSkip={finish} skipping={leaving}>
        {lines && !step ? <Done onDone={finish} /> : step ? (
          <MasterGate>{(master) => (
            <StepView key={cursor} steps={shown} at={cursor} nameOf={namer(master, story)} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
          )}</MasterGate>
        ) : <div className="flex-1" />}
      </Frame>
    </SceneLookProvider>
  )
}

/** The opening's title line: "Day 1 · Gate" once a `place` step names one; before it, where you are as the world names
 * it ("Day 1 · Thistle Farm, Fernwick": the farm's name and the town's, either alone), else "Day 1". */
export function openingTitle(place: string | null, names: Pick<WorldNamesPlayed, 'farm' | 'town'>): string {
  if (place) return `Day 1 · ${placeName(place)}`
  const where = [names.farm, names.town].filter((n): n is string => n !== null)
  return where.length > 0 ? `Day 1 · ${where.join(', ')}` : 'Day 1'
}

/** The opening's end: the last tap reads it and opens Home. */
function Done({ onDone }: { onDone: () => void }) {
  useEffect(() => onDone(), []) // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="flex-1" />
}

// --- Meeting her: her arrival scene ----------------------------------------------------------------------

/** A story place as the title line says it: a farm place's name, else its words ("pond-night" → "Pond night"). */
export const placeName = (place: string): string => farmPlace(place)?.name ?? `${place.charAt(0).toUpperCase()}${place.slice(1).replaceAll('-', ' ')}`
/** Steps that show nothing of their own: they set the title line, a flag, or her illustration. */
export const silent = (step: Step): boolean => 'place' in step || 'flag' in step || 'illustration' in step

function ArrivalPlayer({ save, id }: { save: SaveV4; id: string }) {
  const story = useStory()
  const [event, setEvent] = useState<Pick<PlayedEvent, 'steps' | 'outfit'> | null>(null)
  useEffect(() => {
    if (!story) return
    let live = true
    // Her route's arrival scene, else the default story's meeting in town, in her name; offline with her route not cached
    // yet, the default's.
    void herEventOf(story, id, 'arrival').then((found) => live && setEvent(found), () => live && setEvent({ steps: placeholderEvent(id, 'arrival', true) }))
    return () => { live = false }
  }, [story, id])
  if (!event) return null
  return (
    <SceneLookProvider value={{ own: event.outfit, day: save.calendar.day, leads: [id] }}>
      <MasterGate>{(master) => <Arrival save={save} id={id} steps={event.steps} master={master} />}</MasterGate>
    </SceneLookProvider>
  )
}

function Arrival({ save, id, steps: written, master }: { save: SaveV4; id: string; steps: readonly Step[]; master: MasterView }) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  // Her meeting opens on her illustration for it, when she has one (the story's own, if it names any).
  const steps = useMemo(() => illustrate('meeting', written), [written])
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  const story = useStory()
  const nameOf = namer(master, story)
  const name = nameOf(id)
  // The first visible step from `from`, past the silent ones; and the title line, the last place before it.
  const visible = (from: number): number => {
    let i = from
    while (i < shown.length && silent(shown[i]!)) i++
    return i
  }
  const cursor = visible(at)
  const place = shown.slice(0, cursor + 1).reduce<string | null>((p, s) => ('place' in s ? s.place : p), null)
  const step = shown[cursor]
  const done = cursor >= shown.length
  const choiceAt = shown.findIndex((s, i) => 'choice' in s && picks.length <= shown.slice(0, i).filter((x) => 'choice' in x).length)
  const finish = () => {
    if (leaving) return
    const choice = shown.find((s): s is { choice: ChoiceOption[] } => 'choice' in s)
    const pick = picks[0]
    // Her arrival always holds a choice (a written one without gets the hello): its first choice pays with the +50.
    if (choice && pick === undefined) return
    setLeaving(true)
    void finishArrivalScene(id, { choice: choice && pick !== undefined ? choicePoints(choice.choice)[pick]! : 0, flags: pathFlags(shown) }).catch(() => setLeaving(false))
  }
  // Skip: to her choice, never past it; once chosen, to the end.
  const skip = () => {
    if (choiceAt !== -1) setAt(choiceAt)
    else setAt(shown.length)
  }
  const chosen = shown.find((s): s is { choice: ChoiceOption[] } => 'choice' in s)
  const earned = ARRIVAL_POINTS + (chosen && picks[0] !== undefined ? choicePoints(chosen.choice)[picks[0]]! : 0)
  const title = place ? `Meeting ${name} · ${placeName(place)}` : `Meeting ${name}`
  // At her choice and at the end, she stays on the stage with her last line's face.
  const herLast = lastSay(shown.slice(0, cursor), id)?.emote ?? null
  return (
    <Frame atmosphere={environmentAt(shown, cursor, environment(save, atHome(save, id) ? 'gate' : 'plaza'))} title={title} label={`Meeting ${name}`} scene={`arrival:${id}`} onSkip={skip} skipping={leaving}>
      {/* Her illustration while the scene plays; down at its end, where she smiles. */}
      <ArtCue owner={id} ask={done ? null : illustrationAt(shown, cursor)} steps={steps} />
      {done ? <Welcome onDone={finish} id={id} name={name} points={earned} home={atHome(save, id)} />
        : step && 'choice' in step && choiceAt === cursor ? (
          <Choice id={id} name={name} emote={herLast} options={step.choice} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
        ) : step ? (
          <StepView key={cursor} steps={shown} at={cursor} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
        ) : null}
    </Frame>
  )
}

/** Meeting her ends: her points are in, and where she lives says so: in town, where you met her (or the farm, for one
 * who lives there). She smiles. */
function Welcome({ id, name, points, home, onDone }: { id: string; name: string; points: number; home: boolean; onDone: () => void }) {
  return (
    <Stage bust={{ who: id, name, emote: 'happy' }} data={{ 'data-arrival-done': true, 'data-points': points, 'data-home': home }}>
      <p className="text-center text-[15px] font-semibold text-[#c2385e]">♥ +{points}</p>
      <p className="text-center text-[14px] text-ink-soft" data-lives>{home ? 'She lives on the farm.' : 'She lives in town: find her there.'}</p>
      <Button className="w-full" onClick={onDone} data-action="welcome">Welcome, {name}</Button>
    </Stage>
  )
}

/** One step on the stage: a line with the speaker's bust (her face the line's emote), a narration, a thought, or a pause
 * that goes on by itself. The next spoken line's bust is preloaded. */
export function StepView({ steps, at, nameOf, farmer, onNext }: {
  steps: readonly Step[]; at: number; nameOf: (id: string) => string; farmer: string; onNext: () => void
}) {
  const step = steps[at]!
  const speaker = 'say' in step ? step.say : null
  const count = steps.slice(0, at).filter((s) => !silent(s)).length
  const total = steps.filter((s) => !silent(s)).length
  return (
    <Stage bust={speaker ? { who: speaker, name: nameOf(speaker), emote: 'say' in step ? step.emote ?? null : null } : null} next={nextSay(steps, at + 1)} onTap={onNext}>
      <Line step={step} nameOf={nameOf} farmer={farmer} onNext={onNext} beat={at} count={{ at: count + 1, of: total }} />
    </Stage>
  )
}

/** Meeting her: her one choice, each option with its gain on the button before the tap (+30 for the best, +10 the rest). */
function Choice({ id, name, emote, options, onPick }: { id: string; name: string; emote: string | null; options: readonly ChoiceOption[]; onPick: (i: number) => void }) {
  const points = choicePoints(options)
  return (
    <Stage bust={{ who: id, name, emote }} data={{ 'data-choice': true }}>
      <p className="w-full text-[13px] text-ink-soft">Your answer · +50 for meeting her, and</p>
      {options.map((option, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} data-option={i} data-gain={points[i]}
          className="flex min-h-12 w-full shrink-0 items-center gap-3 rounded-md border border-hairline bg-panel px-4 py-2 text-left shadow-1">
          <span className="min-w-0 flex-1 text-[15px]">{option.text}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] font-bold ${points[i] === 30 ? 'bg-[#c2385e]/15 text-[#c2385e]' : 'bg-sunken text-ink-soft'}`}>♥ +{points[i]}</span>
        </button>
      ))}
    </Stage>
  )
}

/** A choice that is wording only (a pair's, the household's): no gain. The last speaker stays on the stage. */
export function WordingChoice({ options, farmer, bust, onPick }: {
  options: readonly ChoiceOption[]; farmer: string; bust: { who: string; name: string; emote: string | null } | null; onPick: (i: number) => void
}) {
  return (
    <Stage bust={bust} data={{ 'data-choice': true }}>
      <p className="text-[13px] text-ink-soft">You</p>
      {options.map((option, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} data-option={i}
          className="flex min-h-12 w-full shrink-0 items-center rounded-md border border-hairline bg-panel px-4 py-2 text-left text-[15px] shadow-1">
          {withFarmer(option.text, farmer)}
        </button>
      ))}
    </Stage>
  )
}
