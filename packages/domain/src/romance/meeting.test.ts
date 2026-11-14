// Meeting her: her trigger from the menu (talks on three days by default), the welcome list on her first talk, at the
// Gate one a morning, a gift in town, the night's meetings, beds and the invite to the farm, a sister met, and an
// older save's roster counting as met. Invented ids only: a master data of 60 characters, 9400001–9400060, and a cast
// of eight with a welcome list of two.
import { describe, expect, it } from 'vitest'
import { FESTIVAL_DAY, farmDay } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { parseSaveV5 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { addGoods } from '../save/warehouse'
import { newSave, type SaveV4 } from '../save/v4'
import type { Cast, CastEntry } from '../story/authored'
import { readStoryPack, type StoryPack } from '../story/pack'
import { eventOf, placeholderEvent, storyOf, townOf, writtenOf } from '../story/placeholders'
import { sceneDue } from '../story/scenes'
import { gateVisitor, townDay } from '../town/town'
import { finishArrival } from './love'
import {
  eventPlayed, giftInTown, inviteBlock, inviteToFarm, meet, meetsHer, meetTonight, MEET_KINDS, sayHello, talkToHer, triggerHolds,
} from './meeting'

const AT = '2026-11-13T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const ids = (n: number, from = 9_400_001) => Array.from({ length: n }, (_, i) => String(from + i))
const EVERYONE = ids(60)
const MASTER = { outfits: new Map(EVERYONE.map((id) => [id, `${id}01`])), lines: new Map<string, never>() }
const [W1, W2, A, B, C, D, E, F] = ids(8) as [string, string, string, string, string, string, string, string]
const SISTER = 's940000902'

/** A cast of eight and a sister: a welcome list of two, and the rest with a trigger each (or none). */
function packOf(more: Partial<Record<string, Partial<CastEntry>>> = {}): StoryPack {
  const umas: CastEntry[] = [W1, W2, A, B, C, D, E, F, SISTER].map((characterId) => ({ characterId, ...more[characterId] }))
  const cast: Cast = { umas, welcome: [W1, W2] }
  return storyOf(readStoryPack({ umas: {}, routes: {}, cast, ties: { ties: [{ a: W1, b: A, strength: 3 }] } }).pack, MASTER)
}
const PACK = packOf({
  [B]: { meet: { kind: 'spot', spot: 'cafe' } },
  [C]: { meet: { kind: 'gift', good: 'carrot' } },
  [D]: { meet: { kind: 'farm-rank', rank: 2 } },
  [E]: { meet: { kind: 'built', place: 'mill' } },
  [F]: { meet: { kind: 'event', after: `${W1}:arrival` } },
})
const save = (day = 5, more: Partial<SaveV4> = {}): SaveV4 => {
  const fresh = newSave('u-meet', AT)
  return { ...fresh, farmer: { name: 'Robin' }, calendar: { day }, diary: { ...fresh.diary, read: ['scene:1:open'] }, ...more }
}
/** The first day from `from` she's out in town, and where. */
function outOn(s: SaveV4, id: string, from = s.calendar.day): { day: number; save: SaveV4; spot: string } {
  for (let day = from; day < from + 200; day++) {
    const at = { ...s, calendar: { day } }
    const spot = townDay(at, PACK).where.get(id)
    if (spot) return { day, save: at, spot }
  }
  throw new Error(`${id} is never out`)
}

describe('her trigger', () => {
  it('lists every kind on the menu, each with what meets her and when it\'s checked', () => {
    expect(MEET_KINDS.map((k) => k.kind)).toEqual(['talks', 'gift', 'spot', 'season', 'festival', 'farm-rank', 'built', 'shipped', 'event'])
  })

  it('holds by kind: talks, spot, season and festival on a talk; a gift on a gift; the farm\'s kinds any time', () => {
    const s = save(5)
    const talk = { at: 'town', spot: 'cafe' } as const
    expect(triggerHolds(s, { kind: 'talks', days: 3 }, 2, talk)).toBe(false)
    expect(triggerHolds(s, { kind: 'talks', days: 3 }, 3, talk)).toBe(true)
    expect(triggerHolds(s, { kind: 'talks', days: 1 }, 1, { at: 'night' })).toBe(false)
    expect(triggerHolds(s, { kind: 'spot', spot: 'cafe' }, 1, talk)).toBe(true)
    expect(triggerHolds(s, { kind: 'spot', spot: 'plaza' }, 1, talk)).toBe(false)
    expect(triggerHolds(s, { kind: 'spot', spot: 'cafe' }, 1, { at: 'gate' })).toBe(false)
    expect(triggerHolds(s, { kind: 'season', season: 'spring' }, 1, talk)).toBe(true)
    expect(triggerHolds(s, { kind: 'season', season: 'winter' }, 1, talk)).toBe(false)
    const derby = save(farmDay({ year: 2, season: 'summer', day: FESTIVAL_DAY }))
    expect(triggerHolds(derby, { kind: 'festival', festival: 'fishing-derby' }, 1, talk)).toBe(true)
    expect(triggerHolds(s, { kind: 'festival', festival: 'fishing-derby' }, 1, talk)).toBe(false)
    expect(triggerHolds(s, { kind: 'gift' }, 0, { at: 'gift', good: 'carrot', taste: 'liked' })).toBe(true)
    expect(triggerHolds(s, { kind: 'gift' }, 0, { at: 'gift', good: 'carrot', taste: 'neutral' })).toBe(false)
    expect(triggerHolds(s, { kind: 'gift', good: 'potato' }, 0, { at: 'gift', good: 'carrot', taste: 'loved' })).toBe(false)
    expect(triggerHolds(s, { kind: 'gift' }, 5, talk)).toBe(false)
    expect(triggerHolds({ ...s, farm: { ...s.farm, points: FARM_RANK_POINTS[3]! } }, { kind: 'farm-rank', rank: 4 }, 0, { at: 'night' })).toBe(true)
    expect(triggerHolds(s, { kind: 'farm-rank', rank: 2 }, 0, { at: 'night' })).toBe(false)
    expect(triggerHolds({ ...s, buildings: { ...s.buildings, mill: 1 } }, { kind: 'built', place: 'mill' }, 0, talk)).toBe(true)
    expect(triggerHolds(s, { kind: 'built', place: 'mill' }, 0, talk)).toBe(false)
    expect(triggerHolds({ ...s, diary: { ...s.diary, shipped: { carrot: 50 } } }, { kind: 'shipped', good: 'carrot', count: 50 }, 0, { at: 'night' })).toBe(true)
    expect(triggerHolds({ ...s, diary: { ...s.diary, shipped: { carrot: 49 } } }, { kind: 'shipped', good: 'carrot', count: 50 }, 0, { at: 'night' })).toBe(false)
  })

  it('an event: hers by `<id>:<event>` (`arrival` her meeting scene), or an event id: anyone\'s', () => {
    const s = save(5, { memories: { [A]: ['f1'] }, arrivals: [W1] })
    expect(eventPlayed(s, `${A}:f1`)).toBe(true)
    expect(eventPlayed(s, `${B}:f1`)).toBe(false)
    expect(eventPlayed(s, 'f1')).toBe(true)
    expect(eventPlayed(s, `${W1}:arrival`)).toBe(true)
    expect(eventPlayed(s, `${A}:arrival`)).toBe(false)
    expect(eventPlayed(s, 'arrival')).toBe(true)
    expect(eventPlayed(save(), 'arrival')).toBe(false)
  })

  it('the welcome list meets on her first talk; never one met already, nor one of the town\'s people', () => {
    const s = save()
    expect(meetsHer(s, PACK, W2, { at: 'town', spot: 'plaza' })).toBe(true)
    expect(meetsHer(s, PACK, W2, { at: 'night' })).toBe(false)
    expect(meetsHer(s, PACK, A, { at: 'town', spot: 'plaza' })).toBe(false)
    const met = meet(s, A, PACK).save
    expect(meetsHer({ ...met, town: { [A]: { talks: 9, last: 5 } } }, PACK, A, { at: 'town', spot: 'plaza' })).toBe(false)
    const keeper = townOf(PACK).people[0]!.characterId
    expect(meetsHer({ ...s, town: { [keeper]: { talks: 9, last: 5 } } }, PACK, keeper, { at: 'town', spot: 'plaza' })).toBe(false)
  })

  it('the sandbox\'s words: a welcomer meets on her first talk, at the Gate', () => {
    expect(writtenOf(PACK, W2).find((p) => p.part === 'Her trigger to meet')).toEqual({ part: 'Her trigger to meet', written: true, plays: 'Her first talk: the welcome list’s 2nd, at the Gate' })
    expect(writtenOf(PACK, A).find((p) => p.part === 'Her trigger to meet')).toEqual({ part: 'Her trigger to meet', written: false, plays: 'Talk with her on three different days' })
  })

  it('her unwritten meeting scene: the Gate\'s for the welcome list, the town\'s for anyone else; each pays as written', async () => {
    const gate = await eventOf(PACK, W1, 'arrival')
    expect(gate.written).toBe(false)
    expect(gate.steps[0]).toEqual({ place: 'gate' })
    const town = await eventOf(PACK, A, 'arrival')
    expect(town.steps).toEqual(placeholderEvent(A, 'arrival', true))
    expect(town.steps[0]).toEqual({ place: 'town' })
    expect(town.steps.at(-1)).toHaveProperty('choice')
    // With no cast to tell, the Gate's.
    expect((await eventOf({ route: PACK.route }, A, 'arrival')).steps[0]).toEqual({ place: 'gate' })
  })
})

describe('a talk in town', () => {
  it('meets one with no trigger on her third day talked: home while a bed is free, her scene due at once', () => {
    let s = save(2)
    const talks: number[] = []
    let met = false
    for (let i = 0; i < 3; i++) {
      const at = outOn(s, A, i === 0 ? 2 : s.calendar.day + 1)
      const r = talkToHer(at.save, PACK, A)
      s = r.save
      talks.push(s.town[A]!.talks)
      met = r.met
      if (i < 2) expect(met).toBe(false)
    }
    expect(talks).toEqual([1, 2, 3])
    expect(met).toBe(true)
    expect(s.roster[A]!.joined).toBe(s.calendar.day)
    expect(s.dorm.home).toEqual([A])
    expect(s.love[A]).toMatchObject({ stage: 'friendship', level: 0, points: 0 })
    expect(sceneDue(s)).toBe(`arrival:${A}`)
    expect(s.account.updatedAt).toBe(AT)
    expect(parseSaveV5(json(s))).toEqual(s)
    // On the farm now, she's no longer seen in town, and nobody else there moves.
    const before = townDay({ ...s, dorm: { ...s.dorm, home: [] } }, PACK)
    expect(townDay(s, PACK).where.has(A)).toBe(false)
    expect([...townDay(s, PACK).where]).toEqual([...before.where].filter(([id]) => id !== A))
  })

  it('keeps the welcome list out of town until met (she comes to the Gate), and meets a spot trigger only at her spot', () => {
    for (let day = 1; day <= 40; day++) expect(townDay(save(day), PACK).where.has(W2)).toBe(false)
    let s = save(2)
    for (;;) {
      const at = outOn(s, B, s.calendar.day + 1)
      const r = talkToHer(at.save, PACK, B)
      expect(r.met).toBe(at.spot === 'cafe')
      if (r.met) break
      s = r.save
    }
  })

  it('with no bed free she lives in town as a friend: met, on Hearts, out in town, and invited once a bed frees', () => {
    const full: SaveV4 = { ...save(2), roster: {}, dorm: { level: 1, home: [], swaps: [] } }
    const three = [W1, W2, B].reduce((s, id) => meet(s, id, PACK).save, full)
    expect(three.dorm.home).toEqual([W1, W2, B])
    const r = meet(three, A, PACK)
    expect(r.home).toBe(false)
    expect(r.save.roster[A]).toBeDefined()
    expect(r.save.love[A]).toBeDefined()
    expect(inviteBlock(r.save, A)).toBe('No bed free.')
    expect(() => inviteToFarm(r.save, A)).toThrow(SaveRuleError)
    // She's out in town on her days, like anyone not on the farm.
    expect(outOn(r.save, A).spot).toBeTruthy()
    // A bed frees (the Dorm's level 2): invited, she moves in now.
    const more: SaveV4 = { ...r.save, dorm: { ...r.save.dorm, level: 2 }, buildings: { ...r.save.buildings, dorm: 2 } }
    expect(inviteBlock(more, A)).toBeNull()
    const invited = inviteToFarm(more, A)
    expect(invited.dorm.home).toEqual([W1, W2, B, A])
    expect(inviteBlock(invited, A)).toBe('She lives on the farm.')
    expect(inviteBlock(invited, C)).toBe('You haven’t met her yet.')
    expect(parseSaveV5(json(invited))).toEqual(invited)
  })
})

describe('the Gate', () => {
  it('Say hello is her first talk: it counts, meets her and moves her in; the next comes the next morning', () => {
    const s = save(1)
    expect(gateVisitor(s, PACK)).toBe(W1)
    expect(townDay(s, PACK).where.has(W1)).toBe(false)
    const one = sayHello(s, PACK, W1)
    expect(one.town[W1]).toEqual({ talks: 1, last: 1 })
    expect(one.dorm.home).toEqual([W1])
    expect(gateVisitor({ ...one, calendar: { day: 2 } }, PACK)).toBe(W2)
    // Her ties with someone met start at their seed.
    expect(meet(one, A, PACK).save.bonds).toEqual({ [`${W1}:${A}`]: 150 })
  })
})

describe('a gift in town', () => {
  it('meets her on the good her trigger names, after a talk; it costs the good either way', () => {
    const at = outOn(save(2), C)
    const stocked = addGoods(addGoods(at.save.items, 'carrot', 1, 1), 'potato', 1, 1)
    const s: SaveV4 = { ...at.save, items: stocked }
    expect(() => giftInTown(s, PACK, C, 'carrot', 1)).toThrow('Talk with her first.')
    const talked = talkToHer(s, PACK, C).save
    const potato = giftInTown(talked, PACK, C, 'potato', 1)
    expect(potato.met).toBe(false)
    expect(potato.save.items.potato).toBeUndefined()
    expect(() => giftInTown(potato.save, PACK, C, 'potato', 1)).toThrow('Not enough in the Warehouse')
    const carrot = giftInTown(potato.save, PACK, C, 'carrot', 1)
    expect(carrot.met).toBe(true)
    expect(carrot.save.roster[C]).toBeDefined()
    expect(() => giftInTown(carrot.save, PACK, C, 'carrot', 1)).toThrow(SaveRuleError)
  })
})

describe('the night', () => {
  it('meets whoever\'s trigger the farm holds: a Farm Rank, a place built, another\'s meeting; never the welcome list', () => {
    const s = save(5)
    expect(meetTonight(s, PACK).met).toEqual([])
    const ranked: SaveV4 = { ...s, farm: { ...s.farm, points: FARM_RANK_POINTS[1]! } }
    expect(meetTonight(ranked, PACK).met).toEqual([{ id: D, home: true }])
    const built: SaveV4 = { ...s, buildings: { ...s.buildings, mill: 1 } }
    expect(meetTonight(built, PACK).met).toEqual([{ id: E, home: true }])
    // After W1's meeting scene plays.
    const one = finishArrival(sayHello(save(1), PACK, W1), W1, { choice: 30, flags: [] })
    const night = meetTonight({ ...one, calendar: { day: 2 } }, PACK)
    expect(night.met).toEqual([{ id: F, home: true }])
    expect(meetTonight(night.save, PACK).met).toEqual([])
    // A welcomer whose own trigger holds still waits for the Gate.
    const welcomeTrigger = packOf({ [W2]: { meet: { kind: 'built', place: 'mill' } } })
    expect(meetTonight(built, welcomeTrigger).met).toEqual([])
  })
})

describe('a sister, and an older save', () => {
  it('a sister is met like anyone, and the save keeps her', () => {
    const at = outOn(save(2), SISTER)
    let s = at.save
    s = talkToHer(s, PACK, SISTER).save
    const met = meet(s, SISTER, PACK).save
    expect(met.roster[SISTER]).toBeDefined()
    expect(met.dorm.home).toEqual([SISTER])
    expect(parseSaveV5(json(met))).toEqual(met)
  })

  it('an older v4\'s roster counts as met: it loads as it was, no time moved', () => {
    const older = json(meet(meet(save(9), W1, PACK).save, A, PACK).save) as unknown as Record<string, unknown>
    delete older.town
    const loaded = parseSaveV5(older)
    expect(Object.keys(loaded.roster)).toEqual([W1, A])
    expect(loaded.account.updatedAt).toBe(AT)
    expect(gateVisitor(loaded, PACK)).toBe(W1)
    expect(gateVisitor({ ...loaded, calendar: { day: 10 } }, PACK)).toBe(W2)
    expect(meetsHer(loaded, PACK, A, { at: 'town', spot: 'plaza' })).toBe(false)
  })
})
