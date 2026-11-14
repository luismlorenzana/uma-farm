// The town: who lives there, the town's people in their roles, the day's draw at the six spots, a talk once a day, and
// her line. Invented ids only: a master data of 120 characters, 9200001–9200120, sisters `s9200001xx`, and a town.json
// of invented people and spots.
import { describe, expect, it } from 'vitest'
import { newRosterUma, newSave, type SaveV4 } from '../save/v4'
import { SaveRuleError } from '../save/rules'
import { CAST_IDS } from '../story/cast'
import { SPOT_IDS } from '../story/authored'
import { storyOf, townOf, PLACEHOLDER_SPOTS, PLACEHOLDER_TOWN_LINES, speakerId, isTownPerson } from '../story/placeholders'
import { readStoryPack, type StoryPack } from '../story/pack'
import { FAVOURITE_SPOT, SPOT_ROOM, talkedToday, talkInTown, townDay, townLineOf, townsfolk, townTalksOf } from './town'

const AT = '2026-11-13T10:00:00.000Z'
const ids = (n: number, from = 9_200_001) => Array.from({ length: n }, (_, i) => String(from + i))
const EVERYONE = ids(120)
/** An invented master data: 120 characters, each with one outfit. */
const MASTER = { outfits: new Map(EVERYONE.map((id) => [id, `${id}01`])), lines: new Map<string, never>() }

/** A pack from files, with master data's placeholders. */
const pack = (files: Partial<Parameters<typeof readStoryPack>[0]> = {}): StoryPack =>
  storyOf(readStoryPack({ umas: {}, routes: {}, ...files }).pack, MASTER)
const save = (day = 5, more: Partial<SaveV4> = {}): SaveV4 => ({ ...newSave('u-town', AT), calendar: { day }, ...more })
const count = (d: ReturnType<typeof townDay>) => [...d.spots.values()].reduce((n, list) => n + list.length, 0)

/** A town.json: fourteen people, one a role, and the six spots. */
const PEOPLE = ids(14, 9_200_101)
const TOWN = {
  people: PEOPLE.map((characterId, i) => ({ characterId, does: `Invented role ${i + 1}.`, game: CAST_IDS[i] })),
  spots: SPOT_IDS.map((id, i) => ({ id, name: `Invented spot ${i + 1}`, blurb: 'An invented line.', keeper: PEOPLE[i] })),
}

describe('who lives in town', () => {
  it('is every character of master data, once each, and the pack\'s sisters, less the town\'s people', () => {
    const p = pack({ cast: { umas: [{ characterId: '9200001' }, { characterId: 's920000102', name: 'Invented Sister' }] }, town: TOWN })
    const folk = townsfolk(p)
    expect(folk).toHaveLength(120 - 14 + 1)
    expect(new Set(folk).size).toBe(folk.length)
    expect(folk).toContain('s920000102')
    for (const id of PEOPLE) expect(folk).not.toContain(id)
  })

  it('fills each role with the pack\'s people, and master data\'s from the last in its order where the pack names none', () => {
    const own = townOf(pack({ town: TOWN }))
    expect(own.people.map((p) => p.characterId)).toEqual(PEOPLE)
    expect(own.byRole.get('ida-stone')).toBe(PEOPLE[CAST_IDS.indexOf('ida-stone')])
    expect(own.spots.map((s) => [s.id, s.name, s.keeper])).toEqual(SPOT_IDS.map((id, i) => [id, `Invented spot ${i + 1}`, PEOPLE[i]]))
    // No town.json: the roles go to master data's last fourteen, never one of the cast (master data's first five here).
    const none = townOf(pack())
    expect(none.people.map((p) => p.characterId)).toEqual(EVERYONE.slice(-14).reverse())
    expect(none.people.every((p) => !p.written)).toBe(true)
    expect(none.spots.map((s) => s.name)).toEqual(SPOT_IDS.map((id) => PLACEHOLDER_SPOTS[id].name))
    expect(none.spots.find((s) => s.id === 'plaza')!.keeper).toBe(none.byRole.get('hollis-pryor'))
    // A partial town: the roles it leaves, and the spots' words it leaves, are the game's.
    const part = townOf(pack({ town: { people: [{ characterId: '9200050', game: 'ida-stone' }], spots: [{ id: 'cafe', keeper: '9200050' }] } }))
    expect(part.byRole.get('ida-stone')).toBe('9200050')
    expect(part.people).toHaveLength(CAST_IDS.length)
    expect(part.spots.find((s) => s.id === 'cafe')).toMatchObject({ name: 'The Café', keeper: '9200050' })
  })

  it('speaks a role as the Uma who plays it', () => {
    const p = pack({ town: TOWN })
    expect(speakerId(p, 'ida-stone')).toBe(PEOPLE[CAST_IDS.indexOf('ida-stone')])
    expect(speakerId(p, '9200001')).toBe('9200001')
    // With no master data and no town.json, the role stays the role.
    expect(speakerId(storyOf(null, null), 'ida-stone')).toBe('ida-stone')
    expect(isTownPerson(p, PEOPLE[0]!)).toBe(true)
    expect(isTownPerson(p, '9200001')).toBe(false)
  })
})

describe('the day\'s draw', () => {
  const p = pack({ town: TOWN })

  it('puts up to four at each spot, about two dozen in all, the same town all day', () => {
    const day = townDay(save(), p)
    for (const spot of SPOT_IDS) expect(day.spots.get(spot)!.length).toBe(SPOT_ROOM)
    expect(count(day)).toBe(24)
    expect(townDay(save(), p)).toEqual(day)
    for (const [id, spot] of day.where) expect(day.spots.get(spot)).toContain(id)
    for (const id of PEOPLE) expect(day.where.has(id)).toBe(false)
  })

  it('shows a different set tomorrow, and another player a different town', () => {
    const today = new Set(townDay(save(5), p).where.keys())
    const tomorrow = new Set(townDay(save(6), p).where.keys())
    expect([...tomorrow].filter((id) => today.has(id)).length).toBeLessThan(12)
    const other = new Set(townDay({ ...save(5), account: { ...save().account, uid: 'someone-else' } }, p).where.keys())
    expect(other).not.toEqual(today)
  })

  it('leaves the Umas on the farm at the farm, unseen in their places; one met who lives in town is out like anyone', () => {
    const roster = Object.fromEntries(ids(60).map((id) => [id, newRosterUma(1)]))
    const home = ids(20)
    const farm = save(5, { roster, dorm: { level: 8, home, swaps: [] } })
    const day = townDay(farm, p)
    for (const id of home) expect(day.where.has(id)).toBe(false)
    expect(ids(40, 9_200_021).some((id) => day.where.has(id))).toBe(true)
    // One who moves in today leaves her spot, and nobody else moves.
    const [mover] = ids(40, 9_200_021).filter((id) => day.where.has(id))
    const moved = townDay({ ...farm, dorm: { ...farm.dorm, home: [...home, mover!] } }, p)
    expect(moved.where.has(mover!)).toBe(false)
    expect([...moved.where]).toEqual([...day.where].filter(([id]) => id !== mover))
    // A few: everyone out but the day's Gate visitor (the welcome list's first).
    const few = storyOf(readStoryPack({ umas: {}, routes: {}, cast: { umas: ids(5, 9_000_001).map((characterId) => ({ characterId })) } }).pack, null)
    expect(count(townDay(save(), few))).toBe(4)
    expect(townDay(save(), few).where.has('9000001')).toBe(false)
  })

  it('puts her at her favourite spot more often', () => {
    const favourite = pack({ cast: { umas: [{ characterId: '9200007', spot: 'library' }], welcome: ['9200001'] }, town: TOWN })
    let out = 0
    let there = 0
    for (let d = 1; d <= 400; d++) {
      const spot = townDay(save(d), favourite).where.get('9200007')
      if (!spot) continue
      out++
      if (spot === 'library') there++
    }
    expect(out).toBeGreaterThan(40)
    // Without a favourite she'd be at each spot one day in six; with one, at hers well over twice that (while it has room).
    expect(there / out).toBeGreaterThan(2 / SPOT_IDS.length)
    expect(FAVOURITE_SPOT).toBeGreaterThan(0.5)
  })
})

describe('a talk in town', () => {
  const p = pack({ town: TOWN })
  const day = townDay(save(), p)
  const [first] = [...day.where.keys()]

  it('counts once a day, and again the next', () => {
    const once = talkInTown(save(), p, first!)
    expect(townTalksOf(once, first!)).toEqual({ talks: 1, last: 5 })
    expect(talkedToday(once, first!)).toBe(true)
    expect(talkInTown(once, p, first!)).toBe(once)
    // Tomorrow she's out or not by the draw; on a day she's out, the talk counts again.
    const next = Array.from({ length: 30 }, (_, i) => 6 + i).find((d) => townDay(save(d), p).where.has(first!))!
    const again = talkInTown({ ...once, calendar: { day: next } }, p, first!)
    expect(townTalksOf(again, first!)).toEqual({ talks: 2, last: next })
    // Nothing else moves, and the save's time isn't stamped.
    expect({ ...again, town: once.town, calendar: once.calendar }).toEqual(once)
  })

  it('needs her out in town today', () => {
    const home = PEOPLE.find((id) => !day.where.has(id))!
    expect(() => talkInTown(save(), p, home)).toThrow(SaveRuleError)
    const away = EVERYONE.find((id) => !day.where.has(id) && !PEOPLE.includes(id))!
    expect(() => talkInTown(save(), p, away)).toThrow('She isn’t out in town today.')
  })

  it('says her line: the pack\'s town lines, else the game\'s, the same all day', () => {
    expect(PLACEHOLDER_TOWN_LINES).toContain(townLineOf(save(), p, first!))
    expect(townLineOf(save(), p, first!)).toBe(townLineOf(save(), p, first!))
    const own = readStoryPack({ umas: { 9200001: { townLines: ['An invented hello.'] } }, routes: {}, cast: { umas: [{ characterId: '9200001' }] } }).pack
    expect(townLineOf(save(), own, '9200001')).toBe('An invented hello.')
  })
})
