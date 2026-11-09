// The roster (F23; core spec CS2, CS34–CS36, CS45): the start's six and three picks, the Dorm's levels and beds, swaps,
// visitors at the Gate with chats and gifts, joining at 2 hearts, and chapter recruits. Invented outfit ids with chosen
// talents; the night runs with test kinds.
import { describe, expect, it } from 'vitest'
import { buildSummary, emptyNotes, endDay, runNight, type Night, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { daySetState } from '../night/nudge'
import { setTender } from '../fields/fields'
import { loopKinds } from '../gathering/kinds'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV3 } from '../save/parse-v3'
import { SaveRuleError } from '../save/rules'
import { newRosterUma, newSave, onFarm, picksLeft, type SaveV3 } from '../save/v3'
import { farmEnvV3, loopWorld } from '../work/loop-env'
import { buyDorm, cancelSwap, DORM_LEVELS, freeBeds, joinRoster, nextDorm, settleDormNight, swapBlock, swapDorm } from './dorm'
import { bedsAt } from './farm'
import { heartsOf } from './rank-rules'
import type { Activity } from './ranks'
import { pickStart, redrawsLeft, redrawStart, START_NEEDS, startSheet } from './start'
import { TEMPERAMENTS, type TalentOf, type TalentStep } from './talents'
import {
  addAffinity, chat, CHAT_LINES, chatLine, daysLeft, gateNight, gift, giftTaste, nextGateDay, openActivities, recruitFor, STAY_AFFINITY, weakestActivity,
} from './visitors'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** An invented release of 40 outfits, 1001–1040: everyone D, except the few given talents. */
const RELEASE = Array.from({ length: 40 }, (_, i) => String(1001 + i))
function talents(table: Readonly<Record<string, Partial<Record<Activity, TalentStep>>>>): TalentOf {
  return (id, activity) => table[id]?.[activity] ?? 3
}
/** One C farmer, one B forager, one A fisher in the whole release: the sheet must find each. */
const SCARCE = talents({ 1037: { farming: 4 }, 1038: { foraging: 5 }, 1039: { fishing: 6 } })
const context = (release = RELEASE): NightContext => ({ roster: release.map((outfitId) => ({ outfitId, trade: 'physical', line: 'wood' as const })), kinds: TEST_KINDS })
const fail = (fn: () => unknown, message: string) => expect(fn).toThrow(new SaveRuleError('bad-job', message).message)

/** `ids` on the roster, the first `home` of them home, on `day`. */
function farm(ids: readonly string[], day = 1, home = ids.length): SaveV3 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])),
    dorm: { level: 1, home: ids.slice(0, home), swaps: [] },
  }
}
const night = (save: SaveV3, release = RELEASE) => endDay(save, context(release), LATER)
const nights = (save: SaveV3, n: number, release = RELEASE) => Array.from({ length: n }).reduce<SaveV3>((s) => night(s, release), save)
const withGold = (save: SaveV3, gold: number): SaveV3 => ({ ...save, gold })

describe('the start: six cards, one redraw, three picks (CS2; decisions 1, 2)', () => {
  it('always holds a C-or-better farmer, forager and fisher, six different outfits off the roster', () => {
    for (let u = 0; u < 40; u++) {
      const save = { ...newSave(`u${u}`, AT) }
      const sheet = startSheet(save, RELEASE, SCARCE)
      expect(new Set(sheet).size).toBe(6)
      expect(sheet.every((id) => RELEASE.includes(id))).toBe(true)
      for (const need of START_NEEDS) expect(sheet.some((id) => SCARCE(id, need) >= 4), `u${u} ${need}`).toBe(true)
      const redrawn = startSheet(redrawStart(save), RELEASE, SCARCE)
      for (const need of START_NEEDS) expect(redrawn.some((id) => SCARCE(id, need) >= 4), `u${u} redrawn ${need}`).toBe(true)
    }
  })

  it('is the same six for the same account, another six for another', () => {
    const save = newSave('u1', AT)
    expect(startSheet(save, RELEASE, SCARCE)).toEqual(startSheet(json(save), RELEASE, SCARCE))
    expect(startSheet(newSave('u2', AT), RELEASE, SCARCE)).not.toEqual(startSheet(save, RELEASE, SCARCE))
  })

  it('redraws once, with new faces except a card only it can fill', () => {
    const save = newSave('u1', AT)
    const first = startSheet(save, RELEASE, SCARCE)
    const again = redrawStart(save)
    expect(again.start.redraws).toBe(1)
    expect(redrawsLeft(again)).toBe(0)
    const second = startSheet(again, RELEASE, SCARCE)
    expect(second).not.toEqual(first)
    expect(second.filter((id) => first.includes(id)).every((id) => ['1037', '1038', '1039'].includes(id))).toBe(true)
    // With talent everywhere, the redraw shows six new faces.
    const plenty = talents(Object.fromEntries(RELEASE.map((id) => [id, { farming: 5, foraging: 5, fishing: 5 }])))
    const a = startSheet(save, RELEASE, plenty)
    const b = startSheet(again, RELEASE, plenty)
    expect(b.filter((id) => a.includes(id))).toEqual([])
    fail(() => redrawStart(again), 'No redraws left.')
    expect(again.account).toEqual(save.account)
  })

  it('picks exactly three from the sheet, each joining today and home', () => {
    const save = newSave('u1', AT)
    const sheet = startSheet(save, RELEASE, SCARCE)
    expect(picksLeft(save)).toBe(3)
    expect(() => pickStart(save, sheet.slice(0, 2), RELEASE, SCARCE)).toThrow('Pick 3.')
    expect(() => pickStart(save, [sheet[0]!, sheet[0]!, sheet[1]!], RELEASE, SCARCE)).toThrow('Pick 3.')
    const outsider = RELEASE.find((id) => !sheet.includes(id))!
    fail(() => pickStart(save, [sheet[0]!, sheet[1]!, outsider], RELEASE, SCARCE), 'Pick from the sheet.')
    const picked = pickStart(save, sheet.slice(3), RELEASE, SCARCE)
    expect(Object.keys(picked.roster)).toEqual(sheet.slice(3))
    expect(picked.dorm.home).toEqual(sheet.slice(3))
    expect(Object.values(picked.roster).every((u) => u.joined === 1 && u.affinity === 0)).toBe(true)
    expect(picksLeft(picked)).toBe(0)
    fail(() => pickStart(picked, sheet.slice(0, 3), RELEASE, SCARCE), 'Your first hands are here.')
    fail(() => redrawStart(picked), 'Your first hands are here.')
    expect(parseSaveV3(json(picked))).toEqual(picked)
  })

  it('has a migrated save with two Umas pick one from a sheet without them', () => {
    const save = { ...farm(['1001', '1002']), calendar: { day: 1 } }
    const sheet = startSheet(save, RELEASE, SCARCE)
    expect(sheet.some((id) => id === '1001' || id === '1002')).toBe(false)
    expect(picksLeft(save)).toBe(1)
    expect(() => pickStart(save, sheet.slice(0, 3), RELEASE, SCARCE)).toThrow('Pick 1.')
    const picked = pickStart(save, [sheet[4]!], RELEASE, SCARCE)
    expect(picked.dorm.home).toEqual(['1001', '1002', sheet[4]])
    expect(picked.roster['1001']).toEqual(save.roster['1001'])
  })
})

describe('the Dorm: levels and beds (CS34; decision 3)', () => {
  it('has CS34\'s ten levels', () => {
    expect(DORM_LEVELS.map((l) => [l.level, l.beds, l.cost, l.farmRank])).toEqual([
      [1, 3, 0, 0], [2, 5, 1000, 1], [3, 8, 3000, 2], [4, 12, 8000, 3], [5, 16, 15000, 4], [6, 22, 28000, 5], [7, 30, 50000, 6], [8, 40, 85000, 7],
      [9, 50, 130000, 8], [10, 60, 200000, 9],
    ])
  })

  it('refuses level 2 without 1,000g, buys it at once, and gives its beds the next morning', () => {
    const save = farm(['1001', '1002', '1003'])
    expect(() => buyDorm(withGold(save, 999))).toThrow('Not enough gold')
    const bought = buyDorm(withGold(save, 1200))
    expect(bought.gold).toBe(200)
    expect(bought.buildings.dorm).toBe(2)
    expect(bought.dorm.level).toBe(1)
    expect(freeBeds(bought)).toBe(0)
    expect(bought.account).toEqual(save.account)
    const morning = night(bought)
    expect(morning.dorm.level).toBe(2)
    expect(freeBeds(morning)).toBe(2)
    expect(morning.summary!.news).toContainEqual({ kind: 'dorm', level: 2 })
    expect(night(morning).summary!.news.some((n) => n.kind === 'dorm')).toBe(false)
  })

  it('opens each level at its Farm Rank, buys two levels in a day, and stops at 10', () => {
    const two = buyDorm(withGold(farm(['1001']), 10_000))
    expect(nextDorm(two)).toMatchObject({ level: 3, cost: 3000, farmRank: 2, open: false })
    expect(() => buyDorm(two)).toThrow('Opens at Farm Rank 2.')
    const three = buyDorm({ ...two, farm: { ...two.farm, points: 150 } })
    expect(three.buildings.dorm).toBe(3)
    expect(night(three).dorm.level).toBe(3)
    const top = { ...three, buildings: { ...three.buildings, dorm: 10 } }
    expect(nextDorm(top)).toBeNull()
    fail(() => buyDorm(top), 'The Dorm is at its top level.')
  })
})

describe('the off-season and swaps (CS36; decision 4)', () => {
  /** Three home, two away. */
  const full = () => farm(['1001', '1002', '1003', '1004', '1005'], 2, 3)

  it('brings one away home for one idle at home, the next morning, free', () => {
    const save = swapDorm(full(), '1002', '1004')
    expect(save.dorm.swaps).toEqual([{ out: '1002', in: '1004' }])
    expect(save.dorm.home).toEqual(['1001', '1002', '1003'])
    expect(save.gold).toBe(full().gold)
    expect(onFarm(save, '1002')).toBe(false)
    expect(daySetState(save).idle).toEqual(['1001', '1003'])
    expect(parseSaveV3(json(save))).toEqual(save)
    const morning = night(save)
    expect(morning.dorm).toEqual({ level: 1, home: ['1001', '1004', '1003'], swaps: [] })
    expect(morning.summary!.news).toContainEqual({ kind: 'home', umas: ['1004'] })
    expect(morning.roster['1002']).toEqual(save.roster['1002'])
  })

  it('refuses a working Uma, a tender and one leaving, and anyone not on the right side', () => {
    const kinds = loopKinds(() => 4)
    const working = startLoopJob(full(), { outfitId: '1001', place: 'forest', slot: 0, request: { kind: 'forage', item: 'woods', count: 1 } }, AT, kinds)
    expect(swapBlock(working, '1001', kinds)).toBe('Working')
    expect(() => swapDorm(working, '1001', '1004', kinds)).toThrow('She’s working.')
    const tending = setTender(full(), 'A', '1002')
    expect(() => swapDorm(tending, '1002', '1004')).toThrow('She tends Block A.')
    const once = swapDorm(full(), '1003', '1004')
    expect(() => swapDorm(once, '1003', '1005')).toThrow('She leaves tomorrow.')
    expect(() => swapDorm(once, '1001', '1004')).toThrow('She arrives tomorrow.')
    expect(() => swapDorm(full(), '1004', '1005')).toThrow('She isn’t on the farm.')
    expect(() => swapDorm(full(), '1001', '1002')).toThrow('She’s on the farm already.')
    expect(() => swapDorm(full(), '1001', '9999')).toThrow('She isn’t on the roster.')
    // Leaving tomorrow, she can't take a job or tend.
    const env = farmEnvV3(kinds)
    expect(env.isWorker!(loopWorld(once), '1003')).toBe(false)
    expect(() => setTender(once, 'A', '1003')).toThrow('She leaves tomorrow.')
    expect(() => startLoopJob(once, { outfitId: '1003', place: 'forest', slot: 0, request: { kind: 'forage', item: 'woods', count: 1 } }, AT, kinds))
      .toThrow('She isn’t on the farm.')
    // Called off, she stays and may work again.
    const off = cancelSwap(once, '1003')
    expect(off.dorm.swaps).toEqual([])
    expect(onFarm(off, '1003')).toBe(true)
    expect(night(off).dorm.home).toEqual(['1001', '1002', '1003'])
  })

  it('clears a tender who isn\'t home after the swaps (defensive)', () => {
    const save = { ...full(), fields: { blocks: [{ ...full().fields.blocks[0]!, tender: '1004' }] } }
    expect(settleDormNight(save).save.fields.blocks[0]!.tender).toBeNull()
  })
})

describe('visitors at the Gate (CS35; decision 5)', () => {
  it('comes on the morning of day 4 while a bed is free and none waits, and leaves after 6 days', () => {
    const save = farm(['1001', '1002'], 3)
    const day4 = night(save)
    expect(day4.calendar.day).toBe(4)
    expect(day4.visitors).toHaveLength(1)
    const visitor = day4.visitors[0]!
    expect(visitor).toMatchObject({ from: 'gate', leaves: 10, affinity: 0 })
    expect(RELEASE.includes(visitor.outfitId) && !save.roster[visitor.outfitId]).toBe(true)
    expect(day4.summary!.news).toContainEqual({ kind: 'gate', outfitId: visitor.outfitId })
    expect(daysLeft(day4, visitor)).toBe(6)
    expect(parseSaveV3(json(day4))).toEqual(day4)
    // The same account gets the same visitor (CS8).
    expect(night(json(save)).visitors).toEqual(day4.visitors)
    // Day 8: she still waits, so nobody else comes.
    const day9 = nights(day4, 5)
    expect(day9.visitors).toEqual([visitor])
    expect(daysLeft(day9, visitor)).toBe(1)
    const day10 = night(day9)
    expect(day10.visitors).toEqual([])
    expect(day10.summary!.news).toContainEqual({ kind: 'left', outfitId: visitor.outfitId })
    // Day 12: another may come, and she may come again.
    expect(nights(day10, 2).visitors).toHaveLength(1)
  })

  it('doesn\'t come on other days, without a free bed, or while one waits', () => {
    expect(night(farm(['1001'], 4)).visitors).toEqual([])
    expect(night(farm(['1001', '1002', '1003'], 3)).visitors).toEqual([])
    const waiting = { ...farm(['1001'], 7), visitors: [{ outfitId: '1020', from: 'gate' as const, leaves: 9, affinity: 15 }] }
    expect(night(waiting).visitors).toEqual(waiting.visitors)
    // A bed bought today counts tomorrow morning, before she comes.
    const bought = buyDorm(withGold(farm(['1001', '1002', '1003'], 3), 1000))
    expect(night(bought).visitors).toHaveLength(1)
    // Nobody left on the release: nobody comes.
    expect(gateNight(farm(['1001'], 8), ['1001']).arrived).toBeNull()
    expect(nextGateDay(3)).toBe(4)
    expect(nextGateDay(4)).toBe(8)
  })
})

describe('affinity: chats and gifts (CS45; decisions 6–9)', () => {
  const visiting = (affinity = 0, home = 2) => ({ ...farm(['1001', '1002', '1003'].slice(0, home), 5), visitors: [{ outfitId: '1020', from: 'gate' as const, leaves: 10, affinity }],
    items: { carp: [3, 1, 0, 0, 0] as [number, number, number, number, number], granite: [2, 0, 0, 0, 0] as [number, number, number, number, number], 'seed-carrot': [9, 0, 0, 0, 0] as [number, number, number, number, number] } })

  it('counts a chat once a day, for the roster home or away and for visitors', () => {
    const save = visiting()
    const once = chat(save, '1020')
    expect([once.from, once.to, once.joined]).toEqual([0, 15, null])
    expect(once.save.visitors[0]!.affinity).toBe(15)
    expect(() => chat(once.save, '1020')).toThrow('You’ve talked today.')
    const away = { ...farm(['1001', '1002'], 5, 1) }
    expect(chat(away, '1002').save.roster['1002']!.affinity).toBe(15)
    expect(() => chat(save, '1030')).toThrow('She isn’t here.')
    // The night clears it.
    expect(chat(night(once.save), '1020').to).toBe(30)
    expect(parseSaveV3(json(once.save))).toEqual(once.save)
  })

  it('gives +30 for a liked gift, +10 neutral, and never drops a heart for a disliked one', () => {
    const save = visiting()
    const liked = gift(save, '1020', 'carp', 2, 'fish')
    expect([liked.taste, liked.to]).toEqual(['liked', 30])
    expect(liked.save.items.carp).toEqual([3, 0, 0, 0, 0])
    expect(() => gift(liked.save, '1020', 'carp', 1, 'fish')).toThrow('One gift a day.')
    expect(gift(save, '1020', 'carp', 1, 'wood')).toMatchObject({ taste: 'neutral', to: 10 })
    expect(gift(save, '1020', 'granite', 1, 'vegetables')).toMatchObject({ taste: 'disliked', to: 0 })
    const near = visiting(130)
    expect(gift(near, '1020', 'granite', 1, 'fish').to).toBe(110)
    const just = { ...farm(['1001']), roster: { 1001: { ...newRosterUma(1), affinity: 305 } }, items: near.items }
    expect(gift(just, '1001', 'granite', 1, 'wood').save.roster['1001']!.affinity).toBe(300)
    expect(heartsOf(addAffinity(305, -20))).toBe(3)
    expect(addAffinity(995, 30)).toBe(1000)
    expect(() => gift(save, '1020', 'seed-carrot', 1, 'vegetables')).toThrow('That isn’t a gift.')
    expect(() => gift(save, '1020', 'carp', 3, 'fish')).toThrow('Not enough in the Warehouse')
  })

  it('likes goods of her favourite line, dislikes raw stones unless she mines', () => {
    expect(['pine-plank', 'shiitake', 'basil', 'apple-preserve', 'peanut', 'honey'].map((id) => giftTaste(id, 'wood'))).toEqual(Array(6).fill('liked'))
    expect(['carp', 'salmon-fillet'].map((id) => giftTaste(id, 'fish'))).toEqual(['liked', 'liked'])
    expect(['carrot', 'wheat-flour', 'dried-basil', 'rice', 'apple'].map((id) => giftTaste(id, 'vegetables'))).toEqual(['liked', 'liked', 'liked', 'liked', 'neutral'])
    expect(['copper-ore', 'iron-ingot', 'granite'].map((id) => giftTaste(id, 'metal'))).toEqual(['liked', 'liked', 'neutral'])
    expect(['granite', 'marble-block', 'quartz', 'cut-ruby'].map((id) => giftTaste(id, 'stone'))).toEqual(Array(4).fill('liked'))
    expect(['granite', 'granite-block', 'quartz', 'dragon-scale'].map((id) => giftTaste(id, 'fish'))).toEqual(['disliked', 'neutral', 'neutral', 'neutral'])
  })

  it('has a visitor join the moment she reaches 200, home while a bed is free, else away', () => {
    const save = visiting(185)
    const joined = chat(save, '1020')
    expect(joined.joined).toEqual({ outfitId: '1020', home: true })
    expect(joined.save.visitors).toEqual([])
    expect(joined.save.roster['1020']).toMatchObject({ joined: 5, affinity: STAY_AFFINITY })
    expect(joined.save.dorm.home).toEqual(['1001', '1002', '1020'])
    expect(joined.save.today.chats).toEqual(['1020'])
    expect(parseSaveV3(json(joined.save))).toEqual(joined.save)
    const full = gift(visiting(180, 3), '1020', 'carp', 1, 'fish')
    expect(full.joined).toEqual({ outfitId: '1020', home: false })
    expect(full.save.roster['1020']!.affinity).toBe(210)
    expect(full.save.dorm.home).toEqual(['1001', '1002', '1003'])
    expect(() => joinRoster(full.save, '1020')).toThrow('She’s on the roster already.')
    // An Uma on the roster going past 200 is just an Uma with 2 hearts.
    const roster = { ...farm(['1001']), roster: { 1001: { ...newRosterUma(1), affinity: 190 } } }
    expect(chat(roster, '1001')).toMatchObject({ to: 205, joined: null })
  })

  it('says one of her temperament\'s five lines a day, the same all day', () => {
    for (const t of TEMPERAMENTS) expect(CHAT_LINES[t]).toHaveLength(5)
    const save = farm(['1001'], 3)
    expect(CHAT_LINES.clever).toContain(chatLine(save, '1001', 'clever'))
    expect(chatLine(json(save), '1001', 'clever')).toBe(chatLine(save, '1001', 'clever'))
    const week = Array.from({ length: 12 }, (_, d) => chatLine({ ...save, calendar: { day: d + 1 } }, '1001', 'bold'))
    expect(new Set(week).size).toBeGreaterThan(1)
  })
})

describe('chapter recruits (CS35; decision 10)', () => {
  it('draws for the open activity whose best rank, then best talent, is lowest, C or better in it', () => {
    const table = talents({ 1001: { farming: 6, foraging: 5, fishing: 4 }, 1002: { fishing: 5 }, 1030: { foraging: 4 }, 1031: { foraging: 6 }, 1032: { fishing: 7 } })
    const save = farm(['1001', '1002'], 8)
    expect(openActivities(save)).toEqual(['farming', 'fishing', 'foraging'])
    expect(weakestActivity(save, table)).toBe('fishing')
    const ranked = { ...save, roster: { ...save.roster, 1002: { ...save.roster['1002']!, ranks: { ...save.roster['1002']!.ranks, fishing: { points: 40, rank: 1 as const, challenge: 0 } } } } }
    expect(weakestActivity(ranked, table)).toBe('foraging')
    const pick = recruitFor(ranked, RELEASE, table)
    expect(pick.activity).toBe('foraging')
    expect(['1030', '1031']).toContain(pick.outfitId)
    expect(recruitFor(json(ranked), RELEASE, table)).toEqual(pick)
    expect(recruitFor(ranked, ['1001', '1002'], table).outfitId).toBeNull()
    // The ranch opens with chapter 2, mining with 3.
    expect(openActivities({ farm: { ...save.farm, chapter: 3 } })).toEqual(['farming', 'ranch', 'mining', 'fishing', 'foraging'])
    // F24 joins her at once, home while a bed is free.
    expect(joinRoster(ranked, pick.outfitId!).home).toBe(true)
  })

  it('names a recruit who joined in the night in the morning news, home or away', () => {
    const save = farm(['1001', '1002'], 2)
    // A stand-in for F24's step 8: two recruits, the second with no bed free.
    const recruit = { run: (n: Night) => ({ ...n, save: joinRoster(joinRoster(n.save, '1030').save, '1031').save }) }
    const morning = runNight(save, context(), [recruit, { run: buildSummary }])
    expect(morning.summary!.news).toEqual([{ kind: 'joined', outfitId: '1030', home: true }, { kind: 'joined', outfitId: '1031', home: false }])
    expect(morning.dorm.home).toHaveLength(bedsAt(1))
    expect(parseSaveV3(json(morning))).toEqual(morning)
    expect(emptyNotes()).toMatchObject({ dorm: null, home: [], gate: null, left: [] })
  })
})

describe('the morning\'s roster news parses strictly', () => {
  it('refuses a Dorm level below 2, Umas home off the roster and a recruit who isn\'t on it', () => {
    const morning = night(buyDorm(withGold(farm(['1001']), 1000)))
    const news = (line: unknown) => () => parseSaveV3(json({ ...morning, summary: { ...morning.summary!, news: [line] } }))
    expect(news({ kind: 'dorm', level: 1 })).toThrow('save.summary.news.0.level')
    expect(news({ kind: 'home', umas: ['1002'] })).toThrow('save.summary.news.0.umas.0')
    expect(news({ kind: 'joined', outfitId: '1002', home: true })).toThrow('save.summary.news.0.outfitId')
    expect(news({ kind: 'gate', outfitId: 'Aster' })).toThrow('save.summary.news.0.outfitId')
    expect(news({ kind: 'left', outfitId: '1002', extra: 1 })).toThrow('save.summary.news.0')
    expect(() => parseSaveV3(json({ ...morning, summary: { ...morning.summary!, news: [{ kind: 'gate', outfitId: '1002' }, { kind: 'gate', outfitId: '1002' }] } }))).toThrow('repeated')
    expect(news({ kind: 'left', outfitId: '1002' })()).toBeTruthy()
  })
})
