// The stove: the cooking game, full screen at `?stove=1` over the page it was started on, while a play is under way
// (`workshops.current`). Landscape, one thumb: the score, the seed and a time bar in the header with ✕; the ticket rail
// across the top (a tap puts a ticket first); three burners in the middle, each a ring that fills to its green window
// (tap in the green to pull; its middle is Perfect); the pass on the right with what's been served. Timing from
// `pointerdown`. It draws the game from the rules' own functions (`@farm/domain`'s `kitchen/stove.ts`), and its end hands
// the taps to the rules, which replay them against the seed: the result card says what they made. ✕ asks once ("Stop?
// It counts as Rough.") and settles it Rough; leaving mid-play leaves it for the shell to settle Rough. A 3-2-1 count
// comes before the clock, which then runs without pause. Its own lazy chunk.
import {
  BURNERS, burnerView, dishName, GREEN_MS, itemNameOf, newStove, PERFECT_FROM_MS, PERFECT_TO_MS, PLAY_TIERS, stoveAt, stoveScore, stoveTap, tierOf,
  type PlayInProgress, type PlayResult, type Stove, type StoveEvent, type StoveTap, type StoveTicket,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { finishTheStove } from './kitchen-actions'
import { holdPlay, playHeld, releasePlay } from './stove-session'
import { plural } from './words'

const clock = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now())
/** The count before the clock: three beats. */
const COUNT_MS = 2400
/** A pop shows this long. */
const POP_MS = 900

/** A ticket's dressing: what's cooking and its parts' ingredients. A batch is "Meal" of its two goods (the first good,
 * the first, the second; or the first and the second); a Kitchen ticket is the menu's recipes in turn (its main, its
 * main, its side; or its main and its side). Names never change the timings. */
export interface Dressing {
  name: string
  icon: string | null
  parts: string[]
}
export function dressingOf(play: Pick<PlayInProgress, 'play' | 'goods' | 'menu'>, ticket: Pick<StoveTicket, 'id' | 'parts'>): Dressing {
  const name = (key: string) => itemNameOf(key.slice(0, key.lastIndexOf('@')))
  if (play.play === 'batch') {
    const [a = '', b = a] = (play.goods ?? []).map(name)
    return { name: 'Meal', icon: null, parts: ticket.parts === 3 ? [a, a, b] : [a, b] }
  }
  const menu = play.menu ?? []
  const line = menu[(ticket.id - 1) % Math.max(1, menu.length)]
  if (!line) return { name: 'Dish', icon: null, parts: Array.from({ length: ticket.parts }, () => '') }
  const [main, side] = [name(line.main), name(line.side)]
  return { name: dishName(line.dish), icon: line.dish, parts: ticket.parts === 3 ? [main, main, side] : [main, side] }
}

/** `?stove=1`: the play under way, or nothing (the stove closes). */
export default function StovePlayer() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  // The play as it started, only when this session started it and holds it (a play found on opening the app, or after
  // its screen was left, isn't replayed: the shell settles it Rough). Kept for the whole screen, so its end can still
  // draw it after the save lets it go.
  const [play] = useState<PlayInProgress | null>(() => {
    const under = save?.workshops.current ?? null
    return under && playHeld(under.seed) ? under : null
  })
  const close = useCallback(() => leave(withParam(location, 'stove', null)), [leave, location])
  useEffect(() => {
    if (!play) close()
  }, [play, close])
  if (!play) return null
  // Over everything, sheets included (they portal to the body): the stove takes the whole screen.
  return createPortal(<StoveScreen play={play} onClose={close} />, document.body)
}

type Phase = 'count' | 'play' | 'ask' | 'settling' | 'done'

function StoveScreen({ play, onClose }: { play: PlayInProgress; onClose: () => void }) {
  const length = play.length * 1000
  const [phase, setPhase] = useState<Phase>('count')
  const [result, setResult] = useState<PlayResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stove = useRef<Stove>(newStove(play.seed, length))
  const taps = useRef<StoveTap[]>([])
  const start = useRef<number | null>(null)
  const [, setFrame] = useState(0)
  const finished = useRef(false)

  // Held while the screen is open: the shell settles a play left behind, never this one.
  useEffect(() => {
    holdPlay(play.seed)
    return () => releasePlay()
  }, [play.seed])

  const finish = useCallback(async (with_: StoveTap[] | null) => {
    if (finished.current) return
    finished.current = true
    setPhase('settling')
    try {
      setResult(await finishTheStove(with_))
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t work.')
      setPhase('done')
    }
  }, [])

  // The count, then the clock, a frame at a time.
  useEffect(() => {
    if (phase !== 'count') return
    const t = setTimeout(() => {
      start.current = clock()
      setPhase('play')
    }, COUNT_MS)
    return () => clearTimeout(t)
  }, [phase])
  useEffect(() => {
    if (phase !== 'play' && phase !== 'ask') return
    let raf = 0
    const tick = () => {
      const at = start.current === null ? 0 : clock() - start.current
      stove.current = stoveAt(stove.current, Math.min(at, length))
      setFrame((n) => n + 1)
      if (at >= length) {
        void finish(taps.current)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, length, finish])

  const tap = (target: { burner: number } | { ticket: number }) => {
    if ((phase !== 'play' && phase !== 'ask') || start.current === null) return
    const at = Math.round(clock() - start.current)
    if (at > length) return
    const t: StoveTap = { at, ...target }
    taps.current.push(t)
    stove.current = stoveTap(stove.current, t)
    setFrame((n) => n + 1)
  }

  const s = stove.current
  const now = start.current === null ? 0 : Math.min(length, clock() - start.current)
  const open = s.tickets.filter((t) => t.state === 'open')
  const served = s.tickets.filter((t) => t.state === 'served')
  const coming = s.tickets.filter((t) => t.state === 'coming').length
  const pops = s.events.filter((e) => now - e.at < POP_MS)
  const live = stoveScore(s)

  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[70] flex flex-col bg-page text-ink select-none" role="dialog" aria-modal="true" aria-label="The stove"
      data-stove={play.play} data-phase={phase} data-seed={play.seed}>
      {/* The header: ✕, the seed, the time bar, the score. */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-hairline px-2">
        <button type="button" className="flex size-11 items-center justify-center rounded-full text-[20px] text-ink-soft" aria-label="Stop"
          disabled={phase !== 'play' && phase !== 'count'} onClick={() => setPhase('ask')} data-action="stop">✕</button>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight">{play.play === 'batch' ? 'At the stove' : 'The Kitchen'}</p>
          <p className="text-[11px] text-ink-faint tabular-nums" data-stove-seed>Seed {play.seed}</p>
        </div>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken" aria-label={`${Math.ceil((length - now) / 1000)} seconds left`} data-time>
          <div className="h-full bg-accent" style={{ width: `${100 * (1 - now / length)}%` }} />
        </div>
        <p className="w-40 shrink-0 text-right font-display text-[18px] font-bold whitespace-nowrap tabular-nums" data-score={live}>{live}<span className="text-[12px] font-normal text-ink-soft"> · {tierOf(live).name}</span></p>
      </header>

      {/* The ticket rail: what's open, oldest first; a tap puts one first. */}
      <div className="flex h-[92px] shrink-0 items-stretch gap-1.5 overflow-x-auto border-b border-hairline bg-sunken/50 px-2 py-1.5" aria-label="The tickets" data-rail>
        {open.length === 0 && <p className="self-center px-2 text-[13px] text-ink-soft">{coming > 0 ? 'Tickets coming…' : 'No more tickets.'}</p>}
        {open.map((t) => <TicketCard key={t.id} ticket={t} dressing={dressingOf(play, t)} now={now} first={(s.focus ?? open.find((o) => o.cooked.includes('todo'))?.id) === t.id}
          onTap={() => tap({ ticket: t.id })} />)}
      </div>

      {/* The burners and the pass. */}
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 items-center justify-around gap-2 px-2" aria-label="The burners">
          {Array.from({ length: BURNERS }, (_, i) => (
            <BurnerButton key={i} index={i} stove={s} play={play} now={now} pops={pops.filter((e) => e.burner === i)} onTap={() => tap({ burner: i })} />
          ))}
        </div>
        <aside className="w-40 shrink-0 space-y-1 overflow-y-auto border-l border-hairline px-2 py-1.5" aria-label="The pass" data-pass={served.length}>
          <p className="text-micro">The pass · {served.length}</p>
          {pops.filter((e) => e.burner === -1).map((e) => <Pop key={`${e.at}:${e.ticket}`} event={e} />)}
          {served.slice().reverse().map((t) => {
            const d = dressingOf(play, t)
            return (
              <p key={t.id} className="flex items-center gap-1 truncate text-[12px] text-success" data-served={t.id}>
                {d.icon && <ItemIcon id={d.icon} size={18} />}<span className="truncate">✓ {d.name}</span>
              </p>
            )
          })}
        </aside>
      </div>

      {phase === 'count' && <Overlay><p className="font-display text-[44px] font-bold" data-count>Ready…</p><p className="text-[14px] text-ink-soft">Tap a burner to cook the first ticket. Pull in the green.</p></Overlay>}
      {phase === 'ask' && (
        <Overlay>
          <p className="text-[16px] font-semibold">Stop? It counts as Rough.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPhase(start.current === null ? 'count' : 'play')} data-action="keep-cooking">Keep cooking</Button>
            <Button onClick={() => void finish(null)} data-action="stop-rough">Stop</Button>
          </div>
        </Overlay>
      )}
      {phase === 'settling' && <Overlay><p className="text-[16px] font-semibold">Plating up…</p></Overlay>}
      {phase === 'done' && (
        <Overlay>
          {result ? <ResultCard result={result} /> : <p className="text-[14px] text-danger">{error}</p>}
          <Button className="min-w-40" onClick={onClose} data-action="stove-done">Done</Button>
        </Overlay>
      )}
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-page/85 px-6 text-center">{children}</div>
}

/** One ticket on the rail: what's cooking, its parts (to cook, on a burner, on the pass) and the wait left. */
function TicketCard({ ticket, dressing, now, first, onTap }: { ticket: StoveTicket; dressing: Dressing; now: number; first: boolean; onTap: () => void }) {
  const left = Math.max(0, (ticket.due - now) / (ticket.due - ticket.at))
  return (
    <button type="button" onPointerDown={(e) => { e.preventDefault(); onTap() }}
      className={`flex w-[150px] shrink-0 flex-col justify-between rounded-md border px-1.5 py-1 text-left ${first ? 'border-accent bg-accent/10' : 'border-hairline bg-panel'}`}
      aria-label={`Ticket ${ticket.id}, ${dressing.name}${first ? ', first' : ''}`} data-ticket={ticket.id} data-first={first || undefined}>
      <span className="flex items-center gap-1 truncate text-[12px] font-semibold">
        {dressing.icon && <ItemIcon id={dressing.icon} size={18} />}<span className="truncate">{dressing.name}</span>
      </span>
      <span className="flex gap-0.5">
        {ticket.cooked.map((c, k) => (
          <span key={k} className={`min-w-0 flex-1 truncate rounded-sm px-0.5 text-[10px] leading-4 ${c === 'done' ? 'bg-success/20 text-success' : c === 'cooking' ? 'bg-warning/20 text-warning' : 'bg-sunken text-ink-soft'}`}
            data-part={c}>{dressing.parts[k]}</span>
        ))}
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
        <span className={`block h-full ${left < 0.25 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${100 * left}%` }} />
      </span>
    </button>
  )
}

/** A burner: a ring that fills while its part cooks, then its green window (its middle Perfect); a tap starts or pulls. */
function BurnerButton({ index, stove, play, now, pops, onTap }: { index: number; stove: Stove; play: PlayInProgress; now: number; pops: StoveEvent[]; onTap: () => void }) {
  const view = burnerView(stove, index, now)
  const ticket = view.kind === 'cooking' || view.kind === 'green' ? stove.tickets[view.ticket - 1] : undefined
  const part = ticket && (view.kind === 'cooking' || view.kind === 'green') ? dressingOf(play, ticket).parts[view.part] : null
  const R = 44
  const C = 2 * Math.PI * R
  const fill = view.kind === 'cooking' ? view.fill : view.kind === 'green' ? 1 : 0
  const green = view.kind === 'green' ? view.into : 0
  return (
    <button type="button" onPointerDown={(e) => { e.preventDefault(); onTap() }} aria-label={`Burner ${index + 1}${part ? `, ${part}` : ', empty'}`}
      className="relative flex size-[min(30vh,140px)] min-h-24 min-w-24 shrink-0 items-center justify-center rounded-full bg-panel shadow-2 active:scale-[0.97]"
      data-burner={index} data-state={view.kind}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-sunken, #e5e1d8)" strokeWidth="8" />
        {view.kind === 'smoke' && <circle cx="50" cy="50" r={R} fill="none" stroke="#9a948a" strokeWidth="8" strokeDasharray="4 6" />}
        {fill > 0 && (
          <circle cx="50" cy="50" r={R} fill="none" stroke={view.kind === 'green' ? '#3f9b4f' : '#e08a2c'} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${C * fill} ${C}`} transform="rotate(-90 50 50)" />
        )}
        {view.kind === 'green' && (
          <>
            {/* The Perfect middle, and how far into the green. */}
            <circle cx="50" cy="50" r={R - 11} fill="none" stroke="#3f9b4f" strokeOpacity="0.25" strokeWidth="6"
              strokeDasharray={`${(2 * Math.PI * (R - 11) * (PERFECT_TO_MS - PERFECT_FROM_MS)) / GREEN_MS} ${2 * Math.PI * (R - 11)}`}
              transform={`rotate(${-90 + (360 * PERFECT_FROM_MS) / GREEN_MS} 50 50)`} />
            <circle cx="50" cy="50" r={R - 11} fill="none" stroke={view.perfect ? '#2f7a3d' : '#3f9b4f'} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * (R - 11) * green} ${2 * Math.PI * (R - 11)}`} transform="rotate(-90 50 50)" />
          </>
        )}
      </svg>
      <span className="relative max-w-[70%] text-center text-[13px] font-semibold leading-tight">
        {view.kind === 'empty' ? <span className="text-ink-faint">Tap to cook</span> : view.kind === 'smoke' ? <span className="text-ink-soft">Smoke…</span>
          : <>{part}<span className={`block text-[11px] ${view.kind === 'green' ? (view.perfect ? 'font-bold text-success' : 'text-success') : 'font-normal text-ink-soft'}`}>{view.kind === 'green' ? (view.perfect ? 'Now!' : 'Pull') : `#${view.ticket}`}</span></>}
      </span>
      {pops.map((e) => <span key={`${e.at}:${e.kind}`} className="absolute -top-2"><Pop event={e} /></span>)}
    </button>
  )
}

const POP_WORDS: Readonly<Record<StoveEvent['kind'], string>> = { perfect: 'Perfect', good: 'Good', raw: 'Raw', burnt: 'Burnt', served: 'Served', late: 'Late' }
function Pop({ event }: { event: StoveEvent }) {
  const good = event.points > 0
  return (
    <span className={`rounded-full px-1.5 text-[12px] font-bold whitespace-nowrap ${good ? 'bg-success/20 text-success' : 'bg-danger/15 text-danger'}`} data-pop={event.kind}>
      {POP_WORDS[event.kind]} {good ? '+' : '−'}{Math.abs(event.points)}
    </span>
  )
}

/** What the play made, by its tier. */
function ResultCard({ result }: { result: PlayResult }) {
  const tier = PLAY_TIERS.find((t) => t.grade === result.grade)!
  const made = result.play === 'batch'
    ? `${plural(result.meals, 'meal')} ★${result.stars} into the pantry`
    : result.dishes.filter((d) => d.count > 0).map((d) => `${d.count} ${dishName(d.dish)} ★${d.stars}`).join(' · ')
  return (
    <div className="space-y-1" data-result={result.grade} data-result-score={result.score}>
      <p className="font-display text-[32px] font-bold">{tier.name}</p>
      <p className="text-[14px] text-ink-soft">{result.stopped ? 'Stopped: it counts as Rough.' : `Score ${result.score}`}</p>
      <p className="text-[15px] font-semibold" data-made>{made}</p>
      {result.play === 'kitchen' && result.dishes.length > 0 && (
        <p className="flex justify-center gap-1">{result.dishes.filter((d) => d.count > 0).map((d) => <ItemIcon key={d.dish} id={d.dish} size={32} />)}</p>
      )}
    </div>
  )
}
