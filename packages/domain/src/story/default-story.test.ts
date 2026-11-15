// The default story: every stage, event, occasion and evening has its default, each reads cleanly through the story's
// own reader once her words are in, and her own story replaces it piece by piece. Invented ids only: the stand-ins
// 9000001–9000003 and the invented master data's 9100001–9100006 (`placeholders.fixture.ts`).
import { describe, expect, it } from 'vitest'
import { TEMPERAMENTS } from '../farm/talents'
import { ACTIVITIES } from '../farm/ranks'
import { goodName, isGoodId } from '../goods/ids'
import { chatLineV4 } from '../romance/acts'
import { TASTES } from '../romance/chats'
import { EVENINGS } from '../romance/evening'
import { choicePoints, walkScene } from '../romance/love'
import { EVENING_KINDS, newLove, newSave, type Love } from '../save/v4'
import { ARRIVAL, EMOTES, EVENING_SCENES, LIFE_EVENTS, LINE_LIMITS, OCCASIONS, RUNGS, STORY_EVENTS, type Step } from './authored'
import { STAND_INS } from './authored.fixture'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { FISHERY, FOREST } from '../gathering/tables'
import {
  DEFAULT_EVENINGS, DEFAULT_EVENTS, DEFAULT_GIFT_REACTIONS, DEFAULT_GOOD, DEFAULT_GOODS, DEFAULT_MEALS, DEFAULT_MORNINGS, DEFAULT_TALKS, DEFAULT_TOWN_MEETING, HER, TALK_STAGES,
  WORK_WORDS, type DefaultScene,
} from './default-story'
import { isStoryOutfit } from './look'
import { readStoryPack, storyPackFrom } from './pack'
import {
  defaultSceneOf, defaultTalksOf, eventOf, fillHer, giftReactionsOf, giftsOf, herWordsOf, mealLinesOf, morningGreetingsOf, placeholderEvent, storyOf, talkStageOf, tasteOf,
  writtenOf,
} from './placeholders'
import { MASTER } from './placeholders.fixture'
import { STAND_IN_FILES } from './stand-in'

const [ONE, TWO] = STAND_INS
/** Her words as the longest the game can give them: a long name, a long good's name, the longest work. */
const WORDS = { name: 'Somebody With A Long Name', good: goodName('cut-philosophers-stone'), work: 'tending the animals' }
/** Every line a scene shows: said, narrated, thought, and each option and what follows it. */
const lines = (steps: readonly Step[]): string[] => steps.flatMap((s) => ('say' in s ? [s.line] : 'narrate' in s ? [s.narrate] : 'thought' in s ? [s.thought]
  : 'choice' in s ? s.choice.flatMap((o) => [o.text, ...lines(o.then ?? [])]) : 'when' in s ? [...lines(s.then), ...lines(s.else ?? [])] : []))
const says = (steps: readonly Step[]): Extract<Step, { say: string }>[] => steps.flatMap((s) => ('say' in s ? [s]
  : 'choice' in s ? s.choice.flatMap((o) => says(o.then ?? [])) : []))
/** Every default scene, by id: the route's rungs (the town's meeting as `arrival`), the town's meeting, her life's, her occasions and
 * the evenings'. */
const SCENES: [string, DefaultScene][] = [...Object.entries(DEFAULT_EVENTS), ['arrival (in town)', DEFAULT_TOWN_MEETING], ...Object.entries(DEFAULT_EVENINGS)]

describe('the default story: every piece has its default', () => {
  it('holds every event a route may write: the rungs, her life\'s, her occasions and the evenings\' scenes', () => {
    expect(STORY_EVENTS.filter((id) => !DEFAULT_EVENTS[id] && !DEFAULT_EVENINGS[id])).toEqual([])
    expect([...Object.keys(DEFAULT_EVENTS), ...Object.keys(DEFAULT_EVENINGS)].sort()).toEqual([...STORY_EVENTS].sort())
    expect(RUNGS.every((r) => defaultSceneOf(r) === DEFAULT_EVENTS[r])).toBe(true)
    expect(defaultSceneOf(ARRIVAL, true)).toBe(DEFAULT_TOWN_MEETING)
    expect([LIFE_EVENTS.length, OCCASIONS.length, EVENING_SCENES.length]).toEqual([5, 8, 19])
  })

  it('writes a scene for each hangout kind and each date kind, and the two evenings of their own', () => {
    const hangouts = EVENING_KINDS.filter((k) => EVENINGS[k].hangout !== null).map((k) => `hangout-${k}`)
    const dates = EVENING_KINDS.filter((k) => k !== 'dinner' && k !== 'night-in').map((k) => `date-${k}`)
    expect([...EVENING_SCENES].sort()).toEqual([...hangouts, ...dates, 'dinner-in-town', 'a-night-in'].sort())
  })

  it('talks at every stage in every temperament, and reacts to every taste; married life greets and eats', () => {
    for (const stage of TALK_STAGES) for (const t of TEMPERAMENTS) expect(DEFAULT_TALKS[stage][t].length).toBeGreaterThanOrEqual(4)
    for (const taste of TASTES) expect(DEFAULT_GIFT_REACTIONS[taste].length).toBeGreaterThanOrEqual(3)
    for (const t of TEMPERAMENTS) expect(DEFAULT_MORNINGS[t].length).toBeGreaterThanOrEqual(3)
    expect([DEFAULT_MEALS.breakfast.length, DEFAULT_MEALS.dinner.length]).toEqual([3, 3])
  })

  it('names a real good and her work for every line of work', () => {
    for (const a of ACTIVITIES) {
      expect(isGoodId(DEFAULT_GOODS[a])).toBe(true)
      expect(WORK_WORDS[a].length).toBeGreaterThan(0)
    }
  })

  it('every default loved good can be had in Spring of year 1, with nothing built', () => {
    // The first season's reach: the woods' Spring goods, the pond's Spring fish, and the crops of the shop's day-one seeds.
    const spring = new Set([
      ...FOREST.woods.seasons.spring.map(([good]) => good), ...FISHERY.pond.seasons.spring.map(([good]) => good),
      ...SHOP_SEEDS.spring.filter((crop) => CROPS[crop].tier === 1),
    ])
    expect([FOREST.woods.opens, FISHERY.pond.opens, FISHERY.pond.needs]).toEqual([0, 0, null])
    for (const good of [...Object.values(DEFAULT_GOODS), DEFAULT_GOOD]) expect(spring.has(good), good).toBe(true)
  })
})

describe('the default story reads cleanly through the story\'s reader', () => {
  it('as her route: every event, filled in for her, with no error and no note', () => {
    const route = { events: STORY_EVENTS.map((id) => ({ id, ...(defaultSceneOf(id).outfit ? { outfit: defaultSceneOf(id).outfit } : {}), steps: placeholderEvent(ONE, id, false, WORDS) })) }
    const town = { events: [{ id: ARRIVAL, steps: placeholderEvent(ONE, ARRIVAL, true, WORDS) }] }
    const files = { cast: { umas: [{ characterId: ONE }] }, umas: {}, routes: { [ONE]: route } }
    const read = readStoryPack(files)
    expect(read.errors).toEqual([])
    expect(read.notes.filter((n) => n.startsWith('routes/'))).toEqual([])
    expect(readStoryPack({ ...files, routes: { [ONE]: town } }).notes.filter((n) => n.startsWith('routes/'))).toEqual([])
    // What the pack plays is the default, whole.
    expect(read.pack.scripted.get(ONE)).toEqual(new Set(STORY_EVENTS))
  })

  it('as her bible\'s chats: every talk at every stage, filled in, with no error and no note', () => {
    for (const t of TEMPERAMENTS) {
      const filled = (stage: typeof TALK_STAGES[number]) => DEFAULT_TALKS[stage][t].map((l) => fillHer(l, WORDS))
      const bible = { chats: { friend: [...filled('acquaintance'), ...filled('friend'), ...filled('farmhand')], partner: [...filled('sweetheart'), ...filled('engaged')], spouse: filled('married') } }
      const read = readStoryPack({ cast: { umas: [{ characterId: ONE }] }, umas: { [ONE]: bible }, routes: {} })
      expect(read.errors).toEqual([])
      expect(read.notes.filter((n) => n.includes('chats'))).toEqual([])
    }
  })

  it('every line within its screen, and nothing left to fill but your name', () => {
    for (const [id, scene] of SCENES) {
      for (const line of lines(scene.steps)) {
        const filled = fillHer(line, WORDS)
        expect(filled.length, id).toBeLessThanOrEqual(LINE_LIMITS.line)
        expect(filled, id).not.toMatch(/\{(?!farmer\})/)
      }
      for (const s of scene.steps.filter((x): x is Extract<Step, { choice: unknown }> => 'choice' in x)) for (const o of s.choice) expect(o.text.length).toBeLessThanOrEqual(LINE_LIMITS.option)
    }
    const short = [...TALK_STAGES.flatMap((s) => TEMPERAMENTS.flatMap((t) => DEFAULT_TALKS[s][t])), ...TASTES.flatMap((t) => DEFAULT_GIFT_REACTIONS[t]),
      ...TEMPERAMENTS.flatMap((t) => DEFAULT_MORNINGS[t]), ...DEFAULT_MEALS.breakfast, ...DEFAULT_MEALS.dinner]
    for (const line of short) {
      const filled = fillHer(line, { ...WORDS, gift: WORDS.good })
      expect(filled.length, line).toBeLessThanOrEqual(LINE_LIMITS.chat)
      expect(filled, line).not.toMatch(/\{(?!farmer\})/)
    }
  })
})

describe('each scene plays as the dialogue engine wants it', () => {
  it('opens on its moment, gives her a face for every line, and names only outfits the art draws', () => {
    for (const [id, scene] of SCENES) {
      const first = scene.steps.find((s) => !('place' in s))
      expect(first, id).toEqual({ narrate: scene.moment })
      const hers = says(scene.steps)
      expect(hers.length, id).toBeGreaterThanOrEqual(1)
      expect(hers.every((s) => s.say === HER && s.emote !== undefined && EMOTES.includes(s.emote)), id).toBe(true)
      if (scene.outfit) expect(isStoryOutfit(scene.outfit)).toBe(true)
    }
    // Her faces change line by line: the default story uses most of the 22.
    const used = new Set(SCENES.flatMap(([, scene]) => says(scene.steps).map((s) => s.emote)))
    expect(used.size).toBeGreaterThanOrEqual(18)
  })

  it('the wedding night: in its outfit, tender, fading to morning, and paying nothing', () => {
    const night = DEFAULT_EVENTS['wedding-night']!
    expect(night.outfit).toBe('wedding-night')
    expect(night.steps.some((s) => 'wait' in s)).toBe(true)
    expect([...night.steps].reverse().find((s) => 'narrate' in s)).toEqual({ narrate: 'Morning comes gold through the curtains.' })
    expect(lines(night.steps).join(' ')).toContain('husband')
  })

  it('the rungs pay as written; her life\'s events, occasions and evenings pay nothing', () => {
    for (const rung of RUNGS) {
      const steps = placeholderEvent(ONE, rung)
      expect(walkScene(steps, [0]).done).toBe(true)
      const choice = steps.find((s): s is Extract<Step, { choice: unknown }> => 'choice' in s)!
      expect(choicePoints(choice.choice)[0], rung).toBe(30)
    }
    for (const id of [...LIFE_EVENTS, ...OCCASIONS, ...EVENING_SCENES]) {
      for (const s of placeholderEvent(ONE, id)) if ('choice' in s) expect(s.choice.every((o) => !o.friendship && !o.romance), id).toBe(true)
    }
  })
})

describe('her words fill in, and her own story replaces each piece', () => {
  const story = storyOf(null, MASTER)

  it('fills her name, her favourite good and her line\'s work, by her line', () => {
    expect(herWordsOf(story, '9100003', 'Robin')).toEqual({ name: 'Robin', good: 'Trout', work: 'fishing' })
    expect(herWordsOf(story, '9100005').work).toBe('tending the animals')
    expect(herWordsOf({ bibles: new Map() }, '9999999')).toEqual({ name: 'She', good: 'Honeycomb', work: 'farm work' })
    expect(giftReactionsOf(story, '9100001', 'loved', 'carrot')[0]).toBe('{name} lights up. “Carrot! You remembered. I love it.”')
    expect(morningGreetingsOf(story, '9100001', 'steady')).toEqual(DEFAULT_MORNINGS.steady)
    expect(mealLinesOf(story, '9100004', 'dinner')).toContain('{name} raises her cup. “To a good day of mining.”')
  })

  it('follows her stage in the Uma loop', () => {
    const at = (stage: Love['stage'], level: number, farmhand = false) => talkStageOf({ stage, level }, farmhand)
    expect([at('friendship', 0), at('friendship', 2), at('friendship', 3), at('friendship', 3, true), at('confession', 10), at('romance', 0), at('proposal', 10),
      at('wedding', 10), at('spouse', 2)]).toEqual(['acquaintance', 'acquaintance', 'friend', 'farmhand', 'friend', 'sweetheart', 'sweetheart', 'engaged', 'married'])
    expect(talkStageOf(newLove())).toBe('acquaintance')
  })

  it('plays her invitation to work: her route\'s `invited-to-work`, else the default\'s at the farm gate in the day\'s outfit', async () => {
    const scene = DEFAULT_EVENTS['invited-to-work']!
    expect(scene.outfit).toBeUndefined()
    expect(scene.steps[0]).toEqual({ place: 'gate' })
    const played = await eventOf(storyPackFrom(STAND_IN_FILES), TWO, 'invited-to-work', 'Robin')
    expect(played).toMatchObject({ id: 'invited-to-work', written: false })
    expect(played.outfit).toBeUndefined()
    expect(says(played.steps).every((s) => s.say === TWO)).toBe(true)
    const own = { ...storyPackFrom(STAND_IN_FILES), route: async () => ({ events: [{ id: 'invited-to-work', steps: [{ narrate: 'She says yes.' }] as Step[] }] }) }
    expect(await eventOf(own, TWO, 'invited-to-work')).toEqual({ id: 'invited-to-work', steps: [{ narrate: 'She says yes.' }], written: true })
  })

  it('her route\'s event replaces the default\'s; the rest stay default', async () => {
    const pack = { ...storyPackFrom(STAND_IN_FILES), route: async () => ({ events: [{ id: 'wedding-night', steps: [{ narrate: 'Her own night.' }] as Step[] }] }) }
    expect(await eventOf(pack, TWO, 'wedding-night')).toEqual({ id: 'wedding-night', steps: [{ narrate: 'Her own night.' }], written: true })
    const moving = await eventOf(pack, TWO, 'moving-in', 'Robin')
    expect(moving.written).toBe(false)
    expect(moving.steps.some((s) => 'say' in s && s.say === TWO)).toBe(true)
    expect((await eventOf(pack, TWO, 'date-picnic')).outfit).toBe('garden-party')
  })

  it('her bible\'s chats replace the default talks for their stage; her tastes replace the default\'s', () => {
    const pack = storyPackFrom(STAND_IN_FILES)
    const save = newSave('robin', '2026-11-14T09:00:00.000Z')
    const withLove = (id: string, love: Partial<Love>) => ({ ...save, love: { ...save.love, [id]: { ...newLove(), ...love } } })
    // The stand-in farmer writes her friend set; before Friendship 1 she talks the default's acquaintance lines.
    expect(STAND_IN_FILES.umas[ONE]).toBeDefined()
    expect(defaultTalksOf(pack, ONE, 'acquaintance', 'steady')).toContain(chatLineV4(withLove(ONE, {}), pack, ONE, 'steady'))
    expect(defaultTalksOf(pack, ONE, 'friend', 'steady')).not.toContain(chatLineV4(withLove(ONE, { level: 3 }), pack, ONE, 'steady'))
    // Her bible's gifts are hers; the forager (no bible) loves her line's good.
    expect(giftsOf(pack, ONE).loved).not.toBe('carrot')
    expect(tasteOf(pack, TWO, 'shiitake')).toBe('loved')
    const parts = writtenOf(pack, TWO)
    expect(parts.find((p) => p.part === 'Her tastes')!.plays).toContain('favourite good')
  })
})
