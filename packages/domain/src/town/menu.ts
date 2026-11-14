// Her menu: what you can do with an Uma you find in town (or on the farm), each item at the design's cost in actions.
// Introducing yourself meets her; then talks, gifts, the evenings and her event. Pure: it says what's open and why not;
// the acts are `romance/meeting.ts`'s `introduce`, `romance/acts.ts`' `chatV4` and `giftV4`, `romance/evening.ts`' evenings
// and `romance/events.ts`' `playEvent`.
//
//   introduce yourself   1     not met: in town today, where she is now
//   talk                 1     met: once a day (+15)
//   give a gift          1     met: once a day, one good from the Warehouse
//   a hangout / a date   —     met: her evening as built (a hangout from Friendship 2, a date from Romance 1); its cost
//                              and the stages' rules come with the Uma loop
//   invite her to work   —     coming with the farmhands
//   her event            1     met, when it's Ready (a special day's event actions first)
import { actionCost, actionsLeft, canSpendForEvent, type ActionId, type SpecialDays } from '../farm/actions'
import { goodOf, isSeedId } from '../goods/ids'
import { eveningRole, HANGOUT_FROM, kindsNow } from '../romance/evening'
import { introduceBlock, type MeetPack } from '../romance/meeting'
import { readiness } from '../romance/ready'
import type { SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import { festivalsOf, townOf } from '../story/placeholders'

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
  /** Done for today: talked, or her gift given. */
  readonly done: boolean
}

/** Each item's words and its action in the cost table (`farm/actions.ts`), as the manual lists them. */
export const MENU_RULES: readonly { id: MenuItemId; label: string; action: ActionId | null; when: string }[] = [
  { id: 'introduce', label: 'Introduce yourself', action: 'introduce', when: 'You haven’t met her: in town today, where she is now. She’s met, and her meeting scene plays' },
  { id: 'talk', label: 'Talk', action: 'talk', when: 'Met: once a day each, +15. Her line for the day plays on the dialogue engine' },
  { id: 'gift', label: 'Give a gift', action: 'gift', when: 'Met: once a day each, one good from the Warehouse at the stars you choose; her reaction plays on the dialogue engine' },
  { id: 'hangout', label: 'Hangout', action: null, when: 'A friend (Friendship 2 and up): her evening as built, free until the Uma loop charges it' },
  { id: 'date', label: 'Date', action: null, when: 'A sweetheart (Romance 1 and up) or a spouse: her evening as built, free until the Uma loop charges it' },
  { id: 'work', label: 'Invite her to work', action: null, when: 'Shown, coming with the farmhands' },
  { id: 'event', label: 'Her event', action: 'event', when: 'Met, when her next event is Ready; a special day’s event actions pay first' },
]
const LABEL = new Map(MENU_RULES.map((r) => [r.id, r.label]))

type MenuPack = MeetPack

/** Whether the Warehouse holds anything she could be given: any good but seeds. */
export const hasGifts = (save: Pick<SaveV4, 'items'>): boolean => Object.keys(save.items).some((id) => !isSeedId(id) && goodOf(id) !== undefined && goodCount(save.items, id) > 0)

/** Her menu now: introduce yourself while you haven't met; once met, talk, a gift, her evening (a hangout or a date),
 * the invitation to work (coming with the farmhands) and her event when it's Ready. The town's people have none: their
 * menus are their posts'. `days` are the special days, whose event actions pay for her event first. */
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
  const eveningWhy = evening ? null : spent ? 'Spent this evening ✓' : role === null ? `From Friendship ${HANGOUT_FROM}` : !save.dorm.home.includes(id) && love.stage !== 'spouse' ? 'She lives in town: invite her to the farm' : 'Tonight’s evening is spent'
  const ready = readiness(save, pack, id)
  return [
    item('talk', actionCost('talk'), talked ? 'Talked today ✓' : afford('talk'), talked),
    item('gift', actionCost('gift'), gifted ? 'Gift given today ✓' : afford('gift') ?? (hasGifts(save) ? null : 'Nothing in the Warehouse to give'), gifted),
    item(role === 'date' || role === 'spouse' ? 'date' : 'hangout', null, eveningWhy),
    item('work', null, 'Coming with the farmhands'),
    ...(ready.ready ? [item('event', actionCost('event'), canSpendForEvent(save, actionCost('event'), days) ? null : 'No actions left today.')] : []),
  ]
}
