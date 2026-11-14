// The town's screen as data: the day's spots with their keepers and their few, the People list's rows (everyone who
// lives in town and the town's people, met or not, with where she is today), its search and its two sorts, and the talk
// sheet's words. Names come through `nameOf` (master data's and the pack's, at run time). Loaded with the town's screen.
import {
  CAST, talkedToday, tieLineOf, townDay, townLineOf, townOf, townsfolk, townTalksOf, withFarmer, type SaveV4, type SpotId, type StoryPack, type TownDay,
  type TownPersonPlayed, type TownSpotPlayed,
} from '@farm/domain'

type NameOf = (id: string) => string

/** One spot today: its name and line, its keeper, and who's out there. */
export interface SpotView {
  spot: TownSpotPlayed
  keeper: TownPersonPlayed | null
  out: readonly string[]
}

/** The day's six spots, in the town's order. */
export function spotViews(day: TownDay, pack: StoryPack): SpotView[] {
  const town = townOf(pack)
  return town.spots.map((spot) => ({ spot, keeper: spot.keeper ? town.byId.get(spot.keeper) ?? null : null, out: day.spots.get(spot.id) ?? [] }))
}

/** "the Café" from "The Café"; a name without an article as it is. */
const inSentence = (name: string): string => name.replace(/^The /, 'the ')

/** Where she is today, in the People list's words. */
export function whereWords(where: { kind: 'spot'; name: string } | { kind: 'keeps'; name: string } | { kind: 'farm' } | { kind: 'home' } | { kind: 'town' }): string {
  switch (where.kind) {
    case 'spot': return `At ${inSentence(where.name)} today`
    case 'keeps': return `At ${inSentence(where.name)}, most days`
    case 'farm': return 'On the farm'
    case 'home': return 'At home'
    case 'town': return 'In town'
  }
}

/** One row of the People list. */
export interface PersonRow {
  id: string
  name: string
  /** Where she is today, in words. */
  where: string
  /** Her spot today, when she's out (or the spot she keeps). */
  spot: SpotId | null
  /** On the farm: you've met her. */
  met: boolean
  /** Days you've talked with her in town. */
  talks: number
  /** Whether you talked with her today. */
  today: boolean
  /** One of the town's people: her role in words; null for anyone else. */
  role: string | null
}

/** Everyone in the People list: everyone who lives in town (the Umas on the farm among them), then the town's people. */
export function peopleRows(save: SaveV4, pack: StoryPack, day: TownDay, nameOf: NameOf): PersonRow[] {
  const town = townOf(pack)
  const spotName = new Map(town.spots.map((s) => [s.id, s.name]))
  const kept = new Map(town.spots.flatMap((s): [string, TownSpotPlayed][] => (s.keeper ? [[s.keeper, s]] : [])))
  const folk = townsfolk(pack).map((id): PersonRow => {
    const spot = day.where.get(id) ?? null
    const met = !!save.roster[id]
    return {
      id, name: nameOf(id), spot, met, talks: townTalksOf(save, id)?.talks ?? 0, today: talkedToday(save, id), role: null,
      where: whereWords(met ? { kind: 'farm' } : spot ? { kind: 'spot', name: spotName.get(spot)! } : { kind: 'home' }),
    }
  })
  const people = town.people.map((p): PersonRow => {
    const keeps = kept.get(p.characterId)
    return {
      id: p.characterId, name: nameOf(p.characterId), spot: keeps?.id ?? null, met: false, talks: 0, today: false, role: p.role ? CAST[p.role].role : p.does,
      where: whereWords(keeps ? { kind: 'keeps', name: keeps.name } : { kind: 'town' }),
    }
  })
  return [...folk, ...people]
}

/** Letters only, lower case, accents off: how the search compares. */
const fold = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** The rows whose name holds the query (any case, accents aside); every row for an empty query. */
export function findPeople(rows: readonly PersonRow[], query: string): PersonRow[] {
  const q = fold(query.trim())
  return q === '' ? [...rows] : rows.filter((r) => fold(r.name).includes(q))
}

/** The People list's sorts: met first (on the farm, then talked most, then by name), or by name. */
export const PEOPLE_SORTS = [{ value: 'met', label: 'Met first' }, { value: 'name', label: 'Name' }] as const
export type PeopleSort = typeof PEOPLE_SORTS[number]['value']
export function sortPeople(rows: readonly PersonRow[], by: PeopleSort): PersonRow[] {
  const byName = (a: PersonRow, b: PersonRow) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  if (by === 'name') return [...rows].sort(byName)
  return [...rows].sort((a, b) => Number(b.met) - Number(a.met) || b.talks - a.talks || Number(!!a.role) - Number(!!b.role) || byName(a, b))
}

/** The talk sheet's words for her today: her line (`{farmer}` filled), her talks after this one, and her tie's line
 * with the spot's keeper when she has one (where it fits: they're both there). */
export interface TalkWords {
  line: string
  talks: string
  tie: { with: string; line: string } | null
}
export function talkWords(save: SaveV4, pack: StoryPack, id: string, keeper: string | null): TalkWords {
  const talks = townTalksOf(save, id)?.talks ?? 0
  const tie = keeper ? tieLineOf(pack, id, keeper) : null
  return {
    line: withFarmer(townLineOf(save, pack, id), save.farmer.name),
    talks: talks === 0 ? 'Your first talk' : `Talked ${talks} ${talks === 1 ? 'day' : 'days'}${talkedToday(save, id) ? ' · today ✓' : ''}`,
    tie: tie && keeper ? { with: keeper, line: tie } : null,
  }
}

/** One of the town's people's ties, as her sheet lists them: who with, and its line. */
export function keeperTies(pack: StoryPack, id: string): { with: string; line: string }[] {
  return pack.ties.ties.filter((t) => t.a === id || t.b === id).map((t) => {
    const other = t.a === id ? t.b : t.a
    return { with: other, line: tieLineOf(pack, id, other) ?? '' }
  })
}

/** The day's town, read once a save and a pack. */
export const townToday = (save: SaveV4, pack: StoryPack): TownDay => townDay(save, pack)
