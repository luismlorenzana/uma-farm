// Scene links: each kind's "may this play now", so a typed or stale `?life=`, `?event=`, `?ask=`, `?memory=`,
// `?evening=`, `?occasion=`, `?household=` or `?level=` never plays a scene the game hasn't given you. Read against the
// game's own flows: the night's companion, a wedding and moving in, the invitation to work, a meal, a Ready event, Ask
// her, a Memory, an evening, an occasion, a household scene and a night level. Invented ids only: the stand-ins
// 9000001–9000003.
import { describe, expect, it } from 'vitest'
import { runNight, type NightContext } from '../night/end-day'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { STAND_INS } from '../story/authored.fixture'
import { storyPackFrom } from '../story/pack'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { birthdaysOf } from './days'
import { spendEvening } from './evening'
import { moveSpouse } from './homestead'
import { readHousehold } from './household'
import {
  mayAsk, mayGreet, mayMealScene, mayMoveIn, mayOpenEvening, mayPlayEvent, mayPlayHousehold, mayPlayLife, mayPlayNightLevel, mayPlayOccasion, mayReplayMemory,
  mayWelcomeToWork, SCENE_LINKS,
} from './links'
import { chooseCompanion, cookMeal, inviteToWork } from './loop'
import { joinCast } from './meeting.fixture'
import { readiness } from './ready'

const AT = '2026-11-14T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const context: NightContext = { story: PACK, birthdays: birthdaysOf(PACK, new Map()) }

/** A named farm on `day`, the stand-ins home in the Dorm at Friendship 0, their meeting scenes played. */
function farm(day = 30): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day }, gold: 50_000 }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, arrivals: [...STAND_INS], today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
/** 9000001 married on `wed`, in the Farmhouse. */
const wed = (save: SaveV4, wedOn = 2, love: Partial<Love> = {}): SaveV4 => moveSpouse(withLove(save, ONE, { stage: 'spouse', level: 0, points: 0, wed: wedOn, ...love }), ONE, 0)
const tomorrow = (save: SaveV4): SaveV4 => ({ ...save, calendar: { day: save.calendar.day + 1 } })

describe('scene links: her life\'s short scenes', () => {
  it('?life=morning: the morning after a night she was your companion, that morning only', () => {
    const save = wed(farm())
    expect(mayGreet(save, ONE)).toBe(false)
    const morning = runNight(chooseCompanion(save, ONE), context)
    expect(morning.love[ONE]!.night).toBe(30)
    expect(mayGreet(morning, ONE)).toBe(true)
    expect(mayPlayLife(morning, 'morning', ONE)).toBe(true)
    // Another spouse, or the next morning without her, gets nothing.
    expect(mayGreet(morning, TWO)).toBe(false)
    expect(mayGreet(tomorrow(morning), ONE)).toBe(false)
    expect(mayGreet(withLove(save, ONE, { night: 29 }), ONE)).toBe(true)
    expect(mayGreet(withLove(save, ONE, { night: 28 }), ONE)).toBe(false)
  })

  it('?life=moving-in: her wedding day with a room, or the morning she moved into one', () => {
    expect(mayMoveIn(wed(farm(), 30), ONE)).toBe(true)
    expect(mayMoveIn(wed(farm(), 2), ONE)).toBe(false)
    // Married today with no room: she waits, and moves in the morning one is free.
    expect(mayMoveIn(withLove(farm(), ONE, { stage: 'spouse', level: 0, wed: 30 }), ONE)).toBe(false)
    const line = (day: number): SaveV4 => ({ ...wed(farm(), 2), summary: { day, bin: [], work: [], ranks: [], hearts: [{ kind: 'moved', id: ONE, house: 0 }], news: [], nudges: [] } })
    expect(mayMoveIn(line(30), ONE)).toBe(true)
    expect(mayMoveIn(line(29), ONE)).toBe(false)
    expect(mayMoveIn(line(30), TWO)).toBe(false)
    expect(mayPlayLife(line(30), 'moving-in', ONE)).toBe(true)
  })

  it('?life=invited-to-work: the day you invited her, not before and not after', () => {
    const friend = withLove(farm(), TWO, { level: 3 })
    expect(mayWelcomeToWork(friend, TWO)).toBe(false)
    const invited = inviteToWork(friend, TWO)
    expect(mayWelcomeToWork(invited, TWO)).toBe(true)
    expect(mayPlayLife(invited, 'invited-to-work', TWO)).toBe(true)
    expect(mayWelcomeToWork(tomorrow(invited), TWO)).toBe(false)
    expect(mayWelcomeToWork(invited, THREE)).toBe(false)
  })

  it('?life=breakfast and dinner: that meal cooked today, and she\'s a spouse who ate it', () => {
    const save = wed(farm())
    expect(mayMealScene(save, ONE, 'breakfast')).toBe(false)
    const cooked = cookMeal(save, 'breakfast').save
    expect(mayMealScene(cooked, ONE, 'breakfast')).toBe(true)
    expect(mayPlayLife(cooked, 'breakfast', ONE)).toBe(true)
    expect(mayMealScene(cooked, ONE, 'dinner')).toBe(false)
    // She ate it, but she isn't a spouse: no meal line of hers.
    expect(mayMealScene(cooked, TWO, 'breakfast')).toBe(false)
    // The night clears today's meals.
    expect(mayMealScene(runNight(cooked, context), ONE, 'breakfast')).toBe(false)
  })

  it('?life=talk: today’s talk, once you’ve talked with her today', () => {
    const save = farm()
    expect(mayPlayLife(save, 'talk', ONE)).toBe(false)
    expect(mayPlayLife({ ...save, today: { ...save.today, chats: [ONE] } }, 'talk', ONE)).toBe(true)
  })

  it('refuses anyone not met, whatever the kind', () => {
    const save = farm()
    for (const kind of ['morning', 'moving-in', 'invited-to-work', 'breakfast', 'dinner', 'talk'] as const) expect(mayPlayLife(save, kind, '9000009'), kind).toBe(false)
  })
})

describe('scene links: her events, Memories and evenings', () => {
  it('?event=: only when Ready, as the domain decides', () => {
    const save = farm()
    expect(mayPlayEvent(save, PACK, ONE)).toBe(false)
    const full = withLove(save, ONE, { points: 200 })
    expect(readiness(full, PACK, ONE).ready).toBe(true)
    expect(mayPlayEvent(full, PACK, ONE)).toBe(true)
    expect(mayPlayEvent({ ...full, today: { ...full.today, events: [ONE] } }, PACK, ONE)).toBe(false)
    expect(mayPlayEvent(full, PACK, '9000009')).toBe(false)
  })

  it('?ask=: after her "Not yet", once a day', () => {
    const waiting = withLove(farm(), ONE, { stage: 'confession', level: 10, friend: true })
    expect(mayAsk(farm(), ONE)).toBe(false)
    expect(mayAsk(waiting, ONE)).toBe(true)
    expect(mayAsk({ ...waiting, today: { ...waiting.today, asked: [ONE] } }, ONE)).toBe(false)
  })

  it('?memory=: only a Memory already played', () => {
    const save = { ...farm(), memories: { [ONE]: ['f1', 'f2'] } }
    expect(mayReplayMemory(save, ONE, 'arrival')).toBe(true)
    expect(mayReplayMemory(save, ONE, 'f2')).toBe(true)
    expect(mayReplayMemory(save, ONE, 'f3')).toBe(false)
    expect(mayReplayMemory(save, TWO, 'f1')).toBe(false)
    expect(mayReplayMemory({ ...save, arrivals: [] }, ONE, 'arrival')).toBe(false)
  })

  it('?evening=: her evening open to her now; the picker while anyone\'s is', () => {
    const save = farm()
    expect(mayOpenEvening(save, PACK, ONE)).toBe(false)
    expect(mayOpenEvening(save, PACK, 'pick')).toBe(false)
    const friend = withLove(save, ONE, { level: 3 })
    expect(mayOpenEvening(friend, PACK, ONE)).toBe(true)
    expect(mayOpenEvening(friend, PACK, 'pick')).toBe(true)
    // Living in town, no evening; spent, none tonight.
    expect(mayOpenEvening({ ...friend, dorm: { ...friend.dorm, home: [TWO, THREE] } }, PACK, ONE)).toBe(false)
    const spent = spendEvening(friend, PACK, ONE, 'walk', 70).save
    expect(mayOpenEvening(spent, PACK, ONE)).toBe(false)
    expect(mayOpenEvening(spent, PACK, 'pick')).toBe(false)
  })
})

describe('scene links: occasions, the household and night levels', () => {
  it('?occasion=: only on its day, with an Uma you\'ve met, once', () => {
    const show = farm(10)
    expect(mayPlayOccasion(show, PACK, ONE)).toBe(true)
    expect(mayPlayOccasion(farm(11), PACK, ONE)).toBe(false)
    expect(mayPlayOccasion(show, PACK, '9000009')).toBe(false)
    expect(mayPlayOccasion({ ...show, today: { ...show.today, occasions: [`${ONE}:flower-show`] } }, PACK, ONE)).toBe(false)
    // A save from before: her id alone is the day's one occasion.
    expect(mayPlayOccasion({ ...show, today: { ...show.today, occasions: [ONE] } }, PACK, ONE)).toBe(false)
  })

  it('?household=: Ready and unread; a replay only once read', () => {
    const save = farm()
    expect(mayPlayHousehold(save, 'household:5', false)).toBe(false)
    const five = { ...save, homestead: { ...save.homestead, married: 5 } }
    expect(mayPlayHousehold(five, 'household:5', false)).toBe(true)
    expect(mayPlayHousehold(five, 'household:5', true)).toBe(false)
    const read = readHousehold(five, 'household:5')
    expect(mayPlayHousehold(read, 'household:5', false)).toBe(false)
    expect(mayPlayHousehold(read, 'household:5', true)).toBe(true)
    expect(mayPlayHousehold(five, 'household:7', false)).toBe(false)
  })

  it('?level=: a spouse level she\'s reached', () => {
    expect(mayPlayNightLevel(wed(farm(), 2, { level: 1 }), ONE, 's2')).toBe(false)
    expect(mayPlayNightLevel(wed(farm(), 2, { level: 2 }), ONE, 's2')).toBe(true)
    expect(mayPlayNightLevel(wed(farm(), 2, { level: 3 }), ONE, 's4')).toBe(false)
    expect(mayPlayNightLevel(farm(), ONE, 's2')).toBe(false)
  })

  it('lists every link the manual names', () => {
    expect(SCENE_LINKS.map((l) => l.link.split(':')[0]!.replace(/`/g, ''))).toEqual([
      '?life=morning', '?life=moving-in', '?life=invited-to-work', '?life=breakfast', '?life=talk', '?event=<id>', '?ask=<id>', '?memory=<id>', '?evening=<id>', '?evening=pick',
      '?occasion=<id>', '?household=<id>', '?level=<id>',
    ])
  })
})
