// The homestead as the screens show it: the
// homestead sheet's rows (a house a row with its rooms, Build or Extend with its price, the next lot, the lots after), her
// room in words, Tonight's companion rows, the morning's house lines and the household's Ready offers. Pure, so the screens
// and the tests read the same. Loaded on demand.
import {
  breakfastTomorrow, companions, companionTonight, extensionCost, FURNITURE, householdOf, householdReady, householdTitle, houseLineOf, HOUSES, isBirthday, isHouseholdId, marriedCount,
  missesYou, nextLot, nightsAway, residentsOf, roomsInAll, roomsOf, waitingForRooms, wantsBirthdayAlone, withFarmer, type Birthdays, type HouseholdId, type SaveV4, type StoryPack,
  type Temperament,
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
/** The next lot: Build · 8,000g (with what's short), or locked until its wedding. */
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
    houses, lot, later: first <= HOUSES ? (first === HOUSES ? `Lot ${HOUSES} · after this one` : `Lots ${first}–${HOUSES} · one a wedding, in turn`) : null,
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
  help: [
    'The Farmhouse is your own home, with two rooms. Each wedding gives her a room: you pick the house; she can move any time, free.',
    'Each wedding opens a house: House 1 with your first, House 2 with your second, and so on. Build it and name it. A house has two rooms, four once extended. Three married open the homestead’s second row.',
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

// --- Tonight's companion ------------------------------------------------------------------------------

/** One of Tonight's companion rows: a spouse with a room, her house, ☕ when her house's breakfast is on tomorrow, "9
 * nights" once her house hasn't seen you for 8 or more, and "just you two" on a birthday-alone wisher's birthday. */
export interface CompanionView {
  id: string
  name: string
  house: number
  /** Her house's name; "Her room · her birthday" on a birthday-alone night. */
  home: string
  breakfast: boolean
  /** "8 nights" once 8 or more. */
  nights: string | null
  /** Her room tonight, hers alone: she wishes her birthday alone with you, and it's today. */
  alone: boolean
  picked: boolean
}
/** Tonight's companion rows, in wedding order; the pick, else the night's default, marked. */
export function companionViews(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, birthdays: Birthdays, nameOf: NameOf): CompanionView[] {
  const now = companionTonight(save)
  return companions(save).map((id): CompanionView => {
    const house = save.love[id]!.house!
    const alone = wantsBirthdayAlone(pack, id) && isBirthday(birthdays, id, save.calendar.day)
    const away = missesYou(save, house) ? nightsAway(save, house) : null
    return {
      id, name: nameOf(id), house, home: alone ? 'Her room · her birthday, just you two' : save.homestead.houses[house]?.name ?? 'Farmhouse',
      breakfast: breakfastTomorrow(save, house), nights: away === null ? null : `${away} nights`, alone, picked: now === id,
    }
  })
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
