// The town: every character of master data's lives there, once each, and the pack's sisters, less the town's people,
// who keep its spots. Each day a draw seeded by the player and the day puts up to four of them at each of the six spots,
// about two dozen in all; the rest are at home. A character the pack gives a favourite spot is there more often. Tap one
// to talk: her line for the day (the pack's, else the game's), and a talk counts once a day, toward her trigger to meet
// (`romance/meeting.ts`). Talking costs nothing and takes no time. Pure.
//
//   the order     everyone in town but today's Gate visitor, by draw(uid, day, 'town:<id>', 0), lowest first
//   her spot      her favourite, while it has room, when draw(…, 1) < 0.6; else one with room by draw(…, 2)
//   the day       full when each spot holds four, or when everyone's out
//   on the farm   an Uma living on the farm keeps her place in the draw, unseen: so the day's town never shifts when
//                 someone moves in. One you've met who lives in town is out like anyone else
//   the Gate      the welcome list's next visitor is at the Gate today (`gateVisitor`), never in town
import { draw } from '../farm/draw'
import { SaveRuleError } from '../save/rules'
import { atHome, type SaveV4, type TownTalks } from '../save/v4'
import { SPOT_IDS, type SpotId } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { favouriteSpotOf, townLinesOf, townOf, welcomeVisitors } from '../story/placeholders'

/** How many stand at a spot at once. */
export const SPOT_ROOM = 4
/** How often she's at her favourite spot when she's out (while it has room); else at any with room. */
export const FAVOURITE_SPOT = 0.6

type TownPack = Pick<StoryPack, 'cast' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master'>>

/** Everyone who lives in town, in a fixed order: master data's characters by id, then the cast's others (its sisters, and
 * anyone master data doesn't hold), less the town's people. The Umas on the farm are among them; they're at the farm. */
export function townsfolk(pack: TownPack): string[] {
  const people = townOf(pack).byId
  const master = [...(pack.master?.outfits.keys() ?? [])]
  const known = new Set(master)
  return [...master, ...pack.cast.umas.map((u) => u.characterId).filter((id) => !known.has(id))].filter((id) => !people.has(id))
}

/** Today's visitor at the Gate: the welcome list's first (in its order) not met before today. One a morning: the next
 * comes the morning after the one before her is met, so day 1's is the list's first. She stays the day's visitor once met
 * today; null once the whole list was met before today. */
export function gateVisitor(save: Pick<SaveV4, 'calendar' | 'roster'>, pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>): string | null {
  return welcomeVisitors(pack).find((id) => {
    const met = save.roster[id]
    return !met || met.joined === save.calendar.day
  }) ?? null
}

/** One day in town: who's at each spot, and where each one out is. */
export interface TownDay {
  readonly day: number
  /** Each spot's few, in the order they came. */
  readonly spots: ReadonlyMap<SpotId, readonly string[]>
  /** Where she is today: her spot, for everyone out. */
  readonly where: ReadonlyMap<string, SpotId>
}

/** The town on the save's day: the seeded draw over everyone in town but today's Gate visitor; an Uma living on the farm
 * keeps her place, unseen. The same day always shows the same town, whoever moves in. */
export function townDay(save: Pick<SaveV4, 'account' | 'calendar' | 'roster' | 'dorm' | 'love'>, pack: TownPack): TownDay {
  const uid = save.account.uid
  const day = save.calendar.day
  const visitor = gateVisitor(save, pack)
  const out = townsfolk(pack).filter((id) => id !== visitor)
    .map((id) => [id, draw(uid, day, `town:${id}`, 0)] as const)
    .sort(([a, x], [b, y]) => x - y || a.localeCompare(b))
  const spots = new Map<SpotId, string[]>(SPOT_IDS.map((id) => [id, []]))
  const where = new Map<string, SpotId>()
  for (const [id] of out) {
    const open = SPOT_IDS.filter((s) => spots.get(s)!.length < SPOT_ROOM)
    if (open.length === 0) break
    const favourite = favouriteSpotOf(pack, id)
    const spot = favourite && open.includes(favourite) && draw(uid, day, `town:${id}`, 1) < FAVOURITE_SPOT
      ? favourite : open[Math.min(open.length - 1, Math.floor(draw(uid, day, `town:${id}`, 2) * open.length))]!
    spots.get(spot)!.push(id)
    where.set(id, spot)
  }
  // Who lives on the farm keeps her place, unseen.
  for (const [id, spot] of where) {
    if (!save.roster[id] || !atHome(save, id)) continue
    where.delete(id)
    spots.set(spot, spots.get(spot)!.filter((x) => x !== id))
  }
  return { day, spots, where }
}

/** Her talks in town so far, or none. */
export const townTalksOf = (save: Pick<SaveV4, 'town'>, id: string): TownTalks | null => save.town[id] ?? null
/** Whether you've talked with her today: a talk counts once a day. */
export const talkedToday = (save: Pick<SaveV4, 'town' | 'calendar'>, id: string): boolean => save.town[id]?.last === save.calendar.day

/** A talk with her in town: one more day talked, once a day. She must be out today. Costs nothing, takes no time, and
 * never stamps: the app's action does. A second talk the same day changes nothing. Meeting her on it is
 * `romance/meeting.ts`'s `talkToHer`. */
export function talkInTown(save: SaveV4, pack: TownPack, id: string): SaveV4 {
  if (!townDay(save, pack).where.has(id)) throw new SaveRuleError('not-owned', 'She isn’t out in town today.')
  if (talkedToday(save, id)) return save
  const talks = (save.town[id]?.talks ?? 0) + 1
  return { ...save, town: { ...save.town, [id]: { talks, last: save.calendar.day } } }
}

/** Her line on the talk sheet today: one of her town lines (the pack's, else the game's), the same all day. `{farmer}`
 * fills as it shows. */
export function townLineOf(save: Pick<SaveV4, 'account' | 'calendar'>, pack: Pick<StoryPack, 'bibles'>, id: string): string {
  const lines = townLinesOf(pack, id)
  return lines[Math.min(lines.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, `town-line:${id}`, 0) * lines.length))]!
}
