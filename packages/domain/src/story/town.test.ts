// The town in the pack and the save: `town.json` read with errors and notes, a cast entry's favourite spot, sisters
// (`s<outfitId>`) in the cast, the ties, the bibles and the routes, a tie with one of the town's people (no bond, never
// the closest friend), and the save's talks, an older v4 without them loading as it was. Invented ids only: the
// stand-ins 9000001–9000003, invented characters 9300001 on and invented sisters `s93000xxxx`.
import { describe, expect, it } from 'vitest'
import { closestFriend, seedTies } from '../farm/bonds'
import { meet } from '../romance/meeting'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, pairKey, type SaveV4 } from '../save/v4'
import { checkCast, checkTies, checkTown, SPOT_IDS, STORY_ID } from './authored'
import { readStoryPack } from './pack'
import { firstVisitorOf, outfitOf, sisterNameOf, storyOf, welcomeOf, writtenOf } from './placeholders'

const AT = '2026-11-13T10:00:00.000Z'
const SISTER = 's930000102'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('town.json', () => {
  it('reads its people and spots; a person or a spot it can\'t read is skipped, a field dropped', () => {
    const read = checkTown({
      people: [
        { characterId: '9300101', does: 'Keeps the invented bakery.', game: 'marta-quill', voice: 'kept' },
        { characterId: '9300102', game: 'courier' },
        { characterId: '9300102', game: 'musician' },
        { characterId: 'Nine' },
        { characterId: '9300103', game: 'marta-quill' },
        { characterId: '9300104', game: 'lighthouse' },
      ],
      spots: [
        { id: 'plaza', name: 'Invented Square', blurb: 'An invented line.', keeper: '9300101' },
        { id: 'cafe', keeper: 'courier' },
        { id: 'cafe' },
        { id: 'moon' },
        { id: 'track', keeper: '9399999', name: 'x'.repeat(41) },
      ],
    })
    expect(read.errors).toEqual([
      'Person 3 (9300102): listed twice; the later one is skipped',
      'Person 4: no characterId (master data’s id, a positive integer); skipped',
      'Person 5 (9300103): game marta-quill is someone else’s role already; skipped',
      'Spot cafe: twice; the later one is skipped',
      'Spot 4: id is one of the town’s spots (plaza, market, cafe, harbour, library, track); skipped',
      'Spot track name: its name is 41 characters; the screen shows 40; skipped',
      'Spot track: keeper 9399999 isn’t one of the town’s people (her characterId or her role); skipped',
    ])
    expect(read.notes).toContain('Person 6 (9300104): game lighthouse isn’t one of the town’s roles (hollis-pryor, marta-quill, ben-carver, dale-hart, gus-talbot, rosa-bell, juno-park, ida-stone, nils-berg, wren-ashby, cole-varga, courier, musician, bell-keeper); she’s one of the town’s people all the same')
    expect(read.notes).toContain('spots: market, harbour, library aren’t named, so the game’s own play')
    expect(read.value!.people!.map((p) => [p.characterId, p.game])).toEqual([['9300101', 'marta-quill'], ['9300102', 'courier'], ['9300103', undefined], ['9300104', 'lighthouse']])
    expect(read.value!.people![0]).toMatchObject({ does: 'Keeps the invented bakery.', voice: 'kept' })
    expect(read.value!.spots!.map((s) => [s.id, s.keeper])).toEqual([['plaza', '9300101'], ['cafe', 'courier'], ['track', undefined]])
    expect(checkTown([]).errors).toEqual(['Not a town (an object with people and spots); the game’s own plays'])
  })

  it('names the six spots a trigger may name', () => {
    expect(SPOT_IDS).toEqual(['plaza', 'market', 'cafe', 'harbour', 'library', 'track'])
    const meet = (spot: string) => checkCast({ umas: [{ characterId: '9300001', meet: { kind: 'spot', spot } }] })
    expect(meet('harbour').value.umas[0]!.meet).toEqual({ kind: 'spot', spot: 'harbour' })
    expect(meet('riverside').errors).toEqual(['Uma 1 (9300001) meet: a spot names one of the town’s spots: plaza, market, cafe, harbour, library, track; skipped'])
  })
})

describe('the cast\'s spots and sisters', () => {
  it('reads her favourite spot, and a sister by her id with her name', () => {
    const read = checkCast({
      umas: [
        { characterId: '9300001', spot: 'cafe' },
        { characterId: '9300002', spot: 'moon', name: 'Ignored' },
        { characterId: SISTER, name: 'Invented Sister', outfitId: '930000201', arrives: { kind: 'beds', dormLevel: 3 }, spot: 'library' },
        { characterId: 's930000301' },
      ],
    })
    expect(read.errors).toEqual(['Uma 2 (9300002): spot is one of the town’s spots: plaza, market, cafe, harbour, library, track; skipped'])
    expect(read.notes).toEqual(expect.arrayContaining([
      'Uma 2 (9300002): her name is master data’s; a name is read for a sister only',
      `Uma 3 (${SISTER}): a sister plays her own outfit, 930000102; outfitId is ignored`,
      `Uma 3 (${SISTER}): arrives is retired: you meet her by introducing yourself in town, so it’s dropped`,
      'Uma 4 (s930000301): a sister with no name shows as her elder’s sister',
    ]))
    expect(read.value.umas.map((u) => [u.characterId, u.spot, u.name])).toEqual([
      ['9300001', 'cafe', undefined], ['9300002', undefined, 'Ignored'], [SISTER, 'library', 'Invented Sister'], ['s930000301', undefined, undefined],
    ])
    expect(read.value.umas[2]).not.toHaveProperty('outfitId')
    expect(read.value.umas[2]).not.toHaveProperty('arrives')
    expect(STORY_ID.test(SISTER)).toBe(true)
    expect(STORY_ID.test('s0123')).toBe(false)
  })

  it('plays a sister\'s own outfit and her name; the default welcome list leaves her out, a pack\'s may name her', () => {
    const pack = storyOf(readStoryPack({ umas: {}, routes: {}, cast: { umas: [{ characterId: SISTER, name: 'Invented Sister' }, { characterId: 's930000301' }, { characterId: '9300001' }] } }).pack, null)
    expect(outfitOf(pack, SISTER)).toBe('930000102')
    expect(sisterNameOf(pack, SISTER, 'Her Elder')).toBe('Invented Sister')
    expect(sisterNameOf(pack, 's930000301', 'Her Elder')).toBe('Her Elder’s sister')
    expect(sisterNameOf(pack, 's930000301', null)).toBeNull()
    expect(welcomeOf(pack)).toEqual(['9300001'])
    expect(firstVisitorOf(pack)).toBe('9300001')
    expect(firstVisitorOf({ cast: { ...pack.cast, welcome: [SISTER, '9300001'] } })).toBe(SISTER)
    expect(writtenOf(pack, SISTER).find((p) => p.part === 'Her name')).toEqual({ part: 'Her name', written: true, plays: 'Invented Sister' })
    expect(writtenOf(pack, '9300001').some((p) => p.part === 'Her name')).toBe(false)
  })

  it('reads a sister\'s bible and route by her id, and her ties', () => {
    const read = readStoryPack({
      cast: { umas: [{ characterId: SISTER }, { characterId: '9300001' }] },
      ties: { ties: [{ a: SISTER, b: '9300001', kind: 'sisters', strength: 3, line: 'Invented sisters.' }] },
      umas: { [SISTER]: { townLines: ['An invented hello.', 'x'.repeat(161)] } },
      routes: { [SISTER]: { events: [{ id: 'arrival', steps: [{ say: SISTER, line: 'Invented.' }] }] } },
    })
    expect(read.errors).toEqual(['umas/s930000102.json: townLines 2: its line is 161 characters; the screen shows 160; skipped'])
    expect(read.pack.bibles.get(SISTER)!.townLines).toEqual(['An invented hello.'])
    expect(read.pack.scripted.get(SISTER)).toEqual(new Set(['arrival']))
    expect(read.pack.ties.ties).toHaveLength(1)
    // A sister sorts by her number, after a plain id of the same number, either way round.
    expect(pairKey(SISTER, '9300001')).toBe(`9300001:${SISTER}`)
    expect(pairKey('9300001', SISTER)).toBe(`9300001:${SISTER}`)
    expect(pairKey('930000102', SISTER)).toBe(`930000102:${SISTER}`)
    expect(pairKey(SISTER, '930000102')).toBe(`930000102:${SISTER}`)
    expect(pairKey('9000002', '9000001')).toBe('9000001:9000002')
  })
})

describe('a tie with one of the town\'s people', () => {
  const town = { people: [{ characterId: '9300101', game: 'ida-stone' }] }
  const files = {
    cast: { umas: [{ characterId: '9000001' }, { characterId: '9000002' }] },
    ties: { ties: [{ a: '9000001', b: '9300101', strength: 3, line: 'The smith taught her.' }, { a: '9000001', b: '9000002', strength: 1 }] },
    umas: {}, routes: {}, town,
  }

  it('reads, with a note: it builds no bond, and its line shows on both profiles', () => {
    const read = readStoryPack(files)
    expect(read.errors).toEqual([])
    expect(read.notes).toContain('ties.json: Tie 1: 9300101 is one of the town’s people, so the tie builds no bond; its line shows on both profiles')
    expect(checkTies(files.ties, { umas: new Set(['9000001', '9000002']) }).notes).toContain('Tie 1: 9300101 isn’t in the cast, so the tie never starts')
    // She speaks in any scene, by her id or her role's.
    const scene = readStoryPack({ ...files, routes: { 9000001: { events: [{ id: 'f1', steps: [{ say: '9300101', line: 'Invented.' }, { say: 'ida-stone', line: 'Invented.' }] }] } } })
    expect(scene.notes.filter((n) => n.includes('isn’t one who speaks here'))).toEqual([])
  })

  it('is never her closest friend, and seeds no bond', () => {
    const pack = readStoryPack(files).pack
    let save: SaveV4 = { ...newSave('u1', AT), calendar: { day: 3 }, farmer: { name: 'Robin' } }
    for (const id of ['9000001', '9000002']) save = meet(save, id, pack).save
    expect(closestFriend(pack, save, '9000001')).toBe('9000002')
    expect(seedTies(save, pack, '9000001').bonds).toEqual(save.bonds)
    expect(Object.keys(save.bonds)).toEqual([])
  })
})

describe('the save\'s talks in town', () => {
  const day = (n: number): SaveV4 => ({ ...newSave('u1', AT), calendar: { day: n } })

  it('loads an older v4 with none as none, an older v5\'s with no gift day as none, and round-trips them', () => {
    const older = json(day(9)) as Partial<SaveV4>
    delete older.town
    expect(parseSaveV5(older).town).toEqual({})
    expect(parseSaveV5(older).account).toEqual(day(9).account)
    const older5 = { ...day(9), town: { 9300001: { talks: 3, last: 9 }, [SISTER]: { talks: 1, last: 4 } } }
    expect(parseSaveV5(json(older5)).town).toEqual({ 9300001: { talks: 3, last: 9, gift: 0 }, [SISTER]: { talks: 1, last: 4, gift: 0 } })
    expect(parseSaveV5(json(older5)).account).toEqual(day(9).account)
    const talked = { ...day(9), town: { 9300001: { talks: 3, last: 9, gift: 8 }, [SISTER]: { talks: 0, last: 0, gift: 4 } } }
    expect(parseSaveV5(json(talked))).toEqual(talked)
  })

  it('refuses an id off the form, a talk after today, and none counted', () => {
    const refuse = (town: unknown, message: string) => expect(() => parseSaveV5({ ...json(day(9)), town })).toThrow(message)
    refuse({ abc: { talks: 1, last: 2 } }, 'save.town.abc: expected a character id or a sister’s')
    refuse({ 9300001: { talks: 1, last: 10 } }, 'save.town.9300001.last: expected 0–9')
    refuse({ 9300001: { talks: 1, last: 2, gift: 10 } }, 'save.town.9300001.gift: expected 0–9')
    refuse({ 9300001: { talks: 0, last: 2 } }, 'save.town.9300001.talks')
    refuse({ 9300001: { talks: 2, last: 0 } }, 'save.town.9300001.talks')
    refuse({ 9300001: { talks: 1, last: 2, spot: 'cafe' } }, 'save.town.9300001: unknown keys spot')
  })
})
