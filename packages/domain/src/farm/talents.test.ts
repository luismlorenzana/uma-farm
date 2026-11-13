// Talents: the stat → talent rule on invented outfits, copies of uma-data's synthetic one with
// chosen stats and growth rates. No release data.
import type { Outfit } from '@luismlorenzana/uma-data'
import { syntheticMasterData } from '@luismlorenzana/uma-data/testing'
import { describe, expect, it } from 'vitest'
import {
  activityScore, EXPEDITION_CUTOFFS, expeditionScore, expeditionTalent, gradeStep, STAT_CUTOFFS, TALENT_GRADES, talentGrowth, talentOf, talentQuality,
  talentRankPoints, talentResolver, talentScores, talentsOf, talentYield, temperament, type TalentScores, type TalentStep,
} from './talents'

const base = syntheticMasterData().outfits[0]!
type Five = [number, number, number, number, number]
/** An invented outfit: 5★ stats and growth rates in Speed, Stamina, Power, Guts, Wit order. */
function outfit(star5: Five, growth: Five = [0, 0, 0, 0, 0]): Outfit {
  const stats = (v: Five) => ({ speed: v[0], stamina: v[1], power: v[2], guts: v[3], wit: v[4] })
  return { ...base, id: 81001, stats: { ...base.stats, star5: stats(star5) }, growthRatePercents: stats(growth) }
}
const scores = (v: Five): TalentScores => ({ speed: v[0], stamina: v[1], power: v[2], guts: v[3], wit: v[4] })

describe('the talent score (CS27)', () => {
  it('is her 5★ base stat × (100 + her growth rate) ÷ 100', () => {
    expect(talentScores(outfit([102, 108, 120, 110, 110], [0, 20, 0, 0, 10]))).toEqual(scores([102, 129.6, 120, 110, 121]))
    expect(talentScores(outfit([125, 152, 100, 100, 73], [20, 20, 0, 0, 0]))).toEqual(scores([150, 182.4, 100, 100, 73]))
  })

  it('reads Stamina for farming, Guts the ranch, Power mining and forging, Wit cooking and fishing, Speed foraging and serving', () => {
    const s = scores([150, 138, 126, 114, 104])
    expect([talentOf(s, 'foraging'), talentOf(s, 'serving')]).toEqual([7, 7])
    expect(talentOf(s, 'farming')).toBe(6)
    expect([talentOf(s, 'mining'), talentOf(s, 'forging')]).toEqual([5, 5])
    expect(talentOf(s, 'ranch')).toBe(4)
    expect([talentOf(s, 'cooking'), talentOf(s, 'fishing')]).toEqual([3, 3])
    expect(activityScore(s, 'farming')).toBe(138)
  })
})

describe('the grades (CS27)', () => {
  it('makes 150 S and 149.9 A, and cuts every grade at its edge', () => {
    expect(TALENT_GRADES[gradeStep(150)]).toBe('S')
    expect(TALENT_GRADES[gradeStep(149.9)]).toBe('A')
    const edges: [number, string][] = [[150, 'S'], [138, 'A'], [126, 'B'], [114, 'C'], [104, 'D'], [96, 'E'], [88, 'F']]
    for (const [cut, grade] of edges) {
      expect(TALENT_GRADES[gradeStep(cut)], `${cut}`).toBe(grade)
      expect(TALENT_GRADES[gradeStep(cut - 0.1)], `${cut - 0.1}`).not.toBe(grade)
    }
    expect(TALENT_GRADES[gradeStep(87.9)]).toBe('G')
    expect(TALENT_GRADES[gradeStep(0)]).toBe('G')
    expect(STAT_CUTOFFS).toEqual([88, 96, 104, 114, 126, 138, 150])
  })

  it('grades expeditions on the mean of her three best scores: 136 is S, 135.9 A, and every edge', () => {
    expect(expeditionScore(scores([140, 136, 132, 60, 50]))).toBe(136)
    expect(TALENT_GRADES[expeditionTalent(scores([140, 136, 132, 60, 50]))]).toBe('S')
    expect(TALENT_GRADES[gradeStep(135.9, EXPEDITION_CUTOFFS)]).toBe('A')
    const edges: [number, string][] = [[136, 'S'], [132, 'A'], [129, 'B'], [126, 'C'], [124, 'D'], [122, 'E'], [120, 'F']]
    for (const [cut, grade] of edges) {
      expect(TALENT_GRADES[gradeStep(cut, EXPEDITION_CUTOFFS)], `${cut}`).toBe(grade)
      expect(TALENT_GRADES[gradeStep(cut - 0.01, EXPEDITION_CUTOFFS)], `${cut - 0.01}`).not.toBe(grade)
    }
    expect(TALENT_GRADES[gradeStep(119.99, EXPEDITION_CUTOFFS)]).toBe('G')
    // The mean rounds to a millionth, so a third of a point lands where it means.
    expect(expeditionScore(scores([136.4, 135.8, 135.8, 100, 100]))).toBe(136)
    expect(talentOf(scores([136.4, 135.8, 135.8, 100, 100]), 'expeditions')).toBe(7)
  })
})

describe('her talents, best and temperament (CS27, CS46; decision 4)', () => {
  it('reads every activity, her best among the five stats and her temperament', () => {
    const t = talentsOf(outfit([100, 125, 100, 100, 125], [0, 20, 0, 0, 0]))
    expect(t.steps).toEqual({ farming: 7, ranch: 2, mining: 2, fishing: 4, foraging: 2, cooking: 4, serving: 2, forging: 2, expeditions: 3 })
    expect(t.best).toBe('farming')
    expect(t.temperament).toBe('steady')
  })

  it('breaks a best-talent tie by the higher score, then the activities\' order', () => {
    expect(talentsOf(outfit([110, 110, 110, 118, 116])).best).toBe('ranch')
    expect(talentsOf(outfit([110, 110, 116, 110, 116])).best).toBe('mining')
  })

  it('takes temperament from her top score, ties going Speed, Stamina, Power, Guts, Wit', () => {
    expect(temperament(scores([120, 120, 120, 120, 120]))).toBe('breezy')
    expect(temperament(scores([100, 120, 120, 120, 120]))).toBe('steady')
    expect(temperament(scores([100, 100, 120, 120, 120]))).toBe('bold')
    expect(temperament(scores([100, 100, 100, 120, 120]))).toBe('gritty')
    expect(temperament(scores([100, 100, 100, 100, 120]))).toBe('clever')
    // Growth counts: the score, not the bare stat.
    expect(temperament(talentScores(outfit([120, 110, 100, 100, 100], [0, 10, 0, 0, 0])))).toBe('steady')
  })

  it('resolves an outfit the table doesn\'t hold to D', () => {
    const of = talentResolver(new Map([['81001', talentsOf(outfit([150, 80, 100, 100, 100]))]]))
    expect([of('81001', 'foraging'), of('81001', 'farming'), of('99999', 'fishing')]).toEqual([7, 0, 3])
  })
})

describe('what a talent gives (CS28)', () => {
  const steps = [0, 1, 2, 3, 4, 5, 6, 7] as TalentStep[]
  it('matches CS28 row by row', () => {
    expect(steps.map(talentYield)).toEqual([0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2])
    expect(steps.map(talentQuality)).toEqual([-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1])
    expect(steps.map(talentRankPoints)).toEqual([0.8, 0.85, 0.9, 1, 1.1, 1.2, 1.3, 1.5])
    expect(steps.map(talentGrowth)).toEqual([0, 0, 0, 0, 0, 0.05, 0.1, 0.15])
  })
})
