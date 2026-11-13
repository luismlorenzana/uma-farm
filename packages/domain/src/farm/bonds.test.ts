// Bonds between Umas: the points and their sources, the
// hearts at their edges and CS44's days, the ties' seeds, the closest friend and Romance 4's ×1.5, side by side's extras
// and tended growth, the pair conversations and the morning's lines. Invented ids only: the stand-ins 9000001–9000003 and
// a cast of 9000004 onward built here.
import { describe, expect, it } from 'vitest'
import { blockGrowth, plant, setTender } from '../fields/fields'
import { runNight, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { joinOpening, arrive } from '../romance/arrivals'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV4 } from '../save/parse-v4'
import { SaveParseError } from '../save/parse'
import { newBlock, newSave, pairKey, type Block } from '../save/v3'
import { newSaveV4, type Love, type SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import type { Cast, CastEntry, PairConversations, Ties } from '../story/authored'
import { STAND_IN_CAST, STAND_IN_PAIR, STAND_IN_TIES, STAND_INS } from '../story/authored.fixture'
import { storyPackFrom, StoryPackError, type StoryPack } from '../story/pack'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import {
  addBond, atRomance4, BOND_HEARTS, BOND_POINTS, bondFactor, bondHearts, bondOf, bondsTonight, closestFriend, extrasShare, extrasTonight, newBondHearts, nextBondHeart,
  pairLevels, pairReadId, readLevels, readPair, seedTies, tendsSideBySide, tiesOf, TIE_SEEDS, unreadLevels,
} from './bonds'
import { draw } from './draw'
import { TALENT_D } from './talents'

const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const FOUR = '9000004'
const context = (story: NightContext['story'] = PACK): NightContext => ({ roster: [], kinds: TEST_KINDS, story, talentOf: () => TALENT_D })

/** A named v4 farm on `day` with the opening read: the stand-ins home, their ties seeded. */
function opened(day = 1, pack: Pick<StoryPack, 'cast' | 'ties'> = PACK): SaveV4 {
  return joinOpening(readScene({ ...newSaveV4('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }, 'scene:1:open'), pack)
}
/** The same, the seeds listed on an earlier morning, so a night's Hearts show only its own. */
const farm = (day = 3, pack: Pick<StoryPack, 'cast' | 'ties'> = PACK): SaveV4 => {
  const save = opened(day, pack)
  return { ...save, today: { ...save.today, bonds: {} } }
}
const withBond = (save: SaveV4, a: string, b: string, points: number): SaveV4 => ({ ...save, bonds: { ...save.bonds, [pairKey(a, b)]: points } })
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
/** The stand-in pack with a fourth Uma (no bible: her calling stands in), tied to two others. */
function packWithFour(calling: CastEntry['calling'] = 'foraging', ties: Ties = STAND_IN_TIES): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, { characterId: FOUR, outfitId: '900000401', arrives: { kind: 'beds', dormLevel: 4 }, calling, paragraph: 'Invented.' }] }
  const more: Ties = { version: 1, ties: [...json(ties).ties, { a: TWO, b: FOUR, kind: 'friends', strength: 1, line: 'They met here.', history: 'Invented.' }, { a: THREE, b: FOUR, kind: 'other', strength: 1, line: 'Neighbours.', history: 'Invented.' }] }
  return storyPackFrom({ ...STAND_IN_FILES, cast, ties: more })
}
/** A farm with the fourth Uma on the roster too. */
const withFour = (pack: StoryPack, day = 3): SaveV4 => {
  const save = arrive(farm(day, pack), FOUR, pack).save
  return { ...save, today: { ...save.today, bonds: {} } }
}

describe('bond hearts (CS44)', () => {
  it('come at 50, 150, 300, 500 and 750, at their edges', () => {
    expect(BOND_HEARTS).toEqual([50, 150, 300, 500, 750])
    expect([0, 49, 50, 149, 150, 299, 300, 499, 500, 749, 750, 2000].map(bondHearts)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
    expect([0, 50, 299, 750].map(nextBondHeart)).toEqual([50, 150, 300, null])
  })

  it('two at one place every day reach them on CS44\'s days 5, 15, 30, 50 and 75', () => {
    // 9000002 (a forager) and 9000003 (a fisher) at the forest: no favourite shared, a strength-1 tie seeded at 0.
    let save = farm()
    expect(bondOf(save, TWO, THREE)).toBe(0)
    const reached: number[] = []
    for (let day = 1; day <= 75; day++) {
      const before = bondHearts(bondOf(save, TWO, THREE))
      save = bondsTonight(save, PACK, [{ outfitId: TWO, place: 'forest' }, { outfitId: THREE, place: 'forest' }], []).save
      if (bondHearts(bondOf(save, TWO, THREE)) > before) reached.push(day)
    }
    expect(reached).toEqual([5, 15, 30, 50, 75])
  })
})

describe('what a pair earns (RM48; decisions 1–4)', () => {
  it('pays +10 a pair at one place, ×1.5 sharing a favourite line of that place\'s, once a night, the Fields\' tenders counted', () => {
    const pack = packWithFour('foraging')
    const save = withFour(pack)
    // 9000002 and 9000004 are foragers: ×1.5 at the forest and the Sawmill, ×1 at the Fishery.
    const forest = bondsTonight(save, pack, [{ outfitId: TWO, place: 'forest' }, { outfitId: FOUR, place: 'forest' }, { outfitId: THREE, place: 'fishery' }], [])
    expect(forest.paid).toEqual([{ a: TWO, b: FOUR, points: 15 }])
    expect(bondsTonight(save, pack, [{ outfitId: TWO, place: 'sawmill' }, { outfitId: FOUR, place: 'sawmill' }], []).paid).toEqual([{ a: TWO, b: FOUR, points: 15 }])
    expect(bondsTonight(save, pack, [{ outfitId: TWO, place: 'fishery' }, { outfitId: FOUR, place: 'fishery' }], []).paid).toEqual([{ a: TWO, b: FOUR, points: 10 }])
    // Three at one place: every pair, in order; a pair twice in a night is paid once.
    const three = bondsTonight(save, pack, [{ outfitId: TWO, place: 'forest' }, { outfitId: THREE, place: 'forest' }, { outfitId: FOUR, place: 'forest' }, { outfitId: TWO, place: 'sawmill' }, { outfitId: FOUR, place: 'sawmill' }], [])
    expect(three.paid).toEqual([{ a: TWO, b: THREE, points: 10 }, { a: TWO, b: FOUR, points: 15 }, { a: THREE, b: FOUR, points: 10 }])
    // The Fields' tenders are one place, farming its line: 9000001 (a farmer) and a farming fourth earn ×1.5.
    const farmers = packWithFour('farming')
    const tending = bondsTonight(withFour(farmers), farmers, [], [{ outfitId: ONE }, { outfitId: FOUR }])
    expect(tending.paid).toEqual([{ a: ONE, b: FOUR, points: 15 }])
    expect(bondsTonight(withFour(farmers), farmers, [{ outfitId: TWO, place: 'mill' }], [{ outfitId: ONE }]).paid).toEqual([])
  })

  it('takes every other source through addBond, whole, and never falls', () => {
    const save = farm()
    for (const source of ['party', 'team', 'meal', 'breakfast', 'house'] as const) {
      const { save: paid, paid: points } = addBond(save, PACK, THREE, TWO, BOND_POINTS[source])
      expect(points).toBe(BOND_POINTS[source])
      expect(bondOf(paid, TWO, THREE)).toBe(BOND_POINTS[source])
    }
    expect(BOND_POINTS).toEqual({ place: 10, party: 15, team: 20, meal: 5, breakfast: 5, house: 10 })
    expect(() => addBond(save, PACK, TWO, THREE, -5)).toThrow('Bonds never fall.')
    expect(() => addBond(save, PACK, TWO, TWO, 5)).toThrow('A bond is between two Umas.')
    expect(() => addBond(save, PACK, TWO, FOUR, 5)).toThrow('She isn’t on the farm.')
    expect(addBond(save, PACK, TWO, THREE, 0).save).toBe(save)
    // Whole: each pay rounds once, half up.
    expect(addBond(save, PACK, TWO, THREE, 7.5).paid).toBe(8)
  })
})

describe('the closest friend and Romance 4 (RM49; decisions 4 and 6)', () => {
  it('is her strongest tie, then the most bond points, then the ties\' order, on the farm or not', () => {
    expect(closestFriend(PACK, farm(), ONE)).toBe(TWO)
    expect(closestFriend(PACK, farm(), THREE)).toBe(ONE)
    expect(closestFriend(PACK, farm(), FOUR)).toBeNull()
    // Two ties of one strength: the ties' order, until the other has more points.
    const even: Ties = { version: 1, ties: STAND_IN_TIES.ties.map((t) => ({ ...t, strength: t.b === TWO || t.b === THREE ? 2 : 1 })) }
    const pack = { ...PACK, ties: even }
    const level = withBond(withBond(farm(), ONE, TWO, 50), ONE, THREE, 50)
    expect(tiesOf(pack, level, ONE).map((t) => t.with)).toEqual([TWO, THREE])
    expect(closestFriend(pack, withBond(level, ONE, THREE, 60), ONE)).toBe(THREE)
    expect(closestFriend(pack, withBond(withBond(level, ONE, THREE, 60), ONE, TWO, 60), ONE)).toBe(TWO)
    // A stronger tie wins over more points.
    expect(closestFriend(PACK, withBond(farm(), ONE, THREE, 700), ONE)).toBe(TWO)
    // Before her friend arrives, she's still the closest.
    const alone = arrive({ ...newSaveV4('u1', AT), farmer: { name: 'Robin' } }, ONE, PACK).save
    expect(closestFriend(PACK, alone, ONE)).toBe(TWO)
  })

  it('gives ×1.5 when either is at Romance 4 and the other her closest friend; once when both are', () => {
    const save = farm()
    expect([{ stage: 'romance', level: 3 }, { stage: 'romance', level: 4 }, { stage: 'proposal', level: 10 }, { stage: 'spouse', level: 0 }, { stage: 'confession', level: 10 }]
      .map((l) => atRomance4(l as Love))).toEqual([false, true, true, true, false])
    const r4 = withLove(save, ONE, { stage: 'romance', level: 4 })
    expect(bondFactor(r4, PACK, ONE, TWO)).toBe(1.5)
    expect(bondFactor(r4, PACK, TWO, ONE)).toBe(1.5)
    // 9000003 isn't her closest friend.
    expect(bondFactor(r4, PACK, ONE, THREE)).toBe(1)
    expect(addBond(r4, PACK, ONE, TWO, 10).paid).toBe(15)
    // Both at Romance 4, each the other's closest: still ×1.5, never ×2.25.
    const both = withLove(r4, TWO, { stage: 'romance', level: 6 })
    expect(bondFactor(both, PACK, ONE, TWO)).toBe(1.5)
    expect(addBond(both, PACK, ONE, TWO, 10).paid).toBe(15)
    // With a shared line: 10 × 1.5 × 1.5 = 22.5, rounded once to 23.
    expect(addBond(both, PACK, ONE, TWO, 15).paid).toBe(23)
  })
})

describe('the ties\' seeds (RM49; decision 5)', () => {
  it('seeds 3 → 150, 2 → 50 and 1 → 0 when the second Uma arrives, not before', () => {
    expect(TIE_SEEDS).toEqual({ 1: 0, 2: 50, 3: 150 })
    let save: SaveV4 = { ...newSaveV4('u1', AT), farmer: { name: 'Robin' } }
    save = arrive(save, ONE, PACK).save
    expect(save.bonds).toEqual({})
    save = arrive(save, TWO, PACK).save
    expect(save.bonds).toEqual({ [pairKey(ONE, TWO)]: 150 })
    save = arrive(save, THREE, PACK).save
    expect(save.bonds).toEqual({ [pairKey(ONE, TWO)]: 150, [pairKey(ONE, THREE)]: 50 })
    expect(bondHearts(bondOf(save, ONE, TWO))).toBe(2)
    expect(bondHearts(bondOf(save, ONE, THREE))).toBe(1)
    // The opening seeds the three on day 1; without the pack's ties, an arrival seeds nothing.
    expect(opened(1).bonds).toEqual(save.bonds)
    expect(arrive(arrive({ ...newSaveV4('u1', AT), farmer: { name: 'Robin' } }, ONE).save, TWO).save.bonds).toEqual({})
  })

  it('never lowers a bond, and a seeded heart is a new heart: its conversation opens and the morning lists it', () => {
    const both = arrive(arrive({ ...newSaveV4('u1', AT), farmer: { name: 'Robin' } }, ONE).save, TWO).save
    expect(seedTies(withBond(both, ONE, TWO, 400), PACK, TWO).bonds[pairKey(ONE, TWO)]).toBe(400)
    const seeded = seedTies(both, PACK, TWO)
    expect(seeded.today.bonds).toEqual({ [pairKey(ONE, TWO)]: 0 })
    expect(unreadLevels(seeded, PACK, ONE, TWO)).toEqual([1, 2])
    // Day 1: the opening's seeds, listed the next morning, once.
    const morning = runNight(opened(1), context())
    expect(morning.summary!.hearts).toEqual([{ kind: 'bond', a: ONE, b: TWO, hearts: 2 }, { kind: 'bond', a: ONE, b: THREE, hearts: 1 }])
    expect(morning.today.bonds).toEqual({})
    expect(runNight(morning, context()).summary!.hearts).toEqual([])
    expect(parseSaveV4(json(morning), 'save', TEST_KINDS)).toEqual(morning)
  })

  it('seeds an Uma arriving at night, listed that morning only', () => {
    const pack = packWithFour('fishing', { version: 1, ties: [...STAND_IN_TIES.ties] })
    const strong: StoryPack = { ...pack, ties: { version: 1, ties: pack.ties.ties.map((t) => (t.b === FOUR && t.a === TWO ? { ...t, strength: 3 } : t)) } }
    const bought: SaveV4 = { ...farm(5, strong), buildings: { dorm: 4 } }
    const night = runNight(bought, context(strong))
    expect(night.roster[FOUR]).toBeDefined()
    expect(bondOf(night, TWO, FOUR)).toBe(150)
    expect(night.summary!.hearts).toEqual([{ kind: 'arrived', id: FOUR, home: true }, { kind: 'bond', a: TWO, b: FOUR, hearts: 2 }])
    expect(runNight(night, context(strong)).summary!.hearts.filter((h) => h.kind === 'bond')).toEqual([])
  })
})

describe('the night: points at step 6 (decision 2)', () => {
  it('ticks bonds for two at the forest, 290 → 300 reaching 3 hearts in the morning\'s line; v3 and a night without the pack tick none', () => {
    let save = withBond(farm(3), TWO, THREE, 290)
    save = startLoopJob(save, { outfitId: TWO, place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 2 } }, AT, TEST_KINDS)
    save = startLoopJob(save, { outfitId: THREE, place: 'forest', slot: 1, request: { kind: 'gather', item: 'pine-log', count: 2 } }, AT, TEST_KINDS)
    const night = runNight(save, context())
    expect(bondOf(night, TWO, THREE)).toBe(300)
    expect(night.summary!.hearts).toContainEqual({ kind: 'bond', a: TWO, b: THREE, hearts: 3 })
    expect(bondOf(runNight(save, { ...context(), story: undefined }), TWO, THREE)).toBe(290)
    // M4 (v3) has no bonds: its night ticks none.
    const v3 = { ...newSave('u1', AT), bonds: { '101:202': 10 } }
    expect(runNight(v3, { roster: [], kinds: TEST_KINDS }).bonds).toEqual({ '101:202': 10 })
  })
})

describe('side by side (CS17, CS44; decision 7)', () => {
  const made = (id: string, n: number, key = 'pine-log@2') => ({ outfitId: id, place: 'forest', items: Array.from({ length: n }, () => key) })
  const worked = [{ outfitId: TWO, place: 'forest' }, { outfitId: THREE, place: 'forest' }]

  it('adds 10% of a night\'s items at 3 hearts, none at 2, the same goods and stars into the Warehouse', () => {
    const at3 = withBond(farm(), TWO, THREE, 300)
    expect(extrasShare(at3, TWO, 'forest', worked)).toBeCloseTo(0.1)
    expect(extrasShare(withBond(farm(), TWO, THREE, 299), TWO, 'forest', worked)).toBe(0)
    // Her partner at another place: none.
    expect(extrasShare(at3, TWO, 'forest', [{ outfitId: TWO, place: 'forest' }, { outfitId: THREE, place: 'fishery' }])).toBe(0)
    const ten = extrasTonight(at3, [made(TWO, 10), made(THREE, 20, 'oak-log@3')], worked)
    expect(ten.extras).toEqual([{ id: TWO, items: ['pine-log@2'] }, { id: THREE, items: ['oak-log@3', 'oak-log@3'] }])
    expect(goodCount(ten.save.items, 'pine-log') - goodCount(at3.items, 'pine-log')).toBe(1)
    expect(ten.save.items['oak-log']![2]! - (at3.items['oak-log']?.[2] ?? 0)).toBe(2)
    expect(extrasTonight(withBond(farm(), TWO, THREE, 299), [made(TWO, 10)], worked).extras).toEqual([])
    expect(extrasTonight({ ...newSave('u1', AT), bonds: {} }, [made(TWO, 10)], worked).extras).toEqual([])
  })

  it('draws the fraction by draw(uid, day, \'bond:<id>\', 0): an exact count over a seeded sample', () => {
    // Five items a night: 0.5 expected, one extra when the draw is under 0.5.
    let total = 0
    let expected = 0
    for (let day = 1; day <= 200; day++) {
      const save = { ...withBond(farm(), TWO, THREE, 300), calendar: { day } }
      total += extrasTonight(save, [made(TWO, 5)], worked).extras.reduce((n, e) => n + e.items.length, 0)
      expected += draw('u1', day, `bond:${TWO}`, 0) < 0.5 ? 1 : 0
    }
    expect(total).toBe(expected)
    expect(total).toBeGreaterThan(70)
    expect(total).toBeLessThan(130)
  })

  it('pays at step 4 the night after the bond reaches 3 hearts, and says it in the morning', () => {
    // One Pine Log a night each: 0.1 expected, so an extra comes on an account and day whose draw is under 0.1.
    const uids = Array.from({ length: 200 }, (_, i) => `u${i}`)
    const pays = uids.find((uid) => draw(uid, 3, `bond:${TWO}`, 0) < 0.1 && draw(uid, 3, `bond:${THREE}`, 0) >= 0.1)!
    const quiet = uids.find((uid) => draw(uid, 3, `bond:${TWO}`, 0) >= 0.1 && draw(uid, 3, `bond:${THREE}`, 0) >= 0.1)!
    const night = (uid: string, points: number) => {
      const base = withBond(farm(3), TWO, THREE, points)
      let save: SaveV4 = { ...base, account: { ...base.account, uid } }
      save = startLoopJob(save, { outfitId: TWO, place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 4 } }, AT, TEST_KINDS)
      save = startLoopJob(save, { outfitId: THREE, place: 'forest', slot: 1, request: { kind: 'gather', item: 'pine-log', count: 4 } }, AT, TEST_KINDS)
      return { save, after: runNight(save, context()) }
    }
    const { save, after } = night(pays, 300)
    expect(after.summary!.hearts).toContainEqual({ kind: 'side', items: 1 })
    expect(goodCount(after.items, 'pine-log') - goodCount(save.items, 'pine-log')).toBe(1)
    expect(night(quiet, 300).after.summary!.hearts.some((h) => h.kind === 'side')).toBe(false)
    // At 290 the night's bond reaches 300 at step 6, after step 4: no extras until the next night.
    expect(night(pays, 290).after.summary!.hearts.some((h) => h.kind === 'side')).toBe(false)
  })

  it('grows a tended block ×1.1 beside a 3-heart partner tending another growing block; never on v3', () => {
    const farmers = packWithFour('farming')
    const base = withFour(farmers)
    const blockB: Block = { ...newBlock('B'), tender: FOUR, plots: newBlock('B').plots.map((p, i) => (i === 0 ? { ...p, crop: 'carrot' } : p)) }
    const planted = setTender(plant(base, 'A', 0, 'seed-carrot'), 'A', ONE, TEST_KINDS)
    const tended: SaveV4 = { ...planted, fields: { blocks: [planted.fields.blocks[0]!, blockB] } }
    const plain = blockGrowth(tended, 'A')
    expect(tendsSideBySide(tended, 'A')).toBe(false)
    const close = withBond(tended, ONE, FOUR, 300)
    expect(tendsSideBySide(close, 'A')).toBe(true)
    expect(tendsSideBySide(close, 'B')).toBe(true)
    expect(blockGrowth(close, 'A')).toBeCloseTo(plain * 1.1, 6)
    expect(tendsSideBySide(withBond(tended, ONE, FOUR, 299), 'A')).toBe(false)
    // Her partner's block with nothing growing: she isn't working beside her.
    const idle: SaveV4 = { ...close, fields: { blocks: [close.fields.blocks[0]!, { ...blockB, plots: newBlock('B').plots }] } }
    expect(tendsSideBySide(idle, 'A')).toBe(false)
    // v3 never.
    expect(tendsSideBySide({ version: 3, bonds: close.bonds, fields: close.fields }, 'A')).toBe(false)
    // At night step 2 the block grows by it.
    const night = runNight(close, context(farmers))
    expect(night.fields.blocks[0]!.plots[0]!.growth).toBeCloseTo(plain * 1.1, 6)
  })
})

describe('pair conversations (RM50; decisions 9 and 10)', () => {
  it('reads the stand-in pair\'s five levels from the pack; none for another pair', async () => {
    expect([...pairLevels(PACK, TWO, ONE)]).toEqual([1, 2, 3, 4, 5])
    expect(pairLevels(PACK, ONE, THREE).size).toBe(0)
    expect(await PACK.pair(TWO, ONE)).toEqual(STAND_IN_PAIR)
    expect(await PACK.pair(ONE, THREE)).toBeNull()
  })

  it('opens a level per heart; Read puts it in diary.read once, pays nothing, and refuses a level not reached or not written', () => {
    const save = withBond(farm(), ONE, TWO, 300)
    expect(unreadLevels(save, PACK, ONE, TWO)).toEqual([1, 2, 3])
    expect(unreadLevels(save, PACK, ONE, TWO, 2)).toEqual([1, 2])
    const read = readPair(save, PACK, TWO, ONE, [1, 2])
    expect(read.diary.read).toEqual([...save.diary.read, pairReadId(ONE, TWO, 1), pairReadId(ONE, TWO, 2)])
    expect(pairReadId(TWO, ONE, 3)).toBe('pair:9000001-9000002:3')
    expect(readLevels(read, ONE, TWO)).toEqual([1, 2])
    expect(unreadLevels(read, PACK, ONE, TWO)).toEqual([3])
    expect(readPair(read, PACK, ONE, TWO, [1])).toBe(read)
    expect(read.love).toEqual(save.love)
    expect(read.bonds).toEqual(save.bonds)
    expect(() => readPair(save, PACK, ONE, TWO, [4])).toThrow('Their bond isn’t there yet.')
    expect(() => readPair(withBond(save, ONE, THREE, 300), PACK, ONE, THREE, [1])).toThrow('That conversation isn’t written yet.')
    expect(parseSaveV4(json(read))).toEqual(read)
  })

  it('validates a pack\'s pairs: partial levels, each once, named in numeric order, a tie\'s pair only', () => {
    const partial: PairConversations = { ...json(STAND_IN_PAIR), levels: json(STAND_IN_PAIR).levels.slice(0, 2) }
    expect([...storyPackFrom({ ...STAND_IN_FILES, pairs: { '9000001-9000002': partial } }).pairs.get(pairKey(ONE, TWO))!]).toEqual([1, 2])
    const issues = (pairs: Record<string, unknown>) => {
      try {
        storyPackFrom({ ...STAND_IN_FILES, pairs })
        return []
      } catch (error) {
        return (error as StoryPackError).issues
      }
    }
    expect(issues({ '9000002-9000001': { ...partial, a: TWO, b: ONE } })).toEqual(['pairs/9000002-9000001: its name and its a, b are the two ids in numeric order, <a>-<b>'])
    expect(issues({ '9000001-9000002': { ...partial, levels: [...partial.levels, partial.levels[0]!] } })).toEqual(['pairs/9000001-9000002: Bond level 1 is written twice'])
    expect(issues({ '9000001-9000002': { ...partial, levels: [{ ...partial.levels[0]!, hearts: 6 }] } })).toEqual(['pairs/9000001-9000002: Level 1: hearts is 1–5'])
    // A pair the ties don't hold isn't RS12's.
    const four = packWithFour()
    expect(() => storyPackFrom({ ...STAND_IN_FILES, cast: four.cast, ties: four.ties, pairs: { '9000001-9000004': { a: ONE, b: FOUR, levels: partial.levels.map((l) => ({ ...l, steps: [{ say: ONE, line: 'Hi.' }] })) } } }))
      .toThrow('not a tie\'s pair')
  })
})

describe('the morning\'s lines and their parse (decisions 7 and 9)', () => {
  it('lists a pair once at its highest heart, in the cast\'s order, against today.bonds or last night\'s', () => {
    const before = withBond(withBond(farm(), ONE, THREE, 140), TWO, THREE, 0)
    const after = withBond(withBond(before, ONE, THREE, 320), TWO, THREE, 60)
    expect(newBondHearts(before, after, [ONE, TWO, THREE])).toEqual([{ kind: 'bond', a: ONE, b: THREE, hearts: 3 }, { kind: 'bond', a: TWO, b: THREE, hearts: 1 }])
    expect(newBondHearts(before, after, [THREE, TWO, ONE])).toEqual([{ kind: 'bond', a: TWO, b: THREE, hearts: 1 }, { kind: 'bond', a: ONE, b: THREE, hearts: 3 }])
    // A pair noted at 0 today (a seed by day) counts from 0.
    const noted = { ...before, today: { ...before.today, bonds: { [pairKey(ONE, TWO)]: 0 } } }
    expect(newBondHearts(noted, noted, [ONE, TWO, THREE])).toEqual([{ kind: 'bond', a: ONE, b: TWO, hearts: 2 }])
  })

  it('parses the side and bond lines and today.bonds strictly; v4\'s bonds are whole', () => {
    const save = farm(5)
    const summary = { day: 5, bin: [], work: [], ranks: [], hearts: [{ kind: 'side', items: 3 }, { kind: 'bond', a: ONE, b: TWO, hearts: 2 }], news: [], nudges: [] }
    const good = { ...save, summary, today: { ...save.today, bonds: { [pairKey(ONE, TWO)]: 1 } } }
    expect(parseSaveV4(json(good))).toEqual(good)
    const bad = (patch: Record<string, unknown>, path: string) => {
      expect(() => parseSaveV4(json({ ...good, ...patch }))).toThrow(SaveParseError)
      try {
        parseSaveV4(json({ ...good, ...patch }))
      } catch (error) {
        expect((error as SaveParseError).path).toBe(path)
      }
    }
    bad({ summary: { ...summary, hearts: [{ kind: 'bond', a: TWO, b: ONE, hearts: 2 }] } }, 'save.summary.hearts.0.b')
    bad({ summary: { ...summary, hearts: [{ kind: 'bond', a: ONE, b: TWO, hearts: 6 }] } }, 'save.summary.hearts.0.hearts')
    bad({ summary: { ...summary, hearts: [{ kind: 'bond', a: ONE, b: '9000009', hearts: 1 }] } }, 'save.summary.hearts.0.b')
    bad({ summary: { ...summary, hearts: [{ kind: 'side', items: 0 }] } }, 'save.summary.hearts.0.items')
    bad({ summary: { ...summary, hearts: [{ kind: 'side', items: 1 }, { kind: 'side', items: 2 }] } }, 'save.summary.hearts.1')
    bad({ summary: { ...summary, hearts: [{ kind: 'bond', a: ONE, b: TWO, hearts: 1 }, { kind: 'bond', a: ONE, b: TWO, hearts: 2 }] } }, 'save.summary.hearts.1')
    bad({ today: { ...save.today, bonds: { [`${TWO}:${ONE}`]: 1 } } }, `save.today.bonds.${TWO}:${ONE}`)
    bad({ today: { ...save.today, bonds: { [pairKey(ONE, TWO)]: 6 } } }, `save.today.bonds.${pairKey(ONE, TWO)}`)
    bad({ bonds: { [pairKey(ONE, TWO)]: 150.5 } }, `save.bonds.${pairKey(ONE, TWO)}`)
  })
})
