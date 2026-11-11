// Her route in words (F47 decisions 13 and 15; romance spec RM24): what her next event waits for, as her sheet says it, and
// F48's Hearts tab and morning after it. Pure, so the sheet and the tests read the same. Loaded on demand with her sheet.
import { goodName, rungName, type Activity, type Bar, type Readiness } from '@farm/domain'

/** A working setup's place, as RM24 says it ("Romance 5 · the Pond, when she works it"). */
const WORK_PLACE: Readonly<Record<Activity, string>> = {
  farming: 'the Fields', foraging: 'the forest', fishing: 'the Fishery', mining: 'the Mine', ranch: 'the ranch', cooking: 'the Kitchen',
  serving: 'the Restaurant', forging: 'the Forge', expeditions: 'an expedition',
}

/** Her next event's state in a line: "Friendship 2 · Ready", "Friendship 2 · 123 to go", "Friendship 3 · the Fields, when
 * she works there", "Opens with chapter 3", "Her story is still being written". `nameOf` names a bond's other Uma. */
export function readyWords(state: Readiness, bar: Pick<Bar, 'points' | 'cost'>, nameOf: (id: string) => string): string {
  const rung = state.rung ? rungName(state.rung) : ''
  const at = (words: string) => `${rung} · ${words}`
  if (state.ready) return at('Ready')
  const waits = state.waits!
  switch (waits.kind) {
    case 'done': return 'Her route is complete'
    case 'unwritten': return 'Her story is still being written'
    case 'friend': return at('she said “Not yet”')
    case 'night': return at('comes tonight')
    case 'opens': return at(`Opens with chapter ${waits.chapter}`)
    case 'bar': return at(`${(bar.cost - bar.points).toLocaleString('en-US')} to go`)
    case 'day': return at('Ready tomorrow')
    case 'ring': return at('Needs a ring')
    case 'away': return at('Swap her home')
    case 'today': return at('tomorrow: one event a day')
    case 'setup': {
      const s = waits.setup
      if (s.kind === 'working') return at(`${WORK_PLACE[s.activity]}, when she works there`)
      if (s.kind === 'item') return at(`with ${goodName(s.good)} in the Warehouse`)
      return at(`bond ${s.level} with ${nameOf(s.with)}`)
    }
  }
}

/** "+15", "0". */
export const gain = (n: number): string => (n > 0 ? `+${n}` : '0')
