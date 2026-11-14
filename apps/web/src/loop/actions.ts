// The loop's actions on the day: End the day, dismiss the morning, Collect all; the goods: ship, Ship all, take
// back and buy; the Fields: plant, Plant all, harvest, Harvest all, a tender and a block; the work: a job, a
// queue, Collect, Recall, Repeat and a stopped queue; paying for a place to build; the roster: the Dorm's levels and swaps; the
// scenes, read once; the farmer's name, the opening (which brings the opening's Umas) and arrival scenes; the chat,
// gift and praise; and the pair conversations read. Each reads the save right
// before its rule runs (as `edit`), commits it to the store and the device, and syncs; a refused rule throws its words.
// The night and the harvests read the talents from master data, so they wait for it. Loaded on demand with the loop's
// screens, so the night's code stays out of the initial JS.
import {
  BLOCK_IDS, payBuild, buyDorm, cancelSwap, swapDorm, buy, buyBlock, collectLoopAll, collectLoopWorker, dismissLoopStopped, editLoopQueue, endDay, harvest, harvestAll, loopKinds, plant,
  plantAll, readScene, recallLoopWorker, receiptItems, repeatLoopJob, restartLoopStopped, SaveRuleError, setTender, ship, shipAll, shopLines, startLoopJob, takeBack,
  touched, type BlockId, type CropId, type FarmingTalentOf, type HarvestReceipt, type LoopCollected, type LoopJobInput, type LoopKinds, type LoopPlaceId,
  type LoopWorkRequest, type FarmSave, type OpeningSceneId, type ShopLine, type FarmPlaceId, finishArrival, joinOpening, nameFarmer,
  type ArrivalPlayed, type SaveV4, birthdaysOf, chatV4, giftV4, praiseV4, type LovePaid, pairReadId, readPair, type StoryPack,
} from '@farm/domain'
import type { QueueInput } from '@luismlorenzana/uma-work'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'
import { farmingTalents, talentsFor } from './talents'

const loopSave = (): FarmSave | null => useGame.getState().save
const nowIso = () => new Date().toISOString()

/**
 * Ends `day`: the night's nine steps over the save as it is now, stamped once. It waits for master data (the talents and
 * birthdays) and the story pack (favourites and authored arrivals), which the night reads; a second tap, or a save that
 * already moved past `day`, changes nothing.
 */
export async function endTheDay(day: number): Promise<boolean> {
  const [view, story] = await Promise.all([masterReady(), storyReady()])
  const save = loopSave()
  if (!save || save.calendar.day !== day) return false
  // The cast's birthdays (master data's, the cast's own winning) for the morning's lines.
  const birthdays = birthdaysOf(story, view.birthdays)
  await commit(endDay(save, { talentOf: talentsFor(view), story, birthdays }, nowIso()))
  return true
}

/** Every tender's farming talent on this release: a harvest's stars read it, so a harvest waits for master data. */
const farming = async (): Promise<FarmingTalentOf> => farmingTalents(talentsFor(await masterReady()))

/** The story pack the work and the harvests read (her keepsake, the romance term). */
const perkStory = (): Promise<StoryPack> => storyReady()

/** The loop's work kinds with this release's talents: a job's plan and a catch's size read them, so work waits for
 * master data; with the pack (her keepsake lifts a haul's stars as it's planned). */
const workKinds = async (): Promise<LoopKinds> => loopKinds(talentsFor(await masterReady()), await perkStory())

/** Puts the morning summary away: a player's change. */
export async function dismissSummary(): Promise<void> {
  const save = loopSave()
  if (!save?.summary) return
  await commit(touched({ ...save, summary: null }, nowIso()))
}

/** Collects every finished job on the farm into the Warehouse and harvests every Ready plot (Harvest all on every
 * block). Nothing ready changes nothing. */
export async function collectFarm(): Promise<number> {
  const talentOf = await farming()
  const kinds = await workKinds()
  const story = await perkStory()
  const save = loopSave()
  if (!save) return 0
  const now = nowIso()
  const jobs = collectLoopAll(save, now, undefined, kinds)
  const crops = harvestAll(jobs.save, BLOCK_IDS, talentOf, story)
  const items = jobs.items + receiptItems(crops.receipt)
  if (jobs.items > 0 || crops.receipt.plots > 0) await commit(touched(crops.save, now))
  return items
}

/** A player's change to the save as it is now, stamped with real time. */
async function change(rule: (save: FarmSave) => FarmSave): Promise<FarmSave> {
  const save = loopSave()
  if (!save) throw new Error('The farm is still loading.')
  const next = touched(rule(save), nowIso())
  await commit(next)
  return next
}

/** Ships `count` of a good at `stars` into today's bin (a tap ships one). */
export const shipGood = (id: string, stars: number, count = 1) => change((s) => ship(s, id, stars, count))
/** Ships every star of a good ("Ship all"). */
export const shipEvery = (id: string) => change((s) => shipAll(s, id))
/** Takes a line back out of the bin before the night. */
export const takeBackLine = (id: string, stars: number, count: number) => change((s) => takeBack(s, id, stars, count))
/** Buys `count` of a shop line, as the shop sells it now: a sheet left open past a season's turn can't buy
 * last season's seeds. */
export const buyLine = (line: ShopLine, count: number) => change((s) => {
  const now = shopLines(s).find((l) => l.id === line.id)
  if (!now) throw new SaveRuleError('locked', 'Not in the shop this season.')
  return buy(s, now, count)
})

// --- The Fields ---------------------------------------------------------------------------------------------

/** Plants one seed in a plot. */
export const plantSeed = (block: BlockId, plot: number, seed: string) => change((s) => plant(s, block, plot, seed))
/** Plants every empty plot of a block with one crop, own seeds first. */
export const plantEvery = (block: BlockId, crop: CropId) => change((s) => plantAll(s, block, crop))
/** Sets or clears a block's tender. */
export const tendBlock = (block: BlockId, outfitId: string | null) => change((s) => setTender(s, block, outfitId))
/** Buys a block of nine plots. */
export const buyLand = (block: BlockId) => change((s) => buyBlock(s, block))

/** A harvest as a player's change: what it brought, for the screen to say. */
async function harvested(rule: (save: FarmSave) => { save: FarmSave; receipt: HarvestReceipt }): Promise<HarvestReceipt> {
  let receipt: HarvestReceipt | null = null
  await change((s) => {
    const done = rule(s)
    receipt = done.receipt
    return done.save
  })
  return receipt!
}
/** Harvests a Ready plot, its tender's talent read from master data (with her keepsake and the perks' extra crop). */
export const harvestPlot = async (block: BlockId, plot: number) => {
  const talentOf = await farming()
  const story = await perkStory()
  return harvested((s) => harvest(s, block, plot, talentOf, story))
}
/** Harvests every Ready plot of a block. */
export const harvestBlock = async (block: BlockId) => {
  const talentOf = await farming()
  const story = await perkStory()
  return harvested((s) => harvestAll(s, [block], talentOf, story))
}
/** Harvests every Ready plot on the farm (the quick look's Harvest all): the crops it brought. Nothing Ready changes
 * nothing. */
export async function harvestFields(): Promise<number> {
  const talentOf = await farming()
  const story = await perkStory()
  const save = loopSave()
  if (!save) return 0
  const { save: next, receipt } = harvestAll(save, BLOCK_IDS, talentOf, story)
  if (receipt.plots > 0) await commit(touched(next, nowIso()))
  return receiptItems(receipt)
}


// --- Work at the forest, the Fishery and the stations ------------------------------------------------------------

/** A work operation as a player's change: the loop's operations stamp it themselves. */
async function work(rule: (save: FarmSave, kinds: LoopKinds, now: string) => FarmSave): Promise<void> {
  const kinds = await workKinds()
  const save = loopSave()
  if (!save) throw new Error('The farm is still loading.')
  const next = rule(save, kinds, nowIso())
  if (next !== save) await commit(next)
}

/** Starts a job in a free slot this morning. */
export const startJob = (input: LoopJobInput) => work((s, kinds, now) => startLoopJob(s, input, now, kinds))
/** Adds, removes or moves a job in her queue. */
export const editQueue = (input: QueueInput<LoopWorkRequest>) => work((s, kinds, now) => editLoopQueue(s, input, now, kinds))
/** Ends her work: what's made is collected, the rest's inputs come back. */
export const recallJob = (outfitId: string) => work((s, kinds, now) => recallLoopWorker(s, outfitId, now, kinds))
/** Collects and starts her last job again this morning. */
export const repeatJob = (outfitId: string) => work((s, kinds, now) => repeatLoopJob(s, outfitId, now, kinds))
/** Restarts a queue that stopped. */
export const restartJob = (outfitId: string) => work((s, kinds, now) => restartLoopStopped(s, outfitId, now, kinds))
/** Forgets a queue that stopped. */
export const dismissJob = (outfitId: string) => work((s, kinds, now) => dismissLoopStopped(s, outfitId, now, kinds))

/** Collects what she has finished into the Warehouse by stars: the goods, and each fish's size. */
export async function collectJob(outfitId: string): Promise<LoopCollected> {
  let got: LoopCollected = { goods: [], sizes: [] }
  await work((s, kinds, now) => {
    const done = collectLoopWorker(s, outfitId, now, kinds)
    got = done
    return done.save
  })
  return got
}

/** Collects everything finished at a place ("Collect here"). */
export async function collectAt(place: LoopPlaceId): Promise<LoopCollected> {
  let got: LoopCollected = { goods: [], sizes: [] }
  await work((s, kinds, now) => {
    const done = collectLoopAll(s, now, [place], kinds)
    got = done
    return done.save
  })
  return got
}

/** Pays for a place to build: its gold and goods now, standing tomorrow morning. */
export const buildPlace = (place: FarmPlaceId) => change((s) => payBuild(s, place))

// --- The roster ----------------------------------------------------------------------------------------------

/** Buys the Dorm's next level: the gold now, the beds tomorrow. */
export const buyDormLevel = () => change(buyDorm)
/** Swaps an idle Uma home for one away, arriving tomorrow. */
export async function swapUmas(out: string, into: string): Promise<void> {
  const kinds = await workKinds()
  await change((s) => swapDorm(s, out, into, kinds))
}
/** Calls off a swap: she stays. */
export const cancelDormSwap = (out: string) => change((s) => cancelSwap(s, out))

// --- The scenes -----------------------------------------------------------------------------------------------

/** A scene played through or skipped: it goes in `diary.read`, once, a player's change. The opening also brings the
 * opening's Umas onto the farm (`openingOf`). */
export async function readSceneOnce(id: OpeningSceneId): Promise<void> {
  const save = loopSave()
  if (!save || save.diary.read.includes(id)) return
  const story = id === 'scene:1:open' ? await storyReady() : null
  await change((s) => (story ? joinOpening(readScene(s, id), story) : readScene(s, id)))
}

// --- The start ------------------------------------------------------------------------------------------------

/** The farmer's name: the fresh farm's first player change, stamped once; or a rename from Account. */
export const nameTheFarmer = (name: string) => change((s) => nameFarmer(s, name))

/** Her arrival scene played, or skipped to its choice: +50 and the choice into her bar, once, stamped. */
export async function finishArrivalScene(id: string, played: ArrivalPlayed): Promise<void> {
  const save = loopSave()
  if (!save || save.arrivals.includes(id)) return
  await change((s) => finishArrival(s, id, played))
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
/** A chat: +15, once a day each, home or away. */
export const chatHer = (id: string) => loveAct((s) => chatV4(s, id))
/** A gift of one good at its stars: her taste from the pack, ×3 on her birthday (master data's, read
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
