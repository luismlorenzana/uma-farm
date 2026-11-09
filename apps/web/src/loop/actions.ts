// The loop's actions on the day (F18): End the day, dismiss the morning, Collect all; F19's goods: ship, Ship all, take
// back and buy; and F20's Fields: plant, Plant all, harvest, Harvest all, a tender and a block. Each reads the save right
// before its rule runs (as `edit`), commits it to the store and the device, and syncs; a refused rule throws its words.
// The night and the harvests read F21's talents from master data, so they wait for it. Loaded on demand with the loop's
// screens, so the night's code stays out of the initial JS.
import {
  BLOCK_IDS, buy, buyBlock, collectLoopAll, endDay, harvest, harvestAll, plant, plantAll, receiptItems, SaveRuleError, setTender, ship, shipAll, shopLines,
  takeBack, touched, type BlockId, type CropId, type FarmingTalentOf, type HarvestReceipt, type SaveV3, type ShopLine,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { farmingTalents, talentsFor } from './talents'

const loopSave = (): SaveV3 | null => {
  const save = useGame.getState().save
  return save?.version === 3 ? save : null
}
const nowIso = () => new Date().toISOString()

/**
 * Ends `day` (decisions 2 and 13): the night's nine steps over the save as it is now, stamped once. It waits for master
 * data, which the night reads (the roster's favourite lines and F21's talents); a second tap, or a save that already
 * moved past `day`, changes nothing.
 */
export async function endTheDay(day: number): Promise<boolean> {
  const view = await masterReady()
  const save = loopSave()
  if (!save || save.calendar.day !== day) return false
  await commit(endDay(save, { roster: view.roster, talentOf: talentsFor(view) }, nowIso()))
  return true
}

/** Every tender's farming talent on this release (F21): a harvest's stars read it, so a harvest waits for master data. */
const farming = async (): Promise<FarmingTalentOf> => farmingTalents(talentsFor(await masterReady()))

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
  const save = loopSave()
  if (!save) return 0
  const now = nowIso()
  const jobs = collectLoopAll(save, now)
  const crops = harvestAll(jobs.save, BLOCK_IDS, talentOf)
  const items = jobs.items + receiptItems(crops.receipt)
  if (jobs.items > 0 || crops.receipt.plots > 0) await commit(touched(crops.save, now))
  return items
}

/** A player's change to the save as it is now, stamped with real time. */
async function change(rule: (save: SaveV3) => SaveV3): Promise<SaveV3> {
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
async function harvested(rule: (save: SaveV3) => { save: SaveV3; receipt: HarvestReceipt }): Promise<HarvestReceipt> {
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

