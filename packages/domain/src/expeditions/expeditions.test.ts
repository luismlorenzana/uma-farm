import { describe, expect, it } from 'vitest'
import { assistantLock, staffBlock } from '../kitchen/kitchen'
import { cookLock } from '../kitchen/contest'
import { FESTIVALS } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { handsWorking, setTasks, settleCrewShift } from '../farm/farmhands'
import { talentsD } from '../farm/talents'
import { starPrice } from '../goods/prices'
import { goodOf } from '../goods/ids'
import { runNight } from '../night/end-day'
import { occasionPlayed, playOccasion } from '../romance/occasions'
import { parseSaveV6 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, pairKey, type FarmSave } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { storyPackFrom } from '../story/pack'
import { withOccasions } from '../story/occasions.fixture'
import { onFarmToday, townDay, whereYouMeet, worksOn } from '../town/town'
import { expeditionBlock, expeditionCoverage, expeditionPower, expeditionResult, EXPEDITION_REGIONS, returnExpeditions, sendExpedition } from './expeditions'
import { expeditionReturnLine } from './return-lines'
import { awayOn } from './presence'
import { availableDishes } from './stock'

const AT = '2026-11-17T12:00:00.000Z'
const PARTY = Array.from({ length: 12 }, (_, n) => String(9000001 + n))
const [A, B] = PARTY as [string, string, ...string[]]
const PACK = castPack(PARTY)
const DISH = 'dish-vegetables-1'
const STOCK = DISH + '@4'

function farm(rank = 10, day = 1): FarmSave {
  const fresh = newSave('expeditions-test', AT)
  return {
    ...fresh, calendar: { day }, gold: 50000, farm: { ...fresh.farm, points: FARM_RANK_POINTS[rank - 1]! },
    today: { ...fresh.today, town: true },
    buildings: { ...fresh.buildings, expeditions: 1, kitchen: 1 },
    items: addGoods(fresh.items, DISH, 4, 2),
    roster: Object.fromEntries(PARTY.map((id) => [id, { ...newRosterUma(1), farmhand: 1 }])),
    love: Object.fromEntries(PARTY.map((id) => [id, { ...newLove(), level: 3 }])),
  }
}

describe('the expedition post', () => {
  it('keeps an absent worker out of the morning shift and counts her return at dawn', () => {
    const departure = sendExpedition(setTasks(farm(7, 2), A, [{ kind: 'fish', spot: 'pond' }]), 'echo-cave', [A], [])
    const shift = (save: FarmSave) => settleCrewShift({ ...save, today: { ...save.today, actions: 5 } }, talentsD, null)
    const first = shift(departure)
    expect(first.today.crew!.lines.some(line => line.id === A)).toBe(true)
    const away = shift(runNight(first, {}))
    expect(away.today.crew!.lines.some(line => line.id === A)).toBe(false)
    const returned = runNight(away, {})
    expect(returned.expeditionLog?.at(-1)?.party).toEqual([A])
    expect(shift(returned).today.crew!.lines.some(line => line.id === A)).toBe(true)
  })
  it('projects the lightest farm day using the actual shifts and other booked parties', () => {
    const pack = { ...PACK, town: { professions: [{ id: 'baker', name: 'Baker', at: 'cafe', off: 'wednesday' as const, partners: [A, B] as const }] } }
    const start = farm(7, 4)
    const booked = sendExpedition(start, 'echo-cave', [PARTY[2]!], [])
    const scheduled = handsWorking(booked, pack, 5)
    expect(scheduled).toContain(A)
    expect(scheduled).not.toContain(B)
    expect(expeditionCoverage(booked, 'echo-cave', [A, B], pack)).toEqual({ lost: 1, fewest: scheduled.length - 1 })
    expect(handsWorking(booked, pack, 6)).toEqual(handsWorking(start, pack, 6))
  })
  it('books once, reserves dishes, charges that night, and leaves after the shift', () => {
    const fresh = farm(7, 2)
    const save = sendExpedition({
      ...fresh, farm: { ...fresh.farm, pantry: [{ day: 2, stars: 1, meals: 5 }] },
      roster: { [A]: fresh.roster[A]!, [B]: fresh.roster[B]! }, love: { [A]: fresh.love[A]!, [B]: fresh.love[B]! },
    }, 'echo-cave', [A, B], [STOCK, STOCK])
    expect(save.today.actions).toBe(1)
    expect(save.expeditions[0]).toEqual({ region: 'echo-cave', party: [A, B], supplies: [STOCK, STOCK], left: 2, back: 4 })
    expect(expeditionPower(save, [A, B], [STOCK, STOCK])).toBe(48)
    expect(save.items[DISH]?.[3]).toBe(2)
    expect(availableDishes(save, STOCK)).toBe(0)
    expect(staffBlock(save, [STOCK])).toMatch(/not enough/i)
    expect(assistantLock(save, A)).toMatch(/expedition/)
    expect(cookLock(save, A)).toMatch(/expedition/)
    expect(worksOn(save, null, A)).toBe(true)
    const morning = runNight(save, {})
    expect(morning.items[DISH]?.[3] ?? 0).toBe(0)
    expect(morning.farm.pantry).toEqual([])
    expect(morning.summary?.money).toContainEqual({ kind: 'pantry', meals: 5, fed: 0, spoiled: 0 })
    expect(morning.summary?.money?.find((m) => m.kind === 'takeout')).toMatchObject({ meals: 5, due: 75 })
    expect(morning.summary?.work.filter((w) => w.kind === 'farmhand')).toHaveLength(2)
    expect(handsWorking(morning, PACK)).toEqual([])
    expect(onFarmToday(morning, PACK, A)).toBe(false)
    expect(townDay(morning, PACK).where.has(A)).toBe(false)
    expect(whereYouMeet(morning, PACK, A)).toEqual({ here: false, farm: false, at: null })
    expect(expeditionBlock({ ...morning, today: { ...morning.today, town: true }, farm: { ...morning.farm, points: 14750 } }, 'echo-cave', [A], [])).toMatch(/Already/)
    const back = runNight(morning, {})
    expect(back.summary?.money?.find((m) => m.kind === 'takeout')).toMatchObject({ meals: 2, due: 30 })
    expect(back.summary?.work.find((w) => w.kind === 'expedition')).toMatchObject({ result: 'retreat', region: 'echo-cave' })
    expect(back.expeditions).toEqual([])
    expect(awayOn(back, A, 4)).toBeUndefined()
    expect(parseSaveV6(JSON.parse(JSON.stringify(save)))).toEqual(save)
    expect(parseSaveV6(JSON.parse(JSON.stringify(back)))).toEqual(back)
    expect(back.account.updatedAt).toBe(AT)
  })

  it('checks the building, region, town, party, stock, and cooking commitments', () => {
    const save = farm(7)
    expect(expeditionBlock({ ...save, buildings: {} }, 'echo-cave', [A], [])).toMatch(/Build/)
    expect(expeditionBlock({ ...save, today: { ...save.today, town: false } }, 'echo-cave', [A], [])).toMatch(/town/)
    expect(expeditionBlock(save, 'hilltop-track', [A], [])).toMatch(/Rank 8/)
    expect(expeditionBlock(save, 'echo-cave', [A, A], [])).toMatch(/different/)
    expect(expeditionBlock(save, 'echo-cave', ['999'], [])).toMatch(/Only farmhands/)
    expect(expeditionBlock(save, 'echo-cave', [A], [STOCK, STOCK, STOCK])).toMatch(/Not enough/)
    expect(expeditionBlock(save, 'echo-cave', [A], ['carrot@2'])).toMatch(/dishes/)
    for (const job of ['assistant', 'cook'] as const) {
      expect(expeditionBlock({ ...save, today: { ...save.today, [job]: A } }, 'echo-cave', [A], [])).toMatch(/Cooking/)
    }
    expect(expeditionBlock({ ...save, today: { ...save.today, actions: 10 } }, 'echo-cave', [A], [])).toMatch(/No actions/)
    for (const [rank, slots] of [[7, 1], [8, 2], [9, 3], [10, 3]] as const) {
      let next = farm(rank)
      for (const id of PARTY.slice(0, slots)) next = sendExpedition(next, 'echo-cave', [id], [])
      expect(expeditionBlock(next, 'echo-cave', [PARTY[slots]!], [])).toBe('All party slots are full.')
    }
  })

  it.each([
    ['old-fort-ruins', 'great', 36, 40, 4],
    ['echo-cave', 'success', 24, 30, 4],
    ['echo-cave', 'retreat', 6, 20, 2],
  ] as const)('returns loot, rank points, bonds, Diary credit and work for %s / %s', (region, result, count, points, members) => {
    const party = PARTY.slice(0, members)
    const sent = sendExpedition(farm(), region, party, [])
    const morning = runNight(runNight(sent, { story: PACK }), { story: PACK })
    const log = morning.expeditionLog?.[0]!
    expect(log.result).toBe(result)
    expect(Object.values(log.loot).reduce((a, b) => a + b, 0)).toBe(count)
    expect(morning.summary?.work).toContainEqual({ kind: 'expedition', ...log })
    for (const [key, n] of Object.entries(log.loot)) {
      const [id, stars] = key.split('@')
      expect(morning.items[id!]?.[Number(stars) - 1]).toBe(n)
      expect(starPrice(id!, Number(stars))).toBeGreaterThan(0)
      expect(goodOf(id!)?.grade).toBeGreaterThanOrEqual(EXPEDITION_REGIONS[region].tiers[0])
      expect(goodOf(id!)?.grade).toBeLessThanOrEqual(EXPEDITION_REGIONS[region].tiers[1])
    }
    expect(morning.roster[A]?.ranks.expeditions).toMatchObject({ points, challenge: 1 })
    expect(morning.bonds[pairKey(A, B)]).toBe(30)
    for (const id of PARTY) {
      expect(morning.library?.[id]?.recent ?? []).toEqual(party.includes(id) ? [[log.back, `expedition:${region}:${result}`, null]] : [])
    }
    expect(returnExpeditions(morning, morning.calendar.day).save).toBe(morning)
  })

  it('uses the roll boundaries and makes the tuned progression achievable', () => {
    expect(expeditionResult(100, 100, 0.499)).toBe('retreat')
    expect(expeditionResult(100, 100, 0.5)).toBe('success')
    expect(expeditionResult(125, 100, 0.5)).toBe('great')
    expect(expeditionResult(64, EXPEDITION_REGIONS['old-fort-ruins'].need, 0)).toBe('great')
    expect(expeditionResult(64, EXPEDITION_REGIONS['echo-cave'].need, 0)).toBe('success')
    expect(expeditionResult(144, EXPEDITION_REGIONS['hilltop-track'].need, 0)).toBe('success')
    expect(expeditionResult(224, EXPEDITION_REGIONS['sunken-temple'].need, 0)).toBe('success')
    expect(expeditionResult(248, EXPEDITION_REGIONS['sky-ruins'].need, 0.99)).toBe('retreat')
    expect(expeditionResult(248 + 8 * 8, EXPEDITION_REGIONS['sky-ruins'].need, 0.5)).toBe('success')
  })

  it('plays a festival occasion while she is away, and reads a return line from the pack', () => {
    const pack = storyPackFrom(withOccasions())
    const days = { festivals: FESTIVALS, birthdays: new Map<string, number>() }
    const away = runNight(sendExpedition(farm(7, 18), 'echo-cave', [A], []), { story: pack })
    expect(awayOn(away, A, 19)).toBeDefined()
    expect(occasionPlayed(playOccasion(away, pack, A, days, 'flower-show'), A, 'flower-show')).toBe(true)
    const log = runNight(away, { story: pack }).expeditionLog![0]!
    const line = 'An invented return line.'
    const written = storyPackFrom({ ...withOccasions(), umas: { [A]: { characterId: A, expeditionReturns: { [log.result]: [line] } } } })
    expect(expeditionReturnLine(written, log)).toBe(line)
    expect(expeditionReturnLine(null, log)).toBeTruthy()
  })
})
