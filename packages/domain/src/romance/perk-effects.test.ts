// The perks' effects: `hasPerk` from her level, the romance term
// and its caps, in her element, the line effects at night and at harvest, night chores, morning items, the mentor, her
// keepsake, her signature dish, breakfast, the format's keepsake and pet name, and the save's new fields and lines.
// Invented ids only: the stand-ins 9000001–9000003 and a 9000004 built here.
import { describe, expect, it } from 'vitest'
import { dishName, goodOf } from '../goods/ids'
import { floorFinds, floorTopGrade } from '../gathering/digs'
import { extrasShare, extrasTonight, bondOf } from '../farm/bonds'
import { draw } from '../farm/draw'
import { rankPoints } from '../farm/rank-rules'
import { TALENT_D, talentsD } from '../farm/talents'
import { harvestQuality } from '../fields/fields'
import { FOREST } from '../gathering/tables'
import { gatherQuality, sharesOn, termsOf, type MadeTonight } from '../gathering/kinds'
import { NIGHT_STEPS, runNight, type NightContext, type NightStep } from '../night/end-day'
import type { LoopPlaceId } from '../save/parse-v4'
import { parseSaveV5 } from '../save/parse-v4'
import { fieldTiles, bareTile, newSave, pairKey, type Animal, type Love, type SaveV4, type Tile } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'
import { checkBible, type Cast, type Ties, type UmaBible } from '../story/authored'
import { STAND_IN_BIBLE, STAND_IN_CAST, STAND_IN_TIES, STAND_INS } from '../story/authored.fixture'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { meet } from './meeting'
import { joinCast } from './meeting.fixture'
import { playEvent } from './events'
import { advance } from './love'
import { perkLineOf, perksFor } from './perks'
import { lineGood } from './days'
import {
  breakfast, choresTonight, digQuality, fieldChores, gatherChores, herBuilding, leaveMorningItems, lineGrade, lineQuality, MENTOR_POINTS, mentorsTonight, ranchChores,
  signatureDish,
} from './perk-effects'
import {
  choresOf, hasPerk, inElement, KEEPSAKE_GROWN, KEEPSAKE_QUALITY, keepsakeQuality, morningDue, morningRule, morningsToItem, romanceBonus, romanceTerms, routeIndex,
} from './perk-terms'

const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS as [string, string, string]
const FOUR = '9000004'
const context = (story: NightContext['story'] = PACK): NightContext => ({ story, talentOf: () => TALENT_D })

/** A named farm on `day`, the opening read: 9000001 (a farmer), 9000002 (a forager) and 9000003 (a fisher) home. */
function farm(day = 3, pack: Pick<StoryPack, 'cast' | 'ties'> = PACK): SaveV4 {
  const save = joinCast(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }, 'scene:1:open'), pack)
  return { ...save, today: { ...save.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const at = (stage: Love['stage'], level: number, more: Partial<Love> = {}): Partial<Love> => ({ stage, level, ...more })
const spouse = (level: number, more: Partial<Love> = {}): Partial<Love> => ({ stage: 'spouse', level, wed: 1, ...more })
const withBond = (save: SaveV4, a: string, b: string, points: number): SaveV4 => ({ ...save, bonds: { ...save.bonds, [pairKey(a, b)]: points } })
/** The stand-in pack with a fourth Uma (no bible: her calling stands in; or a bible's favourite line, a rancher's), tied
 * to two others. */
function packWithFour(calling: 'farming' | 'foraging' | 'fishing' | 'mining' | 'quarry', favouriteLine?: UmaBible['favouriteLine']): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, { characterId: FOUR, outfitId: '900000401', calling, paragraph: 'Invented.' }] }
  const ties: Ties = { version: 1, ties: [...json(STAND_IN_TIES).ties, { a: TWO, b: FOUR, kind: 'friends', strength: 1, line: 'They met here.', history: 'Invented.' }, { a: THREE, b: FOUR, kind: 'other', strength: 1, line: 'Neighbours.', history: 'Invented.' }] }
  return storyPackFrom({ ...STAND_IN_FILES, cast, ties, ...(favouriteLine ? { umas: { ...STAND_IN_FILES.umas, [FOUR]: { favouriteLine } } } : {}) })
}
const withFour = (pack: StoryPack, day = 3): SaveV4 => meet(farm(day, pack), FOUR, pack).save
/** `n` married on the farm's love (the household's count), invented ids that aren't on the roster. */
const married = (save: SaveV4, n: number): SaveV4 => ({
  ...save, love: { ...save.love, ...Object.fromEntries(Array.from({ length: n }, (_, i) => [String(9100001 + i), { ...save.love[ONE]!, stage: 'spouse' as const, level: 0, wed: 1 }])) },
})
const made = (id: string, n: number, place = 'forest', key = 'pine-log@2') => ({ outfitId: id, place, items: Array.from({ length: n }, () => key) })
const ripe = (crop: Tile['crop'] = 'carrot'): Tile => ({ ...bareTile('tilled'), crop, growth: 4, ready: true })
const growing = (crop: Tile['crop'] = 'carrot'): Tile => ({ ...bareTile('tilled'), crop })
/** The save with its tiles set, the rest of the field as it was. */
const withTiles = (save: SaveV4, tiles: Record<number, Tile>): SaveV4 => ({ ...save, fields: { plots: [{ tiles: fieldTiles(save).map((t, i) => tiles[i] ?? t) }] } })
/** The night, with who worked today and what their work made set before its steps, as the farmhands' will be. */
function nightWorking(save: SaveV4, worked: { outfitId: string; place: LoopPlaceId }[], madeTonight: MadeTonight[], story: NightContext['story'] = PACK): SaveV4 {
  const working: NightStep = (n) => ({ ...n, notes: { ...n.notes, worked, made: madeTonight } })
  return runNight(save, context(story), [{ run: working }, ...NIGHT_STEPS])
}

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

  it('pays F2 +10% and R5 +20% at her line only; her ring only once married', () => {
    expect(romanceBonus(forager(at('friendship', 1)), PACK, TWO, 'forest')).toBe(0)
    expect(romanceBonus(forager(at('friendship', 2)), PACK, TWO, 'forest')).toBeCloseTo(0.1, 9)
    expect(romanceBonus(forager(at('friendship', 2)), PACK, TWO, 'sawmill')).toBeCloseTo(0.1, 9)
    expect(romanceBonus(forager(at('friendship', 2)), PACK, TWO, 'fishery')).toBe(0)
    expect(romanceBonus(forager(at('romance', 5)), PACK, TWO, 'forest')).toBeCloseTo(0.2, 9)
    expect(romanceBonus(forager(at('proposal', 10, { ring: 8 })), PACK, TWO, 'forest')).toBeCloseTo(0.2, 9)
    expect(romanceBonus(forager(spouse(0, { ring: 8 })), PACK, TWO, 'forest')).toBeCloseTo(0.28, 9)
  })

  it('holds her own at 35%: F2, R5 and a +15% ring are 35%, a bigger ring is held', () => {
    expect(romanceTerms(forager(spouse(0, { ring: 15 })), PACK, TWO, 'forest')).toMatchObject({ line: 0.2, ring: 0.15, own: 0.35, held: false })
    expect(romanceTerms(forager(spouse(0, { ring: 20 })), PACK, TWO, 'forest')).toMatchObject({ own: 0.35, total: 0.35, held: true })
  })

  it('the worked forager: F2, R5, a grade-8 ring, a dream at the forest and 15 married come to +43%, held to +40%', () => {
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
  it('lifts a forager\'s night items ×1.1 at F2 and ×1.2 at R5: an exact count over a seeded sample, the same goods and stars', () => {
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

  it('pays as the night\'s perks\' extras from what her work made, at step 4, with the morning\'s line', () => {
    const base = withLove(farm(), TWO, at('friendship', 3))
    // One Pine Log made: 0.1 expected, so an account whose draw is under 0.1 gets one.
    const uid = Array.from({ length: 300 }, (_, i) => `u${i}`).find((u) => draw(u, 3, `perk:${TWO}`, 0) < 0.1)!
    const save: SaveV4 = { ...base, account: { ...base.account, uid } }
    const after = nightWorking(save, [{ outfitId: TWO, place: 'forest' }], [{ ...made(TWO, 1), place: 'forest' }])
    expect(after.summary!.hearts).toContainEqual({ kind: 'perks', items: 1 })
    expect(goodCount(after.items, 'pine-log') - goodCount(save.items, 'pine-log')).toBe(1)
    // Nobody but the farmer works the farm yet: a night pays none.
    expect(runNight(save, context()).summary!.hearts.some((h) => h.kind === 'perks')).toBe(false)
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

  it('a farmer\'s each water a dry growing tile at step 2, and it grows tonight', () => {
    const base = withLove(farm(), ONE, at('romance', 7))
    const fields = withTiles(base, { 0: growing(), 1: growing(), 2: { ...growing(), watered: true }, 3: ripe() })
    const { tiles, chores } = fieldChores(fields, PACK)
    expect(chores).toEqual([{ id: ONE, items: [], watered: 2 }])
    expect([...tiles].sort()).toEqual([0, 1])
    // With one dry tile, one chore waters it and the other has none left.
    expect(fieldChores(withTiles(base, { 0: growing() }), PACK)).toEqual({ tiles: new Set([0]), chores: [{ id: ONE, items: [], watered: 1 }] })
    expect(fieldChores(withTiles(base, { 3: ripe() }), PACK)).toEqual({ tiles: new Set(), chores: [] })
    // The night: both dry tiles grow, and the morning says so.
    const night = runNight(fields, context())
    expect(fieldTiles(night).slice(0, 3).map((t) => t.growth)).toEqual([1, 1, 1])
    expect(night.summary!.hearts).toContainEqual({ kind: 'chores', items: 0, watered: 2 })
  })

  it('says the night\'s chores in one line', () => {
    const save = withLove(withLove(farm(), TWO, spouse(4)), ONE, at('friendship', 6))
    const night = runNight(withTiles(save, { 0: growing() }), context())
    expect(night.summary!.hearts).toContainEqual({ kind: 'chores', items: 3, watered: 1 })
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
    expect(parseSaveV5(json(night))).toEqual(night)
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
    const night = (save: SaveV4) => nightWorking(save, [{ outfitId: TWO, place: 'forest' }, { outfitId: FOUR, place: 'forest' }], [], pack)
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

  it('lifts the quality of her work at her line: a haul and a harvest', () => {
    const save = withLove(farm(), TWO, at('confession', 10))
    const terms = termsOf(save, TWO, 'foraging', talentsD, 'axe')!
    expect(gatherQuality({ ...terms, keepsake: keepsakeQuality(save, PACK, TWO, 'forest') }, false)).toBeCloseTo(gatherQuality(terms, false) + KEEPSAKE_QUALITY, 9)
    const farmer = withLove(farm(), ONE, spouse(5))
    const keepsake = keepsakeQuality(farmer, PACK, ONE, 'fields')
    expect(keepsake).toBe(KEEPSAKE_GROWN)
    const worker = { rank: 0 as const, talent: TALENT_D, wellFed: false }
    expect(harvestQuality({ ...worker, keepsake }, 1)).toBeCloseTo(harvestQuality(worker, 1) + 0.5, 9)
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
    expect(parseSaveV5(json(save))).toEqual(save)
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

describe('the ranch\'s and mining\'s perks', () => {
  const miner = packWithFour('mining')
  const quarrier = packWithFour('quarry')
  const rancher = packWithFour('farming', 'ranch')
  /** 9000004 at home in the Dorm, at `love`, on a farm with these places standing. */
  const four = (pack: StoryPack, love: Partial<Love>, ...places: string[]): SaveV4 => {
    const met = withFour(pack)
    const save: SaveV4 = {
      ...met, dorm: { ...met.dorm, level: 2, home: [...met.dorm.home, FOUR] },
      buildings: { ...met.buildings, dorm: 2, ...Object.fromEntries(places.map((id) => [id, 1])) },
    }
    return withLove(save, FOUR, love)
  }
  const chicken = (n: number, more: Partial<Animal> = {}): Animal => ({ id: `chicken-${n}`, kind: 'chicken', fondness: 0, fed: false, cared: false, ready: false, ...more })
  const withAnimals = (save: SaveV4, animals: Animal[], silo = 0): SaveV4 => ({ ...save, ranch: { ...save.ranch, animals, silo } })
  const atFloor = (save: SaveV4, dig: 'mine' | 'quarry', deepest: number): SaveV4 => ({ ...save, places: { ...save.places, [dig]: { deepest, stairs: 0 } } })

  it('reads her line from the pack: a miner\'s the Mine and the Smelter, a quarrier\'s the Quarry and the Cutter, a rancher\'s the Coop and the Barn', () => {
    expect([perkLineOf(miner, FOUR), perkLineOf(quarrier, FOUR), perkLineOf(rancher, FOUR)]).toEqual(['mining', 'quarry', 'ranch'])
    const r5 = at('romance', 5)
    expect(['mine', 'smelter', 'quarry'].map((p) => romanceBonus(four(miner, r5, 'mine'), miner, FOUR, p))).toEqual([0.2, 0.2, 0])
    expect(['quarry', 'cutter', 'mine'].map((p) => romanceBonus(four(quarrier, r5, 'quarry'), quarrier, FOUR, p))).toEqual([0.2, 0.2, 0])
    // The ranch opens with either building: the Barn alone will do.
    expect(['coop', 'barn', 'fields'].map((p) => romanceBonus(four(rancher, r5, 'barn'), rancher, FOUR, p))).toEqual([0.2, 0.2, 0])
    expect(romanceBonus(four(rancher, r5), rancher, FOUR, 'coop')).toBe(0)
  })

  it('lifts a miner\'s haul ×1.1 at F2 and ×1.2 at R5: an exact count over a seeded sample, the same goods and stars', () => {
    for (const [love, share] of [[at('friendship', 3), 0.1], [at('romance', 5), 0.2]] as const) {
      let total = 0
      let expected = 0
      for (let day = 1; day <= 200; day++) {
        const save: SaveV4 = { ...four(miner, love, 'mine'), calendar: { day } }
        const night = extrasTonight(save, [made(FOUR, 5, 'mine', 'iron-ore@2')], [{ outfitId: FOUR, place: 'mine' }], miner)
        for (const p of night.perks) expect(p.items.every((k) => k === 'iron-ore@2')).toBe(true)
        total += night.perks.reduce((n, p) => n + p.items.length, 0)
        const want = 5 * share
        expected += Math.floor(want + 1e-9) + (draw('u1', day, `perk:${FOUR}`, 0) < want - Math.floor(want + 1e-9) ? 1 : 0)
      }
      expect(total).toBe(expected)
      expect(total).toBeGreaterThan(200 * 5 * share * 0.8)
      expect(total).toBeLessThan(200 * 5 * share * 1.2)
    }
  })

  it('lifts her Smelter batch the same, a quarrier\'s face and Cutter batch, and nobody\'s off her line', () => {
    const save = four(miner, at('romance', 5), 'mine', 'quarry')
    expect(extrasTonight(save, [made(FOUR, 10, 'smelter', 'iron-ingot@2')], [{ outfitId: FOUR, place: 'smelter' }], miner).perks).toEqual([{ id: FOUR, items: ['iron-ingot@2', 'iron-ingot@2'] }])
    expect(extrasTonight(save, [made(FOUR, 10, 'quarry', 'granite@2')], [{ outfitId: FOUR, place: 'quarry' }], miner).perks).toEqual([])
    const q = four(quarrier, at('romance', 5), 'quarry')
    expect(extrasTonight(q, [made(FOUR, 10, 'quarry', 'granite@2')], [{ outfitId: FOUR, place: 'quarry' }], quarrier).perks).toEqual([{ id: FOUR, items: ['granite@2', 'granite@2'] }])
    expect(extrasTonight(q, [made(FOUR, 10, 'cutter', 'granite-block@2')], [{ outfitId: FOUR, place: 'cutter' }], quarrier).perks).toEqual([{ id: FOUR, items: ['granite-block@2', 'granite-block@2'] }])
  })

  it('a mining farmhand\'s night: her faces at the Mine come home larger, as the perks\' extras', () => {
    // She works the Mine's face on the board; at Romance 5 her finds come to ×1.2: 0.2 a find, so one more by the draw.
    const base = four(miner, at('romance', 5), 'mine')
    const hired: SaveV4 = { ...base, roster: { ...base.roster, [FOUR]: { ...base.roster[FOUR]!, farmhand: 1, tasks: [{ kind: 'mine', dig: 'mine' }] } } }
    const run = (uid: string) => runNight({ ...hired, account: { ...hired.account, uid } }, context(miner))
    const plain = run('u1')
    const dug = plain.summary!.work.find((l) => l.kind === 'farmhand' && l.id === FOUR)
    expect(dug).toMatchObject({ spent: 3 })
    const finds = (s: SaveV4) => ['copper-ore', 'tin-ore'].reduce((n, ore) => n + goodCount(s.items, ore), 0)
    // Over a seeded sample of farms, the perks' extras lift her finds by about a fifth, exactly as drawn.
    let base6 = 0
    let lifted = 0
    for (let i = 0; i < 60; i++) {
      const night = run(`u${i}`)
      const perks = night.summary!.hearts.find((h) => h.kind === 'perks')
      const all = finds(night) - finds(hired)
      lifted += all
      base6 += all - (perks && perks.kind === 'perks' ? perks.items : 0)
    }
    expect(lifted).toBeGreaterThan(base6 * 1.1)
    expect(lifted).toBeLessThan(base6 * 1.3)
  })

  it('a miner\'s chores bring one find each from the dig\'s deepest floor, at a face\'s stars; the dig doesn\'t move', () => {
    const save = atFloor(four(miner, at('romance', 7), 'mine'), 'mine', 10)
    expect(choresTonight(save, miner, FOUR)).toBe(2)
    const { save: after, chores } = gatherChores(save, miner, talentsD)
    const mine = chores.find((c) => c.id === FOUR)!
    expect(mine.items).toHaveLength(2)
    for (const key of mine.items) expect(floorFinds('mine', 10)).toContain(parseStockKey(key)!.id)
    // A Novice D with the Basic Pick and her keepsake (+0.25, from F10): ★1 or ★2.
    expect(digQuality(save, miner, FOUR, 'mine')).toBe(gatherQuality(termsOf(save, FOUR, 'mining', talentsD, 'pick')!, save.roster[FOUR]!.wellFed > 0) + KEEPSAKE_QUALITY)
    for (const key of mine.items) expect([1, 2]).toContain(parseStockKey(key)!.stars)
    expect(after.places).toEqual(save.places)
    expect(after.farm.counts).toEqual(save.farm.counts)
    // A quarrier's: a stone or a gem of the Quarry's floor.
    const q = atFloor(four(quarrier, at('friendship', 6), 'quarry'), 'quarry', 1)
    const stone = gatherChores(q, quarrier, talentsD).chores.find((c) => c.id === FOUR)!
    expect(stone.items).toHaveLength(1)
    expect(floorFinds('quarry', 1)).toContain(parseStockKey(stone.items[0]!)!.id)
    // Before the Mine stands, none.
    expect(choresTonight(four(miner, at('romance', 7)), miner, FOUR)).toBe(0)
  })

  it('a rancher\'s chores give each animal in her building +5 fondness a chore at step 3, with the morning\'s line', () => {
    const coop = withAnimals(four(rancher, at('romance', 7), 'coop', 'barn'), [chicken(1, { fondness: 30 }), chicken(2, { fondness: 198 }), { ...chicken(3), id: 'cow-3', kind: 'cow' }])
    expect(herBuilding(coop, FOUR)).toBe('coop')
    const { save: after, chores } = ranchChores(coop, rancher)
    expect(chores).toEqual([{ id: FOUR, items: [], watered: 0, fondness: 10 }])
    expect(after.ranch.animals.map((a) => a.fondness)).toEqual([40, 200, 0])
    // Her building is the one she cares for on the work board.
    const barn: SaveV4 = { ...coop, roster: { ...coop.roster, [FOUR]: { ...coop.roster[FOUR]!, farmhand: 1, tasks: [{ kind: 'care', home: 'barn' }] } } }
    expect(herBuilding(barn, FOUR)).toBe('barn')
    expect(ranchChores(barn, rancher).save.ranch.animals.map((a) => a.fondness)).toEqual([30, 198, 10])
    // The night: the animals' night first (an unfed one −10), then her chores; the morning says the fondness.
    const night = runNight(coop, context(rancher))
    expect(night.ranch.animals.map((a) => a.fondness)).toEqual([30, 198, 0])
    expect(night.summary!.hearts).toContainEqual({ kind: 'chores', items: 0, watered: 0, fondness: 10 })
    expect(parseSaveV5(json(night))).toEqual(night)
    // No animals in her building, or away from the farm: none.
    expect(ranchChores(withAnimals(coop, []), rancher).chores).toEqual([])
    expect(ranchChores({ ...coop, dorm: { ...coop.dorm, home: coop.dorm.home.filter((id) => id !== FOUR) } }, rancher).chores).toEqual([])
  })

  it('a ranch Uma working the Coop gives an extra good at times: the perks\' extras on what she collects', () => {
    // She cares for the Coop on the board: one egg waits, she collects it overnight, and at F3 it's a 10% chance of one more.
    const base = withAnimals(four(rancher, at('friendship', 3), 'coop'), [chicken(1, { fed: true, ready: true })], 20)
    const hired: SaveV4 = { ...base, roster: { ...base.roster, [FOUR]: { ...base.roster[FOUR]!, farmhand: 1, tasks: [{ kind: 'care', home: 'coop' }] } } }
    const uid = Array.from({ length: 300 }, (_, i) => `u${i}`).find((u) => draw(u, 3, `perk:${FOUR}`, 0) < 0.1)!
    const lucky = runNight({ ...hired, account: { ...hired.account, uid } }, context(rancher))
    expect(goodCount(lucky.items, 'egg')).toBe(2)
    expect(lucky.summary!.hearts).toContainEqual({ kind: 'perks', items: 1 })
    // Most nights, none: the egg alone.
    const plain = Array.from({ length: 300 }, (_, i) => `u${i}`).find((u) => draw(u, 3, `perk:${FOUR}`, 0) >= 0.1)!
    expect(goodCount(runNight({ ...hired, account: { ...hired.account, uid: plain } }, context(rancher)).items, 'egg')).toBe(1)
  })

  it('leaves a ★2+ ore, stone or gem, or egg, milk or fleece in the morning: her line\'s good', () => {
    const save = atFloor(four(miner, at('romance', 2, { morning: 1 }), 'mine'), 'mine', 10)
    expect(floorFinds('mine', 10)).toContain(lineGood(save, miner, FOUR, 2, 1).id)
    const q = atFloor(four(quarrier, at('romance', 2, { morning: 1 }), 'quarry'), 'quarry', 4)
    expect(floorFinds('quarry', 4)).toContain(lineGood(q, quarrier, FOUR, 2, 1).id)
    const ranch = withAnimals(four(rancher, at('romance', 2, { morning: 1 }), 'coop', 'barn'), [chicken(1), { ...chicken(2), id: 'sheep-2', kind: 'sheep' }])
    for (let day = 5; day <= 40; day++) expect(['egg', 'wool']).toContain(lineGood({ ...ranch, calendar: { day } }, rancher, FOUR, 2, 1).id)
    // With its place not open (a dig not built, no animals), a crop of the season, as before.
    expect(goodOf(lineGood(four(miner, at('romance', 2)), miner, FOUR, 2, 1).id)!.family).toBe('vegetables')
    expect(goodOf(lineGood(four(rancher, at('romance', 2), 'coop'), rancher, FOUR, 2, 1).id)!.family).toBe('vegetables')
    // At night step 9, every 4th morning, at ★2 or more.
    const morning = leaveMorningItems({ ...save, calendar: { day: 5 } }, miner, talentsD)
    const item = morning.lines.find((l) => l.id === FOUR)!
    expect(floorFinds('mine', 10)).toContain(parseStockKey(item.items[0]!)!.id)
    expect(parseStockKey(item.items[0]!)!.stars).toBeGreaterThanOrEqual(2)
    // A rancher's stars follow her building's animals' hearts (ten hearts is ★5), and her keepsake there.
    const fond = withAnimals(four(rancher, spouse(2, { morning: 1 }), 'coop'), [chicken(1, { fondness: 200 })])
    expect(lineQuality(fond, rancher, FOUR)).toBe(4 + KEEPSAKE_QUALITY)
  })

  it('sets her signature dish\'s grade by her line\'s best place: the deepest floor\'s top grade, the animals\' best good', () => {
    expect(lineGrade(four(miner, at('friendship', 4)), miner, FOUR)).toBe(1)
    expect(lineGrade(four(miner, at('friendship', 4), 'mine'), miner, FOUR)).toBe(floorTopGrade(1))
    expect(lineGrade(atFloor(four(miner, at('friendship', 4), 'mine'), 'mine', 10), miner, FOUR)).toBe(5)
    expect(lineGrade(atFloor(four(quarrier, at('friendship', 4), 'quarry'), 'quarry', 30), quarrier, FOUR)).toBe(10)
    expect(signatureDish(atFloor(four(miner, at('friendship', 4), 'mine'), 'mine', 10), miner, FOUR)).toBe('dish-herbs-spices-5')
    expect(lineGrade(four(rancher, at('friendship', 4), 'coop'), rancher, FOUR)).toBe(1)
    const kept = withAnimals(four(rancher, at('friendship', 4), 'coop', 'barn'), [chicken(1), { ...chicken(2), id: 'cow-2', kind: 'cow' }, { ...chicken(3), id: 'sheep-3', kind: 'sheep' }])
    expect(lineGrade(kept, rancher, FOUR)).toBe(goodOf('wool')!.grade)
    expect(signatureDish(kept, rancher, FOUR)).toBe(`dish-sweets-${goodOf('wool')!.grade}`)
  })

  it('her keepsake lifts a rancher\'s collection at her building', () => {
    const save = four(rancher, spouse(5), 'coop')
    expect(keepsakeQuality(save, rancher, FOUR, 'coop')).toBe(KEEPSAKE_GROWN)
    expect(keepsakeQuality(save, rancher, FOUR, 'mine')).toBe(0)
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
    expect(bad({ petName: 'Husband' })).toEqual([])
  })
})

describe('the save\'s perk fields and lines', () => {
  it('parses love.morning from R2 on and love.dish from F4 on, strictly', () => {
    const save = withLove(withLove(farm(14), TWO, at('romance', 2, { morning: 10 })), ONE, at('friendship', 4, { dish: 'dish-vegetables-6' }))
    expect(parseSaveV5(json(save))).toEqual(save)
    const refuse = (id: string, love: Partial<Love>, message: string) => expect(() => parseSaveV5(json(withLove(farm(14), id, love)))).toThrow(message)
    refuse(TWO, at('romance', 1, { morning: 10 }), `save.love.${TWO}.morning: only from Romance 2 on`)
    refuse(TWO, at('romance', 2, { morning: 15 }), `save.love.${TWO}.morning: after today`)
    refuse(ONE, at('friendship', 3, { dish: 'dish-vegetables-6' }), `save.love.${ONE}.dish: only from Friendship 4 on`)
    refuse(ONE, at('friendship', 4, { dish: 'carrot' }), `save.love.${ONE}.dish: unknown dish`)
  })

  it('parses the morning\'s item, chores and perks lines', () => {
    const save = farm(3)
    save.summary = { day: 3, bin: [], work: [], ranks: [], news: [], nudges: [], hearts: [
      { kind: 'item', id: TWO, items: ['shiitake@3'] }, { kind: 'chores', items: 2, watered: 1 }, { kind: 'perks', items: 4 }, { kind: 'side', items: 1 },
    ] }
    expect(parseSaveV5(json(save)).summary).toEqual(save.summary)
    // A rancher's chores add their fondness; a line from before has none.
    const ranch = { ...save, summary: { ...save.summary, hearts: [{ kind: 'chores' as const, items: 0, watered: 0, fondness: 10 }] } }
    expect(parseSaveV5(json(ranch)).summary).toEqual(ranch.summary)
    const refuse = (hearts: unknown[], message: string) => expect(() => parseSaveV5({ ...json(save), summary: { ...json(save.summary), hearts } })).toThrow(message)
    refuse([{ kind: 'chores', items: 1, watered: 0, fondness: 0 }], 'save.summary.hearts.0.fondness')
    refuse([{ kind: 'item', id: TWO, items: [] }], 'save.summary.hearts.0.items')
    refuse([{ kind: 'item', id: TWO, items: ['nope@3'] }], 'save.summary.hearts.0.items.0: expected <good>@<stars>')
    refuse([{ kind: 'chores', items: 0, watered: 0 }], 'save.summary.hearts.0: expected items, tiles watered or fondness')
    refuse([{ kind: 'chores', items: 1, watered: 0.5 }], 'save.summary.hearts.0.watered: expected 0–320')
    refuse([{ kind: 'chores', items: 1, growth: 0.25 }], 'save.summary.hearts.0: unknown keys growth')
    refuse([{ kind: 'perks', items: 0 }], 'save.summary.hearts.0.items')
    refuse([{ kind: 'perks', items: 1 }, { kind: 'perks', items: 2 }], 'save.summary.hearts.1: repeated')
  })
})
