import { describe, expect, it } from 'vitest'
import { payBuild } from '../farm/builds'
import { handsTonight, settleCrewShift } from '../farm/farmhands'
import { talentsD } from '../farm/talents'
import { crewStationTargets, crewSupplyJobs, setCrewSupplyGoal, supplyGoals } from '../farm/supply-goals'
import { workFace } from '../gathering/digs'
import { endDay } from '../night/end-day'
import { benchOpen, makeStarterRing } from '../romance/bench'
import { completeVisit, planVisit } from '../romance/long-game'
import { parseSaveV6 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, newTodayV4, type FarmSave } from '../save/v4'
import { addGoods, goodCount } from '../save/warehouse'
import { storyPackFrom } from '../story/pack'
import {
  beginTempering, deliverForge, finishTool, forgeAssistants, giveHeirloom, orderHeirloom, orderRackTool, orderTool, practiceForging, trackRackTool,
} from './orders'
import { activateForge, formalLooks, HEIRLOOM_IDS } from './state'
import { HEIRLOOMS } from './catalogue'
import { bestToolTier, toolChargesLeft, waterTargets } from './tools'

const ID = '9900001'
const PARTNER = '9900002'
const TIME = '2026-11-19T12:00:00.000Z'
const pack = storyPackFrom({
  cast: { umas: [ID, PARTNER].map(characterId => ({ characterId })) }, routes: {}, umas: {},
  town: { professions: [{ id: 'smith', name: 'Smith', at: 'cafe', off: 'sunday', partners: [ID, PARTNER] }] },
})
const dates = new Map([[ID, 2]])
const day = (save: FarmSave, at: number): FarmSave => ({ ...save, calendar: { day: at }, today: newTodayV4(), summary: null })

function spouse(): FarmSave {
  const base = newSave('forge', TIME)
  let items = base.items
  for (const piece of HEIRLOOM_IDS) for (const row of HEIRLOOMS[piece].materials) items = addGoods(items, row.id, 1, row.count)
  return {
    ...base, calendar: { day: 122 }, gold: 500000, items,
    farm: { ...base.farm, points: 21750 },
    buildings: { dorm: 1, forge: 1, mine: 1, quarry: 1, smelter: 1, cutter: 1 },
    roster: { [ID]: { ...newRosterUma(1), farmhand: 1 } },
    love: { [ID]: { ...newLove(), stage: 'spouse', ring: 1, wed: 2, house: 0 } },
    longGame: { weddings: [ID], celebrations: {}, love: { [ID]: { points: 120, trueDay: 100, pajamas: 0, anniversaries: 0, memories: [] } } },
  }
}

describe('the two Forge counters', () => {
  it('restores at Rank 3, installs tools at dawn, and opens the solo bench only after Romance 8', () => {
    const base = newSave('solo', TIME)
    const start = { ...base, gold: 3000, items: { 'pine-log': [18, 0, 0, 0, 0], 'pine-plank': [6, 0, 0, 0, 0] } as FarmSave['items'],
      farm: { ...base.farm, points: 250, counts: { 'gold-shipped': 30000 } }, roster: { [ID]: newRosterUma(1) }, love: { [ID]: newLove() } }
    const restored = endDay(payBuild(start, 'forge'), {}, TIME)
    expect(restored.buildings.forge).toBe(1)
    expect(benchOpen(restored)).toBe(false)
    const order = orderTool(restored, 'watering-can', null)
    expect(order.tools['watering-can']).toBe(1)
    expect(order.today.actions).toBe(1)
    expect(goodCount(order.items, 'pine-plank')).toBe(0)
    const playing = beginTempering(order, order.calendar.day)
    expect(() => beginTempering(playing, order.calendar.day)).toThrow()
    const finished = finishTool(playing, order.calendar.day, true)
    const dawn = endDay({ ...finished, memories: { [ID]: ['r8'] } }, {}, TIME)
    expect(dawn.forge?.installed).toMatchObject([{ tool: 'watering-can', tier: 2, finish: 'stamped' }])
    expect(benchOpen(dawn)).toBe(true)
    expect(dawn.buildings.forge).toBe(1)
    expect(makeStarterRing(dawn).ring).toBe('ring-g1')
    expect(parseSaveV6(dawn).forge).toEqual(dawn.forge)
  })

  it('uses one real Morning action and credits the smith once across settlement and reload', () => {
    const base = spouse()
    const funded = { ...base, items: addGoods(base.items, 'pine-plank', 1, 8) }
    const at = activateForge(day({ ...funded, farm: { ...funded.farm, surplusSettings: { paused: true } } }, 124))
    const chosen = Array.from({ length: 7 }, (_, i) => day(at, at.calendar.day + i))
      .find(save => forgeAssistants(save, pack).includes(ID))!
    const booked = orderTool({ ...chosen, today: { ...chosen.today, dayParts: true } }, 'hoe', pack, ID)
    expect(booked.today.forgeHelper?.id).toBe(ID)
    expect(forgeAssistants(booked, pack)).toEqual([])
    const shift = settleCrewShift(booked, talentsD, pack)
    expect(shift.today.crew?.lines.find(line => line.id === ID)).toMatchObject({ forge: 1, spent: 1 })
    expect(shift.roster[ID]?.ranks.forging.challenge).toBe(1)
    const stored = parseSaveV6(shift)
    expect(stored.today.crew?.lines[0]?.forge).toBe(1)
    const morning = endDay(stored, { story: pack }, TIME)
    expect(morning.roster[ID]?.ranks.forging.challenge).toBe(1)
    expect(morning.roster[ID]!.ranks.forging.points).toBeGreaterThan(0)
    const practiceDay = Array.from({ length: 7 }, (_, i) => day(morning, morning.calendar.day + i))
      .find(save => forgeAssistants(save, pack).includes(ID))!
    const practice = practiceForging(practiceDay, 2, ID, pack)
    expect(practice.today.actions).toBe(practiceDay.today.actions)
    expect(goodCount(practice.items, 'pine-plank')).toBe(0)
  })
})

describe('Tool Rack', () => {
  it('installs separate copies, upgrades one of them, and equips at most one per worker and shift', () => {
    let save = spouse()
    save = { ...save, items: addGoods(addGoods(save.items, 'pine-plank', 1, 32), 'iron-ingot', 1, 8) }
    for (let n = 0; n < 2; n++) {
      const order = orderRackTool(save, 'pick', 1, null)
      save = deliverForge(parseSaveV6(day(order, save.calendar.day + 1)))
    }
    const upgrade = orderRackTool(save, 'pick', 2, null)
    save = deliverForge(day(upgrade, save.calendar.day + 1))
    expect(save.tools.pick).toBe(1)
    expect(bestToolTier(save, 'pick')).toBe(3)
    expect(save.forge?.rack?.map(copy => copy.tier)).toEqual([3, 2])
    expect(toolChargesLeft(save, 'pick')).toBe(3)
    const task = { kind: 'mine', dig: 'mine' } as const
    save = {
      ...save, roster: {
        [ID]: { ...save.roster[ID]!, tasks: [task] },
        [PARTNER]: { ...newRosterUma(1), farmhand: 1, tasks: [task] },
      },
      love: { ...save.love, [PARTNER]: newLove() },
    }
    const both = Array.from({ length: 7 }, (_, index) => day(save, save.calendar.day + index))
      .find(at => handsTonight(at, at, talentsD, null).lines.length === 2)!
    const manual = workFace(both, 'mine').save
    const shift = settleCrewShift(manual, talentsD, null)
    expect(shift.today.crew?.jobs?.filter(job => job.key === 'mine:mine').map(job => job.rackSlot)).toEqual([0, 1])
    expect(shift.today.rackCharges).toEqual({ 0: 2, 1: 1 })
    expect(parseSaveV6(shift).today).toEqual(shift.today)
  })

  it('keeps tracking separate from crew priorities and restores explicit station targets when paused', () => {
    const save = trackRackTool(spouse(), 'watering-can', 1)
    const goal = supplyGoals(save)[0]!
    expect(goal.key).toBe('tool:watering-can:2')
    expect(crewStationTargets(save, 'sawmill')).toBeUndefined()
    expect(crewSupplyJobs(save)).toEqual([])
    const assigned = setCrewSupplyGoal(save, goal.key)
    expect(crewStationTargets(assigned, 'sawmill')).toEqual([{ output: 'pine-plank', target: 6 }])
    expect(crewSupplyJobs(assigned)).toContainEqual({ kind: 'chop', area: 'woods' })
    expect(parseSaveV6(assigned).forge?.crewGoal).toBe(goal.key)
    expect(crewStationTargets(setCrewSupplyGoal(assigned, goal.key), 'sawmill')).toBeUndefined()
    expect(assigned.farm.stationPlans).toBe(save.farm.stationPlans)
  })
})

describe('heirlooms and the wardrobe', () => {
  it('treats all four as separate paid orders and keeps higher looks out until each piece is gifted', () => {
    const base = spouse()
    let save: FarmSave = activateForge({ ...base, longGame: { ...base.longGame!, love: {} } })
    save = { ...save, longGame: base.longGame }
    expect(formalLooks(save, ID)).toEqual([1])
    expect(() => orderHeirloom(save, ID, 'earrings', false, pack)).toThrow('Artwork coming.')
    const queued = orderHeirloom(orderHeirloom(save, ID, 'necklace', true, pack), ID, 'brooch', true, pack)
    expect(() => orderHeirloom(queued, ID, 'earrings', true, pack)).toThrow('orders are full')
    save = deliverForge(parseSaveV6(day(queued, 127)))
    expect(formalLooks(save, ID)).toEqual([1])
    save = giveHeirloom(giveHeirloom(save, ID, 'necklace'), ID, 'brooch')
    expect(formalLooks(save, ID)).toEqual([1, 3, 5])
    const preview = planVisit({ ...save, calendar: { day: 122 } }, pack, [ID], 'birthday', () => false, dates, 2)
    expect(preview).toBeNull()
    const anniversary = planVisit(save, pack, [ID], 'anniversary', () => false, dates, 5)!
    const played = completeVisit(save, pack, anniversary, 0, () => false, dates)
    expect(played.longGame?.love[ID]?.memories[0]?.looks).toEqual([5])
    save = orderHeirloom(orderHeirloom(save, ID, 'earrings', true, pack), ID, 'bracelet', true, pack)
    save = giveHeirloom(giveHeirloom(deliverForge(day(save, 131)), ID, 'earrings'), ID, 'bracelet')
    expect(formalLooks(parseSaveV6(save), ID)).toEqual([1, 2, 3, 4, 5])
    expect(save.gold).toBe(276000)
    expect(() => giveHeirloom(save, ID, 'earrings')).toThrow()
  })

  it('grandfathers previously qualified looks while future point gains use heirlooms', () => {
    const base = spouse()
    const heart = { ...base.longGame!.love[ID]!, points: 48 }
    const old = { ...base, longGame: { ...base.longGame!, love: { [ID]: heart } } }
    const migrated = activateForge(old)
    const after = { ...migrated, longGame: { ...old.longGame, love: { [ID]: { ...heart, points: 120 } } } }
    expect(formalLooks(after, ID)).toEqual([1, 2, 3])
    expect(benchOpen(migrated)).toBe(true)
  })
})

describe('farm-wide tools', () => {
  it('waters by eligible rows and shares the Hammer quota over reached floors without moving the stairs', () => {
    const tiles = [0, 2, 4, 8, 10, 12, 16, 20, 22]
    expect(waterTargets(tiles, 3, 6, 8)).toEqual([0, 2, 4])
    expect(waterTargets(tiles, 4, 6, 8)).toEqual([0, 2, 4, 8, 10, 12])
    const base = spouse()
    let save = { ...base, places: { ...base.places, quarry: { deepest: 29, stairs: 2 } }, tools: { ...base.tools, hammer: 5 as const } }
    const faces = [22, 28, 22, 28, 22].map(floor => {
      const result = workFace(save, 'quarry', floor)
      save = result.save
      return result.face
    })
    expect(faces.filter(face => face.bonus)).toHaveLength(4)
    expect(save.places.quarry).toEqual({ deepest: 29, stairs: 2 })
    expect(save.today.hauls?.quarry).toBe(5)
    expect(() => workFace(save, 'quarry', 30)).toThrow('reached floor')
  })
})
