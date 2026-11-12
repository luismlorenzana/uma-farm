// The farm's authored story (F40; RS1–RS20): the cast, their ties, each Uma's bible and route, and the scripted events
// and pair conversations, as the private `content/story/` files hold them. Types and a validator only: no character,
// name or line lives here (RS15); tests run on the invented stand-in (`authored.fixture.ts`).
//
// Relationships are a game, not a visual novel (D42, D43, from the genre research): every route beat says what the
// farmer and she *do* together (`together`: work, a date game, a gift, helping another Uma), every choice carries its
// visible heart gain and its tone, an event may hold a short `play` moment the farmer acts out, a beat may unlock
// something shown on a card, and every beat carries the hint her profile shows while it's next. Nothing is missable and
// nothing waits on the calendar: a rung is ready when her bar is full, plus at most one setup the player controls (she
// works a place today, an item is in the Warehouse, a bond, a chapter), never an hour, the weather, a season or a
// festival. Routes run side by side and end in a spouse ladder (D43: every Uma can be married).
import { ACTIVITIES, type Activity } from '../farm/ranks'
import { FARM_PLACE_IDS } from '../farm/places'
import { isGoodId } from '../goods/ids'
import { CAST_IDS } from './cast'

/** The farm's places plus the romance's own backdrops (world bible W5). */
export const STORY_PLACES = [
  ...FARM_PLACE_IDS, 'pond-night', 'overlook', 'orchard-bench', 'dorm-porch', 'harbour-wall', 'chapel-bell', 'town', 'hilltop-track', 'sea-pier',
] as const
export const FESTIVALS = ['flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup'] as const
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
/** Her calling's line (FM7, from her board playstyle): front mining, pace forest, pace-late quarry, late-end fishing, late farming. */
export const CALLINGS = ['farming', 'foraging', 'fishing', 'mining', 'quarry'] as const
/** Her favourite work (RS10): any activity but expeditions, which are a party's, not one Uma's. */
export const FAVOURITE_LINES = ACTIVITIES.filter((a): a is Exclude<Activity, 'expeditions'> => a !== 'expeditions')
export const TIE_KINDS = ['friends', 'rivals', 'mentor', 'teammates', 'sisters', 'other'] as const
/** The ladders a beat sits on: her arrival (F46, RM4), then RS7's six. */
export const LADDERS = ['arrival', 'friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
export const EMOTES = ['happy', 'shy', 'sad', 'angry', 'surprised', 'thinking', 'laughing', 'tender'] as const
export const TONES = ['warm', 'playful', 'honest'] as const
/** The Dorm for 20's levels (RM5): a `beds` arrival names one of them; level 1 comes with the farm. */
const DORM_LEVELS_FOR_20 = 8

/** The date games: short shared activities a date is played as (D42). */
export const DATE_GAMES = ['fishing', 'cooking', 'stargazing', 'footrace', 'dance', 'picnic', 'market', 'boat', 'walk', 'crafting'] as const

/** The route's 27 rungs (RS7, amended by D43 and F46): her arrival scene ("event zero", RM4), ten friendship events, the
 * confession, ten romance events, the proposal, the wedding, and three on the spouse ladder after it (S1, S3, S5), so
 * married life goes on. */
export const ARRIVAL = 'arrival'
export const RUNGS: readonly string[] = [
  ARRIVAL, ...Array.from({ length: 10 }, (_, i) => `f${i + 1}`), 'confession', ...Array.from({ length: 10 }, (_, i) => `r${i + 1}`), 'proposal', 'wedding', 's1', 's3', 's5',
]

export type StoryPlace = typeof STORY_PLACES[number]
export type Festival = typeof FESTIVALS[number]
export type Season = typeof SEASONS[number]
export type Calling = typeof CALLINGS[number]
export type TieKind = typeof TIE_KINDS[number]
export type Ladder = typeof LADDERS[number]
export type Emote = typeof EMOTES[number]
export type Tone = typeof TONES[number]
export type DateGame = typeof DATE_GAMES[number]

// --- Layer 1: the cast and the ties -----------------------------------------------------------------------------------

export type Arrival =
  | { kind: 'opening' }
  | { kind: 'chapter'; chapter: number }
  | { kind: 'festival'; festival: Festival; year?: number }
  | { kind: 'beds'; dormLevel: number }
  | { kind: 'event'; after: string }

/** A birthday as a date (RM16): month 1–12 and a real day of it. */
export interface CastBirthday { month: number; day: number }
/** One Uma of the cast. `outfitId` names the one outfit she plays as (RM2): required, so the game never chooses (F46).
 * `birthday` only where master data's character set has none (RM16, F47): it wins where present. */
export interface CastEntry { characterId: string; outfitId: string; arrives: Arrival; calling: Calling; paragraph: string; birthday?: CastBirthday }
export interface Cast {
  version: 1
  export: { file: string; exportedAt: string; tier: 'SS' }
  /** Farming, foraging, fishing (RS13). */
  opening: [string, string, string]
  /** In arrival order. */
  umas: CastEntry[]
}
export interface Tie { a: string; b: string; kind: TieKind; strength: 1 | 2 | 3; line: string; history: string }
export interface Ties { version: 1; ties: Tie[] }

// --- Layer 2: her bible -----------------------------------------------------------------------------------------------

/** When a rung is ready (D43): her bar full, plus at most one setup the player controls. Never a clock, the weather, a
 * season or a festival: those may colour a scene's words, never whether it plays. */
export type Trigger =
  | { kind: 'hearts' }
  | { kind: 'working'; activity: Activity }
  | { kind: 'item'; good: string }
  | { kind: 'bond'; with: string; level: number }
  | { kind: 'chapter'; chapter: number }

/** What the farmer and she do in the event: the game part (D42). */
export type Together =
  | { kind: 'talk' }
  | { kind: 'work'; activity: Activity }
  | { kind: 'date'; game: DateGame }
  | { kind: 'gift'; good: string }
  | { kind: 'help'; with: string }

/** What a beat gives besides hearts, shown on a card (D42): a recipe or an item by goods id, a place, or a perk in words. */
export type Unlock = { kind: 'item'; good: string } | { kind: 'place'; place: StoryPlace } | { kind: 'perk'; perk: string }

export interface Beat {
  id: string
  ladder: Ladder
  hearts: number
  trigger: Trigger
  place: StoryPlace
  together: Together
  beat: string
  /** What her profile says while this rung is next: where and how it opens (D43). */
  hint: string
  unlock?: Unlock
}
export interface UmaBible {
  characterId: string
  outfitId: string | null
  now: string
  whyTheFarm: string
  dream: string
  blurb: string
  favouriteLine: Exclude<Activity, 'expeditions'>
  season: Season
  festival: Festival
  gifts: { loved: string; liked: [string, string, string]; disliked: [string, string]; proposed?: string[] }
  laughs: string
  hurts: string
  route: Beat[]
  /** Her chat sets (RM18, RM31's F1 perk; F47): what she says when you chat, by stage, from Friendship 1: `friend` through
   * the confession, `partner` from Romance 1 to the wedding, `spouse` after it. Without it she keeps her temperament's
   * lines. */
  chats?: ChatSets
  /** Her keepsake (RM31, RM58; F51 decision 13): a named item she gives at Friendship 10, its name and her line about it,
   * shown on her profile (not in the Warehouse). Its effect is the template's: +0.25 quality at her line, +0.5 from S5.
   * Without it her profile says "Her keepsake". */
  keepsake?: Keepsake
  /** Her pet name for you (RM8, RM31; F51 decision 13): a short name she calls you from Romance 1, shown on her profile.
   * Never gendered; `{farmer}` isn't needed (it's what she calls you). */
  petName?: string
}
/** Her keepsake (F51): a name of 1–40 characters and a line of 1–160, under the line rules. */
export interface Keepsake { name: string; line: string }
/** A pet name's length (F51): 1–24 characters. */
export const PET_NAME_MAX = 24
/** A keepsake's name's and line's lengths (F51). */
export const KEEPSAKE_LIMITS = { name: 40, line: 160 } as const
/** 3–20 lines a stage, each at most 160 characters, `{farmer}` the only placeholder (F47 decision 16). */
export interface ChatSets { friend: string[]; partner: string[]; spouse: string[] }

// --- Layer 3: scripted events and pair conversations ------------------------------------------------------------------

/** The confession's last choice point marks its two answers (F49 decision 10, RM30): Yes opens romance, Not yet keeps her a
 * close friend. */
export const ANSWERS = ['yes', 'not-yet'] as const
export type Answer = typeof ANSWERS[number]
/** An option's item cost (F49 decision 7, RM27): 1–5 of a good, taken from the Warehouse at any stars, lowest first. */
export interface OptionGives { good: string; count: number }
export interface ChoiceOption {
  text: string
  tone: Tone
  friendship?: number
  romance?: number
  then?: Step[]
  /** It costs goods (F49): "· 1 Herb" on the button, greyed "Need 1 Herb" without them. */
  gives?: OptionGives
  /** It learns one of her gifts' tastes (F49): "· learns a like". */
  reveals?: string
  /** The confession's last choice point only: one `yes` and one `not-yet` (F49 decision 10). */
  answer?: Answer
}
/** A farming play's game, picked by the author (RM26, F49 decision 14): harvest the ripe ones (Pick) or tend (Rhythm). */
export const FARMING_PLAYS = ['pick', 'rhythm'] as const
/** A short moment the farmer acts out inside an event (cast the line, stir the pot, aim the telescope). It plays as one of
 * the five plays (F49, RM26); its own `friendship` and `romance` are ignored, since the grade pays. `good` plays after a
 * Great or Perfect, `miss` after a Fine. */
export interface Play { game: DateGame | Activity; prompt: string; good?: Step[]; miss?: Step[]; friendship?: number; romance?: number; as?: typeof FARMING_PLAYS[number] }
export type Step =
  | { say: string; line: string; emote?: Emote }
  | { choice: ChoiceOption[] }
  | { play: Play }
  | { narrate: string }
  | { thought: string }
  | { wait: number }
  | { place: StoryPlace }
  | { flag: string }
  /** Its steps play only while the flag is set, `else` otherwise (F49 decision 7): flags change wording only. */
  | { when: string; then: Step[]; else?: Step[] }
export interface Route { characterId: string; events: { id: string; steps: Step[] }[] }
export interface PairConversations { a: string; b: string; levels: { hearts: number; place: StoryPlace; steps: Step[] }[] }

// --- The validator ----------------------------------------------------------------------------------------------------

/** Words that would gender the farmer (RS2): never in the farmer's own words, nor anyone's words to them. */
const GENDERED = /\b(husband|wife|boyfriend|girlfriend|groom|sir|mister|mr|mrs|ms|ma'?am|madam|lad|lass|fella|gal|guy)\b/i
/** The farmer's own lines may not call themself a bride either (an Uma may be one). Pronouns aren't listed: the farmer
 * speaks of the town's men and the Umas, never of themself in the third person. */
const GENDERED_FARMER = /\b(bride)\b/i
/** Nothing that reads under 18 (RS3). */
const SCHOOLISH = /\b(senpai|kouhai|classmates?|homework|high school|middle school|school uniform|schoolgirls?)\b/i
const PLACEHOLDER = /\{([^{}]*)\}/g

type Issues = string[]
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)

/** What the validator knows: the cast's character ids (from the export), and which goods exist. */
export interface StoryContext {
  /** Every Uma in the cast, by character id. */
  umas: ReadonlySet<string>
  /** A goods id that exists; defaults to the game's goods. */
  isGood?: (id: string) => boolean
}

function lineIssues(text: string, where: string, farmer: boolean): Issues {
  const issues: Issues = []
  for (const [, name] of text.matchAll(PLACEHOLDER)) if (name !== 'farmer') issues.push(`${where}: unknown placeholder {${name}} ({farmer} only)`)
  const gendered = text.match(GENDERED) ?? (farmer ? text.match(GENDERED_FARMER) : null)
  if (gendered) issues.push(`${where}: “${gendered[0]}” genders the farmer (RS2)`)
  const school = text.match(SCHOOLISH)
  if (school) issues.push(`${where}: “${school[0]}” reads as school (RS3)`)
  return issues
}

/** A scripted event's or a pair conversation's steps. `speakers` are who may `say`; the farmer speaks only in choices.
 * `isGood` checks an option's `gives` and `reveals` (F49). */
export function stepIssues(steps: unknown, where: string, speakers: ReadonlySet<string>, depth = 0, isGood: (id: string) => boolean = isGoodId): Issues {
  if (!Array.isArray(steps) || !steps.length) return [`${where}: no steps`]
  const issues: Issues = []
  steps.forEach((step, i) => {
    const at = `${where}, step ${i + 1}`
    if (!isObject(step)) { issues.push(`${at}: not a step`); return }
    if ('say' in step) {
      if (typeof step.say !== 'string' || !speakers.has(step.say)) issues.push(`${at}: ${String(step.say)} can’t speak here`)
      if (!isText(step.line, 400)) issues.push(`${at}: no line`)
      else issues.push(...lineIssues(step.line, at, false))
      if (step.emote !== undefined && !oneOf(EMOTES, step.emote)) issues.push(`${at}: emote is one of ${EMOTES.join(', ')}`)
    } else if ('choice' in step) {
      const options = step.choice
      if (!Array.isArray(options) || options.length < 2 || options.length > 3) { issues.push(`${at}: a choice has 2–3 options`); return }
      options.forEach((o, k) => {
        const ot = `${at}, option ${k + 1}`
        if (!isObject(o) || !isText(o.text, 160)) { issues.push(`${ot}: no text`); return }
        issues.push(...lineIssues(o.text, ot, true))
        if (!oneOf(TONES, o.tone)) issues.push(`${ot}: tone is warm, playful or honest (RS19)`)
        for (const k2 of ['friendship', 'romance'] as const) {
          const v = o[k2]
          if (v !== undefined && (!Number.isInteger(v) || (v as number) < 0 || (v as number) > 50)) issues.push(`${ot}: ${k2} is 0–50 (no answer costs hearts, RS19)`)
        }
        if (o.then !== undefined) issues.push(...stepIssues(o.then, `${ot} then`, speakers, depth + 1, isGood))
        const g = o.gives
        if (g !== undefined && !(isObject(g) && Object.keys(g).every((k) => k === 'good' || k === 'count') && typeof g.good === 'string' && isGood(g.good)
          && Number.isInteger(g.count) && (g.count as number) >= 1 && (g.count as number) <= 5)) issues.push(`${ot}: gives is { good, count 1–5 }, a good that exists`)
        if (o.reveals !== undefined && !(typeof o.reveals === 'string' && isGood(o.reveals))) issues.push(`${ot}: reveals names a good`)
        if (o.answer !== undefined && !oneOf(ANSWERS, o.answer)) issues.push(`${ot}: answer is yes or not-yet`)
      })
      if (!options.some((o) => isObject(o) && ((o.friendship as number) > 0 || (o.romance as number) > 0))) issues.push(`${at}: at least one option gains hearts`)
    } else if ('play' in step) {
      const p = step.play
      if (!isObject(p) || !(oneOf(DATE_GAMES, p.game) || oneOf(ACTIVITIES, p.game)) || !isText(p.prompt, 120)) issues.push(`${at}: a play names its game and a prompt`)
      else {
        if (p.as !== undefined && (p.game !== 'farming' || !oneOf(FARMING_PLAYS, p.as))) issues.push(`${at}: as (pick or rhythm) is a farming play’s only`)
        if (p.good !== undefined) issues.push(...stepIssues(p.good, `${at} good`, speakers, depth + 1, isGood))
        if (p.miss !== undefined) issues.push(...stepIssues(p.miss, `${at} miss`, speakers, depth + 1, isGood))
      }
    } else if ('narrate' in step) {
      if (!isText(step.narrate, 400)) issues.push(`${at}: empty narration`)
      else issues.push(...lineIssues(step.narrate, at, false))
    } else if ('thought' in step) {
      if (!isText(step.thought, 400)) issues.push(`${at}: empty thought`)
      else issues.push(...lineIssues(step.thought, at, true))
    } else if ('wait' in step) {
      if (typeof step.wait !== 'number' || step.wait <= 0 || step.wait > 5000) issues.push(`${at}: wait is 1–5000 ms`)
    } else if ('place' in step) {
      if (!oneOf(STORY_PLACES, step.place)) issues.push(`${at}: unknown place ${String(step.place)}`)
    } else if ('flag' in step) {
      if (!isText(step.flag, 80)) issues.push(`${at}: empty flag`)
    } else if ('when' in step) {
      if (!isText(step.when, 80)) issues.push(`${at}: when names a flag`)
      issues.push(...stepIssues(step.then, `${at} then`, speakers, depth + 1, isGood))
      if (step.else !== undefined) issues.push(...stepIssues(step.else, `${at} else`, speakers, depth + 1, isGood))
    } else issues.push(`${at}: unknown step`)
  })
  return issues
}

/** Days in each month, February's 29 allowed (RM16: a birthday, never a year). */
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
/** A birthday on a real date: `{ month: 1–12, day }` with nothing else. */
function realDate(v: unknown): boolean {
  if (!isObject(v) || Object.keys(v).some((k) => k !== 'month' && k !== 'day')) return false
  const { month, day } = v
  return Number.isInteger(month) && (month as number) >= 1 && (month as number) <= 12 && Number.isInteger(day) && (day as number) >= 1 && (day as number) <= MONTH_DAYS[(month as number) - 1]!
}

/** Her chat sets (F47 decision 16): each stage 3–20 lines, each at most 160 characters, under the line rules. */
export const CHAT_SETS = ['friend', 'partner', 'spouse'] as const
function chatIssues(chats: unknown): Issues {
  if (!isObject(chats)) return ['chats is { friend, partner, spouse }, 3–20 lines each']
  const issues: Issues = []
  for (const key of Object.keys(chats)) if (!(CHAT_SETS as readonly string[]).includes(key)) issues.push(`chats.${key}: a chat set is friend, partner or spouse`)
  for (const set of CHAT_SETS) {
    const lines = chats[set]
    if (!Array.isArray(lines) || lines.length < 3 || lines.length > 20) { issues.push(`chats.${set}: 3–20 lines`); continue }
    lines.forEach((line, i) => {
      if (!isText(line, 160)) issues.push(`chats.${set} ${i + 1}: a line of 1–160 characters`)
      else issues.push(...lineIssues(line, `chats.${set} ${i + 1}`, false))
    })
  }
  return issues
}

/** cast.json (layer 1). */
export function castIssues(cast: unknown, ctx: StoryContext): Issues {
  if (!isObject(cast) || cast.version !== 1 || !Array.isArray(cast.umas)) return ['Not a cast file (version 1, umas)']
  const issues: Issues = []
  const seen = new Set<string>()
  for (const [i, u] of (cast.umas as unknown[]).entries()) {
    const at = `Uma ${i + 1}`
    if (!isObject(u) || typeof u.characterId !== 'string') { issues.push(`${at}: no character id`); continue }
    const id = u.characterId
    if (!ctx.umas.has(id)) issues.push(`${at} (${id}): not in the export’s cast`)
    if (seen.has(id)) issues.push(`${at} (${id}): listed twice`)
    seen.add(id)
    if (u.outfitId === null || u.outfitId === undefined) issues.push(`${at} (${id}): Name her outfit (RM2)`)
    else if (typeof u.outfitId !== 'string' || !/^[1-9]\d*$/.test(u.outfitId)) issues.push(`${at} (${id}): outfitId is an outfit id`)
    if (!oneOf(CALLINGS, u.calling)) issues.push(`${at} (${id}): calling is one of ${CALLINGS.join(', ')}`)
    if (!isText(u.paragraph)) issues.push(`${at} (${id}): no paragraph`)
    else issues.push(...lineIssues(u.paragraph, `${at} (${id})`, false))
    const a = u.arrives
    const ok = isObject(a) && (a.kind === 'opening' || (a.kind === 'chapter' && Number.isInteger(a.chapter) && (a.chapter as number) >= 1 && (a.chapter as number) <= 8) ||
      (a.kind === 'festival' && oneOf(FESTIVALS, a.festival) && (a.year === undefined || (Number.isInteger(a.year) && (a.year as number) >= 1))) ||
      (a.kind === 'beds' && Number.isInteger(a.dormLevel) && (a.dormLevel as number) >= 2 && (a.dormLevel as number) <= DORM_LEVELS_FOR_20) ||
      (a.kind === 'event' && isText(a.after, 80)))
    if (!ok) issues.push(`${at} (${id}): an arrival is opening, a chapter 1–8, a festival, Dorm beds 2–${DORM_LEVELS_FOR_20}, or after an event`)
    if (u.birthday !== undefined && !realDate(u.birthday)) issues.push(`${at} (${id}): a birthday is { month: 1–12, day } on a real date (RM16)`)
  }
  for (const id of ctx.umas) if (!seen.has(id)) issues.push(`${id} from the export has no place in the cast`)
  const opening = Array.isArray(cast.opening) ? (cast.opening as unknown[]) : []
  const umas = cast.umas as Record<string, unknown>[]
  const callingOf = (id: unknown) => umas.find((u) => isObject(u) && u.characterId === id)?.calling
  if (opening.length !== 3) issues.push('The opening is three Umas (RS13)')
  else {
    if (opening.map(callingOf).join() !== 'farming,foraging,fishing') issues.push('The opening three are, in order, a farmer, a forager and a fisher (RS13, CS42)')
    for (const id of opening) if (!umas.some((u) => isObject(u) && u.characterId === id && isObject(u.arrives) && u.arrives.kind === 'opening')) issues.push(`${String(id)} opens the story, so she arrives at the opening`)
  }
  if (umas.filter((u) => isObject(u) && isObject(u.arrives) && u.arrives.kind === 'opening').length !== 3) issues.push('Exactly three Umas arrive at the opening')
  return issues
}

/** ties.json (layer 1): one graph, every Uma with at least two ties, so each has two closest (RS12). */
export function tiesIssues(ties: unknown, ctx: StoryContext): Issues {
  if (!isObject(ties) || ties.version !== 1 || !Array.isArray(ties.ties)) return ['Not a ties file (version 1, ties)']
  const issues: Issues = []
  const pairs = new Set<string>()
  const count = new Map<string, number>()
  for (const [i, t] of (ties.ties as unknown[]).entries()) {
    const at = `Tie ${i + 1}`
    if (!isObject(t)) { issues.push(`${at}: not a tie`); continue }
    for (const side of ['a', 'b'] as const) if (typeof t[side] !== 'string' || !ctx.umas.has(t[side] as string)) issues.push(`${at}: ${side} (${String(t[side])}) isn’t in the cast`)
    if (t.a === t.b) issues.push(`${at}: a tie is between two Umas`)
    const key = [t.a, t.b].sort().join('|')
    if (pairs.has(key)) issues.push(`${at}: ${key} is tied twice`)
    pairs.add(key)
    if (!oneOf(TIE_KINDS, t.kind)) issues.push(`${at}: kind is one of ${TIE_KINDS.join(', ')}`)
    if (![1, 2, 3].includes(t.strength as number)) issues.push(`${at}: strength is 1–3`)
    if (!isText(t.line, 400)) issues.push(`${at}: no line`)
    else issues.push(...lineIssues(t.line, at, false))
    if (!isText(t.history, 600)) issues.push(`${at}: no history`)
    for (const side of [t.a, t.b]) if (typeof side === 'string') count.set(side, (count.get(side) ?? 0) + 1)
  }
  for (const id of ctx.umas) if ((count.get(id) ?? 0) < 2) issues.push(`${id} has ${count.get(id) ?? 0} tie${count.get(id) === 1 ? '' : 's'}; every Uma needs two closest (RS12)`)
  return issues
}

function triggerIssues(t: unknown, at: string, ctx: StoryContext, isGood: (id: string) => boolean, proposed: ReadonlySet<string>): Issues {
  if (!isObject(t)) return [`${at}: no trigger`]
  switch (t.kind) {
    case 'hearts': return []
    case 'working': return oneOf(ACTIVITIES, t.activity) ? [] : [`${at}: working at what? (${ACTIVITIES.join(', ')})`]
    case 'item': return typeof t.good === 'string' && (isGood(t.good) || proposed.has(t.good)) ? [] : [`${at}: the item ${String(t.good)} isn’t a good`]
    case 'bond': return typeof t.with === 'string' && ctx.umas.has(t.with) && Number.isInteger(t.level) && (t.level as number) >= 1 && (t.level as number) <= 5 ? [] : [`${at}: a bond names an Uma in the cast and a level 1–5`]
    case 'chapter': return Number.isInteger(t.chapter) && (t.chapter as number) >= 1 && (t.chapter as number) <= 8 ? [] : [`${at}: chapter is 1–8`]
    default: return [`${at}: a trigger is hearts, working, item, bond or chapter; never a clock, the weather, a season or a festival (D43)`]
  }
}

function togetherIssues(t: unknown, at: string, ctx: StoryContext, isGood: (id: string) => boolean, proposed: ReadonlySet<string>): Issues {
  if (!isObject(t)) return [`${at}: what do they do together? (D42)`]
  switch (t.kind) {
    case 'talk': return []
    case 'work': return oneOf(ACTIVITIES, t.activity) ? [] : [`${at}: work at what?`]
    case 'date': return oneOf(DATE_GAMES, t.game) ? [] : [`${at}: a date is one of ${DATE_GAMES.join(', ')}`]
    case 'gift': return typeof t.good === 'string' && (isGood(t.good) || proposed.has(t.good)) ? [] : [`${at}: the gift ${String(t.good)} isn’t a good`]
    case 'help': return typeof t.with === 'string' && ctx.umas.has(t.with) ? [] : [`${at}: help names an Uma in the cast`]
    default: return [`${at}: together is talk, work, date, gift or help`]
  }
}

/** umas/<id>.json (layer 2): her profile, her gifts by goods id, and every rung of her route. */
export function bibleIssues(bible: unknown, ctx: StoryContext): Issues {
  if (!isObject(bible) || typeof bible.characterId !== 'string') return ['Not a bible (characterId)']
  const isGood = ctx.isGood ?? isGoodId
  const issues: Issues = []
  if (!ctx.umas.has(bible.characterId)) issues.push(`${bible.characterId} isn’t in the cast`)
  for (const key of ['now', 'whyTheFarm', 'dream', 'blurb', 'laughs', 'hurts'] as const) {
    if (!isText(bible[key], 1200)) issues.push(`No ${key}`)
    else issues.push(...lineIssues(bible[key] as string, key, false))
  }
  if (!oneOf(FAVOURITE_LINES, bible.favouriteLine)) issues.push(`favouriteLine is one of ${FAVOURITE_LINES.join(', ')}`)
  if (!oneOf(SEASONS, bible.season)) issues.push('season is spring, summer, autumn or winter')
  if (!oneOf(FESTIVALS, bible.festival)) issues.push(`festival is one of ${FESTIVALS.join(', ')}`)
  const gifts: Record<string, unknown> = isObject(bible.gifts) ? bible.gifts : {}
  const proposed = new Set(Array.isArray(gifts.proposed) ? (gifts.proposed as string[]) : [])
  const all = [gifts.loved, ...(Array.isArray(gifts.liked) ? gifts.liked : []), ...(Array.isArray(gifts.disliked) ? gifts.disliked : [])]
  if (typeof gifts.loved !== 'string' || !Array.isArray(gifts.liked) || gifts.liked.length !== 3 || !Array.isArray(gifts.disliked) || gifts.disliked.length !== 2) issues.push('Gifts: one loved, three liked, two disliked (RS10)')
  for (const id of all) if (typeof id === 'string' && !isGood(id) && !proposed.has(id)) issues.push(`Gift ${id} isn’t a good; list it under proposed if it’s a new one`)
  if (new Set(all).size !== all.length) issues.push('A good is in her gifts twice')
  const route = Array.isArray(bible.route) ? (bible.route as unknown[]) : []
  const ids = new Set<string>()
  for (const [i, b] of route.entries()) {
    const at = `Beat ${i + 1}`
    if (!isObject(b) || typeof b.id !== 'string') { issues.push(`${at}: no id`); continue }
    const bt = `Beat ${b.id}`
    if (ids.has(b.id)) issues.push(`${bt}: twice`)
    ids.add(b.id)
    if (!oneOf(LADDERS, b.ladder)) issues.push(`${bt}: ladder is one of ${LADDERS.join(', ')}`)
    if ((b.id === ARRIVAL) !== (b.ladder === ARRIVAL)) issues.push(`${bt}: the arrival beat is \`arrival\` on the arrival ladder (RM4)`)
    if (b.id === ARRIVAL && (b.hearts !== 0 || !isObject(b.trigger) || b.trigger.kind !== 'hearts')) issues.push(`${bt}: her arrival has hearts 0 and a hearts trigger (RM4)`)
    if (!Number.isInteger(b.hearts) || (b.hearts as number) < 0 || (b.hearts as number) > 10) issues.push(`${bt}: hearts are 0–10`)
    if (!oneOf(STORY_PLACES, b.place)) issues.push(`${bt}: unknown place ${String(b.place)}`)
    if (!isText(b.beat, 400)) issues.push(`${bt}: no beat line`)
    else issues.push(...lineIssues(b.beat, bt, false))
    if (!isText(b.hint, 160)) issues.push(`${bt}: no hint, the line her profile shows while it’s next (D43)`)
    else issues.push(...lineIssues(b.hint, `${bt} hint`, false))
    issues.push(...triggerIssues(b.trigger, bt, ctx, isGood, proposed), ...togetherIssues(b.together, bt, ctx, isGood, proposed))
    const u = b.unlock
    if (u !== undefined && !(isObject(u) && ((u.kind === 'item' && typeof u.good === 'string' && (isGood(u.good) || proposed.has(u.good))) ||
      (u.kind === 'place' && oneOf(STORY_PLACES, u.place)) || (u.kind === 'perk' && isText(u.perk, 200))))) issues.push(`${bt}: an unlock is an item (a good), a place or a perk`)
  }
  for (const rung of RUNGS) if (!ids.has(rung)) issues.push(`Her route has no ${rung} (RS7)`)
  if (bible.chats !== undefined) issues.push(...chatIssues(bible.chats))
  if (bible.keepsake !== undefined) issues.push(...keepsakeIssues(bible.keepsake))
  if (bible.petName !== undefined) issues.push(...petNameIssues(bible.petName))
  return issues
}

/** Her keepsake (F51 decision 13): `{ name, line }` and nothing else, the name 1–40 characters, the line 1–160, both under
 * the line rules. */
function keepsakeIssues(keepsake: unknown): Issues {
  if (!isObject(keepsake) || Object.keys(keepsake).some((k) => k !== 'name' && k !== 'line')) return ['keepsake is { name, line }']
  const issues: Issues = []
  if (!isText(keepsake.name, KEEPSAKE_LIMITS.name)) issues.push(`keepsake.name: 1–${KEEPSAKE_LIMITS.name} characters`)
  else issues.push(...lineIssues(keepsake.name, 'keepsake.name', false))
  if (!isText(keepsake.line, KEEPSAKE_LIMITS.line)) issues.push(`keepsake.line: 1–${KEEPSAKE_LIMITS.line} characters`)
  else issues.push(...lineIssues(keepsake.line, 'keepsake.line', false))
  return issues
}

/** Her pet name for you (F51 decision 13): 1–24 characters, no placeholder, never gendered (RS2, as the farmer's own
 * words). */
function petNameIssues(name: unknown): Issues {
  if (!isText(name, PET_NAME_MAX)) return [`petName: 1–${PET_NAME_MAX} characters`]
  if (/[{}]/.test(name)) return ['petName: no placeholder (it’s what she calls you)']
  return lineIssues(name, 'petName', true)
}

/** Every step of a scripted event, `then`, `good` and `miss` included. */
function allSteps(steps: unknown): Record<string, unknown>[] {
  if (!Array.isArray(steps)) return []
  return steps.flatMap((step): Record<string, unknown>[] => {
    if (!isObject(step)) return []
    const inner = 'choice' in step && Array.isArray(step.choice) ? step.choice.flatMap((o) => (isObject(o) ? allSteps(o.then) : []))
      : 'play' in step && isObject(step.play) ? [...allSteps(step.play.good), ...allSteps(step.play.miss)]
        : 'when' in step ? [...allSteps(step.then), ...allSteps(step.else)] : []
    return [step, ...inner]
  })
}

/** How many choice points and plays a scene's paths hold, at least and at most (F49 decision 14): a choice's options, a
 * play's `good` and `miss`, and a `when`'s two branches are alternatives; steps in a row add up. */
interface PathCounts { choices: [number, number]; plays: [number, number] }
const NONE: PathCounts = { choices: [0, 0], plays: [0, 0] }
const either = (list: PathCounts[]): PathCounts => (list.length === 0 ? NONE : {
  choices: [Math.min(...list.map((c) => c.choices[0])), Math.max(...list.map((c) => c.choices[1]))],
  plays: [Math.min(...list.map((c) => c.plays[0])), Math.max(...list.map((c) => c.plays[1]))],
})
function pathCounts(steps: unknown): PathCounts {
  if (!Array.isArray(steps)) return NONE
  return steps.reduce<PathCounts>((sum, step) => {
    if (!isObject(step)) return sum
    let here = NONE
    if ('choice' in step && Array.isArray(step.choice)) {
      const branch = either(step.choice.map((o) => pathCounts(isObject(o) ? o.then : undefined)))
      here = { choices: [branch.choices[0] + 1, branch.choices[1] + 1], plays: branch.plays }
    } else if ('play' in step && isObject(step.play)) {
      const branch = either([pathCounts(step.play.good), pathCounts(step.play.miss)])
      here = { choices: branch.choices, plays: [branch.plays[0] + 1, branch.plays[1] + 1] }
    } else if ('when' in step) here = either([pathCounts(step.then), pathCounts(step.else)])
    return { choices: [sum.choices[0] + here.choices[0], sum.choices[1] + here.choices[1]], plays: [sum.plays[0] + here.plays[0], sum.plays[1] + here.plays[1]] }
  }, NONE)
}

/** The three big scenes (RM30): up to three plays and three choice points; a heart event has one play and 1–2 choice
 * points at most (F49 decision 14). */
export const BIG_EVENTS: readonly string[] = ['confession', 'proposal', 'wedding']
export const EVENT_LIMITS = { heart: { plays: 1, choices: [1, 2] }, big: { plays: 3, choices: [1, 3] } } as const

/** The confession's answer choice (F49 decision 10): its last top-level choice point, or -1. */
export function answerAt(steps: readonly Step[]): number {
  for (let i = steps.length - 1; i >= 0; i--) if ('choice' in steps[i]!) return i
  return -1
}

/** One scripted heart event's own rules (F49 decision 14): on every path 1–2 choice points and at most one play (three of
 * each in the confession, the proposal and the wedding); `answer` only on the confession's last choice point, one Yes and
 * one Not yet, with no choice point after it; `reveals` one of her gifts. Her arrival keeps its own rule. */
export function eventIssues(id: string, steps: unknown, bible: UmaBible | null, where = `Event ${id}`): Issues {
  if (id === ARRIVAL) return arrivalIssues(steps, where)
  const issues: Issues = []
  const limits = BIG_EVENTS.includes(id) ? EVENT_LIMITS.big : EVENT_LIMITS.heart
  const counts = pathCounts(steps)
  if (counts.choices[0] < limits.choices[0] || counts.choices[1] > limits.choices[1]) issues.push(`${where}: every path has ${limits.choices[0]}–${limits.choices[1]} choice points (it has ${counts.choices[0]}–${counts.choices[1]})`)
  if (counts.plays[1] > limits.plays) issues.push(`${where}: at most ${limits.plays} play${limits.plays === 1 ? '' : 's'} (it has ${counts.plays[1]})`)
  const all = allSteps(steps)
  const options = all.flatMap((s) => ('choice' in s && Array.isArray(s.choice) ? s.choice.filter(isObject) : []))
  const gifts = bible ? [bible.gifts.loved, ...bible.gifts.liked, ...bible.gifts.disliked] : null
  for (const o of options) if (typeof o.reveals === 'string' && gifts && !gifts.includes(o.reveals)) issues.push(`${where}: reveals ${o.reveals}, which isn’t one of her gifts`)
  const answered = all.filter((s) => 'choice' in s && Array.isArray(s.choice) && s.choice.some((o) => isObject(o) && o.answer !== undefined))
  if (id !== 'confession') {
    if (answered.length > 0) issues.push(`${where}: only the confession’s last choice point carries an answer`)
    return issues
  }
  const top = Array.isArray(steps) ? (steps as Step[]) : []
  const at = answerAt(top)
  const last = at >= 0 ? (top[at] as { choice: ChoiceOption[] }) : null
  const marks = last && Array.isArray(last.choice) ? last.choice.map((o) => (isObject(o) ? o.answer : undefined)) : []
  if (!last || marks.filter((a) => a === 'yes').length !== 1 || marks.filter((a) => a === 'not-yet').length !== 1) issues.push(`${where}: its last choice point has one Yes (answer: yes) and one Not yet (answer: not-yet)`)
  if (answered.some((s) => s !== last)) issues.push(`${where}: only its last choice point carries an answer`)
  if (last && pathCounts([...last.choice.map((o) => ({ when: 'answer', then: o.then ?? [] })), ...top.slice(at + 1)]).choices[1] > 0) issues.push(`${where}: no choice point after its answer`)
  return issues
}

/** Her arrival scene (RM4, F46 decision 10): exactly one choice point and no play, so Skip lands on the choice and every
 * arrival pays +50 and its choice. */
export function arrivalIssues(steps: unknown, where = `Event ${ARRIVAL}`): Issues {
  const all = allSteps(steps)
  const issues: Issues = []
  const choices = all.filter((s) => 'choice' in s).length
  if (choices !== 1) issues.push(`${where}: an arrival has exactly one choice point (it has ${choices})`)
  if (all.some((s) => 'play' in s)) issues.push(`${where}: an arrival has no play`)
  return issues
}

/** Her bible's beats a route doesn't script yet (a partial route, F46 decision 16): listed, not refused. */
export function unscriptedBeats(route: Route, bible: UmaBible | null): string[] {
  const ids = new Set(route.events.map((e) => e.id))
  return bible ? bible.route.filter((b) => !ids.has(b.id)).map((b) => b.id) : []
}

/** How strict a route's check is: the sandbox and the story session want every beat scripted; the game's loader and
 * F56's release take a partial route, whose unscripted beats wait ("Her story is still being written"). */
export interface RouteCheck {
  partial?: boolean
}

/** routes/<id>.json (layer 3): an event for every beat of her bible, and none without one (a partial route may leave
 * beats unscripted). Her arrival plays as RM4's scene. */
export function routeIssues(route: unknown, bible: UmaBible | null, ctx: StoryContext, check: RouteCheck = {}): Issues {
  if (!isObject(route) || typeof route.characterId !== 'string' || !Array.isArray(route.events)) return ['Not a route (characterId, events)']
  const issues: Issues = []
  const speakers = new Set<string>([...ctx.umas, ...CAST_IDS])
  const events = route.events as unknown[]
  const ids = new Set<string>()
  for (const e of events) {
    if (!isObject(e) || typeof e.id !== 'string') { issues.push('An event without an id'); continue }
    ids.add(e.id)
    if (bible && !bible.route.some((b) => b.id === e.id)) issues.push(`Event ${e.id} isn’t a beat in her bible`)
    issues.push(...stepIssues(e.steps, `Event ${e.id}`, speakers, 0, ctx.isGood ?? isGoodId))
    issues.push(...eventIssues(e.id, e.steps, bible))
  }
  if (bible && !check.partial) for (const b of bible.route) if (!ids.has(b.id)) issues.push(`Beat ${b.id} has no scripted event`)
  return issues
}

/** What a pair check asks: the game reads pairs in a partial mode (F52), any of the five levels written so far. */
export interface PairCheck {
  partial?: boolean
}
/** pairs/<a>-<b>.json (layer 3): a tie's conversations, one at each bond level 1–5 (RS12); each level once. The game reads
 * them partial (F52 decision 10): any levels written so far. */
export function pairIssues(pair: unknown, ctx: StoryContext, check: PairCheck = {}): Issues {
  if (!isObject(pair) || typeof pair.a !== 'string' || typeof pair.b !== 'string' || !Array.isArray(pair.levels)) return ['Not a pair (a, b, levels)']
  const issues: Issues = []
  for (const side of [pair.a, pair.b]) if (!ctx.umas.has(side)) issues.push(`${side} isn’t in the cast`)
  if (pair.a === pair.b) issues.push('A pair is two Umas')
  const speakers = new Set<string>([pair.a, pair.b])
  const levels = pair.levels as unknown[]
  const hearts = levels.map((l) => (isObject(l) ? l.hearts : null))
  if (!check.partial) for (let h = 1; h <= 5; h++) if (!hearts.includes(h)) issues.push(`No conversation at bond level ${h}`)
  if (check.partial && levels.length === 0) issues.push('No conversation at any bond level')
  hearts.forEach((h, i) => {
    if (!Number.isInteger(h) || (h as number) < 1 || (h as number) > 5) issues.push(`Level ${i + 1}: hearts is 1–5`)
    else if (hearts.indexOf(h) !== i) issues.push(`Bond level ${String(h)} is written twice`)
  })
  for (const l of levels) {
    if (!isObject(l)) continue
    if (!oneOf(STORY_PLACES, l.place)) issues.push(`Level ${String(l.hearts)}: unknown place`)
    issues.push(...stepIssues(l.steps, `Level ${String(l.hearts)}`, speakers))
    if (allSteps(l.steps).some((s) => 'choice' in s && Array.isArray(s.choice) && s.choice.some((o) => isObject(o) && o.answer !== undefined))) issues.push(`Level ${String(l.hearts)}: only the confession carries an answer`)
  }
  return issues
}
