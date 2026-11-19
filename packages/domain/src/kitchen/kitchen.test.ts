// The stove and the Kitchen: the cooking game's rules (tickets, burners, pulls, the score and its tiers, the bots), a
// batch at the stove, the Kitchen's build and levels, its recipes and the shop's shelf, the menu and its refusals, the
// worked play, the assistant's action, term and challenges, a cook's chores, the staff meal at night, a play left
// unfinished, and the save's new fields grown in place. Invented ids; no story pack but the stand-in for the perks.
import { describe, expect, it } from 'vitest'
import { actionsLeft, goToTown } from '../farm/actions'
import { payBuild, raiseBuilds } from '../farm/builds'
import { mealsNeeded, pantryMeals } from '../farm/food'
import { handDay, handsTonight, setTasks } from '../farm/farmhands'
import { placeBuilt } from '../farm/places'
import { talentsD } from '../farm/talents'
import { goodOf, GOODS } from '../goods/ids'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { FISHERY, FOREST } from '../gathering/tables'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type MenuLine, type SaveV4 } from '../save/v4'
import {
  assistantTerm, canMake, cooksDishes, defaultMenu, dishesHeld, finishPlay, kitchenBase, kitchenLevel, kitchenLevelLock, kitchenMakes, kitchenPlayBlock, menuBlock,
  kitchenPerk, menuLine, serveStaffMeal, settleUnfinished, staffBlock, staffPicks, staffTable, startKitchenPlay, startStoveBatch, stoveSeed, upgradeKitchen,
} from './kitchen'
import { KITCHEN_LEVELS } from './levels'
import type { Cast } from '../story/authored'
import { STAND_IN_CAST } from '../story/authored.fixture'
import { storyPackFrom } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import { buyRecipe, kitchenBuilt, knownRecipes, recipeLock, recipeOf, RECIPES, RECIPES_GOLD, recipeShelf, START_RECIPES } from './recipes'
import {
  cookMs, GREEN_MS, newStove, PERFECT_FROM_MS, playStove, STOVE_POINTS, STOVE_SECONDS, stoveScore, tapBurner, tapTicket, tierByGrade, tierCount, tierOf, TICKET_SHAPES,
} from './stove'
import { botTaps } from './stove-bots'

const AT = '2026-11-15T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const [A, B, C] = ['101', '202', '303']
const COOK = '9000004'
const SEEDS = [1234, 2345, 3456, 4567, 5678, 6789, 7890, 8901]
const average = (length: number, bot: 'careful' | 'casual'): number =>
  SEEDS.reduce((n, seed) => n + stoveScore(playStove(seed, length, botTaps(seed, length, bot))), 0) / SEEDS.length

/** A named farm on `day`, with `gold` and goods. */
function farm(gold = 500, items: SaveV4['items'] = {}, day = 20): SaveV4 {
  const save = newSave('kitchen', AT)
  return { ...save, farmer: { name: 'Robin' }, gold, items: { ...save.items, ...items }, calendar: { day } }
}
/** A farm whose Kitchen stands, at `level`, at Farm Rank 3 (250 points) unless `points` say otherwise. */
const withKitchen = (save: SaveV4, level = 1, points = 300): SaveV4 => ({ ...save, buildings: { ...save.buildings, kitchen: level }, farm: { ...save.farm, points } })
/** Spouses home on the farm, each in her room: the Farmhouse's two, then houses of four (extended) as they fill. */
const home = (save: SaveV4, ids: string[]): SaveV4 => {
  const houseOf = (i: number) => (i < 2 ? 0 : 1 + Math.floor((i - 2) / 4))
  const houses = Array.from({ length: houseOf(ids.length - 1) + 1 }, (_, n) => (n === 0 ? save.homestead.houses[0]! : { name: `Invented House ${'ABCDEF'[n - 1]}`, extended: true }))
  return {
    ...save, roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])) },
    love: { ...save.love, ...Object.fromEntries(ids.map((id, i) => [id, { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1, house: houseOf(i) }])) },
    homestead: { ...save.homestead, houses, slept: houses.map(() => 0) },
  }
}
/** Friends from town invited to work on day 1. */
const hands = (save: SaveV4, ids: string[]): SaveV4 => ({
  ...save, roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1 }])) },
  love: { ...save.love, ...Object.fromEntries(ids.map((id) => [id, newLove()])) },
})
const row = (n: number, stars = 1): [number, number, number, number, number] => [0, 1, 2, 3, 4].map((s) => (s === stars - 1 ? n : 0)) as [number, number, number, number, number]

describe('the stove: the cooking game', () => {
  it('scores its tiers at 49/50, 74/75 and 89/90: ×1, ×1.25, ×1.5, ×2 (half up, never below the base) and +0, +0, +1, +2 stars', () => {
    expect([49, 50, 74, 75, 89, 90, 100, 0].map((s) => tierOf(s).name)).toEqual(['Rough', 'Good', 'Good', 'Fine', 'Fine', 'Masterwork', 'Masterwork', 'Rough'])
    expect(['rough', 'good', 'fine', 'masterwork'].map((g) => tierCount(6, tierByGrade(g as 'rough')))).toEqual([6, 8, 9, 12])
    expect(['rough', 'good', 'fine', 'masterwork'].map((g) => tierByGrade(g as 'rough').lift)).toEqual([0, 0, 1, 2])
    expect(tierCount(15, tierByGrade('good'))).toBe(19)
  })

  it('draws a seed\'s tickets every 2.4–3.8 s from 0.8 s, none in the last 12 s, half three-part (18 s), half two-part (13 s)', () => {
    const s = newStove(1234, 60_000)
    expect(s.tickets[0]!.at).toBe(800)
    for (const [i, t] of s.tickets.entries()) {
      expect(t.at).toBeLessThanOrEqual(48_000)
      if (i > 0) expect(t.at - s.tickets[i - 1]!.at).toBeGreaterThanOrEqual(2399)
      if (i > 0) expect(t.at - s.tickets[i - 1]!.at).toBeLessThanOrEqual(3801)
      expect(t.due - t.at).toBe(TICKET_SHAPES[t.parts].wait)
    }
    const all = SEEDS.flatMap((seed) => newStove(seed, 60_000).tickets)
    const three = all.filter((t) => t.parts === 3).length / all.length
    expect(three).toBeGreaterThan(0.35)
    expect(three).toBeLessThan(0.65)
    expect(s.most).toBe(s.tickets.reduce((n, t) => n + 7 * t.parts, 0))
    expect(TICKET_SHAPES[3].cook).toEqual([3200, 2600, 2000])
    expect(TICKET_SHAPES[2].cook).toEqual([2400, 1800])
  })

  it('pulls a part: Perfect +4 in the green\'s middle, Good +2 in the rest, raw −1 too early, burnt −3 past it with 0.7 s of smoke', () => {
    const s0 = newStove(1234, 60_000)
    const t1 = s0.tickets[0]!
    const cook = cookMs(t1, 0)
    // A tap on an empty burner starts the first ticket's first part.
    const started = tapBurner(s0, 0, 1000)
    expect(started.burners[0]).toMatchObject({ ticket: 1, part: 0, start: 1000 })
    expect(tapBurner(started, 0, 1000 + cook + PERFECT_FROM_MS).counts.perfect).toBe(1)
    expect(tapBurner(started, 0, 1000 + cook + 100).counts.good).toBe(1)
    const raw = tapBurner(started, 0, 1000 + cook - 1)
    expect([raw.counts.raw, raw.points, raw.tickets[0]!.cooked[0]]).toEqual([1, STOVE_POINTS.raw, 'todo'])
    const burnt = tapBurner(started, 1, 1000 + cook + GREEN_MS)
    expect([burnt.counts.burnt, burnt.burners[0]!.ticket, burnt.burners[0]!.smokeUntil]).toEqual([1, null, 1000 + cook + GREEN_MS + 700])
    // Smoking: the burner can't start a part until it clears.
    expect(tapBurner(burnt, 0, 1000 + cook + GREEN_MS + 100).burners[0]!.ticket).toBeNull()
  })

  it('serves a ticket whose parts are all on the pass, +3 a part; one whose wait runs out leaves, late −4; a tapped ticket goes first', () => {
    const s0 = newStove(2345, 60_000)
    const t1 = s0.tickets[0]!
    let s = s0
    let at = t1.at
    for (let k = 0; k < t1.parts; k++) {
      s = tapBurner(s, 0, at)
      at += cookMs(t1, k) + 500
      s = tapBurner(s, 0, at)
    }
    expect(s.tickets[0]!.state).toBe('served')
    expect(s.points).toBe(t1.parts * (STOVE_POINTS.perfect + STOVE_POINTS.served))
    const late = playStove(2345, 60_000, [])
    expect(late.counts.late).toBe(late.tickets.length)
    expect(late.points).toBe(late.tickets.length * STOVE_POINTS.late)
    // A tap on the second ticket puts it first.
    const second = s0.tickets[1]!
    const put = tapTicket(s0, second.id, second.at)
    expect(tapBurner(put, 2, second.at).burners[2]!.ticket).toBe(second.id)
  })

  it('scores the same for the same seed and taps, every time; no taps scores 0', () => {
    const taps = botTaps(4567, 60_000, 'careful')
    expect(stoveScore(playStove(4567, 60_000, taps))).toBe(stoveScore(playStove(4567, 60_000, taps)))
    expect(playStove(4567, 60_000, taps)).toEqual(playStove(4567, 60_000, taps))
    expect(stoveScore(playStove(4567, 60_000, []))).toBe(0)
    // A tap out of order, or past the end, is ignored.
    expect(playStove(4567, 60_000, [...taps, { at: 0, burner: 0 }, { at: 99_999, burner: 1 }])).toEqual(playStove(4567, 60_000, taps))
  })

  it('over 8 seeds, a batch\'s 30 s: the careful bot averages 85 or more, the casual 60–80; at the Kitchen\'s 60 s the careful bot holds', () => {
    expect(average(30_000, 'careful')).toBeGreaterThanOrEqual(85)
    const casual = average(30_000, 'casual')
    expect(casual).toBeGreaterThanOrEqual(60)
    expect(casual).toBeLessThanOrEqual(80)
    expect(average(60_000, 'careful')).toBeGreaterThanOrEqual(85)
    // Two burners can't keep the Kitchen's 60 s rail: the casual bot lets some tickets go late there, and lands Good.
    expect(tierOf(average(60_000, 'casual')).grade).toBe('good')
  })
})

describe('a batch at the stove', () => {
  const goods = { carp: row(2, 2), 'button-mushroom': row(3, 1) }
  const play = (score: 'rough' | 'good' | 'fine' | 'masterwork') => {
    const started = startStoveBatch(farm(500, goods), ['carp@2', 'carp@2'])
    const taps = score === 'masterwork' ? botTaps(started.workshops.current!.seed, 30_000, 'careful') : score === 'rough' ? [] : null
    return { started, done: taps === null ? null : finishPlay(started, taps) }
  }

  it('takes its two goods and an action at Start, and keeps the play under way: 30 s on a four-digit seed', () => {
    const { started } = play('rough')
    expect(actionsLeft(started)).toBe(9)
    expect(started.items.carp).toBeUndefined()
    expect(started.workshops.current).toMatchObject({ workshop: 'kitchen', play: 'batch', day: 20, length: STOVE_SECONDS.batch, goods: ['carp@2', 'carp@2'] })
    expect(started.workshops.current!.seed).toBeGreaterThanOrEqual(1000)
    expect(started.workshops.current!.seed).toBeLessThanOrEqual(9999)
    expect(started.farm.counts.plays).toBe(1)
    expect(() => startStoveBatch(started, ['button-mushroom@1', 'button-mushroom@1'])).toThrow('A play is under way.')
    // The next play's seed differs: the count moved on.
    expect(stoveSeed(started)).not.toBe(started.workshops.current!.seed)
  })

  it('makes 6, 8, 9 or 12 meals by its tier, at the goods\' stars +0, +0, +1, +2: never worse than the plain batch', () => {
    const tiers = (['rough', 'good', 'fine', 'masterwork'] as const).map((g) => tierByGrade(g))
    expect(tiers.map((t) => tierCount(6, t))).toEqual([6, 8, 9, 12])
    const rough = play('rough').done!
    expect(rough.result).toMatchObject({ play: 'batch', grade: 'rough', meals: 6, stars: 2, score: 0 })
    expect(rough.save.farm.pantry).toEqual([{ day: 20, stars: 2, meals: 6 }])
    expect(rough.save.workshops.current).toBeNull()
    const best = play('masterwork').done!
    expect(best.result).toMatchObject({ grade: 'masterwork', meals: 12, stars: 4 })
    expect(pantryMeals(best.save)).toBe(12)
  })

  it('a play left unfinished settles as Rough: the plain batch\'s six meals, never less', () => {
    const { started } = play('rough')
    const settled = settleUnfinished(started)
    expect(settled.farm.pantry).toEqual([{ day: 20, stars: 2, meals: 6 }])
    expect(settled.workshops.current).toBeNull()
    expect(settleUnfinished(settled)).toBe(settled)
  })
})

describe('the Kitchen: its build, levels and recipes', () => {
  it('is offered at Farm Rank 3 for 3,000g · 40 logs · 20 vegetables, and stands the next morning at level 1', () => {
    const rich = { ...farm(5000, { 'pine-log': row(40), carrot: row(20) }), farm: { ...farm().farm, points: 300 } }
    const paid = payBuild(rich, 'kitchen')
    expect(paid.gold).toBe(2000)
    expect(kitchenBuilt(paid)).toBe(false)
    const built = raiseBuilds(paid).save
    expect([kitchenBuilt(built), kitchenLevel(built), kitchenBase(built), placeBuilt(built, 'kitchen')]).toEqual([true, 1, 6, true])
  })

  it('buys its levels as a station\'s: 8, 10, 12 and 15 dishes at Farm Rank 4–7 for 5,000g to 40,000g, the level the next morning', () => {
    expect(KITCHEN_LEVELS.map((l) => [l.dishes, l.farmRank, l.cost])).toEqual([[6, 3, 0], [8, 4, 5000], [10, 5, 10000], [12, 6, 20000], [15, 7, 40000]])
    const k = withKitchen(farm(9000), 1, 300)
    expect(kitchenLevelLock(k)).toEqual({ by: 'farm-rank', rank: 4 })
    const rank4 = withKitchen(farm(9000), 1, 1000)
    const bought = upgradeKitchen(rank4)
    expect(bought.gold).toBe(4000)
    expect(kitchenLevelLock(bought)).toEqual({ by: 'tonight', level: 2 })
    expect(() => upgradeKitchen(bought)).toThrow('Level 2 tomorrow.')
    const morning = raiseBuilds(bought).save
    expect([kitchenLevel(morning), kitchenBase(morning)]).toEqual([2, 8])
    expect(kitchenLevel(raiseBuilds({ ...withKitchen(farm(), 5, 30_000), farm: { ...withKitchen(farm(), 5, 30_000).farm, builds: ['kitchen'] } }).save)).toBe(5)
  })

  it('has 80 recipes, each two of its main and one side, every input a good the game has; the first three need only Farm Rank 1\'s goods', () => {
    expect(RECIPES).toHaveLength(80)
    for (const r of RECIPES) {
      expect(r.mains.length, r.dish).toBeGreaterThanOrEqual(1)
      for (const main of r.mains) expect(goodOf(main)).toMatchObject({ family: r.kind, grade: r.grade })
      expect(GOODS_OF(r.side).length, r.dish).toBeGreaterThan(0)
    }
    // Farm Rank 1's goods: the shop's tier-1 seeds' crops, the Woods' finds and the Pond's fish, any season.
    const rank1 = new Set([
      ...Object.values(SHOP_SEEDS).flat().filter((c) => CROPS[c].tier === 1),
      ...Object.values(FOREST.woods.seasons).flat().map(([id]) => id),
      ...Object.values(FISHERY.pond.seasons).flat().map(([id]) => id),
    ])
    for (const dish of START_RECIPES) {
      const r = recipeOf(dish)!
      expect(rank1.has(r.mains[0]!), dish).toBe(true)
      expect([...rank1].some((id) => goodOf(id)?.family === r.side), dish).toBe(true)
    }
  })

  it('knows Carrot Salad, Carp Grill and Button Mushroom Soup once it stands, and her signature dishes; the shop\'s shelf sells the rest', () => {
    const before = { ...farm(), workshops: { ...farm().workshops, recipes: ['dish-fruits-1'] } }
    expect(knownRecipes(before)).toEqual(['dish-fruits-1'])
    expect(recipeShelf(before)).toEqual([])
    const k = withKitchen(before)
    expect(knownRecipes(k)).toEqual([...START_RECIPES, 'dish-fruits-1'])
    expect(recipeShelf(k)).toHaveLength(76)
    expect(recipeOf('dish-vegetables-1')!.price).toBe(600)
    // All 80 come to about 120,000g: the workshops' first gold sink.
    expect(RECIPES_GOLD).toBe(119_450)
    expect(recipeLock(k, 'dish-fish-2')).toBe('The shop is in town.')
    const town = goToTown({ ...k, gold: 2000 })
    const bought = buyRecipe(town, 'dish-fish-2')
    expect(bought.gold).toBe(2000 - recipeOf('dish-fish-2')!.price)
    expect(knownRecipes(bought)).toContain('dish-fish-2')
    expect(() => buyRecipe(bought, 'dish-fish-2')).toThrow('Known already.')
    expect(() => buyRecipe(goToTown(farm(99_999)), 'dish-fish-2')).toThrow('Build the Kitchen first.')
  })
})

describe('the Kitchen\'s play', () => {
  const stocked = (extra: SaveV4['items'] = {}) => withKitchen(farm(500, { carrot: row(6), carp: row(6), basil: row(6), ...extra }))
  const menu: MenuLine[] = [
    { dish: 'dish-vegetables-1', count: 3, main: 'carrot@1', side: 'basil@1' },
    { dish: 'dish-fish-1', count: 3, main: 'carp@1', side: 'basil@1' },
  ]

  it('the worked play: level 1, no assistant, 3 Carrot Salads and 3 Carp Grills from ★1 goods, Fine: 9 dishes, ★2', () => {
    expect(kitchenMakes(menu, tierByGrade('fine'))).toEqual([{ dish: 'dish-vegetables-1', stars: 2, count: 5 }, { dish: 'dish-fish-1', stars: 2, count: 4 }])
    expect(kitchenMakes(menu, tierByGrade('rough'))).toEqual([{ dish: 'dish-vegetables-1', stars: 1, count: 3 }, { dish: 'dish-fish-1', stars: 1, count: 3 }])
    // Each dish's stars: two mains and a side, averaged and rounded down, + the tier's lift.
    expect(kitchenMakes([{ ...menu[0]!, main: 'carrot@3', side: 'basil@1' }], tierByGrade('good'))[0]!.stars).toBe(2)
    expect(kitchenMakes([{ ...menu[0]!, main: 'carrot@5', side: 'basil@5' }], tierByGrade('masterwork'))[0]!.stars).toBe(5)
  })

  it('starts once a day for an action: the menu\'s inputs out at Start, the play under way 60 s; its end makes the dishes', () => {
    const save = stocked()
    expect(kitchenPlayBlock(save, menu)).toBeNull()
    const started = startKitchenPlay(save, menu)
    expect(started.items.carrot).toBeUndefined()
    expect(started.items.carp).toBeUndefined()
    expect(started.items.basil).toBeUndefined()
    expect(actionsLeft(started)).toBe(9)
    expect(started.workshops.played.kitchen).toBe(20)
    expect(started.workshops.current).toMatchObject({ play: 'kitchen', length: STOVE_SECONDS.kitchen, menu })
    expect(kitchenPlayBlock({ ...started, workshops: { ...started.workshops, current: null } }, menu)).toBe('The Kitchen plays once a day.')
    const taps = botTaps(started.workshops.current!.seed, 60_000, 'careful')
    const { save: done, result } = finishPlay(started, taps)
    expect(result).toMatchObject({ play: 'kitchen', grade: 'masterwork', score: 100 })
    expect(result.dishes).toEqual([{ dish: 'dish-vegetables-1', stars: 3, count: 6 }, { dish: 'dish-fish-1', stars: 3, count: 6 }])
    expect(done.items['dish-vegetables-1']).toEqual(row(6, 3))
    expect(done.farm.counts['cooked:dish-fish-1']).toBe(6)
    expect(done.workshops.best.kitchen).toBe(100)
    expect(done.workshops.current).toBeNull()
  })

  it('refuses in the loop\'s words: short goods, the base unshared, a recipe not known, the wrong main', () => {
    const save = stocked()
    expect(menuBlock(save, [{ ...menu[0]!, count: 4 }, { ...menu[1]!, count: 2 }])).toBe('Short 2 Carrot.')
    expect(menuBlock(withKitchen(farm(500, { carrot: row(6), carp: row(4), basil: row(6) })), menu)).toBe('Short 2 Carp.')
    expect(menuBlock(save, [menu[0]!])).toBe('The menu shares 6 dishes.')
    expect(menuBlock(save, [{ ...menu[0]!, dish: 'dish-fish-2' }])).toBe('You don’t know that recipe.')
    expect(menuBlock(save, [{ ...menu[0]!, main: 'potato@1', count: 6 }])).toMatch(/isn’t a main/)
    expect(menuBlock(save, [])).toBe('Choose a recipe.')
    expect(() => startKitchenPlay(farm(), menu)).toThrow('Build the Kitchen first.')
    expect(() => startKitchenPlay(withKitchen(farm(500, { carp: row(2) })), menu)).toThrow('Short 6 Carrot.')
  })

  it('offers a menu to start: the recipes the Warehouse can make, the base shared evenly, the star held most', () => {
    const save = stocked({ 'button-mushroom': row(1), potato: row(1) })
    expect(canMake(save, 'dish-vegetables-1')).toBe(3)
    expect(defaultMenu(save)).toEqual(menu)
    const mixed = withKitchen(farm(500, { carrot: [2, 4, 0, 0, 0], basil: row(6), carp: row(6) }))
    expect(menuLine(mixed, 'dish-vegetables-1', 3).main).toBe('carrot@2')
    expect(defaultMenu(withKitchen(farm()))).toEqual([{ dish: 'dish-vegetables-1', count: 6, main: 'carrot@1', side: 'basil@1' }])
    // Two recipes sharing a side's family: the second takes the herb the first leaves enough of.
    const herbs = withKitchen(farm(500, { carrot: row(6), carp: row(6), basil: row(4), mint: row(3) }))
    const shared = defaultMenu(herbs)
    expect(shared.map((l) => l.side)).toEqual(['basil@1', 'mint@1'])
    expect(menuBlock(herbs, shared)).toBeNull()
  })

  it('takes an assistant\'s action tonight: her term is her Cooking × her rank\'s workshop yield; Cooking practice and cooking\'s challenges', () => {
    const save = setTasks(hands(stocked(), [A]), A, [{ kind: 'forage', area: 'woods' }])
    expect(assistantTerm(save, A, talentsD)).toBeCloseTo(1.05)
    const started = startKitchenPlay(save, menu, A)
    expect(started.today.assistant).toBe(A)
    expect(started.workshops.current!.assistant).toBe(A)
    // Settled in (invited on day 1, it's day 20): four actions, one of them the play's.
    expect(handDay(started, A)).toMatchObject({ actions: 4, kitchen: 1 })
    const tonight = handsTonight(started, started, talentsD, null)
    expect(tonight.lines[0]).toMatchObject({ actions: 4, spent: 4, done: { forage: 3 }, kitchen: 1 })
    const taps = botTaps(started.workshops.current!.seed, 60_000, 'careful')
    const { save: done, result } = finishPlay(started, taps)
    // 6 × 2 × 1.05 = 12.6: 13 dishes.
    expect(result.dishes.reduce((n, d) => n + d.count, 0)).toBe(13)
    expect(done.roster[A]!.practice?.cook).toBe(1)
    expect(done.roster[A]!.ranks.cooking.challenge).toBe(1)
    expect(() => startKitchenPlay(stocked(), menu, B)).toThrow('Only a farmhand assists.')
  })

  it('adds a cook\'s night chores as dishes, and her line\'s +10% (+20% from R5) as the assistant', () => {
    // A cook: an invented Uma whose favourite line is cooking, a spouse home on the farm.
    const cast: Cast = { ...json(STAND_IN_CAST), umas: [...json(STAND_IN_CAST).umas, { characterId: COOK, outfitId: '900000401', calling: 'farming', paragraph: 'Invented.' }] }
    const pack = storyPackFrom({ ...STAND_IN_FILES, cast, umas: { ...STAND_IN_FILES.umas, [COOK]: { favouriteLine: 'cooking' } } })
    const at = (stage: 'friendship' | 'romance' | 'spouse', level: number) => ({ ...newLove(), stage, level, ...(stage === 'spouse' ? { wed: 1, house: 0 } : {}) })
    const cook = (love: ReturnType<typeof at>) => ({ ...home(stocked(), [COOK]), love: { [COOK]: love } })
    // On the farm is a spouse in her room, or a farmhand on her farm day: a friend or a sweetheart in town does no chores.
    expect(cooksDishes(cook(at('friendship', 6)), pack)).toBe(0)
    expect(cooksDishes(cook(at('romance', 7)), pack)).toBe(0)
    expect(cooksDishes(cook(at('spouse', 0)), pack)).toBe(2)
    expect(cooksDishes(cook(at('spouse', 4)), pack)).toBe(3)
    expect(cooksDishes(cook({ ...at('spouse', 0), house: undefined }), pack)).toBe(0)
    expect(cooksDishes({ ...cook(at('spouse', 0)), buildings: { dorm: 1 } }, pack)).toBe(0)
    expect(kitchenMakes(menu, tierByGrade('rough'), 1, cooksDishes(cook(at('spouse', 0)), pack)).reduce((n, d) => n + d.count, 0)).toBe(8)
    // As the assistant, her line's bonus at the Kitchen.
    const hand = (love: ReturnType<typeof at>) => ({ ...hands(stocked(), [COOK]), love: { [COOK]: love } })
    // A farmhand on her farm day (Summer 8: her default days are 1, 4, 7 and 10) cooks; on her town day (Summer 7) she's in town.
    expect(cooksDishes(hand(at('friendship', 6)), pack)).toBe(1)
    expect(cooksDishes({ ...hand(at('friendship', 6)), calendar: { day: 19 } }, pack)).toBe(0)
    expect(kitchenPerk(hand(at('friendship', 2)), pack, COOK)).toBeCloseTo(0.1)
    expect(kitchenPerk(hand(at('romance', 5)), pack, COOK)).toBeCloseTo(0.2)
    expect(assistantTerm(hand(at('friendship', 2)), COOK, talentsD, pack)).toBeCloseTo(1.05 * 1.1)
    expect(kitchenPerk(hand(at('friendship', 2)), pack, A)).toBe(0)
  })

  it('a play left unfinished settles as Rough at the night\'s start: its base, its inputs never lost', () => {
    const started = startKitchenPlay(stocked(), menu)
    const morning = runNight(started, {})
    expect(morning.workshops.current).toBeNull()
    expect(dishesHeld(morning).reduce((n, d) => n + d.count, 0)).toBe(6)
    expect(morning.workshops.best.kitchen).toBeUndefined()
  })
})

describe('the staff meal', () => {
  const twelve = (dishes: SaveV4['items']) => {
    // The farmer, eight spouses home and three farmhands on their farm day: 12 mouths.
    const ids = Array.from({ length: 8 }, (_, i) => String(9001 + i))
    let save = hands(home(withKitchen(farm(5000, dishes)), ids), [A, B, C])
    for (const id of [A, B, C]) save = setTasks(save, id, [{ kind: 'forage', area: 'woods' }])
    return { save, ids }
  }

  it('serves 12 mouths 4 dishes, the most stars first: they eat it in place of their meals, the pantry untouched, and are well fed by its stars', () => {
    const { save, ids } = twelve({ 'dish-fish-1': row(3, 3), 'dish-vegetables-1': row(5, 4) })
    const withPantry = { ...save, farm: { ...save.farm, pantry: [{ day: 20, stars: 2, meals: 10 }] } }
    expect(staffTable(withPantry)).toEqual({ mouths: 12, dishes: 4 })
    expect(staffPicks(withPantry)).toEqual(['dish-vegetables-1@4', 'dish-vegetables-1@4', 'dish-vegetables-1@4', 'dish-vegetables-1@4'])
    const served = serveStaffMeal(withPantry)
    expect(served.today.staff).toEqual({ mouths: 12, days: 2 })
    expect(served.items['dish-vegetables-1']).toEqual(row(1, 4))
    expect(served.farm.counts.meals).toBe(1)
    expect(mealsNeeded(served, null)).toBe(0)
    expect(staffBlock(served)).toBe('Served today.')
    const morning = runNight(served, {})
    expect(morning.farm.pantry).toEqual([{ day: 20, stars: 2, meals: 10 }])
    expect(morning.summary!.money).toContainEqual({ kind: 'staff', mouths: 12, days: 2 })
    expect(morning.summary!.money!.some((m) => m.kind === 'takeout')).toBe(false)
    // ★4: two days of well fed from tomorrow.
    for (const id of [...ids, A, B, C]) expect(morning.roster[id]!.wellFed, id).toBe(2)
    expect(morning.today.fed).toEqual([A, B, C])
    expect(runNight(morning, {}).roster[A]!.wellFed).toBe(1)
  })

  it('feeds by the lowest stars served: ★1–2 through tomorrow, ★3–4 two days, ★5 three; never shortening a meal running', () => {
    const { save } = twelve({ 'dish-fish-1': row(3, 5), 'dish-vegetables-1': row(1, 1) })
    const picks = ['dish-fish-1@5', 'dish-fish-1@5', 'dish-fish-1@5', 'dish-vegetables-1@1']
    expect(serveStaffMeal(save, picks).today.staff!.days).toBe(1)
    expect(() => serveStaffMeal(save, ['dish-fish-1@5', 'dish-fish-1@5', 'dish-fish-1@5', 'dish-fish-1@5'])).toThrow('Not enough in the Warehouse.')
    const five = twelve({ 'dish-fish-1': row(4, 5) }).save
    const fed = { ...five, roster: { ...five.roster, [A]: { ...five.roster[A]!, wellFed: 9 } } }
    const morning = runNight(serveStaffMeal(fed), {})
    expect(morning.roster['9001']!.wellFed).toBe(3)
    expect(morning.roster[A]!.wellFed).toBe(8)
  })

  it('serves partial tables and feeds the remaining mouths from the pantry or takeout', () => {
    const { save } = twelve({ 'dish-fish-1': row(4, 2) })
    const served = serveStaffMeal(save)
    // A thirteenth comes to the table after it was served: she eats from the pantry (takeout here).
    const more = setTasks(hands(served, ['404']), '404', [{ kind: 'forage', area: 'woods' }])
    const morning = runNight(more, {})
    expect(morning.summary!.money).toContainEqual({ kind: 'staff', mouths: 12, days: 1 })
    expect(morning.summary!.money).toContainEqual({ kind: 'takeout', meals: 2, paid: 30, due: 30 })
    const partial = serveStaffMeal(twelve({ 'dish-fish-1': row(3) }).save)
    expect(partial.today.staff).toEqual({ mouths: 9, days: 1 })
    expect(mealsNeeded(partial, null)).toBe(6)
    expect(runNight(partial, {}).summary!.money).toContainEqual({ kind: 'takeout', meals: 6, due: 90, paid: 90 })
    expect(staffBlock(farm())).toBe('Build the Kitchen first.')
  })
})

describe('the save', () => {
  it('reads an older save as no play and no staff meal, and a play from before the stove (never written) as none', () => {
    const save = withKitchen(farm())
    const older = json(save) as unknown
    expect(parseSaveV5(older).workshops.current).toBeNull()
    expect(parseSaveV5(older).today.staff).toBeUndefined()
    const shape = json({ ...save, roster: { [A]: newRosterUma(1) }, love: { [A]: newLove() }, workshops: { ...save.workshops, current: { workshop: 'kitchen', assistant: A, day: 3 } } })
    expect(parseSaveV5(shape).workshops.current).toBeNull()
    expect(parseSaveV5(json(save))).toEqual(save)
  })

  it('round-trips a play under way, tonight\'s staff meal and the assistant; refuses a broken one', () => {
    const batch = startStoveBatch(farm(500, { carp: row(2) }), ['carp@1', 'carp@1'])
    expect(parseSaveV5(json(batch))).toEqual(batch)
    const save = setTasks(hands(withKitchen(farm(500, { carrot: row(12), basil: row(6), 'dish-fish-1': row(4) })), [A]), A, [{ kind: 'forage', area: 'woods' }])
    const started = serveStaffMeal(startKitchenPlay(save, [{ dish: 'dish-vegetables-1', count: 6, main: 'carrot@1', side: 'basil@1' }], A))
    expect(started.today).toMatchObject({ assistant: A, staff: { mouths: 2, days: 1 } })
    expect(parseSaveV5(json(started))).toEqual(started)
    const broken = json({ ...started, workshops: { ...started.workshops, current: { ...started.workshops.current!, seed: 12 } } })
    expect(() => parseSaveV5(broken)).toThrow('seed')
    const ghost = json({ ...started, today: { ...started.today, assistant: '999' } })
    expect(() => parseSaveV5(ghost)).toThrow('assistant')
  })
})

/** The goods of a family. */
const GOODS_OF = (family: string): string[] => GOODS.filter((g) => g.family === family).map((g) => g.id)
