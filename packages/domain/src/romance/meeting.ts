// Meeting her: every Uma is in town from day one, and you meet her by introducing yourself there, one action. From then
// on she has the whole romance (her ladders, events, perks, evenings, the proposal, the wedding and married life) and
// shows on Hearts. The roster is everyone you've met, and `roster[id].joined` the day you met her. Pure; loaded with the
// town and the night.
//
//   introduce      in town today (`today.town`), where she is now, not met yet, and not one of the town's people:
//                  one action, and she joins the roster (`meet`) at Friendship 0. She lives in town: nobody lives on the
//                  farm until she marries you (a spouse in her room), and a friend you invite to work comes on her farm
//                  days. Her meeting scene (her arrival scene, or the default story's) plays next (`sceneDue`). No cap
//                  on how many
//   no welcome     nobody comes to the Gate, and the night meets no one: the pack's welcome list and her trigger to meet
//                  are read and retired. Her chapters' gates stay (`chapters.ts`), and the trigger menu stays theirs and
//                  the Town notes'
//
// A sister (`s<outfitId>`) is met like anyone.
import { seedTies } from '../farm/bonds'
import { actionCost, actionsLeft, spend } from '../farm/actions'
import { dateOf, festivalOn, FESTIVALS, type Festival } from '../farm/calendar'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { SaveRuleError } from '../save/rules'
import { newLove, newRosterUma, type SaveV4 } from '../save/v4'
import type { StoryTrigger } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { townOf } from '../story/placeholders'
import { whereYouMeet } from '../town/town'
import type { Taste } from './chats'

/** The pack meeting reads: the cast and its ties, the bibles, the town (its people, master data's characters), and the
 * world (the year's festivals). */
export type MeetPack = Pick<StoryPack, 'cast' | 'ties' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master' | 'world'>>

/** How a Town note's unlock is checked: an introduction or a talk in town (at a location: a visit there), a gift, or
 * at night. */
export type MeetHow =
  | { at: 'town'; place: string }
  | { at: 'gift'; good: string; taste: Taste }
  | { at: 'night' }

/** Whether an event has played: `<characterId>:<eventId>` in her memories (her `arrival`, her meeting scene), or a bare
 * event id in anyone's. */
export function eventPlayed(save: Pick<SaveV4, 'memories' | 'arrivals'>, after: string): boolean {
  const at = after.indexOf(':')
  const played = (id: string, event: string) => (event === 'arrival' ? save.arrivals.includes(id) : save.memories[id]?.includes(event) ?? false)
  if (at > 0) return played(after.slice(0, at), after.slice(at + 1))
  return after === 'arrival' ? save.arrivals.length > 0 : Object.values(save.memories).some((events) => events.includes(after))
}

/** Whether a trigger from the menu holds now, as `how` sees it: a spot on an introduction or a talk there; a season or a
 * festival in town; a gift on a gift; what the farm holds (a Farm Rank, a place built, a good shipped, an event played)
 * any time. Her chapters' gates and the Town notes read it; her trigger to meet is retired. `year` is the year's
 * festivals: the game's five, or the story's (`festivalsOf`). */
export function triggerHolds(save: SaveV4, trigger: StoryTrigger, talks: number, how: MeetHow, year: readonly Festival[] = FESTIVALS): boolean {
  const talk = how.at === 'town'
  switch (trigger.kind) {
    case 'talks': return talk && talks >= trigger.days
    case 'spot': return how.at === 'town' && how.place === trigger.spot
    case 'season': return talk && dateOf(save.calendar.day).season === trigger.season
    case 'festival': return talk && festivalOn(save.calendar.day, year)?.id === trigger.festival
    case 'gift': return how.at === 'gift' && (trigger.good ? how.good === trigger.good : how.taste === 'liked' || how.taste === 'loved')
    case 'farm-rank': return farmRankOf(save.farm.points) >= trigger.rank
    case 'built': return placeBuilt(save, trigger.place)
    case 'shipped': return (save.diary.shipped[trigger.good] ?? 0) >= trigger.count
    case 'event': return eventPlayed(save, trigger.after)
  }
}

/** You've met her: she joins the roster today at Friendship 0 with 0 points, living in town, and each of her ties with someone met starts at its seed (`seedTies`). Her meeting scene is due next
 * (`sceneDue`). Refused for someone met already. Never stamps. */
export function meet(save: SaveV4, id: string, pack: Pick<StoryPack, 'ties'> | null = null): { save: SaveV4 } {
  if (save.roster[id]) throw new SaveRuleError('bad-job', 'You’ve met her already.')
  const loved: SaveV4 = { ...save, roster: { ...save.roster, [id]: newRosterUma(save.calendar.day) }, love: { ...save.love, [id]: newLove() } }
  return { save: pack ? seedTies(loved, pack, id) : loved }
}

/** Why you can't introduce yourself to her now, or null: you're in town today, she's out there now, you haven't met,
 * she isn't one of the town's people, and an action is left. */
export function introduceBlock(save: SaveV4, pack: MeetPack, id: string): string | null {
  if (save.roster[id]) return 'You’ve met her already.'
  if (townOf(pack).byId.has(id)) return 'She’s one of the town’s people.'
  if (!save.today.town) return 'Go into town first.'
  if (whereYouMeet(save, pack, id).at === null) return 'She isn’t out in town now.'
  if (actionsLeft(save) < actionCost('introduce')) return 'No actions left today.'
  return null
}

/** Introduce yourself: one action, and you've met her (`meet`). She keeps living in town, where you met her, and her
 * meeting scene plays next. Refused with `introduceBlock`'s words. Never stamps: the app's action does. */
export function introduce(save: SaveV4, pack: MeetPack, id: string): SaveV4 {
  const block = introduceBlock(save, pack, id)
  if (block) throw new SaveRuleError(block === 'No actions left today.' ? 'no-actions' : 'not-ready', block)
  return meet(spend(save, 'introduce'), id, pack).save
}
