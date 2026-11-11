// The five plays on screen (F49 decision 5; romance spec RM25, RM29; hd2d-farm FR21): a flat sheet in the middle of the
// event player that opens on the play, shows what to aim for first (the seed), takes one thumb (timing from
// `pointerdown`), never takes from the Warehouse, and closes on its grade. The rules are `@farm/domain`'s
// (`romance/plays/`); this draws them: **Cast** a ring closing on the mark, **Pick** a 3 × 3 field of goods popping up,
// **Rhythm** her beat then yours with the activity's mark in words, **Walk** two turns at each fork toward two places'
// frames, **Choose** three goods. Both lengths are drawn (an event's and an evening's), so F50 only wires evenings
// (`PlaySheet` with `length="evening"`, `playSpec` for its numbers). The `play/*` marks are uma-art 2.26.0's. Loaded on
// demand with the player.
import {
  castPlan, castScore, CHOOSE_MS, GRADE_NAMES, choosePlan, chooseScore, goodName, gradeOf, pickGoods, pickPlan, pickScore, RHYTHM_LEAD, RHYTHM_MARK_WORDS, rhythmBeats, rhythmPlan,
  rhythmScore, walkFavourite, WALK_FORK_MS, walkPlacesOpen, walkPlan, walkScore, farmPlace, type ChoosePlan, type FarmPlaceId, type PickPlan, type PickTap, type PlayAs,
  type PlayLength, type PlayScore, type RhythmMark, type SaveV4, type Seed, type StoryPack, type Turn, type WalkPlan,
} from '@farm/domain'
import { Button, UiMark, useKitArt, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ItemIcon } from '../items/ItemIcon'
import { gradeLegend, gradeWords, PLAY_HOW, playTitle } from './event-view'
import { placeWords } from './hearts-view'

/** What a play needs, its plan built from the seed: F49's events and F50's evenings make it with `playSpec`. */
export type PlaySpec =
  | { kind: 'cast'; length: PlayLength; plan: ReturnType<typeof castPlan> }
  | { kind: 'pick'; length: PlayLength; plan: PickPlan; favourites: readonly string[] }
  | { kind: 'rhythm'; length: PlayLength; plan: ReturnType<typeof rhythmPlan>; mark: RhythmMark }
  | { kind: 'walk'; length: PlayLength; plan: WalkPlan }
  | { kind: 'choose'; length: PlayLength; plan: ChoosePlan; scoreOf: (good: string | null) => number }

/** A play's numbers for her (decision 5): its seeded plan, her favourites for Pick, her place for Walk, her tastes for
 * Choose. */
export function playSpec(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string, play: PlayAs, length: PlayLength, seed: Seed): PlaySpec {
  switch (play.kind) {
    case 'cast': return { kind: 'cast', length, plan: castPlan(seed, length) }
    case 'pick': {
      const goods = pickGoods(pack, id)
      return { kind: 'pick', length, plan: pickPlan(seed, length, goods), favourites: goods.favourites }
    }
    case 'rhythm': return { kind: 'rhythm', length, plan: rhythmPlan(seed, length), mark: play.mark ?? 'step' }
    case 'walk': return { kind: 'walk', length, plan: walkPlan(seed, length, walkFavourite(save, pack, id, seed), walkPlacesOpen(save)) }
    case 'choose': return { kind: 'choose', length, plan: choosePlan(seed, pack, id), scoreOf: (good) => chooseScore(pack, id, good) }
  }
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** A uma-art building frame, pixel-crisp at a whole scale: the place card's and the walk's. */
export function BuildingArt({ frame, scale = 2, className = '' }: { frame: string; scale?: number; className?: string }) {
  const atlas = useKitArt().buildings
  const at = atlas?.index.frames[frame]
  if (!atlas || !at) return <span aria-hidden className={`inline-block rounded-md bg-black/10 ${className}`} style={{ width: 48 * scale, height: 48 * scale }} data-frame={frame} />
  return (
    <span aria-hidden data-frame={frame} className={`inline-block shrink-0 ${className}`} style={{
      width: at.w * scale, height: at.h * scale, backgroundImage: `url(${atlas.url})`, backgroundSize: `${atlas.index.width * scale}px ${atlas.index.height * scale}px`,
      backgroundPosition: `-${at.x * scale}px -${at.y * scale}px`, backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
    }} />
  )
}

/** The sheet: its title and how to play, then the play, then its grade and **Continue**. `name` is hers. */
export function PlaySheet({ spec, title, name, replay = false, onDone }: {
  spec: PlaySpec; title?: string; name: string
  /** A Memory's replay: the grade without its points, since nothing pays. */
  replay?: boolean
  onDone: (result: Omit<PlayScore, 'kind'>) => void
}) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [result, setResult] = useState<Omit<PlayScore, 'kind'> | null>(null)
  const end = (score: number, learns?: string | null) => {
    setResult({ score, ...(learns !== undefined ? { learns } : {}) })
    setPhase('done')
  }
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 px-3" data-play={spec.kind} data-length={spec.length} data-phase={phase}>
      <section role="dialog" aria-label={title ?? playTitle(spec.kind, spec.length)} className="w-full max-w-md space-y-3 rounded-lg border border-hairline bg-panel p-4 shadow-3">
        <header className="flex items-center gap-2">
          <UiMark mark={`play/${spec.kind}`} scale={2} />
          <h2 className="font-display min-w-0 flex-1 text-[17px] font-bold" data-play-title>{title ?? playTitle(spec.kind, spec.length)}</h2>
        </header>
        {phase === 'intro' && <Intro spec={spec} name={name} onStart={() => setPhase('play')} />}
        {phase === 'play' && <PlayBody spec={spec} name={name} onEnd={end} />}
        {phase === 'done' && result && (
          <div className="space-y-3 text-center" data-play-result={gradeOf(result.score)} data-score={result.score}>
            <p className="font-display text-[26px] font-bold text-[#c2385e]">{replay ? GRADE_NAMES[gradeOf(result.score)] : gradeWords(result.score, spec.length)}</p>
            {result.learns !== undefined && <p className="text-[14px] text-ink-soft">{result.learns ? `You chose ${goodName(result.learns)}.` : 'Nothing chosen.'}</p>}
            <Button className="w-full" onClick={() => onDone(result)} data-action="play-done">Continue</Button>
          </div>
        )}
        <p className="text-center text-[12px] text-ink-faint" data-legend>{replay ? 'A replay: nothing pays.' : gradeLegend(spec.length)}</p>
      </section>
    </div>
  )
}

/** What to aim for, first (FR21's seed): how it plays, and what's hers. */
function Intro({ spec, name, onStart }: { spec: PlaySpec; name: string; onStart: () => void }) {
  return (
    <div className="space-y-3" data-play-intro>
      <p className="text-[15px]">{PLAY_HOW[spec.kind]}</p>
      {spec.kind === 'pick' && (
        <div className="flex flex-wrap items-center gap-1.5" data-favourites>
          <span className="text-[13px] text-ink-soft">{name}’s favourites ★</span>
          {spec.favourites.map((g) => <ItemIcon key={g} id={g} size={28} label={goodName(g)} />)}
        </div>
      )}
      {spec.kind === 'rhythm' && <p className="text-[13px] text-ink-soft" data-mark={spec.mark}>With {RHYTHM_MARK_WORDS[spec.mark]}, on {name}’s beat.</p>}
      {spec.kind === 'walk' && <p className="text-[15px] font-semibold" data-loves={spec.plan.favourite}>{name}: “I love {placeWords(spec.plan.favourite)}.”</p>}
      {spec.kind === 'cast' && <p className="text-[13px] text-ink-soft">Never a miss: every cast lands a fish.</p>}
      <Button className="w-full" onClick={onStart} data-action="play-start">Start</Button>
    </div>
  )
}

function PlayBody({ spec, name, onEnd }: { spec: PlaySpec; name: string; onEnd: (score: number, learns?: string | null) => void }) {
  switch (spec.kind) {
    case 'cast': return <CastPlay spec={spec} onEnd={onEnd} />
    case 'pick': return <PickPlay spec={spec} onEnd={onEnd} />
    case 'rhythm': return <RhythmPlay spec={spec} name={name} onEnd={onEnd} />
    case 'walk': return <WalkPlay spec={spec} onEnd={onEnd} />
    case 'choose': return <ChoosePlay spec={spec} onEnd={onEnd} />
  }
}

/** A clock from mount, redrawn each frame: ms since its start. */
function useClock(running: boolean, key: unknown): [number, { readonly current: number }] {
  const start = useRef(now())
  const [t, setT] = useState(0)
  useEffect(() => {
    start.current = now()
    setT(0)
    if (!running) return
    let frame = 0
    const tick = () => {
      setT(now() - start.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, key])
  return [t, start]
}

/** Big, thumb-sized tap target that records `pointerdown`. */
function TapButton({ label, onTap, children }: { label: string; onTap: () => void; children?: ReactNode }) {
  return (
    <button type="button" onPointerDown={(e) => { e.preventDefault(); onTap() }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap() } }}
      className="font-display flex min-h-16 w-full touch-none items-center justify-center rounded-lg bg-[#c2385e] text-[20px] font-bold text-white shadow-2 select-none active:scale-[0.98]" data-action="tap" aria-label={label}>
      {children ?? label}
    </button>
  )
}

// --- Cast -----------------------------------------------------------------------------------------------------------------

const MISS_AFTER = 720

function CastPlay({ spec, onEnd }: { spec: Extract<PlaySpec, { kind: 'cast' }>; onEnd: (score: number) => void }) {
  const [cast, setCast] = useState(0)
  const [taps, setTaps] = useState<(number | null)[]>([])
  const meet = spec.plan.meets[cast]!
  const [t, start] = useClock(true, cast)
  const tapped = taps.length > cast
  const record = (tap: number | null) => {
    if (taps.length > cast) return
    const next = [...taps, tap]
    setTaps(next)
    setTimeout(() => (cast + 1 < spec.plan.meets.length ? setCast(cast + 1) : onEnd(castScore(spec.plan, next))), 500)
  }
  useEffect(() => {
    if (!tapped && t > meet + MISS_AFTER) record(null)
  }, [t]) // eslint-disable-line react-hooks/exhaustive-deps
  // The ring closes from 3× the mark to the mark at the meeting, then on inside it.
  const r = Math.max(4, 28 * (1 + (2 * (meet - Math.min(t, meet + MISS_AFTER))) / meet))
  return (
    <div className="space-y-3" data-cast={cast} data-meet={meet}>
      <p className="text-center text-[13px] text-ink-soft">Cast {cast + 1} of {spec.plan.meets.length}</p>
      <div className="relative mx-auto grid size-48 place-items-center" aria-hidden>
        <span className="absolute size-14 rounded-full border-4 border-[#3f7d3a]" />
        <span className="absolute rounded-full border-4 border-[#c2385e]" style={{ width: r * 2, height: r * 2, opacity: tapped ? 0.3 : 1 }} data-ring={Math.round(r)} />
      </div>
      <TapButton label="Cast" onTap={() => record(now() - start.current)} />
    </div>
  )
}

// --- Rhythm ---------------------------------------------------------------------------------------------------------------

function RhythmPlay({ spec, name, onEnd }: { spec: Extract<PlaySpec, { kind: 'rhythm' }>; name: string; onEnd: (score: number) => void }) {
  const [round, setRound] = useState(0)
  const taps = useRef<number[][]>([])
  const period = spec.plan.periods[round]!
  const beats = useMemo(() => rhythmBeats(period), [period])
  const [t, start] = useClock(true, round)
  const last = beats.at(-1)! + period
  const reduced = useReducedMotionSetting()
  useEffect(() => {
    if (t < last) return
    if (round + 1 < spec.plan.periods.length) setRound(round + 1)
    else onEnd(rhythmScore(spec.plan, taps.current))
  }, [t >= last]) // eslint-disable-line react-hooks/exhaustive-deps
  const beat = Math.floor(t / period)
  const into = (t % period) / period
  const lead = beat < RHYTHM_LEAD
  const pulse = reduced ? (into < 0.2 ? 1 : 0.6) : Math.max(0.55, 1 - into)
  return (
    <div className="space-y-3" data-round={round} data-period={period}>
      <p className="text-center text-[13px] text-ink-soft">{spec.plan.periods.length > 1 ? `Round ${round + 1} of ${spec.plan.periods.length} · ` : ''}{lead ? `${name}’s beat…` : `Your turn: ${Math.min(8, beat - RHYTHM_LEAD + 1)} of 8`}</p>
      <div className="mx-auto grid size-40 place-items-center" aria-hidden>
        <span className="grid size-28 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: lead ? '#7a8b3a' : '#c2385e', transform: `scale(${pulse})` }} data-beat={beat}>
          {RHYTHM_MARK_WORDS[spec.mark]}
        </span>
      </div>
      <TapButton label="Tap" onTap={() => { (taps.current[round] ??= []).push(now() - start.current) }} />
    </div>
  )
}

// --- Pick -----------------------------------------------------------------------------------------------------------------

function PickPlay({ spec, onEnd }: { spec: Extract<PlaySpec, { kind: 'pick' }>; onEnd: (score: number) => void }) {
  const [round, setRound] = useState(0)
  const taps = useRef<PickTap[][]>([])
  const [hits, setHits] = useState<Record<number, 'right' | 'wrong'>>({})
  const pops = spec.plan.rounds[round]!
  const [t, start] = useClock(true, round)
  const last = Math.max(...pops.map((p) => p.until)) + 300
  useEffect(() => {
    if (t < last) return
    setHits({})
    if (round + 1 < spec.plan.rounds.length) setRound(round + 1)
    else onEnd(pickScore(spec.plan, taps.current))
  }, [t >= last]) // eslint-disable-line react-hooks/exhaustive-deps
  const showing = pops.map((p, i) => ({ p, i })).filter(({ p }) => t >= p.at && t < p.until)
  const tap = (cell: number) => {
    const at = now() - start.current
    ;(taps.current[round] ??= []).push({ at, cell })
    const hit = pops.findIndex((p) => p.cell === cell && at >= p.at && at < p.until)
    if (hit >= 0 && !hits[hit]) setHits({ ...hits, [hit]: pops[hit]!.star ? 'right' : 'wrong' })
  }
  return (
    <div className="space-y-2" data-round={round}>
      {spec.plan.rounds.length > 1 && <p className="text-center text-[13px] text-ink-soft">Round {round + 1} of {spec.plan.rounds.length}</p>}
      <div className="mx-auto grid max-w-[320px] grid-cols-3 gap-2" data-field>
        {Array.from({ length: 9 }, (_, cell) => {
          const shown = showing.find(({ p }) => p.cell === cell)
          const hit = shown ? hits[shown.i] : undefined
          return (
            <button key={cell} type="button" onPointerDown={(e) => { e.preventDefault(); tap(cell) }} aria-label={shown ? `${goodName(shown.p.good)}${shown.p.star ? ', starred' : ''}` : 'Empty'}
              className={`relative grid aspect-square min-h-20 touch-none place-items-center rounded-md border select-none ${hit === 'right' ? 'border-success bg-success/15' : hit === 'wrong' ? 'border-danger bg-danger/10' : 'border-hairline bg-sunken'}`}
              data-cell={cell} data-good={shown?.p.good} data-star={shown?.p.star || undefined}>
              {shown && <ItemIcon id={shown.p.good} size={48} />}
              {shown?.p.star && <span aria-hidden className="absolute top-1 right-1.5 text-[16px] text-[#d9a227]">★</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Walk -----------------------------------------------------------------------------------------------------------------

function WalkPlay({ spec, onEnd }: { spec: Extract<PlaySpec, { kind: 'walk' }>; onEnd: (score: number) => void }) {
  const [fork, setFork] = useState(0)
  const [turns, setTurns] = useState<(Turn | null)[]>([])
  const [t] = useClock(true, fork)
  const take = (turn: Turn | null) => {
    if (turns.length > fork) return
    const next = [...turns, turn]
    setTurns(next)
    if (fork + 1 < spec.plan.forks.length) setFork(fork + 1)
    else onEnd(walkScore(spec.plan, next))
  }
  useEffect(() => {
    if (t > WALK_FORK_MS) take(null)
  }, [t > WALK_FORK_MS]) // eslint-disable-line react-hooks/exhaustive-deps
  const here = spec.plan.forks[fork]!
  const side = (turn: Turn) => {
    const place = here[turn] as FarmPlaceId
    return (
      <button type="button" onClick={() => take(turn)} className="flex min-h-12 flex-1 flex-col items-center gap-1 rounded-md border border-hairline bg-sunken px-2 py-2" data-turn={turn} data-place={place}>
        <BuildingArt frame={farmPlace(place)?.frame ?? 'fields'} scale={1} />
        <span className="text-[14px] font-semibold">{turn === 'left' ? '← ' : ''}{farmPlace(place)?.name ?? place}{turn === 'right' ? ' →' : ''}</span>
      </button>
    )
  }
  return (
    <div className="space-y-2" data-fork={fork}>
      <p className="text-center text-[13px] text-ink-soft">Fork {fork + 1} of {spec.plan.forks.length}</p>
      <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-sunken"><span className="block h-full bg-[#c2385e]" style={{ width: `${Math.max(0, 100 - (100 * t) / WALK_FORK_MS)}%` }} /></span>
      <div className="flex gap-2">{side('left')}{side('right')}</div>
    </div>
  )
}

// --- Choose ---------------------------------------------------------------------------------------------------------------

function ChoosePlay({ spec, onEnd }: { spec: Extract<PlaySpec, { kind: 'choose' }>; onEnd: (score: number, learns: string | null) => void }) {
  const [t] = useClock(true, 0)
  const [done, setDone] = useState(false)
  const pick = (good: string | null) => {
    if (done) return
    setDone(true)
    onEnd(spec.scoreOf(good), good)
  }
  useEffect(() => {
    if (t > CHOOSE_MS) pick(null)
  }, [t > CHOOSE_MS]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-2" data-choose>
      <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-sunken"><span className="block h-full bg-[#c2385e]" style={{ width: `${Math.max(0, 100 - (100 * t) / CHOOSE_MS)}%` }} /></span>
      <div className="grid grid-cols-3 gap-2">
        {spec.plan.goods.map((good) => (
          <button key={good} type="button" onClick={() => pick(good)} className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-hairline bg-sunken p-2" data-good={good}>
            <ItemIcon id={good} size={40} />
            <span className="text-[13px] leading-tight font-semibold">{goodName(good)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
