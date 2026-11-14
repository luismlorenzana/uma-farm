// The placeholders: what the game plays wherever the story pack is silent, and the one lookup that reads "the pack's, or
// the placeholder". Nothing is gated on the story: every ladder, event, perk, evening, proposal, wedding and household
// plays end to end on these, and a pack only adds words, scenes and her own chapters. They read as the game's own voice,
// short and plain, with no "placeholder" label in play; the Farm Story Sandbox marks them per character (`writtenOf`).
//
//   the cast                 the pack's; with none, master data's first five (the welcome list's size)
//   the opening              three short lines: the farm, its nine Carrot seeds, and someone waiting at the Gate
//   her name and outfit      master data's name and her default outfit (`MasterCast`, read at boot)
//   her chats, by stage      a few short lines a stage (before Friendship 1, her temperament's, as always)
//   her meeting scene        two short lines and a hello, paying as a written one does
//   a heart event or play    a short card with her line and a reply; its points and rewards pay as written
//   her chapters             four: "Getting to know her", "Together", "The wedding", "Married life"
//   her line, her tastes     her line from master data's stats; every gift neutral
//   her birthday             master data's, or none
//   pet name, keepsake, ring's words, wedding places, a tie's kind and line, a play's prompt     plain defaults
//   pairs and household      a short card that pays as written (nothing)
//   the town's people        master data's characters fill the roles the pack leaves, from the last in its order
//   the town's spots         the game's six: the Plaza, the Market, the Café, the Harbour, the Library, the Hilltop Track
//   her town line            a few short lines, one a day; her favourite spot: none
//   a sister's name          her elder's name, as her sister
//   the world's names        the town is "Town" on the map, the farm "The farm"; no region
//   the farm's history       none: the Diary's "The farm" page shows only what's named
//   the festivals            the game's five, on their days: each season's 10th, and the Harvest Cup on Winter 12
//   a place's name and line  the map's own name and its quick look's line
//   a season's line          none: the morning says "Spring begins" alone
//   Town notes               none
//
// Every read of the pack goes through a function here. Pure; loaded with the story pack.
import { FESTIVALS, festivalDayOfYear, isFestivalId, type Festival, type Season } from '../farm/calendar'
import type { Activity } from '../farm/ranks'
import { activityScore, talentScores, type TalentOutfit } from '../farm/talents'
import { isGoodId } from '../goods/ids'
import type { Taste } from '../romance/chats'
import { pairKey } from '../save/v4'
import {
  ARRIVAL, FAVOURITE_LINES, HOUSEHOLD_SCENES, isSister, RUNGS, sisterOutfit, SPOT_IDS, type Beat, type Calling, type Cast, type ChoiceOption, type DateGame, type Finale, type Gifts,
  type HerChapter, type Household, type HouseholdAt, type HouseholdScene, type Keepsake, type PairConversations, type Play, type SpotId, type Step, type StoryPlace, type StoryTrigger,
  type Tie, type TieKind, type TownNote, type UmaBible, type Wish,
} from './authored'
import { CAST, CAST_IDS, isCastId, type CastId } from './cast'
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

/** The welcome list's size when the pack names none, and the placeholders' cast. */
export const DEFAULT_WELCOME = 5

/** The cast while the pack names nobody: master data's first five characters (the welcome list's size), so a farm with
 * no story still has visitors at the Gate from day 1. Everyone else is met in town. */
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

/** Her gifts: her bible's, else none (every gift neutral). */
export const giftsOf = (pack: Pick<StoryPack, 'bibles'>, id: string): Gifts => pack.bibles.get(id)?.gifts ?? {}

/** What she thinks of a good as a gift: her bible's loved, liked and disliked, any number of each; everything else
 * neutral. A proposed good counts once it exists in `goods/ids.ts`; until then that slot is neutral. No bible: neutral. */
export function tasteOf(pack: Pick<StoryPack, 'bibles'>, id: string, good: string, isGood: (id: string) => boolean = isGoodId): Taste {
  const gifts = giftsOf(pack, id)
  if (!isGood(good)) return 'neutral'
  if (gifts.loved === good) return 'loved'
  if (gifts.liked?.includes(good)) return 'liked'
  if (gifts.disliked?.includes(good)) return 'disliked'
  return 'neutral'
}

/** Her birthday as a date: her cast entry's, else master data's character set's, else none. */
export function birthdayOf(pack: Pick<StoryPack, 'cast'>, id: string, master: ReadonlyMap<string, { month: number; day: number }>): { month: number; day: number } | null {
  return castEntry(pack, id)?.birthday ?? master.get(id) ?? null
}

/** Her wishes for married life: her bible's, none without one. */
export const wishesOf = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly Wish[] => pack.bibles.get(id)?.wishes ?? []

// === The welcome list, her trigger, her arrival and her chapters ========================================================

/** Her trigger to meet when the pack gives none: talk with her on three different days. */
export const DEFAULT_MEET: StoryTrigger = { kind: 'talks', days: 3 }

/** Her chapters when the pack gives none: four, along the route's backbone. */
export const DEFAULT_CHAPTERS: readonly Required<Pick<HerChapter, 'title' | 'events'>>[] = [
  { title: 'Getting to know her', events: RUNGS.slice(0, RUNGS.indexOf('confession') + 1) },
  { title: 'Together', events: RUNGS.slice(RUNGS.indexOf('r1'), RUNGS.indexOf('proposal') + 1) },
  { title: 'The wedding', events: ['wedding'] },
  { title: 'Married life', events: ['s1', 's3', 's5'] },
]

/** The welcome list: who comes to the farm in the first days, in order. The pack's `welcome`, else the first five of the
 * cast, in its order, sisters aside. From day 1 one a morning visits the Gate (`gateVisitor`) and meets you on her first
 * talk. */
export function welcomeOf(pack: Pick<StoryPack, 'cast'>): string[] {
  const named = pack.cast.welcome ?? []
  return named.length > 0 ? [...named] : castOrder(pack).filter((id) => !isSister(id)).slice(0, DEFAULT_WELCOME)
}

/** Her trigger to meet: her cast entry's `meet`, else talking with her on three different days. */
export const meetOf = (pack: Pick<StoryPack, 'cast'>, id: string): StoryTrigger => castEntry(pack, id)?.meet ?? DEFAULT_MEET

/** Whether she's on the welcome list: she meets you on her first talk, whatever her trigger. */
export const onWelcomeList = (pack: Pick<StoryPack, 'cast'>, id: string): boolean => welcomeOf(pack).includes(id)

/** Her chapters: her cast entry's, else the four default ones. `romance/chapters.ts` plays them along her route. */
export function chaptersOf(pack: Pick<StoryPack, 'cast'>, id: string): readonly HerChapter[] {
  const own = castEntry(pack, id)?.chapters ?? []
  return own.length > 0 ? own : DEFAULT_CHAPTERS
}

/** The welcome list as it visits, in its order: each one in the cast, and none of the town's people (they keep their
 * spots). From day 1, one a morning comes to the Gate (`gateVisitor`). */
export function welcomeVisitors(pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>): string[] {
  return welcomeOf(pack).filter((id) => castEntry(pack, id) !== undefined && !isTownPerson(pack, id))
}

/** Day 1's visitor, the farm's first helper: the welcome list's first who visits, or null with nobody. She waits at the
 * Gate from the opening's end, and moves in when you say hello. */
export const firstVisitorOf = (pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>): string | null => welcomeVisitors(pack)[0] ?? null

/** The opening's lines when the pack writes none: three, short, ending on someone at the Gate (day 1's visitor). */
export const PLACEHOLDER_OPENING: readonly Step[] = [
  { narrate: 'Morning, {farmer}. The farm is yours now, weeds and all.' },
  { narrate: 'One block is tilled, and nine Carrot seeds wait in the Fields.' },
  { narrate: 'And someone is already waiting at the Gate.' },
]

/** The opening's lines, in order: the pack's `opening.json`, else the game's three (without the Gate's line when nobody
 * is coming). They play once, on day 1, after the farmer's name; then Home. */
export function openingOf(pack: Pick<StoryPack, 'cast' | 'opening'> & Partial<Pick<StoryPack, 'town'>>): readonly Step[] {
  if (pack.opening) return pack.opening.steps
  return firstVisitorOf(pack) === null ? PLACEHOLDER_OPENING.slice(0, -1) : PLACEHOLDER_OPENING
}

// === Her route: beats, events and her words =============================================================================

/** Her route's beats: her bible's, else none (every rung plays with the game's defaults). */
export const routeBeats = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly Beat[] => pack.bibles.get(id)?.route ?? []
/** The beat a rung plays, from her bible; none without one: her full bar is its setup, and it has no place, no play of
 * its own, no hint and no unlock. */
export const beatOf = (pack: Pick<StoryPack, 'bibles'>, id: string, rung: string): Beat | undefined => routeBeats(pack, id).find((b) => b.id === rung)

/** A heart event's moment, by rung: the card's first line, and its Memory's caption when her beat gives none. */
export const PLACEHOLDER_MOMENTS: Readonly<Record<string, string>> = {
  arrival: 'Someone new is waiting at the Gate.',
  f1: 'A quiet afternoon with her.',
  f2: 'She shows you her favourite corner of the farm.',
  f3: 'You share a snack on the fence rail.',
  f4: 'She asks how the farm came to be yours.',
  f5: 'You work side by side until the light turns gold.',
  f6: 'She laughs at a joke you didn’t mean to make.',
  f7: 'A long walk home, talking the whole way.',
  f8: 'She tells you something she hasn’t told anyone here.',
  f9: 'You mend a broken gate together.',
  f10: 'She waits for you at the end of the day.',
  confession: 'She asks you to stay after everyone else has gone.',
  r1: 'Your first evening together, just the two of you.',
  r2: 'She holds your hand all the way home.',
  r3: 'A picnic for two, with far too much food.',
  r4: 'She leans on your shoulder and watches the clouds.',
  r5: 'You cook supper together and only burn a little.',
  r6: 'A slow dance with no music at all.',
  r7: 'She saves you the best seat by the fire.',
  r8: 'You count the stars until you both lose track.',
  r9: 'She talks about the years ahead, and you’re in all of them.',
  r10: 'A quiet night when nothing needs saying.',
  proposal: 'You find a quiet moment and hold out the ring.',
  wedding: 'The bell rings, and everyone you love is here.',
  s1: 'Your first morning at home together.',
  s3: 'A lazy afternoon with nowhere to be.',
  s5: 'You renew your vows on a quiet evening.',
}

/** Her lines on a placeholder card, by ladder; a rung picks one by its number. */
const HER_LINES = {
  friendship: ['I’m glad I came here.', 'Same time tomorrow?', 'You’re easy to talk to, {farmer}.'],
  romance: ['I like us.', 'Stay a little longer?', 'Every day’s better with you in it, {farmer}.'],
  spouse: ['This is my favourite part of the day.', 'I’d choose you again. Every time.', 'Home is wherever you are.'],
} as const

/** Your replies on a placeholder card, by ladder: the warmer one pays +30, the other +10, as a written choice does. */
const REPLIES: Readonly<Record<keyof typeof HER_LINES, readonly [ChoiceOption, ChoiceOption]>> = {
  friendship: [{ text: 'I’m glad too.', tone: 'warm', friendship: 2 }, { text: 'Anytime.', tone: 'playful', friendship: 1 }],
  romance: [{ text: 'I’m not going anywhere.', tone: 'warm', romance: 2 }, { text: 'Only if you share the blanket.', tone: 'playful', romance: 1 }],
  spouse: [{ text: 'And I’d choose you.', tone: 'warm', romance: 2 }, { text: 'Tea first, then forever.', tone: 'playful', romance: 1 }],
}

/** Her meeting scene's hello: your answer, which pays as a written arrival's choice does (+30 the warmer, +10 the other). */
export const PLACEHOLDER_HELLO: readonly ChoiceOption[] = [
  { text: 'Welcome! We’re glad you came.', tone: 'warm', friendship: 2 },
  { text: 'Hello! Come on in.', tone: 'playful', friendship: 1 },
]

/** Meeting her in town when her route writes no arrival scene: the moment, her line and your reply, as the Gate's two
 * lines and a hello pay. The welcome list's meet you at the Gate instead. */
export const PLACEHOLDER_TOWN_MEETING: readonly Step[] = [
  { place: 'town' },
  { narrate: 'You get talking, and the time slips by.' },
]
export const PLACEHOLDER_TOWN_LINE = 'I’m glad we got talking, {farmer}. Tell me about your farm sometime?'
export const PLACEHOLDER_TOWN_HELLO: readonly ChoiceOption[] = [
  { text: 'I’d like that. Come and see it.', tone: 'warm', friendship: 2 },
  { text: 'Only if you tell me about you.', tone: 'playful', friendship: 1 },
]

const ladderOfRung = (rung: string): keyof typeof HER_LINES => (rung.startsWith('s') ? 'spouse' : rung.startsWith('r') ? 'romance' : 'friendship')

/** The game's own short card for a rung the pack doesn't script: her moment, her line and your reply, so it pays as a
 * written event does (+50, the reply's +30 or +10, and its grade). The big rungs keep their shape: her confession's reply
 * holds Yes and Not yet, the proposal's says yes, the wedding's last choice is the vows. Her arrival is two lines and a
 * hello at the Gate (the welcome list's), or met in town (`inTown`, anyone else), two lines and a reply there. Every line
 * is short and original, and `{farmer}` is the only placeholder. */
export function placeholderEvent(id: string, rung: string, inTown = false): Step[] {
  const moment: Step = { narrate: PLACEHOLDER_MOMENTS[rung] ?? PLACEHOLDER_MOMENTS.f1! }
  switch (rung) {
    case ARRIVAL:
      if (inTown) return [...PLACEHOLDER_TOWN_MEETING, { say: id, line: PLACEHOLDER_TOWN_LINE }, { choice: [...PLACEHOLDER_TOWN_HELLO] }]
      return [{ place: 'gate' }, moment, { say: id, line: 'Hi! Is this the farm? I’d love to help out.' }, { choice: [...PLACEHOLDER_HELLO] }]
    case 'confession':
      return [moment, { say: id, line: 'I like you, {farmer}. More than a friend. Do you feel the same?', emote: 'shy' }, {
        choice: [
          { text: 'I do. I really do.', tone: 'warm', romance: 2, answer: 'yes', then: [{ say: id, line: 'Then let’s see where this goes.', emote: 'happy' }] },
          { text: 'Can we take it slowly?', tone: 'honest', friendship: 1, answer: 'not-yet', then: [{ say: id, line: 'Okay. I’ll be right here.', emote: 'tender' }] },
        ],
      }]
    case 'proposal':
      return [moment, { say: id, line: 'Yes. Of course, yes.', emote: 'happy' }, {
        choice: [{ text: 'I love you.', tone: 'warm', romance: 2 }, { text: 'You had me worried for a second.', tone: 'playful', romance: 1 }],
      }]
    case 'wedding':
      return [moment, { say: id, line: 'I’m ready. Are you?', emote: 'tender' }, {
        choice: [
          { text: 'Always.', tone: 'warm', romance: 2 },
          { text: 'I promise to keep you laughing.', tone: 'playful', romance: 1 },
          { text: 'I’ll be here, every day.', tone: 'honest', romance: 1 },
        ],
      }]
  }
  const ladder = ladderOfRung(rung)
  const lines = HER_LINES[ladder]
  const n = Number(rung.slice(1)) || 1
  return [moment, { say: id, line: lines[(n - 1) % lines.length]! }, { choice: [...REPLIES[ladder]] }]
}

/** Whether steps hold a choice anywhere a path can reach. */
const hasChoice = (steps: readonly Step[]): boolean => steps.some((s) => ('choice' in s) || ('when' in s && (hasChoice(s.then) || hasChoice(s.else ?? []))))

/** An event the game plays: the pack's for her rung, else the game's own card. Her written arrival with no choice gets
 * the hello, so it pays as one with a choice does. Her unwritten arrival is the Gate's for the welcome list, else the
 * town's (with the cast to tell). `written` says which; `outfit` is the written event's own, if it names one (the game's
 * card wears the moment's). */
export interface PlayedEvent { id: string; steps: readonly Step[]; written: boolean; outfit?: StoryOutfit }
export async function eventOf(pack: Pick<StoryPack, 'route'> & Partial<Pick<StoryPack, 'cast'>>, id: string, rung: string): Promise<PlayedEvent> {
  const event = (await pack.route(id))?.events.find((e) => e.id === rung)
  const steps = event?.steps
  if (!steps) return { id: rung, steps: placeholderEvent(id, rung, rung === ARRIVAL && pack.cast !== undefined && !welcomeOf({ cast: pack.cast }).includes(id)), written: false }
  return {
    id: rung, steps: rung === ARRIVAL && !hasChoice(steps) ? [...steps, { choice: [...PLACEHOLDER_HELLO] }] : steps, written: true,
    ...(event.outfit ? { outfit: event.outfit } : {}),
  }
}

/** Her Memory's caption for a rung: her beat's, else the card's moment. */
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

/** Her chat lines from Friendship 1, by stage, when her bible gives none: short, warm and her own to fill (`{name}` her
 * name, `{farmer}` yours). Before Friendship 1 she speaks her temperament's lines. */
export const PLACEHOLDER_CHATS: Readonly<Record<'friend' | 'partner' | 'spouse', readonly string[]>> = {
  friend: [
    '“Morning! I saved you a spot by the fence.”',
    '{name} waves. “Busy day? Me too. Let’s get through it together.”',
    '“I like it here. The farm feels like it’s waking up.”',
    '{name} smiles. “Thanks for checking on me, {farmer}.”',
    '“Tell me how your day goes later, okay?”',
  ],
  partner: [
    '{name} brightens when she sees you. “There you are.”',
    '“I kept thinking about you all morning, {farmer}.”',
    '{name} squeezes your hand. “Okay. Now I’m ready for the day.”',
    '“Walk with me later? Just the two of us.”',
    '“You make the hard days easy. Did you know that?”',
  ],
  spouse: [
    '“Good morning. I made too much tea again.”',
    '{name} straightens your collar. “There. Now you’re ready.”',
    '“Home feels like home because you’re in it.”',
    '{name} laughs softly. “Every day with you is a good one.”',
    '“Don’t work too hard. Come back to me in one piece.”',
  ],
}
/** Her chat lines for a stage: her bible's set when it holds any, else the stage's placeholders. */
export function chatLinesOf(pack: Pick<StoryPack, 'bibles'>, id: string, set: 'friend' | 'partner' | 'spouse'): readonly string[] {
  const own = pack.bibles.get(id)?.chats?.[set] ?? []
  return own.length > 0 ? own : PLACEHOLDER_CHATS[set]
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
export function writtenOf(pack: Pick<StoryPack, 'cast' | 'bibles' | 'scripted' | 'ties' | 'pairs' | 'household'>, id: string): StoryPart[] {
  const entry = castEntry(pack, id)
  const bible: UmaBible | undefined = pack.bibles.get(id)
  const scripted = pack.scripted.get(id) ?? new Set<string>()
  const events = RUNGS.filter((r) => r !== ARRIVAL)
  const writtenEvents = events.filter((r) => scripted.has(r)).length
  const chats = (['friend', 'partner', 'spouse'] as const).filter((set) => (bible?.chats?.[set] ?? []).length > 0)
  const ties = pack.ties.ties.filter((t) => t.a === id || t.b === id)
  const pairLevelsWritten = ties.reduce((n, t) => n + (pack.pairs.get(pairKey(t.a, t.b))?.size ?? 0), 0)
  const household = pack.household
  const beats = [...(household?.scenes ?? []).filter((s) => s.each?.[id]), ...(household?.finale?.each?.[id] ? [household.finale] : [])].length
  const part = (name: string, written: boolean, writtenWords: string, plays: string): StoryPart => ({ part: name, written, plays: written ? writtenWords : plays })
  const welcome = welcomeOf(pack).indexOf(id)
  return [
    part('Her outfit', !!entry?.outfitId, `Outfit ${entry?.outfitId ?? ''}`, 'Her default outfit from master data, with her name'),
    part('Her favourite line', !!(bible?.favouriteLine ?? entry?.calling), bible?.favouriteLine ?? entry?.calling ?? '', 'Her line from master data’s stats'),
    part('Her tastes', !!(bible?.gifts?.loved || bible?.gifts?.liked?.length || bible?.gifts?.disliked?.length), 'Her bible’s gifts', 'Every gift neutral'),
    part('Her birthday', !!entry?.birthday, 'The cast’s date', 'Master data’s, or none'),
    part('Her chats', chats.length === 3, 'Friend, partner and spouse', chats.length > 0 ? `Her ${chats.join(' and ')} lines; the game’s for the rest` : 'The game’s short lines for each stage'),
    part('Her meeting scene', scripted.has(ARRIVAL), 'Her arrival scene', 'Two short lines and a hello'),
    part('Her events', writtenEvents === events.length, `All ${events.length}`, `${writtenEvents} of ${events.length} written; the rest play a short card that pays as written`),
    part('Her chapters', (entry?.chapters?.length ?? 0) > 0, `${entry?.chapters?.length ?? 0}, the story’s`, `The four defaults: ${DEFAULT_CHAPTERS.map((c) => c.title).join(', ')}`),
    welcome >= 0
      ? part('Her trigger to meet', pack.cast.welcome !== undefined && pack.cast.welcome.length > 0, `Her first talk: the welcome list’s ${ordinal(welcome + 1)}, at the Gate`, `Her first talk: the welcome list’s ${ordinal(welcome + 1)} (the cast’s first ${DEFAULT_WELCOME}), at the Gate`)
      : part('Her trigger to meet', !!entry?.meet, 'The story’s', 'Talk with her on three different days'),
    part('Her favourite spot', !!entry?.spot, `${entry?.spot ? PLACEHOLDER_SPOTS[entry.spot].name : ''}`, 'None: she’s out at any spot alike'),
    part('Her town lines', (bible?.townLines?.length ?? 0) > 0, `${bible?.townLines?.length ?? 0}, hers`, `The game’s ${PLACEHOLDER_TOWN_LINES.length} short lines`),
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
  { gives: 'The cast', without: `Master data’s first ${DEFAULT_WELCOME} characters, in its order (the welcome list’s size)` },
  { gives: 'The opening', without: 'Three short lines: the farm, its nine Carrot seeds, and someone waiting at the Gate (that line only when someone is coming)' },
  { gives: 'Her name and outfit', without: 'Her master-data name and default outfit (her first original one)' },
  { gives: 'Her chat lines, by stage', without: `${PLACEHOLDER_CHATS.friend.length} short lines a stage, written for the game (before Friendship 1, her temperament’s)` },
  { gives: 'Her meeting scene', without: 'Two short lines and a hello, at the Gate for the welcome list, in town for anyone else; it pays as a written one does. A written one with no choice gets the hello' },
  { gives: 'A heart event', without: 'A short card: her moment, her line and your reply; its points and rewards pay as written' },
  { gives: 'A play’s prompt', without: 'Its game’s: “Cast the line together.”' },
  { gives: 'Her chapters', without: DEFAULT_CHAPTERS.map((c) => `“${c.title}”`).join(', ') },
  { gives: 'Her trigger to meet', without: 'Talk with her on three different days' },
  { gives: 'Her favourite line', without: 'Her line from master data: the work her stats suit best' },
  { gives: 'Her tastes', without: 'Every gift neutral' },
  { gives: 'Her birthday', without: 'Master data’s, or none' },
  { gives: 'Her pet name for you', without: 'Your name' },
  { gives: 'Her keepsake', without: `“${PLACEHOLDER_KEEPSAKE.name}”, with a plain line` },
  { gives: 'Her ring’s words', without: `“${PLACEHOLDER_ENGRAVING}”` },
  { gives: 'Her wedding places', without: 'Her wedding beat’s place and the farm’s: the chapel bell, the Fields, the overlook' },
  { gives: 'A tie’s kind, strength and line', without: `“Close”, strength 1, “${PLACEHOLDER_TIE.line}”` },
  { gives: 'A pair’s conversation', without: 'Two short lines, one each, at every bond level of a tie; it pays nothing, as written' },
  { gives: 'A household scene or the finale', without: 'A short card: a line, each spouse’s line, a line; the finale’s dance. It pays nothing, as written' },
  { gives: 'Her house lines', without: 'Her temperament’s' },
  { gives: 'The welcome list', without: `The cast’s first ${DEFAULT_WELCOME}, in its order: one a morning at the Gate from day 1, each met on her first talk` },
  { gives: 'The town’s people', without: `Master data’s characters fill the ${CAST_IDS.length} roles, from the last in its order, never one of the cast` },
  { gives: 'The town’s spots', without: `The game’s ${SPOT_IDS.length}: ${SPOT_IDS.map((id) => PLACEHOLDER_SPOTS[id].name).join(', ')}` },
  { gives: 'Her favourite spot', without: 'None: she’s out at any spot alike' },
  { gives: 'Her town line', without: `${PLACEHOLDER_TOWN_LINES.length} short lines, one a day` },
  { gives: 'A sister’s name', without: 'Her elder’s name, as her sister' },
  { gives: 'The town’s, the farm’s and the region’s names', without: `“${PLACEHOLDER_NAMES.town}” on the map, “${PLACEHOLDER_NAMES.farm}” in the Diary, no region; the opening names none` },
  { gives: 'The farm’s history', without: 'None' },
  { gives: 'The festivals', without: `The game’s ${FESTIVALS.length}: ${FESTIVALS.map((f) => f.name).join(', ')}, on each season’s 10th day and Winter 12` },
  { gives: 'A place’s name and line', without: 'The map’s own name, and its quick look’s line' },
  { gives: 'A season’s line', without: 'None: the morning says “Spring begins” alone' },
  { gives: 'Town notes', without: 'None' },
]
