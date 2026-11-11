// The authored story's format and validator (F40 RS15–RS18, D42), on the invented stand-in only.
import { describe, expect, it } from 'vitest'
import { bibleIssues, castIssues, pairIssues, routeIssues, RUNGS, stepIssues, tiesIssues, type StoryContext } from './authored'
import { STAND_IN, STAND_IN_BIBLE, STAND_IN_CAST, STAND_IN_PAIR, STAND_IN_ROUTE, STAND_IN_TIES, STAND_INS } from './authored.fixture'

const ctx: StoryContext = { umas: new Set(STAND_INS) }
const clone = <T>(v: T): T => structuredClone(v)
const speakers = new Set<string>([STAND_IN, 'hollis-pryor'])

describe('the stand-in story passes', () => {
  it('every layer', () => {
    expect(castIssues(STAND_IN_CAST, ctx)).toEqual([])
    expect(tiesIssues(STAND_IN_TIES, ctx)).toEqual([])
    expect(bibleIssues(STAND_IN_BIBLE, ctx)).toEqual([])
    expect(routeIssues(STAND_IN_ROUTE, STAND_IN_BIBLE, ctx)).toEqual([])
    expect(pairIssues(STAND_IN_PAIR, ctx)).toEqual([])
  })
  it('has the 23 rungs of RS7', () => expect(RUNGS).toHaveLength(23))
})

describe('the cast and the ties', () => {
  it('every Uma of the export, once, with the opening three a farmer, a forager and a fisher', () => {
    const cast = clone(STAND_IN_CAST)
    cast.opening = ['9000002', '9000001', '9000003']
    cast.umas.push({ ...cast.umas[0]!, characterId: '9000009' })
    const issues = castIssues(cast, ctx)
    expect(issues).toContain('Uma 4 (9000009): not in the export’s cast')
    expect(issues).toContain('The opening three are, in order, a farmer, a forager and a fisher (RS13, CS42)')
    expect(issues).toContain('Exactly three Umas arrive at the opening')
    expect(castIssues({ ...clone(STAND_IN_CAST), umas: clone(STAND_IN_CAST).umas.slice(0, 2) }, ctx)).toContain('9000003 from the export has no place in the cast')
  })
  it('every Uma needs two ties; a pair is tied once', () => {
    const ties = clone(STAND_IN_TIES)
    ties.ties = [ties.ties[0]!, { ...ties.ties[0]!, kind: 'rivals' }]
    const issues = tiesIssues(ties, ctx)
    expect(issues).toContain('Tie 2: 9000001|9000002 is tied twice')
    expect(issues).toContain('9000003 has 0 ties; every Uma needs two closest (RS12)')
  })
})

describe('the bible', () => {
  it('gifts are goods that exist, or flagged proposals', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.gifts.loved = 'moon-cake'
    expect(bibleIssues(bible, ctx)).toContain('Gift moon-cake isn’t a good; list it under proposed if it’s a new one')
    bible.gifts.proposed = ['moon-cake']
    expect(bibleIssues(bible, ctx)).toEqual([])
  })
  it('every rung, each with a trigger, a place and what they do together', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.route = bible.route.filter((b) => b.id !== 'proposal')
    bible.route[0] = { ...bible.route[0]!, together: { kind: 'date', game: 'karaoke' as never }, trigger: { kind: 'season', season: 'monsoon' as never } }
    const issues = bibleIssues(bible, ctx)
    expect(issues).toContain('Her route has no proposal (RS7)')
    expect(issues.some((i) => /Beat f1: a date is one of/.test(i))).toBe(true)
    expect(issues).toContain('Beat f1: unknown season')
  })
})

describe('the scripted steps', () => {
  it('the farmer is never gendered and nothing reads as school', () => {
    const issues = stepIssues([
      { say: STAND_IN, line: 'Good morning, sir.' },
      { choice: [{ text: 'I’m your husband now.', tone: 'warm', friendship: 10 }, { text: 'Hello.', tone: 'honest', friendship: 5 }] },
      { thought: 'I feel like a bride.' },
      { thought: 'Old Ben would say he told me so.' },
      { say: STAND_IN, line: 'Like my old classmates.' },
    ], 'Event', speakers)
    expect(issues).toEqual([
      'Event, step 1: “sir” genders the farmer (RS2)',
      'Event, step 2, option 1: “husband” genders the farmer (RS2)',
      'Event, step 3: “bride” genders the farmer (RS2)',
      'Event, step 5: “classmates” reads as school (RS3)',
    ])
  })
  it('choices: 2–3 options, a tone each, gains shown and never negative, one that gains', () => {
    const issues = stepIssues([
      { choice: [{ text: 'Only one.', tone: 'warm', friendship: 5 }] },
      { choice: [{ text: 'Cold.', tone: 'cruel' as never, friendship: -10 }, { text: 'Flat.', tone: 'honest' }] },
    ], 'Event', speakers)
    expect(issues).toContain('Event, step 1: a choice has 2–3 options')
    expect(issues).toContain('Event, step 2, option 1: tone is warm, playful or honest (RS19)')
    expect(issues).toContain('Event, step 2, option 1: friendship is 0–50 (no answer costs hearts, RS19)')
    expect(issues).toContain('Event, step 2: at least one option gains hearts')
  })
  it('only the cast speaks; {farmer} is the one placeholder', () => {
    const issues = stepIssues([{ say: 'farmer', line: 'Hi.' }, { say: STAND_IN, line: 'Hi, {name}.' }, { play: { game: 'karaoke', prompt: 'Sing' } }], 'Event', speakers)
    expect(issues).toContain('Event, step 1: farmer can’t speak here')
    expect(issues).toContain('Event, step 2: unknown placeholder {name} ({farmer} only)')
    expect(issues).toContain('Event, step 3: a play names its game and a prompt')
  })
  it('a route scripts every beat of her bible, and a pair talks at every bond level', () => {
    const route = clone(STAND_IN_ROUTE)
    route.events = route.events.filter((e) => e.id !== 'wedding')
    route.events.push({ id: 'f11', steps: [{ narrate: 'Extra.' }] })
    const issues = routeIssues(route, STAND_IN_BIBLE, ctx)
    expect(issues).toContain('Beat wedding has no scripted event')
    expect(issues).toContain('Event f11 isn’t a beat in her bible')
    const pair = clone(STAND_IN_PAIR)
    pair.levels = pair.levels.slice(0, 4)
    expect(pairIssues(pair, ctx)).toEqual(['No conversation at bond level 5'])
  })
})
