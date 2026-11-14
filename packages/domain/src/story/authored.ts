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
// is full, plus at most one setup the player controls (she works a place today, an item is in the Warehouse, a bond),
// never an hour, the weather, a season or a festival. Routes run side by side and end in a spouse ladder.
import { DAYS_PER_SEASON, FESTIVALS as GAME_FESTIVALS, festivalDayOfYear, isFestivalId, SEASON_NAMES } from '../farm/calendar'
import { FARM_PLACE_IDS, type FarmPlaceId } from '../farm/places'
import { ACTIVITIES, type Activity } from '../farm/ranks'
import { isGoodId } from '../goods/ids'
import { CAST_IDS, isCastId } from './cast'
import { EXPRESSION_IDS, isStoryOutfit, STORY_OUTFITS, type Expression, type StoryOutfit } from './look'
import { ILLUSTRATION_ID } from '../save/gallery'
import { NO_ILLUSTRATION } from './illustrations'

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
/** The town's spots: where its people stand, and where a character is out on a day (the town's own names are
 * `placeholders.ts`'; the story's `town.json` may name them). */
export const SPOT_IDS = ['plaza', 'market', 'cafe', 'harbour', 'library', 'track'] as const
export type SpotId = typeof SPOT_IDS[number]
/** The town's shops and offices, each kept by one of the town's people at her post: the general store, the rancher's,
 * the mayor's office and the smithy. */
export const SHOP_IDS = ['store', 'rancher', 'mayor', 'smith'] as const
export type ShopId = typeof SHOP_IDS[number]
/** The game's own locations on the town map: the six spots, then the shops and offices. `town.json`'s `locations` add
 * the homes and workplaces the story writes. */
export const GAME_LOCATIONS: readonly string[] = [...SPOT_IDS, ...SHOP_IDS]
/** What a location of the story's own is, for the map's grouping: a home, a workplace, or another spot. */
export const LOCATION_KINDS = ['home', 'work', 'spot'] as const
export type LocationKind = typeof LOCATION_KINDS[number]
/** The ladders a beat sits on: her arrival, then the route's six. */
export const LADDERS = ['arrival', 'friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
/** The emote menu: the 22 expressions (`look.ts`), each falling back to its nearest while her art hasn't drawn it. */
export const EMOTES: readonly Expression[] = EXPRESSION_IDS
export const TONES = ['warm', 'playful', 'honest'] as const

/** The date games: short shared activities a date is played as. */
export const DATE_GAMES = ['fishing', 'cooking', 'stargazing', 'footrace', 'dance', 'picnic', 'market', 'boat', 'walk', 'crafting'] as const

/** The rungs the game plays an event at: her arrival scene ("event zero"), ten friendship events, the confession, ten
 * romance events, the proposal, the wedding, and three on the spouse ladder after it (S1, S3, S5). The story writes any of
 * them, in any order; the rest play the default story's (`default-story.ts`). */
export const ARRIVAL = 'arrival'
export const RUNGS: readonly string[] = [
  ARRIVAL, ...Array.from({ length: 10 }, (_, i) => `f${i + 1}`), 'confession', ...Array.from({ length: 10 }, (_, i) => `r${i + 1}`), 'proposal', 'wedding', 's1', 's3', 's5',
]
/** Her life's events past the rungs: the invitation to work, the wedding night, moving in, and married life 2 and 4. They
 * pay nothing. */
export const LIFE_EVENTS = ['invited-to-work', 'wedding-night', 'moving-in', 's2', 's4'] as const
/** Her occasions, on their day: her birthday, New Year's, the game's five festivals and the Fishing Derby's night
 * (`derby-night`). They pay nothing. The calendar plays `new-year`, `flower-show` and `derby-night` (`romance/occasions.ts`). */
export const OCCASIONS = ['birthday', 'new-year', 'flower-show', 'fishing-derby', 'derby-night', 'cooking-contest', 'animal-show', 'harvest-cup'] as const
/** The evenings' scenes: a hangout's for each kind a friend can spend (`hangout-<kind>`), a date's for each kind
 * (`date-<kind>`), and the two evenings of their own, Dinner in town and A night in. Lines only: the evening's play is
 * its game. */
export const EVENING_SCENES = [
  'hangout-walk', 'hangout-fishing', 'hangout-picnic', 'hangout-market', 'hangout-cooking', 'hangout-festival',
  'date-walk', 'date-fishing', 'date-picnic', 'date-market', 'date-cooking', 'date-crafting', 'date-stargazing', 'date-dance', 'date-boat', 'date-footrace',
  'date-festival', 'dinner-in-town', 'a-night-in',
] as const
/** Every event a route may write: the rungs, her life's events, her occasions and the evenings' scenes. Each one it
 * leaves out plays the default story's (`default-story.ts`). */
export const STORY_EVENTS: readonly string[] = [...RUNGS, ...LIFE_EVENTS, ...OCCASIONS, ...EVENING_SCENES]

export type StoryPlace = typeof STORY_PLACES[number]
export type Festival = typeof FESTIVALS[number]
export type Season = typeof SEASONS[number]
export type Calling = typeof CALLINGS[number]
export type TieKind = typeof TIE_KINDS[number]
export type Ladder = typeof LADDERS[number]
export type Emote = Expression
export type Tone = typeof TONES[number]
export type DateGame = typeof DATE_GAMES[number]

// --- The cast and the ties ----------------------------------------------------------------------------------------------

/** The trigger menu: how her story begins (her `meet`), and what one of her chapters may ask of the farm (its `gate`).
 * One menu for both, a gate taking the farm's kinds, a season and a festival (`GATE_KINDS`). Meeting her
 * (`romance/meeting.ts`) acts on `meet`; her chapters (`romance/chapters.ts`) on `gate`. */
export type StoryTrigger =
  /** Talk with her on this many different days. */
  | { kind: 'talks'; days: number }
  /** Give her a gift she likes, or this good. */
  | { kind: 'gift'; good?: string }
  /** Talk with her at one of the town's spots. */
  | { kind: 'spot'; spot: SpotId }
  /** Talk with her in a season. */
  | { kind: 'season'; season: Season }
  /** Talk with her on a festival: one of the game's five, or one of the story's own (`world.json`'s). */
  | { kind: 'festival'; festival: string }
  /** Reach a Farm Rank. */
  | { kind: 'farm-rank'; rank: number }
  /** Have a place built. */
  | { kind: 'built'; place: FarmPlaceId }
  /** Ship this many of a good, in all. */
  | { kind: 'shipped'; good: string; count: number }
  /** After another character's event plays: `<characterId>:<eventId>`, or an event id (anyone's). */
  | { kind: 'event'; after: string }
export const TRIGGER_KINDS = ['talks', 'gift', 'spot', 'season', 'festival', 'farm-rank', 'built', 'shipped', 'event'] as const
/** The kinds a chapter's gate takes: what the farm holds, a season and a festival. The town's (talks, a gift, a spot)
 * are meeting her own: a gate of one is skipped. */
export const GATE_KINDS: readonly StoryTrigger['kind'][] = ['built', 'farm-rank', 'shipped', 'event', 'season', 'festival']
/** The Farm Rank's top. */
const TOP_FARM_RANK = 10

/** One of her chapters: its title, the rungs of hers it holds (in order), and optionally a gate from the trigger menu
 * that the farm meets before its events can play. */
export interface HerChapter { title?: string; events?: string[]; gate?: StoryTrigger }

/** A birthday as a date: month 1–12 and a real day of it. */
export interface CastBirthday { month: number; day: number }
/** When a place in her life holds: on these days of the season (1–12) and in these seasons; either left out is every one. */
export interface LifeWhen { days?: number[]; seasons?: Season[] }
/** Her part-time job: what she does, in a few words, and where (a location of the town map), on its days. */
export interface HerJob extends LifeWhen { what?: string; at: string }
/** One stop of her routine: where she is (a location of the town map), when. */
export interface RoutineStop extends LifeWhen { at: string }
/** One character of the cast. Only her `characterId` (master data's) is needed; everything else is optional. */
export interface CastEntry {
  characterId: string
  /** The one outfit she plays as. */
  outfitId?: string
  calling?: Calling
  /** Only where master data's character set has none: it wins where present. */
  birthday?: CastBirthday
  /** Her trigger to meet, from the trigger menu. */
  meet?: StoryTrigger
  /** Her chapters. */
  chapters?: HerChapter[]
  /** Her favourite of the town's spots: she's out there more often than elsewhere. */
  spot?: SpotId
  /** Her home: a location of the town map (`town.json`'s, usually), where she is when nothing else holds. */
  home?: string
  /** Her part-time job, and where it is. */
  job?: HerJob
  /** Where she is, when: the first stop that holds today wins, before her job and her home. */
  routine?: RoutineStop[]
  /** A sister's name (a sister's id is `s<outfitId>`): master data has none for her, so the pack gives it. */
  name?: string
  /** A short paragraph about her: the story's own (the sandbox shows it). */
  paragraph?: string
}
/** Which state of the Uma Ranker the cast was read from: the board's and the profiles' revisions, and when. */
export interface CastRanker { boardRevision: number; profilesRevision: number; pulledAt: string }
export interface Cast {
  version?: 1
  export?: { file: string; exportedAt: string; tier: string }
  ranker?: CastRanker
  /** Who comes to the farm in the first days, in order: any number. The first joins as the opening ends. */
  welcome?: string[]
  /** The cast, in its order. */
  umas: CastEntry[]
}
/** Where a tie comes from: `real`, a relationship from the real careers, checked against public records,
 * with `from` the id uma-quest's relationships give it (filled once they exist); or `story`, born on the farm. */
export const TIE_SOURCES = ['real', 'story'] as const
export type TieSource = typeof TIE_SOURCES[number]
/** A tie between two characters. Only `a` and `b` are needed: the rest has its placeholder (`placeholders.ts`). */
export interface Tie { a: string; b: string; kind?: TieKind; strength?: 1 | 2 | 3; line?: string; history?: string; source?: TieSource; from?: string }
export interface Ties { version?: 1; ties: Tie[] }

/** One of the town's people: an Uma from master data, by her character id, in one of the town's roles (`game`, a role
 * id of `cast.ts`), with what she does in a line. She lives in town, never on the farm. */
export interface TownPerson { characterId: string; does?: string; game?: string }
/** One of the town's spots, by its id: its name, a line about it, and its keeper (one of the town's people, by her
 * character id or her role's id), who's usually there. */
export interface TownSpot { id: SpotId; name?: string; blurb?: string; keeper?: string }
/** A location the story adds to the town map: a home, a workplace or another spot, by an id of its own (lowercase words
 * joined by `-`), with its name and a line. */
export interface TownLocation { id: string; name: string; line?: string; kind?: LocationKind }
/** town.json: the town's people, its spots, and the locations the story adds. Every part optional. */
export interface Town { version?: 1; people?: TownPerson[]; spots?: TownSpot[]; locations?: TownLocation[] }

// --- Her bible ----------------------------------------------------------------------------------------------------------

/** When a rung is ready: her bar full, plus at most one setup the player controls. Never a clock, the weather, a
 * season or a festival: those may colour a scene's words, never whether it plays. */
export type Trigger =
  | { kind: 'hearts' }
  | { kind: 'working'; activity: Activity }
  | { kind: 'item'; good: string }
  | { kind: 'bond'; with: string; level: number }

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
  /** What she says when you talk with her in town, any number: one a day. Without them, the game's short lines. */
  townLines?: string[]
  /** Her morning greetings as the night's companion (married life), any number: one a morning. Narration before the
   * first quote, then what she says inside the quotes. Without them, the default story's for her temperament. */
  mornings?: string[]
  /** Her lines at the household's meals, any number of each: one as you sit down. Without them, the default story's. */
  meals?: Meals
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
/** Her lines at the household's meals: breakfast and dinner. */
export interface Meals { breakfast?: string[]; dinner?: string[] }
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
  /** Her illustration, full screen, from here on (`illustrations.ts`): one of her scenes by id, or `none` to take it
   * down. Her route's events only. */
  | { illustration: string }
  /** Its steps play only while the flag is set, `else` otherwise: flags change wording only. */
  | { when: string; then: Step[]; else?: Step[] }
/** An event's, a pair level's, a household scene's and the finale's `outfit` is the scene's own: one of the story's
 * outfit ids (`look.ts`), `season` the day's. Without one the scene wears the moment's. */
export interface Route { characterId?: string; events: { id: string; outfit?: StoryOutfit; steps: Step[] }[] }
export interface PairConversations { a: string; b: string; levels: { hearts: number; place?: StoryPlace; outfit?: StoryOutfit; steps: Step[] }[] }

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
export interface HouseholdScene { at: HouseholdAt; outfit?: StoryOutfit; open?: Step[]; each?: Record<string, Step[]>; close?: Step[] }
/** The finale, the Great Harvest: `open`, its play, each spouse's beat in wedding order, then `close`. */
export interface Finale { outfit?: StoryOutfit; open?: Step[]; play?: Play; each?: Record<string, Step[]>; close?: Step[] }
/** household.json: built for a household the author can't know in advance. Every part optional. */
export interface Household {
  scenes?: HouseholdScene[]
  /** A spouse's house lines, said on a morning in her house. Without hers, the templates by temperament stand in. */
  houseLines?: Record<string, string[]>
  finale?: Finale
}

/** opening.json: the start's lines, played once on day 1 after the farmer's name, then Home. Lines only, in a route's
 * steps (`say`, `narrate`, `thought`, `wait`, and `place` for the title line), any number. `about` is the story's own. */
export interface Opening { about?: string; steps: Step[] }
/** The steps the opening plays: lines and pauses, never a pick. */
export const OPENING_STEPS = ['say', 'narrate', 'thought', 'wait', 'place'] as const

// --- The world ------------------------------------------------------------------------------------------------------

/** world.json's names: the town's, the farm's and the region's. Each optional; the game's own words play without. */
export interface WorldNames { town?: string; farm?: string; region?: string }
/** A festival as world.json gives it. One of the game's five by its id is renamed or moved, keeping its game rule; any
 * other id is one of the story's own, added, and needs its name and its day. Its day is a season and a day, 1–12. */
export interface WorldFestival { id: string; name?: string; season?: Season; day?: number; happens?: string }
/** A place's words in world.json: its name and its one line, each optional. */
export interface WorldPlace { name?: string; line?: string }
/** A Town note: a short piece of the world, unlocked once by its trigger from the menu (`NOTE_KINDS`) and kept. One
 * without an unlock is known from the start. */
export interface TownNote { id: string; title: string; lines: string[]; unlock?: StoryTrigger }
/** A day of the story's own in world.json: a holiday or a minor day (a custom, the town's market), on the calendar. */
export const DAY_KINDS = ['holiday', 'minor'] as const
export type DayKind = typeof DAY_KINDS[number]
/** One of the story's days: its id, its name, a holiday or a minor day (minor without one), its season (every season
 * without one), its day of the season, 1–12, or a list of them (a weekly market: `[3, 6, 9, 12]`), and a line. */
export interface WorldDay { id: string; name: string; kind?: DayKind; season?: Season; day: number | number[]; line?: string }
/** world.json: the world the story builds, every part optional. */
export interface World {
  version?: 1
  names?: WorldNames
  /** The farm's past, a few lines: the Diary's first page, "The farm". */
  history?: string[]
  festivals?: WorldFestival[]
  /** The story's holidays and minor days, on the calendar. */
  days?: WorldDay[]
  places?: Partial<Record<FarmPlaceId, WorldPlace>>
  /** A line for each season, on the morning that opens it. */
  seasons?: Partial<Record<Season, string>>
  notes?: TownNote[]
}
/** The trigger kinds a Town note's unlock takes: a spot visited (a talk there), a season, a festival, and what the farm
 * holds (a Farm Rank, a place built, a good shipped, another's event: `<characterId>:arrival` is meeting her). Talks
 * and a gift are meeting her own. */
export const NOTE_KINDS: readonly StoryTrigger['kind'][] = ['spot', 'season', 'festival', 'farm-rank', 'built', 'shipped', 'event']
/** A festival of the story's own, and a Town note: an id in lowercase words joined by `-`. */
export const WORLD_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

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
  /** A line on the town's talk sheet, a morning greeting and a meal's line. */
  townLine: 160,
  /** A sister's name, a town spot's name, and world.json's names (the town, the farm, the region, a place, a festival). */
  name: 40,
  /** A town spot's line, what one of the town's people does, and a location's line. */
  townBlurb: 160,
  /** Her part-time job, in a few words, under her name in town. */
  job: 60,
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
  /** A place's line in its quick look, a season's on its morning, and what happens at a festival. */
  worldLine: 160,
  /** A line of the farm's history, or of a Town note. */
  worldText: 400,
  /** A Town note's title, as the Diary lists it. */
  noteTitle: 40,
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
/** A sister's id: `s` and her outfit's id. A sister is an outfit of an Uma, presented as a character of her own; master
 * data has no character for her, so her name is the pack's and her art her outfit's. */
export const SISTER_ID = /^s[1-9]\d*$/
/** Whether an id is a sister's. */
export const isSister = (id: string): boolean => SISTER_ID.test(id)
/** A sister's outfit: her id without its `s`. */
export const sisterOutfit = (id: string): string => id.slice(1)
/** Anyone the pack may hold: a character id, or a sister's. */
export const STORY_ID = /^(s?)[1-9]\d*$/
/** A flag's name, as the save keeps it. */
const FLAG = /^[a-z0-9][a-z0-9:._-]{0,63}$/

/** Nothing that reads under 18. (The protagonist is a man: a line may say he, her husband, the groom.) */
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
  /** The town's people, by character id (`town.json`'s): they speak in any scene, and a tie may name one. */
  town?: ReadonlySet<string>
  /** The story's own festivals, by id (`world.json`'s): a `festival` trigger may name one. */
  festivals?: ReadonlySet<string>
  /** The town map's locations, by id (the game's and `town.json`'s): her `home`, her job's and her routine's `at` name one. */
  locations?: ReadonlySet<string>
}

/** A line's words: `{farmer}` is the only placeholder, and nothing reads as school. Notes. */
function lineNotes(text: string, where: string): string[] {
  const notes: string[] = []
  for (const [, name] of text.matchAll(PLACEHOLDER)) if (name !== 'farmer') notes.push(`${where}: {${name}} shows as written ({farmer} is the one placeholder)`)
  const school = text.match(SCHOOLISH)
  if (school) notes.push(`${where}: “${school[0]}” reads as school`)
  return notes
}

/** Text the game shows: present, within its screen's length (errors otherwise), and its words' notes. */
function shown(v: unknown, max: number, at: string, f: Findings, what = 'line'): v is string {
  if (!isText(v)) { f.errors.push(`${at}: no ${what}`); return false }
  if (v.length > max) { f.errors.push(`${at}: its ${what} is ${v.length} characters; the screen shows ${max}`); return false }
  f.notes.push(...lineNotes(v, at))
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
      if (!oneOf(SPOT_IDS, v.spot)) return bad(`a spot names one of the town’s spots: ${SPOT_IDS.join(', ')}`)
      return { kind: 'spot', spot: v.spot }
    case 'season':
      if (!oneOf(SEASONS, v.season)) return bad(`a season is one of ${SEASONS.join(', ')}`)
      return { kind: 'season', season: v.season }
    case 'festival':
      if (!oneOf(FESTIVALS, v.festival) && !(typeof v.festival === 'string' && ctx.festivals?.has(v.festival))) {
        return bad(`a festival is one of ${[...FESTIVALS, ...(ctx.festivals ?? [])].join(', ')}`)
      }
      return { kind: 'festival', festival: v.festival as string }
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
/** Who may speak, which goods exist, and whether the scene pays nothing (its choices wording only: her life's events, her
 * occasions, the evenings' scenes). */
interface StepContext {
  speakers: ReadonlySet<string>; isGood: (id: string) => boolean; wording?: boolean
  /** Her own scenes (her route's events), where an `illustration` step shows one of hers. */
  hers?: boolean
}

function checkSteps(steps: unknown, where: string, sc: StepContext, f: Findings, nested = false): void {
  if (!Array.isArray(steps)) { f.errors.push(`${where}: steps are a list`); return }
  if (steps.length === 0) { if (!nested) f.errors.push(`${where}: no steps`); return }
  steps.forEach((step, i) => {
    const at = `${where}, step ${i + 1}`
    if (!isObject(step)) { f.errors.push(`${at}: not a step`); return }
    if ('say' in step) {
      if (!isText(step.say)) f.errors.push(`${at}: say names who speaks`)
      else if (!sc.speakers.has(step.say)) f.notes.push(`${at}: ${step.say} isn’t one who speaks here (one outside the cast and the town’s people shows as “An Uma”)`)
      shown(step.line, LINE_LIMITS.line, at, f)
      if (step.emote !== undefined && !oneOf(EMOTES, step.emote)) f.notes.push(`${at}: the emote ${String(step.emote)} isn’t one of the menu’s ${EMOTES.length}, so her face shows neutral`)
    } else if ('choice' in step) {
      const options = step.choice
      if (!Array.isArray(options) || options.length === 0) { f.errors.push(`${at}: a choice lists its options`); return }
      if (options.length === 1) f.notes.push(`${at}: one option, so there’s nothing to choose`)
      if (options.length > 3) f.notes.push(`${at}: ${options.length} options; more than three crowd the screen`)
      options.forEach((o, k) => {
        const ot = `${at}, option ${k + 1}`
        if (!isObject(o)) { f.errors.push(`${ot}: not an option`); return }
        shown(o.text, LINE_LIMITS.option, ot, f, 'text')
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
      if (!sc.wording && options.length > 1 && !options.some((o) => gains(o) > 0)) f.notes.push(`${at}: no option gains hearts, so each pays the best (+30)`)
    } else if ('play' in step) {
      const p = step.play
      if (!isObject(p) || !(oneOf(DATE_GAMES, p.game) || oneOf(ACTIVITIES, p.game))) { f.errors.push(`${at}: a play names its game (a date game or an activity)`); return }
      if (p.prompt !== undefined) shown(p.prompt, LINE_LIMITS.prompt, at, f, 'prompt')
      if (p.as !== undefined && (p.game !== 'farming' || !oneOf(FARMING_PLAYS, p.as))) f.notes.push(`${at}: as (pick or rhythm) is a farming play’s; it’s ignored here`)
      if (p.good !== undefined) checkSteps(p.good, `${at} good`, sc, f, true)
      if (p.miss !== undefined) checkSteps(p.miss, `${at} miss`, sc, f, true)
    } else if ('narrate' in step) {
      shown(step.narrate, LINE_LIMITS.line, at, f, 'narration')
    } else if ('thought' in step) {
      shown(step.thought, LINE_LIMITS.line, at, f, 'thought')
    } else if ('wait' in step) {
      if (typeof step.wait !== 'number' || !Number.isFinite(step.wait)) f.errors.push(`${at}: wait is a number of ms`)
      else if (step.wait <= 0 || step.wait > 5000) f.notes.push(`${at}: a wait of ${step.wait} ms plays as 0–5000`)
    } else if ('place' in step) {
      if (typeof step.place !== 'string') f.errors.push(`${at}: place names a place`)
      else if (!oneOf(STORY_PLACES, step.place)) f.notes.push(`${at}: ${step.place} isn’t one of the game’s places; its title line shows the words`)
    } else if ('illustration' in step) {
      const v = step.illustration
      if (typeof v !== 'string') f.errors.push(`${at}: illustration names one of her scenes by id, or none`)
      else if (!sc.hers) f.notes.push(`${at}: an illustration shows in her route’s events only, so nothing shows here`)
      else if (v !== NO_ILLUSTRATION && !ILLUSTRATION_ID.test(v)) f.notes.push(`${at}: ${v} isn’t a scene’s id (lowercase words joined by -), so nothing shows`)
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

/** A scene's own `outfit`, read: one of the story's outfit ids, else undefined (the moment's plays): a note for an id
 * the menu doesn't hold, an error for a value that isn't an id. */
function readOutfit(v: unknown, at: string, f: Findings): StoryOutfit | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'string') { f.errors.push(`${at}: outfit is one of the story’s outfit ids; skipped`); return undefined }
  if (isStoryOutfit(v)) return v
  f.notes.push(`${at}: the outfit ${v} isn’t one of ${STORY_OUTFITS.join(', ')}, so the moment’s plays`)
  return undefined
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
  // The usual sizes are a heart event's: her life's events, her occasions and the evenings' scenes pay nothing.
  const limits = BIG_EVENTS.includes(id) ? EVENT_LIMITS.big : EVENT_LIMITS.heart
  if (RUNGS.includes(id) && (counts.choices[0] < limits.choices[0] || counts.choices[1] > limits.choices[1])) {
    notes.push(`${where}: ${counts.choices[0] === counts.choices[1] ? counts.choices[0] : `${counts.choices[0]}–${counts.choices[1]}`} choice points on a path, outside the usual ${limits.choices[0]}–${limits.choices[1]}; each pays`)
  }
  if (RUNGS.includes(id) && counts.plays[1] > limits.plays) notes.push(`${where}: ${plural(counts.plays[1], 'play')}, more than the usual ${limits.plays}; each pays`)
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

function readChapters(v: unknown, at: string, f: Findings, ctx: StoryContext): HerChapter[] | undefined {
  if (!Array.isArray(v)) { f.errors.push(`${at}: chapters is a list; skipped`); return undefined }
  const placed = new Map<string, number>()
  const out = v.flatMap((raw, i): HerChapter[] => {
    const ct = `${at}, chapter ${i + 1}`
    if (!isObject(raw)) { f.errors.push(`${ct}: not a chapter; skipped`); return [] }
    const title = raw.title === undefined ? undefined : shown(raw.title, LINE_LIMITS.chapterTitle, ct, f, 'title') ? raw.title : (f.errors[f.errors.length - 1] += '; skipped', undefined)
    const events = raw.events === undefined ? undefined : idList(raw.events, `${ct} events`, f, (id) => id.length > 0, 'her rungs')
    for (const id of events ?? []) {
      if (!RUNGS.includes(id)) f.notes.push(`${ct}: ${id} isn’t a rung the game plays`)
      if (placed.has(id)) f.notes.push(`${ct}: ${id} is in chapter ${placed.get(id)} too; the first holds it`)
      else placed.set(id, i + 1)
    }
    if (events !== undefined && events.length === 0) f.notes.push(`${ct}: it holds no events`)
    const read = raw.gate === undefined ? undefined : readTrigger(raw.gate, `${ct} gate`, f, ctx)
    const gate = read && !GATE_KINDS.includes(read.kind)
      ? (f.errors.push(`${ct} gate: a chapter’s gate is one of ${GATE_KINDS.join(', ')} (${read.kind} is meeting her own); skipped`), undefined)
      : read
    if (raw.title === undefined) f.notes.push(`${ct}: no title`)
    return [kept<HerChapter>(raw, { title, events, gate })]
  })
  if (out.length > 0) {
    const loose = RUNGS.filter((r) => !placed.has(r))
    if (loose.length > 0 && placed.size > 0) f.notes.push(`${at}: ${loose.join(', ')} ${loose.length === 1 ? 'is' : 'are'} in none of her chapters`)
  }
  return out
}

/** When a place in her life holds, read: its `days` (of the season, 1–12) and `seasons`, each optional. An error skips
 * the field it's in, and the stop holds on every day or season without it. */
function readWhen(raw: Record<string, unknown>, at: string, f: Findings): LifeWhen {
  return {
    days: field(raw, 'days', (v) => (Array.isArray(v) && v.length > 0 && v.every((d) => isInt(d, 1, DAYS_PER_SEASON)) ? [...new Set(v as number[])].sort((a, b) => a - b) : undefined),
      at, f, `is a list of days of the season, 1–${DAYS_PER_SEASON}`),
    seasons: field(raw, 'seasons', (v) => (Array.isArray(v) && v.length > 0 && v.every((x) => oneOf(SEASONS, x)) ? [...new Set(v as Season[])] : undefined),
      at, f, `is a list of seasons: ${SEASONS.join(', ')}`),
  }
}

/** A location of the town map, by id: the game's six spots and four shops, or one `town.json` adds. With no context
 * (a cast read alone), the game's and any well-formed id read. */
function readLocation(v: unknown, at: string, f: Findings, ctx: Pick<StoryContext, 'locations'>): string | undefined {
  if (typeof v === 'string' && (ctx.locations ? ctx.locations.has(v) : GAME_LOCATIONS.includes(v) || WORLD_ID.test(v))) return v
  f.errors.push(`${at}: ${String(v)} isn’t a location of the town map (${GAME_LOCATIONS.join(', ')}, or one of town.json’s locations); skipped`)
  return undefined
}

/** Her life in town, read: her `home`, her `job` and her `routine`. An error skips the field (or the routine's stop)
 * it's in; she's placed by today's draw wherever the story says nothing. */
function readLife(u: Record<string, unknown>, it: string, f: Findings, ctx: Pick<StoryContext, 'locations'>): Pick<CastEntry, 'home' | 'job' | 'routine'> {
  const home = u.home === undefined ? undefined : readLocation(u.home, `${it} home`, f, ctx)
  let job: HerJob | undefined
  if (u.job !== undefined) {
    if (!isObject(u.job)) f.errors.push(`${it} job: { what, at, days, seasons }; skipped`)
    else {
      const place = readLocation(u.job.at, `${it} job`, f, ctx)
      const what = u.job.what === undefined ? undefined : shown(u.job.what, LINE_LIMITS.job, `${it} job`, f, 'what') ? u.job.what as string
        : (f.errors[f.errors.length - 1] += '; skipped', undefined)
      if (place !== undefined) job = kept<HerJob>(u.job, { at: place, what, ...readWhen(u.job, `${it} job`, f) })
    }
  }
  let routine: RoutineStop[] | undefined
  if (u.routine !== undefined) {
    if (!Array.isArray(u.routine)) f.errors.push(`${it} routine: a list of stops, each { at, days, seasons }; skipped`)
    else {
      routine = (u.routine as unknown[]).flatMap((stop, k): RoutineStop[] => {
        const where = `${it} routine ${k + 1}`
        if (!isObject(stop)) { f.errors.push(`${where}: a stop is { at, days, seasons }; skipped`); return [] }
        const place = readLocation(stop.at, where, f, ctx)
        if (place === undefined) return []
        const when = readWhen(stop, where, f)
        if (when.days === undefined && when.seasons === undefined) f.notes.push(`${where}: no days or seasons, so it holds every day and the stops after it never do`)
        return [kept<RoutineStop>(stop, { at: place, ...when })]
      })
    }
  }
  return { home, job, routine }
}

/** cast.json: who the pack holds, in its order, each with what's given of her and her life in town. A character is master
 * data's (her `characterId`) or a sister (`s<outfitId>`, with her `name`). The welcome list and her trigger to meet are
 * retired (meeting her is introducing yourself in town): both are still read, and noted. */
export function checkCast(raw: unknown, ctx: Pick<StoryContext, 'isGood' | 'exported' | 'town' | 'festivals' | 'locations'> = {}): Read<Cast> {
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
    if (!isObject(u) || typeof u.characterId !== 'string' || !STORY_ID.test(u.characterId)) {
      f.errors.push(`${at}: no characterId (master data’s id, a positive integer, or a sister’s s<outfitId>); skipped`)
      return []
    }
    const id = u.characterId
    const it = `${at} (${id})`
    if (seen.has(id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
    seen.add(id)
    if (ctx.exported && !ctx.exported.has(id)) f.notes.push(`${it}: not in the Studio export`)
    const sister = isSister(id)
    if (ctx.town?.has(id)) f.notes.push(`${it}: she’s one of the town’s people too, so she keeps her role in town and is never out among the rest`)
    if (sister && u.outfitId != null && u.outfitId !== sisterOutfit(id)) f.notes.push(`${it}: a sister plays her own outfit, ${sisterOutfit(id)}; outfitId is ignored`)
    if (!sister && u.name !== undefined) f.notes.push(`${it}: her name is master data’s; a name is read for a sister only`)
    if (sister && u.name === undefined) f.notes.push(`${it}: a sister with no name shows as her elder’s sister`)
    if (u.arrives !== undefined) f.notes.push(`${it}: arrives is retired: you meet her by introducing yourself in town, so it’s dropped`)
    const entry = kept<CastEntry>(u, {
      outfitId: sister ? undefined : field(u, 'outfitId', (v) => (typeof v === 'string' && CHARACTER_ID.test(v) ? v : undefined), it, f, 'is an outfit id'),
      spot: field(u, 'spot', (v) => (oneOf(SPOT_IDS, v) ? v : undefined), it, f, `is one of the town’s spots: ${SPOT_IDS.join(', ')}`),
      name: sister ? field(u, 'name', (v) => {
        if (shown(v, LINE_LIMITS.name, `${it} name`, f, 'name')) return v
        f.errors.pop()
        return undefined
      }, it, f, `is 1–${LINE_LIMITS.name} characters`) : u.name as string | undefined,
      calling: field(u, 'calling', (v) => (oneOf(CALLINGS, v) ? v : undefined), it, f, `is one of ${CALLINGS.join(', ')}`),
      arrives: undefined,
      birthday: field(u, 'birthday', (v) => (realDate(v) ? { month: v.month, day: v.day } : undefined), it, f, 'is { month: 1–12, day } on a real date'),
      meet: u.meet === undefined ? undefined : readTrigger(u.meet, `${it} meet`, f, sub),
      chapters: u.chapters === undefined ? undefined : readChapters(u.chapters, it, f, sub),
      ...readLife(u, it, f, ctx),
    })
    if (u.outfitId == null && !sister) f.notes.push(`${it}: no outfit, so she plays her default outfit from master data`)
    if (u.paragraph !== undefined && typeof u.paragraph === 'string') f.notes.push(...lineNotes(u.paragraph, it))
    return [entry]
  })
  const cast = new Set(umas.map((u) => u.characterId))
  const listed = (key: 'welcome', words: string): string[] | undefined => {
    if (raw[key] === undefined) return undefined
    const ids = idList(raw[key], key, f, (id) => STORY_ID.test(id), 'character ids')
    for (const id of ids ?? []) if (!cast.has(id)) f.notes.push(`${key}: ${id} isn’t in the cast; ${words}`)
    return ids
  }
  if (raw.opening !== undefined) f.notes.push('opening: the opening brings nobody, so the list is dropped')
  if (raw.welcome !== undefined) f.notes.push('welcome: the welcome list is retired: nobody comes to the Gate, and you meet everyone by introducing yourself in town; it’s read and acts on nothing')
  const meets = umas.filter((u) => u.meet !== undefined).length
  if (meets > 0) f.notes.push(`meet is retired: you meet everyone by introducing yourself in town; ${meets === 1 ? 'one character’s is' : `${meets} characters’ are`} read and act${meets === 1 ? 's' : ''} on nothing`)
  const value = kept<Cast>(raw, {
    umas,
    opening: undefined,
    welcome: listed('welcome', 'she has no cast entry yet'),
  })
  return { value, ...f }
}

// --- The ties -----------------------------------------------------------------------------------------------------------

/** ties.json: each tie between two characters, once; its kind, strength and line when given. Either may be a sister
 * (`s<outfitId>`) or one of the town's people: a tie with one of them builds no bond, since she never lives on the farm,
 * and its line shows on both profiles. */
export function checkTies(raw: unknown, ctx: StoryContext): Read<Ties> {
  const f = findings()
  if (raw === undefined) return { value: { ties: [] }, ...f }
  if (!isObject(raw) || !Array.isArray(raw.ties)) { f.errors.push('Not a ties file (an object with a ties list); no ties are read'); return { value: { ties: [] }, ...f } }
  const pairs = new Set<string>()
  const ties = (raw.ties as unknown[]).flatMap((t, i): Tie[] => {
    const at = `Tie ${i + 1}`
    if (!isObject(t) || typeof t.a !== 'string' || typeof t.b !== 'string' || !STORY_ID.test(t.a) || !STORY_ID.test(t.b) || t.a === t.b) {
      f.errors.push(`${at}: a tie names two different characters, a and b; skipped`)
      return []
    }
    const key = [t.a, t.b].sort().join('|')
    if (pairs.has(key)) { f.errors.push(`${at}: ${t.a} and ${t.b} are tied already; skipped`); return [] }
    pairs.add(key)
    for (const side of [t.a, t.b]) {
      if (ctx.town?.has(side)) f.notes.push(`${at}: ${side} is one of the town’s people, so the tie builds no bond; its line shows on both profiles`)
      else if (!ctx.umas.has(side)) f.notes.push(`${at}: ${side} isn’t in the cast, so the tie never starts`)
    }
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

// --- The town -----------------------------------------------------------------------------------------------------------

/** town.json: the town's people (each an Uma from master data, by her character id, in a role of the game's), its
 * spots (by the game's ids) and the locations the story adds (homes, workplaces, spots), each part read on its own. A person or a spot with an error is skipped; a field with one
 * is dropped, and the game's own fills it (`townOf`). */
export function checkTown(raw: unknown): Read<Town | null> {
  const f = findings()
  if (!isObject(raw)) { f.errors.push('Not a town (an object with people and spots); the game’s own plays'); return { value: null, ...f } }
  const ids = new Set<string>()
  const roles = new Set<string>()
  let people: TownPerson[] | undefined
  if (raw.people !== undefined) {
    if (!Array.isArray(raw.people)) f.errors.push('people is a list; skipped')
    else {
      people = (raw.people as unknown[]).flatMap((p, i): TownPerson[] => {
        const at = `Person ${i + 1}`
        if (!isObject(p) || typeof p.characterId !== 'string' || !CHARACTER_ID.test(p.characterId)) {
          f.errors.push(`${at}: no characterId (master data’s id, a positive integer); skipped`)
          return []
        }
        const id = p.characterId
        const it = `${at} (${id})`
        if (ids.has(id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
        ids.add(id)
        let game: string | undefined
        if (p.game !== undefined) {
          if (typeof p.game !== 'string' || !isCastId(p.game)) f.notes.push(`${it}: game ${String(p.game)} isn’t one of the town’s roles (${CAST_IDS.join(', ')}); she’s one of the town’s people all the same`)
          else if (roles.has(p.game)) f.errors.push(`${it}: game ${p.game} is someone else’s role already; skipped`)
          else { roles.add(p.game); game = p.game }
        }
        const does = p.does === undefined ? undefined : shown(p.does, LINE_LIMITS.townBlurb, `${it} does`, f, 'line') ? p.does as string
          : (f.errors[f.errors.length - 1] += '; skipped', undefined)
        return [kept<TownPerson>(p, { game: game ?? (isCastId(String(p.game)) ? undefined : p.game as string | undefined), does })]
      })
    }
  }
  const keepers = new Set([...ids, ...CAST_IDS])
  let spots: TownSpot[] | undefined
  if (raw.spots !== undefined) {
    if (!Array.isArray(raw.spots)) f.errors.push('spots is a list; skipped')
    else {
      const seen = new Set<string>()
      spots = (raw.spots as unknown[]).flatMap((v, i): TownSpot[] => {
        const at = `Spot ${i + 1}`
        if (!isObject(v) || !oneOf(SPOT_IDS, v.id)) { f.errors.push(`${at}: id is one of the town’s spots (${SPOT_IDS.join(', ')}); skipped`); return [] }
        const it = `Spot ${v.id}`
        if (seen.has(v.id)) { f.errors.push(`${it}: twice; the later one is skipped`); return [] }
        seen.add(v.id)
        const text = (key: 'name' | 'blurb', max: number): string | undefined => {
          if (v[key] === undefined) return undefined
          if (shown(v[key], max, `${it} ${key}`, f, key)) return v[key] as string
          f.errors[f.errors.length - 1] += '; skipped'
          return undefined
        }
        const name = text('name', LINE_LIMITS.name)
        const blurb = text('blurb', LINE_LIMITS.townBlurb)
        const keeper = v.keeper === undefined ? undefined : typeof v.keeper === 'string' && keepers.has(v.keeper) ? v.keeper
          : (f.errors.push(`${it}: keeper ${String(v.keeper)} isn’t one of the town’s people (her characterId or her role); skipped`), undefined)
        return [kept<TownSpot>(v, { name, blurb, keeper })]
      })
      const missing = SPOT_IDS.filter((id) => !seen.has(id))
      if (missing.length > 0) f.notes.push(`spots: ${missing.join(', ')} ${missing.length === 1 ? 'isn’t' : 'aren’t'} named, so the game’s own ${missing.length === 1 ? 'plays' : 'play'}`)
    }
  }
  let locations: TownLocation[] | undefined
  if (raw.locations !== undefined) {
    if (!Array.isArray(raw.locations)) f.errors.push('locations is a list; skipped')
    else {
      const seen = new Set<string>(GAME_LOCATIONS)
      locations = (raw.locations as unknown[]).flatMap((v, i): TownLocation[] => {
        const at = `Location ${i + 1}`
        if (!isObject(v) || typeof v.id !== 'string' || !WORLD_ID.test(v.id) || v.id.length > LINE_LIMITS.name) {
          f.errors.push(`${at}: no id (lowercase words joined by -, at most ${LINE_LIMITS.name} characters); skipped`)
          return []
        }
        const it = `Location ${v.id}`
        if (seen.has(v.id)) {
          f.errors.push(`${it}: ${GAME_LOCATIONS.includes(v.id) ? 'one of the game’s own locations already' : 'listed twice'}; skipped`)
          return []
        }
        if (!shown(v.name, LINE_LIMITS.name, it, f, 'name')) { f.errors[f.errors.length - 1] += '; skipped'; return [] }
        seen.add(v.id)
        const line = v.line === undefined ? undefined : shown(v.line, LINE_LIMITS.townBlurb, it, f, 'line') ? v.line as string
          : (f.errors[f.errors.length - 1] += '; skipped', undefined)
        const kind = field(v, 'kind', (x) => (oneOf(LOCATION_KINDS, x) ? x : undefined), it, f, `is one of ${LOCATION_KINDS.join(', ')}`)
        return [kept<TownLocation>(v, { name: v.name, line, kind })]
      })
    }
  }
  const unfilled = CAST_IDS.filter((id) => !roles.has(id))
  if (unfilled.length > 0) f.notes.push(`people: no one plays ${unfilled.join(', ')}, so master data fills ${unfilled.length === 1 ? 'it' : 'them'}`)
  return { value: kept<Town>(raw, { people, spots, locations }), ...f }
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
    // The farm's global chapters are gone: her bar alone readies the rung.
    case 'chapter': f.notes.push(`${at}: the farm has no global chapters (a gate goes on one of hers), so her bar alone readies it`); return { kind: 'hearts' }
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
      if (shown(b[key], max, `${bt} ${key}`, f, what)) return b[key] as string
      f.errors[f.errors.length - 1] += '; skipped'
      return undefined
    }
    return [kept<Beat>(b, {
      trigger: field(b, 'trigger', (t) => readBeatTrigger(t, ctx, isGood, proposed, bt, f), bt, f, 'is hearts, working, item or bond (never a clock, the weather, a season or a festival)'),
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
    if (shown(v[key], max, `keepsake.${key}`, f, key)) return v[key] as string
    f.errors[f.errors.length - 1] += '; skipped'
    return undefined
  }
  return kept<Keepsake>(v, { name: text('name', LINE_LIMITS.keepsakeName), line: text('line', LINE_LIMITS.keepsakeLine) })
}

/** A list of short lines (her town lines, her morning greetings, a meal's), each at most a talk sheet's: one that isn't is
 * skipped. */
function readLines(v: unknown, at: string, f: Findings): string[] | undefined {
  return Array.isArray(v) ? v.filter((line, i) => shown(line, LINE_LIMITS.townLine, `${at} ${i + 1}`, f) || (f.errors[f.errors.length - 1] += '; skipped', false)) : undefined
}

function readMeals(v: unknown, f: Findings): Meals | undefined {
  if (!isObject(v)) return undefined
  return kept<Meals>(v, {
    breakfast: v.breakfast === undefined ? undefined : readLines(v.breakfast, 'meals.breakfast', f),
    dinner: v.dinner === undefined ? undefined : readLines(v.dinner, 'meals.dinner', f),
  })
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
    townLines: field(raw, 'townLines', (v) => readLines(v, 'townLines', f), 'townLines', f, 'is a list of lines'),
    mornings: field(raw, 'mornings', (v) => readLines(v, 'mornings', f), 'mornings', f, 'is a list of lines'),
    meals: field(raw, 'meals', (v) => readMeals(v, f), 'meals', f, 'is { breakfast, dinner }'),
    keepsake: field(raw, 'keepsake', (v) => readKeepsake(v, f), 'keepsake', f, 'is { name, line }'),
    petName: field(raw, 'petName', (v) => {
      if (!shown(v, LINE_LIMITS.petName, 'petName', f, 'name')) { f.errors.pop(); return undefined }
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
      else notes.push(...lineNotes(reason, `${at} ${key}`))
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
  const sc: StepContext = { speakers: new Set<string>([...ctx.umas, ...CAST_IDS, ...(ctx.town ?? [])]), isGood: ctx.isGood ?? isGoodId, hers: true }
  const ids = new Set<string>()
  const events = (raw.events as unknown[]).flatMap((e, i): Route['events'] => {
    if (!isObject(e) || !isText(e.id)) { f.errors.push(`Event ${i + 1}: no id; skipped`); return [] }
    const where = `Event ${e.id}`
    if (ids.has(e.id)) { f.errors.push(`${where}: twice; the later one is skipped`); return [] }
    ids.add(e.id)
    const own = findings()
    checkSteps(e.steps, where, RUNGS.includes(e.id) ? sc : { ...sc, wording: true }, own)
    f.notes.push(...own.notes)
    if (own.errors.length > 0) {
      f.errors.push(...own.errors.map((x, k) => (k === own.errors.length - 1 ? `${x} (the event is skipped)` : x)))
      return []
    }
    if (!STORY_EVENTS.includes(e.id)) f.notes.push(`${where}: not one of the game’s events (its rungs, her life’s, her occasions, the evenings’ scenes); kept for the story`)
    f.notes.push(...eventNotes(e.id, e.steps, bible))
    return [kept<Route['events'][number]>(e, { outfit: readOutfit(e.outfit, where, f) })]
  })
  if (events.length > 0 && !events.some((e) => e.id === ARRIVAL)) f.notes.push('No arrival scene: the default story’s meeting plays')
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
    return [kept<PairConversations['levels'][number]>(l, { place, outfit: readOutfit(l.outfit, at, f) })]
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
  const town: StepContext = { speakers: new Set<string>([...CAST_IDS, ...(ctx.town ?? [])]), isGood }
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
      const read = run(steps, `${where}, ${id}`, { speakers: new Set([id, ...CAST_IDS, ...(ctx.town ?? [])]), isGood })
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
        return [kept<HouseholdScene>(scene, {
          outfit: readOutfit(scene.outfit, where, f), open: run(scene.open, `${where} open`, town), each: each(scene.each, `${where} each`), close: run(scene.close, `${where} close`, town),
        })]
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
      finale = kept<Finale>(v, {
        outfit: readOutfit(v.outfit, 'The finale', f), open: run(v.open, 'The finale open', town), play, each: each(v.each, 'The finale each'), close: run(v.close, 'The finale close', town),
      })
    }
  }
  return { value: kept<Household>(raw, { scenes, houseLines, finale }), ...f }
}

// --- The opening --------------------------------------------------------------------------------------------------------

/** opening.json: the start's lines, each step read on its own with a scene's line limits. A step the opening can't play
 * (a choice, a play, a flag, a branch: the start has no picks) or can't read is skipped, the rest play. With no line
 * left, none is read and the game's own opening plays. Anyone in the cast or the town's people may speak. */
export function checkOpening(raw: unknown, ctx: StoryContext): Read<Opening | null> {
  const f = findings()
  if (!isObject(raw) || !Array.isArray(raw.steps)) { f.errors.push('Not an opening (an object with a steps list); the game’s own opening plays'); return { value: null, ...f } }
  const sc: StepContext = { speakers: new Set<string>([...ctx.umas, ...CAST_IDS, ...(ctx.town ?? [])]), isGood: ctx.isGood ?? isGoodId }
  const steps = (raw.steps as unknown[]).filter((step, i) => {
    const at = `Step ${i + 1}`
    if (isObject(step) && !OPENING_STEPS.some((kind) => kind in step) && ['choice', 'play', 'flag', 'when'].some((kind) => kind in step)) {
      f.errors.push(`${at}: the opening plays lines only (${OPENING_STEPS.join(', ')}), never a pick; skipped`)
      return false
    }
    const own = findings()
    checkSteps([step], 'Opening', sc, own)
    f.notes.push(...own.notes.map((n) => n.replace('Opening, step 1', at)))
    if (own.errors.length === 0) return true
    f.errors.push(...own.errors.map((e) => `${e.replace('Opening, step 1', at)}; skipped`))
    return false
  }) as Step[]
  if (steps.filter((s) => !('place' in s) && !('wait' in s)).length === 0) {
    f.notes.push('No lines, so the game’s own opening plays')
    return { value: null, ...f }
  }
  return { value: kept<Opening>(raw, { steps }), ...f }
}

// --- The world ----------------------------------------------------------------------------------------------------------

/** Text the game shows, or undefined with its error ending "; skipped": the field goes, the game's own words play. */
function worldText(v: unknown, max: number, at: string, f: Findings, what = 'line'): string | undefined {
  if (shown(v, max, at, f, what)) return v
  f.errors[f.errors.length - 1] += '; skipped'
  return undefined
}

/** A day in words: "Winter 10". */
const dayWords = (d: { season: Season; day: number }): string => `${SEASON_NAMES[d.season]} ${d.day}`

/** The festivals: one of the game's five by its id, renamed or moved (its rule kept); any other id one of the story's
 * own, with its name and day. One a day: the game's five where the story puts them, a move onto a day another holds
 * skipped (that festival keeps the game's day), then the story's own in the file's order, one on a day held skipped. */
function readFestivals(v: unknown, f: Findings): WorldFestival[] | undefined {
  if (!Array.isArray(v)) { f.errors.push('festivals is a list; skipped'); return undefined }
  const seen = new Set<string>()
  const read = v.flatMap((raw, i): WorldFestival[] => {
    if (!isObject(raw) || typeof raw.id !== 'string' || !(isFestivalId(raw.id) || (WORLD_ID.test(raw.id) && raw.id.length <= LINE_LIMITS.name))) {
      f.errors.push(`Festival ${i + 1}: id is one of the game’s festivals (${FESTIVALS.join(', ')}) or one of the story’s own, in lowercase words joined by -; skipped`)
      return []
    }
    const id = raw.id
    const it = `Festival ${id}`
    if (seen.has(id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
    seen.add(id)
    const name = raw.name === undefined ? undefined : worldText(raw.name, LINE_LIMITS.name, `${it} name`, f, 'name')
    const season = field(raw, 'season', (s) => (oneOf(SEASONS, s) ? s : undefined), it, f, `is one of ${SEASONS.join(', ')}`)
    const day = field(raw, 'day', (d) => (isInt(d, 1, DAYS_PER_SEASON) ? d : undefined), it, f, `is a day of the season, 1–${DAYS_PER_SEASON}`)
    const happens = raw.happens === undefined ? undefined : worldText(raw.happens, LINE_LIMITS.worldLine, `${it} happens`, f)
    if (!isFestivalId(id) && (name === undefined || season === undefined || day === undefined)) {
      f.errors.push(`${it}: a festival of the story’s own needs its name, its season and its day; skipped`)
      return []
    }
    return [kept<WorldFestival>(raw, { name, season, day, happens })]
  })
  // The game's five, one a day: a move that lands on a day another holds goes back to the game's day.
  const byId = new Map(read.map((e) => [e.id, e]))
  const moved = (id: string): boolean => { const e = byId.get(id); return e !== undefined && (e.season !== undefined || e.day !== undefined) }
  const dayOf = (g: (typeof GAME_FESTIVALS)[number]) => { const e = byId.get(g.id); return { season: e?.season ?? g.season, day: e?.day ?? g.day } }
  for (let clash = true; clash;) {
    clash = false
    const on = new Map<number, string[]>()
    for (const g of GAME_FESTIVALS) {
      const at = festivalDayOfYear(dayOf(g))
      on.set(at, [...(on.get(at) ?? []), g.id])
    }
    for (const ids of on.values()) {
      if (ids.length < 2) continue
      // An unmoved festival keeps its day; else the first moved there does.
      const keep = ids.find((id) => !moved(id)) ?? ids[0]!
      for (const id of ids.filter((x) => x !== keep && moved(x))) {
        const g = GAME_FESTIVALS.find((x) => x.id === id)!
        f.errors.push(`Festival ${id}: ${dayWords(dayOf(g))} holds another festival; its move is skipped, so it keeps the game’s day, ${dayWords(g)}`)
        byId.set(id, kept<WorldFestival>(byId.get(id)! as unknown as Record<string, unknown>, { season: undefined, day: undefined }))
        clash = true
      }
    }
  }
  const held = new Set(GAME_FESTIVALS.map((g) => festivalDayOfYear(dayOf(g))))
  return read.flatMap((e): WorldFestival[] => {
    if (isFestivalId(e.id)) return [byId.get(e.id)!]
    const at = festivalDayOfYear({ season: e.season!, day: e.day! })
    if (held.has(at)) { f.errors.push(`Festival ${e.id}: ${dayWords({ season: e.season!, day: e.day! })} holds another festival; skipped`); return [] }
    held.add(at)
    return [e]
  })
}

/** The story's days: each with its id, its name and its day (one of the season's, or a list of them), and optionally a
 * kind, a season and a line. A day with an error in its id, its name or its day is skipped; a kind, a season or a line
 * with one is dropped (a minor day, every season, no line). A day may share a festival's: it's the story's own custom. */
function readDays(v: unknown, f: Findings): WorldDay[] | undefined {
  if (!Array.isArray(v)) { f.errors.push('days is a list; skipped'); return undefined }
  const seen = new Set<string>()
  return v.flatMap((raw, i): WorldDay[] => {
    if (!isObject(raw) || typeof raw.id !== 'string' || !WORLD_ID.test(raw.id) || raw.id.length > LINE_LIMITS.name) {
      f.errors.push(`Day ${i + 1}: no id (lowercase words joined by -, at most ${LINE_LIMITS.name} characters); skipped`)
      return []
    }
    const it = `Day ${raw.id}`
    if (seen.has(raw.id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
    seen.add(raw.id)
    if (!shown(raw.name, LINE_LIMITS.name, it, f, 'name')) { f.errors[f.errors.length - 1] += '; the day is skipped'; return [] }
    const days = Array.isArray(raw.day) ? raw.day : [raw.day]
    if (days.length === 0 || days.some((d) => !isInt(d, 1, DAYS_PER_SEASON)) || new Set(days).size !== days.length) {
      f.errors.push(`${it}: day is a day of the season, 1–${DAYS_PER_SEASON}, or a list of different ones; the day is skipped`)
      return []
    }
    const kind = field(raw, 'kind', (k) => (oneOf(DAY_KINDS, k) ? k : undefined), it, f, `is one of ${DAY_KINDS.join(', ')}`)
    const season = field(raw, 'season', (s) => (oneOf(SEASONS, s) ? s : undefined), it, f, `is one of ${SEASONS.join(', ')}`)
    const line = raw.line === undefined ? undefined : worldText(raw.line, LINE_LIMITS.worldLine, `${it} line`, f)
    return [kept<WorldDay>(raw, { name: raw.name, kind, season, day: Array.isArray(raw.day) ? [...days] as number[] : raw.day, line })]
  })
}

/** The Town notes: each with its id, title and lines, and its unlock from `NOTE_KINDS`. A note with an error in its id,
 * its title or every line is skipped; a line with one is dropped; an unlock with one is dropped, and the note is known
 * from the start, as one with none is. */
function readNotes(v: unknown, f: Findings, ctx: StoryContext): TownNote[] | undefined {
  if (!Array.isArray(v)) { f.errors.push('notes is a list; skipped'); return undefined }
  const seen = new Set<string>()
  return v.flatMap((raw, i): TownNote[] => {
    if (!isObject(raw) || typeof raw.id !== 'string' || !WORLD_ID.test(raw.id) || raw.id.length > LINE_LIMITS.flag) {
      f.errors.push(`Note ${i + 1}: no id (lowercase words joined by -, at most ${LINE_LIMITS.flag} characters: the save keeps it); skipped`)
      return []
    }
    const it = `Note ${raw.id}`
    if (seen.has(raw.id)) { f.errors.push(`${it}: listed twice; the later one is skipped`); return [] }
    seen.add(raw.id)
    if (!shown(raw.title, LINE_LIMITS.noteTitle, it, f, 'title')) { f.errors[f.errors.length - 1] += '; the note is skipped'; return [] }
    if (!Array.isArray(raw.lines)) { f.errors.push(`${it}: lines is a list; the note is skipped`); return [] }
    const lines = (raw.lines as unknown[]).flatMap((line, k) => {
      const t = worldText(line, LINE_LIMITS.worldText, `${it}, line ${k + 1}`, f)
      return t === undefined ? [] : [t]
    })
    if (lines.length === 0) { f.errors.push(`${it}: no line left; the note is skipped`); return [] }
    let unlock: StoryTrigger | undefined
    if (raw.unlock === undefined) f.notes.push(`${it}: no unlock, so it’s in the Diary from the start`)
    else {
      const read = readTrigger(raw.unlock, `${it} unlock`, f, ctx)
      if (read === undefined) f.errors[f.errors.length - 1] += ', so the note is in the Diary from the start'
      else if (!NOTE_KINDS.includes(read.kind)) {
        f.errors.push(`${it} unlock: a note’s unlock is one of ${NOTE_KINDS.join(', ')} (${read.kind} is meeting her own); skipped, so the note is in the Diary from the start`)
      } else unlock = read
    }
    return [kept<TownNote>(raw, { title: raw.title, lines, unlock })]
  })
}

/**
 * world.json: the world the story builds, each part read on its own: the names (the town, the farm, the region), the
 * farm's history, the festivals, the story's days, the places' words, the seasons' lines and the Town notes. A part with an error is
 * skipped, and an entry or a field with one dropped: the game's own words play there. The festivals keep one a day
 * (`readFestivals`); a Town note's unlock is from the trigger menu's `NOTE_KINDS`, and one with none is known from the
 * start. Notes block nothing.
 */
export function checkWorld(raw: unknown, ctx: Pick<StoryContext, 'isGood'> = {}): Read<World | null> {
  const f = findings()
  if (!isObject(raw)) { f.errors.push('Not a world (an object); the game’s own words play'); return { value: null, ...f } }
  let names: WorldNames | undefined
  if (raw.names !== undefined) {
    const n = raw.names
    if (!isObject(n)) f.errors.push('names is an object (town, farm, region); skipped')
    else {
      names = kept<WorldNames>(n, Object.fromEntries((['town', 'farm', 'region'] as const)
        .map((k) => [k, n[k] === undefined ? undefined : worldText(n[k], LINE_LIMITS.name, `names.${k}`, f, 'name')])))
    }
  }
  let history: string[] | undefined
  if (raw.history !== undefined) {
    if (!Array.isArray(raw.history)) f.errors.push('history is a list of lines; skipped')
    else history = (raw.history as unknown[]).flatMap((line, i) => { const t = worldText(line, LINE_LIMITS.worldText, `history, line ${i + 1}`, f); return t === undefined ? [] : [t] })
  }
  const festivals = raw.festivals === undefined ? undefined : readFestivals(raw.festivals, f)
  const days = raw.days === undefined ? undefined : readDays(raw.days, f)
  let places: World['places']
  if (raw.places !== undefined) {
    const p = raw.places
    if (!isObject(p)) f.errors.push('places is an object, by place id; skipped')
    else {
      places = Object.fromEntries(Object.entries(p).flatMap(([id, v]): [string, WorldPlace][] => {
        const at = `Place ${id}`
        if (!oneOf(FARM_PLACE_IDS, id)) { f.errors.push(`${at}: not one of the farm’s places (${FARM_PLACE_IDS.join(', ')}); skipped`); return [] }
        if (!isObject(v)) { f.errors.push(`${at}: an object with a name and a line; skipped`); return [] }
        return [[id, kept<WorldPlace>(v, {
          name: v.name === undefined ? undefined : worldText(v.name, LINE_LIMITS.name, `${at} name`, f, 'name'),
          line: v.line === undefined ? undefined : worldText(v.line, LINE_LIMITS.worldLine, `${at} line`, f),
        })]]
      }))
    }
  }
  let seasons: World['seasons']
  if (raw.seasons !== undefined) {
    const s = raw.seasons
    if (!isObject(s)) f.errors.push('seasons is an object, by season; skipped')
    else {
      seasons = Object.fromEntries(Object.entries(s).flatMap(([season, line]): [string, string][] => {
        if (!oneOf(SEASONS, season)) { f.errors.push(`Season ${season}: not one of ${SEASONS.join(', ')}; skipped`); return [] }
        const t = worldText(line, LINE_LIMITS.worldLine, `Season ${season}`, f)
        return t === undefined ? [] : [[season, t]]
      }))
    }
  }
  const own = new Set((festivals ?? []).filter((e) => !isFestivalId(e.id)).map((e) => e.id))
  const notes = raw.notes === undefined ? undefined : readNotes(raw.notes, f, { umas: new Set(), ...ctx, festivals: own })
  return { value: kept<World>(raw, { names, history, festivals, days, places, seasons, notes }), ...f }
}
