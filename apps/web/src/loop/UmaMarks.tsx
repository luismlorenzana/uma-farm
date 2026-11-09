// An Uma's marks on her face (F21 decision 7, the badge drawing left to the worker): her favourite line's mark, top left,
// is her line's first raw good from uma-art's items atlas on a light disc (a Carrot farming, a Pine Log foraging, a Carp
// fishing, Copper Ore mining); her best talent, bottom right, is its grade on a coloured chip (S gold, A coral, B blue,
// C green, D and below grey). The cheapest art that reads at 68 px, until F25 or later draws marks. Loaded on demand.
import { ACTIVITY_NAMES, TALENT_GRADES, type Activity, type TalentStep } from '@farm/domain'
import type { FaceTileBadges } from '@luismlorenzana/uma-kit/album'
import { ItemIcon } from '../items/ItemIcon'
import { stepIn, type LoopUmaRow } from './roster-view'

/** Each favourite's mark: its line's first raw good. */
const FAVOURITE_GOOD: Partial<Record<Activity, string>> = { farming: 'carrot', foraging: 'pine-log', fishing: 'carp', mining: 'copper-ore' }
/** A grade's chip colours, S to G. */
const GRADE_STYLE: readonly string[] = [
  'bg-[#8a8f98] text-white', 'bg-[#8a8f98] text-white', 'bg-[#8a8f98] text-white', 'bg-[#6b7280] text-white',
  'bg-[#3f8f4a] text-white', 'bg-[#3b6fd1] text-white', 'bg-[#d4573f] text-white', 'bg-[#e0a526] text-[#3a2a00]',
]

/** Her favourite line's mark. */
export function FavouriteMark({ activity, size = 20 }: { activity: Activity; size?: number }) {
  const good = FAVOURITE_GOOD[activity]
  if (!good) return null
  return (
    <span className="grid place-items-center rounded-full bg-white/90 shadow-1 ring-1 ring-black/10" style={{ width: size, height: size }} data-favourite={activity}>
      <ItemIcon id={good} size={size - 4} label={`Favourite: ${ACTIVITY_NAMES[activity]}`} />
    </span>
  )
}

/** A talent's grade on its chip. */
export function TalentChip({ step, label, size = 18 }: { step: TalentStep; label?: string; size?: number }) {
  return (
    <span role="img" aria-label={label ?? `Talent ${TALENT_GRADES[step]}`} data-talent={TALENT_GRADES[step]}
      className={`grid place-items-center rounded-[5px] font-display font-bold leading-none shadow-1 ${GRADE_STYLE[step]}`}
      style={{ minWidth: size, height: size, fontSize: Math.round(size * 0.62), padding: '0 3px' }}>
      {TALENT_GRADES[step]}
    </span>
  )
}

/** Her face's corners: her favourite line's mark, top left; her best talent, bottom right. */
export function umaBadges(row: LoopUmaRow): FaceTileBadges {
  const best = row.talents?.best
  return {
    ...(row.favourite ? { topLeft: <FavouriteMark activity={row.favourite} /> } : {}),
    ...(best ? { bottomRight: <TalentChip step={stepIn(row, best)} label={`Best talent: ${ACTIVITY_NAMES[best]} ${TALENT_GRADES[stepIn(row, best)]}`} /> } : {}),
  }
}
