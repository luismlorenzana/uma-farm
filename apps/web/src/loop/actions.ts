// The loop's actions on the day: End the day and dismiss the morning; the day's actions: a tile cleared, tilled,
// planted, watered and harvested, a forage, a log chopped, a catch, a station's load, a crate shipped and going into
// town; the goods: take back and buy; paying for a place to build, and the mayor's office's loans; the roster: the Dorm's levels and swaps; the scenes,
// read once; the farmer's name, the opening, Invite to the farm, and meeting scenes; her illustrations seen; the chat and
// the gift (an action each) and praise; the pair conversations read; and a farmhand's tasks on the work board (free).
// Each reads the save right before its rule runs (as
// `edit`), commits it to the store and the device, and syncs; a refused rule throws its words. The night reads the
// talents from master data, so it waits for it. Loaded on demand with the loop's screens, so the night's code stays out
// of the initial JS.
import {
  payBuild, borrowFor, repayLoan, buyDorm, cancelSwap, swapDorm, buy, endDay, readScene, SaveRuleError, shopLines, takeBack,
  touched, type FarmSave, type OpeningSceneId, type ShopLine, type FarmPlaceId, finishArrival, inviteToFarm, nameFarmer,
  type ArrivalPlayed, type SaveV4, birthdaysOf, chatV4, giftV4, praiseV4, type LovePaid, pairReadId, readPair,
  chop, clearTile, fish, forage, goToTown, harvestTile, plantTile, shipCrate, startLoad, tillTile, waterTile,
  type CrateLine, type HarvestReceipt, type Haul, type Measured, type StationId, seeIllustration, setTasks, type FarmTask,
} from '@farm/domain'
import { masterReady } from '../master/master'
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
  await commit(endDay(save, { talentOf: talentsFor(view), story, birthdays, release }, nowIso()))
  if (release) forgetArrived(release.number)
  return true
}

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
  const next = touched(rule(save), nowIso())
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

/** Clears an overgrown tile: what it left (a log, a stone), or null. */
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
/** Fishes a spot: the catch, measured. */
export const fishAt = (spot: string): Promise<Measured> => act((s) => {
  const done = fish(s, spot)
  return { save: done.save, result: done.caught }
})
/** Starts a load at a station, ready the next morning. */
export const loadAt = (station: StationId, item: string, count: number) => change((s) => startLoad(s, station, item, count))
/** Ships what's picked: one action for the crate. */
export const shipPicked = (lines: readonly CrateLine[]) => change((s) => shipCrate(s, lines))
/** Goes into town: one action, the town and its shop open for the rest of the day. */
export const intoTown = () => change(goToTown)

/** Pays for a place to build: its gold and goods now, standing tomorrow morning. */
export const buildPlace = (place: FarmPlaceId) => change((s) => payBuild(s, place))

/** At the mayor's office, in town: borrows what a build is short of gold and orders it (a house named `name`). */
export const borrowAndBuild = (project: string, name = '') => change((s) => borrowFor(s, project, name))
/** At the mayor's office, in town: repays a loan in full. */
export const repayTheLoan = (project: string) => change((s) => repayLoan(s, project))

// --- The roster ----------------------------------------------------------------------------------------------

/** Buys the Dorm's next level: the gold now, the beds tomorrow. */
export const buyDormLevel = () => change(buyDorm)
/** Swaps an Uma home for one living in town, arriving tomorrow. */
export const swapUmas = (out: string, into: string) => change((s) => swapDorm(s, out, into))
/** Calls off a swap: she stays. */
export const cancelDormSwap = (out: string) => change((s) => cancelSwap(s, out))

// --- The scenes -----------------------------------------------------------------------------------------------

/** The opening played through or skipped: it goes in `diary.read`, once, a player's change. Nobody waits at the Gate:
 * everyone is met in town. */
export async function readSceneOnce(id: OpeningSceneId): Promise<void> {
  const save = loopSave()
  if (!save || save.diary.read.includes(id)) return
  await change((s) => readScene(s, id))
}

/** Invite to the farm: one you've met who lives in town moves into a free Dorm bed now. */
export const inviteHer = (id: string) => change((s) => inviteToFarm(s, id))

/** A farmhand's tasks on the work board, in your order: free. */
export const setHandTasks = (id: string, tasks: readonly FarmTask[]) => change((s) => setTasks(s, id, tasks))

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
  await change((s) => seeIllustration(s, id, scene))
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
export async function readPairOnce(a: string, b: string, levels: readonly number[]): Promise<void> {
  const save = loopSave()
  if (!save || levels.every((h) => save.diary.read.includes(pairReadId(a, b, h)))) return
  const pack = await storyReady()
  await change((s) => readPair(s, pack, a, b, levels))
}
