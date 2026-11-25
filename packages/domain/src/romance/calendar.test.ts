// The calendar: special days' event actions spent on her events before the day's own (several Umas' events fit a
// festival), the occasion scenes on their days (New Year's from the second year, the Flower Show, the Fishing Derby's
// night) and what they cost, each day's entries and the faces of the Umas with an event on it, and the morning's news of
// today's and tomorrow's. The invented stand-in (9000001–9000003) and the invented world (`world.fixture.ts`); no
// original-game content.
import { describe, expect, it } from 'vitest'
import { actionsLeft, canSpendForEvent, DAY_ACTIONS, eventActionsLeft, eventActionsOn, FESTIVAL_ACTIONS, NEW_YEAR_ACTIONS, spendActions, type SpecialDays } from '../farm/actions'
import { farmDay, FESTIVALS, type Season } from '../farm/calendar'
import { runNight } from '../night/end-day'
import { parseSaveV6 } from '../save/parse-v4'
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
import { occasionsOn, occasionWith, playOccasion } from './occasions'
import { readiness } from './ready'

const AT = '2026-11-14T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const WORLD = storyPackFrom({ ...STAND_IN_FILES, world: { ...WORLD_FIXTURE, days: (WORLD_FIXTURE.days ?? []).map(event =>
  event.id === 'kite-day' ? { ...event, day: 19 } : event) } })
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const on = (season: Season, day: number, year = 1) => farmDay({ year, season, day })
/** The year's festivals and the stand-in's birthdays (9000001's, the cast's own: Spring 10). */
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
    const festival = spentDay(allReady(farm(on('spring', 19))))
    expect(actionsLeft(festival)).toBe(0)
    expect(eventActionsOn(festival, DAYS)).toBe(FESTIVAL_ACTIONS)
    const one = await f1(festival, ONE)
    const two = await f1(one, TWO)
    expect(two.today).toMatchObject({ actions: DAY_ACTIONS, eventActions: 2, events: [ONE, TWO] })
    expect(two.love[ONE]!.level).toBe(1)
    expect(two.love[TWO]!.level).toBe(1)
    const three = await f1(two, THREE)
    expect(eventActionsLeft(three, DAYS)).toBe(0)
    expect(parseSaveV6(json(three))).toEqual(three)
  })

  it('spends the event actions first, then the day’s own; with neither left her event is refused before it pays', async () => {
    const festival = allReady(farm(on('spring', 19)))
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
    const birthday = spentDay(allReady(farm(on('spring', 10))))
    expect(eventActionsOn(birthday, DAYS)).toBe(1)
    const played = await f1(birthday, ONE)
    expect(played.today).toMatchObject({ actions: DAY_ACTIONS, eventActions: 1 })
    await expect(f1(played, TWO)).rejects.toThrow('No actions left today.')
  })
})

describe('occasion scenes', () => {
  /** Her occasions' ids on a day, in play order. */
  const ids = (save: SaveV4, id: string, days: SpecialDays = DAYS) => occasionsOn(save, PACK, days, id).map((o) => `${o.id}>${o.event}`)

  it('plays the default story’s New Year’s from the second year, Flower Show and Fishing Derby night with an Uma whose route writes none', () => {
    expect(ids(farm(on('spring', 1)), TWO)).toEqual([])
    expect(ids(farm(on('spring', 1, 2)), TWO)).toEqual(['new-year>new-year'])
    expect(ids(farm(on('spring', 19)), TWO)).toEqual(['flower-show>flower-show'])
    expect(ids(farm(on('summer', 21, 3)), TWO)).toEqual(['fishing-derby-night>derby-night'])
    expect([on('autumn', 10), on('winter', 10), on('winter', 12), on('spring', 9)].map((d) => ids(farm(d), TWO))).toEqual([[], [], [], []])
    expect(occasionsOn(farm(on('spring', 1, 2)), PACK, DAYS, TWO)[0]!.moments).toEqual(['new-year'])
    expect(occasionsOn(farm(on('spring', 19)), PACK, DAYS, TWO)[0]!.moments).toEqual(['spring-festival'])
    expect(occasionsOn(farm(on('summer', 21)), PACK, DAYS, TWO)[0]).toMatchObject({ slot: 'night', moments: ['festival-night'] })
  })

  it('follows the story’s year: its names, and a moved festival on its new day', () => {
    const named = { ...DAYS, festivals: festivalsOf(WORLD) }
    expect(occasionsOn(farm(on('spring', 19)), WORLD, named, TWO)[0]!.name).toBe('Bloom Fair')
    expect(occasionsOn(farm(on('summer', 21)), WORLD, named, TWO)[0]!.name).toBe('Fishing Derby night')
    expect(occasionsOn(farm(on('spring', 1, 2)), WORLD, named, TWO)[0]!.name).toBe('New Year’s')
    const moved = { ...DAYS, festivals: festivalsOf(storyPackFrom({ ...STAND_IN_FILES, world: { festivals: [{ id: 'fishing-derby', name: 'The Big Catch', season: 'summer', day: 6 }] } })) }
    expect(ids(farm(on('summer', 6)), TWO, moved)).toEqual(['fishing-derby-night>derby-night'])
    expect(ids(farm(on('summer', 21)), TWO, moved)).toEqual([])
    expect(occasionsOn(farm(on('summer', 6)), PACK, moved, TWO)[0]!.name).toBe('The Big Catch night')
  })

  it('costs one action, the event actions first, once a day with each Uma, and pays nothing', () => {
    const show = farm(on('spring', 19))
    expect(occasionWith(show, PACK, DAYS, ONE)?.id).toBe('flower-show')
    const one = playOccasion(show, PACK, ONE, DAYS)
    expect(one.today).toMatchObject({ actions: 0, eventActions: 1, occasions: [`${ONE}:flower-show`], events: [] })
    expect(one.love).toEqual(show.love)
    expect(occasionWith(one, PACK, DAYS, ONE)).toBeNull()
    expect(() => playOccasion(one, PACK, ONE, DAYS)).toThrow('You’ve spent today’s occasion with her.')
    // It isn't her heart event: Ready stays Ready.
    const ready = withLove(one, ONE, { points: costOf('f1') })
    expect(readiness(ready, PACK, ONE).ready).toBe(true)
    // The festival's three, then the day's own.
    const three = playOccasion(playOccasion(one, PACK, TWO, DAYS), PACK, THREE, DAYS)
    expect(three.today).toMatchObject({ actions: 0, eventActions: 3, occasions: [`${ONE}:flower-show`, `${TWO}:flower-show`, `${THREE}:flower-show`] })
    expect(parseSaveV6(json(three))).toEqual(three)
  })

  it('is refused on a day without one, for someone not met, and with no action left', () => {
    expect(() => playOccasion(farm(on('spring', 9)), PACK, ONE, DAYS)).toThrow('No occasion today.')
    expect(() => playOccasion(farm(on('spring', 1)), PACK, ONE, DAYS)).toThrow('No occasion today.')
    expect(() => playOccasion(farm(on('spring', 19)), PACK, '9000009', DAYS)).toThrow('You haven’t met her yet.')
    const spent = spendActions(farm(on('spring', 19)), DAY_ACTIONS)
    const used = [ONE, TWO, THREE].reduce((s, id) => playOccasion(s, PACK, id, DAYS), spent)
    expect(used.today.eventActions).toBe(FESTIVAL_ACTIONS)
    const fresh = { ...used, today: { ...used.today, occasions: [`${ONE}:flower-show`, `${TWO}:flower-show`] } }
    expect(() => playOccasion(fresh, PACK, THREE, DAYS)).toThrow('No actions left today.')
  })

  it('reads a save from before the calendar, with no occasions, and the night clears them', () => {
    const show = farm(on('spring', 19))
    expect(show.today.occasions).toBeUndefined()
    expect(parseSaveV6(json(show))).toEqual(show)
    const played = playOccasion(show, PACK, ONE, DAYS)
    expect(runNight(played, { story: PACK }).today).toEqual({ ...newTodayV4(), eventFunding: {} })
  })
})

describe('the calendar’s days', () => {
  it('holds New Year’s, the festival, the story’s days, the occasion, the met Umas’ birthdays and the event actions', () => {
    const save = farm(on('spring', 3))
    const days: SpecialDays = { festivals: festivalsOf(WORLD), birthdays: DAYS.birthdays }
    const first = calendarDay(save, WORLD, days, on('spring', 1))
    expect(first).toMatchObject({ when: 'past', newYear: true, festival: null, eventActions: 0 })
    const year2 = calendarDay(save, WORLD, days, on('spring', 1, 2))
    expect(year2).toMatchObject({ when: 'ahead', newYear: true, eventActions: NEW_YEAR_ACTIONS })
    expect(year2.faces.map((f) => f.occasions.map((o) => o.id))).toEqual([['new-year'], ['new-year'], ['new-year']])
    expect(first.storyDays.map((d) => d.id)).toEqual(['first-bell'])
    const show = calendarDay(save, WORLD, days, on('spring', 19))
    expect(show).toMatchObject({ when: 'ahead', festival: { id: 'flower-show', name: 'Bloom Fair' }, eventActions: FESTIVAL_ACTIONS })
    expect(show.faces[0]!.occasions.map((o) => o.name)).toEqual(['Bloom Fair'])
    expect(show.storyDays.map((d) => d.id)).toEqual(['kite-day'])
    const birthday = calendarDay(save, WORLD, days, on('spring', 10))
    expect(birthday).toMatchObject({ birthdays: [ONE], eventActions: 1 })
    expect(birthday.storyDays).toEqual([])
    expect(seasonDays(save, WORLD, days, 'summer').map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => on('summer', i + 1)))
  })

  it('shows the faces of the Umas with an event that day: the date’s own first, then those only Ready', () => {
    const save = withLove(withLove(farm(on('spring', 3)), TWO, { points: costOf('f1') }), THREE, { stage: 'spouse', level: 1, points: 0, wed: on('spring', 5) })
    const faces = (s: SaveV4, day: number) => calendarDay(s, PACK, DAYS, day).faces.map((f) => ({ id: f.id, reasons: f.reasons }))
    // Today: Two's event is Ready.
    expect(faces(save, on('spring', 3))).toEqual([{ id: TWO, reasons: ['ready'] }])
    // One's birthday (her route writes no birthday scene), Two still Ready if nothing changes.
    expect(faces(save, on('spring', 10))).toEqual([{ id: ONE, reasons: ['birthday'] }, { id: TWO, reasons: ['ready'] }])
    // Three's anniversary: the wedding's day of the year, from the second year.
    const wed = { ...save, calendar: { day: on('spring', 3, 2) } }
    expect(faces(wed, on('spring', 5, 2))).toContainEqual({ id: THREE, reasons: ['anniversary'] })
    expect(calendarDay(wed, PACK, DAYS, on('spring', 5, 2)).anniversaries).toEqual([THREE])
    // The Flower Show: everyone's occasion, and Two's Ready too.
    expect(faces(save, on('spring', 19))).toEqual([
      { id: ONE, reasons: ['occasion'] }, { id: TWO, reasons: ['occasion', 'ready'] }, { id: THREE, reasons: ['occasion'] },
    ])
    // A day gone by keeps its birthdays, and nothing to play.
    const later = { ...save, calendar: { day: on('spring', 20) } }
    expect(faces(later, on('spring', 10))).toEqual([{ id: ONE, reasons: ['birthday'] }])
    expect(faces(later, on('spring', 19))).toEqual([])
  })

  it('leaves out today’s occasion once she’s played it', () => {
    const show = playOccasion(farm(on('spring', 19)), PACK, ONE, DAYS)
    expect(calendarDay(show, PACK, DAYS, on('spring', 19)).faces.map((f) => f.id)).toEqual([TWO, THREE])
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
    const show = runNight(farm(on('spring', 18)), { story: WORLD })
    expect(show.summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'today' }, { kind: 'days', ids: ['kite-day'], when: 'today' }])
    const year = runNight(farm(on('winter', 29)), { story: WORLD })
    expect(year.summary!.news).toEqual([
      { kind: 'new-year', when: 'tomorrow' }, { kind: 'days', ids: ['first-bell'], when: 'tomorrow' },
    ])
    expect(parseSaveV6(json(year))).toEqual(year)
  })
})
