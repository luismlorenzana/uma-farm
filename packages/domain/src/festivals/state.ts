import type { FishingSpotId } from '../gathering/ids'
import type { CropId } from '../goods/ids'
import type { AnimalKind, FarmSave } from '../save/v4'
import type { FishMode } from '../goods/production-catalogue'

export const CONTESTS = ['flower-show', 'fishing-derby', 'animal-show', 'harvest-cup'] as const
export type FarmContest = typeof CONTESTS[number]
export const isFarmContest = (id: string): id is FarmContest => (CONTESTS as readonly string[]).includes(id)
export const CUP_CATEGORIES = ['field', 'ranch', 'fish', 'wild', 'workshop', 'kitchen'] as const
export type CupCategory = typeof CUP_CATEGORIES[number]
export const SHOW_CUES = ['stand', 'walk', 'brush'] as const
export type ShowCue = typeof SHOW_CUES[number]

export interface FlowerDate { day: number; hands: string[] }
export interface FlowerMark { day: number; year: number; tile: number; crop: CropId; dates: FlowerDate[]; water?: string | null }
export interface FlowerBox { year: number; key: string; dates: FlowerDate[] }
export interface CareReceipt { day: number; by: string | null }
export interface DerbyCaster { by: string | null; q: number; skill: number; level: number; timing: number }
export interface DerbyCatch { key: string; cm: number; score: number; slot: number; by: string | null }

interface ContestPlay {
  day: number
  rank: number
  seed: number
}

export interface DerbyPlay extends ContestPlay {
  id: 'fishing-derby'
  spot: FishingSpotId
  mode: FishMode
  casters: DerbyCaster[]
  catches: (DerbyCatch | null)[]
}

export interface AnimalPlay extends ContestPlay {
  id: 'animal-show'
  animal: string
  kind: AnimalKind
  caretaker: string | null
  handler: string | null
  auto: number
  hearts: number
  fed: boolean
  cared: number
  cues: ShowCue[]
  answers: boolean[]
}

export type ActiveContest = DerbyPlay | AnimalPlay

export interface ContestCard {
  day: number
  rank: number
  /** Null only when the attempt has no placement. */
  score: number | null
  place: 1 | 2 | 3 | null
  gold: number
  parts: number[]
  exhibits: string[]
  animal?: { id: string; kind: AnimalKind }
  catches?: DerbyCatch[]
  presenters?: (string | null)[]
  staff: string[]
  credit: string[]
}

export interface FestivalState {
  mark?: FlowerMark
  box?: FlowerBox
  care?: Record<string, CareReceipt[]>
  worked?: Record<string, Partial<Record<CupCategory, number>>>
  active?: ActiveContest
  last?: Partial<Record<FarmContest, ContestCard>>
}

export const activeContest = (save: Pick<FarmSave, 'workshops'>) => save.workshops.festival?.active
export function contestStaff(play: ActiveContest): string[] {
  return play.id === 'animal-show' ? (play.handler ? [play.handler] : []) : play.casters.flatMap((caster) => caster.by ? [caster.by] : [])
}

/** A committed action stays booked after judging, even when the entry was forfeited. */
export function festivalBooked(save: Pick<FarmSave, 'calendar' | 'workshops'>, id: string): boolean {
  const state = save.workshops.festival
  const day = save.calendar.day
  return (state?.active?.day === day && contestStaff(state.active).includes(id))
    || Object.values(state?.last ?? {}).some((card) => card.day === day && card.staff.includes(id))
}

export const withFestival = <S extends FarmSave>(save: S, festival: FestivalState): S =>
  ({ ...save, workshops: { ...save.workshops, festival } })
