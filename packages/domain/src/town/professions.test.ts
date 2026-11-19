import { describe, expect, it } from 'vitest'
import { goToTown } from '../farm/actions'
import { dateOf, DAYS_PER_YEAR, SEASONS } from '../farm/calendar'
import { setTasks } from '../farm/farmhands'
import { handsAtTable, umasAtTable } from '../farm/food'
import { setFieldPlan } from '../fields/production'
import { cropBaseGrade, seedId, type CropId } from '../goods/ids'
import { cookLock } from '../kitchen/contest'
import { assistantLock } from '../kitchen/kitchen'
import { runNight } from '../night/end-day'
import { buyAnimal, buyFodder } from '../ranch/ranch'
import { homeTonight, kindsNow } from '../romance/evening'
import { playEvent } from '../romance/events'
import { inviteToWork, mealEaters } from '../romance/loop'
import { finishArrival } from '../romance/love'
import { introduce } from '../romance/meeting'
import { GOLD_SHIPPED } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { bareTile, newLove, newRosterUma, newSave, START_CLEAR, type FarmSave, type FarmTask } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { LAUNCH_CAST, withLaunchProfessions } from '../story/launch'
import { readStoryPack, storyPackFrom } from '../story/pack'
import { eventOf, townOf } from '../story/placeholders'
import { onDuty, professionOf, professionShift, WEEKDAYS, weekdayOf } from './professions'
import { farmDaysIn, onFarmToday, townDay, townLineOf, townsfolk, whereYouMeet, worksOn } from './town'

const AT = '2026-11-19T12:00:00.000Z'
const IDS = Array.from({ length: 50 }, (_, i) => String(9700001 + i))
const [ONE, TWO] = IDS as [string, string, ...string[]]
const TILES = START_CLEAR.slice(0, 4)
const CROPS = ['carrot', 'tomato', 'wheat', 'oats'] as const satisfies readonly CropId[]
const jobs = Array.from({ length: 25 }, (_, i) => ({
  id: `profession-${i + 1}`, name: i === 0 ? 'Grocer' : `Profession ${i + 1}`,
  at: i === 0 ? 'store' : 'cafe', off: WEEKDAYS[i % 7]!,
  partners: [IDS[i * 2]!, IDS[i * 2 + 1]!],
  ...(i === 0 ? { role: 'marta-quill' } : {}),
}))
const FILES = {
  cast: { umas: IDS.map(characterId => ({ characterId, ...(characterId === ONE ? { freeAt: 'library' } : {}) })) },
  town: { people: [{ characterId: '9000998', game: 'hollis-pryor' }, { characterId: TWO, game: 'marta-quill' }], professions: jobs },
  routes: {}, umas: { [ONE]: { characterId: ONE, townLines: ['Good morning, {address}.'] } },
}
const PACK = storyPackFrom(FILES)

describe('town professions', () => {
  it('installs 25 staggered pairs from the normal launch overlay and preserves a valid authored plan', () => {
    const pack = withLaunchProfessions(castPack(LAUNCH_CAST))
    const professions = pack.town!.professions!
    expect(professions).toHaveLength(25)
    expect(new Set(professions.flatMap(job => job.partners))).toEqual(new Set(LAUNCH_CAST))
    for (const day of WEEKDAYS) expect([3, 4]).toContain(professions.filter(job => job.off === day).length)
    const authored = { ...pack, town: { professions: professions.map(job => ({ ...job, name: 'Custom ' + job.name })) } }
    expect(withLaunchProfessions(authored)).toBe(authored)
    const incomplete = { ...pack, town: { professions: professions.slice(0, -1) } }
    expect(withLaunchProfessions(incomplete).town?.professions).toEqual(professions)
  })

  it('keeps profession staff romanceable and rejects a duplicated or unknown partner as one overlay', () => {
    expect(PACK.town?.professions).toHaveLength(25)
    expect(townOf(PACK).people.map(p => p.role)).toEqual(['hollis-pryor'])
    expect(townsfolk(PACK)).toContain(TWO)
    for (const bad of [ONE, '9000997']) {
      const read = readStoryPack({ ...FILES, town: { ...FILES.town, professions: jobs.map((job, i) =>
        i === 1 ? { ...job, partners: [bad, IDS[3]!] } : job) } })
      expect(read.errors.some(error => error.includes('professions'))).toBe(true)
      expect(read.pack.town?.professions).toBeUndefined()
    }
  })

  it('opens the counter on actual duty, uses the free-day outing and lets the farmer meet and hire its worker', () => {
    const base = { ...newSave('weekly-meeting', AT), calendar: { day: 2 }, farmer: { name: 'Robin' } }
    expect(onDuty(PACK, base, 1, 'marta-quill')).toBeNull()
    expect(onDuty(PACK, base, 2, 'marta-quill')).toBe(ONE)
    const trip = { left: 1, back: 4, party: [ONE] } as FarmSave['expeditions'][number]
    expect(onDuty(PACK, { expeditions: [trip] }, 2, 'marta-quill')).toBeNull()
    expect(onDuty(PACK, { expeditions: [trip] }, 4, 'marta-quill')).toBe(ONE)
    expect(townDay(base, PACK, 1).where.get(ONE)).toBe('library')
    expect(whereYouMeet(base, PACK, ONE)).toMatchObject({ at: 'store', here: false })
    const met = introduce(goToTown(base), PACK, ONE)
    const seen = finishArrival(met, ONE, { choice: 30, flags: [] })
    const hired = inviteToWork({ ...seen, love: { ...seen.love, [ONE]: { ...seen.love[ONE]!, level: 3 } } }, ONE)
    expect(worksOn(hired, PACK, ONE, 2)).toBe(false)
    expect(worksOn(hired, PACK, ONE, 5)).toBe(true)
    expect(townLineOf(hired, PACK, ONE)).toBe('Good morning, {farmer}.')
  })
})

const taskList: FarmTask[] = [
  { kind: 'water', tiles: [...TILES] }, { kind: 'care', home: 'coop' },
  { kind: 'harvest', tiles: [...TILES] }, { kind: 'plant', tiles: [...TILES] },
]

describe('a full year with staggered farm shifts', () => {
  it.each([[10, 4, 5], [20, 8, 9], [50, 21, 22]] as const)
    ('runs %i farmhands and preserves both partners’ shifts after their weddings', async (size, min, max) => {
      const ids = IDS.slice(0, size)
      const base = newSave(`weekly-${size}`, AT)
      let save: FarmSave = {
        ...base, farmer: { name: 'Robin' }, gold: 25_000,
        buildings: { ...base.buildings, coop: 1 }, calendar: { day: 1 },
        farm: { ...base.farm, points: 6250, counts: { [GOLD_SHIPPED]: 625000 } },
        fields: { plots: [{ tiles: base.fields.plots[0]!.tiles.map((tile, i) => TILES.includes(i) ? bareTile('tilled') : tile) }] },
        roster: Object.fromEntries(ids.map(id => [id, { ...newRosterUma(1), farmhand: 1, practice: { water: 300, care: 300 } }])),
        love: Object.fromEntries(ids.map(id => [id, newLove()])), arrivals: [...ids],
      }
      save = buyAnimal(goToTown(save), 'chicken').save
      save = buyFodder(save, 60)
      for (const [i, crop] of CROPS.entries()) {
        save = { ...save, items: addGoods(save.items, seedId(crop), 1, 25) }
        save = setFieldPlan(save, 0, 0, SEASONS[i]!, { crop, grade: cropBaseGrade(crop), harvestNext: false })
      }
      for (const [i, id] of ids.entries()) save = setTasks(save, id, i < 6 ? taskList : [{ kind: 'forage', area: 'woods' }])

      const before = save
      for (const id of [ONE, TWO]) {
        const wedding = await eventOf(PACK, id, 'wedding')
        const ready = { ...save, love: { ...save.love, [id]: { ...save.love[id]!, stage: 'wedding' as const, level: 10, ring: 3 } } }
        save = playEvent(ready, PACK, id, {
          event: wedding, picks: wedding.steps.flatMap(step => 'choice' in step ? [0] : []), plays: [], place: 'chapel-bell', reception: null,
        }).save
        expect(save.love[id]).toMatchObject({ stage: 'spouse', house: 0, wed: 1 })
      }
      expect(professionOf(PACK, ONE)?.town).toEqual(['tuesday', 'wednesday', 'thursday'])
      expect(townLineOf(save, PACK, ONE)).toBe('Good morning, husband.')
      const seenWorkers = new Set<number>()
      const work = { watered: 0, care: 0, harvested: 0 }

      for (let day = 1; day <= DAYS_PER_YEAR; day++) {
        expect(save.calendar.day).toBe(day)
        const active = ids.filter(id => worksOn(save, PACK, id))
        expect(active).toEqual(ids.filter(id => worksOn(before, PACK, id, day)))
        seenWorkers.add(active.length)
        const town = townDay(save, PACK)
        expect(ids.filter(id => town.by.get(id) === 'job')).toHaveLength(active.length)
        for (const job of jobs.slice(0, size / 2)) {
          const scheduled = job.partners.filter(id => town.by.get(id) === 'job')
          expect(scheduled).toHaveLength(job.off === weekdayOf(day) ? 0 : 1)
        }
        const wifeShift = professionShift(PACK, ONE, day)
        if (wifeShift === 'town') {
          expect(onFarmToday(save, PACK, ONE)).toBe(false)
          expect(whereYouMeet(save, PACK, ONE).at).toBe('store')
          expect(assistantLock(save, ONE, PACK)).not.toBeNull()
          expect(cookLock(save, ONE, PACK)).toBe('She has no farm shift today.')
        } else if (wifeShift === 'off') {
          expect(whereYouMeet(save, PACK, ONE).at).toBe('library')
          expect(worksOn(save, PACK, ONE)).toBe(false)
          expect(onFarmToday(save, PACK, TWO)).toBe(true)
          expect(worksOn(save, PACK, TWO)).toBe(false)
        }
        const table = new Set([...active, ONE, TWO])
        expect(new Set(umasAtTable(save, handsAtTable(save, PACK)))).toEqual(table)
        expect(new Set(mealEaters(save, PACK))).toEqual(table)
        for (const id of [ONE, TWO]) {
          expect(homeTonight(save, id)).toBe(true)
          expect(kindsNow(save, PACK, id)).toContain('walk')
        }
        save = runNight(save, { story: PACK })
        const lines = save.summary!.work.filter(line => line.kind === 'farmhand')
        expect(lines.map(line => line.id).sort()).toEqual([...active].sort())
        for (const line of lines) {
          work.watered += line.done.water ?? 0
          work.care += line.done.care ?? 0
          work.harvested += line.done.harvest ?? 0
        }
      }
      expect([...seenWorkers].sort((a, b) => a - b)).toEqual([min, max])
      expect(work.watered).toBeGreaterThan(0)
      expect(work.care).toBeGreaterThan(40)
      expect(work.harvested).toBeGreaterThan(0)
      expect(weekdayOf(49)).toBe('sunday')
      expect(weekdayOf(50)).toBe('monday')
      expect(dateOf(save.calendar.day)).toEqual({ year: 2, day: 1, season: 'spring' })
      expect(farmDaysIn(PACK, ONE, 'spring', 2)).not.toEqual(farmDaysIn(PACK, ONE, 'spring', 1))
      expect(parseSaveV5(JSON.parse(JSON.stringify(save)))).toEqual(save)
      if (process.env.FARM_SHIFT_REPORT) console.log(JSON.stringify({ size, min, max, ...work }))
    }, 30_000)
})
