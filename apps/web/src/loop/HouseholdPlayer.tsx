// Household scenes and the finale: `?household=<household:5 |
// household:10 | household:15 | finale>` over any page, from the morning's "⌂ Household scene 1 · Ready", the Hearts
// header or the Diary's Memories shelf (`&replay=1`). It plays `open`, then each spouse's beat in wedding order, then
// `close`, the pack's where it has them and the game's short card where it doesn't (`householdOf`: a line, each spouse's
// line, a line, the finale's dance), in the scene player's frame and steps on the dialogue engine; a choice is wording
// only. Every spouse wears the scene's own `outfit` when the story names one, else the dinner dress (the finale: the
// kimono).
// The finale plays its dance after `open` (the play sheet, its grade shown without points: it pays nothing) and ends
// on the game's last stage-up card, "The Great Harvest", with every spouse's face. The end or Skip reads it once
// (`diary.read`); a replay marks nothing. Portaled above the kit's sheets (z-60). Loaded on demand.
import {
  householdOf, householdPlay, mayPlayHousehold, playOf, promptOf, playSeed, sceneSteps, type HouseholdId, type HouseholdPlay, type SaveV4, type Step, type StoryPack,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { SceneLookProvider } from '../dialogue/Bust'
import { lastSay } from '../dialogue/Line'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { readHouseholdOnce } from './homestead-actions'
import { parseHouseholdParam } from './homestead-view'
import { PlaySheet, playSpec } from './PlaySheet'
import { Frame, placeName, silent, StepView, WordingChoice } from './ScenePlayer'

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
  // A link plays only what the game has given you (`mayPlayHousehold`): Ready and unread, or read for a replay.
  const open = !!id && save && !!pack && mayPlayHousehold(save, id, replay)
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
      <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={play.title} data-household-play>
        <PlaySheet spec={spec} title={`${play.title} · ${promptOf(play.play)}`} name={nameOf(first)} replay={replay} unpaid="For the joy of it: the Great Harvest pays nothing." onDone={next} />
      </div>
    )
  }
  if (part.kind === 'card') return <GreatHarvest spouses={play.spouses} nameOf={nameOf} replay={replay} onDone={onDone} />
  if (part.kind !== 'steps') return null
  // Every spouse wears the scene's own outfit when the story names one, else its moment's: a household scene is a supper
  // (the dinner dress), the finale a festival night (the kimono).
  return (
    <SceneLookProvider value={{ own: play.outfit, moments: play.moments, day: save.calendar.day, leads: play.spouses }}>
      <Part key={index} title={play.title} scene={`${id}:${index}`} steps={part.steps} place={place} onPlace={setPlace} nameOf={nameOf} farmer={save.farmer.name}
        leaving={leaving} onSkip={onDone} onDone={next} />
    </SceneLookProvider>
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
  // A choice is wording only: the last one to speak stays on the stage.
  const last = lastSay(shown.slice(0, cursor))
  return (
    <Frame title={`${title} · ${placeName(here)}`} label={title} scene={scene} onSkip={onSkip} skipping={leaving}>
      {step && 'choice' in step ? (
        <WordingChoice options={step.choice} farmer={farmer} bust={last ? { ...last, name: nameOf(last.who) } : null}
          onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
      ) : step ? (
        <StepView key={cursor} steps={shown} at={cursor} nameOf={nameOf} farmer={farmer} onNext={() => setAt(cursor + 1)} />
      ) : <div className="flex-1" />}
    </Frame>
  )
}

/** The game's last stage-up card: "The Great Harvest", every spouse's face, and the year's Festival of Vows. */
function GreatHarvest({ spouses, nameOf, replay, onDone }: { spouses: readonly string[]; nameOf: (id: string) => string; replay: boolean; onDone: () => void }) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="The Great Harvest" data-great-harvest>
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 pt-6 pb-4">
        <p className="font-display text-center text-[26px] font-bold text-[#d9a227]">The Great Harvest</p>
        <p className="text-center text-[14px] text-ink-soft">Every spouse, every row, one long table. The farm goes on.</p>
        <ul className="flex flex-wrap justify-center gap-2 py-2" aria-label="Your household" data-household-faces={spouses.length}>
          {spouses.map((id) => <li key={id}><Avatar id={id} size={44} label={nameOf(id)} /></li>)}
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
