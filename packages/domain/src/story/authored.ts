// The farm's authored story: the pack's files (the cast, the ties, each Uma's bible and route, the pairs' conversations
// and the household) as the private `content/story/` holds them, and the one reader the game, the release and the Story
// Sandbox share. No character, name or line lives here; tests run on the invented stand-in (`authored.fixture.ts`).
//
// **An open pack.** The pack is a menu of what the game can read, never a checklist (`docs/story-pack.md`): every part
// is optional, any number of characters is fine, in any order, and nothing is counted. The reader finds two things:
// - **errors**, only what the game can't read: a value that isn't the shape the game reads where it reads it, or a line
//   longer than its screen shows. Each skips the one part it's in (a line, a field, a beat, an event, a tie, a
//   character), never the whole pack;
// - **notes**, everything else: an unusual count, a missing bible, an unwritten route, a word that genders the farmer.
//   They block nothing.
// Fields the game doesn't read are ignored and kept, for the story's own use.
//
// Relationships are a game, not a visual novel: a route beat says what the farmer and she *do* together (`together`:
// work, a date game, a gift, helping another Uma), every choice carries its visible heart gain and its tone, an event may
// hold a short `play` moment the farmer acts out, a beat may unlock something shown on a card, and a beat carries the hint
// her profile shows while it's next. Nothing is missable and nothing waits on the calendar: a rung is ready when her bar
// is full, plus at most one setup the player controls (she works a place today, an item is in the Warehouse, a bond, a
// chapter), never an hour, the weather, a season or a festival. Routes run side by side and end in a spouse ladder.
import { FARM_PLACE_IDS, type FarmPlaceId } from '../farm/places'
import { ACTIVITIES, type Activity } from '../farm/ranks'
import { isGoodId } from '../goods/ids'
import { CAST_IDS } from './cast'

/** The farm's places plus the romance's own backdrops. */
export const STORY_PLACES = [
  ...FARM_PLACE_IDS, 'pond-night', 'overlook', 'orchard-bench', 'dorm-porch', 'harbour-wall', 'chapel-bell', 'town', 'hilltop-track', 'sea-pier',
] as const
export const FESTIVALS = ['flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup'] as const
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
/** Her calling's line: farming, foraging, fishing, mining, or quarry (mining at the Quarry). */
export const CALLINGS = ['farming', 'foraging', 'fishing', 'mining', 'quarry'] as const
/** Her favourite work: any activity but expeditions, which are a party's, not one Uma's. */
export const FAVOURITE_LINES = ACTIVITIES.filter((a): a is Exclude<Activity, 'expeditions'> => a !== 'expeditions')
export const TIE_KINDS = ['friends', 'rivals', 'mentor', 'teammates', 'sisters', 'other'] as const
/** The ladders a beat sits on: her arrival, then the route's six. */
export const LADDERS = ['arrival', 'friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
export const EMOTES = ['happy', 'shy', 'sad', 'angry', 'surprised', 'thinking', 'laughing', 'tender'] as const
export const TONES = ['warm', 'playful', 'honest'] as const

/** The date games: short shared activities a date is played as. */
export const DATE_GAMES = ['fishing', 'cooking', 'stargazing', 'footrace', 'dance', 'picnic', 'market', 'boat', 'walk', 'crafting'] as const

/** The rungs the game plays an event at: her arrival scene ("event zero"), ten friendship events, the confession, ten
 * romance events, the proposal, the wedding, and three on the spouse ladder after it (S1, S3, S5). The story writes any of
 * them, in any order; the rest wait ("Her story is still being written"). */
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

// --- The cast and the ties ----------------------------------------------------------------------------------------------

/** How she comes to the farm today. Meeting her (her `meet` trigger) takes over when the town lands. */
export type Arrival =
  | { kind: 'opening' }
  | { kind: 'chapter'; chapter: number }
  | { kind: 'festival'; festival: Festival; year?: number }
  | { kind: 'beds'; dormLevel: number }
  | { kind: 'event'; after: string }

/** The trigger menu: how her story begins (her `meet`), and what one of her chapters may ask of the farm (its `gate`).
 * One menu for both; read by the pack, acted on when meeting her and her chapters land. */
export type StoryTrigger =
  /** Talk with her on this many different days. */
  | { kind: 'talks'; days: number }
  /** Give her a gift she likes, or this good. */
  | { kind: 'gift'; good?: string }
  /** Talk with her at one of the town's spots. */
  | { kind: 'spot'; spot: string }
  /** Talk with her in a season. */
  | { kind: 'season'; season: Season }
  /** Talk with her on a festival. */
  | { kind: 'festival'; festival: Festival }
  /** Reach a Farm Rank. */
  | { kind: 'farm-rank'; rank: number }
  /** Have a place built. */
  | { kind: 'built'; place: FarmPlaceId }
  /** Ship this many of a good, in all. */
  | { kind: 'shipped'; good: string; count: number }
  /** After another character's event plays: `<characterId>:<eventId>`, or an event id (anyone's). */
  | { kind: 'event'; after: string }
export const TRIGGER_KINDS = ['talks', 'gift', 'spot', 'season', 'festival', 'farm-rank', 'built', 'shipped', 'event'] as const
/** Her trigger to meet when the pack gives none: talk with her on three different days. */
export const DEFAULT_MEET: StoryTrigger = { kind: 'talks', days: 3 }
/** The Farm Rank's top. */
const TOP_FARM_RANK = 10

/** One of her chapters: its title, the rungs of hers it holds (in order), and optionally a gate from the trigger menu
 * that the farm meets before its events can play. */
export interface HerChapter { title?: string; events?: string[]; gate?: StoryTrigger }
/** Her chapters when the pack gives none: four, along the route's backbone. */
export const DEFAULT_CHAPTERS: readonly Required<Pick<HerChapter, 'title' | 'events'>>[] = [
  { title: 'Getting to know her', events: RUNGS.slice(0, RUNGS.indexOf('confession') + 1) },
  { title: 'Together', events: RUNGS.slice(RUNGS.indexOf('r1'), RUNGS.indexOf('proposal') + 1) },
  { title: 'The wedding', events: ['wedding'] },
  { title: 'Married life', events: ['s1', 's3', 's5'] },
]
/** The welcome list when the pack names none: the first five of the cast, in its order. */
export const DEFAULT_WELCOME = 5

/** A birthday as a date: month 1–12 and a real day of it. */
export interface CastBirthday { month: number; day: number }
/** One character of the cast. Only her `characterId` (master data's) is needed; everything else is optional. */
export interface CastEntry {
  characterId: string
  /** The one outfit she plays as. */
  outfitId?: string
  calling?: Calling
  /** How she comes to the farm today (the opening, a chapter, a festival, the Dorm's beds, after an event). */
  arrives?: Arrival
  /** Only where master data's character set has none: it wins where present. */
  birthday?: CastBirthday
  /** Her trigger to meet, from the trigger menu. */
  meet?: StoryTrigger
  /** Her chapters. */
  chapters?: HerChapter[]
  /** A short paragraph about her: the story's own (the sandbox shows it). */
  paragraph?: string
}
/** Which state of the Uma Ranker the cast was read from: the board's and the profiles' revisions, and when. */
export interface CastRanker { boardRevision: number; profilesRevision: number; pulledAt: string }
export interface Cast {
  version?: 1
  export?: { file: string; exportedAt: string; tier: string }
  ranker?: CastRanker
  /** Who comes up the road at the opening, in order: any number. */
  opening?: string[]
  /** Who comes to the farm in the first days, in order: any number. */
  welcome?: string[]
  /** The cast, in its order. */
  umas: CastEntry[]
}
/** Where a tie comes from: `real`, a relationship from the real careers, checked against public records,
 * with `from` the id uma-quest's relationships give it (filled once they exist); or `story`, born on the farm. */
export const TIE_SOURCES = ['real', 'story'] as const
export type TieSource = typeof TIE_SOURCES[number]
/** A tie between two characters. Only `a` and `b` are needed: a tie's kind reads "Close" without one, its strength 1. */
export interface Tie { a: string; b: string; kind?: TieKind; strength?: 1 | 2 | 3; line?: string; history?: string; source?: TieSource; from?: string }
export interface Ties { version?: 1; ties: Tie[] }
/** A tie's strength, 1 without one. */
export const tieStrength = (tie: Pick<Tie, 'strength'>): 1 | 2 | 3 => tie.strength ?? 1
/** A tie's kind, `other` ("Close") without one. */
export const tieKind = (tie: Pick<Tie, 'kind'>): TieKind => tie.kind ?? 'other'

// --- Her bible ----------------------------------------------------------------------------------------------------------

/** When a rung is ready: her bar full, plus at most one setup the player controls. Never a clock, the weather, a
 * season or a festival: those may colour a scene's words, never whether it plays. */
export type Trigger =
  | { kind: 'hearts' }
  | { kind: 'working'; activity: Activity }
  | { kind: 'item'; good: string }
  | { kind: 'bond'; with: string; level: number }
  | { kind: 'chapter'; chapter: number }

/** What the farmer and she do in the event: the game part. */
export type Together =
  | { kind: 'talk' }
  | { kind: 'work'; activity: Activity }
  | { kind: 'date'; game: DateGame }
  | { kind: 'gift'; good: string }
  | { kind: 'help'; with: string }

/** What a beat gives besides hearts, shown on a card: a recipe or an item by goods id, a place, or a perk in words. */
export type Unlock = { kind: 'item'; good: string } | { kind: 'place'; place: StoryPlace } | { kind: 'perk'; perk: string }

/** One rung of her route, by its id. Everything but the id is optional. */
export interface Beat {
  id: string
  ladder?: Ladder
  hearts?: number
  trigger?: Trigger
  place?: StoryPlace
  together?: Together
  /** The Memory's caption. */
  beat?: string
  /** What her profile says while this rung is next: where and how it opens. */
  hint?: string
  unlock?: Unlock
}
/** Her gifts: what she loves, likes and dislikes, any number of each. Everything else is neutral. */
export interface Gifts { loved?: string; liked?: string[]; disliked?: string[]; proposed?: string[] }
/** Her bible. Only her id is needed (the file's name gives it); the game reads her favourite line, her gifts, her route's
 * beats, her chats, her keepsake, her pet name, her wedding's places and her wishes. Her profile's texts, season and
 * festival are the story's own. */
export interface UmaBible {
  characterId: string
  outfitId?: string | null
  now?: string
  whyTheFarm?: string
  dream?: string
  blurb?: string
  favouriteLine?: Exclude<Activity, 'expeditions'>
  season?: Season
  festival?: Festival
  gifts?: Gifts
  laughs?: string
  hurts?: string
  route?: Beat[]
  /** Her chat sets (her F1 perk): what she says when you chat, by stage, from Friendship 1: `friend` through
   * the confession, `partner` from Romance 1 to the wedding, `spouse` after it. Without one she keeps her temperament's
   * lines. */
  chats?: ChatSets
  /** Her keepsake: a named item she gives at Friendship 10, its name and her line about it, shown on her profile. Its
   * effect is the template's: +0.25 quality at her line, +0.5 from S5. Without a name her profile says "Her keepsake". */
  keepsake?: Keepsake
  /** Her pet name for you: a short name she calls you from Romance 1, shown on her profile. Never gendered. */
  petName?: string
  /** Her wedding's places, the first its first choice. Without them the game offers her wedding beat's place and the
   * farm's. */
  wedding?: WeddingPlan
  /** Her wishes for married life: `own-house` and `birthday-alone`. */
  wishes?: Wish[]
}
/** Her wishes. */
export const WISHES = ['own-house', 'birthday-alone'] as const
export type Wish = typeof WISHES[number]
/** Her wedding's places. */
export interface WeddingPlan { places: StoryPlace[] }
/** Her keepsake: its name and her line about it. */
export interface Keepsake { name?: string; line?: string }
/** Her chat sets: any number of lines a stage. */
export interface ChatSets { friend?: string[]; partner?: string[]; spouse?: string[] }
export const CHAT_SETS = ['friend', 'partner', 'spouse'] as const

// --- Scripted events and pair conversations -----------------------------------------------------------------------------

/** The confession's last choice point marks its two answers: Yes opens romance, Not yet keeps her a
 * close friend. */
export const ANSWERS = ['yes', 'not-yet'] as const
export type Answer = typeof ANSWERS[number]
/** An option's item cost: a count of a good, taken from the Warehouse at any stars, lowest first. */
export interface OptionGives { good: string; count: number }
export interface ChoiceOption {
  text: string
  tone?: Tone
  friendship?: number
  romance?: number
  then?: Step[]
  /** It costs goods: "· 1 Herb" on the button, greyed "Need 1 Herb" without them. */
  gives?: OptionGives
  /** It learns one of her gifts' tastes: "· learns a like". */
  reveals?: string
  /** The confession's last choice point: one `yes` and one `not-yet`. */
  answer?: Answer
}
/** A farming play's game, picked by the author: harvest the ripe ones (Pick) or tend (Rhythm). */
export const FARMING_PLAYS = ['pick', 'rhythm'] as const
/** A short moment the farmer acts out inside an event (cast the line, stir the pot, aim the telescope). It plays as one of
 * the five plays; its own `friendship` and `romance` are ignored, since the grade pays. `good` plays after a
 * Great or Perfect, `miss` after a Fine. */
export interface Play { game: DateGame | Activity; prompt?: string; good?: Step[]; miss?: Step[]; friendship?: number; romance?: number; as?: typeof FARMING_PLAYS[number] }
export type Step =
  | { say: string; line: string; emote?: Emote }
  | { choice: ChoiceOption[] }
  | { play: Play }
  | { narrate: string }
  | { thought: string }
  | { wait: number }
  | { place: StoryPlace }
  | { flag: string }
  /** Its steps play only while the flag is set, `else` otherwise: flags change wording only. */
  | { when: string; then: Step[]; else?: Step[] }
export interface Route { characterId?: string; events: { id: string; steps: Step[] }[] }
export interface PairConversations { a: string; b: string; levels: { hearts: number; place?: StoryPlace; steps: Step[] }[] }

/** The usual sizes of an event, which a note compares against: a heart event's 1–2 choice points on every path and one
 * play at most; the confession's, the proposal's and the wedding's 1–3 and three. The game plays any. */
export const BIG_EVENTS: readonly string[] = ['confession', 'proposal', 'wedding']
export const EVENT_LIMITS = { heart: { plays: 1, choices: [1, 2] }, big: { plays: 3, choices: [1, 3] } } as const

/** The confession's answer choice: its last top-level choice point, or -1. */
export function answerAt(steps: readonly Step[]): number {
  for (let i = steps.length - 1; i >= 0; i--) if ('choice' in steps[i]!) return i
  return -1
}

// --- The household ------------------------------------------------------------------------------------------------------

/** The household scenes' counts: one at 5, 10 and 15 married. */
export const HOUSEHOLD_SCENES = [5, 10, 15] as const
export type HouseholdAt = typeof HOUSEHOLD_SCENES[number]
/** A household scene: `open`, then each married Uma's `each` in wedding order, then `close`. `open` and `close` speak
 * through narration and the town's cast, since who is married varies; her `each` is hers. It pays nothing. */
export interface HouseholdScene { at: HouseholdAt; open?: Step[]; each?: Record<string, Step[]>; close?: Step[] }
/** The finale, the Great Harvest: `open`, its play, each spouse's beat in wedding order, then `close`. */
export interface Finale { open?: Step[]; play?: Play; each?: Record<string, Step[]>; close?: Step[] }
/** household.json: built for a household the author can't know in advance. Every part optional. */
export interface Household {
  scenes?: HouseholdScene[]
  /** A spouse's house lines, said on a morning in her house. Without hers, the templates by temperament stand in. */
  houseLines?: Record<string, string[]>
  finale?: Finale
}

// --- The tag sheet (the sandbox's) --------------------------------------------------------------------------------------

/** One Uma's tags: her favourite line, season, festival and loved gift, each with a one-line reason from her career and
 * her character. Her bible carries the same values. The game never reads it. */
export interface TagEntry {
  characterId: string
  favouriteLine: Exclude<Activity, 'expeditions'>
  season: Season
  festival: Festival
  loved: string
  reasons: { favouriteLine: string; season: string; festival: string; loved: string }
  /** A loved gift that isn't a good yet (a dish to come), flagged as a proposal. */
  proposed?: boolean
}
export interface Tags { version: 1; tags: TagEntry[] }

// === The reader ==========================================================================================================

/** What a check finds. Errors are what the game can't read: each skips the part it's in. Notes are everything else. */
export interface Findings { errors: string[]; notes: string[] }
/** A file as the game reads it: its value with every broken part skipped (everything else kept, fields the game doesn't
 * read included), and what the check found. */
export interface Read<T> extends Findings { value: T }
const findings = (): Findings => ({ errors: [], notes: [] })

/** The longest text each screen shows; longer is an error that skips the part it's in. */
export const LINE_LIMITS = {
  /** A line in a scene, said, narrated or thought: the scene player's box. */
  line: 400,
  /** A choice's button. */
  option: 160,
  /** A play's title. */
  prompt: 120,
  /** A chat line. */
  chat: 160,
  /** A house's morning line. */
  houseLine: 120,
  /** Her profile's Next card. */
  hint: 160,
  /** A Memory's caption. */
  caption: 400,
  /** A tie's line on her profile. */
  tieLine: 400,
  keepsakeName: 40,
  keepsakeLine: 160,
  petName: 24,
  /** An unlock's perk, in words. */
  perk: 200,
  /** A chapter's title on her profile. */
  chapterTitle: 40,
  /** A flag's name, as the save keeps it. */
  flag: 64,
  /** A town spot's id, and an event's `<characterId>:<eventId>`. */
  id: 80,
} as const
/** Kept for the screens that quote them. */
export const PET_NAME_MAX = LINE_LIMITS.petName
export const KEEPSAKE_LIMITS = { name: LINE_LIMITS.keepsakeName, line: LINE_LIMITS.keepsakeLine } as const
export const HOUSE_LINE_MAX = LINE_LIMITS.houseLine

/** A character id, as master data and the save hold it: a positive integer. */
export const CHARACTER_ID = /^[1-9]\d*$/
/** A flag's name, as the save keeps it. */
const FLAG = /^[a-z0-9][a-z0-9:._-]{0,63}$/

/** Words that would gender the farmer: never in the farmer's own words, nor anyone's words to them. */
const GENDERED = /\b(husband|wife|boyfriend|girlfriend|groom|sir|mister|mr|mrs|ms|ma'?am|madam|lad|lass|fella|gal|guy)\b/i
/** The farmer's own lines may not call themself a bride either (an Uma may be one). */
const GENDERED_FARMER = /\b(bride)\b/i
/** Whether a line genders the farmer: the words above, in anyone's lines; `bride` too in the farmer's own. Returns the
 * word, or null. */
export function gendersFarmer(text: string, farmer = true): string | null {
  return (text.match(GENDERED) ?? (farmer ? text.match(GENDERED_FARMER) : null))?.[0] ?? null
}
/** Nothing that reads under 18. */
const SCHOOLISH = /\b(senpai|kouhai|classmates?|homework|high school|middle school|school uniform|schoolgirls?)\b/i
const PLACEHOLDER = /\{([^{}]*)\}/g

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isInt = (v: unknown, min = -Infinity, max = Infinity): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/** What the reader knows: the cast's character ids, which goods exist, and (in the sandbox) the Studio export's ids. */
export interface StoryContext {
  /** Every character of the cast, by id. */
  umas: ReadonlySet<string>
  /** A goods id that exists; defaults to the game's goods. */
  isGood?: (id: string) => boolean
  /** The Studio export's characters (the sandbox's): a cast character outside it is a note. */
  exported?: ReadonlySet<string>
}

/** A line's words: `{farmer}` is the only placeholder, no word genders the farmer, nothing reads as school. Notes. */
function lineNotes(text: string, where: string, farmer: boolean): string[] {
  const notes: string[] = []
  for (const [, name] of text.matchAll(PLACEHOLDER)) if (name !== 'farmer') notes.push(`${where}: {${name}} shows as written ({farmer} is the one placeholder)`)
  const gendered = text.match(GENDERED) ?? (farmer ? text.match(GENDERED_FARMER) : null)
  if (gendered) notes.push(`${where}: “${gendered[0]}” genders the farmer`)
  const school = text.match(SCHOOLISH)
  if (school) notes.push(`${where}: “${school[0]}” reads as school`)
  return notes
}

/** Text the game shows: present, within its screen's length (errors otherwise), and its words' notes. */
function shown(v: unknown, max: number, at: string, f: Findings, farmer = false, what = 'line'): v is string {
  if (!isText(v)) { f.errors.push(`${at}: no ${what}`); return false }
  if (v.length > max) { f.errors.push(`${at}: its ${what} is ${v.length} characters; the screen shows ${max}`); return false }
  f.notes.push(...lineNotes(v, at, farmer))
  return true
}

/** An optional field, read: the value when it reads, else `undefined` with its error. */
function field<T>(raw: Record<string, unknown>, key: string, read: (v: unknown) => T | undefined, at: string, f: Findings, words: string): T | undefined {
  const v = raw[key]
  if (v === undefined || v === null) return undefined
  const value = read(v)
  if (value === undefined) f.errors.push(`${at === key ? '' : `${at}: `}${key} ${words}; skipped`)
  return value
}

/** A copy of `raw` with each key set to its read value, or removed when that is undefined: everything else kept. */
function kept<T>(raw: Record<string, unknown>, values: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...raw }
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete out[key]
    else out[key] = value
  }
  return out as T
}

/** A list of ids: unique, each passing `ok`. Errors skip a bad item; a repeat is a note. */
function idList(v: unknown, at: string, f: Findings, ok: (id: string) => boolean, words: string): string[] | undefined {
  if (!Array.isArray(v)) { f.errors.push(`${at}: a list of ${words}; skipped`); return undefined }
  const out: string[] = []
  v.forEach((id, i) => {
    if (typeof id !== 'string' || !ok(id)) f.errors.push(`${at} ${i + 1}: ${String(id)} isn’t one of ${words}; skipped`)
    else if (out.includes(id)) f.notes.push(`${at}: ${id} is listed twice; once is kept`)
    else out.push(id)
  })
  return out
}

/** A trigger from the menu, read: the trigger, or undefined (an error). Notes for what reads but may never hold. */
function readTrigger(v: unknown, at: string, f: Findings, ctx: StoryContext): StoryTrigger | undefined {
  const isGood = ctx.isGood ?? isGoodId
  const bad = (words: string): undefined => { f.errors.push(`${at}: ${words}; skipped`); return undefined }
  if (!isObject(v) || !oneOf(TRIGGER_KINDS, v.kind)) return bad(`a trigger is one of ${TRIGGER_KINDS.join(', ')}`)
  switch (v.kind) {
    case 'talks':
      if (!isInt(v.days, 1)) return bad('talks names its days, from 1')
      return { kind: 'talks', days: v.days }
    case 'gift':
      if (v.good === undefined) return { kind: 'gift' }
      if (typeof v.good !== 'string') return bad('a gift’s good is a goods id')
      if (!isGood(v.good)) f.notes.push(`${at}: ${v.good} isn’t a good in the game yet`)
      return { kind: 'gift', good: v.good }
    case 'spot':
      if (!isText(v.spot) || v.spot.length > LINE_LIMITS.id) return bad('a spot names one of the town’s spots')
      return { kind: 'spot', spot: v.spot }
    case 'season':
      if (!oneOf(SEASONS, v.season)) return bad(`a season is one of ${SEASONS.join(', ')}`)
      return { kind: 'season', season: v.season }
    case 'festival':
      if (!oneOf(FESTIVALS, v.festival)) return bad(`a festival is one of ${FESTIVALS.join(', ')}`)
      return { kind: 'festival', festival: v.festival }
    case 'farm-rank':
      if (!isInt(v.rank, 1)) return bad('farm-rank names a rank, from 1')
      if (v.rank > TOP_FARM_RANK) f.notes.push(`${at}: Farm Rank ${v.rank} is past the top, ${TOP_FARM_RANK}, so it never holds`)
      return { kind: 'farm-rank', rank: v.rank }
    case 'built':
      if (!oneOf(FARM_PLACE_IDS, v.place)) return bad('built names one of the farm’s places')
      return { kind: 'built', place: v.place }
    case 'shipped':
      if (typeof v.good !== 'string' || !isInt(v.count, 1)) return bad('shipped names a good and a count, from 1')
      if (!isGood(v.good)) f.notes.push(`${at}: ${v.good} isn’t a good in the game yet, so it can’t be shipped`)
      return { kind: 'shipped', good: v.good, count: v.count }
    case 'event':
      if (!isText(v.after) || v.after.length > LINE_LIMITS.id) return bad('event names `<characterId>:<eventId>`, or an event id')
      return { kind: 'event', after: v.after }
  }
}

// --- Steps --------------------------------------------------------------------------------------------------------------

/** Who may speak in a run of steps, and which goods exist. */
interface StepContext { speakers: ReadonlySet<string>; isGood: (id: string) => boolean }

function checkSteps(steps: unknown, where: string, sc: StepContext, f: Findings, nested = false): void {
  if (!Array.isArray(steps)) { f.errors.push(`${where}: steps are a list`); return }
  if (steps.length === 0) { if (!nested) f.errors.push(`${where}: no steps`); return }
  steps.forEach((step, i) => {
    const at = `${where}, step ${i + 1}`
    if (!isObject(step)) { f.errors.push(`${at}: not a step`); return }
    if ('say' in step) {
      if (!isText(step.say)) f.errors.push(`${at}: say names who speaks`)
      else if (!sc.speakers.has(step.say)) f.notes.push(`${at}: ${step.say} isn’t one who speaks here (one outside the cast shows as “An Uma”)`)
      shown(step.line, LINE_LIMITS.line, at, f)
      if (step.emote !== undefined && !oneOf(EMOTES, step.emote)) f.notes.push(`${at}: the emote ${String(step.emote)} shows as its word (the menu’s are ${EMOTES.join(', ')})`)
    } else if ('choice' in step) {
      const options = step.choice
      if (!Array.isArray(options) || options.length === 0) { f.errors.push(`${at}: a choice lists its options`); return }
      if (options.length === 1) f.notes.push(`${at}: one option, so there’s nothing to choose`)
      if (options.length > 3) f.notes.push(`${at}: ${options.length} options; more than three crowd the screen`)
      options.forEach((o, k) => {
        const ot = `${at}, option ${k + 1}`
        if (!isObject(o)) { f.errors.push(`${ot}: not an option`); return }
        shown(o.text, LINE_LIMITS.option, ot, f, true, 'text')
        if (o.tone !== undefined && !oneOf(TONES, o.tone)) f.notes.push(`${ot}: the tone ${String(o.tone)} isn’t one of ${TONES.join(', ')}`)
        for (const key of ['friendship', 'romance'] as const) {
          const v = o[key]
          if (v === undefined) continue
          if (typeof v !== 'number' || !Number.isFinite(v)) f.errors.push(`${ot}: ${key} is a number`)
          else if (v < 0 || v > 50) f.notes.push(`${ot}: ${key} ${v} is outside the usual 0–50; a gain only ranks the options (+30 the best, +10 the rest)`)
        }
        if (o.then !== undefined) checkSteps(o.then, `${ot} then`, sc, f, true)
        const g = o.gives
        if (g !== undefined) {
          if (!isObject(g) || typeof g.good !== 'string' || !sc.isGood(g.good) || !isInt(g.count, 1)) f.errors.push(`${ot}: gives is { good, count }, a good the game has and a count from 1`)
          else if (g.count > 5) f.notes.push(`${ot}: gives ${g.count}, more than the usual 1–5`)
        }
        if (o.reveals !== undefined && (typeof o.reveals !== 'string' || !sc.isGood(o.reveals))) f.errors.push(`${ot}: reveals names a good the game has`)
        if (o.answer !== undefined && !oneOf(ANSWERS, o.answer)) f.errors.push(`${ot}: answer is yes or not-yet`)
      })
      const gains = (o: unknown) => (isObject(o) ? (Number(o.friendship) || 0) + (Number(o.romance) || 0) : 0)
      if (options.length > 1 && !options.some((o) => gains(o) > 0)) f.notes.push(`${at}: no option gains hearts, so each pays the best (+30)`)
    } else if ('play' in step) {
      const p = step.play
      if (!isObject(p) || !(oneOf(DATE_GAMES, p.game) || oneOf(ACTIVITIES, p.game))) { f.errors.push(`${at}: a play names its game (a date game or an activity)`); return }
      if (p.prompt !== undefined) shown(p.prompt, LINE_LIMITS.prompt, at, f, false, 'prompt')
      if (p.as !== undefined && (p.game !== 'farming' || !oneOf(FARMING_PLAYS, p.as))) f.notes.push(`${at}: as (pick or rhythm) is a farming play’s; it’s ignored here`)
      if (p.good !== undefined) checkSteps(p.good, `${at} good`, sc, f, true)
      if (p.miss !== undefined) checkSteps(p.miss, `${at} miss`, sc, f, true)
    } else if ('narrate' in step) {
      shown(step.narrate, LINE_LIMITS.line, at, f, false, 'narration')
    } else if ('thought' in step) {
      shown(step.thought, LINE_LIMITS.line, at, f, true, 'thought')
    } else if ('wait' in step) {
      if (typeof step.wait !== 'number' || !Number.isFinite(step.wait)) f.errors.push(`${at}: wait is a number of ms`)
      else if (step.wait <= 0 || step.wait > 5000) f.notes.push(`${at}: a wait of ${step.wait} ms plays as 0–5000`)
    } else if ('place' in step) {
      if (typeof step.place !== 'string') f.errors.push(`${at}: place names a place`)
      else if (!oneOf(STORY_PLACES, step.place)) f.notes.push(`${at}: ${step.place} isn’t one of the game’s places; its title line shows the words`)
    } else if ('flag' in step) {
      if (typeof step.flag !== 'string' || !FLAG.test(step.flag)) f.errors.push(`${at}: a flag is lowercase letters, digits and - . : _ (up to ${LINE_LIMITS.flag}), as the save keeps it`)
    } else if ('when' in step) {
      if (typeof step.when !== 'string') f.errors.push(`${at}: when names a flag`)
      else if (!FLAG.test(step.when)) f.notes.push(`${at}: ${step.when} can’t be a flag, so the else plays`)
      checkSteps(step.then, `${at} then`, sc, f, true)
      if (step.else !== undefined) checkSteps(step.else, `${at} else`, sc, f, true)
    } else f.errors.push(`${at}: not a step the game plays`)
  })
}

/** A run of steps' findings: the scripted events', the pairs' and the household's shared check. */
export function stepFindings(steps: unknown, where: string, speakers: ReadonlySet<string>, isGood: (id: string) => boolean = isGoodId): Findings {
  const f = findings()
  checkSteps(steps, where, { speakers, isGood }, f)
  return f
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

/** How many choice points and plays a scene's paths hold, at least and at most: a choice's options, a
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

const hasAnswer = (s: Record<string, unknown>): boolean => 'choice' in s && Array.isArray(s.choice) && s.choice.some((o) => isObject(o) && o.answer !== undefined)

/** A scripted event's notes against the usual sizes, and its answers and reveals: they never skip it. Her arrival has
 * its own: one choice point (it pays +50 and that choice) and no play. */
export function eventNotes(id: string, steps: unknown, bible: UmaBible | null, where = `Event ${id}`): string[] {
  const notes: string[] = []
  const counts = pathCounts(steps)
  const all = allSteps(steps)
  if (id === ARRIVAL) {
    const choices = all.filter((s) => 'choice' in s).length
    if (choices === 0) notes.push(`${where}: no choice point, so it pays +50 and no choice`)
    if (choices > 1) notes.push(`${where}: ${choices} choice points; only the first pays`)
    if (all.some((s) => 'play' in s)) notes.push(`${where}: an arrival plays no play; it shows as a pause`)
    if (all.some(hasAnswer)) notes.push(`${where}: only the confession’s answers count`)
    return notes
  }
  const limits = BIG_EVENTS.includes(id) ? EVENT_LIMITS.big : EVENT_LIMITS.heart
  if (counts.choices[0] < limits.choices[0] || counts.choices[1] > limits.choices[1]) {
    notes.push(`${where}: ${counts.choices[0] === counts.choices[1] ? counts.choices[0] : `${counts.choices[0]}–${counts.choices[1]}`} choice points on a path, outside the usual ${limits.choices[0]}–${limits.choices[1]}; each pays`)
  }
  if (counts.plays[1] > limits.plays) notes.push(`${where}: ${plural(counts.plays[1], 'play')}, more than the usual ${limits.plays}; each pays`)
  const gifts = bible?.gifts ? [bible.gifts.loved, ...(bible.gifts.liked ?? []), ...(bible.gifts.disliked ?? [])] : null
  for (const o of all.flatMap((s) => ('choice' in s && Array.isArray(s.choice) ? s.choice.filter(isObject) : []))) {
    if (typeof o.reveals === 'string' && gifts && !gifts.includes(o.reveals)) notes.push(`${where}: reveals ${o.reveals}, which isn’t one of her gifts (she finds it neutral)`)
  }
  const answered = all.filter(hasAnswer)
  if (id !== 'confession') {
    if (answered.length > 0) notes.push(`${where}: only the confession’s answers count; these are ignored`)
    return notes
  }
  const top = Array.isArray(steps) ? (steps as Step[]) : []
  const at = answerAt(top)
  const last = at >= 0 ? (top[at] as { choice: ChoiceOption[] }) : null
  const marks = last && Array.isArray(last.choice) ? last.choice.map((o) => (isObject(o) ? o.answer : undefined)) : []
  const missing = ANSWERS.filter((a) => !marks.includes(a))
  if (missing.length > 0) notes.push(`${where}: its last choice point has no ${missing.map((a) => `answer: ${a}`).join(' and no ')}; an option without an answer counts as Yes`)
  if (answered.some((s) => s !== (last as unknown))) notes.push(`${where}: only its last choice point’s answers count`)
  return notes
}

// --- The cast -----------------------------------------------------------------------------------------------------------

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
/** A birthday on a real date: `{ month: 1–12, day }`, February's 29 allowed (a birthday has no year). */
const realDate = (v: unknown): v is CastBirthday => isObject(v) && isInt(v.month, 1, 12) && isInt(v.day, 1, MONTH_DAYS[(v.month as number) - 1]!)

function readArrival(v: unknown): Arrival | undefined {
  if (!isObject(v)) return undefined
  switch (v.kind) {
    case 'opening': return { kind: 'opening' }
    case 'chapter': return isInt(v.chapter, 1) ? { kind: 'chapter', chapter: v.chapter } : undefined
    case 'festival':
      if (!oneOf(FESTIVALS, v.festival) || (v.year !== undefined && !isInt(v.year, 1))) return undefined
      return v.year === undefined ? { kind: 'festival', festival: v.festival } : { kind: 'festival', festival: v.festival, year: v.year as number }
    case 'beds': return isInt(v.dormLevel, 1) ? { kind: 'beds', dormLevel: v.dormLevel } : undefined
    case 'event': return isText(v.after) && v.after.length <= LINE_LIMITS.id ? { kind: 'event', after: v.after } : undefined
    default: return undefined
  }
}

function readChapters(v: unknown, at: string, f: Findings, ctx: StoryContext): HerChapter[] | undefined {
  if (!Array.isArray(v)) { f.errors.push(`${at}: chapters is a list; skipped`); return undefined }
  const placed = new Map<string, number>()
  const out = v.flatMap((raw, i): HerChapter[] => {
    const ct = `${at}, chapter ${i + 1}`
    if (!isObject(raw)) { f.errors.push(`${ct}: not a chapter; skipped`); return [] }
    const title = raw.title === undefined ? undefined : shown(raw.title, LINE_LIMITS.chapterTitle, ct, f, false, 'title') ? raw.title : (f.errors[f.errors.length - 1] += '; skipped', undefined)
    const events = raw.events === undefined ? undefined : idList(raw.events, `${ct} events`, f, (id) => id.length > 0, 'her rungs')
    for (const id of events ?? []) {
      if (!RUNGS.includes(id)) f.notes.push(`${ct}: ${id} isn’t a rung the game plays`)
      if (placed.has(id)) f.notes.push(`${ct}: ${id} is in chapter ${placed.get(id)} too; the first holds it`)
      else placed.set(id, i + 1)
    }
    if (events !== undefined && events.length === 0) f.notes.push(`${ct}: it holds no events`)
    const gate = raw.gate === undefined ? undefined : readTrigger(raw.gate, `${ct} gate`, f, ctx)
    if (raw.title === undefined) f.notes.push(`${ct}: no title`)
    return [kept<HerChapter>(raw, { title, events, gate })]
  })
  if (out.length > 0) {
    const loose = RUNGS.filter((r) => !placed.has(r))
    if (loose.length > 0 && placed.size > 0) f.notes.push(`${at}: ${loose.join(', ')} ${loose.length === 1 ? 'is' : 'are'} in none of her chapters`)
  }
  return out
}

/** cast.json: who the pack holds, in its order, each with what's given of her; the opening and the welcome list. */
export function checkCast(raw: unknown, ctx: Pick<StoryContext, 'isGood' | 'exported'> = {}): Read<Cast> {
  const f = findings()
  if (raw === undefined) { f.notes.push('No cast: the pack holds no characters'); return { value: { umas: [] }, ...f } }
  if (!isObject(raw)) { f.errors.push('Not a cast file (an object with umas); no characters are read'); return { value: { umas: [] }, ...f } }
  if (raw.umas !== undefined && !Array.isArray(raw.umas)) f.errors.push('umas is a list; no characters are read')
  const list = Array.isArray(raw.umas) ? (raw.umas as unknown[]) : []
  if (raw.umas === undefined) f.notes.push('No umas: the cast is empty')
  const seen = new Set<string>()
  const sub: StoryContext = { ...ctx, umas: new Set(list.flatMap((x) => (isObject(x) && typeof x.characterId === 'string' ? [x.characterId] : []))) }
  const umas = list.flatMap((u, i): CastEntry[] => {
    const at = `Uma ${i + 1}`
    if (!isObject(u) || typeof u.characterId !== 'string' || !CHARACTER_ID.test(u.characterId)) {
      f.errors.push(`${at}: no characterId (master data’s id, a positive integer); skipped`)
      return []
    }
    const id = u.characterId
    const it = `${at} (${id})`
    if (seen.has(id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
    seen.add(id)
    if (ctx.exported && !ctx.exported.has(id)) f.notes.push(`${it}: not in the Studio export`)
    const entry = kept<CastEntry>(u, {
      outfitId: field(u, 'outfitId', (v) => (typeof v === 'string' && CHARACTER_ID.test(v) ? v : undefined), it, f, 'is an outfit id'),
      calling: field(u, 'calling', (v) => (oneOf(CALLINGS, v) ? v : undefined), it, f, `is one of ${CALLINGS.join(', ')}`),
      arrives: field(u, 'arrives', readArrival, it, f, 'is the opening, a chapter, a festival (and a year), the Dorm’s beds, or after an event'),
      birthday: field(u, 'birthday', (v) => (realDate(v) ? { month: v.month, day: v.day } : undefined), it, f, 'is { month: 1–12, day } on a real date'),
      meet: u.meet === undefined ? undefined : readTrigger(u.meet, `${it} meet`, f, sub),
      chapters: u.chapters === undefined ? undefined : readChapters(u.chapters, it, f, sub),
    })
    if (u.outfitId == null) f.notes.push(`${it}: no outfit, so she shows as a lettered disc`)
    if (entry.arrives?.kind === 'chapter' && entry.arrives.chapter > 8) f.notes.push(`${it}: chapter ${entry.arrives.chapter} isn’t one the farm reaches`)
    if (entry.arrives?.kind === 'beds' && entry.arrives.dormLevel > 8) f.notes.push(`${it}: the Dorm has 8 levels, so level ${entry.arrives.dormLevel} never comes`)
    if (u.paragraph !== undefined && typeof u.paragraph === 'string') f.notes.push(...lineNotes(u.paragraph, it, false))
    return [entry]
  })
  const cast = new Set(umas.map((u) => u.characterId))
  const listed = (key: 'opening' | 'welcome', words: string): string[] | undefined => {
    if (raw[key] === undefined) return undefined
    const ids = idList(raw[key], key, f, (id) => CHARACTER_ID.test(id), 'character ids')
    for (const id of ids ?? []) if (!cast.has(id)) f.notes.push(`${key}: ${id} isn’t in the cast; ${words}`)
    return ids
  }
  const value = kept<Cast>(raw, {
    umas,
    opening: listed('opening', 'the opening skips her'),
    welcome: listed('welcome', 'she has no cast entry yet'),
  })
  return { value, ...f }
}

// --- The ties -----------------------------------------------------------------------------------------------------------

/** ties.json: each tie between two characters, once; its kind, strength and line when given. */
export function checkTies(raw: unknown, ctx: StoryContext): Read<Ties> {
  const f = findings()
  if (raw === undefined) return { value: { ties: [] }, ...f }
  if (!isObject(raw) || !Array.isArray(raw.ties)) { f.errors.push('Not a ties file (an object with a ties list); no ties are read'); return { value: { ties: [] }, ...f } }
  const pairs = new Set<string>()
  const ties = (raw.ties as unknown[]).flatMap((t, i): Tie[] => {
    const at = `Tie ${i + 1}`
    if (!isObject(t) || typeof t.a !== 'string' || typeof t.b !== 'string' || !CHARACTER_ID.test(t.a) || !CHARACTER_ID.test(t.b) || t.a === t.b) {
      f.errors.push(`${at}: a tie names two different characters, a and b; skipped`)
      return []
    }
    const key = [t.a, t.b].sort().join('|')
    if (pairs.has(key)) { f.errors.push(`${at}: ${t.a} and ${t.b} are tied already; skipped`); return [] }
    pairs.add(key)
    for (const side of [t.a, t.b]) if (!ctx.umas.has(side)) f.notes.push(`${at}: ${side} isn’t in the cast, so the tie never starts`)
    const line = t.line === undefined ? undefined : shown(t.line, LINE_LIMITS.tieLine, at, f) ? t.line : undefined
    if (t.line !== undefined && line === undefined) f.errors[f.errors.length - 1] += '; the line is skipped'
    return [kept<Tie>(t, {
      kind: field(t, 'kind', (v) => (oneOf(TIE_KINDS, v) ? v : undefined), at, f, `is one of ${TIE_KINDS.join(', ')}`),
      strength: field(t, 'strength', (v) => (v === 1 || v === 2 || v === 3 ? v : undefined), at, f, 'is 1–3'),
      line,
    })]
  })
  return { value: kept<Ties>(raw, { ties }), ...f }
}

// --- Her bible ----------------------------------------------------------------------------------------------------------

function readBeatTrigger(v: unknown, ctx: StoryContext, isGood: (id: string) => boolean, proposed: ReadonlySet<string>, at: string, f: Findings): Trigger | undefined {
  if (!isObject(v)) return undefined
  switch (v.kind) {
    case 'hearts': return { kind: 'hearts' }
    case 'working': return oneOf(ACTIVITIES, v.activity) ? { kind: 'working', activity: v.activity } : undefined
    case 'item':
      if (typeof v.good !== 'string') return undefined
      if (!isGood(v.good)) f.notes.push(`${at}: she waits for ${v.good}${proposed.has(v.good) ? ', a proposed good' : ''}, which isn’t in the game yet`)
      return { kind: 'item', good: v.good }
    case 'bond':
      if (typeof v.with !== 'string' || !isInt(v.level, 1)) return undefined
      if (!ctx.umas.has(v.with)) f.notes.push(`${at}: a bond with ${v.with}, who isn’t in the cast, never forms`)
      if (v.level > 5) f.notes.push(`${at}: bonds reach level 5, so level ${v.level} never holds`)
      return { kind: 'bond', with: v.with, level: v.level }
    case 'chapter':
      if (!isInt(v.chapter, 1)) return undefined
      if (v.chapter > 8) f.notes.push(`${at}: chapter ${v.chapter} isn’t one the farm reaches`)
      return { kind: 'chapter', chapter: v.chapter }
    default: return undefined
  }
}

function readTogether(v: unknown, ctx: StoryContext, isGood: (id: string) => boolean, at: string, f: Findings): Together | undefined {
  if (!isObject(v)) return undefined
  switch (v.kind) {
    case 'talk': return { kind: 'talk' }
    case 'work': return oneOf(ACTIVITIES, v.activity) ? { kind: 'work', activity: v.activity } : undefined
    case 'date': return oneOf(DATE_GAMES, v.game) ? { kind: 'date', game: v.game } : undefined
    case 'gift':
      if (typeof v.good !== 'string') return undefined
      if (!isGood(v.good)) f.notes.push(`${at}: the gift ${v.good} isn’t a good in the game yet`)
      return { kind: 'gift', good: v.good }
    case 'help':
      if (typeof v.with !== 'string') return undefined
      if (!ctx.umas.has(v.with)) f.notes.push(`${at}: help names ${v.with}, who isn’t in the cast`)
      return { kind: 'help', with: v.with }
    default: return undefined
  }
}

function readUnlock(v: unknown, isGood: (id: string) => boolean, proposed: ReadonlySet<string>, at: string, f: Findings): Unlock | undefined {
  if (!isObject(v)) return undefined
  if (v.kind === 'item' && typeof v.good === 'string') {
    if (!isGood(v.good)) f.notes.push(`${at}: the unlock ${v.good}${proposed.has(v.good) ? ' (proposed)' : ''} isn’t a good in the game yet; its card shows, nothing is added`)
    return { kind: 'item', good: v.good }
  }
  if (v.kind === 'place' && oneOf(STORY_PLACES, v.place)) return { kind: 'place', place: v.place }
  if (v.kind === 'perk' && isText(v.perk) && v.perk.length <= LINE_LIMITS.perk) return { kind: 'perk', perk: v.perk }
  return undefined
}

function readBeats(v: unknown, ctx: StoryContext, isGood: (id: string) => boolean, proposed: ReadonlySet<string>, f: Findings): Beat[] | undefined {
  if (!Array.isArray(v)) { f.errors.push('route is a list of beats; skipped'); return undefined }
  const ids = new Set<string>()
  return v.flatMap((b, i): Beat[] => {
    if (!isObject(b) || !isText(b.id)) { f.errors.push(`Beat ${i + 1}: no id; skipped`); return [] }
    const bt = `Beat ${b.id}`
    if (ids.has(b.id)) { f.errors.push(`${bt}: twice; the later one is skipped`); return [] }
    ids.add(b.id)
    if (!RUNGS.includes(b.id)) f.notes.push(`${bt}: not a rung the game plays (${RUNGS.join(', ')}); kept for the story`)
    const text = (key: 'beat' | 'hint', max: number, what: string): string | undefined => {
      if (b[key] === undefined) return undefined
      if (shown(b[key], max, `${bt} ${key}`, f, false, what)) return b[key] as string
      f.errors[f.errors.length - 1] += '; skipped'
      return undefined
    }
    return [kept<Beat>(b, {
      trigger: field(b, 'trigger', (t) => readBeatTrigger(t, ctx, isGood, proposed, bt, f), bt, f, 'is hearts, working, item, bond or chapter (never a clock, the weather, a season or a festival)'),
      place: field(b, 'place', (p) => (oneOf(STORY_PLACES, p) ? p : undefined), bt, f, 'is one of the game’s places'),
      together: field(b, 'together', (t) => readTogether(t, ctx, isGood, bt, f), bt, f, 'is talk, work, date, gift or help'),
      unlock: field(b, 'unlock', (u) => readUnlock(u, isGood, proposed, bt, f), bt, f, 'is an item, a place or a perk in words'),
      beat: text('beat', LINE_LIMITS.caption, 'caption'),
      hint: text('hint', LINE_LIMITS.hint, 'hint'),
    })]
  })
}

function readGifts(v: unknown, isGood: (id: string) => boolean, f: Findings): Gifts | undefined {
  if (!isObject(v)) return undefined
  const proposed = new Set(Array.isArray(v.proposed) ? v.proposed.filter((g): g is string => typeof g === 'string') : [])
  const good = (g: string, at: string) => { if (!isGood(g)) f.notes.push(`${at}: ${g} isn’t a good in the game${proposed.has(g) ? ' yet (proposed)' : ''}, so she finds it neutral`) }
  let loved: string | undefined
  if (v.loved !== undefined) {
    if (typeof v.loved === 'string') { loved = v.loved; good(v.loved, 'gifts.loved') } else f.errors.push('gifts.loved is a goods id; skipped')
  }
  const list = (key: 'liked' | 'disliked'): string[] | undefined => {
    if (v[key] === undefined) return undefined
    const ids = idList(v[key], `gifts.${key}`, f, (id) => id.length > 0, 'goods ids')
    for (const g of ids ?? []) good(g, `gifts.${key}`)
    return ids
  }
  const liked = list('liked')
  const disliked = list('disliked')
  const all = [...(loved ? [loved] : []), ...(liked ?? []), ...(disliked ?? [])]
  for (const g of new Set(all)) if (all.filter((x) => x === g).length > 1) f.notes.push(`gifts: ${g} is in two lists; loved, then liked, then disliked wins`)
  return kept<Gifts>(v, { loved, liked, disliked })
}

function readChats(v: unknown, f: Findings): ChatSets | undefined {
  if (!isObject(v)) return undefined
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(v)) if (!oneOf(CHAT_SETS, key)) f.notes.push(`chats.${key}: not a chat set the game reads (friend, partner, spouse); kept`)
  for (const set of CHAT_SETS) {
    const lines = v[set]
    if (lines === undefined) continue
    if (!Array.isArray(lines)) { f.errors.push(`chats.${set} is a list of lines; skipped`); out[set] = undefined; continue }
    out[set] = lines.filter((line, i) => shown(line, LINE_LIMITS.chat, `chats.${set} ${i + 1}`, f) || (f.errors[f.errors.length - 1] += '; skipped', false))
  }
  return kept<ChatSets>(v, out)
}

function readKeepsake(v: unknown, f: Findings): Keepsake | undefined {
  if (!isObject(v)) return undefined
  const text = (key: 'name' | 'line', max: number): string | undefined => {
    if (v[key] === undefined) return undefined
    if (shown(v[key], max, `keepsake.${key}`, f, false, key)) return v[key] as string
    f.errors[f.errors.length - 1] += '; skipped'
    return undefined
  }
  return kept<Keepsake>(v, { name: text('name', LINE_LIMITS.keepsakeName), line: text('line', LINE_LIMITS.keepsakeLine) })
}

function readWedding(v: unknown, f: Findings): WeddingPlan | undefined {
  if (!isObject(v) || !Array.isArray(v.places)) return undefined
  const places = idList(v.places, 'wedding.places', f, (p) => oneOf(STORY_PLACES, p), 'the game’s places') as StoryPlace[] | undefined
  if (places && places.length === 0) f.notes.push('wedding.places: none the game reads, so the farm’s places play')
  return kept<WeddingPlan>(v, { places })
}

/** umas/<id>.json: her bible, each part the game reads checked on its own. */
export function checkBible(raw: unknown, id: string, ctx: StoryContext): Read<UmaBible | null> {
  const f = findings()
  if (!isObject(raw)) { f.errors.push('Not a bible (an object); none is read'); return { value: null, ...f } }
  const isGood = ctx.isGood ?? isGoodId
  if (raw.characterId !== undefined && raw.characterId !== id) f.notes.push(`its characterId is ${String(raw.characterId)}; the game reads it as ${id}’s, by its file’s name`)
  if (!ctx.umas.has(id)) f.notes.push(`${id} isn’t in the cast, so the game never reads her bible`)
  const gifts = field(raw, 'gifts', (v) => readGifts(v, isGood, f), 'gifts', f, 'is { loved, liked, disliked }')
  const proposed = new Set(Array.isArray(gifts?.proposed) ? gifts.proposed : [])
  const value = kept<UmaBible>(raw, {
    characterId: id,
    favouriteLine: field(raw, 'favouriteLine', (v) => (oneOf(FAVOURITE_LINES, v) ? v : undefined), 'favouriteLine', f, `is one of ${FAVOURITE_LINES.join(', ')}`),
    gifts,
    route: raw.route === undefined ? undefined : readBeats(raw.route, ctx, isGood, proposed, f),
    chats: field(raw, 'chats', (v) => readChats(v, f), 'chats', f, 'is { friend, partner, spouse }'),
    keepsake: field(raw, 'keepsake', (v) => readKeepsake(v, f), 'keepsake', f, 'is { name, line }'),
    petName: field(raw, 'petName', (v) => {
      if (!shown(v, LINE_LIMITS.petName, 'petName', f, true, 'name')) { f.errors.pop(); return undefined }
      if (/[{}]/.test(v)) f.notes.push('petName: no placeholder (it’s what she calls you)')
      return v
    }, 'petName', f, `is 1–${LINE_LIMITS.petName} characters`),
    wedding: field(raw, 'wedding', (v) => readWedding(v, f), 'wedding', f, 'is { places: [places] }'),
    wishes: field(raw, 'wishes', (v) => idList(v, 'wishes', f, (w) => oneOf(WISHES, w), WISHES.join(' and ')) as Wish[] | undefined, 'wishes', f, `is a list of ${WISHES.join(' and ')}`),
  })
  return { value, ...f }
}

/** Her bible agrees with her tags, when she has both: notes. */
export function bibleTagNotes(bible: UmaBible, tags: TagEntry): string[] {
  const pairs: [string, unknown, unknown][] = [['favouriteLine', bible.favouriteLine, tags.favouriteLine], ['season', bible.season, tags.season],
    ['festival', bible.festival, tags.festival], ['loved', bible.gifts?.loved, tags.loved]]
  return pairs.filter(([, a, b]) => a !== b).map(([key, a, b]) => `${key}: the bible says ${String(a)}, the tag sheet ${String(b)}`)
}

/** tags.json, the sandbox's: one entry a cast Uma, each value valid and with its reason. Notes only: the game never
 * reads it. */
export function tagNotes(tags: unknown, ctx: StoryContext): string[] {
  if (!isObject(tags) || !Array.isArray(tags.tags)) return ['Not a tag sheet (version 1, tags)']
  const isGood = ctx.isGood ?? isGoodId
  const notes: string[] = []
  const seen = new Set<string>()
  for (const [i, t] of (tags.tags as unknown[]).entries()) {
    if (!isObject(t) || typeof t.characterId !== 'string') { notes.push(`Tag ${i + 1}: no character id`); continue }
    const at = `Tags ${t.characterId}`
    if (!ctx.umas.has(t.characterId)) notes.push(`${at}: not in the cast`)
    if (seen.has(t.characterId)) notes.push(`${at}: twice`)
    seen.add(t.characterId)
    if (!oneOf(FAVOURITE_LINES, t.favouriteLine)) notes.push(`${at}: favouriteLine is one of ${FAVOURITE_LINES.join(', ')}`)
    if (!oneOf(SEASONS, t.season)) notes.push(`${at}: unknown season`)
    if (!oneOf(FESTIVALS, t.festival)) notes.push(`${at}: unknown festival`)
    if (typeof t.loved !== 'string' || (!isGood(t.loved) && t.proposed !== true)) notes.push(`${at}: loved ${String(t.loved)} isn’t a good; mark it proposed if it’s a new one`)
    const reasons = isObject(t.reasons) ? t.reasons : {}
    for (const key of ['favouriteLine', 'season', 'festival', 'loved'] as const) {
      const reason = reasons[key]
      if (!isText(reason)) notes.push(`${at}: a one-line reason for ${key}`)
      else notes.push(...lineNotes(reason, `${at} ${key}`, false))
    }
  }
  return notes
}

// --- Her route ----------------------------------------------------------------------------------------------------------

/** Her bible's beats a route doesn't script yet (a partial route): listed, never refused. */
export function unscriptedBeats(route: Route, bible: UmaBible | null): string[] {
  const ids = new Set(route.events.map((e) => e.id))
  return (bible?.route ?? []).filter((b) => !ids.has(b.id)).map((b) => b.id)
}

/** routes/<id>.json: her scripted events, each read on its own; an event with an error is skipped, the rest play. */
export function checkRoute(raw: unknown, id: string, bible: UmaBible | null, ctx: StoryContext): Read<Route | null> {
  const f = findings()
  if (!isObject(raw) || !Array.isArray(raw.events)) { f.errors.push('Not a route (an object with an events list); none is read'); return { value: null, ...f } }
  if (raw.characterId !== undefined && raw.characterId !== id) f.notes.push(`its characterId is ${String(raw.characterId)}; the game reads it as ${id}’s, by its file’s name`)
  if (!ctx.umas.has(id)) f.notes.push(`${id} isn’t in the cast, so the game never plays her route`)
  const sc: StepContext = { speakers: new Set<string>([...ctx.umas, ...CAST_IDS]), isGood: ctx.isGood ?? isGoodId }
  const ids = new Set<string>()
  const events = (raw.events as unknown[]).flatMap((e, i): Route['events'] => {
    if (!isObject(e) || !isText(e.id)) { f.errors.push(`Event ${i + 1}: no id; skipped`); return [] }
    const where = `Event ${e.id}`
    if (ids.has(e.id)) { f.errors.push(`${where}: twice; the later one is skipped`); return [] }
    ids.add(e.id)
    const own = findings()
    checkSteps(e.steps, where, sc, own)
    f.notes.push(...own.notes)
    if (own.errors.length > 0) {
      f.errors.push(...own.errors.map((x, k) => (k === own.errors.length - 1 ? `${x} (the event is skipped)` : x)))
      return []
    }
    if (!RUNGS.includes(e.id)) f.notes.push(`${where}: not a rung the game plays; kept for the story`)
    f.notes.push(...eventNotes(e.id, e.steps, bible))
    return [kept<Route['events'][number]>(e, {})]
  })
  if (events.length > 0 && !events.some((e) => e.id === ARRIVAL)) f.notes.push('No arrival scene: the game’s own short one plays')
  return { value: kept<Route>(raw, { events }), ...f }
}

// --- A pair's conversations ---------------------------------------------------------------------------------------------

/** pairs/<a>-<b>.json: a tie's conversations, one a bond level; a level with an error is skipped, the rest play. */
export function checkPair(raw: unknown, ctx: StoryContext): Read<PairConversations | null> {
  const f = findings()
  if (!isObject(raw) || typeof raw.a !== 'string' || typeof raw.b !== 'string' || !Array.isArray(raw.levels)) {
    f.errors.push('Not a pair (an object with a, b and a levels list); none is read')
    return { value: null, ...f }
  }
  for (const side of [raw.a, raw.b]) if (!ctx.umas.has(side)) f.notes.push(`${side} isn’t in the cast`)
  const speakers = new Set<string>([raw.a, raw.b])
  const sc: StepContext = { speakers, isGood: ctx.isGood ?? isGoodId }
  const seen = new Set<number>()
  const levels = (raw.levels as unknown[]).flatMap((l, i): PairConversations['levels'] => {
    if (!isObject(l) || !isInt(l.hearts)) { f.errors.push(`Level ${i + 1}: hearts names its bond level; skipped`); return [] }
    const at = `Level ${l.hearts}`
    if (seen.has(l.hearts)) { f.errors.push(`${at}: written twice; the later one is skipped`); return [] }
    seen.add(l.hearts)
    if (l.hearts < 1 || l.hearts > 5) f.notes.push(`${at}: bonds reach levels 1–5, so it never plays`)
    const own = findings()
    checkSteps(l.steps, at, sc, own)
    f.notes.push(...own.notes)
    if (own.errors.length > 0) { f.errors.push(...own.errors.map((x, k) => (k === own.errors.length - 1 ? `${x} (the level is skipped)` : x))); return [] }
    if (allSteps(l.steps).some(hasAnswer)) f.notes.push(`${at}: only the confession’s answers count`)
    const place = l.place === undefined ? undefined : oneOf(STORY_PLACES, l.place) ? l.place : undefined
    if (l.place !== undefined && place === undefined) f.errors.push(`${at}: place is one of the game’s places; skipped`)
    return [kept<PairConversations['levels'][number]>(l, { place })]
  })
  if (levels.length === 0) f.notes.push('No conversation at any bond level')
  return { value: kept<PairConversations>(raw, { levels }), ...f }
}

// --- The household ------------------------------------------------------------------------------------------------------

/** household.json: its scenes at 5, 10 and 15 married, house lines, and the finale, each part read on its own. An `each`
 * beat is a cast Uma's (she and the town speak); `open` and `close` speak through narration and the town only. */
export function checkHousehold(raw: unknown, ctx: StoryContext): Read<Household | null> {
  const f = findings()
  if (!isObject(raw)) { f.errors.push('Not a household (an object); none is read'); return { value: null, ...f } }
  const isGood = ctx.isGood ?? isGoodId
  const town: StepContext = { speakers: new Set<string>(CAST_IDS), isGood }
  /** A run of steps on its own: its findings in `f`, undefined (skipped) with an error. */
  const run = (steps: unknown, where: string, sc: StepContext): Step[] | undefined => {
    if (steps === undefined) return undefined
    const own = findings()
    checkSteps(steps, where, sc, own)
    f.notes.push(...own.notes)
    if (allSteps(steps).some(hasAnswer)) f.notes.push(`${where}: only the confession’s answers count`)
    if (own.errors.length === 0) return steps as Step[]
    f.errors.push(...own.errors.map((x, k) => (k === own.errors.length - 1 ? `${x} (skipped)` : x)))
    return undefined
  }
  const each = (v: unknown, where: string): Record<string, Step[]> | undefined => {
    if (v === undefined) return undefined
    if (!isObject(v)) { f.errors.push(`${where}: each is { <characterId>: steps }; skipped`); return undefined }
    const out: Record<string, Step[]> = {}
    for (const [id, steps] of Object.entries(v)) {
      if (!ctx.umas.has(id)) f.notes.push(`${where}, ${id}: not in the cast, so it never plays`)
      const read = run(steps, `${where}, ${id}`, { speakers: new Set([id, ...CAST_IDS]), isGood })
      if (read) out[id] = read
    }
    return out
  }
  let scenes: HouseholdScene[] | undefined
  if (raw.scenes !== undefined) {
    if (!Array.isArray(raw.scenes)) f.errors.push('scenes is a list; skipped')
    else {
      const ats = new Set<number>()
      scenes = (raw.scenes as unknown[]).flatMap((scene, i): HouseholdScene[] => {
        if (!isObject(scene) || !isInt(scene.at)) { f.errors.push(`Household scene ${i + 1}: at names its count; skipped`); return [] }
        const where = `Household scene at ${scene.at}`
        if (!(HOUSEHOLD_SCENES as readonly number[]).includes(scene.at)) { f.notes.push(`${where}: the game plays household scenes at ${HOUSEHOLD_SCENES.join(', ')} married; skipped`); return [] }
        if (ats.has(scene.at)) { f.errors.push(`${where}: written twice; the later one is skipped`); return [] }
        ats.add(scene.at)
        return [kept<HouseholdScene>(scene, { open: run(scene.open, `${where} open`, town), each: each(scene.each, `${where} each`), close: run(scene.close, `${where} close`, town) })]
      })
    }
  }
  let houseLines: Record<string, string[]> | undefined
  if (raw.houseLines !== undefined) {
    if (!isObject(raw.houseLines)) f.errors.push('houseLines is { <characterId>: lines }; skipped')
    else {
      houseLines = {}
      for (const [id, lines] of Object.entries(raw.houseLines)) {
        if (!ctx.umas.has(id)) f.notes.push(`houseLines ${id}: not in the cast`)
        if (!Array.isArray(lines)) { f.errors.push(`houseLines ${id}: a list of lines; skipped`); continue }
        houseLines[id] = lines.filter((line, i) => shown(line, LINE_LIMITS.houseLine, `houseLines ${id} ${i + 1}`, f) || (f.errors[f.errors.length - 1] += '; skipped', false))
      }
    }
  }
  let finale: Finale | undefined
  if (raw.finale !== undefined) {
    const v = raw.finale
    if (!isObject(v)) f.errors.push('finale is an object; skipped')
    else {
      let play: Play | undefined
      if (v.play !== undefined) {
        const own = findings()
        checkSteps([{ play: v.play }], 'The finale’s play', town, own)
        f.notes.push(...own.notes)
        if (own.errors.length > 0) f.errors.push(...own.errors.map((x) => `${x}; the play is skipped`))
        else play = v.play as Play
      }
      finale = kept<Finale>(v, { open: run(v.open, 'The finale open', town), play, each: each(v.each, 'The finale each'), close: run(v.close, 'The finale close', town) })
    }
  }
  return { value: kept<Household>(raw, { scenes, houseLines, finale }), ...f }
}
