// Household scenes and the finale: `?household=<household:5 |
// household:10 | household:15 | finale>` over any page, from the morning's "⌂ Household scene 1 · Ready", the Hearts
// header or the Diary's Memories shelf (`&replay=1`). It plays `open`, then each spouse's beat in wedding order, then
// `close`, the pack's where it has them and the game's short card where it doesn't (`householdOf`: a line, each spouse's
// line, a line, the finale's dance), in the scene player's frame and steps; a choice is wording only.
// The finale plays its dance after `open` (the play sheet, its grade shown without points: it pays nothing) and ends
// on the game's last stage-up card, "The Great Harvest", with every spouse's face. The end or Skip reads it once
// (`diary.read`); a replay marks nothing. Portaled above the kit's sheets (z-60). Loaded on demand.
import {
  householdOf, householdPlay, householdReady, playOf, promptOf, playSeed, sceneSteps, withFarmer, type ChoiceOption, type HouseholdId, type HouseholdPlay, type SaveV4,
  type Step, type StoryPack,
} from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { readHouseholdOnce } from './homestead-actions'
import { parseHouseholdParam } from './homestead-view'
import { PlaySheet, playSpec } from './PlaySheet'
import { Frame, placeName, silent, StepView } from './ScenePlayer'

export default function HouseholdPlayer({ value, replay }: { value: string; replay: boolean }) {
  const save = useLoopSave()
  const pack = useStory()
  const location = useLocation()
  const leave = useLeave()
  const id = parseHouseholdParam(value)
  const [leaving, setLeaving] = useState(false)
  const close = () => {
    const at = new URL(withParam(location, 'household', null), 'http://farm')
    at.searchParams.delete('replay')
    leave(`${at.pathname}${at.search}`)
  }
  const play = useMemo(() => (id && save && pack ? householdPlay(save, householdOf(pack), id) : null), [id, save, pack])
  const open = !!id && save && !!pack && (replay ? save.diary.read.includes(id) : householdReady(save).includes(id))
  const gone = !id || (!!pack && (!open || play === null))
  useEffect(() => {
    if (gone) close()
  }, [gone]) // eslint-disable-line react-hooks/exhaustive-deps
  if (gone || !play || !pack || !save || !id) return null
  const finish = () => {
    if (leaving) return
    setLeaving(true)
    close()
    if (!replay) void readHouseholdOnce(id).catch(() => undefined)
  }
  return createPortal(
    <MasterGate skeleton={<div className="fixed inset-0 z-[60] bg-page" />}>
      {(master) => <Scene save={save} pack={pack} id={id} play={play} master={master} replay={replay} leaving={leaving} onDone={finish} />}
    </MasterGate>,
    document.body,
  )
}

/** One part a time: `open`, the play (the finale's), each spouse's beat, `close`; then the finale's card. */
type Part = { kind: 'steps'; who: string | null; steps: readonly Step[] } | { kind: 'play' } | { kind: 'card' }

function Scene({ save, pack, id, play, master, replay, leaving, onDone }: {
  save: SaveV4; pack: StoryPack; id: HouseholdId; play: HouseholdPlay; master: MasterView; replay: boolean; leaving: boolean; onDone: () => void
}) {
  const parts = useMemo((): Part[] => {
    const steps = play.parts.map((p): Part => ({ kind: 'steps', who: p.who, steps: p.steps }))
    return play.play ? [steps[0]!, { kind: 'play' }, ...steps.slice(1), { kind: 'card' }] : steps
  }, [play])
  const [index, setIndex] = useState(0)
  const [place, setPlace] = useState<string>(id === 'finale' ? 'festival' : 'fields')
  const nameOf = namer(master, pack)
  const part = parts[index]
  const next = () => (index + 1 < parts.length ? setIndex(index + 1) : onDone())
  if (!part) return null
  if (part.kind === 'play' && play.play) {
    const first = play.spouses[0] ?? Object.keys(save.roster)[0]!
    const spec = playSpec(save, pack, first, playOf(play.play), 'event', playSeed(save.account.uid, save.calendar.day, first, 'finale'))
    return (
      <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={play.title} data-household-play>
        <PlaySheet spec={spec} title={`${play.title} · ${promptOf(play.play)}`} name={nameOf(first)} replay={replay} unpaid="For the joy of it: the Great Harvest pays nothing." onDone={next} />
      </div>
    )
  }
  if (part.kind === 'card') return <GreatHarvest spouses={play.spouses} nameOf={nameOf} replay={replay} onDone={onDone} />
  if (part.kind !== 'steps') return null
  return (
    <Part key={index} title={play.title} scene={`${id}:${index}`} steps={part.steps} place={place} onPlace={setPlace} nameOf={nameOf} farmer={save.farmer.name}
      leaving={leaving} onSkip={onDone} onDone={next} />
  )
}

/** One part's steps, a choice's `then` spliced in after the pick (wording only). */
function Part({ title, scene, steps, place, onPlace, nameOf, farmer, leaving, onSkip, onDone }: {
  title: string; scene: string; steps: readonly Step[]; place: string; onPlace: (place: string) => void; nameOf: (id: string) => string; farmer: string; leaving: boolean
  onSkip: () => void; onDone: () => void
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
    if (here !== place) onPlace(here)
  }, [here]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done) onDone()
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  const visible = shown.filter((s) => !silent(s))
  const count = shown.slice(0, cursor).filter((s) => !silent(s)).length
  return (
    <Frame title={`${title} · ${placeName(here)}`} label={title} scene={scene} onSkip={onSkip} skipping={leaving}>
      {step && 'choice' in step ? (
        <Choice options={step.choice} farmer={farmer} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
      ) : step ? (
        <StepView key={cursor} step={step} at={cursor} count={count} total={visible.length} nameOf={nameOf} farmer={farmer} onNext={() => setAt(cursor + 1)} />
      ) : <div className="flex-1" />}
    </Frame>
  )
}

/** A choice in a household scene: wording only, no gain (it pays nothing). */
function Choice({ options, farmer, onPick }: { options: readonly ChoiceOption[]; farmer: string; onPick: (i: number) => void }) {
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

/** The game's last stage-up card: "The Great Harvest", every spouse's face, and the year's Festival of Vows. */
function GreatHarvest({ spouses, nameOf, replay, onDone }: { spouses: readonly string[]; nameOf: (id: string) => string; replay: boolean; onDone: () => void }) {
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="The Great Harvest" data-great-harvest>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-6 pb-4">
        <p className="font-display text-center text-[26px] font-bold text-[#d9a227]">The Great Harvest</p>
        <p className="text-center text-[14px] text-ink-soft">Every spouse, every row, one long table. The farm goes on.</p>
        <ul className="flex flex-wrap justify-center gap-2 py-2" aria-label="Your household" data-household-faces={spouses.length}>
          {spouses.map((id) => <li key={id}><FaceTile outfitId={id} size={44} label={nameOf(id)} round /></li>)}
        </ul>
        <section className="space-y-1 rounded-md border border-hairline p-3 text-[14px]">
          <h3 className="text-micro">From now on</h3>
          <p>· Each year on this day, the Festival of Vows: every spouse +50, and a festival night.</p>
          <p>· The farm, the seasons, festivals and anniversaries go on.</p>
          {replay && <p className="text-ink-soft">A Memory, replayed.</p>}
        </section>
        <Button className="w-full" onClick={onDone} data-action="continue">Continue</Button>
      </div>
    </div>
  )
}
