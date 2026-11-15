// The stove: the cooking game, an original time-management game played whenever you cook at the farmhouse stove or the
// Kitchen. Its rules and numbers are the old sketch's (measured over 8 seeds: a careful player 92, a casual 73), made
// pure here; the web draws the game from these same functions, and a play's finish replays its taps against its seed,
// so the screen can only show what the rules award.
//
//   the board    three burners, a ticket rail, the pass
//   tickets      on the play's seed, every 2.4–3.8 s from 0.8 s, the last 12 s before the end; half three-part (they
//                wait 18 s), half two-part (13 s)
//   a part       tap an empty burner: it starts the next part of the first ticket (tap a ticket to put it first). The
//                ring fills (a three-part ticket's parts 3.2, 2.6 and 2.0 s; a two-part's 2.4 and 1.8 s), then a
//                1-second green window
//   pulling it   tap the burner in the green: its middle 0.3 s (0.35–0.65 s in) Perfect +4, the rest Good +2. Too
//                early: raw −1, cook it again. Past the green: burnt −3, and the pan smokes 0.7 s
//   served       a ticket whose parts are all on the pass: +3 a part. One whose wait runs out leaves: late −4
//   the score    points ÷ the seed's most (7 a part) × 100, held to 0–100
//
// Times are milliseconds from the play's start. A tap at a time before the last is ignored, so a replay is the play.
// Pure: every function returns a new stove.
import { mulberry32 } from '../farm/draw'
import type { PlayGrade } from '../farm/rank-rules'

/** The stove's burners. */
export const BURNERS = 3
/** The green window: the part burns when it closes. */
export const GREEN_MS = 1000
/** Its middle 0.3 s: a Perfect pull. */
export const PERFECT_FROM_MS = 350
export const PERFECT_TO_MS = 650
/** A burnt pan smokes this long before the burner is free. */
export const SMOKE_MS = 700
/** What each happening scores. */
export const STOVE_POINTS = { perfect: 4, good: 2, served: 3, raw: -1, burnt: -3, late: -4 } as const
/** The most a part can score: a Perfect pull and its share of the ticket served. */
export const MOST_A_PART = STOVE_POINTS.perfect + STOVE_POINTS.served
/** The tickets' arrivals: the first at 0.8 s, then every 2.4–3.8 s, none in the last 12 s; half of them three-part. */
export const ARRIVALS = { first: 800, gapMin: 2400, gapMax: 3800, closeBefore: 12_000, threeShare: 0.5 } as const
/** A ticket's shape: how long it waits, and each part's cooking until its green, in order. */
export interface TicketShape { wait: number; cook: readonly number[] }
export const TICKET_SHAPES: Readonly<Record<2 | 3, TicketShape>> = {
  3: { wait: 18_000, cook: [3200, 2600, 2000] },
  2: { wait: 13_000, cook: [2400, 1800] },
}

/** A play's length, in seconds: a batch at the farmhouse stove, the Kitchen's play, and the Cooking Contest's dish. */
export const STOVE_SECONDS = { batch: 30, kitchen: 60, contest: 60 } as const

// --- The tiers --------------------------------------------------------------------------------------------------------

/** A tier: from its score, its count's factor (never below the base) and the stars it lifts. */
export interface PlayTier {
  grade: PlayGrade
  name: string
  min: number
  /** The count's factor: ×1, ×1.25, ×1.5, ×2. */
  factor: number
  /** Stars added, held to ★5: +0, +0, +1, +2. */
  lift: number
}
/** The four tiers, Rough to Masterwork. */
export const PLAY_TIERS: readonly PlayTier[] = [
  { grade: 'rough', name: 'Rough', min: 0, factor: 1, lift: 0 },
  { grade: 'good', name: 'Good', min: 50, factor: 1.25, lift: 0 },
  { grade: 'fine', name: 'Fine', min: 75, factor: 1.5, lift: 1 },
  { grade: 'masterwork', name: 'Masterwork', min: 90, factor: 2, lift: 2 },
]
/** A score's tier. */
export const tierOf = (score: number): PlayTier => [...PLAY_TIERS].reverse().find((t) => score >= t.min) ?? PLAY_TIERS[0]!
/** A tier by its grade. */
export const tierByGrade = (grade: PlayGrade): PlayTier => PLAY_TIERS.find((t) => t.grade === grade)!
/** What a tier makes of a base count: × its factor, rounded half up, never below the base. */
export const tierCount = (base: number, tier: Pick<PlayTier, 'factor'>): number => Math.max(base, Math.floor(base * tier.factor + 0.5 + 1e-9))

// --- The game ---------------------------------------------------------------------------------------------------------

/** A part's state on its ticket. */
export type PartState = 'todo' | 'cooking' | 'done'
/** A ticket on the rail: its parts (two or three), when it comes and when its wait runs out, and how it stands. */
export interface StoveTicket {
  /** 1, 2, …: its place in the play's order. */
  id: number
  parts: 2 | 3
  at: number
  due: number
  state: 'coming' | 'open' | 'served' | 'late'
  cooked: PartState[]
}
/** A burner: the ticket and part on it (null when empty), when it started, and until when it smokes. */
export interface Burner {
  ticket: number | null
  part: number
  start: number
  smokeUntil: number
}
/** What scored, for the screen's pops: its kind, its points, the burner (−1 for a ticket's own) and when. */
export type StoveHappening = 'perfect' | 'good' | 'raw' | 'burnt' | 'served' | 'late'
export interface StoveEvent {
  kind: StoveHappening
  points: number
  burner: number
  ticket: number
  at: number
}
/** A play at the stove. */
export interface Stove {
  seed: number
  /** Its length, in milliseconds. */
  length: number
  /** The time the play has reached. */
  now: number
  over: boolean
  tickets: StoveTicket[]
  /** The ticket you put first, or null: an empty burner starts the oldest otherwise. */
  focus: number | null
  points: number
  /** The seed's most: 7 a part. */
  most: number
  burners: Burner[]
  counts: Record<StoveHappening, number>
  events: StoveEvent[]
}
/** A tap: on a burner, or on a ticket to put it first; `at` in milliseconds from the start. */
export type StoveTap = { at: number; burner: number } | { at: number; ticket: number }

/** The play's generator from its seed: one mulberry32 step at a time. */
function seeded(seed: number): () => number {
  let a = seed | 0
  return () => {
    const u = mulberry32(a)
    a = (a + 0x6d2b79f5) | 0
    return u
  }
}

/** A part's cooking until its green: the ticket's shape's. */
export const cookMs = (ticket: Pick<StoveTicket, 'parts'>, part: number): number => TICKET_SHAPES[ticket.parts].cook[part] ?? 0

/** A new play on a seed, `length` milliseconds long: its tickets drawn, nothing cooking, no points. */
export function newStove(seed: number, length: number): Stove {
  const r = seeded(seed)
  const tickets: StoveTicket[] = []
  for (let t: number = ARRIVALS.first; t <= length - ARRIVALS.closeBefore; t += ARRIVALS.gapMin + r() * (ARRIVALS.gapMax - ARRIVALS.gapMin)) {
    const parts: 2 | 3 = r() < ARRIVALS.threeShare ? 3 : 2
    const at = Math.round(t)
    tickets.push({ id: tickets.length + 1, parts, at, due: at + TICKET_SHAPES[parts].wait, state: 'coming', cooked: Array.from({ length: parts }, () => 'todo') })
  }
  const most = tickets.reduce((n, t) => n + t.parts * MOST_A_PART, 0)
  return {
    seed, length, now: 0, over: length <= 0, tickets, focus: null, points: 0, most,
    burners: Array.from({ length: BURNERS }, () => ({ ticket: null, part: -1, start: 0, smokeUntil: 0 })),
    counts: { perfect: 0, good: 0, raw: 0, burnt: 0, served: 0, late: 0 }, events: [],
  }
}

/** A working copy to change. */
function copy(s: Stove): Stove {
  return { ...s, tickets: s.tickets.map((t) => ({ ...t, cooked: [...t.cooked] })), burners: s.burners.map((b) => ({ ...b })), counts: { ...s.counts }, events: [...s.events] }
}
function score(s: Stove, kind: StoveHappening, points: number, burner: number, ticket: number): void {
  s.points += points
  s.counts[kind] += 1
  s.events.push({ kind, points, burner, ticket, at: s.now })
}
const ticketOf = (s: Stove, id: number | null): StoveTicket | undefined => (id === null ? undefined : s.tickets[id - 1])

/** Moves a working copy to `now`: tickets come and leave late, and parts left past their green burn. */
function advance(s: Stove, now: number): void {
  if (now < s.now) return
  s.now = Math.min(now, s.length)
  for (const t of s.tickets) {
    if (t.state === 'coming' && s.now >= t.at) t.state = 'open'
    if (t.state === 'open' && s.now >= t.due) {
      t.state = 'late'
      if (s.focus === t.id) s.focus = null
      score(s, 'late', STOVE_POINTS.late, -1, t.id)
    }
  }
  s.burners.forEach((b, i) => {
    const t = ticketOf(s, b.ticket)
    if (!t) return
    const end = b.start + cookMs(t, b.part) + GREEN_MS
    if (s.now >= end) {
      if (t.cooked[b.part] === 'cooking') t.cooked[b.part] = 'todo'
      b.ticket = null
      b.part = -1
      b.smokeUntil = end + SMOKE_MS
      score(s, 'burnt', STOVE_POINTS.burnt, i, t.id)
    }
  })
  if (now >= s.length) s.over = true
}

/** The stove at `now`: tickets come, leave late, and parts burn. */
export function stoveAt(s: Stove, now: number): Stove {
  if (now <= s.now && !(now >= s.length && !s.over)) return s
  const next = copy(s)
  advance(next, now)
  return next
}

/** The ticket an empty burner serves: the one you put first, else the oldest open one with a part still to cook. */
export function focusTicket(s: Stove): StoveTicket | null {
  const open = s.tickets.filter((t) => t.state === 'open' && t.cooked.includes('todo'))
  return open.find((t) => t.id === s.focus) ?? open[0] ?? null
}

/** A tap on a ticket: it's first for the next empty burner. */
export function tapTicket(s: Stove, id: number, now: number): Stove {
  const next = copy(s)
  advance(next, now)
  const t = ticketOf(next, id)
  if (!next.over && t?.state === 'open' && now >= next.now) next.focus = t.id
  return next
}

/** A tap on a burner: empty and not smoking, it starts the next part of the first ticket; cooking, it pulls the part:
 * raw before its green, Perfect in the green's middle, Good in the rest, onto the pass. */
export function tapBurner(s: Stove, i: number, now: number): Stove {
  if (now < s.now || i < 0 || i >= s.burners.length) return s
  const next = copy(s)
  advance(next, now)
  if (next.over) return next
  const b = next.burners[i]!
  const on = ticketOf(next, b.ticket)
  if (!on) {
    if (next.now < b.smokeUntil) return next
    const t = focusTicket(next)
    if (!t) return next
    const k = t.cooked.indexOf('todo')
    t.cooked[k] = 'cooking'
    b.ticket = t.id
    b.part = k
    b.start = next.now
    return next
  }
  const part = b.part
  const into = next.now - b.start - cookMs(on, part)
  b.ticket = null
  b.part = -1
  if (into < 0) {
    on.cooked[part] = 'todo'
    score(next, 'raw', STOVE_POINTS.raw, i, on.id)
    return next
  }
  const perfect = into >= PERFECT_FROM_MS && into <= PERFECT_TO_MS
  score(next, perfect ? 'perfect' : 'good', perfect ? STOVE_POINTS.perfect : STOVE_POINTS.good, i, on.id)
  // To the pass: its own ticket, or, if that one left, the oldest open ticket of its shape still needing that part.
  let dest: { t: StoveTicket; k: number } | null = on.state === 'open' ? { t: on, k: part } : null
  if (!dest) {
    const other = next.tickets.find((o) => o.state === 'open' && o.parts === on.parts && o.cooked[part] === 'todo')
    if (other) dest = { t: other, k: part }
  }
  if (!dest) return next
  dest.t.cooked[dest.k] = 'done'
  if (dest.t.cooked.every((c) => c === 'done')) {
    dest.t.state = 'served'
    if (next.focus === dest.t.id) next.focus = null
    score(next, 'served', STOVE_POINTS.served * dest.t.parts, -1, dest.t.id)
  }
  return next
}

/** One tap, a burner's or a ticket's. */
export const stoveTap = (s: Stove, tap: StoveTap): Stove => ('burner' in tap ? tapBurner(s, tap.burner, tap.at) : tapTicket(s, tap.ticket, tap.at))

/** A whole play replayed: its taps in order against its seed, then the clock run to its end. A tap out of order, out of
 * the play's time or not a number is ignored. */
export function playStove(seed: number, length: number, taps: readonly StoveTap[]): Stove {
  let s = newStove(seed, length)
  for (const tap of taps) {
    if (!Number.isFinite(tap.at) || tap.at < s.now || tap.at > length) continue
    s = stoveTap(s, tap)
  }
  return stoveAt(s, length)
}

/** A play's score: its points ÷ the seed's most × 100, rounded, held to 0–100. */
export const stoveScore = (s: Pick<Stove, 'points' | 'most'>): number => (s.most > 0 ? Math.max(0, Math.min(100, Math.round((100 * s.points) / s.most))) : 0)

/** A burner as the screen draws it at `now`: empty, smoking, cooking (its ring's fill, 0–1) or in its green (how far
 * in, 0–1, and whether that's the Perfect middle). */
export type BurnerView =
  | { kind: 'empty' }
  | { kind: 'smoke' }
  | { kind: 'cooking'; ticket: number; part: number; fill: number }
  | { kind: 'green'; ticket: number; part: number; into: number; perfect: boolean }
export function burnerView(s: Stove, i: number, now: number): BurnerView {
  const b = s.burners[i]
  const t = b ? ticketOf(s, b.ticket) : undefined
  if (!b || !t) return b && now < b.smokeUntil ? { kind: 'smoke' } : { kind: 'empty' }
  const cook = cookMs(t, b.part)
  const at = now - b.start
  if (at < cook) return { kind: 'cooking', ticket: t.id, part: b.part, fill: Math.max(0, at / cook) }
  const into = at - cook
  return { kind: 'green', ticket: t.id, part: b.part, into: Math.min(1, into / GREEN_MS), perfect: into >= PERFECT_FROM_MS && into <= PERFECT_TO_MS }
}

/** A play's seed in four digits: 1000–9999, from a draw in [0, 1). */
export const seedFrom = (u: number): number => 1000 + Math.min(8999, Math.floor(u * 9000))
