// A day of actions. The farmer has 10 actions a day; every farm task and every outing costs what the design's table
// says, and looking is free (the map, the calendar, the book, every menu). The day's work is done when the actions run
// out, or when you end it. `today.actions` counts what's spent, and the night clears it with the rest of `today`.
//
// Special days add actions that only events can spend: New Year's, a festival day, and the birthday of each Uma you've
// met. They're granted here (`eventActionsOn`) and kept apart (`today.eventActions`); the bar and the calendar show them,
// and her events (a heart event, an occasion scene) spend them before the day's own (`spendForEvent`).
//
// The table prices every action the design lists, the town's and the Umas' among them; `from` says which part of the
// game charges one that isn't played yet. Pure; never stamps.
import { DAYS_PER_YEAR, FESTIVALS, festivalOn, isNewYear, type Festival } from './calendar'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'

/** The farmer's actions a day, to start. */
export const DAY_ACTIONS = 10

/** Every action the design prices. */
export const ACTION_IDS = [
  'clear', 'till', 'plant', 'water', 'harvest', 'water-row',
  'animal', 'buy-animal',
  'forage', 'chop', 'fish',
  'mine', 'stairs',
  'load', 'ship',
  'town', 'shop',
  'introduce', 'talk', 'gift', 'invite', 'hangout', 'event',
  'festival', 'cook', 'companion',
] as const
export type ActionId = typeof ACTION_IDS[number]

/** One row of the cost table: where, what, its cost, and the part of the game that charges it when it isn't played yet
 * (null: played and charged now). */
export interface ActionRule {
  readonly id: ActionId
  readonly where: string
  readonly what: string
  readonly cost: number
  readonly from: string | null
}

const rule = (id: ActionId, where: string, what: string, cost: number, from: string | null = null): ActionRule => ({ id, where, what, cost, from })

/** The design's table, row for row. */
export const ACTIONS: readonly ActionRule[] = [
  rule('clear', 'The fields', 'Clear a tile: weeds, a stone or a stump', 1),
  rule('till', 'The fields', 'Till a tile', 1),
  rule('plant', 'The fields', 'Plant a tile', 1),
  rule('water', 'The fields', 'Water a tile', 1),
  rule('harvest', 'The fields', 'Harvest a tile', 1),
  rule('water-row', 'The fields', 'Water a row, with the aptitude', 1, 'farmhands'),
  rule('animal', 'Animals', 'Feed, brush or care for one; collect eggs, milk or wool; let them out or bring them in', 1, 'the ranch'),
  rule('buy-animal', 'Animals', 'Buy an animal, at the rancher’s in town', 0, 'the ranch'),
  rule('forage', 'The woods and the water', 'Forage once', 1),
  rule('chop', 'The woods and the water', 'Chop a log', 1),
  rule('fish', 'The woods and the water', 'Fish once', 1),
  rule('mine', 'The mine', 'Work a face once', 1, 'the mine'),
  rule('stairs', 'The mine', 'Take the stairs', 0, 'the mine'),
  rule('load', 'Stations', 'Start a load', 1),
  rule('ship', 'The bin', 'Ship what you choose', 1),
  rule('town', 'The town', 'Go into town', 1),
  rule('shop', 'The town', 'Shop, order a build, borrow or repay, once in town', 0),
  rule('introduce', 'The Umas', 'Introduce yourself', 1),
  rule('talk', 'The Umas', 'Talk', 1),
  rule('gift', 'The Umas', 'Give a gift', 1),
  rule('invite', 'The Umas', 'Invite her to work', 1),
  rule('hangout', 'The Umas', 'A hangout or a date', 2),
  rule('event', 'The Umas', 'Her event, when it’s ready, or an occasion scene with her', 1),
  rule('festival', 'A festival', 'Join it; it opens its own events', 3, 'the festivals’ contests'),
  rule('cook', 'The household', 'Cook a meal for the household: breakfast or dinner', 1),
  rule('companion', 'The household', 'Choose tonight’s companion, at the day’s end', 0),
]
const BY_ID = new Map(ACTIONS.map((a) => [a.id, a]))
/** An action's cost. */
export const actionCost = (id: ActionId): number => BY_ID.get(id)!.cost

/** The day's actions: the farmer's budget, to start 10. More come later from the farm's upgrades and the household. */
export const dayActions = (_save: Pick<FarmSave, 'calendar'>): number => DAY_ACTIONS
/** The day's actions left. */
export const actionsLeft = (save: Pick<FarmSave, 'calendar' | 'today'>): number => Math.max(0, dayActions(save) - save.today.actions)

/** Spends `n` of the day's actions: refused (`no-actions`) when fewer are left. Free actions spend nothing. */
export function spendActions<S extends Pick<FarmSave, 'calendar' | 'today'>>(save: S, n: number): S {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`Actions are whole: ${n}`)
  if (n === 0) return save
  if (actionsLeft(save) < n) throw new SaveRuleError('no-actions', n === 1 ? 'No actions left today.' : `That takes ${n} actions.`)
  return { ...save, today: { ...save.today, actions: save.today.actions + n } }
}
/** Spends an action by its id: its cost from the table. */
export const spend = <S extends Pick<FarmSave, 'calendar' | 'today'>>(save: S, id: ActionId): S => spendActions(save, actionCost(id))

// --- Special days: event actions ---------------------------------------------------------------------------------

/** Event actions on New Year's (each year's Spring 1 from the second: year 1's is the farm's first morning), on a
 * festival day, and for each birthday of an Uma you've met. */
export const NEW_YEAR_ACTIONS = 3
export const FESTIVAL_ACTIONS = 3
export const BIRTHDAY_ACTIONS = 1

/** What makes a day special: the year's festivals (the game's five, or the story's) and the met Umas' birthdays as days
 * of the year. */
export interface SpecialDays {
  readonly festivals: readonly Festival[]
  readonly birthdays: ReadonlyMap<string, number>
}

/** Why a day gives event actions, and how many: New Year's, its festival, and each met Uma's birthday. */
export interface EventGrant {
  kind: 'new-year' | 'festival' | 'birthday'
  /** The festival's or the Uma's id; null for New Year's. */
  id: string | null
  actions: number
}

/** A day's event actions, by why: New Year's (from the second year) first, then its festival, then the birthdays of
 * the Umas on the roster (by id). Only events spend them. */
export function eventGrants(save: Pick<FarmSave, 'calendar' | 'roster'>, days: SpecialDays, day = save.calendar.day): EventGrant[] {
  const ofYear = ((day - 1) % DAYS_PER_YEAR) + 1
  const festival = festivalOn(day, days.festivals)
  return [
    ...(isNewYear(day) && day > DAYS_PER_YEAR ? [{ kind: 'new-year' as const, id: null, actions: NEW_YEAR_ACTIONS }] : []),
    ...(festival ? [{ kind: 'festival' as const, id: festival.id, actions: FESTIVAL_ACTIONS }] : []),
    ...Object.keys(save.roster).filter((id) => days.birthdays.get(id) === ofYear).sort((a, b) => Number(a) - Number(b))
      .map((id) => ({ kind: 'birthday' as const, id, actions: BIRTHDAY_ACTIONS })),
  ]
}
/** The special days with the game's festivals and no birthdays: what a rule reads when it isn't told the story's year. */
export const GAME_DAYS: SpecialDays = { festivals: FESTIVALS, birthdays: new Map() }

/** A day's event actions in all (today's, or another `day`'s with today's roster). */
export const eventActionsOn = (save: Pick<FarmSave, 'calendar' | 'roster'>, days: SpecialDays, day = save.calendar.day): number =>
  eventGrants(save, days, day).reduce((n, g) => n + g.actions, 0)
/** The day's event actions left. */
export const eventActionsLeft = (save: Pick<FarmSave, 'calendar' | 'roster' | 'today'>, days: SpecialDays): number =>
  Math.max(0, eventActionsOn(save, days) - save.today.eventActions)

/** Whether an event's `n` actions can be paid today: the event actions left and the day's together. */
export const canSpendForEvent = (save: Pick<FarmSave, 'calendar' | 'roster' | 'today'>, n: number, days: SpecialDays): boolean =>
  actionsLeft(save) + eventActionsLeft(save, days) >= n

/** Spends an event's actions: the day's event actions first, then its own. Refused (`no-actions`) when both together
 * are short. */
export function spendForEvent<S extends Pick<FarmSave, 'calendar' | 'roster' | 'today'>>(save: S, n: number, days: SpecialDays): S {
  const fromEvents = Math.min(n, eventActionsLeft(save, days))
  const spent = { ...save, today: { ...save.today, eventActions: save.today.eventActions + fromEvents } }
  return spendActions(spent, n - fromEvents)
}

// --- Going into town ---------------------------------------------------------------------------------------------

/** Whether you've gone into town today: the town and its shop are open until the night. */
export const inTown = (save: Pick<FarmSave, 'today'>): boolean => save.today.town

/** Goes into town: one action, once a day; the town and its shop stay open for the rest of the day. Going again changes
 * nothing. */
export function goToTown<S extends Pick<FarmSave, 'calendar' | 'today'>>(save: S): S {
  if (save.today.town) return save
  const spent = spend(save, 'town')
  return { ...spent, today: { ...spent.today, town: true } }
}
