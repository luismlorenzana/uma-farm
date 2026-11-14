// The pacing: a run to Farm Rank 8 on the game's own rules, played by a plain bot, checks that each rank comes at the
// pace it came at before the farm grew by building (when each global chapter added 250 points: the run counts chapter
// 1's, done the night its six goals were met, against the thresholds of then), and that every place's cost is affordable
// within about a season of its offer. No story pack (the night runs the
// farm's steps), everyone talent D, master data's first five on the farm from day 1 and one more for each Dorm level
// from 4, as the arrivals bring them. Each morning the bot collects and harvests, buys the Dorm's level 2 and the Fields'
// blocks, pays for every place it can (the places whose games aren't built yet too, as when they will be), tends Block A,
// plants the season's best seeds, puts everyone else to a day's work (planks and fillets while a build waits for them,
// else the forest and the Fishery at her deepest), keeps what the next builds take and ships the rest. `PACING=1` prints
// the run.
import { describe, expect, it } from 'vitest'
import { DAYS_PER_SEASON, dateOf } from './calendar'
import { buildLock, heldFor, payBuild } from './builds'
import { buyDorm, nextDorm } from './dorm'
import { FARM_RANK_POINTS, farmRankOf } from './farm'
import { BUILD_PLACES, placeBuilt, type BuildPlace, type FarmPlaceId } from './places'
import { talentsD } from './talents'
import { CROPS, nightsToReady } from '../fields/crops'
import { BLOCK_RULES, blockGrowth, blockOf, buyBlock, harvestAll, plant, setTender } from '../fields/fields'
import { stationOptions } from '../gathering/stations'
import { goodOf, seedId, seedOf, type CropId, type GoodsFamily } from '../goods/ids'
import { priceOf, starPrice } from '../goods/prices'
import { runNight } from '../night/end-day'
import { deepestOpen } from '../romance/days'
import { ship } from '../save/bin'
import { collectLoopAll, loopWorking, startLoopJob } from '../save/loop-work'
import { buy, lineOpen, shopLines } from '../save/shop'
import { BLOCK_IDS, newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'
import { opened } from './places'
import { PLOTS_HARVESTED } from '../fields/fields'
import { HOME_COUNT } from '../gathering/kinds'
import { GOLD_SHIPPED } from '../save/bin'

const AT = '2026-11-13T10:00:00.000Z'
const LAST_DAY = 480
/** About a season: a place's cost is affordable within this many days of its offer. */
const WITHIN = DAYS_PER_SEASON + 4
/** The thresholds before, with 250 points for each chapter done, and chapter 1's goals: 9 crops harvested, 1,000g
 * shipped, 10 things home from the forest and the Fishery, two kinds of crop, an Uma at Hand, Farm Rank 2. */
const BEFORE: readonly number[] = [0, 150, 500, 1200, 2400, 4000, 6500, 10000, 15000, 22000]
const CHAPTER_ONE = 250
const chapterOneDone = (save: SaveV4): boolean => {
  const c = save.farm.counts
  return (c[PLOTS_HARVESTED] ?? 0) >= 9 && (c[GOLD_SHIPPED] ?? 0) >= 1000 && (c[HOME_COUNT.forest] ?? 0) + (c[HOME_COUNT.fishery] ?? 0) >= 10
    && Object.keys(save.crops).length >= 2 && Object.values(save.roster).some((u) => Object.values(u.ranks).some((r) => r.rank >= 1)) && farmRankOf(save.farm.points) >= 2
}
const rankBefore = (points: number): number => BEFORE.filter((p) => points >= p).length
/** A rank comes within this many days of when it came before: 15%, and at least 4. */
const near = (before: number): number => Math.max(4, Math.round(before * 0.15))

const uma = (n: number): string => String(100 + n)

/** The five on the farm from day 1, and one more each Dorm level from 4 (the arrivals), all home. */
function crew(save: SaveV4): SaveV4 {
  const want = 5 + Math.max(0, save.dorm.level - 3)
  let roster = save.roster
  let love = save.love
  for (let n = 1; n <= want; n++) {
    const id = uma(n)
    if (roster[id]) continue
    roster = { ...roster, [id]: newRosterUma(save.calendar.day) }
    love = { ...love, [id]: newLove() }
  }
  const home = Object.keys(roster).slice(0, Math.max(save.dorm.home.length, save.dorm.level >= 2 ? want : 3))
  return { ...save, roster, love, dorm: { ...save.dorm, home } }
}

/** What the farm saves goods for: the builds offered now and not paid, else the next rank's. */
function upcoming(save: SaveV4): BuildPlace[] {
  const rank = farmRankOf(save.farm.points)
  const left = BUILD_PLACES.filter((p) => !placeBuilt(save, p.id) && !save.farm.builds.includes(p.id))
  const now = left.filter((p) => p.opens.rank <= rank)
  return now.length > 0 ? now : left.filter((p) => p.opens.rank === rank + 1)
}

type Line = { family: GoodsFamily; refined: boolean }
/** How many of a family's refined goods the builds still need. */
const refinedShort = (save: SaveV4, keep: ReadonlyMap<string, number>, family: GoodsFamily): number =>
  Math.max(0, (keep.get(`${family}:true`) ?? 0) - heldFor(save.items, { family, refined: true }))
const key = (l: Line) => `${l.family}:${l.refined}`
/** The goods to keep: each line's most over the upcoming builds (they're bought one at a time), and the raw goods the
 * stations would turn into what's still short. */
function reserve(save: SaveV4): Map<string, number> {
  const keep = new Map<string, number>()
  for (const p of upcoming(save)) for (const g of p.opens.cost.goods) keep.set(key(g), Math.max(keep.get(key(g)) ?? 0, g.count))
  if (placeBuilt(save, 'sawmill')) keep.set('woods:false', (keep.get('woods:false') ?? 0) + refinedShort(save, keep, 'woods'))
  if (placeBuilt(save, 'smokehouse')) keep.set('fish:false', (keep.get('fish:false') ?? 0) + refinedShort(save, keep, 'fish'))
  return keep
}

/** The best crop to plant on a block today: a vegetable while a build waits for vegetables, else the most gold a night;
 * either Ready before the season ends. */
function bestCrop(save: SaveV4, block: (typeof BLOCK_IDS)[number], keep: Map<string, number>): CropId | null {
  const growth = blockGrowth(save, block)
  const left = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  const options = shopLines(save).filter((line) => lineOpen(save, line)).map((line) => seedOf(line.id)!.crop).filter((crop) => nightsToReady(crop, growth) <= left)
  const value = (crop: CropId) => (priceOf(crop, 1, save.calendar.day) * CROPS[crop].yield - (CROPS[crop].seed ?? 0)) / nightsToReady(crop, growth)
  const veg = heldFor(save.items, { family: 'vegetables', refined: false }) < (keep.get('vegetables:false') ?? 0)
  const isVeg = (crop: CropId) => goodOf(crop)?.family === 'vegetables'
  return options.sort((a, b) => (veg ? Number(isVeg(b)) - Number(isVeg(a)) : 0) || value(b) - value(a))[0] ?? null
}

/** One morning's play. */
function morning(start: SaveV4): SaveV4 {
  let save = crew(collectLoopAll(start, AT).save)
  save = harvestAll(save).save
  // The Dorm's level 2 and the blocks.
  const dorm = nextDorm(save)
  if (dorm?.level === 2 && dorm.open && save.gold >= dorm.cost + 100) save = buyDorm(save)
  for (const id of BLOCK_IDS) if (!blockOf(save, id) && opened(save, BLOCK_RULES[id].opens) && save.gold >= BLOCK_RULES[id].cost + 200) save = buyBlock(save, id)
  // Every place the farm can pay for, lowest rank first, as if its game were built.
  for (const p of [...BUILD_PLACES].sort((a, b) => a.opens.rank - b.opens.rank || a.opens.cost.gold - b.opens.cost.gold)) if (buildLock(save, p.id, { games: false }) === null) save = payBuild(save, p.id, { games: false })
  // A Dorm level once nothing offered waits for gold.
  const waiting = BUILD_PLACES.filter((p) => !placeBuilt(save, p.id) && !save.farm.builds.includes(p.id) && p.opens.rank <= farmRankOf(save.farm.points))
  const next = nextDorm(save)
  if (next && next.level > 2 && next.open && save.gold >= next.cost + waiting.reduce((n, p) => n + p.opens.cost.gold, 0)) save = buyDorm(save)
  // The Fields: Block A tended, every empty plot planted.
  const home = save.dorm.home
  const working = loopWorking(save)
  if (blockOf(save, 'A')!.tender === null) save = setTender(save, 'A', home.find((id) => !working.has(id))!)
  for (const block of save.fields.blocks) {
    const empty = block.plots.flatMap((p, i) => (p.crop === null ? [i] : []))
    const crop = empty.length > 0 ? bestCrop(save, block.id, reserve(save)) : null
    if (!crop) continue
    const line = shopLines(save).find((l) => l.id === seedId(crop))!
    const count = Math.min(empty.length, Math.floor((save.gold - 100) / line.price))
    if (count <= 0) continue
    save = buy(save, line, count)
    for (const index of empty.slice(0, count)) save = plant(save, block.id, index, seedId(crop))
  }
  // Everyone else: a day at a station while a build waits for its goods, else gathering at her deepest.
  const keep = reserve(save)
  const tenders = new Set(save.fields.blocks.map((b) => b.tender))
  const slots: Record<string, number> = { forest: 0, fishery: 0, sawmill: 0, smokehouse: 0 }
  const free = home.filter((id) => !tenders.has(id) && !loopWorking(save).has(id))
  free.forEach((id, i) => {
    // The raw goods past what the builds take raw, while their refined goods are short.
    const spare = (family: GoodsFamily) => heldFor(save.items, { family, refined: false }) - (keep.get(`${family}:false`) ?? 0) + refinedShort(save, keep, family)
    const station = (['sawmill', 'smokehouse'] as const).find((s) => {
      const family = s === 'sawmill' ? 'woods' : 'fish'
      return placeBuilt(save, s) && slots[s]! < 4 && refinedShort(save, keep, family) > 0 && spare(family) > 0
    })
    if (station) {
      const option = stationOptions(save, station).find((o) => o.job === (station === 'sawmill' ? 'planks' : 'smoking'))
      if (option) {
        const count = Math.min(option.held, 8, spare(station === 'sawmill' ? 'woods' : 'fish'))
        save = startLoopJob(save, { outfitId: id, place: station, slot: slots[station]!++, request: { kind: option.job, item: option.item, count } }, AT)
        return
      }
    }
    // The forest while logs are short, the Fishery while fish are; else turn and turn about.
    const short = (family: GoodsFamily) => heldFor(save.items, { family, refined: false }) < (keep.get(`${family}:false`) ?? 0)
    const place = short('woods') && !short('fish') ? 'forest' : short('fish') && !short('woods') ? 'fishery' : i % 2 === 0 ? 'forest' : 'fishery'
    const where = deepestOpen(save, place, save.roster[id]!.ranks[place === 'forest' ? 'foraging' : 'fishing'].rank)
    if (where && slots[place]! < 4) save = startLoopJob(save, { outfitId: id, place, slot: slots[place]!++, request: { kind: place === 'forest' ? 'forage' : 'fish', item: where, count: 1 } }, AT)
  })
  // Ship what the builds don't need, the dearest first.
  const kept = new Map(reserve(save))
  const rows = Object.entries(save.items).flatMap(([id, row]) => {
    const good = goodOf(id)
    if (!good || good.family === 'rings') return []
    return row.flatMap((n, s) => (n > 0 ? [{ id, stars: s + 1, n, line: key({ family: good.family as GoodsFamily, refined: good.refined }), value: starPrice(id, s + 1) }] : []))
  }).sort((a, b) => a.value - b.value)
  for (const r of rows) {
    const hold = Math.min(r.n, kept.get(r.line) ?? 0)
    kept.set(r.line, (kept.get(r.line) ?? 0) - hold)
    if (r.n - hold > 0) save = ship(save, r.id, r.stars, r.n - hold)
  }
  return save
}

interface Run {
  ranks: Record<number, number>
  before: Record<number, number>
  offered: Partial<Record<FarmPlaceId, number>>
  built: Partial<Record<FarmPlaceId, number>>
  days: number
  shipped: number
}

function simulate(): Run {
  let save: SaveV4 = { ...newSave('pacing', AT), farmer: { name: 'Sim' }, diary: { shipped: {}, milestones: [], records: {}, read: ['scene:1:open'] } }
  save = crew(save)
  const run: Run = { ranks: { 1: 1 }, before: { 1: 1 }, offered: {}, built: {}, days: 0, shipped: 0 }
  let chapterOne = false
  const log: string[] = []
  for (let day = 1; day <= LAST_DAY; day++) {
    const rank = farmRankOf(save.farm.points)
    for (let r = 2; r <= rank; r++) run.ranks[r] ??= day
    for (let r = 2; r <= rankBefore(save.farm.points + (chapterOne ? CHAPTER_ONE : 0)); r++) run.before[r] ??= day
    for (const p of BUILD_PLACES) {
      if (run.offered[p.id] === undefined && rank >= p.opens.rank && (!p.opens.after || placeBuilt(save, p.opens.after))) run.offered[p.id] = day
      if (run.built[p.id] === undefined && placeBuilt(save, p.id)) run.built[p.id] = day
    }
    if (rank >= 8 && BUILD_PLACES.every((p) => run.built[p.id] !== undefined)) { run.days = day; break }
    save = morning(save)
    if (process.env.PACING && day % 6 === 0) log.push(`day ${day}: Farm Rank ${rank}, ${save.farm.points} points, ${save.gold}g, ${Object.keys(save.roster).length} Umas, Dorm ${save.dorm.level}`)
    save = runNight(save, { talentOf: talentsD })
    chapterOne ||= chapterOneDone(save)
    run.days = day
  }
  run.shipped = save.farm.counts['gold-shipped'] ?? 0
  if (process.env.PACING) {
    log.push(`Farm Rank days ${JSON.stringify(run.ranks)}, before ${JSON.stringify(run.before)}; thresholds ${FARM_RANK_POINTS.join(', ')}; shipped ${run.shipped}g`)
    for (const p of BUILD_PLACES) log.push(`${p.name}: Farm Rank ${p.opens.rank}, offered day ${run.offered[p.id]}, built day ${run.built[p.id]}`)
    console.log(log.join('\n'))
  }
  return run
}

describe('the pacing: a run to Farm Rank 8', () => {
  const run = simulate()

  it('reaches each Farm Rank at the pace it came at with the chapters\' points', () => {
    for (let rank = 2; rank <= 8; rank++) {
      const day = run.ranks[rank]
      const before = run.before[rank]
      expect(day, `Farm Rank ${rank}`).toBeDefined()
      expect(before, `Farm Rank ${rank} before`).toBeDefined()
      expect(Math.abs(day! - before!), `Farm Rank ${rank}: day ${day}, day ${before} before`).toBeLessThanOrEqual(near(before!))
    }
  })

  it('offers every place at its Farm Rank, the boat after the dock', () => {
    for (const p of BUILD_PLACES) {
      const offered = run.offered[p.id]
      expect(offered, p.name).toBeDefined()
      expect(offered!, p.name).toBeGreaterThanOrEqual(run.ranks[p.opens.rank]!)
    }
    expect(run.offered.boat!).toBeGreaterThan(run.built.dock! - 1)
  })

  it('makes each place affordable within about a season of its offer: paid and standing', () => {
    for (const p of BUILD_PLACES) {
      const built = run.built[p.id]
      expect(built, `${p.name} is built`).toBeDefined()
      // Paid the day before it stands.
      expect(built! - 1 - run.offered[p.id]!, `${p.name}: offered day ${run.offered[p.id]}, built day ${built}`).toBeLessThanOrEqual(WITHIN)
    }
  })
})
