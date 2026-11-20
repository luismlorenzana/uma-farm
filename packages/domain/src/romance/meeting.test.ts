// Meeting her: introducing yourself in town (one action, in town today, where she is now), she keeps living in town,
// her meeting scene due at once, her ties seeded; the retired welcome list and trigger to meet (read, noted, acting on
// nothing); the trigger menu as her chapters and the Town notes read it; nobody moves to the farm by meeting; a sister met;
// and an older save's roster counting as met. Invented ids only: a master data of 60 characters, 9400001–9400060, and a
// cast of eight with a welcome list of two.
import { describe, expect, it } from 'vitest'
import { actionsLeft, goToTown } from '../farm/actions'
import { FESTIVALS, farmDay } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { parseSaveV6 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { newSave, type SaveV4 } from '../save/v4'
import type { Cast, CastEntry } from '../story/authored'
import { readStoryPack, type StoryPack } from '../story/pack'
import { eventOf, openingOf, placeholderEvent, storyOf, townOf, writtenOf } from '../story/placeholders'
import { sceneDue } from '../story/scenes'
import { townDay } from '../town/town'
import { eventPlayed, introduce, introduceBlock, meet, triggerHolds } from './meeting'
import * as meeting from './meeting'

const AT = '2026-11-13T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const ids = (n: number, from = 9_400_001) => Array.from({ length: n }, (_, i) => String(from + i))
const EVERYONE = ids(60)
const MASTER = { outfits: new Map(EVERYONE.map((id) => [id, `${id}01`])), lines: new Map<string, never>() }
const [W1, W2, A, B] = ids(4) as [string, string, string, string]
const SISTER = 's940000902'

/** A cast of eight and a sister, with a (retired) welcome list of two and a (retired) trigger to meet. */
function packOf(more: Partial<Record<string, Partial<CastEntry>>> = {}): StoryPack {
  const umas: CastEntry[] = [...ids(8), SISTER].map((characterId) => ({ characterId, ...more[characterId] }))
  const cast: Cast = { umas, welcome: [W1, W2] }
  return storyOf(readStoryPack({ umas: {}, routes: {}, cast, ties: { ties: [{ a: W1, b: A, strength: 3 }] } }).pack, MASTER)
}
const PACK = packOf({ [B]: { meet: { kind: 'spot', spot: 'cafe' } } })
const save = (day = 5, more: Partial<SaveV4> = {}): SaveV4 => {
  const fresh = newSave('u-meet', AT)
  return { ...fresh, farmer: { name: 'Robin' }, calendar: { day }, diary: { ...fresh.diary, read: ['scene:1:open'] }, ...more }
}
/** The first day from `from` she's out in town, gone into town that day, and where. */
function outOn(s: SaveV4, id: string, from = s.calendar.day): { save: SaveV4; place: string } {
  for (let day = from; day < from + 200; day++) {
    const at = { ...s, calendar: { day } }
    const place = townDay(at, PACK).where.get(id)
    if (place) return { save: goToTown(at), place }
  }
  throw new Error(`${id} is never out`)
}

describe('introducing yourself', () => {
  it('meets her for one action, in town where she is: she keeps living in town, her meeting scene due at once', () => {
    const at = outOn(save(2), A)
    const met = introduce(at.save, PACK, A)
    expect(actionsLeft(met)).toBe(actionsLeft(at.save) - 1)
    expect(met.roster[A]!.joined).toBe(at.save.calendar.day)
    expect(met.love[A]).toMatchObject({ stage: 'friendship', level: 0, points: 0 })
    expect(met.dorm.home).toEqual([])
    expect(townDay(met, PACK).where.get(A)).toBe(at.place)
    expect(sceneDue(met)).toBe(`arrival:${A}`)
    expect(met.account.updatedAt).toBe(AT)
    expect(parseSaveV6(json(met))).toEqual(met)
  })

  it('is refused out of town, for one not out now, one met, one of the town\'s people, and with no actions left', () => {
    const at = outOn(save(2), A)
    const home = { ...at.save, today: { ...at.save.today, town: false } }
    expect(introduceBlock(home, PACK, A)).toBe('Go into town first.')
    expect(() => introduce(home, PACK, A)).toThrow(SaveRuleError)
    const away = EVERYONE.find((id) => !townDay(at.save, PACK).where.has(id) && !townOf(PACK).byId.has(id))!
    expect(introduceBlock(at.save, PACK, away)).toBe('She isn’t out in town now.')
    const keeper = townOf(PACK).people[0]!.characterId
    expect(introduceBlock(at.save, PACK, keeper)).toBe('She’s one of the town’s people.')
    expect(introduceBlock(introduce(at.save, PACK, A), PACK, A)).toBe('You’ve met her already.')
    const spent = { ...at.save, today: { ...at.save.today, actions: 10 } }
    expect(introduceBlock(spent, PACK, A)).toBe('No actions left today.')
    expect(() => introduce(spent, PACK, A)).toThrow('No actions left today.')
  })

  it('seeds her ties with someone met', () => {
    const one = meet(save(1), W1, PACK).save
    expect(meet(one, A, PACK).save.bonds).toEqual({ [`${W1}:${A}`]: 150 })
    expect(() => meet(one, W1, PACK)).toThrow('You’ve met her already.')
  })

  it('her unwritten meeting scene is the town\'s for anyone, and pays as written', async () => {
    for (const id of [W1, A]) {
      const town = await eventOf(PACK, id, 'arrival')
      expect(town.written).toBe(false)
      expect(town.steps).toEqual(placeholderEvent(id, 'arrival', true))
      expect(town.steps[0]).toEqual({ place: 'town' })
      expect(town.steps.at(-1)).toHaveProperty('choice')
    }
  })
})

describe('no welcome week', () => {
  it('the welcome list and her trigger to meet are read, noted as retired, and act on nothing', () => {
    const read = readStoryPack({ umas: {}, routes: {}, cast: { welcome: [W1], umas: [{ characterId: W1, meet: { kind: 'talks', days: 2 } }] }, ties: { ties: [] } })
    expect(read.pack.cast.welcome).toEqual([W1])
    expect(read.pack.cast.umas[0]!.meet).toEqual({ kind: 'talks', days: 2 })
    expect(read.notes.some((n) => n.includes('welcome list is retired'))).toBe(true)
    expect(read.notes.some((n) => n.includes('meet is retired'))).toBe(true)
  })

  it('the welcome list is out in town like anyone from day 1, and the game\'s opening ends with the farm', () => {
    const out = new Set<string>()
    for (let day = 1; day <= 40; day++) for (const id of [W1, W2]) if (townDay(save(day), PACK).where.has(id)) out.add(id)
    expect(out).toEqual(new Set([W1, W2]))
    expect(openingOf(PACK).some((s) => 'narrate' in s && s.narrate.includes('Gate'))).toBe(false)
  })

  it('the sandbox\'s words: her life in town, the story\'s or today\'s draw', () => {
    expect(writtenOf(PACK, A).find((p) => p.part === 'Her life in town')).toEqual({ part: 'Her life in town', written: false, plays: 'None: today’s draw places her' })
    expect(writtenOf(PACK, A).some((p) => p.part === 'Her trigger to meet')).toBe(false)
  })
})

describe('the trigger menu, for her chapters and the Town notes', () => {
  it('holds by kind: talks, spot, season and festival in town; a gift on a gift; the farm\'s kinds any time', () => {
    const s = save(5)
    const town = { at: 'town', place: 'cafe' } as const
    expect(triggerHolds(s, { kind: 'talks', days: 3 }, 2, town)).toBe(false)
    expect(triggerHolds(s, { kind: 'talks', days: 3 }, 3, town)).toBe(true)
    expect(triggerHolds(s, { kind: 'talks', days: 1 }, 1, { at: 'night' })).toBe(false)
    expect(triggerHolds(s, { kind: 'spot', spot: 'cafe' }, 1, town)).toBe(true)
    expect(triggerHolds(s, { kind: 'spot', spot: 'plaza' }, 1, town)).toBe(false)
    expect(triggerHolds(s, { kind: 'season', season: 'spring' }, 1, town)).toBe(true)
    expect(triggerHolds(s, { kind: 'season', season: 'winter' }, 1, town)).toBe(false)
    const derby = save(farmDay({ year: 2, season: 'summer', day: FESTIVALS.find(f => f.id === 'fishing-derby')!.day }))
    expect(triggerHolds(derby, { kind: 'festival', festival: 'fishing-derby' }, 1, town)).toBe(true)
    expect(triggerHolds(s, { kind: 'festival', festival: 'fishing-derby' }, 1, town)).toBe(false)
    expect(triggerHolds(s, { kind: 'gift' }, 0, { at: 'gift', good: 'carrot', taste: 'liked' })).toBe(true)
    expect(triggerHolds(s, { kind: 'gift' }, 0, { at: 'gift', good: 'carrot', taste: 'neutral' })).toBe(false)
    expect(triggerHolds(s, { kind: 'gift', good: 'potato' }, 0, { at: 'gift', good: 'carrot', taste: 'loved' })).toBe(false)
    expect(triggerHolds(s, { kind: 'gift' }, 5, town)).toBe(false)
    expect(triggerHolds({ ...s, farm: { ...s.farm, points: FARM_RANK_POINTS[3]! } }, { kind: 'farm-rank', rank: 4 }, 0, { at: 'night' })).toBe(true)
    expect(triggerHolds(s, { kind: 'farm-rank', rank: 2 }, 0, { at: 'night' })).toBe(false)
    expect(triggerHolds({ ...s, buildings: { ...s.buildings, mill: 1 } }, { kind: 'built', place: 'mill' }, 0, town)).toBe(true)
    expect(triggerHolds(s, { kind: 'built', place: 'mill' }, 0, town)).toBe(false)
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
})

describe('nobody moves to the farm by meeting her', () => {
  it('has no Invite to the farm: met, she lives in town and keeps her days, whoever else you\'ve met', () => {
    expect(Object.keys(meeting)).not.toContain('inviteToFarm')
    expect(Object.keys(meeting)).not.toContain('inviteBlock')
    const four = [W1, W2, B, A].reduce((s, id) => meet(s, id, PACK).save, save(2))
    expect(four.dorm).toEqual({ level: 1, home: [], swaps: [] })
    // She's out in town on her days, like anyone not on the farm.
    expect(outOn(four, A).place).toBeTruthy()
    const out = Array.from({ length: 28 }, (_, i) => i + 2).filter((day) => townDay({ ...four, calendar: { day } }, PACK).where.has(A))
    expect(out.length).toBeGreaterThan(0)
    expect(parseSaveV6(json(four))).toEqual(four)
  })
})

describe('a sister, and an older save', () => {
  it('a sister is met like anyone, and the save keeps her', () => {
    const at = outOn(save(2), SISTER)
    const met = introduce(at.save, PACK, SISTER)
    expect(met.roster[SISTER]).toBeDefined()
    expect(parseSaveV6(json(met))).toEqual(met)
  })

  it('an older save\'s roster counts as met, and its town record grows in place: no time moved', () => {
    const older = json(meet(meet(save(9), W1, PACK).save, A, PACK).save) as unknown as Record<string, unknown>
    older.town = { [A]: { talks: 2, last: 8 } }
    const loaded = parseSaveV6(older)
    expect(Object.keys(loaded.roster)).toEqual([W1, A])
    expect(loaded.town[A]).toEqual({ talks: 2, last: 8, gift: 0 })
    expect(loaded.account.updatedAt).toBe(AT)
  })
})
