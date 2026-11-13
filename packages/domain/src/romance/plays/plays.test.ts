// The five plays: pure rules, tested before any screen draws them. Each scores
// 0–100 at its edges, a perfect run 100, no taps a Fine, the same seed and taps the same score, both lengths; Choose's
// tastes; Walk's 50/75/100; the plays' map. Invented ids only: the stand-ins 9000001–9000003.
import { describe, expect, it } from 'vitest'
import { newSave } from '../../save/v4'
import { DATE_GAMES, type Together } from '../../story/authored'
import { ACTIVITIES } from '../../farm/ranks'
import { storyPackFrom } from '../../story/pack'
import { STAND_IN_FILES } from '../../story/stand-in'
import { CAST_COUNT, castPlan, castScore } from './cast'
import { CHOOSE_SCORES, choosePlan, chooseScore } from './choose'
import {
  EVENING_GRADE_POINTS, EVENT_GRADE_POINTS, gradeOf, meanScore, playSeed, shuffled, TIMING_WINDOWS, timingScore, type Seed,
} from './grade'
import { PICK_CELLS, PICK_POPS, PICK_STARS, pickGoods, pickPlan, pickRound, pickScore, type PickTap } from './pick'
import { RHYTHM_BEATS, RHYTHM_EXTRA, rhythmBeats, rhythmPlan, rhythmRound, rhythmScore } from './rhythm'
import { WALK_FORKS, walkFavourite, walkPlacesOpen, walkPlan, walkScore, type Turn } from './walk'
import { PLAY_MAP, playOf, togetherPlay } from './which'

const PACK = storyPackFrom(STAND_IN_FILES)
const seed: Seed = playSeed('u1', 3, '9000001', 'f1')
const other: Seed = playSeed('u1', 4, '9000001', 'f1')

describe('grades', () => {
  it('Fine below 60, Great 60–89, Perfect 90+', () => {
    expect([0, 59, 60, 89, 90, 100].map(gradeOf)).toEqual(['fine', 'fine', 'great', 'great', 'perfect', 'perfect'])
    expect(EVENT_GRADE_POINTS).toEqual({ fine: 0, great: 15, perfect: 30 })
    expect(EVENING_GRADE_POINTS).toEqual({ fine: 60, great: 100, perfect: 150 })
  })
  it('the timing windows: 100 inside 80 ms, Perfect to 160, Great to 360, Fine past it, 0 from 720 or none', () => {
    const { exact, perfect, great, miss } = TIMING_WINDOWS
    expect([0, exact, -exact].map(timingScore)).toEqual([100, 100, 100])
    expect(timingScore(exact + 1)).toBe(99)
    expect(timingScore(perfect)).toBe(90)
    expect(timingScore(perfect + 1)).toBe(89)
    expect(timingScore(great)).toBe(60)
    expect(timingScore(great + 1)).toBe(58)
    expect(timingScore(miss)).toBe(0)
    expect(timingScore(null)).toBe(0)
    // Never rising with the error.
    for (let e = 0; e < 800; e++) expect(timingScore(e + 1)).toBeLessThanOrEqual(timingScore(e))
  })
  it('seeds are the account\'s, the day\'s and the event\'s; a shuffle keeps its members', () => {
    expect(seed(0)).toBe(playSeed('u1', 3, '9000001', 'f1')(0))
    expect(seed(0)).not.toBe(other(0))
    expect(playSeed('u1', 3, '9000001', 'f1', 1)(0)).toBe(seed(100))
    expect(shuffled([1, 2, 3, 4, 5], seed, 0).sort()).toEqual([1, 2, 3, 4, 5])
    expect(meanScore([])).toBe(0)
  })
})

describe('Cast', () => {
  it('casts once in an event and three times as an evening, each meeting 1.6–2.8 s in', () => {
    expect(castPlan(seed, 'event').meets).toHaveLength(CAST_COUNT.event)
    expect(castPlan(seed, 'evening').meets).toHaveLength(3)
    for (const meet of castPlan(seed, 'evening').meets) expect(meet).toBeGreaterThanOrEqual(1600), expect(meet).toBeLessThan(2800)
  })
  it('scores the tap\'s distance from the meeting: its edges, a perfect run, no tap a Fine', () => {
    const plan = castPlan(seed, 'event')
    const meet = plan.meets[0]!
    expect(castScore(plan, [meet])).toBe(100)
    expect(castScore(plan, [meet + 160])).toBe(90)
    expect(gradeOf(castScore(plan, [meet + 161]))).toBe('great')
    expect(castScore(plan, [meet - 360])).toBe(60)
    expect(gradeOf(castScore(plan, [meet - 361]))).toBe('fine')
    expect(castScore(plan, [null])).toBe(0)
    expect(castScore(plan, [])).toBe(0)
    expect(gradeOf(castScore(plan, []))).toBe('fine')
  })
  it('three casts score their mean; the same seed and taps the same score', () => {
    const plan = castPlan(seed, 'evening')
    const taps = [plan.meets[0]!, plan.meets[1]! + 160, null]
    expect(castScore(plan, taps)).toBe(Math.round((100 + 90 + 0) / 3))
    expect(castScore(castPlan(seed, 'evening'), taps)).toBe(castScore(plan, taps))
  })
})

describe('Rhythm', () => {
  it('her four beats first, then eight to tap; one round in an event, three as an evening', () => {
    const plan = rhythmPlan(seed, 'event')
    expect(plan.periods).toHaveLength(1)
    expect(rhythmPlan(seed, 'evening').periods).toHaveLength(3)
    const p = plan.periods[0]!
    expect(p).toBeGreaterThanOrEqual(700)
    expect(p).toBeLessThan(1000)
    expect(rhythmBeats(p)).toHaveLength(RHYTHM_BEATS)
    expect(rhythmBeats(p)[0]).toBe(4 * p)
  })
  it('scores the mean timing error: on the beat 100, 160 ms off 90, 360 ms off 60, none a Fine; taps in her lead-in ignored', () => {
    const p = 800
    const beats = rhythmBeats(p)
    expect(rhythmRound(p, beats)).toBe(100)
    expect(rhythmRound(p, [0, p, 2 * p, ...beats])).toBe(100)
    expect(rhythmRound(p, beats.map((b) => b + 160))).toBe(90)
    expect(rhythmRound(p, beats.map((b) => b - 360))).toBe(60)
    expect(gradeOf(rhythmRound(p, beats.map((b) => b + 161)))).toBe('great')
    expect(gradeOf(rhythmRound(p, beats.map((b) => b + 361)))).toBe('fine')
    expect(rhythmRound(p, [])).toBe(0)
    // Half the beats on time: a Fine (50).
    expect(rhythmRound(p, beats.slice(0, 4))).toBe(50)
  })
  it('a tap that matches no beat costs 5, so tapping fast never scores', () => {
    const p = 800
    const beats = rhythmBeats(p)
    expect(rhythmRound(p, [...beats, beats[0]! + 10])).toBe(100 - RHYTHM_EXTRA)
    const mash = Array.from({ length: 200 }, (_, i) => 3 * p + i * 40)
    expect(rhythmRound(p, mash)).toBe(0)
  })
  it('the same seed and taps, the same score; an evening\'s three rounds score their mean', () => {
    const plan = rhythmPlan(seed, 'evening')
    const taps = plan.periods.map((p, i) => (i === 2 ? [] : rhythmBeats(p)))
    expect(rhythmScore(plan, taps)).toBe(Math.round(200 / 3))
    expect(rhythmScore(rhythmPlan(seed, 'evening'), taps)).toBe(rhythmScore(plan, taps))
  })
})

describe('Pick', () => {
  const goods = pickGoods(PACK, '9000001')
  it('stars her loved and liked goods, and offers the rest of their families; without a bible, her line\'s first goods', () => {
    expect(goods.favourites).toEqual(['golden-carrot', 'carrot', 'potato', 'cabbage'])
    expect(goods.others).toEqual(expect.arrayContaining(['onion', 'tomato']))
    expect(goods.others).not.toContain('carrot')
    expect(pickGoods(PACK, '9000002').favourites).toEqual(['button-mushroom', 'basil', 'apple'])
  })
  it('ten pops a round on a 3 × 3 field, four starred, never two in one cell at once', () => {
    const plan = pickPlan(seed, 'event', goods)
    expect(plan.rounds).toHaveLength(1)
    expect(pickPlan(seed, 'evening', goods).rounds).toHaveLength(3)
    const pops = plan.rounds[0]!
    expect(pops).toHaveLength(PICK_POPS)
    expect(pops.filter((p) => p.star)).toHaveLength(PICK_STARS)
    for (const p of pops) {
      expect(p.cell).toBeGreaterThanOrEqual(0)
      expect(p.cell).toBeLessThan(PICK_CELLS)
      expect(p.star ? goods.favourites : goods.others).toContain(p.good)
      expect(pops.some((q) => q !== p && q.cell === p.cell && q.at < p.until && p.at < q.until)).toBe(false)
    }
  })
  it('scores the starred ones tapped, less 10 a wrong tap: all 100, three of four 75, two 50, none a Fine', () => {
    const pops = pickPlan(seed, 'event', goods).rounds[0]!
    const tap = (p: (typeof pops)[number]): PickTap => ({ at: p.at + 100, cell: p.cell })
    const stars = pops.filter((p) => p.star)
    const plain = pops.filter((p) => !p.star)
    expect(pickRound(pops, stars.map(tap))).toBe(100)
    expect(pickRound(pops, [...stars.map(tap), tap(stars[0]!)])).toBe(100)
    expect(pickRound(pops, stars.slice(0, 3).map(tap))).toBe(75)
    expect(gradeOf(pickRound(pops, stars.slice(0, 3).map(tap)))).toBe('great')
    expect(pickRound(pops, [...stars.map(tap), tap(plain[0]!)])).toBe(90)
    expect(pickRound(pops, [...stars.map(tap), tap(plain[0]!), tap(plain[1]!)])).toBe(80)
    expect(pickRound(pops, stars.slice(0, 2).map(tap))).toBe(50)
    expect(pickRound(pops, plain.map(tap))).toBe(0)
    expect(pickRound(pops, [])).toBe(0)
    // A tap after a good has gone, or on an empty cell, is nothing.
    expect(pickRound(pops, [{ at: stars[0]!.until + 1, cell: stars[0]!.cell }])).toBe(0)
  })
  it('the same seed and taps, the same score; rounds score their mean', () => {
    const plan = pickPlan(seed, 'evening', goods)
    const taps = plan.rounds.map((pops, i) => (i === 0 ? pops.filter((p) => p.star).map((p) => ({ at: p.at, cell: p.cell })) : []))
    expect(pickScore(plan, taps)).toBe(33)
    expect(pickScore(pickPlan(seed, 'evening', goods), taps)).toBe(33)
  })
})

describe('Walk', () => {
  const save = { ...newSave('u1', '2026-11-11T10:00:00.000Z'), calendar: { day: 3 } }
  const places = walkPlacesOpen(save)
  it('passes today\'s open farm places, not the Gate or the town edge; she loves her line\'s place', () => {
    expect(places).toContain('fields')
    expect(places).not.toContain('mine')
    expect(places).not.toContain('gate')
    expect(walkFavourite(save, PACK, '9000001', seed)).toBe('fields')
    expect(walkFavourite(save, PACK, '9000003', seed)).toBe('fishery')
    // A miner's Mine before chapter 3: a seeded one of the open places her beats use, else the Fields.
    const miner = { ...PACK, cast: { ...PACK.cast, umas: PACK.cast.umas.map((u) => (u.characterId === '9000002' ? { ...u, calling: 'mining' as const } : u)) } }
    expect(walkFavourite(save, miner, '9000002', seed)).toBe('fields')
  })
  it('two forks in an event, four as an evening, each with her place and another', () => {
    const plan = walkPlan(seed, 'event', 'fields', places)
    expect(plan.forks).toHaveLength(WALK_FORKS.event)
    expect(walkPlan(seed, 'evening', 'fields', places).forks).toHaveLength(4)
    for (const fork of plan.forks) {
      expect([fork.left, fork.right]).toContain('fields')
      expect(fork.left).not.toBe(fork.right)
    }
  })
  it('her turn full, the other half: two forks 50, 75 or 100; four in eighths; none at all 0', () => {
    const plan = walkPlan(seed, 'event', 'fields', places)
    const hers = plan.forks.map((f): Turn => (f.left === 'fields' ? 'left' : 'right'))
    const not = hers.map((t): Turn => (t === 'left' ? 'right' : 'left'))
    expect(walkScore(plan, hers)).toBe(100)
    expect(walkScore(plan, [hers[0]!, not[1]!])).toBe(75)
    expect(walkScore(plan, not)).toBe(50)
    expect(walkScore(plan, [])).toBe(0)
    expect(walkScore(plan, [hers[0]!, null])).toBe(50)
    const evening = walkPlan(seed, 'evening', 'fields', places)
    const eh = evening.forks.map((f): Turn => (f.left === 'fields' ? 'left' : 'right'))
    const flip = (t: Turn): Turn => (t === 'left' ? 'right' : 'left')
    expect(walkScore(evening, eh)).toBe(100)
    expect(walkScore(evening, [eh[0]!, eh[1]!, eh[2]!, flip(eh[3]!)])).toBe(88)
    expect(walkScore(evening, [eh[0]!, flip(eh[1]!), flip(eh[2]!), flip(eh[3]!)])).toBe(63)
    expect(walkScore(evening, eh.map(flip))).toBe(50)
    expect(walkScore(walkPlan(seed, 'event', 'fields', places), hers)).toBe(100)
  })
})

describe('Choose', () => {
  it('three goods, one she loves or likes, seeded', () => {
    const plan = choosePlan(seed, PACK, '9000001')
    expect(new Set(plan.goods).size).toBe(3)
    expect(plan.goods.filter((g) => ['golden-carrot', 'carrot', 'potato', 'cabbage'].includes(g))).toHaveLength(1)
    expect(choosePlan(seed, PACK, '9000001')).toEqual(plan)
  })
  it('loved 100, liked 75, anything else 40, none 0', () => {
    expect(chooseScore(PACK, '9000001', 'golden-carrot')).toBe(100)
    expect(chooseScore(PACK, '9000001', 'potato')).toBe(75)
    expect(chooseScore(PACK, '9000001', 'onion')).toBe(40)
    expect(chooseScore(PACK, '9000001', 'limestone')).toBe(40)
    expect(chooseScore(PACK, '9000001', null)).toBe(0)
    expect(CHOOSE_SCORES).toEqual({ loved: 100, liked: 75, neutral: 40, disliked: 40 })
    // Without a bible every good is neutral.
    expect(chooseScore(PACK, '9000002', 'button-mushroom')).toBe(40)
  })
})

describe('what plays as what', () => {
  it('every activity and date game maps to a play; the unbuilt games fall back to Rhythm with their mark', () => {
    for (const key of [...ACTIVITIES, ...DATE_GAMES]) expect(PLAY_MAP[key]).toBeDefined()
    const as = (t: Together) => togetherPlay(t)
    expect(as({ kind: 'work', activity: 'farming' })).toEqual({ kind: 'pick', mark: null, fallback: false })
    expect(as({ kind: 'work', activity: 'foraging' })?.kind).toBe('pick')
    expect(as({ kind: 'work', activity: 'fishing' })?.kind).toBe('cast')
    expect(as({ kind: 'work', activity: 'mining' })).toEqual({ kind: 'rhythm', mark: 'swing', fallback: false })
    expect(as({ kind: 'work', activity: 'ranch' })).toEqual({ kind: 'rhythm', mark: 'brush', fallback: false })
    expect(as({ kind: 'work', activity: 'cooking' })).toEqual({ kind: 'rhythm', mark: 'pot', fallback: true })
    expect(as({ kind: 'work', activity: 'serving' })).toEqual({ kind: 'rhythm', mark: 'tray', fallback: true })
    expect(as({ kind: 'work', activity: 'forging' })).toEqual({ kind: 'rhythm', mark: 'anvil', fallback: true })
    expect(as({ kind: 'date', game: 'fishing' })?.kind).toBe('cast')
    expect(as({ kind: 'date', game: 'walk' })?.kind).toBe('walk')
    expect(as({ kind: 'date', game: 'boat' })).toEqual({ kind: 'rhythm', mark: 'oar', fallback: false })
    for (const game of ['picnic', 'market', 'stargazing'] as const) expect(as({ kind: 'date', game })?.kind).toBe('pick')
    expect(as({ kind: 'date', game: 'dance' })).toEqual({ kind: 'rhythm', mark: 'step', fallback: false })
    expect(as({ kind: 'date', game: 'crafting' })?.kind).toBe('rhythm')
    expect(as({ kind: 'date', game: 'cooking' })).toEqual({ kind: 'rhythm', mark: 'pot', fallback: true })
    expect(as({ kind: 'date', game: 'footrace' })).toEqual({ kind: 'rhythm', mark: 'track', fallback: true })
    expect(as({ kind: 'gift', good: 'carrot' })?.kind).toBe('choose')
    expect(as({ kind: 'help', with: '9000002' })).toBeNull()
    expect(as({ kind: 'talk' })).toBeNull()
  })
  it('a play step reads its game, and a farming play\'s `as` picks Pick (the default) or Rhythm with the hoe', () => {
    expect(playOf({ game: 'farming' }).kind).toBe('pick')
    expect(playOf({ game: 'farming', as: 'pick' }).kind).toBe('pick')
    expect(playOf({ game: 'farming', as: 'rhythm' })).toEqual({ kind: 'rhythm', mark: 'hoe', fallback: false })
    expect(playOf({ game: 'stargazing' }).kind).toBe('pick')
    expect(playOf({ game: 'fishing' }).kind).toBe('cast')
  })
})
