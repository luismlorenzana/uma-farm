// The perks' words: one perk a level, 25 in all, templated by her line;
// "Opens when the Mine is built" (her place) for a perk at a place not built yet. Invented ids only: the stand-ins and casts of
// 9000004 onward built here.
import { describe, expect, it } from 'vitest'
import type { CastEntry } from '../story/authored'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import { ROUTE_RUNGS, WAITING_RUNGS, NIGHT_RUNGS } from './love'
import { linePlace, PERK_LINES, perkLineOf, perkOf, PERKS, perksFor, perkWords, type PerkLine } from './perks'
import type { FarmPlaceId } from '../farm/places'

const PACK = storyPackFrom(STAND_IN_FILES)
/** A farm's buildings with these places built. */
const built = (...ids: FarmPlaceId[]) => ({ buildings: { dorm: 1, ...Object.fromEntries(ids.map((id) => [id, 1])) } })
const words = (line: PerkLine) => Object.fromEntries(perksFor(line, built()).map((p) => [p.rung, p.words]))

describe('the perks', () => {
  it('has one perk on every level of her route, and none on a waiting rung', () => {
    const levels = ROUTE_RUNGS.filter((r) => !WAITING_RUNGS.includes(r))
    expect(PERKS.map((p) => p.rung)).toEqual(levels)
    expect(PERKS).toHaveLength(25)
    expect(new Set(PERKS.map((p) => p.id)).size).toBe(25)
    for (const rung of WAITING_RUNGS) expect(perkOf(rung)).toBeNull()
    // S2 and S4 have no event but each brings a perk (they level at night).
    for (const rung of NIGHT_RUNGS) expect(perkOf(rung)).not.toBeNull()
  })

  it('templates each line’s place, chore and morning item', () => {
    expect(words('farming')).toMatchObject({
      f3: '+10% at the Fields', f6: '+0.25 growth on a block each night', r2: 'A ★2+ crop of the season every 4th morning', r5: '+10% more at the Fields (+20%)',
      s3: 'Her dream; +5% for anyone at the Fields',
    })
    expect(words('foraging')).toMatchObject({ f3: '+10% at the forest', f6: 'One item from the forest each night', f9: 'Mentor: +10% rank points for Umas at the forest' })
    expect(words('fishing')).toMatchObject({ f3: '+10% at the Fishery', f6: 'One fish from the Fishery each night', s2: 'A ★3+ fish every 2nd morning, and each morning in her house' })
    expect(words('mining')).toMatchObject({ f3: '+10% at the Mine', f6: 'One ore from the Mine each night', r2: 'A ★2+ ore every 4th morning' })
    expect(words('quarry')).toMatchObject({ f3: '+10% at the Quarry', f6: 'One stone or gem from the Quarry each night', r2: 'A ★2+ stone or gem every 4th morning' })
    expect(words('ranch')).toMatchObject({ f3: '+10% at the ranch', f6: '+5 affection to her pen each night', r2: 'A ★2+ egg, milk or fleece every 4th morning' })
    expect(words('cooking')).toMatchObject({ f3: '+10% at the Kitchen', f6: 'One more dish on the Kitchen’s next play', r2: 'A ★2+ dish every 4th morning' })
    // The levels that don't depend on her line read the same for everyone.
    for (const line of PERK_LINES) {
      expect(words(line)).toMatchObject({
        f1: 'Her loved gift shown; her own chats', f4: 'Her signature dish’s recipe', f5: '×1.05 rank points', f10: 'Her keepsake; ×1.10 rank points',
        r7: 'A second night chore', r10: 'The proposal', s4: 'A third night chore', s5: 'Vow renewal; her keepsake grows',
      })
    }
  })

  it('says "Opens when the Mine is built" for a miner’s perks at her place until it stands', () => {
    const at = (line: PerkLine, ...ids: FarmPlaceId[]) => Object.fromEntries(perksFor(line, built(...ids)).map((p) => [p.rung, p.opens]))
    expect(at('mining')).toMatchObject({ f3: 'mine', f6: 'mine', f8: 'mine', f9: 'mine', r5: 'mine', r7: 'mine', s3: 'mine', s4: 'mine', f1: null, f5: null, r2: null })
    expect(at('quarry', 'mine').f3).toBe('quarry')
    expect(at('mining', 'mine').f3).toBeNull()
    expect(at('forging').f3).toBe('forge')
    expect(at('ranch').f6).toBe('coop')
    // The Fields, the forest and the Fishery are open from day 1.
    for (const line of ['farming', 'foraging', 'fishing'] as const) expect(perksFor(line, built()).every((p) => p.opens === null)).toBe(true)
    expect([linePlace('mining'), linePlace('quarry'), linePlace('cooking'), linePlace('serving'), linePlace('farming')]).toEqual(['mine', 'quarry', 'kitchen', 'restaurant', null])
  })

  it('reads her line from the pack: her favourite, a quarry calling at the Quarry', () => {
    expect([perkLineOf(PACK, '9000001'), perkLineOf(PACK, '9000002'), perkLineOf(PACK, '9000003'), perkLineOf(PACK, '9999999')]).toEqual(['farming', 'foraging', 'fishing', null])
    const miner = (id: string, calling: CastEntry['calling']): CastEntry => ({ characterId: id, outfitId: `${id}01`, arrives: { kind: 'opening' }, calling, paragraph: 'Invented.' })
    const pack: Pick<StoryPack, 'cast' | 'bibles'> = { cast: { ...PACK.cast, umas: [miner('9000004', 'mining'), miner('9000005', 'quarry')] }, bibles: new Map() }
    expect([perkLineOf(pack, '9000004'), perkLineOf(pack, '9000005')]).toEqual(['mining', 'quarry'])
    expect(perkWords('line-10', 'quarry')).toBe('+10% at the Quarry')
  })
})
