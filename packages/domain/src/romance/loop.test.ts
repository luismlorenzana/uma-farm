// The Uma loop: her stage at each point of her route (and the farmhand's flag), the household's meals, the night's
// companion from Tonight to the morning's greeting, and what the save keeps of them. Invented ids only: the stand-ins
// 9000001–9000003.
import { describe, expect, it } from 'vitest'
import { runNight, type NightContext } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type Love, type SaveV4 } from '../save/v4'
import { checkBible } from '../story/authored'
import { STAND_INS } from '../story/authored.fixture'
import { DEFAULT_MEALS, DEFAULT_MORNINGS } from '../story/default-story'
import { storyPackFrom, type StoryPack } from '../story/pack'
import { readScene } from '../story/scenes'
import { STAND_IN_FILES } from '../story/stand-in'
import { birthdaysOf } from './days'
import { buildHouse, moveSpouse, sleepAt } from './homestead'
import { noteTheNight } from './household'
import {
  chooseCompanion, companions, companionTonight, cookMeal, farmhands, greetingScene, inviteToWork, isFarmhand, lineSteps, MEAL_DAYS, MEAL_POINTS, mealBlock, mealEaters, mealScene,
  mealSpeaker, STAGE_NAMES, umaStage, UMA_STAGES, workBlock,
} from './loop'
import { joinCast } from './meeting.fixture'

const AT = '2026-11-14T10:00:00.000Z'
const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = STAND_INS
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const context = (story: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> = PACK): NightContext => ({ story, birthdays: birthdaysOf(PACK, new Map()) })

/** A named farm on `day`, the stand-ins home in the Dorm at Friendship 0, rich enough to build. */
function farm(day = 30): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day }, gold: 1_000_000 }
  const joined = joinCast(readScene(fresh, 'scene:1:open'), PACK)
  return { ...joined, today: { ...joined.today, bonds: {} } }
}
const withLove = (save: SaveV4, id: string, love: Partial<Love>): SaveV4 => ({ ...save, love: { ...save.love, [id]: { ...save.love[id]!, ...love } } })
const spouse = (save: SaveV4, id: string, wed = 2): SaveV4 => withLove(save, id, { stage: 'spouse', level: 0, points: 0, wed })
/** ONE and TWO married, ONE in the Farmhouse, TWO in Rose Cottage. */
function household(day = 30): SaveV4 {
  const save = buildHouse(spouse(spouse(farm(day), ONE), TWO, 3), 'Rose Cottage')
  return moveSpouse(moveSpouse(save, ONE, 0), TWO, 1)
}

describe('the stages', () => {
  it('reads her stage from her ladders and the farmhand\'s flag: acquaintance, friend, farmhand, sweetheart, engaged, married', () => {
    expect(UMA_STAGES.map((s) => STAGE_NAMES[s])).toEqual(['Acquaintance', 'Friend', 'Farmhand', 'Sweetheart', 'Engaged', 'Married'])
    const save = farm()
    const at = (love: Partial<Love>, hired = false) => {
      const s = withLove(save, ONE, love)
      return umaStage(hired ? { ...s, roster: { ...s.roster, [ONE]: { ...s.roster[ONE]!, farmhand: 30 } } } : s, ONE)
    }
    expect(at({ stage: 'friendship', level: 0 })).toBe('acquaintance')
    expect(at({ stage: 'friendship', level: 2 })).toBe('acquaintance')
    expect(at({ stage: 'friendship', level: 3 })).toBe('friend')
    expect(at({ stage: 'friendship', level: 3 }, true)).toBe('farmhand')
    expect(at({ stage: 'confession', level: 10 }, true)).toBe('farmhand')
    expect(at({ stage: 'romance', level: 0 }, true)).toBe('sweetheart')
    expect(at({ stage: 'proposal', level: 10 })).toBe('sweetheart')
    expect(at({ stage: 'wedding', level: 10 })).toBe('engaged')
    expect(at({ stage: 'spouse', level: 0, wed: 2 })).toBe('married')
    expect(umaStage(newSave('u1', AT), ONE)).toBeNull()
  })

  it('a friend may be invited to work once, for an action, and stays a farmhand at every stage after', () => {
    const save = withLove(farm(), ONE, { level: 3 })
    expect(workBlock(withLove(save, ONE, { level: 2 }), ONE)).toBe('From Friendship 3')
    expect(workBlock(save, ONE)).toBeNull()
    const hired = inviteToWork(save, ONE)
    expect([isFarmhand(hired, ONE), hired.roster[ONE]!.farmhand, hired.today.actions]).toEqual([true, 30, 1])
    expect(farmhands(hired)).toEqual([ONE])
    expect(umaStage(withLove(hired, ONE, { stage: 'spouse', level: 1, wed: 20 }), ONE)).toBe('married')
    expect(isFarmhand(withLove(hired, ONE, { stage: 'spouse', level: 1, wed: 20 }), ONE)).toBe(true)
    expect(workBlock(hired, ONE)).toBe('Works the farm ✓')
  })
})

describe('the household\'s meals', () => {
  it('start with the first wedding: breakfast and dinner, an action each, once each a day', () => {
    expect(mealBlock(farm(), 'breakfast')).toBe('Meals start with your first wedding.')
    expect(() => cookMeal(farm(), 'breakfast')).toThrow('Meals start with your first wedding.')
    const save = household()
    expect(mealBlock(save, 'dinner')).toBeNull()
    const once = cookMeal(save, 'breakfast').save
    expect(once.today.meals).toEqual(['breakfast'])
    expect(once.today.actions).toBe(1)
    expect(mealBlock(once, 'breakfast')).toBe('Breakfast is made ✓')
    expect(() => cookMeal(once, 'breakfast')).toThrow('Breakfast is made ✓')
    const twice = cookMeal(once, 'dinner').save
    expect(twice.today).toMatchObject({ meals: ['breakfast', 'dinner'], actions: 2 })
    expect(() => cookMeal({ ...save, today: { ...save.today, actions: 10 } }, 'dinner')).toThrow('No actions left today.')
    expect(twice.account.updatedAt).toBe(AT)
  })

  it('feeds everyone on the farm and every farmhand through tomorrow, never shortening a longer meal, and pleases each +10', () => {
    let save = household()
    // THREE lives in town and works the farm: she eats too.
    save = { ...withLove(save, THREE, { level: 3 }), dorm: { ...save.dorm, home: save.dorm.home.filter((id) => id !== THREE) } }
    save = inviteToWork(save, THREE)
    save = { ...save, roster: { ...save.roster, [ONE]: { ...save.roster[ONE]!, wellFed: 3 } } }
    expect(mealEaters(save)).toEqual([ONE, TWO, THREE])
    const { save: fed, fed: who, paid } = cookMeal(save, 'dinner')
    expect(who).toEqual([ONE, TWO, THREE])
    expect([fed.roster[ONE]!.wellFed, fed.roster[TWO]!.wellFed, fed.roster[THREE]!.wellFed]).toEqual([3, MEAL_DAYS, MEAL_DAYS])
    expect(paid).toBe(3 * MEAL_POINTS)
    expect(fed.love[TWO]!.points - save.love[TWO]!.points).toBe(MEAL_POINTS)
    // Well fed tomorrow: the night counts a day down.
    const morning = runNight(fed, context())
    expect([morning.roster[TWO]!.wellFed, morning.roster[THREE]!.wellFed]).toEqual([1, 1])
    expect(morning.today.meals).toBeUndefined()
    expect(parseSaveV5(json(fed))).toEqual(fed)
    expect(() => parseSaveV5(json({ ...fed, today: { ...fed.today, meals: ['dinner', 'dinner'] } }))).toThrow()
    expect(() => parseSaveV5(json({ ...fed, today: { ...fed.today, meals: ['lunch'] } }))).toThrow()
  })

  it('plays one spouse\'s meal line as you sit down, the same all day', () => {
    const save = household()
    const who = mealSpeaker(save, 'breakfast')!
    expect([ONE, TWO]).toContain(who)
    expect(mealSpeaker(save, 'breakfast')).toBe(who)
    expect(mealSpeaker(farm(), 'breakfast')).toBeNull()
    const steps = mealScene(save, PACK, who, 'breakfast', 'Her')
    expect(steps[0]).toEqual({ narrate: 'Breakfast for the household, everyone at the table.' })
    const said = steps.flatMap((s) => ('say' in s ? [s.line] : []))
    expect(said).toHaveLength(1)
    expect(DEFAULT_MEALS.breakfast.some((l) => l.includes(said[0]!))).toBe(true)
  })
})

describe('the night\'s companion', () => {
  it('is one spouse with a room: your pick sets her house tonight; without one, tonight\'s house\'s resident least lately', () => {
    const save = household()
    expect(companions(save)).toEqual([ONE, TWO])
    // No pick: the house slept in least lately (both never: the Farmhouse), its resident.
    expect(companionTonight(save)).toBe(ONE)
    const picked = chooseCompanion(save, TWO)
    expect(picked.homestead).toMatchObject({ tonight: 1, alone: null, companion: TWO })
    expect(companionTonight(picked)).toBe(TWO)
    expect(() => chooseCompanion(save, THREE)).toThrow('Only a spouse with a room.')
    // Sleep at (the morning's "misses you") picks a house: its resident is the companion.
    expect(companionTonight(sleepAt(picked, 0))).toBe(ONE)
    expect(sleepAt(picked, 0).homestead.companion).toBeUndefined()
    // A move clears her as tonight's pick.
    const moved = moveSpouse(buildHouse(picked, 'Willow House'), TWO, 2)
    expect(moved.homestead.companion).toBeUndefined()
    expect(parseSaveV5(json(picked))).toEqual(picked)
    expect(() => parseSaveV5(json({ ...picked, homestead: { ...picked.homestead, tonight: 0 } }))).toThrow('expected a spouse in tonight’s house')
  })

  it('the night notes her (her house, her night) and clears the pick; she greets you first in the morning\'s Hearts', () => {
    const picked = chooseCompanion(household(30), TWO)
    const noted = noteTheNight(picked)
    expect(noted.night).toEqual({ house: 1, alone: null, companion: TWO })
    expect(noted.save.love[TWO]!.night).toBe(30)
    expect(noted.save.homestead.companion).toBeUndefined()
    const morning = runNight(picked, context())
    expect(morning.summary!.hearts[0]).toEqual({ kind: 'morning', id: TWO })
    expect(morning.homestead.slept).toEqual([0, 30])
    expect(parseSaveV5(json(morning))).toEqual(morning)
    // The next night with no pick: the house slept in least lately (the Farmhouse) and its resident.
    expect(runNight(morning, context()).summary!.hearts[0]).toEqual({ kind: 'morning', id: ONE })
    // Before the first wedding, no companion and no line.
    expect(runNight(farm(), context()).summary!.hearts.some((h) => h.kind === 'morning')).toBe(false)
    expect(() => parseSaveV5(json({ ...morning, love: { ...morning.love, [THREE]: { ...morning.love[THREE]!, night: 3 } } }))).toThrow('only a spouse')
  })

  it('in two in one house, the one who\'s been your companion least lately', () => {
    let save = household()
    save = moveSpouse(save, TWO, 0)
    expect(companionTonight(save)).toBe(ONE) // wedding order on a tie
    expect(companionTonight(withLove(save, ONE, { night: 12 }))).toBe(TWO)
  })

  it('greets you in a short scene: narration, then her temperament\'s line, her name in', () => {
    const save = household(31)
    const steps = greetingScene(save, PACK, TWO, 'steady', 'Her')
    expect(steps.length).toBeGreaterThanOrEqual(2)
    expect('narrate' in steps[0]!).toBe(true)
    const said = steps.flatMap((s) => ('say' in s ? [s.line] : []))
    expect(DEFAULT_MORNINGS.steady.some((l) => l.includes(said[0]!))).toBe(true)
    expect(greetingScene(save, PACK, TWO, 'steady', 'Her')).toEqual(steps)
    expect(JSON.stringify(steps)).not.toContain('{name}')
  })

  it('plays her own greetings and meal lines when her bible writes them, else the default story\'s', () => {
    const read = checkBible({ mornings: ['“An invented morning.”', 'x'.repeat(161)], meals: { breakfast: ['{name} pours. “An invented breakfast.”'] } }, TWO, { umas: new Set([TWO]) })
    expect(read.errors).toEqual(['mornings 2: its line is 161 characters; the screen shows 160; skipped'])
    const pack: StoryPack = { ...PACK, bibles: new Map([...PACK.bibles, [TWO, read.value!]]) }
    const save = household(31)
    expect(greetingScene(save, pack, TWO, 'steady', 'Her')).toEqual([{ narrate: 'Morning light comes soft through the curtains.' }, { say: TWO, line: 'An invented morning.', emote: 'tender' }])
    expect(mealScene(save, pack, TWO, 'breakfast', 'Her').slice(1)).toEqual([{ narrate: 'Her pours.' }, { say: TWO, line: 'An invented breakfast.', emote: 'happy' }])
    // Dinner isn't written: the default story's.
    expect(DEFAULT_MEALS.dinner.some((l) => l.includes((mealScene(save, pack, TWO, 'dinner', 'Her').find((s) => 'say' in s) as { line: string }).line))).toBe(true)
  })

  it('splits a default line into its narration and what she says', () => {
    expect(lineSteps('Her pours the tea. “Eat up. Big day.”', ONE, 'happy')).toEqual([{ narrate: 'Her pours the tea.' }, { say: ONE, line: 'Eat up. Big day.', emote: 'happy' }])
    expect(lineSteps('“Stay a moment.”', ONE, 'tender')).toEqual([{ say: ONE, line: 'Stay a moment.', emote: 'tender' }])
    expect(lineSteps('No quotes here.', ONE, 'tender')).toEqual([{ say: ONE, line: 'No quotes here.', emote: 'tender' }])
  })
})
