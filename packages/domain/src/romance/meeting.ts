// Meeting her: every character lives in town, and her story begins when her trigger is met. From then on she has the
// whole romance (her ladders, events, perks, evenings, the proposal, the wedding and married life) and shows on Hearts.
// The roster is everyone you've met, and `roster[id].joined` the day you met her. Pure; loaded with the town, the Gate and
// the night.
//
//   her trigger    her cast entry's `meet`, from the trigger menu (`story/authored.ts`); with none, talks on 3 days
//   the welcome    the welcome list meets you on her first talk, whatever her trigger: from day 1, one a morning visits
//   list           the Gate (`gateVisitor`), and Say hello there is that talk (`sayHello`); day 1's is the first helper
//   checked        a talk in town (`talkToHer`): every kind but a gift. A gift in town (`giftInTown`): a gift, and the
//                  kinds the farm holds. The night (`meetTonight`, step 8 after the goals): the kinds the farm holds
//                  (a Farm Rank, a place built, a good shipped, another's event), for everyone in town not met yet
//   met            she joins the roster (`meet`) at Friendship 0: home in the Dorm while a bed is free, else she lives
//                  in town as a friend, and Invite to the farm (`inviteToFarm`) brings her once a bed is free. Her
//                  meeting scene (her arrival scene, or the placeholder) plays next (`sceneDue`). No cap on how many
//   the save       `roster[id].joined` is the day she was met; her trigger's progress is the town's talks (`town`)
//
// The town's people keep their spots and are never met. A sister (`s<outfitId>`) is met like anyone.
import { seedTies } from '../farm/bonds'
import { dateOf, festivalOn, FESTIVALS, type Festival } from '../farm/calendar'
import { freeBeds, joinRoster } from '../farm/dorm'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { goodOf, isSeedId } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import { atHome, newLove, type SaveV4 } from '../save/v4'
import { takeGoods } from '../save/warehouse'
import type { SpotId, StoryTrigger } from '../story/authored'
import { castOrder, type StoryPack } from '../story/pack'
import { festivalsOf, meetOf, onWelcomeList, tasteOf, townOf } from '../story/placeholders'
import { gateVisitor, talkedToday, talkInTown, townDay, townsfolk } from '../town/town'
import type { Taste } from './chats'

/** The pack meeting reads: the cast and its ties, the bibles (tastes), the town (its people, master data's
 * characters), and the world (the year's festivals). */
export type MeetPack = Pick<StoryPack, 'cast' | 'ties' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master' | 'world'>>

/** How her trigger is checked: on a talk in town (at a spot) or at the Gate, on a gift in town, or at night. */
export type MeetHow =
  | { at: 'town'; spot: SpotId }
  | { at: 'gate' }
  | { at: 'gift'; good: string; taste: Taste }
  | { at: 'night' }

/** The trigger kinds the farm holds on its own, checked every night as well as on a talk or a gift. */
export const FARM_KINDS: readonly StoryTrigger['kind'][] = ['farm-rank', 'built', 'shipped', 'event']

/** The trigger menu as the manual lists it: each kind, what meets her, and when it's checked. */
export const MEET_KINDS: readonly { kind: StoryTrigger['kind']; meets: string; checked: string }[] = [
  { kind: 'talks', meets: 'Talk with her on this many different days (3 without a trigger)', checked: 'A talk in town' },
  { kind: 'gift', meets: 'Give her a gift she likes or loves in town, or the good it names', checked: 'A gift in town' },
  { kind: 'spot', meets: 'Talk with her at this town spot', checked: 'A talk in town' },
  { kind: 'season', meets: 'Talk with her in this season', checked: 'A talk in town' },
  { kind: 'festival', meets: 'Talk with her on this festival’s day, any year', checked: 'A talk in town' },
  { kind: 'farm-rank', meets: 'The Farm Rank reaches this rank', checked: 'A talk or a gift in town, and every night' },
  { kind: 'built', meets: 'This place of the farm is built', checked: 'A talk or a gift in town, and every night' },
  { kind: 'shipped', meets: 'This many of a good shipped, in all', checked: 'A talk or a gift in town, and every night' },
  { kind: 'event', meets: 'Another character’s event has played (`<characterId>:<event>`; `arrival` is her meeting scene), or an event id: anyone’s', checked: 'A talk or a gift in town, and every night' },
]

/** Whether an event has played: `<characterId>:<eventId>` in her memories (her `arrival`, her meeting scene), or a bare
 * event id in anyone's. */
export function eventPlayed(save: Pick<SaveV4, 'memories' | 'arrivals'>, after: string): boolean {
  const at = after.indexOf(':')
  const played = (id: string, event: string) => (event === 'arrival' ? save.arrivals.includes(id) : save.memories[id]?.includes(event) ?? false)
  if (at > 0) return played(after.slice(0, at), after.slice(at + 1))
  return after === 'arrival' ? save.arrivals.length > 0 : Object.values(save.memories).some((events) => events.includes(after))
}

/** Whether a trigger holds for her now, as `how` sees it. A talk in town checks every kind but a gift; at the Gate, the
 * same with no spot; a gift checks a gift and the farm's kinds; the night only the farm's kinds. `year` is the year's
 * festivals: the game's five, or the story's (`festivalsOf`). */
export function triggerHolds(save: SaveV4, trigger: StoryTrigger, talks: number, how: MeetHow, year: readonly Festival[] = FESTIVALS): boolean {
  const talk = how.at === 'town' || how.at === 'gate'
  switch (trigger.kind) {
    case 'talks': return talk && talks >= trigger.days
    case 'spot': return how.at === 'town' && how.spot === trigger.spot
    case 'season': return talk && dateOf(save.calendar.day).season === trigger.season
    case 'festival': return talk && festivalOn(save.calendar.day, year)?.id === trigger.festival
    case 'gift': return how.at === 'gift' && (trigger.good ? how.good === trigger.good : how.taste === 'liked' || how.taste === 'loved')
    case 'farm-rank': return farmRankOf(save.farm.points) >= trigger.rank
    case 'built': return placeBuilt(save, trigger.place)
    case 'shipped': return (save.diary.shipped[trigger.good] ?? 0) >= trigger.count
    case 'event': return eventPlayed(save, trigger.after)
  }
}

/** Whether she meets you now: never once met, nor one of the town's people; the welcome list on any talk; anyone else
 * when her trigger holds. */
export function meetsHer(save: SaveV4, pack: MeetPack, id: string, how: MeetHow): boolean {
  if (save.roster[id] || townOf(pack).byId.has(id)) return false
  if (onWelcomeList(pack, id)) return how.at === 'town' || how.at === 'gate'
  return triggerHolds(save, meetOf(pack, id), save.town[id]?.talks ?? 0, how, festivalsOf(pack))
}

/** You've met her: she joins the roster today (`joinRoster`: home in the Dorm while a bed is free, else she lives in
 * town), her route at Friendship 0 with 0 points, and each of her ties with someone met starts at its seed
 * (`seedTies`). Her meeting scene is due next (`sceneDue`). Refused for someone met already. Never stamps. */
export function meet(save: SaveV4, id: string, pack: Pick<StoryPack, 'ties'> | null = null): { save: SaveV4; home: boolean } {
  const joined = joinRoster(save, id)
  const loved: SaveV4 = { ...joined.save, love: { ...joined.save.love, [id]: newLove() } }
  return { save: pack ? seedTies(loved, pack, id) : loved, home: joined.home }
}

/** A talk with her in town (`talkInTown`: once a day, she must be out), and meeting her when it meets her trigger. */
export function talkToHer(save: SaveV4, pack: MeetPack, id: string): { save: SaveV4; met: boolean } {
  const talked = talkInTown(save, pack, id)
  const spot = townDay(save, pack).where.get(id)!
  if (!meetsHer(talked, pack, id, { at: 'town', spot })) return { save: talked, met: false }
  return { save: meet(talked, id, pack).save, met: true }
}

/** Say hello to today's visitor at the Gate: her first talk (it counts in the town's talks) meets her, and she moves in
 * while a bed is free. Refused for anyone but today's visitor, or once she's met. */
export function sayHello(save: SaveV4, pack: MeetPack, id: string): SaveV4 {
  if (gateVisitor(save, pack) !== id) throw new SaveRuleError('not-owned', 'She isn’t at the Gate.')
  if (save.roster[id]) throw new SaveRuleError('bad-job', 'You’ve met her already.')
  const talks = talkedToday(save, id) ? save.town[id]!.talks : (save.town[id]?.talks ?? 0) + 1
  const talked: SaveV4 = { ...save, town: { ...save.town, [id]: { talks, last: save.calendar.day } } }
  return meet(talked, id, pack).save
}

/** A gift for her in town: one good from the Warehouse at its stars (seeds aren't gifts), once you've talked with her
 * today. It meets her when her trigger is a gift and holds (or a farm's kind holds); else she thanks you, by her taste.
 * Only for someone out in town today you haven't met. */
export function giftInTown(save: SaveV4, pack: MeetPack, id: string, item: string, stars: number): { save: SaveV4; taste: Taste; met: boolean } {
  if (!townDay(save, pack).where.has(id)) throw new SaveRuleError('not-owned', 'She isn’t out in town today.')
  if (save.roster[id]) throw new SaveRuleError('bad-job', 'You’ve met her: give gifts on her profile.')
  if (!talkedToday(save, id)) throw new SaveRuleError('not-ready', 'Talk with her first.')
  if (isSeedId(item) || !goodOf(item)) throw new SaveRuleError('bad-job', 'That isn’t a gift.')
  const given: SaveV4 = { ...save, items: takeGoods(save.items, item, stars, 1) }
  const taste = tasteOf(pack, id, item)
  if (!meetsHer(given, pack, id, { at: 'gift', good: item, taste })) return { save: given, taste, met: false }
  return { save: meet(given, id, pack).save, taste, met: true }
}

/** Night step 8, after the goals: everyone in town not met yet whose trigger is one the farm holds (a Farm Rank, a place
 * built, a good shipped, another's event) and holds tonight is met, the cast's order first, then the town's. The welcome
 * list waits for the Gate. */
export function meetTonight(save: SaveV4, pack: MeetPack): { save: SaveV4; met: { id: string; home: boolean }[] } {
  const everyone = [...new Set([...castOrder(pack), ...townsfolk(pack)])]
  let next = save
  const met: { id: string; home: boolean }[] = []
  for (const id of everyone) {
    if (onWelcomeList(pack, id) || next.roster[id] || townOf(pack).byId.has(id)) continue
    const trigger = meetOf(pack, id)
    if (!FARM_KINDS.includes(trigger.kind) || !meetsHer(next, pack, id, { at: 'night' })) continue
    const joined = meet(next, id, pack)
    next = joined.save
    met.push({ id, home: joined.home })
  }
  return { save: next, met }
}

/** Why she can't be invited to the farm now, or null: she's met and lives in town, and a bed is free this morning. */
export function inviteBlock(save: Pick<SaveV4, 'roster' | 'dorm' | 'love'>, id: string): string | null {
  if (!save.roster[id]) return 'You haven’t met her yet.'
  if (atHome(save, id)) return 'She lives on the farm.'
  if (save.dorm.swaps.some((s) => s.in === id)) return 'She arrives tomorrow.'
  if (freeBeds(save) <= 0) return 'No bed free.'
  return null
}

/** Invite to the farm: one you've met who lives in town moves into a free Dorm bed now, and can work today. */
export function inviteToFarm(save: SaveV4, id: string): SaveV4 {
  const block = inviteBlock(save, id)
  if (block) throw new SaveRuleError(block === 'No bed free.' ? 'locked' : 'bad-job', block === 'No bed free.' ? 'No bed is free: upgrade the Dorm, or swap.' : block)
  return { ...save, dorm: { ...save.dorm, home: [...save.dorm.home, id] } }
}
