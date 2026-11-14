// The calendar: special days' event actions spent on her events before the day's own (several Umas' events fit a
// festival), the occasion scenes on their days (New Year's from the second year, the Flower Show, the Fishing Derby's
// night) and what they cost, each day's entries and the faces of the Umas with an event on it, and the morning's news of
// today's and tomorrow's. The invented stand-in (9000001–9000003) and the invented world (`world.fixture.ts`); no
// original-game content.
import { describe, expect, it } from 'vitest'
import { actionsLeft, canSpendForEvent, DAY_ACTIONS, eventActionsLeft, eventActionsOn, FESTIVAL_ACTIONS, NEW_YEAR_ACTIONS, spendActions, type SpecialDays } from '../farm/actions'
import { farmDay, FESTIVALS, type Season } from '../farm/calendar'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, newTodayV4, type Love, type SaveV4 } from '../save/v4'
import { STAND_IN_ROUTE } from '../story/authored.fixture'
import type { Step } from '../story/authored'
import { storyPackFrom } from '../story/pack'
import { eventOf, festivalsOf } from '../story/placeholders'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { WORLD_FIXTURE } from '../story/world.fixture'
import { calendarDay, readyOn, seasonDays } from './calendar-days'
import { birthdaysOf } from './days'
import { playEvent, type EventOutcome } from './events'
import { costOf } from './love'
import { joinCast } from './meeting.fixture'
import { occasionMoments, occasionName, occasionOn, occasionWith, playOccasion } from './occasions'
import { readiness } from './ready'

const AT = '2026-11-14T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const WORLD = storyPackFrom({ ...STAND_IN_FILES, world: WORLD_FIXTURE })
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const on = (season: Season, day: number, year = 1) => farmDay({ year, season, day })
/** The year's festivals and the stand-in's birthdays (9000001's, the cast's own: Spring 4). */
const DAYS: SpecialDays = { festivals: FESTIVALS, birthdays: birthdaysOf(PACK, new Map()) }

/** A named farm on `day`, the stand-in's three home at Friendship 0. */
function farm(day: number): SaveV4 {
  const fresh = { ...newSave('u-cal', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
/** Everyone's Friendship 1 Ready. */
const allReady = (save: SaveV4): SaveV4 => [ONE, TWO, THREE].reduce((s, id) => withLove(s, id, { stage: 'friendship', level: 0, points: costOf('f1') }), save)
/** The day's ten actions spent. */
const spentDay = (save: SaveV4): SaveV4 => spendActions(save, DAY_ACTIONS)
/** Her Friendship 1, played: its script (the stand-in route's, or the default story's for an Uma it doesn't write). */
async function f1(save: SaveV4, id: string, days: SpecialDays = DAYS): Promise<SaveV4> {
  const steps = json(id === ONE ? STAND_IN_ROUTE.events.find((e) => e.id === 'f1')!.steps : (await eventOf(PACK, id, 'f1')).steps) as Step[]
  const plays = id === ONE ? [{ kind: 'pick' as const, score: 80 }] : []
  const outcome: EventOutcome = { event: { id: 'f1', steps }, picks: [0], plays }
  return playEvent(save, PACK, id, outcome, days).save
}

describe('special days: event actions spent on her events', () => {
  it('a festival’s three event actions play several Umas’ events past the day’s budget', async () => {
    const festival = spentDay(allReady(farm(on('spring', 10))))
    expect(actionsLeft(festival)).toBe(0)
    expect(eventActionsOn(festival, DAYS)).toBe(FESTIVAL_ACTIONS)
    const one = await f1(festival, ONE)
    const two = await f1(one, TWO)
    expect(two.today).toMatchObject({ actions: DAY_ACTIONS, eventActions: 2, events: [ONE, TWO] })
    expect(two.love[ONE]!.level).toBe(1)
    expect(two.love[TWO]!.level).toBe(1)
    const three = await f1(two, THREE)
    expect(eventActionsLeft(three, DAYS)).toBe(0)
    expect(parseSaveV5(json(three))).toEqual(three)
  })

  it('spends the event actions first, then the day’s own; with neither left her event is refused before it pays', async () => {
    const festival = allReady(farm(on('spring', 10)))
    const first = await f1(festival, ONE)
    expect(first.today).toMatchObject({ actions: 0, eventActions: 1 })
    // An ordinary day: her event costs one of the day's ten.
    const plain = await f1(allReady(farm(on('spring', 9))), ONE)
    expect(plain.today).toMatchObject({ actions: 1, eventActions: 0 })
    const spent = spentDay(allReady(farm(on('spring', 9))))
    expect(canSpendForEvent(spent, 1, DAYS)).toBe(false)
    await expect(f1(spent, ONE)).rejects.toThrow('No actions left today.')
  })

  it('grants New Year’s three from the second year and a met Uma’s birthday one, which spends as a festival’s does', async () => {
    // Year 1's Spring 1 is the farm's first morning.
    expect(eventActionsOn(farm(on('spring', 1)), DAYS)).toBe(0)
    expect(eventActionsOn(farm(on('spring', 1, 2)), DAYS)).toBe(NEW_YEAR_ACTIONS)
    expect(eventActionsOn(farm(on('spring', 1, 3)), DAYS)).toBe(NEW_YEAR_ACTIONS)
    const birthday = spentDay(allReady(farm(on('spring', 4))))
    expect(eventActionsOn(birthday, DAYS)).toBe(1)
    const played = await f1(birthday, ONE)
    expect(played.today).toMatchObject({ actions: DAY_ACTIONS, eventActions: 1 })
    await expect(f1(played, TWO)).rejects.toThrow('No actions left today.')
  })
})

describe('occasion scenes', () => {
  it('plays New Year’s from the second year, the Flower Show and the Fishing Derby’s night on their days', () => {
    expect(occasionOn(on('spring', 1), FESTIVALS)).toBeNull()
    expect(occasionOn(on('spring', 1, 2), FESTIVALS)).toBe('new-year')
    expect(occasionOn(on('spring', 10), FESTIVALS)).toBe('flower-show')
    expect(occasionOn(on('summer', 10, 3), FESTIVALS)).toBe('derby-night')
    expect([on('autumn', 10), on('winter', 10), on('winter', 12), on('spring', 9)].map((d) => occasionOn(d, FESTIVALS))).toEqual([null, null, null, null])
    expect([occasionMoments('new-year'), occasionMoments('flower-show'), occasionMoments('derby-night')]).toEqual([['new-year'], ['spring-festival'], ['festival-night']])
  })

  it('follows the story’s year: its names, and a moved festival on its new day', () => {
    const year = festivalsOf(WORLD)
    expect(occasionName('flower-show', year)).toBe('Bloom Fair')
    expect(occasionName('derby-night', year)).toBe('Fishing Derby night')
    expect(occasionName('new-year', year)).toBe('New Year’s')
    const moved = festivalsOf(storyPackFrom({ ...STAND_IN_FILES, world: { festivals: [{ id: 'fishing-derby', name: 'The Big Catch', season: 'summer', day: 6 }] } }))
    expect(occasionOn(on('summer', 6), moved)).toBe('derby-night')
    expect(occasionOn(on('summer', 10), moved)).toBeNull()
    expect(occasionName('derby-night', moved)).toBe('The Big Catch night')
  })

  it('costs one action, the event actions first, once a day with each Uma, and pays nothing', () => {
    const show = farm(on('spring', 10))
    expect(occasionWith(show, ONE, FESTIVALS)).toBe('flower-show')
    const one = playOccasion(show, ONE, DAYS)
    expect(one.today).toMatchObject({ actions: 0, eventActions: 1, occasions: [ONE], events: [] })
    expect(one.love).toEqual(show.love)
    expect(occasionWith(one, ONE, FESTIVALS)).toBeNull()
    expect(() => playOccasion(one, ONE, DAYS)).toThrow('You’ve spent today’s occasion with her.')
    // It isn't her heart event: Ready stays Ready.
    const ready = withLove(one, ONE, { points: costOf('f1') })
    expect(readiness(ready, PACK, ONE).ready).toBe(true)
    // The festival's three, then the day's own.
    const three = playOccasion(playOccasion(one, TWO, DAYS), THREE, DAYS)
    expect(three.today).toMatchObject({ actions: 0, eventActions: 3, occasions: [ONE, TWO, THREE] })
    expect(parseSaveV5(json(three))).toEqual(three)
  })

  it('is refused on a day without one, for someone not met, and with no action left', () => {
    expect(() => playOccasion(farm(on('spring', 9)), ONE, DAYS)).toThrow('No occasion today.')
    expect(() => playOccasion(farm(on('spring', 1)), ONE, DAYS)).toThrow('No occasion today.')
    expect(() => playOccasion(farm(on('spring', 10)), '9000009', DAYS)).toThrow('You haven’t met her yet.')
    const spent = spendActions(farm(on('spring', 10)), DAY_ACTIONS)
    const used = [ONE, TWO, THREE].reduce((s, id) => playOccasion(s, id, DAYS), spent)
    expect(used.today.eventActions).toBe(FESTIVAL_ACTIONS)
    const fresh = { ...used, today: { ...used.today, occasions: [ONE, TWO] } }
    expect(() => playOccasion(fresh, THREE, DAYS)).toThrow('No actions left today.')
  })

  it('reads a save from before the calendar, with no occasions, and the night clears them', () => {
    const show = farm(on('spring', 10))
    expect(show.today.occasions).toBeUndefined()
    expect(parseSaveV5(json(show))).toEqual(show)
    const played = playOccasion(show, ONE, DAYS)
    expect(runNight(played, { story: PACK }).today).toEqual(newTodayV4())
  })
})

describe('the calendar’s days', () => {
  it('holds New Year’s, the festival, the story’s days, the occasion, the met Umas’ birthdays and the event actions', () => {
    const save = farm(on('spring', 3))
    const days: SpecialDays = { festivals: festivalsOf(WORLD), birthdays: DAYS.birthdays }
    const first = calendarDay(save, WORLD, days, on('spring', 1))
    expect(first).toMatchObject({ when: 'past', newYear: true, festival: null, occasion: null, eventActions: 0 })
    expect(calendarDay(save, WORLD, days, on('spring', 1, 2))).toMatchObject({ when: 'ahead', newYear: true, occasion: 'new-year', eventActions: NEW_YEAR_ACTIONS })
    expect(first.storyDays.map((d) => d.id)).toEqual(['first-bell'])
    const show = calendarDay(save, WORLD, days, on('spring', 10))
    expect(show).toMatchObject({ when: 'ahead', festival: { id: 'flower-show', name: 'Bloom Fair' }, occasion: 'flower-show', eventActions: FESTIVAL_ACTIONS })
    expect(show.storyDays.map((d) => d.id)).toEqual(['kite-day'])
    const birthday = calendarDay(save, WORLD, days, on('spring', 4))
    expect(birthday).toMatchObject({ birthdays: [ONE], eventActions: 1 })
    expect(birthday.storyDays.map((d) => d.id)).toEqual(['market-day'])
    expect(seasonDays(save, WORLD, days, 'summer').map((d) => d.day)).toEqual(Array.from({ length: 12 }, (_, i) => on('summer', i + 1)))
  })

  it('shows the faces of the Umas with an event that day: the date’s own first, then those only Ready', () => {
    const save = withLove(withLove(farm(on('spring', 3)), TWO, { points: costOf('f1') }), THREE, { stage: 'spouse', level: 1, points: 0, wed: on('spring', 5) - 48 })
    // Today: Two's event is Ready.
    expect(calendarDay(save, PACK, DAYS, on('spring', 3)).faces).toEqual([{ id: TWO, reasons: ['ready'] }])
    // One's birthday, Two still Ready if nothing changes.
    expect(calendarDay(save, PACK, DAYS, on('spring', 4)).faces).toEqual([{ id: ONE, reasons: ['birthday'] }, { id: TWO, reasons: ['ready'] }])
    // Three's anniversary: the wedding's day of the year, from the second year.
    const wed = { ...save, calendar: { day: on('spring', 3, 2) } }
    expect(calendarDay(wed, PACK, DAYS, on('spring', 5, 2)).faces).toContainEqual({ id: THREE, reasons: ['anniversary'] })
    expect(calendarDay(wed, PACK, DAYS, on('spring', 5, 2)).anniversaries).toEqual([THREE])
    // The Flower Show: everyone's occasion, and Two's Ready too.
    expect(calendarDay(save, PACK, DAYS, on('spring', 10)).faces).toEqual([
      { id: ONE, reasons: ['occasion'] }, { id: TWO, reasons: ['occasion', 'ready'] }, { id: THREE, reasons: ['occasion'] },
    ])
    // A day gone by keeps its birthdays, and nothing to play.
    const later = { ...save, calendar: { day: on('spring', 11) } }
    expect(calendarDay(later, PACK, DAYS, on('spring', 4)).faces).toEqual([{ id: ONE, reasons: ['birthday'] }])
    expect(calendarDay(later, PACK, DAYS, on('spring', 10)).faces).toEqual([])
  })

  it('leaves out today’s occasion once she’s played it', () => {
    const show = playOccasion(farm(on('spring', 10)), ONE, DAYS)
    expect(calendarDay(show, PACK, DAYS, on('spring', 10)).faces.map((f) => f.id)).toEqual([TWO, THREE])
  })

  it('predicts a day ahead from the save as it stands: a waiting rung the day after, nothing Ready that needs points', () => {
    // The confession waits a day after Friendship 10: Ready from tomorrow.
    const waiting = withLove(farm(on('spring', 3)), ONE, { stage: 'confession', level: 10, points: 0, last: on('spring', 3) })
    expect(readiness(waiting, PACK, ONE).waits?.kind).toBe('day')
    expect(readyOn(waiting, PACK, ONE, on('spring', 3))).toBe(false)
    expect(readyOn(waiting, PACK, ONE, on('spring', 4))).toBe(true)
    expect(readyOn(waiting, PACK, ONE, on('spring', 2))).toBe(false)
    // Points she hasn't earned yet don't show.
    expect(readyOn(farm(on('spring', 3)), PACK, TWO, on('spring', 9))).toBe(false)
    // Played today, a full bar shows from tomorrow.
    const played = { ...withLove(farm(on('spring', 3)), TWO, { points: costOf('f1') }), today: { ...newTodayV4(), events: [TWO] } }
    expect(readyOn(played, PACK, TWO, on('spring', 3))).toBe(false)
    expect(readyOn(played, PACK, TWO, on('spring', 4))).toBe(true)
  })
})

describe('the morning names today’s and tomorrow’s', () => {
  it('says the story’s days, New Year’s and the festival, today and tomorrow, and keeps them through a save', () => {
    const eve = runNight(farm(on('spring', 2)), { story: WORLD })
    expect(eve.summary!.news).toEqual([{ kind: 'days', ids: ['market-day'], when: 'tomorrow' }])
    const show = runNight(farm(on('spring', 9)), { story: WORLD })
    expect(show.summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'today' }, { kind: 'days', ids: ['kite-day'], when: 'today' }])
    const year = runNight(farm(on('winter', 11)), { story: WORLD })
    expect(year.summary!.news).toEqual([
      { kind: 'days', ids: ['market-day'], when: 'today' },
      { kind: 'new-year', when: 'tomorrow' }, { kind: 'days', ids: ['first-bell'], when: 'tomorrow' },
    ])
    expect(parseSaveV5(json(year))).toEqual(year)
  })
})
