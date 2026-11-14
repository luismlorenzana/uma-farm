// Her chapters: the four defaults with no pack's, the pack's along her route (sorted, a rung it leaves out counting in
// the chapter before it), the one she's in, a chapter's gate holding back its first event (Ready respects it), and the
// night's line on the morning one opens. Invented ids only: the stand-ins 9000001–9000003.
import { describe, expect, it } from 'vitest'
import { DAYS_PER_SEASON } from '../farm/calendar'
import { runNight, type NightContext } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { checkCast, RUNGS, type Cast, type HerChapter, type StoryTrigger } from '../story/authored'
import { STAND_IN_CAST, STAND_INS } from '../story/authored.fixture'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { DEFAULT_CHAPTERS } from '../story/placeholders'
import { STAND_IN_FILES } from '../story/stand-in'
import { chapterAt, chapterBegun, chapterNow, chaptersOpened, chapterTitle, gateHolds, gateWords, herChapters, rungPlayed } from './chapters'
import { joinCast } from './meeting.fixture'
import { readiness } from './ready'

const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO] = STAND_INS
const KITCHEN: StoryTrigger = { kind: 'built', place: 'kitchen' }
/** Six chapters for her, a Kitchen gate on the third. */
const SIX: HerChapter[] = [
  { title: 'A new face', events: ['arrival', 'f1', 'f2', 'f3'] },
  { title: 'Fields', events: ['f4', 'f5', 'f6'] },
  { title: 'Kitchen days', events: ['f7', 'f8', 'f9', 'f10'], gate: KITCHEN },
  { title: 'Hand in hand', events: ['confession', 'r1', 'r2', 'r3', 'r4', 'r5'] },
  { title: 'Promises', events: ['r6', 'r7', 'r8', 'r9', 'r10', 'proposal'] },
  { title: 'Home', events: ['wedding', 's1', 's3', 's5'] },
]
/** The stand-in pack with 9000001's chapters given. */
function packWith(chapters: HerChapter[], id = ONE): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: json(STAND_IN_CAST).umas.map((u) => (u.characterId === id ? { ...u, chapters } : u)) }
  return { ...PACK, cast }
}
const context = (story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK): NightContext => ({ story })
/** A named farm on `day` with the stand-ins home, their meeting scenes played and the bonds already listed. */
function farm(day = 5): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(fresh, PACK)
  return { ...joined, arrivals: [...STAND_INS], today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const built = (save: SaveV4, place: string): SaveV4 => ({ ...save, buildings: { ...save.buildings, [place]: 1 } })
const chapterLines = (save: SaveV4) => save.summary!.hearts.filter((h) => h.kind === 'chapter')

describe('her chapters', () => {
  it('are the four defaults with no pack’s, along her route', () => {
    const chapters = herChapters(PACK, ONE)
    expect(chapters.map(chapterTitle)).toEqual(['Getting to know her', 'Together', 'The wedding', 'Married life'])
    expect(chapters.map((c) => c.events)).toEqual(DEFAULT_CHAPTERS.map((c) => c.events))
    expect(chapters[0]!.events).toEqual(['arrival', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'confession'])
    expect(chapters[1]!.events.at(-1)).toBe('proposal')
    expect(chapters[3]!.events).toEqual(['s1', 's3', 's5'])
    expect(chapters.every((c) => c.gate === null)).toBe(true)
    // Every rung with an event is in exactly one.
    expect(chapters.flatMap((c) => c.events)).toEqual(RUNGS)
  })

  it('are the pack’s: six, with the third’s gate', () => {
    const chapters = herChapters(packWith(SIX), ONE)
    expect(chapters.map((c) => [c.n, c.title])).toEqual(SIX.map((c, i) => [i + 1, c.title]))
    expect(chapters[2]!.gate).toEqual(KITCHEN)
    expect(chapters.flatMap((c) => c.events)).toEqual(RUNGS)
    // Another Uma keeps the defaults.
    expect(herChapters(packWith(SIX), TWO)).toHaveLength(4)
  })

  it('run in the order of their first events; a rung left out counts in the chapter before it, else the first', () => {
    const chapters = herChapters(packWith([
      { title: 'Later', events: ['r1', 'r2'] },
      { title: 'Early', events: ['f3', 'f5', 'zz'] },
      { events: ['f5', 'f6'] },
      { title: 'Nothing', events: [] },
    ]), ONE)
    expect(chapters.map(chapterTitle)).toEqual(['Early', 'Chapter 2', 'Later'])
    // arrival, F1 and F2 come before any: the first; F4 after F3; F5 is the first's (it was there first).
    expect(chapters[0]!.events).toEqual(['arrival', 'f1', 'f2', 'f3', 'f4', 'f5'])
    expect(chapters[1]!.events).toEqual(['f6', 'f7', 'f8', 'f9', 'f10', 'confession'])
    expect(chapters[2]!.events).toEqual(RUNGS.slice(RUNGS.indexOf('r1')))
    // None holding a rung the game plays: the defaults.
    expect(herChapters(packWith([{ title: 'Empty', events: ['zz'] }]), ONE).map(chapterTitle)).toEqual(DEFAULT_CHAPTERS.map((c) => c.title))
  })

  it('S2 and S4 count with S1 and S3; she’s in the one holding her next rung, none once her route is complete', () => {
    const chapters = herChapters(packWith([...SIX.slice(0, 5), { title: 'Home', events: ['wedding', 's1'] }, { title: 'Years', events: ['s3', 's5'] }]), ONE)
    expect(chapterAt(chapters, 's2')!.title).toBe('Home')
    expect(chapterAt(chapters, 's4')!.title).toBe('Years')
    const save = farm()
    const pack = packWith(SIX)
    expect(chapterNow(save, pack, ONE).current!.title).toBe('A new face')
    expect(chapterNow(withLove(save, ONE, { stage: 'friendship', level: 3 }), pack, ONE).current!.title).toBe('Fields')
    expect(chapterNow(withLove(save, ONE, { stage: 'confession', level: 10 }), pack, ONE).current!.title).toBe('Hand in hand')
    expect(chapterNow(withLove(save, ONE, { stage: 'wedding', level: 10 }), pack, ONE).current!.title).toBe('Home')
    expect(chapterNow(withLove(save, ONE, { stage: 'spouse', level: 5 }), pack, ONE).current).toBeNull()
  })

  it('know what she’s played: her meeting scene by `arrivals`, the rest by her place on the route', () => {
    const save = withLove(farm(), ONE, { stage: 'friendship', level: 2 })
    expect(['arrival', 'f1', 'f2', 'f3'].map((r) => rungPlayed(save, ONE, r))).toEqual([true, true, true, false])
    expect(rungPlayed({ ...save, arrivals: [] }, ONE, 'arrival')).toBe(false)
    // Her meeting scene alone doesn't begin a chapter.
    expect(chapterBegun({ events: ['arrival', 'f1'] }, { stage: 'friendship', level: 0 })).toBe(false)
    expect(chapterBegun({ events: ['arrival', 'f1'] }, { stage: 'friendship', level: 1 })).toBe(true)
  })
})

describe('a chapter’s gate', () => {
  const pack = packWith(SIX)
  /** She's played F6 and her F7 bar is full: her next event opens Kitchen days. */
  const atSeven = (day = 5) => withLove(farm(day), ONE, { stage: 'friendship', level: 6, points: 440 })

  it('holds back its first event until it holds: Ready says “gate”', () => {
    const save = atSeven()
    expect(chapterNow(save, pack, ONE)).toMatchObject({ current: { title: 'Kitchen days' }, waits: KITCHEN })
    expect(readiness(save, pack, ONE)).toEqual({ rung: 'f7', ready: false, waits: { kind: 'gate', gate: KITCHEN } })
    // Ahead of a short bar, as a place not built is.
    expect(readiness(withLove(save, ONE, { points: 0 }), pack, ONE).waits).toEqual({ kind: 'gate', gate: KITCHEN })
    expect(readiness(built(save, 'kitchen'), pack, ONE)).toEqual({ rung: 'f7', ready: true, waits: null })
    expect(chapterNow(built(save, 'kitchen'), pack, ONE).waits).toBeNull()
    // With the defaults, nothing waits.
    expect(readiness(save, PACK, ONE).ready).toBe(true)
  })

  it('holds nothing back once its first event has played', () => {
    const save = withLove(atSeven(), ONE, { level: 7, points: 480 })
    expect(chapterNow(save, pack, ONE)).toMatchObject({ current: { title: 'Kitchen days' }, waits: null })
    expect(readiness(save, pack, ONE).ready).toBe(true)
  })

  it('on her first chapter, never holds back her meeting scene: it holds her first event', () => {
    const gated = packWith([{ ...SIX[0]!, gate: { kind: 'farm-rank', rank: 3 } }, ...SIX.slice(1)])
    const save = withLove(farm(), ONE, { points: 200 })
    expect(readiness(save, gated, ONE).waits).toEqual({ kind: 'gate', gate: { kind: 'farm-rank', rank: 3 } })
    expect(readiness({ ...save, farm: { ...save.farm, points: 1_000_000 } }, gated, ONE).ready).toBe(true)
  })

  it('reads each kind of the menu a gate takes', () => {
    const save = farm(DAYS_PER_SEASON * 3 + 2)
    expect(gateHolds(save, { kind: 'season', season: 'winter' })).toBe(true)
    expect(gateHolds(save, { kind: 'season', season: 'spring' })).toBe(false)
    expect(gateHolds(save, { kind: 'festival', festival: 'harvest-cup' })).toBe(false)
    expect(gateHolds({ ...save, calendar: { day: DAYS_PER_SEASON * 4 } }, { kind: 'festival', festival: 'harvest-cup' })).toBe(true)
    expect(gateHolds(save, { kind: 'farm-rank', rank: 2 })).toBe(false)
    expect(gateHolds({ ...save, farm: { ...save.farm, points: 1_000_000 } }, { kind: 'farm-rank', rank: 2 })).toBe(true)
    expect(gateHolds(save, KITCHEN)).toBe(false)
    expect(gateHolds(save, { kind: 'shipped', good: 'carrot', count: 5 })).toBe(false)
    expect(gateHolds({ ...save, diary: { ...save.diary, shipped: { carrot: 5 } } }, { kind: 'shipped', good: 'carrot', count: 5 })).toBe(true)
    expect(gateHolds(save, { kind: 'event', after: `${TWO}:f3` })).toBe(false)
    expect(gateHolds({ ...save, memories: { [TWO]: ['f1', 'f2', 'f3'] } }, { kind: 'event', after: `${TWO}:f3` })).toBe(true)
    expect(gateHolds(save, { kind: 'event', after: `${TWO}:arrival` })).toBe(true)
  })

  it('says what it needs', () => {
    const names = (id: string) => (id === TWO ? 'Stand-in 2' : 'An Uma')
    expect([
      KITCHEN, { kind: 'farm-rank', rank: 4 }, { kind: 'shipped', good: 'carrot', count: 50 }, { kind: 'season', season: 'winter' },
      { kind: 'festival', festival: 'harvest-cup' }, { kind: 'event', after: `${TWO}:f3` }, { kind: 'event', after: `${TWO}:confession` },
      { kind: 'event', after: `${TWO}:arrival` }, { kind: 'event', after: 'r5' },
    ].map((g) => gateWords(g as StoryTrigger, names))).toEqual([
      'Opens when the Kitchen is built', 'Opens at Farm Rank 4', 'Opens when you’ve shipped 50 Carrot', 'Opens in Winter', 'Opens on the Harvest Cup',
      'Opens after Stand-in 2’s Friendship 3', 'Opens after Stand-in 2’s confession', 'Opens once you meet Stand-in 2', 'Opens after anyone’s Romance 5',
    ])
  })

  it('is one of the farm’s kinds, a season or a festival: the reader skips a town kind', () => {
    const cast = { umas: [{ characterId: ONE, chapters: [{ title: 'Talks', events: ['f1'], gate: { kind: 'talks', days: 4 } }, { title: 'Winter', events: ['f2'], gate: { kind: 'season', season: 'winter' } }] }] }
    const read = checkCast(cast)
    expect(read.errors).toEqual(['Uma 1 (9000001), chapter 1 gate: a chapter’s gate is one of built, farm-rank, shipped, event, season, festival (talks is meeting her own); skipped'])
    expect(read.value.umas[0]!.chapters).toEqual([{ title: 'Talks', events: ['f1'] }, { title: 'Winter', events: ['f2'], gate: { kind: 'season', season: 'winter' } }])
  })
})

describe('the morning a chapter opens', () => {
  const pack = packWith(SIX)

  it('says so the morning after the event before it played', () => {
    // She played her confession today (Yes): Together's R1 can play from tomorrow.
    const day = withLove(farm(), ONE, { stage: 'romance', level: 0, last: 5 })
    const played: SaveV4 = { ...day, today: { ...day.today, events: [ONE] } }
    const morning = runNight(played, context())
    expect(chapterLines(morning)).toEqual([{ kind: 'chapter', id: ONE, chapter: 2 }])
    // Not the next morning, nor while a chapter is under way.
    expect(chapterLines(runNight(morning, context()))).toEqual([])
    const midway = withLove(played, ONE, { stage: 'friendship', level: 3 })
    expect(chapterLines(runNight(midway, context()))).toEqual([])
  })

  it('says so the morning its gate begins to hold, never while it waits', () => {
    const waiting = withLove(farm(), ONE, { stage: 'friendship', level: 6, points: 440 })
    const played: SaveV4 = { ...waiting, today: { ...waiting.today, events: [ONE] } }
    expect(chapterLines(runNight(played, context(pack)))).toEqual([])
    // The Kitchen paid for today stands tonight.
    const paid: SaveV4 = { ...waiting, farm: { ...waiting.farm, builds: ['kitchen'] } }
    const morning = runNight(paid, context(pack))
    expect(morning.buildings.kitchen).toBe(1)
    expect(chapterLines(morning)).toEqual([{ kind: 'chapter', id: ONE, chapter: 3 }])
    expect(chapterLines(runNight(morning, context(pack)))).toEqual([])
  })

  it('a season’s gate: the night winter begins', () => {
    const winter = packWith([SIX[0]!, { ...SIX[1]!, gate: { kind: 'season', season: 'winter' } }, ...SIX.slice(2)])
    const autumn = withLove(farm(DAYS_PER_SEASON * 3), ONE, { stage: 'friendship', level: 3 })
    expect(chapterLines(runNight(autumn, context(winter)))).toEqual([{ kind: 'chapter', id: ONE, chapter: 2 }])
    expect(chapterLines(runNight(withLove(autumn, ONE, { level: 2 }), context(winter)))).toEqual([])
  })

  it('another’s event: the morning after it played, not before', () => {
    const after = packWith([SIX[0]!, { ...SIX[1]!, gate: { kind: 'event', after: `${TWO}:f1` } }, ...SIX.slice(2)])
    const save = withLove(farm(), ONE, { stage: 'friendship', level: 3 })
    expect(chapterLines(runNight(save, context(after)))).toEqual([])
    const twoPlayed: SaveV4 = { ...withLove(save, TWO, { level: 1, last: 5 }), memories: { [TWO]: ['f1'] }, today: { ...save.today, events: [TWO] } }
    expect(chapterLines(runNight(twoPlayed, context(after)))).toEqual([{ kind: 'chapter', id: ONE, chapter: 2 }])
    const long: SaveV4 = { ...twoPlayed, today: { ...twoPlayed.today, events: [] } }
    expect(chapterLines(runNight(long, context(after)))).toEqual([])
  })

  it('not for her first chapter, nor after a “Not yet”', () => {
    const fresh = farm()
    expect(chaptersOpened(fresh, runNight(fresh, context()), PACK)).toEqual([])
    const confession = packWith([{ title: 'One', events: RUNGS.slice(0, 11) }, { title: 'Two', events: RUNGS.slice(11) }])
    const notYet = withLove(fresh, ONE, { stage: 'confession', level: 10, friend: true, last: 5 })
    expect(chapterLines(runNight({ ...notYet, today: { ...notYet.today, events: [ONE] } }, context(confession)))).toEqual([])
  })

  it('is a morning line the save keeps; an older save without one loads', () => {
    const day = withLove(farm(), ONE, { stage: 'romance', level: 0, last: 5 })
    const morning = runNight({ ...day, today: { ...day.today, events: [ONE] } }, context())
    expect(parseSaveV5(json(morning)).summary!.hearts).toContainEqual({ kind: 'chapter', id: ONE, chapter: 2 })
    const bad = json(morning)
    bad.summary!.hearts = [{ kind: 'chapter', id: ONE, chapter: 28 }]
    expect(() => parseSaveV5(bad)).toThrow('save.summary.hearts.0.chapter')
    const old = json(morning)
    old.summary!.hearts = old.summary!.hearts.filter((h) => h.kind !== 'chapter')
    expect(parseSaveV5(old).summary!.hearts.some((h) => h.kind === 'chapter')).toBe(false)
  })
})
