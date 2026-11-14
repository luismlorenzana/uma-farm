// The story's one reader, on the invented stand-in only: errors are only what the game can't read, each skipping the part
// it's in; everything else is a note.
import { describe, expect, it } from 'vitest'
import {
  bibleTagNotes, checkBible, checkCast, checkPair, checkRoute, checkTies, eventNotes, LINE_LIMITS, RUNGS, stepFindings, tagNotes, type StoryContext, type TagEntry,
} from './authored'
import { STAND_IN, STAND_IN_BIBLE, STAND_IN_CAST, STAND_IN_PAIR, STAND_IN_ROUTE, STAND_IN_TIES, STAND_INS } from './authored.fixture'

const ctx: StoryContext = { umas: new Set(STAND_INS) }
const clone = <T>(v: T): T => structuredClone(v)
const speakers = new Set<string>([STAND_IN, 'hollis-pryor'])
const clean = { errors: [], notes: [] }

describe('the stand-in story reads clean', () => {
  it('every file, with nothing skipped and nothing noted', () => {
    expect(checkCast(STAND_IN_CAST)).toMatchObject(clean)
    expect(checkTies(STAND_IN_TIES, ctx)).toMatchObject(clean)
    expect(checkBible(STAND_IN_BIBLE, STAND_IN, ctx)).toMatchObject(clean)
    expect(checkRoute(STAND_IN_ROUTE, STAND_IN, STAND_IN_BIBLE, ctx)).toMatchObject(clean)
    expect(checkPair(STAND_IN_PAIR, ctx)).toMatchObject(clean)
  })
  it('reads each file as it is: nothing changes a clean file', () => {
    expect(checkCast(STAND_IN_CAST).value).toEqual(STAND_IN_CAST)
    expect(checkBible(STAND_IN_BIBLE, STAND_IN, ctx).value).toEqual(STAND_IN_BIBLE)
    expect(checkRoute(STAND_IN_ROUTE, STAND_IN, STAND_IN_BIBLE, ctx).value).toEqual(STAND_IN_ROUTE)
  })
  it('the game plays an event at 27 rungs: her arrival first, ending on the spouse ladder', () => {
    expect(RUNGS).toHaveLength(27)
    expect(RUNGS[0]).toBe('arrival')
    expect(RUNGS.slice(-4)).toEqual(['wedding', 's1', 's3', 's5'])
  })
})

describe('the cast', () => {
  it('needs only a character id: any number of characters, in any order, with no fixed few', () => {
    const read = checkCast({ umas: [{ characterId: '9000003' }, { characterId: '9000001' }] })
    expect(read.errors).toEqual([])
    expect(read.value.umas).toEqual([{ characterId: '9000003' }, { characterId: '9000001' }])
    expect(read.notes).toEqual(['Uma 1 (9000003): no outfit, so she plays her default outfit from master data', 'Uma 2 (9000001): no outfit, so she plays her default outfit from master data'])
    expect(checkCast({ umas: [] })).toMatchObject(clean)
    expect(checkCast(undefined)).toMatchObject({ value: { umas: [] }, errors: [], notes: ['No cast: the pack holds no characters'] })
  })
  it('notes an opening list or an arrival of any kind, which meeting her replaced, and drops them', () => {
    const cast = clone(STAND_IN_CAST) as unknown as { opening?: string[]; umas: Record<string, unknown>[] }
    cast.opening = ['9000002', '9000001']
    cast.umas[1]!.arrives = { kind: 'opening' }
    cast.umas[2]!.arrives = { kind: 'festival', festival: 'moon-dance' }
    const read = checkCast(cast)
    expect(read.errors).toEqual([])
    expect(read.notes).toEqual([
      'Uma 2 (9000002): arrives is retired: her meet says how you meet her, so it’s dropped',
      'Uma 3 (9000003): arrives is retired: her meet says how you meet her, so it’s dropped',
      'opening: the opening brings nobody: the welcome list visits the Gate, one a morning, so the list is dropped',
    ])
    expect(read.value).not.toHaveProperty('opening')
    expect(read.value.umas[1]).not.toHaveProperty('arrives')
    expect(read.value.umas[2]).not.toHaveProperty('arrives')
  })
  it('skips only the character it can\'t read; a broken field skips that field', () => {
    const cast = clone(STAND_IN_CAST) as unknown as { umas: Record<string, unknown>[] }
    cast.umas.push({ characterId: 'Nine' }, { characterId: '9000001', calling: 'farming' })
    cast.umas[1]!.calling = 'juggling'
    cast.umas[2]!.spot = 'moon'
    const read = checkCast(cast)
    expect(read.errors).toEqual([
      'Uma 2 (9000002): calling is one of farming, foraging, fishing, mining, quarry; skipped',
      'Uma 3 (9000003): spot is one of the town’s spots: plaza, market, cafe, harbour, library, track; skipped',
      'Uma 4: no characterId (master data’s id, a positive integer, or a sister’s s<outfitId>); skipped',
      'Uma 5 (9000001): listed twice; the later one is skipped',
    ])
    expect(read.value.umas.map((u) => u.characterId)).toEqual([...STAND_INS])
    expect(read.value.umas[1]).not.toHaveProperty('calling')
    expect(read.value.umas[1]!.outfitId).toBe('900000201')
    expect(read.value.umas[2]).not.toHaveProperty('spot')
  })
  it('keeps the fields the game doesn\'t read, for the story', () => {
    const cast = { ...clone(STAND_IN_CAST), mood: 'sunny', umas: [{ characterId: '9000001', voice: 'low', paragraph: 'Hers.' }] }
    expect(checkCast(cast).value).toEqual(cast)
  })
  it('notes a welcome id that isn\'t in the cast, and a character outside the Studio export', () => {
    const read = checkCast({ ...clone(STAND_IN_CAST), welcome: ['9000002', '9000009', '9000002', 'x'] }, { exported: new Set(['9000001', '9000002']) })
    expect(read.errors).toEqual(['welcome 4: x isn’t one of character ids; skipped'])
    expect(read.notes).toEqual([
      'Uma 3 (9000003): not in the Studio export',
      'welcome: 9000002 is listed twice; once is kept',
      'welcome: 9000009 isn’t in the cast; she has no cast entry yet',
    ])
    expect(read.value.welcome).toEqual(['9000002', '9000009'])
  })
})

describe('the menu: her trigger to meet and her chapters', () => {
  const entry = (more: Record<string, unknown>) => checkCast({ umas: [{ characterId: '9000001', outfitId: '900000101', ...more }] })
  it('reads every trigger on the menu', () => {
    const triggers = [
      { kind: 'talks', days: 5 }, { kind: 'gift' }, { kind: 'gift', good: 'carrot' }, { kind: 'spot', spot: 'plaza' }, { kind: 'season', season: 'winter' },
      { kind: 'festival', festival: 'harvest-cup' }, { kind: 'farm-rank', rank: 4 }, { kind: 'built', place: 'kitchen' }, { kind: 'shipped', good: 'carrot', count: 50 },
      { kind: 'event', after: '9000002:f3' },
    ]
    for (const meet of triggers) expect(entry({ meet })).toMatchObject({ ...clean, value: { umas: [{ meet }] } })
  })
  it('skips a trigger it can\'t read, and notes one that never holds', () => {
    expect(entry({ meet: { kind: 'talks', days: 0 } }).errors).toEqual(['Uma 1 (9000001) meet: talks names its days, from 1; skipped'])
    expect(entry({ meet: { kind: 'weather', sky: 'rain' } }).errors).toEqual(['Uma 1 (9000001) meet: a trigger is one of talks, gift, spot, season, festival, farm-rank, built, shipped, event; skipped'])
    expect(entry({ meet: { kind: 'built', place: 'castle' } }).value.umas[0]).not.toHaveProperty('meet')
    expect(entry({ meet: { kind: 'farm-rank', rank: 12 } }).notes).toEqual(['Uma 1 (9000001) meet: Farm Rank 12 is past the top, 10, so it never holds'])
    expect(entry({ meet: { kind: 'shipped', good: 'moon-cake', count: 3 } }).notes).toEqual(['Uma 1 (9000001) meet: moon-cake isn’t a good in the game yet, so it can’t be shipped'])
  })
  it('reads her chapters: titles, her events in them, a gate from the same menu; notes rungs outside them', () => {
    const chapters = [
      { title: 'Spring', events: ['arrival', 'f1', 'f2'] },
      { title: 'Summer', events: ['f3', 'f4'], gate: { kind: 'built', place: 'kitchen' } },
    ]
    const read = entry({ chapters })
    expect(read.errors).toEqual([])
    expect(read.value.umas[0]!.chapters).toEqual(chapters)
    expect(read.notes).toEqual([`Uma 1 (9000001): ${RUNGS.slice(5).join(', ')} are in none of her chapters`])
  })
  it('skips a chapter title too long for her profile, a gate it can\'t read, and notes the rest', () => {
    const read = entry({ chapters: [{ title: 'x'.repeat(LINE_LIMITS.chapterTitle + 1), events: ['f1', 'f9', 'zz'], gate: { kind: 'built' } }, { events: ['f1'] }, 'Three'] })
    expect(read.errors).toEqual([
      'Uma 1 (9000001), chapter 1: its title is 41 characters; the screen shows 40; skipped',
      'Uma 1 (9000001), chapter 1 gate: built names one of the farm’s places; skipped',
      'Uma 1 (9000001), chapter 3: not a chapter; skipped',
    ])
    expect(read.notes).toContain('Uma 1 (9000001), chapter 1: zz isn’t a rung the game plays')
    expect(read.notes).toContain('Uma 1 (9000001), chapter 2: f1 is in chapter 1 too; the first holds it')
    expect(read.notes).toContain('Uma 1 (9000001), chapter 2: no title')
    expect(read.value.umas[0]!.chapters).toEqual([{ events: ['f1', 'f9', 'zz'] }, { events: ['f1'] }])
  })
})

describe('the ties', () => {
  it('need only their two characters; a pair tied twice is skipped, a bad kind or strength skipped alone', () => {
    const ties = clone(STAND_IN_TIES) as unknown as { ties: Record<string, unknown>[] }
    ties.ties = [{ a: '9000001', b: '9000002' }, { ...ties.ties[0]!, kind: 'rivals' }, { a: '9000002', b: '9000003', kind: 'cousins', strength: 4 }, { a: '9000003', b: '9000003' }]
    const read = checkTies(ties, ctx)
    expect(read.errors).toEqual([
      'Tie 2: 9000001 and 9000002 are tied already; skipped',
      'Tie 3: kind is one of friends, rivals, mentor, teammates, sisters, other; skipped',
      'Tie 3: strength is 1–3; skipped',
      'Tie 4: a tie names two different characters, a and b; skipped',
    ])
    expect(read.value.ties).toEqual([{ a: '9000001', b: '9000002' }, { a: '9000002', b: '9000003' }])
    expect(read.notes).toEqual([])
  })
  it('notes a tie to someone outside the cast; no Uma needs two ties', () => {
    expect(checkTies({ ties: [{ a: '9000001', b: '9000009' }] }, ctx).notes).toEqual(['Tie 1: 9000009 isn’t in the cast, so the tie never starts'])
    expect(checkTies({ ties: [] }, ctx)).toMatchObject(clean)
  })
})

describe('her bible', () => {
  it('needs nothing but its file\'s id; a bad field is skipped alone', () => {
    expect(checkBible({}, '9000002', ctx)).toMatchObject({ ...clean, value: { characterId: '9000002' } })
    const read = checkBible({ ...clone(STAND_IN_BIBLE), favouriteLine: 'expeditions', gifts: { loved: 7, liked: ['carrot', 'moon-cake'], disliked: 'onion' } }, STAND_IN, ctx)
    expect(read.errors).toEqual([
      'gifts.loved is a goods id; skipped',
      'gifts.disliked: a list of goods ids; skipped',
      'favouriteLine is one of farming, ranch, mining, fishing, foraging, cooking, serving, forging; skipped',
    ])
    expect(read.notes).toEqual(['gifts.liked: moon-cake isn’t a good in the game, so she finds it neutral'])
    expect(read.value!.gifts).toEqual({ liked: ['carrot', 'moon-cake'] })
    expect(read.value).not.toHaveProperty('favouriteLine')
  })
  it('takes any number of gifts, a proposed good noted', () => {
    const read = checkBible({ characterId: STAND_IN, gifts: { loved: 'moon-cake', liked: ['carrot', 'potato', 'cabbage', 'onion', 'basil'], proposed: ['moon-cake'] } }, STAND_IN, ctx)
    expect(read).toMatchObject({ errors: [], notes: ['gifts.loved: moon-cake isn’t a good in the game yet (proposed), so she finds it neutral'] })
  })
  it('takes any of her rungs, in any order; a beat it can\'t read is skipped, a bad field alone', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.route = [
      { ...bible.route![3]!, together: { kind: 'date', game: 'karaoke' } as never, hint: '' },
      bible.route![0]!,
      { id: 'f11', beat: 'Extra.' },
      { ...bible.route![2]!, trigger: { kind: 'season', season: 'spring' } as never },
      { hint: 'No id.' } as never,
    ]
    const read = checkBible(bible, STAND_IN, ctx)
    expect(read.errors).toEqual([
      'Beat f3: together is talk, work, date, gift or help; skipped',
      'Beat f3 hint: no hint; skipped',
      'Beat f2: trigger is hearts, working, item or bond (never a clock, the weather, a season or a festival); skipped',
      'Beat 5: no id; skipped',
    ])
    expect(read.notes).toEqual([`Beat f11: not a rung the game plays (${RUNGS.join(', ')}); kept for the story`])
    expect(read.value!.route!.map((b) => b.id)).toEqual(['f3', 'arrival', 'f11', 'f2'])
    expect(read.value!.route![0]).not.toHaveProperty('together')
    expect(read.value!.route![3]).not.toHaveProperty('trigger')
  })
  it('notes what waits forever: an item that isn\'t a good, a bond with someone outside the cast', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.route = [{ ...bible.route![1]!, trigger: { kind: 'item', good: 'moon-cake' } }, { ...bible.route![2]!, trigger: { kind: 'bond', with: '9000009', level: 2 } }]
    expect(checkBible(bible, STAND_IN, ctx).notes).toEqual([
      'Beat f1: she waits for moon-cake, which isn’t in the game yet',
      'Beat f2: a bond with 9000009, who isn’t in the cast, never forms',
    ])
  })
  it('notes a characterId that isn\'t its file\'s, and reads it by the file', () => {
    expect(checkBible({ characterId: '9000002' }, STAND_IN, ctx)).toMatchObject({ errors: [], notes: ['its characterId is 9000002; the game reads it as 9000001’s, by its file’s name'], value: { characterId: STAND_IN } })
  })
})

describe('the scripted steps', () => {
  it('a line longer than the screen is an error; the line rules are notes', () => {
    const f = stepFindings([
      { say: STAND_IN, line: 'Good morning, sir.' },
      { choice: [{ text: 'I’m your husband now.', tone: 'warm', friendship: 10 }, { text: 'Hello.', tone: 'honest', friendship: 5 }] },
      { thought: 'I feel like a bride.' },
      { thought: 'Old Ben would say he told me so.' },
      { say: STAND_IN, line: 'Like my old classmates, {name}.' },
      { narrate: 'x'.repeat(LINE_LIMITS.line + 1) },
    ], 'Event', speakers)
    expect(f.errors).toEqual(['Event, step 6: its narration is 401 characters; the screen shows 400'])
    expect(f.notes).toEqual([
      'Event, step 1: “sir” genders the farmer',
      'Event, step 2, option 1: “husband” genders the farmer',
      'Event, step 3: “bride” genders the farmer',
      'Event, step 5: {name} shows as written ({farmer} is the one placeholder)',
      'Event, step 5: “classmates” reads as school',
    ])
  })
  it('a choice with any number of options plays; one with none, or an option with no text, can\'t', () => {
    expect(stepFindings([{ choice: [{ text: 'Only one.', friendship: 5 }] }], 'E', speakers)).toEqual({ errors: [], notes: ['E, step 1: one option, so there’s nothing to choose'] })
    const four = Array.from({ length: 4 }, (_, i) => ({ text: `${i}.`, friendship: i }))
    expect(stepFindings([{ choice: four }], 'E', speakers).notes).toEqual(['E, step 1: 4 options; more than three crowd the screen'])
    expect(stepFindings([{ choice: [] }], 'E', speakers).errors).toEqual(['E, step 1: a choice lists its options'])
    expect(stepFindings([{ choice: [{ tone: 'warm' }, { text: 'Yes.' }] }], 'E', speakers).errors).toEqual(['E, step 1, option 1: no text'])
    const f = stepFindings([{ choice: [{ text: 'Cold.', tone: 'cruel', friendship: -10 }, { text: 'Flat.', tone: 'honest' }] }], 'E', speakers)
    expect(f.errors).toEqual([])
    expect(f.notes).toEqual([
      'E, step 1, option 1: the tone cruel isn’t one of warm, playful, honest',
      'E, step 1, option 1: friendship -10 is outside the usual 0–50; a gain only ranks the options (+30 the best, +10 the rest)',
      'E, step 1: no option gains hearts, so each pays the best (+30)',
    ])
  })
  it('an option\'s goods, taste and answer are what the save keeps, so a bad one is an error', () => {
    const choose = (extra: Record<string, unknown>) => [{ choice: [{ text: 'Yes.', friendship: 20, ...extra }, { text: 'No.', friendship: 10 }] }]
    expect(stepFindings(choose({ gives: { good: 'basil', count: 6 } }), 'E', speakers)).toEqual({ errors: [], notes: ['E, step 1, option 1: gives 6, more than the usual 1–5'] })
    expect(stepFindings(choose({ gives: { good: 'moon-cake', count: 1 } }), 'E', speakers).errors).toEqual(['E, step 1, option 1: gives is { good, count }, a good the game has and a count from 1'])
    expect(stepFindings(choose({ reveals: 'moon-cake' }), 'E', speakers).errors).toEqual(['E, step 1, option 1: reveals names a good the game has'])
    expect(stepFindings(choose({ answer: 'maybe' }), 'E', speakers).errors).toEqual(['E, step 1, option 1: answer is yes or not-yet'])
  })
  it('a flag is what the save keeps; a play names its game; a `when` holds its steps', () => {
    expect(stepFindings([{ flag: 'Shared lunch!' }], 'E', speakers).errors).toEqual(['E, step 1: a flag is lowercase letters, digits and - . : _ (up to 64), as the save keeps it'])
    expect(stepFindings([{ flag: 'shared-lunch' }], 'E', speakers)).toEqual({ errors: [], notes: [] })
    expect(stepFindings([{ play: { game: 'karaoke', prompt: 'Sing' } }], 'E', speakers).errors).toEqual(['E, step 1: a play names its game (a date game or an activity)'])
    expect(stepFindings([{ play: { game: 'walk' } }], 'E', speakers)).toEqual({ errors: [], notes: [] })
    expect(stepFindings([{ play: { game: 'fishing', prompt: 'Cast', as: 'pick' } }], 'E', speakers).notes).toEqual(['E, step 1: as (pick or rhythm) is a farming play’s; it’s ignored here'])
    expect(stepFindings([{ when: 'met', then: [] }], 'E', speakers)).toEqual({ errors: [], notes: [] })
    expect(stepFindings([{ when: 'met', then: 'Again!' }], 'E', speakers).errors).toEqual(['E, step 1 then: steps are a list'])
    expect(stepFindings([{ dance: true }, 'Hi.'], 'E', speakers).errors).toEqual(['E, step 1: not a step the game plays', 'E, step 2: not a step'])
    expect(stepFindings([], 'E', speakers).errors).toEqual(['E: no steps'])
  })
  it('a speaker outside the scene\'s, an unknown place, an emote off the menu and a long wait are notes', () => {
    expect(stepFindings([{ say: 'farmer', line: 'Hi.', emote: 'smug' }, { place: 'moon' }, { wait: 9000 }], 'E', speakers).notes).toEqual([
      'E, step 1: farmer isn’t one who speaks here (one outside the cast and the town’s people shows as “An Uma”)',
      'E, step 1: the emote smug shows as its word (the menu’s are happy, shy, sad, angry, surprised, thinking, laughing, tender)',
      'E, step 2: moon isn’t one of the game’s places; its title line shows the words',
      'E, step 3: a wait of 9000 ms plays as 0–5000',
    ])
  })
})

describe('a route', () => {
  const say = (line: string) => ({ say: STAND_IN, line })
  const choose = (extra: Record<string, unknown> = {}) => ({ choice: [{ text: 'Yes.', tone: 'warm' as const, friendship: 20, ...extra }, { text: 'No.', tone: 'honest' as const, friendship: 10 }] })
  const play = (game = 'fishing') => ({ play: { game, prompt: 'Together' } })
  const routeWith = (id: string, steps: unknown[]) => {
    const route = clone(STAND_IN_ROUTE)
    route.events = route.events.map((e) => (e.id === id ? { id, steps: steps as never } : e))
    return checkRoute(route, STAND_IN, STAND_IN_BIBLE, ctx)
  }

  it('skips only a broken event; the rest play', () => {
    const read = routeWith('f2', [say('Hi.'), { choice: [] }])
    expect(read.errors).toEqual(['Event f2, step 2: a choice lists its options (the event is skipped)'])
    expect(read.value!.events.map((e) => e.id)).toEqual(RUNGS.filter((r) => r !== 'f2'))
  })
  it('takes a partial route, an event not in her bible, and one off the rungs (a note)', () => {
    const route = clone(STAND_IN_ROUTE)
    route.events = [...route.events.filter((e) => e.id !== 'wedding'), { id: 'f11', steps: [{ narrate: 'Extra.' }, { choice: [{ text: 'Go on.', friendship: 5 }, { text: 'Stop.' }] }] }]
    expect(checkRoute(route, STAND_IN, null, ctx)).toMatchObject({ errors: [], notes: ['Event f11: not a rung the game plays; kept for the story'] })
  })
  it('notes an event outside its usual size; each choice and play pays', () => {
    expect(routeWith('f1', [say('Hi.'), choose(), play(), play()]).notes).toEqual(['Event f1: 2 plays, more than the usual 1; each pays'])
    expect(routeWith('f1', [choose(), choose(), choose()]).notes).toEqual(['Event f1: 3 choice points on a path, outside the usual 1–2; each pays'])
    expect(routeWith('f1', [say('Hi.'), play()]).notes).toEqual(['Event f1: 0 choice points on a path, outside the usual 1–2; each pays'])
    expect(routeWith('f1', [{ when: 'x', then: [choose()], else: [say('No choice.')] }]).notes).toEqual(['Event f1: 0–1 choice points on a path, outside the usual 1–2; each pays'])
    expect(routeWith('wedding', [play(), choose(), choose(), choose()])).toMatchObject(clean)
  })
  it('notes the confession\'s answers, a reveal that isn\'t one of her gifts, and an answer off the confession', () => {
    const answer = { choice: [{ text: 'Yes.', tone: 'warm', romance: 20, answer: 'yes' }, { text: 'Not yet.', tone: 'honest', friendship: 10, answer: 'not-yet' }] }
    expect(routeWith('confession', [play(), choose(), answer])).toMatchObject(clean)
    expect(routeWith('confession', [choose(), choose()]).notes).toEqual(['Event confession: its last choice point has no answer: yes and no answer: not-yet; an option without an answer counts as Yes'])
    expect(routeWith('confession', [choose({ answer: 'yes' }), answer]).notes).toEqual(['Event confession: only its last choice point’s answers count'])
    expect(routeWith('f1', [say('Hi.'), choose({ reveals: 'onion' })]).notes).toEqual(['Event f1: reveals onion, which isn’t one of her gifts (she finds it neutral)'])
    expect(routeWith('f1', [say('Hi.'), choose({ answer: 'yes' })]).notes).toEqual(['Event f1: only the confession’s answers count; these are ignored'])
  })
  it('her arrival: any number of choice points, a play shown as a pause', () => {
    expect(eventNotes('arrival', [say('Hi.')], null)).toEqual(['Event arrival: no choice point, so it pays +50 and no choice'])
    expect(eventNotes('arrival', [choose(), choose()], null)).toEqual(['Event arrival: 2 choice points; only the first pays'])
    expect(eventNotes('arrival', [play(), choose()], null)).toEqual(['Event arrival: an arrival plays no play; it shows as a pause'])
  })
})

describe('a pair\'s conversations', () => {
  it('any levels; a broken level is skipped, a level twice skipped, one off 1–5 noted', () => {
    const pair = clone(STAND_IN_PAIR)
    pair.levels = [pair.levels[0]!, { ...pair.levels[1]!, steps: [{ say: '9000001', line: 'x'.repeat(401) }] }, pair.levels[0]!, { ...pair.levels[2]!, hearts: 6 }]
    const read = checkPair(pair, ctx)
    expect(read.errors).toEqual([
      'Level 2, step 1: its line is 401 characters; the screen shows 400 (the level is skipped)',
      'Level 1: written twice; the later one is skipped',
    ])
    expect(read.notes).toEqual(['Level 6: bonds reach levels 1–5, so it never plays'])
    expect(read.value!.levels.map((l) => l.hearts)).toEqual([1, 6])
  })
})

describe('the tag sheet (the sandbox\'s): notes only', () => {
  const tag = (characterId: string, change: Partial<TagEntry> = {}): TagEntry => ({
    characterId, favouriteLine: 'farming', season: 'spring', festival: 'flower-show', loved: 'golden-carrot',
    reasons: { favouriteLine: 'An invented reason.', season: 'An invented reason.', festival: 'An invented reason.', loved: 'An invented reason.' }, ...change,
  })
  it('one entry a cast Uma, each value valid with its reason; a new good is flagged as proposed', () => {
    expect(tagNotes({ version: 1, tags: STAND_INS.map((id) => tag(id)) }, ctx)).toEqual([])
    expect(tagNotes({ version: 1, tags: [
      tag('9000001', { loved: 'moon-cake' }), tag('9000002', { season: 'monsoon' as never, reasons: { favouriteLine: '', season: 'x', festival: 'x', loved: 'Her husband’s favourite.' } }), tag('9000002'),
    ] }, ctx)).toEqual([
      'Tags 9000001: loved moon-cake isn’t a good; mark it proposed if it’s a new one',
      'Tags 9000002: unknown season',
      'Tags 9000002: a one-line reason for favouriteLine',
      'Tags 9000002 loved: “husband” genders the farmer',
      'Tags 9000002: twice',
    ])
  })
  it('her bible and her tags disagreeing is a note', () => {
    expect(bibleTagNotes(STAND_IN_BIBLE, tag(STAND_IN))).toEqual([])
    expect(bibleTagNotes(STAND_IN_BIBLE, tag(STAND_IN, { season: 'winter', loved: 'carrot' }))).toEqual([
      'season: the bible says spring, the tag sheet winter',
      'loved: the bible says golden-carrot, the tag sheet carrot',
    ])
  })
})
