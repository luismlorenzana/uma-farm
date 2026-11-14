// The homestead as the screens show it (Sleep at): the
// homestead sheet's rows (a house a row with its rooms, Build or Extend with its price, the next lot, the lots after), her
// room in words, Tonight's Sleep at rows, the morning's house lines and the household's Ready offers. Pure, so the screens
// and the tests read the same. Loaded on demand.
import {
  extensionCost, FURNITURE, householdOf, householdReady, householdTitle, houseLineOf, HOUSES, isHouseholdId, marriedCount, nextLot, residentsOf,
  roomsInAll, roomsOf, sleepRows, tonightsHouse, waitingForRooms, withFarmer, type Birthdays, type HouseholdId, type SaveV4, type StoryPack, type Temperament,
} from '@farm/domain'
import { NO_HOME, type HomeWords } from './summary-words'

type NameOf = (id: string) => string
const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

// --- The homestead's sheet ----------------------------------------------------------------------

/** One house on the sheet: its rooms (a resident or a free room), its count, and what it can still take. */
export interface HouseRow {
  n: number
  name: string
  /** Each room: a resident's id, or null for a free room (▢). */
  rooms: (string | null)[]
  /** "2/2", "3/4". */
  count: string
  yours: boolean
  /** Extend · 4,000g, and how much gold is short; null once extended, and for the Farmhouse. */
  extend: { cost: number; short: number } | null
}
/** The next lot: Build · 8,000g (with what's short), or locked until the first wedding. */
export interface LotRow {
  n: number
  cost: number
  open: boolean
  short: number
}
export interface HomesteadView {
  houses: HouseRow[]
  lot: LotRow | null
  /** "Lots 3–6 · built in turn", or null. */
  later: string | null
  /** "Needs a room: Stand-in 2" or "Needs a room: none". */
  needs: string
  rooms: { rooms: number; taken: number }
  married: number
}
export function homesteadView(save: SaveV4, nameOf: NameOf): HomesteadView {
  const houses = save.homestead.houses.map((house, n): HouseRow => {
    const residents = residentsOf(save, n)
    const rooms = Array.from({ length: roomsOf(house) }, (_, i) => residents[i] ?? null)
    const cost = extensionCost(n)
    return {
      n, name: house.name, rooms, count: `${residents.length}/${roomsOf(house)}`, yours: n === 0,
      extend: n === 0 || house.extended ? null : { cost, short: Math.max(0, cost - save.gold) },
    }
  })
  const next = nextLot(save)
  const lot = next ? { ...next, short: Math.max(0, next.cost - save.gold) } : null
  const first = (lot?.n ?? HOUSES + 1) + 1
  const waiting = waitingForRooms(save)
  return {
    houses, lot, later: first <= HOUSES ? (first === HOUSES ? `Lot ${HOUSES} · after this one` : `Lots ${first}–${HOUSES} · built in turn`) : null,
    needs: `Needs a room: ${waiting.length === 0 ? 'none' : waiting.map(nameOf).join(', ')}`,
    rooms: roomsInAll(save), married: marriedCount(save),
  }
}

/** "Build · 8,000g" or "Need 300g more" for a lot or an extension. */
export const priceWords = (verb: 'Build' | 'Extend', cost: number, short: number): string => (short > 0 ? `Need ${gold(short)} more` : `${verb} · ${gold(cost)}`)

/** The sheet's words. */
export const HOMESTEAD_TEXT = {
  title: 'The homestead',
  move: 'Move: tap a face, then a free room.',
  shared: 'Shared houses: +10 bond a night a pair.',
  placeholder: 'Rose Cottage',
  firstWedding: 'Opens with your first wedding.',
  help: [
    'The Farmhouse is your own home, with two rooms. Each wedding gives her a room: you pick the house; she can move any time, free.',
    'Build the next house when it opens, and name it. A house has two rooms, four once extended. House 1 opens with your first wedding.',
    'Each night you sleep in one house; its morning gives each resident +30, her breakfast and her morning items.',
    'Spouses sharing a house grow closer: +10 bond a night for each pair.',
  ],
} as const

/** A piece of furniture's place: the house's name or "Not placed". */
export function furnitureRows(save: SaveV4): { piece: number; name: string; house: number | null; where: string }[] {
  return save.homestead.furniture.map((house, piece) => ({
    piece, name: FURNITURE[piece]!, house, where: house === null ? 'Not placed' : save.homestead.houses[house]?.name ?? 'Not placed',
  }))
}

// --- Tonight's Sleep at ------------------------------------------------------------------------------

export interface SleepView {
  key: string
  house: number
  alone: string | null
  name: string
  residents: string[]
  /** "· 2 home", "· Stand-in 1's room". */
  home: string
  breakfast: boolean
  /** "8 nights" once 8 or more. */
  nights: string | null
  picked: boolean
}
/** Sleep at's rows: the Farmhouse and each house with someone home, ☕ and "8 nights", and her room on her
 * birthday; the pick, else the default, marked. */
export function sleepViews(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, birthdays: Birthdays, nameOf: NameOf): SleepView[] {
  const now = tonightsHouse(save)
  return sleepRows(save, pack, birthdays).map((row) => ({
    key: row.alone ? `room:${row.alone}` : `house:${row.house}`, house: row.house, alone: row.alone,
    name: row.alone ? 'Her room' : row.name,
    residents: row.residents,
    home: row.alone ? `· ${nameOf(row.alone)}, just you two` : row.residents.length === 0 ? '· your own home' : `· ${row.residents.length} home`,
    breakfast: row.breakfast, nights: row.nights === null ? null : `${row.nights} nights`,
    picked: row.house === now.house && row.alone === now.alone,
  }))
}

// --- The morning ------------------------------------------------------------------------------------------

/** The homestead's morning words: a house's name, its house line drawn live (the pack's, "Name: “…”", else her
 * temperament's template) and the household's Ready offers. */
export function homeWords(save: SaveV4, pack: Pick<StoryPack, 'household'>, nameOf: NameOf, temperamentOf: (id: string) => Temperament): HomeWords {
  return {
    houseName: (n) => save.homestead.houses[n]?.name ?? NO_HOME.houseName(n),
    houseLine: (line) => {
      const said = houseLineOf(save.account.uid, save.calendar.day, line.umas, householdOf(pack), temperamentOf, nameOf)
      return said === null ? null : said.authored ? `${nameOf(said.id)}: “${withFarmer(said.text, save.farmer.name)}”` : said.text
    },
    household: householdLines(save),
  }
}

// --- The household's offers -----------------------------------------------------------------------------

/** The household's Ready offers for the morning and the Hearts header: "⌂ Household scene 1 · Ready", the pack's or
 * the game's own. */
export function householdLines(save: SaveV4): { id: HouseholdId; text: string; to: string }[] {
  return householdReady(save).map((id) => ({ id, text: `⌂ ${householdTitle(id)} · Ready`, to: `/?household=${id}` }))
}

/** `?household=<id>` and its replay flag. */
export function parseHouseholdParam(value: string | null): HouseholdId | null {
  return value !== null && isHouseholdId(value) ? value : null
}
