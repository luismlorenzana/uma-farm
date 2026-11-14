// Her look in a scene: the dialogue engine's rules. Which outfit she wears (the scene's own `outfit` when the story names
// one, else the moment's, else the day's season), the story's outfit ids and the art's names for them, and the 22
// expressions a line's `emote` names, with the nearest each falls back to. Her portraits themselves are master data's
// `dialogue-portraits` family (a base per outfit, a face per expression), read at runtime by character id; no art, name
// or line lives here. Pure.
import { dateOf, type Season } from '../farm/calendar'

// === Outfits =============================================================================================================

/** The story's outfit ids, as an event, a pair level or a household scene names them (`outfit`). `season` is the day's. */
export const STORY_OUTFITS = [
  'season', 'spring', 'summer', 'autumn', 'winter', 'work', 'garden-party', 'kimono', 'dinner', 'wedding', 'wedding-night', 'pajamas', 'swimsuit',
] as const
export type StoryOutfit = typeof STORY_OUTFITS[number]
export const isStoryOutfit = (v: unknown): v is StoryOutfit => typeof v === 'string' && (STORY_OUTFITS as readonly string[]).includes(v)

/** The art's outfits, master data's portrait bases by name, in Farm Life's order. Spring, the first, is the default:
 * an outfit not drawn for her yet shows her first in this order. */
export const ART_OUTFITS = [
  'spring', 'summer', 'fall', 'winter', 'swimsuit', 'kimono', 'dinner', 'wedding', 'farm-work', 'garden-party', 'pajamas-playful', 'wedding-night',
] as const
export type ArtOutfit = typeof ART_OUTFITS[number]
export const isArtOutfit = (v: unknown): v is ArtOutfit => typeof v === 'string' && (ART_OUTFITS as readonly string[]).includes(v)

/** Each story id's art name; `season` is the day's season's. */
export const ART_NAMES: Readonly<Record<Exclude<StoryOutfit, 'season'>, ArtOutfit>> = {
  spring: 'spring', summer: 'summer', autumn: 'fall', winter: 'winter', work: 'farm-work', 'garden-party': 'garden-party', kimono: 'kimono', dinner: 'dinner',
  wedding: 'wedding', 'wedding-night': 'wedding-night', pajamas: 'pajamas-playful', swimsuit: 'swimsuit',
}
/** A story outfit's art name on a season (for `season`). */
export const artOutfit = (outfit: StoryOutfit, season: Season): ArtOutfit => (outfit === 'season' ? ART_NAMES[season] : ART_NAMES[outfit])

/** The moments a scene can be in, as its player knows them (an event's rung and beat, a household scene; later the
 * evenings' and the calendar's occasion scenes hand theirs). */
export const MOMENTS = [
  'wedding', 'wedding-night', 'dinner', 'festival-night', 'picnic', 'tea', 'spring-festival', 'night-in', 'sleepless', 'work', 'shore',
] as const
export type Moment = typeof MOMENTS[number]

/** Outfits by context: the first rule whose moment the scene is in wins; with none, the day's season. */
export const MOMENT_OUTFITS: readonly { moments: readonly Moment[]; outfit: StoryOutfit; words: string }[] = [
  { moments: ['wedding'], outfit: 'wedding', words: 'A wedding' },
  { moments: ['wedding-night'], outfit: 'wedding-night', words: 'Its night' },
  { moments: ['dinner'], outfit: 'dinner', words: 'A dinner' },
  { moments: ['festival-night'], outfit: 'kimono', words: 'A festival night' },
  { moments: ['picnic', 'tea', 'spring-festival'], outfit: 'garden-party', words: 'A picnic, a tea or the spring festival' },
  { moments: ['night-in', 'sleepless'], outfit: 'pajamas', words: 'A night in, or a night she can’t sleep' },
  { moments: ['work'], outfit: 'work', words: 'Her work' },
  { moments: ['shore'], outfit: 'swimsuit', words: 'The summer shore' },
]
/** Outfits no one but the scene's own Umas wear: a guest at her wedding wears the moment's other outfit. */
export const PERSONAL_OUTFITS: readonly StoryOutfit[] = ['wedding', 'wedding-night']

/** What a scene knows of its look: the story's `outfit` for it (any value: one the menu doesn't hold is ignored), its
 * moments, the day, and its own Umas (the event's, the pair's, the household's spouses). */
export interface SceneLook {
  own?: unknown
  moments?: readonly Moment[]
  day: number
  leads?: readonly string[]
}

/** The shore's places: the summer shore's swimsuit is worn there, in summer. */
export const SHORE_PLACES: readonly string[] = ['sea-pier']

/** A heart event's moments, from its rung and her beat: the wedding; her work (`together: work`); a picnic date; the shore
 * in summer, at the place it plays. Her wedding night, dinners, nights in and festival nights are their own scenes', handed
 * in by their players. */
export function eventMoments(event: { rung: string; together?: { kind: string; game?: string } | null; place?: string | null; day: number }): Moment[] {
  const out: Moment[] = []
  if (event.rung === 'wedding') out.push('wedding')
  if (event.together?.kind === 'work') out.push('work')
  if (event.together?.kind === 'date' && event.together.game === 'picnic') out.push('picnic')
  if (event.place && SHORE_PLACES.includes(event.place) && dateOf(Math.max(1, event.day)).season === 'summer') out.push('shore')
  return out
}

/** The moment's outfit: the first rule the moments meet, else the day's season. */
export function momentOutfit(moments: readonly Moment[] = []): StoryOutfit {
  return MOMENT_OUTFITS.find((rule) => rule.moments.some((m) => moments.includes(m)))?.outfit ?? 'season'
}

/** The scene's outfit in the story's words: its own when the story names one, else the moment's. */
export function sceneOutfit(look: Pick<SceneLook, 'own' | 'moments'>): StoryOutfit {
  return isStoryOutfit(look.own) ? look.own : momentOutfit(look.moments)
}

/** What one person in the scene wears, by the art's name: the scene's outfit for its own Umas (and for everyone when it
 * has none of its own); for anyone else, the same unless it's personal (a wedding's), when she wears the moment's other
 * outfit. */
export function dressOf(look: SceneLook, who: string): ArtOutfit {
  const season = dateOf(Math.max(1, Math.floor(look.day) || 1)).season
  const outfit = sceneOutfit(look)
  const lead = !look.leads || look.leads.length === 0 || look.leads.includes(who)
  if (lead || !PERSONAL_OUTFITS.includes(outfit)) return artOutfit(outfit, season)
  const others = (look.moments ?? []).filter((m) => !(PERSONAL_OUTFITS as readonly string[]).includes(m))
  return artOutfit(momentOutfit(others), season)
}

// === Expressions =========================================================================================================

/** The expressions' sets: core for every Uma who speaks, romance for every Uma with a route, extra when there's time. */
export type ExpressionSet = 'core' | 'romance' | 'extra'
/** The 22 expressions, each with the one it falls back to while it isn't drawn (ending at neutral, the base's own face). */
export const EXPRESSIONS = [
  { id: 'neutral', set: 'core', fallback: null },
  { id: 'happy', set: 'core', fallback: 'neutral' },
  { id: 'laughing', set: 'core', fallback: 'happy' },
  { id: 'surprised', set: 'core', fallback: 'neutral' },
  { id: 'thinking', set: 'core', fallback: 'neutral' },
  { id: 'sad', set: 'core', fallback: 'neutral' },
  { id: 'angry', set: 'core', fallback: 'neutral' },
  { id: 'worried', set: 'core', fallback: 'sad' },
  { id: 'determined', set: 'core', fallback: 'happy' },
  { id: 'pouting', set: 'core', fallback: 'angry' },
  { id: 'shy', set: 'romance', fallback: 'happy' },
  { id: 'tender', set: 'romance', fallback: 'happy' },
  { id: 'flustered', set: 'romance', fallback: 'shy' },
  { id: 'loving', set: 'romance', fallback: 'tender' },
  { id: 'tearful-joy', set: 'romance', fallback: 'loving' },
  { id: 'sleepy', set: 'romance', fallback: 'tender' },
  { id: 'crying', set: 'extra', fallback: 'sad' },
  { id: 'teasing', set: 'extra', fallback: 'happy' },
  { id: 'smug', set: 'extra', fallback: 'determined' },
  { id: 'embarrassed', set: 'extra', fallback: 'flustered' },
  { id: 'startled', set: 'extra', fallback: 'surprised' },
  { id: 'dreamy', set: 'extra', fallback: 'tender' },
] as const satisfies readonly { id: string; set: ExpressionSet; fallback: string | null }[]
export type Expression = typeof EXPRESSIONS[number]['id']
/** The expressions' ids: the story's `emote` menu. */
export const EXPRESSION_IDS: readonly Expression[] = EXPRESSIONS.map((e) => e.id)
export const isExpression = (v: unknown): v is Expression => typeof v === 'string' && (EXPRESSION_IDS as readonly string[]).includes(v)
const FALLBACK: ReadonlyMap<string, Expression | null> = new Map(EXPRESSIONS.map((e) => [e.id, e.fallback]))

/** An expression and the ones it falls back to, in order, ending at neutral. An unknown emote is neutral. */
export function fallbackChain(emote: unknown): Expression[] {
  const chain: Expression[] = []
  let at: Expression | null = isExpression(emote) ? emote : 'neutral'
  while (at !== null && !chain.includes(at)) {
    chain.push(at)
    at = FALLBACK.get(at) ?? null
  }
  return chain
}
/** The face a line shows: its emote if drawn, else the nearest drawn one on its chain, else neutral (the base's own). */
export function faceFor(emote: unknown, drawn: (e: Expression) => boolean): Expression {
  return fallbackChain(emote).find((e) => e === 'neutral' || drawn(e)) ?? 'neutral'
}
