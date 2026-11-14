// When her next event is Ready: written with the ladders, since the
// Ready chips, sort and filter read it before the events play. All four:
//
//   1 her bar is full for the rung, or for a waiting rung it's the day after the rung before (the proposal: and a ring)
//   2 she's home (in town shows "Invite her to the farm")
//   3 she hasn't played an event today
//   4 its one setup is met, if it has one: she works a named place today, a named good is in the Warehouse, her bond with
//     a named Uma has reached a level
//
// Never an hour, the weather, a season or a festival, and never the story: an event the pack doesn't script plays the
// game's own short card (`placeholders.ts`). What isn't met is said: `waits` names the first thing in the way, in this
// order: the route done; S2 and S4, which come at night; a "Not yet" at her confession; a working setup at a place not
// built yet; the bar or the day; the ring; in town (`away`); today; the setup. Read live: Ready
// changes by day, so the morning never stores it.
import { statusOf } from '@luismlorenzana/uma-work'
import { workNow } from '../farm/calendar'
import { bondHearts } from '../farm/bonds'
import { PLACE_ACTIVITY } from '../farm/rank-rules'
import { RING_IDS } from '../goods/ids'
import type { Activity } from '../farm/ranks'
import { SaveRuleError } from '../save/rules'
import type { LoopPlaceId } from '../save/parse-v4'
import { atHome, pairKey } from '../save/v4'
import type { SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import type { Trigger } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { beatOf } from '../story/placeholders'
import { bar, NIGHT_RUNGS, WAITING_RUNGS } from './love'
import { placeBuilt, type FarmPlaceId } from '../farm/places'
import { ACTIVITY_PLACE } from './perks'


/** A setup the player meets on the day: she works a place, a good is held, a bond is reached. */
export type Setup = Extract<Trigger, { kind: 'working' | 'item' | 'bond' }>

/** What keeps her next event from being Ready. */
export type Wait =
  /** Her bar isn't full for the rung. */
  | { kind: 'bar' }
  /** A waiting rung: Ready the day after the rung before. */
  | { kind: 'day' }
  /** The proposal: a ring in the Warehouse. */
  | { kind: 'ring' }
  /** She lives in town (met, no bed of hers): "Invite her to the farm". */
  | { kind: 'away' }
  /** She played one of her events today. */
  | { kind: 'today' }
  /** Its setup, not met today. */
  | { kind: 'setup'; setup: Setup }
  /** A working setup at a place not built yet: "Opens when the Kitchen is built". */
  | { kind: 'opens'; place: FarmPlaceId }
  /** S2 and S4 have no event: they come at night once their bar fills. */
  | { kind: 'night' }
  /** She said "Not yet" at her confession: you ask her again from her profile. */
  | { kind: 'friend' }
  /** Her route is complete. */
  | { kind: 'done' }

/** The four conditions, as the manual lists them. */
export const READY_CONDITIONS: readonly { condition: string; unmet: string }[] = [
  { condition: 'Her bar is full for the rung; a waiting rung (the confession, the proposal, the wedding) is Ready the day after the rung before, and the proposal needs a ring in the Warehouse', unmet: '`bar`, `day`, `ring`' },
  { condition: 'She’s home (on the Dorm’s list, or a spouse in her house)', unmet: '`away`: “Invite her to the farm”' },
  { condition: 'She hasn’t played one of her events today', unmet: '`today`' },
  { condition: 'Its one setup is met, if it has one: she works a named activity today (a running job there, or a tended growing block for farming), a named good is in the Warehouse at any stars, her bond with a named Uma has reached a level', unmet: '`setup`; `opens` for the ranch, mining, cooking, expeditions, serving or forging before their place is built (the Coop, the Mine, the Kitchen, the expedition post, the Restaurant, the Forge)' },
]
/** The waits in the order `readiness` says them: the first one met is the one shown. */
export const WAIT_ORDER: readonly { kind: Wait['kind']; when: string }[] = [
  { kind: 'done', when: 'Her route is complete (S5 has played)' },
  { kind: 'night', when: 'S2 or S4, bar full: no event, the level comes at night; short of it, `bar`' },
  { kind: 'friend', when: 'She said “Not yet” at her confession: you ask her again from her profile' },
  { kind: 'opens', when: 'A working setup at a place not built yet' },
  { kind: 'bar', when: 'Her bar isn’t full for the rung' },
  { kind: 'day', when: 'A waiting rung, on the day the rung before played' },
  { kind: 'ring', when: 'The proposal, with no ring in the Warehouse' },
  { kind: 'away', when: 'She lives in town' },
  { kind: 'today', when: 'She played one of her events today' },
  { kind: 'setup', when: 'Its day setup isn’t met today' },
]

export interface Readiness {
  /** Her next rung, or null once her route is complete. */
  rung: string | null
  ready: boolean
  /** The first thing in the way, or null when Ready. */
  waits: Wait | null
}

/** Whether she works an activity today: a running job at a place of it (`PLACE_ACTIVITY`), or for farming
 * a tended block with a growing plot. */
export function worksToday(save: SaveV4, id: string, activity: Activity): boolean {
  const row = save.work[id]
  const place = row?.slot?.building as LoopPlaceId | undefined
  if (row && place && PLACE_ACTIVITY[place] === activity && statusOf(row, workNow(save)) === 'working') return true
  return activity === 'farming' && save.fields.blocks.some((b) => b.tender === id && b.plots.some((p) => p.crop !== null && !p.ready))
}

/** Whether a day setup is met. */
export function setupMet(save: SaveV4, id: string, setup: Setup): boolean {
  switch (setup.kind) {
    case 'working': return worksToday(save, id, setup.activity)
    case 'item': return goodCount(save.items, setup.good) > 0
    case 'bond': return bondHearts(save.bonds[pairKey(id, setup.with)] ?? 0) >= setup.level
  }
}

/** The place a setup waits for, or null when it can be met now. */
function opensWith(save: SaveV4, trigger: Trigger): FarmPlaceId | null {
  const place = trigger.kind === 'working' ? ACTIVITY_PLACE[trigger.activity] ?? null : null
  return place !== null && !placeBuilt(save, place) ? place : null
}

/** Her next event's state. Home is `dorm.home`, or a spouse in her house (`atHome`). Refused for
 * someone not on the farm. */
export function readiness(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, id: string): Readiness {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  const now = bar(love)
  const rung = now.rung
  const wait = (w: Wait): Readiness => ({ rung, ready: false, waits: w })
  if (rung === null) return wait({ kind: 'done' })
  if (NIGHT_RUNGS.includes(rung)) return wait({ kind: now.full ? 'night' : 'bar' })
  if (love.stage === 'confession' && love.friend) return wait({ kind: 'friend' })
  const trigger: Trigger = beatOf(pack, id, rung)?.trigger ?? { kind: 'hearts' }
  const place = opensWith(save, trigger)
  if (place !== null) return wait({ kind: 'opens', place })
  const day = save.calendar.day
  if (WAITING_RUNGS.includes(rung) ? day <= love.last : !now.full) return wait({ kind: WAITING_RUNGS.includes(rung) ? 'day' : 'bar' })
  if (rung === 'proposal' && !RING_IDS.some((ring) => goodCount(save.items, ring) > 0)) return wait({ kind: 'ring' })
  if (!atHome(save, id)) return wait({ kind: 'away' })
  if (save.today.events.includes(id) || love.last === day) return wait({ kind: 'today' })
  if ((trigger.kind === 'working' || trigger.kind === 'item' || trigger.kind === 'bond') && !setupMet(save, id, trigger)) return wait({ kind: 'setup', setup: trigger })
  return { rung, ready: true, waits: null }
}
