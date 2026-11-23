// A complete Uma: the scaffold fills only what's missing from the default story, marked `"draft": "default"`; the reader
// takes the marker on every piece it writes and plays the pack exactly as the same pack unmarked; the check counts marked
// pieces as the default and notes one whose words changed; the status counts hers, the default and missing by part.
// Invented casts only: ids 9000001 onward and the invented master data's 9100001–9100006, invented names.
import { describe, expect, it } from 'vitest'
import { chatLineV4 } from '../romance/acts'
import { newLove, newSave, type Love } from '../save/v4'
import { townDay } from '../town/town'
import { RUNGS, type Cast } from './authored'
import {
  BIBLE_PIECES, CAST_PIECES, COMPLETE_EVENTS, DRAFT, draftNotes, leftWords, pieceWords, ROUTINE_DAYS, routePieces, scaffoldPack, scaffoldTemperament, umaStatus,
  OPTIONAL_EVENTS, UNSCAFFOLDED_BIBLE, unscaffoldedRoute, type Scaffold,
} from './complete'
import { DEFAULT_MORNINGS, DEFAULT_TALKS } from './default-story'
import { readStoryPack, type PackFiles, type StoryPack } from './pack'
import {
  chaptersOf, eventOf, favouriteGoodOf, favouriteOf, fillHer, giftsOf, herWordsOf, keepsakeOf, mealLinesOf, morningGreetingsOf, petNameOf, townLinesOf, weddingPlaces, wishesOf,
} from './placeholders'
import { MASTER } from './placeholders.fixture'

const id = (n: number): string => String(9_000_000 + n)
const [ONE, TWO, THREE] = [id(1), id(2), id(3)]
const NAMES: Record<string, string> = { [ONE]: 'Aster Vale', [TWO]: 'Bryony Kett', [THREE]: 'Corra Lind', '9100003': 'Dell Morrow' }
const clone = <T>(v: T): T => structuredClone(v)

/** An invented pack: three in the cast, the first with a bible and a route of her own (an arrival and Friendship 1), the
 * second with only a bible, the third with nothing but her cast entry. */
function packFiles(): PackFiles {
  return {
    cast: {
      umas: [
        { characterId: ONE, spot: 'cafe', calling: 'fishing', paragraph: 'Invented.' },
        { characterId: TWO, spot: 'library', calling: 'farming' },
        { characterId: THREE, calling: 'foraging', chapters: [{ title: 'Her own', events: ['arrival', 'f1'] }] },
      ],
    } satisfies Cast,
    ties: { ties: [] },
    umas: {
      [ONE]: { characterId: ONE, favouriteLine: 'fishing', gifts: { loved: 'seashell', liked: ['peach'] }, petName: 'Sprout', route: [{ id: 'f1', beat: 'Her own caption.' }] },
      [TWO]: { characterId: TWO, favouriteLine: 'farming', blurb: 'The story’s own.' },
    },
    routes: {
      [ONE]: { characterId: ONE, events: [{ id: 'arrival', steps: [{ say: ONE, line: 'Her own hello.' }, { choice: [{ text: 'Hi.', friendship: 2 }, { text: 'Hey.', friendship: 1 }] }] }, { id: 'f1', steps: [{ narrate: 'Her own first.' }, { choice: [{ text: 'Yes.', friendship: 2 }, { text: 'No.', friendship: 1 }] }] }] },
    },
  }
}
const HERS = [ONE, TWO, THREE].map((x) => ({ id: x, name: NAMES[x]!, temperament: 'steady' as const }))

/** The pack's files with the scaffold's written in. */
const applied = (files: PackFiles, s: Scaffold): PackFiles => ({ ...files, ...(s.cast ? { cast: s.cast } : {}), umas: { ...files.umas, ...s.umas }, routes: { ...files.routes, ...s.routes } })
/** Every `draft` marker gone: the same pack, unmarked. */
function unmarked<T>(v: T): T {
  if (Array.isArray(v)) return v.map(unmarked) as T
  if (typeof v === 'object' && v !== null) return Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'draft').map(([k, x]) => [k, unmarked(x)])) as T
  return v
}
const scaffolded = () => {
  const files = packFiles()
  const s = scaffoldPack(files, HERS, MASTER)
  return { files, s, after: applied(files, s) }
}
const playable = (files: PackFiles): StoryPack => ({ ...readStoryPack(files).pack, master: MASTER })
/** The route pieces the scaffold can't write (no default scene), and the event ids it writes: every other piece, and the
 * one festival's night the default story has, the Fishing Derby's, as `derby-night`. */
const NO_DEFAULT = unscaffoldedRoute()
const SCAFFOLDED = [...COMPLETE_EVENTS.filter((e) => !NO_DEFAULT.includes(e)), 'derby-night']

describe('the scaffold: only what’s missing, from the default story, marked', () => {
  it('fills every missing piece for each Uma and leaves hers alone', () => {
    const { files, s, after } = scaffolded()
    expect(s.refused).toEqual({})
    // Her own pieces are untouched: her loved good, her pet name, her beat, her arrival and Friendship 1.
    expect((after.umas[ONE] as Record<string, unknown>).gifts).toEqual({ loved: 'seashell', liked: ['peach'] })
    expect((after.umas[ONE] as Record<string, unknown>).petName).toBe('Sprout')
    const route = after.routes[ONE] as { events: { id: string; draft?: string }[] }
    expect(route.events.slice(0, 2)).toEqual((files.routes[ONE] as { events: unknown[] }).events)
    expect(route.events.slice(2).every((e) => e.draft === DRAFT)).toBe(true)
    expect(route.events.map((e) => e.id).sort()).toEqual([...SCAFFOLDED].sort())
    // The pieces the default story has no words for stay missing: hers to write.
    expect(NO_DEFAULT).toEqual(['anniversary', 'blossom-viewing', 'wishing-night', 'first-cold-evening', 'first-snow', 'longest-night', 'sweets-day'])
    // Her chapters are hers; the others' are the four defaults, each marked.
    expect(s.wrote[THREE]!.some((w) => w.piece === 'chapters')).toBe(false)
    expect(s.wrote[TWO]!.filter((w) => w.part === 'cast').map((w) => w.piece)).toEqual([...CAST_PIECES])
    // What it wrote, per Uma: everything missing.
    expect(s.wrote[ONE]!.filter((w) => w.part === 'route')).toHaveLength(SCAFFOLDED.length - 2)
    expect(s.wrote[TWO]!.filter((w) => w.part === 'route')).toHaveLength(SCAFFOLDED.length)
    expect(s.wrote[TWO]!.some((w) => w.piece === 'fishing-derby-night')).toBe(true)
    expect(s.wrote[THREE]!.filter((w) => w.part === 'bible')).toHaveLength(BIBLE_PIECES.length - UNSCAFFOLDED_BIBLE.length + RUNGS.length)
    expect(s.wrote[ONE]!.filter((w) => w.part === 'bible').map((w) => w.piece)).toEqual(['chats', 'townLines', 'mornings', 'meals', 'keepsake', 'wedding', 'wishes',
      ...RUNGS.filter((r) => r !== 'f1').map((r) => `beat:${r}`)])
    // The fields the game doesn't read stay, and her bible's story's own words.
    expect((after.umas[TWO] as Record<string, unknown>).blurb).toBe('The story’s own.')
    expect((after.cast as Cast).umas[0]!.paragraph).toBe('Invented.')
  })

  it('a second run writes nothing', () => {
    const { after } = scaffolded()
    const again = scaffoldPack(after, HERS, MASTER)
    expect(again).toEqual({ umas: {}, routes: {}, wrote: { [ONE]: [], [TWO]: [], [THREE]: [] }, refused: {} })
  })

  it('renders the default for her: her name, her good, her line’s work; {farmer} kept', () => {
    const { after } = scaffolded()
    const route = after.routes[TWO] as { events: { id: string; steps: { say?: string; line?: string; narrate?: string }[] }[] }
    const f2 = route.events.find((e) => e.id === 'f2')!
    expect(f2.steps.find((st) => st.say)!.say).toBe(TWO)
    expect(JSON.stringify(f2)).toContain('a day of farming')
    expect(JSON.stringify(route)).not.toMatch(/\{(name|good|work)\}|@her/)
    expect(JSON.stringify(route)).toContain('{farmer}')
    const bible = after.umas[TWO] as { chats: Record<string, string[]>; mornings: string[]; gifts: { loved: string } }
    expect(bible.gifts.loved).toBe('carrot')
    expect(bible.chats.friend).toEqual(DEFAULT_TALKS.friend.steady.map((l) => fillHer(l, { name: NAMES[TWO]!, good: 'Carrot', work: 'farming' })))
    expect(bible.mornings[0]).toContain(NAMES[TWO])
  })

  it('her temperament: her bible’s own, else master data’s, else steady', () => {
    expect(scaffoldTemperament({ temperament: 'bold' }, 'clever')).toBe('bold')
    expect(scaffoldTemperament({ temperament: 'loud' }, 'clever')).toBe('clever')
    expect(scaffoldTemperament(undefined, null)).toBe('steady')
    const files = packFiles()
    const s = scaffoldPack(files, [{ id: THREE, name: NAMES[THREE]!, temperament: 'clever' }], MASTER)
    expect((s.umas[THREE] as { mornings: string[] }).mornings).toEqual(DEFAULT_MORNINGS.clever.map((l) => fillHer(l, { name: NAMES[THREE]!, good: 'Shiitake', work: 'foraging' })))
  })

  it('her line from master data when the pack gives none; refused, and the rest written, without either', () => {
    const files: PackFiles = { cast: { umas: [{ characterId: '9100003' }, { characterId: '9100099' }] }, umas: {}, routes: {} }
    const s = scaffoldPack(files, [{ id: '9100003', name: NAMES['9100003']! }, { id: '9100099', name: 'Nobody Known' }], MASTER)
    expect((s.umas['9100003'] as { favouriteLine: string }).favouriteLine).toBe('fishing')
    expect(s.refused['9100099']).toEqual(['favouriteLine: she has no calling, and master data gives her no line'])
    expect(s.umas['9100099']).toBeDefined()
  })

  it('her schedule: the game’s own default as her routine, marked, and no home or job; she plays where she did', () => {
    const { files, after } = scaffolded()
    const cast = after.cast as Cast
    // Her favourite spot on every third day, from day 1, 2 or 3 by her place in the cast: `scheduleOf`'s default.
    expect(cast.umas[0]).toEqual({ ...(files.cast as Cast).umas[0], routine: [{ at: 'cafe', days: [...ROUTINE_DAYS[0]!], draft: DRAFT }], chapters: expect.any(Array) })
    expect(cast.umas[1]!.routine).toEqual([{ at: 'library', days: [...ROUTINE_DAYS[1]!], draft: DRAFT }])
    // No spot of her own: the six in turn by her place in the cast.
    expect(cast.umas[2]!.routine).toEqual([{ at: 'plaza', days: [...ROUTINE_DAYS[2]!], draft: DRAFT }])
    for (const u of cast.umas) expect([u.home, u.job]).toEqual([undefined, undefined])
    expect(readStoryPack(after).errors).toEqual([])
    // In town, every day of the year, each is where the default put her before: out on her four days, at home the rest.
    const [before, now] = [playable(files), playable(after)]
    const save = newSave('robin', '2026-11-14T09:00:00.000Z')
    for (let day = 1; day <= 48; day++) {
      const today = { ...save, calendar: { ...save.calendar, day } }
      expect([...townDay(today, now).where]).toEqual([...townDay(today, before).where])
    }
    expect([1, 2, 3, 4].map((day) => townDay({ ...save, calendar: { day } }, now).where.get(ONE) ?? null)).toEqual(['cafe', 'harbour-inn', 'harbour-inn', 'cafe'])
    expect(townDay({ ...save, calendar: { day: 2 } }, now).by.get(TWO)).toBe('routine')
  })

  it('never writes into a file it can’t read as its shape; an Uma not in the cast joins it', () => {
    const files: PackFiles = { cast: { umas: [{ characterId: ONE }] }, umas: { [ONE]: ['not', 'a', 'bible'] }, routes: { [ONE]: { events: 'none' } } }
    const s = scaffoldPack(files, [{ id: ONE, name: NAMES[ONE]! }, { id: TWO, name: NAMES[TWO]! }])
    expect(s.refused[ONE]).toEqual([
      `umas/${ONE}.json isn’t a bible (an object), so none of its pieces is written`,
      `routes/${ONE}.json isn’t a route (an object with an events list), so none of its events is written`,
    ])
    expect(s.umas[ONE]).toBeUndefined()
    expect(s.routes[ONE]).toBeUndefined()
    expect((s.cast as unknown as Cast).umas.map((u) => u.characterId)).toEqual([ONE, TWO])
    expect(scaffoldPack({ cast: [], umas: {}, routes: {} }, [{ id: ONE, name: 'x' }]).refused[ONE]).toEqual(['cast.json isn’t a cast file (an object with an umas list), so nothing is written'])
  })

  it('leaves an Uma as she was when her pieces wouldn’t read', () => {
    const files = packFiles()
    const s = scaffoldPack(files, [{ id: TWO, name: 'N'.repeat(200) }], MASTER)
    expect(s.wrote[TWO]).toEqual([])
    expect(s.refused[TWO]!.length).toBeGreaterThan(0)
    expect(s.refused[TWO]!.every((r) => r.startsWith('left as she was: '))).toBe(true)
    expect(s.umas[TWO]).toBeUndefined()
  })
})

describe('the marker: read, never played', () => {
  it('the reader takes it on every piece the scaffold writes, with no error and no note of its own', () => {
    const { files, after } = scaffolded()
    const before = readStoryPack(files)
    const read = readStoryPack(after)
    expect(read.errors).toEqual([])
    expect(read.notes.filter((n) => /draft|placeholder/.test(n))).toEqual([])
    // Her pet name, your name: the default's, so quiet while marked; unmarked, the reader's note as ever.
    expect(readStoryPack(unmarked(after)).notes).toContain(`umas/${THREE}.json: petName: no placeholder (it’s what she calls you)`)
    // The scaffold only removes notes: what wasn't written yet.
    expect(read.notes.filter((n) => !before.notes.includes(n))).toEqual([])
    // It's kept as written: the release carries it.
    expect((read.files.umas[THREE] as { chats: { draft: string } }).chats.draft).toBe(DRAFT)
  })

  it('a marked pack plays exactly as the same pack unmarked', async () => {
    const { after } = scaffolded()
    const marked = playable(after)
    const plain = playable(unmarked(after))
    const save = newSave('robin', '2026-11-14T09:00:00.000Z')
    const withLove = (who: string, love: Partial<Love>) => ({ ...save, love: { ...save.love, [who]: { ...newLove(), ...love } } })
    for (const who of [ONE, TWO, THREE]) {
      for (const event of COMPLETE_EVENTS) expect(await eventOf(marked, who, event, NAMES[who])).toEqual(await eventOf(plain, who, event, NAMES[who]))
      expect(unmarked(chaptersOf(marked, who))).toEqual(chaptersOf(plain, who))
      expect([favouriteOf(marked, who), giftsOf(marked, who).loved, keepsakeOf(marked, who), petNameOf(marked, who), weddingPlaces(marked, who), wishesOf(marked, who)])
        .toEqual([favouriteOf(plain, who), giftsOf(plain, who).loved, keepsakeOf(plain, who), petNameOf(plain, who), weddingPlaces(plain, who), wishesOf(plain, who)])
      expect([townLinesOf(marked, who), morningGreetingsOf(marked, who, 'steady'), mealLinesOf(marked, who, 'dinner')]).toEqual([townLinesOf(plain, who), morningGreetingsOf(plain, who, 'steady'), mealLinesOf(plain, who, 'dinner')])
      for (const love of [{}, { level: 1 }, { level: 5 }, { stage: 'romance', level: 3 }, { stage: 'wedding', level: 0 }, { stage: 'spouse', level: 2 }] as Partial<Love>[]) {
        expect(chatLineV4(withLove(who, love), marked, who, 'steady')).toBe(chatLineV4(withLove(who, love), plain, who, 'steady'))
      }
    }
    for (let day = 1; day <= 48; day++) {
      const today = { ...save, calendar: { ...save.calendar, day } }
      expect([...townDay(today, marked).where]).toEqual([...townDay(today, plain).where])
    }
  })

  it('the scaffolded Uma plays as before: the same events, lines and pays; her talks the default’s friend, sweetheart and married', async () => {
    const files = packFiles()
    const before = playable(files)
    const after = playable(applied(files, scaffoldPack(files, HERS, MASTER)))
    const save = newSave('robin', '2026-11-14T09:00:00.000Z')
    const withLove = (who: string, love: Partial<Love>) => ({ ...save, love: { ...save.love, [who]: { ...newLove(), ...love } } })
    const filled = (lines: readonly string[], who: string) => lines.map((l) => l.replaceAll('{name}', NAMES[who]!))
    for (const who of [TWO, THREE]) {
      for (const event of COMPLETE_EVENTS) {
        const [was, now] = [await eventOf(before, who, event, NAMES[who]), await eventOf(after, who, event, NAMES[who])]
        expect({ ...now, written: false }).toEqual(was)
      }
      expect(chaptersOf(after, who).map(({ title, events }) => ({ title, events }))).toEqual(chaptersOf(before, who).map(({ title, events }) => ({ title, events })))
      expect([favouriteOf(after, who), favouriteGoodOf(after, who), herWordsOf(after, who, 'x'), keepsakeOf(after, who), petNameOf(after, who), weddingPlaces(after, who), wishesOf(after, who), townLinesOf(after, who)])
        .toEqual([favouriteOf(before, who), favouriteGoodOf(before, who), herWordsOf(before, who, 'x'), keepsakeOf(before, who), petNameOf(before, who), weddingPlaces(before, who), wishesOf(before, who), townLinesOf(before, who)])
      expect(morningGreetingsOf(after, who, 'steady')).toEqual(filled(morningGreetingsOf(before, who, 'steady'), who))
      expect(mealLinesOf(after, who, 'breakfast')).toEqual(filled(mealLinesOf(before, who, 'breakfast'), who))
      // Her talks: the default's for the friend, the sweetheart and the married stages (the chat sets' three).
      for (const love of [{ level: 4 }, { stage: 'romance', level: 3 }, { stage: 'spouse', level: 1 }] as Partial<Love>[]) {
        expect(chatLineV4(withLove(who, love), after, who, 'steady')).toBe(chatLineV4(withLove(who, love), before, who, 'steady').replaceAll('{name}', NAMES[who]!))
      }
    }
  })
})

describe('the status and the check', () => {
  it('counts hers, the default and missing by part; scaffolded, only what the default story has no words for is missing', () => {
    const { files, after } = scaffolded()
    const was = umaStatus(readStoryPack(files).files, ONE)
    expect(was.complete).toBe(false)
    expect(was.parts.route).toEqual({ hers: 2, default: 0, missing: COMPLETE_EVENTS.length - 2, of: COMPLETE_EVENTS.length })
    const now = umaStatus(readStoryPack(after).files, ONE)
    expect(now.complete).toBe(false)
    expect(now.parts).toEqual({
      cast: { hers: 0, default: 2, missing: 0, of: 2 },
      bible: { hers: 4, default: 7 + 26, missing: UNSCAFFOLDED_BIBLE.length, of: BIBLE_PIECES.length + RUNGS.length },
      // The scaffolded derby night counts, as the default; the nights not written aren't pieces.
      route: { hers: 2, default: SCAFFOLDED.length - 2, missing: NO_DEFAULT.length, of: COMPLETE_EVENTS.length + 1 },
    })
    expect(now.pieces.filter((p) => p.state === 'missing').map((p) => p.piece)).toEqual([...UNSCAFFOLDED_BIBLE, ...NO_DEFAULT])
    expect(umaStatus(readStoryPack(after).files, THREE).parts.cast).toEqual({ hers: 1, default: 1, missing: 0, of: 2 })
    expect(leftWords(now)[0]).toBe('cast: default schedule, chapters')
    // Her schedule is one piece: her home, her job and her routine together. Any of them unmarked makes it hers; an older
    // scaffold's marked home and job at her spot are the default too.
    const entry = (more: Record<string, unknown>) => umaStatus({ cast: { umas: [{ characterId: ONE, ...more }] }, umas: {}, routes: {} }, ONE).pieces.find((p) => p.piece === 'schedule')!.state
    expect(was.pieces.find((p) => p.piece === 'schedule')!.state).toBe('missing')
    expect(entry({ home: 'cafe', draft: { home: DRAFT }, job: { at: 'cafe', draft: DRAFT } })).toBe('default')
    expect(entry({ home: 'cafe', draft: { home: DRAFT }, job: { at: 'cafe' } })).toBe('hers')
    expect(entry({ job: { what: 'Waits tables', at: 'cafe' } })).toBe('hers')
    expect(draftNotes({ cast: { umas: [{ characterId: ONE, home: 'cafe', draft: { home: DRAFT }, routine: [{ at: 'cafe', days: [1, 4, 7, 10], draft: DRAFT }] }] }, umas: {}, routes: {} }, ONE)).toEqual([])
    expect(leftWords(now)[2]).toMatch(/^route: missing anniversary, blossom-viewing, [^;]*; default f2–f10, confession, r1–r10, proposal, wedding, invited-to-work, wedding-night, moving-in, s1–s5, hangouts \(walk, fishing, picnic, market, cooking, festival, morning-walk, breakfast, tea-by-the-pond, flower-market, sunrise-sketch, bakery-stop\), dates \(walk, /)
    expect(leftWords(was)[2]).toMatch(/^route: missing f2–f10, confession/)
  })

  it('a piece rewritten and unmarked is hers; one still marked but rewritten gets a note; the default’s words get none', () => {
    const { after } = scaffolded()
    expect(draftNotes(readStoryPack(after).files, TWO)).toEqual([])
    const edited = clone(after)
    const bible = edited.umas[TWO] as Record<string, unknown> & { chats: { friend: string[] }; route: { id: string; place?: string }[]; draft: Record<string, string> }
    bible.chats.friend[0] = 'Her own words now.'
    bible.route.find((b) => b.id === 'f4')!.place = 'fishery'
    bible.mornings = ['“Her own morning.”']
    const route = edited.routes[TWO] as { events: { id: string; draft?: string; steps: { narrate?: string }[] }[] }
    route.events.find((e) => e.id === 'f3')!.steps[0] = { narrate: 'Her own f3.' }
    const f5 = route.events.find((e) => e.id === 'f5')!
    f5.steps[0] = { narrate: 'Her own f5.' }
    delete f5.draft
    const cast = edited.cast as { umas: Record<string, unknown>[] }
    cast.umas[1]!.routine = [{ at: 'harbour', days: [1, 2], draft: DRAFT }]
    const files = readStoryPack(edited).files
    expect(draftNotes(files, TWO)).toEqual([
      `cast.json: ${TWO}: schedule is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
      `umas/${TWO}.json: chats is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
      `umas/${TWO}.json: mornings is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
      `umas/${TWO}.json: beat f4 is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
      `routes/${TWO}.json: f3 is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
    ])
    const status = umaStatus(files, TWO)
    expect(status.pieces.find((p) => p.piece === 'f5')!.state).toBe('hers')
    expect(status.pieces.find((p) => p.piece === 'f3')!.state).toBe('default')
    // A marker that isn't one: noted, and the piece counts as hers.
    bible.draft.townLines = 'mine'
    bible.draft.blurb = DRAFT
    ;(bible.chats as Record<string, unknown>).draft = 'done'
    const again = readStoryPack(edited).files
    expect(draftNotes(again, TWO)).toEqual(expect.arrayContaining([
      `umas/${TWO}.json: draft.townLines is "default" or nothing, so townLines counts as hers`,
      `umas/${TWO}.json: draft.blurb isn’t one of favouriteLine, townLines, mornings, petName, wishes, smallTalk; it’s ignored`,
      `umas/${TWO}.json: chats’s draft is "default" or nothing, so it counts as hers`,
    ]))
    expect(umaStatus(again, TWO).pieces.filter((p) => ['townLines', 'chats'].includes(p.piece)).map((p) => p.state)).toEqual(['hers', 'hers'])
  })

  it('a marked event with an error is skipped by the reader, so it counts as missing: the default plays it', () => {
    const { after } = scaffolded()
    const edited = clone(after)
    ;(edited.routes[TWO] as { events: { id: string; steps: unknown[] }[] }).events.find((e) => e.id === 'f6')!.steps = [{ narrate: 'x'.repeat(401) }]
    const read = readStoryPack(edited)
    expect(read.errors.some((e) => e.startsWith(`routes/${TWO}.json: Event f6`))).toBe(true)
    expect(umaStatus(read.files, TWO).pieces.find((p) => p.piece === 'f6')!.state).toBe('missing')
  })

  it('says a list of pieces in few words', () => {
    expect(pieceWords(['f1', 'f2', 'f3', 'confession', 'r1', 'r2', 's1', 's2', 'beat:f1', 'beat:f2', 'beat:f3', 'beat:r5'])).toBe('f1–f3, confession, r1, r2, s1, s2, beats (f1–f3, r5)')
    expect(pieceWords(['s4', 'hangout-walk', 'date-boat', 'hangout-picnic', 'beat:wedding', 'birthday'])).toBe('s4, hangouts (walk, picnic), date-boat, beat wedding, birthday')
  })
})

describe('a complete Uma counts every occasion, her greetings, her small talk and her gift lines', () => {
  const written = (ids: readonly string[]) => ids.map((e) => ({ id: e, steps: [{ narrate: `Her own ${e}.` }] }))
  it('a night is hers under its alias, and one not written is never missing; a world.json day adds its scene; the talk pieces are hers once they hold a line', () => {
    expect(COMPLETE_EVENTS.slice(-14)).toEqual([
      'new-year', 'flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup', 'birthday', 'anniversary',
      'blossom-viewing', 'wishing-night', 'first-cold-evening', 'first-snow', 'longest-night', 'sweets-day',
    ])
    expect(OPTIONAL_EVENTS).toEqual(['flower-show-night', 'fishing-derby-night', 'cooking-contest-night', 'animal-show-night', 'harvest-cup-night'])
    const world = { days: [{ id: 'lantern-day', name: 'Lantern day', day: 2, scene: 'lantern-scene' }, { id: 'first-snow', name: 'Snowfall', season: 'winter', day: 5 }] }
    expect(routePieces(world as never).map((p) => p.piece).slice(-9)).toEqual(['birthday', 'anniversary', 'lantern-scene', 'first-snow', 'blossom-viewing', 'wishing-night', 'first-cold-evening', 'longest-night', 'sweets-day'])
    const occasions = ['new-year', 'flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup', 'flower-show-night', 'derby-night', 'harvest-moon',
      'animal-show-night', 'harvest-cup-night', 'birthday', 'anniversary', 'blossom-viewing', 'wishing-night', 'first-cold-evening', 'longest-night']
    const bible = { characterId: ONE, greetings: { seasons: { spring: ['Her spring hello.'] } }, smallTalk: [{ lines: [[ONE, 'A.'], ['you', 'B.'], [ONE, 'C.']] }], giftLines: { birthday: [] } }
    const files = {
      cast: { umas: [{ characterId: ONE }] }, world,
      umas: { [ONE]: bible },
      routes: { [ONE]: { characterId: ONE, events: written([...occasions, 'lantern-scene']) } },
    }
    const status = umaStatus(files, ONE)
    const state = (piece: string) => status.pieces.find((p) => p.piece === piece)?.state
    expect(['fishing-derby-night', 'cooking-contest-night', 'lantern-scene', 'sweets-day', 'anniversary'].map(state)).toEqual(['hers', 'hers', 'hers', 'missing', 'hers'])
    // The nights she wrote count as hers; a festival with none written has no piece, so it's never missing.
    // 66 pieces (51 events, 8 occasions, the 7 days' scenes) and her 5 nights: 13 occasions and the 5 nights hers.
    expect(status.parts.route).toEqual({ hers: 18, default: 0, missing: 65, of: 83 })
    expect(state('flower-show-night')).toBe('hers')
    const fewer = umaStatus({ ...files, routes: { [ONE]: { characterId: ONE, events: written([...occasions.filter((e) => !['flower-show-night', 'animal-show-night'].includes(e)), 'lantern-scene']) } } }, ONE)
    expect(fewer.pieces.some((p) => p.piece === 'flower-show-night' || p.piece === 'animal-show-night')).toBe(false)
    expect(fewer.parts.route.missing).toBe(status.parts.route.missing)
    // The game's sweets day plays on its day, so it's still a piece; world.json moved the first snow, still missing.
    expect(state('first-snow')).toBe('missing')
    expect(['greetings', 'smallTalk', 'giftLines'].map(state)).toEqual(['hers', 'hers', 'missing'])
    // Marked: the default, and noted, since the default story has none of their words.
    const marked = { ...files, umas: { [ONE]: { ...bible, greetings: { ...bible.greetings, draft: DRAFT }, draft: { smallTalk: DRAFT } } } }
    expect(['greetings', 'smallTalk'].map((p) => umaStatus(marked, ONE).pieces.find((x) => x.piece === p)?.state)).toEqual(['default', 'default'])
    expect(draftNotes(marked, ONE)).toEqual([
      `umas/${ONE}.json: greetings is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
      `umas/${ONE}.json: smallTalk is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`,
    ])
  })
})
