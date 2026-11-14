// The placeholders: master data's cast and lines, the one lookup ("the pack's, or the placeholder") for every read, and the
// game's own words checked by the story's own reader. Invented ids only: the stand-in's 9000001–9000003, and an invented
// master data of six characters, 9100001–9100006 (`placeholders.fixture.ts`).
import { describe, expect, it } from 'vitest'
import { checkHousehold, checkPair, checkRoute, HOUSEHOLD_SCENES, LINE_LIMITS, RUNGS, type Step } from './authored'
import { STAND_IN_BIBLE, STAND_INS } from './authored.fixture'
import { storyPackFrom } from './pack'
import {
  BOND_LEVELS, captionOf, chaptersOf, chatLinesOf, DEFAULT_CHAPTERS, engravingOf, eventOf, favouriteOf, giftsOf, householdOf, keepsakeOf, lineFromStats, linePlaces,
  firstVisitorOf, herWordsOf, masterCastFrom, meetOf, noPack, openingOf, outfitOf, pairConversationsOf, petNameOf, PLACEHOLDER_ENGRAVING, PLACEHOLDER_HELLO, PLACEHOLDER_KEEPSAKE,
  PLACEHOLDER_MOMENTS, PLACEHOLDER_OPENING, PLACEHOLDER_PET_NAME, PLACEHOLDER_TABLE, placeholderEvent, placeholderHouseholdBeat, PLAY_PROMPTS, promptOf, storyOf, tasteOf, tieKind, tieLineOf,
  tieStrength, weddingPlaces, welcomeOf, withCast, writtenOf,
} from './placeholders'
import { MASTER, MASTER_OUTFITS, NONE, stat } from './placeholders.fixture'
import { STAND_IN_FILES } from './stand-in'
import { answerAt } from './authored'
import { choicePoints, walkScene } from '../romance/love'

const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const ids = (n: number) => Array.from({ length: n }, (_, i) => String(9_100_001 + i))

describe('master data for the placeholders', () => {
  it('gives each character her default outfit (her first original one, else her lowest) and each outfit its line', () => {
    expect([...MASTER.outfits]).toEqual([['9100001', '910000101'], ['9100002', '910000201'], ['9100003', '910000301'], ['9100004', '910000401'], ['9100005', '910000501'],
      ['9100006', '910000601']])
    expect(['910000101', '910000201', '910000301', '910000401', '910000501', '910000601'].map((o) => MASTER.lines.get(o)))
      .toEqual(['farming', 'foraging', 'fishing', 'mining', 'ranch', 'fishing'])
    // A tie goes to the first in the activities' order: Speed and Wit level, fishing before foraging.
    expect(lineFromStats({ stats: { star5: stat(100, 90, 90, 90, 100) }, growthRatePercents: NONE })).toBe('fishing')
    // Stats that don't read give no line.
    expect(masterCastFrom([{ ...MASTER_OUTFITS[0]!, stats: { star5: stat(Number.NaN, 0, 0, 0, 0) } }]).lines.size).toBe(0)
  })
})

describe('the story with no pack', () => {
  it('plays master data\'s first five on placeholders: the welcome list, the opening, outfits, names and lines', () => {
    const story = storyOf(null, MASTER)
    expect(story.cast.umas.map((u) => u.characterId)).toEqual(ids(5))
    expect(welcomeOf(story)).toEqual(ids(5))
    expect(firstVisitorOf(story)).toBe('9100001')
    expect(openingOf(story)).toEqual(PLACEHOLDER_OPENING.slice(0, 2))
    expect(outfitOf(story, '9100001')).toBe('910000101')
    expect(ids(5).map((id) => favouriteOf(story, id))).toEqual(['farming', 'foraging', 'fishing', 'mining', 'ranch'])
    expect(linePlaces(story, '9100004')).toEqual(['mine', 'smelter'])
    expect(chaptersOf(story, '9100001')).toBe(DEFAULT_CHAPTERS)
    expect(DEFAULT_CHAPTERS.map((c) => c.title)).toEqual(['Getting to know her', 'Together', 'The wedding', 'Married life'])
    expect(meetOf(story, '9100002')).toEqual({ kind: 'talks', days: 3 })
    // Her tastes: the default story's, her favourite good (by her line) loved and the rest neutral.
    expect(tasteOf(story, '9100001', 'carrot')).toBe('neutral')
    expect(tasteOf(story, '9100001', 'peach')).toBe('loved')
    expect(giftsOf(story, '9100001')).toEqual({ loved: 'peach' })
    expect(ids(5).map((id) => giftsOf(story, id).loved)).toEqual(['peach', 'chestnut', 'seashell', 'amethyst', 'honey'])
    // Without master data (a test that leaves it out), nobody: the farm needs master data to open.
    expect(storyOf(null, null).cast.umas).toEqual([])
    expect(outfitOf(storyOf(null, null), '9100001')).toBe('9100001')
  })

  it('keeps a pack\'s own cast and words, and fills only what it leaves out; a pack naming nobody plays the placeholders\' cast', () => {
    const story = storyOf(PACK, MASTER)
    expect(story.cast).toBe(PACK.cast)
    expect(story.master).toBe(MASTER)
    expect(outfitOf(story, ONE)).toBe('900000101')
    expect(favouriteOf(story, ONE)).toBe('farming')
    expect(storyOf({ ...noPack(), bibles: PACK.bibles }, MASTER).cast.umas.map((u) => u.characterId)).toEqual(ids(5))
  })

  it('keeps everyone on the farm in the cast: one the pack doesn\'t hold joins it bare, at its end', () => {
    const story = storyOf(PACK, MASTER)
    expect(withCast(story, [ONE, TWO])).toBe(story)
    const kept = withCast(story, [ONE, '9100003', '9100003'])
    expect(kept.cast.umas.map((u) => u.characterId)).toEqual([...STAND_INS, '9100003'])
    expect(outfitOf(kept, '9100003')).toBe('910000301')
    expect(favouriteOf(kept, '9100003')).toBe('fishing')
  })
})

describe('the game\'s own words', () => {
  it('give every rung the default story\'s event, which the story\'s reader takes whole: no errors, no notes', () => {
    const route = { events: RUNGS.map((rung) => ({ id: rung, steps: placeholderEvent(ONE, rung) })) }
    const read = checkRoute(route, ONE, null, { umas: new Set([ONE]) })
    expect(read.errors).toEqual([])
    expect(read.notes).toEqual([])
    expect(read.value!.events.map((e) => e.id)).toEqual(RUNGS)
    expect(Object.keys(PLACEHOLDER_MOMENTS)).toEqual(RUNGS)
    expect(Object.values(PLAY_PROMPTS).every((p) => p.length <= LINE_LIMITS.prompt)).toBe(true)
    expect(PLACEHOLDER_KEEPSAKE.name.length).toBeLessThanOrEqual(LINE_LIMITS.keepsakeName)
    expect(PLACEHOLDER_KEEPSAKE.line.length).toBeLessThanOrEqual(LINE_LIMITS.keepsakeLine)
    expect(PLACEHOLDER_ENGRAVING.length).toBeLessThanOrEqual(LINE_LIMITS.caption)
  })

  it('pay as written: one choice, the warmer +30; the confession holds Yes and Not yet; the wedding ends on the vows', () => {
    for (const rung of RUNGS) {
      const steps = placeholderEvent(ONE, rung)
      const path = walkScene(steps, [0])
      expect(path.done).toBe(true)
      const choice = steps.find((s): s is Extract<Step, { choice: unknown }> => 'choice' in s)!
      expect(choicePoints(choice.choice)[0]).toBe(30)
    }
    const confession = placeholderEvent(ONE, 'confession')
    expect((confession[answerAt(confession)] as Extract<Step, { choice: unknown }>).choice.map((o) => o.answer)).toEqual(['yes', 'not-yet'])
    const wedding = placeholderEvent(ONE, 'wedding')
    expect((wedding[answerAt(wedding)] as Extract<Step, { choice: unknown }>).choice).toHaveLength(3)
    // Her meeting is the town's, where you introduce yourself: nobody comes to the Gate.
    const meeting = placeholderEvent(ONE, 'arrival', true)
    expect(meeting.slice(0, 2)).toEqual([{ place: 'town' }, { narrate: PLACEHOLDER_MOMENTS.arrival }])
    expect(meeting.filter((s) => 'choice' in s)).toHaveLength(1)
    expect(placeholderEvent(ONE, 'arrival')).toEqual(meeting)
  })

  it('play the pack\'s event where it has one, else the card; a written arrival with no choice gets the hello', async () => {
    expect(await eventOf(PACK, ONE, 'f3')).toMatchObject({ id: 'f3', written: true })
    const card = await eventOf(PACK, TWO, 'f3')
    expect(card).toEqual({ id: 'f3', steps: placeholderEvent(TWO, 'f3', false, herWordsOf(PACK, TWO)), written: false })
    // Her name, her favourite good and her line's work fill in; `{farmer}` stays for the screen.
    const named = await eventOf(PACK, TWO, 'f2', 'Robin')
    expect(JSON.stringify(named.steps)).toContain('a day of foraging')
    expect(JSON.stringify(named.steps)).not.toMatch(/\{(name|good|work)\}/)
    expect((await eventOf(PACK, TWO, 'wedding-night')).outfit).toBe('wedding-night')
    const silent = { ...PACK, route: async () => ({ events: [{ id: 'arrival', steps: [{ narrate: 'Someone waves.' }] as Step[] }] }) }
    const arrival = await eventOf(silent, TWO, 'arrival')
    expect(arrival.written).toBe(true)
    expect(arrival.steps.at(-1)).toEqual({ choice: [...PLACEHOLDER_HELLO] })
    expect((await eventOf(PACK, TWO, 'arrival')).steps.filter((s) => 'choice' in s)).toHaveLength(1)
  })

  it('fill her words: chats by stage, keepsake, pet name, ring\'s words, captions, wedding places and a play\'s prompt', () => {
    expect(chatLinesOf(PACK, ONE, 'friend')).toEqual(STAND_IN_BIBLE.chats!.friend)
    expect(chatLinesOf(PACK, TWO, 'partner')).toEqual([])
    expect(keepsakeOf(PACK, TWO)).toEqual(PLACEHOLDER_KEEPSAKE)
    expect(keepsakeOf(PACK, ONE).name).toBe(STAND_IN_BIBLE.keepsake!.name)
    expect(petNameOf(PACK, TWO)).toBe(PLACEHOLDER_PET_NAME)
    expect(petNameOf(PACK, ONE)).toBe(STAND_IN_BIBLE.petName)
    expect(engravingOf(PACK, TWO)).toBe(PLACEHOLDER_ENGRAVING)
    expect(captionOf(PACK, TWO, 'f1')).toBe('A quiet afternoon with her.')
    expect(captionOf(PACK, ONE, 'f1')).toBe(STAND_IN_BIBLE.route!.find((b) => b.id === 'f1')!.beat)
    expect(weddingPlaces(PACK, TWO)).toEqual(['chapel-bell', 'fields', 'overlook'])
    expect(promptOf({ game: 'fishing' })).toBe('Cast the line together.')
    expect(promptOf({ game: 'fishing', prompt: 'Cast!' })).toBe('Cast!')
  })

  it('fill a tie\'s kind, strength and line, and every bond level of its pair, through the pair\'s reader', async () => {
    expect([tieKind({}), tieStrength({}), tieLineOf({ ties: { ties: [{ a: ONE, b: TWO }] } }, TWO, ONE)]).toEqual(['other', 1, 'Closer now'])
    expect(tieLineOf(PACK, ONE, TWO)).toBe('Old friends.')
    expect(tieLineOf({ ties: { ties: [] } }, ONE, TWO)).toBeNull()
    const pair = (await pairConversationsOf(PACK, THREE, TWO))!
    expect(pair.levels.map((l) => l.hearts)).toEqual([...BOND_LEVELS])
    expect(checkPair(pair, { umas: new Set(STAND_INS) })).toMatchObject({ errors: [], notes: [] })
  })

  it('fill the household: every scene\'s open and close, the finale\'s dance, and each spouse\'s line, through its reader', () => {
    const household = householdOf(noPack())
    expect(household.scenes!.map((s) => s.at)).toEqual([...HOUSEHOLD_SCENES])
    expect(household.finale!.play).toEqual({ game: 'dance', prompt: 'Dance with everyone under the lanterns.' })
    const filled = { ...household, scenes: household.scenes!.map((s) => ({ ...s, each: { [ONE]: placeholderHouseholdBeat(s.at, ONE) } })) }
    expect(checkHousehold(filled, { umas: new Set([ONE]) })).toMatchObject({ errors: [], notes: [] })
    // The pack's own parts stay.
    const own = householdOf(PACK)
    expect(own.scenes!.find((s) => s.at === 5)!.open).toEqual(PACK.household!.scenes!.find((s) => s.at === 5)!.open)
    expect(own.houseLines).toEqual(PACK.household!.houseLines)
  })
})

describe('what\'s written and what\'s a placeholder (the sandbox\'s marks)', () => {
  it('marks each part of a character: the stand-in\'s farmer mostly written, her forager mostly placeholders', () => {
    const one = writtenOf(PACK, ONE)
    const two = writtenOf(PACK, TWO)
    expect(one.map((p) => p.part)).toEqual(two.map((p) => p.part))
    const part = (parts: typeof one, name: string) => parts.find((p) => p.part === name)!
    expect(part(one, 'Her events')).toMatchObject({ written: false, plays: '26 of 30 written; the rest play the default story’s, paying as written' })
    expect(part(two, 'Her events')).toEqual({ part: 'Her events', written: false, plays: '0 of 30 written; the rest play the default story’s, paying as written' })
    expect(part(two, 'Her meeting scene').written).toBe(true)
    expect(part(two, 'Her chats')).toMatchObject({ written: false, plays: 'The default story’s talks, by her stage and temperament' })
    expect(part(two, 'Her occasions')).toMatchObject({ written: false, plays: '0 of 8 written; the rest the default story’s' })
    expect(part(two, 'Her chapters').plays).toContain('Getting to know her')
    expect(part(one, 'Her pet name for you')).toMatchObject({ written: true })
    expect(writtenOf(noPack(), '9100001').every((p) => !p.written)).toBe(true)
  })

  it('lists every placeholder for the manual', () => {
    expect(PLACEHOLDER_TABLE.map((p) => p.gives)).toContain('A heart event')
    expect(PLACEHOLDER_TABLE.every((p) => p.without.length > 0)).toBe(true)
  })
})
