// A pair's conversations: `?read=<a>-<b>:<levels>` over any page, played in the
// scene player's frame and steps. Each level in order, titled "Stand-in 1 & Stand-in 2 · Bond 2 · Forest"; a line
// with its speaker's bust, a narration, a pause; a choice's options are wording only, with no gain. Skip, or the last
// line, marks every level read (`diary.read`, once each) and closes; a replay from the Diary marks nothing new. It pays
// nothing. The morning's Read, her profile's Read and the Diary's replays open it, so it's portaled to the body above their
// sheets (the kit's sheets portal there at z-50; the frame is z-60). Loaded on demand, the romance build only.
import { bondHearts, bondOf, sceneSteps, withFarmer, type ChoiceOption, type PairConversations, type SaveV4, type Step } from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { readPairOnce } from './actions'
import { parseReadParam } from './hearts-view'
import { Frame, placeName, silent, StepView } from './ScenePlayer'

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
    void story.pair(wanted.a, wanted.b).then((found) => live && setPair(found), () => live && setPair(null))
    return () => { live = false }
  }, [story, wanted])
  // The levels to play: those asked for that the pack holds and the bond has reached.
  const reached = save?.version === 4 && wanted ? bondHearts(bondOf(save, wanted.a, wanted.b)) : 0
  const levels = useMemo(() => (pair && wanted ? wanted.levels.flatMap((h) => (h <= reached ? pair.levels.filter((l) => l.hearts === h) : [])) : []), [pair, wanted, reached])
  const nothing = !wanted || save?.version !== 4 || pair === null || (pair !== undefined && levels.length === 0)
  useEffect(() => {
    if (nothing) close()
  }, [nothing]) // eslint-disable-line react-hooks/exhaustive-deps
  if (nothing || !pair || !save) return null
  const finish = () => {
    if (leaving) return
    setLeaving(true)
    close()
    void readPairOnce(pair.a, pair.b, levels.map((l) => l.hearts)).catch(() => undefined)
  }
  return createPortal(
    <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>{(master) => <Conversations save={save as SaveV4} pair={pair} levels={levels} master={master} leaving={leaving} onDone={finish} />}</MasterGate>,
    document.body,
  )
}

function Conversations({ save, pair, levels, master, leaving, onDone }: {
  save: SaveV4; pair: PairConversations; levels: PairConversations['levels']; master: MasterView; leaving: boolean; onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const nameOf = (id: string): string => master.album.get(id)?.name ?? 'An Uma'
  const level = levels[index]
  if (!level) return null
  const next = () => (index + 1 < levels.length ? setIndex(index + 1) : onDone())
  return (
    <Conversation key={level.hearts} save={save} pair={pair} hearts={level.hearts} steps={level.steps} place={level.place} nameOf={nameOf}
      of={levels.length > 1 ? `${index + 1}/${levels.length}` : null} leaving={leaving} onSkip={onDone} onDone={next} />
  )
}

/** One bond level's conversation: its steps in order, a choice's `then` spliced in after the pick. */
function Conversation({ save, pair, hearts, steps, place, nameOf, of, leaving, onSkip, onDone }: {
  save: SaveV4; pair: PairConversations; hearts: number; steps: readonly Step[]; place: string; nameOf: (id: string) => string; of: string | null
  leaving: boolean; onSkip: () => void; onDone: () => void
}) {
  const [picks, setPicks] = useState<number[]>([])
  const [at, setAt] = useState(0)
  const shown = useMemo(() => sceneSteps(steps, picks), [steps, picks])
  let cursor = at
  while (cursor < shown.length && silent(shown[cursor]!)) cursor++
  const here = shown.slice(0, cursor + 1).reduce<string>((p, s) => ('place' in s ? s.place : p), place)
  const step = shown[cursor]
  const done = cursor >= shown.length
  useEffect(() => {
    if (done) onDone()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  const names = `${nameOf(pair.a)} & ${nameOf(pair.b)}`
  const title = `${names} · Bond ${hearts}${of ? ` (${of})` : ''} · ${placeName(here)}`
  const visible = shown.filter((s) => !silent(s))
  const count = shown.slice(0, cursor).filter((s) => !silent(s)).length
  return (
    <Frame title={title} label={`${names}: bond ${hearts}`} scene={`pair:${pair.a}-${pair.b}:${hearts}`} onSkip={onSkip} skipping={leaving}>
      {step && 'choice' in step ? (
        <PairChoice options={step.choice} farmer={save.farmer.name} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
      ) : step ? (
        <StepView key={cursor} step={step} at={cursor} count={count} total={visible.length} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} />
      ) : <div className="flex-1" />}
    </Frame>
  )
}

/** A choice in a pair's conversation: wording only, so the options carry no gain. */
function PairChoice({ options, farmer, onPick }: { options: readonly ChoiceOption[]; farmer: string; onPick: (i: number) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-choice>
      <p className="text-[13px] text-ink-soft">You</p>
      {options.map((option, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} data-option={i}
          className="flex min-h-12 w-full items-center rounded-md border border-hairline bg-panel px-4 py-2 text-left text-[15px] shadow-1">
          {withFarmer(option.text, farmer)}
        </button>
      ))}
    </div>
  )
}
