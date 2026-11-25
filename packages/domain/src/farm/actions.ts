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
import { dateDayOf, DAYS_PER_YEAR, FESTIVALS, festivalOn, type Festival } from './calendar'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'

/** The farmer's actions a day, to start. */
export const DAY_ACTIONS = 10

/** Every action the design prices. */
export const ACTION_IDS = [
  'clear', 'till', 'plant', 'water', 'harvest', 'water-row', 'save-seed', 'remove-orchard', 'grass', 'plot',
  'animal', 'buy-animal',
  'forage', 'chop', 'fish',
  'mine', 'stairs',
  'load', 'ship',
  'town', 'shop',
  'introduce', 'talk', 'gift', 'invite', 'hangout', 'event',
  'festival', 'batch', 'kitchen', 'restaurant', 'expedition', 'cook', 'companion', 'forge',
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
  rule('water-row', 'The fields', 'Water a row: a farmhand’s trick, from Watering 6', 1),
  rule('save-seed', 'The fields', 'Save up to four seeds from one grade of produce', 1),
  rule('remove-orchard', 'The fields', 'Remove an orchard plant and leave tilled soil', 1),
  rule('grass', 'The fields', 'Cut grass on a weeds tile, for the silo', 1),
  rule('plot', 'The fields', 'Clear a plot: a new page of the field, from its Farm Rank, for its gold', 1),
  rule('animal', 'Animals', 'Feed one, or care for one; collect a building’s eggs, milk or wool', 1),
  rule('buy-animal', 'Animals', 'Buy an animal or fodder, at the rancher’s in town', 0),
  rule('forage', 'The woods and the water', 'Forage once', 1),
  rule('chop', 'The woods and the water', 'Chop a log', 1),
  rule('fish', 'The woods and the water', 'Fish once', 1),
  rule('mine', 'The mine and the quarry', 'Work a face once', 1),
  rule('stairs', 'The mine and the quarry', 'Take the stairs, once found', 0),
  rule('load', 'Stations', 'Start a load', 1),
  rule('ship', 'The bin', 'Ship what you choose', 1),
  rule('town', 'The town', 'Go into town', 0),
  rule('shop', 'The town', 'Shop, order a build, borrow or repay, once in town', 0),
  rule('introduce', 'The Umas', 'Introduce yourself', 1),
  rule('talk', 'The Umas', 'Talk', 1),
  rule('gift', 'The Umas', 'Give a gift', 1),
  rule('invite', 'The Umas', 'Invite her to work', 1),
  rule('hangout', 'The Umas', 'A hangout or a date', 2),
  rule('event', 'The Umas', 'Her event, when it’s ready, or an occasion scene with her', 1),
  rule('festival', 'A festival', 'Enter on its day at the Festival ground, or at the Kitchen for the Cooking Contest. Event actions go first', 3),
  rule('batch', 'The kitchen', 'Cook a batch: six meals for the pantry from two goods of food, in the farmhouse kitchen, plain or at the stove', 1),
  rule('kitchen', 'The Kitchen', 'Play the Kitchen: its dishes from a menu of recipes, at the stove, once a day', 1),
  rule('restaurant', 'The Restaurant', 'Serve a shift from a stocked menu of dishes, once a day', 1),
  rule('forge', 'The Forge', 'Commission a tool or heirloom', 1),
  rule('expedition', 'The Expedition post', 'Send a party for 2–5 days, with up to eight dishes', 1),
  rule('cook', 'The household', 'Cook a meal for the household: breakfast or dinner (it cooks a batch too)', 1),
  rule('companion', 'The household', 'Choose tonight’s companion, at the day’s end', 0),
]
const BY_ID = new Map(ACTIONS.map((a) => [a.id, a]))
/** An action's cost. */
export const actionCost = (id: ActionId): number => BY_ID.get(id)!.cost

/** The day's actions: the farmer's budget, to start 10. More come later from the farm's upgrades and the household. */
export const dayActions = (_save: Pick<FarmSave, 'calendar'>): number => DAY_ACTIONS
/** The day's actions left. */
export const MORNING_ACTIONS = 5

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

/** Older saves already in the middle of a date finish that date under the old rules. */
export function crewShiftEnabled(save: Pick<FarmSave, 'calendar' | 'today' | 'longGame'>): boolean {
  return save.today.dayParts === true
    || (save.today.actions === 0 && save.longGame?.night?.day !== save.calendar.day)
}

export function prepareDayChange<S extends FarmSave>(before: FarmSave, after: S): S {
  if (before.calendar.day !== after.calendar.day || !crewShiftEnabled(before) || after.today.dayParts) return after
  return { ...after, today: { ...after.today, dayParts: true } }
}

export const morningShiftDue = (save: Pick<FarmSave, 'today'>): boolean =>
  save.today.dayParts === true && save.today.actions >= MORNING_ACTIONS && save.today.crew === undefined

export function passDayPart<S extends FarmSave>(save: S, part: 'afternoon' | 'night'): S {
  const target = part === 'afternoon' ? MORNING_ACTIONS : dayActions(save)
  return spendActions(save, Math.max(0, target - save.today.actions))
}

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
  const date = dateDayOf(day, save.calendar)
  const ofYear = ((date - 1) % DAYS_PER_YEAR) + 1
  const festival = festivalOn(day, days.festivals, save.calendar)
  return [
    ...(ofYear === 1 && date > DAYS_PER_YEAR ? [{ kind: 'new-year' as const, id: null, actions: NEW_YEAR_ACTIONS }] : []),
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
type EventActionSave = Pick<FarmSave, 'calendar' | 'roster' | 'today'>
export type EventFund = 'contest' | 'newYear' | 'festival' | 'social' | `birthday:${string}`

function fundOf(grant: EventGrant, days: SpecialDays): EventFund {
  switch (grant.kind) {
    case 'new-year': return 'newYear'
    case 'birthday': return `birthday:${grant.id!}`
    case 'festival': return days.festivals.find(festival => festival.id === grant.id)?.rule ? 'contest' : 'festival'
  }
}

export function eventBudget(save: EventActionSave, days: SpecialDays) {
  const funding = save.today.eventFunding
  const grants = eventGrants(save, days)
  if (!funding) return [{ fund: 'legacy' as const, left: Math.max(0, grants.reduce((total, grant) => total + grant.actions, 0) - save.today.eventActions) }]
  const budgets = grants.map(grant => {
    const fund = fundOf(grant, days)
    const used = fund === 'contest' || fund === 'newYear' || fund === 'festival' || fund === 'social'
      ? funding[fund] ?? 0
      : Number(funding.birthdays?.includes(fund.slice(9)) ?? false)
    return { fund, left: Math.max(0, grant.actions - used) }
  })
  if (budgets.some(row => row.fund === 'contest')) budgets.push({ fund: 'social', left: Math.max(0, 1 - (funding.social ?? 0)) })
  return budgets
}

/** Total grants for summary displays. Use a fund to quote a specific action. */
export function eventActionsLeft(save: EventActionSave, days: SpecialDays, fund?: EventFund): number {
  return eventBudget(save, days).reduce((sum, row) => sum + (fund === undefined || row.fund === fund || row.fund === 'legacy' ? row.left : 0), 0)
}

function eligibleEventActions(save: EventActionSave, days: SpecialDays, fund?: EventFund): number {
  return save.today.eventFunding && !fund ? 0 : eventActionsLeft(save, days, fund)
}

export const canSpendForEvent = (save: EventActionSave, n: number, days: SpecialDays, fund?: EventFund): boolean =>
  actionsLeft(save) + eligibleEventActions(save, days, fund) >= n

/** Charges a matching grant before regular actions. A day from an older save keeps its shared pool until night. */
export function spendForEvent<S extends EventActionSave>(save: S, n: number, days: SpecialDays, fund?: EventFund): S {
  const used = Math.min(n, eligibleEventActions(save, days, fund))
  const paid = spendActions(save, n - used)
  if (!used) return paid
  const funding = paid.today.eventFunding
  if (!funding) return { ...paid, today: { ...paid.today, eventActions: paid.today.eventActions + used } }
  if (!fund) return paid
  const eventFunding = fund === 'contest' || fund === 'newYear' || fund === 'festival' || fund === 'social'
    ? { ...funding, [fund]: (funding[fund] ?? 0) + used }
    : { ...funding, birthdays: [...funding.birthdays ?? [], fund.slice(9)] }
  return { ...paid, today: { ...paid.today, eventFunding } }
}

// --- Going into town ---------------------------------------------------------------------------------------------

/** Whether you've gone into town today: the town and its shop are open until the night. */
export const inTown = (save: Pick<FarmSave, 'today'>): boolean => save.today.town

/** Arrives in town for the day, free. The flag records the visit and unlocks the town's services. */
export function goToTown<S extends Pick<FarmSave, 'today'>>(save: S): S {
  if (save.today.town) return save
  return { ...save, today: { ...save.today, town: true } }
}
