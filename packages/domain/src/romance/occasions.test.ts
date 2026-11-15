// Every occasion on its day (F94): New Year's, each festival's day and night (its aliases), her birthday, her anniversary
// from the first, and the story's days (the game's six, a world.json day that moves one, a day with its own scene);
// several on one day playing one in order, a festival day playing its day then its night, and the save keeping each
// with hers. On the invented stand-in with invented occasion scenes (`occasions.fixture.ts`); no original-game content.
import { describe, expect, it } from 'vitest'
import { DAY_ACTIONS, FESTIVAL_ACTIONS, spendActions, type SpecialDays } from '../farm/actions'
import { farmDay, FESTIVALS, type Season } from '../farm/calendar'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { storyPackFrom } from '../story/pack'
import { eventOf, festivalsOf, storyDaysOf } from '../story/placeholders'
import { readScene } from '../story/scenes'
import { withOccasions } from '../story/occasions.fixture'
import { calendarDay } from './calendar-days'
import { birthdaysOf } from './days'
import { joinCast } from './meeting.fixture'
import { occasionPlayed, occasionsLeft, occasionsOn, occasionWith, playedToday, playOccasion } from './occasions'

const AT = '2026-11-15T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const PACK = storyPackFrom(withOccasions())
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const on = (season: Season, day: number, year = 1) => farmDay({ year, season, day })
/** The game's festivals and 9000001's birthday (the cast's own: Spring 4). */
const DAYS: SpecialDays = { festivals: FESTIVALS, birthdays: birthdaysOf(PACK, new Map()) }

/** A named farm on `day`, the stand-in's three met at Friendship 0. */
function farm(day: number, pack = PACK): SaveV4 {
  const fresh = { ...newSave('u-occasions', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), pack)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
/** Her occasions on a day: `<occasion>><event>`, in play order. */
const ids = (save: SaveV4, id: string, pack = PACK, days = DAYS) => occasionsOn(save, pack, days, id).map((o) => `${o.id}>${o.event}`)

describe('every occasion on its day', () => {
  it('New Year’s from the second year, each festival’s day and its night, from her route; the aliases play a night', async () => {
    expect(ids(farm(on('spring', 1)), ONE)).toEqual([])
    expect(ids(farm(on('spring', 1, 2)), ONE)).toEqual(['new-year>new-year'])
    expect(ids(farm(on('spring', 10)), ONE)).toEqual(['flower-show>flower-show', 'flower-show-night>flower-show-night'])
    expect(ids(farm(on('summer', 10)), ONE)).toEqual(['fishing-derby>fishing-derby', 'fishing-derby-night>fishing-derby-night'])
    // The Cooking Contest's night under the story's name for it.
    expect(ids(farm(on('autumn', 10)), ONE)).toEqual(['cooking-contest>cooking-contest', 'cooking-contest-night>harvest-moon'])
    expect(ids(farm(on('winter', 10)), ONE)).toEqual(['animal-show>animal-show', 'animal-show-night>animal-show-night'])
    expect(ids(farm(on('winter', 12)), ONE)).toEqual(['harvest-cup>harvest-cup', 'harvest-cup-night>harvest-cup-night'])
    const night = occasionsOn(farm(on('autumn', 10)), PACK, DAYS, ONE)[1]!
    expect(night).toMatchObject({ kind: 'festival-night', slot: 'night', name: 'Cooking Contest night', moments: ['festival-night'] })
    expect(await eventOf(PACK, ONE, night.event)).toMatchObject({ id: 'harvest-moon', written: true, steps: [{ say: ONE, line: 'An invented harvest-moon scene.' }] })
  })

  it('a festival the story moves plays on its new day, every year, and none on the old', () => {
    const world = { festivals: [{ id: 'cooking-contest', name: 'The Big Stew', season: 'summer', day: 3 }] }
    const pack = storyPackFrom(withOccasions(world))
    const days = { ...DAYS, festivals: festivalsOf(pack) }
    expect(ids(farm(on('summer', 3, 2), pack), ONE, pack, days)).toEqual(['cooking-contest>cooking-contest', 'cooking-contest-night>harvest-moon'])
    expect(ids(farm(on('autumn', 10), pack), ONE, pack, days)).toEqual([])
    expect(occasionsOn(farm(on('summer', 3), pack), pack, days, ONE).map((o) => o.name)).toEqual(['The Big Stew', 'The Big Stew night'])
  })

  it('the game’s six small days play their scenes; a world.json day moves or renames one, and one of its own plays its scene', () => {
    expect(storyDaysOf(PACK).map((d) => d.id)).toEqual(['blossom-viewing', 'wishing-night', 'first-cold-evening', 'first-snow', 'longest-night', 'sweets-day'])
    expect([on('spring', 6), on('summer', 6), on('autumn', 4), on('winter', 2), on('winter', 6), on('winter', 8)].map((d) => ids(farm(d), ONE))).toEqual([
      ['blossom-viewing>blossom-viewing'], ['wishing-night>wishing-night'], ['first-cold-evening>first-cold-evening'], ['first-snow>first-snow'],
      ['longest-night>longest-night'], ['sweets-day>sweets-day'],
    ])
    expect(occasionsOn(farm(on('spring', 6)), PACK, DAYS, ONE)[0]).toMatchObject({ kind: 'story-day', name: 'Blossom viewing', moments: [] })
    // Nobody else has these scenes written: they aren't theirs.
    expect(ids(farm(on('spring', 6)), TWO)).toEqual([])
    const world = {
      days: [
        // The first snow moved to Winter 5 and renamed.
        { id: 'first-snow', name: 'Snowfall', season: 'winter', day: 5 },
        // A day of the story's own, playing a scene of another id.
        { id: 'lantern-day', name: 'Lantern day', season: 'summer', day: 2, scene: 'sweets-day' },
      ],
    }
    const pack = storyPackFrom(withOccasions(world))
    expect(ids(farm(on('winter', 2), pack), ONE, pack)).toEqual([])
    expect(occasionsOn(farm(on('winter', 5), pack), pack, DAYS, ONE).map((o) => `${o.id}>${o.event}:${o.name}`)).toEqual(['first-snow>first-snow:Snowfall'])
    expect(ids(farm(on('summer', 2), pack), ONE, pack)).toEqual(['lantern-day>sweets-day'])
    // The game's own sweets day still plays on its day.
    expect(ids(farm(on('winter', 8), pack), ONE, pack)).toEqual(['sweets-day>sweets-day'])
  })

  it('her birthday once you’ve met her, and her anniversary only from the first, each in the dinner dress', () => {
    const birthday = occasionsOn(farm(on('spring', 4)), PACK, DAYS, ONE)
    expect(birthday.map((o) => `${o.id}>${o.event}`)).toEqual(['birthday>birthday'])
    expect(birthday[0]).toMatchObject({ kind: 'birthday', moments: ['dinner'] })
    const met = farm(on('spring', 4))
    const notMet = { ...met, roster: Object.fromEntries(Object.entries(met.roster).filter(([id]) => id !== ONE)) }
    expect(occasionsOn(notMet, PACK, DAYS, ONE)).toEqual([])
    // Married on Spring 3 of year 1: no anniversary that day, nor on Spring 3 of year 1 again; from year 2, every year.
    const wed = (day: number) => withLove(farm(day), TWO, { stage: 'spouse', level: 1, points: 0, wed: on('spring', 3) })
    expect(ids(wed(on('spring', 3)), TWO)).toEqual([])
    expect(ids(wed(on('spring', 3, 2)), TWO)).toEqual(['anniversary>anniversary'])
    expect(ids(wed(on('spring', 3, 3)), TWO)).toEqual(['anniversary>anniversary'])
    expect(occasionsOn(wed(on('spring', 3, 2)), PACK, DAYS, TWO)[0]!.moments).toEqual(['dinner'])
    // Written for her, unwritten for someone else: her birthday plays only from her route.
    const days = { ...DAYS, birthdays: new Map([[THREE, 4]]) }
    expect(ids(farm(on('spring', 4)), THREE, PACK, days)).toEqual([])
  })
})

describe('several on one day', () => {
  it('a festival day plays its day, then its night: two actions, the event actions first', () => {
    const derby = farm(on('summer', 10))
    expect(occasionWith(derby, PACK, DAYS, ONE)?.id).toBe('fishing-derby')
    const day = playOccasion(derby, PACK, ONE, DAYS)
    expect(occasionWith(day, PACK, DAYS, ONE)?.id).toBe('fishing-derby-night')
    const night = playOccasion(day, PACK, ONE, DAYS)
    expect(night.today).toMatchObject({ actions: 0, eventActions: 2, occasions: [`${ONE}:fishing-derby`, `${ONE}:fishing-derby-night`] })
    expect(occasionWith(night, PACK, DAYS, ONE)).toBeNull()
    expect(() => playOccasion(night, PACK, ONE, DAYS)).toThrow('You’ve spent today’s occasion with her.')
    expect(playedToday(night)).toEqual([ONE])
    expect(parseSaveV5(json(night))).toEqual(night)
    // The night comes after the day: the player's own occasion must still be next.
    expect(() => playOccasion(derby, PACK, ONE, DAYS, 'fishing-derby-night')).toThrow('You’ve spent today’s occasion with her.')
    // The festival's three, then the day's own.
    const spent = spendActions(farm(on('summer', 10)), DAY_ACTIONS)
    const two = playOccasion(playOccasion(spent, PACK, ONE, DAYS), PACK, ONE, DAYS)
    expect(two.today.eventActions).toBe(2)
    const three = playOccasion(two, PACK, TWO, DAYS)
    expect(three.today.eventActions).toBe(FESTIVAL_ACTIONS)
    expect(() => playOccasion(three, PACK, THREE, DAYS)).toThrow('No actions left today.')
  })

  it('plays one of the day’s in order: her birthday, her anniversary, New Year’s or the festival’s day, a story day', () => {
    const first = (save: SaveV4, id: string, days: SpecialDays) => occasionsOn(save, PACK, days, id).map((o) => o.id)
    // Her birthday on the Fishing Derby: the birthday, then the derby's night.
    const derbyDay = (on('summer', 10) - 1) % 48 + 1
    expect(first(farm(on('summer', 10)), ONE, { ...DAYS, birthdays: new Map([[ONE, derbyDay]]) })).toEqual(['birthday', 'fishing-derby-night'])
    // Her birthday on a small day: the birthday alone.
    const blossom = (on('spring', 6) - 1) % 48 + 1
    expect(first(farm(on('spring', 6)), ONE, { ...DAYS, birthdays: new Map([[ONE, blossom]]) })).toEqual(['birthday'])
    // Her anniversary on her birthday: the birthday first.
    const married = withLove(farm(on('spring', 4, 2)), ONE, { stage: 'spouse', level: 1, points: 0, wed: on('spring', 4) })
    expect(first(married, ONE, DAYS)).toEqual(['birthday'])
    // Her anniversary on New Year's: the anniversary.
    const newYear = withLove(farm(on('spring', 1, 3)), ONE, { stage: 'spouse', level: 1, points: 0, wed: on('spring', 1, 2) })
    expect(first(newYear, ONE, DAYS)).toEqual(['anniversary'])
    // A festival moved onto a small day: the festival's day, then its night.
    const pack = storyPackFrom(withOccasions({ festivals: [{ id: 'animal-show', season: 'winter', day: 2 }] }))
    expect(occasionsOn(farm(on('winter', 2), pack), pack, { ...DAYS, festivals: festivalsOf(pack) }, ONE).map((o) => o.id)).toEqual(['animal-show', 'animal-show-night'])
  })

  it('keeps each with hers; her id alone, from a save before, is the old game’s one occasion that day', () => {
    const derby = farm(on('summer', 10))
    const old = { ...derby, today: { ...derby.today, occasions: [ONE] } }
    expect(parseSaveV5(json(old))).toEqual(old)
    expect(occasionPlayed(old, ONE, 'fishing-derby-night')).toBe(true)
    expect(occasionPlayed(old, ONE, 'fishing-derby')).toBe(false)
    // The derby's day scene, new to her, still plays; its night was the old game's.
    expect(occasionsLeft(old, PACK, DAYS, ONE).map((o) => o.id)).toEqual(['fishing-derby'])
    const played = playOccasion(old, PACK, ONE, DAYS)
    expect(played.today.occasions).toEqual([ONE, `${ONE}:fishing-derby`])
    expect(occasionWith(played, PACK, DAYS, ONE)).toBeNull()
    expect(parseSaveV5(json(played))).toEqual(played)
    // Nothing moves the account's stamp.
    expect(played.account.updatedAt).toBe(derby.account.updatedAt)
    // A malformed entry is refused.
    expect(() => parseSaveV5(json({ ...derby, today: { ...derby.today, occasions: [`${ONE}:Not An Id`] } }))).toThrow()
    expect(() => parseSaveV5(json({ ...derby, today: { ...derby.today, occasions: ['9000009:new-year'] } }))).toThrow()
  })

  it('shows her occasions on the calendar’s day, today’s until she’s played them', () => {
    const derby = farm(on('summer', 10))
    const face = (save: SaveV4) => calendarDay(save, PACK, DAYS, on('summer', 10)).faces.find((f) => f.id === ONE)
    expect(face(derby)?.occasions.map((o) => o.name)).toEqual(['Fishing Derby', 'Fishing Derby night'])
    const day = playOccasion(derby, PACK, ONE, DAYS)
    expect(face(day)?.occasions.map((o) => o.name)).toEqual(['Fishing Derby night'])
    expect(face(playOccasion(day, PACK, ONE, DAYS))).toBeUndefined()
    // A day ahead lists them all; a small day too.
    expect(calendarDay(derby, PACK, DAYS, on('spring', 6, 2)).faces.find((f) => f.id === ONE)?.occasions.map((o) => o.name)).toEqual(['Blossom viewing'])
    expect(calendarDay(derby, PACK, DAYS, on('spring', 6, 2)).storyDays.map((d) => d.id)).toEqual(['blossom-viewing'])
  })
})
