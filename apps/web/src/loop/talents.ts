// Talents in the app: computed from master data's stats once a release, for every outfit, and
// kept with that release's view (one view a release hash), so the night, the harvests and the screens all read the same
// table. The API never needs them. Loaded on demand with the loop's screens.
import { talentResolver, talentsD, talentsOf, type TalentOf, type Talents } from '@farm/domain'
import { useMaster, type MasterView } from '../master/master'

const TABLES = new WeakMap<MasterView['stats'], ReadonlyMap<string, Talents>>()
const RESOLVERS = new WeakMap<ReadonlyMap<string, Talents>, TalentOf>()

/** Every outfit's talents on this release, computed on first use. */
export function talentTable(view: Pick<MasterView, 'stats'>): ReadonlyMap<string, Talents> {
  let table = TABLES.get(view.stats)
  if (!table) {
    table = new Map([...view.stats].map(([id, outfit]) => [id, talentsOf(outfit)]))
    TABLES.set(view.stats, table)
  }
  return table
}

/** Her talent in an activity on this release; an outfit it doesn't hold is D. One function a release, so screens can
 * memo on it. */
export function talentsFor(view: Pick<MasterView, 'stats'>): TalentOf {
  const table = talentTable(view)
  let of = RESOLVERS.get(table)
  if (!of) {
    of = talentResolver(table)
    RESOLVERS.set(table, of)
  }
  return of
}
/** The release's talents and table once master data has loaded; D for everyone and no table until then (the screens
 * redraw when it lands). */
export function useTalents(): { of: TalentOf; table: ReadonlyMap<string, Talents> | null } {
  const master = useMaster()
  if (master.status !== 'ready') return { of: talentsD, table: null }
  return { of: talentsFor(master.view), table: talentTable(master.view) }
}
