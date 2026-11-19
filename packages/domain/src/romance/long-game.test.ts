import { describe, expect, it } from 'vitest'
import { dateOf, DAYS_PER_YEAR, DAYS_PER_SEASON } from '../farm/calendar'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { CELEBRATIONS, celebrationDate, NIGHT_VISITS, TRUE_LOVE } from '../save/long-game'
import { newLove, newRosterUma, newSave, newTodayV4, roomsOf, type SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { checkBible, checkHousehold } from '../story/authored'
import { storyPackFrom } from '../story/pack'
import { eventOf, householdOf } from '../story/placeholders'
import { professionShift, WEEKDAYS } from '../town/professions'
import { playEvent } from './events'
import { spendDuoEvening } from './evening'
import { householdPlay, householdReady, readHousehold } from './household'
import {
  activateLongGame, anniversaryOffer, chooseTradition, collectFestivalGift, completeVisit, configuredDuos, duoReady, editDuo, giveFestivalGift,
  greaterLoveOf, householdVows, nightAvailable, nightVisits, planVisit, pledgeFestivalGift, setVisitStay, softEndingReached, visitScript,
} from './long-game'

const ids = Array.from({ length: 50 }, (_, i) => String(9800001 + i))
const a = ids[0]!
const b = ids[1]!
const appointment = '2026-11-19T12:00:00.000Z'
const pack = storyPackFrom({
  cast: { umas: ids.map(characterId => ({ characterId })) }, umas: {}, routes: {},
  town: { professions: Array.from({ length: 25 }, (_, i) => ({
    id: `job-${i}`, name: `Job ${i}`, at: 'cafe', off: WEEKDAYS[i % 7]!, partners: ids.slice(2 * i, 2 * i + 2),
  })) },
})
const noBirthday = () => false
const moveDay = (save: SaveV4, day: number): SaveV4 => ({ ...save, calendar: { day }, today: newTodayV4(), summary: null })
function newFarm(): SaveV4 {
  const base = newSave('two-seasons', appointment)
  return { ...base, farmer: { name: 'Robin' }, gold: 1_000_000, roster: Object.fromEntries(ids.map(id => [id, newRosterUma(1)])),
    arrivals: [...ids], love: Object.fromEntries(ids.map(id => [id, newLove()])) }
}
async function wed(save: SaveV4, id: string): Promise<SaveV4> {
  const event = await eventOf(pack, id, 'wedding')
  const ready: SaveV4 = { ...save, love: { ...save.love, [id]: { ...save.love[id]!, stage: 'wedding', level: 10, ring: 3 } } }
  return playEvent(ready, pack, id, { event, picks: event.steps.flatMap(step => 'choice' in step ? [0] : []), plays: [], place: 'chapel-bell', reception: null }).save
}
const seen = (save: SaveV4, id: Parameters<typeof householdPlay>[2]) => householdPlay(save, householdOf(pack), id)?.spouses ?? []
function visit(save: SaveV4, id = a): SaveV4 {
  return completeVisit(save, pack, planVisit(save, pack, [id], 'pajamas', noBirthday)!, nightVisits(save).length, noBirthday)
}

describe('marriages and the festival calendar', () => {
  it('houses all fifty after actual weddings and holds the soft ending on Winter 12, with the festival exactly one year later', async () => {
    let save = newFarm()
    const order = [...ids].reverse()
    for (const [i, id] of order.entries()) {
      const day = i < 48 ? 2 + i : 96
      if (day !== save.calendar.day) save = moveDay(save, day)
      const before = professionShift(pack, id, day)
      save = await wed(save, id)
      expect(save.love[id]?.house).toBe(0)
      expect(professionShift(pack, id, save.calendar.day)).toEqual(before)
      expect(roomsOf(save.homestead.houses[0]!)).toBeGreaterThanOrEqual(i + 1)
    }
    expect(save.longGame?.weddings).toEqual(order)
    expect(dateOf(save.calendar.day)).toEqual({ year: 2, season: 'winter', day: 12 })
    expect(householdReady(save)).toContain('cohort:50')
    expect(householdReady(save)).not.toContain('greater-festival')
    expect(celebrationDate(save, 'greater-festival')).toBe(144)
    for (const [i, id] of CELEBRATIONS.slice(0, -1).entries()) {
      const guests = seen(save, id)
      expect(guests).toEqual(order.slice(i * 5, i * 5 + 5))
      expect(readHousehold(save, id, [])).toBe(save)
      save = readHousehold(save, id, guests)
      expect(readHousehold(save, id, guests)).toBe(save)
      expect(guests.every(who => save.library?.[who]?.first[`shared:${id}`] === 96)).toBe(true)
      expect(order.filter(who => save.library?.[who]?.first[`shared:${id}`])).toHaveLength(5)
    }
    expect(softEndingReached(save)).toBe(true)
    expect(parseSaveV5(save).longGame).toEqual(save.longGame)

    save = chooseTradition(save, 20)
    const started = save.calendar.day
    for (let offset = 0; offset < DAYS_PER_YEAR; offset++) {
      expect(householdReady(save)).not.toContain('greater-festival')
      if (offset % DAYS_PER_SEASON === 0) {
        save = { ...save, items: addGoods(save.items, 'carrot', 3, 1) }
        if (offset === 0) {
          save = pledgeFestivalGift(save, 'carrot@3')
          expect(collectFestivalGift(save, [{ outfitId: a, items: ['carrot@2'] }], [])).toBe(save)
          save = collectFestivalGift(save, [{ outfitId: b, items: ['carrot@3'] }], [])
          expect(save.longGame?.gifts?.[0]?.crew).toEqual([b])
        } else save = giveFestivalGift(save, 'carrot@3')
        expect(save.items.carrot?.[2] ?? 0).toBe(0)
        expect(() => giveFestivalGift(save, 'carrot@3')).toThrow()
      }
      save = runNight(save, { story: pack })
    }
    expect(save.calendar.day).toBe(started + DAYS_PER_YEAR)
    expect(dateOf(save.calendar.day)).toEqual({ year: 3, season: 'winter', day: 12 })
    expect(householdReady(save)).toContain('greater-festival')
    const play = householdPlay(save, householdOf(pack), 'greater-festival')!
    expect(play.spouses).toEqual(order)
    expect(play.parts.filter(part => part.who)).toHaveLength(10)
    save = moveDay(save, 147)
    const festival = readHousehold(save, 'greater-festival', play.spouses)
    expect(festival.longGame).toMatchObject({ celebrations: { 'cohort:50': 96, 'greater-festival': 147 }, tradition: 20 })
    expect(festival.longGame?.gifts).toHaveLength(4)
    expect(celebrationDate(festival, 'greater-festival')).toBe(144)
    expect(order.every(who => festival.library?.[who]?.first['shared:greater-festival'] === 147)).toBe(true)
    expect(festival.library?.[b]?.first['fact:keepsake:greater-festival']).toBe(147)
    expect(festival.library?.[a]?.first['fact:keepsake:greater-festival']).toBeUndefined()
    expect(householdVows(moveDay(festival, 192))).toBe(true)
    expect(householdVows(moveDay(festival, 195))).toBe(false)
    expect(parseSaveV5(festival).longGame).toEqual(festival.longGame)
  }, 60_000)

  it('keeps earlier saved memories and rooms, and gives a small farm no time-gated ending', async () => {
    const save = await wed(newFarm(), a)
    const legacy = { ...save, longGame: undefined }
    const old = parseSaveV5(moveDay(legacy, 49 * DAYS_PER_YEAR + 1))
    expect(old.longGame).toBeUndefined()
    const migrated = activateLongGame(old, pack)
    expect(migrated.love[a]?.house).toBe(0)
    expect(householdReady(migrated)).not.toContain('cohort:50')
    expect(celebrationDate(migrated, 'greater-festival')).toBeNull()
  })
})

describe('married life', () => {
  it('takes twenty nights of five visits and a stay for True Love, with no replay or duplicate awards', async () => {
    let save = await wed(newFarm(), a)
    const looks = new Set<number>()
    for (let night = 0; night < 20; night++) {
      for (let n = 0; n < NIGHT_VISITS; n++) {
        const dated = planVisit(save, pack, [a], 'pajamas', noBirthday)!
        looks.add(dated.looks[0]!)
        const before = greaterLoveOf(save, a).points
        save = completeVisit(save, pack, dated, n, noBirthday)
        expect(greaterLoveOf(save, a).points).toBe(before + 1)
        expect(() => completeVisit(save, pack, dated, n, noBirthday)).toThrow()
      }
      expect(planVisit(save, pack, [a], 'pajamas', noBirthday)).toBeNull()
      save = setVisitStay(save, pack, save.calendar.day, noBirthday)
      expect(setVisitStay(save, pack, save.calendar.day, noBirthday).longGame).toEqual(save.longGame)
      const morning = runNight(save, { story: pack })
      expect(greaterLoveOf(morning, a).points).toBe((night + 1) * 6)
      expect(morning.longGame?.morning?.who).toEqual([a])
      expect(nightVisits(morning)).toEqual([])
      expect(parseSaveV5(morning).longGame).toEqual(morning.longGame)
      save = morning
    }
    expect([...looks].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(greaterLoveOf(save, a)).toMatchObject({ points: TRUE_LOVE, trueDay: 21 })
    for (let anniversary = 1; anniversary <= 5; anniversary++) {
      save = moveDay(save, anniversary * DAYS_PER_YEAR + 3)
      const planned = planVisit(save, pack, [a], 'anniversary', noBirthday)!
      expect(planned).toMatchObject({ looks: [anniversary], anniversary })
      save = completeVisit(save, pack, planned, 0, noBirthday)
      expect(anniversaryOffer(save, a)).toBeNull()
      expect(greaterLoveOf(save, a).points).toBe(TRUE_LOVE)
    }
    expect(greaterLoveOf(save, a).memories).toHaveLength(15)
  })

  it('uses one slot for an eligible pair, keeps both memories after removal, and respects expedition and birthday availability', async () => {
    let save = await wed(await wed(newFarm(), a), b)
    save = editDuo(save, pack, [b, a], false)
    expect(configuredDuos(save, pack)).toEqual([[a, b]])
    expect(() => editDuo(save, pack, [a, b], false)).toThrow()
    expect(() => editDuo(save, pack, [a, a], false)).toThrow()
    save = editDuo(editDuo(save, pack, [a, ids[2]!], false), pack, [a, ids[3]!], false)
    expect(() => editDuo(save, pack, [a, ids[4]!], false)).toThrow()
    expect(duoReady(save, [a, b])).toBe(false)
    for (const who of [a, b]) {
      save = { ...save, longGame: { ...save.longGame!, love: {
        ...save.longGame!.love, [who]: { ...greaterLoveOf(save, who), points: TRUE_LOVE, trueDay: save.calendar.day },
      } } }
    }
    const absent: SaveV4 = { ...save, expeditions: [{ region: 'old-fort-ruins', party: [b], left: 1, back: 4, supplies: [] }] }
    expect(nightAvailable(absent, pack, b)).toBe(false)
    expect(planVisit(absent, pack, [a, b], 'pajamas', noBirthday)).toBeNull()
    expect(planVisit(save, pack, [a, b], 'pajamas', id => id === a)).toBeNull()
    expect(planVisit(save, pack, [a], 'pajamas', id => id === a)).not.toBeNull()
    const pair = planVisit(save, pack, [a, b], 'pajamas', noBirthday)!
    save = completeVisit(save, pack, pair, 0, noBirthday)
    expect(nightVisits(save)).toEqual([pair])
    const evening = spendDuoEvening(save, pack, [a, b], 'walk', 80, false, noBirthday)
    expect(evening.card.partner).toBe(b)
    expect(evening.save.today.actions - save.today.actions).toBe(2)
    expect(evening.save.longGame?.outings).toEqual([{ day: 1, who: [a, b], kind: 'walk' }])
    expect(nightVisits(evening.save)).toEqual([pair])
    expect(parseSaveV5(evening.save).longGame).toEqual(evening.save.longGame)
    const anniversary = moveDay(save, 1 + DAYS_PER_YEAR)
    const offered = planVisit(anniversary, pack, [a, b], 'anniversary', noBirthday)!
    expect(offered).toMatchObject({ who: [a, b], looks: [1, 2], anniversary: 1 })
    const celebrated = completeVisit(anniversary, pack, offered, 0, noBirthday)
    expect(greaterLoveOf(celebrated, a)).toMatchObject({ anniversaries: 1, anniversary: 1 })
    expect(greaterLoveOf(celebrated, b)).toMatchObject({ pajamas: 1, anniversaries: 0 })
    expect(anniversaryOffer(celebrated, a)).toBeNull()
    expect(anniversaryOffer(celebrated, b)).toBe(1)
    expect(planVisit(celebrated, pack, [b, a], 'anniversary', noBirthday)?.who).toEqual([b, a])
    expect(parseSaveV5(celebrated).longGame).toEqual(celebrated.longGame)
    save = editDuo(save, pack, [a, b], true)
    expect(planVisit(save, pack, [a, b], 'pajamas', noBirthday)).toBeNull()
    expect(greaterLoveOf(save, a).memories).toEqual([pair])
    expect(greaterLoveOf(save, b).memories).toEqual([pair])
    expect(parseSaveV5(save).longGame).toEqual(save.longGame)
    expect(() => setVisitStay(save, pack, 1, noBirthday)).toThrow()
    expect(nightVisits(visit(save))).toHaveLength(2)
  })

  it('validates story slots and reciprocal duo data, preserving approved art cues and rejecting unknown entries', () => {
    const ctx = { umas: new Set([...ids, 's9800001']) }
    const script = { sitting: 'The house is quiet tonight.', illustration: 'quiet-room' }
    const bible = checkBible({ characterId: a, marriedLife: { pajamas: { 1: script, 11: script } } }, a, ctx)
    const household = checkHousehold({
      duos: [[b, a], [a, b], [a, a], [a, 's9800001']],
      duoLines: { [`${a}:${b}`]: { [a]: { sitting: 'The table is set for three.' } } },
    }, ctx)
    expect(bible.value?.marriedLife).toEqual({ pajamas: { 1: script } })
    expect(bible.errors).toHaveLength(1)
    expect(household.errors).toHaveLength(2)
    expect(household.value?.duos).toEqual([[a, b], [a, 's9800001']])
    const authored = { ...pack, household: household.value, bibles: new Map([[a, bible.value!]]) }
    expect(visitScript(authored, { day: 1, kind: 'pajamas', who: [a, b], looks: [1, 1] }, 0)).toEqual({ ...script, sitting: 'The table is set for three.' })
  })
})
