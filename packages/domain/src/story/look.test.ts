// Her look in a scene: outfits by context, the story's ids and the art's names, the 22 expressions' fallbacks, and the
// story naming a scene's outfit. Invented ids only.
import { DIALOGUE_PORTRAIT_EXPRESSIONS, DIALOGUE_PORTRAIT_OUTFITS } from '@luismlorenzana/uma-data'
import { describe, expect, it } from 'vitest'
import { checkHousehold, checkPair, checkRoute, type StoryContext } from './authored'
import { STAND_IN, STAND_IN_BIBLE, STAND_IN_PAIR, STAND_IN_ROUTE, STAND_INS } from './authored.fixture'
import {
  ART_OUTFITS, artOutfit, dressOf, eventMoments, EXPRESSIONS, EXPRESSION_IDS, faceFor, fallbackChain, momentOutfit, MOMENT_OUTFITS, sceneOutfit, STORY_OUTFITS,
} from './look'
import { eventOf } from './placeholders'
import { STAND_IN_FILES } from './stand-in'

// Day 1 is Spring 1; a season is 30 days.
const SPRING = 1
const SUMMER = 31
const AUTUMN = 61
const WINTER = 91

describe('outfits by context', () => {
  it('maps every story id to the art’s name: autumn is fall, work farm-work, pajamas pajamas-playful; season the day’s', () => {
    expect(artOutfit('autumn', 'spring')).toBe('fall')
    expect(artOutfit('work', 'spring')).toBe('farm-work')
    expect(artOutfit('pajamas', 'spring')).toBe('pajamas-playful')
    expect(['spring', 'summer', 'autumn', 'winter'].map((s) => artOutfit('season', s as never))).toEqual(['spring', 'summer', 'fall', 'winter'])
    for (const id of STORY_OUTFITS) expect(ART_OUTFITS).toContain(artOutfit(id, 'winter'))
  })
  it('the art’s names are master data’s portrait outfits, in Farm Life’s order; its expressions are all on the menu', () => {
    expect(ART_OUTFITS).toEqual(DIALOGUE_PORTRAIT_OUTFITS)
    for (const e of DIALOGUE_PORTRAIT_EXPRESSIONS) expect(EXPRESSION_IDS).toContain(e)
  })
  it('the scene’s own outfit wins over every moment', () => {
    expect(sceneOutfit({ own: 'kimono', moments: ['wedding', 'work'] })).toBe('kimono')
    expect(dressOf({ own: 'season', moments: ['dinner'], day: AUTUMN }, 'a')).toBe('fall')
  })
  it('an outfit off the menu is ignored, and the moment’s plays', () => {
    expect(sceneOutfit({ own: 'ballgown', moments: ['work'] })).toBe('work')
    expect(sceneOutfit({ own: 7, moments: [] })).toBe('season')
  })
  it('the moments in their order: the wedding, its night, a dinner, a festival night, the garden party, pajamas, work, the shore', () => {
    expect(momentOutfit(['work', 'wedding'])).toBe('wedding')
    expect(momentOutfit(['work', 'wedding-night'])).toBe('wedding-night')
    expect(momentOutfit(['night-in', 'dinner'])).toBe('dinner')
    expect(momentOutfit(['picnic', 'festival-night'])).toBe('kimono')
    expect(momentOutfit(['work', 'tea'])).toBe('garden-party')
    expect(momentOutfit(['spring-festival'])).toBe('garden-party')
    expect(momentOutfit(['sleepless', 'work'])).toBe('pajamas')
    expect(momentOutfit(['shore', 'work'])).toBe('work')
    expect(momentOutfit(['shore'])).toBe('swimsuit')
    expect(momentOutfit([])).toBe('season')
    expect(MOMENT_OUTFITS.map((r) => r.outfit)).toEqual(['wedding', 'wedding-night', 'dinner', 'kimono', 'garden-party', 'pajamas', 'work', 'swimsuit'])
  })
  it('else the day’s season', () => {
    expect([SPRING, SUMMER, AUTUMN, WINTER].map((day) => dressOf({ day }, 'a'))).toEqual(['spring', 'summer', 'fall', 'winter'])
  })
  it('a guest at her wedding wears the moment’s other outfit; the scene’s own Umas wear the scene’s', () => {
    const wedding = { moments: ['wedding' as const], day: SUMMER, leads: ['bride'] }
    expect(dressOf(wedding, 'bride')).toBe('wedding')
    expect(dressOf(wedding, 'guest')).toBe('summer')
    expect(dressOf({ ...wedding, own: 'wedding-night' }, 'guest')).toBe('summer')
    // An outfit that isn't personal is everyone's: the pair at work, and anyone with them.
    expect(dressOf({ own: 'work', day: SPRING, leads: ['a', 'b'] }, 'c')).toBe('farm-work')
  })
  it('a heart event’s moments: the wedding, her work, a picnic date, the summer shore', () => {
    expect(eventMoments({ rung: 'wedding', day: SPRING })).toEqual(['wedding'])
    expect(eventMoments({ rung: 'f1', together: { kind: 'work' }, day: SPRING })).toEqual(['work'])
    expect(eventMoments({ rung: 'r2', together: { kind: 'date', game: 'picnic' }, day: SPRING })).toEqual(['picnic'])
    expect(eventMoments({ rung: 'r3', together: { kind: 'date', game: 'boat' }, place: 'sea-pier', day: SUMMER })).toEqual(['shore'])
    expect(eventMoments({ rung: 'r3', place: 'sea-pier', day: AUTUMN })).toEqual([])
  })
})

describe('the 22 expressions', () => {
  it('ten core, six romance, six extra, as the story’s emote menu', () => {
    expect(EXPRESSIONS).toHaveLength(22)
    expect(EXPRESSIONS.filter((e) => e.set === 'core')).toHaveLength(10)
    expect(EXPRESSIONS.filter((e) => e.set === 'romance')).toHaveLength(6)
    expect(EXPRESSIONS.filter((e) => e.set === 'extra')).toHaveLength(6)
    for (const e of EXPRESSIONS) if (e.fallback) expect(EXPRESSION_IDS).toContain(e.fallback)
  })
  it('each falls back to its nearest, ending at neutral', () => {
    expect(fallbackChain('embarrassed')).toEqual(['embarrassed', 'flustered', 'shy', 'happy', 'neutral'])
    expect(fallbackChain('tearful-joy')).toEqual(['tearful-joy', 'loving', 'tender', 'happy', 'neutral'])
    expect(fallbackChain('smug')).toEqual(['smug', 'determined', 'happy', 'neutral'])
    for (const id of EXPRESSION_IDS) expect(fallbackChain(id).at(-1)).toBe('neutral')
  })
  it('a line shows its face if drawn, else the nearest drawn, else neutral; an unknown emote is neutral', () => {
    const drawn = (e: string) => ['happy', 'shy', 'tender'].includes(e)
    expect(faceFor('flustered', drawn)).toBe('shy')
    expect(faceFor('dreamy', drawn)).toBe('tender')
    expect(faceFor('angry', drawn)).toBe('neutral')
    expect(faceFor('wistful', drawn)).toBe('neutral')
    expect(faceFor(undefined, drawn)).toBe('neutral')
  })
})

describe('the story names a scene’s outfit', () => {
  const ctx: StoryContext = { umas: new Set(STAND_INS) }
  it('an event, a pair level and the finale keep theirs; the played event carries it', async () => {
    expect(checkRoute(STAND_IN_ROUTE, STAND_IN, STAND_IN_BIBLE, ctx).value!.events.find((e) => e.id === 'f2')?.outfit).toBe('work')
    expect(checkPair(STAND_IN_PAIR, ctx).value!.levels.find((l) => l.hearts === 2)?.outfit).toBe('work')
    expect(checkHousehold(STAND_IN_FILES.household, ctx).value!.finale?.outfit).toBe('kimono')
    const route = checkRoute(STAND_IN_ROUTE, STAND_IN, STAND_IN_BIBLE, ctx).value!
    const pack = { route: async () => route }
    expect((await eventOf(pack, STAND_IN, 'f2')).outfit).toBe('work')
    expect((await eventOf(pack, STAND_IN, 'f1')).outfit).toBeUndefined()
  })
  it('one off the menu is a note and the moment’s plays; one that isn’t an id is an error that skips the field only', () => {
    const route = structuredClone(STAND_IN_ROUTE)
    route.events = route.events.map((e) => (e.id === 'f1' ? { ...e, outfit: 'ballgown' as never } : e.id === 'f3' ? { ...e, outfit: 3 as never } : e))
    const read = checkRoute(route, STAND_IN, STAND_IN_BIBLE, ctx)
    expect(read.notes).toContain('Event f1: the outfit ballgown isn’t one of season, spring, summer, autumn, winter, work, garden-party, kimono, dinner, wedding, wedding-night, pajamas, swimsuit, so the moment’s plays')
    expect(read.errors).toEqual(['Event f3: outfit is one of the story’s outfit ids; skipped'])
    expect(read.value!.events.find((e) => e.id === 'f1')).not.toHaveProperty('outfit')
    expect(read.value!.events.find((e) => e.id === 'f3')).not.toHaveProperty('outfit')
  })
})
