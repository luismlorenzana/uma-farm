import { dateDayOf, DAYS_PER_SEASON, DAYS_PER_YEAR, yearlyDate } from '../farm/calendar'
import type { EveningKind, SaveV4 } from './v4'

export const COHORTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const
export type Cohort = typeof COHORTS[number]
export type Celebration = `cohort:${Cohort}` | 'greater-festival'
export const CELEBRATIONS: readonly Celebration[] = [...COHORTS.map((at): Celebration => `cohort:${at}`), 'greater-festival']
export const ENDING_SPOUSES = 50
export const FARM_YEAR = DAYS_PER_YEAR
export const ROOMS_PER_WING = 5
export const MAX_LODGE_WINGS = 2000
export const NIGHT_VISITS = 5
export const TRUE_LOVE = 120
export const PAJAMA_POINTS = [0, 6, 14, 24, 36, 48, 60, 75, 90, 105] as const
export const ANNIVERSARY_LOOK_POINTS = [0, 24, 48, 72, 96] as const
export const DUO_LIMIT = 3

export type Duo = [string, string]
export type NightKind = 'pajamas' | 'anniversary'
export const VISIT_KINDS = ['pajamas', 'anniversary', 'birthday'] as const
export type VisitKind = typeof VISIT_KINDS[number]
export const DUO_NIGHT_SEQUENCES = {
  recline: ['recline', 'kiss'],
  kneel: ['kneel', 'crawl-kiss'],
} as const
export type DuoNightVariant = keyof typeof DUO_NIGHT_SEQUENCES
type DuoNightPose = typeof DUO_NIGHT_SEQUENCES[DuoNightVariant][number]
export const isDuoNightVariant = (value: unknown): value is DuoNightVariant => value === 'recline' || value === 'kneel'
export const duoNightSceneId = (partner: string, pose: DuoNightPose): string => 'duo-' + partner + '-' + pose

export interface Visit {
  day: number
  kind: VisitKind
  who: [string] | Duo
  looks: number[]
  /** The two shared bedtime illustrations played in a pajama duo visit. */
  duoArt?: DuoNightVariant
  /** Anniversary number, independent of the night on which it played. */
  anniversary?: number
  /** Farm year of the birthday, separate from the anniversary receipt. */
  birthday?: number
  /** This look and conversation also have a witnessed morning. */
  overnight?: true
}
/** The host of a birthday or anniversary wears her formal look. */
export const visitLookKind = (visit: Pick<Visit, 'kind'>, index: number): NightKind =>
  index === 0 && visit.kind !== 'pajamas' ? 'anniversary' : 'pajamas'
export const visitPortraitKey = (kind: NightKind, slot: number): string =>
  `${kind === 'pajamas' ? 'pajamas' : 'wedding-anniversary'}-${slot}`
export interface GreaterLove {
  points: number
  pajamas: number
  anniversaries: number
  trueDay?: number
  anniversary?: number
  birthday?: number
  memories: Visit[]
}
export interface FestivalGift {
  day: number
  key: string
  crew: string[]
}
export interface DuoOuting {
  day: number
  who: Duo
  kind: EveningKind
}
export interface LongGame {
  weddings: string[]
  celebrations: Partial<Record<Celebration, number>>
  love: Record<string, GreaterLove>
  night?: { day: number; visits: Visit[]; stay?: true }
  morning?: Visit
  duos?: Duo[]
  outings?: DuoOuting[]
  gifts?: FestivalGift[]
  pledge?: { window: number; key: string }
  tradition?: Cohort
  ending?: { discoveries: number; milestones: number; workers: number }
}

export function endingRecord(save: Pick<SaveV4, 'diary' | 'farm' | 'roster'>): NonNullable<LongGame['ending']> {
  return {
    discoveries: Object.keys(save.farm.discoveries ?? {}).length,
    milestones: save.diary.milestones.length,
    workers: Object.values(save.roster).filter(uma => uma.farmhand !== undefined).length,
  }
}

export const isCelebration = (id: string): id is Celebration => (CELEBRATIONS as readonly string[]).includes(id)
export const visitMemoryKey = (visit: Visit): string => [visit.kind, visit.who.join(':'), visit.looks.join(':'), ...(visit.duoArt ? [visit.duoArt] : [])].join('/')
export const duoKey = ([a, b]: Duo): string => [a, b].sort((x, y) =>
  Number(x.replace(/^s/, '')) - Number(y.replace(/^s/, '')) || x.localeCompare(y)).join(':')

export function celebrationDate(save: Pick<SaveV4, 'love' | 'longGame'> & Partial<Pick<SaveV4, 'calendar'>>, id: Celebration): number | null {
  const count = id === 'greater-festival' ? ENDING_SPOUSES : Number(id.slice(7))
  const person = save.longGame?.weddings[count - 1]
  if (!person) return null
  const wedding = save.love[person]!.wed!
  return id === 'greater-festival' ? yearlyDate(wedding, 1, save.calendar) : wedding + (count === ENDING_SPOUSES ? 0 : 1)
}

/** One contribution per quarter of the waiting year. An overdue festival can still accept its last gift. */
export function festivalGiftWindow(save: Pick<SaveV4, 'calendar' | 'love' | 'longGame'>): number | null {
  const wedding = celebrationDate(save, 'cohort:50')
  return wedding === null ? null : Math.min(3, Math.floor((dateDayOf(save.calendar.day, save.calendar) - dateDayOf(wedding, save.calendar)) / DAYS_PER_SEASON))
}

export const unlockedLooks = (points: number, kind: NightKind): number =>
  (kind === 'pajamas' ? PAJAMA_POINTS : ANNIVERSARY_LOOK_POINTS).filter(value => value <= points).length
