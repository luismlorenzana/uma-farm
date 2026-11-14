// Her menu: what you can do with an Uma you find in town (or on the farm), each item at the design's cost in actions.
// Introducing yourself meets her; then talks, gifts, the evenings, the invitation to work and her event. Pure: it says
// what's open and why not; the acts are `romance/meeting.ts`'s `introduce`, `romance/acts.ts`' `chatV4` and `giftV4`,
// `romance/evening.ts`' evenings, `romance/loop.ts`' `inviteToWork` and `romance/events.ts`' `playEvent`.
//
//   introduce yourself   1     not met: in town today, where she is now
//   talk                 1     met: once a day (+15)
//   give a gift          1     met: once a day, one good from the Warehouse
//   a hangout / a date   2     a friend (Friendship 3) for a hangout, a sweetheart (Romance 1) or a spouse for a date;
//                              she's home on the farm (the evening as built)
//   invite her to work   1     a friend (Friendship 3), once: she's a farmhand
//   her event            1     met, when it's Ready (a special day's event actions first)
//
// **Where you meet her:** you talk with her, give her a gift and invite her to work where she's in front of you: on the
// farm when she lives there, else in town where she is today, once you've gone into town (`whereYouMeet`). Her profile
// follows the same rule; her Ready event plays from anywhere.
import { actionCost, actionsLeft, canSpendForEvent, type ActionId, type SpecialDays } from '../farm/actions'
import { goodOf, isSeedId } from '../goods/ids'
import { eveningAffordable, eveningCost, eveningRole, HANGOUT_FROM, kindsNow } from '../romance/evening'
import { FRIEND_FROM, isFarmhand, workBlock } from '../romance/loop'
import { introduceBlock, type MeetPack } from '../romance/meeting'
import { readiness } from '../romance/ready'
import { atHome, type SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import type { StoryPack } from '../story/pack'
import { festivalsOf, townOf } from '../story/placeholders'
import { townDay } from './town'

/** Her menu's items, in the order they show. */
export const MENU_ITEMS = ['introduce', 'talk', 'gift', 'hangout', 'date', 'work', 'event'] as const
export type MenuItemId = typeof MENU_ITEMS[number]

/** One item of her menu: its words, its cost in actions (null: not charged yet), whether it's open, and why not. */
export interface MenuItem {
  readonly id: MenuItemId
  readonly label: string
  readonly cost: number | null
  readonly open: boolean
  /** Why it isn't open ("Talked today", "No actions left today."), or null. */
  readonly why: string | null
  /** Done for today: talked, or her gift given; or for good: she works the farm. */
  readonly done: boolean
}

/** Each item's words and its action in the cost table (`farm/actions.ts`), as the manual lists them. */
export const MENU_RULES: readonly { id: MenuItemId; label: string; action: ActionId | null; when: string }[] = [
  { id: 'introduce', label: 'Introduce yourself', action: 'introduce', when: 'You haven’t met her: in town today, where she is now. She’s met, and her meeting scene plays' },
  { id: 'talk', label: 'Talk', action: 'talk', when: 'Met: once a day each, +15. Her line for the day plays on the dialogue engine' },
  { id: 'gift', label: 'Give a gift', action: 'gift', when: 'Met: once a day each, one good from the Warehouse at the stars you choose; her reaction plays on the dialogue engine' },
  { id: 'hangout', label: 'Hangout', action: 'hangout', when: `A friend (Friendship ${HANGOUT_FROM} and up) who lives on the farm: her evening, its play and her scene` },
  { id: 'date', label: 'Date', action: 'hangout', when: 'A sweetheart (Romance 1 and up) or a spouse, on the farm: her evening, Dinner in town and A night in among its kinds' },
  { id: 'work', label: 'Invite her to work', action: 'invite', when: `A friend (Friendship ${FRIEND_FROM} and up), once: she’s a farmhand from today` },
  { id: 'event', label: 'Her event', action: 'event', when: 'Met, when her next event is Ready; a special day’s event actions pay first' },
]
const LABEL = new Map(MENU_RULES.map((r) => [r.id, r.label]))

type MenuPack = MeetPack

/** Whether the Warehouse holds anything she could be given: any good but seeds. */
export const hasGifts = (save: Pick<SaveV4, 'items'>): boolean => Object.keys(save.items).some((id) => !isSeedId(id) && goodOf(id) !== undefined && goodCount(save.items, id) > 0)

/** Where you'd find her now: on the farm (she lives there), or at `at` in town today (null: at home, not out); `here`
 * once she's in front of you: on the farm, or out in town with you there today. */
export interface MeetWhere {
  readonly here: boolean
  readonly farm: boolean
  /** Her place in town today; null on the farm or at home. */
  readonly at: string | null
}
type WherePack = Pick<StoryPack, 'cast' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master'>>
/** Where you meet her now: on the farm when she lives there, else where the town puts her today; she's in front of you
 * once you've gone into town. */
export function whereYouMeet(save: Pick<SaveV4, 'account' | 'calendar' | 'roster' | 'dorm' | 'love' | 'today'>, pack: WherePack, id: string): MeetWhere {
  if (save.roster[id] && atHome(save, id)) return { here: true, farm: true, at: null }
  const at = townDay(save, pack).where.get(id) ?? null
  return { here: at !== null && save.today.town, farm: false, at }
}

/** Her menu now: introduce yourself while you haven't met; once met, talk, a gift, her evening (a hangout or a date, 2
 * actions), the invitation to work and her event when it's Ready. The town's people have none: their menus are their
 * posts'. `days` are the special days, whose event actions pay for her event first. */
export function herMenu(save: SaveV4, pack: MenuPack, id: string, days: SpecialDays): MenuItem[] {
  if (townOf(pack).byId.has(id)) return []
  const left = actionsLeft(save)
  const item = (id: MenuItemId, cost: number | null, why: string | null, done = false): MenuItem => ({ id, label: LABEL.get(id)!, cost, open: why === null, why, done })
  const afford = (action: ActionId): string | null => (left < actionCost(action) ? 'No actions left today.' : null)
  const love = save.love[id]
  if (!save.roster[id] || !love) return [item('introduce', actionCost('introduce'), introduceBlock(save, pack, id))]
  const talked = save.today.chats.includes(id)
  const gifted = save.today.gifts.includes(id)
  const role = eveningRole(love)
  const evening = kindsNow(save, id, festivalsOf(pack)).length > 0
  const spent = save.today.evenings.some((e) => e.with === id)
  const eveningWhy = evening
    ? eveningAffordable(save) ? null : left === 0 ? 'No actions left today.' : `That takes ${eveningCost()} actions.`
    : spent ? 'Spent this evening ✓' : role === null ? `From Friendship ${HANGOUT_FROM}` : !save.dorm.home.includes(id) && love.stage !== 'spouse' ? 'She lives in town: invite her to the farm' : 'Tonight’s evening is spent'
  const work = workBlock(save, id)
  const ready = readiness(save, pack, id)
  return [
    item('talk', actionCost('talk'), talked ? 'Talked today ✓' : afford('talk'), talked),
    item('gift', actionCost('gift'), gifted ? 'Gift given today ✓' : afford('gift') ?? (hasGifts(save) ? null : 'Nothing in the Warehouse to give'), gifted),
    item(role === 'date' || role === 'spouse' ? 'date' : 'hangout', eveningCost(), eveningWhy),
    item('work', actionCost('invite'), work, isFarmhand(save, id)),
    ...(ready.ready ? [item('event', actionCost('event'), canSpendForEvent(save, actionCost('event'), days) ? null : 'No actions left today.')] : []),
  ]
}
