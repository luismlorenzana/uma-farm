// The town map as data: its locations in their groups (the six spots, the shops and offices, the story's homes and
// workplaces), who's at each now and who keeps it, the People list's rows (everyone who lives in town and the town's
// people, met or not, with where she is today), its search and its two sorts, a keeper's post and its menu, and her ties.
// Names come through `nameOf` (master data's and the pack's, at run time). Loaded with the town's screen.
import {
  atHome, awayOn, CAST, farmRankOf, placeBuilt, herJobOf, nextOut, onFarmToday, talkedToday, tieLineOf, townLocations, townOf, townsfolk, townTalksOf, type HereBy, type SaveV4, type ShopId, type StoryPack,
  type TownDay, type TownLocationPlayed, type TownPersonPlayed,
} from '@farm/domain'
import { awayWords } from '../loop/expedition-words'
import { shortDate } from '../loop/words'

type NameOf = (id: string) => string

/** One location now: where it is, who's there, and who keeps it. */
export interface LocationView {
  loc: TownLocationPlayed
  here: readonly string[]
  keeper: TownPersonPlayed | null
}

/** Every location of the map, in its order, with who's there now. */
export function locationViews(day: TownDay, pack: StoryPack, save?: SaveV4): LocationView[] {
  const town = townOf(pack)
  const locations = townLocations(pack).filter((loc) => loc.id !== 'expeditions')
  if (save && (farmRankOf(save.farm.points) >= 7 || placeBuilt(save, 'expeditions'))) {
    locations.push({ id: 'expeditions', name: 'Expedition post', line: 'Parties out for days.', group: 'work', keeper: null })
  }
  return locations.map((loc) => ({ loc, here: day.at.get(loc.id) ?? [], keeper: loc.keeper ? town.byId.get(loc.keeper) ?? null : null }))
}

/** The map's groups, each a heading and its locations: the town's spots, its shops and offices, then the story's homes,
 * workplaces and spots (a group shows only when it holds any). */
export interface MapGroup { key: 'spots' | 'shops' | 'homes' | 'work' | 'places'; title: string; places: LocationView[] }
export function mapGroups(views: readonly LocationView[]): MapGroup[] {
  const of = (keys: readonly string[]) => views.filter((v) => keys.includes(v.loc.group))
  return ([
    { key: 'spots', title: 'Around town', places: views.filter((v) => v.loc.group === 'spot' && isGameSpot(v.loc.id)) },
    { key: 'shops', title: 'Shops and offices', places: of(['shop']) },
    { key: 'work', title: 'Workplaces', places: of(['work']) },
    { key: 'homes', title: 'Homes', places: of(['home']) },
    { key: 'places', title: 'Elsewhere', places: views.filter((v) => v.loc.group === 'spot' && !isGameSpot(v.loc.id)) },
  ] satisfies MapGroup[]).filter((g) => g.places.length > 0)
}
const GAME_SPOTS = new Set(['plaza', 'market', 'cafe', 'harbour', 'library', 'track'])
const isGameSpot = (id: string): boolean => GAME_SPOTS.has(id)

/** "the Café" from "The Café"; a name without an article as it is. */
const inSentence = (name: string): string => name.replace(/^The /, 'the ')

/** Why she's where she is, in a few words under her name: at work (her job's words when the story gives them), at home,
 * or nothing (her routine's stop, or her default schedule's day at her spot: she's simply there). */
export function hereWords(pack: StoryPack, id: string, by: HereBy | undefined): string | null {
  if (by === 'job') return herJobOf(pack, id)?.what ?? 'At work'
  if (by === 'home') return 'At home'
  return null
}

/** One row of the People list. */
export interface PersonRow {
  id: string
  name: string
  /** Where she is today, in words. */
  where: string
  /** Her location today, when she's out (or the location she keeps). */
  at: string | null
  /** You've met her: she's on the farm, or lives in town. */
  met: boolean
  /** She lives on the farm. */
  farm: boolean
  /** Days you've talked with her. */
  talks: number
  /** Whether you talked with her today. */
  today: boolean
  /** One of the town's people: her role in words; null for anyone else. */
  role: string | null
}

/** Everyone in the People list: everyone who lives in town (the Umas on the farm among them), then the town's people. */
export function peopleRows(save: SaveV4, pack: StoryPack, day: TownDay, nameOf: NameOf): PersonRow[] {
  const town = townOf(pack)
  const locations = townLocations(pack)
  const named = new Map(locations.map((l) => [l.id, l.name]))
  const post = new Map(locations.flatMap((l): [string, string][] => (l.keeper ? [[l.keeper, l.id]] : [])))
  const folk = townsfolk(pack).map((id): PersonRow => {
    const at = day.where.get(id) ?? null
    const met = !!save.roster[id]
    // On the farm that day: she lives there (a spouse in her room), or it's her farm day (a farmhand).
    const farm = met && onFarmToday(save, pack, id, day.day)
    const next = farm || at ? null : nextOut(pack, id, day.day)
    const away = awayOn(save, id, day.day)
    const where = away ? awayWords(away) : farm ? (atHome(save, id) ? 'On the farm' : 'On the farm today')
      : at ? `At ${inSentence(named.get(at)!)}${day.by.get(id) === 'job' ? ', at work' : ''} today` : next ? `At home · out ${shortDate(next.day)}` : 'At home'
    return { id, name: nameOf(id), at, met, farm, talks: townTalksOf(save, id)?.talks ?? 0, today: talkedToday(save, id), role: null, where }
  })
  const people = town.people.map((p): PersonRow => {
    const at = post.get(p.characterId) ?? null
    return {
      id: p.characterId, name: nameOf(p.characterId), at, met: false, farm: false, talks: 0, today: false, role: p.role ? CAST[p.role].role : p.does,
      where: at ? `At ${inSentence(named.get(at)!)}, most days` : 'In town',
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

/** The People list's sorts: met first (on the farm or in town), then talked most, then by name; or by name. */
export const PEOPLE_SORTS = [{ value: 'met', label: 'Met first' }, { value: 'name', label: 'Name' }] as const
export type PeopleSort = typeof PEOPLE_SORTS[number]['value']
export function sortPeople(rows: readonly PersonRow[], by: PeopleSort): PersonRow[] {
  const byName = (a: PersonRow, b: PersonRow) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  if (by === 'name') return [...rows].sort(byName)
  return [...rows].sort((a, b) => Number(b.met) - Number(a.met) || b.talks - a.talks || Number(!!a.role) - Number(!!b.role) || byName(a, b))
}

/** A post's menu: what its keeper offers. The general store sells seeds (the shop); the mayor's office takes build
 * orders and lends toward them (its sheet, `mayor`); the rancher sells animals and fodder (her sheet, `rancher`). */
export interface PostItem { key: string; label: string; to: string | null; why: string | null }
export function postMenu(shop: ShopId): PostItem[] {
  switch (shop) {
    case 'store': return [{ key: 'seeds', label: 'Buy seeds', to: 'shop', why: null }]
    case 'mayor': return [
      { key: 'build', label: 'Order a build', to: 'mayor', why: null },
      { key: 'loan', label: 'Borrow or repay', to: 'mayor', why: null },
    ]
    case 'rancher': return [
      { key: 'animal', label: 'Buy an animal', to: 'rancher', why: null },
      { key: 'fodder', label: 'Buy fodder', to: 'rancher', why: null },
    ]
    case 'smith': return []
  }
}

/** One of the town's people's ties, as her sheet lists them: who with, and its line. */
export function keeperTies(pack: StoryPack, id: string): { with: string; line: string }[] {
  return pack.ties.ties.filter((t) => t.a === id || t.b === id).map((t) => {
    const other = t.a === id ? t.b : t.a
    return { with: other, line: tieLineOf(pack, id, other) ?? '' }
  })
}
