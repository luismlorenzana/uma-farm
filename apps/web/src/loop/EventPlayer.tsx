// The event player: her heart event as a full-screen sheet over
// today's map, played on the dialogue engine (`dialogue/`). From the top: the title ("The Fields · Friendship 1") with
// **Auto**, **Skip** and **Log** away from the taps; on the left **the place card** (the place's uma-art frame on its
// season's ground, or a romance backdrop's borrowed frame and tint) behind **her bust**: her portrait in the event's
// outfit (its own when the story names one, else its moment's: her wedding, her work, a picnic, the summer shore; else
// the day's season), her face the line's emote; without portraits her master-data bust with the emote's bubble (a
// lettered disc for a stand-in); on the right **her line**, at most three lines, typed out: a tap finishes the line,
// the next goes on, a hold skips; **choices** at 48 pt in the thumb zone, each with its gain (+30 the best, +10 the
// rest, a ♥ on a romantic one, its cost or "Need 1 Basil", "· learns a like"); **the play** as a sheet in the middle
// (`PlaySheet.tsx`); then **the level-up card**, and the confession's Yes **the stage-up screen**.
//
// Three ways in, each a param over any page (portaled above the sheets, z-60): `?event=<id>` plays her Ready event (her
// row's ● Ready, her profile's **Play · 1 ›**, the morning's Ready line); `?ask=<id>` her confession's last choice again
// (**Ask her**, once a day, paying nothing); `?memory=<id>:<rung>[@<n>]` replays a Memory from the top or its nth choice
// point, every option open, nothing paid or saved. The script loads on demand (`eventOf`: her route's, else the default
// story's for the rung, in her name); Skip, Auto and Log work while it does. A play without a prompt shows its game's. Nothing is saved until the end: `playEvent` then commits once, stamped. Skip jumps to the next
// choice or play, never past one. Loaded on demand.
//
// **the proposal** first asks which ring (the best grade preselected), then plays, and closes on the Engaged
// stage-up; **the wedding** asks the place first (her three, each with its place card), plays the authored event on that
// place's card with the guests' faces and a line of narration (its own place steps give way to the chosen one), then the
// reception (a dish in the Warehouse, or the bakery's cake), then **the wedding night** (`WeddingNight.tsx`: her route's,
// else the default story's, in its outfit, fading to morning), then **moving in** to the room she took (her route's
// `moving-in`, else the default's), and closes on the Married stage-up.
//
// Her illustrations show full screen in its frame (`dialogue/Illustration.tsx`) where the story names one, and by the
// default mapping: her confession's question and her yes, the wedding, a summer date at the shore; and the wedding
// night's two. Each one seen joins her gallery.
import {
  actionCost, askSteps, beatOf, canAsk, canSpendForEvent, choicePointsOf, eventIllustration, eventMoments, extraPlay, firstPlace, GAME_DAYS, goodName, heldRings, illustrate, illustrationAt,
  optionViews, pathPlays, PLAY_PROMPTS, playOf, playSeed, promptOf,
  readiness, receptionDishes, replaySteps, ringGrade, ringPercent, rungName, walkScene, weddingGuests, weddingPlaceOf, weddingPlaces, withFarmer,
  type Answer, type ChoiceOption, type EventCard, type Play, type PlayAs, type PlayScore, type Reception, type SaveV4, type Step, type StoryOutfit, type StoryPack,
} from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useSearchParams } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { ArtCue, ArtHost, useArtHeader } from '../dialogue/Illustration'
import { lastSay, Line, nextSay } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { useSpecialDays, useStory } from '../story/story'
import { seeIllustrationOnce } from './actions'
import { askHerOnce, playHerEvent } from './event-actions'
import { LevelUpCard, StageUpScreen } from './EventCards'
import { eventTitle, guestsLine, optionWords, PICKER_WORDS, placeCard, receptionWords, type PlaceCard } from './event-view'
import { marriedOf, placeWords } from './hearts-view'
import { ItemIcon } from '../items/ItemIcon'
import { BuildingArt, PlaySheet, playSpec } from './PlaySheet'
import { silent } from './ScenePlayer'
import { WeddingNight } from './WeddingNight'

type Mode = 'event' | 'ask' | 'replay'
interface Request { mode: Mode; id: string; rung: string | null; from: number | null }

const ID = /^\d{1,12}$/
/** What the URL asks the player for: `?event=`, `?ask=` or `?memory=<id>:<rung>[@<n>]`. */
export function parseRequest(params: URLSearchParams): Request | null {
  const event = params.get('event')
  if (event && ID.test(event)) return { mode: 'event', id: event, rung: null, from: null }
  const ask = params.get('ask')
  if (ask && ID.test(ask)) return { mode: 'ask', id: ask, rung: 'confession', from: null }
  const m = /^(\d{1,12}):([a-z0-9]{1,16})(?:@(\d{1,2}))?$/.exec(params.get('memory') ?? '')
  if (m) return { mode: 'replay', id: m[1]!, rung: m[2]!, from: m[3] ? Number(m[3]) : null }
  return null
}
/** `?memory=` for a Memory: from the top, or from its `from`th choice point. */
export const memoryParam = (id: string, rung: string, from: number | null = null): string => `${id}:${rung}${from ? `@${from}` : ''}`
/** The player's params, all dropped on close. */
export const PLAYER_PARAMS = ['event', 'ask', 'memory'] as const

/** The location without the player's params. */
function without(location: { pathname: string; search: string }): string {
  const params = new URLSearchParams(location.search)
  for (const key of PLAYER_PARAMS) params.delete(key)
  const search = params.toString()
  return `${location.pathname}${search ? `?${search}` : ''}`
}

export default function EventPlayer() {
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const save = useLoopSave()
  const story = useStory()
  const asked = useMemo(() => parseRequest(params), [params])
  // The request is settled once, when it starts: an event stops being Ready the moment it's saved.
  const [req, setReq] = useState<(Request & { rung: string }) | null>(null)
  const [steps, setSteps] = useState<readonly Step[] | null>(null)
  // The event's own outfit, when the story names one.
  const [outfit, setOutfit] = useState<StoryOutfit | undefined>(undefined)
  const [gone, setGone] = useState(false)
  // Her event costs an action (a special day's event actions first): with none left, it says so before it plays.
  const [spent, setSpent] = useState(false)
  const special = useSpecialDays()
  const close = () => leave(without(location))
  useEffect(() => {
    if (req || !asked || !save || !story) return
    const love = save.love[asked.id]
    const fail = () => setGone(true)
    if (!love || !save.roster[asked.id]) return fail()
    if (asked.mode === 'event') {
      const state = readiness(save, story, asked.id)
      if (!state.ready || !state.rung) return fail()
      if (!canSpendForEvent(save, actionCost('event'), special ?? GAME_DAYS)) return setSpent(true)
      return setReq({ ...asked, rung: state.rung })
    }
    if (asked.mode === 'ask') return canAsk(save, asked.id) ? setReq({ ...asked, rung: 'confession' }) : fail()
    const rung = asked.rung!
    const played = rung === 'arrival' ? save.arrivals.includes(asked.id) : (save.memories[asked.id] ?? []).includes(rung)
    return played ? setReq({ ...asked, rung }) : fail()
  }, [asked, save, story, req])
  useEffect(() => {
    if (!req || !story) return
    let live = true
    void herEventOf(story, req.id, req.rung).then(({ steps: found, outfit: own }) => {
      if (!live) return
      const from = req.from ? choicePointsOf(found)[req.from - 1] ?? null : null
      setOutfit(own)
      setSteps(req.mode === 'ask' ? askSteps(found) : req.mode === 'replay' ? replaySteps(found, from) : found)
    }, () => live && setGone(true))
    return () => { live = false }
  }, [req, story])
  useEffect(() => {
    if (gone || !asked) close()
  }, [gone, asked]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!asked || gone || !save) return null
  if (spent) return createPortal(<NoActions onClose={close} />, document.body)
  return createPortal(
    <Player req={req} steps={steps} outfit={outfit} save={save} pack={story} onClose={close} />,
    document.body,
  )
}

/** Her event with no action left today, of either kind: said before it plays, with Back. */
function NoActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex items-center justify-center bg-page/95 px-4" role="dialog" aria-modal="true" aria-label="No actions left" data-no-actions>
      <div className="w-full max-w-sm space-y-3 rounded-md border border-hairline bg-panel p-4 shadow-2">
        <p className="font-display text-[18px] font-semibold">No actions left today.</p>
        <p className="text-[14px] text-ink-soft">Her event takes one action. End the day, and it’s still Ready tomorrow.</p>
        <Button className="w-full" onClick={onClose} data-action="back">Back</Button>
      </div>
    </div>
  )
}

/** The frame, and the scene once its script and master data are in. */
function Player({ req, steps, outfit, save, pack, onClose }: {
  req: (Request & { rung: string }) | null; steps: readonly Step[] | null; outfit: StoryOutfit | undefined; save: SaveV4; pack: StoryPack | null; onClose: () => void
}) {
  const [auto, setAuto] = useState(false)
  const [log, setLog] = useState(false)
  const [skipAsked, setSkipAsked] = useState(0)
  const loading = !req || !steps || !pack
  const loadingTitle = req ? 'Loading her story…' : 'Loading…'
  return (
    <MasterGate skeleton={<Shell title={loadingTitle} auto={auto} onAuto={() => setAuto(!auto)} onSkip={() => setSkipAsked((n) => n + 1)} onLog={() => setLog(true)}><Waiting /></Shell>}>
      {(master) => loading
        ? <Shell title={loadingTitle} auto={auto} onAuto={() => setAuto(!auto)} onSkip={() => setSkipAsked((n) => n + 1)} onLog={() => setLog(true)}><Waiting />{log && <LogSheet lines={[]} onClose={() => setLog(false)} />}</Shell>
        : <Scene req={req} steps={steps} outfit={outfit} save={save} pack={pack} master={master} auto={auto} onAuto={() => setAuto(!auto)} log={log} onLog={setLog} skipAsked={skipAsked} onClose={onClose} />}
    </MasterGate>
  )
}

function Waiting() {
  return <div className="flex flex-1 items-end px-4 pb-6"><p className="w-full rounded-md border border-hairline bg-panel p-4 text-[17px] text-ink-soft" data-loading>…</p></div>
}

/** The sheet's frame: the title, and Auto, Skip and Log top right, away from the taps. */
function Shell({ title, auto, onAuto, onSkip, onLog, skipping = false, children }: {
  title: string; auto: boolean; onAuto: () => void; onSkip: () => void; onLog: () => void; skipping?: boolean; children: React.ReactNode
}) {
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={title} data-event-player>
      <ArtHost onSeen={seeIllustrationOnce}>
        <ShellHeader title={title} auto={auto} onAuto={onAuto} onSkip={onSkip} onLog={onLog} skipping={skipping} />
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </ArtHost>
    </div>
  )
}

/** The title line with Auto, Skip and Log: light over her illustration. */
function ShellHeader({ title, auto, onAuto, onSkip, onLog, skipping }: { title: string; auto: boolean; onAuto: () => void; onSkip: () => void; onLog: () => void; skipping: boolean }) {
  return (
    <header className={`flex min-h-12 items-center gap-1 pr-2 pl-4 ${useArtHeader()}`}>
      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-soft" data-event-title>{title}</p>
      <button type="button" onClick={onAuto} aria-pressed={auto} className={`min-h-11 rounded-full px-3 text-[14px] font-semibold ${auto ? 'bg-[#c2385e]/15 text-[#c2385e]' : 'text-ink-soft'}`} data-action="auto">Auto</button>
      <button type="button" onClick={onSkip} disabled={skipping} className="min-h-11 rounded-full px-3 text-[14px] font-semibold text-ink-soft" data-action="skip">Skip</button>
      <button type="button" onClick={onLog} className="min-h-11 rounded-full px-3 text-[14px] font-semibold text-ink-soft" data-action="log">Log</button>
    </header>
  )
}

type Phase = 'scene' | 'reception' | 'saving' | 'card' | 'night' | 'moving' | 'stage' | 'asked' | 'replayed'

function Scene({ req, steps: script, outfit, save, pack, master, auto, onAuto, log, onLog, skipAsked, onClose }: {
  req: Request & { rung: string }; steps: readonly Step[]; outfit: StoryOutfit | undefined; save: SaveV4; pack: StoryPack; master: MasterView; auto: boolean; onAuto: () => void
  log: boolean; onLog: (open: boolean) => void; skipAsked: number; onClose: () => void
}) {
  const { id, rung, mode } = req
  const nameOf = namer(master, pack)
  // The proposal's ring and the wedding's place, chosen before the scene; the wedding's reception after it.
  const [ring, setRing] = useState<string | null>(null)
  const [chosenPlace, setChosenPlace] = useState<string | null>(null)
  const wedding = rung === 'wedding' && mode !== 'ask'
  // The guests, settled as the wedding starts (she isn't a spouse yet), and their line before its first.
  const guests = useMemo(() => (wedding && mode === 'event' ? weddingGuests(save, pack, id) : []), []) // eslint-disable-line react-hooks/exhaustive-deps
  const beat = beatOf(pack, id, rung)
  // Her illustrations, by the default mapping (her confession, the wedding, a summer date at the shore) unless the story
  // names its own. The shore is where the event plays: her beat's place, else its first place step.
  const illustrated = eventIllustration({ rung, place: beat?.place ?? firstPlace(script), day: save.calendar.day })
  const steps = useMemo((): readonly Step[] => illustrate(illustrated, wedding
    ? [...(mode === 'event' ? [{ narrate: guestsLine(guests.map(nameOf)) } as Step] : []), ...script.filter((s) => !('place' in s))]
    : script), [script]) // eslint-disable-line react-hooks/exhaustive-deps
  const [picks, setPicks] = useState<number[]>([])
  const [plays, setPlays] = useState<PlayScore[]>([])
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>('scene')
  const [card, setCard] = useState<EventCard | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Her flags as the scene starts: a `when` reads them (and any the scene sets on the way).
  const flags = useMemo(() => save.love[id]?.flags ?? [], []) // eslint-disable-line react-hooks/exhaustive-deps
  const extra = mode === 'ask' ? null : extraPlay(steps, beat?.together)
  const path = useMemo(() => walkScene(steps, picks, mode === 'ask' ? { flags } : { flags, plays: plays.map((p) => p.score >= 60) }), [steps, picks, plays, flags, mode])
  const shown = path.steps
  const quiet = (s: Step) => silent(s) || (mode === 'ask' && 'play' in s)
  let cursor = at
  while (cursor < shown.length && quiet(shown[cursor]!)) cursor++
  const step = shown[cursor]
  const before = shown.slice(0, cursor)
  const choicesBefore = before.filter((s) => 'choice' in s).length
  const playsBefore = before.filter((s) => 'play' in s).length
  const choiceNow = step && 'choice' in step && choicesBefore >= picks.length ? step.choice : null
  const playNow: { as: PlayAs; prompt: string | null } | null = step && 'play' in step && mode !== 'ask' && playsBefore >= plays.length
    ? { as: playOf((step as { play: Play }).play), prompt: promptOf((step as { play: Play }).play) } : null
  const ended = cursor >= shown.length
  const together = beat?.together
  const extraPrompt = together?.kind === 'work' ? PLAY_PROMPTS[together.activity] : together?.kind === 'date' ? PLAY_PROMPTS[together.game] : null
  const extraNow = ended && extra && plays.length < pathPlays(shown, null).length + 1 ? { as: extra, prompt: extraPrompt } : null
  const name = nameOf(id)
  const weddingAt = wedding ? (mode === 'event' ? chosenPlace : weddingPlaceOf(save.love[id]?.flags ?? [])) : null
  const place = weddingAt ?? shown.slice(0, cursor + 1).reduce<string | null>((p, s) => ('place' in s ? s.place : p), beat?.place ?? null)
  const where = place ? ` · ${placeWords(place)}` : ''
  const title = mode === 'replay' ? `Memory · ${rung === 'arrival' ? 'Meeting her' : rungName(rung)}${where}` : mode === 'ask' ? `Ask her${where}` : eventTitle(place, rung)

  // The end: an event is saved once; Ask her's answer once; a replay saves nothing.
  const finishing = useRef(false)
  useEffect(() => {
    if (!ended || extraNow || phase !== 'scene' || finishing.current) return
    finishing.current = true
    if (mode === 'replay') return setPhase('replayed')
    if (mode === 'ask') {
      const chosen = shown.filter((s): s is { choice: ChoiceOption[] } => 'choice' in s).map((s, i) => s.choice[picks[i]!]?.answer).find((a) => a !== undefined) ?? 'not-yet'
      setAnswer(chosen)
      setPhase('saving')
      void askHerOnce(id, chosen).then(() => setPhase(chosen === 'yes' ? 'stage' : 'asked'), (e: unknown) => { setError(words(e)); setPhase('asked') })
      return
    }
    if (wedding) return setPhase('reception')
    commitEvent(null)
  }, [ended, extraNow, phase]) // eslint-disable-line react-hooks/exhaustive-deps
  /** The event saved once, with the proposal's ring, or the wedding's place and reception. */
  const commitEvent = (reception: Reception) => {
    setPhase('saving')
    const extra = rung === 'proposal' && ring ? { ring } : wedding && chosenPlace ? { place: chosenPlace, reception } : {}
    void playHerEvent(id, { event: { id: rung, steps }, picks, plays, ...extra })
      .then((done) => { setCard(done); setPhase('card') }, (e: unknown) => { setError(words(e)); setPhase('card') })
  }

  // Skip: to the next choice or play, never past one; with neither left, to the end.
  const skip = () => {
    if (phase !== 'scene') return
    const pending = shown.findIndex((s, i) => i >= cursor && (('choice' in s && shown.slice(0, i).filter((x) => 'choice' in x).length >= picks.length)
      || ('play' in s && mode !== 'ask' && shown.slice(0, i).filter((x) => 'play' in x).length >= plays.length)))
    setAt(pending >= 0 ? pending : shown.length)
  }
  const skipSeen = useRef(skipAsked)
  useEffect(() => {
    if (skipAsked !== skipSeen.current) { skipSeen.current = skipAsked; skip() }
  }, [skipAsked]) // eslint-disable-line react-hooks/exhaustive-deps

  const seed = (k: number) => playSeed(save.account.uid, save.calendar.day, id, mode === 'replay' ? `replay-${rung}` : rung, k)
  const activePlay = playNow ?? extraNow
  const lines = logLines(shown.slice(0, cursor + (choiceNow || playNow ? 0 : 1)), picks, nameOf, save.farmer.name)
  const love = save.love[id]

  // Before the proposal, which ring; before the wedding, where.
  if (mode === 'event' && rung === 'proposal' && ring === null) {
    return <Shell title={title} auto={auto} onAuto={onAuto} onSkip={() => undefined} onLog={() => onLog(true)} skipping><RingPicker save={save} onPick={setRing} onClose={onClose} /></Shell>
  }
  if (mode === 'event' && wedding && chosenPlace === null) {
    return <Shell title={eventTitle(null, rung)} auto={auto} onAuto={onAuto} onSkip={() => undefined} onLog={() => onLog(true)} skipping><PlacePicker places={weddingPlaces(pack, id)} day={save.calendar.day} onPick={setChosenPlace} /></Shell>
  }
  // After the wedding night, moving in, when she took a room (one still waiting moves in the morning a room is free).
  const afterNight = () => setPhase(save.love[id]?.house !== undefined ? 'moving' : 'stage')
  if (phase === 'card' || phase === 'night' || phase === 'moving' || phase === 'stage' || phase === 'asked' || phase === 'replayed' || phase === 'saving' || phase === 'reception') {
    const living = phase === 'night' || phase === 'moving'
    return (
      <Shell title={phase === 'night' ? `The wedding night · ${name}` : phase === 'moving' ? `Moving in · ${name}` : title} auto={auto} onAuto={onAuto}
        onSkip={phase === 'night' ? afterNight : phase === 'moving' ? () => setPhase('stage') : () => undefined}
        onLog={() => onLog(true)} skipping={!living}>
        {phase === 'saving' && <Waiting />}
        {phase === 'reception' && <ReceptionPicker save={save} onPick={commitEvent} />}
        {phase === 'card' && (error || !card || !love
          ? <EndNote text={error ?? 'That didn’t save. Try again.'} onDone={onClose} />
          : <LevelUpCard card={card} id={id} name={name} love={love} pack={pack} farmer={save.farmer.name} onContinue={() => (card.stage ? setPhase(card.stage === 'married' && mode === 'event' ? 'night' : 'stage') : onClose())} />)}
        {phase === 'night' && <WeddingNight key="night" save={save} id={id} onDone={afterNight} />}
        {phase === 'moving' && <WeddingNight key="moving" save={save} id={id} event="moving-in" onDone={() => setPhase('stage')} />}
        {phase === 'stage' && love && <StageUpScreen stage={card?.stage ?? 'romance'} id={id} love={love} pack={pack} married={card?.stage === 'married' ? marriedOf(save) : null} save={save} onContinue={onClose} />}
        {phase === 'asked' && <EndNote text={error ?? (answer === 'not-yet' ? `${name} smiles. “Whenever you’re ready.” Ask again tomorrow.` : '')} onDone={onClose} />}
        {phase === 'replayed' && <EndNote text="A Memory, replayed. Replays give no points." onDone={onClose} />}
        {log && <LogSheet lines={lines} onClose={() => onLog(false)} />}
      </Shell>
    )
  }

  // The bust: whoever's speaking (one of the town's people too), her face the line's emote; else hers, with the face of
  // her last line (a narration or a choice doesn't change it).
  const speaker = step && 'say' in step ? step.say : null
  const bustId = speaker ?? id
  // At a choice, the line before it stays in the bubble.
  const context = choiceNow ? [...before].reverse().find((s) => 'say' in s || 'narrate' in s || 'thought' in s) ?? null : null
  const emote = step && 'say' in step ? step.emote ?? null : lastSay(before, bustId)?.emote ?? null
  const placed = placeCard(place ?? 'fields', save.calendar.day)
  // She wears the event's own outfit when the story names one, else its moment's (her wedding, her work, a picnic, the
  // summer shore), else the day's season. A wedding's guests wear the day's.
  const look = { own: outfit, moments: eventMoments({ rung, together: beat?.together ?? null, place, day: save.calendar.day }), day: save.calendar.day, leads: [id] }
  return (
    <Shell title={title} auto={auto} onAuto={onAuto} onSkip={skip} onLog={() => onLog(true)}>
      {/* Her illustration while it's up; the play's sheet sits over it. */}
      <ArtCue owner={id} ask={ended && !extraNow ? null : illustrationAt(shown, cursor)} steps={steps} />
      {/* Landscape: the place card with her bust on the left, her line and the choices on the right. */}
      <SceneLookProvider value={look}>
        <Stage bust={{ who: bustId, name: nameOf(bustId), emote }} backdrop={<PlaceBackdrop card={placed} guests={guests} nameOf={nameOf} />}
          panel={{ 'data-place-card': placed.place, 'data-frame': placed.frame }} next={activePlay || choiceNow ? null : nextSay(shown, cursor + 1)}>
          {choiceNow ? (
            <>
              {context && <Line key={`c${cursor}`} step={context} nameOf={nameOf} farmer={save.farmer.name} still onNext={() => undefined} typed />}
              <Choices mode={mode} options={choiceNow} save={save} pack={pack} id={id} farmer={save.farmer.name} onPick={(i) => { setPicks([...picks, i]); setAt(cursor + 1) }} />
            </>
          ) : step && !activePlay ? (
            <Line key={cursor} step={step} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(cursor + 1)} onHold={skip} auto={auto} typed />
          ) : <div className="flex-1" />}
        </Stage>
      </SceneLookProvider>
      {activePlay && (
        <PlaySheet key={`p${plays.length}`} spec={playSpec(save, pack, id, activePlay.as, 'event', seed(plays.length))} title={activePlay.prompt ?? undefined} name={name} replay={mode === 'replay'}
          onDone={(result) => { setPlays([...plays, { kind: activePlay.as.kind, ...result }]); if (playNow) setAt(cursor + 1) }} />
      )}
      {log && <LogSheet lines={lines} onClose={() => onLog(false)} />}
    </Shell>
  )
}

const words = (e: unknown): string => (e instanceof Error ? e.message : 'That didn’t save. Try again.')

/** The proposal's ring: the rings in the Warehouse, the best grade first and preselected. */
function RingPicker({ save, onPick, onClose }: { save: SaveV4; onPick: (ring: string) => void; onClose: () => void }) {
  const rings = heldRings(save)
  const [chosen, setChosen] = useState(rings[0] ?? null)
  if (!chosen) return <EndNote text="Needs a ring: make one at the Forge’s bench." onDone={onClose} />
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-ring-picker>
      <div className="pt-2">
        <h2 className="font-display text-[22px] font-bold">{PICKER_WORDS.ring}</h2>
        <p className="text-[14px] text-ink-soft">{PICKER_WORDS.ringHelp}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rings.map((r) => (
          <li key={r}>
            <button type="button" onClick={() => setChosen(r)} aria-pressed={r === chosen} data-ring={r}
              className={`flex min-h-12 w-full items-center gap-3 rounded-md border-2 bg-panel px-3 text-left ${r === chosen ? 'border-[#e0567a]' : 'border-hairline'}`}>
              <ItemIcon id={r} size={32} />
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{goodName(r)}</span>
              <span className="shrink-0 text-[13px] text-ink-soft">+{ringPercent(ringGrade(r))}% once married</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      <Button className="w-full" onClick={() => onPick(chosen)} data-action="propose">Propose with the {goodName(chosen)} ›</Button>
    </div>
  )
}

/** The wedding's place: her three, each on its place card. */
function PlacePicker({ places, day, onPick }: { places: readonly string[]; day: number; onPick: (place: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-place-picker>
      <div className="pt-2">
        <h2 className="font-display text-[22px] font-bold">{PICKER_WORDS.place}</h2>
        <p className="text-[14px] text-ink-soft">{PICKER_WORDS.placeHelp}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {places.map((p) => {
          const card = placeCard(p, day)
          return (
            <li key={p}>
              <button type="button" onClick={() => onPick(p)} data-place={p}
                className="flex min-h-[72px] w-full items-center gap-3 overflow-hidden rounded-md border border-hairline px-3 text-left shadow-1"
                style={{ background: `linear-gradient(to right, ${card.night ? '#1d2742' : '#fdf8ee'} 0%, ${card.ground} 80%)` }}>
                <span className="shrink-0"><BuildingArt frame={card.frame} scale={1} /></span>
                <span className="min-w-0 flex-1 font-display text-[17px] font-bold" style={{ color: card.night ? '#ffffff' : '#3a2f22' }}>{placeWords(p).replace(/^the /, 'The ')}</span>
                <span className="shrink-0 text-[20px]" style={{ color: card.night ? '#ffffff' : '#3a2f22' }} aria-hidden>›</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The reception: a dish in the Warehouse, its well-fed days on the button, or the bakery's cake with none. */
function ReceptionPicker({ save, onPick }: { save: SaveV4; onPick: (reception: Reception) => void }) {
  const dishes = receptionDishes(save)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-reception>
      <div className="pt-2">
        <h2 className="font-display text-[22px] font-bold">{PICKER_WORDS.reception}</h2>
        <p className="text-[14px] text-ink-soft">{PICKER_WORDS.receptionHelp}</p>
      </div>
      {dishes.length === 0 && <p className="rounded-md border border-hairline bg-panel p-4 text-[15px]" data-no-dish>{PICKER_WORDS.noDish}</p>}
      <div className="flex-1" />
      {dishes.length === 0 ? (
        <Button className="w-full" onClick={() => onPick(null)} data-action="cake">{PICKER_WORDS.cake}</Button>
      ) : dishes.map((d) => (
        <button key={`${d.dish}@${d.stars}`} type="button" onClick={() => onPick({ dish: d.dish, stars: d.stars })} data-dish={`${d.dish}@${d.stars}`}
          className="flex min-h-12 w-full items-center gap-3 rounded-md border border-hairline bg-panel px-4 py-2 text-left shadow-1">
          <span className="min-w-0 flex-1 text-[15px]">{receptionWords(d.dish, d.stars, d.days)}</span>
          <span className="shrink-0 text-[12px] text-ink-soft">{d.count} held</span>
        </button>
      ))}
    </div>
  )
}

/** The place card, the stage's backdrop behind her bust: its frame on its ground, and a wedding's guests' faces along its
 * top. */
function PlaceBackdrop({ card, guests, nameOf }: { card: PlaceCard; guests: readonly string[]; nameOf: (id: string) => string }) {
  return (
    <span aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${card.night ? '#1d2742' : '#fdf8ee'} 0%, ${card.ground} 70%)` }}>
      {guests.length > 0 && (
        <span className="absolute top-2 left-2 z-10 flex -space-x-1.5" data-guests={guests.join(',')}>
          {guests.map((g) => <FaceTile key={g} outfitId={g} size={32} label={nameOf(g)} round />)}
        </span>
      )}
      <span className="absolute bottom-6 left-4"><BuildingArt frame={card.frame} scale={3} /></span>
    </span>
  )
}

/** The choices: full width, 48 pt, each with its gain on the button; a replay opens every option and pays nothing,
 * Ask her's answer pays nothing either. */
function Choices({ mode, options, save, pack, id, farmer, onPick }: {
  mode: Mode; options: readonly ChoiceOption[]; save: SaveV4; pack: StoryPack; id: string; farmer: string; onPick: (i: number) => void
}) {
  const views = optionViews(save, pack, id, options, mode !== 'event')
  const paying = mode === 'event'
  return (
    <div className="space-y-2" data-choice>
      {options.map((option, i) => {
        const view = views[i]!
        const w = optionWords(view)
        return (
          <button key={i} type="button" disabled={view.short} onClick={() => onPick(i)} data-option={i} data-gain={view.points} data-heart={view.heart || undefined} data-short={view.short || undefined}
            className="flex min-h-12 w-full items-center gap-3 rounded-md border border-hairline bg-panel px-4 py-2 text-left shadow-1 disabled:opacity-50">
            <span className="min-w-0 flex-1 text-[15px]">{view.heart && <span className="pr-1 text-[#c2385e]" aria-label="Romantic">♥</span>}{withFarmer(option.text, farmer)}</span>
            {paying && (
              <span className="flex shrink-0 flex-col items-end">
                {w.need ? <span className="text-[12px] font-semibold text-danger" data-need>{w.need}</span>
                  : <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${view.points === 30 ? 'bg-[#c2385e]/15 text-[#c2385e]' : 'bg-sunken text-ink-soft'}`}>{w.gain}</span>}
                {w.extra && <span className="text-[12px] text-ink-soft" data-extra>{w.extra}</span>}
              </span>
            )}
          </button>
        )
      })}
      {mode === 'replay' && <p className="text-center text-[12px] text-ink-faint">A replay: every option is open, and nothing pays.</p>}
    </div>
  )
}

/** The log: every line so far, and your answers. */
function logLines(steps: readonly Step[], picks: readonly number[], nameOf: (id: string) => string, farmer: string): { who: string; text: string }[] {
  let choice = 0
  return steps.flatMap((s): { who: string; text: string }[] => {
    if ('say' in s) return [{ who: nameOf(s.say), text: withFarmer(s.line, farmer) }]
    if ('narrate' in s) return [{ who: '', text: withFarmer(s.narrate, farmer) }]
    if ('thought' in s) return [{ who: 'You', text: withFarmer(s.thought, farmer) }]
    if ('choice' in s) {
      const pick = picks[choice++]
      const option = pick === undefined ? undefined : s.choice[pick]
      return option ? [{ who: 'You', text: withFarmer(option.text, farmer) }] : []
    }
    return []
  })
}

/** The log, drawn inside the player's layer (the kit's sheets sit under it). */
function LogSheet({ lines, onClose }: { lines: readonly { who: string; text: string }[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/40" onClick={onClose}>
      <section role="dialog" aria-label="The lines so far" onClick={(e) => e.stopPropagation()} className="h-full w-[min(26rem,62%)] overflow-y-auto rounded-l-lg border-l border-hairline bg-panel px-4 pt-2 pb-6 shadow-3">
        <header className="sticky top-0 flex min-h-12 items-center justify-between bg-panel">
          <h2 className="font-display text-[17px] font-bold">Log</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full px-3 text-[14px] font-semibold text-ink-soft" data-action="close-log">Close</button>
        </header>
        {lines.length === 0 ? <p className="text-ink-soft">Nothing yet.</p> : (
          <ol className="space-y-2" data-log={lines.length}>
            {lines.map((l, i) => <li key={i} className="text-[15px]">{l.who && <span className="font-semibold">{l.who}: </span>}<span className={l.who ? '' : 'italic text-ink-soft'}>{l.text}</span></li>)}
          </ol>
        )}
      </section>
    </div>
  )
}

function EndNote({ text, onDone }: { text: string; onDone: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 px-4 pb-4" data-end-note>
      {text && <p className="rounded-md border border-hairline bg-panel p-4 text-[15px]">{text}</p>}
      <Button className="w-full" onClick={onDone} data-action="continue">Continue</Button>
    </div>
  )
}
