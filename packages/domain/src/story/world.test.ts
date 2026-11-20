// The world in the pack: `world.json`'s reader (errors skip only their part, notes block nothing), its lookups (the
// pack's, or the game's own words), the year's festivals from the story (renamed, moved, added; a moved one keeps its
// rule), and the Town notes (unlocked once at a talk, a visit or the night, and kept in the save as ids). An invented
// world (`world.fixture.ts`) on the invented stand-in; no original-game content.
import { describe, expect, it } from 'vitest'
import { dateOf, farmDay, FESTIVALS, festivalOn, nextFestival } from '../farm/calendar'
import { runNight } from '../night/end-day'
import { eveningSlots } from '../romance/evening'
import { meet, triggerHolds } from '../romance/meeting'
import { gateHolds, gateWords } from '../romance/chapters'
import { parseSaveV6 } from '../save/parse-v4'
import { newSave, type SaveV4 } from '../save/v4'
import { knownNotes, noteHolds, unlockNotes } from '../town/notes'
import { checkCast, checkWorld, LINE_LIMITS, type World } from './authored'
import { readStoryPack, storyPackFrom, type StoryPack } from './pack'
import {
  festivalNameOf, festivalsOf, GAME_STORY_DAYS, historyOf, noPack, placeNameOf, placeWordsOf, PLACEHOLDER_NAMES, seasonLineOf, storyDayNameOf, storyDaysOf, storyDaysOn, townNotesOf,
  worldNamesOf, worldWrittenOf,
} from './placeholders'
import { releasedStoryPack, storyFileName, type StoryIndex } from './release'
import { STAND_IN_FILES } from './stand-in'
import { WORLD_FIXTURE } from './world.fixture'

const AT = '2026-11-14T09:00:00.000Z'
const ONE = '9000001'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const withWorld = (world: unknown): StoryPack => storyPackFrom({ ...STAND_IN_FILES, world })
const PACK = withWorld(WORLD_FIXTURE)
const day = (season: 'spring' | 'summer' | 'autumn' | 'winter', d: number, year = 1) => farmDay({ year, season, day: d })
const farm = (on = 3): SaveV4 => {
  const fresh = newSave('u-world', AT)
  return { ...fresh, farmer: { name: 'Robin' }, calendar: { day: on }, diary: { ...fresh.diary, read: ['scene:1:open'] } }
}

describe('world.json’s reader', () => {
  it('reads every part of a world, with no errors', () => {
    const read = checkWorld(WORLD_FIXTURE)
    expect(read.errors).toEqual([])
    expect(read.value).toEqual(WORLD_FIXTURE)
    expect(read.notes).toEqual(['Note old-well: no unlock, so it’s in the Diary from the start'])
  })

  it('skips only the part an error is in, and keeps the rest', () => {
    const long = 'x'.repeat(LINE_LIMITS.name + 1)
    const read = checkWorld({
      names: { town: long, farm: 'Thistle Farm' },
      history: ['A line.', 7],
      festivals: [
        { id: 'harvest-cup', season: 'midsummer', name: 'The Long Run' },
        { id: 'moon-night', name: 'Moon Night', season: 'summer' },
        { id: 'Bad Id', name: 'Nope', season: 'summer', day: 2 },
      ],
      places: { fields: { name: 'Low Fields', line: 5 }, orchard: { name: 'The Orchard' } },
      seasons: { spring: 'The thaw.', monsoon: 'Rain.' },
      notes: [
        { id: 'no-title', lines: ['A line.'] },
        { id: 'talky', title: 'Talky', lines: ['A line.'], unlock: { kind: 'talks', days: 2 } },
        { id: 'broken', title: 'Broken', lines: ['A line.'], unlock: { kind: 'spot', spot: 'moon' } },
        { id: 'empty', title: 'Empty', lines: [3] },
        { id: 'kept', title: 'Kept', lines: ['One.', 'Two.'], unlock: { kind: 'season', season: 'autumn' } },
        { id: 'kept', title: 'Again', lines: ['Three.'] },
      ],
      lore: 'The story’s own: kept.',
    })
    expect(read.value).toEqual({
      names: { farm: 'Thistle Farm' },
      history: ['A line.'],
      festivals: [{ id: 'harvest-cup', name: 'The Long Run' }],
      places: { fields: { name: 'Low Fields' } },
      seasons: { spring: 'The thaw.' },
      notes: [
        { id: 'talky', title: 'Talky', lines: ['A line.'] },
        { id: 'broken', title: 'Broken', lines: ['A line.'] },
        { id: 'kept', title: 'Kept', lines: ['One.', 'Two.'], unlock: { kind: 'season', season: 'autumn' } },
      ],
      lore: 'The story’s own: kept.',
    })
    expect(read.errors).toEqual([
      `names.town: its name is ${LINE_LIMITS.name + 1} characters; the screen shows ${LINE_LIMITS.name}; skipped`,
      'history, line 2: no line; skipped',
      'Festival harvest-cup: season is one of spring, summer, autumn, winter; skipped',
      'Festival moon-night: a festival of the story’s own needs its name, its season and its day; skipped',
      'Festival 3: id is one of the game’s festivals (flower-show, fishing-derby, cooking-contest, animal-show, harvest-cup) or one of the story’s own, in lowercase words joined by -; skipped',
      'Place fields line: no line; skipped',
      'Place orchard: not one of the farm’s places (fields, mill, coop, forest, sawmill, barn, fishery, smokehouse, kitchen, mine, smelter, restaurant, quarry, cutter, forge, bin, warehouse, board, gate, dock, shop, festival, expeditions, town, boat); skipped',
      'Season monsoon: not one of spring, summer, autumn, winter; skipped',
      'Note no-title: no title; the note is skipped',
      'Note talky unlock: a note’s unlock is one of spot, season, festival, farm-rank, built, shipped, event (talks is meeting her own); skipped, so the note is in the Diary from the start',
      'Note broken unlock: a spot names one of the town’s spots: plaza, market, cafe, harbour, library, track; skipped, so the note is in the Diary from the start',
      'Note empty, line 1: no line; skipped',
      'Note empty: no line left; the note is skipped',
      'Note kept: listed twice; the later one is skipped',
    ])
  })

  it('reads the retired Dorm’s words and doesn’t show them: a note, not an error', () => {
    const read = checkWorld({ places: { dorm: { name: 'An Invented Dorm', line: 'An invented line.' }, fields: { name: 'An Invented Field' } } })
    expect(read.errors).toEqual([])
    expect(read.notes).toContain('Place dorm: the Dorm is retired, so its name and line aren\'t shown')
    expect(read.value!.places).toEqual({ fields: { name: 'An Invented Field' } })
  })

  it('refuses a file that isn’t a world, and the game’s own words play', () => {
    expect(checkWorld([1, 2]).value).toBeNull()
    expect(checkWorld('a world').errors).toEqual(['Not a world (an object); the game’s own words play'])
  })

  it('keeps one festival a day: a move onto a day another holds goes back, and the story’s own on a held day is skipped', () => {
    const onAnimalShow = checkWorld({ calendarDays: 30, festivals: [{ id: 'harvest-cup', season: 'winter', day: 12 }] })
    expect(onAnimalShow.errors).toEqual(['Festival harvest-cup: Winter 12 holds another festival; its move is skipped, so it keeps the game’s day, Winter 28'])
    expect(festivalsOf({ world: onAnimalShow.value }).find((f) => f.id === 'harvest-cup')).toMatchObject({ season: 'winter', day: 28 })
    // Two swap their days: both moves stand.
    const swapped = checkWorld({ calendarDays: 30, festivals: [{ id: 'harvest-cup', day: 12 }, { id: 'animal-show', day: 28 }] })
    expect(swapped.errors).toEqual([])
    expect(festivalsOf({ world: swapped.value }).filter((f) => f.season === 'winter').map((f) => [f.id, f.day])).toEqual([['harvest-cup', 12], ['animal-show', 28]])
    // Two moved onto one free day: the first in the year keeps it.
    const both = checkWorld({ festivals: [{ id: 'fishing-derby', season: 'spring', day: 3 }, { id: 'flower-show', day: 3 }] })
    expect(both.errors).toEqual(['Festival fishing-derby: Spring 3 holds another festival; its move is skipped, so it keeps the game’s day, Summer 21'])
    // The story's own, on a game festival's day or another of its own.
    const own = checkWorld({ festivals: [{ id: 'moon-night', name: 'Moon Night', season: 'spring', day: 19 }, { id: 'kite-day', name: 'Kite Day', season: 'spring', day: 4 }, { id: 'sky-day', name: 'Sky Day', season: 'spring', day: 4 }] })
    expect(own.errors).toEqual(['Festival moon-night: Spring 19 holds another festival; skipped', 'Festival sky-day: Spring 4 holds another festival; skipped'])
    expect(own.value?.festivals?.map((f) => f.id)).toEqual(['kite-day'])
  })

  it('takes a festival trigger that names one of the story’s own festivals, and only one it holds', () => {
    const cast = { umas: [{ characterId: ONE, meet: { kind: 'festival', festival: 'lantern-walk' } }] }
    expect(checkCast(cast, { festivals: new Set(['lantern-walk']) }).value.umas[0]?.meet).toEqual({ kind: 'festival', festival: 'lantern-walk' })
    expect(checkCast(cast).errors).toEqual([`Uma 1 (${ONE}) meet: a festival is one of flower-show, fishing-derby, cooking-contest, animal-show, harvest-cup; skipped`])
    const read = readStoryPack({ ...STAND_IN_FILES, cast: { ...cast, umas: [...cast.umas] }, world: WORLD_FIXTURE })
    expect(read.errors).toEqual([])
    expect(read.pack.cast.umas[0]?.meet).toEqual({ kind: 'festival', festival: 'lantern-walk' })
    expect(read.files.world).toEqual(WORLD_FIXTURE)
  })

  it('notes a pack with no world, and reads a release’s world.json', async () => {
    expect(readStoryPack(STAND_IN_FILES).notes).toContain('world.json: no world yet, so the game’s own names, festivals, places and seasons play, and there are no Town notes')
    const files: Record<string, unknown> = { [storyFileName.cast]: STAND_IN_FILES.cast, [storyFileName.ties]: STAND_IN_FILES.ties, [storyFileName.world]: WORLD_FIXTURE }
    const entry = (name: string) => ({ path: `story/${name}.00000000.json`, bytes: 1, sha256: '0'.repeat(64) })
    const index: StoryIndex = { version: 1, release: '00000000', builtAt: AT, files: Object.fromEntries(Object.keys(files).map((n) => [n, entry(n)])), scripted: {}, pairs: {} }
    const pack = await releasedStoryPack(index, async (name) => files[name])
    expect(pack.world).toEqual(WORLD_FIXTURE)
    expect(festivalsOf(pack).map((f) => f.name)).toContain('Lantern Walk')
  })
})

describe('the world’s lookups: the pack’s, or the game’s own words', () => {
  it('names the town, the farm and the region, and gives the farm’s history', () => {
    expect(worldNamesOf(PACK)).toEqual({ town: 'Fernwick', farm: 'Thistle Farm', region: 'the Marrow Vale' })
    expect(historyOf(PACK)).toEqual(WORLD_FIXTURE.history)
    expect(worldNamesOf(noPack())).toEqual({ town: null, farm: null, region: null })
    expect(historyOf(null)).toEqual([])
    expect(PLACEHOLDER_NAMES).toEqual({ town: 'Town', farm: 'The farm' })
  })

  it('gives a place’s name and line, the Town named by the town', () => {
    expect(placeWordsOf(PACK, 'gate')).toEqual({ name: 'Gate', line: 'The old gate, latched at last.' })
    expect(placeWordsOf(PACK, 'fields')).toEqual({ name: 'Low Fields', line: 'Plant, tend and harvest crops.' })
    expect(placeNameOf(PACK, 'town')).toBe('Fernwick')
    expect(placeNameOf(withWorld({ names: { town: 'Fernwick' }, places: { town: { name: 'Fernwick Square' } } }), 'town')).toBe('Fernwick Square')
    expect(placeWordsOf(null, 'town')).toEqual({ name: 'Town', line: 'Who’s out at the town’s spots today, and everyone who lives there.' })
  })

  it('gives a season’s line, else none', () => {
    expect(seasonLineOf(PACK, 'spring')).toBe('The thaw runs off the hills.')
    expect(seasonLineOf(PACK, 'summer')).toBeNull()
    expect(seasonLineOf(noPack(), 'spring')).toBeNull()
  })

  it('marks what the world writes and what plays instead, for the sandbox', () => {
    expect(worldWrittenOf(PACK).map((p) => [p.part, p.written])).toEqual([
      ['The town’s name', true], ['The farm’s name', true], ['The region’s name', true], ['The farm’s history', true], ['The festivals', true],
      ['The story’s days', true], ['The places’ words', true], ['The seasons’ lines', true], ['Town notes', true],
    ])
    expect(worldWrittenOf(null).every((p) => !p.written)).toBe(true)
  })
})

describe('the story’s days', () => {
  it('reads its holidays and minor days: one day or a list, a season or every season, a kind and a line', () => {
    expect(storyDaysOf(PACK)).toEqual([
      { id: 'first-bell', name: 'The first bell', kind: 'holiday', season: 'spring', days: [1], line: 'The bell rings twelve times at midnight.', scene: 'first-bell' },
      { id: 'market-day', name: 'Market day', kind: 'minor', season: null, days: [4, 8, 12], line: 'Stalls fill the square.', scene: 'market-day' },
      { id: 'kite-day', name: 'Kite day', kind: 'minor', season: 'spring', days: [10], line: null, scene: 'kite-day' },
      // Then the game's own small days.
      ...GAME_STORY_DAYS,
    ])
    // Without the story's days, the game's own six.
    expect(storyDaysOf(null)).toEqual(GAME_STORY_DAYS)
    expect(storyDaysOf(withWorld({ names: { town: 'Fernwick' } }))).toEqual(GAME_STORY_DAYS)
    expect(GAME_STORY_DAYS.map((d) => [d.id, d.season, d.days[0], d.kind, d.scene === d.id])).toEqual([
      ['blossom-viewing', 'spring', 8, 'minor', true], ['wishing-night', 'summer', 9, 'minor', true], ['first-cold-evening', 'autumn', 8, 'minor', true],
      ['first-snow', 'winter', 4, 'minor', true], ['longest-night', 'winter', 17, 'minor', true], ['sweets-day', 'winter', 22, 'minor', true],
    ])
  })

  it('reads a day’s scene, its id without one; one that isn’t an event id is an error that drops it; one of its days moves a game’s day', () => {
    const read = checkWorld({ days: [{ id: 'lantern-day', name: 'Lantern day', day: 2, scene: 'sweets-day' }, { id: 'odd-day', name: 'Odd day', day: 3, scene: 'Not An Id' }] })
    expect(read.value?.days).toEqual([{ id: 'lantern-day', name: 'Lantern day', day: 2, scene: 'sweets-day' }, { id: 'odd-day', name: 'Odd day', day: 3 }])
    expect(read.errors).toEqual(['Day odd-day: scene is the event id it plays (lowercase words joined by -, at most 40 characters), so its id plays; skipped'])
    const moved = withWorld({ days: [{ id: 'first-snow', name: 'Snowfall', season: 'winter', day: 5, line: 'The valley goes quiet.' }] })
    expect(storyDaysOn(moved, day('winter', 2))).toEqual([])
    expect(storyDaysOn(moved, day('winter', 5))).toEqual([{ id: 'first-snow', name: 'Snowfall', kind: 'minor', season: 'winter', days: [5], line: 'The valley goes quiet.', scene: 'first-snow' }])
    expect(storyDaysOf(moved).filter((d) => d.id === 'first-snow')).toHaveLength(1)
  })

  it('finds a day’s, holidays first, and every season’s on each of its days', () => {
    expect(storyDaysOn(PACK, day('spring', 1)).map((d) => d.id)).toEqual(['first-bell'])
    expect(storyDaysOn(PACK, day('spring', 1, 2)).map((d) => d.id)).toEqual(['first-bell'])
    expect(storyDaysOn(PACK, day('summer', 1))).toEqual([])
    expect(storyDaysOn(PACK, day('autumn', 8)).map((d) => d.id)).toEqual(['market-day', 'first-cold-evening'])
    // A minor day may share a festival's day: it's the story's own custom.
    expect(storyDaysOn(PACK, day('spring', 10)).map((d) => d.id)).toEqual(['kite-day'])
    expect(storyDayNameOf(PACK, 'market-day')).toBe('Market day')
    expect(storyDayNameOf(PACK, 'gone')).toBeNull()
  })

  it('skips a day with an error in its id, name or day, and drops a kind, season or line with one', () => {
    const long = 'x'.repeat(LINE_LIMITS.worldLine + 1)
    const read = checkWorld({
      days: [
        { id: 'Bad Id', name: 'Nope', day: 2 },
        { id: 'no-name', day: 2 },
        { id: 'no-day', name: 'No day' },
        { id: 'zero', name: 'Zero', day: 0 },
        { id: 'twice-listed', name: 'Twice', day: [3, 3] },
        { id: 'loose', name: 'Loose', kind: 'party', season: 'monsoon', day: [2, 5], line: long },
        { id: 'loose', name: 'Again', day: 6 },
      ],
    })
    expect(read.value?.days).toEqual([{ id: 'loose', name: 'Loose', day: [2, 5] }])
    expect(read.errors).toEqual([
      'Day 1: no id (lowercase words joined by -, at most 40 characters); skipped',
      'Day no-name: no name; the day is skipped',
      'Day no-day: day is a day of the season, 1–30, or a list of different ones; the day is skipped',
      'Day zero: day is a day of the season, 1–30, or a list of different ones; the day is skipped',
      'Day twice-listed: day is a day of the season, 1–30, or a list of different ones; the day is skipped',
      'Day loose: kind is one of holiday, minor; skipped',
      'Day loose: season is one of spring, summer, autumn, winter; skipped',
      `Day loose line: its line is ${long.length} characters; the screen shows ${LINE_LIMITS.worldLine}; skipped`,
      'Day loose: listed twice; the later one is skipped',
    ])
    expect(checkWorld({ days: 'every day' }).errors).toEqual(['days is a list; skipped'])
  })
})

describe('the year’s festivals from the story', () => {
  const year = festivalsOf(PACK)

  it('renames, moves and adds festivals, in the year’s order, each of the game’s keeping its rule', () => {
    expect(year.map((f) => [f.id, f.name, f.season, f.day, f.rule])).toEqual([
      ['flower-show', 'Bloom Fair', 'spring', 19, 'flower-show'],
      ['lantern-walk', 'Lantern Walk', 'summer', 4, null],
      ['fishing-derby', 'Fishing Derby', 'summer', 21, 'fishing-derby'],
      ['cooking-contest', 'Cooking Contest', 'autumn', 22, 'cooking-contest'],
      ['harvest-cup', 'The Long Run', 'winter', 11, 'harvest-cup'],
      ['animal-show', 'Animal Show', 'winter', 12, 'animal-show'],
    ])
    expect(festivalsOf(noPack())).toBe(FESTIVALS)
    expect(festivalsOf(PACK)).toBe(year)
    expect(festivalNameOf(year, 'harvest-cup')).toBe('The Long Run')
    expect(festivalNameOf(FESTIVALS, 'lantern-walk')).toBe('A festival')
  })

  it('falls on the story’s days: the moved one on its new day, never its old, every year', () => {
    expect(festivalOn(day('winter', 11), year)).toMatchObject({ id: 'harvest-cup', name: 'The Long Run' })
    expect(festivalOn(day('winter', 28), year)).toBeNull()
    expect(festivalOn(day('summer', 4, 3), year)?.id).toBe('lantern-walk')
    expect(nextFestival(day('summer', 1), year)).toMatchObject({ festival: { id: 'lantern-walk' }, inDays: 3 })
    expect(nextFestival(day('winter', 13), year)).toMatchObject({ festival: { id: 'flower-show' }, day: day('spring', 19, 2) })
    // Without the story, the game's own.
    expect(festivalOn(day('winter', 28))?.id).toBe('harvest-cup')
  })

  it('opens festival night, holds a festival trigger and a chapter’s gate on the story’s day', () => {
    const cup = farm(day('winter', 11))
    expect(eveningSlots(cup, year).festival?.id).toBe('harvest-cup')
    expect(eveningSlots({ ...cup, calendar: { day: day('winter', 28) } }, year).festival).toBeNull()
    expect(eveningSlots(farm(day('summer', 4)), year).festival?.name).toBe('Lantern Walk')
    const talk = { at: 'town', place: 'cafe' } as const
    expect(triggerHolds(cup, { kind: 'festival', festival: 'harvest-cup' }, 1, talk, year)).toBe(true)
    expect(triggerHolds(cup, { kind: 'festival', festival: 'harvest-cup' }, 1, talk)).toBe(false)
    expect(gateHolds(farm(day('summer', 4)), { kind: 'festival', festival: 'lantern-walk' }, year)).toBe(true)
    expect(gateWords({ kind: 'festival', festival: 'harvest-cup' }, undefined, year)).toBe('Opens on The Long Run')
    expect(gateWords({ kind: 'festival', festival: 'lantern-walk' }, undefined, year)).toBe('Opens on the Lantern Walk')
  })

  it('says the story’s festival in the morning, today and tomorrow', () => {
    const morning = runNight(farm(day('summer', 3)), { story: PACK })
    expect(morning.summary!.news).toContainEqual({ kind: 'festival', festival: 'lantern-walk', when: 'today' })
    const eve = runNight(farm(day('winter', 9)), { story: PACK })
    expect(eve.summary!.news).toContainEqual({ kind: 'festival', festival: 'harvest-cup', when: 'tomorrow' })
    expect(parseSaveV6(json(eve))).toEqual(eve)
  })
})

describe('Town notes', () => {
  it('lists the notes you know: those with no unlock from the start, the rest once unlocked', () => {
    expect(townNotesOf(PACK).map((n) => n.id)).toEqual(['old-well', 'first-friend', 'cafe-window', 'lanterns', 'the-mill'])
    expect(knownNotes(farm(), PACK).map((n) => n.id)).toEqual(['old-well'])
    const s = farm()
    expect(knownNotes({ diary: { ...s.diary, notes: ['the-mill', 'cafe-window'] } }, PACK).map((n) => n.id)).toEqual(['old-well', 'cafe-window', 'the-mill'])
    expect(knownNotes(farm(), null)).toEqual([])
  })

  it('unlocks a spot’s note on a talk or an introduction there, and nowhere else', () => {
    const s = farm()
    expect(unlockNotes(s, PACK, { at: 'town', place: 'plaza' })).toEqual({ save: s, unlocked: [] })
    expect(unlockNotes(s, PACK, { at: 'night' }).unlocked).toEqual([])
    const talked = unlockNotes(s, PACK, { at: 'town', place: 'cafe' })
    expect(talked.unlocked).toEqual(['cafe-window'])
    expect(talked.save.diary.notes).toEqual(['cafe-window'])
    // Once, and it stays.
    expect(unlockNotes(talked.save, PACK, { at: 'town', place: 'cafe' })).toEqual({ save: talked.save, unlocked: [] })
  })

  it('checks each kind as meeting her does: a season or a festival on its days, the farm’s kinds any time', () => {
    const year = festivalsOf(PACK)
    const s = farm(day('summer', 4))
    expect(noteHolds(s, { kind: 'festival', festival: 'lantern-walk' }, { at: 'night' }, year)).toBe(true)
    expect(noteHolds(s, { kind: 'season', season: 'summer' }, { at: 'town', place: 'plaza' }, year)).toBe(true)
    expect(noteHolds(s, { kind: 'season', season: 'winter' }, { at: 'night' }, year)).toBe(false)
    expect(noteHolds(s, { kind: 'built', place: 'mill' }, { at: 'night' }, year)).toBe(false)
    expect(noteHolds({ ...s, buildings: { ...s.buildings, mill: 1 } }, { kind: 'built', place: 'mill' }, { at: 'town', place: 'plaza' }, year)).toBe(true)
    expect(noteHolds(s, { kind: 'talks', days: 1 }, { at: 'town', place: 'cafe' }, year)).toBe(false)
  })

  it('unlocks at night on meeting someone, and the morning names it; the save keeps its id and loads again', () => {
    const met = meet(farm(4), ONE, PACK).save
    const welcomed: SaveV4 = { ...met, arrivals: [ONE] }
    const morning = runNight(welcomed, { story: PACK })
    expect(morning.diary.notes).toEqual(['first-friend'])
    expect(morning.summary!.news).toContainEqual({ kind: 'notes', ids: ['first-friend'] })
    expect(parseSaveV6(json(morning))).toEqual(morning)
    // The next night names nothing new.
    const next: SaveV4 = { ...morning, summary: null }
    expect(runNight(next, { story: PACK }).summary!.news.some((n) => n.kind === 'notes')).toBe(false)
  })

  it('unlocks on the story’s festival morning, and a night without the pack unlocks none', () => {
    const eve = farm(day('summer', 3))
    expect(runNight(eve, { story: PACK }).diary.notes).toEqual(['lanterns'])
    expect(runNight(eve, {}).diary.notes).toEqual([])
    expect(dateOf(runNight(eve, { story: PACK }).calendar.day)).toEqual({ year: 1, season: 'summer', day: 4 })
  })

  it('loads an older v4 with no notes in its Diary, never moving its updatedAt', () => {
    const older = json(farm()) as unknown as { diary: Record<string, unknown>; account: { updatedAt: string } }
    delete older.diary.notes
    const read = parseSaveV6(older)
    expect(read.diary.notes).toEqual([])
    expect(read.account.updatedAt).toBe(older.account.updatedAt)
    expect(() => parseSaveV6({ ...json(farm()), diary: { ...farm().diary, notes: ['Not An Id'] } })).toThrow()
  })
})

describe('a world that names nothing plays as before', () => {
  it('keeps the game’s five festivals, its places’ words, no season lines and no notes', () => {
    const plain = withWorld({} satisfies World)
    expect(festivalsOf(plain)).toBe(FESTIVALS)
    expect(placeWordsOf(plain, 'gate').line).toBe('The farm’s gate. Everyone you meet lives in town.')
    expect(seasonLineOf(plain, 'spring')).toBeNull()
    expect(townNotesOf(plain)).toEqual([])
  })
})
