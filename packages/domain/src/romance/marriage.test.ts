// A route to marriage, simulated: how long the romance takes on the game's own rules, as `season.test.ts` answers the
// farm's economy. A plain bot plays ten actions a day, courting one default-story Uma from meeting her to the wedding
// night, and farms with what's left.
//
// **The town is honest.** The cast here is a hundred invented characters, as the owner's is (master data holds 159, and
// only the cast lives in town), each on the default schedule, so about a third of them are out at the six spots each day
// and the rest at home, as on the phone. Nobody is placed at random. She has no `home`, `job` or `routine`, so she keeps
// the default schedule: her favourite spot on four days a season (the first in the cast, on days 1, 4, 7 and 10); in the
// "home" runs her cast entry gives her a home on the map, so she's in town every day. She's met only by introducing
// yourself in town, where she is, and talks, gifts, her evening and the invitation to work need her in front of you: on
// the farm when she lives there or works it by day, else in town where she is today. The bot never forces her into town:
// a day she's at home it farms instead, and the run counts those days. Her events play from anywhere.
//
// **Each day:** the morning's invitation, if she asked, said yes; then, while she's in front of you (going into town for
// her when she's out there), a talk and a gift, Praise when she's earned it, and from Friendship 3 the invitation to work
// (she's a farmhand from then, on the farm by day, watering the field and foraging the woods overnight); her evening when
// it's open (a hangout from Friendship 3, a date from Romance 1: 2 actions, asked out in town or on the farm); her event
// when Ready (the warmest reply, Yes at her confession); a ring at the bench once it opens, from three refined goods the
// Mill made; then the proposal with it, and the wedding. Then the farm: harvest, water what she won't, the Mill on a loan
// once its logs are held, the season's quickest seeds, planting, a crate shipped, and the rest at the woods and the water.
//
// **Two profiles:** devoted (her loved gift whenever it's held, else a liked one; Great evenings in her favourite kind) and
// casual (a liked gift; Fine evenings, the first kind offered). A default-story Uma loves her line's good and likes
// nothing in particular, so her tastes for the run are set by a synthetic bible: loved her line's default (a farming
// Uma's Carrot, from the first season's seeds), liked four common goods of the woods. Her story is the default story's.
//
// **Two homes:** she stays in town (a farmhand from Friendship 3, still living there), or the bot invites her to the farm
// (a free Dorm bed) the day she's met. Each runs with the default schedule and with a home in town: eight runs. Retunes
// nothing. `MARRIAGE=1` prints the table.
import { describe, expect, it } from 'vitest'
import { actionCost, actionsLeft, canSpendForEvent, GAME_DAYS, goToTown } from '../farm/actions'
import { payBuild } from '../farm/builds'
import { dateOf, DAYS_PER_YEAR } from '../farm/calendar'
import { borrowFor, buildOrders } from '../farm/economy'
import { handsTonight, setTasks } from '../farm/farmhands'
import { placeBuilt } from '../farm/places'
import { talentsD } from '../farm/talents'
import { clearTile, harvestTile, plantTile, seedsInSeason, stagesOf, tillTile, waterTile } from '../fields/fields'
import { chop, fish, forage, FULL_HAULS, haulsToday, reachList } from '../gathering/hauls'
import { LOAD_SIZE, startLoad, stationOptions } from '../gathering/stations'
import { goodOf, type CropId } from '../goods/ids'
import { runNight, type NightContext } from '../night/end-day'
import { shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { fieldTiles, atHome, EVENING_KINDS, FIELD_TILES, isOvergrown, newSave, type EveningKind, type SaveV4 } from '../save/v4'
import { goodCount } from '../save/warehouse'
import type { Step } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { eventOf, favouriteGoodOf, festivalsOf, masterCastFrom, storyOf, weddingPlaces, type MasterOutfit } from '../story/placeholders'
import { whereYouMeet } from '../town/town'
import { canPraise, chatV4, giftV4, praiseV4 } from './acts'
import { benchGrades, benchOpen, benchPick, heldRings, makeRing } from './bench'
import { birthdaysOf } from './days'
import { answerInvite, favouriteKind, isFestivalNight, kindsNow, spendEvening } from './evening'
import { playEvent } from './events'
import { inviteToWork, isFarmhand } from './loop'
import { authoredGain, finishArrival, pathFlags, walkScene } from './love'
import { introduce, inviteToFarm } from './meeting'
import { readiness, type Wait } from './ready'
import { receptionDishes } from './wedding'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// --- The world: 159 invented characters, her among them ----------------------------------------------------------------

/** Her: a farming Uma (Stamina her top stat), the first of master data, so the default story's cast holds her. */
const HER = '9300001'
const COUNT = 159
const stats = (s: readonly number[]) => ({ speed: s[0]!, stamina: s[1]!, power: s[2]!, guts: s[3]!, wit: s[4]! })
const NONE = stats([0, 0, 0, 0, 0])
const OUTFITS: readonly MasterOutfit[] = Array.from({ length: COUNT }, (_, i) => {
  const characterId = String(9300001 + i)
  const top = i === 0 ? 1 : i % 5
  const s = [90, 90, 90, 90, 90]
  s[top] = 110 + (i % 7)
  return { id: `${characterId}01`, characterId, variant: null, stats: { star5: stats(s) }, growthRatePercents: NONE }
})
const MASTER = masterCastFrom(OUTFITS)
/** The cast is the first hundred, her first, as the owner's cast of a hundred: only the cast lives in town. */
const CAST = OUTFITS.slice(0, 100).map((o) => ({ characterId: o.characterId }))
const BASE = ((pack: StoryPack): StoryPack => ({ ...pack, cast: { ...pack.cast, umas: CAST } }))(storyOf(null, MASTER))
/** Her tastes for the run: loved her line's default good, liked four goods the woods give all year. */
const LOVED = favouriteGoodOf(BASE, HER)
const LIKED = ['button-mushroom', 'shiitake', 'basil', 'mint'] as const
const withTastes = (pack: StoryPack): StoryPack => ({ ...pack, bibles: new Map([[HER, { characterId: HER, gifts: { loved: LOVED, liked: [...LIKED] } }]]) })
/** Where the town puts her: the default schedule (her favourite spot on four days a season), or a home on the map, where
 * she is every day. */
const HOME = 'rose-cottage'
const PACKS = {
  default: withTastes(BASE),
  home: withTastes({
    ...BASE, town: { locations: [{ id: HOME, name: 'Rose Cottage', kind: 'home' }] },
    cast: { ...BASE.cast, umas: BASE.cast.umas.map((u) => (u.characterId === HER ? { ...u, home: HOME } : u)) },
  }),
} as const

// --- The bot -----------------------------------------------------------------------------------------------------------

type Profile = 'devoted' | 'casual'
type Home = 'town' | 'farm'
type Place = keyof typeof PACKS
interface Run { profile: Profile; home: Home; place: Place }

/** Great and Fine evenings: a play's score. */
const SCORE: Readonly<Record<Profile, number>> = { devoted: 75, casual: 40 }
/** No more than this many tiles growing. */
const KEEP_GROWING = 5
/** Liked gifts kept back from the bin. */
const GIFT_STOCK = 4
/** From Romance 5 the bot keeps the Mill's goods for her ring. */
const RING_FROM = 5
/** The Mill's logs, kept back until it stands. */
const MILL_LOGS = 20
const FIELD = Array.from({ length: FIELD_TILES }, (_, i) => i)
/** The longest a run plays before it's called stuck. */
const CAP_YEARS = 25

/** What a run found. */
interface Result {
  run: Run
  seed: string
  met: number | null
  friend3: number | null
  farmhand: number | null
  confession: number | null
  proposal: number | null
  wedding: number | null
  /** Days she was out of your reach: before you met her, and after (not on the farm, and not out in town). */
  unmetDays: number
  unreachable: number
  /** After she's met: the days she was in front of you, before and after you invited her to work. */
  reach: { before: number; beforeDays: number; after: number; afterDays: number }
  /** Actions spent on her: introducing yourself, the town for her, talks, gifts, the invitation to work, evenings, events. */
  actions: number
  evenings: number
  gifts: { loved: number; liked: number; other: number }
  gold: number
  /** The days her event waited, by what it waited for (days she played one aren't counted). */
  waits: Partial<Record<Wait['kind'], number>>
  shortNights: number
  stuck: string | null
}

const left = actionsLeft
const growing = (save: SaveV4): number[] => fieldTiles(save).flatMap((t, i) => (t.crop !== null && !t.ready ? [i] : []))
/** Whether a place is thin for him today: its four full hauls taken, less the three she forages there tonight once
 * she's a farmhand (he leaves them to her). */
const thinFor = (save: SaveV4, where: string): boolean =>
  haulsToday(save, where) + (where === 'woods' && save.roster[HER]?.farmhand !== undefined ? 3 : 0) >= FULL_HAULS
/** Where he gathers: the nearest area or spot in his reach that isn't thin for him yet today, else the nearest. */
const fresh = (save: SaveV4, place: 'forest' | 'fishery'): string => {
  const open = reachList(save, place).filter((r) => r.lock === null)
  return (open.find((r) => !thinFor(save, r.id)) ?? open[0]!).id
}
/** A haul, by turns: a catch, a forage, a chop, each where it isn't thin; the next by turn when its place is thin and
 * another's isn't. */
function haul(save: SaveV4, k: number): SaveV4 {
  const kinds = [0, 1, 2].map((n) => (k + n) % 3)
  const pick = kinds.find((n) => !thinFor(save, fresh(save, n === 0 ? 'fishery' : 'forest'))) ?? k % 3
  return pick === 0 ? fish(save, fresh(save, 'fishery')).save : pick === 1 ? forage(save, fresh(save, 'forest')).save : chop(save, fresh(save, 'forest')).save
}
const romanceLevel = (save: SaveV4): number => {
  const love = save.love[HER]
  return !love ? -1 : love.stage === 'romance' ? love.level : love.stage === 'proposal' || love.stage === 'wedding' || love.stage === 'spouse' ? 10 : -1
}
/** Whether the bot keeps the Mill's goods for her ring: from Romance 5 until a ring is held. */
const ringWanted = (save: SaveV4): boolean => romanceLevel(save) >= RING_FROM && heldRings(save).length === 0 && save.love[HER]?.stage !== 'wedding'

/** Each choice's pick: Yes at her confession, else the warmest reply. */
function picksFor(steps: readonly Step[], flags: readonly string[]): number[] {
  const picks: number[] = []
  for (let guard = 0; guard < 50; guard++) {
    const path = walkScene(steps, picks, { flags })
    if (path.done) return picks
    const last = path.steps.at(-1)
    if (!last || !('choice' in last)) throw new Error('A scene stopped short of a choice.')
    const yes = last.choice.findIndex((o) => o.answer === 'yes')
    const top = Math.max(...last.choice.map(authoredGain))
    picks.push(yes >= 0 ? yes : last.choice.findIndex((o) => authoredGain(o) === top))
  }
  throw new Error('A scene with no end.')
}

/** The gift she's given today: devoted, her loved good when held, else a liked one; casual, a liked one. Else anything. */
function giftFor(save: SaveV4, profile: Profile): { id: string; stars: number; taste: 'loved' | 'liked' | 'other' } | null {
  const lowest = (id: string): number | null => {
    const row = save.items[id] ?? []
    const i = row.findIndex((n) => n > 0)
    return i >= 0 ? i + 1 : null
  }
  if (profile === 'devoted' && lowest(LOVED)) return { id: LOVED, stars: lowest(LOVED)!, taste: 'loved' }
  for (const id of LIKED) if (lowest(id)) return { id, stars: lowest(id)!, taste: 'liked' }
  const any = Object.keys(save.items).find((id) => goodOf(id) && id !== LOVED && lowest(id) !== null && !goodOf(id)!.refined)
  return any ? { id: any, stars: lowest(any)!, taste: 'other' } : null
}

/** What the bin may take: everything with a price but her gifts (her loved good, a few liked ones), the Mill's logs until
 * it stands, and the Mill's goods while her ring waits. */
function crate(save: SaveV4): CrateLine[] {
  const ring = ringWanted(save)
  let liked = 0
  return Object.entries(save.items).flatMap(([id, row]) => {
    const good = goodOf(id)
    if (!good || id === LOVED) return []
    if (ring && (good.refined || stationOptions({ items: { [id]: row } }, 'mill').length > 0)) return []
    let held = 0
    if ((LIKED as readonly string[]).includes(id)) held = Math.max(0, GIFT_STOCK - liked)
    if (good.family === 'woods' && !good.refined && !placeBuilt(save, 'mill')) held = MILL_LOGS
    return row.flatMap((count, s) => {
      const kept = Math.min(held, count)
      held -= kept
      if ((LIKED as readonly string[]).includes(id)) liked += kept
      return count - kept > 0 ? [{ id, stars: s + 1, count: count - kept }] : []
    })
  })
}

/** The season's quickest seed the shop sells that can still ripen. */
function quickestSeed(save: SaveV4) {
  const daysLeft = 12 - dateOf(save.calendar.day).day + 1
  return shopLines(save).filter((l) => lineOpen(save, l)).map((l) => ({ line: l, stages: stagesOf(l.id.slice('seed-'.length) as CropId, false) }))
    .filter((s) => s.stages < daysLeft).sort((a, b) => a.stages - b.stages || a.line.price - b.line.price)[0]?.line ?? null
}

/** The farm with what's left of the day. */
function farm(start: SaveV4): SaveV4 {
  let save = start
  const daysLeft = 12 - dateOf(save.calendar.day).day + 1
  for (const [i, t] of fieldTiles(save).entries()) if (t.ready && left(save) > 0) save = harvestTile(save, i).save
  // Her watering tonight, as a farmhand: the bot waters only what she won't.
  const hers = isFarmhand(save, HER) ? fieldTiles(handsTonight(save, save, talentsD, null).save) : null
  for (const i of growing(save)) if (!fieldTiles(save)[i]!.watered && !hers?.[i]!.watered && left(save) > 0) save = waterTile(save, i)
  // The Mill, once its logs are held: his own gold, else a loan in town.
  const mill = buildOrders({ ...save, today: { ...save.today, town: true } }).find((o) => o.project === 'mill')
  if (mill && !save.farm.builds.includes('mill') && goodCount(save.items, 'pine-log') + goodCount(save.items, 'birch-log') >= MILL_LOGS) {
    if (mill.own === null) save = payBuild(save, 'mill')
    else if (mill.lock === null && (save.today.town || left(save) > 1)) save = borrowFor(goToTown(save), 'mill')
  }
  // The Mill's load while her ring waits: the most held of its inputs (never her gifts).
  if (ringWanted(save) && placeBuilt(save, 'mill') && !save.loads.mill && left(save) > 0) {
    const option = stationOptions(save, 'mill').filter((o) => o.input !== LOVED && !(LIKED as readonly string[]).includes(o.input)).sort((a, b) => b.held - a.held)[0]
    if (option && option.held >= 3) save = startLoad(save, 'mill', option.item, Math.min(option.held, LOAD_SIZE))
  }
  // Seeds: into town for the season's quickest when none are held.
  const seed = quickestSeed(save)
  if (seedsInSeason(save).length === 0 && seed && save.gold >= seed.price * 3 && (save.today.town || left(save) >= 3)) {
    save = buy(goToTown(save), seed, Math.min(9, Math.floor(save.gold / seed.price)))
  }
  for (const [i, t] of fieldTiles(save).entries()) {
    const held = seedsInSeason(save)[0]
    if (!held || t.ground !== 'tilled' || t.crop !== null || growing(save).length >= KEEP_GROWING || left(save) < 2 || stagesOf(held.crop, false) > daysLeft) continue
    save = waterTile(plantTile(save, i, held.id), i)
  }
  const tilledEmpty = fieldTiles(save).filter((t) => t.ground === 'tilled' && t.crop === null).length
  const wanted = Math.min(seedsInSeason(save).reduce((n, s) => n + s.count, 0), KEEP_GROWING) - growing(save).length - tilledEmpty
  for (let n = 0; n < wanted && left(save) > 3; n++) {
    const clear = fieldTiles(save).findIndex((t) => t.ground === 'clear')
    save = clear >= 0 ? tillTile(save, clear) : clearTile(save, fieldTiles(save).findIndex((t) => isOvergrown(t.ground))).save
  }
  const lines = crate(save)
  if (lines.reduce((n, l) => n + l.count, 0) >= 6 && left(save) > 0) save = shipCrate(save, lines)
  // The rest at the woods and the water: logs while the Mill waits for them. (Her loved Carrot is the season's quickest
  // seed in Spring, so the field grows it.)
  for (let k = 0; left(save) > 0; k++) {
    const logs = goodCount(save.items, 'pine-log') + goodCount(save.items, 'birch-log')
    if (!placeBuilt(save, 'mill') && !save.farm.builds.includes('mill') && logs < MILL_LOGS) save = chop(save, fresh(save, 'forest')).save
    else save = haul(save, k)
  }
  return save
}

/** One run: day by day until the wedding night, or the cap. */
async function simulate(run: Run, seed: string): Promise<Result> {
  const pack = PACKS[run.place]
  const context: NightContext = { story: pack, birthdays: birthdaysOf(pack, new Map()) }
  const year = festivalsOf(pack)
  const favourite = favouriteKind(pack, HER)
  let save: SaveV4 = { ...newSave(seed, AT), farmer: { name: 'Sim' } }
  const r: Result = {
    run, seed, met: null, friend3: null, farmhand: null, confession: null, proposal: null, wedding: null, unmetDays: 0, unreachable: 0,
    reach: { before: 0, beforeDays: 0, after: 0, afterDays: 0 }, actions: 0, evenings: 0, gifts: { loved: 0, liked: 0, other: 0 }, gold: 0, waits: {}, shortNights: 0, stuck: null,
  }
  const spent = (before: SaveV4, after: SaveV4) => { r.actions += after.today.actions - before.today.actions + (after.today.eventActions - before.today.eventActions) }
  for (let n = 0; n < CAP_YEARS * DAYS_PER_YEAR; n++) {
    const day = save.calendar.day
    // The morning's invitation, if she asked: yes.
    if (save.today.invites.some((i) => i.id === HER && i.answer === null)) save = answerInvite(save, HER, 'yes')
    // Where she is today, before you've met: out in town, or at home off the map.
    const out = whereYouMeet(save, pack, HER).at !== null
    if (!save.roster[HER]) {
      // Met only by introducing yourself in town, where she is.
      if (out && left(save) >= 2) {
        const before = save
        save = introduce(goToTown(save), pack, HER)
        const arrival = await eventOf(pack, HER, 'arrival')
        const path = walkScene(arrival.steps, picksFor(arrival.steps, []))
        save = finishArrival(save, HER, { choice: 30, flags: pathFlags(path.steps) })
        if (run.home === 'farm') save = inviteToFarm(save, HER)
        spent(before, save)
        r.met = day
      } else r.unmetDays++
    }
    if (save.roster[HER]) {
      const now = whereYouMeet(save, pack, HER)
      const farmToday = now.farm
      const here = farmToday || now.at !== null
      const farmhand = isFarmhand(save, HER)
      if (farmhand) { r.reach.afterDays++; if (here) r.reach.after++ } else { r.reach.beforeDays++; if (here) r.reach.before++ }
      if (!here) r.unreachable++
      const before = save
      if (here) {
        if (!farmToday && left(save) >= 2) save = goToTown(save)
        if (canPraise(save, HER)) save = praiseV4(save, HER).save
        if (!save.today.chats.includes(HER) && left(save) > 0) save = chatV4(save, HER).save
        const gift = giftFor(save, run.profile)
        if (gift && !save.today.gifts.includes(HER) && left(save) > 0) {
          save = giftV4(save, pack, HER, gift.id, gift.stars).save
          r.gifts[gift.taste]++
        }
        const love = save.love[HER]!
        if (!isFarmhand(save, HER) && (love.stage !== 'friendship' || love.level >= 3) && left(save) >= actionCost('invite')) {
          save = setTasks(inviteToWork(save, HER), HER, [{ kind: 'water', tiles: FIELD }, { kind: 'forage', area: 'woods' }])
          r.farmhand = day
        }
      }
      // Her evening when it's open (she's in front of you: on the farm, or asked out in town): devoted in her favourite
      // kind, casual the first offered.
      const kinds: EveningKind[] = kindsNow(save, pack, HER).filter((k) => !isFestivalNight(k))
      if (kinds.length > 0 && left(save) >= 2) {
        const kind: EveningKind = run.profile === 'devoted' && kinds.includes(favourite) ? favourite : EVENING_KINDS.find((k) => kinds.includes(k))!
        save = spendEvening(save, pack, HER, kind, SCORE[run.profile]).save
        r.evenings++
      }
      // A ring at the bench once it opens, from three refined goods of one grade: the lowest grade held.
      if (benchOpen(save) && heldRings(save).length === 0 && save.today.ring === 0 && romanceLevel(save) >= 8) {
        const grade = benchGrades(save)[0]
        if (grade !== undefined) save = makeRing(save, benchPick(save, grade)!).save
      }
      // Her event when Ready, from anywhere.
      const state = readiness(save, pack, HER)
      let played = false
      if (state.ready && state.rung && canSpendForEvent(save, actionCost('event'), GAME_DAYS)) {
        const event = await eventOf(pack, HER, state.rung)
        const ring = heldRings(save)[0]
        const outcome = {
          event, picks: picksFor(event.steps, save.love[HER]!.flags), plays: [],
          ...(state.rung === 'proposal' ? { ring: ring! } : {}),
          ...(state.rung === 'wedding' ? { place: weddingPlaces(pack, HER)[0]!, reception: receptionDishes(save)[0] ?? null } : {}),
        }
        save = playEvent(save, pack, HER, outcome).save
        played = true
        if (state.rung === 'f3') r.friend3 = day
        if (state.rung === 'confession') r.confession = day
        if (state.rung === 'proposal') r.proposal = day
        if (state.rung === 'wedding') r.wedding = day
      }
      if (!played) {
        const waits = readiness(save, pack, HER).waits
        if (waits) r.waits[waits.kind] = (r.waits[waits.kind] ?? 0) + 1
      }
      spent(before, save)
    }
    if (r.wedding !== null) {
      // The wedding night: tender, fading to morning. The run ends here, on the day's gold.
      r.gold = save.gold
      return r
    }
    save = farm(save)
    save = runNight(save, context)
    if (save.summary?.money?.some((m) => m.kind === 'short')) r.shortNights++
    if (n % 24 === 0) expect(parseSaveV5(json(save))).toEqual(save)
  }
  r.stuck = `not married by year ${CAP_YEARS}: ${save.love[HER] ? `${save.love[HER]!.stage} ${save.love[HER]!.level}` : 'never met'}`
  r.gold = save.gold
  return r
}

/** Seven farms: the account seeds every draw (stars, hauls, her lines, her invitations), never where she is. */
const SEEDS = ['marriage-1', 'marriage-2', 'marriage-3', 'marriage-4', 'marriage-5', 'marriage-6', 'marriage-7']
const PLACES = ['default', 'home'] as const
const RUNS: Run[] = (['town', 'farm'] as const).flatMap((home) => PLACES.flatMap((place) => (['devoted', 'casual'] as const).map((profile) => ({ profile, home, place }))))
const results = await Promise.all(RUNS.flatMap((run) => SEEDS.map((seed) => simulate(run, seed))))
const all = (profile: Profile, home: Home, place: Place) => results.filter((x) => x.run.profile === profile && x.run.home === home && x.run.place === place)
const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
}
/** A measure's median over the seven farms, and its range. */
const stat = (xs: readonly Result[], pick: (x: Result) => number) => {
  const values = xs.map(pick)
  return { median: median(values), min: Math.min(...values), max: Math.max(...values) }
}
/** The share of days she was in front of you, before or after you invited her to work. */
const reachShare = (xs: readonly Result[], when: 'before' | 'after'): number =>
  xs.reduce((n, x) => n + x.reach[when], 0) / Math.max(1, xs.reduce((n, x) => n + x.reach[`${when}Days`], 0))

if (process.env.MARRIAGE) {
  const fmt = (n: number) => n.toLocaleString('en-US')
  const range = (v: { median: number; min: number; max: number }, unit = '') => (v.min === v.max ? `${fmt(v.median)}${unit}` : `${fmt(v.median)}${unit} (${fmt(v.min)}–${fmt(v.max)})`)
  const when = (v: { median: number; min: number; max: number }) => {
    const at = dateOf(v.median)
    return `${range(v)}: ${at.season.charAt(0).toUpperCase()}${at.season.slice(1)} ${at.day}, year ${at.year}`
  }
  const cols = (['devoted', 'casual'] as const).flatMap((profile) => PLACES.map((place) => ({ profile, place })))
  for (const home of ['town', 'farm'] as const) {
    console.log(`\n${home === 'town' ? 'She stays in town' : 'Invited to the farm the day she\'s met'}`)
    console.log(`|  | ${cols.map((c) => `${c.profile === 'devoted' ? 'Devoted' : 'Casual'}, ${c.place === 'default' ? 'the default schedule' : 'a home in town'}`).join(' | ')} |`)
    console.log(`|---|${cols.map(() => '---').join('|')}|`)
    const row = (label: string, cell: (xs: Result[]) => string) => console.log(`| ${label} | ${cols.map((c) => cell(all(c.profile, home, c.place))).join(' | ')} |`)
    row('Met her, day', (xs) => range(stat(xs, (x) => x.met!)))
    row('Out of her reach, days', (xs) => range(stat(xs, (x) => x.unmetDays + x.unreachable)))
    row('In front of you, before she\'s a farmhand', (xs) => `${Math.round(100 * reachShare(xs, 'before'))}% of days`)
    row('In front of you, once she\'s a farmhand', (xs) => `${Math.round(100 * reachShare(xs, 'after'))}% of days`)
    row('Friendship 3, day', (xs) => range(stat(xs, (x) => x.friend3!)))
    row('A farmhand, day', (xs) => range(stat(xs, (x) => x.farmhand!)))
    row('The confession, day', (xs) => range(stat(xs, (x) => x.confession!)))
    row('The proposal, day', (xs) => range(stat(xs, (x) => x.proposal!)))
    row('**The wedding**, day', (xs) => `**${when(stat(xs, (x) => x.wedding!))}**`)
    row('Meeting her to the wedding, days', (xs) => range(stat(xs, (x) => x.wedding! - x.met!)))
    row('Actions spent on her', (xs) => range(stat(xs, (x) => x.actions)))
    row('Evenings', (xs) => range(stat(xs, (x) => x.evenings)))
    row('Gifts: loved, liked', (xs) => `${fmt(median(xs.map((x) => x.gifts.loved)))}, ${fmt(median(xs.map((x) => x.gifts.liked)))}`)
    row('Gold at the wedding', (xs) => range(stat(xs, (x) => x.gold), 'g'))
    row('Days her event waited on her bar', (xs) => range(stat(xs, (x) => x.waits.bar ?? 0)))
    row('Days it waited on a ring', (xs) => range(stat(xs, (x) => x.waits.ring ?? 0)))
    row('Short nights', (xs) => range(stat(xs, (x) => x.shortNights)))
    row('Real time, at 3–5 minutes a day', (xs) => {
      const days = median(xs.map((x) => x.wedding!))
      const h = (m: number) => (days * m >= 120 ? `${Math.round(days * m / 60)} h` : `${days * m} min`)
      return `${h(3)}–${h(5)}`
    })
  }
}

describe('a route to marriage, simulated', () => {
  it('reaches the wedding night in every run, devoted and casual, in town and on the farm, on the default schedule and with a home', () => {
    expect(results).toHaveLength(RUNS.length * SEEDS.length)
    for (const x of results) {
      const name = `${x.run.profile} ${x.run.home} ${x.run.place} ${x.seed}`
      expect(x.stuck, name).toBeNull()
      expect(x.met, name).not.toBeNull()
      expect([x.met!, x.friend3!, x.confession!, x.proposal!, x.wedding!].every((d, i, list) => i === 0 || d > list[i - 1]!), name).toBe(true)
    }
  })

  it('never dead-ends: her event waits only on her bar, the day after, the ring, or one a day', () => {
    for (const x of results) for (const kind of Object.keys(x.waits)) expect(['bar', 'day', 'ring', 'today'], `${x.run.profile} ${x.run.home} ${x.run.place} ${x.seed}`).toContain(kind)
  })

  it('courts no slower on the farm than in town, and devoted no slower than casual', () => {
    const span = (xs: readonly Result[]) => median(xs.map((x) => x.wedding! - x.met!))
    for (const place of PLACES) {
      for (const profile of ['devoted', 'casual'] as const) expect(span(all(profile, 'farm', place))).toBeLessThanOrEqual(span(all(profile, 'town', place)))
      for (const home of ['town', 'farm'] as const) expect(span(all('devoted', home, place))).toBeLessThanOrEqual(span(all('casual', home, place)))
    }
  })

  it('a farmhand is in front of you every day, and so is an Uma on the farm; nobody is placed at random', () => {
    for (const place of PLACES) {
      for (const x of all('devoted', 'town', place)) expect(x.reach.after).toBe(x.reach.afterDays)
      for (const y of all('devoted', 'farm', place)) expect(y.reach.before + y.reach.after).toBe(y.reach.beforeDays + y.reach.afterDays)
      // Every farm meets her the same day: where she is never depends on the player.
      expect(new Set(all('devoted', 'town', place).map((x) => x.met)).size).toBe(1)
    }
    // Before she's a farmhand, the default schedule has her in town on four days of the season's twelve.
    expect(reachShare(all('devoted', 'town', 'default'), 'before')).toBeCloseTo(1 / 3, 1)
  })

  it('a home in town brings her out every day, and weds no later; living in town, the wedding comes inside the second year', () => {
    expect(reachShare(all('devoted', 'town', 'home'), 'before')).toBe(1)
    expect(median(all('devoted', 'town', 'home').map((x) => x.wedding!))).toBeLessThanOrEqual(median(all('devoted', 'town', 'default').map((x) => x.wedding!)))
    for (const profile of ['devoted', 'casual'] as const) expect(median(all(profile, 'town', 'default').map((x) => x.wedding!))).toBeLessThanOrEqual(2 * DAYS_PER_YEAR)
  })
})
