import { draw } from '../farm/draw'
import type { ExpeditionOutcome, ExpeditionReturn } from '../save/v4'
import type { StoryPack } from '../story/pack'

const DEFAULT_LINES: Readonly<Record<ExpeditionOutcome, string>> = {
  great: 'We had to make room for everything we found.',
  success: 'We’re back. Come see what we brought!',
  retreat: 'We turned back early, but we didn’t come home empty-handed.',
}

/** Read the first party member with a line for this result, from the current pack. */
export function expeditionReturnLine(pack: Pick<StoryPack, 'bibles'> | null, trip: ExpeditionReturn): string {
  for (const id of trip.party) {
    const lines = pack?.bibles.get(id)?.expeditionReturns?.[trip.result]
    if (lines?.length) return lines[Math.floor(draw(id, trip.back, 'expedition-line', 0) * lines.length)]!
  }
  return DEFAULT_LINES[trip.result]
}
