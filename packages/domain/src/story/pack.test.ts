// An open pack, read whole: any number of characters in any order, every part optional, notes instead of blocks, and an
// error that skips only its part. Invented ids only: the stand-in's 9000001–9000003 and more in its range.
import { describe, expect, it } from 'vitest'
import { LINE_LIMITS, RUNGS, type Cast, type Route } from './authored'
import { readStoryPack, storyPackFrom, type PackFiles } from './pack'
import { chaptersOf, DEFAULT_CHAPTERS, DEFAULT_MEET, firstVisitorOf, meetOf, openingOf, PLACEHOLDER_OPENING, welcomeOf } from './placeholders'
import { STAND_IN_FILES } from './stand-in'

const clone = <T>(v: T): T => structuredClone(v)
const id = (n: number): string => String(9_000_000 + n)
const CALLINGS = ['farming', 'foraging', 'fishing', 'mining', 'quarry'] as const

/** A cast of `n` invented characters, 9000001 onward, each with only what `entry` gives her. */
const castOf = (n: number, entry: (i: number) => Record<string, unknown> = () => ({})): Cast =>
  ({ umas: Array.from({ length: n }, (_, i) => ({ characterId: id(i + 1), ...entry(i) })) })

/** Every note and error, and the pack, of `files`. */
const read = (files: Partial<PackFiles>) => readStoryPack({ umas: {}, routes: {}, ...files })

describe('the packs an open story releases', () => {
  it('five characters with any callings; an old opening list and arrivals are noted and dropped', () => {
    const cast = { ...castOf(5, (i) => ({ outfitId: `${id(i + 1)}01`, calling: CALLINGS[(i * 2) % 5], arrives: { kind: 'opening' } })), opening: [id(4), id(2), id(5), id(1), id(3)] } as Cast
    const { pack, errors, notes } = read({ ...clone(STAND_IN_FILES), cast })
    expect(errors).toEqual([])
    expect(pack.cast).not.toHaveProperty('opening')
    expect(pack.cast.umas.some((u) => 'arrives' in u)).toBe(false)
    expect(notes).toContain('cast.json: opening: the opening brings nobody: the welcome list visits the Gate, one a morning, so the list is dropped')
    expect(notes).toContain(`cast.json: Uma 4 (${id(4)}): arrives is retired: her meet says how you meet her, so it’s dropped`)
    expect(firstVisitorOf(pack)).toBe(id(1))
    expect(notes).toContain(`umas/${id(4)}.json: no bible yet, so her calling or her stats give her line, every gift is neutral, and her chats are the game’s for each stage`)
    expect(notes).toContain(`routes/${id(5)}.json: no route yet, so her meeting scene and her events play the game’s own short cards, which pay as written ones do`)
    expect(pack.cast.umas).toHaveLength(5)
  })

  it('forty characters: the welcome list is the first five, each meets on three days\' talks and has the four chapters', () => {
    const { pack, errors, notes } = read({ cast: castOf(40, (i) => ({ outfitId: `${id(i + 1)}01` })) })
    expect(errors).toEqual([])
    expect(pack.cast.umas).toHaveLength(40)
    expect(welcomeOf(pack)).toEqual([1, 2, 3, 4, 5].map(id))
    expect(meetOf(pack, id(40))).toEqual(DEFAULT_MEET)
    expect(meetOf(pack, id(40))).toEqual({ kind: 'talks', days: 3 })
    expect(chaptersOf(pack, id(17))).toBe(DEFAULT_CHAPTERS)
    // The welcome list's first is day 1's visitor at the Gate; the other 35 are met in town.
    expect(firstVisitorOf(pack)).toBe(id(1))
    expect(notes).toContain(`cast.json: ${id(1)}, the welcome list’s first, is day 1’s visitor at the Gate, and the farm’s first helper`)
  })

  it('a single character with no routes, no ties and no bible', () => {
    const { pack, errors, notes } = read({ cast: castOf(1) })
    expect(errors).toEqual([])
    expect(pack.scripted.size).toBe(0)
    expect(pack.ties.ties).toEqual([])
    expect(notes).toEqual([
      `cast.json: Uma 1 (${id(1)}): no outfit, so she plays her default outfit from master data`,
      'opening.json: no opening yet, so the game’s own three lines play',
      'world.json: no world yet, so the game’s own names, festivals, places and seasons play, and there are no Town notes',
      `umas/${id(1)}.json: no bible yet, so her calling or her stats give her line, every gift is neutral, and her chats are the game’s for each stage`,
      `routes/${id(1)}.json: no route yet, so her meeting scene and her events play the game’s own short cards, which pay as written ones do`,
      `cast.json: ${id(1)} has no calling and no bible’s favouriteLine, so her line is the work her stats in master data suit best`,
      `cast.json: ${id(1)}, the welcome list’s first, is day 1’s visitor at the Gate, and the farm’s first helper`,
    ])
  })

  it('no pack at all reads as an empty cast', () => {
    const { pack, errors } = read({})
    expect(errors).toEqual([])
    expect(pack.cast).toEqual({ umas: [] })
    expect(welcomeOf(pack)).toEqual([])
    expect(firstVisitorOf(pack)).toBeNull()
    expect(pack.opening).toBeNull()
    // Nobody is coming, so the game's opening leaves out its Gate line.
    expect(openingOf(pack)).toEqual(PLACEHOLDER_OPENING.slice(0, 2))
  })

  it('a pack with one broken event loses only that event', async () => {
    const files = clone(STAND_IN_FILES)
    const route = files.routes[id(1)] as Route
    route.events.find((e) => e.id === 'f5')!.steps.push({ say: id(1), line: 'x'.repeat(401) })
    const { pack, errors } = read(files)
    expect(errors).toEqual([`routes/${id(1)}.json: Event f5, step ${route.events.find((e) => e.id === 'f5')!.steps.length}: its line is 401 characters; the screen shows 400 (the event is skipped)`])
    expect([...pack.scripted.get(id(1))!]).toEqual(RUNGS.filter((r) => r !== 'f5'))
    expect((await pack.route(id(1)))!.events).toHaveLength(26)
    expect(pack.bibles.has(id(1))).toBe(true)
  })

  it('a file that isn\'t the shape at all skips that file; the rest of the pack plays', () => {
    const files = { ...clone(STAND_IN_FILES), ties: ['not', 'ties'], umas: { [id(1)]: 'A bible' }, household: 7 }
    const { pack, errors } = read(files)
    expect(errors).toEqual([
      'ties.json: Not a ties file (an object with a ties list); no ties are read',
      `umas/${id(1)}.json: Not a bible (an object); none is read`,
      'household.json: Not a household (an object); none is read',
    ])
    expect(pack.cast.umas).toHaveLength(3)
    expect(pack.scripted.size).toBe(3)
    expect(pack.household).toBeNull()
  })

  it('reading what it read gives the same files and finds nothing to skip', () => {
    const files = clone(STAND_IN_FILES)
    ;(files.routes[id(2)] as Route).events.push({ id: 'f1', steps: [] })
    const first = read(files)
    expect(first.errors).toHaveLength(1)
    const again = read(first.files)
    expect(again.errors).toEqual([])
    expect(again.files).toEqual(first.files)
  })

  it('the stand-in reads as before: its opening\'s four lines, its first as day 1\'s visitor, its bibles and routes', () => {
    const pack = storyPackFrom(STAND_IN_FILES)
    expect(openingOf(pack).map((step) => Object.keys(step)[0])).toEqual(['narrate', 'narrate', 'narrate', 'thought'])
    expect(firstVisitorOf(pack)).toBe(id(1))
    expect([...pack.bibles.keys()]).toEqual([id(1)])
    expect([...pack.scripted.get(id(1))!]).toEqual(RUNGS)
  })
})

describe('the menu\'s welcome list, her trigger and her chapters', () => {
  it('reads the pack\'s own, in its order, and falls back on each default', () => {
    const cast: Cast = {
      ...castOf(8, (i) => (i === 2 ? { meet: { kind: 'built', place: 'kitchen' }, chapters: [{ title: 'Before', events: ['arrival', 'f1'] }, { title: 'After', events: ['f2'], gate: { kind: 'farm-rank', rank: 3 } }] } : {})),
      welcome: [id(7), id(3)],
    }
    const { pack, errors } = read({ cast })
    expect(errors).toEqual([])
    expect(welcomeOf(pack)).toEqual([id(7), id(3)])
    expect(meetOf(pack, id(3))).toEqual({ kind: 'built', place: 'kitchen' })
    expect(meetOf(pack, id(4))).toEqual({ kind: 'talks', days: 3 })
    expect(chaptersOf(pack, id(3))).toEqual([{ title: 'Before', events: ['arrival', 'f1'] }, { title: 'After', events: ['f2'], gate: { kind: 'farm-rank', rank: 3 } }])
    expect(chaptersOf(pack, id(4)).map((c) => c.title)).toEqual(['Getting to know her', 'Together', 'The wedding', 'Married life'])
    expect(firstVisitorOf(pack)).toBe(id(7))
  })

  it('the four default chapters hold every rung once, from meeting her to married life', () => {
    expect(DEFAULT_CHAPTERS.flatMap((c) => c.events)).toEqual(RUNGS)
    expect(DEFAULT_CHAPTERS[0]!.events.at(-1)).toBe('confession')
    expect(DEFAULT_CHAPTERS[1]!.events.at(-1)).toBe('proposal')
  })

  it('an empty welcome list is the default; a meet the menu can\'t read is skipped, and the default plays', () => {
    const { pack, errors } = read({ cast: { ...castOf(6, (i) => (i === 0 ? { meet: { kind: 'talks', days: 'three' } } : {})), welcome: [] } })
    expect(errors).toEqual([`cast.json: Uma 1 (${id(1)}) meet: talks names its days, from 1; skipped`])
    expect(welcomeOf(pack)).toEqual([1, 2, 3, 4, 5].map(id))
    expect(meetOf(pack, id(1))).toEqual(DEFAULT_MEET)
  })
})

describe('the opening: opening.json', () => {
  it('reads its lines in a route\'s steps, any length, with a scene\'s limits; a step it can\'t play or read is skipped, the rest play', () => {
    const steps = [
      { narrate: 'Morning comes up over the fence.' },
      { say: id(1), line: '“You must be {farmer}.”', emote: 'happy' },
      { place: 'gate' },
      { wait: 600 },
      { choice: [{ text: 'Hello.' }, { text: 'Hi.' }] },
      { say: id(2), line: 'x'.repeat(LINE_LIMITS.line + 1) },
      { flag: 'met-at-gate' },
      { thought: 'Time to get to work, husband.' },
      ...Array.from({ length: 12 }, (_, i) => ({ narrate: `Line ${i + 1}.` })),
    ]
    const { pack, errors, notes } = read({ ...clone(STAND_IN_FILES), opening: { about: 'Invented.', steps } })
    expect(errors).toEqual([
      'opening.json: Step 5: the opening plays lines only (say, narrate, thought, wait, place), never a pick; skipped',
      `opening.json: Step 6: its line is ${LINE_LIMITS.line + 1} characters; the screen shows ${LINE_LIMITS.line}; skipped`,
      'opening.json: Step 7: the opening plays lines only (say, narrate, thought, wait, place), never a pick; skipped',
    ])
    // The protagonist is a man: a word that genders him is no note.
    expect(notes.filter((n) => n.includes('Step 8'))).toEqual([])
    expect(pack.opening!.about).toBe('Invented.')
    expect(openingOf(pack)).toHaveLength(steps.length - 3)
    expect(openingOf(pack)[1]).toEqual({ say: id(1), line: '“You must be {farmer}.”', emote: 'happy' })
  })

  it('a speaker outside the cast is a note; with no line left, or a file that isn\'t the shape, the game\'s own plays', () => {
    const outside = read({ ...clone(STAND_IN_FILES), opening: { steps: [{ say: '9000099', line: 'Hello there.' }] } })
    expect(outside.errors).toEqual([])
    expect(outside.notes).toContain('opening.json: Step 1: 9000099 isn’t one who speaks here (one outside the cast and the town’s people shows as “An Uma”)')
    const picks = read({ ...clone(STAND_IN_FILES), opening: { steps: [{ choice: [{ text: 'A.' }] }, { wait: 300 }] } })
    expect(picks.notes).toContain('opening.json: No lines, so the game’s own opening plays')
    expect(picks.pack.opening).toBeNull()
    expect(openingOf(picks.pack)).toEqual(PLACEHOLDER_OPENING)
    const shapeless = read({ ...clone(STAND_IN_FILES), opening: ['Morning.'] })
    expect(shapeless.errors).toEqual(['opening.json: Not an opening (an object with a steps list); the game’s own opening plays'])
    expect(shapeless.files).not.toHaveProperty('opening')
    expect(openingOf(shapeless.pack)).toEqual(PLACEHOLDER_OPENING)
  })

  it('the game\'s own three are short and plain: {farmer} the only placeholder', () => {
    const { errors, notes } = read({ ...clone(STAND_IN_FILES), opening: { steps: PLACEHOLDER_OPENING } })
    expect(errors).toEqual([])
    expect(notes.filter((n) => n.startsWith('opening.json'))).toEqual([])
    for (const step of PLACEHOLDER_OPENING) expect('narrate' in step && step.narrate.length).toBeLessThanOrEqual(80)
  })
})
