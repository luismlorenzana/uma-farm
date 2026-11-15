// Farmhands and aptitudes: her day's actions (three, settled in, married, well fed this morning, at the farm's pace), the
// work board's tasks and their refusals, her aptitudes from her talent, rank points and practice, the tricks, and the
// night's run of her work: the field watered and harvested, the hauls, the loads, rank points and challenges, the
// morning's lines, the save. Invented ids; no story pack unless named.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS } from './actions'
import { upkeepOf, UPKEEP_RESIDENT } from './economy'
import {
  aptitudeLevelOf, aptitudeOf, APTITUDE_POINTS, aptitudeQuality, aptitudeUps, aptitudesOf, aptitudeYield, BIG_LOAD, fedThisMorning, handDay, handsInOrder,
  handsTonight, handTonight, HAND_ACTIONS, MAX_APTITUDE, setTasks, SETTLED_AFTER, TALENT_START, taskLock, taskTiles, tilesAnAction, TRICK_AT, tricksAt,
} from './farmhands'
import { clearPlot, rowOfPlot } from '../fields/plots'
import { talentsD, type TalentOf } from './talents'
import { cookMeal } from '../romance/loop'
import { runNight, type NightContext } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { bareTile, FIELD_COLUMNS, fieldTiles, newLove, newRosterUma, newSave, START_CLEAR, type AptitudeId, type FarmTask, type SaveV4, type Tile } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const CONTEXT: NightContext = {}
const [A, B] = ['101', '202']

/** A farm on `day` with two farmhands invited on day 1, both living in town, no tasks yet. */
function farm(day = 2): SaveV4 {
  const save = newSave('hands', AT)
  const hand = { ...newRosterUma(1), farmhand: 1 }
  return { ...save, farmer: { name: 'Sim' }, calendar: { day }, roster: { [A]: hand, [B]: hand }, love: { [A]: newLove(), [B]: newLove() } }
}
/** The tiles growing a crop (stage 0, dry), each tilled. */
const growing = (save: SaveV4, tiles: readonly number[], crop: Tile['crop'] = 'carrot'): SaveV4 =>
  ({ ...save, fields: { plots: [{ tiles: fieldTiles(save).map((t, i) => (tiles.includes(i) ? { ...bareTile('tilled'), crop } : t)) }] } })
/** The tiles ripe. */
const ripe = (save: SaveV4, tiles: readonly number[]): SaveV4 =>
  ({ ...save, fields: { plots: [{ tiles: fieldTiles(save).map((t, i) => (tiles.includes(i) ? { ...bareTile('tilled'), crop: 'carrot' as const, growth: 4, ready: true } : t)) }] } })
const tasks = (save: SaveV4, id: string, list: FarmTask[]): SaveV4 => setTasks(save, id, list)
const practice = (save: SaveV4, id: string, aptitude: AptitudeId, n: number): SaveV4 =>
  ({ ...save, roster: { ...save.roster, [id]: { ...save.roster[id]!, practice: { ...save.roster[id]!.practice, [aptitude]: n } } } })
const night = (save: SaveV4, context: NightContext = CONTEXT): SaveV4 => runNight(save, context)
const ROW1 = Array.from({ length: FIELD_COLUMNS }, (_, i) => i)

describe('her day', () => {
  it('gives a farmhand 3 actions, +1 settled in a season on, +2 once she\'s your spouse, +1 well fed this morning', () => {
    expect(handDay(farm(), A)).toEqual({ base: HAND_ACTIONS, settled: 0, spouse: 0, fed: 0, half: false, actions: 3 })
    expect(handDay(farm(1 + SETTLED_AFTER), A)!.actions).toBe(4)
    expect(handDay(farm(SETTLED_AFTER), A)!.actions).toBe(3)
    const wed = { ...farm(1 + SETTLED_AFTER), love: { ...farm().love, [A]: { ...newLove(), stage: 'spouse' as const, level: 0, wed: 2, house: 0 } } }
    expect(handDay(wed, A)!.actions).toBe(6)
    const fed = { ...farm(), today: { ...farm().today, fed: [A] } }
    expect(handDay(fed, A)).toMatchObject({ fed: 1, actions: 4 })
    expect(handDay(fed, B)!.actions).toBe(3)
    expect(handDay({ ...farm(), roster: { [A]: newRosterUma(1) } }, A)).toBeNull()
  })

  it('works at half pace from the second short night of upkeep: half, rounded down, never below one; the farmer\'s ten untouched', () => {
    const short = (save: SaveV4, nights: number): SaveV4 => ({ ...save, farm: { ...save.farm, owed: 40, short: nights } })
    expect(handDay(short(farm(), 1), A)).toMatchObject({ half: false, actions: 3 })
    expect(handDay(short(farm(), 2), A)).toMatchObject({ half: true, actions: 1 })
    expect(handDay(short(farm(1 + SETTLED_AFTER), 2), A)!.actions).toBe(2)
    expect(actionsLeft(short(farm(), 2))).toBe(DAY_ACTIONS)
  })

  it('works in the order you invited them, then by id', () => {
    const save = farm()
    expect(handsInOrder(save)).toEqual([A, B])
    expect(handsInOrder({ ...save, roster: { ...save.roster, [A]: { ...save.roster[A]!, farmhand: 2 } } })).toEqual([B, A])
  })
})

describe('the work board', () => {
  it('sets her tasks, free, in your order, the tiles sorted; any Uma does any task', () => {
    const save = tasks({ ...farm(), buildings: { ...farm().buildings, mill: 1 } }, A, [
      { kind: 'water', tiles: [9, 0, 1] }, { kind: 'load', station: 'mill' }, { kind: 'fish', spot: 'pond' }, { kind: 'forage', area: 'woods' },
    ])
    expect(save.roster[A]!.tasks).toEqual([{ kind: 'water', tiles: [0, 1, 9] }, { kind: 'load', station: 'mill' }, { kind: 'fish', spot: 'pond' }, { kind: 'forage', area: 'woods' }])
    expect(save.today.actions).toBe(0)
    expect(parseSaveV5(json(save))).toEqual(save)
  })

  it('refuses one who isn\'t a farmhand, past six tasks, and a task that can\'t go on the board', () => {
    const save = farm()
    expect(() => setTasks({ ...save, roster: { ...save.roster, [A]: newRosterUma(1) } }, A, [])).toThrow('Invite her to work first.')
    expect(() => setTasks(save, A, Array.from({ length: 7 }, () => ({ kind: 'fish' as const, spot: 'pond' as const })))).toThrow('6 tasks at most.')
    expect(() => setTasks(save, A, [{ kind: 'water', tiles: [] }])).toThrow('Choose its tiles.')
    expect(() => setTasks(save, A, [{ kind: 'water', tiles: [40] }])).toThrow('Those aren’t the plot’s tiles.')
    expect(() => setTasks(save, A, [{ kind: 'load', station: 'mill' }])).toThrow('Build it first.')
    expect(() => setTasks(save, A, [{ kind: 'fish', spot: 'river' }])).toThrow('Opens at Farm Rank 2.')
    expect(taskLock(save, { kind: 'forage', area: 'woods' })).toBeNull()
  })

  it('keeps the board in the save, and refuses tasks on one who isn\'t a farmhand', () => {
    const raw = json(tasks(farm(), A, [{ kind: 'plant', tiles: [0], crop: 'carrot' }])) as unknown as { roster: Record<string, Record<string, unknown>> }
    expect(parseSaveV5(json(raw)).roster[A]!.tasks).toEqual([{ kind: 'plant', tiles: [0], crop: 'carrot' }])
    delete raw.roster[A]!.farmhand
    expect(() => parseSaveV5(raw)).toThrow('save.roster.101.tasks: only a farmhand’s')
    const bad = json(farm()) as unknown as { roster: Record<string, Record<string, unknown>> }
    bad.roster[A]!.tasks = [{ kind: 'fish', spot: 'moon' }]
    expect(() => parseSaveV5(bad)).toThrow(/save.roster.101.tasks.0.spot: expected one of/)
    bad.roster[A]!.tasks = []
    bad.roster[A]!.practice = { dance: 3 }
    expect(() => parseSaveV5(bad)).toThrow('save.roster.101.practice.dance: unknown aptitude')
  })
})

describe('aptitude', () => {
  const D: TalentOf = talentsD
  const fromS: TalentOf = (_id, a) => (a === 'fishing' ? 7 : 0)

  it('climbs ten levels on its points: level L to L + 1 takes 10 × L', () => {
    expect(APTITUDE_POINTS).toEqual([0, 10, 30, 60, 100, 150, 210, 280, 360, 450])
    expect([0, 9, 10, 29, 30, 449, 450, 9999].map(aptitudeLevelOf)).toEqual([1, 1, 2, 2, 3, 9, 10, MAX_APTITUDE])
    expect([1, 2, 10].map(aptitudeQuality)).toEqual([0, 0.1, 0.9])
    expect([1, 2, 10].map(aptitudeYield)).toEqual([1, 1.05, 1.45])
  })

  it('starts from her talent, adds a point for every 20 rank points in its activity, and one for each action she spends', () => {
    expect(TALENT_START).toEqual([0, 0, 5, 10, 20, 30, 45, 60])
    const uma = farm().roster[A]!
    expect(aptitudeOf(uma, 'water', (a) => D(A, a))).toMatchObject({ start: 10, ranked: 0, practice: 0, points: 10, level: 2, next: 30 })
    expect(aptitudeOf(uma, 'fish', (a) => fromS(A, a))).toMatchObject({ start: 60, level: 4 })
    expect(aptitudeOf(uma, 'water', (a) => fromS(A, a))).toMatchObject({ start: 0, level: 1, next: 10 })
    const ranked = { ...uma, ranks: { ...uma.ranks, farming: { points: 45, rank: 1 as const, challenge: 0 } }, practice: { water: 12 } }
    expect(aptitudeOf(ranked, 'water', (a) => D(A, a))).toMatchObject({ start: 10, ranked: 2, practice: 12, points: 24, level: 2 })
    expect(aptitudesOf(uma, (a) => D(A, a)).map((x) => x.id)).toEqual(['harvest', 'water', 'plant', 'till', 'forage', 'chop', 'fish', 'mill', 'sawmill', 'smokehouse', 'care', 'mine', 'smelter', 'cutter', 'cook'])
  })

  it('opens tricks with her level: two tiles an action, a row watered in one, and the next to come', () => {
    expect(tilesAnAction('water', TRICK_AT.waterTwo - 1)).toBe(1)
    expect(tilesAnAction('water', TRICK_AT.waterTwo)).toBe(2)
    expect(tilesAnAction('harvest', TRICK_AT.harvestTwo)).toBe(2)
    expect(tilesAnAction('plant', TRICK_AT.plantTwo)).toBe(2)
    expect(tricksAt('water', 1)).toEqual({ open: [], next: { aptitude: 'water', level: 3, what: 'Two tiles an action' } })
    expect(tricksAt('water', 6).open.map((t) => t.what)).toEqual(['Two tiles an action', 'A row an action: every dry tile of hers in one row'])
    expect(tricksAt('water', 6).next).toBeNull()
  })
})

describe('her night', () => {
  it('waters the field and casts at the pond without your actions, and the morning reports her work', () => {
    let save = growing(farm(), [...START_CLEAR])
    save = tasks(save, A, [{ kind: 'water', tiles: [...START_CLEAR] }])
    save = tasks(save, B, [{ kind: 'fish', spot: 'pond' }])
    const morning = night(save)
    // Three actions each: A waters three tiles (Watering 2: a tile an action), B casts three times.
    expect(fieldTiles(morning).filter((t) => t.growth === 1)).toHaveLength(3)
    expect(morning.summary!.work.slice(0, 2)).toEqual([
      { kind: 'farmhand', id: A, actions: 3, spent: 3, half: false, fed: false, tasks: 1, done: { water: 3 }, items: 0 },
      { kind: 'farmhand', id: B, actions: 3, spent: 3, half: false, fed: false, tasks: 1, done: { fish: 3 }, items: 3 },
    ])
    expect(morning.summary!.work[2]).toEqual({ kind: 'grew', tiles: 3, ripe: 0 })
    expect(Object.keys(morning.items).filter((id) => id === 'carp' || id === 'trout').length).toBeGreaterThan(0)
    expect(morning.roster[A]!.practice).toEqual({ water: 3 })
    expect(morning.roster[B]!.practice).toEqual({ fish: 3 })
    // A day of work pays rank points in her place's activity, and her catches count toward her challenge.
    expect(morning.roster[A]!.ranks.farming.points).toBe(10)
    expect(morning.roster[B]!.ranks.fishing).toMatchObject({ points: 10, challenge: 3 })
    expect(morning.today.actions).toBe(0)
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })

  it('takes the field and the loads first, in your order, then shares what\'s left among her gathering, a turn each', () => {
    let save = growing({ ...farm(1 + SETTLED_AFTER), buildings: { ...farm().buildings, mill: 1 }, items: { ...farm().items, wheat: [5, 0, 0, 0, 0] } }, [0])
    // Settled in: four actions. Fish and forage come after the watering and the load, whatever their order.
    save = tasks(save, A, [{ kind: 'fish', spot: 'pond' }, { kind: 'forage', area: 'woods' }, { kind: 'water', tiles: [0] }, { kind: 'load', station: 'mill' }])
    save = tasks(save, B, [])
    const line = handsTonight(save, save, talentsD, null).lines[0]!
    expect(line).toMatchObject({ actions: 4, spent: 4, done: { water: 1, load: 1, fish: 1, forage: 1 } })
    expect(handTonight(save, A, talentsD, null)).toEqual(line)
  })

  it('stops a task when it\'s done for the day, and idles with nothing left to do', () => {
    let save = growing(farm(), [0])
    save = tasks(save, A, [{ kind: 'water', tiles: [0, 1] }, { kind: 'harvest', tiles: [0, 1] }])
    const { lines } = handsTonight(save, save, talentsD, null)
    expect(lines[0]).toMatchObject({ actions: 3, spent: 1, done: { water: 1 } })
    expect(lines[1]).toMatchObject({ actions: 3, spent: 0, done: {} })
    // Two farmhands on the same tiles: the first waters them, the second finds them watered.
    const both = tasks(tasks(growing(farm(), [0, 1]), A, [{ kind: 'water', tiles: [0, 1] }]), B, [{ kind: 'water', tiles: [0, 1] }])
    expect(handsTonight(both, both, talentsD, null).lines.map((l) => l.spent)).toEqual([2, 0])
  })

  it('harvests, plants what will ripen in time, and clears and tills, each an action a tile to start', () => {
    let save = ripe(farm(), [0])
    save = { ...save, fields: { plots: [{ tiles: fieldTiles(save).map((t, i) => (i === 1 ? bareTile('tilled') : i === 2 ? bareTile('weeds') : t)) }] } }
    save = tasks(save, A, [{ kind: 'harvest', tiles: [0] }, { kind: 'plant', tiles: [1] }, { kind: 'till', tiles: [2] }])
    const after = handsTonight(save, save, talentsD, null)
    expect(after.lines[0]).toMatchObject({ actions: 3, spent: 3, done: { harvest: 1, plant: 1, till: 1 } })
    expect(fieldTiles(after.save)[0]).toMatchObject({ crop: null, ground: 'tilled' })
    expect(fieldTiles(after.save)[1]).toMatchObject({ crop: 'carrot', growth: 0 })
    expect(fieldTiles(after.save)[2]!.ground).toBe('clear')
    expect(after.save.items.carrot?.[0]).toBeGreaterThan(0)
    expect(after.save.roster[A]!.ranks.farming.challenge).toBe(1)
    expect(after.tended).toEqual([{ outfitId: A }])
    // On a season's last day, a Carrot can't ripen: she plants nothing.
    const late = { ...save, calendar: { day: 12 } }
    expect(handsTonight(late, late, talentsD, null).lines[0]!.done.plant).toBeUndefined()
  })

  it('opens her tricks as she levels: two tiles an action, a row watered in one, a field tile cleared and tilled in one', () => {
    const row = growing(farm(), ROW1)
    const water = (n: number) => {
      const save = tasks(practice(row, A, 'water', n), A, [{ kind: 'water', tiles: ROW1 }])
      return handsTonight(save, save, talentsD, null).lines[0]!
    }
    // D talent: 10 to start. Watering 3 at 30 points, Watering 6 at 150.
    expect(water(0)).toMatchObject({ spent: 3, done: { water: 3 } })
    expect(water(20)).toMatchObject({ spent: 3, done: { water: 6 } })
    expect(water(140)).toMatchObject({ spent: 1, done: { water: 8 } })
    const weeds = { ...farm(), fields: { plots: [{ tiles: fieldTiles(farm()).map((t, i) => (i < 3 ? bareTile('weeds') : t)) }] } }
    const till = (n: number) => {
      const save = tasks(practice(weeds, A, 'till', n), A, [{ kind: 'till', tiles: [0, 1, 2] }])
      return fieldTiles(handsTonight(save, save, talentsD, null).save).slice(0, 3).map((t) => t.ground)
    }
    expect(till(0)).toEqual(['tilled', 'clear', 'weeds'])
    expect(till(50)).toEqual(['tilled', 'tilled', 'tilled'])
  })

  it('loads a station with what it holds most of, up to 8, or 12 once she has the trick', () => {
    const base = { ...farm(), buildings: { ...farm().buildings, mill: 1 }, items: { ...farm().items, wheat: [20, 3, 0, 0, 0] as [number, number, number, number, number] } }
    // A G talent: Milling 1 to start, ×1 yield, so a load comes out as it goes in.
    const G: TalentOf = () => 0
    const load = (n: number) => {
      const save = tasks(practice(base, A, 'mill', n), A, [{ kind: 'load', station: 'mill' }])
      return handsTonight(save, save, G, null).save
    }
    expect(load(0).loads.mill).toEqual({ item: 'wheat-flour@1', count: 8 })
    expect(load(0).items.wheat).toEqual([12, 3, 0, 0, 0])
    const big = load(100)
    expect(big.items.wheat).toEqual([20 - BIG_LOAD, 3, 0, 0, 0])
    expect(big.loads.mill!.count).toBeGreaterThanOrEqual(BIG_LOAD)
  })

  it('rises over days: her practice climbs, and the morning says when an aptitude reaches a level', () => {
    let save = tasks(growing(farm(), [...START_CLEAR]), A, [{ kind: 'water', tiles: [...START_CLEAR] }])
    const ups: string[] = []
    for (let d = 0; d < 8; d++) {
      save = growing(night(save), [...START_CLEAR])
      ups.push(...save.summary!.ranks.flatMap((r) => (r.kind === 'aptitude' ? [`${r.outfitId} ${r.aptitude} ${r.level}`] : [])))
    }
    // 3 a night from 10: 30 points (Watering 3) on the seventh night.
    expect(save.roster[A]!.practice!.water).toBeGreaterThanOrEqual(24)
    expect(ups).toEqual([`${A} water 3`])
    expect(aptitudeUps(farm(), save, talentsD)).toEqual([{ kind: 'aptitude', outfitId: A, aptitude: 'water', level: 3 }])
  })

  it('gives every farmhand one more action the day after a household meal, once a meal, never twice for two', () => {
    const wed = (save: SaveV4): SaveV4 => ({ ...save, love: { ...save.love, 909: { ...newLove(), stage: 'spouse', level: 0, wed: 1, house: 0 } }, roster: { ...save.roster, 909: newRosterUma(1) } })
    let save = tasks(wed(farm()), A, [{ kind: 'fish', spot: 'pond' }])
    save = cookMeal(cookMeal(save, 'breakfast').save, 'dinner').save
    // The meal's day: her three; the morning after, well fed: four; the day after that, three again.
    let morning = night(save)
    expect(morning.summary!.work[0]).toMatchObject({ id: A, actions: 3, fed: false })
    expect(morning.today.fed).toEqual([A, B])
    expect(fedThisMorning(morning)).toEqual([A, B])
    morning = night(morning)
    expect(morning.summary!.work[0]).toMatchObject({ id: A, actions: 4, spent: 4, fed: true })
    expect(morning.today.fed).toBeUndefined()
    morning = night(morning)
    expect(morning.summary!.work[0]).toMatchObject({ actions: 3, fed: false })
  })

  it('reads half pace from the day as it was left, before the night counts another short night', () => {
    let save = tasks(farm(), A, [{ kind: 'fish', spot: 'pond' }])
    save = { ...save, gold: 0, farm: { ...save.farm, owed: 50, short: 1 } }
    // One short night so far: tonight she works at full pace, though tonight is short again.
    const once = night(save)
    expect(once.summary!.work[0]).toMatchObject({ actions: 3, half: false })
    expect(once.farm.short).toBe(2)
    expect(night(once).summary!.work[0]).toMatchObject({ actions: 1, spent: 1, half: true })
  })

  it('pays a farmhand\'s upkeep, 10g a night, once, wherever she lives', () => {
    const save = farm()
    expect(upkeepOf(save)).toMatchObject({ residents: 2, gold: 2 * UPKEEP_RESIDENT })
    expect(upkeepOf({ ...save, dorm: { ...save.dorm, home: [A] } }).residents).toBe(2)
    expect(upkeepOf({ ...save, roster: { [A]: newRosterUma(1) }, love: { [A]: newLove() } }).residents).toBe(0)
  })

  it('gives the same morning from the same save, and keeps a save the parse takes', () => {
    let save = growing(farm(), [...START_CLEAR])
    save = tasks(save, A, [{ kind: 'water', tiles: [...START_CLEAR] }, { kind: 'forage', area: 'woods' }])
    save = tasks(save, B, [{ kind: 'chop', area: 'woods' }, { kind: 'fish', spot: 'pond' }])
    expect(night(json(save))).toEqual(night(save))
    expect(parseSaveV5(json(night(save)))).toEqual(night(save))
  })
})

describe('the ranch and the mine on the board', () => {
  /** The Coop with two chickens (one good waiting) and feed in the silo, the Mine built, at Farm Rank 4. */
  function ranch(): SaveV4 {
    const save = farm()
    const hen = (n: number) => ({ id: `chicken-${n}`, kind: 'chicken' as const, fondness: 0, fed: false, cared: false, ready: n === 1 })
    return { ...save, buildings: { ...save.buildings, coop: 1, mine: 1 }, farm: { ...save.farm, points: 950 }, ranch: { animals: [hen(1), hen(2)], silo: 20 } }
  }

  it('takes the Coop\'s or the Barn\'s care and a dig\'s face once each is built', () => {
    expect(taskLock(farm(), { kind: 'care', home: 'coop' })).toBe('Build it first.')
    expect(taskLock(farm(), { kind: 'mine', dig: 'quarry' })).toBe('Build it first.')
    expect(taskLock(ranch(), { kind: 'care', home: 'coop' })).toBeNull()
    expect(taskLock(ranch(), { kind: 'mine', dig: 'mine' })).toBeNull()
  })

  it('feeds the hungry, collects the goods and cares for the animals, in that order, until the building\'s done', () => {
    let save = { ...ranch(), calendar: { day: 1 + SETTLED_AFTER } }
    save = tasks(save, A, [{ kind: 'care', home: 'coop' }])
    const after = handsTonight(save, save, talentsD, null)
    // Settled in: four actions: two feeds, the collection, one care.
    expect(after.lines[0]).toMatchObject({ actions: 4, spent: 4, done: { care: 3 }, items: 1 })
    expect(after.save.ranch.silo).toBe(18)
    expect(after.save.ranch.animals.map((a) => [a.fed, a.cared, a.ready])).toEqual([[true, true, false], [true, false, false]])
    expect(after.save.items.egg?.[0]).toBe(1)
    expect(after.worked).toEqual([{ outfitId: A, place: 'coop' }])
    expect(after.save.roster[A]!.practice).toEqual({ care: 4 })
    expect(after.save.roster[A]!.ranks.ranch.challenge).toBe(1)
    // Her Animal care from 3 feeds two an action; from 5 cares for two.
    expect(tricksAt('care', TRICK_AT.careTwo).open.map((t) => t.what)).toEqual(['Two animals fed an action', 'Two animals cared for an action'])
    const skilled = practice(save, A, 'care', 300)
    expect(handsTonight(skilled, skilled, talentsD, null).lines[0]).toMatchObject({ spent: 3, done: { care: 4 } })
  })

  it('cuts grass for a hungry animal when the silo is empty', () => {
    let save = { ...ranch(), ranch: { ...ranch().ranch, silo: 0 } }
    save = tasks(save, A, [{ kind: 'care', home: 'coop' }])
    const after = handsTonight(save, save, talentsD, null)
    expect(after.save.ranch.animals.every((a) => a.fed)).toBe(true)
    expect(after.save.ranch.silo).toBe(3)
  })

  it('works a face on the deepest floor, a turn with her gathering, and the morning reports it', () => {
    let save = tasks(ranch(), B, [{ kind: 'mine', dig: 'mine' }])
    save = tasks(save, A, [{ kind: 'care', home: 'coop' }])
    const morning = night(save)
    expect(morning.summary!.work[1]).toMatchObject({ kind: 'farmhand', id: B, spent: 3, done: { mine: 3 } })
    expect(morning.places.mine).toEqual({ deepest: 1, stairs: 2 })
    expect(morning.roster[B]!.practice).toEqual({ mine: 3 })
    expect(morning.roster[B]!.ranks.mining.points).toBe(10)
    expect(morning.roster[B]!.ranks.mining.challenge).toBeGreaterThanOrEqual(6)
    expect(morning.summary!.work).toContainEqual({ kind: 'ranch', home: 'coop', fed: 2, hungry: 0, ready: 2 })
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})

describe('the plots on the board', () => {
  /** A farm at Farm Rank 3 with plot 2 cleared, its first row growing and dry, and plot 1's too. */
  function plots(): SaveV4 {
    const save = clearPlot({ ...farm(), gold: 5_000, farm: { ...farm().farm, points: 250 } }, 1)
    const grow = (t: Tile): Tile => ({ ...bareTile('tilled'), crop: 'carrot', growth: t.growth })
    return {
      ...save, today: { ...save.today, actions: 0 },
      fields: { plots: save.fields.plots.map((p) => ({ tiles: p.tiles.map((t, i) => (i < FIELD_COLUMNS ? grow(t) : t)) })) },
    }
  }

  it('reads a task with no plot as plot 1\'s, and writes plot 1 without one', () => {
    const save = tasks(plots(), A, [{ kind: 'water', tiles: ROW1, plot: 0 }, { kind: 'water', tiles: ROW1, plot: 1 }])
    expect(save.roster[A]!.tasks).toEqual([{ kind: 'water', tiles: ROW1 }, { kind: 'water', tiles: ROW1, plot: 1 }])
    expect(taskTiles({ kind: 'water', tiles: [0, 7] })).toEqual([0, 7])
    expect(taskTiles({ kind: 'water', tiles: [0, 7], plot: 1 })).toEqual([40, 47])
  })

  it('refuses a field task on a plot the farm hasn\'t cleared', () => {
    expect(taskLock(farm(), { kind: 'water', tiles: [0], plot: 1 })).toBe('Clear that plot first.')
    expect(() => setTasks(farm(), A, [{ kind: 'water', tiles: [0], plot: 1 }])).toThrow('Clear that plot first.')
    expect(taskLock(plots(), { kind: 'water', tiles: [0], plot: 1 })).toBeNull()
  })

  it('waters plot 2\'s row and leaves plot 1\'s, and her row trick stays on her plot', () => {
    let save = tasks(plots(), A, [{ kind: 'water', tiles: ROW1, plot: 1 }])
    const morning = night(save)
    expect(morning.fields.plots[1]!.tiles.slice(0, 3).map((t) => t.growth)).toEqual([1, 1, 1])
    expect(morning.fields.plots[1]!.tiles.slice(3, FIELD_COLUMNS).every((t) => t.growth === 0)).toBe(true)
    expect(morning.fields.plots[0]!.tiles.slice(0, FIELD_COLUMNS).every((t) => t.growth === 0)).toBe(true)
    expect(morning.summary!.work[0]).toMatchObject({ kind: 'farmhand', id: A, spent: 3, done: { water: 3 } })
    // At Watering 6, one action waters every dry tile of hers in plot 2's first row, and none of plot 1's.
    save = practice(save, A, 'water', APTITUDE_POINTS[TRICK_AT.waterRow - 1]!)
    const after = handsTonight(save, save, talentsD, null).save
    expect(after.fields.plots[1]!.tiles.slice(0, FIELD_COLUMNS).every((t) => t.watered)).toBe(true)
    expect(after.fields.plots[0]!.tiles.every((t) => !t.watered)).toBe(true)
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })

  it('clears and tills plot 2\'s wild ground, and keeps plot 1\'s tasks on plot 1', () => {
    let save = tasks(plots(), A, [{ kind: 'till', tiles: rowOfPlot(1), plot: 1 }])
    save = tasks(save, B, [{ kind: 'water', tiles: ROW1 }])
    const morning = night(save)
    // Three actions, a step each: the row's first tile cleared and tilled, the second cleared.
    expect(morning.fields.plots[1]!.tiles.slice(FIELD_COLUMNS, FIELD_COLUMNS + 2).map((t) => t.ground)).toEqual(['tilled', 'clear'])
    expect(morning.fields.plots[0]!.tiles.slice(0, 3).map((t) => t.growth)).toEqual([1, 1, 1])
  })
})
