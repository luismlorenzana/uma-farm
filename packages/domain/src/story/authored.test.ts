// The authored story's format and validator, on the invented stand-in only.
import { describe, expect, it } from 'vitest'
import { bibleIssues, bibleTagIssues, castIssues, pairIssues, routeIssues, RUNGS, stepIssues, tagsIssues, tiesIssues, type StoryContext, type TagEntry } from './authored'
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
  it('has the 27 rungs of RS7 as D43 and F46 amend it: her arrival first, ending on the spouse ladder', () => {
    expect(RUNGS).toHaveLength(27)
    expect(RUNGS[0]).toBe('arrival')
    expect(RUNGS.slice(-4)).toEqual(['wedding', 's1', 's3', 's5'])
  })
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
  it('every rung, each with a trigger, a place, what they do together and its hint', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.route = bible.route.filter((b) => b.id !== 's5')
    bible.route[1] = { ...bible.route[1]!, together: { kind: 'date', game: 'karaoke' as never }, hint: '' }
    const issues = bibleIssues(bible, ctx)
    expect(issues).toContain('Her route has no s5 (RS7)')
    expect(issues.some((i) => /Beat f1: a date is one of/.test(i))).toBe(true)
    expect(issues).toContain('Beat f1: no hint, the line her profile shows while it’s next (D43)')
  })
  it('nothing waits on the calendar: no season, festival, clock or weather trigger (D43)', () => {
    const bible = clone(STAND_IN_BIBLE)
    bible.route[1] = { ...bible.route[1]!, trigger: { kind: 'season', season: 'spring' } as never }
    bible.route[2] = { ...bible.route[2]!, trigger: { kind: 'item', good: 'golden-carrot' } }
    const issues = bibleIssues(bible, ctx)
    expect(issues).toEqual(['Beat f1: a trigger is hearts, working, item, bond or chapter; never a clock, the weather, a season or a festival (D43)'])
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

describe('heart events (F49 decision 14)', () => {
  const say = (line: string) => ({ say: STAND_IN, line })
  const choose = (extra: Record<string, unknown> = {}) => ({ choice: [{ text: 'Yes.', tone: 'warm' as const, friendship: 20, ...extra }, { text: 'No.', tone: 'honest' as const, friendship: 10 }] })
  const play = (game = 'fishing', extra: Record<string, unknown> = {}) => ({ play: { game, prompt: 'Together', ...extra } })
  const routeWith = (id: string, steps: unknown[]) => {
    const route = clone(STAND_IN_ROUTE)
    route.events = route.events.map((e) => (e.id === id ? { id, steps: steps as never } : e))
    return routeIssues(route, STAND_IN_BIBLE, ctx)
  }

  it('the stand-in route plays every kind: Cast, Pick, Rhythm (farming and a fallback), Walk, Choose, help, talk, a cost, a taste, a flag, a `when`, and a confession with two plays and Yes and Not yet', () => {
    const events = new Map(STAND_IN_ROUTE.events.map((e) => [e.id, JSON.stringify(e.steps)]))
    const together = new Map(STAND_IN_BIBLE.route.map((b) => [b.id, b.together]))
    expect(events.get('f3')).toContain('"game":"fishing"')
    expect(events.get('f1')).toContain('"as":"pick"')
    expect(events.get('f2')).toContain('"as":"rhythm"')
    expect(together.get('f4')).toEqual({ kind: 'work', activity: 'cooking' })
    expect(together.get('f5')).toEqual({ kind: 'date', game: 'walk' })
    expect(together.get('f6')?.kind).toBe('gift')
    expect(together.get('f7')?.kind).toBe('talk')
    expect(together.get('f8')?.kind).toBe('help')
    expect(events.get('f4')).toContain('"gives":{"good":"basil","count":1}')
    expect(events.get('f7')).toContain('"reveals":"potato"')
    expect(events.get('f8')).toContain('"flag":"shared-lunch"')
    expect(events.get('f9')).toContain('"when":"shared-lunch"')
    expect(events.get('confession')!.match(/"play"/g)).toHaveLength(2)
    expect(events.get('confession')).toContain('"answer":"not-yet"')
  })

  it('`play.as` is a farming play\'s, pick or rhythm', () => {
    expect(stepIssues([play('fishing', { as: 'pick' })], 'E', speakers)).toEqual(['E, step 1: as (pick or rhythm) is a farming play’s only'])
    expect(stepIssues([play('farming', { as: 'sing' })], 'E', speakers)).toEqual(['E, step 1: as (pick or rhythm) is a farming play’s only'])
    expect(stepIssues([play('farming', { as: 'rhythm' })], 'E', speakers)).toEqual([])
  })

  it('an option gives 1–5 of a good, reveals a good (one of her gifts), and only the confession answers', () => {
    expect(stepIssues([choose({ gives: { good: 'basil', count: 6 } })], 'E', speakers)).toEqual(['E, step 1, option 1: gives is { good, count 1–5 }, a good that exists'])
    expect(stepIssues([choose({ gives: { good: 'moon-cake', count: 1 } })], 'E', speakers)).toEqual(['E, step 1, option 1: gives is { good, count 1–5 }, a good that exists'])
    expect(stepIssues([choose({ reveals: 'moon-cake' })], 'E', speakers)).toEqual(['E, step 1, option 1: reveals names a good'])
    expect(stepIssues([choose({ answer: 'maybe' })], 'E', speakers)).toEqual(['E, step 1, option 1: answer is yes or not-yet'])
    expect(routeWith('f1', [say('Hi.'), choose({ reveals: 'onion' })])).toEqual(['Event f1: reveals onion, which isn’t one of her gifts'])
    expect(routeWith('f1', [say('Hi.'), choose({ answer: 'yes' })])).toEqual(['Event f1: only the confession’s last choice point carries an answer'])
  })

  it('a `when` names a flag and holds steps', () => {
    expect(stepIssues([{ when: '', then: [] }], 'E', speakers)).toEqual(['E, step 1: when names a flag', 'E, step 1 then: no steps'])
    expect(stepIssues([{ when: 'met', then: [say('Again!')], else: [say('Hello.')] }], 'E', speakers)).toEqual([])
  })

  it('a heart event: 1–2 choice points on every path, at most one play', () => {
    expect(routeWith('f1', [say('Hi.'), choose(), play(), play()])).toEqual(['Event f1: at most 1 play (it has 2)'])
    expect(routeWith('f1', [choose(), choose(), choose()])).toEqual(['Event f1: every path has 1–2 choice points (it has 3–3)'])
    expect(routeWith('f1', [say('Hi.'), play()])).toEqual(['Event f1: every path has 1–2 choice points (it has 0–0)'])
    // A choice in one option's `then` makes two on that path, one on the other.
    expect(routeWith('f1', [{ choice: [{ text: 'A.', tone: 'warm', friendship: 20, then: [choose()] }, { text: 'B.', tone: 'warm', friendship: 10 }] }])).toEqual([])
    expect(routeWith('f1', [{ when: 'x', then: [choose()], else: [say('No choice.')] }])).toEqual(['Event f1: every path has 1–2 choice points (it has 0–1)'])
  })

  it('the confession, the proposal and the wedding: up to three plays and three choice points; the confession ends on Yes and Not yet', () => {
    const answer = { choice: [{ text: 'Yes.', tone: 'warm', romance: 20, answer: 'yes' }, { text: 'Not yet.', tone: 'honest', friendship: 10, answer: 'not-yet' }] }
    expect(routeWith('confession', [play(), play(), play(), choose(), answer])).toEqual([])
    expect(routeWith('confession', [play(), play(), play(), play(), answer])).toEqual(['Event confession: at most 3 plays (it has 4)'])
    expect(routeWith('confession', [choose(), choose()])).toEqual(['Event confession: its last choice point has one Yes (answer: yes) and one Not yet (answer: not-yet)'])
    expect(routeWith('confession', [{ choice: [{ text: 'Yes.', tone: 'warm', romance: 20, answer: 'yes' }, { text: 'Also yes.', tone: 'warm', romance: 10, answer: 'yes' }] }]))
      .toEqual(['Event confession: its last choice point has one Yes (answer: yes) and one Not yet (answer: not-yet)'])
    expect(routeWith('confession', [{ choice: [{ text: 'Yes.', tone: 'warm', romance: 20, answer: 'yes', then: [choose()] }, answer.choice[1]] }]))
      .toContain('Event confession: no choice point after its answer')
    expect(routeWith('confession', [choose({ answer: 'yes' }), answer])).toEqual(['Event confession: only its last choice point carries an answer'])
    expect(routeWith('wedding', [play(), choose(), choose(), choose()])).toEqual([])
    expect(routeWith('wedding', [choose(), choose(), choose(), choose()])).toEqual(['Event wedding: every path has 1–3 choice points (it has 4–4)'])
  })
})

describe('the cast on the Ranker (F58)', () => {
  it('records the Ranker’s revisions, optional and checked when present', () => {
    expect(castIssues({ ...clone(STAND_IN_CAST), ranker: { boardRevision: 337, profilesRevision: 6, pulledAt: '2026-11-12T10:00:00Z' } }, ctx)).toEqual([])
    expect(castIssues({ ...clone(STAND_IN_CAST), ranker: { boardRevision: 0, profilesRevision: 6, pulledAt: 'yesterday' } }, ctx))
      .toEqual(['ranker is { boardRevision, profilesRevision, pulledAt }: two revisions from 1 and a date (F58)'])
  })
})

describe('the tag sheet and the ties’ sources (F59)', () => {
  const tag = (characterId: string, change: Partial<TagEntry> = {}): TagEntry => ({
    characterId, favouriteLine: 'farming', season: 'spring', festival: 'flower-show', loved: 'golden-carrot',
    reasons: { favouriteLine: 'An invented reason.', season: 'An invented reason.', festival: 'An invented reason.', loved: 'An invented reason.' }, ...change,
  })
  it('one entry a cast Uma, each value valid with its reason; a new good is flagged as proposed', () => {
    expect(tagsIssues({ version: 1, tags: STAND_INS.map((id) => tag(id)) }, ctx)).toEqual([])
    const issues = tagsIssues({ version: 1, tags: [
      tag('9000001', { loved: 'moon-cake' }), tag('9000002', { season: 'monsoon' as never, reasons: { favouriteLine: '', season: 'x', festival: 'x', loved: 'Her husband’s favourite.' } }), tag('9000002'),
    ] }, ctx)
    expect(issues).toEqual([
      'Tags 9000001: loved moon-cake isn’t a good; mark it proposed if it’s a new one',
      'Tags 9000002: unknown season',
      'Tags 9000002: a one-line reason for favouriteLine',
      'Tags 9000002 loved: “husband” genders the farmer (RS2)',
      'Tags 9000002: twice',
      '9000003 has no tags',
    ])
    expect(tagsIssues({ version: 1, tags: [tag('9000001', { loved: 'moon-cake', proposed: true }), tag('9000002'), tag('9000003')] }, ctx)).toEqual([])
  })
  it('her bible agrees with her tags', () => {
    expect(bibleTagIssues(STAND_IN_BIBLE, tag(STAND_IN))).toEqual([])
    expect(bibleTagIssues(STAND_IN_BIBLE, tag(STAND_IN, { season: 'winter', loved: 'carrot' }))).toEqual([
      'season: the bible says spring, the tag sheet winter (F59)',
      'loved: the bible says golden-carrot, the tag sheet carrot (F59)',
    ])
  })
  it('a tie says where it comes from: real (with uma-quest’s relationship id once it exists) or story', () => {
    const ties = clone(STAND_IN_TIES)
    ties.ties[0] = { ...ties.ties[0]!, source: 'real', from: 'rel-0001' }
    ties.ties[1] = { ...ties.ties[1]!, source: 'story' }
    expect(tiesIssues(ties, ctx)).toEqual([])
    ties.ties[1] = { ...ties.ties[1]!, source: 'legend' as never, from: 'rel-0002' }
    expect(tiesIssues(ties, ctx)).toEqual(['Tie 2: source is real or story (F59)', 'Tie 2: from is a real tie’s relationship id (F59)'])
  })
})
