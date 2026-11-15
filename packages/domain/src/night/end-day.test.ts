// End the day: the nine steps in order, seeded and replayable, the field's watered tiles growing, the stations' loads
// done, the calendar turning with the day's actions cleared, the summary, and one stamp a night. Invented ids; no story
// pack, so the romance's steps run without one.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { actionsLeft, goToTown } from '../farm/actions'
import { plantTile, tillTile, waterTile } from '../fields/fields'
import { forage } from '../gathering/hauls'
import { startLoad } from '../gathering/stations'
import { GOLD_SHIPPED, ship, takeBack } from '../save/bin'
import { parseSaveV5, SAVE_V5_KEYS } from '../save/parse-v4'
import { fieldTiles, newLove, newRosterUma, newSave, newTodayV4, START_CLEAR, type SaveV4 } from '../save/v4'
import { emptyNotes, endDay, NIGHT_STEPS, runNight, type NightContext } from './end-day'
import { summarySections } from './summary'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const CONTEXT: NightContext = {}
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Three Umas home on `day`, with five Wheat, the Mill built. */
function farm(day = 1): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, love: { 101: newLove(), 202: newLove(), 303: newLove() },
    dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, items: { ...save.items, wheat: [5, 0, 0, 0, 0] }, buildings: { ...save.buildings, mill: 1 },
  }
}
/** A day of work: a tile tilled, planted and watered, a forage, a load at the Mill. */
function worked(save: SaveV4): SaveV4 {
  const tile = START_CLEAR[0]!
  return startLoad(forage(waterTile(plantTile(tillTile(save, tile), tile, 'seed-carrot'), tile), 'woods').save, 'mill', 'wheat-flour@1', 5)
}
const night = (save: SaveV4, now = LATER) => endDay(save, CONTEXT, now)

afterEach(() => vi.useRealTimers())

describe('the night', () => {
  it('runs nine steps in order, each a named function', () => {
    expect(NIGHT_STEPS.map((s) => `${s.step} ${s.name}`)).toEqual([
      '1 noteTonight', '1 payTheBin', '2 farmhandsWork', '2 theFarmEats', '2 settleTheAccounts', '2 growCrops', '3 tendAnimals', '3 ranchNightChores', '4 finishTheLoads', '4 nightExtras', '4 nightChores', '5 resetWorkshops',
      '6 tickRanks', '6 tickBonds', '6 payLine', '6 shareTheHouses', '6 levelAtNight', '6 countWellFed', '7 witherCrops', '7 turnCalendar',
      '8 raiseBuildings', '8 settleDorm', '8 checkGoals', '8 unlockTownNotes', '8 openRingBench', '8 householdMilestones',
      '9 serveTheReception', '9 houseMorningStep', '9 moveInRooms', '9 vowsMorning', '9 heartsMorning', '9 morningItems', '9 drawInvitations', '9 noteTheFed', '9 buildSummary',
    ])
  })

  it('gives the same morning from the same save, every time and on every device, and keeps no random state', () => {
    const save = worked(farm())
    const once = night(save)
    expect(night(json(save))).toEqual(once)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    expect(night(save)).toEqual(once)
    expect(Object.keys(once).sort()).toEqual([...SAVE_V5_KEYS].sort())
    expect(parseSaveV5(json(once))).toEqual(once)
  })

  it('stamps updatedAt once, with real time, after the ninth step', () => {
    const save = worked(farm())
    for (const step of NIGHT_STEPS) {
      const after = step.run({ before: save, save, context: CONTEXT, notes: emptyNotes() })
      expect(after.save.account, step.name).toEqual(save.account)
    }
    expect(runNight(save, CONTEXT).account).toEqual(save.account)
    expect(night(save, LATER).account).toEqual({ ...save.account, updatedAt: LATER })
  })

  it('wakes to a full day of actions, the watered tile grown and the load done', () => {
    const save = worked(farm())
    expect(actionsLeft(save)).toBe(5)
    const morning = night(save)
    expect(actionsLeft(morning)).toBe(10)
    expect(morning.today).toEqual(newTodayV4())
    expect(fieldTiles(morning)[START_CLEAR[0]!]).toMatchObject({ crop: 'carrot', growth: 1, watered: false })
    expect(morning.items['wheat-flour']).toEqual([5, 0, 0, 0, 0])
    expect(morning.loads).toEqual({})
    // Nobody but the farmer works the farm yet: no Uma earns rank points.
    for (const uma of Object.values(morning.roster)) expect(Object.values(uma.ranks).every((r) => r.points === 0)).toBe(true)
  })
})

describe('the calendar turns', () => {
  it('turns Spring into Summer after day 12, and the year after day 48', () => {
    expect(night(farm(12))).toMatchObject({ calendar: { day: 13 }, summary: { day: 13, news: [{ kind: 'season', season: 'summer' }] } })
    expect(night(farm(48))).toMatchObject({ calendar: { day: 49 }, summary: { day: 49, news: [{ kind: 'season', season: 'spring' }, { kind: 'new-year', when: 'today' }] } })
    expect(night(farm(5)).summary!.news).toEqual([])
  })

  it('names a festival tomorrow and today', () => {
    expect(night(farm(8)).summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'tomorrow' }])
    expect(night(farm(9)).summary!.news).toEqual([{ kind: 'festival', festival: 'flower-show', when: 'today' }])
    expect(night(farm(46)).summary!.news).toEqual([{ kind: 'festival', festival: 'harvest-cup', when: 'tomorrow' }])
    expect(night(farm(47)).summary!.news).toEqual([{ kind: 'festival', festival: 'harvest-cup', when: 'today' }, { kind: 'new-year', when: 'tomorrow' }])
  })

  it('names New Year’s the day before and on the day, and keeps the lines through a save', () => {
    const eve = night(farm(47))
    const morning = night(eve)
    expect(morning.summary!.news).toEqual([{ kind: 'season', season: 'spring' }, { kind: 'new-year', when: 'today' }])
    expect(parseSaveV5(JSON.parse(JSON.stringify(eve)))).toEqual(eve)
    expect(parseSaveV5(JSON.parse(JSON.stringify(morning)))).toEqual(morning)
  })

  it('clears the whole of today: the actions, the town, chats, gifts and the rest', () => {
    const save: SaveV4 = { ...goToTown(farm()), today: { ...goToTown(farm()).today, chats: ['101'], gifts: ['202'], praised: ['101'], gathered: ['woods'] } }
    expect(night(save).today).toEqual(newTodayV4())
  })
})

describe('the morning summary', () => {
  it('lists the loads and the field\'s growth, the news and the tiles to water, in section order, hiding empty sections', () => {
    const morning = night(worked(farm(12)))
    expect(morning.summary).toEqual({
      // Three Umas home and the Mill: 45g of upkeep a night, after the bin; four mouths and nothing cooked: 120g of takeout.
      day: 13, bin: [], money: [{ kind: 'takeout', meals: 8, paid: 120, due: 120 }, { kind: 'upkeep', paid: 45, due: 45 }], ranks: [], hearts: [],
      // Spring's last night: the watered Carrot grows a stage, then withers out of season.
      work: [{ kind: 'load', station: 'mill', item: 'wheat-flour@1', count: 5 }, { kind: 'grew', tiles: 1, ripe: 0 }, { kind: 'withered', crop: 'carrot', tiles: 1 }],
      news: [{ kind: 'season', season: 'summer' }],
      nudges: [],
    })
    const spring = night(worked(farm(3)))
    expect(spring.summary).toMatchObject({ work: [{ kind: 'load' }, { kind: 'grew', tiles: 1, ripe: 0 }], nudges: [{ kind: 'water', tiles: 1 }] })
    expect(summarySections(spring.summary!)).toEqual(['money', 'work', 'nudges'])
  })

  it('says a new story release first in New today, by its number only, when the device brings one', () => {
    const save = farm(12)
    const morning = endDay(save, { ...CONTEXT, release: { number: 3 } }, LATER)
    expect(morning.summary!.news).toEqual([{ kind: 'story', number: 3 }, { kind: 'season', season: 'summer' }])
    expect(parseSaveV5(json(morning)).summary).toEqual(morning.summary)
    expect(endDay(save, { ...CONTEXT, release: null }, LATER).summary!.news).toEqual([{ kind: 'season', season: 'summer' }])
    expect(night(morning).summary!.news).toEqual([])
  })
})

describe('the bin pays at night (step 1)', () => {
  /** Day `day` with salmon at ★1 and ★2 and carrots at ★1. */
  const stocked = (day: number): SaveV4 => {
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
    // The bin's 295g, less the night's takeout (four mouths, 120g) and upkeep (three Umas home and the Mill).
    expect(morning.gold).toBe(shipped.gold + 295 - 120 - 45)
    expect(morning.farm.income).toEqual([295])
    expect(morning.farm.counts[GOLD_SHIPPED]).toBe(295)
    expect(morning.diary.shipped).toEqual({ salmon: 2 })
    expect(morning.bin).toEqual({})
    expect(morning.items.salmon).toEqual([1, 1, 0, 0, 0])
    expect(parseSaveV5(json(morning))).toEqual(morning)
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
    expect(next.gold).toBe(morning.gold - 120 - 45)
    expect(next.summary!.bin).toEqual([])
    expect(next.farm.income).toEqual([60, 0])
  })
})
