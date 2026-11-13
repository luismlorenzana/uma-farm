// The scene player (F24 decision 6; core spec CS42; F46 decision 10): a full-screen sheet over the farm. A bust (a cast
// member's lettered disc until F25's busts ship, or an Uma's from master data through uma-kit's `UmaBust`), the speaker's
// name and one line; a tap goes on, and **Skip** ends it. The chapter scenes' lines are data (`@farm/domain`'s
// `story/chapter-1.ts`, and v4's re-cut opening) with roles the save fills: on v3 your first hands speak their
// temperament's hello and your newest hand asks to stay; on v4 the opening ends as the three come up the road (reading it
// brings them), and the closing scene's newest hand is chapter 1's authored arrival. The v3 opening ends on chapter 1's
// card, the closing scene on chapter 2's. Each plays once (`diary.read`). It loads master data itself, for the Umas'
// names, busts and temperaments, since a new account's boot doesn't wait for it; Skip works without it.
//
// On v4 it also plays each Uma's **arrival scene** from the story pack (F46 decision 10), the format's steps: `say` (her
// bust, the line with `{farmer}` filled, the emote as a word), `narrate`, `thought` (italic), `place` (the title line),
// `wait`, `flag` and `choice`, whose options show their gain before the tap (+30 for the best, +10 for the rest). Skip
// jumps to the choice, never past it, so every arrival pays +50 and its choice; the last of the opening three ends on
// chapter 1's card and **Plant the carrots**. Its frame and steps also play F52's pair conversations (`PairPlayer.tsx`).
// Loaded on demand. F53: on v4 the ring bench's scene (`scene:bench`) plays here too, its player loaded on demand in the
// romance build only (`BenchScene.tsx`).
import {
  ARRIVAL_POINTS, arrivalOf, BENCH_SCENE, CAST, CAST_IDS, castInitial, chapterArrival, CHAPTER_1_GOALS, chapterOf, chapterScene, choicePoints, FALLBACK_ARRIVAL, farmPlace, pathFlags,
  sceneLines, sceneSteps, withFarmer, type CastId, type ChapterSceneId, type ChoiceOption, type SaveV4, type SceneId, type SceneLine, type Step, type Temperament,
} from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { romanceOn } from '../app/romance'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { finishArrivalScene, readSceneOnce } from './actions'
import { chapterHand, rewardWords } from './goal-words'
import { talentTable } from './talents'

/** Each speaking cast member's disc colour, until F25's busts. */
const CAST_COLOR: Readonly<Partial<Record<CastId, string>>> = { 'hollis-pryor': '#6b5aa6', 'marta-quill': '#c4573a', 'ben-carver': '#7a8b3a', 'ida-stone': '#8a5a3c' }
// The romance build's only: the switch folds at build time, and the deployed build drops the import.
const BenchScene = /* @__PURE__ */ lazy(() => import('./BenchScene'))
const isCast = (id: string): id is CastId => (CAST_IDS as readonly string[]).includes(id)

/** A cast member's bust: F25's art once it ships, a lettered disc until then. */
export function CastBust({ id, size }: { id: CastId; size: number }) {
  return (
    <span aria-hidden className="font-display flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-2 ring-4 ring-white/70"
      style={{ width: size, height: size, fontSize: size * 0.42, background: CAST_COLOR[id] ?? '#6f6a63' }} data-cast={id}>
      {castInitial(id)}
    </span>
  )
}

export default function ScenePlayer({ scene }: { scene: SceneId }) {
  const save = useLoopSave()
  if (!save) return null
  if (scene === BENCH_SCENE) return romanceOn() && save.version === 4 ? <Suspense fallback={null}><BenchScene save={save} /></Suspense> : null
  const arrival = arrivalOf(scene)
  if (arrival && save.version === 4) return <ArrivalPlayer save={save} id={arrival} />
  if (arrival) return null
  return <ChapterScenePlayer scene={scene as ChapterSceneId} />
}

/** The sheet's frame: the title line, Skip, and what plays. F52's pair conversations play in it too. */
export function Frame({ title, label, scene, onSkip, skipping, children }: { title: string; label: string; scene: string; onSkip: () => void; skipping: boolean; children: React.ReactNode }) {
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={label} data-scene={scene}>
      <header className="flex min-h-14 items-center justify-between gap-2 px-4">
        <p className="text-micro text-ink-soft" data-scene-title>{title}</p>
        <button type="button" onClick={onSkip} disabled={skipping} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink-soft" data-action="skip">
          Skip
        </button>
      </header>
      {children}
    </div>
  )
}

function ChapterScenePlayer({ scene }: { scene: ChapterSceneId }) {
  const save = useLoopSave()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  if (!save) return null
  const data = chapterScene(scene, save.version)
  /** Played through or skipped: the scene is read, once, and the farm goes on where `to` says. */
  const finish = (to: string | null) => {
    if (leaving) return
    setLeaving(true)
    if (to) navigate(to)
    void readSceneOnce(scene).catch(() => setLeaving(false))
  }
  return (
    <Frame title={data.title} label={data.title} scene={scene} onSkip={() => finish(null)} skipping={leaving}>
      <MasterGate>{(master) => <Play scene={scene} master={master} onDone={finish} />}</MasterGate>
    </Frame>
  )
}

function Play({ scene, master, onDone }: { scene: ChapterSceneId; master: MasterView; onDone: (to: string | null) => void }) {
  const save = useLoopSave()!
  const story = useStory()
  const lines = useMemo(() => {
    const table = talentTable(master)
    // On v4 the closing scene's newest hand is chapter 1's authored arrival (decision 9), or nobody.
    const newest = save.version === 4 ? (story ? chapterArrival(story, 1)?.characterId ?? null : null) : undefined
    return sceneLines(chapterScene(scene, save.version), save, (id): Temperament => table.get(id)?.temperament ?? 'steady', newest)
    // The roles are filled once, when the scene starts: a save changing under it doesn't recast it.
  }, [scene, master]) // eslint-disable-line react-hooks/exhaustive-deps
  const [at, setAt] = useState(0)
  const nameOf = (id: string): string => master.album.get(id)?.name ?? 'An Uma'
  const farmer = save.version === 4 ? save.farmer.name : ''
  if (at >= lines.length) {
    // v4's opening ends as the three come up the road: reading it brings them, and their arrivals play next.
    if (save.version === 4 && scene === 'scene:1:open') return <ReadOn onDone={() => onDone(null)} />
    return <ChapterCard scene={scene} onDone={onDone} />
  }
  const line = lines[at]!
  return (
    <button type="button" onClick={() => setAt(at + 1)} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-4 px-4 pb-4 text-left"
      aria-label="Next" data-beat={at}>
      <Bust line={line} nameOf={nameOf} />
      <div className="w-full rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
        {line.speaker.kind !== 'narrator' && <p className="font-display text-[15px] font-bold text-accent" data-speaker>{speakerName(line, nameOf)}</p>}
        <p className={`pt-1 text-[17px] leading-snug ${line.speaker.kind === 'narrator' ? 'text-ink-soft italic' : 'text-ink'}`} data-line>
          {withFarmer(line.speaker.kind === 'uma' ? line.line.replaceAll('{name}', nameOf(line.speaker.outfitId)) : line.line, farmer)}
        </p>
        <p className="pt-2 text-right text-[12px] text-ink-faint">Tap to go on · {at + 1}/{lines.length}</p>
      </div>
    </button>
  )
}

/** The re-cut opening's end on v4: the scene is read, which brings the three, and the first arrival plays. */
function ReadOn({ onDone }: { onDone: () => void }) {
  useEffect(() => onDone(), []) // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="flex-1" />
}

function speakerName(line: SceneLine, nameOf: (id: string) => string): string {
  return line.speaker.kind === 'cast' ? CAST[line.speaker.id].name : line.speaker.kind === 'uma' ? nameOf(line.speaker.outfitId) : ''
}

function Bust({ line, nameOf }: { line: SceneLine; nameOf: (id: string) => string }) {
  const { speaker } = line
  return (
    <div className="flex min-h-0 flex-1 items-end justify-center" data-bust={speaker.kind}>
      {speaker.kind === 'cast' && <CastBust id={speaker.id} size={176} />}
      {speaker.kind === 'uma' && <UmaBust outfitId={speaker.outfitId} label={nameOf(speaker.outfitId)} size={240} />}
    </div>
  )
}

/** Chapter 1's card (CS42 beat 5): its six goals and the first tap, planting. Its reward names a new hand on v3, and on v4
 * only when the cast has a chapter-1 arrival (D74). */
export function ChapterOneCard({ onPlant }: { onPlant: () => void }) {
  const chapter = chapterOf(1)!
  const hand = useChapterHand(1)
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-chapter-card={1}>
      <div className="rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="text-micro text-ink-soft">Chapter 1</p>
        <h2 className="font-display text-[22px] font-bold">{chapter.title}</h2>
        <ol className="mt-2 space-y-1.5">
          {CHAPTER_1_GOALS.map((goal, i) => (
            <li key={goal.id} className="flex gap-2 text-[15px]"><span className="w-4 shrink-0 font-semibold text-ink-faint">{i + 1}</span>{goal.text}</li>
          ))}
        </ol>
        <p className="pt-2 text-[13px] text-ink-soft" data-reward>Reward: {rewardWords(1, hand)}.</p>
      </div>
      <Button className="w-full" onClick={onPlant} data-action="plant">Plant the carrots</Button>
    </div>
  )
}

/** The scene's last card (CS42 beat 5): chapter 1's six goals and the first tap, planting; or the chapter's reward and
 * chapter 2's line. */
function ChapterCard({ scene, onDone }: { scene: ChapterSceneId; onDone: (to: string | null) => void }) {
  const hand = useChapterHand(1)
  if (scene === 'scene:1:open') return <ChapterOneCard onPlant={() => onDone('/fields')} />
  const next = chapterOf(2)!
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-chapter-card={2}>
      <div className="rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="text-micro text-ink-soft">Chapter 1 done</p>
        <p className="text-[15px]" data-reward>{rewardWords(1, hand)}</p>
        <p className="text-micro pt-3 text-ink-soft">Chapter 2</p>
        <h2 className="font-display text-[22px] font-bold">{next.title}</h2>
        <p className="text-[15px] text-ink-soft">Soon</p>
      </div>
      <Button className="w-full" onClick={() => onDone('/')} data-action="start-day">Start the day</Button>
    </div>
  )
}

/** Whether chapter `n`'s reward brings a new hand on this save and pack (D74). */
function useChapterHand(chapter: number): boolean {
  const save = useLoopSave()
  const story = useStory()
  return chapterHand(save?.version ?? 3, story, chapter)
}

// --- Her arrival scene (F46 decision 10) ----------------------------------------------------------------------------------

/** A story place as the title line says it: a farm place's name, else its words ("pond-night" → "Pond night"). */
export const placeName = (place: string): string => farmPlace(place)?.name ?? `${place.charAt(0).toUpperCase()}${place.slice(1).replaceAll('-', ' ')}`
/** Steps that show nothing of their own: they set the title line, or a flag. */
export const silent = (step: Step): boolean => 'place' in step || 'flag' in step

function ArrivalPlayer({ save, id }: { save: SaveV4; id: string }) {
  const story = useStory()
  const [steps, setSteps] = useState<readonly Step[] | null>(null)
  useEffect(() => {
    let live = true
    void (story ? story.route(id) : Promise.resolve(null)).then((route) => {
      if (live) setSteps(route?.events.find((e) => e.id === 'arrival')?.steps ?? FALLBACK_ARRIVAL)
    }, () => live && setSteps(FALLBACK_ARRIVAL))
    return () => { live = false }
  }, [story, id])
  if (!steps) return null
  return (
    <MasterGate>{(master) => <Arrival save={save} id={id} steps={steps} master={master} lastOpening={!!story && isLastOpening(save, story.cast.opening, id)} />}</MasterGate>
  )
}

/** The third of the opening three: the others' arrivals have played. */
const isLastOpening = (save: Pick<SaveV4, 'arrivals'>, opening: readonly string[], id: string): boolean =>
  opening.includes(id) && opening.every((o) => o === id || save.arrivals.includes(o))

function Arrival({ save, id, steps, master, lastOpening }: { save: SaveV4; id: string; steps: readonly Step[]; master: MasterView; lastOpening: boolean }) {
  const navigate = useNavigate()
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  const nameOf = (who: string): string => (isCast(who) ? CAST[who].name : master.album.get(who)?.name ?? 'An Uma')
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
  const finish = (to: string | null) => {
    if (leaving) return
    const choice = shown.find((s): s is { choice: ChoiceOption[] } => 'choice' in s)
    const pick = picks[0]
    if (!choice || pick === undefined) return
    setLeaving(true)
    if (to) navigate(to)
    void finishArrivalScene(id, { choice: choicePoints(choice.choice)[pick]!, flags: pathFlags(shown) }).catch(() => setLeaving(false))
  }
  // Skip: to her choice, never past it; once chosen, to the end.
  const skip = () => {
    if (choiceAt !== -1) setAt(choiceAt)
    else setAt(shown.length)
  }
  const chosen = shown.find((s): s is { choice: ChoiceOption[] } => 'choice' in s)
  const earned = ARRIVAL_POINTS + (chosen && picks[0] !== undefined ? choicePoints(chosen.choice)[picks[0]]! : 0)
  const title = place ? `${name} arrives · ${placeName(place)}` : `${name} arrives`
  return (
    <Frame title={title} label={`${name} arrives`} scene={`arrival:${id}`} onSkip={skip} skipping={leaving || (done && lastOpening)}>
      {done ? (lastOpening ? <ChapterOneCard onPlant={() => finish('/fields')} /> : <Welcome onDone={() => finish(null)} id={id} name={name} points={earned} />)
        : step && 'choice' in step && choiceAt === cursor ? (
          <Choice id={id} name={name} options={step.choice} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
        ) : step ? (
          <StepView key={cursor} step={step} at={cursor} count={shown.slice(0, cursor).filter((s) => !silent(s)).length} total={shown.filter((s) => !silent(s)).length}
            nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
        ) : null}
    </Frame>
  )
}

/** Her arrival's end: she's on the farm, and her points are in. */
function Welcome({ id, name, points, onDone }: { id: string; name: string; points: number; onDone: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-arrival-done data-points={points}>
      <div className="flex min-h-0 flex-1 items-end justify-center"><UmaBust outfitId={id} label={name} size={200} /></div>
      <p className="text-center text-[15px] font-semibold text-[#c2385e]">♥ +{points}</p>
      <Button className="w-full" onClick={onDone} data-action="welcome">Welcome, {name}</Button>
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
    <button type="button" onClick={onNext} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-4 px-4 pb-4 text-left" aria-label="Next" data-beat={at} data-step={kind}>
      <div className="flex min-h-0 flex-1 items-end justify-center" data-bust={speaker ? (isCast(speaker) ? 'cast' : 'uma') : 'narrator'}>
        {speaker && (isCast(speaker) ? <CastBust id={speaker} size={176} /> : <UmaBust outfitId={speaker} label={nameOf(speaker)} size={240} />)}
      </div>
      <div className="w-full rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
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

/** Her arrival's one choice: each option with its gain on the button before the tap (+30 for the best, +10 the rest). */
function Choice({ id, name, options, onPick }: { id: string; name: string; options: readonly ChoiceOption[]; onPick: (i: number) => void }) {
  const points = choicePoints(options)
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-end gap-3 px-4 pb-4" data-choice>
      <div className="flex min-h-0 flex-1 items-end justify-center"><UmaBust outfitId={id} label={name} size={200} /></div>
      <p className="w-full text-[13px] text-ink-soft">Your answer · +50 for her arrival, and</p>
      {options.map((option, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} data-option={i} data-gain={points[i]}
          className="flex min-h-12 w-full items-center gap-3 rounded-md border border-hairline bg-panel px-4 py-2 text-left shadow-1">
          <span className="min-w-0 flex-1 text-[15px]">{option.text}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] font-bold ${points[i] === 30 ? 'bg-[#c2385e]/15 text-[#c2385e]' : 'bg-sunken text-ink-soft'}`}>♥ +{points[i]}</span>
        </button>
      ))}
    </div>
  )
}
