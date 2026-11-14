// The scene player: a full-screen sheet over the farm. A bust (an Uma's from master data through uma-kit's `UmaBust`:
// the cast's, a sister's, or the town's people's, each role played by an Uma; a role's lettered disc while no one plays
// it), the speaker's name and one line; a tap goes on, and **Skip** ends
// it. It plays **the opening's lines** on day 1, after the farmer's name: the pack's `opening.json`, else the game's three
// (`openingOf`), one to a tap, `{farmer}` filled. Its title line names where you are when the world names it ("Day 1 ·
// ‹farm›, ‹town›", `openingTitle`), until a `place` step names a place. Played through or skipped from its first line,
// it's read once (`diary.read`), and the farm opens on Home, day 1's visitor waiting at the Gate: three taps for the
// game's own.
// It loads master data itself, for the Umas' names and busts; Skip works without it.
//
// It also plays the scene of **meeting her** (her arrival scene) from the story pack, the format's steps: `say` (her
// bust, the line with `{farmer}` filled, the emote as a word), `narrate`, `thought` (italic), `place` (the title line),
// `wait`, `flag` and `choice`, whose options show their gain before the tap (+30 for the best, +10 for the rest). Skip
// jumps to the choice, never past it, so every meeting pays +50 and its choice (one the pack writes without one pays +50
// alone). It plays as soon as she's met: after Say hello at the Gate, a talk or a gift in town that met her, or the
// morning after the night met her. It ends on where she lives: the Dorm, or town while no bed is free. Its frame and
// steps also play the pair conversations (`PairPlayer.tsx`). Loaded on demand. The ring bench's scene (`scene:bench`) plays
// here too, its player loaded on demand (`BenchScene.tsx`).
import {
  ARRIVAL_POINTS, arrivalOf, atHome, BENCH_SCENE, CAST, choicePoints, eventOf, farmPlace, isCastId, onWelcomeList, openingOf, pathFlags, placeholderEvent, sceneSteps,
  withFarmer, worldNamesOf, type CastId, type ChoiceOption, type OpeningSceneId, type SaveV4, type SceneId, type Step, type WorldNamesPlayed,
} from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer, whoIs } from '../story/people'
import { useStory } from '../story/story'
import { finishArrivalScene, readSceneOnce } from './actions'

const BenchScene = lazy(() => import('./BenchScene'))

/** A role's lettered disc, while no one plays it (with no master data): its word's first letter. */
export function RoleDisc({ id, size }: { id: CastId; size: number }) {
  return (
    <span aria-hidden className="font-display flex shrink-0 items-center justify-center rounded-full bg-[#6f6a63] font-bold text-white shadow-2 ring-4 ring-white/70"
      style={{ width: size, height: size, fontSize: size * 0.42 }} data-cast={id}>
      {CAST[id].role.replace(/^The /, '').charAt(0).toUpperCase()}
    </span>
  )
}

/** Anyone's bust as she speaks: an Uma's from master data (the cast's, a sister's, or one of the town's people's, a
 * role going to the Uma who plays it), or a role's disc while no one plays it. */
export function PersonBust({ who, name, size }: { who: string; name: string; size: number }) {
  const story = useStory()
  const id = whoIs(story, who)
  return isCastId(id) ? <RoleDisc id={id} size={Math.round(size * 0.74)} /> : <UmaBust outfitId={id} label={name} size={size} />
}

export default function ScenePlayer({ scene }: { scene: SceneId }) {
  const save = useLoopSave()
  if (!save) return null
  if (scene === BENCH_SCENE) return <Suspense fallback={null}><BenchScene save={save} /></Suspense>
  const arrival = arrivalOf(scene)
  if (arrival) return <ArrivalPlayer save={save} id={arrival} />
  return <OpeningPlayer scene={scene as OpeningSceneId} />
}

/** Landscape: her bust on the left, the lines or the choices on the right, both resting on the foot. */
export const SCENE_ROW = 'flex min-h-0 flex-1 flex-row items-end gap-4 px-4 pb-4'
export const SCENE_BUST = 'flex h-full w-[38%] max-w-[300px] shrink-0 items-end justify-center overflow-hidden'

/** The sheet's frame: the title line, Skip, and what plays. The pair conversations play in it too. */
export function Frame({ title, label, scene, onSkip, skipping, children }: { title: string; label: string; scene: string; onSkip: () => void; skipping: boolean; children: React.ReactNode }) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={label} data-scene={scene}>
      <header className="flex min-h-12 items-center justify-between gap-2 px-4">
        <p className="text-micro text-ink-soft" data-scene-title>{title}</p>
        <button type="button" onClick={onSkip} disabled={skipping} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink-soft" data-action="skip">
          Skip
        </button>
      </header>
      {children}
    </div>
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
    <Frame title={title} label="The opening" scene={scene} onSkip={finish} skipping={leaving}>
      {lines && !step ? <Done onDone={finish} /> : step ? (
        <MasterGate>{(master) => (
          <StepView key={cursor} step={step} at={cursor} count={shown.slice(0, cursor).filter((s) => !silent(s)).length} total={shown.filter((s) => !silent(s)).length}
            nameOf={namer(master, story)} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
        )}</MasterGate>
      ) : <div className="flex-1" />}
    </Frame>
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
/** Steps that show nothing of their own: they set the title line, or a flag. */
export const silent = (step: Step): boolean => 'place' in step || 'flag' in step

function ArrivalPlayer({ save, id }: { save: SaveV4; id: string }) {
  const story = useStory()
  const [steps, setSteps] = useState<readonly Step[] | null>(null)
  useEffect(() => {
    if (!story) return
    let live = true
    // Her route's arrival scene, else the game's two lines and a hello (the Gate's, or the town's); offline with her route
    // not cached yet, the same.
    void eventOf(story, id, 'arrival').then((event) => live && setSteps(event.steps), () => live && setSteps(placeholderEvent(id, 'arrival', !onWelcomeList(story, id))))
    return () => { live = false }
  }, [story, id])
  if (!steps) return null
  return (
    <MasterGate>{(master) => <Arrival save={save} id={id} steps={steps} master={master} />}</MasterGate>
  )
}

function Arrival({ save, id, steps, master }: { save: SaveV4; id: string; steps: readonly Step[]; master: MasterView }) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
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
  return (
    <Frame title={title} label={`Meeting ${name}`} scene={`arrival:${id}`} onSkip={skip} skipping={leaving}>
      {done ? <Welcome onDone={finish} id={id} name={name} points={earned} home={atHome(save, id)} />
        : step && 'choice' in step && choiceAt === cursor ? (
          <Choice id={id} name={name} options={step.choice} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
        ) : step ? (
          <StepView key={cursor} step={step} at={cursor} count={shown.slice(0, cursor).filter((s) => !silent(s)).length} total={shown.filter((s) => !silent(s)).length}
            nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
        ) : null}
    </Frame>
  )
}

/** Meeting her ends: her points are in, and where she lives says so: the Dorm, or town while no bed is free. */
function Welcome({ id, name, points, home, onDone }: { id: string; name: string; points: number; home: boolean; onDone: () => void }) {
  return (
    <div className={SCENE_ROW} data-arrival-done data-points={points} data-home={home}>
      <div className={SCENE_BUST}><UmaBust outfitId={id} label={name} size={200} /></div>
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-3">
        <p className="text-center text-[15px] font-semibold text-[#c2385e]">♥ +{points}</p>
        <p className="text-center text-[14px] text-ink-soft" data-lives>{home ? 'She moves into the Dorm.' : 'No bed free: she lives in town for now.'}</p>
        <Button className="w-full" onClick={onDone} data-action="welcome">Welcome, {name}</Button>
      </div>
    </div>
  )
}

/** One step: a line with her bust, a narration, a thought, or a pause that goes on by itself. */
export function StepView({ step, at, count, total, nameOf, farmer, onNext }: {
  step: Step; at: number; count: number; total: number; nameOf: (id: string) => string; farmer: string; onNext: () => void
}) {
  const wait = 'wait' in step ? Math.min(5000, Math.max(0, step.wait)) : null
  useEffect(() => {
    if (wait === null) return
    const timer = setTimeout(onNext, wait)
    return () => clearTimeout(timer)
  }, [wait]) // eslint-disable-line react-hooks/exhaustive-deps
  const speaker = 'say' in step ? step.say : null
  const text = 'say' in step ? step.line : 'narrate' in step ? step.narrate : 'thought' in step ? step.thought : '…'
  const kind = 'say' in step ? 'say' : 'thought' in step ? 'thought' : 'narrate'
  return (
    <button type="button" onClick={onNext} className={`${SCENE_ROW} text-left`} aria-label="Next" data-beat={at} data-step={kind}>
      <div className={SCENE_BUST} data-bust={speaker ? (isCastId(speaker) ? 'cast' : 'uma') : 'narrator'} data-who={speaker ?? undefined}>
        {speaker && <PersonBust who={speaker} name={nameOf(speaker)} size={240} />}
      </div>
      <div className="min-w-0 flex-1 rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
        {speaker && (
          <p className="flex items-center gap-2" data-speaker>
            <span className="font-display text-[15px] font-bold text-accent">{nameOf(speaker)}</span>
            {'say' in step && step.emote && <span className="rounded-full bg-sunken px-2 text-[11px] font-semibold text-ink-soft" data-emote={step.emote}>{step.emote}</span>}
          </p>
        )}
        <p className={`pt-1 text-[17px] leading-snug ${kind === 'say' ? 'text-ink' : 'text-ink-soft italic'}`} data-line>{withFarmer(text, farmer)}</p>
        <p className="pt-2 text-right text-[12px] text-ink-faint">Tap to go on · {count + 1}/{total}</p>
      </div>
    </button>
  )
}

/** Meeting her: her one choice, each option with its gain on the button before the tap (+30 for the best, +10 the rest). */
function Choice({ id, name, options, onPick }: { id: string; name: string; options: readonly ChoiceOption[]; onPick: (i: number) => void }) {
  const points = choicePoints(options)
  return (
    <div className={SCENE_ROW} data-choice>
      <div className={SCENE_BUST}><UmaBust outfitId={id} label={name} size={200} /></div>
      <div className="flex max-h-full min-w-0 flex-1 flex-col justify-end gap-3 overflow-y-auto">
        <p className="w-full text-[13px] text-ink-soft">Your answer · +50 for meeting her, and</p>
        {options.map((option, i) => (
          <button key={i} type="button" onClick={() => onPick(i)} data-option={i} data-gain={points[i]}
            className="flex min-h-12 w-full shrink-0 items-center gap-3 rounded-md border border-hairline bg-panel px-4 py-2 text-left shadow-1">
            <span className="min-w-0 flex-1 text-[15px]">{option.text}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] font-bold ${points[i] === 30 ? 'bg-[#c2385e]/15 text-[#c2385e]' : 'bg-sunken text-ink-soft'}`}>♥ +{points[i]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
