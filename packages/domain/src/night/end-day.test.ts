// End the day: the nine steps in order, seeded and replayable, jobs counted in days on
// uma-work's clock, well fed's quarter day, the calendar turning, the summary, and one stamp a night. Invented outfit ids
// and test kinds (`kinds.fixture.ts`) .
import { endsAt } from '@luismlorenzana/uma-work'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DAY_MS } from '../farm/calendar'
import { GOLD_SHIPPED, ship, takeBack } from '../save/bin'
import { collectLoopAll, editLoopQueue, loopWorking, settleLoopWork, startLoopJob } from '../save/loop-work'
import { loopReadyWork } from '../save/work-readings'
import { parseSaveV3, SAVE_V3_KEYS } from '../save/parse-v3'
import { newRosterUma, newSave, type SaveV3 } from '../save/v3'
import { emptyNotes, endDay, NIGHT_STEPS, runNight, tickRanks, type NightContext, type NightStep } from './end-day'
import { TEST_KINDS } from './kinds.fixture'
import { summarySections } from './summary'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const CONTEXT: NightContext = { roster: [], kinds: TEST_KINDS }
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Three Umas home on `day`, with five Wheat. */
function farm(day = 1): SaveV3 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) },
    dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, items: { ...save.items, wheat: [5, 0, 0, 0, 0] },
  }
}
const gather = (days = 1) => ({ kind: 'gather', item: 'pine-log', count: days })
const make = (days: number) => ({ kind: 'make', item: 'wheat-flour', count: days })
const start = (save: SaveV3, outfitId: string, request: ReturnType<typeof gather>) =>
  startLoopJob(save, { outfitId, place: request.kind === 'make' ? 'mill' : 'forest', slot: Number(outfitId) % 4, request }, AT, TEST_KINDS)
const night = (save: SaveV3, now = LATER) => endDay(save, CONTEXT, now)
const nights = (save: SaveV3, n: number) => Array.from({ length: n }).reduce<SaveV3>((s) => night(s), save)

afterEach(() => vi.useRealTimers())

describe('the night', () => {
  it('runs nine steps in order, each a named function', () => {
    expect(NIGHT_STEPS.map((s) => `${s.step} ${s.name}`)).toEqual([
      '1 payTheBin', '2 growCrops', '3 tendAnimals', '4 moveJobs', '4 countHauls', '5 resetWorkshops', '6 tickRanks', '6 tickBonds', '6 countWellFed',
      '7 witherCrops', '7 turnCalendar', '8 settleDorm', '8 gateVisitors', '8 checkGoals', '9 buildSummary',
    ])
  })

  it('gives the same morning from the same save, every time and on every device, and keeps no random state', () => {
    const save = start(start(farm(), '101', gather()), '202', make(2))
    const once = night(save)
    expect(night(json(save))).toEqual(once)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    expect(night(save)).toEqual(once)
    expect(Object.keys(once).sort()).toEqual([...SAVE_V3_KEYS].sort())
    expect(parseSaveV3(json(once), 'save', TEST_KINDS)).toEqual(once)
  })

  it('stamps updatedAt once, with real time, after the ninth step', () => {
    const save = start(farm(), '101', gather())
    for (const step of NIGHT_STEPS) {
      const after = step.run({ before: save, save, context: CONTEXT, notes: emptyNotes() })
      expect(after.save.account, step.name).toEqual(save.account)
    }
    expect(runNight(save, CONTEXT).account).toEqual(save.account)
    expect(night(save, LATER).account).toEqual({ ...save.account, updatedAt: LATER })
  })
})

describe('jobs in days on the calendar\'s clock', () => {
  it('makes a 1-day job Ready after one night, and not before', () => {
    const save = start(farm(), '101', gather())
    expect(loopWorking(save, TEST_KINDS)).toEqual(new Set(['101']))
    expect(loopReadyWork(save).size).toBe(0)
    const morning = night(save)
    expect(morning.calendar.day).toBe(2)
    expect(loopWorking(morning, TEST_KINDS).size).toBe(0)
    expect([...loopReadyWork(morning)]).toEqual([['forest', 1]])
    expect(collectLoopAll(morning, LATER, undefined, TEST_KINDS)).toMatchObject({ items: 1, save: { items: { 'pine-log': [1, 0, 0, 0, 0] } } })
  })

  it('makes a 3-day job Ready after three nights', () => {
    const save = start(farm(), '202', make(3))
    expect(save.items.wheat).toEqual([4, 0, 0, 0, 0])
    const after = [1, 2, 3].map((n) => nights(save, n))
    expect(after.map((s) => loopReadyWork(s).get('mill') ?? 0)).toEqual([0, 0, 1])
    expect(after.map((s) => s.calendar.day)).toEqual([2, 3, 4])
  })

  it('starts a queued job at the boundary, planned with the rank step 6 gave that night', () => {
    const queued = editLoopQueue(start(farm(), '101', gather()), { outfitId: '101', add: { request: gather(), building: 'forest' } }, AT, TEST_KINDS)
    // A stand-in step: everyone who worked today reaches Skilled foraging.
    const ranks: NightStep = (n) => ({
      ...n, save: { ...(n.save as SaveV3), roster: Object.fromEntries(Object.entries((n.save as SaveV3).roster).map(([id, uma]) => [id,
        n.notes.worked.some((w) => w.outfitId === id) ? { ...uma, ranks: { ...uma.ranks, foraging: { points: 160, rank: 2 as const, challenge: 0 } } } : uma])) },
    })
    const steps = NIGHT_STEPS.map((s) => (s.run === tickRanks ? { ...s, run: ranks } : s))
    const morning = runNight(queued, CONTEXT, steps)
    const row = morning.work['101']!
    expect(row.queue).toEqual([])
    expect(row.entries.map((e) => [e.startedAt, e.outputs[0], e.fromQueue])).toEqual([
      [0, { item: 'pine-log@1' }, false],
      [DAY_MS, { item: 'pine-log@3' }, true],
    ])
    // Nothing more moves during the next day.
    expect(settleLoopWork(morning, TEST_KINDS)).toEqual(morning)
  })

  it('moves nothing while the app is closed: the device\'s clock never settles work', () => {
    const save = editLoopQueue(start(farm(), '101', gather()), { outfitId: '101', add: { request: gather(), building: 'forest' } }, AT, TEST_KINDS)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-09T10:00:00Z'))
    const now = settleLoopWork(save, TEST_KINDS)
    vi.setSystemTime(new Date('2026-12-25T10:00:00Z'))
    expect(settleLoopWork(save, TEST_KINDS)).toEqual(now)
    expect(now).toEqual(save)
    expect(loopReadyWork(save).size).toBe(0)
  })
})

describe('well fed', () => {
  const fed = (save: SaveV3, id: string, days: number): SaveV3 => ({ ...save, roster: { ...save.roster, [id]: { ...save.roster[id]!, wellFed: days } } })

  it('gives a 2-day making job a quarter day a night, through acceleratedMs, and counts the days down', () => {
    const save = fed(start(farm(), '202', make(2)), '202', 2)
    const one = night(save)
    expect(one.work['202']!.entries[0]!.acceleratedMs).toBe(21_600_000)
    expect(one.roster['202']!.wellFed).toBe(1)
    const two = night(one)
    expect(two.work['202']!.entries[0]!.acceleratedMs).toBe(43_200_000)
    expect(two.roster['202']!.wellFed).toBe(0)
    expect(endsAt(two.work['202']!.entries[0]!)).toBe(1.5 * DAY_MS)
    expect(night(two).work['202']!.entries[0]!.acceleratedMs).toBe(43_200_000)
  })

  it('clamps the quarter day at the job\'s end', () => {
    // A making job with 4 hours left at tonight's start gains only those 4 hours.
    const save = fed(start(farm(), '202', make(2)), '202', 1)
    const entry = save.work['202']!.entries[0]!
    const late: SaveV3 = { ...save, calendar: { day: 2 }, work: { 202: { ...save.work['202']!, entries: [{ ...entry, seconds: [(DAY_MS + 14_400_000) / 1000] }] } } }
    const morning = night(late)
    expect(morning.work['202']!.entries[0]!.acceleratedMs).toBe(14_400_000)
    expect(loopReadyWork(morning).get('mill')).toBe(1)
  })

  it('gives a 1-day job no time: its kind plans more items instead', () => {
    const morning = night(fed(start(farm(), '101', gather()), '101', 3))
    expect(morning.work['101']!.entries[0]!.acceleratedMs).toBe(0)
    expect(morning.roster['101']!.wellFed).toBe(2)
  })
})

describe('the calendar turns', () => {
  it('turns Spring into Summer after day 12, and the year after day 48', () => {
    expect(night(farm(12))).toMatchObject({ calendar: { day: 13 }, summary: { day: 13, news: [{ kind: 'season', season: 'summer' }] } })
    expect(night(farm(48))).toMatchObject({ calendar: { day: 49 }, summary: { day: 49, news: [{ kind: 'season', season: 'spring' }] } })
    expect(night(farm(5)).summary!.news).toEqual([])
  })

  it('names a festival tomorrow and today', () => {
    expect(night(farm(8)).summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'tomorrow' }])
    expect(night(farm(9)).summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'today' }])
    expect(night(farm(46)).summary!.news).toEqual([{ kind: 'festival', festival: 'harvest-cup', when: 'tomorrow' }])
    expect(night(farm(47)).summary!.news).toEqual([{ kind: 'festival', festival: 'harvest-cup', when: 'today' }])
  })

  it('clears the day\'s chats and gifts', () => {
    const save: SaveV3 = { ...farm(), today: { chats: ['101'], gifts: ['202'] } }
    expect(night(save).today).toEqual({ chats: [], gifts: [] })
  })
})

describe('the morning summary', () => {
  it('lists work done by place, the news and the idle Umas, in section order, hiding empty sections', () => {
    const save = start(start(start(farm(12), '101', gather()), '202', make(1)), '303', gather())
    const morning = night(save)
    expect(morning.summary).toEqual({
      day: 13, bin: [], ranks: [], bonds: [],
      work: [{ kind: 'jobs', place: 'forest', jobs: 2, items: 2 }, { kind: 'jobs', place: 'mill', jobs: 1, items: 1 }],
      news: [{ kind: 'season', season: 'summer' }],
      nudges: [{ kind: 'idle', umas: ['101', '202', '303'] }],
    })
    expect(summarySections(morning.summary!)).toEqual(['work', 'news', 'nudges'])
  })

  it('is replaced each night, and has no nudge when everyone works', () => {
    const save = editLoopQueue(start(farm(3), '101', gather()), { outfitId: '101', add: { request: gather(), building: 'forest' } }, AT, TEST_KINDS)
    const busy: SaveV3 = { ...save, dorm: { ...save.dorm, home: ['101'] }, items: { wheat: [5, 0, 0, 0, 0] } }
    const morning = night(busy)
    expect(morning.summary).toMatchObject({ day: 4, work: [{ place: 'forest', jobs: 1 }], nudges: [] })
    expect(night(morning).summary).toMatchObject({ day: 5, work: [{ place: 'forest', jobs: 1 }], nudges: [{ kind: 'idle', umas: ['101'] }] })
  })
})

describe('the bin pays at night (step 1)', () => {
  /** Day `day` with salmon at ★1 and ★2 and carrots at ★1. */
  const stocked = (day: number): SaveV3 => {
    const save = farm(day)
    return { ...save, items: { ...save.items, salmon: [2, 2, 0, 0, 0], carrot: [3, 0, 0, 0, 0] } }
  }

  it('pays two stars shipped, after one is taken back, and lists them in the morning', () => {
    const shipped = takeBack(ship(ship(stocked(15), 'salmon', 1, 2), 'salmon', 2, 1), 'salmon', 1, 1) // Summer 3: fish in demand
    const morning = night(shipped)
    expect(morning.summary!.bin).toEqual([
      { kind: 'sold', id: 'salmon', stars: 1, count: 1, gold: 130, demand: true },
      { kind: 'sold', id: 'salmon', stars: 2, count: 1, gold: 165, demand: true },
    ])
    expect(summarySections(morning.summary!)[0]).toBe('bin')
    expect(morning.gold).toBe(shipped.gold + 295)
    expect(morning.farm.counts[GOLD_SHIPPED]).toBe(295)
    expect(morning.diary.shipped).toEqual({ salmon: 2 })
    expect(morning.bin).toEqual({})
    expect(morning.items.salmon).toEqual([1, 1, 0, 0, 0])
    expect(parseSaveV3(json(morning), 'save', TEST_KINDS)).toEqual(morning)
  })

  it('pays at the day it was shipped: a season\'s last night keeps its demand', () => {
    const lastOfSpring = night(ship(stocked(12), 'carrot', 1, 3))
    expect(lastOfSpring.calendar.day).toBe(13)
    expect(lastOfSpring.summary!.bin).toEqual([{ kind: 'sold', id: 'carrot', stars: 1, count: 3, gold: 210, demand: true }])
    expect(night(ship(stocked(13), 'carrot', 1, 3)).summary!.bin).toEqual([{ kind: 'sold', id: 'carrot', stars: 1, count: 3, gold: 180, demand: false }])
  })

  it('pays once: the next night\'s bin is empty and its summary has no bin', () => {
    const morning = night(ship(stocked(15), 'carrot', 1, 1))
    const next = night(morning)
    expect(next.gold).toBe(morning.gold)
    expect(next.summary!.bin).toEqual([])
  })
})

