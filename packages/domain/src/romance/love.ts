// Her route and her arrival scene's pay. One track per Uma, 26 rungs with an event and the spouse levels S2 and S4
// between them:
//
//   F1 … F10 ─ her confession ─ R1 … R10 ─ the proposal ─ the wedding ─ S1 … S5
//   160 + 40n a heart (200 … 560)   0      160 + 40n          0             0       600 a level
//
// A level is its event: her bar fills, the event becomes Ready (`ready.ts`), and the level comes when it plays (`advance`,
// which the events call). The three waiting rungs cost nothing; S2 and S4 have no Ready event and come at night. Points never
// fall: past a full bar they're banked and carry into the next bar when the event plays; while a waiting rung waits they
// bank into the next ladder. `addLove` is the one way points move: the day's factors, rounded once, nothing once S5 has
// played. Her arrival scene, "event zero", pays +50 and its one choice: the option with the highest authored gain +30,
// every other +10, shown on the button before the tap. Loaded with the romance's screens and the night.
import { recordLibrary } from '../library/receipts'
import { dateDayOf, DAYS_PER_YEAR, type FarmClock } from '../farm/calendar'
import { SaveRuleError } from '../save/rules'
import type { Love, LoveStage, SaveV4 } from '../save/v4'
import type { ChoiceOption, Step } from '../story/authored'

// --- The ladders ------------------------------------------------------------------------------

const rungs = (letter: string, n: number): string[] => Array.from({ length: n }, (_, i) => `${letter}${i + 1}`)
/** Every step of her route in order, what `nextRung` names: the 26 rungs with an event (without her
 * arrival) and the spouse levels S2 and S4, which have none and come at night. */
export const ROUTE_RUNGS: readonly string[] = [...rungs('f', 10), 'confession', ...rungs('r', 10), 'proposal', 'wedding', ...rungs('s', 5)]
/** The rungs that cost nothing: each is Ready the day after the rung before (the proposal also needs a ring). */
export const WAITING_RUNGS: readonly string[] = ['confession', 'proposal', 'wedding']
/** The spouse levels with no Ready event: they come at night when their bar fills (the morning plays their scene). */
export const NIGHT_RUNGS: readonly string[] = ['s2', 's4']

/** Heart n on friendship and romance costs 160 + 40n. */
export const HEART_BASE = 160
export const HEART_STEP = 40
/** A spouse level costs 600. */
export const SPOUSE_COST = 600

/** What a rung costs: 160 + 40n for a friendship or romance heart, 600 a spouse level, 0 a waiting rung. */
export function costOf(rung: string): number {
  if (!ROUTE_RUNGS.includes(rung)) throw new RangeError(`No rung ${rung}`)
  if (WAITING_RUNGS.includes(rung)) return 0
  return rung.startsWith('s') ? SPOUSE_COST : HEART_BASE + HEART_STEP * Number(rung.slice(1))
}
/** A whole route: 3,800 a friendship or romance ladder, 3,000 the spouse ladder, 10,600 in all. */
export const ROUTE_POINTS = ROUTE_RUNGS.reduce((sum, rung) => sum + costOf(rung), 0)

/** Her next rung, or null once S5 has played (her route is complete). */
export function nextRung(love: Pick<Love, 'stage' | 'level'>): string | null {
  switch (love.stage) {
    case 'friendship': return `f${love.level + 1}`
    case 'romance': return `r${love.level + 1}`
    case 'spouse': return love.level >= 5 ? null : `s${love.level + 1}`
    default: return love.stage
  }
}

/** Her bar toward the next rung: its points held to the cost, the cost, what's banked past it, and whether it's
 * full. A waiting rung's bar is full at once, every point banked into the next ladder. A complete route has none. */
export interface Bar {
  rung: string | null
  points: number
  cost: number
  banked: number
  full: boolean
}
export function bar(love: Pick<Love, 'stage' | 'level' | 'points'>): Bar {
  const rung = nextRung(love)
  if (rung === null) return { rung, points: 0, cost: 0, banked: 0, full: false }
  const cost = costOf(rung)
  return { rung, points: Math.min(love.points, cost), cost, banked: Math.max(0, love.points - cost), full: love.points >= cost }
}

/**
 * Her next rung is reached: it's called when her event plays, or when S2 or S4 fills at night. The cost
 * leaves her points (the rest stays banked), the level or the stage moves and `last` is the day. F10 leaves her at her
 * confession (level 10), the confession accepted starts romance at 0 (`friend` cleared), R10 leaves her at the proposal,
 * the proposal at the wedding, the wedding makes her a spouse at 0 (`wed` is the day), and S5 completes the route. Refused
 * with her bar short or the route complete. Pure; never stamps.
 */
export function advance(love: Love, day: number): Love {
  const now = bar(love)
  if (now.rung === null) throw new SaveRuleError('locked', 'Her route is complete.')
  if (!now.full) throw new SaveRuleError('not-ready', 'Her bar isn’t full yet.')
  const { friend: _friend, ...rest } = love
  const next: Love = { ...rest, points: love.points - now.cost, last: day }
  // Romance 2 starts her morning items' count, and Spouse 2 starts it again (every 2nd morning).
  const counted = (level: number): Love => (level === MORNING_LEVEL ? { ...next, level, morning: day } : { ...next, level })
  switch (love.stage) {
    case 'friendship': return love.level >= 9 ? { ...next, stage: 'confession', level: 10 } : { ...next, level: love.level + 1 }
    case 'confession': return { ...next, stage: 'romance', level: 0 }
    case 'romance': return love.level >= 9 ? { ...next, stage: 'proposal', level: 10 } : counted(love.level + 1)
    case 'proposal': return { ...next, stage: 'wedding', level: 10 }
    case 'wedding': {
      const { weddingDay: _, ...married } = next
      return { ...married, stage: 'spouse', level: 0, wed: day }
    }
    case 'spouse': return counted(love.level + 1)
  }
}

/** The level on romance and on spouse whose perk starts her morning items' count (R2, S2). */
export const MORNING_LEVEL = 2

/** A rung in words: "Friendship 3", "Her confession", "Romance 4", "The proposal", "The wedding", "Spouse 2". */
export function rungName(rung: string): string {
  switch (rung) {
    case 'confession': return 'Her confession'
    case 'proposal': return 'The proposal'
    case 'wedding': return 'The wedding'
  }
  const ladder = rung.startsWith('f') ? 'Friendship' : rung.startsWith('r') ? 'Romance' : 'Spouse'
  return `${ladder} ${rung.slice(1)}`
}

/** Her stage and level in words: "Friend · F7", "Close friend" after a "Not yet", "Partner · R4", "Engaged"
 * while the wedding waits, "Spouse · S2"; level 0 of a ladder is its name alone ("New friend", "Partner", "Spouse"). */
export function levelWords(love: Pick<Love, 'stage' | 'level' | 'friend'>, namedRanks = false): string {
  if (namedRanks && (love.stage === 'friendship' || love.stage === 'confession')) return `Friendship · F${love.level}`
  if (namedRanks && (love.stage === 'romance' || love.stage === 'proposal')) return `In Love · R${love.level}`
  switch (love.stage) {
    case 'friendship': return love.level === 0 ? 'New friend' : `Friend · F${love.level}`
    case 'confession': return love.friend ? 'Close friend' : 'Friend · F10'
    case 'romance': return love.level === 0 ? 'Partner' : `Partner · R${love.level}`
    case 'proposal': return 'Partner · R10'
    case 'wedding': return 'Engaged'
    case 'spouse': return love.level === 0 ? 'Spouse' : `Spouse · S${love.level}`
  }
}

/** The three ladders a bar's colour shows. */
export type LadderName = 'friendship' | 'romance' | 'spouse'
/** The ladder a stage's points go to and its bar is drawn in: friendship until her confession is accepted, romance until
 * the wedding, spouse after it. */
export const ladderOf = (stage: LoveStage): LadderName => (stage === 'friendship' || stage === 'confession' ? 'friendship' : stage === 'spouse' ? 'spouse' : 'romance')
/** The bar's colour carries the stage: coral, rose and gold, as uma-art's `hearts` marks draw them. */
export const LADDER_COLOURS: Readonly<Record<LadderName, string>> = { friendship: '#f07a5c', romance: '#e0567a', spouse: '#d9a227' }

// --- Points ---------------------------------------------------------------------

/** What paid points into her bar: each act of the points table. */
export type LoveSource = 'chat' | 'gift' | 'praise' | 'line' | 'festival' | 'arrival' | 'event' | 'evening' | 'invite' | 'house' | 'meal'

/** A gift on her birthday pays ×3. */
export const BIRTHDAY_GIFT = 3
/** Every act on her anniversary pays ×2 but the evening, which takes its own ×1.5 instead. */
export const ANNIVERSARY_POINTS = 2

/** Whether a day is her anniversary: her wedding's day of the year, from year 2 of her marriage. */
export const isAnniversary = (love: Pick<Love, 'wed'>, day: number, clock?: FarmClock): boolean =>
  love.wed !== undefined && day > love.wed && (dateDayOf(day, clock) - dateDayOf(love.wed, clock)) % DAYS_PER_YEAR === 0

/** The day's factor on an act: a gift ×3 on her birthday; on her anniversary every act ×2 except the evening.
 * Each multiplies once. */
export function dayFactor(love: Pick<Love, 'wed'>, day: number, source: LoveSource, birthday = false, clock?: FarmClock): number {
  return (source === 'gift' && birthday ? BIRTHDAY_GIFT : 1) * (source !== 'evening' && isAnniversary(love, day, clock) ? ANNIVERSARY_POINTS : 1)
}

/** Points are whole: each pay rounds once, half up, after its factors. */
export const roundPoints = (n: number): number => Math.floor(n + 0.5 + 1e-9)

/** What an act paid, for the "+N" that floats from her face. */
export interface LovePaid {
  save: SaveV4
  /** Points into her bar, after the day's factors; 0 when nothing moved. */
  paid: number
}

/** Points into her bar: the one way they move. The day's factors (a gift on her `birthday`, her
 * anniversary), rounded once; never below 0; nothing once her route is complete. Never stamps. */
export function addLove(save: SaveV4, id: string, points: number, source: LoveSource, birthday = false): LovePaid {
  const love = save.love[id]
  if (!love) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (!Number.isFinite(points) || points < 0) throw new SaveRuleError('bad-count', 'Points are never taken away.')
  if (nextRung(love) === null) return { save, paid: 0 }
  const paid = roundPoints(points * dayFactor(love, save.calendar.day, source, birthday, save.calendar))
  if (paid === 0) return { save, paid }
  return { save: { ...save, love: { ...save.love, [id]: { ...love, points: love.points + paid } } }, paid }
}

// --- Her arrival scene -------------------------------------------------------------------------------

/** Every arrival pays +50 on completion. */
export const ARRIVAL_POINTS = 50
/** Her arrival's choice: the best option +30, the others +10. */
export const CHOICE_BEST = 30
export const CHOICE_OTHER = 10

/** An option's authored gain: its friendship and romance hearts. */
export const authoredGain = (option: Pick<ChoiceOption, 'friendship' | 'romance'>): number => (option.friendship ?? 0) + (option.romance ?? 0)

/** Each option's points, in order: the highest authored gain pays +30, every tie at the top too; the rest +10. */
export function choicePoints(options: readonly Pick<ChoiceOption, 'friendship' | 'romance'>[]): number[] {
  const top = Math.max(...options.map(authoredGain))
  return options.map((o) => (authoredGain(o) === top ? CHOICE_BEST : CHOICE_OTHER))
}

/** What a scene's path depends on besides its picks: her flags, which choose each `when` step's
 * branch (flags a `flag` step sets on the way count from there on), and each play's result in order, `true` for a Great or
 * better (its `good` steps follow) and `false` for a Fine (its `miss`). Without `plays`, a play neither stops the walk nor
 * splices anything (her arrival and the pairs' conversations have none). */
export interface SceneState {
  flags?: readonly string[]
  plays?: readonly boolean[]
}

/** A scene's path: its steps in order, each picked option's `then` spliced in after its choice and each
 * `when` replaced by its branch, up to and including the first choice not yet picked (and, with `plays`, the first play not
 * yet played). `done` is whether it ran to its end. */
export function walkScene(steps: readonly Step[], picks: readonly number[], state: SceneState = {}): { steps: Step[]; done: boolean } {
  const out: Step[] = []
  const flags = new Set(state.flags ?? [])
  let next = 0
  let played = 0
  const walk = (list: readonly Step[]): boolean => {
    for (const step of list) {
      if ('when' in step) {
        if (!walk(flags.has(step.when) ? step.then : step.else ?? [])) return false
        continue
      }
      out.push(step)
      if ('flag' in step) flags.add(step.flag)
      if ('play' in step && state.plays) {
        const good = state.plays[played]
        if (good === undefined) return false
        played++
        const after = good ? step.play.good : step.play.miss
        if (after && !walk(after)) return false
        continue
      }
      if (!('choice' in step)) continue
      const pick = picks[next]
      if (pick === undefined) return false
      next++
      const then = step.choice[pick]?.then
      if (then && !walk(then)) return false
    }
    return true
  }
  const done = walk(steps)
  return { steps: out, done }
}

/** A scripted scene as it plays: `walkScene`'s steps, up to and including the first choice not yet picked.
 * `picks` are the options chosen, in order. */
export const sceneSteps = (steps: readonly Step[], picks: readonly number[], state: SceneState = {}): Step[] => walkScene(steps, picks, state).steps

/** The flags a played path sets: wording only. */
export const pathFlags = (steps: readonly Step[]): string[] => [...new Set(steps.flatMap((s) => ('flag' in s ? [s.flag] : [])))]

/** What her arrival scene earned: its choice's points and the flags its path set. */
export interface ArrivalPlayed {
  /** +30 or +10 (`choicePoints`), or 0 for an arrival the pack writes without a choice. */
  choice: number
  flags: readonly string[]
}

/** Her arrival scene, played (or skipped to its choice) once: +50 and its choice into her bar (none for an arrival
 * written without one), its flags into hers, and her id into `arrivals`. Played already: unchanged. Never stamps: the
 * app's action does, once. */
export function finishArrival(save: SaveV4, id: string, played: ArrivalPlayed): SaveV4 {
  if (save.arrivals.includes(id)) return save
  if (!save.roster[id] || !save.love[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (played.choice !== CHOICE_BEST && played.choice !== CHOICE_OTHER && played.choice !== 0) throw new SaveRuleError('bad-count', 'An arrival’s choice pays +10 or +30.')
  const paid = addLove(save, id, ARRIVAL_POINTS + played.choice, 'arrival').save
  const love = paid.love[id]!
  return recordLibrary({ ...paid, love: { ...paid.love, [id]: { ...love, flags: [...new Set([...love.flags, ...played.flags])] } }, arrivals: [...save.arrivals, id] }, id, 'route:arrival')
}
