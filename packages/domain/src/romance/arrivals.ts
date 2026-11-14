// Authored arrivals: the farm's Umas are only the cast, and each walks in when the story says. Nothing is drawn: no
// start picks. Meeting her in town replaces arrivals later.
//
//   day 1      the opening's end (read or skipped): the welcome list's first joins (`joinFirstHelper`, a player's
//              change), so the farm has someone to work; her arrival scene waits at the Gate (`atTheGate`)
//   festival   the morning of that festival's day in its year (year 1 unless named), built or not
//   beds n     the morning the Dorm's level n takes effect
//   event      the morning after another Uma's named event plays (`<characterId>:<eventId>`, or a bare event id: anyone's)
//
// Arrivals are state checked at night step 8 (`arrivalsTonight`, the night's `arriveUmas`, after the Dorm settles): every cast Uma not on the roster whose
// arrival holds joins, in the cast's order, home while a bed is free, else away; a trigger already passed (a later wave's)
// holds the next night. Each joins once: the roster guards it. A cast Uma with no arrival (`arrivesOf`: the pack's is
// optional, and its placeholder is none) other than day 1's helper waits off the farm until meeting her in town lands;
// with no pack, day 1's helper is master data's first. Loaded with the night and the screens.
import { seedTies } from '../farm/bonds'
import { farmDay, FESTIVALS, type FestivalId } from '../farm/calendar'
import { joinRoster } from '../farm/dorm'
import { newLove, type SaveV4 } from '../save/v4'
import type { Arrival } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { arrivesOf, firstHelperOf } from '../story/placeholders'

/** The three kinds of arrival, as the manual lists them. */
export const ARRIVAL_KINDS: readonly { kind: Arrival['kind']; when: string; where: string }[] = [
  { kind: 'festival', when: 'The morning of that festival’s day in its year (year 1 unless the cast names one), built or not', where: 'Night step 8, `arriveUmas`' },
  { kind: 'beds', when: 'The morning the Dorm’s level *n* takes effect (levels 4–8)', where: 'Night step 8, `arriveUmas`' },
  { kind: 'event', when: 'The morning after another Uma’s named event plays (`<characterId>:<eventId>`, or an event id: anyone’s)', where: 'Night step 8, `arriveUmas`' },
]

/** The farm day of a festival in a year (the calendar's dates). */
export function festivalArrivalDay(festival: FestivalId, year = 1): number {
  const f = FESTIVALS.find((x) => x.id === festival)!
  return farmDay({ year, season: f.season, day: f.day })
}

/** Whether an event has played: `<characterId>:<eventId>` in her memories, or a bare event id in anyone's. */
function eventPlayed(save: Pick<SaveV4, 'memories'>, after: string): boolean {
  const at = after.indexOf(':')
  if (at > 0) return save.memories[after.slice(0, at)]?.includes(after.slice(at + 1)) ?? false
  return Object.values(save.memories).some((events) => events.includes(after))
}

/** Whether her arrival holds on this save, as step 8 sees it (after the Dorm settles, the date already turned). */
export function arrivalHolds(save: Pick<SaveV4, 'calendar' | 'dorm' | 'diary' | 'memories'>, arrival: Arrival): boolean {
  switch (arrival.kind) {
    case 'festival': return save.calendar.day >= festivalArrivalDay(arrival.festival, arrival.year ?? 1)
    case 'beds': return save.dorm.level >= arrival.dormLevel
    case 'event': return eventPlayed(save, arrival.after)
  }
}

/** She joins today: `joinRoster` (home while a bed is free, else away on her off-season) and her route at
 * Friendship 0 with 0 points; with the pack's ties, each of her ties whose other Uma is on the farm starts at its seed
 * (`seedTies`). Refused for someone already on the roster. Never stamps. */
export function arrive(save: SaveV4, id: string, pack: Pick<StoryPack, 'ties'> | null = null): { save: SaveV4; home: boolean } {
  const joined = joinRoster(save, id)
  const loved: SaveV4 = { ...joined.save, love: { ...joined.save.love, [id]: newLove() } }
  return { save: pack ? seedTies(loved, pack, id) : loved, home: joined.home }
}

/** Night step 8's arrivals: every cast Uma not on the roster whose arrival holds, in the cast's order, her
 * ties seeded. */
export function arrivalsTonight(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): { save: SaveV4; arrived: { id: string; home: boolean }[] } {
  let next = save
  const arrived: { id: string; home: boolean }[] = []
  for (const entry of pack.cast.umas) {
    const arrival = arrivesOf(pack, entry.characterId)
    if (next.roster[entry.characterId] || !arrival || !arrivalHolds(next, arrival)) continue
    const joined = arrive(next, entry.characterId, pack)
    next = joined.save
    arrived.push({ id: entry.characterId, home: joined.home })
  }
  return { save: next, arrived }
}

/** Day 1's first helper walks in: reading or skipping the opening joins the welcome list's first (`firstHelperOf`), home
 * (day 1 has three beds), her ties seeded, so the farm has someone to work. Nobody else: meeting her in town brings the
 * rest of the welcome list when it lands. Unchanged with nobody to join, or once she's on the roster. */
export function joinFirstHelper(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 {
  const id = firstHelperOf(pack)
  return id === null || save.roster[id] ? save : arrive(save, id, pack).save
}

/** What brings the next arrivals, never who: up to three triggers still waiting, most likely first: the Dorm's next
 * arrival level, the next festivals by date, then events. Empty when everyone is here. */
export function nextArrivals(save: SaveV4, pack: Pick<StoryPack, 'cast'>, max = 3): Arrival[] {
  const waiting = pack.cast.umas.flatMap((u) => {
    const arrival = arrivesOf(pack, u.characterId)
    return !save.roster[u.characterId] && arrival ? [arrival] : []
  })
  const key = (a: Arrival): string => JSON.stringify(a)
  const seen = new Set<string>()
  const unique = waiting.filter((a) => (seen.has(key(a)) ? false : (seen.add(key(a)), true)))
  const when = (a: Arrival): number => a.kind === 'beds' ? a.dormLevel : a.kind === 'festival' ? festivalArrivalDay(a.festival, a.year ?? 1) : 0
  const kinds = ['beds', 'festival', 'event'] as const
  const byKind = kinds.map((k) => unique.filter((a) => a.kind === k).sort((a, b) => when(a) - when(b)))
  const firsts = byKind.flatMap((list) => list.slice(0, 1))
  const rest = byKind.flatMap((list) => list.slice(1))
  return [...firsts, ...rest].slice(0, max)
}
