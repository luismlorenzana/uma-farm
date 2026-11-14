// Ranks: rank points a day, the challenges, rank-ups at night, what a
// rank gives and the favourite line. Invented ids and test kinds (`kinds.fixture.ts`); favourites from an invented cast.
import { describe, expect, it } from 'vitest'
import { harvestAll, harvestQuality, plantAll, seedsBackChance, setTender, tendedGrowth } from '../fields/fields'
import { cropLevelQuality, quality, TENDED_QUALITY } from '../goods/stars'
import { endDay, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import type { RankLine } from '../night/summary'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV4 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type Love, type Plot, type RankState, type SaveV4 } from '../save/v4'
import type { Calling, CastEntry } from '../story/authored'
import { STAND_IN_CAST } from '../story/authored.fixture'
import {
  challengeFor, challengeMet, CHALLENGES, countChallenge, daysToRank, FAVOURITE_ACTIVITIES, heartsFactorOf, loveRankFactor,
  PLACE_ACTIVITY, pointsFull, RANK_BENEFITS, rankBenefits, rankPoints, rankPointsForDay, rankQuality, tickRankRules, type ChallengeEvent,
  type TermsOf,
} from './rank-rules'
import { AREA_NAMES, SPOT_NAMES } from '../gathering/ids'
import { ACTIVITIES, LINE_ACTIVITY, RANK_POINTS, type Activity, type Rank } from './ranks'
import { TALENT_D, talentQuality, type TalentStep } from './talents'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const entry = (characterId: string, calling: Calling): CastEntry => ({ characterId, outfitId: `${characterId}01`, calling, paragraph: 'Invented.' })
/** 101 calls farming, 202 foraging, 303 mining: their favourite lines (no bibles: the calling stands in). */
const STORY: NonNullable<NightContext['story']> = {
  cast: { ...STAND_IN_CAST, umas: [entry('101', 'farming'), entry('202', 'foraging'), entry('303', 'mining')] }, bibles: new Map(), ties: { version: 1, ties: [] },
}
const CONTEXT: NightContext = { kinds: TEST_KINDS, story: STORY }

function farm(day = 1): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, love: { 101: newLove(), 202: newLove(), 303: newLove() },
    dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, items: { 'seed-carrot': [9, 0, 0, 0, 0] },
  }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const night = (save: SaveV4, context: NightContext = CONTEXT) => endDay(save, context, LATER)
const nights = (save: SaveV4, n: number, context: NightContext = CONTEXT) => Array.from({ length: n }).reduce<SaveV4>((s) => night(s, context), save)
const withRank = (save: SaveV4, id: string, activity: Activity, state: Partial<RankState>, more: Partial<SaveV4['roster'][string]> = {}): SaveV4 => {
  const uma = save.roster[id]!
  return { ...save, roster: { ...save.roster, [id]: { ...uma, ...more, ranks: { ...uma.ranks, [activity]: { ...uma.ranks[activity], ...state } } } } }
}
/** Block A planted with nine Carrots and tended by 101. */
const tended = (save = farm()) => setTender(plantAll(save, 'A', 'carrot'), 'A', '101')
const D_TERMS: TermsOf = () => ({ talent: TALENT_D, favourite: false })

describe('rank points a day', () => {
  it('pays 10 × her talent\'s factor, ×1.2 in her favourite line, ×1.25 well fed, ×1.05 from Friendship 5 and ×1.10 from 10', () => {
    const day = (talent: TalentStep, favourite = false, wellFed = false, level = 0) =>
      rankPointsForDay({ talent, favourite, wellFed, heartsFactor: loveRankFactor(level >= 10 ? { stage: 'confession', level: 10 } : { stage: 'friendship', level }) })
    expect(day(3)).toBe(10)
    expect(day(4, true)).toBe(13.2)
    expect(day(0)).toBe(8)
    expect(day(7, true)).toBe(18)
    expect(day(3, false, true)).toBe(12.5)
    expect([0, 4, 5, 9, 10].map((l) => day(3, false, false, l))).toEqual([10, 10, 10.5, 10.5, 11])
    expect(day(7, true, true, 10)).toBe(24.75)
    expect(heartsFactorOf(withLove(farm(), '101', { level: 5 }), '101')).toBe(1.05)
    expect(heartsFactorOf(farm(), '999')).toBe(1)
    // A workshop play and an expedition pass their own base, with the same factors.
    expect(rankPoints(20, { talent: 3, favourite: false, wellFed: true, heartsFactor: 1 })).toBe(25)
  })

  it('matches the days-to-rank table, in her favourite line in brackets', () => {
    const table = (talent: TalentStep) => ([1, 2, 3, 4, 5] as Rank[]).map((r) =>
      `${daysToRank(r, rankPointsForDay({ talent, favourite: false, wellFed: false, heartsFactor: 1 }))} (${daysToRank(r, rankPointsForDay({ talent, favourite: true, wellFed: false, heartsFactor: 1 }))})`)
    expect(table(0)).toEqual(['5 (5)', '20 (17)', '50 (42)', '113 (94)', '250 (209)'])
    expect(table(3)).toEqual(['4 (4)', '16 (14)', '40 (34)', '90 (75)', '200 (167)'])
    expect(table(4)).toEqual(['4 (4)', '15 (13)', '37 (31)', '82 (69)', '182 (152)'])
    expect(table(6)).toEqual(['4 (3)', '13 (11)', '31 (26)', '70 (58)', '154 (129)'])
    expect(table(7)).toEqual(['3 (3)', '11 (9)', '27 (23)', '60 (50)', '134 (112)'])
  })

  it('reaches each rank on its night, night by night, with every challenge met', () => {
    /** The night she reaches each rank, working every day, her challenge met as soon as it's asked. */
    const climb = (talent: TalentStep, favourite: boolean): number[] => {
      let save = farm()
      const reached: number[] = []
      for (let n = 1; n <= 300 && reached.length < 5; n++) {
        const state = save.roster['101']!.ranks.farming
        const next = challengeFor('farming', state.rank)
        if (next) save = withRank(save, '101', 'farming', { challenge: next.target })
        save = tickRankRules(save, [{ outfitId: '101', activity: 'farming' }], () => ({ talent, favourite })).save
        if (save.roster['101']!.ranks.farming.rank > reached.length) reached.push(n)
      }
      return reached
    }
    expect(climb(4, true)).toEqual([4, 13, 31, 69, 152])
    const g = climb(0, false)
    expect([g[0], g[4]]).toEqual([5, 250])
  })
})

describe('rank-ups at night', () => {
  it('lets points go on past a threshold and waits for the challenge, saying so once', () => {
    let save = withRank(tended(), '101', 'farming', { points: 35 })
    save = night(save)
    expect(save.roster['101']!.ranks.farming).toEqual({ points: 47, rank: 0, challenge: 0 })
    expect(save.summary!.ranks).toEqual([{ kind: 'full', outfitId: '101', activity: 'farming', rank: 1, challenge: 0 }])
    save = night(save)
    expect(save.roster['101']!.ranks.farming).toEqual({ points: 59, rank: 0, challenge: 0 })
    expect(save.summary!.ranks).toEqual([])
  })

  it('ranks up the night after the challenge is met during the day, and resets the count', () => {
    let save = withRank(farm(), '101', 'farming', { points: 41, challenge: 25 })
    save = countChallenge(save, '101', 'farming', { kind: 'harvest', stars: [1, 1, 1, 1, 1, 1, 1], level: 1 })
    // Met during the day: it waits for the night, and the count stops at the target.
    expect(save.roster['101']!.ranks.farming).toEqual({ points: 41, rank: 0, challenge: 30 })
    save = night(save)
    expect(save.roster['101']!.ranks.farming).toEqual({ points: 41, rank: 1, challenge: 0 })
    expect(save.summary!.ranks).toEqual([{ kind: 'rank-up', outfitId: '101', activity: 'farming', rank: 1 }])
    expect(parseSaveV4(json(save), 'save', TEST_KINDS)).toEqual(save)
  })

  it('takes one rank a night, one challenge at a time, and says when the next one\'s points are already full', () => {
    let save = withRank(farm(), '303', 'mining', { points: 500, challenge: 40 })
    save = night(save)
    expect(save.roster['303']!.ranks.mining).toEqual({ points: 500, rank: 1, challenge: 0 })
    expect(save.summary!.ranks).toEqual<RankLine[]>([
      { kind: 'rank-up', outfitId: '303', activity: 'mining', rank: 1 },
      { kind: 'full', outfitId: '303', activity: 'mining', rank: 2, challenge: 0 },
    ])
    save = countChallenge(save, '303', 'mining', { kind: 'dig', floor: 10, items: 4 })
    save = night(save)
    expect(save.roster['303']!.ranks.mining).toEqual({ points: 500, rank: 2, challenge: 0 })
    expect(save.summary!.ranks.map((l) => l.kind)).toEqual(['rank-up', 'full'])
  })

  it('counts a challenge toward her next rank only, from her last rank-up, and nothing at Legend', () => {
    const save = withRank(farm(), '202', 'foraging', { rank: 1, challenge: 0 })
    const hills: ChallengeEvent = { kind: 'gather', area: 'hills', items: 6 }
    expect(countChallenge(save, '202', 'foraging', { kind: 'gather', area: 'woods', items: 6 })).toBe(save)
    expect(countChallenge(save, '202', 'foraging', hills).roster['202']!.ranks.foraging.challenge).toBe(6)
    expect(countChallenge(save, '202', 'fishing', hills)).toBe(save)
    expect(countChallenge(save, '999', 'foraging', hills)).toBe(save)
    const legend = withRank(save, '202', 'foraging', { rank: 5 })
    expect(countChallenge(legend, '202', 'foraging', hills)).toBe(legend)
    expect(challengeFor('foraging', 5)).toBeNull()
    expect(countChallenge(save, '202', 'foraging', hills).account).toEqual(save.account)
  })

  it('reads points full and a challenge met for her next rank only', () => {
    const s = (points: number, rank: Rank, challenge: number): RankState => ({ points, rank, challenge })
    expect([pointsFull(s(39.99, 0, 0)), pointsFull(s(40, 0, 0)), pointsFull(s(159, 1, 0)), pointsFull(s(9999, 5, 0))]).toEqual([false, true, false, false])
    expect([challengeMet('fishing', s(0, 0, 29)), challengeMet('fishing', s(0, 0, 30)), challengeMet('fishing', s(0, 1, 9)), challengeMet('fishing', s(0, 5, 99))])
      .toEqual([false, true, false, false])
  })
})

describe('who worked today', () => {
  it('pays a tender whose block has a growing plot, and never a tender of an empty block', () => {
    const empty = setTender(farm(), 'A', '101')
    expect(night(empty).roster['101']!.ranks.farming.points).toBe(0)
    // 101's favourite is farming: 10 × 1.2.
    expect(night(tended()).roster['101']!.ranks.farming.points).toBe(12)
    // A C talent in her favourite line: 10 × 1.1 × 1.2.
    expect(night(tended(), { ...CONTEXT, talentOf: (_id, a) => (a === 'farming' ? 4 : 3) }).roster['101']!.ranks.farming.points).toBe(13.2)
    // Outside her favourite: 202 tends (she calls foraging).
    expect(night(setTender(plantAll(farm(), 'A', 'carrot'), 'A', '202')).roster['202']!.ranks.farming.points).toBe(10)
  })

  it('pays a running job in its place\'s activity: the forest foraging, the Mill farming', () => {
    expect(PLACE_ACTIVITY).toMatchObject({ forest: 'foraging', sawmill: 'foraging', fishery: 'fishing', smokehouse: 'fishing', mill: 'farming', mine: 'mining' })
    const save = startLoopJob(farm(), { outfitId: '202', place: 'forest', slot: 0, request: { kind: 'gather', item: 'pine-log', count: 1 } }, AT, TEST_KINDS)
    const after = night(save)
    expect(after.roster['202']!.ranks.foraging.points).toBe(12)
    expect(after.roster['303']!.ranks).toEqual(farm().roster['303']!.ranks)
  })

  it('pays one activity a day, her first', () => {
    const { save, paid } = tickRankRules(farm(), [{ outfitId: '101', activity: 'fishing' }, { outfitId: '101', activity: 'farming' }, { outfitId: '999', activity: 'farming' }], D_TERMS)
    expect(paid).toEqual([{ outfitId: '101', activity: 'fishing', points: 10 }])
    expect(save.roster['101']!.ranks.farming.points).toBe(0)
    expect(save.roster['101']!.ranks.fishing.points).toBe(10)
  })

  it('lifts the points for the well fed and for her friendship, read before the night counts well fed down', () => {
    const fed = withRank(tended(), '202', 'farming', {}, { wellFed: 1 })
    const both = setTender(fed, 'A', '202')
    const after = night(both)
    expect(after.roster['202']!.ranks.farming.points).toBe(12.5)
    expect(after.roster['202']!.wellFed).toBe(0)
    const fond = setTender(withLove(tended(), '202', { level: 5 }), 'A', '202')
    expect(night(fond).roster['202']!.ranks.farming.points).toBe(10.5)
  })

  it('reads talents through the night: an S tender grows her block 1.4 a night', () => {
    const save = tended()
    const growth = (talent: TalentStep) => night(save, { ...CONTEXT, talentOf: () => talent }).fields.blocks[0]!.plots[0]!.growth
    expect([growth(3), growth(7)]).toEqual([1.25, 1.4])
  })

  it('gives the same morning from the same save', () => {
    const save = withRank(tended(), '101', 'farming', { points: 35 })
    expect(night(json(save))).toEqual(night(save))
    expect(nights(save, 3).roster['101']!.ranks.farming.points).toBe(71)
  })
})

describe('the challenges', () => {
  it('holds five a activity, toward Hand … Legend, with their targets', () => {
    for (const a of ACTIVITIES) expect(CHALLENGES[a].map((c) => c.rank), a).toEqual([1, 2, 3, 4, 5])
    const targets = Object.fromEntries(ACTIVITIES.map((a) => [a, CHALLENGES[a].map((c) => c.target)]))
    expect(targets).toEqual({
      farming: [30, 40, 1, 30, 1], ranch: [10, 1, 1, 1, 1], mining: [40, 1, 1, 1, 1], fishing: [30, 10, 10, 10, 1], foraging: [50, 20, 20, 20, 20],
      cooking: [5, 1, 10, 1, 1], serving: [5, 1, 100, 1, 1000], forging: [5, 1, 1, 1, 1], expeditions: [2, 1, 1, 1, 1],
    })
  })

  it('counts what each reads, and nothing else', () => {
    const count = (a: Activity, rank: Rank, e: ChallengeEvent) => CHALLENGES[a][rank]!.count(e)
    // Each depth challenge is the deepest place the rank before allows.
    expect(([1, 2, 3, 4] as Rank[]).map((r) => count('mining', r, { kind: 'dig', floor: RANK_BENEFITS[r]!.deepest.floor, items: 1 }))).toEqual([1, 1, 1, 1])
    expect(count('mining', 1, { kind: 'dig', floor: 9, items: 5 })).toBe(0)
    expect(count('mining', 0, { kind: 'dig', floor: 1, items: 5 })).toBe(5)
    expect(([1, 2, 3] as Rank[]).map((r) => count('fishing', r, { kind: 'catch', spot: RANK_BENEFITS[r]!.deepest.fishery, fish: 3 }))).toEqual([3, 3, 3])
    expect(count('fishing', 1, { kind: 'catch', spot: 'pond', fish: 3 })).toBe(0)
    expect(([1, 2, 3, 4] as Rank[]).map((r) => count('foraging', r, { kind: 'gather', area: RANK_BENEFITS[r]!.deepest.forest, items: 4 }))).toEqual([4, 4, 4, 4])
    expect(count('fishing', 4, { kind: 'won', festival: 'fishing-derby' })).toBe(1)
    expect(count('fishing', 4, { kind: 'won', festival: 'flower-show' })).toBe(0)
    expect(count('cooking', 1, { kind: 'play', grade: 'good' })).toBe(0)
    expect(count('cooking', 1, { kind: 'play', grade: 'masterwork' })).toBe(1)
    expect(count('cooking', 3, { kind: 'play', grade: 'fine' })).toBe(0)
    expect(count('cooking', 2, { kind: 'dishes', stars: [3, 4, 5] })).toBe(2)
    expect(count('serving', 4, { kind: 'guests', guests: 120 })).toBe(120)
    expect(count('forging', 4, { kind: 'forged', tool: 'upgrade' })).toBe(0)
    expect(count('forging', 4, { kind: 'forged', tool: 'mythril' })).toBe(1)
    expect(count('ranch', 2, { kind: 'hearts', hearts: 7 })).toBe(1)
    expect(count('ranch', 0, { kind: 'care' })).toBe(1)
    expect(count('expeditions', 0, { kind: 'expedition', result: 'failure', level: 1, region: 'old-fort-ruins' })).toBe(1)
    expect(count('expeditions', 1, { kind: 'expedition', result: 'partial', level: 12, region: 'echo-cave' })).toBe(0)
    expect(count('expeditions', 3, { kind: 'expedition', result: 'success', level: 25, region: 'ember-peak' })).toBe(0)
    expect(count('expeditions', 4, { kind: 'expedition', result: 'success', level: 30, region: 'sky-ruins' })).toBe(1)
    expect(count('farming', 0, { kind: 'catch', spot: 'pond', fish: 3 })).toBe(0)
  })

  it('counts a tended harvest for the tender, by her rank, and none untended', () => {
    const ripe = (save: SaveV4): SaveV4 => {
      const plot: Plot = { crop: 'carrot', growth: 3.5, ready: true, regrowing: false, own: false }
      return { ...save, fields: { blocks: save.fields.blocks.map((b) => ({ ...b, plots: b.plots.map(() => ({ ...plot })) })) } }
    }
    expect(harvestAll(setTender(ripe(farm()), 'A', '101')).save.roster['101']!.ranks.farming.challenge).toBe(9)
    expect(harvestAll(ripe(farm())).save.roster['101']!.ranks.farming.challenge).toBe(0)
    // A real talent reaches the stars: an S tender's harvest is a full point better than a D's.
    const s = harvestAll(setTender(ripe(farm()), 'A', '101'), ['A'], () => 7).receipt.stars
    const d = harvestAll(setTender(ripe(farm()), 'A', '101'), ['A'], () => 3).receipt.stars
    const mean = (stars: number[]) => stars.reduce((sum, n, i) => sum + n * (i + 1), 0) / 9
    expect(mean(s)).toBeGreaterThan(mean(d))
    expect(s[0]).toBe(0)
  })
})

describe('what a rank gives', () => {
  it('drives yield, tended growth, quality, the deepest place and seeds back from the table', () => {
    expect(RANK_BENEFITS.map((b) => b.yield)).toEqual([1, 1.15, 1.3, 1.5, 1.7, 2])
    expect(RANK_BENEFITS.map((b) => [b.expeditionPower, b.affection, b.workshopYield])).toEqual([[10, 0, 1], [20, 3, 1.1], [30, 6, 1.2], [40, 9, 1.3], [50, 12, 1.4], [60, 15, 1.5]])
    const ranks = [0, 1, 2, 3, 4, 5] as Rank[]
    expect(ranks.map((r) => tendedGrowth(r, TALENT_D))).toEqual(RANK_BENEFITS.map((b) => b.tendedGrowth))
    expect(ranks.map((r) => tendedGrowth(r, TALENT_D))).toEqual([1.25, 1.35, 1.45, 1.55, 1.65, 1.75])
    expect(ranks.map((r) => seedsBackChance(r))).toEqual([0.1, 0.15, 0.2, 0.25, 0.3, 0.35])
    expect(ranks.map(rankQuality)).toEqual([0, 0.5, 1, 1.5, 2, 2.5])
    expect(ranks.map((r) => harvestQuality({ rank: r, talent: TALENT_D, wellFed: false }, 1))).toEqual(ranks.map((r) => quality({ rank: rankQuality(r), care: TENDED_QUALITY, cropLevel: cropLevelQuality(1) })))
    expect(harvestQuality({ rank: 3, talent: 6, wellFed: true }, 4, 3)).toBe(3.55)
    expect(talentQuality(6)).toBe(0.75)
    expect(ranks.map((r) => `${rankBenefits(r).deepest.floor} · ${AREA_NAMES[rankBenefits(r).deepest.forest]} · ${SPOT_NAMES[rankBenefits(r).deepest.fishery]}`)).toEqual([
      '5 · the Woods · the Pond', '10 · the Hills · the River', '15 · the Old Forest · the Lake', '20 · the Mountain · the Falls',
      '25 · the Misty Vale · the Deep Sea', '30 · the World Tree · the Moon Pool',
    ])
    expect(RANK_POINTS).toEqual([0, 40, 160, 400, 900, 2000])
  })

  it('makes a line\'s activity a favourite: Metal and Stone mining, Wood foraging, Fish fishing, Vegetables farming', () => {
    expect((['metal', 'stone', 'wood', 'fish', 'vegetables'] as const).map((line) => LINE_ACTIVITY[line])).toEqual(['mining', 'mining', 'foraging', 'fishing', 'farming'])
    expect(FAVOURITE_ACTIVITIES).toEqual(['farming', 'mining', 'fishing', 'foraging'])
  })
})
