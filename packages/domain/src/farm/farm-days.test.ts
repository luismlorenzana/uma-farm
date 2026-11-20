// Farm days (F95): a farmhand comes to the farm on the days her town schedule leaves free, and is in town on the rest.
// On a farm day she's in front of you on the farm (off the town's map), works overnight and eats her two meals there; on
// a town day she's at her place in town, and doesn't work, eat on the farm or cost anything. A spouse in her room is on
// the farm every day; one waiting for a room lives in town. Where she is never gates an occasion. On the invented
// stand-in (each on the default schedule: 9000001 out on days 1, 4, 7 and 10 of a season, 9000002 on 2, 5, 8 and 11) and
// its invented occasion scenes; no original-game content.
import { describe, expect, it } from 'vitest'
import { FESTIVALS, farmDay, type Season } from './calendar'
import { upkeepOf } from './economy'
import { handsTonight, handsWorking, setTasks } from './farmhands'
import { eatTonight, mealsNeeded } from './food'
import { talentsD } from './talents'
import { runNight } from '../night/end-day'
import { birthdaysOf } from '../romance/days'
import { joinCast } from '../romance/meeting.fixture'
import { occasionPlayed, occasionsOn, playOccasion } from '../romance/occasions'
import { parseSaveV6 } from '../save/parse-v4'
import { newLove, newSave, type SaveV4 } from '../save/v4'
import { withOccasions } from '../story/occasions.fixture'
import { storyPackFrom } from '../story/pack'
import { readScene } from '../story/scenes'
import { farmDayOn, farmDaysIn, nextFarmDay, onFarmToday, townDay, whereYouMeet, worksOn } from '../town/town'

const AT = '2026-11-17T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const PACK = storyPackFrom(withOccasions())
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const on = (season: Season, day: number, year = 1) => farmDay({ year, season, day })

/** A named farm on `day`, the stand-in's three met, 9000001 and 9000002 farmhands since Spring 1, each foraging the woods. */
function farm(day: number): SaveV4 {
  const fresh = { ...newSave('u-farm-days', AT), farmer: { name: 'Robin' }, calendar: { day: 1 }, gold: 5000 }
  const met = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  const hired = [ONE, TWO].reduce((s, id) => setTasks({ ...s, roster: { ...s.roster, [id]: { ...s.roster[id]!, farmhand: 1 } } }, id, [{ kind: 'forage', area: 'woods' }]), met)
  return { ...hired, calendar: { day }, love: { ...hired.love, [ONE]: { ...hired.love[ONE]!, level: 3 }, [TWO]: { ...hired.love[TWO]!, level: 3 } } }
}

describe('her farm days', () => {
  it('are the days her town schedule leaves free: 20 of each season’s 30 on the default schedule', () => {
    expect(farmDaysIn(PACK, ONE, 'spring')).toEqual([2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30])
    expect(farmDaysIn(PACK, TWO, 'winter')).toEqual([1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30])
    expect(nextFarmDay(PACK, ONE, on('spring', 3))).toBe(on('spring', 5))
  })

  it('on a farm day she\'s on the farm: in front of you without going into town, off the town\'s map, and she works and eats', () => {
    const save = farm(on('spring', 3))
    expect(farmDayOn(PACK, ONE, save.calendar.day)).toBe(true)
    expect(onFarmToday(save, PACK, ONE)).toBe(true)
    expect(whereYouMeet(save, PACK, ONE)).toEqual({ here: true, farm: true, at: null })
    expect(townDay(save, PACK).where.has(ONE)).toBe(false)
    // Both are on their farm day (Spring 3): both work tonight, and both eat with the farmer: three mouths, six meals.
    expect(handsWorking(save, PACK)).toEqual([ONE, TWO])
    expect(handsTonight(save, save, talentsD, PACK).lines.map((l) => [l.id, l.spent])).toEqual([[ONE, 3], [TWO, 3]])
    expect(mealsNeeded(save, PACK)).toBe(6)
    const morning = runNight(save, { story: PACK })
    expect(morning.summary!.work.filter((w) => w.kind === 'farmhand').map((w) => w.kind === 'farmhand' && w.id)).toEqual([ONE, TWO])
    expect(morning.summary!.money).toContainEqual({ kind: 'takeout', meals: 6, paid: 90, due: 90 })
    expect(parseSaveV6(json(morning))).toEqual(morning)
  })

  it('on a town day she\'s at her place in town, and doesn\'t work or eat on the farm, or cost anything', () => {
    // Spring 4: 9000001's town day (her favourite spot), 9000002's farm day.
    const save = farm(on('spring', 4))
    expect(farmDayOn(PACK, ONE, save.calendar.day)).toBe(false)
    expect(onFarmToday(save, PACK, ONE)).toBe(false)
    const spot = townDay(save, PACK).where.get(ONE)
    expect(spot).toBeTruthy()
    expect(whereYouMeet(save, PACK, ONE)).toEqual({ here: false, farm: false, at: spot })
    expect(worksOn(save, PACK, ONE)).toBe(false)
    expect(handsTonight(save, save, talentsD, PACK).lines.map((l) => l.id)).toEqual([TWO])
    // Two mouths, the farmer and 9000002: four meals; the farmhands cost no upkeep.
    expect(mealsNeeded(save, PACK)).toBe(4)
    expect(eatTonight(save, handsWorking(save, PACK)).mouths).toBe(2)
    expect(upkeepOf(save)).toMatchObject({ residents: 0, gold: 0 })
    const morning = runNight(save, { story: PACK })
    expect(morning.summary!.work.filter((w) => w.kind === 'farmhand').map((w) => w.kind === 'farmhand' && w.id)).toEqual([TWO])
    expect(morning.summary!.money).toEqual([{ kind: 'takeout', meals: 4, paid: 60, due: 60 }])
    expect(morning.roster[ONE]!.practice).toEqual(save.roster[ONE]!.practice)
  })

  it('has a spouse in her room on the farm every day, and one waiting for a room in town by her schedule', () => {
    const base = farm(on('spring', 1))
    const housed: SaveV4 = { ...base, love: { ...base.love, [THREE]: { ...newLove(), stage: 'spouse', level: 0, wed: 1, house: 0 } } }
    for (let day = 1; day <= 48; day++) expect(onFarmToday(housed, PACK, THREE, day), `day ${day}`).toBe(true)
    const waiting: SaveV4 = { ...base, love: { ...base.love, [THREE]: { ...newLove(), stage: 'spouse', level: 0, wed: 1 } } }
    const out = Array.from({ length: 12 }, (_, i) => i + 1).filter((day) => townDay({ ...waiting, calendar: { day } }, PACK).where.has(THREE))
    expect(out).toEqual([3, 6, 9, 12])
    for (let day = 1; day <= 12; day++) expect(onFarmToday(waiting, PACK, THREE, day)).toBe(false)
  })

  it('never gates an occasion: a farmhand\'s festival plays on her farm day, and on her town day too', async () => {
    // Spring 19, the Flower Show: 9000002's farm day, 9000001's town day.
    const save = farm(on('spring', 19))
    const days = { festivals: FESTIVALS, birthdays: birthdaysOf(PACK, new Map()) }
    expect(onFarmToday(save, PACK, TWO)).toBe(true)
    expect(onFarmToday(save, PACK, ONE)).toBe(false)
    for (const id of [ONE, TWO]) {
      const occasions = occasionsOn(save, PACK, days, id)
      expect(occasions.map((o) => o.kind), id).toContain('festival')
      const festival = occasions.find((o) => o.kind === 'festival')!
      const played = playOccasion(save, PACK, id, days, festival.id)
      expect(occasionPlayed(played, id, festival.id), id).toBe(true)
    }
  })
})
