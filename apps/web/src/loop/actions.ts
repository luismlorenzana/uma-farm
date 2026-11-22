// The loop's actions on the day: End the day and dismiss the morning; the day's actions: a plot cleared, a tile cleared,
// tilled, planted, watered and harvested, a forage, a log chopped, a catch, a station's load, a crate shipped and going into
// town; the ranch's feeding, care, collecting and grass, the rancher's animals and fodder; a dig's face and its stairs;
// the goods: take back and buy; paying for a place to build, and the mayor's office's loans; the scenes,
// read once; the farmer's name, the opening, and meeting scenes; her illustrations seen; the chat and
// the gift (an action each) and praise; the pair conversations read; and a farmhand's tasks on the work board (free).
// Each reads the save right before its rule runs (as
// `edit`), commits it to the store and the device, and syncs; a refused rule throws its words. The night reads the
// talents from master data, so it waits for it. Loaded on demand with the loop's screens, so the night's code stays out
// of the initial JS.
import {
  passDayPart, crewShiftEnabled, payBuild, borrowFor, repayLoan, buy, endDay, readScene, SaveRuleError, shopLines, takeBack,
  touched, type FarmSave, type OpeningSceneId, type ShopLine, type FarmPlaceId, finishArrival, nameFarmer,
  type ArrivalPlayed, type SaveV4, birthdaysOf, chatV4, giftV4, praiseV4, type LovePaid, pairReadId, readPair,
  chop, clearPlot, clearTile, fish, forage, goToTown, harvestTile, plantTile, shipCrate, startLoad, tillTile, upgradeStation, waterTile,
  type CrateLine, type HarvestReceipt, type Haul, type Measured, type StationId, seeIllustration, setTasks, type FarmTask,
  buyAnimal, buyFodder, careFor, collect, cutGrass, feedAnimal, takeStairs, workFace, type Animal, type AnimalKind, type Collected, type DigId, type Face,
  sendExpedition, removeOrchard, saveCropSeeds, setFieldPlan, setCropReserve, type CropId, type FieldPlan, type RegionId, type RanchHome, type Season,
  setCollectionCap, setFishingMode, setStationPlan, setStockReserve, setSurplusPlan, recordLibrary, festivalsOf,
  type CollectionCap, type FishMode, type FishingSpotId, type StationTarget, type SurplusPlan,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { libraryChange } from '../library/changes'
import { commit, useGame } from '../save/game'
import { arrivedRelease, forgetArrived } from '../story/news'
import { storyReady } from '../story/story'
import { talentsFor } from './talents'

const loopSave = (): FarmSave | null => useGame.getState().save
const nowIso = () => new Date().toISOString()

/**
 * Ends `day`: the night's nine steps over the save as it is now, stamped once. It waits for master data (the talents and
 * birthdays) and the story pack (favourites, the Town notes), which the night reads; a second tap, or a save that
 * already moved past `day`, changes nothing. A story release new to this device goes in the morning's New today, once.
 */
export async function endTheDay(day: number): Promise<boolean> {
  const [view, story] = await Promise.all([masterReady(), storyReady()])
  const save = loopSave()
  if (!save || save.calendar.day !== day) return false
  // The cast's birthdays (master data's, the cast's own winning) for the morning's lines.
  const birthdays = birthdaysOf(story, view.birthdays)
  const release = arrivedRelease()
  const working: FarmSave = crewShiftEnabled(save) ? { ...save, today: { ...save.today, dayParts: true } } : save
  const next = endDay(working, { talentOf: talentsFor(view), story, birthdays, release }, nowIso())
  const recorded = libraryChange(save, next, story, { festivals: festivalsOf(story), birthdays })
  await commit({ ...recorded, today: { ...recorded.today, dayParts: true } })
  if (release) forgetArrived(release.number)
  return true
}

export const enterDayPart = (part: 'afternoon' | 'night') => change(save => passDayPart(save, part))

/** Puts the morning summary away: a player's change. */
export async function dismissSummary(): Promise<void> {
  const save = loopSave()
  if (!save?.summary) return
  await commit(touched({ ...save, summary: null }, nowIso()))
}

/** A player's change to the save as it is now, stamped with real time. */
async function change(rule: (save: FarmSave) => FarmSave): Promise<FarmSave> {
  const save = loopSave()
  if (!save) throw new Error('The farm is still loading.')
  const changed = rule(save)
  if (changed === save) return save
  const next = touched(libraryChange(save, changed), nowIso())
  await commit(next)
  return next
}

/** A player's change that brings something back for the screen to say. */
async function act<T>(rule: (save: FarmSave) => { save: FarmSave; result: T }): Promise<T> {
  let result: T | null = null
  await change((s) => {
    const done = rule(s)
    result = done.result
    return done.save
  })
  return result!
}

/** Takes a line back out of the bin before the night: free. */
export const takeBackLine = (id: string, stars: number, count: number) => change((s) => takeBack(s, id, stars, count))
/** Buys `count` of a shop line, as the shop sells it now: a sheet left open past a season's turn can't buy
 * last season's seeds. Free, once in town. */
export const buyLine = (line: ShopLine, count: number) => change((s) => {
  const now = shopLines(s).find((l) => l.id === line.id)
  if (!now) throw new SaveRuleError('locked', 'Not in the shop this season.')
  return buy(s, now, count)
})

// --- The day's actions -------------------------------------------------------------------------------------------

/** Sends a party on the save as it stands. */
export const sendParty = (region: RegionId, party: readonly string[], supplies: readonly string[]) =>
  change((save) => sendExpedition(save, region, party, supplies))

/** Clears a plot (its index, 1 for plot 2): its gold and an action, and it opens at once, wild. */
export const clearPlotAt = (plot: number) => change((s) => clearPlot(s, plot))
/** Clears an overgrown tile (its field index): what it left (a log, a stone), or null. */
export const clearAt = (tile: number) => act((s) => {
  const done = clearTile(s, tile)
  return { save: done.save, result: done.found }
})
/** Tills cleared ground. */
export const tillAt = (tile: number) => change((s) => tillTile(s, tile))
/** Plants a seed in tilled soil. */
export const plantAt = (tile: number, seed: string) => change((s) => plantTile(s, tile, seed))
/** Waters a growing tile. */
export const waterAt = (tile: number) => change((s) => waterTile(s, tile))
export const saveSeeds = (crop: CropId, grade: number, improve: boolean, count: number, useReserved = false) =>
  change((s) => saveCropSeeds(s, crop, grade, improve, count, useReserved))
export const planFieldRow = (plot: number, row: number, season: Season, plan: FieldPlan | null) => change((s) => setFieldPlan(s, plot, row, season, plan))
export const reserveCrop = (crop: CropId, grade: number, count: number) => change((s) => setCropReserve(s, crop, grade, count))
export const reserveGood = (id: string, count: number) => change((s) => setStockReserve(s, id, count))
export const planSurplus = (plan: SurplusPlan | null) => change((s) => setSurplusPlan(s, plan))
export const planStation = (station: StationId, targets: readonly StationTarget[]) => change((s) => setStationPlan(s, station, targets))
export const pickCollectionCap = (kind: AnimalKind, cap: CollectionCap) => change((s) => setCollectionCap(s, kind, cap))
export const pickFishingMode = (spot: FishingSpotId, mode: FishMode) => change((s) => setFishingMode(s, spot, mode))
export const removeOrchardAt = (tile: number) => change((s) => removeOrchard(s, tile))
/** Harvests a ripe tile: what it brought. */
export const harvestAt = (tile: number): Promise<HarvestReceipt> => act((s) => {
  const done = harvestTile(s, tile)
  return { save: done.save, result: done.receipt }
})
/** Forages an area: the haul. */
export const forageAt = (area: string): Promise<Haul> => act((s) => {
  const done = forage(s, area)
  return { save: done.save, result: done.haul }
})
/** Chops at an area: the logs. */
export const chopAt = (area: string): Promise<Haul> => act((s) => {
  const done = chop(s, area)
  return { save: done.save, result: done.haul }
})
/** Fishes a spot: the catch, measured; null when nothing bit (a thin spot). */
export const fishAt = (spot: string): Promise<{ caught: Measured | null; extra: Measured | null }> => act((s) => {
  const done = fish(s, spot)
  return { save: done.save, result: { caught: done.caught, extra: done.extra } }
})
/** Starts a load at a station, ready the next morning. */
export const loadAt = (station: StationId, item: string, count: number, useReserved = false) => change((s) => startLoad(s, station, item, count, useReserved))
/** Buys a station's next level: its gold now, the level the next morning. Free of actions. */
export const upgradeAt = (station: StationId) => change((s) => upgradeStation(s, station))

// --- The ranch and the digs ---------------------------------------------------------------------------------------

/** Feeds an animal: an action and a feed from the silo. */
export const feedOne = (id: string) => change((s) => feedAnimal(s, id))
/** Cares for an animal: an action, +8 fondness. */
export const careForOne = (id: string) => change((s) => careFor(s, id))
/** Collects a building's goods: an action. */
export const collectAt = (home: RanchHome): Promise<Collected> => act((s) => {
  const done = collect(s, home)
  return { save: done.save, result: done.collected }
})
/** Cuts grass on a weeds tile for the silo: an action; the feed it brought. */
export const grassAt = (tile: number): Promise<number> => act((s) => {
  const done = cutGrass(s, tile)
  return { save: done.save, result: done.feed }
})
/** Buys an animal at the rancher's: free in town. */
export const buyAnimalOf = (kind: AnimalKind): Promise<Animal> => act((s) => {
  const done = buyAnimal(s, kind)
  return { save: done.save, result: done.animal }
})
/** Buys fodder for the silo at the rancher's: free in town. */
export const buyFodderOf = (count: number) => change((s) => buyFodder(s, count))
/** Works a face at a dig: an action; what it brought. */
export const faceAt = (dig: DigId, floor?: number): Promise<Face> => act((s) => {
  const done = workFace(s, dig, floor)
  return { save: done.save, result: done.face }
})
/** Takes a dig's stairs: free. */
export const stairsAt = (dig: DigId) => change((s) => takeStairs(s, dig))
/** Ships what's picked: one action for the crate. */
export const shipPicked = (lines: readonly CrateLine[]) => change((s) => shipCrate(s, lines))
/** Goes into town for the day without spending an action. */
export const intoTown = () => change(goToTown)

/** Pays for a place to build: its gold and goods now, standing tomorrow morning. */
export const buildPlace = (place: FarmPlaceId) => change((s) => payBuild(s, place))

/** At the mayor's office, in town: borrows what a build is short of gold and orders it (a house named `name`). */
export const borrowAndBuild = (project: string, name = '') => change((s) => borrowFor(s, project, name))
/** At the mayor's office, in town: repays a loan in full. */
export const repayTheLoan = (project: string) => change((s) => repayLoan(s, project))

// --- The scenes -----------------------------------------------------------------------------------------------

/** The opening played through or skipped: it goes in `diary.read`, once, a player's change. Nobody waits at the Gate:
 * everyone is met in town. */
export async function readSceneOnce(id: OpeningSceneId): Promise<void> {
  const save = loopSave()
  if (!save || save.diary.read.includes(id)) return
  await change((s) => readScene(s, id))
}

/** A farmhand's tasks on the work board, in your order: free. */
export const setHandTasks = (id: string, tasks: readonly FarmTask[]) => change((s) => setTasks(s, id, tasks))
export const copyHandTask = (id: string, task: FarmTask) => change((s) => {
  const tasks = s.roster[id]?.tasks ?? []
  if (tasks.some((existing) => JSON.stringify(existing) === JSON.stringify(task))) throw new SaveRuleError('bad-job', 'She already has that task.')
  return setTasks(s, id, [...tasks, task])
})

// --- The start ------------------------------------------------------------------------------------------------

/** The farmer's name: the fresh farm's first player change, stamped once; or a rename from Account. */
export const nameTheFarmer = (name: string) => change((s) => nameFarmer(s, name))

/** Her meeting scene played, or skipped to its choice: +50 and the choice into her bar, once, stamped. */
export async function finishArrivalScene(id: string, played: ArrivalPlayed): Promise<void> {
  const save = loopSave()
  if (!save || save.arrivals.includes(id)) return
  await change((s) => finishArrival(s, id, played))
}

/** Her illustration seen, full screen in a scene: it joins her gallery for good, a player's change once. Already in (or
 * she isn't on the roster): nothing to save. */
export async function seeIllustrationOnce(id: string, scene: string): Promise<void> {
  const save = loopSave()
  if (!save || seeIllustration(save, id, scene) === save) return
  await change((s) => {
    const next = seeIllustration(s, id, scene)
    return next === s ? s : recordLibrary(next, id, `art:${scene}`)
  })
}

/** A live vignette that actually reached its last line. */
export async function readLifeOnce(id: string, scene: string, day: number): Promise<void> {
  await change((s) => s.calendar.day === day ? recordLibrary(s, id, `life:${scene}`) : s)
}

// --- Her route ----------------------------------------------------------------------------------------------

/** An act on her route as a player's change: what it paid, for the "+N" that floats from her face. */
async function loveAct<T extends LovePaid>(rule: (save: SaveV4) => T): Promise<Omit<T, 'save'>> {
  let done: Omit<T, 'save'> | null = null
  await change((s) => {
    const { save, ...rest } = rule(s)
    done = rest
    return save
  })
  return done!
}
/** A chat (Talk): one action and +15, once a day each, on the farm or in town. */
export const chatHer = (id: string) => loveAct((s) => chatV4(s, id))
/** A gift of one good at its stars, one action: her taste from the pack, ×3 on her birthday (master data's, read
 * through the cast), so it waits for both. */
export async function giftHer(id: string, item: string, stars: number) {
  const [view, pack] = await Promise.all([masterReady(), storyReady()])
  return loveAct((s) => giftV4(s, pack, id, item, stars, birthdaysOf(pack, view.birthdays)))
}
/** Praise: +20, once a day, when she's earned it. */
export const praiseHer = (id: string) => loveAct((s) => praiseV4(s, id))

// --- Bonds --------------------------------------------------------------------------------------------------

/** A pair's conversations played or skipped: each level into `diary.read`, once, a player's change. A replay
 * of what's read changes nothing. */
export async function readPairOnce(a: string, b: string, levels: readonly number[], seen: readonly number[]): Promise<void> {
  const save = loopSave()
  if (!save || levels.every((h) => save.diary.read.includes(pairReadId(a, b, h)))) return
  const pack = await storyReady()
  await change((s) => {
    const next = readPair(s, pack, a, b, levels)
    return next.diary.read.filter(key => !s.diary.read.includes(key)).reduce((out, key) => {
      const entry = `shared:${seen.some(h => pairReadId(a, b, h) === key) ? '' : 'skipped:'}${key}`
      return recordLibrary(recordLibrary(out, a, entry), b, entry)
    }, next)
  })
}
