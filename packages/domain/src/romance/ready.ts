// An event uses its original staging when its requirements hold. An alternate advances the same rung when they don’t.
import { RING_IDS } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import type { StoryTrigger, Trigger } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { bar, NIGHT_RUNGS, WAITING_RUNGS } from './love'
import { routeRequirements, type RouteRequirement } from './route-variants'


/** A setup the player meets on the day: she works a place, a good is held, a bond is reached. */
export type Setup = Extract<Trigger, { kind: 'working' | 'item' | 'bond' }>

/** What keeps her next event from being Ready. */
export type Wait =
  /** Her bar isn't full for the rung. */
  | { kind: 'bar' }
  /** A waiting rung: Ready the day after the rung before. */
  | { kind: 'day' }
  | { kind: 'wedding-day'; day: number }
  /** The proposal: a ring in the Warehouse. */
  | { kind: 'ring' }
  /** She played one of her events today. */
  | { kind: 'today' }
  /** Its setup, not met today. */
  | { kind: 'setup'; setup: Setup }
  /** S2 and S4 have no Ready event: they come at night once their bar fills, and the morning plays their scene. */
  | { kind: 'night' }
  /** She said "Not yet" at her confession: you ask her again from her profile. */
  | { kind: 'friend' }
  /** Her chapter's gate doesn't hold yet: its first event waits ("Opens when the Kitchen is built"). */
  | { kind: 'gate'; gate: StoryTrigger }
  /** Her route is complete. */
  | { kind: 'done' }

/** The four conditions, as the manual lists them. */
export const READY_CONDITIONS: readonly { condition: string; unmet: string }[] = [
  { condition: 'Her bar is full for the rung; a waiting rung opens the day after the rung before, the proposal needs a ring, and a planned wedding waits for its date', unmet: '`bar`, `day`, `ring`, `wedding-day`' },
  { condition: 'She hasn’t played one of her events today', unmet: '`today`' },
  { condition: 'A chapter requirement or Warehouse item or bond decides the scene version, once the event is Ready', unmet: 'Play an alternate now. The original can be viewed in the Library when its requirements are met.' },
]
/** The waits in the order `readiness` says them: the first one met is the one shown. */
export const WAIT_ORDER: readonly { kind: Wait['kind']; when: string }[] = [
  { kind: 'done', when: 'Her route is complete (S5 has played)' },
  { kind: 'night', when: 'S2 or S4, bar full: no Ready event; the level comes at night, and the morning plays its scene; short of it, `bar`' },
  { kind: 'friend', when: 'She said “Not yet” at her confession: you ask her again from her profile' },
  { kind: 'bar', when: 'Her bar isn’t full for the rung' },
  { kind: 'day', when: 'A waiting rung, on the day the rung before played' },
  { kind: 'wedding-day', when: 'The wedding is scheduled for a later day' },
  { kind: 'ring', when: 'The proposal, with no ring in the Warehouse' },
  { kind: 'today', when: 'She played one of her events today' },
]

export interface Readiness {
  /** Her next rung, or null once her route is complete. */
  rung: string | null
  ready: boolean
  /** The first thing in the way, or null when Ready. */
  waits: Wait | null
  /** Requirements for the original scene when an alternate is available. */
  alternate?: readonly RouteRequirement[]
}

/** Her next event's state, wherever she lives. Refused for someone you haven't met. */
export function readiness(save: SaveV4, pack: Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'world'>>, id: string): Readiness {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'You haven’t met her yet.')
  const now = bar(love)
  const rung = now.rung
  const wait = (w: Wait): Readiness => ({ rung, ready: false, waits: w })
  if (rung === null) return wait({ kind: 'done' })
  if (NIGHT_RUNGS.includes(rung)) return wait({ kind: now.full ? 'night' : 'bar' })
  if (love.stage === 'confession' && love.friend) return wait({ kind: 'friend' })
  const day = save.calendar.day
  if (WAITING_RUNGS.includes(rung) ? day <= love.last : !now.full) return wait({ kind: WAITING_RUNGS.includes(rung) ? 'day' : 'bar' })
  if (rung === 'wedding' && love.weddingDay !== undefined && day < love.weddingDay) return wait({ kind: 'wedding-day', day: love.weddingDay })
  if (rung === 'proposal' && !RING_IDS.some((ring) => goodCount(save.items, ring) > 0)) return wait({ kind: 'ring' })
  if (save.today.events.includes(id) || love.last === day) return wait({ kind: 'today' })
  const alternate = routeRequirements(save, pack, id, rung)
  return { rung, ready: true, waits: null, ...(alternate.length ? { alternate } : {}) }
}
