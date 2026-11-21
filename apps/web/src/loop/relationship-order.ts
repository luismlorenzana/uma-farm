import { LOVE_STAGES, type FarmSave } from '@farm/domain'

type Relationships = Pick<FarmSave, 'love' | 'longGame'>

/** A display order only. Equal relationships keep the order supplied by the caller. */
export function compareRelationships(save: Relationships, a: string, b: string): number {
  const first = save.love[a]
  const second = save.love[b]
  if (!first || !second) return Number(!!second) - Number(!!first)
  const stage = LOVE_STAGES.indexOf(second.stage) - LOVE_STAGES.indexOf(first.stage)
  const greater = first.stage === 'spouse' && second.stage === 'spouse'
    ? (save.longGame?.love[b]?.points ?? 0) - (save.longGame?.love[a]?.points ?? 0)
    : 0
  return stage || greater || second.level - first.level
    || second.points - first.points
}

export const byRelationship = (save: Relationships) => (a: string, b: string) => compareRelationships(save, a, b)
