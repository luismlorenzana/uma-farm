import { passDayPart } from '../farm/actions'
import { settleCrewShift } from '../farm/farmhands'
import { talentsD } from '../farm/talents'
import { describe, expect, it } from 'vitest'
import { dateOf, DAYS_PER_YEAR, DAYS_PER_SEASON, FESTIVALS, festivalDayOfYear } from '../farm/calendar'
import { runNight } from '../night/end-day'
import { parseSaveV6 } from '../save/parse-v4'
import { CELEBRATIONS, celebrationDate, NIGHT_VISITS, TRUE_LOVE } from '../save/long-game'
import { newLove, newRosterUma, newSave, newTodayV4, roomsOf, type SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { checkBible, checkHousehold } from '../story/authored'
import { storyPackFrom } from '../story/pack'
import { eventOf, householdOf, storyDaysOf } from '../story/placeholders'
import { professionShift, WEEKDAYS } from '../town/professions'
import { innResidents } from '../town/town'
import { playEvent } from './events'
import { birthdaysOf, dayOfYear, NO_BIRTHDAYS } from './days'
import { planWedding } from './wedding'
import { calendarDay } from './calendar-days'
import { readiness } from './ready'
import { LAUNCH_CAST } from '../story/launch'
import { spendDuoEvening } from './evening'
import { householdPlay, householdReady, readHousehold } from './household'
import {
  activateLongGame, anniversaryOffer, chooseTradition, collectFestivalGift, completeVisit, configuredDuos, duoReady, editDuo, giveFestivalGift,
  greaterLoveOf, householdVows, nightAvailable, nightVisits, planVisit, pledgeFestivalGift, setVisitStay, softEndingReached, morningOfMemory, partnerLock, useStoryDuos, visitBeats, visitScript,
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
  it('spreads the launch birthdays through all seasons, keeps quiet dates, and preserves dates as the cast grows', () => {
    const cast = (list: readonly string[]) => storyPackFrom({ cast: { umas: list.map(characterId => ({ characterId })) }, umas: {}, routes: {} })
    const original = new Map(LAUNCH_CAST.map((id, i) => [id, { month: i % 2 ? 3 : 4, day: 18 }]))
    const launch = birthdaysOf(cast(LAUNCH_CAST), original)
    const expanded = birthdaysOf(cast([...LAUNCH_CAST, ...ids]), original)
    const load = (dates: ReadonlyMap<string, number>) => Array.from({ length: DAYS_PER_YEAR }, (_, i) =>
      [...dates.values()].filter(day => day === i + 1).length)
    expect(launch.size).toBe(50)
    expect(new Set(load(launch))).toEqual(new Set([0, 1]))
    const publicDays = new Set([1, ...FESTIVALS.map(festivalDayOfYear),
      ...storyDaysOf(null).flatMap(event => event.days.map(day => festivalDayOfYear({ season: event.season!, day })))])
    expect([...launch.values()].filter(day => publicDays.has(day))).toEqual([])
    expect(Array.from({ length: 4 }, (_, i) => load(launch).slice(i * DAYS_PER_SEASON, (i + 1) * DAYS_PER_SEASON)
      .reduce((count, day) => count + day, 0))).toEqual([13, 13, 12, 12])
    for (let begin = 1; begin <= DAYS_PER_YEAR; begin += 7) {
      expect(load(launch).slice(begin - 1, begin + 6).some((count, i) => !count && !publicDays.has(begin + i))).toBe(true)
    }
    expect(expanded.size).toBe(100)
    expect(Math.max(...load(expanded))).toBeLessThanOrEqual(2)
    for (const [id, date] of launch) expect(expanded.get(id)).toBe(date)
  })

  it('books a wedding only after the proposal and clears legacy dates picked during romance', async () => {
    const base = newFarm()
    expect(() => planWedding(base, a, 53)).toThrow('after the proposal')
    const accepted = { ...base, love: { ...base.love, [a]: { ...base.love[a]!, stage: 'romance' as const } } }
    expect(() => planWedding(accepted, a, 53)).toThrow('after the proposal')
    const legacy = parseSaveV6({ ...accepted, love: { ...accepted.love, [a]: { ...accepted.love[a]!, weddingDay: 53 } } })
    const days = { festivals: FESTIVALS, birthdays: NO_BIRTHDAYS }
    expect(calendarDay(legacy, pack, days, 53).weddings).not.toContain(a)
    expect(readiness(moveDay(legacy, 53), pack, a)).toMatchObject({ rung: 'r1', ready: false })
    const proposal = moveDay({ ...legacy, love: { ...legacy.love, [a]: { ...legacy.love[a]!, stage: 'proposal', level: 10 } } }, 50)
    expect(() => planWedding(proposal, a, 53)).toThrow('after the proposal')
    expect(readiness(proposal, pack, a).waits).toEqual({ kind: 'ring' })
    const event = await eventOf(pack, a, 'proposal')
    const paid = playEvent({ ...proposal, items: addGoods(proposal.items, 'ring-g3', 1, 1) }, pack, a, {
      event, picks: event.steps.flatMap(step => 'choice' in step ? [0] : []), plays: [], ring: 'ring-g3',
    })
    const engaged = paid.save
    expect(engaged.love[a]).toMatchObject({ stage: 'wedding', ring: 3 })
    expect(engaged.love[a]?.weddingDay).toBeUndefined()
    expect(readiness(moveDay(engaged, 51), pack, a).ready).toBe(true)
    const scheduled = planWedding(engaged, a, 53)
    expect(parseSaveV6(scheduled).love[a]?.weddingDay).toBe(53)
    expect(planWedding(scheduled, a, null).love[a]?.weddingDay).toBeUndefined()
    expect(calendarDay(scheduled, pack, days, 53).weddings).toContain(a)
    expect(readiness(moveDay(scheduled, 52), pack, a).waits).toEqual({ kind: 'wedding-day', day: 53 })
    expect(readiness(moveDay(scheduled, 53), pack, a).ready).toBe(true)
    const married = await wed(moveDay(scheduled, 54), a)
    expect(parseSaveV6(married).love[a]?.wed).toBe(54)
    expect(married.love[a]?.weddingDay).toBeUndefined()
    expect(calendarDay(married, pack, days, 54).weddings).toContain(a)
    expect(anniversaryOffer(moveDay(married, 53 + DAYS_PER_YEAR), a)).toBeNull()
    expect(anniversaryOffer(moveDay(married, 54 + DAYS_PER_YEAR), a)).toBe(1)
  })

  it('houses all fifty after actual weddings and holds the soft ending on Winter 12, with the festival exactly one year later', async () => {
    let save = newFarm()
    const order = [...ids].reverse()
    expect(innResidents(save, pack)).toHaveLength(50)
    for (const [i, id] of order.entries()) {
      const day = i < 48 ? 2 + i : 222
      if (day !== save.calendar.day) save = moveDay(save, day)
      const before = professionShift(pack, id, day)
      save = await wed(save, id)
      expect(save.love[id]?.house).toBe(0)
      expect(innResidents(save, pack)).toHaveLength(49 - i)
      expect(professionShift(pack, id, save.calendar.day)).toEqual(before)
      expect(roomsOf(save.homestead.houses[0]!)).toBeGreaterThanOrEqual(i + 1)
    }
    expect(save.longGame?.weddings).toEqual(order)
    expect(dateOf(save.calendar.day)).toEqual({ year: 2, season: 'winter', day: 12 })
    expect(householdReady(save)).toContain('cohort:50')
    expect(householdReady(save)).not.toContain('greater-festival')
    expect(celebrationDate(save, 'greater-festival')).toBe(342)
    for (const [i, id] of CELEBRATIONS.slice(0, -1).entries()) {
      const guests = seen(save, id)
      expect(guests).toEqual(order.slice(i * 5, i * 5 + 5))
      expect(readHousehold(save, id, [])).toBe(save)
      save = readHousehold(save, id, guests)
      expect(readHousehold(save, id, guests)).toBe(save)
      expect(guests.every(who => save.library?.[who]?.first[`shared:${id}`] === 222)).toBe(true)
      expect(order.filter(who => save.library?.[who]?.first[`shared:${id}`])).toHaveLength(5)
    }
    expect(softEndingReached(save)).toBe(true)
    expect(parseSaveV6(save).longGame).toEqual(save.longGame)

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
    save = moveDay(save, 345)
    const festival = readHousehold(save, 'greater-festival', play.spouses)
    expect(festival.longGame).toMatchObject({ celebrations: { 'cohort:50': 222, 'greater-festival': 345 }, tradition: 20 })
    expect(festival.longGame?.gifts).toHaveLength(4)
    expect(celebrationDate(festival, 'greater-festival')).toBe(342)
    expect(order.every(who => festival.library?.[who]?.first['shared:greater-festival'] === 345)).toBe(true)
    expect(festival.library?.[b]?.first['fact:keepsake:greater-festival']).toBe(345)
    expect(festival.library?.[a]?.first['fact:keepsake:greater-festival']).toBeUndefined()
    expect(householdVows(moveDay(festival, 462))).toBe(true)
    expect(householdVows(moveDay(festival, 465))).toBe(false)
    expect(parseSaveV6(festival).longGame).toEqual(festival.longGame)
  }, 60_000)

  it('keeps earlier saved memories and rooms, and gives a small farm no time-gated ending', async () => {
    const save = await wed(newFarm(), a)
    const legacy = { ...save, longGame: undefined }
    const old = parseSaveV6(moveDay(legacy, 49 * DAYS_PER_YEAR + 1))
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
    save = { ...save, today: { ...save.today, dayParts: true } }
    for (let night = 0; night < 20; night++) {
      expect(planVisit(save, pack, [a], 'pajamas', noBirthday)).toBeNull()
      save = settleCrewShift(passDayPart(save, 'night'), talentsD, pack)
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
      const memory = greaterLoveOf(morning, a).memories.find(visit => visit.looks[0] === morning.longGame?.morning?.looks[0])
      expect(memory?.overnight).toBe(true)
      expect(morningOfMemory({ longGame: undefined }, memory!)).toEqual(memory)
      expect(nightVisits(morning)).toEqual([])
      expect(parseSaveV6(morning).longGame).toEqual(morning.longGame)
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

  it('celebrates a spouse’s birthday and anniversary separately on the same day, with one shared formal wardrobe', async () => {
    const birthdayDay = 2 + DAYS_PER_YEAR
    const birthdays = new Map([[a, dayOfYear(birthdayDay)]])
    const newlywed = await wed(moveDay(newFarm(), 2), a)
    let save = moveDay(newlywed, birthdayDay - 1)
    expect(planVisit(save, pack, [a], 'birthday', noBirthday, birthdays)).toBeNull()
    save = moveDay(save, birthdayDay)
    expect(planVisit(save, pack, [b], 'birthday', noBirthday, birthdays)).toBeNull()
    const birthday = planVisit(save, pack, [a], 'birthday', noBirthday, birthdays)!
    expect(birthday).toMatchObject({ birthday: 2, looks: [1] })
    expect(() => completeVisit(save, pack, { ...birthday, birthday: 3 }, 0, noBirthday, birthdays)).toThrow()
    save = completeVisit(save, pack, birthday, 0, noBirthday, birthdays)
    expect(planVisit(save, pack, [a], 'birthday', noBirthday, birthdays)).toBeNull()
    const anniversary = planVisit(save, pack, [a], 'anniversary', noBirthday, birthdays)!
    save = completeVisit(save, pack, anniversary, 1, noBirthday, birthdays)
    expect(nightVisits(save)).toHaveLength(2)
    expect(greaterLoveOf(save, a)).toMatchObject({ birthday: 2, anniversary: 1, points: 2, memories: [birthday, anniversary] })
    expect(parseSaveV6(JSON.parse(JSON.stringify(save))).longGame).toEqual(save.longGame)
    expect(planVisit(moveDay(save, birthdayDay + DAYS_PER_YEAR), pack, [a], 'birthday', noBirthday, birthdays)?.birthday).toBe(3)
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
    expect(partnerLock(save, pack, [a, b], noBirthday)).toBe('Both spouses need True Love')
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
    for (const [duoArt, first, second] of [['recline', 'recline', 'kiss'], ['kneel', 'kneel', 'crawl-kiss']] as const) {
      for (const who of [[a, b], [b, a]] as [string, string][]) {
        const planned = { ...pair, who, duoArt }
        const after = parseSaveV6(completeVisit(save, pack, planned, 0, noBirthday))
        expect(nightVisits(after)).toEqual([planned])
        for (const id of who) {
          const memory = greaterLoveOf(after, id).memories[0]!
          expect(memory).toEqual(planned)
          const cues = visitBeats(pack, memory).flatMap(beat => beat.steps.flatMap(step => 'illustration' in step ? [step.illustration] : []))
          expect(cues).toEqual(['duo-' + who[1] + '-' + first, 'duo-' + who[0] + '-' + second])
          expect(visitBeats(pack, memory, true).flatMap(beat => beat.steps).some(step => 'illustration' in step)).toBe(false)
        }
      }
    }
    save = completeVisit(save, pack, pair, 0, noBirthday)
    expect(nightVisits(save)).toEqual([pair])
    const evening = spendDuoEvening(save, pack, [a, b], 'walk', 80, false, noBirthday)
    expect(evening.card.partner).toBe(b)
    expect(evening.save.today.actions - save.today.actions).toBe(2)
    expect(evening.save.longGame?.outings).toEqual([{ day: 1, who: [a, b], kind: 'walk' }])
    expect(nightVisits(evening.save)).toEqual([pair])
    expect(parseSaveV6(evening.save).longGame).toEqual(evening.save.longGame)
    const anniversary = moveDay(save, 1 + DAYS_PER_YEAR)
    const offered = planVisit(anniversary, pack, [a, b], 'anniversary', noBirthday)!
    expect(offered).toMatchObject({ who: [a, b], looks: [1, 2], anniversary: 1 })
    const celebrated = completeVisit(anniversary, pack, offered, 0, noBirthday)
    expect(greaterLoveOf(celebrated, a)).toMatchObject({ anniversaries: 1, anniversary: 1 })
    expect(greaterLoveOf(celebrated, b)).toMatchObject({ pajamas: 1, anniversaries: 0 })
    expect(anniversaryOffer(celebrated, a)).toBeNull()
    expect(anniversaryOffer(celebrated, b)).toBe(1)
    expect(planVisit(celebrated, pack, [b, a], 'anniversary', noBirthday)?.who).toEqual([b, a])
    expect(parseSaveV6(celebrated).longGame).toEqual(celebrated.longGame)
    save = editDuo(save, pack, [a, b], true)
    expect(planVisit(save, pack, [a, b], 'pajamas', noBirthday)).toBeNull()
    expect(greaterLoveOf(save, a).memories).toEqual([pair])
    expect(greaterLoveOf(save, b).memories).toEqual([pair])
    expect(parseSaveV6(save).longGame).toEqual(save.longGame)
    expect(() => setVisitStay(save, pack, 1, noBirthday)).toThrow()
    expect(nightVisits(visit(save))).toHaveLength(2)
    const released = { ...pack, household: checkHousehold({ duos: [[a, b]] }, { umas: new Set(ids) }).value }
    const emptyOverride = { ...save, longGame: { ...save.longGame!, duos: [] } }
    expect(configuredDuos(emptyOverride, released)).toEqual([])
    const defaults = parseSaveV6(useStoryDuos(emptyOverride))
    expect(defaults.longGame?.duos).toBeUndefined()
    expect(configuredDuos(defaults, released)).toEqual([[a, b]])
    expect(defaults.bonds).toEqual(save.bonds)
    expect(defaults.longGame?.love).toEqual(save.longGame?.love)
    expect(defaults.diary).toEqual(save.diary)
  })

  it('uses every night wardrobe scene with the corresponding saved portrait in live visits and replays', () => {
    const sceneIds = (beats: ReturnType<typeof visitBeats>) => beats.flatMap(beat =>
      beat.steps.flatMap(step => 'illustration' in step ? [step.illustration] : []))
    for (let look = 1; look <= 10; look++) {
      const visit = { day: 1, kind: 'pajamas' as const, who: [a] as [string], looks: [look] }
      const parts = visitBeats(pack, visit)
      expect(sceneIds(parts)).toEqual([`night-pajamas-${look}-couch`, `night-pajamas-${look}-bed`])
      expect(parts.at(-1)?.portrait).toBe(`pajamas-${look}`)
      expect(sceneIds(visitBeats(pack, visit, true))).toEqual([])
    }
    for (let look = 1; look <= 5; look++) {
      for (const kind of ['birthday', 'anniversary'] as const) {
        const visit = { day: 1, kind, who: [a, b] as [string, string], looks: [look, 10] }
        const parts = visitBeats(pack, visit)
        expect(sceneIds(parts.filter(part => part.id === a))).toEqual([`night-anniversary-${look}-bed`])
        expect(parts.find(part => part.id === a)?.portrait).toBe(`wedding-anniversary-${look}`)
        expect(sceneIds(parts.filter(part => part.id === b))).toEqual(['night-pajamas-10-couch', 'night-pajamas-10-bed'])
      }
    }
  })

  it('validates story slots and reciprocal duo data, preserving approved art cues and rejecting unknown entries', () => {
    const ctx = { umas: new Set([...ids, 's9800001']) }
    const script = { sitting: 'The house is quiet tonight.', illustration: 'quiet-room', emotes: { morning: 'tender' } }
    const birthday = { bedside: 'Thank you for spending today with me.', emotes: { bedside: 'loving' } }
    const bible = checkBible({ characterId: a, marriedLife: { pajamas: { 1: script, 11: script }, birthday: { 1: birthday }, anniversary: { 1: birthday } } }, a, ctx)
    const household = checkHousehold({
      duos: [[b, a], [a, b], [a, a], [a, 's9800001']],
      duoLines: { [`${a}:${b}`]: { [a]: { sitting: 'The table is set for three.', emotes: { sitting: 'loving' } } } },
    }, ctx)
    expect(bible.value?.marriedLife).toEqual({ pajamas: { 1: script }, birthday: { 1: birthday }, anniversary: { 1: birthday } })
    expect(bible.errors).toHaveLength(1)
    expect(household.errors).toHaveLength(2)
    expect(household.value?.duos).toEqual([[a, b], [a, 's9800001']])
    const authored = { ...pack, household: household.value, bibles: new Map([[a, bible.value!]]) }
    expect(visitScript(authored, { day: 1, kind: 'pajamas', who: [a, b], looks: [1, 1] }, 0))
      .toEqual({ ...script, sitting: 'The table is set for three.', emotes: { morning: 'tender', sitting: 'loving' } })
    expect(visitScript(authored, { day: 1, kind: 'birthday', who: [a], looks: [1], birthday: 1 }, 0)).toEqual(birthday)
    const reverse = visitBeats(authored, { day: 1, kind: 'pajamas', who: [b, a], looks: [1, 1] })
    expect(reverse.map(row => row.id)).toEqual([b, a, b, a, b, a])
    expect(reverse[1]?.steps.at(-1)).toMatchObject({ say: a, line: 'The table is set for three.', emote: 'loving' })
    for (const kind of ['birthday', 'anniversary'] as const) {
      const special = { day: 1, kind, who: [a, b] as [string, string], looks: [1, 1] }
      expect(visitScript(authored, special, 0)).toEqual(birthday)
      const beats = visitBeats(authored, special)
      expect(beats[0]?.portrait).toBe('wedding-anniversary-1')
      expect(beats[1]?.portrait).toBe('pajamas-1')
      expect(beats[2]?.steps.at(-1)).toMatchObject({ say: a, line: birthday.bedside, emote: 'loving' })
    }
  })
})
