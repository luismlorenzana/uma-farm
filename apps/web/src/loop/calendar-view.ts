// The calendar's words: a day cell's label and marks, a face's reasons, the day panel's heading and its special day's
// event actions. Pure, so the screen and the tests read the same. Loaded with the calendar.
import { NEW_YEAR_NAME, SEASON_NAMES, type CalendarDay, type DayFace, type FaceReason } from '@farm/domain'
import { plural, whenWords } from './words'

export const CALENDAR_PAGE_SIZE = 12
export const CALENDAR_GRID = 'grid min-h-0 min-w-0 flex-1 touch-pan-y grid-cols-6 grid-rows-2 gap-1 select-none'

/** Two rows of portraits, with the last spot available for an overflow count. */
const CELL_FACES = 6

/** Keep the tile label compact and the full wording available to its day button. */
export function cellLabel(day: CalendarDay): { short: string; full: string } | null {
  const title = day.festival?.name ?? (day.newYear ? NEW_YEAR_NAME : null) ?? day.storyDays[0]?.name
  if (title) return { short: title, full: title }
  if (day.weddings.length) return { short: 'Wedding', full: 'Wedding' }
  if (day.celebrations.length) return { short: 'Celeb.', full: 'Celebration' }
  if (day.trips.length) return { short: 'Trip', full: 'Expedition' }
  if (day.anniversaries.length) return { short: 'Anniv.', full: 'Anniversary' }
  if (day.birthdays.length) return { short: 'Birthday', full: 'Birthday' }
  return null
}

/** What marks a cell: a festival's trophy, New Year's bell, a holiday's flag, a minor day's dot, and a special day's
 * event actions. */
export interface CellMarks {
  festival: boolean
  newYear: boolean
  holiday: boolean
  minor: boolean
  eventActions: number
}
export const cellMarks = (day: CalendarDay): CellMarks => ({
  festival: day.festival !== null, newYear: day.newYear, holiday: day.storyDays.some((d) => d.kind === 'holiday'),
  minor: day.storyDays.some((d) => d.kind !== 'holiday'), eventActions: day.eventActions,
})

/** A face only a guess (her event likely Ready on a day ahead, nothing of the date's own): drawn faint. */
export const faintFace = (face: { reasons: readonly FaceReason[] }, day: Pick<CalendarDay, 'when'>): boolean =>
  day.when === 'ahead' && face.reasons.every((r) => r === 'ready')

/** The faces a cell shows, and how many more. */
export function cellFaces<T>(faces: readonly T[], max = CELL_FACES): { shown: T[]; more: number } {
  // With one more than fits, the last slot holds "+n" rather than a single face.
  const room = faces.length > max ? max - 1 : max
  return { shown: faces.slice(0, room), more: faces.length - Math.min(room, faces.length) }
}

/** A face's reasons in words: her occasions by name (the day's, then a festival's night), her birthday, your
 * anniversary (each said once: by its occasion when she has its scene), her event Ready (today) or likely Ready then (a
 * day ahead). */
export function reasonWords(reason: FaceReason, face: Pick<DayFace, 'occasions'>, day: Pick<CalendarDay, 'when'>): string | null {
  switch (reason) {
    case 'occasion': return face.occasions.map((o) => o.name).join(' · ') || 'Occasion'
    case 'birthday': return face.occasions.some((o) => o.kind === 'birthday') ? null : 'Birthday'
    case 'anniversary': return face.occasions.some((o) => o.kind === 'anniversary') ? null : 'Anniversary'
    case 'wedding': return day.when === 'past' ? 'Wedding day' : 'Wedding planned'
    case 'ready': return day.when === 'today' ? 'Ready' : 'Likely ready'
  }
}
/** A face's reasons in one line. */
export const faceWords = (face: Pick<DayFace, 'occasions' | 'reasons'>, day: Pick<CalendarDay, 'when'>): string =>
  face.reasons.flatMap((r) => reasonWords(r, face, day) ?? []).join(' · ')

/** The day panel's heading: "Spring 10 · today", "· tomorrow", "· in 7 days", or "· 3 days ago". */
export function dayHeading(day: Pick<CalendarDay, 'date' | 'day'>, today: number): string {
  const name = `${SEASON_NAMES[day.date.season]} ${day.date.day}`
  const n = day.day - today
  return `${name} · ${n >= 0 ? whenWords(n) : n === -1 ? 'yesterday' : `${-n} days ago`}`
}

/** The bonus pool and regular actions are both available for a scene on a special day. */
export function eventActionWords(day: Pick<CalendarDay, 'eventActions' | 'when'>, left: number, regular: number): string | null {
  if (day.eventActions === 0) return null
  return day.when === 'today' ? `${left}/${day.eventActions} bonus · ${regular} regular left` : `+${plural(day.eventActions, 'bonus action')} for events`
}
