// An open pack, read whole: any number of characters in any order, every part optional, notes instead of blocks, and an
// error that skips only its part. Invented ids only: the stand-in's 9000001–9000003 and more in its range.
import { describe, expect, it } from 'vitest'
import { DEFAULT_CHAPTERS, DEFAULT_MEET, RUNGS, type Cast, type Route } from './authored'
import { chaptersOf, meetOf, openingOf, readStoryPack, storyPackFrom, welcomeOf, type PackFiles } from './pack'
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
  it('five opening characters, in any order, with any callings', () => {
    const cast: Cast = { ...castOf(5, (i) => ({ outfitId: `${id(i + 1)}01`, calling: CALLINGS[(i * 2) % 5], arrives: { kind: 'opening' } })), opening: [id(4), id(2), id(5), id(1), id(3)] }
    const { pack, errors, notes } = read({ ...clone(STAND_IN_FILES), cast })
    expect(errors).toEqual([])
    expect(openingOf(pack)).toEqual([id(4), id(2), id(5), id(1), id(3)])
    expect(notes).toContain(`umas/${id(4)}.json: no bible yet, so her calling gives her line, her tastes are neutral, and her chats are her temperament’s`)
    expect(notes).toContain(`routes/${id(5)}.json: no route yet, so her arrival is the game’s own short scene and her events wait (“Her story is still being written”)`)
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
    // No opening and no arrivals: the welcome list comes up the road; the other 35 wait for meeting her in town.
    expect(openingOf(pack)).toEqual([1, 2, 3, 4, 5].map(id))
    expect(notes).toContain(`cast.json: no opening, so the welcome list comes up the road at the opening (${[1, 2, 3, 4, 5].map(id).join(', ')})`)
    expect(notes.find((n) => n.includes('have no arrival'))).toContain(id(40))
  })

  it('a single character with no routes, no ties and no bible', () => {
    const { pack, errors, notes } = read({ cast: castOf(1) })
    expect(errors).toEqual([])
    expect(pack.scripted.size).toBe(0)
    expect(pack.ties.ties).toEqual([])
    expect(notes).toEqual([
      `cast.json: Uma 1 (${id(1)}): no outfit, so she shows as a lettered disc`,
      `umas/${id(1)}.json: no bible yet, so her calling gives her line, her tastes are neutral, and her chats are her temperament’s`,
      `routes/${id(1)}.json: no route yet, so her arrival is the game’s own short scene and her events wait (“Her story is still being written”)`,
      `cast.json: ${id(1)} has no favourite line (no calling, no bible’s favouriteLine), so no perk works at her line`,
      `cast.json: no opening, so the welcome list comes up the road at the opening (${id(1)})`,
    ])
  })

  it('no pack at all reads as an empty cast', () => {
    const { pack, errors } = read({})
    expect(errors).toEqual([])
    expect(pack.cast).toEqual({ umas: [] })
    expect(welcomeOf(pack)).toEqual([])
    expect(openingOf(pack)).toEqual([])
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

  it('the stand-in reads as before: its opening three, its bibles and routes', () => {
    const pack = storyPackFrom(STAND_IN_FILES)
    expect(openingOf(pack)).toEqual([1, 2, 3].map(id))
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
    expect(openingOf(pack)).toEqual([id(7), id(3)])
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
