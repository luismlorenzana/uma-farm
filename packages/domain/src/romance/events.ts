// Heart events: a level is its event. Her
// event plays once it's Ready (`ready.ts`), from her row, her profile's Next card or the morning; nothing is saved until it
// ends, when **one rule, `playEvent`,** pays it and moves her on, and the app commits it once, stamped. An event left
// halfway pays nothing and stays Ready.
//
//   +50 on completion
//   + each choice: the option with the highest authored gain +30 (each one tied at the top), the others +10
//   + each play's grade: Fine +0, Great +15, Perfect +30; with no play (help, talk) the grade is the best choice's:
//     the best option taken a Perfect, any other a Great
//   → into her next bar through `addLove` (an anniversary's ×2 applies), then `advance`
//
// An option may cost goods (`gives`, taken at any stars, lowest first; greyed "Need 1 Herb" without them), learn one of
// her tastes (`reveals`) or set a flag that changes later wording (a `when` step); none scores below zero, removes an
// event or changes the route. The event's perk, its Memory (the place card, her bust and the beat's caption) and any
// unlock come with it; the level-up card lists all of it. **Her confession** ends on Yes (romance opens, the stage-up
// screen) or Not yet (`love.friend`: she stays a close friend, her points bank, and **Ask her** on her profile plays its
// last choice again, once a day, paying nothing). Memories replay any event from any choice, paying nothing. Pure.
import { goodName, isRingId, isWarehouseId, ringGrade } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import type { Warehouse } from '../save/v4'
import { answerAt, type Answer, type Beat, type ChoiceOption, type OptionGives, type Play, type Step, type Together, type Unlock } from '../story/authored'
import { tasteOf, type StoryPack } from '../story/pack'
import type { Taste } from './chats'
import { addLove, advance, bar, CHOICE_BEST, choicePoints, pathFlags, walkScene } from './love'
import { perkOf, type PerkId } from './perks'
import { giveSignatureDish } from './perk-effects'
import { choosePlan, chooseScore } from './plays/choose'
import { EVENT_GRADE_POINTS, gradeOf, playSeed, type Grade, type PlayKind } from './plays/grade'
import { playOf, togetherPlay, type PlayAs } from './plays/which'
import { readiness } from './ready'
import { receptionOf, vowFlag, weddingGuests, weddingPlaceFlag, weddingPlaces, type Reception } from './wedding'
import { takeRoom } from './homestead'

/** Every event pays +50 on completion. */
export const EVENT_POINTS = 50

/** The pack an event reads: her bible's beats, which events are scripted, the cast, and the ties (a wedding's guests). */
export type EventPack = Pick<StoryPack, 'cast' | 'bibles' | 'scripted' | 'ties'>

// --- The scene ----------------------------------------------------------------------------------------------------------

const hasPlay = (steps: readonly Step[]): boolean => steps.some((s) => ('play' in s) || ('choice' in s && s.choice.some((o) => o.then && hasPlay(o.then)))
  || ('when' in s && (hasPlay(s.then) || (s.else !== undefined && hasPlay(s.else)))))

/** The play an event adds at its end: with no `play` step anywhere in it, its beat's `together`; none
 * for help and talk, or when it scripts its own. */
export const extraPlay = (steps: readonly Step[], together: Together | undefined): PlayAs | null => (together && !hasPlay(steps) ? togetherPlay(together) : null)

/** The plays a path holds, in order: each `play` step's, then the extra one. */
export function pathPlays(path: readonly Step[], extra: PlayAs | null): PlayAs[] {
  return [...path.filter((s): s is { play: Play } => 'play' in s).map((s) => playOf(s.play)), ...(extra ? [extra] : [])]
}

/** A choice option on its button: its points (+30 the best, +10 the rest), the heart tag on a romantic
 * one, the goods it costs and whether you're short of them, the taste it reveals while that's not known yet, and the
 * confession's answer. A replay opens every option and shows no cost. */
export interface OptionView {
  points: number
  heart: boolean
  gives: OptionGives | null
  short: boolean
  reveals: Taste | null
  answer: Answer | null
}

export function optionViews(save: Pick<SaveV4, 'items' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, options: readonly ChoiceOption[], replay = false): OptionView[] {
  const points = choicePoints(options)
  const known = save.love[id]?.known ?? []
  return options.map((o, i) => ({
    points: points[i]!,
    heart: (o.romance ?? 0) > 0,
    gives: replay ? null : o.gives ?? null,
    short: !replay && o.gives !== undefined && goodCount(save.items, o.gives.good) < o.gives.count,
    reveals: !replay && o.reveals !== undefined && !known.includes(o.reveals) ? tasteOf(pack, id, o.reveals) : null,
    answer: o.answer ?? null,
  }))
}

/** Goods an option gives, taken at any stars, lowest first; refused without them ("Need 1 Basil"). */
export function takeLowest(items: Warehouse, good: string, count: number): Warehouse {
  if (goodCount(items, good) < count) throw new SaveRuleError('no-items', `Need ${count} ${goodName(good)}`)
  let out = items
  let left = count
  for (let stars = 1; stars <= 5 && left > 0; stars++) {
    const take = Math.min(left, out[good]?.[stars - 1] ?? 0)
    if (take > 0) out = takeGoods(out, good, stars, take)
    left -= take
  }
  return out
}

// --- Playing it ------------------------------------------------------------------------------------------

/** A play as it ended: which of the five, its score 0–100 and, for Choose, the good you chose (its taste is learnt). */
export interface PlayScore {
  kind: PlayKind
  score: number
  learns?: string | null
}

/** What the player did: the event's script as it played, each choice's option in order, and each play's
 * score in order (the path's `play` steps, then the extra one). */
export interface EventOutcome {
  event: { id: string; steps: readonly Step[] }
  picks: readonly number[]
  plays: readonly PlayScore[]
  /** The proposal's ring: a ring in the Warehouse, used. */
  ring?: string
  /** The wedding's place: one of her places. */
  place?: string
  /** The wedding's reception: a dish at its stars, used, or null for Marta's cake (with no dish held). */
  reception?: Reception
}

/** What a wedding gave, for its cards. */
export interface WeddingCard {
  place: string
  /** The dish served, or null for Marta's cake. */
  dish: string | null
  stars: number | null
  /** Well-fed days for everyone on the farm tomorrow. */
  days: number
  /** Who attended (every spouse, her two closest friends). */
  guests: string[]
  /** Her room: the house she took at once, or null with no room free (she keeps her Dorm bed). */
  house: number | null
}

/** The stages a stage-up screen closes: Partners, Engaged, Married. */
export type StageUp = 'romance' | 'engaged' | 'married'

/** One play on the level-up card. */
export interface PlayLine { kind: PlayKind; score: number; grade: Grade; points: number }

/** The level-up card: everything the event gave, then the next rung. */
export interface EventCard {
  id: string
  rung: string
  /** +50. */
  event: number
  /** Each choice's points, in order. */
  choices: number[]
  plays: PlayLine[]
  /** With no play: the best choice's grade, and its points. */
  chosen: { grade: Grade; points: number } | null
  /** All of it before the day's factor. */
  sum: number
  /** Into her bar, after the day's factor (×2 on her anniversary). */
  paid: number
  /** What was banked past her full bar before it, carried into the next. */
  carried: number
  /** Tastes learnt (a `reveals`, a Choose). */
  learnt: string[]
  /** Goods an option took. */
  taken: OptionGives[]
  perk: PerkId | null
  /** Friendship 4's signature dish: the recipe it put in the Kitchen's list, a dish id; null otherwise. */
  recipe: string | null
  /** The Memory's caption: her beat's line. */
  memory: string | null
  unlock: Unlock | null
  /** The confession's answer. */
  answer: Answer | null
  /** The stage-up screen it shows: the confession's Yes opens romance; the proposal makes her engaged and the
   * wedding married. */
  stage: StageUp | null
  /** The proposal's ring, used; null otherwise. */
  ring: string | null
  /** The wedding's place, reception and guests; null otherwise. */
  wedding: WeddingCard | null
  /** Her last line of the event. */
  line: string | null
  /** A level reached at night (S2, S4): no event, her bar's 600 filled. */
  night?: true
  /** The next rung: its cost, her points toward it and what's banked past it, its place and setup (her beat's hint) and
   * its perk; null once her route is complete. */
  next: { rung: string; cost: number; points: number; banked: number; hint: string | null; perk: PerkId | null } | null
}

/** The beat a rung plays, from her bible. */
export const beatOf = (pack: Pick<StoryPack, 'bibles'>, id: string, rung: string): Beat | undefined => pack.bibles.get(id)?.route?.find((b) => b.id === rung)

/**
 * Her Ready event, played to its end: +50, each choice and each play's grade (or, with no
 * play, the best choice's) into her next bar through `addLove`; any option's goods taken, any revealed or chosen taste
 * learnt, the path's flags set, the beat's item unlock into the Warehouse; then `advance` (her confession's Not yet sets
 * `friend` instead), her id into `today.events` and the rung into `memories`. Refused unless she's Ready, the script is her
 * next rung's, every choice and play is in, and each play is the one its step plays. Pure; never stamps: the app commits
 * it once.
 */
export function playEvent(save: SaveV4, pack: EventPack, id: string, outcome: EventOutcome): { save: SaveV4; card: EventCard } {
  const state = readiness(save, pack, id)
  if (!state.ready || state.rung === null) throw new SaveRuleError('not-ready', 'Her event isn’t Ready.')
  const rung = state.rung
  if (outcome.event.id !== rung) throw new SaveRuleError('not-ready', 'That isn’t her next event.')
  const love = save.love[id]!
  const day = save.calendar.day
  const beat = beatOf(pack, id, rung)
  const extra = extraPlay(outcome.event.steps, beat?.together)
  const path = walkScene(outcome.event.steps, outcome.picks, { flags: love.flags, plays: outcome.plays.map((p) => gradeOf(p.score) !== 'fine') })
  if (!path.done) throw new SaveRuleError('not-ready', 'Her event isn’t over yet.')
  const plays = pathPlays(path.steps, extra)
  if (outcome.plays.length !== plays.length || outcome.plays.some((p, i) => p.kind !== plays[i]!.kind || !Number.isInteger(p.score) || p.score < 0 || p.score > 100)) {
    throw new SaveRuleError('bad-count', 'Those plays aren’t her event’s.')
  }
  const choices = path.steps.filter((s): s is { choice: ChoiceOption[] } => 'choice' in s)
  if (choices.length !== outcome.picks.length) throw new SaveRuleError('bad-count', 'Those choices aren’t her event’s.')
  let items = save.items
  const learnt: string[] = []
  const taken: OptionGives[] = []
  let answer: Answer | null = null
  const points = choices.map((c, i) => {
    const pick = outcome.picks[i]!
    const option = c.choice[pick]
    if (!option) throw new SaveRuleError('bad-count', 'No such option.')
    if (option.gives) {
      items = takeLowest(items, option.gives.good, option.gives.count)
      taken.push(option.gives)
    }
    if (option.reveals) learnt.push(option.reveals)
    if (option.answer) answer = option.answer
    return choicePoints(c.choice)[pick]!
  })
  outcome.plays.forEach((p, k) => {
    if (p.kind !== 'choose') return
    const good = p.learns ?? null
    if (good !== null && !choosePlan(playSeed(save.account.uid, day, id, rung, k), pack, id).goods.includes(good)) throw new SaveRuleError('bad-count', 'She wasn’t offered that.')
    if (p.score !== chooseScore(pack, id, good)) throw new SaveRuleError('bad-count', 'That isn’t what she thinks of it.')
    if (good !== null) learnt.push(good)
  })
  // The proposal uses the ring you chose; the wedding's place, its reception's dish, its vow.
  let ring: string | null = null
  let wedding: WeddingCard | null = null
  const kept: string[] = []
  if (rung === 'proposal') {
    if (!outcome.ring || !isRingId(outcome.ring) || goodCount(items, outcome.ring) < 1) throw new SaveRuleError('no-items', 'Choose a ring from the Warehouse.')
    ring = outcome.ring
    items = takeLowest(items, ring, 1)
  }
  if (rung === 'wedding') {
    const place = outcome.place
    if (!place || !(weddingPlaces(pack, id) as readonly string[]).includes(place)) throw new SaveRuleError('bad-job', 'Choose one of her places.')
    if (outcome.reception === undefined) throw new SaveRuleError('bad-job', 'Choose the reception.')
    const days = receptionOf({ items }, outcome.reception)
    if (outcome.reception) items = takeGoods(items, outcome.reception.dish, outcome.reception.stars, 1)
    wedding = { place, dish: outcome.reception?.dish ?? null, stars: outcome.reception?.stars ?? null, days, guests: weddingGuests(save, pack, id), house: null }
    const vowAt = choices.indexOf(outcome.event.steps[answerAt(outcome.event.steps)] as { choice: ChoiceOption[] })
    kept.push(weddingPlaceFlag(place), ...(vowAt >= 0 ? [vowFlag(outcome.picks[vowAt]! + 1)] : []))
  }
  const lines: PlayLine[] = outcome.plays.map((p) => ({ kind: p.kind, score: p.score, grade: gradeOf(p.score), points: EVENT_GRADE_POINTS[gradeOf(p.score)] }))
  const best = choices.some((c, i) => choicePoints(c.choice)[outcome.picks[i]!] === CHOICE_BEST)
  const chosenGrade: Grade | null = plays.length === 0 ? (best ? 'perfect' : 'great') : null
  const chosen = chosenGrade ? { grade: chosenGrade, points: EVENT_GRADE_POINTS[chosenGrade] } : null
  const sum = EVENT_POINTS + points.reduce((a, b) => a + b, 0) + lines.reduce((a, b) => a + b.points, 0) + (chosen?.points ?? 0)
  const carried = love.points - bar(love).cost
  const pay = addLove({ ...save, items }, id, sum, 'event')
  const paidLove = pay.save.love[id]!
  const grown = {
    ...paidLove,
    known: [...new Set([...paidLove.known, ...learnt])],
    flags: [...new Set([...paidLove.flags, ...pathFlags(path.steps), ...kept])],
  }
  const notYet = rung === 'confession' && answer === 'not-yet'
  const advanced = notYet ? { ...grown, friend: true as const, last: day } : advance(grown, day)
  const moved = ring ? { ...advanced, ring: ringGrade(ring) } : advanced
  const unlock = beat?.unlock ?? null
  const withUnlock = unlock?.kind === 'item' && isWarehouseId(unlock.good) ? addGoods(pay.save.items, unlock.good, 1, 1) : pay.save.items
  const played: SaveV4 = {
    ...pay.save,
    items: withUnlock,
    love: { ...pay.save.love, [id]: moved },
    // Two weddings in a day: the longer reception feeds the farm.
    today: { ...pay.save.today, events: [...new Set([...pay.save.today.events, id])], ...(wedding ? { reception: Math.max(pay.save.today.reception, wedding.days) } : {}) },
    memories: { ...pay.save.memories, [id]: [...new Set([...(pay.save.memories[id] ?? []), rung])] },
  }
  // Friendship 4's perk writes her signature dish's recipe, once, where the event gives its perk.
  const dish = rung === 'f4' ? giveSignatureDish(played, pack, id) : null
  // The wedding gives her a room at once (her default), or she keeps her Dorm bed with none free.
  const roomed = wedding ? takeRoom(dish?.save ?? played, pack, id) : null
  if (wedding && roomed) wedding = { ...wedding, house: roomed.house }
  const next = roomed?.save ?? dish?.save ?? played
  const after = bar(next.love[id]!)
  const say = [...path.steps].reverse().find((s): s is { say: string; line: string } => 'say' in s && s.say === id)
  return {
    save: next,
    card: {
      id, rung, event: EVENT_POINTS, choices: points, plays: lines, chosen, sum, paid: pay.paid, carried: Math.max(0, carried), learnt: [...new Set(learnt)], taken,
      perk: perkOf(rung)?.id ?? null, recipe: dish?.dish ?? null, memory: beat?.beat ?? null, unlock, answer: rung === 'confession' ? answer ?? 'yes' : null,
      stage: rung === 'confession' && !notYet ? 'romance' : rung === 'proposal' ? 'engaged' : rung === 'wedding' ? 'married' : null, ring, wedding, line: say?.line ?? null,
      next: after.rung === null ? null : {
        rung: after.rung, cost: after.cost, points: after.points, banked: after.banked, hint: beatOf(pack, id, after.rung)?.hint ?? null, perk: perkOf(after.rung)?.id ?? null,
      },
    },
  }
}

// --- Her confession's Not yet, and Ask her --------------------------------------------------------------

/** Whether Ask her shows today: she said Not yet, and you haven't asked her today. */
export const canAsk = (save: Pick<SaveV4, 'love' | 'today'>, id: string): boolean =>
  save.love[id]?.stage === 'confession' && save.love[id]?.friend === true && !save.today.asked.includes(id)

/**
 * Ask her: her confession's last choice again, from her profile while she's a close friend, once a day. It
 * pays nothing and isn't her event (`last` stays, `today.events` doesn't hold her); Yes clears `friend` and moves her to
 * romance (`advance`), Not yet leaves her waiting. Never stamps.
 */
export function askHer(save: SaveV4, id: string, answer: Answer): SaveV4 {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (love.stage !== 'confession' || !love.friend) throw new SaveRuleError('locked', 'She isn’t waiting for an answer.')
  if (save.today.asked.includes(id)) throw new SaveRuleError('busy', 'You asked her today. Ask again tomorrow.')
  const today = { ...save.today, asked: [...save.today.asked, id] }
  if (answer === 'not-yet') return { ...save, today }
  return { ...save, today, love: { ...save.love, [id]: { ...advance(love, save.calendar.day), last: love.last } } }
}

/** Ask her's scene: the confession from her line before its answer (the place it plays at kept), without
 * its plays. Empty when the confession has no answer. */
export function askSteps(steps: readonly Step[]): Step[] {
  const at = answerAt(steps)
  if (at < 0) return []
  let from = at
  for (let i = at - 1; i >= 0; i--) {
    const step = steps[i]!
    if ('say' in step) { from = i; break }
    if ('choice' in step || 'play' in step) break
  }
  const place = steps.slice(0, from).reverse().find((s) => 'place' in s)
  return [...(place ? [place] : []), ...steps.slice(from).filter((s) => !('play' in s))]
}

// --- Memories' replays ----------------------------------------------------------------------------------

/** The choice points a replay can start at: each top-level choice step's index. */
export const choicePointsOf = (steps: readonly Step[]): number[] => steps.flatMap((s, i) => ('choice' in s ? [i] : []))

/** A replay's steps: from the top, or from the top-level step `from` (a choice point) with the line just
 * before it, so the choice has its question, and the place it plays at kept. Every option is open and nothing pays or is
 * saved. */
export function replaySteps(steps: readonly Step[], from: number | null = null): Step[] {
  if (from === null || from <= 0 || from >= steps.length) return [...steps]
  let start = from
  const before = steps[from - 1]
  if (before && ('say' in before || 'narrate' in before || 'thought' in before)) start = from - 1
  const place = steps.slice(0, start).reverse().find((s) => 'place' in s)
  return [...(place ? [place] : []), ...steps.slice(start)]
}
