// Talk that knows the day (F94): her gift lines (hers, else the default story's; her birthday's first), her greeting from
// the most specific set (birthday, place, season, hour), and small talk drawn with her lines only when its tags fit. On the
// invented stand-in with invented talk (`occasions.fixture.ts`); no original-game content.
import { describe, expect, it } from 'vitest'
import { farmDay, type Season } from '../farm/calendar'
import { farmDayOn } from '../town/town'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { YOU, type SmallTalk } from '../story/authored'
import { DEFAULT_GIFT_REACTIONS } from '../story/default-story'
import { GIFT_LINES, SMALL_TALK, withOccasions } from '../story/occasions.fixture'
import { storyPackFrom } from '../story/pack'
import { chatLinesOf } from '../story/placeholders'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { chatLineV4, giftLineV4 } from './acts'
import { joinCast } from './meeting.fixture'
import { farmPlaceOf, greetingLines, greetingOf, smallTalkFits, talkAt, talkHour, talkOf, todaysTalk, type TalkAt } from './talk'

const AT = '2026-11-15T10:00:00.000Z'
const [ONE, TWO] = ['9000001', '9000002']
const PACK = storyPackFrom(withOccasions())
const PLAIN = storyPackFrom(STAND_IN_FILES)
const on = (season: Season, day: number, year = 1) => farmDay({ year, season, day })

function farm(day: number): SaveV4 {
  const fresh = { ...newSave('u-talk', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const here = (place: string | null, more: Partial<TalkAt> = {}): TalkAt => ({ place, town: false, hour: 'morning', ...more })

describe('her gift line', () => {
  it('her own lines for its taste, else the default story’s; her birthday’s first on her birthday', () => {
    const save = farm(on('spring', 3))
    expect(GIFT_LINES.loved).toContain(giftLineV4(save, PACK, ONE, 'loved', 'carrot'))
    expect(giftLineV4(save, PACK, ONE, 'disliked', 'limestone')).toBe('A disliked line.')
    expect(giftLineV4(save, PACK, ONE, 'loved', 'carrot', true)).toBe('A birthday gift line.')
    // No gift lines of hers: the default story's, by taste, birthday or not.
    const fallback = DEFAULT_GIFT_REACTIONS.liked.map((l) => l.replaceAll('{gift}', 'Peach'))
    expect(fallback).toContain(giftLineV4(save, PACK, TWO, 'liked', 'peach'))
    expect(fallback).toContain(giftLineV4(save, PACK, TWO, 'liked', 'peach', true))
    // A taste she has no lines for: the default story's for it.
    const partial = storyPackFrom({ ...withOccasions(), umas: { [ONE]: { ...(withOccasions().umas[ONE] as object), giftLines: { loved: ['Only a loved line.'] } } } })
    expect(DEFAULT_GIFT_REACTIONS.neutral.map((l) => l.replaceAll('{gift}', 'Peach'))).toContain(giftLineV4(save, partial, ONE, 'neutral', 'peach', true))
    expect(giftLineV4(save, partial, ONE, 'loved', 'peach', true)).toBe('Only a loved line.')
  })
})

describe('her greeting', () => {
  const spring = farm(on('spring', 3))
  it('on her birthday her birthday’s alone; otherwise every set that applies, together: place, season, hour', () => {
    expect(greetingLines(spring, PACK, ONE, here('fields'), true)).toEqual(['A birthday hello.'])
    expect(greetingLines(spring, PACK, ONE, here('fields'), false)).toEqual(['A hello in the Fields.', 'A spring hello.', 'A morning hello.'])
    expect(greetingLines(spring, PACK, ONE, here('mill'), false)).toEqual(['A spring hello.', 'A morning hello.'])
    expect(greetingLines(spring, PACK, ONE, here(null, { hour: 'evening' }), false)).toEqual(['A spring hello.', 'An evening hello.'])
    // Autumn has no set of hers: the place's and the hour's.
    const autumn = farm(on('autumn', 3))
    expect(greetingLines(autumn, PACK, ONE, here('mill'), false)).toEqual(['A morning hello.'])
    expect(greetingLines(autumn, PACK, ONE, here('dorm', { hour: 'night' }), false)).toEqual(['A hello at the Dorm.', 'A night hello.'])
    // In town, her location's set, else the town's.
    expect(greetingLines(autumn, PACK, ONE, here('cafe', { town: true }), false)).toEqual(['A hello at the Café.', 'A morning hello.'])
    expect(greetingLines(autumn, PACK, ONE, here('library', { town: true }), false)).toEqual(['A hello in town.', 'A morning hello.'])
    // The weather's set never plays: the game has no weather yet.
    expect(greetingLines(autumn, PACK, ONE, here('mill'), false)).not.toContain('A rainy hello.')
    // A birthday with no birthday's set: the sets that apply.
    const plain = storyPackFrom({ ...withOccasions(), umas: { [ONE]: { ...(withOccasions().umas[ONE] as object), greetings: { seasons: { spring: ['Only spring.'] } } } } })
    expect(greetingLines(spring, plain, ONE, here('fields'), true)).toEqual(['Only spring.'])
    // No greetings: none, and the talk opens on her line.
    expect(greetingOf(spring, PACK, TWO, here('fields'), true)).toBeNull()
  })

  it('draws one greeting a day, the same all day, and every set plays over time', () => {
    const seen = new Set<string>()
    // Spring and autumn days of four years, in the Fields by day.
    for (const day of [1, 2, 3, 4].flatMap((year) => Array.from({ length: 12 }, (_, i) => [on('spring', i + 1, year), on('autumn', i + 1, year)]).flat())) {
      const save = farm(day)
      const greeting = greetingOf(save, PACK, ONE, here('fields'), false)!
      expect(greeting).toBe(greetingOf(save, PACK, ONE, here('fields'), false))
      expect(greetingLines(save, PACK, ONE, here('fields'), false)).toContain(greeting)
      seen.add(greeting)
    }
    expect([...seen].sort()).toEqual(['A hello in the Fields.', 'A morning hello.', 'A spring hello.'])
    // On her birthday, only her birthday's.
    expect(greetingOf(spring, PACK, ONE, here('fields'), true)).toBe('A birthday hello.')
  })

  it('knows where you are: on the farm her board’s first task, else no place; in town her location; and the hour', () => {
    const save = farm(on('spring', 3))
    expect(farmPlaceOf(save, ONE)).toBeNull()
    // A farmhand on her farm day (Spring 3: her town days are 1, 4, 7 and 10) is on the farm, at her first task's place.
    expect(farmDayOn(PACK, ONE, save.calendar.day)).toBe(true)
    const working = { ...save, roster: { ...save.roster, [ONE]: { ...save.roster[ONE]!, farmhand: 1, tasks: [{ kind: 'fish' as const, spot: 'pond' as never }] } } }
    expect(farmPlaceOf(working, ONE)).toBe('fishery')
    expect(talkAt(working, PACK, ONE)).toEqual({ place: 'fishery', town: false, hour: 'morning' })
    const idle = { ...save, roster: { ...save.roster, [ONE]: { ...save.roster[ONE]!, farmhand: 1 } } }
    expect(talkAt(idle, PACK, ONE)).toEqual({ place: null, town: false, hour: 'morning' })
    // On her town day she's at her spot in town.
    expect(talkAt({ ...idle, calendar: { day: on('spring', 4) } }, PACK, ONE)).toMatchObject({ town: true })
    expect(talkHour({ ...save, today: { ...save.today, evenings: [{ with: ONE, kind: 'walk' }] } }, ONE)).toBe('evening')
    expect(talkHour({ ...save, today: { ...save.today, evenings: [{ with: ONE, kind: 'night-in' }] } }, ONE)).toBe('night')
    expect(talkHour({ ...save, homestead: { ...save.homestead, companion: ONE } }, ONE)).toBe('night')
    expect(talkHour({ ...save, today: { ...save.today, evenings: [{ with: TWO, kind: 'walk' }] } }, ONE)).toBe('morning')
  })
})

describe('small talk', () => {
  it('fits only when every tag it carries matches', () => {
    const [fields, winter, spouse, cafe, anywhere] = SMALL_TALK as [SmallTalk, SmallTalk, SmallTalk, SmallTalk, SmallTalk]
    expect(smallTalkFits(fields, here('fields'), 'spring', null)).toBe(true)
    expect(smallTalkFits(fields, here('mill'), 'spring', 'friend')).toBe(false)
    expect(smallTalkFits(winter, here(null), 'winter', 'friend')).toBe(true)
    expect(smallTalkFits(winter, here(null), 'spring', 'friend')).toBe(false)
    expect(smallTalkFits(spouse, here(null), 'spring', 'spouse')).toBe(true)
    expect(smallTalkFits(spouse, here(null), 'spring', 'partner')).toBe(false)
    expect(smallTalkFits(cafe, here('cafe', { town: true }), 'spring', 'friend')).toBe(true)
    expect(smallTalkFits(cafe, here('cafe', { town: true }), 'summer', 'friend')).toBe(false)
    expect(smallTalkFits(cafe, here('cafe', { town: true }), 'spring', 'partner')).toBe(false)
    expect(smallTalkFits(anywhere, here(null), 'autumn', null)).toBe(true)
    expect(smallTalkFits({ at: 'town' }, here('library', { town: true }), 'autumn', null)).toBe(true)
    expect(smallTalkFits({ at: 'town' }, here('fields'), 'autumn', null)).toBe(false)
  })

  it('a chat draws her line or a fitting small talk, opened by her greeting, the same all day; your lines are yours', () => {
    const fits = new Set(['Small talk in the Fields.', 'Small talk anywhere.'])
    let drawn = 0
    // Every spring day of four years, in the Fields as a friend.
    for (const day of [1, 2, 3, 4].flatMap((year) => Array.from({ length: 12 }, (_, i) => on('spring', i + 1, year)))) {
      const save = withLove(farm(day), ONE, { level: 1 })
      const at = here('fields')
      const talk = talkOf(save, PACK, ONE, 'steady', at)
      expect(talk).toEqual(talkOf(save, PACK, ONE, 'steady', at))
      expect(talk.greeting).not.toBeNull()
      expect(talk.steps[0]).toEqual({ say: ONE, line: talk.greeting, emote: 'happy' })
      if (talk.small) {
        drawn++
        // Only what fits: the Fields', or one with no tags; never winter's, a spouse's or the Café's.
        expect(fits.has(talk.small.lines[0]![1])).toBe(true)
        expect(talk.steps.slice(1)).toEqual([
          { say: ONE, line: talk.small.lines[0]![1], emote: 'happy' }, { say: YOU, line: talk.small.lines[1]![1] }, { say: ONE, line: talk.small.lines[2]![1], emote: 'happy' },
        ])
      } else {
        // Her line: one of her stage's.
        expect(talk.steps).toHaveLength(2)
        expect(chatLinesOf(PACK, ONE, 'friend')).toContain((talk.steps[1] as { line: string }).line)
      }
    }
    expect(drawn).toBeGreaterThan(0)
  })

  it('without greetings or small talk, a chat is her line alone, as before', () => {
    const save = withLove(farm(on('spring', 3)), ONE, { level: 1 })
    const talk = todaysTalk(save, PLAIN, ONE, 'steady')
    expect(talk).toEqual({ greeting: null, small: null, steps: [{ say: ONE, line: chatLineV4(save, PLAIN, ONE, 'steady'), emote: 'happy' }] })
  })
})
