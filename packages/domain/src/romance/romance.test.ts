// The authored start: the stand-in pack read and validated,
// the opening three joining when the opening is read, authored arrivals at night step 8 and with chapter 1, her arrival
// scene's +50 and choice, her favourite line and tastes from the pack, and the farmer's name. Invented ids only: the
// stand-ins 9000001–9000003, and casts of 9000004 onward built here. Nothing is drawn: every Uma is the cast's.
import { describe, expect, it } from 'vitest'

const { TALENT_D } = await import('../farm/talents')
const { endDay, NIGHT_STEPS, runNight } = await import('../night/end-day')
const { TEST_KINDS } = await import('../night/kinds.fixture')
const { GOLD_SHIPPED } = await import('../save/bin')
const { newSave } = await import('../save/v4')
const { parseSaveV4 } = await import('../save/parse-v4')
const { checkCast, checkBible, checkRoute, RUNGS } = await import('../story/authored')
const { STAND_IN_BIBLE, STAND_IN_CAST, STAND_INS } = await import('../story/authored.fixture')
const { readScene, sceneDue } = await import('../story/scenes')
const { readStoryPack, storyPackFrom } = await import('../story/pack')
const { favouriteOf, linePlaces, openingOf, outfitOf, placeholderEvent, tasteOf } = await import('../story/placeholders')
const { STAND_IN_FILES } = await import('../story/stand-in')
const { arrive, arrivalsTonight, festivalArrivalDay, joinOpening, nextArrivals } = await import('./arrivals')
const { choicePoints, finishArrival, pathFlags, sceneSteps } = await import('./love')
const { cleanFarmerName, farmerNameIssue, nameFarmer, withFarmer } = await import('./farmer')

type SaveV4 = import('../save/v4').SaveV4
type Cast = import('../story/authored').Cast
type CastEntry = import('../story/authored').CastEntry
type StoryPack = import('../story/pack').StoryPack

const AT = '2026-11-11T10:00:00.000Z'
const LATER = '2026-11-11T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PACK = storyPackFrom(STAND_IN_FILES)

/** A pack whose cast is the stand-ins plus `more` (invented ids 9000004 onward), no bibles but the stand-in's. */
function packWith(...more: Omit<CastEntry, 'paragraph' | 'outfitId'>[]): StoryPack {
  const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, ...more.map((u) => ({ ...u, outfitId: `${u.characterId}01`, paragraph: 'Invented.' }))] }
  return { ...PACK, cast }
}
const context = (story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK) => ({ kinds: TEST_KINDS, story })
/** A named farm on `day`, the opening read and the stand-ins home., their ties seeded and
 * already listed on an earlier morning, so a night's Hearts show only its own lines. */
function farm(day = 2): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}

describe('the stand-in pack', () => {
  it('validates, its forager\'s and fisher\'s routes partial, and names every outfit', () => {
    expect(PACK.cast.opening).toEqual([...STAND_INS])
    expect([...PACK.bibles.keys()]).toEqual(['9000001'])
    expect([...PACK.scripted.get('9000001')!]).toEqual(RUNGS)
    expect([...PACK.scripted.get('9000002')!]).toEqual(['arrival'])
    expect(STAND_INS.map((id) => outfitOf(PACK, id))).toEqual(['900000101', '900000201', '900000301'])
    // Off the pack (someone the cast doesn't hold, or no pack): its own id.
    expect(outfitOf(PACK, '1001')).toBe('1001')
    expect(outfitOf(null, '9000001')).toBe('9000001')
  })

  it('reads a cast with no outfit, a bible with no arrival rung, and an arrival with a play and two choices, with notes only', () => {
    const ctx = { umas: new Set(STAND_INS) }
    const cast = json(STAND_IN_CAST) as unknown as { umas: { outfitId?: string | null }[] }
    cast.umas[1]!.outfitId = null
    const readCast = checkCast(cast)
    expect(readCast.errors).toEqual([])
    expect(readCast.notes).toEqual(['Uma 2 (9000002): no outfit, so she plays her default outfit from master data'])
    expect(outfitOf({ cast: readCast.value }, '9000002')).toBe('9000002')
    const bible = json(STAND_IN_BIBLE)
    bible.route = bible.route!.filter((b) => b.id !== 'arrival')
    expect(checkBible(bible, '9000001', ctx)).toMatchObject({ errors: [], notes: [] })
    const played = { characterId: '9000002', events: [{ id: 'arrival', steps: [
      { narrate: 'Hi.' }, { play: { game: 'walk', prompt: 'Walk' } },
      { choice: [{ text: 'A.', tone: 'warm', friendship: 10 }, { text: 'B.', tone: 'warm', friendship: 5, then: [{ choice: [{ text: 'C.', tone: 'warm', friendship: 5 }, { text: 'D.', tone: 'honest' }] }] }] },
    ] }] }
    expect(checkRoute(played, '9000002', null, ctx)).toMatchObject({ errors: [], notes: [
      'Event arrival: 2 choice points; only the first pays', 'Event arrival: an arrival plays no play; it shows as a pause',
    ] })
    const read = readStoryPack({ ...STAND_IN_FILES, routes: { ...STAND_IN_FILES.routes, 9000002: played } })
    expect(read.errors).toEqual([])
    expect([...read.pack.scripted.get('9000002')!]).toEqual(['arrival'])
  })

  it('takes a partial route, and lists nothing missing as a problem', () => {
    const route = json(STAND_IN_FILES.routes['9000001']) as { characterId: string; events: { id: string }[] }
    route.events = route.events.filter((e) => e.id !== 'wedding')
    expect(checkRoute(route, '9000001', STAND_IN_BIBLE, { umas: new Set(STAND_INS) })).toMatchObject({ errors: [], notes: [] })
  })
})

describe('an open opening', () => {
  const cast = (more: Partial<Cast>): Cast => ({ ...json(STAND_IN_CAST), ...more })
  it('brings the cast\'s opening in its order, any number; else who arrives at it; else the welcome list', () => {
    expect(openingOf(PACK)).toEqual([...STAND_INS])
    expect(openingOf({ cast: cast({ opening: ['9000003', '9000001'] }) })).toEqual(['9000003', '9000001'])
    const { opening: _opening, ...without } = json(STAND_IN_CAST)
    expect(openingOf({ cast: { ...without, umas: without.umas.map((u, i) => (i === 1 ? u : { ...u, arrives: { kind: 'beds' as const, dormLevel: 4 } })) } })).toEqual(['9000002'])
    expect(openingOf({ cast: { ...without, umas: without.umas.map(({ arrives: _a, ...u }) => u) } })).toEqual([...STAND_INS])
    expect(openingOf({ cast: { ...without, umas: without.umas.map(({ arrives: _a, ...u }) => u), welcome: ['9000002'] } })).toEqual(['9000002'])
    expect(openingOf({ cast: cast({ opening: [] }) })).toEqual([])
  })

  it('joins any number at the opening, the rest away when the beds are full; and nobody joins an empty one', () => {
    // No opening and no arrivals: the welcome list, the first five, comes up the road.
    const umas = [...json(STAND_IN_CAST).umas.map(({ arrives: _a, ...u }) => u), ...['9000004', '9000005', '9000006'].map((characterId) => ({ characterId }))]
    const five: StoryPack = { ...PACK, cast: { umas } }
    const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' } }
    const read = joinOpening(readScene(fresh, 'scene:1:open'), five)
    expect(Object.keys(read.roster)).toEqual([...STAND_INS, '9000004', '9000005'])
    expect(read.dorm.home).toEqual([...STAND_INS])
    expect(parseSaveV4(json(read))).toEqual(read)
    const none = joinOpening(readScene(fresh, 'scene:1:open'), { ...PACK, cast: cast({ opening: [] }) })
    expect(Object.keys(none.roster)).toEqual([])
    // A cast Uma with no arrival waits off the farm; the night passes her by.
    expect(read.roster['9000006']).toBeUndefined()
    expect(arrivalsTonight(read, five).arrived).toEqual([])
  })

  it('an arrival written with no choice pays +50 alone', () => {
    const save = farm(1)
    expect(finishArrival(save, '9000002', { choice: 0, flags: [] }).love['9000002']!.points).toBe(50)
  })
})

describe('the opening and arrivals', () => {
  it('reading the opening joins the opening three home, once, each at Friendship 0', () => {
    const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' } }
    expect(sceneDue(fresh)).toBe('scene:1:open')
    expect(sceneDue({ ...fresh, farmer: { name: '' } })).toBeNull()
    const read = joinOpening(readScene(fresh, 'scene:1:open'), PACK)
    expect(Object.keys(read.roster)).toEqual([...STAND_INS])
    expect(read.dorm.home).toEqual([...STAND_INS])
    expect(read.love['9000002']).toEqual({ stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] })
    expect(joinOpening(read, PACK)).toBe(read)
    expect(read.account.updatedAt).toBe(AT)
    expect(parseSaveV4(json(read))).toEqual(read)
  })

  it('plays the arrival scenes in the cast\'s order, after the opening, once the summary is put away', () => {
    const save = farm(1)
    expect(sceneDue(save, PACK.cast.opening)).toBe('arrival:9000001')
    const first = finishArrival(save, '9000001', { choice: 30, flags: [] })
    expect(sceneDue(first, PACK.cast.opening)).toBe('arrival:9000002')
    expect(sceneDue({ ...first, summary: { day: 1, bin: [], work: [], ranks: [], hearts: [], news: [], nudges: [] } }, PACK.cast.opening)).toBeNull()
  })

  it('joins a festival\'s Uma the morning of its day, a beds Uma the morning its level takes effect, and an event\'s the morning after', () => {
    const pack = packWith(
      { characterId: '9000004', arrives: { kind: 'festival', festival: 'flower-show' }, calling: 'foraging' },
      { characterId: '9000005', arrives: { kind: 'beds', dormLevel: 4 }, calling: 'mining' },
      { characterId: '9000006', arrives: { kind: 'event', after: '9000001:f1' }, calling: 'quarry' },
    )
    const flower = festivalArrivalDay('flower-show')
    expect(flower).toBe(10)
    // The night before the Flower Show: the morning is its day.
    const eve = runNight(farm(flower - 1), context(pack))
    expect(eve.calendar.day).toBe(flower)
    expect(eve.roster['9000004']).toMatchObject({ joined: flower })
    expect(eve.summary!.hearts).toEqual([{ kind: 'arrived', id: '9000004', home: false }])
    expect(runNight(farm(flower - 2), context(pack)).roster['9000004']).toBeUndefined()
    // The Dorm's level 4 bought today takes effect tonight: she comes, home, into a free bed.
    const bought: SaveV4 = { ...farm(5), buildings: { dorm: 4 } }
    const beds = runNight(bought, context(pack))
    expect(beds.dorm.level).toBe(4)
    expect(beds.roster['9000005']).toBeDefined()
    expect(beds.dorm.home).toContain('9000005')
    expect(runNight({ ...farm(5), buildings: { dorm: 3 } }, context(pack)).roster['9000005']).toBeUndefined()
    // The morning after her named event plays.
    const played: SaveV4 = { ...farm(5), memories: { 9000001: ['arrival', 'f1'] } }
    expect(runNight(played, context(pack)).roster['9000006']).toBeDefined()
    expect(runNight({ ...farm(5), memories: { 9000002: ['f1'] } }, context(pack)).roster['9000006']).toBeUndefined()
  })

  it('with no bed free she joins away; each joins once; a later wave\'s past trigger arrives the next night', () => {
    const pack = packWith({ characterId: '9000004', arrives: { kind: 'festival', festival: 'flower-show' }, calling: 'fishing' })
    const late = runNight(farm(30), context(pack))
    expect(late.roster['9000004']).toMatchObject({ joined: 31 })
    expect(late.dorm.home).not.toContain('9000004')
    expect(late.summary!.hearts).toEqual([{ kind: 'arrived', id: '9000004', home: false }])
    expect(late.love['9000004']).toMatchObject({ stage: 'friendship', points: 0 })
    const again = runNight(late, context(pack))
    expect(again.summary!.hearts).toEqual([])
    expect(arrivalsTonight(again, pack).arrived).toEqual([])
    expect(() => arrive(again, '9000004')).toThrow('She’s on the roster already.')
  })

  it('runs arriveUmas after the Dorm settles, and twelve nights bring nobody the cast doesn\'t name', () => {
    let save = farm(1)
    for (let i = 0; i < 12; i++) save = endDay(save, context(), LATER)
    expect(save.calendar.day).toBe(13)
    expect(Object.keys(save.roster).sort()).toEqual([...STAND_INS])
    const names = NIGHT_STEPS.map((s) => s.name)
    expect(names.indexOf('arriveUmas')).toBe(names.indexOf('settleDorm') + 1)
    expect(parseSaveV4(json(save))).toEqual(save)
  })

  it('names what brings the next arrivals, never who', () => {
    const pack = packWith(
      { characterId: '9000004', arrives: { kind: 'festival', festival: 'fishing-derby' }, calling: 'fishing' },
      { characterId: '9000005', arrives: { kind: 'beds', dormLevel: 5 }, calling: 'mining' },
      { characterId: '9000006', arrives: { kind: 'beds', dormLevel: 4 }, calling: 'farming' },
      { characterId: '9000007', arrives: { kind: 'event', after: 'r1' }, calling: 'foraging' },
      { characterId: '9000008', arrives: { kind: 'festival', festival: 'flower-show' }, calling: 'fishing' },
    )
    expect(nextArrivals(farm(), pack)).toEqual([{ kind: 'beds', dormLevel: 4 }, { kind: 'festival', festival: 'flower-show' }, { kind: 'event', after: 'r1' }])
    expect(nextArrivals(farm(), PACK)).toEqual([])
  })
})

describe('her arrival scene', () => {
  const route = STAND_IN_FILES.routes['9000002'] as { events: { steps: import('../story/authored').Step[] }[] }
  const steps = route.events[0]!.steps

  it('pays +30 for the best option and +10 for another; a tie at the top pays +30', () => {
    expect(choicePoints([{ friendship: 20 }, { friendship: 15 }, { friendship: 5 }])).toEqual([30, 10, 10])
    expect(choicePoints([{ friendship: 20 }, { friendship: 10, romance: 10 }, {}])).toEqual([30, 30, 10])
  })

  it('stops at the choice (Skip lands there), then plays the option\'s `then`', () => {
    const shown = sceneSteps(steps, [])
    expect(shown.at(-1)).toHaveProperty('choice')
    expect(shown.filter((s) => 'choice' in s)).toHaveLength(1)
    expect(sceneSteps(steps, [1]).at(-1)).toEqual({ say: '9000002', line: 'Deal. I know where the mushrooms hide.', emote: 'happy' })
    const one = (STAND_IN_FILES.routes['9000001'] as { events: { id: string; steps: import('../story/authored').Step[] }[] }).events[0]!
    expect(pathFlags(sceneSteps(one.steps, [0]))).toEqual(['first-row'])
    expect(sceneSteps(placeholderEvent('9000004', 'arrival'), []).at(-1)).toHaveProperty('choice')
  })

  it('pays +50 and its choice into her bar, once, with its flags, and stamps nothing', () => {
    const save = farm(1)
    const done = finishArrival(save, '9000001', { choice: 30, flags: ['first-row'] })
    expect(done.love['9000001']).toMatchObject({ points: 80, flags: ['first-row'] })
    expect(done.arrivals).toEqual(['9000001'])
    expect(finishArrival(done, '9000001', { choice: 30, flags: [] })).toBe(done)
    expect(finishArrival(save, '9000002', { choice: 10, flags: [] }).love['9000002']!.points).toBe(60)
    expect(() => finishArrival(save, '9000002', { choice: 20, flags: [] })).toThrow('An arrival’s choice pays +10 or +30.')
    expect(() => finishArrival(save, '9000009', { choice: 10, flags: [] })).toThrow('She isn’t on the farm.')
    expect(done.account.updatedAt).toBe(save.account.updatedAt)
    expect(parseSaveV4(json(done))).toEqual(done)
  })
})

describe('her favourite line and tastes', () => {
  it('reads the bible, else the calling; quarry is mining at the Quarry', () => {
    const pack = packWith({ characterId: '9000004', arrives: { kind: 'beds', dormLevel: 6 }, calling: 'quarry' }, { characterId: '9000005', arrives: { kind: 'beds', dormLevel: 7 }, calling: 'mining' })
    expect(favouriteOf(pack, '9000001')).toBe('farming')
    expect(favouriteOf(pack, '9000002')).toBe('foraging')
    expect(favouriteOf(pack, '9000004')).toBe('mining')
    expect(linePlaces(pack, '9000004')).toEqual(['quarry', 'cutter'])
    expect(linePlaces(pack, '9000005')).toEqual(['mine', 'smelter'])
    expect(linePlaces(pack, '9000003')).toEqual(['fishery', 'smokehouse'])
    expect(linePlaces(pack, '9000001')).toEqual(['fields'])
    const bible = { ...STAND_IN_BIBLE, favouriteLine: 'cooking' as const }
    expect(favouriteOf({ ...pack, bibles: new Map([['9000001', bible]]) }, '9000001')).toBe('cooking')
    expect(linePlaces({ ...pack, bibles: new Map([['9000001', bible]]) }, '9000001')).toEqual(['kitchen'])
  })

  it('pays ×1.2 rank points in her favourite line at night', () => {
    const save = farm(2)
    const tended: SaveV4 = { ...save, fields: { blocks: [{ ...save.fields.blocks[0]!, tender: '9000001', plots: save.fields.blocks[0]!.plots.map((p) => ({ ...p, crop: 'carrot' as const })) }] } }
    const both: SaveV4 = { ...tended, fields: { blocks: [tended.fields.blocks[0]!] } }
    const morning = runNight(both, { kinds: TEST_KINDS, story: PACK, talentOf: () => TALENT_D })
    expect(morning.roster['9000001']!.ranks.farming.points).toBe(12)
    const noFavourite = runNight(both, { kinds: TEST_KINDS, talentOf: () => TALENT_D })
    expect(noFavourite.roster['9000001']!.ranks.farming.points).toBe(10)
    const tender2: SaveV4 = { ...both, fields: { blocks: [{ ...both.fields.blocks[0]!, tender: '9000002' }] } }
    expect(runNight(tender2, { kinds: TEST_KINDS, story: PACK, talentOf: () => TALENT_D }).roster['9000002']!.ranks.farming.points).toBe(10)
  })

  it('loved, liked and disliked by the bible, the rest neutral, a proposed good neutral until it exists', () => {
    expect(tasteOf(PACK, '9000001', 'golden-carrot')).toBe('loved')
    expect(tasteOf(PACK, '9000001', 'potato')).toBe('liked')
    expect(tasteOf(PACK, '9000001', 'iron-ore')).toBe('disliked')
    expect(tasteOf(PACK, '9000001', 'pine-log')).toBe('neutral')
    expect(tasteOf(PACK, '9000002', 'golden-carrot')).toBe('neutral')
    const proposed = { ...STAND_IN_BIBLE, gifts: { ...STAND_IN_BIBLE.gifts, loved: 'moon-cake', proposed: ['moon-cake'] } }
    const pack = { ...PACK, bibles: new Map([['9000001', proposed]]) }
    expect(tasteOf(pack, '9000001', 'moon-cake')).toBe('neutral')
    expect(tasteOf(pack, '9000001', 'moon-cake', (id) => id === 'moon-cake')).toBe('loved')
  })
})

describe('the farmer\'s name', () => {
  it('takes letters of any script, spaces, apostrophes and hyphens, 1–16 after trimming', () => {
    expect(farmerNameIssue('Sixteen Letters!')).toBe('Letters, spaces, \' and - only')
    expect(farmerNameIssue('A'.repeat(16))).toBeNull()
    expect(farmerNameIssue('A'.repeat(17))).toBe('16 characters at most')
    expect(farmerNameIssue('   ')).toBe('Enter a name')
    expect(farmerNameIssue("O'Neil-Brook")).toBeNull()
    expect(farmerNameIssue('D’Arcy')).toBeNull()
    expect(farmerNameIssue('Ána María')).toBeNull()
    expect(farmerNameIssue('さくら')).toBeNull()
    expect(farmerNameIssue('Robin2')).toBe('Letters, spaces, \' and - only')
    expect(farmerNameIssue("-'")).toBe('Enter a name')
    expect(cleanFarmerName('  Robin   of   Lea  ')).toBe('Robin of Lea')
    expect(farmerNameIssue('  ' + 'A'.repeat(16) + '  ')).toBeNull()
  })

  it('is stored clean, refused with the sheet\'s words, and fills {farmer}', () => {
    const save = newSave('u1', AT)
    expect(nameFarmer(save, '  Robin   Lea ').farmer.name).toBe('Robin Lea')
    expect(() => nameFarmer(save, 'R2')).toThrow('Letters, spaces, \' and - only')
    expect(withFarmer('Hello, {farmer}.', 'Robin')).toBe('Hello, Robin.')
    expect(parseSaveV4(json(nameFarmer(save, 'さくら'))).farmer.name).toBe('さくら')
  })
})
