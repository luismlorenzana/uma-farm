// Her illustrations: the moments, the default mapping on the default story's scenes, the story's own `illustration`
// step, and her gallery's unlocks in the save. Scene ids come from uma-data's synthetic family; Umas are the stand-ins.
import { ILLUSTRATION_MOMENTS, illustrationById, illustrationFor } from '@luismlorenzana/uma-data'
import { syntheticIllustrations } from '@luismlorenzana/uma-data/testing'
import { describe, expect, it } from 'vitest'
import { meet } from '../romance/meeting'
import { sceneSteps } from '../romance/love'
import { lineSteps } from '../romance/loop'
import { parseSaveV6 } from '../save/parse-v4'
import { newSave, type SaveV4 } from '../save/v4'
import { checkPair, checkRoute, type Step, type StoryContext } from './authored'
import { STAND_IN, STAND_IN_BIBLE, STAND_INS } from './authored.fixture'
import { DEFAULT_EVENINGS, DEFAULT_EVENTS, DEFAULT_TOWN_MEETING } from './default-story'
import { galleryOf, ILLUSTRATION_ID, seeIllustration } from '../save/gallery'
import {
  eveningIllustration, eventIllustration, firstPlace, galleryTiles, illustrate, illustrationAt, illustrationCues, ILLUSTRATED_MOMENTS, namesIllustration, readCue, sceneFor,
  type IllustrationAsk,
} from './illustrations'

// Day 1 is Spring 1; a season is 30 days.
const SPRING = 1
const SUMMER = 31
const SCENES = syntheticIllustrations(Number(STAND_IN), [...ILLUSTRATION_MOMENTS]).scenes
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** What each visible step of a played path shows: the cue up there (`@moment`, an id), or null for her bust. */
function shows(steps: readonly Step[], picks: number[] = []): (string | null)[] {
  const shown = sceneSteps(steps, picks)
  const words = (ask: IllustrationAsk) => (ask === null ? null : ask.by === 'moment' ? `@${ask.moment}` : ask.id)
  return shown.flatMap((s, i) => ('place' in s || 'flag' in s || 'illustration' in s ? [] : [words(illustrationAt(shown, i))]))
}

describe('the moments', () => {
  it('are master data’s, in story order', () => {
    expect(ILLUSTRATED_MOMENTS).toEqual(ILLUSTRATION_MOMENTS)
  })
  it('a cue reads as a scene by id, a moment, or nothing', () => {
    expect(readCue('confession-yes')).toEqual({ by: 'id', id: 'confession-yes' })
    expect(readCue('@beach')).toEqual({ by: 'moment', moment: 'beach' })
    expect(readCue('none')).toBeNull()
  })
  it('a cue finds her scene as master data does: by id, or her first for the moment; one she lacks is none', () => {
    const ills = syntheticIllustrations(Number(STAND_IN), ['meeting', 'confession', 'confession-yes'])
    expect(sceneFor(ills.scenes, readCue('@confession'))).toBe(illustrationFor(ills, 'confession'))
    expect(sceneFor(ills.scenes, readCue(ills.scenes[2]!.id))).toBe(illustrationById(ills, ills.scenes[2]!.id))
    expect(sceneFor(ills.scenes, readCue('@beach'))).toBeNull()
    expect(sceneFor(ills.scenes, readCue('none'))).toBeNull()
  })
  it('every synthetic scene id is one the save keeps', () => {
    for (const s of SCENES) expect(ILLUSTRATION_ID.test(s.id)).toBe(true)
    expect(ILLUSTRATION_ID.test('Not-An-Id')).toBe(false)
    expect(ILLUSTRATION_ID.test('a'.repeat(65))).toBe(false)
  })
})

describe('the default mapping', () => {
  it('her meeting opens on `meeting`, to its end', () => {
    expect(shows(illustrate('meeting', DEFAULT_TOWN_MEETING.steps), [0])).toEqual(Array(6).fill('@meeting'))
  })
  it('her confession: `confession` at the question and its answer, `confession-yes` after her yes; a Not yet takes it down', () => {
    const steps = illustrate('confession', DEFAULT_EVENTS.confession!.steps)
    // narration, her three lines into the question, the answer, then her line after it.
    expect(shows(steps, [0])).toEqual([null, '@confession', '@confession', '@confession', '@confession', '@confession-yes'])
    expect(shows(steps, [1])).toEqual([null, '@confession', '@confession', '@confession', '@confession', null])
  })
  it('the question is her lines right before the answer: a narration or a pause before them stays on her bust', () => {
    const steps: Step[] = [{ narrate: 'Dusk.' }, { say: STAND_IN, line: 'Hm.' }, { wait: 300 }, { say: STAND_IN, line: 'So.' }, { say: STAND_IN, line: 'Will you?' },
      { choice: [{ text: 'Yes.', answer: 'yes' }, { text: 'Not yet.', answer: 'not-yet' }] }, { narrate: 'The end.' }]
    expect(shows(illustrate('confession', steps), [0])).toEqual([null, null, null, '@confession', '@confession', '@confession', '@confession-yes'])
    expect(shows(illustrate('confession', steps), [1])).toEqual([null, null, null, '@confession', '@confession', '@confession', null])
  })
  it('the wedding shows `wedding`, to its end', () => {
    expect(new Set(shows(illustrate('wedding', DEFAULT_EVENTS.wedding!.steps), [1]))).toEqual(new Set(['@wedding']))
  })
  it('the wedding night shows `wedding-night`, then `wedding-night-end` as it fades: after its last choice', () => {
    const steps = illustrate('wedding-night', DEFAULT_EVENTS['wedding-night']!.steps)
    // narration, three lines, the choice and her answer, then the fade (narration, a pause, morning, two lines).
    expect(shows(steps, [0])).toEqual([...Array(6).fill('@wedding-night'), ...Array(5).fill('@wedding-night-end')])
  })
  it('a wedding night ending on its choice fades on the answers; one with no choice on its last line', () => {
    const ending: Step[] = [{ say: STAND_IN, line: 'Us.' }, { choice: [{ text: 'Yes.', then: [{ say: STAND_IN, line: 'Mm.' }] }, { text: 'Always.' }] }]
    expect(shows(illustrate('wedding-night', ending), [0])).toEqual(['@wedding-night', '@wedding-night', '@wedding-night-end'])
    const plain: Step[] = [{ narrate: 'Night.' }, { say: STAND_IN, line: 'Us.' }, { say: STAND_IN, line: 'Night.' }]
    expect(shows(illustrate('wedding-night', plain))).toEqual(['@wedding-night', '@wedding-night', '@wedding-night-end'])
  })
  it('a night in shows `night-in`, to its end', () => {
    expect(shows(illustrate('night-in', DEFAULT_EVENINGS['a-night-in']!.steps))).toEqual(Array(3).fill('@night-in'))
  })
  it('the night’s companion shows `companion` before her morning greeting, then her bust', () => {
    const greeting: Step[] = [{ narrate: 'Morning light comes soft through the curtains.' }, ...lineSteps('“Good morning.”', STAND_IN, 'sleepy')]
    expect(shows(illustrate('companion', greeting))).toEqual(['@companion', null])
  })
  it('a scene with no moment is unchanged, and so is one that names an illustration of its own', () => {
    expect(illustrate(null, DEFAULT_EVENTS.f1!.steps)).toEqual(DEFAULT_EVENTS.f1!.steps)
    const own: Step[] = [{ say: STAND_IN, line: 'Hi.' }, { choice: [{ text: 'Hi.', then: [{ illustration: SCENES[0]!.id }, { say: STAND_IN, line: 'Oh!' }] }] }]
    expect(namesIllustration(own)).toBe(true)
    expect(illustrate('meeting', own)).toEqual(own)
    expect(shows(illustrate('meeting', own), [0])).toEqual([null, null, SCENES[0]!.id])
  })
  it('which heart events are illustrated: her confession, the wedding, and a summer date at the shore', () => {
    expect(eventIllustration({ rung: 'confession', day: SPRING })).toBe('confession')
    expect(eventIllustration({ rung: 'wedding', place: 'chapel-bell', day: SPRING })).toBe('wedding')
    expect(eventIllustration({ rung: 'r4', place: 'sea-pier', day: SUMMER })).toBe('shore')
    expect(eventIllustration({ rung: 's3', place: 'sea-pier', day: SUMMER })).toBe('shore')
    // A friend at the shore, the shore out of summer, a summer date elsewhere: none.
    expect(eventIllustration({ rung: 'f6', place: 'sea-pier', day: SUMMER })).toBeNull()
    expect(eventIllustration({ rung: 'r4', place: 'sea-pier', day: SPRING })).toBeNull()
    expect(eventIllustration({ rung: 'r4', place: 'fields', day: SUMMER })).toBeNull()
    expect(firstPlace([{ narrate: 'x' }, { place: 'sea-pier' }])).toBe('sea-pier')
    expect(eveningIllustration('a-night-in')).toBe('night-in')
    expect(eveningIllustration('date-walk')).toBeNull()
  })
  it('a scene’s cues, each once, for its start to load', () => {
    const steps = illustrate('confession', DEFAULT_EVENTS.confession!.steps)
    expect(illustrationCues(steps)).toEqual([{ by: 'moment', moment: 'confession' }, { by: 'moment', moment: 'confession-yes' }])
  })
})

describe('the story names one', () => {
  const ctx: StoryContext = { umas: new Set(STAND_INS) }
  const route = (steps: unknown[]) => ({ events: [{ id: 'confession', steps }] })
  it('in her route: an id or none reads clean, up from there to the next', () => {
    const steps = [{ illustration: SCENES[2]!.id }, { say: STAND_IN, line: 'Well?' }, { illustration: 'none' },
      { choice: [{ text: 'Yes.', answer: 'yes' }, { text: 'Later.', answer: 'not-yet' }] }]
    const read = checkRoute(route(steps), STAND_IN, STAND_IN_BIBLE, ctx)
    expect(read.errors).toEqual([])
    expect(read.notes.filter((n) => n.includes('illustration') || n.includes('scene’s id'))).toEqual([])
    expect(shows(read.value!.events[0]!.steps as Step[], [0])).toEqual([SCENES[2]!.id, null])
  })
  it('a value that isn’t a scene id is a note and shows nothing; one that isn’t text skips the event', () => {
    const odd = checkRoute(route([{ illustration: 'The Beach' }, { say: STAND_IN, line: 'Hi.' }, { choice: [{ text: 'Yes.', answer: 'yes' }, { text: 'No.', answer: 'not-yet' }] }]), STAND_IN, STAND_IN_BIBLE, ctx)
    expect(odd.errors).toEqual([])
    expect(odd.notes).toContain('Event confession, step 1: The Beach isn’t a scene’s id (lowercase words joined by -), so nothing shows')
    const bad = checkRoute(route([{ illustration: 3 }, { say: STAND_IN, line: 'Hi.' }]), STAND_IN, STAND_IN_BIBLE, ctx)
    expect(bad.errors[0]).toBe('Event confession, step 1: illustration names one of her scenes by id, or none (the event is skipped)')
  })
  it('outside her route (a pair’s conversation) it’s a note: nothing shows there', () => {
    const pair = { a: '9000001', b: '9000002', levels: [{ hearts: 1, steps: [{ illustration: SCENES[0]!.id }, { say: '9000001', line: 'Hi.' }] }] }
    expect(checkPair(pair, ctx).notes).toContain('Level 1, step 1: an illustration shows in her route’s events only, so nothing shows here')
  })
})

describe('her gallery', () => {
  const met = (): SaveV4 => meet({ ...newSave('u1', '2026-11-14T09:00:00.000Z'), farmer: { name: 'Robin' } }, STAND_IN).save
  it('a scene seen joins it once, for good, in the order first seen', () => {
    let save = met()
    save = seeIllustration(save, STAND_IN, SCENES[2]!.id)
    save = seeIllustration(save, STAND_IN, SCENES[0]!.id)
    expect(seeIllustration(save, STAND_IN, SCENES[2]!.id)).toBe(save)
    expect(galleryOf(save, STAND_IN)).toEqual([SCENES[2]!.id, SCENES[0]!.id])
    expect(galleryTiles(SCENES.slice(0, 3), galleryOf(save, STAND_IN)).map((t) => t.unlocked)).toEqual([true, false, true])
  })
  it('only for someone met, and only a scene id', () => {
    const save = met()
    expect(seeIllustration(save, '9000002', SCENES[0]!.id)).toBe(save)
    expect(seeIllustration(save, STAND_IN, 'Not An Id')).toBe(save)
  })
  it('the save keeps it: it round-trips, and an older v5 without it reads as none, its updatedAt untouched', () => {
    const save = seeIllustration(met(), STAND_IN, SCENES[1]!.id)
    expect(parseSaveV6(json(save))).toEqual(save)
    const { gallery: _, ...older } = json(met())
    const read = parseSaveV6(older)
    expect(read.gallery).toEqual({})
    expect(read.account.updatedAt).toBe(met().account.updatedAt)
  })
  it('refuses a gallery for someone not met, or an id that isn’t a scene’s, or one twice', () => {
    const save = json(met())
    expect(() => parseSaveV6({ ...save, gallery: { 9000002: [SCENES[0]!.id] } })).toThrow()
    expect(() => parseSaveV6({ ...save, gallery: { [STAND_IN]: ['Bad Id'] } })).toThrow()
    expect(() => parseSaveV6({ ...save, gallery: { [STAND_IN]: [SCENES[0]!.id, SCENES[0]!.id] } })).toThrow()
  })
})
