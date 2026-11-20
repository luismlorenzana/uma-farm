// Occasion scenes: the story's scenes for a day of the year, played with each Uma who has one on that day. Every moment
// the story writes for plays, read by id from the pack (`scripted`), so a release with more Umas, scenes or days plays
// them on publish:
//
//   New Year's       `new-year`, each Spring 1 from the second year (year 1's is the farm's first morning)
//   a festival's day its game rule's id (`flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`,
//                    `harvest-cup`), on the festival's day wherever the story puts it
//   its night        `<festival>-night`, else the story's alias for it (`derby-night`, `harvest-moon`): a second slot
//                    on the festival's day, played after the day's
//   her birthday     `birthday`, on her birthday, once you've met
//   her anniversary  `anniversary`, on her wedding's day of the year, from the first anniversary
//   a story day      the day's `scene` (else its id): world.json's days and the game's own six small days
//
//   who        everyone met who has the scene: her route's, else the default story's for New Year's, the Flower Show
//              and the Fishing Derby's night (as before); the others play only when written
//   one a day  a day with several of hers plays one, in this order: her birthday, her anniversary, New Year's or the
//              festival's day, a story day; the festival's night is a second slot, after it
//   its cost   one action each, her event's: the day's event actions first (`spendForEvent`), then the day's own
//   its pay    nothing: its choices are wording only, as every scene past the rungs
//   the save   `today.occasions` keeps `<her id>:<occasion id>` for each played; an entry of her id alone (a save from
//              before) is the old game's one occasion that day: New Year's, the Flower Show or the derby's night
//
// It isn't her heart event: it neither needs her Ready nor stops her event today. Pure.
import { recordLibrary } from '../library/receipts'
import { actionCost, spendForEvent, type SpecialDays } from '../farm/actions'
import { dateOf, festivalOn, FESTIVALS, isNewYear, NEW_YEAR_NAME, type FestivalId } from '../farm/calendar'
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'
import { FESTIVAL_NIGHTS } from '../story/authored'
import { momentOutfit, type Moment } from '../story/look'
import type { StoryPack } from '../story/pack'
import { storyDaysOn } from '../story/placeholders'
import { isBirthday } from './days'
import { isAnniversary } from './love'

/** The kinds of occasion, in the day's order (the night is its own slot). */
export const OCCASION_KINDS = ['birthday', 'anniversary', 'new-year', 'festival', 'story-day', 'festival-night'] as const
export type OccasionKind = typeof OCCASION_KINDS[number]

/** One of her occasions on a day. */
export interface Occasion {
  /** Its id, kept with hers in `today.occasions`: `birthday`, `anniversary`, `new-year`, the festival's game rule,
   * `<festival>-night`, or the story day's id. */
  readonly id: string
  readonly kind: OccasionKind
  /** The event it plays: her route's of this id, else the default story's. */
  readonly event: string
  /** The day's slot, or the festival's night after it. */
  readonly slot: 'day' | 'night'
  /** Its name: "New Year’s", the festival's (the story's), "… night", "Birthday", "Anniversary", the story day's. */
  readonly name: string
  /** What she wears when the scene names no outfit (`look.ts`). */
  readonly moments: readonly Moment[]
}

/** The scenes the default story plays where her route writes none: New Year's, the Flower Show and the Fishing Derby's
 * night, as the calendar played them before. Every other occasion plays only when her route writes it. */
export const DEFAULT_OCCASION_SCENES: readonly string[] = ['new-year', 'flower-show', 'derby-night']

/** Each kind's moments: New Year's and a festival's night the kimono, the Flower Show the garden party dress, her birthday
 * and her anniversary the dinner dress; the other festivals' days and a story day the season's. */
export function occasionMoments(kind: OccasionKind, festival: FestivalId | null = null): readonly Moment[] {
  switch (kind) {
    case 'new-year': return ['new-year']
    case 'festival-night': return ['festival-night']
    case 'festival': return festival === 'flower-show' ? ['spring-festival'] : []
    case 'birthday': case 'anniversary': return ['dinner']
    case 'story-day': return []
  }
}

/** Each occasion as the manual lists them. */
export const OCCASION_RULES: readonly { kind: OccasionKind; name: string; events: string; when: string; who: string; unwritten: string; moments: readonly Moment[] }[] = [
  { kind: 'new-year', name: NEW_YEAR_NAME, events: '`new-year`', when: 'Spring 1, from the second year', who: 'Everyone met', unwritten: 'The default story’s', moments: occasionMoments('new-year') },
  {
    kind: 'festival', name: 'A festival’s day', events: FESTIVALS.map((f) => `\`${f.id}\``).join(', '), when: 'The festival’s day, wherever the story puts it', who: 'Everyone met',
    unwritten: 'The default story’s for the Flower Show; none for the others', moments: occasionMoments('festival', 'flower-show'),
  },
  {
    kind: 'festival-night', name: 'A festival’s night', events: FESTIVALS.map((f) => FESTIVAL_NIGHTS[f.id as FestivalId].map((e) => `\`${e}\``).join(' or ')).join('; '),
    when: 'The festival’s day, its night: a second slot, after the day’s', who: 'Everyone met', unwritten: 'The default story’s for `derby-night`; none for the others',
    moments: occasionMoments('festival-night'),
  },
  { kind: 'birthday', name: 'Her birthday', events: '`birthday`', when: 'Her birthday', who: 'Her, once you’ve met', unwritten: 'None', moments: occasionMoments('birthday') },
  { kind: 'anniversary', name: 'Her anniversary', events: '`anniversary`', when: 'Her wedding’s date, each year from the first anniversary', who: 'Her, once married', unwritten: 'None', moments: occasionMoments('anniversary') },
  { kind: 'story-day', name: 'A story day', events: 'The day’s `scene`, else its `id`', when: 'world.json’s `days`, and the game’s own small days', who: 'Everyone met', unwritten: 'None', moments: occasionMoments('story-day') },
]
/** A kind's outfit word for the manual: the moment's outfit id. */
export const occasionOutfit = (kind: OccasionKind, festival: FestivalId | null = null): string => momentOutfit(occasionMoments(kind, festival))

type OccasionPack = Pick<StoryPack, 'scripted'> & Partial<Pick<StoryPack, 'world'>>
type OccasionSave = Pick<SaveV4, 'calendar' | 'roster' | 'love' | 'today'>

/** The event an occasion plays with her: the first of its ids her route writes, else the first the default story plays,
 * else none (she has no scene for it, so it isn't hers). */
function sceneFor(pack: OccasionPack, id: string, ids: readonly string[]): string | null {
  const written = pack.scripted.get(id)
  return ids.find((e) => written?.has(e)) ?? ids.find((e) => DEFAULT_OCCASION_SCENES.includes(e)) ?? null
}

/** Her occasions on a farm day, in play order: the day's slot (the first she has a scene for, of her birthday, her
 * anniversary, New Year's or the festival's day, then the story's days in the calendar's order), then the festival's
 * night. None for someone you haven't met. */
export function occasionsOn(save: OccasionSave, pack: OccasionPack, days: SpecialDays, id: string, day = save.calendar.day): Occasion[] {
  if (!save.roster[id]) return []
  const love = save.love[id]
  const festival = festivalOn(day, days.festivals, save.calendar)
  const rule = festival?.rule ?? null
  type Candidate = Omit<Occasion, 'event'> & { ids: readonly string[] }
  const one = (kind: OccasionKind, occasion: string, ids: readonly string[], name: string, slot: 'day' | 'night' = 'day'): Candidate => ({
    id: occasion, kind, ids, name, slot, moments: occasionMoments(kind, rule),
  })
  const candidates: Candidate[] = [
    ...(isBirthday(days.birthdays, id, day, save.calendar) ? [one('birthday', 'birthday', ['birthday'], 'Birthday')] : []),
    ...(love && isAnniversary(love, day, save.calendar) ? [one('anniversary', 'anniversary', ['anniversary'], 'Anniversary')] : []),
    ...(isNewYear(day, save.calendar) && dateOf(day, save.calendar).year >= 2 ? [one('new-year', 'new-year', ['new-year'], NEW_YEAR_NAME)] : []),
    ...(rule ? [one('festival', rule, [rule], festival!.name)] : []),
    ...storyDaysOn(pack, day, save.calendar).map((d) => one('story-day', d.id, [d.scene], d.name)),
  ]
  const played = (c: Candidate | undefined): Occasion[] => {
    if (!c) return []
    const event = sceneFor(pack, id, c.ids)
    return event === null ? [] : [{ id: c.id, kind: c.kind, event, slot: c.slot, name: c.name, moments: c.moments }]
  }
  const daySlot = candidates.map((c) => played(c)[0]).find((o) => o !== undefined)
  const night = rule ? played(one('festival-night', FESTIVAL_NIGHTS[rule][0]!, FESTIVAL_NIGHTS[rule], `${festival!.name} night`, 'night')) : []
  return [...(daySlot ? [daySlot] : []), ...night]
}

/** An occasion's entry in `today.occasions`: her id and the occasion's. */
export const occasionKey = (id: string, occasion: string): string => `${id}:${occasion}`
/** What an entry of her id alone means (a save from before): the old game's one occasion that day. */
const OLD_OCCASIONS: readonly string[] = ['new-year', 'flower-show', FESTIVAL_NIGHTS['fishing-derby'][0]!]

/** Whether she's played this occasion today. */
export function occasionPlayed(save: Pick<SaveV4, 'today'>, id: string, occasion: string): boolean {
  const played = save.today.occasions ?? []
  return played.includes(occasionKey(id, occasion)) || (played.includes(id) && OLD_OCCASIONS.includes(occasion))
}

/** Who's played an occasion with you today, each once, in the order played. */
export const playedToday = (save: Pick<SaveV4, 'today'>): string[] => [...new Set((save.today.occasions ?? []).map((e) => e.split(':')[0]!))]

/** Her occasions today she hasn't played yet, in play order: the day's slot, then the night. */
export const occasionsLeft = (save: OccasionSave, pack: OccasionPack, days: SpecialDays, id: string): Occasion[] =>
  occasionsOn(save, pack, days, id).filter((o) => !occasionPlayed(save, id, o.id))

/** Today's next occasion with her, or null: she's met, today holds one of hers, and she hasn't played it yet. The night
 * comes after the day's. */
export const occasionWith = (save: OccasionSave, pack: OccasionPack, days: SpecialDays, id: string): Occasion | null =>
  occasionsLeft(save, pack, days, id)[0] ?? null

/**
 * Her next occasion today, played to its end: one action, the day's event actions first, and `<her id>:<occasion>` into
 * `today.occasions`. It pays nothing. Refused (`not-owned`) for someone you haven't met; (`not-ready`) when today holds
 * none of hers; (`busy`) when she's played today's, or `expected` (the one its player showed) isn't next any more; and
 * (`no-actions`) with no action left of either kind. Pure; never stamps.
 */
export function playOccasion(save: SaveV4, pack: OccasionPack, id: string, days: SpecialDays, expected?: string): SaveV4 {
  if (!save.roster[id]) throw new SaveRuleError('not-owned', 'You haven’t met her yet.')
  if (occasionsOn(save, pack, days, id).length === 0) throw new SaveRuleError('not-ready', 'No occasion today.')
  const next = occasionWith(save, pack, days, id)
  if (!next || (expected !== undefined && next.id !== expected)) throw new SaveRuleError('busy', 'You’ve spent today’s occasion with her.')
  const spent = spendForEvent(save, actionCost('event'), days)
  return recordLibrary({ ...spent, today: { ...spent.today, occasions: [...(spent.today.occasions ?? []), occasionKey(id, next.id)] } },
    id, `occasion:${next.slot}:${next.id}:${next.event}:${next.kind}`, { activity: `occasion:${next.slot}:${next.id}` })
}
