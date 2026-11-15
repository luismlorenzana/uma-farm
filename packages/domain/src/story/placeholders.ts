// The default story's home: what the game plays wherever the story pack is silent, and the one lookup that reads "the
// pack's, or the default". Nothing is gated on the story: every ladder, event, perk, evening, proposal, wedding and
// household plays end to end on these, and a pack replaces them piece by piece (an event, a scene, her talks, her tastes),
// anything it leaves out staying the default. They read as the game's own voice, with no "placeholder" label in play; the
// Farm Story Sandbox marks them per character (`writtenOf`). The default story's words are `default-story.ts`; this
// module fills them in for her (her name, her favourite good, her line's work) and picks between hers and the default.
//
//   the cast                 the pack's; with none, master data's first five
//   the opening              two short lines: the farm, and its nine Carrot seeds (nobody comes to the Gate)
//   her name and outfit      master data's name and her default outfit (`MasterCast`, read at boot)
//   her talks, by stage      the default story's, by her stage and temperament (her bible's chat set where it has one)
//   her gift reactions       the default story's, by her taste (her bible's `giftLines` where it has them)
//   her greetings, small talk none: a talk opens on her line, and is her line alone
//   her meeting scene        the default story's, in town, paying as a written one does
//   her events               the default story's for every rung, the wedding night, moving in and married life 2 and 4,
//                            each paying as written; her occasions and evenings' scenes the same
//   her chapters             four: "Getting to know her", "Together", "The wedding", "Married life"
//   her line, her tastes     her line from master data's stats; her favourite good (by her line) loved, the rest neutral
//   her birthday             master data's, or none
//   pet name, keepsake, ring's words, wedding places, a tie's kind and line, a play's prompt     plain defaults
//   pairs and household      a short card that pays as written (nothing)
//   the town's people        master data's characters fill the roles the pack leaves, from the last in its order
//   the town's spots         the game's six: the Plaza, the Market, the Café, the Harbour, the Library, the Hilltop Track
//   her town line            a few short lines, one a day; her favourite spot: one of the six by her place in the cast
//   her life in town         the default schedule: her favourite spot every third day of each season (`town/town.ts`)
//   a sister's name          her elder's name, as her sister
//   the world's names        the town is "Town" on the map, the farm "The farm"; no region
//   the farm's history       none: the Diary's "The farm" page shows only what's named
//   the festivals            the game's five, on their days: each season's 10th, and the Harvest Cup on Winter 12
//   the story's days         the game's own six small days (blossom viewing, the wishing night, the first cold evening,
//                            the first snow, the longest night, the sweets day), each a minor day with its own scene
//   a place's name and line  the map's own name and its quick look's line
//   a season's line          none: the morning says "Spring begins" alone
//   Town notes               none
//
// Every read of the pack goes through a function here. Pure; loaded with the story pack.
import { dateOf, FESTIVAL_IDS, FESTIVALS, festivalDayOfYear, isFestivalId, type Festival, type Season } from '../farm/calendar'
import type { Activity } from '../farm/ranks'
import { activityScore, talentScores, type TalentOutfit, type Temperament } from '../farm/talents'
import { goodName, isGoodId } from '../goods/ids'
import type { Taste } from '../romance/chats'
import { isDishId, pairKey, type Love } from '../save/v4'
import {
  ARRIVAL, EVENING_SCENES, FAVOURITE_LINES, FESTIVAL_NIGHTS, GAME_DAYS_OF_STORY, HOUSEHOLD_SCENES, isSister, RUNGS, sisterOutfit, SPOT_IDS, type Beat, type Calling, type Cast, type ChoiceOption, type DateGame, type DayKind, type Finale, type Gifts,
  type HerChapter, type HerJob, type Household, type HouseholdAt, type HouseholdScene, type Keepsake, type PairConversations, type Play, type RoutineStop, type SpotId, type Step,
  type StoryPlace, type StoryTrigger, type Tie, type TieKind, type TownLocation, type TownNote, type UmaBible, type Wish, type Greetings, type SmallTalk,
} from './authored'
import { CAST, CAST_IDS, isCastId, type CastId } from './cast'
import {
  DEFAULT_EVENINGS, DEFAULT_EVENTS, DEFAULT_GIFT_REACTIONS, DEFAULT_GOOD, DEFAULT_GOODS, DEFAULT_LIFE_EVENTS, DEFAULT_MEALS, DEFAULT_MORNINGS, DEFAULT_TALKS,
  DEFAULT_TOWN_MEETING, DEFAULT_WORK, HER, WORK_WORDS, type DefaultScene, type TalkStage,
} from './default-story'
import type { StoryOutfit } from './look'
import { castEntry, castOrder, type StoryPack } from './pack'
import { farmPlace, type FarmPlaceId } from '../farm/places'

// === What master data gives ==============================================================================================

/** Her favourite work: any activity but expeditions. */
export type FavouriteLine = Exclude<Activity, 'expeditions'>

/** What master data gives the placeholders, read once a release at boot: each character it holds an outfit for, in its
 * order (by character id), with her default outfit, and each outfit's line from its stats. Never in git: the app builds
 * it from the release at runtime. */
export interface MasterCast {
  /** Her default outfit, by character id, in master data's order. */
  readonly outfits: ReadonlyMap<string, string>
  /** An outfit's line from its stats, by outfit id. */
  readonly lines: ReadonlyMap<string, FavouriteLine>
}

/** An outfit as master data gives it to the placeholders: its id, its character, its variant (null for an original
 * outfit) and the stats its line is read from. */
export interface MasterOutfit extends TalentOutfit {
  readonly id: string
  readonly characterId: string
  readonly variant?: string | null
}

/** Her line from master data: the work her stats suit best, by the talents' one rule (each activity reads a stat); a tie
 * goes to the first in the activities' order (farming, the ranch, mining, fishing, foraging, then the workshops'). */
export function lineFromStats(outfit: TalentOutfit): FavouriteLine {
  const scores = talentScores(outfit)
  return FAVOURITE_LINES.reduce((best, line) => (activityScore(scores, line) > activityScore(scores, best) ? line : best))
}

/** Master data's cast for the placeholders: every character with an outfit, by character id; her default outfit is her
 * first original one (no variant, the lowest id), else her lowest; each outfit's line from its stats (none when its
 * stats don't read). */
export function masterCastFrom(outfits: readonly MasterOutfit[]): MasterCast {
  const byCharacter = new Map<string, MasterOutfit[]>()
  for (const o of outfits) byCharacter.set(o.characterId, [...(byCharacter.get(o.characterId) ?? []), o])
  const ids = [...byCharacter.keys()].sort((a, b) => Number(a) - Number(b))
  const defaultOf = (list: readonly MasterOutfit[]): string => {
    const sorted = [...list].sort((a, b) => Number(a.id) - Number(b.id))
    return (sorted.find((o) => !o.variant) ?? sorted[0]!).id
  }
  const lines = new Map<string, FavouriteLine>()
  for (const o of outfits) {
    try { lines.set(o.id, lineFromStats(o)) } catch { /* Stats that don't read: no line from them. */ }
  }
  return { outfits: new Map(ids.map((id) => [id, defaultOf(byCharacter.get(id)!)])), lines }
}

// === The cast ============================================================================================================

/** The placeholders' cast's size: the retired welcome list's too. */
export const DEFAULT_WELCOME = 5

/** The cast while the pack names nobody: master data's first five characters (the welcome list's size), so a farm with
 * no story still has a cast; everyone is met in town. */
export function placeholderCast(master: MasterCast | null): Cast {
  return { umas: [...(master?.outfits.keys() ?? [])].slice(0, DEFAULT_WELCOME).map((characterId) => ({ characterId })) }
}

const EMPTY_ROUTES = async () => null
/** No pack at all: nothing written, every read its placeholder. */
export function noPack(): StoryPack {
  return {
    cast: { umas: [] }, ties: { ties: [] }, bibles: new Map(), scripted: new Map(), route: EMPTY_ROUTES, pairs: new Map(), pair: EMPTY_ROUTES, household: null, opening: null, town: null,
    world: null,
  }
}

/** The story the game plays: the pack (or none) with master data's placeholders. A pack whose cast names nobody plays the
 * placeholders' cast. */
export function storyOf(pack: StoryPack | null, master: MasterCast | null): StoryPack {
  const base = pack ?? noPack()
  return { ...base, cast: base.cast.umas.length > 0 ? base.cast : placeholderCast(master), ...(master ? { master } : {}) }
}

/** The cast with these characters kept on it: one on the farm the pack doesn't hold (a character a release dropped, or one
 * from an older story) joins it bare, at its end, and plays on placeholders. Unchanged when the cast holds them all. */
export function withCast(pack: StoryPack, ids: readonly string[]): StoryPack {
  const missing = [...new Set(ids)].filter((id) => !castEntry(pack, id))
  return missing.length === 0 ? pack : { ...pack, cast: { ...pack.cast, umas: [...pack.cast.umas, ...missing.map((characterId) => ({ characterId }))] } }
}

// === Her name and outfit, her line, her tastes ==========================================================================

/** The one resolver: the outfit a roster id plays as. A sister plays her own (her id's); the cast names her outfit;
 * else master data's default for her character; else (someone master data doesn't hold) the id itself, a lettered disc.
 * Faces, busts, names, talents, temperaments and pickers all meet master data through it. */
export function outfitOf(pack: Pick<StoryPack, 'cast' | 'master'> | null, id: string): string {
  if (isSister(id)) return sisterOutfit(id)
  return (pack ? castEntry(pack, id)?.outfitId ?? pack.master?.outfits.get(id) : undefined) ?? id
}

/** Her calling's activity: quarry is mining, at the Quarry. */
export const CALLING_ACTIVITY: Readonly<Record<Calling, Activity>> = { farming: 'farming', foraging: 'foraging', fishing: 'fishing', mining: 'mining', quarry: 'mining' }

/** Her favourite line: her bible's `favouriteLine`, else her calling's, else her line from master data (her outfit's
 * stats). Null only for someone master data doesn't hold and the pack gives neither. */
export function favouriteOf(pack: Pick<StoryPack, 'cast' | 'bibles' | 'master'>, id: string): Activity | null {
  const line = pack.bibles.get(id)?.favouriteLine
  if (line) return line
  const calling = castEntry(pack, id)?.calling
  if (calling) return CALLING_ACTIVITY[calling]
  return pack.master?.lines.get(outfitOf(pack, id)) ?? null
}

/** Her line's places: where her perks work and her events default to. A miner's are the Mine and the Smelter, or the
 * Quarry and the Cutter when her calling is `quarry`. */
export function linePlaces(pack: Pick<StoryPack, 'cast' | 'bibles' | 'master'>, id: string): FarmPlaceId[] {
  switch (favouriteOf(pack, id)) {
    case 'farming': return ['fields']
    case 'foraging': return ['forest', 'sawmill']
    case 'fishing': return ['fishery', 'smokehouse']
    case 'mining': return castEntry(pack, id)?.calling === 'quarry' ? ['quarry', 'cutter'] : ['mine', 'smelter']
    case 'ranch': return ['coop', 'barn']
    case 'cooking': return ['kitchen']
    case 'serving': return ['restaurant']
    case 'forging': return ['forge']
    default: return []
  }
}

/** A pack as her words read it: her bible, and her cast entry and master data when there are any. */
type HerPack = Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'cast' | 'master'>>
/** Her favourite line when the pack may hold no cast (a test's, or a read before the cast): `favouriteOf`'s rule. */
const lineOfPartial = (pack: HerPack, id: string): Activity | null =>
  favouriteOf({ cast: pack.cast ?? { umas: [] }, bibles: pack.bibles, ...(pack.master ? { master: pack.master } : {}) }, id)

/** Her favourite good: her bible's loved one, else the default story's for her line (`DEFAULT_GOODS`): what `{good}` says,
 * and the gift she loves while her story gives no tastes. */
export function favouriteGoodOf(pack: HerPack, id: string): string {
  const loved = pack.bibles.get(id)?.gifts?.loved
  if (loved) return loved
  const line = lineOfPartial(pack, id)
  return line ? DEFAULT_GOODS[line] : DEFAULT_GOOD
}

/** A gift: a good, or a dish (the Kitchen's). */
const isGift = (id: string): boolean => isGoodId(id) || isDishId(id)

/** Her tastes: her bible's when it names any (loved, liked or disliked), else the default story's: her favourite good
 * loved, everything else neutral. */
export function giftsOf(pack: HerPack, id: string): Gifts {
  const own = pack.bibles.get(id)?.gifts
  if (own && (own.loved || (own.liked?.length ?? 0) > 0 || (own.disliked?.length ?? 0) > 0)) return own
  return { ...own, loved: favouriteGoodOf(pack, id) }
}

/** What she thinks of a good (or a dish) as a gift: her tastes (`giftsOf`), loved, liked and disliked, any number of each;
 * everything else neutral. A proposed good counts once it exists in `goods/ids.ts` (a dish, once the Kitchen makes
 * them); until then that slot is neutral. */
export function tasteOf(pack: HerPack, id: string, good: string, isGood: (id: string) => boolean = isGift): Taste {
  const gifts = giftsOf(pack, id)
  if (!isGood(good)) return 'neutral'
  if (gifts.loved === good) return 'loved'
  if (gifts.liked?.includes(good)) return 'liked'
  if (gifts.disliked?.includes(good)) return 'disliked'
  return 'neutral'
}

// === Her words: what the default story fills in =========================================================================

/** What the default story says of her: her name (`{name}`), her favourite good (`{good}`, by its name) and her line's work
 * (`{work}`). `{farmer}` fills as a line shows. */
export interface HerWords { readonly name: string; readonly good: string; readonly work: string }

/** Her words for the default story: her name as the screen knows it ("She" when none is given), her favourite good's name
 * and her line's work. */
export function herWordsOf(pack: HerPack, id: string, name = 'She'): HerWords {
  const line = lineOfPartial(pack, id)
  return { name, good: goodName(favouriteGoodOf(pack, id)), work: line ? WORK_WORDS[line] : DEFAULT_WORK }
}

/** A default line with her words in: `{name}`, `{good}`, `{work}`, and `{gift}` (a gift's name) when given. `{farmer}`
 * stays, to fill as it shows; a word not given stays too. */
export function fillHer(text: string, words: Partial<HerWords> & { gift?: string }): string {
  let out = text
  if (words.name !== undefined) out = out.replaceAll('{name}', words.name)
  if (words.good !== undefined) out = out.replaceAll('{good}', words.good)
  if (words.work !== undefined) out = out.replaceAll('{work}', words.work)
  if (words.gift !== undefined) out = out.replaceAll('{gift}', words.gift)
  return out
}

/** A default scene's steps for her: `@her` her id, every line with her words in. */
export function fillScene(steps: readonly Step[], id: string, words: HerWords): Step[] {
  const text = (t: string) => fillHer(t, words)
  const one = (s: Step): Step => {
    if ('say' in s) return { ...s, say: s.say === HER ? id : s.say, line: text(s.line) }
    if ('narrate' in s) return { narrate: text(s.narrate) }
    if ('thought' in s) return { thought: text(s.thought) }
    if ('choice' in s) return { choice: s.choice.map((o) => ({ ...o, text: text(o.text), ...(o.then ? { then: fillScene(o.then, id, words) } : {}) })) }
    if ('when' in s) return { ...s, then: fillScene(s.then, id, words), ...(s.else ? { else: fillScene(s.else, id, words) } : {}) }
    if ('play' in s) {
      const p = s.play
      return { play: { ...p, ...(p.good ? { good: fillScene(p.good, id, words) } : {}), ...(p.miss ? { miss: fillScene(p.miss, id, words) } : {}) } }
    }
    return s
  }
  return steps.map(one)
}

/** Her birthday as a date: her cast entry's, else master data's character set's, else none. */
export function birthdayOf(pack: Pick<StoryPack, 'cast'>, id: string, master: ReadonlyMap<string, { month: number; day: number }>): { month: number; day: number } | null {
  return castEntry(pack, id)?.birthday ?? master.get(id) ?? null
}

/** Her wishes for married life: her bible's, none without one. */
export const wishesOf = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly Wish[] => pack.bibles.get(id)?.wishes ?? []

// === Her arrival and her chapters; the retired welcome list and trigger to meet ===========================================

/** Her trigger to meet when the pack gives none: talk with her on three different days. */
export const DEFAULT_MEET: StoryTrigger = { kind: 'talks', days: 3 }

/** Her chapters when the pack gives none: four, along the route's backbone. */
export const DEFAULT_CHAPTERS: readonly Required<Pick<HerChapter, 'title' | 'events'>>[] = [
  { title: 'Getting to know her', events: RUNGS.slice(0, RUNGS.indexOf('confession') + 1) },
  { title: 'Together', events: RUNGS.slice(RUNGS.indexOf('r1'), RUNGS.indexOf('proposal') + 1) },
  { title: 'The wedding', events: ['wedding'] },
  { title: 'Married life', events: ['s1', 's3', 's5'] },
]

/** The welcome list, retired with the welcome week: read for the Story Sandbox, acting on nothing (nobody comes to the
 * Gate). The pack's `welcome`, else the first five of the cast, in its order, sisters aside. */
export function welcomeOf(pack: Pick<StoryPack, 'cast'>): string[] {
  const named = pack.cast.welcome ?? []
  return named.length > 0 ? [...named] : castOrder(pack).filter((id) => !isSister(id)).slice(0, DEFAULT_WELCOME)
}

/** Her trigger to meet, retired (you meet her by introducing yourself): her cast entry's `meet`, else the old default. */
export const meetOf = (pack: Pick<StoryPack, 'cast'>, id: string): StoryTrigger => castEntry(pack, id)?.meet ?? DEFAULT_MEET

/** Whether she's on the retired welcome list. */
export const onWelcomeList = (pack: Pick<StoryPack, 'cast'>, id: string): boolean => welcomeOf(pack).includes(id)

/** Her chapters: her cast entry's, else the four default ones. `romance/chapters.ts` plays them along her route. */
export function chaptersOf(pack: Pick<StoryPack, 'cast'>, id: string): readonly HerChapter[] {
  const own = castEntry(pack, id)?.chapters ?? []
  return own.length > 0 ? own : DEFAULT_CHAPTERS
}

/** The retired welcome list as it would have visited: each one in the cast, and none of the town's people. */
export function welcomeVisitors(pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>): string[] {
  return welcomeOf(pack).filter((id) => castEntry(pack, id) !== undefined && !isTownPerson(pack, id))
}

/** The retired welcome list's first, or null: nobody waits at the Gate now. */
export const firstVisitorOf = (pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>): string | null => welcomeVisitors(pack)[0] ?? null

/** The game's opening lines: three, short; the last, the Gate's, is retired with the welcome list, so two play. */
export const PLACEHOLDER_OPENING: readonly Step[] = [
  { narrate: 'Morning, {farmer}. The farm is yours now, weeds and all.' },
  { narrate: 'One block is tilled, and nine Carrot seeds wait in the Fields.' },
  { narrate: 'And someone is already waiting at the Gate.' },
]

/** The opening's lines, in order: the pack's `opening.json`, else the game's, less the Gate's line: nobody comes to the
 * Gate (you meet everyone by introducing yourself in town). They play once, on day 1, after the farmer's name; then Home. */
export function openingOf(pack: Pick<StoryPack, 'cast' | 'opening'> & Partial<Pick<StoryPack, 'town'>>): readonly Step[] {
  if (pack.opening) return pack.opening.steps
  return PLACEHOLDER_OPENING.slice(0, -1)
}

// === Her route: beats, events and her words =============================================================================

/** Her route's beats: her bible's, else none (every rung plays with the game's defaults). */
export const routeBeats = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly Beat[] => pack.bibles.get(id)?.route ?? []
/** The beat a rung plays, from her bible; none without one: her full bar is its setup, and it has no place, no play of
 * its own, no hint and no unlock. */
export const beatOf = (pack: Pick<StoryPack, 'bibles'>, id: string, rung: string): Beat | undefined => routeBeats(pack, id).find((b) => b.id === rung)

/** The default story's scene for an event id: her meeting (the Gate's, or the town's `inTown`), a rung, her life's events
 * past the rungs, her occasions and the evenings' scenes. An id it doesn't hold plays Friendship 1's. */
export function defaultSceneOf(event: string, inTown = false): DefaultScene {
  if (event === ARRIVAL && inTown) return DEFAULT_TOWN_MEETING
  return DEFAULT_EVENTS[event] ?? DEFAULT_EVENINGS[event] ?? DEFAULT_EVENTS.f1!
}

/** A heart event's moment, by rung: the default event's first line, and its Memory's caption when her beat gives none. */
export const PLACEHOLDER_MOMENTS: Readonly<Record<string, string>> = Object.fromEntries(RUNGS.map((rung) => [rung, defaultSceneOf(rung).moment]))

/** Her meeting scene's hello for a written arrival with no choice: your answer, which pays as a written arrival's choice
 * does (+30 the warmer, +10 the other). */
export const PLACEHOLDER_HELLO: readonly ChoiceOption[] = [
  { text: 'Welcome! We’re glad you came.', tone: 'warm', friendship: 2 },
  { text: 'Hello! Come on in.', tone: 'playful', friendship: 1 },
]

/** The default story's event for an id the pack doesn't script, filled in for her (`words`; her name "She" without one).
 * A rung pays as a written event does (+50, the reply's +30 or +10, and its grade); the big rungs keep their shape: her
 * confession's reply holds Yes and Not yet, the proposal's says yes, the wedding's last choice is the vows. Her arrival is
 * met in town (`inTown`; the Gate's, retired with the welcome week, without it); either holds one choice. Her life's events, her
 * occasions and the evenings' scenes pay nothing: their choices are wording only. */
export function placeholderEvent(id: string, rung: string, inTown = false, words: HerWords = { name: 'She', good: goodName(DEFAULT_GOOD), work: DEFAULT_WORK }): Step[] {
  return fillScene(defaultSceneOf(rung, inTown).steps, id, words)
}

/** Whether steps hold a choice anywhere a path can reach. */
const hasChoice = (steps: readonly Step[]): boolean => steps.some((s) => ('choice' in s) || ('when' in s && (hasChoice(s.then) || hasChoice(s.else ?? []))))

/** An event the game plays: her route's for the id (a rung, her life's events, an occasion, an evening's scene), else the
 * default story's, filled in for her (her `name` as the screen knows it, her favourite good, her line's work). Her written
 * arrival with no choice gets the hello, so it pays as one with a choice does. Her unwritten arrival is the town's: you
 * meet her by introducing yourself there. `written` says which; `outfit` is the event's own when it names
 * one (the default's names it for the wedding night, a picnic, a festival night, a dinner, a night in), else the moment's
 * plays. */
export interface PlayedEvent { id: string; steps: readonly Step[]; written: boolean; outfit?: StoryOutfit }
export async function eventOf(pack: Pick<StoryPack, 'route'> & Partial<Pick<StoryPack, 'cast' | 'bibles' | 'master'>>, id: string, rung: string, name?: string): Promise<PlayedEvent> {
  const event = (await pack.route(id))?.events.find((e) => e.id === rung)
  const steps = event?.steps
  if (!steps) {
    // Her unwritten meeting is always the town's: you meet her by introducing yourself there.
    const inTown = rung === ARRIVAL
    const scene = defaultSceneOf(rung, inTown)
    const words = herWordsOf({ bibles: pack.bibles ?? new Map(), ...(pack.cast ? { cast: pack.cast } : {}), ...(pack.master ? { master: pack.master } : {}) }, id, name)
    return { id: rung, steps: placeholderEvent(id, rung, inTown, words), written: false, ...(scene.outfit ? { outfit: scene.outfit } : {}) }
  }
  return {
    id: rung, steps: rung === ARRIVAL && !hasChoice(steps) ? [...steps, { choice: [...PLACEHOLDER_HELLO] }] : steps, written: true,
    ...(event.outfit ? { outfit: event.outfit } : {}),
  }
}

/** An evening's scene id: `hangout-<kind>` for a friend, `date-<kind>` for a sweetheart or a spouse. */
export const eveningSceneId = (kind: string, role: 'hangout' | 'date' | 'spouse'): string => `${role === 'hangout' ? 'hangout' : 'date'}-${kind}`

/** Her Memory's caption for a rung: her beat's, else the default event's moment. */
export const captionOf = (pack: Pick<StoryPack, 'bibles'>, id: string, rung: string): string =>
  beatOf(pack, id, rung)?.beat ?? PLACEHOLDER_MOMENTS[rung] ?? PLACEHOLDER_MOMENTS.f1!

/** Her ring's words when her Romance 8 beat gives none. */
export const PLACEHOLDER_ENGRAVING = 'Yours, always.'
/** Her ring's words: her Romance 8 beat's caption, else plain ones. */
export const engravingOf = (pack: Pick<StoryPack, 'bibles'>, id: string): string => beatOf(pack, id, 'r8')?.beat ?? PLACEHOLDER_ENGRAVING

/** A play's prompt when the pack writes none, by its game. */
export const PLAY_PROMPTS: Readonly<Record<Activity | DateGame, string>> = {
  farming: 'Bring in the ripe ones together.',
  foraging: 'Find the best of the wood’s finds.',
  fishing: 'Cast the line together.',
  mining: 'Swing in time with her.',
  ranch: 'Brush the animals side by side.',
  cooking: 'Stir the pot in time.',
  serving: 'Carry the trays together.',
  forging: 'Strike the anvil in turn.',
  expeditions: 'Pack the bags for the road.',
  walk: 'Take the long way round.',
  boat: 'Row in step with her.',
  picnic: 'Pick the best of the basket.',
  market: 'Pick out the best at the stalls.',
  stargazing: 'Find the brightest stars.',
  dance: 'Dance in step with her.',
  crafting: 'Work the pieces in time.',
  footrace: 'Race her to the fence.',
}
/** A play's prompt: the pack's, else its game's. */
export const promptOf = (play: Pick<Play, 'game' | 'prompt'>): string => play.prompt ?? PLAY_PROMPTS[play.game]

/** Her stage in the Uma loop, as her talks follow it: an acquaintance to Friendship 2, a friend from Friendship 3 through
 * the confession's wait (a farmhand once she works the farm: `farmhand`), a sweetheart from the confession through the
 * proposal's wait, engaged until the wedding, then married. */
export function talkStageOf(love: Pick<Love, 'stage' | 'level'>, farmhand = false): TalkStage {
  switch (love.stage) {
    case 'friendship': return love.level <= 2 ? 'acquaintance' : farmhand ? 'farmhand' : 'friend'
    case 'confession': return farmhand ? 'farmhand' : 'friend'
    case 'romance': case 'proposal': return 'sweetheart'
    case 'wedding': return 'engaged'
    case 'spouse': return 'married'
  }
}

/** Her bible's chat lines for a set (from Friendship 1: `friend`, `partner`, `spouse`), or none. */
export function chatLinesOf(pack: Pick<StoryPack, 'bibles'>, id: string, set: 'friend' | 'partner' | 'spouse'): readonly string[] {
  return pack.bibles.get(id)?.chats?.[set] ?? []
}

/** The default story's talks for her stage and temperament, with her favourite good and her line's work in (`{name}` and
 * `{farmer}` fill as they show). */
export function defaultTalksOf(pack: HerPack, id: string, stage: TalkStage, temperament: Temperament): readonly string[] {
  const { good, work } = herWordsOf(pack, id)
  return DEFAULT_TALKS[stage][temperament].map((line) => fillHer(line, { good, work }))
}

/** What she says to a gift: on her birthday her bible's `giftLines.birthday` when it holds any; else her `giftLines` for
 * its taste when they hold any; else the default story's for the taste, with the gift's name, her favourite good and her
 * line's work in (`{name}` and `{farmer}` fill as they show). */
export function giftReactionsOf(pack: HerPack, id: string, taste: Taste, gift: string, birthday = false): readonly string[] {
  const own = pack.bibles.get(id)?.giftLines
  const hers = (birthday ? own?.birthday ?? [] : []).length > 0 ? own!.birthday! : own?.[taste] ?? []
  if (hers.length > 0) return hers
  const { good, work } = herWordsOf(pack, id)
  return DEFAULT_GIFT_REACTIONS[taste].map((line) => fillHer(line, { good, work, gift: goodName(gift) }))
}

/** Her greetings: her bible's, else none (a talk opens on her line). */
export const greetingsOf = (pack: Pick<StoryPack, 'bibles'>, id: string): Greetings => pack.bibles.get(id)?.greetings ?? {}
/** Her small talk: her bible's, else none. */
export const smallTalkOf = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly SmallTalk[] => pack.bibles.get(id)?.smallTalk ?? []

/** The night's companion's morning greetings: her bible's `mornings` when it holds any, else the default story's for her
 * temperament, with her words in but `{name}` and `{farmer}`, which fill as they show. */
export function morningGreetingsOf(pack: HerPack, id: string, temperament: Temperament): readonly string[] {
  const own = pack.bibles.get(id)?.mornings ?? []
  if (own.length > 0) return own
  const { good, work } = herWordsOf(pack, id)
  return DEFAULT_MORNINGS[temperament].map((line) => fillHer(line, { good, work }))
}

/** Her lines at the household's meals: her bible's `meals` for that meal when it holds any, else the default story's,
 * with her words in but `{name}` and `{farmer}`. */
export function mealLinesOf(pack: HerPack, id: string, meal: 'breakfast' | 'dinner'): readonly string[] {
  const own = pack.bibles.get(id)?.meals?.[meal] ?? []
  if (own.length > 0) return own
  const { good, work } = herWordsOf(pack, id)
  return DEFAULT_MEALS[meal].map((line) => fillHer(line, { good, work }))
}

/** Her keepsake when her bible gives none: plain words. */
export const PLACEHOLDER_KEEPSAKE: Required<Keepsake> = { name: 'Her keepsake', line: 'Keep it close. It’s for luck.' }
/** Her keepsake: her bible's name and line, each else the plain one. */
export function keepsakeOf(pack: Pick<StoryPack, 'bibles'>, id: string): Required<Keepsake> {
  const own = pack.bibles.get(id)?.keepsake
  return { name: own?.name ?? PLACEHOLDER_KEEPSAKE.name, line: own?.line ?? PLACEHOLDER_KEEPSAKE.line }
}

/** What she calls you when her bible gives no pet name: your own name, filled as it shows. */
export const PLACEHOLDER_PET_NAME = '{farmer}'
/** What she calls you from Romance 1: her bible's pet name, else your name (`{farmer}`, filled as it shows). */
export const petNameOf = (pack: Pick<StoryPack, 'bibles'>, id: string): string => pack.bibles.get(id)?.petName ?? PLACEHOLDER_PET_NAME

/** The places a wedding falls back on without her bible's `wedding.places`: after her wedding beat's. */
export const WEDDING_DEFAULTS: readonly StoryPlace[] = ['chapel-bell', 'fields', 'overlook', 'orchard-bench']
/** Her wedding's places: her bible's `wedding.places` (any number), else her wedding beat's place and the farm's
 * defaults, three different. */
export function weddingPlaces(pack: Pick<StoryPack, 'bibles'>, id: string): StoryPlace[] {
  const bible = pack.bibles.get(id)
  if (bible?.wedding && bible.wedding.places.length > 0) return [...bible.wedding.places]
  const beat = beatOf(pack, id, 'wedding')?.place
  return [...new Set([...(beat ? [beat] : []), ...WEDDING_DEFAULTS])].slice(0, 3)
}

// === Ties and pairs ======================================================================================================

/** A tie's placeholders: "Close", strength 1 (known, starting at 0), and its line. */
export const PLACEHOLDER_TIE = { kind: 'other' as TieKind, strength: 1 as const, line: 'Closer now' }
/** A tie's strength, 1 without one. */
export const tieStrength = (tie: Pick<Tie, 'strength'>): 1 | 2 | 3 => tie.strength ?? PLACEHOLDER_TIE.strength
/** A tie's kind, `other` ("Close") without one. */
export const tieKind = (tie: Pick<Tie, 'kind'>): TieKind => tie.kind ?? PLACEHOLDER_TIE.kind
/** The tie between two, if the pack holds one. */
export const tieOf = (pack: Pick<StoryPack, 'ties'>, a: string, b: string): Tie | undefined => pack.ties.ties.find((t) => pairKey(t.a, t.b) === pairKey(a, b))
/** A tie's line: the pack's, else "Closer now". Null for two the ties don't hold. */
export function tieLineOf(pack: Pick<StoryPack, 'ties'>, a: string, b: string): string | null {
  const tie = tieOf(pack, a, b)
  return tie ? tie.line ?? PLACEHOLDER_TIE.line : null
}

/** A pair's bond levels. */
export const BOND_LEVELS = [1, 2, 3, 4, 5] as const

/** A tie's conversation at a bond level when the pack writes none: two short lines, one each. Pays nothing, as a written
 * one does. */
const PAIR_LINES: Readonly<Record<number, readonly [string, string]>> = {
  1: ['Nice work today.', 'You too. Same time tomorrow?'],
  2: ['Want to have lunch together?', 'I was hoping you’d ask.'],
  3: ['We make a good team.', 'The best on the farm.'],
  4: ['I’m glad you’re here.', 'Me too. It wouldn’t be the same without you.'],
  5: ['Friends for good?', 'For good.'],
}
export const placeholderPairLevel = (a: string, b: string, hearts: number): PairConversations['levels'][number] => {
  const [first, second] = PAIR_LINES[hearts] ?? PAIR_LINES[1]!
  return { hearts, steps: [{ say: a, line: first }, { say: b, line: second }] }
}

const NONE: ReadonlySet<number> = new Set()
const ALL_LEVELS: ReadonlySet<number> = new Set(BOND_LEVELS)
/** The bond levels a pair has a conversation at: every level for a tie's pair (the pack's, else the game's card); none
 * for two the ties don't hold. */
export const pairLevels = (pack: Pick<StoryPack, 'ties'>, a: string, b: string): ReadonlySet<number> => (tieOf(pack, a, b) ? ALL_LEVELS : NONE)

/** A tie's conversations: the pack's levels, and the game's card at each level it doesn't write; null for two the ties
 * don't hold. Loaded on demand. */
export async function pairConversationsOf(pack: Pick<StoryPack, 'ties' | 'pair'>, a: string, b: string): Promise<PairConversations | null> {
  const tie = tieOf(pack, a, b)
  if (!tie) return null
  const [x, y] = pairKey(a, b).split(':') as [string, string]
  const written = await pack.pair(x, y)
  const levels = BOND_LEVELS.map((h) => written?.levels.find((l) => l.hearts === h) ?? placeholderPairLevel(x, y, h))
  return { a: x, b: y, levels }
}

// === The household =======================================================================================================

/** A household scene's or the finale's card when the pack writes none, and each spouse's line in it. */
const HOUSEHOLD_CARDS: Readonly<Record<HouseholdAt | 'finale', { open: string; each: string; close: string }>> = {
  5: { open: 'The whole household gathers for supper.', each: 'I’m happy here. With all of you.', close: 'It runs late, and nobody minds.' },
  10: { open: 'The homestead is full of voices tonight.', each: 'Look how far we’ve come.', close: 'The lamps stay lit long after dark.' },
  15: { open: 'Lanterns line the path between the houses.', each: 'This is the life I wanted.', close: 'Somebody starts a song, and everyone joins in.' },
  finale: { open: 'The Great Harvest: every field is ready at once.', each: 'We did it. Together.', close: 'The barns are full, and so is the table.' },
}
/** The finale's play when the pack writes none: a dance under the lanterns. */
export const PLACEHOLDER_FINALE_PLAY: Play = { game: 'dance', prompt: 'Dance with everyone under the lanterns.' }

/** A spouse's beat in a household scene or the finale when the pack writes none: her one line. */
export const placeholderHouseholdBeat = (at: HouseholdAt | 'finale', who: string): Step[] => [{ say: who, line: HOUSEHOLD_CARDS[at].each }]

/** The household as the game plays it: the pack's scenes, finale and house lines, each scene and the finale filled in
 * where the pack is silent (its `open` and `close`, the finale's play). Each spouse's beat falls back in
 * `householdPlay`, since who is married varies. */
export function householdOf(pack: Pick<StoryPack, 'household'>): Household {
  const own = pack.household
  const scenes = HOUSEHOLD_SCENES.map((at): HouseholdScene => {
    const scene = own?.scenes?.find((s) => s.at === at)
    return { ...scene, at, open: scene?.open ?? [{ narrate: HOUSEHOLD_CARDS[at].open }], close: scene?.close ?? [{ narrate: HOUSEHOLD_CARDS[at].close }] }
  })
  const finale: Finale = {
    ...own?.finale,
    open: own?.finale?.open ?? [{ narrate: HOUSEHOLD_CARDS.finale.open }],
    play: own?.finale?.play ?? PLACEHOLDER_FINALE_PLAY,
    close: own?.finale?.close ?? [{ narrate: HOUSEHOLD_CARDS.finale.close }],
  }
  return { ...own, scenes, finale }
}

// === The town ============================================================================================================

/** The town's own spots, by id, when `town.json` names none: each one's name, its line, and the role that keeps it. */
export const PLACEHOLDER_SPOTS: Readonly<Record<SpotId, { name: string; blurb: string; keeper: CastId }>> = {
  plaza: { name: 'The Plaza', blurb: 'The fountain at the heart of the town. Everyone passes through.', keeper: 'hollis-pryor' },
  market: { name: 'The Market', blurb: 'The season’s stalls, open from first light.', keeper: 'marta-quill' },
  cafe: { name: 'The Café', blurb: 'Tea, cake and a seat by the window.', keeper: 'rosa-bell' },
  harbour: { name: 'The Harbour', blurb: 'Boats, nets and the salt wind off the sea.', keeper: 'nils-berg' },
  library: { name: 'The Library', blurb: 'Quiet rooms, and old maps of the roads past the town.', keeper: 'juno-park' },
  track: { name: 'The Hilltop Track', blurb: 'A running track above the rooftops.', keeper: 'courier' },
}

/** One of the town's people as the game plays her: an Uma of master data's, in a role. */
export interface TownPersonPlayed {
  readonly characterId: string
  /** Her role, or null for one of the story's own. */
  readonly role: CastId | null
  /** What she does: the pack's line, else her role's. */
  readonly does: string
  /** Whether the pack names her; else master data fills her role. */
  readonly written: boolean
}
/** One of the town's spots as the game plays it. */
export interface TownSpotPlayed {
  readonly id: SpotId
  readonly name: string
  readonly blurb: string
  /** Her character id: one of the town's people, usually there; null when no one plays the role. */
  readonly keeper: string | null
}
/** The town as the game plays it: its people, each role filled, and its six spots. */
export interface TownPlayed {
  readonly people: readonly TownPersonPlayed[]
  readonly spots: readonly TownSpotPlayed[]
  /** Who plays each role, by role id. */
  readonly byRole: ReadonlyMap<CastId, string>
  /** Her character id → her, for each of the town's people. */
  readonly byId: ReadonlyMap<string, TownPersonPlayed>
}

type TownPack = Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>
const towns = new WeakMap<object, TownPlayed>()

/** The town as the game plays it: the pack's people and spots, and placeholders wherever it's silent. A role no one in
 * `town.json` plays goes to one of master data's characters, from the last in its order, never one of the cast or of the
 * town's people already; with no master data, no one plays it (a scene names the role: "The smith"). A spot's name, line
 * and keeper are the pack's, else the game's own. Read once a pack. */
export function townOf(pack: TownPack): TownPlayed {
  const known = towns.get(pack)
  if (known) return known
  const own = pack.town?.people ?? []
  const people: TownPersonPlayed[] = own.map((p) => {
    const role = p.game !== undefined && isCastId(String(p.game)) ? p.game as CastId : null
    return { characterId: p.characterId, role, does: p.does ?? (role ? CAST[role].is : 'Lives in town'), written: true }
  })
  const taken = new Set([...people.map((p) => p.characterId), ...pack.cast.umas.map((u) => u.characterId)])
  const free = [...(pack.master?.outfits.keys() ?? [])].filter((id) => !taken.has(id)).reverse()
  for (const role of CAST_IDS) {
    if (people.some((p) => p.role === role)) continue
    const id = free.shift()
    if (id !== undefined) people.push({ characterId: id, role, does: CAST[role].is, written: false })
  }
  const byRole = new Map(people.flatMap((p): [CastId, string][] => (p.role ? [[p.role, p.characterId]] : [])))
  const byId = new Map(people.map((p) => [p.characterId, p]))
  const keeperOf = (keeper: string | undefined): string | null => (keeper === undefined ? null : byId.has(keeper) ? keeper : isCastId(keeper) ? byRole.get(keeper) ?? null : null)
  const spots = SPOT_IDS.map((id): TownSpotPlayed => {
    const spot = pack.town?.spots?.find((x) => x.id === id)
    const game = PLACEHOLDER_SPOTS[id]
    return { id, name: spot?.name ?? game.name, blurb: spot?.blurb ?? game.blurb, keeper: keeperOf(spot?.keeper ?? game.keeper) }
  })
  const town: TownPlayed = { people, spots, byRole, byId }
  towns.set(pack, town)
  return town
}

/** Whether she's one of the town's people the pack names: a tie with her builds no bond. */
export const isTownPerson = (pack: Partial<Pick<StoryPack, 'town'>>, id: string): boolean => (pack.town?.people ?? []).some((p) => p.characterId === id)

/** Who a scene's `say` is: one of the town's roles goes to the Uma who plays it (else stays the role), anyone else is
 * herself. */
export const speakerId = (pack: TownPack, who: string): string => (isCastId(who) ? townOf(pack).byRole.get(who) ?? who : who)

/** Her favourite spot: her cast entry's `spot`, else none. */
export const favouriteSpotOf = (pack: Pick<StoryPack, 'cast'>, id: string): SpotId | null => castEntry(pack, id)?.spot ?? null

/** What she says when you talk with her in town and her bible gives no `townLines`: short, `{farmer}` your name. */
export const PLACEHOLDER_TOWN_LINES: readonly string[] = [
  '“Oh, hello! Out for a walk too?”',
  '“Lovely day for it, isn’t it?”',
  '“You’re from the farm up the road, aren’t you?”',
  '“I come here when I need to think.”',
  '“Good to see you, {farmer}.”',
  '“Busy day? Mine’s only just starting.”',
]
/** Her town lines: her bible's `townLines` when it holds any, else the game's. One plays a day. */
export function townLinesOf(pack: Pick<StoryPack, 'bibles'>, id: string): readonly string[] {
  const own = pack.bibles.get(id)?.townLines ?? []
  return own.length > 0 ? own : PLACEHOLDER_TOWN_LINES
}

/** A sister's name: her cast entry's, else her elder's (`elder`, master data's name for her outfit's character) as her
 * sister; null when she has neither. */
export function sisterNameOf(pack: Pick<StoryPack, 'cast'>, id: string, elder: string | null): string | null {
  return castEntry(pack, id)?.name ?? (elder ? `${elder}’s sister` : null)
}

// === The world ===========================================================================================================

/** A pack as the world's lookups read it: its `world.json`, if any. */
type WorldPack = Partial<Pick<StoryPack, 'world'>> | null | undefined

/** The game's own names where world.json gives none: the Town on the map, and "The farm". There's no region. */
export const PLACEHOLDER_NAMES = { town: 'Town', farm: 'The farm' } as const

/** The world's names as world.json gives them: the town's, the farm's and the region's, each null where it's silent (the
 * screens say their own words there). */
export interface WorldNamesPlayed { readonly town: string | null; readonly farm: string | null; readonly region: string | null }
export function worldNamesOf(pack: WorldPack): WorldNamesPlayed {
  const names = pack?.world?.names
  return { town: names?.town ?? null, farm: names?.farm ?? null, region: names?.region ?? null }
}

/** The farm's history, a few lines: world.json's, else none. */
export const historyOf = (pack: WorldPack): readonly string[] => pack?.world?.history ?? []

const years = new WeakMap<object, readonly Festival[]>()
/** The year's festivals, in the year's order: the game's five, each under world.json's name and on its day where it gives
 * them (its game rule kept, wherever it falls), and the story's own after them; without world.json, the game's five
 * (`FESTIVALS`). The reader keeps one a day. Read once a pack. */
export function festivalsOf(pack: WorldPack): readonly Festival[] {
  const world = pack?.world
  const own = world?.festivals ?? []
  if (!world || own.length === 0) return FESTIVALS
  const known = years.get(world)
  if (known) return known
  const game = FESTIVALS.map((f): Festival => {
    const w = own.find((e) => e.id === f.id)
    return w ? { ...f, name: w.name ?? f.name, season: w.season ?? f.season, day: w.day ?? f.day, happens: w.happens ?? null } : f
  })
  const added = own.filter((e) => !isFestivalId(e.id) && e.name !== undefined && e.season !== undefined && e.day !== undefined)
    .map((e): Festival => ({ id: e.id, name: e.name!, season: e.season!, day: e.day!, rule: null, happens: e.happens ?? null }))
  const year = [...game, ...added].sort((a, b) => festivalDayOfYear(a) - festivalDayOfYear(b))
  years.set(world, year)
  return year
}

/** A festival's name by its id: the year's; else the game's own (a festival the story has since dropped); else plain
 * words. */
export const festivalNameOf = (year: readonly Festival[], id: string): string =>
  year.find((f) => f.id === id)?.name ?? FESTIVALS.find((f) => f.id === id)?.name ?? 'A festival'

/** One of the story's days as the calendar plays it: its id, its name, a holiday or a minor day, its season (null: every
 * season), its days of the season, its line (null without one), and the scene it plays with each Uma who has it written
 * (`romance/occasions.ts`). */
export interface StoryDay {
  readonly id: string
  readonly name: string
  readonly kind: DayKind
  readonly season: Season | null
  readonly days: readonly number[]
  readonly line: string | null
  readonly scene: string
}
/** The game's own small days as the calendar plays them: minor days, each its own scene, with no line. */
export const GAME_STORY_DAYS: readonly StoryDay[] = GAME_DAYS_OF_STORY.map((d) => ({ id: d.id, name: d.name, kind: 'minor', season: d.season, days: [d.day], line: null, scene: d.id }))
const storyDays = new WeakMap<object, readonly StoryDay[]>()
/** The story's holidays and minor days: world.json's, in its order (a holiday a minor day without its kind, every season
 * without its season, its id the scene without one), then the game's own small days it doesn't name (one it names by id
 * is moved or renamed by it). Read once a pack. */
export function storyDaysOf(pack: WorldPack): readonly StoryDay[] {
  const world = pack?.world
  if (!world?.days || world.days.length === 0) return GAME_STORY_DAYS
  const known = storyDays.get(world)
  if (known) return known
  const own = world.days.map((d): StoryDay => ({
    id: d.id, name: d.name, kind: d.kind ?? 'minor', season: d.season ?? null, days: Array.isArray(d.day) ? d.day : [d.day], line: d.line ?? null, scene: d.scene ?? d.id,
  }))
  const out = [...own, ...GAME_STORY_DAYS.filter((g) => !own.some((d) => d.id === g.id))]
  storyDays.set(world, out)
  return out
}
/** The story's days on a farm day: holidays first, then minor days, each in world.json's order. */
export function storyDaysOn(pack: WorldPack, day: number): StoryDay[] {
  const date = dateOf(day)
  const on = storyDaysOf(pack).filter((d) => (d.season === null || d.season === date.season) && d.days.includes(date.day))
  return [...on.filter((d) => d.kind === 'holiday'), ...on.filter((d) => d.kind !== 'holiday')]
}
/** Her occasions a route can write, one piece each, with the event ids that write it: New Year's, the five festivals'
 * days, their nights (under any of their ids: `<festival>-night`, or the story's alias), her birthday, her anniversary,
 * and each of the story's days' scenes (the game's own six and world.json's). */
export function occasionPieces(pack: WorldPack): { piece: string; ids: readonly string[] }[] {
  const scenes = [...new Set(storyDaysOf(pack).map((d) => d.scene))]
  return [
    { piece: 'new-year', ids: ['new-year'] },
    ...FESTIVAL_IDS.map((f) => ({ piece: f as string, ids: [f] })),
    ...FESTIVAL_IDS.map((f) => ({ piece: FESTIVAL_NIGHTS[f][0]!, ids: FESTIVAL_NIGHTS[f] })),
    { piece: 'birthday', ids: ['birthday'] },
    { piece: 'anniversary', ids: ['anniversary'] },
    ...scenes.map((scene) => ({ piece: scene, ids: [scene] })),
  ]
}

/** One of the story's days' names by its id; null for one the pack no longer holds. */
export const storyDayNameOf = (pack: WorldPack, id: string): string | null => storyDaysOf(pack).find((d) => d.id === id)?.name ?? null

/** A place's words: world.json's name and its one line, each else the game's own (the map's name, the quick look's
 * line). The Town is named by the world's town where its place gives no name. */
export function placeWordsOf(pack: WorldPack, id: FarmPlaceId): { name: string; line: string } {
  const game = farmPlace(id)!
  const own = pack?.world?.places?.[id]
  const name = own?.name ?? (id === 'town' ? pack?.world?.names?.town : undefined) ?? game.name
  return { name, line: own?.line ?? game.blurb }
}
/** A place's name: `placeWordsOf`'s. */
export const placeNameOf = (pack: WorldPack, id: FarmPlaceId): string => placeWordsOf(pack, id).name

/** A season's line on the morning that opens it: world.json's, else none (the game's "Spring begins" alone). */
export const seasonLineOf = (pack: WorldPack, season: Season): string | null => pack?.world?.seasons?.[season] ?? null

/** The Town notes, in world.json's order; none without it. */
export const townNotesOf = (pack: WorldPack): readonly TownNote[] => pack?.world?.notes ?? []
/** A Town note by its id; undefined for one the pack no longer holds. */
export const townNoteOf = (pack: WorldPack, id: string): TownNote | undefined => townNotesOf(pack).find((n) => n.id === id)

/** Each part of the world the game reads, written by the pack or its placeholder: the Farm Story Sandbox's World page. */
export function worldWrittenOf(pack: WorldPack): StoryPart[] {
  const world = pack?.world
  const names = worldNamesOf(pack)
  const festivals = world?.festivals ?? []
  const days = storyDaysOf(pack)
  const places = Object.keys(world?.places ?? {})
  const seasons = Object.keys(world?.seasons ?? {})
  const notes = townNotesOf(pack)
  const part = (name: string, written: boolean, writtenWords: string, plays: string): StoryPart => ({ part: name, written, plays: written ? writtenWords : plays })
  return [
    part('The town’s name', names.town !== null, names.town ?? '', `“${PLACEHOLDER_NAMES.town}” on the map; the opening and the town say no name`),
    part('The farm’s name', names.farm !== null, names.farm ?? '', `“${PLACEHOLDER_NAMES.farm}”`),
    part('The region’s name', names.region !== null, names.region ?? '', 'None'),
    part('The farm’s history', historyOf(pack).length > 0, `${historyOf(pack).length} line${historyOf(pack).length === 1 ? '' : 's'}`, 'None: the Diary’s “The farm” page shows only the names'),
    part('The festivals', festivals.length > 0, `${festivals.filter((e) => isFestivalId(e.id)).length} of the game’s renamed or moved, ${festivals.filter((e) => !isFestivalId(e.id)).length} of the story’s own`, `The game’s ${FESTIVALS.length}: ${FESTIVALS.map((f) => f.name).join(', ')}`),
    part('The story’s days', (world?.days?.length ?? 0) > 0, `${days.filter((d) => d.kind === 'holiday').length} holidays, ${days.filter((d) => d.kind !== 'holiday').length} minor days`, `The game’s ${GAME_STORY_DAYS.length} small days`),
    part('The places’ words', places.length > 0, `${places.length} place${places.length === 1 ? '' : 's'}; the rest the game’s own`, 'The game’s own names and lines'),
    part('The seasons’ lines', seasons.length > 0, `${seasons.length} of 4; the rest “… begins” alone`, '“Spring begins” alone'),
    part('Town notes', notes.length > 0, `${notes.length}, ${notes.filter((n) => !n.unlock).length} known from the start`, 'None'),
  ]
}

// === What's written, and what plays instead (the sandbox's) =============================================================

/** One part of a character as the game plays it: written by the pack, or its placeholder (what plays instead). */
export interface StoryPart { part: string; written: boolean; plays: string }

/** Each part of her the game reads, and whether the pack writes it or a placeholder plays: the Farm Story Sandbox's
 * per-character marks. */
export function writtenOf(pack: Pick<StoryPack, 'cast' | 'bibles' | 'scripted' | 'ties' | 'pairs' | 'household'> & Partial<Pick<StoryPack, 'world'>>, id: string): StoryPart[] {
  const entry = castEntry(pack, id)
  const bible: UmaBible | undefined = pack.bibles.get(id)
  const scripted = pack.scripted.get(id) ?? new Set<string>()
  const events = [...RUNGS.filter((r) => r !== ARRIVAL), ...DEFAULT_LIFE_EVENTS]
  const writtenEvents = events.filter((r) => scripted.has(r)).length
  const pieces = occasionPieces(pack)
  const occasions = pieces.filter((p) => p.ids.some((o) => scripted.has(o))).length
  const greetings = Object.values(bible?.greetings ?? {}).some((v) => Array.isArray(v) ? v.length > 0 : typeof v === 'object' && v !== null && Object.values(v).some((l) => Array.isArray(l) && l.length > 0))
  const giftLines = (['loved', 'liked', 'neutral', 'disliked'] as const).filter((t) => (bible?.giftLines?.[t]?.length ?? 0) > 0)
  const evenings = EVENING_SCENES
  const writtenEvenings = evenings.filter((e) => scripted.has(e)).length
  const chats = (['friend', 'partner', 'spouse'] as const).filter((set) => (bible?.chats?.[set] ?? []).length > 0)
  const ties = pack.ties.ties.filter((t) => t.a === id || t.b === id)
  const pairLevelsWritten = ties.reduce((n, t) => n + (pack.pairs.get(pairKey(t.a, t.b))?.size ?? 0), 0)
  const household = pack.household
  const beats = [...(household?.scenes ?? []).filter((s) => s.each?.[id]), ...(household?.finale?.each?.[id] ? [household.finale] : [])].length
  const part = (name: string, written: boolean, writtenWords: string, plays: string): StoryPart => ({ part: name, written, plays: written ? writtenWords : plays })
  return [
    part('Her outfit', !!entry?.outfitId, `Outfit ${entry?.outfitId ?? ''}`, 'Her default outfit from master data, with her name'),
    part('Her favourite line', !!(bible?.favouriteLine ?? entry?.calling), bible?.favouriteLine ?? entry?.calling ?? '', 'Her line from master data’s stats'),
    part('Her tastes', !!(bible?.gifts?.loved || bible?.gifts?.liked?.length || bible?.gifts?.disliked?.length), 'Her bible’s gifts', 'The default story’s: her favourite good (by her line) loved, the rest neutral'),
    part('Her birthday', !!entry?.birthday, 'The cast’s date', 'Master data’s, or none'),
    part('Her chats', chats.length === 3, 'Friend, partner and spouse', chats.length > 0 ? `Her ${chats.join(' and ')} lines; the default story’s talks for the rest` : 'The default story’s talks, by her stage and temperament'),
    part('Her meeting scene', scripted.has(ARRIVAL), 'Her arrival scene', 'The default story’s meeting, in town'),
    part('Her events', writtenEvents === events.length, `All ${events.length}`, `${writtenEvents} of ${events.length} written; the rest play the default story’s, paying as written`),
    part('Her occasions', occasions === pieces.length, `All ${pieces.length}`, `${occasions} of ${pieces.length} written; New Year’s, the Flower Show and the Fishing Derby’s night play the default story’s, the rest play only when written`),
    part('Her evenings', writtenEvenings === evenings.length, `All ${evenings.length}`, `${writtenEvenings} of ${evenings.length} written; the rest the default story’s`),
    part('Her chapters', (entry?.chapters?.length ?? 0) > 0, `${entry?.chapters?.length ?? 0}, the story’s`, `The four defaults: ${DEFAULT_CHAPTERS.map((c) => c.title).join(', ')}`),
    part('Her life in town', !!(entry?.home ?? entry?.job ?? entry?.routine?.length), [entry?.home ? 'A home' : '', entry?.job ? 'a job' : '', entry?.routine?.length ? 'a routine' : ''].filter(Boolean).join(', '),
      'None: today’s draw places her'),
    part('Her favourite spot', !!entry?.spot, `${entry?.spot ? PLACEHOLDER_SPOTS[entry.spot].name : ''}`, 'None: she’s out at any spot alike'),
    part('Her town lines', (bible?.townLines?.length ?? 0) > 0, `${bible?.townLines?.length ?? 0}, hers`, `The game’s ${PLACEHOLDER_TOWN_LINES.length} short lines`),
    part('Her greetings', greetings, 'Hers, by birthday, place, season and hour', 'None: a talk opens on her line'),
    part('Her small talk', (bible?.smallTalk?.length ?? 0) > 0, `${bible?.smallTalk?.length ?? 0}, hers`, 'None: a talk is her line alone'),
    part('Her gift lines', giftLines.length === 4, 'Every taste, hers', giftLines.length > 0 ? `Her ${giftLines.join(', ')} lines; the default story’s for the rest` : 'The default story’s, by her taste'),
    part('Her morning greetings', (bible?.mornings?.length ?? 0) > 0, `${bible?.mornings?.length ?? 0}, hers`, 'The default story’s, by her temperament'),
    part('Her meal lines', (bible?.meals?.breakfast?.length ?? 0) > 0 && (bible?.meals?.dinner?.length ?? 0) > 0, 'Breakfast and dinner, hers',
      'The default story’s, where hers are missing'),
    ...(isSister(id) ? [part('Her name', !!entry?.name, entry?.name ?? '', 'Her elder’s name, as her sister')] : []),
    part('Her pet name for you', !!bible?.petName, `“${bible?.petName ?? ''}”`, 'Your name'),
    part('Her keepsake', !!(bible?.keepsake?.name && bible.keepsake.line), bible?.keepsake?.name ?? '', `“${PLACEHOLDER_KEEPSAKE.name}”, with a plain line`),
    part('Her ring’s words', !!beatOf(pack, id, 'r8')?.beat, 'Her Romance 8 caption', `“${PLACEHOLDER_ENGRAVING}”`),
    part('Her wedding places', (bible?.wedding?.places.length ?? 0) > 0, (bible?.wedding?.places ?? []).join(', '), 'Her wedding beat’s place and the farm’s'),
    part('Her pairs', ties.length > 0 && pairLevelsWritten === ties.length * BOND_LEVELS.length, 'Every level', ties.length === 0 ? 'No ties' : `${pairLevelsWritten} of ${ties.length * BOND_LEVELS.length} levels written; the rest a short card`),
    part('Her household beats', beats === HOUSEHOLD_SCENES.length + 1, 'Every scene and the finale', `${beats} of ${HOUSEHOLD_SCENES.length + 1} written; the rest her one line`),
    part('Her house lines', (household?.houseLines?.[id]?.length ?? 0) > 0, 'Her own', 'Her temperament’s'),
  ]
}

/** 1st, 2nd, 3rd, 4th…: a place in a list, in words. */
export const ordinal = (n: number): string => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`

/** The placeholders, as the manual lists them: what the story can give, and what plays without it. */
export const PLACEHOLDER_TABLE: readonly { gives: string; without: string }[] = [
  { gives: 'The cast', without: `Master data’s first ${DEFAULT_WELCOME} characters, in its order` },
  { gives: 'The opening', without: 'Two short lines: the farm, and its nine Carrot seeds' },
  { gives: 'Her name and outfit', without: 'Her master-data name and default outfit (her first original one)' },
  { gives: 'Her chat lines, by stage', without: `The default story’s talks: ${DEFAULT_TALKS.friend.steady.length} a stage (acquaintance, friend, farmhand, sweetheart, engaged, married) for each of her ${Object.keys(DEFAULT_TALKS.friend).length} temperaments` },
  { gives: 'Her gift reactions', without: `The default story’s: ${DEFAULT_GIFT_REACTIONS.loved.length} lines for each taste (loved, liked, neutral, disliked)` },
  { gives: 'Her meeting scene', without: 'The default story’s, in town, where you introduced yourself; it pays as a written one does. A written one with no choice gets the hello' },
  { gives: 'A heart event', without: 'The default story’s: her moment, her lines with their faces and your reply; its points and rewards pay as written' },
  { gives: 'The wedding night, moving in, married life 2 and 4', without: 'The default story’s: the wedding night in its outfit, tender and fading to morning; they pay nothing' },
  { gives: 'Her occasions', without: 'The default story’s New Year’s, Flower Show and Fishing Derby night; her birthday, her anniversary, the other festivals’ days and nights and the story’s days play only when written' },
  { gives: 'Her greetings', without: 'None: a chat or a talk in town opens on her line' },
  { gives: 'Her small talk', without: 'None: a chat is her line alone' },
  { gives: 'Her gift lines', without: `The default story’s gift reactions, by her taste` },
  { gives: 'Her evenings’ scenes', without: `The default story’s ${EVENING_SCENES.length}: a hangout’s and a date’s for each kind, Dinner in town and A night in` },
  { gives: 'Her morning greetings and meal lines', without: `The default story’s: ${DEFAULT_MORNINGS.steady.length} greetings for each temperament, and ${DEFAULT_MEALS.breakfast.length} lines for each meal` },
  { gives: 'A play’s prompt', without: 'Its game’s: “Cast the line together.”' },
  { gives: 'Her chapters', without: DEFAULT_CHAPTERS.map((c) => `“${c.title}”`).join(', ') },
  { gives: 'Her favourite line', without: 'Her line from master data: the work her stats suit best' },
  { gives: 'Her tastes', without: 'Her favourite good loved (by her line: a Carrot for farming, a Trout for fishing…, each one the first season gives), every other gift neutral' },
  { gives: 'Her birthday', without: 'Master data’s, or none' },
  { gives: 'Her pet name for you', without: 'Your name' },
  { gives: 'Her keepsake', without: `“${PLACEHOLDER_KEEPSAKE.name}”, with a plain line` },
  { gives: 'Her ring’s words', without: `“${PLACEHOLDER_ENGRAVING}”` },
  { gives: 'Her wedding places', without: 'Her wedding beat’s place and the farm’s: the chapel bell, the Fields, the overlook' },
  { gives: 'A tie’s kind, strength and line', without: `“Close”, strength 1, “${PLACEHOLDER_TIE.line}”` },
  { gives: 'A pair’s conversation', without: 'Two short lines, one each, at every bond level of a tie; it pays nothing, as written' },
  { gives: 'A household scene or the finale', without: 'A short card: a line, each spouse’s line, a line; the finale’s dance. It pays nothing, as written' },
  { gives: 'Her house lines', without: 'Her temperament’s' },
  { gives: 'The town’s people', without: `Master data’s characters fill the ${CAST_IDS.length} roles, from the last in its order, never one of the cast` },
  { gives: 'The town’s spots', without: `The game’s ${SPOT_IDS.length}: ${SPOT_IDS.map((id) => PLACEHOLDER_SPOTS[id].name).join(', ')}` },
  { gives: 'Her favourite spot', without: 'One of the six by her place in the cast, three Umas each' },
  { gives: 'Her home, her job and her routine', without: 'The default schedule: her favourite spot on every third day of each season (from day 1, 2 or 3 by her place in the cast), at home the other days' },
  { gives: 'The town’s locations (homes, workplaces)', without: 'None: the six spots and the four shops and offices' },
  { gives: 'Her town line', without: `${PLACEHOLDER_TOWN_LINES.length} short lines, one a day` },
  { gives: 'A sister’s name', without: 'Her elder’s name, as her sister' },
  { gives: 'The town’s, the farm’s and the region’s names', without: `“${PLACEHOLDER_NAMES.town}” on the map, “${PLACEHOLDER_NAMES.farm}” in the Diary, no region; the opening names none` },
  { gives: 'The farm’s history', without: 'None' },
  { gives: 'The festivals', without: `The game’s ${FESTIVALS.length}: ${FESTIVALS.map((f) => f.name).join(', ')}, on each season’s 10th day and Winter 12` },
  { gives: 'The story’s holidays and minor days', without: `The game’s ${GAME_DAYS_OF_STORY.length} small days: ${GAME_DAYS_OF_STORY.map((d) => `${d.name} (${d.season[0]!.toUpperCase()}${d.season.slice(1)} ${d.day})`).join(', ')}` },
  { gives: 'A place’s name and line', without: 'The map’s own name, and its quick look’s line' },
  { gives: 'A season’s line', without: 'None: the morning says “Spring begins” alone' },
  { gives: 'Town notes', without: 'None' },
]

// === Her life in town ====================================================================================================

/** Her home, her job and her routine: her cast entry's, each none without it (the default schedule places her:
 * `town/town.ts`'s `scheduleOf`). */
export const herHomeOf = (pack: Pick<StoryPack, 'cast'>, id: string): string | null => castEntry(pack, id)?.home ?? null
export const herJobOf = (pack: Pick<StoryPack, 'cast'>, id: string): HerJob | null => castEntry(pack, id)?.job ?? null
export const herRoutineOf = (pack: Pick<StoryPack, 'cast'>, id: string): readonly RoutineStop[] => castEntry(pack, id)?.routine ?? []
/** The locations the story adds to the town map (`town.json`'s), in its order; none without it. */
export const storyLocationsOf = (pack: Partial<Pick<StoryPack, 'town'>>): readonly TownLocation[] => pack.town?.locations ?? []
