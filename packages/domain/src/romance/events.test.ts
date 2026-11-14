// Heart events: `playEvent` at every stage,
// the choices' gains and costs, flags and `when`, the confession's Yes and Not yet, Ask her, meeting someone after the
// event her trigger names, and Memories' replays. Invented ids only: the stand-ins 9000001–9000003 and 9000004 built here.
import { describe, expect, it } from 'vitest'
import { DAYS_PER_YEAR } from '../farm/calendar'
import { parseSaveV5 } from '../save/parse-v4'
import { addGoods, goodCount } from '../save/warehouse'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { pairKey } from '../save/v4'
import { STAND_IN_ROUTE } from '../story/authored.fixture'
import type { Cast, ChoiceOption, Step } from '../story/authored'
import { readScene } from '../story/scenes'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import { beatOf } from '../story/placeholders'
import { joinCast } from './meeting.fixture'
import {
  askHer, askSteps, canAsk, choicePointsOf, EVENT_POINTS, extraPlay, optionViews, pathPlays, playEvent, replaySteps, takeLowest, type EventOutcome, type PlayScore,
} from './events'
import { costOf, sceneSteps, walkScene } from './love'
import { choosePlan, chooseScore } from './plays/choose'
import { playSeed } from './plays/grade'
import { readiness } from './ready'

const AT = '2026-11-11T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const ONE = '9000001'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** A named farm on `day`, the opening read and the stand-ins home (`joinCast`) at Friendship 0. */
function farm(day = 3): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, love: Partial<Love>, id = ONE): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const give = (save: SaveV4, good: string, stars = 1, count = 1): SaveV4 => ({ ...save, items: addGoods(save.items, good, stars, count) })
const steps = (id: string): Step[] => json(STAND_IN_ROUTE.events.find((e) => e.id === id)!.steps)
const outcome = (rung: string, picks: number[], plays: PlayScore[] = []): EventOutcome => ({ event: { id: rung, steps: steps(rung) }, picks, plays })
/** Her bar for `rung` full with `extra` banked past it. */
const readyFor = (save: SaveV4, stage: Love['stage'], level: number, rung: string, extra = 0): SaveV4 => withLove(save, { stage, level, points: costOf(rung) + extra })

describe('playEvent', () => {
  it('Friendship 1: +50, the best choice +30 and a Perfect +30 into her bar after the cost; F1, its perk, its Memory, today', () => {
    const save = readyFor(farm(), 'friendship', 0, 'f1', 40)
    expect(readiness(save, PACK, ONE).ready).toBe(true)
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('f1', [0], [{ kind: 'pick', score: 95 }]))
    expect(card).toMatchObject({ rung: 'f1', event: EVENT_POINTS, choices: [30], plays: [{ kind: 'pick', score: 95, grade: 'perfect', points: 30 }], chosen: null, sum: 110, paid: 110, carried: 40 })
    expect(after.love[ONE]).toMatchObject({ stage: 'friendship', level: 1, points: 150, last: 3 })
    expect(card.next).toEqual({ rung: 'f2', cost: 240, points: 150, banked: 0, hint: 'The Fields, while she works them.', perk: 'hangouts' })
    expect(card).toMatchObject({ perk: 'tastes-loved', memory: 'First rows, side by side.', line: 'Same time tomorrow?', stage: null, answer: null })
    expect(after.today.events).toEqual([ONE])
    expect(after.memories[ONE]).toEqual(['f1'])
    // One of hers a day: played, she isn't Ready again today, however full her bar.
    expect(readiness(after, PACK, ONE).waits?.kind).toBe('bar')
    expect(readiness(withLove(after, { points: 1000 }), PACK, ONE).waits?.kind).toBe('today')
    expect(() => playEvent(after, PACK, ONE, outcome('f2', [0], [{ kind: 'rhythm', score: 100 }]))).toThrow('Her event isn’t Ready.')
  })

  it('a Fine adds nothing and another option +10; the grade picks the play\'s good or miss steps', () => {
    const save = readyFor(farm(), 'friendship', 0, 'f1')
    const fine = playEvent(save, PACK, ONE, outcome('f1', [1], [{ kind: 'pick', score: 59 }]))
    expect(fine.card).toMatchObject({ choices: [10], plays: [{ grade: 'fine', points: 0 }], sum: 60 })
    expect(fine.card.line).toBe('Same time tomorrow?')
    const great = playEvent(save, PACK, ONE, outcome('f1', [1], [{ kind: 'pick', score: 60 }]))
    expect(great.card.sum).toBe(75)
    const path = sceneSteps(steps('f1'), [0], { plays: [false] })
    expect(path.some((s) => 'say' in s && s.line.startsWith('That one was still green'))).toBe(true)
  })

  it('refuses what isn\'t Ready, another rung, an event left halfway and plays that aren\'t its own; nothing is saved', () => {
    const short = withLove(farm(), { points: 199 })
    expect(() => playEvent(short, PACK, ONE, outcome('f1', [0], [{ kind: 'pick', score: 100 }]))).toThrow('Her event isn’t Ready.')
    const save = readyFor(farm(), 'friendship', 0, 'f1')
    expect(() => playEvent(save, PACK, ONE, outcome('f3', [0], [{ kind: 'rhythm', score: 100 }]))).toThrow('That isn’t her next event.')
    expect(() => playEvent(save, PACK, ONE, outcome('f1', [], []))).toThrow('Her event isn’t over yet.')
    expect(() => playEvent(save, PACK, ONE, outcome('f1', [0], []))).toThrow('Her event isn’t over yet.')
    expect(() => playEvent(save, PACK, ONE, outcome('f1', [0], [{ kind: 'cast', score: 100 }]))).toThrow('Those plays aren’t her event’s.')
    expect(() => playEvent(save, PACK, ONE, outcome('f1', [0], [{ kind: 'pick', score: 101 }]))).toThrow('Those plays aren’t her event’s.')
    expect(() => playEvent(save, PACK, ONE, outcome('f1', [5], [{ kind: 'pick', score: 100 }]))).toThrow()
    expect(save.love[ONE]!.level).toBe(0)
  })

  it('a working setup holds every day while the farmer works the farm alone: Friendship 3 at the Fishery plays Cast', () => {
    const save = readyFor(farm(), 'friendship', 2, 'f3')
    expect(beatOf(PACK, ONE, 'f3')?.trigger).toEqual({ kind: 'working', activity: 'fishing' })
    expect(readiness(save, PACK, ONE).ready).toBe(true)
    const played = playEvent(save, PACK, ONE, outcome('f3', [1], [{ kind: 'cast', score: 90 }]))
    expect(played.save.love[ONE]!.level).toBe(3)
    expect(played.card.sum).toBe(50 + 30 + 30)
  })

  it('an option\'s goods: refused without them ("Need 1 Basil"), taken lowest stars first; with no play step, her together plays (Rhythm with the pot)', () => {
    const save = readyFor(farm(), 'friendship', 3, 'f4')
    expect(extraPlay(steps('f4'), PACK.bibles.get(ONE)!.route!.find((b) => b.id === 'f4')!.together)).toEqual({ kind: 'rhythm', mark: 'pot', fallback: true })
    expect(() => playEvent(save, PACK, ONE, outcome('f4', [0], [{ kind: 'rhythm', score: 70 }]))).toThrow('Need 1 Basil')
    const stocked = give(give(save, 'basil', 3), 'basil', 1)
    const { save: after, card } = playEvent(stocked, PACK, ONE, outcome('f4', [0], [{ kind: 'rhythm', score: 70 }]))
    expect(after.items.basil).toEqual([0, 0, 1, 0, 0])
    expect(card).toMatchObject({ taken: [{ good: 'basil', count: 1 }], choices: [10], plays: [{ kind: 'rhythm', grade: 'great', points: 15 }], sum: 75 })
    expect(() => playEvent(stocked, PACK, ONE, outcome('f4', [1], [{ kind: 'pick', score: 70 }]))).toThrow('Those plays aren’t her event’s.')
    expect(takeLowest({ basil: [2, 0, 1, 0, 0] }, 'basil', 3)).toEqual({})
  })

  it('an item unlock lands in the Warehouse; a place or perk unlock is the card\'s', () => {
    const save = readyFor(farm(), 'friendship', 1, 'f2')
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('f2', [0], [{ kind: 'rhythm', score: 100 }]))
    expect(card.unlock).toEqual({ kind: 'item', good: 'golden-carrot' })
    expect(goodCount(after.items, 'golden-carrot')).toBe(1)
    const walk = playEvent(readyFor(farm(), 'friendship', 4, 'f5'), PACK, ONE, outcome('f5', [0], [{ kind: 'walk', score: 75 }]))
    expect(walk.card.unlock).toEqual({ kind: 'place', place: 'orchard-bench' })
  })

  it('Choose (a gift): learns the taste of the good you chose; the score is hers for it', () => {
    const save = give(readyFor(farm(), 'friendship', 5, 'f6'), 'carrot')
    const plan = choosePlan(playSeed('u1', 3, ONE, 'f6'), PACK, ONE)
    const good = plan.goods.find((g) => ['golden-carrot', 'carrot', 'potato', 'cabbage'].includes(g))!
    const score = chooseScore(PACK, ONE, good)
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('f6', [0], [{ kind: 'choose', score, learns: good }]))
    expect(after.love[ONE]!.known).toContain(good)
    expect(card.learnt).toEqual([good])
    expect(() => playEvent(save, PACK, ONE, outcome('f6', [0], [{ kind: 'choose', score: 100, learns: 'emperor-pumpkin' }]))).toThrow('She wasn’t offered that.')
    expect(() => playEvent(save, PACK, ONE, outcome('f6', [0], [{ kind: 'choose', score: 100, learns: plan.goods.find((g) => g !== good) }]))).toThrow('That isn’t what she thinks of it.')
    expect(playEvent(save, PACK, ONE, outcome('f6', [0], [{ kind: 'choose', score: 0, learns: null }])).card.plays[0]!.grade).toBe('fine')
  })

  it('no play (talk, help): the grade is the best choice\'s, a Perfect for the best and a Great for another; `reveals` learns her taste', () => {
    const save = readyFor(farm(), 'friendship', 6, 'f7')
    const best = playEvent(save, PACK, ONE, outcome('f7', [0]))
    expect(best.card).toMatchObject({ plays: [], chosen: { grade: 'perfect', points: 30 }, choices: [30], sum: 110, learnt: ['potato'] })
    expect(best.save.love[ONE]!.known).toEqual(['potato'])
    const other = playEvent(save, PACK, ONE, outcome('f7', [2]))
    expect(other.card).toMatchObject({ chosen: { grade: 'great', points: 15 }, choices: [10], sum: 75, learnt: [] })
  })

  it('a flag set by a choice changes later wording only (`when`)', () => {
    const save = readyFor(farm(), 'friendship', 7, 'f8')
    const shared = playEvent(save, PACK, ONE, outcome('f8', [0])).save
    expect(shared.love[ONE]!.flags).toEqual(['shared-lunch'])
    const plain = playEvent(save, PACK, ONE, outcome('f8', [1])).save
    expect(plain.love[ONE]!.flags).toEqual([])
    const line = (flags: string[]) => sceneSteps(steps('f9'), [], { flags }).find((s): s is { say: string; line: string } => 'say' in s)!.line
    expect(line(['shared-lunch'])).toMatch(/^Lunch in the woods again/)
    expect(line([])).toMatch(/^Busy day/)
    expect(walkScene([{ flag: 'x' }, { when: 'x', then: [{ narrate: 'Yes.' }] }], []).steps).toEqual([{ flag: 'x' }, { narrate: 'Yes.' }])
  })

  it('F10 moves her to her confession, Ready the next day', () => {
    const save = readyFor(farm(), 'friendship', 9, 'f10')
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('f10', [0], [{ kind: 'pick', score: 80 }]))
    expect(after.love[ONE]).toMatchObject({ stage: 'confession', level: 10 })
    expect(card.next).toMatchObject({ rung: 'confession', cost: 0, hint: 'The Overlook, the day after Friendship 10.' })
    expect(readiness(after, PACK, ONE).waits?.kind).toBe('day')
    const tomorrow = { ...after, calendar: { day: 4 }, today: { ...after.today, events: [] } }
    expect(readiness(tomorrow, PACK, ONE).ready).toBe(true)
  })

  it('an anniversary doubles the event (the day factor); S1 on the spouse ladder', () => {
    const day = 1 + DAYS_PER_YEAR
    const save = withLove(farm(day), { stage: 'spouse', level: 0, points: 600, wed: 1 })
    expect(readiness(save, PACK, ONE).ready).toBe(true)
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('s1', [0], [{ kind: 'pick', score: 100 }]))
    expect(card).toMatchObject({ sum: 110, paid: 220 })
    expect(after.love[ONE]).toMatchObject({ stage: 'spouse', level: 1, points: 220 })
  })

  it('R1 on the romance ladder', () => {
    const save = readyFor(farm(), 'romance', 0, 'r1')
    const { save: after, card } = playEvent(save, PACK, ONE, outcome('r1', [0], [{ kind: 'pick', score: 100 }]))
    expect(after.love[ONE]).toMatchObject({ stage: 'romance', level: 1 })
    expect(card.unlock).toEqual({ kind: 'perk', perk: 'She has a name for you now.' })
    expect(card.perk).toBe('dates')
  })
})

describe('the confession', () => {
  const ready = (): SaveV4 => withLove(farm(5), { stage: 'confession', level: 10, points: 120, last: 4 })
  // Its first choice, then the answer: Yes is option 0, Not yet option 1.
  const confess = (answer: 0 | 1) => outcome('confession', [0, answer], [{ kind: 'walk', score: 100 }, { kind: 'pick', score: 90 }])

  it('Yes: romance opens with the stage-up; it pays like any event and counts as her event', () => {
    const { save, card } = playEvent(ready(), PACK, ONE, confess(0))
    expect(save.love[ONE]).toMatchObject({ stage: 'romance', level: 0, points: 120 + 50 + 30 + 30 + 30 + 30, last: 5 })
    expect(card).toMatchObject({ answer: 'yes', stage: 'romance', choices: [30, 30], plays: [{ grade: 'perfect' }, { grade: 'perfect' }], carried: 120 })
    expect(save.today.events).toEqual([ONE])
    expect(save.memories[ONE]).toEqual(['confession'])
  })

  it('Not yet: she stays a close friend (`friend`), the points bank, and she isn\'t Ready again', () => {
    const { save, card } = playEvent(ready(), PACK, ONE, confess(1))
    expect(save.love[ONE]).toMatchObject({ stage: 'confession', level: 10, friend: true, last: 5 })
    expect(save.love[ONE]!.points).toBe(120 + 50 + 30 + 10 + 30 + 30)
    expect(card).toMatchObject({ answer: 'not-yet', stage: null })
    expect(readiness({ ...save, calendar: { day: 9 } }, PACK, ONE).waits?.kind).toBe('friend')
    // Her points keep banking into romance while she waits.
    expect(save.memories[ONE]).toEqual(['confession'])
  })

  it('Ask her: once a day, pays nothing, isn\'t her event; Not yet waits, Yes opens romance', () => {
    const waiting = playEvent(ready(), PACK, ONE, confess(1)).save
    expect(canAsk(waiting, ONE)).toBe(true)
    const again = askHer(waiting, ONE, 'not-yet')
    expect(again.love[ONE]).toEqual(waiting.love[ONE])
    expect(again.today.asked).toEqual([ONE])
    expect(canAsk(again, ONE)).toBe(false)
    expect(() => askHer(again, ONE, 'yes')).toThrow('You asked her today. Ask again tomorrow.')
    const tomorrow = { ...again, calendar: { day: 6 }, today: { ...again.today, events: [], asked: [] } }
    const yes = askHer(tomorrow, ONE, 'yes')
    expect(yes.love[ONE]).toMatchObject({ stage: 'romance', level: 0, points: waiting.love[ONE]!.points, last: 5 })
    expect(yes.love[ONE]!.friend).toBeUndefined()
    expect(yes.today.events).toEqual([])
    expect(() => askHer(yes, ONE, 'yes')).toThrow('She isn’t waiting for an answer.')
    expect(() => askHer(farm(), ONE, 'yes')).toThrow('She isn’t waiting for an answer.')
    // Her R1, banked, can play the same day.
    expect(readiness({ ...yes, love: { ...yes.love, [ONE]: { ...yes.love[ONE]!, points: 200 } } }, PACK, ONE).ready).toBe(true)
  })

  it('Ask her\'s scene: her line before the answer, the answer and on, the place kept and the plays left out', () => {
    const ask = askSteps(steps('confession'))
    expect(ask[0]).toEqual({ place: 'overlook' })
    expect(ask[1]).toMatchObject({ say: ONE })
    expect(ask.some((s) => 'play' in s)).toBe(false)
    expect('choice' in ask[2]! && ask[2].choice.map((o: ChoiceOption) => o.answer)).toEqual(['yes', 'not-yet'])
    expect(askSteps([{ narrate: 'No answer.' }])).toEqual([])
  })
})

describe('choices on their buttons', () => {
  it('+30 the best (ties too), +10 the others; a heart on a romantic one; a cost, greyed without it; a taste to learn', () => {
    const save = farm()
    const f4 = steps('f4').find((s): s is { choice: ChoiceOption[] } => 'choice' in s)!.choice
    expect(optionViews(save, PACK, ONE, f4).map((o) => [o.points, o.short, o.gives?.good ?? null])).toEqual([[10, true, 'basil'], [30, false, null], [10, false, null]])
    expect(optionViews(give(save, 'basil'), PACK, ONE, f4)[0]!.short).toBe(false)
    expect(optionViews(save, PACK, ONE, f4, true)[0]).toMatchObject({ gives: null, short: false })
    const f7 = steps('f7').find((s): s is { choice: ChoiceOption[] } => 'choice' in s)!.choice
    expect(optionViews(save, PACK, ONE, f7).map((o) => [o.points, o.reveals])).toEqual([[30, 'liked'], [30, null], [10, null]])
    expect(optionViews(withLove(save, { known: ['potato'] }), PACK, ONE, f7)[0]!.reveals).toBeNull()
    const r1 = steps('r1').find((s): s is { choice: ChoiceOption[] } => 'choice' in s)!.choice
    expect(optionViews(save, PACK, ONE, r1).map((o) => o.heart)).toEqual([true, false])
  })
  it('the path\'s plays, then her together\'s when the event scripts none', () => {
    expect(pathPlays(sceneSteps(steps('f1'), [0], { plays: [true] }), null).map((p) => p.kind)).toEqual(['pick'])
    expect(pathPlays([], { kind: 'choose', mark: null, fallback: false }).map((p) => p.kind)).toEqual(['choose'])
  })
})

describe('Memories\' replays', () => {
  it('start at the top or at any choice point, the place kept; nothing is paid or saved', () => {
    const f1 = steps('f1')
    expect(choicePointsOf(f1)).toEqual([3])
    expect(replaySteps(f1)).toEqual(f1)
    // From a choice point, with the line before it (its question).
    expect(replaySteps(f1, 3)).toEqual([{ place: 'fields' }, ...f1.slice(2)])
    expect(choicePointsOf(steps('confession'))).toEqual([4, 7])
  })
})

describe('save v4 grows in place', () => {
  it('parses `today.asked`, roster Umas once each', () => {
    const save = playEvent(withLove(farm(5), { stage: 'confession', level: 10, points: 0, last: 4 }), PACK, ONE,
      outcome('confession', [0, 1], [{ kind: 'walk', score: 100 }, { kind: 'pick', score: 90 }])).save
    const asked = askHer(save, ONE, 'not-yet')
    expect(parseSaveV5(json(asked))).toEqual(asked)
    expect(() => parseSaveV5(json({ ...asked, today: { ...asked.today, asked: ['9000009'] } }))).toThrow()
    const { asked: _gone, ...today } = asked.today
    expect(() => parseSaveV5(json({ ...asked, today }))).toThrow()
    expect(asked.today.asked).toEqual([ONE])
  })
  it('plays her F9 with no setup to meet', () => {
    expect(readiness(readyFor(farm(), 'friendship', 8, 'f9'), PACK, ONE).ready).toBe(true)
    expect(pairKey(ONE, '9000002')).toBe('9000001:9000002')
  })
})
