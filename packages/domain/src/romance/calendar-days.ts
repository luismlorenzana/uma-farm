// The calendar's days: what each day of the year holds, and the faces of the Umas with an event on it. Read live, never
// stored: the save as it stands, and the story's year.
//
//   a day holds   New Year's (each Spring 1), its festival, the story's holidays and minor days (world.json's `days`
//                 and the game's own six), the birthdays of the Umas you've met and their anniversaries, and the special
//                 day's event actions (`eventGrants`)
//   its faces     each met Uma with an event that day: her occasions (`occasions.ts`: the day's one, and a festival's
//                 night), her birthday, her anniversary, or her next event Ready on that date
//
// Today reads Ready as it is (`readiness`), and leaves out an occasion she's played. A day ahead is a best guess from the
// save as it stands, the date moved and nothing played (`readyOn`): a bar already full, a waiting rung's next day, or a
// chapter's season or festival gate show; points she hasn't earned yet don't. A day gone by keeps its birthdays and
// anniversaries, and nothing to play. The date's own faces come first (an occasion, a birthday, an anniversary), then
// those only Ready, each in the cast's order. Pure; loaded with the calendar.
import { eventActionsOn, type SpecialDays } from '../farm/actions'
import { DAYS_PER_SEASON, dateOf, farmDay, festivalOn, isNewYear, type FarmDate, type Festival, type Season } from '../farm/calendar'
import { newTodayV4, type SaveV4 } from '../save/v4'
import { castOrder, type StoryPack } from '../story/pack'
import { storyDaysOn, type StoryDay } from '../story/placeholders'
import { isBirthday } from './days'
import { isAnniversary } from './love'
import { occasionPlayed, occasionsOn, type Occasion } from './occasions'
import { readiness } from './ready'

/** Why her face is on a day: the occasion's scene with her, her birthday, her anniversary, or her event Ready. */
export type FaceReason = 'occasion' | 'birthday' | 'anniversary' | 'ready'
export const FACE_REASONS: readonly FaceReason[] = ['occasion', 'birthday', 'anniversary', 'ready']
export interface DayFace {
  id: string
  reasons: FaceReason[]
  /** Her occasions that day, in play order (today, the ones she hasn't played): with them, `occasion` is a reason. */
  occasions: Occasion[]
}

/** A day gone by, today, or a day ahead. */
export type DayWhen = 'past' | 'today' | 'ahead'

/** One day of the calendar. */
export interface CalendarDay {
  day: number
  date: FarmDate
  when: DayWhen
  newYear: boolean
  festival: Festival | null
  /** The story's holidays and minor days, holidays first. */
  storyDays: StoryDay[]
  /** The met Umas' birthdays and anniversaries, in the cast's order. */
  birthdays: string[]
  anniversaries: string[]
  /** The faces of the Umas with an event that day: the date's own first, then those only Ready. */
  faces: DayFace[]
  /** The day's event actions: New Year's, its festival and each met Uma's birthday. */
  eventActions: number
}

type DaysPack = Pick<StoryPack, 'bibles' | 'cast' | 'scripted'> & Partial<Pick<StoryPack, 'world'>>

/** Whether her next event is Ready on a day: today as it is; a day ahead from the save as it stands, the date moved and
 * nothing played yet; never on a day gone by. */
export function readyOn(save: SaveV4, pack: DaysPack, id: string, day: number): boolean {
  if (!save.love[id] || !save.roster[id] || day < save.calendar.day) return false
  if (day === save.calendar.day) return readiness(save, pack, id).ready
  return readiness({ ...save, calendar: { ...save.calendar, day }, today: newTodayV4() }, pack, id).ready
}

/** The met Umas in the cast's order, then by id. */
function metInOrder(save: Pick<SaveV4, 'roster'>, pack: Pick<StoryPack, 'cast'>): string[] {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return Object.keys(save.roster).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b) || a.localeCompare(b))
}

/** One farm day of the calendar, read from the save as it stands and the story's year (`days.festivals`). */
export function calendarDay(save: SaveV4, pack: DaysPack, days: SpecialDays, day: number): CalendarDay {
  const today = save.calendar.day
  const when: DayWhen = day < today ? 'past' : day === today ? 'today' : 'ahead'
  const met = metInOrder(save, pack)
  const birthdays = met.filter((id) => isBirthday(days.birthdays, id, day))
  const anniversaries = met.filter((id) => save.love[id] !== undefined && isAnniversary(save.love[id]!, day))
  const faces = met.flatMap((id): DayFace[] => {
    const reasons: FaceReason[] = []
    const occasions = when === 'past' ? [] : occasionsOn(save, pack, days, id, day).filter((o) => !(when === 'today' && occasionPlayed(save, id, o.id)))
    if (occasions.length > 0) reasons.push('occasion')
    if (birthdays.includes(id)) reasons.push('birthday')
    if (anniversaries.includes(id)) reasons.push('anniversary')
    if (when !== 'past' && readyOn(save, pack, id, day)) reasons.push('ready')
    return reasons.length > 0 ? [{ id, reasons, occasions }] : []
  })
  const own = (f: DayFace) => f.reasons.some((r) => r !== 'ready')
  return {
    day, date: dateOf(day), when, newYear: isNewYear(day), festival: festivalOn(day, days.festivals), storyDays: storyDaysOn(pack, day),
    birthdays, anniversaries, faces: [...faces.filter(own), ...faces.filter((f) => !own(f))], eventActions: eventActionsOn(save, days, day),
  }
}

/** A season's 12 days of this year (or `year`'s). */
export function seasonDays(save: SaveV4, pack: DaysPack, days: SpecialDays, season: Season, year = dateOf(save.calendar.day).year): CalendarDay[] {
  const first = farmDay({ year, season, day: 1 })
  return Array.from({ length: DAYS_PER_SEASON }, (_, i) => calendarDay(save, pack, days, first + i))
}
