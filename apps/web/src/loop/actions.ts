// The loop's actions on the day (F18): End the day, dismiss the morning, Collect all; F19's goods: ship, Ship all, take
// back and buy; F20's Fields: plant, Plant all, harvest, Harvest all, a tender and a block; F22's work: a job, a
// queue, Collect, Recall, Repeat, a stopped queue and building a station; F23's roster: the start's picks and its
// redraw, the Dorm's levels and swaps, chats and gifts; F24's scenes, read once; F46's farmer's name, the v4 opening
// (which brings the opening three) and arrival scenes; and F47's chat, gift and praise on v4. Each reads the save right
// before its rule runs (as `edit`), commits it to the store and the device, and syncs; a refused rule throws its words.
// The night and the harvests read F21's talents from master data, so they wait for it. Loaded on demand with the loop's
// screens, so the night's code stays out of the initial JS.
import {
  BLOCK_IDS, buildStation, buyDorm, cancelSwap, chat, gift, pickStart, redrawStart, swapDorm, type AffinityResult, type Taste, buy, buyBlock, collectLoopAll, collectLoopWorker, dismissLoopStopped, editLoopQueue, endDay, harvest, harvestAll, loopKinds, plant,
  plantAll, readScene, recallLoopWorker, receiptItems, repeatLoopJob, restartLoopStopped, SaveRuleError, setTender, ship, shipAll, shopLines, startLoopJob, takeBack,
  touched, type BlockId, type CropId, type FarmingTalentOf, type HarvestReceipt, type LoopCollected, type LoopJobInput, type LoopKinds, type LoopPlaceId,
  type LoopWorkRequest, type FarmSave, type ChapterSceneId, type ShopLine, type StationId, type SaveV3, finishArrival, joinOpening, nameFarmer,
  type ArrivalPlayed, type SaveV4, birthdaysOf, chatV4, giftV4, praiseV4, type LovePaid,
} from '@farm/domain'
import type { QueueInput } from '@luismlorenzana/uma-work'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'
import { farmingTalents, talentsFor } from './talents'

const loopSave = (): FarmSave | null => useGame.getState().save
const nowIso = () => new Date().toISOString()

/**
 * Ends `day` (decisions 2 and 13): the night's nine steps over the save as it is now, stamped once. It waits for master
 * data, which the night reads (the roster's favourite lines and F21's talents); a second tap, or a save that already
 * moved past `day`, changes nothing.
 */
export async function endTheDay(day: number): Promise<boolean> {
  const view = await masterReady()
  // A v4 night reads the story pack: favourites and authored arrivals (F46).
  const story = loopSave()?.version === 4 ? await storyReady() : undefined
  const save = loopSave()
  if (!save || save.calendar.day !== day) return false
  // F47: a v4 night reads the cast's birthdays (master data's, the cast's own winning) for the morning's lines.
  const birthdays = story ? birthdaysOf(story, view.birthdays) : undefined
  await commit(endDay(save, { roster: view.roster, talentOf: talentsFor(view), story, birthdays }, nowIso()))
  return true
}

/** Every tender's farming talent on this release (F21): a harvest's stars read it, so a harvest waits for master data. */
const farming = async (): Promise<FarmingTalentOf> => farmingTalents(talentsFor(await masterReady()))

/** The loop's work kinds with this release's talents (F22): a job's plan and a catch's size read them, so work waits for
 * master data. */
const workKinds = async (): Promise<LoopKinds> => loopKinds(talentsFor(await masterReady()))

/** Puts the morning summary away: a player's change (decision 11). */
export async function dismissSummary(): Promise<void> {
  const save = loopSave()
  if (!save?.summary) return
  await commit(touched({ ...save, summary: null }, nowIso()))
}

/** Collects every finished job on the farm into the Warehouse and harvests every Ready plot (Harvest all on every block,
 * F20). Nothing ready changes nothing. */
export async function collectFarm(): Promise<number> {
  const talentOf = await farming()
  const kinds = await workKinds()
  const save = loopSave()
  if (!save) return 0
  const now = nowIso()
  const jobs = collectLoopAll(save, now, undefined, kinds)
  const crops = harvestAll(jobs.save, BLOCK_IDS, talentOf)
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

/** Ships `count` of a good at `stars` into today's bin (decision 8: a tap ships one). */
export const shipGood = (id: string, stars: number, count = 1) => change((s) => ship(s, id, stars, count))
/** Ships every star of a good ("Ship all"). */
export const shipEvery = (id: string) => change((s) => shipAll(s, id))
/** Takes a line back out of the bin before the night (decision 4). */
export const takeBackLine = (id: string, stars: number, count: number) => change((s) => takeBack(s, id, stars, count))
/** Buys `count` of a shop line (decision 7), as the shop sells it now: a sheet left open past a season's turn can't buy
 * last season's seeds. */
export const buyLine = (line: ShopLine, count: number) => change((s) => {
  const now = shopLines(s).find((l) => l.id === line.id)
  if (!now) throw new SaveRuleError('locked', 'Not in the shop this season.')
  return buy(s, now, count)
})

// --- The Fields (F20) ---------------------------------------------------------------------------------------------

/** Plants one seed in a plot. */
export const plantSeed = (block: BlockId, plot: number, seed: string) => change((s) => plant(s, block, plot, seed))
/** Plants every empty plot of a block with one crop, own seeds first (decision 9). */
export const plantEvery = (block: BlockId, crop: CropId) => change((s) => plantAll(s, block, crop))
/** Sets or clears a block's tender (decision 1). */
export const tendBlock = (block: BlockId, outfitId: string | null) => change((s) => setTender(s, block, outfitId))
/** Buys a block of nine plots (CS12). */
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
/** Harvests a Ready plot, its tender's talent read from master data. */
export const harvestPlot = async (block: BlockId, plot: number) => {
  const talentOf = await farming()
  return harvested((s) => harvest(s, block, plot, talentOf))
}
/** Harvests every Ready plot of a block. */
export const harvestBlock = async (block: BlockId) => {
  const talentOf = await farming()
  return harvested((s) => harvestAll(s, [block], talentOf))
}
/** Harvests every Ready plot on the farm (the quick look's Harvest all): the crops it brought. Nothing Ready changes
 * nothing. */
export async function harvestFields(): Promise<number> {
  const talentOf = await farming()
  const save = loopSave()
  if (!save) return 0
  const { save: next, receipt } = harvestAll(save, BLOCK_IDS, talentOf)
  if (receipt.plots > 0) await commit(touched(next, nowIso()))
  return receiptItems(receipt)
}


// --- Work at the forest, the Fishery and the stations (F22) ------------------------------------------------------------

/** A work operation as a player's change: the loop's operations stamp it themselves. */
async function work(rule: (save: FarmSave, kinds: LoopKinds, now: string) => FarmSave): Promise<void> {
  const kinds = await workKinds()
  const save = loopSave()
  if (!save) throw new Error('The farm is still loading.')
  const next = rule(save, kinds, nowIso())
  if (next !== save) await commit(next)
}

/** Starts a job in a free slot this morning (decisions 1 and 2). */
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

/** Collects what she has finished into the Warehouse by stars (decision 3): the goods, and each fish's size. */
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

/** Builds a station for its gold (decision 6). */
export const buildPlace = (station: StationId) => change((s) => buildStation(s, station))

// --- The roster (F23) ----------------------------------------------------------------------------------------------

/** Picks the start's Umas from the sheet (decision 2): the sheet is drawn again from master data's release and talents,
 * so it waits for master data. */
export async function pickFirstHands(ids: readonly string[]): Promise<void> {
  const view = await masterReady()
  await change((s) => pickStart(v3(s), ids, view.roster.map((o) => o.outfitId), talentsFor(view)))
}
/** The start's one free redraw. */
export const redrawFirstHands = () => change((s) => redrawStart(v3(s)))

/** Buys the Dorm's next level (decision 3): the gold now, the beds tomorrow. */
export const buyDormLevel = () => change(buyDorm)
/** Swaps an idle Uma home for one away, arriving tomorrow (decision 4). */
export async function swapUmas(out: string, into: string): Promise<void> {
  const kinds = await workKinds()
  await change((s) => swapDorm(s, out, into, kinds))
}
/** Calls off a swap: she stays. */
export const cancelDormSwap = (out: string) => change((s) => cancelSwap(s, out))

/** A v3-only rule's save (M4's start, visitors and affinity): the romance build hides them until F56 deletes them. */
function v3(save: FarmSave): SaveV3 {
  if (save.version !== 3) throw new Error('Not on this farm.')
  return save
}
/** A v4-only rule's save (the romance core). */
function v4(save: FarmSave): SaveV4 {
  if (save.version !== 4) throw new Error('Not on this farm.')
  return save
}

/** What a chat or a gift did, for the screen to say: her affinity before and after, whom it brought onto the roster,
 * and a gift's taste. */
export type AffinityNote = Omit<AffinityResult<SaveV3>, 'save'> & { taste?: Taste }

async function affinity(rule: (save: FarmSave) => AffinityResult<SaveV3> & { taste?: Taste }): Promise<AffinityNote> {
  let note: AffinityNote | null = null
  await change((s) => {
    const { save, ...rest } = rule(s)
    note = rest
    return save
  })
  return note!
}
/** A chat with an Uma on the roster or a visitor (decision 9): +15, once a day. */
export const chatWith = (outfitId: string) => affinity((s) => chat(v3(s), outfitId))
/** A gift of one good at its stars (decision 8): what she thinks of it reads her favourite line from master data. */
export async function giveGift(outfitId: string, item: string, stars: number): Promise<AffinityNote> {
  const view = await masterReady()
  const line = view.roster.find((o) => o.outfitId === outfitId)?.line ?? null
  return affinity((s) => gift(v3(s), outfitId, item, stars, line))
}

// --- The scenes (F24) -----------------------------------------------------------------------------------------------

/** A scene played through or skipped (decision 6): it goes in `diary.read`, once, a player's change. On v4 (F46 decision
 * 9) the opening also brings the opening three onto the farm. */
export async function readSceneOnce(id: ChapterSceneId): Promise<void> {
  const save = loopSave()
  if (!save || save.diary.read.includes(id)) return
  const story = save.version === 4 && id === 'scene:1:open' ? await storyReady() : null
  await change((s) => (s.version === 4 && story ? joinOpening(readScene(s, id), story) : readScene(s, id)))
}

// --- The romance core's start (F46) ------------------------------------------------------------------------------

/** The farmer's name (RM8, decision 11): the fresh farm's first player change, stamped once; or a rename from Account. */
export const nameTheFarmer = (name: string) => change((s) => nameFarmer(v4(s), name))

/** Her arrival scene played, or skipped to its choice (decision 10): +50 and the choice into her bar, once, stamped. */
export async function finishArrivalScene(id: string, played: ArrivalPlayed): Promise<void> {
  const save = loopSave()
  if (!save || save.version !== 4 || save.arrivals.includes(id)) return
  await change((s) => finishArrival(v4(s), id, played))
}

// --- Her route (F47) ----------------------------------------------------------------------------------------------

/** A v4 act as a player's change: what it paid, for the "+N" that floats from her face. */
async function loveAct<T extends LovePaid>(rule: (save: SaveV4) => T): Promise<Omit<T, 'save'>> {
  let done: Omit<T, 'save'> | null = null
  await change((s) => {
    const { save, ...rest } = rule(v4(s))
    done = rest
    return save
  })
  return done!
}
/** A chat (decision 4): +15, once a day each, home or away. */
export const chatHer = (id: string) => loveAct((s) => chatV4(s, id))
/** A gift of one good at its stars (decision 5): her taste from the pack, ×3 on her birthday (master data's, read
 * through the cast), so it waits for both. */
export async function giftHer(id: string, item: string, stars: number) {
  const [view, pack] = await Promise.all([masterReady(), storyReady()])
  return loveAct((s) => giftV4(s, pack, id, item, stars, birthdaysOf(pack, view.birthdays)))
}
/** Praise (decision 6): +20, once a day, when she's earned it. */
export const praiseHer = (id: string) => loveAct((s) => praiseV4(s, id))
