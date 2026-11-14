// The homestead: the Farmhouse and six houses you build, name
// and extend; each spouse's room; who sleeps where tonight. **Who lives where is one source, `love.house`**.
//
//                 rooms         costs                       opens
//   the Farmhouse 2             —                           day 1 (the farmer's own home)
//   House 1       2, 4 extended 8,000g · extension 4,000g   the first wedding
//   House 2–6     2 / 4         20,000 · 10,000 … 160,000 · 80,000   the n-th wedding, the house before it built
//   all           26 rooms      408,000g, 612,000g extended
//
// The homestead grows with your life with the Umas: house *n* opens with the *n*-th wedding, and its rows on the map
// open with the married: the first (the Farmhouse, Houses 1–2) from day 1, the second (Houses 3–5) with three married,
// the third (House 6) with six.
//
// A house stands at once and is named there (1–20 characters, the farmer's letters rule); an extension adds two rooms at
// once. At her wedding a spouse takes a free room (her closest friend's house when it has room, else the first with room,
// the Farmhouse first; an own-house wisher an empty house first); with none free she keeps her Dorm bed ("Needs a room") and
// moves in the morning after a house is built. Moves are at once and free: a spouse to a free room, or two spouses
// swapped. A spouse in her house has no Dorm bed but is on the farm (`onFarm`). Never a gate: a wedding never waits for a
// room. Pure; never stamps. Loaded with the night and the romance's screens.
import { closestFriend } from '../farm/bonds'
import { TOWN_FIRST_ROW, type PlaceOpens } from '../farm/places'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { marriedCount, residentsOf, roomsOf, type SaveV4 } from '../save/v4'
import { type StoryPack } from '../story/pack'
import { wishesOf } from '../story/placeholders'
import { isBirthday, type Birthdays } from './days'
import { cleanFarmerName, houseNameIssue } from './farmer'
import { hasPerk } from './perk-terms'

// --- The houses -------------------------------------------------------------------------------

/** House 1–6's prices, in gold. */
export const HOUSE_COSTS: readonly number[] = [8_000, 20_000, 40_000, 70_000, 110_000, 160_000]
/** An extension costs half its house: 4,000g … 80,000g. */
export const EXTENSION_COSTS: readonly number[] = HOUSE_COSTS.map((cost) => cost / 2)
/** The houses you build: six, after the Farmhouse. */
export const HOUSES = HOUSE_COSTS.length

/** A house's number on the homestead: 0 the Farmhouse, 1–6 the houses. */
export const houseCost = (n: number): number => HOUSE_COSTS[n - 1] ?? 0
export const extensionCost = (n: number): number => EXTENSION_COSTS[n - 1] ?? 0

/** The next lot: its house's number, its price and whether it may be built now (house *n* from the *n*-th wedding, the
 * one before it standing, which it does by the time it's next); null once all six stand. */
export interface Lot {
  n: number
  cost: number
  open: boolean
}
export function nextLot(save: Pick<SaveV4, 'homestead' | 'love'>): Lot | null {
  const n = save.homestead.houses.length
  if (n > HOUSES) return null
  return { n, cost: houseCost(n), open: marriedCount(save) >= n }
}

const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
/** "Opens with your first wedding.", "… your third wedding.": what house *n* waits for. */
export const houseOpensWords = (n: number): string => `Opens with your ${ORDINALS[n] ?? `${n}th`} wedding.`

/** Builds and names the next house: it stands at once, two rooms, its name the letters rule's (1–20). Refused
 * before its wedding (`locked`), once all six stand (`bad-job`), for a name outside the rule or another house's
 * (`bad-job`), and when gold is short (`no-gold`). */
export function buildHouse(save: SaveV4, raw: string): SaveV4 {
  const lot = nextLot(save)
  if (!lot) throw new SaveRuleError('bad-job', 'Every lot has its house.')
  if (!lot.open) throw new SaveRuleError('locked', houseOpensWords(lot.n))
  const issue = houseNameIssue(raw)
  if (issue) throw new SaveRuleError('bad-job', issue)
  const name = cleanFarmerName(raw)
  if (save.homestead.houses.some((h) => h.name.toLowerCase() === name.toLowerCase())) throw new SaveRuleError('bad-job', 'Another house has that name.')
  const paid = spendGold(save, lot.cost)
  const h = paid.homestead
  return { ...paid, homestead: { ...h, houses: [...h.houses, { name, extended: false }], slept: [...h.slept, 0] } }
}

/** Extends a house: two more rooms at once, for half its price. Refused for the Farmhouse and a house not built
 * (`bad-job`), once extended (`bad-job`), and when gold is short (`no-gold`). */
export function extendHouse(save: SaveV4, n: number): SaveV4 {
  const house = save.homestead.houses[n]
  if (n < 1 || !house) throw new SaveRuleError('bad-job', 'The Farmhouse keeps its two rooms.')
  if (house.extended) throw new SaveRuleError('bad-job', 'It’s extended already.')
  const paid = spendGold(save, extensionCost(n))
  const houses = paid.homestead.houses.map((h, i) => (i === n ? { ...h, extended: true } : h))
  return { ...paid, homestead: { ...paid.homestead, houses } }
}

/** A house's free rooms. */
export const freeRooms = (save: Pick<SaveV4, 'homestead' | 'love'>, house: number): number => {
  const h = save.homestead.houses[house]
  return h ? roomsOf(h) - residentsOf(save, house).length : 0
}
/** Every room on the homestead, and how many are taken. */
export function roomsInAll(save: Pick<SaveV4, 'homestead' | 'love'>): { rooms: number; taken: number } {
  const rooms = save.homestead.houses.reduce((n, h) => n + roomsOf(h), 0)
  return { rooms, taken: Object.values(save.love).filter((l) => l.house !== undefined).length }
}

// --- On the map (the farm map, grown) ---------------------------------------------------------------------

/** A homestead place on the map: the Farmhouse (0) or a house's lot (1–6). */
export interface HomesteadPlace {
  id: string
  n: number
  /** Its default name (a built house shows the one you gave it). */
  name: string
  /** Its row and column among the homestead's rows: the Farmhouse, House 1 and House 2; Houses 3–5; House 6. */
  row: number
  col: number
  /** uma-art 2.26.0's buildings: the Farmhouse's own, and one cottage for every lot. */
  frame: 'farmhouse' | 'homestead-house'
  opens: PlaceOpens
}
/** The homestead's rows start after the yard (rows 6 and 7), so the town edge stays the map's last row. */
export const HOMESTEAD_FIRST_ROW = TOWN_FIRST_ROW
export const HOMESTEAD_PLACES: readonly HomesteadPlace[] = Array.from({ length: HOUSES + 1 }, (_, n): HomesteadPlace => ({
  id: n === 0 ? 'farmhouse' : `house-${n}`, n, name: n === 0 ? 'Farmhouse' : `House ${n}`,
  row: HOMESTEAD_FIRST_ROW + Math.floor(n / 3), col: n % 3, frame: n === 0 ? 'farmhouse' : 'homestead-house',
  opens: n === 0 ? { by: 'start' } : { by: 'house', n },
}))
/** The married each homestead row waits for: the first (the Farmhouse, Houses 1–2) none, the second (Houses 3–5)
 * three, the third (House 6) six. */
export const HOMESTEAD_ROW_MARRIED: readonly number[] = [0, 3, 6]
/** Whether a homestead row (1–3) is open: enough married. */
export const homesteadRowOpen = (save: Pick<SaveV4, 'love'>, row: number): boolean => marriedCount(save) >= (HOMESTEAD_ROW_MARRIED[row - 1] ?? Infinity)
/** The homestead's places the map shows: every place in an open row (built or a lot), and every house built; so the
 * map grows a row at a time. */
export const homesteadShown = (save: Pick<SaveV4, 'homestead' | 'love'>): HomesteadPlace[] =>
  HOMESTEAD_PLACES.filter((p) => p.n < save.homestead.houses.length || homesteadRowOpen(save, Math.floor(p.n / 3) + 1))
/** The homestead's rows on the map now: one to three. */
export const homesteadRows = (save: Pick<SaveV4, 'homestead' | 'love'>): number => Math.ceil(homesteadShown(save).length / 3)

// --- Rooms -------------------------------------------------------------------------------------

/** What the room rules read of the pack: her wishes (bibles) and her closest friend (ties). */
export type RoomPack = Pick<StoryPack, 'bibles' | 'ties'>

/** She wishes for a house to herself. */
export const wantsOwnHouse = (pack: Pick<StoryPack, 'bibles'>, id: string): boolean => wishesOf(pack, id).includes('own-house')
/** She wishes to spend her birthday alone with you. */
export const wantsBirthdayAlone = (pack: Pick<StoryPack, 'bibles'>, id: string): boolean => wishesOf(pack, id).includes('birthday-alone')

/** A house an own-house wisher has to herself, which other spouses' defaults pass over while another has room. */
const kept = (save: Pick<SaveV4, 'love'>, pack: Pick<StoryPack, 'bibles'>, house: number): boolean =>
  residentsOf(save, house).some((r) => wantsOwnHouse(pack, r))

/**
 * Her default room: among the houses with a free room (not hers), an own-house wisher's first empty one;
 * else the house where her closest friend lives (by closeness) when it has room; else the first with room, the
 * Farmhouse first. Both pass over a house an own-house wisher lives in while another has room. Null with no room free.
 */
export function roomFor(save: Pick<SaveV4, 'homestead' | 'love' | 'bonds'>, pack: RoomPack, id: string): number | null {
  const free = save.homestead.houses.map((_, i) => i).filter((i) => i !== save.love[id]?.house && freeRooms(save, i) > 0)
  if (free.length === 0) return null
  if (wantsOwnHouse(pack, id)) {
    const empty = free.find((i) => residentsOf(save, i).length === 0)
    if (empty !== undefined) return empty
  }
  const open = free.filter((i) => !kept(save, pack, i))
  const friend = closestFriend(pack, save, id)
  const theirs = friend === null ? undefined : save.love[friend]?.house
  if (theirs !== undefined && open.includes(theirs)) return theirs
  return open[0] ?? free[0]!
}

/** Why a spouse can't move now, or null: she must be a spouse, and one leaving or arriving tomorrow by a swap
 * waits for the morning. */
function moveBlock(save: SaveV4, id: string): string | null {
  if (save.love[id]?.stage !== 'spouse' || !save.roster[id]) return 'Only a spouse has a room.'
  if (save.dorm.swaps.some((s) => s.out === id)) return 'She leaves tomorrow.'
  if (save.dorm.swaps.some((s) => s.in === id)) return 'She arrives tomorrow.'
  return null
}

/** Her room tonight is hers only while she's in tonight's house: a move clears it. */
const keepAlone = (homestead: SaveV4['homestead'], moved: readonly string[]): SaveV4['homestead'] =>
  homestead.alone !== null && moved.includes(homestead.alone) ? { ...homestead, alone: null } : homestead

/** Moves a spouse to a free room in another house, at once and free; from her Dorm bed, she leaves the Dorm and
 * frees it. Refused for someone not a spouse, a swap waiting, her own house, a house not built or one with no room free. */
export function moveSpouse(save: SaveV4, id: string, house: number): SaveV4 {
  const block = moveBlock(save, id)
  if (block) throw new SaveRuleError('locked', block)
  if (!save.homestead.houses[house]) throw new SaveRuleError('bad-job', 'That house isn’t built.')
  if (save.love[id]!.house === house) throw new SaveRuleError('bad-job', 'She lives there already.')
  if (freeRooms(save, house) <= 0) throw new SaveRuleError('busy', 'No room free there.')
  const home = save.dorm.home.filter((x) => x !== id)
  return {
    ...save,
    love: { ...save.love, [id]: { ...save.love[id]!, house } },
    dorm: home.length === save.dorm.home.length ? save.dorm : { ...save.dorm, home },
    homestead: keepAlone(save.homestead, [id]),
  }
}

/** Two spouses in two houses trade rooms, at once and free. */
export function swapRooms(save: SaveV4, a: string, b: string): SaveV4 {
  for (const id of [a, b]) {
    const block = moveBlock(save, id)
    if (block) throw new SaveRuleError('locked', block)
  }
  const [x, y] = [save.love[a]!.house, save.love[b]!.house]
  if (x === undefined || y === undefined) throw new SaveRuleError('bad-job', 'Both need a room to swap.')
  if (x === y) throw new SaveRuleError('bad-job', 'They share a house already.')
  return {
    ...save,
    love: { ...save.love, [a]: { ...save.love[a]!, house: y }, [b]: { ...save.love[b]!, house: x } },
    homestead: keepAlone(save.homestead, [a, b]),
  }
}

/** Her room at her wedding (the wedding's step): her default room, at once; with none free (or a swap
 * waiting) she keeps her Dorm bed. The house she took, or null. */
export function takeRoom(save: SaveV4, pack: RoomPack, id: string): { save: SaveV4; house: number | null } {
  const house = roomFor(save, pack, id)
  if (house === null || moveBlock(save, id) !== null) return { save, house: null }
  return { save: moveSpouse(save, id, house), house }
}

/** A spouse in the Dorm waiting for a room: "Needs a room". */
export const needsRoom = (save: Pick<SaveV4, 'love'>, id: string): boolean => save.love[id]?.stage === 'spouse' && save.love[id]?.house === undefined

/** The spouses waiting for a room, in wedding order (her wedding's day, then her id). */
export function waitingForRooms(save: Pick<SaveV4, 'love' | 'roster'>): string[] {
  return Object.keys(save.love).filter((id) => save.roster[id] && needsRoom(save, id))
    .sort((a, b) => (save.love[a]!.wed ?? 0) - (save.love[b]!.wed ?? 0) || Number(a) - Number(b))
}

/** Night step 9: spouses home in the Dorm who wait for a room take one, in wedding order, by the same
 * default, once a house stands. An away spouse waits until she's swapped home. Who moved, and where. */
export function moveInWaiting(save: SaveV4, pack: RoomPack): { save: SaveV4; moved: { id: string; house: number }[] } {
  let next = save
  const moved: { id: string; house: number }[] = []
  for (const id of waitingForRooms(save)) {
    if (!next.dorm.home.includes(id)) continue
    const took = takeRoom(next, pack, id)
    if (took.house === null) continue
    next = took.save
    moved.push({ id, house: took.house })
  }
  return { save: next, moved }
}

/** Her room in words: her house's name, "Needs a room", and softly, for an own-house wisher sharing or
 * waiting, "She'd love her own house". Null before she's a spouse. */
export interface HomeWords {
  house: number | null
  name: string | null
  needs: boolean
  wish: boolean
}
export function homeOf(save: Pick<SaveV4, 'love' | 'homestead'>, pack: Pick<StoryPack, 'bibles'>, id: string): HomeWords | null {
  const love = save.love[id]
  if (love?.stage !== 'spouse') return null
  const house = love.house ?? null
  const alone = house !== null && residentsOf(save, house).length === 1
  return {
    house, name: house === null ? null : save.homestead.houses[house]?.name ?? null,
    needs: house === null, wish: wantsOwnHouse(pack, id) && !alone,
  }
}
export const NEEDS_ROOM = 'Needs a room'
export const OWN_HOUSE_WISH = 'She’d love her own house'

// --- Sleep at ----------------------------------------------------------------------------

/** A house you haven't slept in for this many nights misses you. */
export const MISSES_NIGHTS = 8

/** Nights since you last slept in a house, or null when you never have. */
export const nightsAway = (save: Pick<SaveV4, 'homestead' | 'calendar'>, house: number): number | null => {
  const last = save.homestead.slept[house] ?? 0
  return last > 0 ? save.calendar.day - last : null
}
/** A house with residents you haven't slept in for 8 nights or more. */
export const missesYou = (save: Pick<SaveV4, 'homestead' | 'calendar' | 'love'>, house: number): boolean =>
  residentsOf(save, house).length > 0 && (nightsAway(save, house) ?? 0) >= MISSES_NIGHTS

/** The houses Sleep at offers: the Farmhouse (your own home) and every house with someone in it. */
export const sleepHouses = (save: Pick<SaveV4, 'homestead' | 'love'>): number[] =>
  save.homestead.houses.map((_, i) => i).filter((i) => i === 0 || residentsOf(save, i).length > 0)

/** Tonight's default: among the houses with residents, the one slept in least lately (never first), ties the
 * lower number; the Farmhouse when no one has a room. */
export function defaultHouse(save: Pick<SaveV4, 'homestead' | 'love'>): number {
  const lived = save.homestead.houses.map((_, i) => i).filter((i) => residentsOf(save, i).length > 0)
  return lived.sort((a, b) => (save.homestead.slept[a] ?? 0) - (save.homestead.slept[b] ?? 0) || a - b)[0] ?? 0
}

/** Tonight's house and whose room, as the night will take it: the pick, else the default. */
export const tonightsHouse = (save: Pick<SaveV4, 'homestead' | 'love'>): { house: number; alone: string | null } =>
  save.homestead.tonight === null ? { house: defaultHouse(save), alone: null } : { house: save.homestead.tonight, alone: save.homestead.alone }

/** Whether her breakfast is on tomorrow in a house: a resident at S1 or more, and someone on the farm whose
 * meal ends tonight, with no reception feeding everyone. */
export function breakfastTomorrow(save: Pick<SaveV4, 'homestead' | 'love' | 'roster' | 'dorm' | 'today'>, house: number): boolean {
  if (save.today.reception > 0 || !residentsOf(save, house).some((r) => hasPerk(save.love[r], 's1'))) return false
  return Object.keys(save.roster).some((id) => (save.dorm.home.includes(id) || save.love[id]?.house !== undefined) && save.roster[id]!.wellFed <= 1)
}

/** One of Sleep at's rows: a house, its residents, ☕ for tomorrow's breakfast and the nights since you slept
 * there once that's 8 or more; or "Her room" on a birthday-alone wisher's birthday. */
export interface SleepRow {
  house: number
  name: string
  residents: string[]
  breakfast: boolean
  /** Nights away, once 8 or more ("8 nights"); null otherwise. */
  nights: number | null
  /** "Her room": a birthday-alone wisher on her birthday, her house hers alone tonight. */
  alone: string | null
}
export function sleepRows(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, birthdays: Birthdays): SleepRow[] {
  const houses = sleepHouses(save).map((house): SleepRow => {
    const away = nightsAway(save, house)
    return {
      house, name: save.homestead.houses[house]!.name, residents: residentsOf(save, house), breakfast: breakfastTomorrow(save, house),
      nights: missesYou(save, house) ? away : null, alone: null,
    }
  })
  const rooms = Object.keys(save.love).filter((id) => save.love[id]!.house !== undefined && wantsBirthdayAlone(pack, id) && isBirthday(birthdays, id, save.calendar.day))
    .sort((a, b) => Number(a) - Number(b))
    .map((id): SleepRow => {
      const house = save.love[id]!.house!
      return { house, name: save.homestead.houses[house]!.name, residents: [id], breakfast: hasPerk(save.love[id], 's1') && breakfastTomorrow(save, house), nights: null, alone: id }
    })
  return [...houses, ...rooms]
}

/** Sleep at: tonight's house, or her room on her birthday; a player's change. Refused for a house not built,
 * and for her room on any other night or for someone not in that house. */
export function sleepAt(save: SaveV4, house: number, alone: string | null = null, birthdays: Birthdays | null = null): SaveV4 {
  if (!save.homestead.houses[house]) throw new SaveRuleError('bad-job', 'That house isn’t built.')
  if (alone !== null && (save.love[alone]?.house !== house || (birthdays !== null && !isBirthday(birthdays, alone, save.calendar.day)))) {
    throw new SaveRuleError('bad-job', 'Her room is hers on her birthday.')
  }
  if (save.homestead.tonight === house && save.homestead.alone === alone) return save
  return { ...save, homestead: { ...save.homestead, tonight: house, alone } }
}

// --- The furniture set -------------------------------------------------------------------------------

/** The furniture set at 5 married: five pieces with original names, placed one a house as words; the decorations
 * draw them. */
export const FURNITURE: readonly string[] = ['Patchwork Armchair', 'Pine Bookcase', 'Copper Kettle Stand', 'Window-Seat Cushions', 'Braided Hearth Rug']

/** Places a piece in a house, or takes it out (null): one piece a house. Refused before the set comes, for an unknown
 * piece or house, and for a house that has a piece already. */
export function placeFurniture(save: SaveV4, piece: number, house: number | null): SaveV4 {
  const set = save.homestead.furniture
  if (set.length === 0) throw new SaveRuleError('locked', 'The furniture comes at 5 married.')
  if (piece < 0 || piece >= set.length) throw new SaveRuleError('bad-job', 'No such piece.')
  if (house !== null) {
    if (!save.homestead.houses[house]) throw new SaveRuleError('bad-job', 'That house isn’t built.')
    if (set.some((at, i) => at === house && i !== piece)) throw new SaveRuleError('busy', 'That house has a piece already.')
  }
  if (set[piece] === house) return save
  return { ...save, homestead: { ...save.homestead, furniture: set.map((at, i) => (i === piece ? house : at)) } }
}
