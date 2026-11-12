// The evening (F50 decisions 1–9; romance spec RM19–RM22, RM37): who can spend one and which kinds open by her ladders,
// her favourite kind, the points with each factor once, the slots and festival night, the morning's invitations (who,
// how many, the weight, the same save drawing the same) and their answers, Tonight's rule, the night's step 9 and the
// save's parse. Invented ids only: the stand-ins 9000001–9000003 and 9000004 onward built here.
import { describe, expect, it } from 'vitest'
import { DAYS_PER_YEAR, festivalOn } from '../farm/calendar'
import { runNight, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { parseSaveV4 } from '../save/parse-v4'
import { eveningsOn, invitesFor, marriedCount, newLove, newRosterUmaV4, newSaveV4, type Love, type SaveV4 } from '../save/v4'
import type { UmaBible } from '../story/authored'
import { readScene } from '../story/scenes'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import { joinOpening } from './arrivals'
import {
  answerInvite, drawInvites, EVENING_GAMES, eveningMarks, eveningPoints, eveningPreview, eveningRole, EVENINGS, eveningSeed, eveningSlots, eveningUmas, favouriteKind,
  homeTonight, inviteCandidates, invitedNow, inviteDue, invitePoints, inviteWeight, kindBuilt, kindOpens, kindsNow, slotsLeft, spendEvening, tonightOpens,
} from './evening'
import { bar } from './love'

const AT = '2026-11-11T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const context = (story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK): NightContext => ({ roster: [], kinds: TEST_KINDS, story })

/** A named v4 farm on `day`, the opening read: the stand-ins home at Friendship 0. */
function farm(day = 3): SaveV4 {
  const fresh = { ...newSaveV4('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, love: Partial<Love>, id = ONE): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const at = (stage: Love['stage'], level: number): Pick<Love, 'stage' | 'level'> => ({ stage, level })
/** All three stand-ins at Friendship 2. */
const friends = (save: SaveV4): SaveV4 => [ONE, TWO, THREE].reduce((s, id) => withLove(s, { level: 2 }, id), save)
/** `n` invented spouses, 9000004 onward, home: what RM45's milestones count. */
function married(save: SaveV4, n: number): SaveV4 {
  const ids = Array.from({ length: n }, (_, i) => String(9000004 + i))
  return {
    ...save,
    roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, newRosterUmaV4(1)])) },
    love: { ...save.love, ...Object.fromEntries(ids.map((id) => [id, { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1 }])) },
    dorm: { ...save.dorm, level: 8, home: [...save.dorm.home, ...ids] },
    buildings: { ...save.buildings, dorm: 8 },
  }
}
/** A pack whose 9000001 has these date beats only (the rest of her bible as the stand-in's). */
function packWith(games: readonly string[]): Pick<StoryPack, 'cast' | 'bibles'> {
  const bible = json(PACK.bibles.get(ONE)!) as UmaBible
  const route = bible.route.filter((b) => b.together.kind !== 'date')
  const dates = games.map((game, i) => ({ ...route[1]!, id: `x${i}`, together: { kind: 'date', game } })) as UmaBible['route']
  return { cast: PACK.cast, bibles: new Map([[ONE, { ...bible, route: [...route, ...dates] }]]) }
}

describe('who (RM19; decision 2)', () => {
  it('Friendship 1 can\'t; Friendship 2 is a hangout through her confession\'s wait and Romance 0; Romance 1 a date through the wedding\'s wait; a spouse', () => {
    expect(eveningRole(at('friendship', 0))).toBeNull()
    expect(eveningRole(at('friendship', 1))).toBeNull()
    expect(eveningRole(at('friendship', 2))).toBe('hangout')
    expect(eveningRole(at('confession', 10))).toBe('hangout')
    expect(eveningRole(at('romance', 0))).toBe('hangout')
    expect(eveningRole(at('romance', 1))).toBe('date')
    expect(eveningRole(at('proposal', 10))).toBe('date')
    expect(eveningRole(at('wedding', 10))).toBe('date')
    expect(eveningRole(at('spouse', 0))).toBe('spouse')
  })

  it('she must be home: away, nothing is open to her; a spouse in her house is home', () => {
    const save = withLove(farm(), { level: 2 })
    expect(kindsNow(save, ONE)).toEqual(['walk', 'fishing', 'picnic', 'market'])
    const away = { ...save, dorm: { ...save.dorm, home: [TWO, THREE] } }
    expect(homeTonight(away, ONE)).toBe(false)
    expect(kindsNow(away, ONE)).toEqual([])
    expect(() => spendEvening(away, PACK, ONE, 'walk', 90)).toThrow('She’s away tonight.')
    expect(homeTonight(withLove(away, { stage: 'spouse', level: 0, wed: 1, house: 0 }), ONE)).toBe(true)
    expect(kindsNow(withLove(save, { level: 1 }), ONE)).toEqual([])
    expect(() => spendEvening(withLove(save, { level: 1 }), PACK, ONE, 'walk', 90)).toThrow('Evenings open at Friendship 2.')
  })
})

describe('the kinds (RM37; decisions 1–3)', () => {
  it('opens by her ladder: hangouts at F2, crafting at R1, stargazing at R3, dance and boat at R6; cooking and the footrace aren\'t offered', () => {
    const open = (love: Pick<Love, 'stage' | 'level'>) => EVENING_GAMES.filter((k) => kindOpens(love, k) && kindBuilt(k))
    expect(open(at('friendship', 2))).toEqual(['walk', 'fishing', 'picnic', 'market'])
    expect(open(at('romance', 1))).toEqual(['walk', 'fishing', 'picnic', 'market', 'crafting'])
    expect(open(at('romance', 3))).toEqual(['walk', 'fishing', 'picnic', 'market', 'crafting', 'stargazing'])
    expect(open(at('romance', 6))).toEqual(['walk', 'fishing', 'picnic', 'market', 'crafting', 'stargazing', 'dance', 'boat'])
    expect(open(at('spouse', 0))).toEqual(['walk', 'fishing', 'picnic', 'market', 'crafting', 'stargazing', 'dance', 'boat'])
    // Opened by the ladder but not built: cooking (F8) from F2, the footrace (F32) from R9.
    expect(kindOpens(at('friendship', 2), 'cooking')).toBe(true)
    expect(kindOpens(at('romance', 9), 'footrace')).toBe(true)
    expect([kindBuilt('cooking'), kindBuilt('footrace')]).toEqual([false, false])
    expect(kindsNow(withLove(farm(), { stage: 'spouse', level: 3, wed: 1 }), ONE)).not.toContain('footrace')
  })

  it('plays each kind as RM26 maps it, festival night as a walk', () => {
    expect(Object.fromEntries(Object.values(EVENINGS).map((d) => [d.kind, `${d.play.kind}${d.play.mark ? `:${d.play.mark}` : ''}`]))).toEqual({
      walk: 'walk', fishing: 'cast', picnic: 'pick', market: 'pick', cooking: 'rhythm:pot', crafting: 'rhythm:hands', stargazing: 'pick', dance: 'rhythm:step',
      boat: 'rhythm:oar', footrace: 'rhythm:track', festival: 'walk',
    })
  })

  it('offers festival night only on a festival day, from Friendship 2, in its own slot', () => {
    expect(festivalOn(10)?.id).toBe('flower-show')
    const festival = withLove(farm(10), { level: 2 })
    expect(kindsNow(festival, ONE)).toEqual(['walk', 'fishing', 'picnic', 'market', 'festival'])
    expect(kindsNow(withLove(farm(11), { level: 2 }), ONE)).not.toContain('festival')
    expect(kindsNow(withLove(farm(10), { level: 1 }), ONE)).toEqual([])
    // The evening spent, festival night is still free; festival night spent, the evening still is.
    const evening = spendEvening(festival, PACK, ONE, 'walk', 70).save
    expect(kindsNow(evening, ONE)).toEqual(['festival'])
    const night = spendEvening(festival, PACK, ONE, 'festival', 70).save
    expect(kindsNow(night, ONE)).toEqual(['walk', 'fishing', 'picnic', 'market'])
    expect(() => spendEvening(night, PACK, ONE, 'festival', 70)).toThrow('Festival night is spent.')
  })

  it('her favourite kind is the date game her beats use most, walk on a tie or with none', () => {
    // The stand-in's beats: stargazing three times (F10, R3, S5), walk twice, the rest once.
    expect(favouriteKind(PACK, ONE)).toBe('stargazing')
    expect(favouriteKind(packWith(['fishing', 'fishing', 'boat']), ONE)).toBe('fishing')
    expect(favouriteKind(packWith(['fishing', 'fishing', 'boat', 'boat']), ONE)).toBe('walk')
    expect(favouriteKind(packWith(['picnic', 'market']), ONE)).toBe('walk')
    expect(favouriteKind(packWith([]), ONE)).toBe('walk')
    // No bible (the stand-in's forager): walk.
    expect(favouriteKind(PACK, TWO)).toBe('walk')
    // A kind not offered yet still counts as hers.
    expect(favouriteKind(packWith(['cooking', 'cooking', 'walk']), ONE)).toBe('cooking')
  })
})

describe('the points (RM13, RM16, RM17; decision 4)', () => {
  const none = { kind: false, birthday: false, anniversary: false }
  it('pays 60, 100 or 150 by the grade; ×1.5 her kind; her birthday and her anniversary each ×1.5 more, once each; whole', () => {
    expect([eveningPoints('fine', none), eveningPoints('great', none), eveningPoints('perfect', none)]).toEqual([60, 100, 150])
    expect(eveningPoints('perfect', { ...none, kind: true })).toBe(225)
    expect(eveningPoints('great', { ...none, kind: true })).toBe(150)
    expect(eveningPoints('fine', { kind: true, birthday: true, anniversary: false })).toBe(135)
    expect(eveningPoints('perfect', { kind: true, birthday: true, anniversary: false })).toBe(338) // 337.5, half up
    expect(eveningPoints('perfect', { kind: true, birthday: true, anniversary: true })).toBe(506) // 506.25
    expect(eveningPoints('great', { ...none, anniversary: true })).toBe(150)
  })

  it('spends one: the grade, her factors, +20 for a yes, love.evening today, the slot spent and her bar', () => {
    const save = withLove(farm(), { stage: 'romance', level: 3, points: 50 })
    expect(eveningPreview(save, PACK, ONE, 'stargazing', false)).toEqual({ fine: 90, great: 150, perfect: 225 })
    expect(eveningPreview(save, PACK, ONE, 'walk', true)).toEqual({ fine: 90, great: 150, perfect: 225 })
    const { save: after, card } = spendEvening(save, PACK, ONE, 'stargazing', 95)
    expect(card).toMatchObject({ with: ONE, kind: 'stargazing', grade: 'perfect', base: 150, factors: { kind: true, birthday: false, anniversary: false }, points: 225, invite: 0 })
    expect(after.love[ONE]).toMatchObject({ points: 275, evening: 3 })
    expect(card.bar).toEqual(bar(after.love[ONE]!))
    expect(after.today.evenings).toEqual([{ with: ONE, kind: 'stargazing' }])
    expect(after.account.updatedAt).toBe(save.account.updatedAt)
    expect(() => spendEvening(after, PACK, TWO, 'walk', 50)).toThrow()
    expect(() => spendEvening(withLove(after, { level: 2 }, TWO), PACK, TWO, 'walk', 50)).toThrow('Tonight’s evening is spent.')
    expect(() => spendEvening(save, PACK, ONE, 'dance', 50)).toThrow('Not open to her yet.')
    expect(() => spendEvening(save, PACK, ONE, 'walk', 101)).toThrow('A play scores 0–100.')
  })

  it('an anniversary evening is ×1.5, not the day\'s ×2; the invitation\'s +20 is an act, so it doubles', () => {
    const wed = 5
    const save = { ...withLove(farm(wed + DAYS_PER_YEAR), { stage: 'spouse', level: 1, wed, points: 0 }), today: { ...farm().today, invites: [{ id: ONE, kind: 'stargazing' as const, answer: 'yes' as const }] } }
    expect(invitePoints(save, ONE)).toBe(40)
    const { card, save: after } = spendEvening(save, PACK, ONE, 'walk', 60)
    expect(card).toMatchObject({ grade: 'great', factors: { kind: false, anniversary: true }, points: 150, invite: 40 })
    expect(after.love[ONE]!.points).toBe(190)
    // Her birthday and her kind on top: once each.
    expect(spendEvening(save, PACK, ONE, 'stargazing', 60, true).card.points).toBe(338)
  })
})

describe('the slots (RM19, RM45; decision 5)', () => {
  it('one evening a day; a second on days divisible by 4 from 10 married; festival night its own', () => {
    expect([eveningsOn(12, 9), eveningsOn(12, 10), eveningsOn(13, 10), eveningsOn(16, 20)]).toEqual([1, 2, 1, 2])
    expect(eveningSlots(married(farm(12), 9))).toEqual({ evenings: 1, festival: null, vows: false })
    expect(eveningSlots(married(farm(12), 10)).evenings).toBe(2)
    expect(eveningSlots(married(farm(13), 10)).evenings).toBe(1)
    expect(eveningSlots(farm(10)).festival?.id).toBe('flower-show')
    expect(marriedCount(married(farm(), 10))).toBe(10)
    // The Harvest Cup on day 48: divisible by 4 and a festival, so three slots from 10 married.
    const cup = friends(married(farm(48), 10))
    expect(eveningMarks(cup).map((m) => m.slot)).toEqual(['evening', 'evening', 'festival'])
    const one = spendEvening(cup, PACK, ONE, 'walk', 10).save
    const two = spendEvening(one, PACK, TWO, 'fishing', 10).save
    expect(slotsLeft(two)).toEqual({ evenings: 0, festival: true })
    const three = spendEvening(two, PACK, THREE, 'festival', 10).save
    expect(eveningMarks(three).map((m) => m.spent)).toEqual([{ with: ONE, kind: 'walk' }, { with: TWO, kind: 'fishing' }, { with: THREE, kind: 'festival' }])
    // F54 decision 5: with anyone married, Tonight opens for Sleep at even with every evening spent.
    expect(tonightOpens(three, PACK)).toBe(true)
    expect(parseSaveV4(json(three)).today.evenings).toHaveLength(3)
  })

  it('an Uma may spend the day\'s second slot too; the +20 comes with her first evening only', () => {
    const save = { ...withLove(married(farm(48), 10), { level: 2 }), today: { ...farm().today, invites: [{ id: ONE, kind: 'stargazing' as const, answer: 'yes' as const }] } }
    expect(inviteDue(save, ONE)).toBe(true)
    const first = spendEvening(save, PACK, ONE, 'walk', 10)
    expect(first.card.invite).toBe(20)
    expect(inviteDue(first.save, ONE)).toBe(false)
    expect(spendEvening(first.save, PACK, ONE, 'festival', 10).card.invite).toBe(0)
  })
})

describe('invitations (RM20; decision 7)', () => {
  it('none from an Uma below F2, away, or whose favourite kind isn\'t open to her; one a morning', () => {
    expect(inviteCandidates(farm(), PACK)).toEqual([])
    // 9000001's favourite, stargazing, opens at R3; the stand-in's forager and fisher favour walk.
    const save = friends(farm())
    expect(inviteCandidates(save, PACK)).toEqual([TWO, THREE])
    expect(inviteCandidates(withLove(save, { stage: 'romance', level: 2 }), PACK)).toEqual([TWO, THREE])
    expect(inviteCandidates(withLove(save, { stage: 'romance', level: 3 }), PACK)).toEqual([ONE, TWO, THREE])
    expect(inviteCandidates({ ...save, dorm: { ...save.dorm, home: [ONE, TWO] } }, PACK)).toEqual([TWO])
    const drawn = drawInvites(save, PACK)
    expect(drawn.today.invites).toHaveLength(1)
    expect(drawn.today.invites[0]).toMatchObject({ kind: 'walk', answer: null })
    expect(drawInvites(farm(), PACK).today.invites).toEqual([])
  })

  it('two from 10 married, never the same Uma twice; the same save draws the same', () => {
    const save = married(friends(farm(5)), 10)
    expect(invitesFor(marriedCount(save))).toBe(2)
    for (let day = 5; day < 25; day++) {
      const drawn = drawInvites({ ...save, calendar: { day } }, PACK)
      expect(drawn.today.invites).toHaveLength(2)
      expect(new Set(drawn.today.invites.map((i) => i.id)).size).toBe(2)
      expect(drawInvites({ ...save, calendar: { day } }, PACK)).toEqual(drawn)
    }
  })

  it('weights the least seen: 1 + days since her last evening (or since she arrived), up to 14', () => {
    const joined = withLove(friends(farm(20)), { evening: 19 }, TWO)
    const save = { ...joined, roster: { ...joined.roster, [THREE]: { ...joined.roster[THREE]!, joined: 1 } } }
    expect(inviteWeight(save, TWO)).toBe(2)
    expect(inviteWeight(save, THREE)).toBe(15) // joined day 1: 19 days, held to 14
    expect(inviteWeight(joined, THREE)).toBe(1) // joined today
    expect(inviteWeight(withLove(save, { evening: 12 }, THREE), THREE)).toBe(9)
    let three = 0
    for (let n = 0; n < 400; n++) if (drawInvites({ ...save, account: { ...save.account, uid: `u${n}` } }, PACK).today.invites[0]!.id === THREE) three++
    expect(three / 400).toBeGreaterThan(0.8) // 15 of 17
    expect(three / 400).toBeLessThan(0.95)
  })

  it('Yes makes her Tonight\'s evening and pays +20 with it; Another day costs nothing; once each', () => {
    const save = { ...friends(farm()), today: { ...farm().today, invites: [{ id: TWO, kind: 'walk' as const, answer: null }] } }
    expect(invitedNow(save, TWO)).toBe(true)
    const no = answerInvite(save, TWO, 'no')
    expect(no.today.invites[0]!.answer).toBe('no')
    expect(no.love).toEqual(save.love)
    expect(invitedNow(no, TWO)).toBe(false)
    expect(() => answerInvite(no, TWO, 'yes')).toThrow('Already answered.')
    expect(() => answerInvite(save, ONE, 'yes')).toThrow('She didn’t ask today.')
    const yes = answerInvite(save, TWO, 'yes')
    expect(invitedNow(yes, TWO)).toBe(true)
    // Whatever kind you choose: the +20 with it; the ×1.5 only in her kind (walk).
    const picnic = spendEvening(yes, PACK, TWO, 'picnic', 60)
    expect(picnic.card).toMatchObject({ points: 100, invite: 20 })
    expect(picnic.save.love[TWO]!.points - save.love[TWO]!.points).toBe(120)
    expect(invitedNow(picnic.save, TWO)).toBe(false)
    const walk = spendEvening(yes, PACK, TWO, 'walk', 60)
    expect(walk.card).toMatchObject({ points: 150, invite: 20 })
    // Without a yes, no +20.
    expect(spendEvening(no, PACK, TWO, 'walk', 60).card.invite).toBe(0)
    // Yes once the evening is spent: refused.
    expect(() => answerInvite(spendEvening(save, PACK, ONE, 'walk', 60).save, TWO, 'yes')).toThrow('Tonight’s evening is spent.')
  })
})

describe('Tonight\'s rule (decision 8)', () => {
  it('opens with a free slot and someone to spend it; otherwise F18\'s rule stands', () => {
    expect(tonightOpens(farm(), PACK)).toBe(false) // nobody at Friendship 2
    const save = withLove(farm(), { level: 2 }, TWO)
    expect(eveningUmas(save, PACK)).toEqual([TWO])
    expect(tonightOpens(save, PACK)).toBe(true)
    expect(tonightOpens({ ...save, dorm: { ...save.dorm, home: [ONE, THREE] } }, PACK)).toBe(false)
    const spent = spendEvening(save, PACK, TWO, 'market', 40).save
    expect(tonightOpens(spent, PACK)).toBe(false)
    // A festival day keeps it open for festival night.
    const festival = spendEvening(withLove(farm(10), { level: 2 }, TWO), PACK, TWO, 'walk', 40).save
    expect(tonightOpens(festival, PACK)).toBe(true)
  })
})

describe('the night and the save (decisions 5 and 7)', () => {
  it('draws the morning\'s invitation at step 9 into today and §4, after step 7 cleared yesterday\'s', () => {
    const eve = { ...friends(farm(4)), today: { ...farm().today, invites: [{ id: TWO, kind: 'walk' as const, answer: 'yes' as const }] } }
    const spent = spendEvening(eve, PACK, TWO, 'walk', 90).save
    const morning = runNight(spent, context())
    expect(morning.calendar.day).toBe(5)
    expect(morning.today.evenings).toEqual([])
    expect(morning.today.invites).toHaveLength(1)
    const invite = morning.today.invites[0]!
    expect(invite.answer).toBeNull()
    expect(morning.summary?.hearts).toContainEqual({ kind: 'invite', id: invite.id, evening: invite.kind })
    expect(morning).toEqual(runNight(spent, context()))
    // Without the pack, none.
    expect(runNight(spent, { ...context(), story: undefined }).today.invites).toEqual([])
    expect(parseSaveV4(json(morning))).toEqual(morning)
  })

  it('parses evenings within the day\'s slots and invitations for a date game, and refuses the rest', () => {
    const save = withLove(farm(10), { level: 2 }, TWO)
    const ok = spendEvening(spendEvening(save, PACK, TWO, 'walk', 50).save, PACK, TWO, 'festival', 50).save
    expect(parseSaveV4(json(ok))).toEqual(ok)
    const bad = (today: Partial<SaveV4['today']>, day = 10) => () => parseSaveV4(json({ ...save, calendar: { day }, today: { ...save.today, ...today } }))
    expect(bad({ evenings: [{ with: TWO, kind: 'walk' }, { with: ONE, kind: 'fishing' }] })).toThrow('at most 1 evening')
    expect(bad({ evenings: [{ with: TWO, kind: 'festival' }] }, 11)).toThrow('festival night only on a festival day')
    expect(bad({ evenings: [{ with: TWO, kind: 'tea' as never }] })).toThrow()
    expect(bad({ invites: [{ id: TWO, kind: 'festival' as never, answer: null }] })).toThrow('expected a date game')
    expect(bad({ invites: [{ id: TWO, kind: 'walk', answer: null }, { id: ONE, kind: 'walk', answer: null }] })).toThrow()
    expect(bad({ invites: [{ id: TWO, kind: 'walk', answer: 'maybe' as never }] })).toThrow()
    const two = married(farm(12), 10)
    expect(parseSaveV4(json({ ...two, today: { ...two.today, evenings: [{ with: ONE, kind: 'walk' }, { with: TWO, kind: 'walk' }], invites: [{ id: ONE, kind: 'walk', answer: 'yes' }, { id: TWO, kind: 'walk', answer: null }] } })).today.invites).toHaveLength(2)
    const summary = { day: 10, bin: [], work: [], ranks: [], hearts: [{ kind: 'invite', id: TWO, evening: 'festival' }], news: [], nudges: [] }
    expect(() => parseSaveV4(json({ ...save, summary }))).toThrow('expected a date game')
    expect(parseSaveV4(json({ ...save, summary: { ...summary, hearts: [{ kind: 'invite', id: TWO, evening: 'walk' }] } })).summary?.hearts).toEqual([{ kind: 'invite', id: TWO, evening: 'walk' }])
  })

  it('seeds each evening\'s play by the day, her and the kind', () => {
    expect(eveningSeed('u1', 3, ONE, 'walk')(0)).toBe(eveningSeed('u1', 3, ONE, 'walk')(0))
    expect(eveningSeed('u1', 3, ONE, 'walk')(0)).not.toBe(eveningSeed('u1', 4, ONE, 'walk')(0))
    expect(eveningSeed('u1', 3, ONE, 'walk')(0)).not.toBe(eveningSeed('u1', 3, ONE, 'fishing')(0))
  })
})
