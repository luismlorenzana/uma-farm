// The perks' effects: `hasPerk` from her level, the romance term
// and its caps, in her element, the line effects at night and at harvest, night chores, morning items, the mentor, her
// keepsake, her signature dish, breakfast, the format's keepsake and pet name, and the save's new fields and lines.
// Invented ids only: the stand-ins 9000001–9000003 and a 9000004 built here.
import { describe, expect, it } from 'vitest'
import { dishName } from '../goods/ids'
import { extrasShare, extrasTonight, bondOf } from '../farm/bonds'
import { draw } from '../farm/draw'
import { rankPoints } from '../farm/rank-rules'
import { TALENT_D, talentsD } from '../farm/talents'
import { blockGrowth, growFields, harvest, harvestQuality, tenderTerms } from '../fields/fields'
import { FOREST } from '../gathering/tables'
import { gatherQuality, loopKinds, planHaul, sharesOn, termsOf } from '../gathering/kinds'
import { runNight, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV4 } from '../save/parse-v4'
import { newBlock, newSave, pairKey, type Block, type Love, type Plot, type SaveV4 } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'
import { checkBible, type Cast, type Ties, type UmaBible } from '../story/authored'
import { STAND_IN_BIBLE, STAND_IN_CAST, STAND_IN_TIES, STAND_INS } from '../story/authored.fixture'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { arrive, joinOpening } from './arrivals'
import { playEvent } from './events'
import { advance } from './love'
import { perksFor } from './perks'
import {
  breakfast, choresTonight, fieldChores, gatherChores, leaveMorningItems, lineGrade, MENTOR_POINTS, mentorsTonight, signatureDish,
} from './perk-effects'
import {
  choresOf, hasPerk, inElement, KEEPSAKE_GROWN, KEEPSAKE_QUALITY, keepsakeQuality, morningDue, morningRule, morningsToItem, romanceBonus, romanceTerms, routeIndex,
} from './perk-terms'

const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS as [string, string, string]
const FOUR = '9000004'
const context = (story: NightContext['story'] = PACK): NightContext => ({ kinds: TEST_KINDS, story, talentOf: () => TALENT_D })

/** A named farm on `day`, the opening read: 9000001 (a farmer), 9000002 (a forager) and 9000003 (a fisher) home. */
function farm(day = 3, pack: Pick<StoryPack, 'cast' | 'ties'> = PACK): SaveV4 {
  const save = joinOpening(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }, 'scene:1:open'), pack)
  return { ...save, today: { ...save.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const at = (stage: Love['stage'], level: number, more: Partial<Love> = {}): Partial<Love> => ({ stage, level, ...more })
const spouse = (level: number, more: Partial<Love> = {}): Partial<Love> => ({ stage: 'spouse', level, wed: 1, ...more })
const withBond = (save: SaveV4, a: string, b: string, points: number): SaveV4 => ({ ...save, bonds: { ...save.bonds, [pairKey(a, b)]: points } })
/** The stand-in pack with a fourth Uma (no bible: her calling stands in), tied to two others. */
function packWithFour(calling: 'farming' | 'foraging' | 'fishing' | 'mining' | 'quarry'): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, { characterId: FOUR, outfitId: '900000401', arrives: { kind: 'beds', dormLevel: 4 }, calling, paragraph: 'Invented.' }] }
  const ties: Ties = { version: 1, ties: [...json(STAND_IN_TIES).ties, { a: TWO, b: FOUR, kind: 'friends', strength: 1, line: 'They met here.', history: 'Invented.' }, { a: THREE, b: FOUR, kind: 'other', strength: 1, line: 'Neighbours.', history: 'Invented.' }] }
  return storyPackFrom({ ...STAND_IN_FILES, cast, ties })
}
const withFour = (pack: StoryPack, day = 3): SaveV4 => arrive(farm(day, pack), FOUR, pack).save
/** `n` married on the farm's love (the household's count), invented ids that aren't on the roster. */
const married = (save: SaveV4, n: number): SaveV4 => ({
  ...save, love: { ...save.love, ...Object.fromEntries(Array.from({ length: n }, (_, i) => [String(9100001 + i), { ...save.love[ONE]!, stage: 'spouse' as const, level: 0, wed: 1 }])) },
})
const made = (id: string, n: number, place = 'forest', key = 'pine-log@2') => ({ outfitId: id, place, items: Array.from({ length: n }, () => key) })
const ripe = (crop: Plot['crop'] = 'carrot'): Plot => ({ crop, growth: 4, ready: true, regrowing: false, own: false })
const growing = (crop: Plot['crop'] = 'carrot'): Plot => ({ crop, growth: 0, ready: false, regrowing: false, own: false })
const block = (id: Block['id'], tender: string | null, plots: Plot[]): Block => ({ id, tender, plots: newBlock(id).plots.map((p, i) => plots[i] ?? p) })
/** Starts a 4-day gather job (TEST_KINDS: one Pine Log a day) for her at a place. */
const startJob = (save: SaveV4, id: string, place: 'forest', slot = 0): SaveV4 =>
  startLoopJob(save, { outfitId: id, place, slot, request: { kind: 'gather', item: 'pine-log', count: 4 } }, AT, TEST_KINDS)

describe('reached perks', () => {
  it('reads each perk from her level, never stored: a rung is hers once its event has played', () => {
    expect(hasPerk({ stage: 'friendship', level: 2 }, 'f3')).toBe(false)
    expect(hasPerk({ stage: 'friendship', level: 3 }, 'f3')).toBe(true)
    expect(hasPerk({ stage: 'confession', level: 10 }, 'f10')).toBe(true)
    expect(hasPerk({ stage: 'confession', level: 10 }, 'r1')).toBe(false)
    expect(hasPerk({ stage: 'romance', level: 5 }, 'r5')).toBe(true)
    expect(hasPerk({ stage: 'proposal', level: 10 }, 'r10')).toBe(true)
    expect(hasPerk({ stage: 'spouse', level: 4 }, 's4')).toBe(true)
    expect(hasPerk({ stage: 'spouse', level: 4 }, 's5')).toBe(false)
    expect(hasPerk(undefined, 'f1')).toBe(false)
    expect(routeIndex({ stage: 'spouse', level: 5 })).toBe(28)
  })
})

describe('the romance term and its caps', () => {
  // 9000002 is a forager (her calling): the forest and the Sawmill are her line's places.
  const forager = (love: Partial<Love>) => withLove(farm(), TWO, love)

  it('pays F3 +10% and R5 +20% at her line only; her ring only once married', () => {
    expect(romanceBonus(forager(at('friendship', 2)), PACK, TWO, 'forest')).toBe(0)
    expect(romanceBonus(forager(at('friendship', 3)), PACK, TWO, 'forest')).toBeCloseTo(0.1, 9)
    expect(romanceBonus(forager(at('friendship', 3)), PACK, TWO, 'sawmill')).toBeCloseTo(0.1, 9)
    expect(romanceBonus(forager(at('friendship', 3)), PACK, TWO, 'fishery')).toBe(0)
    expect(romanceBonus(forager(at('romance', 5)), PACK, TWO, 'forest')).toBeCloseTo(0.2, 9)
    expect(romanceBonus(forager(at('proposal', 10, { ring: 8 })), PACK, TWO, 'forest')).toBeCloseTo(0.2, 9)
    expect(romanceBonus(forager(spouse(0, { ring: 8 })), PACK, TWO, 'forest')).toBeCloseTo(0.28, 9)
  })

  it('holds her own at 35%: F3, R5 and a +15% ring are 35%, a bigger ring is held', () => {
    expect(romanceTerms(forager(spouse(0, { ring: 15 })), PACK, TWO, 'forest')).toMatchObject({ line: 0.2, ring: 0.15, own: 0.35, held: false })
    expect(romanceTerms(forager(spouse(0, { ring: 20 })), PACK, TWO, 'forest')).toMatchObject({ own: 0.35, total: 0.35, held: true })
  })

  it('the worked forager: F3, R5, a grade-8 ring, a dream at the forest and 15 married come to +43%, held to +40%', () => {
    const pack = packWithFour('foraging')
    let save = withLove(withFour(pack), TWO, spouse(0, { ring: 8 }))
    save = { ...withLove(save, FOUR, spouse(3)), memories: { ...save.memories, [FOUR]: ['s3'] } }
    save = married(save, 13)
    const terms = romanceTerms(save, pack, TWO, 'forest')
    expect(terms).toMatchObject({ line: 0.2, ring: 0.08, own: 0.28, dream: 0.05, household: 0.1, crew: 0.15, total: 0.4, held: true })
    // The crew's part anywhere an Uma works: the dream only at the dreamer's line, the household everywhere.
    expect(romanceTerms(save, pack, THREE, 'fishery')).toMatchObject({ own: 0, dream: 0, household: 0.1, crew: 0.1, total: 0.1 })
  })

  it('holds the crew at 15%: two dreams at one place count once', () => {
    const pack = packWithFour('foraging')
    let save = withLove(withLove(withFour(pack), TWO, spouse(3)), FOUR, spouse(3))
    save = { ...save, memories: { ...save.memories, [TWO]: ['s3'], [FOUR]: ['s3'] } }
    expect(romanceTerms(save, pack, THREE, 'forest').dream).toBeCloseTo(0.05, 9)
    expect(romanceTerms(married(save, 20), pack, THREE, 'forest')).toMatchObject({ dream: 0.05, household: 0.1, crew: 0.15 })
    // A dream acts once her S3 event is in her Memories.
    const unplayed = { ...save, memories: { ...save.memories, [TWO]: [], [FOUR]: [] } }
    expect(romanceTerms(unplayed, pack, THREE, 'forest').dream).toBe(0)
  })

  it('keeps in her element in the bond term, outside the cap', () => {
    const pack = packWithFour('foraging')
    let save = withBond(withLove(withFour(pack), TWO, spouse(0, { ring: 8 })), TWO, THREE, 300)
    save = married({ ...withLove(save, FOUR, spouse(3)), memories: { ...save.memories, [FOUR]: ['s3'] } }, 13)
    const worked = [{ outfitId: TWO, place: 'forest' }, { outfitId: THREE, place: 'forest' }]
    expect(inElement(save, pack, TWO, 'forest')).toBe(true)
    expect(extrasShare(save, TWO, 'forest', worked, pack)).toBeCloseTo(0.2, 9)
    // The romance term held at 40%, then × 1.2: her items come to ×1.68 in all.
    expect(romanceBonus(save, pack, TWO, 'forest')).toBeCloseTo(0.4, 9)
    const ten = extrasTonight(save, [made(TWO, 100)], worked, pack)
    expect(ten.extras[0]!.items).toHaveLength(20)
    expect(ten.perks[0]!.items).toHaveLength(48)
    // Not at her line, or before the F8 perk: ×1.1.
    expect(extrasShare(save, TWO, 'fishery', [{ outfitId: TWO, place: 'fishery' }, { outfitId: THREE, place: 'fishery' }], pack)).toBeCloseTo(0.1, 9)
    expect(extrasShare(withLove(save, TWO, at('friendship', 7)), TWO, 'forest', worked, pack)).toBeCloseTo(0.1, 9)
  })
})

describe('the line effects', () => {
  it('lifts a forager\'s night items ×1.1 at F3 and ×1.2 at R5: an exact count over a seeded sample, the same goods and stars', () => {
    for (const [love, share] of [[at('friendship', 3), 0.1], [at('romance', 5), 0.2]] as const) {
      let total = 0
      let expected = 0
      for (let day = 1; day <= 200; day++) {
        const save: SaveV4 = { ...withLove(farm(), TWO, love), calendar: { day } }
        const night = extrasTonight(save, [made(TWO, 5, 'forest', 'shiitake@3')], [{ outfitId: TWO, place: 'forest' }], PACK)
        expect(night.extras).toEqual([])
        for (const p of night.perks) expect(p.items.every((k) => k === 'shiitake@3')).toBe(true)
        total += night.perks.reduce((n, p) => n + p.items.length, 0)
        const want = 5 * share
        expected += Math.floor(want + 1e-9) + (draw('u1', day, `perk:${TWO}`, 0) < want - Math.floor(want + 1e-9) ? 1 : 0)
      }
      expect(total).toBe(expected)
      expect(total).toBeGreaterThan(200 * 5 * share * 0.8)
      expect(total).toBeLessThan(200 * 5 * share * 1.2)
    }
  })

  it('lifts her Sawmill batch the same, and nobody\'s at a place that isn\'t theirs', () => {
    const save = withLove(farm(), TWO, at('romance', 5))
    expect(extrasTonight(save, [made(TWO, 10, 'sawmill', 'pine-plank@2')], [{ outfitId: TWO, place: 'sawmill' }], PACK).perks).toEqual([{ id: TWO, items: ['pine-plank@2', 'pine-plank@2'] }])
    expect(extrasTonight(save, [made(TWO, 10, 'fishery', 'carp@1')], [{ outfitId: TWO, place: 'fishery' }], PACK).perks).toEqual([])
    // Without the pack, none.
    expect(extrasTonight(save, [made(TWO, 10)], [{ outfitId: TWO, place: 'forest' }]).perks).toEqual([])
  })

  it('pays as the night\'s perks\' extras at step 4, with the morning\'s line', () => {
    const base = withLove(farm(), TWO, at('friendship', 3))
    // TEST_KINDS' gather: one Pine Log a day; 0.1 expected a night, so an account whose draw is under 0.1 gets one.
    const uid = Array.from({ length: 300 }, (_, i) => `u${i}`).find((u) => draw(u, 3, `perk:${TWO}`, 0) < 0.1)!
    let save: SaveV4 = { ...base, account: { ...base.account, uid } }
    save = startJob(save, TWO, 'forest')
    const after = runNight(save, context())
    expect(after.summary!.hearts).toContainEqual({ kind: 'perks', items: 1 })
    expect(goodCount(after.items, 'pine-log') - goodCount(save.items, 'pine-log')).toBe(1)
  })

  it('gives a tended plot a chance of one extra crop at harvest, at the plot\'s stars; nothing for an untended block', () => {
    let extra = 0
    let expected = 0
    for (let day = 1; day <= 300; day++) {
      const base: SaveV4 = { ...withLove(farm(), ONE, at('friendship', 3)), calendar: { day } }
      const tended: SaveV4 = { ...base, fields: { blocks: [block('A', ONE, [ripe()])] } }
      const { save, receipt } = harvest(tended, 'A', 0, () => TALENT_D, PACK)
      extra += receipt.perks
      expected += draw('u1', day, 'perk:harvest:A:0', 0) < 0.1 ? 1 : 0
      expect(goodCount(save.items, 'carrot')).toBe(1 + receipt.perks)
      // Untended, or without the pack: never.
      const untended: SaveV4 = { ...base, fields: { blocks: [block('A', null, [ripe()])] } }
      expect(harvest(untended, 'A', 0, () => TALENT_D, PACK).receipt.perks).toBe(0)
      expect(harvest(tended, 'A', 0, () => TALENT_D).receipt.perks).toBe(0)
    }
    expect(extra).toBe(expected)
    expect(extra).toBeGreaterThan(15)
    expect(extra).toBeLessThan(45)
  })

  it('grows a farmer\'s block ×1.2 in her element, ×1.1 side by side before it', () => {
    const pack = packWithFour('farming')
    const base = withBond(withFour(pack), ONE, FOUR, 300)
    const fields: SaveV4 = { ...base, fields: { blocks: [block('A', ONE, [growing()]), block('B', FOUR, [growing()])] } }
    const plain = blockGrowth({ ...fields, bonds: {} }, 'A')
    expect(blockGrowth(fields, 'A', undefined, pack)).toBeCloseTo(plain * 1.1, 6)
    expect(blockGrowth(withLove(fields, ONE, at('friendship', 8)), 'A', undefined, pack)).toBeCloseTo(plain * 1.2, 6)
    expect(blockGrowth(withLove(fields, ONE, at('friendship', 8)), 'A')).toBeCloseTo(plain * 1.1, 6)
  })

  it('leaves a miner\'s +10% waiting: "Opens when the Mine is built" on her profile, and inert', () => {
    const pack = packWithFour('mining')
    const save = withLove(withFour(pack), FOUR, at('romance', 7))
    expect(perksFor('mining', save).find((p) => p.id === 'line-10')!.opens).toBe('mine')
    expect(romanceBonus(save, pack, FOUR, 'mine')).toBe(0)
    expect(choresTonight(save, pack, FOUR)).toBe(0)
    expect(keepsakeQuality(withLove(save, FOUR, at('romance', 7)), pack, FOUR, 'mine')).toBe(0)
  })
})

describe('night chores', () => {
  it('counts 1 at F6, 2 at R7 and 3 at S4, never more, and none away', () => {
    expect([at('friendship', 5), at('friendship', 6), at('romance', 7), spouse(4), spouse(5)].map((l) => choresOf(l as Love))).toEqual([0, 1, 2, 3, 3])
    const save = withLove(farm(), TWO, spouse(5))
    expect(choresTonight(save, PACK, TWO)).toBe(3)
    expect(choresTonight({ ...save, dorm: { ...save.dorm, home: save.dorm.home.filter((id) => id !== TWO) } }, PACK, TWO)).toBe(0)
  })

  it('a forager\'s bring an item each from her rank\'s deepest area this season at a day\'s haul\'s stars; a fisher\'s a fish from her deepest spot', () => {
    let save = withLove(withLove(farm(), TWO, at('romance', 7)), THREE, at('friendship', 6))
    save = { ...save, roster: { ...save.roster, [TWO]: { ...save.roster[TWO]!, ranks: { ...save.roster[TWO]!.ranks, foraging: { points: 0, rank: 1, challenge: 0 } } } } }
    const { save: after, chores } = gatherChores(save, PACK, talentsD)
    const hills = sharesOn('forest', 'hills', save.calendar.day).map(([g]) => g)
    expect(chores.map((c) => [c.id, c.items.length])).toEqual([[TWO, 2], [THREE, 1]])
    for (const key of chores[0]!.items) expect(hills).toContain(parseStockKey(key)!.id)
    expect(['carp', 'trout']).toContain(parseStockKey(chores[1]!.items[0]!)!.id)
    // A Hand forager's day's haul: rank 0.5, D talent, a Basic Axe: ★1 or ★2.
    const q = gatherQuality(termsOf(save, TWO, 'foraging', talentsD, 'axe')!, false)
    expect(q).toBe(0.5)
    for (const key of chores[0]!.items) expect([1, 2]).toContain(parseStockKey(key)!.stars)
    const added = [...chores[0]!.items, ...chores[1]!.items].reduce((n, k) => n + 1, 0)
    const held = (s: SaveV4) => Object.values(s.items).reduce((n, row) => n + row.reduce((a, b) => a + b, 0), 0)
    expect(held(after) - held(save)).toBe(added)
  })

  it('a farmer\'s add +0.25 growth each to the untended block with the most growing plots, else hers, at step 2', () => {
    const base = withLove(farm(), ONE, at('romance', 7))
    const fields: SaveV4 = { ...base, fields: { blocks: [block('A', ONE, [growing()]), block('B', null, [growing(), growing()]), block('C', null, [growing()])] } }
    expect(fieldChores(fields, PACK)).toEqual({ growth: new Map([['B', 0.5]]), chores: [{ id: ONE, items: [], growth: 0.5 }] })
    const own: SaveV4 = { ...fields, fields: { blocks: [fields.fields.blocks[0]!, block('B', null, [])] } }
    expect(fieldChores(own, PACK).growth).toEqual(new Map([['A', 0.5]]))
    const none: SaveV4 = { ...fields, fields: { blocks: [block('A', ONE, []), block('B', null, [ripe()])] } }
    expect(fieldChores(none, PACK)).toEqual({ growth: new Map(), chores: [] })
    // The night: Block B grows 1 + 0.5 tonight, and the morning says so.
    const night = runNight(fields, context())
    expect(night.fields.blocks[1]!.plots[0]!.growth).toBeCloseTo(1.5, 9)
    expect(night.summary!.hearts).toContainEqual({ kind: 'chores', items: 0, growth: 0.5 })
    expect(growFields(fields, () => TALENT_D, PACK, new Map([['B', 0.25]])).save.fields.blocks[1]!.plots[0]!.growth).toBeCloseTo(1.25, 9)
  })

  it('says the night\'s chores in one line', () => {
    const save = withLove(withLove(farm(), TWO, spouse(4)), ONE, at('friendship', 6))
    const fields: SaveV4 = { ...save, fields: { blocks: [block('A', null, [growing()])] } }
    const night = runNight(fields, context())
    expect(night.summary!.hearts).toContainEqual({ kind: 'chores', items: 3, growth: 0.25 })
  })
})

describe('morning items', () => {
  it('every 4th morning from R2 at ★2+, every 2nd from S2 at ★3+, one a day by her count', () => {
    const r2 = morningRule({ stage: 'romance', level: 2, morning: 10 })!
    expect(r2).toEqual({ every: 4, stars: 2, from: 10 })
    expect([10, 11, 13, 14, 18].map((d) => morningDue(r2, d))).toEqual([false, false, false, true, true])
    expect(morningsToItem(r2, 11)).toBe(3)
    const s2 = morningRule({ stage: 'spouse', level: 2, morning: 20 })!
    expect(s2).toEqual({ every: 2, stars: 3, from: 20 })
    expect([21, 22, 23, 24].map((d) => morningDue(s2, d))).toEqual([false, true, false, true])
    expect(morningRule({ stage: 'romance', level: 1 })).toBeNull()
    for (let day = 11; day <= 30; day++) {
      const save: SaveV4 = { ...withLove(farm(), TWO, at('romance', 2, { morning: 10 })), calendar: { day } }
      const { save: after, lines } = leaveMorningItems(save, PACK, talentsD)
      if (!morningDue(r2, day)) {
        expect(lines).toEqual([])
        continue
      }
      expect(lines).toHaveLength(1)
      const { id, stars } = parseStockKey(lines[0]!.items[0]!)!
      expect(stars).toBeGreaterThanOrEqual(2)
      expect(goodCount(after.items, id)).toBe(goodCount(save.items, id) + 1)
    }
    const s2Save: SaveV4 = { ...withLove(farm(), ONE, spouse(2, { morning: 20 })), calendar: { day: 22 } }
    const item = leaveMorningItems(s2Save, PACK, talentsD).lines[0]!
    expect(parseStockKey(item.items[0]!)!.stars).toBeGreaterThanOrEqual(3)
  })

  it('starts her count the day she reaches R2, then S2; away leaves none', () => {
    expect(advance({ ...json(farm().love[ONE]!), stage: 'romance', level: 1, points: 240 }, 12)).toMatchObject({ level: 2, morning: 12 })
    expect(advance({ ...json(farm().love[ONE]!), stage: 'spouse', level: 1, wed: 1, points: 600 }, 30)).toMatchObject({ level: 2, morning: 30 })
    expect(advance({ ...json(farm().love[ONE]!), stage: 'romance', level: 2, morning: 12, points: 280 }, 16)).toMatchObject({ level: 3, morning: 12 })
    const away: SaveV4 = { ...withLove(farm(), TWO, at('romance', 2, { morning: 10 })), calendar: { day: 14 } }
    expect(leaveMorningItems({ ...away, dorm: { ...away.dorm, home: [ONE, THREE] } }, PACK, talentsD).lines).toEqual([])
  })

  it('lands at night step 9 with its Hearts line', () => {
    const save = withLove(farm(13), TWO, at('romance', 2, { morning: 10 }))
    const night = runNight(save, context())
    const line = night.summary!.hearts.find((h) => h.kind === 'item')
    expect(line).toMatchObject({ kind: 'item', id: TWO })
    expect(parseSaveV4(json(night))).toEqual(night)
  })
})

describe('the mentor', () => {
  it('lifts the others at her place ×1.10 while she works there; one mentor a place, never herself', () => {
    const pack = packWithFour('foraging')
    const save = withLove(withFour(pack), TWO, at('friendship', 9))
    const forest = [{ outfitId: TWO, place: 'forest' }, { outfitId: FOUR, place: 'forest' }, { outfitId: THREE, place: 'fishery' }]
    expect(mentorsTonight(save, pack, forest, [])).toEqual(new Map([[FOUR, MENTOR_POINTS]]))
    // Not her line's place: no mentor.
    expect(mentorsTonight(save, pack, [{ outfitId: TWO, place: 'fishery' }, { outfitId: THREE, place: 'fishery' }], [])).toEqual(new Map())
    // Two mentors at one place: the most hearts mentors, and the other gains her bonus; once.
    const both = withLove(withLove(save, FOUR, at('friendship', 9)), TWO, at('romance', 1))
    expect(mentorsTonight(both, pack, forest, [])).toEqual(new Map([[FOUR, MENTOR_POINTS]]))
    expect(mentorsTonight(withLove(both, FOUR, at('romance', 4)), pack, forest, [])).toEqual(new Map([[TWO, MENTOR_POINTS]]))
    expect(rankPoints(10, { talent: TALENT_D, favourite: false, wellFed: false, heartsFactor: 1, mentor: MENTOR_POINTS })).toBe(11)
  })

  it('pays at night step 6', () => {
    const pack = packWithFour('foraging')
    const four = withFour(pack)
    const base: SaveV4 = { ...four, dorm: { ...four.dorm, level: 2, home: [...four.dorm.home, FOUR] }, buildings: { ...four.buildings, dorm: 2 } }
    const night = (save: SaveV4) => runNight(startJob(startJob(save, TWO, 'forest', 0), FOUR, 'forest', 1), context(pack))
    // At Friendship 8 she isn't a mentor yet (her own ×1.05 from F5 either way).
    const before = night(withLove(base, TWO, at('friendship', 8)))
    const after = night(withLove(base, TWO, at('friendship', 9)))
    expect(after.roster[FOUR]!.ranks.foraging.points).toBeCloseTo(before.roster[FOUR]!.ranks.foraging.points * 1.1, 6)
    expect(after.roster[TWO]!.ranks.foraging.points).toBeCloseTo(before.roster[TWO]!.ranks.foraging.points, 6)
  })
})

describe('her keepsake', () => {
  it('adds +0.25 quality at her line from F10, +0.5 from S5, nowhere else', () => {
    const at10 = withLove(farm(), TWO, at('confession', 10))
    expect(keepsakeQuality(withLove(farm(), TWO, at('friendship', 9)), PACK, TWO, 'forest')).toBe(0)
    expect(keepsakeQuality(at10, PACK, TWO, 'forest')).toBe(KEEPSAKE_QUALITY)
    expect(keepsakeQuality(at10, PACK, TWO, 'fishery')).toBe(0)
    expect(keepsakeQuality(withLove(farm(), TWO, spouse(5)), PACK, TWO, 'forest')).toBe(KEEPSAKE_GROWN)
  })

  it('lifts a haul as it\'s planned and a tended harvest', () => {
    const save = withLove(farm(), TWO, at('confession', 10))
    const request = { kind: 'forage', item: 'woods', count: 1 }
    const plain = planHaul(save, TWO, 'forest', request, 0, 0, talentsD)
    const lifted = planHaul(save, TWO, 'forest', request, 0, 0, talentsD, PACK)
    if (!Array.isArray(plain) || !Array.isArray(lifted)) throw new Error('refused')
    const stars = (items: typeof plain) => items.reduce((n, i) => n + parseStockKey((i.output as { item: string }).item)!.stars, 0)
    expect(stars(lifted)).toBeGreaterThanOrEqual(stars(plain))
    expect(loopKinds(talentsD, PACK)).toBe(loopKinds(talentsD, PACK))
    expect(loopKinds(talentsD, PACK)).not.toBe(loopKinds(talentsD))
    const farmer: SaveV4 = { ...withLove(farm(), ONE, spouse(5)), fields: { blocks: [block('A', ONE, [ripe()])] } }
    const tender = tenderTerms(farmer, 'A', () => TALENT_D, PACK)!
    expect(tender.keepsake).toBe(KEEPSAKE_GROWN)
    expect(harvestQuality(tender, 1)).toBeCloseTo(harvestQuality({ ...tender, keepsake: 0 }, 1) + 0.5, 9)
  })
})

describe('her signature dish', () => {
  it('is her loved good when it\'s a dish, taken as is', () => {
    const bible: UmaBible = { ...json(STAND_IN_BIBLE), gifts: { ...json(STAND_IN_BIBLE).gifts, loved: 'dish-fish-3', proposed: ['dish-fish-3'] } }
    const pack = storyPackFrom({ ...STAND_IN_FILES, umas: { [ONE]: bible } })
    expect(signatureDish(farm(), pack, ONE)).toBe('dish-fish-3')
  })

  it('else her line\'s kind at the grade of her line\'s best place', () => {
    // A farmer: the shop's vegetables at its open tiers (Farm Rank 1: up to Bell Pepper, G6).
    expect(signatureDish(farm(), PACK, ONE)).toBe('dish-vegetables-6')
    // A forager: the deepest area anyone has worked (the Woods, G2; the Hills once worked, G4).
    expect(signatureDish(farm(), PACK, TWO)).toBe('dish-mushrooms-2')
    const hills = farm()
    expect(lineGrade({ ...hills, diary: { ...hills.diary, milestones: ['depth:hills'] } }, PACK, TWO)).toBe(FOREST.hills.grades[1])
    // A fisher: the Pond's fish at 10% or more (the koi's 2% doesn't count), G2.
    expect(signatureDish(farm(), PACK, THREE)).toBe('dish-fish-2')
    expect(dishName('dish-vegetables-6')).toBe('Bell Pepper Salad')
    expect(dishName('dish-mushrooms-1')).toBe('Button Mushroom Soup')
    expect(dishName('dish-sweets-1')).toBe('Honeycomb Cake')
  })

  it('goes into workshops.recipes once when Friendship 4 plays', () => {
    const base = withLove(farm(), ONE, { stage: 'friendship', level: 3, points: 320 })
    const { save, card } = playEvent(base, PACK, ONE, { event: { id: 'f4', steps: json(STAND_IN_FILES.routes[ONE] as { events: { id: string; steps: never }[] }).events.find((e) => e.id === 'f4')!.steps }, picks: [1], plays: [{ kind: 'rhythm', score: 70 }] })
    expect(card.recipe).toBe('dish-vegetables-6')
    expect(save.workshops.recipes).toEqual(['dish-vegetables-6'])
    expect(save.love[ONE]!.dish).toBe('dish-vegetables-6')
    expect(parseSaveV4(json(save))).toEqual(save)
  })
})

describe('breakfast', () => {
  it('feeds the crew one day when none is; a meal running is neither shortened nor extended; not a staff meal', () => {
    const base = farm()
    const save: SaveV4 = { ...base, roster: { ...base.roster, [TWO]: { ...base.roster[TWO]!, wellFed: 2 } } }
    const { save: after, fed } = breakfast(save, PACK)
    expect(fed).toEqual([ONE, THREE])
    expect([ONE, TWO, THREE].map((id) => after.roster[id]!.wellFed)).toEqual([1, 2, 1])
    expect(after.farm.counts).toEqual(save.farm.counts)
    expect(after.workshops).toEqual(save.workshops)
    // +5 a pair it fed (the breakfast).
    expect(bondOf(after, ONE, THREE) - bondOf(save, ONE, THREE)).toBe(5)
    expect(bondOf(after, ONE, TWO)).toBe(bondOf(save, ONE, TWO))
    // Nobody to feed: unchanged.
    const fedAll = breakfast(after, PACK)
    expect(fedAll.fed).toEqual([])
    expect(fedAll.save).toBe(after)
  })
})

describe('the format\'s keepsake and pet name', () => {
  it('validates both; the stand-in bible has them', () => {
    const ctx = { umas: new Set(STAND_INS) }
    expect(STAND_IN_BIBLE.keepsake?.name).toBeTruthy()
    expect(STAND_IN_BIBLE.petName).toBeTruthy()
    expect(checkBible(STAND_IN_BIBLE, '9000001', ctx)).toMatchObject({ errors: [], notes: [] })
    const bad = (more: Record<string, unknown>) => {
      const { errors, notes } = checkBible({ ...json(STAND_IN_BIBLE), ...more }, '9000001', ctx)
      return [...errors, ...notes]
    }
    expect(bad({ keepsake: 'A ribbon' })).toEqual(['keepsake is { name, line }; skipped'])
    expect(bad({ keepsake: { name: '', line: 'Hi {name}.', extra: 1 } })).toEqual(['keepsake.name: no name; skipped', 'keepsake.line: {name} shows as written ({farmer} is the one placeholder)'])
    expect(bad({ keepsake: { name: 'x'.repeat(41), line: 'Hi {name}.' } })).toEqual(['keepsake.name: its name is 41 characters; the screen shows 40; skipped', 'keepsake.line: {name} shows as written ({farmer} is the one placeholder)'])
    expect(checkBible({ ...json(STAND_IN_BIBLE), keepsake: { line: 'Only a line.' } }, '9000001', ctx).value!.keepsake).toEqual({ line: 'Only a line.' })
    expect(bad({ petName: 'x'.repeat(25) })).toEqual(['petName is 1–24 characters; skipped'])
    expect(bad({ petName: '{farmer}' })).toEqual(['petName: no placeholder (it’s what she calls you)'])
    expect(bad({ petName: 'Bride' })).toEqual(['petName: “Bride” genders the farmer'])
  })
})

describe('save v4\'s new fields and lines', () => {
  it('parses love.morning from R2 on and love.dish from F4 on, strictly', () => {
    const save = withLove(withLove(farm(14), TWO, at('romance', 2, { morning: 10 })), ONE, at('friendship', 4, { dish: 'dish-vegetables-6' }))
    expect(parseSaveV4(json(save))).toEqual(save)
    const refuse = (id: string, love: Partial<Love>, message: string) => expect(() => parseSaveV4(json(withLove(farm(14), id, love)))).toThrow(message)
    refuse(TWO, at('romance', 1, { morning: 10 }), `save.love.${TWO}.morning: only from Romance 2 on`)
    refuse(TWO, at('romance', 2, { morning: 15 }), `save.love.${TWO}.morning: after today`)
    refuse(ONE, at('friendship', 3, { dish: 'dish-vegetables-6' }), `save.love.${ONE}.dish: only from Friendship 4 on`)
    refuse(ONE, at('friendship', 4, { dish: 'carrot' }), `save.love.${ONE}.dish: unknown dish`)
  })

  it('parses the morning\'s item, chores and perks lines', () => {
    const save = farm(3)
    save.summary = { day: 3, bin: [], work: [], ranks: [], news: [], nudges: [], hearts: [
      { kind: 'item', id: TWO, items: ['shiitake@3'] }, { kind: 'chores', items: 2, growth: 0.25 }, { kind: 'perks', items: 4 }, { kind: 'side', items: 1 },
    ] }
    expect(parseSaveV4(json(save)).summary).toEqual(save.summary)
    const refuse = (hearts: unknown[], message: string) => expect(() => parseSaveV4({ ...json(save), summary: { ...json(save.summary), hearts } })).toThrow(message)
    refuse([{ kind: 'item', id: TWO, items: [] }], 'save.summary.hearts.0.items')
    refuse([{ kind: 'item', id: TWO, items: ['nope@3'] }], 'save.summary.hearts.0.items.0: expected <good>@<stars>')
    refuse([{ kind: 'chores', items: 0, growth: 0 }], 'save.summary.hearts.0: expected items or growth')
    refuse([{ kind: 'chores', items: 1, growth: 0.3 }], 'save.summary.hearts.0.growth: expected quarters')
    refuse([{ kind: 'perks', items: 0 }], 'save.summary.hearts.0.items')
    refuse([{ kind: 'perks', items: 1 }, { kind: 'perks', items: 2 }], 'save.summary.hearts.1: repeated')
  })
})
