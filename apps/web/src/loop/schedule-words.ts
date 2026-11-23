// Where to find her, in short words: her fixed schedule (`scheduleOf`, the story's or the default) as her profile and the
// town show it, and who's in town on a calendar day. Every placement is the schedule's, never a draw. Names are the
// town map's (the pack's, else the game's). Pure, so the screens and the tests read the same.
import { byRelationship } from './relationship-order'
import {
  atHome, awayOn, dateOf, DAYS_PER_SEASON, farmDaysIn, HARBOUR_INN, isFarmhand, nextOut, onFarmToday, placeBuilt, professionCounter, professionOf, professionShift, publicTownPlace, SEASON_NAMES, seasonSchedule, townLocation, townLocations, townDay, weekdayShort, whereOn, whereYouMeet,
  type SaveV4, type SeasonPlace, type StoryPack,
} from '@farm/domain'
import { awayWords } from './expedition-words'
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
export function seasonLines(pack: Pack, id: string, season: Parameters<typeof seasonSchedule>[2], year = 1, clock?: SaveV4['calendar']): SeasonLine[] {
  const groups = seasonSchedule(pack, id, season, year, clock)
  // Home (off the map, or her home on it) is "the other days" when she's anywhere else that season too.
  const rest = (g: SeasonPlace) => (g.at === null || g.by === 'home') && groups.length > 1
  const sorted = [...groups.filter((g) => !rest(g)), ...groups.filter(rest)]
  return sorted.map((g): SeasonLine => {
    const days = rest(g) ? 'the other days' : g.days.length === DAYS_PER_SEASON ? 'every day' : daysWords(g.days)
    const at = g.at === null || g.by === 'home' ? HARBOUR_INN : publicTownPlace(pack, g.at)
    return { at, text: `${placeName(pack, at)}${g.by === 'job' ? ', at work' : ''} · ${days}` }
  })
}

/** A farmhand's season: her farm days first ("On the farm · 2, 3, 5, 6, 8, 9, 11, 12", its `at` `farm`), then her town
 * days by place, as her schedule puts her out ("The Café · 1, 4, 7, 10", "The Bakery, at work · 1–6"). */
export function farmhandLines(pack: Pack, id: string, season: Parameters<typeof seasonSchedule>[2], year = 1, clock?: SaveV4['calendar']): SeasonLine[] {
  const farm = farmDaysIn(pack, id, season, year, clock)
  const town = seasonSchedule(pack, id, season, year, clock).flatMap((g): SeasonLine[] => {
    const days = g.days.filter((d) => !farm.includes(d))
    if (days.length === 0) return []
    const at = g.at === null || g.by === 'home' ? HARBOUR_INN : publicTownPlace(pack, g.at)
    return [{ at, text: `${placeName(pack, at)}${g.by === 'job' ? ', at work' : ''} · ${daysWords(days)}` }]
  })
  return [{ at: 'farm', text: `On the farm · ${farm.length === DAYS_PER_SEASON ? 'every day' : daysWords(farm)}` }, ...town]
}

/** Where to find her, for her profile: today's place in words (and its location, for **Find her ›**), and this season's
 * lines. A farmhand is on the farm on her farm days and in town on the rest; a spouse in her room lives on the farm. */
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
  const date = dateOf(save.calendar.day, save.calendar)
  const season = SEASON_NAMES[date.season]
  const away = awayOn(save, id, save.calendar.day)
  const weekly = professionOf(pack, id)
  if (weekly) {
    const { profession, town, farm } = weekly
    const works = isFarmhand(save, id)
    const shift = professionShift(pack, id, save.calendar.day)
    const here = whereYouMeet(save, pack, id)
    return {
      today: away ? awayWords(away, save.calendar) : shift === 'off' ? (here.at ? `Day off · ${placeName(pack, here.at)}` : 'Day off')
        : here.farm ? 'On the farm' : here.at ? `${placeName(pack, here.at)}${shift === 'town' ? ', at work' : ''}` : 'At home',
      at: here.at,
      farm: here.farm,
      season: 'Each week',
      lines: [
        { at: profession.id === 'expedition-outfitter' && placeBuilt(save, 'expeditions') ? 'expeditions' : professionCounter(profession), text: `${profession.name} · ${town.map(weekdayShort).join(', ')}` },
        { at: works ? 'farm' : null, text: `${works ? 'Farm shifts' : 'Personal days'} · ${farm.map(weekdayShort).join(', ')}` },
        { at: null, text: `Day off · ${weekdayShort(profession.off)}` },
      ],
    }
  }
  if (away) return { today: awayWords(away, save.calendar), at: null, season, lines: [], farm: false }
  if (save.roster[id] && atHome(save, id)) return { today: 'On the farm', at: null, season: 'Every day', lines: [{ at: null, text: 'She lives on the farm' }], farm: true }
  const hand = !!save.roster[id] && isFarmhand(save, id)
  const lines = hand ? farmhandLines(pack, id, date.season, date.year, save.calendar) : seasonLines(pack, id, date.season, date.year, save.calendar)
  if (hand && onFarmToday(save, pack, id)) return { today: 'On the farm', at: null, season, lines, farm: true }
  const at = whereYouMeet(save, pack, id).at
  const next = at ? null : nextOut(pack, id, save.calendar.day, save.calendar)
  const work = at !== null && whereOn(pack, id, save.calendar.day, save.calendar).by === 'job'
  const today = at ? `${placeName(pack, at)}${work ? ', at work' : ''}` : next ? `At home · next out ${shortDate(next.day, save.calendar)}` : 'At home'
  return { today, at, season, lines, farm: false }
}

/** Who's in town on a calendar day, by place: each place with anyone, in the map's order, her Umas by relationship. A day ahead reads the save as it stands (who's on the farm, who's a farmhand). */
export interface TownRow { at: string; name: string; ids: string[] }
export function townRows(save: Pick<SaveV4, 'calendar' | 'roster' | 'love'> & Partial<Pick<SaveV4, 'buildings' | 'expeditions' | 'longGame'>>, pack: Pack, day: number): TownRow[] {
  const town = townDay(save, pack, day)
  return townLocations(pack).flatMap((l): TownRow[] => {
    const here = town.at.get(l.id) ?? []
    if (here.length === 0) return []
    const ids = [...here].sort(byRelationship(save))
    return [{ at: l.id, name: l.name, ids }]
  })
}
