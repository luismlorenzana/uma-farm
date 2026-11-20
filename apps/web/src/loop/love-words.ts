// Her route in words: what her next event waits for, as her
// Hearts row says it (`readyWords`, with the rung) and as her profile's Next card says it (`nextWords`, under the rung's
// name). Pure, so the screens and the tests read the same. Loaded on demand with the Hearts tab.
import { farmPlace, gateWords, goodName, rungName, type Activity, type Bar, type FarmPlaceId, type Festival, type Readiness } from '@farm/domain'
import { shortDate } from './words'

/** "Opens when the Kitchen is built": a perk's place, not built yet. */
export const opensWhenBuilt = (place: FarmPlaceId): string => `Opens when the ${farmPlace(place)?.name ?? place} is built`

/** A working setup's place, as the route says it ("Romance 5 · the Pond, when she works it"). */
export const WORK_PLACE: Readonly<Record<Activity, string>> = {
  farming: 'the Fields', foraging: 'the forest', fishing: 'the Fishery', mining: 'the Mine', ranch: 'the ranch', cooking: 'the Kitchen',
  serving: 'the Restaurant', forging: 'the Forge', expeditions: 'an expedition',
}

/** Her next event's state in a line: "Friendship 2 · Ready", "Friendship 2 · 123 to go", "Friendship 3 · the Fields, when
 * she works there", her chapter's gate ("Friendship 7 · Opens when the Kitchen is built").
 * `nameOf` names a bond's other Uma, or a gate's. */
export function readyWords(state: Readiness, bar: Pick<Bar, 'points' | 'cost'>, nameOf: (id: string) => string, year?: readonly Festival[]): string {
  const rung = state.rung ? rungName(state.rung) : ''
  const at = (words: string) => `${rung} · ${words}`
  if (state.ready) return at('Ready')
  const waits = state.waits!
  switch (waits.kind) {
    case 'done': return 'Her route is complete'
    case 'friend': return at('she said “Not yet”')
    case 'night': return at('comes tonight')
    case 'gate': return at(gateWords(waits.gate, nameOf, year))
    case 'bar': return at(`${(bar.cost - bar.points).toLocaleString('en-US')} to go`)
    case 'day': return at('Ready tomorrow')
    case 'wedding-day': return at(`Planned for ${shortDate(waits.day)}`)
    case 'ring': return at('Needs a ring')
    case 'today': return at('tomorrow: one event a day')
    case 'setup': {
      const s = waits.setup
      if (s.kind === 'working') return at(`${WORK_PLACE[s.activity]}, when she works there`)
      if (s.kind === 'item') return at(`with ${goodName(s.good)} in the Warehouse`)
      return at(`bond ${s.level} with ${nameOf(s.with)}`)
    }
  }
}

/** Her Next card's words: the wait without the rung, which the card's title already names. "Ready",
 * "123 to go", "Tomorrow", "Needs a ring", her chapter's gate ("Opens when the Kitchen is built"). */
export function nextWords(state: Readiness, bar: Pick<Bar, 'points' | 'cost'>, nameOf: (id: string) => string, year?: readonly Festival[]): string {
  if (state.ready) return 'Ready'
  const waits = state.waits!
  switch (waits.kind) {
    case 'done': return 'Her route is complete'
    case 'friend': return 'She said “Not yet”'
    case 'night': return 'Comes tonight'
    case 'gate': return gateWords(waits.gate, nameOf, year)
    case 'bar': return `${(bar.cost - bar.points).toLocaleString('en-US')} to go`
    case 'day': return 'Tomorrow'
    case 'wedding-day': return `Planned for ${shortDate(waits.day)}`
    case 'ring': return 'Needs a ring'
    case 'today': return 'Tomorrow: one event a day'
    case 'setup': {
      const s = waits.setup
      if (s.kind === 'working') return `${cap(WORK_PLACE[s.activity])}, when she works there`
      if (s.kind === 'item') return `With ${goodName(s.good)} in the Warehouse`
      return `Bond ${s.level} with ${nameOf(s.with)}`
    }
  }
}
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** "+15", "0". */
export const gain = (n: number): string => (n > 0 ? `+${n}` : '0')
