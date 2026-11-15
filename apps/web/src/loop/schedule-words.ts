// Where to find her, in short words: her fixed schedule (`scheduleOf`, the story's or the default) as her profile and the
// town show it, and who's in town on a calendar day. Every placement is the schedule's, never a draw. Names are the
// town map's (the pack's, else the game's). Pure, so the screens and the tests read the same.
import {
  atHome, dateOf, isFarmhand, nextOut, onFarmToday, SEASON_NAMES, seasonSchedule, townLocation, townLocations, townDay, whereOn, whereYouMeet, type SaveV4,
  type SeasonPlace, type StoryPack,
} from '@farm/domain'
import { jobWords } from '../book/board-words'
import { shortDate } from './words'

type Pack = Pick<StoryPack, 'cast' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master'>>

/** A place's name on the map, or "Her place". */
export const placeName = (pack: Pack, at: string): string => townLocation(pack, at)?.name ?? 'Her place'

/** Days of the season in few words: runs of three or more as ranges, "1–6, 9, 11". */
export function daysWords(days: readonly number[]): string {
  const out: string[] = []
  for (let i = 0; i < days.length; i++) {
    let j = i
    while (j + 1 < days.length && days[j + 1] === days[j]! + 1) j++
    out.push(j - i >= 2 ? `${days[i]}–${days[j]}` : days.slice(i, j + 1).join(', '))
    i = j
  }
  return out.join(', ')
}

/** One line of her season: a place and its days, "The Café · 1, 4, 7, 10", her job's "The Bakery, at work · 1–6", and
 * home "At home · the other days" (or "every day"). */
export interface SeasonLine { at: string | null; text: string }
export function seasonLines(pack: Pack, id: string, season: Parameters<typeof seasonSchedule>[2]): SeasonLine[] {
  const groups = seasonSchedule(pack, id, season)
  // Home (off the map, or her home on it) is "the other days" when she's anywhere else that season too.
  const rest = (g: SeasonPlace) => (g.at === null || g.by === 'home') && groups.length > 1
  const sorted = [...groups.filter((g) => !rest(g)), ...groups.filter(rest)]
  return sorted.map((g): SeasonLine => {
    const days = rest(g) ? 'the other days' : g.days.length === 12 ? 'every day' : daysWords(g.days)
    if (g.at === null) return { at: null, text: `At home · ${days}` }
    return { at: g.at, text: `${placeName(pack, g.at)}${g.by === 'job' ? ', at work' : ''} · ${days}` }
  })
}

/** Where to find her, for her profile: today's place in words (and its location, for **Find her ›**), and this season's
 * lines. A farmhand is on the farm by day, after her job; one who lives on the farm is there. */
export interface FindHer {
  today: string
  /** Her place in town today, or null (on the farm, at home). */
  at: string | null
  /** This season's name, and its lines. */
  season: string
  lines: SeasonLine[]
  farm: boolean
}
export function findHer(save: SaveV4, pack: Pack, id: string): FindHer {
  const date = dateOf(save.calendar.day)
  const season = SEASON_NAMES[date.season]
  if (save.roster[id] && atHome(save, id)) return { today: 'On the farm', at: null, season: 'Every day', lines: [{ at: null, text: 'She lives on the farm' }], farm: true }
  if (save.roster[id] && isFarmhand(save, id) && onFarmToday(save, id)) {
    return { today: 'On the farm', at: null, season: 'Every day', lines: [{ at: null, text: `On the farm by day, after her job: ${jobWords(pack, id)}` }], farm: true }
  }
  const at = whereYouMeet(save, pack, id).at
  const next = at ? null : nextOut(pack, id, save.calendar.day)
  const work = at !== null && whereOn(pack, id, save.calendar.day).by === 'job'
  const today = at ? `${placeName(pack, at)}${work ? ', at work' : ''}` : next ? `At home · next out ${shortDate(next.day)}` : 'At home'
  return { today, at, season, lines: seasonLines(pack, id, date.season), farm: false }
}

/** Who's in town on a calendar day, by place: each place with anyone, in the map's order, her Umas in the cast's order
 * (met first). A day ahead reads the save as it stands (who's on the farm, who's a farmhand). */
export interface TownRow { at: string; name: string; ids: string[] }
export function townRows(save: Pick<SaveV4, 'calendar' | 'roster' | 'dorm' | 'love'>, pack: Pack, day: number): TownRow[] {
  const town = townDay(save, pack, day)
  return townLocations(pack).flatMap((l): TownRow[] => {
    const here = town.at.get(l.id) ?? []
    if (here.length === 0) return []
    const ids = [...here.filter((x) => save.roster[x]), ...here.filter((x) => !save.roster[x])]
    return [{ at: l.id, name: l.name, ids }]
  })
}
