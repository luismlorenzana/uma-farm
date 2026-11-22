// A pair's conversations: `?read=<a>-<b>:<levels>` over any page, played in the
// scene player's frame and steps on the dialogue engine: a tie's, the pack's at each level it writes and the game's
// two-line card at the rest (`pairConversationsOf`). Each level in order, titled "Stand-in 1 & Stand-in 2 · Bond 2 ·
// Forest"; a line with its speaker's bust (both in the level's own `outfit` when the story names one, else the day's
// season; her face the line's emote), a narration, a pause; a choice's options are wording only, with no gain. Skip, or the last
// line, marks every level read (`diary.read`, once each) and closes; a replay from the Diary marks nothing new. It pays
// nothing. The morning's Read, her profile's Read and the Diary's replays open it, so it's portaled to the body above their
// sheets (the kit's sheets portal there at z-50; the frame is z-60). Loaded on demand.
import { bondHearts, bondOf, pairConversationsOf, sceneSteps, type PairConversations, type SaveV4, type Step } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { lastSay } from '../dialogue/Line'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { readPairOnce } from './actions'
import { parseReadParam } from './hearts-view'
import { environment, environmentAt } from '../dialogue/scene-context'
import { Frame, placeName, silent, StepView, WordingChoice } from './ScenePlayer'

export default function PairPlayer({ read }: { read: string }) {
  const save = useLoopSave()
  const story = useStory()
  const location = useLocation()
  const leave = useLeave()
  const wanted = useMemo(() => parseReadParam(read), [read])
  const [pair, setPair] = useState<PairConversations | null | undefined>(undefined)
  const [leaving, setLeaving] = useState(false)
  const close = () => leave(withParam(location, 'read', null))
  useEffect(() => {
    let live = true
    if (!wanted || !story) return
    void pairConversationsOf(story, wanted.a, wanted.b).then((found) => live && setPair(found), () => live && setPair(null))
    return () => { live = false }
  }, [story, wanted])
  // The levels to play: those asked for that the bond has reached.
  const reached = save && wanted ? bondHearts(bondOf(save, wanted.a, wanted.b)) : 0
  const levels = useMemo(() => (pair && wanted ? wanted.levels.flatMap((h) => (h <= reached ? pair.levels.filter((l) => l.hearts === h) : [])) : []), [pair, wanted, reached])
  const nothing = !wanted || !save || pair === null || (pair !== undefined && levels.length === 0)
  useEffect(() => {
    if (nothing) close()
  }, [nothing]) // eslint-disable-line react-hooks/exhaustive-deps
  if (nothing || !pair || !save) return null
  const finish = (seen: readonly number[]) => {
    if (leaving) return
    setLeaving(true)
    close()
    void readPairOnce(pair.a, pair.b, levels.map((l) => l.hearts), seen).catch(() => undefined)
  }
  return createPortal(
    <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>{(master) => <Conversations save={save as SaveV4} pair={pair} levels={levels} master={master} leaving={leaving} onDone={finish} />}</MasterGate>,
    document.body,
  )
}

function Conversations({ save, pair, levels, master, leaving, onDone }: {
  save: SaveV4; pair: PairConversations; levels: PairConversations['levels']; master: MasterView; leaving: boolean; onDone: (seen: readonly number[]) => void
}) {
  const [index, setIndex] = useState(0)
  const story = useStory()
  const nameOf = namer(master, story)
  const level = levels[index]
  if (!level) return null
  const seen = (through: number) => levels.slice(0, through).map(level => level.hearts)
  const next = () => (index + 1 < levels.length ? setIndex(index + 1) : onDone(seen(index + 1)))
  // Both wear the level's own outfit when the story names one, else the day's season.
  return (
    <SceneLookProvider value={{ own: level.outfit, day: save.calendar.day, leads: [pair.a, pair.b] }}>
      <Conversation key={level.hearts} save={save} pair={pair} hearts={level.hearts} steps={level.steps} place={level.place ?? null} nameOf={nameOf}
        of={levels.length > 1 ? `${index + 1}/${levels.length}` : null} leaving={leaving} onSkip={() => onDone(seen(index))} onDone={next} />
    </SceneLookProvider>
  )
}

/** One bond level's conversation: its steps in order, a choice's `then` spliced in after the pick. */
function Conversation({ save, pair, hearts, steps, place, nameOf, of, leaving, onSkip, onDone }: {
  save: SaveV4; pair: PairConversations; hearts: number; steps: readonly Step[]; place: string | null; nameOf: (id: string) => string; of: string | null
  leaving: boolean; onSkip: () => void; onDone: () => void
}) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const here = shown.slice(0, cursor + 1).reduce<string | null>((p, s) => ('place' in s ? s.place : p), place)
  const step = shown[cursor]
  const done = cursor >= shown.length
  useEffect(() => {
    if (done) onDone()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  const names = `${nameOf(pair.a)} & ${nameOf(pair.b)}`
  const title = `${names} · Bond ${hearts}${of ? ` (${of})` : ''}${here ? ` · ${placeName(here)}` : ''}`
  // A choice is wording only: the last one to speak stays on the stage.
  const last = lastSay(shown.slice(0, cursor))
  return (
    <Frame atmosphere={environmentAt(shown, cursor, environment(save, place ?? 'plaza'))} title={title} label={`${names}: bond ${hearts}`} scene={`pair:${pair.a}-${pair.b}:${hearts}`} onSkip={onSkip} skipping={leaving}>
      {step && 'choice' in step ? (
        <WordingChoice options={step.choice} farmer={save.farmer.name} bust={last ? { ...last, name: nameOf(last.who) } : null}
          onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
      ) : step ? (
        <StepView key={cursor} steps={shown} at={cursor} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
      ) : <div className="flex-1" />}
    </Frame>
  )
}
