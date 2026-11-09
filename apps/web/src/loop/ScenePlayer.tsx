// The scene player (F24 decision 6; core spec CS42): a full-screen sheet over the farm. A bust (a cast member's lettered
// disc until F25's busts ship, or an Uma's from master data through uma-kit's `UmaBust`), the speaker's name and one
// line; a tap goes on, and **Skip** ends it. The lines are data (`@farm/domain`'s `story/chapter-1.ts`) with roles the
// save fills: your first hands speak their temperament's hello, your newest hand asks to stay. It ends on the chapter's
// card: chapter 1's six goals and **Plant the carrots**, or chapter 1's reward and chapter 2, "Soon". Each scene plays
// once (`diary.read`). It loads master data itself, for the Umas' names, busts and temperaments, since a new account's
// boot doesn't wait for it; Skip works without it. Loaded on demand.
import {
  CAST, castInitial, CHAPTER_1_GOALS, chapterOf, SCENES, sceneLines, type CastId, type SceneId, type SceneLine, type Temperament,
} from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { readSceneOnce } from './actions'
import { rewardWords } from './goal-words'
import { talentTable } from './talents'

/** Each speaking cast member's disc colour, until F25's busts. */
const CAST_COLOR: Readonly<Partial<Record<CastId, string>>> = { 'hollis-pryor': '#6b5aa6', 'marta-quill': '#c4573a', 'ben-carver': '#7a8b3a' }

/** A cast member's bust: F25's art once it ships, a lettered disc until then. */
function CastBust({ id, size }: { id: CastId; size: number }) {
  return (
    <span aria-hidden className="font-display flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-2 ring-4 ring-white/70"
      style={{ width: size, height: size, fontSize: size * 0.42, background: CAST_COLOR[id] ?? '#6f6a63' }} data-cast={id}>
      {castInitial(id)}
    </span>
  )
}

export default function ScenePlayer({ scene }: { scene: SceneId }) {
  const save = useLoopSave()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  if (!save) return null
  const data = SCENES[scene]
  /** Played through or skipped: the scene is read, once, and the farm goes on where `to` says. */
  const finish = (to: string | null) => {
    if (leaving) return
    setLeaving(true)
    if (to) navigate(to)
    void readSceneOnce(scene).catch(() => setLeaving(false))
  }
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={data.title} data-scene={scene}>
      <header className="flex min-h-14 items-center justify-between gap-2 px-4">
        <p className="text-micro text-ink-soft">{data.title}</p>
        <button type="button" onClick={() => finish(null)} disabled={leaving} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink-soft" data-action="skip">
          Skip
        </button>
      </header>
      <MasterGate>{(master) => <Play scene={scene} master={master} onDone={finish} />}</MasterGate>
    </div>
  )
}

function Play({ scene, master, onDone }: { scene: SceneId; master: MasterView; onDone: (to: string | null) => void }) {
  const save = useLoopSave()!
  const lines = useMemo(() => {
    const table = talentTable(master)
    return sceneLines(SCENES[scene], save, (id): Temperament => table.get(id)?.temperament ?? 'steady')
    // The roles are filled once, when the scene starts: a save changing under it doesn't recast it.
  }, [scene, master]) // eslint-disable-line react-hooks/exhaustive-deps
  const [at, setAt] = useState(0)
  const nameOf = (id: string): string => master.album.get(id)?.name ?? 'An Uma'
  if (at >= lines.length) return <ChapterCard scene={scene} onDone={onDone} />
  const line = lines[at]!
  return (
    <button type="button" onClick={() => setAt(at + 1)} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-4 px-4 pb-4 text-left"
      aria-label="Next" data-beat={at}>
      <Bust line={line} nameOf={nameOf} />
      <div className="w-full rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
        {line.speaker.kind !== 'narrator' && <p className="font-display text-[15px] font-bold text-accent" data-speaker>{speakerName(line, nameOf)}</p>}
        <p className={`pt-1 text-[17px] leading-snug ${line.speaker.kind === 'narrator' ? 'text-ink-soft italic' : 'text-ink'}`} data-line>
          {line.speaker.kind === 'uma' ? line.line.replaceAll('{name}', nameOf(line.speaker.outfitId)) : line.line}
        </p>
        <p className="pt-2 text-right text-[12px] text-ink-faint">Tap to go on · {at + 1}/{lines.length}</p>
      </div>
    </button>
  )
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

/** The scene's last card (CS42 beat 5): chapter 1's six goals and the first tap, planting; or the chapter's reward and
 * chapter 2's line. */
function ChapterCard({ scene, onDone }: { scene: SceneId; onDone: (to: string | null) => void }) {
  if (scene === 'scene:1:open') {
    const chapter = chapterOf(1)!
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
          <p className="pt-2 text-[13px] text-ink-soft">Reward: {rewardWords(1)}.</p>
        </div>
        <Button className="w-full" onClick={() => onDone('/fields')} data-action="plant">Plant the carrots</Button>
      </div>
    )
  }
  const next = chapterOf(2)!
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-chapter-card={2}>
      <div className="rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="text-micro text-ink-soft">Chapter 1 done</p>
        <p className="text-[15px]">{rewardWords(1)}</p>
        <p className="text-micro pt-3 text-ink-soft">Chapter 2</p>
        <h2 className="font-display text-[22px] font-bold">{next.title}</h2>
        <p className="text-[15px] text-ink-soft">Soon</p>
      </div>
      <Button className="w-full" onClick={() => onDone('/')} data-action="start-day">Start the day</Button>
    </div>
  )
}
