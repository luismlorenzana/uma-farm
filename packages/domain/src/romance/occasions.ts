// Occasion scenes: the story's scenes for a day of the year, played with each Uma you've met on that day. The calendar
// plays three (the packet's): New Year's from the second year (year 1's Spring 1 is the farm's first morning), the Flower
// Show, and the Fishing Derby's night, each on its day as the story puts it (`festivalsOf`: a moved Flower Show plays on
// its new day). Each is her route's event of that id, else the default story's (`eventOf`), in its own outfit when the
// scene names one, else its moment's: New Year's and the derby night the kimono, the Flower Show the garden party dress.
//
//   who        everyone you've met (the roster), home or in town: the festival is in town and everyone's there
//   how often  once a day with each (`today.occasions`): the day is once a year
//   its cost   one action, her event's: the day's event actions first (`spendForEvent`), then the day's own
//   its pay    nothing: its choices are wording only, as every scene past the rungs
//
// It isn't her heart event: it neither needs her Ready nor stops her event today. Her birthday's, the other festivals'
// and the Fishing Derby's daytime scenes are written and read, and wait for their own moments. Pure.
import { actionCost, spendForEvent, type SpecialDays } from '../farm/actions'
import { dateOf, festivalOn, isNewYear, NEW_YEAR_NAME, type Festival, type FestivalId } from '../farm/calendar'
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'
import type { Moment } from '../story/look'

/** The occasion scenes the calendar plays, by the story's event id. */
export const PLAYED_OCCASIONS = ['new-year', 'flower-show', 'derby-night'] as const
export type PlayedOccasion = typeof PLAYED_OCCASIONS[number]
export const isPlayedOccasion = (id: string): id is PlayedOccasion => (PLAYED_OCCASIONS as readonly string[]).includes(id)

/** Each occasion's day and moment, as the manual lists them. */
export const OCCASION_RULES: readonly { id: PlayedOccasion; festival: FestivalId | null; when: string; moments: readonly Moment[] }[] = [
  { id: 'new-year', festival: null, when: 'New Year’s, each year’s Spring 1, from the second year', moments: ['new-year'] },
  { id: 'flower-show', festival: 'flower-show', when: 'The Flower Show’s day, wherever the story puts it', moments: ['spring-festival'] },
  { id: 'derby-night', festival: 'fishing-derby', when: 'The Fishing Derby’s day, wherever the story puts it: its night', moments: ['festival-night'] },
]
const RULE = new Map(OCCASION_RULES.map((r) => [r.id, r]))

/** The occasion a farm day holds, or null: New Year's from the second year, else the day's festival's when it's the
 * Flower Show or the Fishing Derby (by its game rule, so the story's name and day). */
export function occasionOn(day: number, year: readonly Festival[]): PlayedOccasion | null {
  if (isNewYear(day)) return dateOf(day).year >= 2 ? 'new-year' : null
  const rule = festivalOn(day, year)?.rule ?? null
  return OCCASION_RULES.find((r) => r.festival !== null && r.festival === rule)?.id ?? null
}

/** An occasion's moments, for what she wears when her scene names no outfit. */
export const occasionMoments = (id: PlayedOccasion): readonly Moment[] => RULE.get(id)!.moments

/** An occasion's name: New Year's, the Flower Show under the story's name, the derby's night ("Fishing Derby night"). */
export function occasionName(id: PlayedOccasion, year: readonly Festival[]): string {
  if (id === 'new-year') return NEW_YEAR_NAME
  const festival = RULE.get(id)!.festival
  const name = year.find((f) => f.rule === festival)?.name ?? (festival === 'flower-show' ? 'Flower Show' : 'Fishing Derby')
  return id === 'derby-night' ? `${name} night` : name
}

/** Whether she's played today's occasion scene. */
export const occasionPlayed = (save: Pick<SaveV4, 'today'>, id: string): boolean => (save.today.occasions ?? []).includes(id)

/** Today's occasion with her, or null: she's met, today holds one, and she hasn't played it today. */
export function occasionWith(save: Pick<SaveV4, 'calendar' | 'roster' | 'today'>, id: string, year: readonly Festival[]): PlayedOccasion | null {
  const occasion = occasionOn(save.calendar.day, year)
  return occasion && save.roster[id] && !occasionPlayed(save, id) ? occasion : null
}

/**
 * Her occasion scene, played to its end: one action, the day's event actions first, and her id into `today.occasions`.
 * It pays nothing. Refused (`not-ready`) when today holds no occasion, she isn't met, or she's played it today; refused
 * (`no-actions`) with no action left of either kind. Pure; never stamps.
 */
export function playOccasion(save: SaveV4, id: string, days: SpecialDays): SaveV4 {
  if (!save.roster[id]) throw new SaveRuleError('not-owned', 'You haven’t met her yet.')
  if (occasionOn(save.calendar.day, days.festivals) === null) throw new SaveRuleError('not-ready', 'No occasion today.')
  if (occasionPlayed(save, id)) throw new SaveRuleError('busy', 'You’ve spent today’s occasion with her.')
  const spent = spendForEvent(save, actionCost('event'), days)
  return { ...spent, today: { ...spent.today, occasions: [...(spent.today.occasions ?? []), id] } }
}
