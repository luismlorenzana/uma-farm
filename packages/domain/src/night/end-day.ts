// End the day: the night is one pure function, nine steps in a fixed order, one save write. A step whose part of the
// game isn't built yet (the workshops) does nothing:
//
//   1 the bin pays · 2 the farmhands work, the farm eats, then the bill (the loans' shares, the takeout and the upkeep),
//   then watered crops grow · 3 animals · 4 the stations' loads are done ·
//   5 workshops reset · 6 ranks, bonds and well fed · 7 crops wither and the calendar turns
//   · 8 places built, the Dorm, the Diary and the Farm Rank, meeting her · 9 the morning summary
//
// Every draw a step makes is `draw(uid, day, what, n)`, so the same save always gives the same morning. The player's
// change is stamped once, with real time, after the ninth step.
//
// The farmhands work first in step 2 (`farmhandsWork`, `farm/farmhands.ts`), so their watering grows tonight and the
// steps that read the Umas' work (`worked`, `tended`, `made`: rank points, bonds at a place, her line, a mentor, side by
// side's and the perks' extras, praise) read theirs. The romance's steps sit among them: step 2 waters a dry tile for each farmer's night chore;
// step 4 pays side by side's extras (`nightExtras`); step 6 reads favourites from the story pack and her friendship's factor, ticks bonds
// (`tickBonds`) and pays her line +10 (`payLine`); step 7 clears the whole `today`; step 8 is `raiseBuildings` →
// `settleDorm` → `checkGoals` → `unlockTownNotes` (the world's Town notes whose unlock holds on the morning's date, named in §5); step 9 notes
// praise earned overnight, birthdays and anniversaries today and tomorrow with the anniversary's item (`heartsMorning`),
// draws the morning's invitations (`drawInvitations`), and its §4 is Hearts, with the invitations, the chapters opened
// (`chaptersOpened`), side by side and the bond hearts reached. The perks: step 2's farming chores, step 3's ranch
// chores (`ranchNightChores`), step 4's perks' extras (`nightExtras`) and gathering and digging chores (`nightChores`),
// step 6's mentor, and step 9's
// morning items (`morningItems`), with their Hearts lines. The ring and the wedding: step 8 sets the ring bench the night after the first Romance 8
// (`openRingBench`), and step 9 serves a wedding's reception (`serveTheReception`) before anything else. Married life:
// before step 1 tonight's house is noted (`noteTheNight`); step 6 pays shared houses' bonds (`shareHouses`) and levels
// S2 and S4 (`levelAtNight`); step 8 notes the household milestones (`householdMilestones`); step 9 gives the house's
// morning (`houseMorningStep`), moves waiting spouses into rooms (`moveInRooms`) and holds the Festival of Vows
// (`vowsMorning`). A night without the story pack runs the farm's steps and skips the romance's.
import { festivalOn, isNewYear, isSeasonStart, dateOf, type Festival } from '../farm/calendar'
import { bondsTonight, extrasTonight, newBondHearts, type BondPay, type Extras } from '../farm/bonds'
import { settleDormNight } from '../farm/dorm'
import { PLACE_ACTIVITY, tickRankRules, type WorkedDay } from '../farm/rank-rules'
import { talentsD, type TalentOf } from '../farm/talents'
import { growTiles, tilesToPlant, witherTiles, type Withered } from '../fields/fields'
import type { MadeTonight } from '../gathering/kinds'
import { finishLoads, type LoadDone } from '../gathering/stations'
import { isStation } from '../gathering/ids'
import { payBin } from '../save/bin'
import { marketNight } from '../goods/market'
import type { LoopPlaceId } from '../save/parse-v4'
import { touched } from '../save/save'
import { payLines } from '../romance/acts'
import { chaptersOpened } from '../romance/chapters'
import { drawInvites } from '../romance/evening'
import { openBench } from '../romance/bench'
import { serveReception } from '../romance/wedding'
import { heartDays, NO_BIRTHDAYS, type Birthdays } from '../romance/days'
import { praiseOvernight } from '../romance/praise'
import { fieldChores, gatherChores, leaveMorningItems, mentorsTonight, ranchChores, type ChoresDone } from '../romance/perk-effects'
import { moveInWaiting } from '../romance/homestead'
import { festivalOfVows, householdNight, houseMorning, levelsTonight, missesLine, noteTheNight, shareHouses, type NightHouse } from '../romance/household'
import { dryTiles, newTodayV4, type FarmSave, type OutfitId } from '../save/v4'
import { castOrder, type StoryPack } from '../story/pack'
import { favouriteOf, festivalsOf, storyDaysOn } from '../story/placeholders'
import { unlockNotes } from '../town/notes'
import { checkGoalsNight, type GoalsTonight } from '../farm/diary'
import { raiseBuilds } from '../farm/builds'
import { settleAccounts, type FoodBill } from '../farm/economy'
import { eatTonight } from '../farm/food'
import { aptitudeUps, fedThisMorning, handsTonight } from '../farm/farmhands'
import type { FarmPlaceId } from '../farm/places'
import { tendNight } from '../ranch/ranch'
import type {
  BinSale, FarmhandLine, HeartLine, HouseholdNews, HouseLine, HouseMissesLine, InviteLine, ItemLine, LevelLine, MoneyLine, MorningSummary, MovedLine, NewsLine, Nudge, RanchLine, RankLine,
  StoryNews, VowsLine, WorkLine,
} from './summary'

/** What the night reads beyond the save: the talents the app reads from master data, the story pack and the
 * birthdays. */
export interface NightContext {
  /** Each Uma's talent in an activity: rank points (step 6), her night chores' and morning items' stars. D for
   * everyone when left out (tests). */
  readonly talentOf?: TalentOf
  /** The story pack: the night's favourites, her line's places, the Town notes and anniversary items, and the
   * ties (their seeds, her closest friend), with the town (its people, master data's characters). A night without it
   * meets no one, reads no favourites, ticks no bonds and pays no line. */
  readonly story?: Pick<StoryPack, 'cast' | 'bibles' | 'ties'> & Partial<Pick<StoryPack, 'town' | 'master' | 'world'>>
  /** Each cast Uma's birthday as a day of the farm's year: master data's character set through the cast
   * (`birthdaysOf`). None when left out. */
  readonly birthdays?: Birthdays
  /** A story release that reached the device since the last morning, which the device tells from one it has seen:
   * the morning's New today says "New story arrived", first. None when left out. */
  readonly release?: Omit<StoryNews, 'kind'> | null
}

/** What the steps saw that a later one needs and the save alone can't show. */
export interface NightNotes {
  /** Step 1: what the bin sold tonight, by good and star. The summary's bin section. */
  readonly sold: readonly BinSale[]
  /** Step 2, after the farm eats: the loans' shares, the pantry and the takeout, the upkeep, a short night or the owed
   * paid. The summary's food, upkeep and loans section. */
  readonly money: readonly MoneyLine[]
  /** Step 2, after the farmhands: what the farm ate, for the bill. */
  readonly food: FoodBill | null
  /** Who worked today, and where: the farmhands' gathering places and stations, one place each, which step 6 pays rank
   * points from. */
  readonly worked: readonly { outfitId: OutfitId; place: LoopPlaceId }[]
  /** Who worked the field today: the farmhands whose day was the Fields' (farming). */
  readonly tended: readonly { outfitId: OutfitId }[]
  /** The goods the farmhands' work brought in tonight, by place. */
  readonly made: readonly MadeTonight[]
  /** Step 2, first: each farmhand's day, §2's first lines. */
  readonly hands: readonly FarmhandLine[]
  /** Step 2, first: the areas and spots the farmhands worked, for the Diary's depth milestones. */
  readonly handsGathered: readonly string[]
  /** Step 2: the tiles that grew a stage tonight, and how many turned ripe. */
  readonly grew: number
  readonly ripened: number
  /** Step 3: the Coop's and the Barn's nights. */
  readonly ranch: readonly RanchLine[]
  /** Step 4: the stations' loads done tonight. */
  readonly loads: readonly LoadDone[]
  /** Step 7: crops that withered on a season's last night, by crop. */
  readonly withered: readonly Withered[]
  /** Step 6: rank-ups, and points that filled tonight. The summary's ranks section. */
  readonly ranks: readonly RankLine[]
  /** Step 8: the Dorm's level, when a level bought took effect tonight. */
  readonly dorm: number | null
  /** Step 8: Umas a swap brought home. */
  readonly home: readonly OutfitId[]
  /** Step 8: the places built overnight, in the order paid. */
  readonly built: readonly FarmPlaceId[]
  /** Step 8: the Diary's milestones and rows paid, and Farm Ranks reached. */
  readonly goals: GoalsTonight
  /** Step 8: the Town notes the night unlocked, by id. */
  readonly townNotes: readonly string[]
  /** Step 6: who was paid +10 for a day at her line. */
  readonly lines: readonly { id: string; points: number }[]
  /** Step 9: birthdays and anniversaries today and tomorrow, §4's first stored lines. */
  readonly days: readonly HeartLine[]
  /** Step 4: side by side's extras, copies of each Uma's night's items into the Warehouse. */
  readonly extras: readonly Extras[]
  /** Step 6: bond points each pair earned for a shared place today. */
  readonly bonds: readonly BondPay[]
  /** Step 9: this morning's invitations, §4's second place. */
  readonly invites: readonly InviteLine[]
  /** Steps 2 and 4: each Uma's night chores done: a farmer's tiles watered, a forager's and a fisher's items. */
  readonly chores: readonly ChoresDone[]
  /** Step 4: the perks' extras, copies of each Uma's night's items by the romance term. */
  readonly perks: readonly Extras[]
  /** Step 9: this morning's items, R2's and S2's. */
  readonly items: readonly ItemLine[]
  /** Before step 1: the house slept in tonight, once anyone is married. */
  readonly house: NightHouse | null
  /** Step 6: spouse levels reached tonight, S2 and S4. */
  readonly levels: readonly LevelLine[]
  /** Step 8: household milestones passed tonight. */
  readonly household: readonly HouseholdNews[]
  /** Step 9: the house's morning, its extra items, waiting spouses moved in, a house that misses you, and the Festival
   * of Vows. */
  readonly houseLine: HouseLine | null
  readonly houseItems: readonly ItemLine[]
  readonly moved: readonly MovedLine[]
  readonly misses: HouseMissesLine | null
  readonly vows: VowsLine | null
}

/** A night's notes before its first step. */
export const emptyNotes = (): NightNotes => ({
  sold: [], money: [], food: null, worked: [], tended: [], made: [], hands: [], handsGathered: [], grew: 0, ripened: 0, ranch: [], loads: [], withered: [], ranks: [], dorm: null, home: [],
  built: [], goals: { paid: [], ranks: [] }, townNotes: [], lines: [], days: [], extras: [], bonds: [], invites: [], chores: [], perks: [], items: [], house: null, levels: [],
  household: [], houseLine: null, houseItems: [], moved: [], misses: null, vows: null,
})

export interface Night {
  /** The save as the player left the day. */
  readonly before: FarmSave
  /** The save as the night has it so far. */
  readonly save: FarmSave
  readonly context: NightContext
  readonly notes: NightNotes
}

/** One step of the night: the night so far in, the night after it out. Pure. */
export type NightStep = (night: Night) => Night

const talentsOf = (night: Night): TalentOf => night.context.talentOf ?? talentsD
const same: NightStep = (night) => night

/** Step 1: everything shipped today pays at price × stars × demand on the day it was shipped, before
 * the date turns. Gold, `farm.counts['gold-shipped']` and `diary.shipped` rise; the bin empties. */
export const payTheBin: NightStep = (night) => {
  const bin = night.save.bin
  const { save, sales } = payBin(night.save, night.save.calendar.day)
  // Then the market moves: a good shipped past a crate stays eased; every other eased good recovers a step.
  const market = marketNight(save.farm.market, bin)
  return { ...night, save: market === save.farm.market ? save : { ...save, farm: { ...save.farm, market } }, notes: { ...night.notes, sold: sales } }
}
/** Step 2, after the farmhands work: **the farm eats.** The farmer, everyone living on the farm and every farmhand who
 * worked tonight eat two meals each from the pantry, the Umas first, the oldest meals first and the best of those; a
 * ★2+ meal leaves an Uma well fed through tomorrow. What's short is takeout, for the bill. A meal keeps three days, then
 * any left over spoil (`farm/food.ts`). */
export const theFarmEats: NightStep = (night) => {
  const working = night.notes.hands.filter((h) => h.spent > 0).map((h) => h.id)
  const { save, pantry, takeout, spoiled, fed } = eatTonight(night.save, working)
  return { ...night, save, notes: { ...night.notes, food: { pantry, takeout, spoiled, fed: fed.length } } }
}
/** Step 2, after the farm eats: **the bill.** The night's income (the bin's pay) joins the book's last seven nights;
 * each loan takes its share of that income, then the takeout and the upkeep are charged with anything owed: what gold
 * there is pays, takeout first; the rest is owed, and the short nights in a row count on until it's paid
 * (`farm/economy.ts`). */
export const settleTheAccounts: NightStep = (night) => {
  const income = night.notes.sold.reduce((n, sale) => n + sale.gold, 0)
  const { save, lines } = settleAccounts(night.save, income, night.notes.food)
  return { ...night, save, notes: { ...night.notes, money: lines } }
}
/** Step 2, first: **the farmhands' night.** Each farmhand, in the order you invited them, after her part-time job,
 * spends her actions today (3, more settled in, married and well fed this morning; at the farm's pace) on her board's
 * tasks: the field's and the loads first, in your order, then her gathering, a turn each. Her work is a point of practice
 * an action, her goods go into the Warehouse, and where she spent the most actions is her place today. */
export const farmhandsWork: NightStep = (night) => {
  const { save, lines, worked, tended, made, gathered } = handsTonight(night.save, night.before, talentsOf(night), night.context.story ?? null)
  const { notes } = night
  return {
    ...night, save,
    notes: { ...notes, hands: lines, worked: [...notes.worked, ...worked], tended: [...notes.tended, ...tended], made: [...notes.made, ...made], handsGathered: gathered },
  }
}

/** Step 2: every growing tile watered today grows a stage, and one whose stages reach its days − 0.5 turns ripe; a dry
 * one doesn't grow. With the pack, each farmer's night chore waters a dry growing tile first. Then every tile dries for
 * the next day. */
export const growCrops: NightStep = (night) => {
  const story = night.context.story ?? null
  const { tiles, chores } = story ? fieldChores(night.save, story) : { tiles: new Set<number>(), chores: [] }
  const { save, grew, ripened } = growTiles(night.save, tiles)
  return { ...night, save, notes: { ...night.notes, grew, ripened, chores: [...night.notes.chores, ...chores] } }
}
/** Step 3: **the animals.** Each animal fed today makes its good, waiting in its building to be collected (one at a time),
 * and grows a little fonder; one left unfed goes hungry, makes nothing and loses fondness, and never dies. Then each is
 * unfed and uncared for the next day (`ranch/ranch.ts`). */
export const tendAnimals: NightStep = (night) => {
  const { save, lines } = tendNight(night.save)
  return { ...night, save, notes: { ...night.notes, ranch: lines } }
}

/** Step 3, after the animals' night: **the ranch's chores.** A rancher's night chores give each animal in her building
 * (the Coop or the Barn she cares for on the work board, else the first that stands) +5 fondness each; on the farm only,
 * 1 from F6, 2 from R7, 3 from S4. A night without the pack does none. */
export const ranchNightChores: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, chores } = ranchChores(night.save, night.context.story)
  return { ...night, save, notes: { ...night.notes, chores: [...night.notes.chores, ...chores] } }
}

/** Step 4: every load started at a station today is done: its goods into the Warehouse at their stars, the station free
 * for the morning. */
export const finishTheLoads: NightStep = (night) => {
  const { save, done } = finishLoads(night.save)
  return { ...night, save, notes: { ...night.notes, loads: done } }
}

/** Step 4, after the loads: **the night's extras.** Side by side: each Uma whose work
 * finished items tonight at a place where an Uma she has 3+ bond hearts with also worked today gets 10% of them again (20%
 * in her element), seeded copies straight into the Warehouse; then **the perks' extras**: the
 * bond term × the romance term (her line's +10% and +20%, her ring, a dream, the household; held to 40%) of the same
 * items, their own seeded copies. The planned hauls (uma-work's) are untouched. */
export const nightExtras: NightStep = (night) => {
  const { save, extras, perks } = extrasTonight(night.save, night.notes.made, workedAll(night.notes), night.context.story ?? null)
  return { ...night, save, notes: { ...night.notes, extras, perks } }
}

/** Who worked where today, the field's farmhands at the Fields. */
const workedAll = (notes: NightNotes): { outfitId: string; place: string }[] => [...notes.worked, ...notes.tended.map((t) => ({ outfitId: t.outfitId, place: 'fields' }))]

/** Step 4, after the extras: **the gathering and digging chores.** A forager's night chores bring one item
 * each from her rank's deepest forest area this season, a fisher's one fish each from her deepest spot, at a day's haul's
 * stars, a miner's one find each from the Mine's or the Quarry's deepest floor at a face's, straight into the Warehouse;
 * on the farm only, 1 from F6, 2 from R7, 3 from S4. A night without the pack does none. */
export const nightChores: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, chores } = gatherChores(night.save, night.context.story, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, chores: [...night.notes.chores, ...chores] } }
}

/** Step 5: each workshop may be played again tomorrow. `workshops.played` holds the day, so nothing moves. */
export const resetWorkshops: NightStep = same
/**
 * Step 6: rank points for every farmhand who worked today, one activity each: her place's (`notes.worked` by
 * `PLACE_ACTIVITY`, the field's `notes.tended` farming). 10 points × her talent's factor, ×1.2 in her favourite line,
 * ×1.25 well fed, ×1.05 or ×1.10 for her friendship. Then every Uma ranks up where her points and challenge are both met,
 * one rank a night.
 */
export const tickRanks: NightStep = (night) => {
  const talentOf = talentsOf(night)
  const { story } = night.context
  const favourites = new Map(Object.keys(night.save.roster).map((id) => [id, story ? favouriteOf(story, id) : null]))
  const worked: WorkedDay[] = [
    ...night.notes.worked.map((w) => ({ outfitId: w.outfitId, activity: PLACE_ACTIVITY[w.place] })),
    ...night.notes.tended.map((t): WorkedDay => ({ outfitId: t.outfitId, activity: 'farming' })),
  ]
  // With the pack, a mentor's ×1.10 for the others at her place today.
  const mentors = story ? mentorsTonight(night.save, story, night.notes.worked, night.notes.tended) : null
  const { save, lines } = tickRankRules(night.save, worked, (outfitId, activity) => ({
    talent: talentOf(outfitId, activity), favourite: favourites.get(outfitId) === activity, ...(mentors?.has(outfitId) ? { mentor: mentors.get(outfitId)! } : {}),
  }))
  return { ...night, save, notes: { ...night.notes, ranks: lines } }
}
/** Step 6: bond points for pairs who shared a place: every pair among the Umas who worked one place today earns +10
 * once a night, ×1.5 sharing a favourite line of that place's, ×1.5 more when one is at Romance 4 and the other her
 * closest friend. A night without the pack ticks none. */
export const tickBonds: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, paid } = bondsTonight(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, bonds: paid } }
}

/** Step 6: +10 to each Uma who worked today at one of her line's places, once a night. A night without the pack pays
 * none. */
export const payLine: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, paid } = payLines(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, lines: paid } }
}

/** Step 6: the well-fed days count down (a wedding's reception and her breakfast feed the farm). */
export const countWellFed: NightStep = (night) => ({ ...night, save: wellFedDown(night.save) })

function wellFedDown(save: FarmSave): FarmSave {
  return { ...save, roster: Object.fromEntries(Object.entries(save.roster).map(([id, uma]) => [id, uma.wellFed > 0 ? { ...uma, wellFed: uma.wellFed - 1 } : uma])) }
}

/** Step 7, before the date turns: on a season's last night, crops still growing that don't grow in
 * the next season wither. Ripe crops wait. */
export const witherCrops: NightStep = (night) => {
  const { save, withered } = witherTiles(night.save)
  return { ...night, save, notes: { ...night.notes, withered } }
}

/**
 * Step 7: the calendar turns. The whole `today` clears: the day's actions, going into town, the areas worked, chats and
 * gifts, praise earned and paid, events played, evenings and invitations. On a season's last night `witherCrops` has
 * already withered crops out of season.
 */
export const turnCalendar: NightStep = (night) =>
  ({ ...night, save: { ...night.save, calendar: { day: night.save.calendar.day + 1 }, today: newTodayV4() } })

/** Step 8, first: every place paid for yesterday stands (`buildings[id]` 1), and the morning says so. */
export const raiseBuildings: NightStep = (night) => {
  const { save, built } = raiseBuilds(night.save)
  return { ...night, save, notes: { ...night.notes, built } }
}

/** Step 8: the Dorm's level bought takes effect, and swaps arrive: each Uma swapped out
 * goes away and the one swapped in comes home in her place. */
export const settleDorm: NightStep = (night) => {
  const { save, raised, home } = settleDormNight(night.save)
  return { ...night, save, notes: { ...night.notes, dorm: raised, home } }
}

/** Step 8, after the goals: the world's Town notes whose unlock holds on the morning's date (a season, a festival,
 * a Farm Rank, a place built, a good shipped, another's event) unlock, each once; the morning names them. A night
 * without the pack unlocks none. */
export const unlockTownNotes: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, unlocked } = unlockNotes(night.save, night.context.story, { at: 'night' })
  return { ...night, save, notes: { ...night.notes, townNotes: unlocked } }
}

/** Step 8: the Diary pays the milestones and rows reached (a depth milestone by the areas and spots worked today, read
 * from the day as it was left), and the Farm Rank's points are recomputed. */
export const checkGoals: NightStep = (night) => {
  const { save, tonight } = checkGoalsNight(night.save, [...new Set([...night.before.today.gathered, ...night.notes.handsGathered])])
  return { ...night, save, notes: { ...night.notes, goals: tonight } }
}

/** Step 8, after the goals: the night after the first Romance 8 event anyone played,
 * the Forge's building stands as the ring bench (`buildings.forge = 0`), and the smith's scene is due in the morning. */
export const openRingBench: NightStep = (night) => ({ ...night, save: openBench(night.save) })

/** Step 9, first: today's wedding reception (`today.reception`, cleared by step 7, so
 * read from the day as it was left) feeds everyone on the farm for its days from tomorrow, never shortening a meal
 * already running. */
export const serveTheReception: NightStep = (night) => {
  return { ...night, save: serveReception(night.save, night.before.today.reception).save }
}

/** Before step 1: once anyone is married, tonight's house and companion are noted, your pick of her from Tonight (her
 * house) or else the house slept in least lately and its resident who's been your companion least lately, and the picks
 * clear for tomorrow. */
export const noteTonight: NightStep = (night) => {
  const { save, night: house } = noteTheNight(night.save)
  return { ...night, save, notes: { ...night.notes, house } }
}

/** Step 6: +10 bond a night to each pair of residents sharing a house. A night without
 * the pack pays none. */
export const shareTheHouses: NightStep = (night) => {
  if (!night.context.story) return night
  return { ...night, save: shareHouses(night.save, night.context.story).save }
}

/** Step 6: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, with no Ready event;
 * the morning's line plays her level's scene, then her level-up card. */
export const levelAtNight: NightStep = (night) => {
  const { save, levels } = levelsTonight(night.save)
  return { ...night, save, notes: { ...night.notes, levels } }
}

/** Step 8, after the bench: the household milestones as the married count passes 1, 5, 10, 15
 * and 20: news, the furniture set at 5, the finale's morning at 20. */
export const householdMilestones: NightStep = (night) => {
  const { save, news } = householdNight(night.save)
  return { ...night, save, notes: { ...night.notes, household: news } }
}

/** Step 9, after the reception: the morning of the house slept in: each resident +30, her
 * breakfast (S1) if no meal runs, one more morning item each at S2+; and a house you haven't slept in for 8 nights misses
 * you. A night without the pack gives none. */
export const houseMorningStep: NightStep = (night) => {
  if (!night.context.story || !night.notes.house) return night
  const { save, line, items } = houseMorning(night.save, night.context.story, night.notes.house, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, houseLine: line, houseItems: items, misses: missesLine(save) } }
}

/** Step 9: spouses home in the Dorm who wait for a room take one, in wedding order, once a house
 * stands; the morning says who moved where. */
export const moveInRooms: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, moved } = moveInWaiting(night.save, night.context.story)
  return { ...night, save, notes: { ...night.notes, moved: moved.map((m): MovedLine => ({ kind: 'moved', id: m.id, house: m.house })) } }
}

/** Step 9: on the finale's day of the year, each later year, every spouse +50 and a festival
 * night tonight. */
export const vowsMorning: NightStep = (night) => {
  const { save, line } = festivalOfVows(night.save)
  return { ...night, save, notes: { ...night.notes, vows: line } }
}

/** The morning's news (the summary's §5): the season's first day; today's, then tomorrow's: New Year's, a festival (the
 * year's: the game's five, or the story's) and the story's holidays and minor days (world.json's `days`, by id). */
function newsOf(day: number, year: readonly Festival[], pack: Partial<Pick<StoryPack, 'world'>> | null): NewsLine[] {
  const news: NewsLine[] = []
  if (isSeasonStart(day)) news.push({ kind: 'season', season: dateOf(day).season })
  for (const [on, when] of [[day, 'today'], [day + 1, 'tomorrow']] as const) {
    if (isNewYear(on)) news.push({ kind: 'new-year', when })
    const festival = festivalOn(on, year)
    if (festival) news.push({ kind: 'festival', festival: festival.id, when })
    const own = storyDaysOn(pack, on)
    if (own.length > 0) news.push({ kind: 'days', ids: own.map((d) => d.id), when })
  }
  return news
}

/** The goals' news: the places built overnight (a station's new level with it), the Farm Ranks reached, then the Diary's
 * milestones and rows paid. */
function goalNews(notes: NightNotes, save: Pick<FarmSave, 'buildings'>): NewsLine[] {
  const { ranks, paid } = notes.goals
  return [
    ...notes.built.map((place): NewsLine => {
      const level = save.buildings[place as keyof FarmSave['buildings']] ?? 1
      return { kind: 'built', place, ...(isStation(place) && level > 1 ? { level } : {}) }
    }),
    ...ranks.map((rank): NewsLine => ({ kind: 'farm-rank', rank })),
    ...paid.map((id): NewsLine => ({ kind: 'milestone', id })),
  ]
}

/** The Dorm's news: its new level, and Umas home from a swap (the night's meetings are §4's). */
function dormNews({ notes }: Night): Extract<NewsLine, { kind: 'dorm' | 'home' }>[] {
  return [...(notes.dorm !== null ? [{ kind: 'dorm' as const, level: notes.dorm }] : []), ...(notes.home.length > 0 ? [{ kind: 'home' as const, umas: [...notes.home] }] : [])]
}

/** §4 Hearts: the night's companion, who greets you this morning; this morning's invitations, birthdays and anniversaries
 * today and tomorrow (`heartsMorning`), then everyone the
 * night met at step 8, in the cast's order, home or in town (her meeting scene waits for the farm to open), and each
 * chapter that opened this morning (`chaptersOpened`); then this morning's items and the night's chores; then the perks'
 * extras, side by side's extras and the bond hearts reached since the last morning. */
function heartLines(night: Night): HeartLine[] {
  const { save, before, context } = night
  const order = context.story ? castOrder(context.story) : []
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const extras = night.notes.extras.reduce((n, e) => n + e.items.length, 0)
  const perks = night.notes.perks.reduce((n, e) => n + e.items.length, 0)
  const choreItems = night.notes.chores.reduce((n, c) => n + c.items.length, 0)
  const choreWatered = night.notes.chores.reduce((n, c) => n + c.watered, 0)
  const choreFondness = night.notes.chores.reduce((n, c) => n + (c.fondness ?? 0), 0)
  // Her house's extra morning item joins her own `item` line, after her count's.
  const items = new Map<string, string[]>()
  for (const line of [...night.notes.items, ...night.notes.houseItems]) items.set(line.id, [...(items.get(line.id) ?? []), ...line.items])
  return [
    ...(night.notes.house?.companion ? [{ kind: 'morning' as const, id: night.notes.house.companion }] : []),
    ...night.notes.invites,
    ...night.notes.days,
    ...(night.notes.vows ? [night.notes.vows] : []),
    ...night.notes.levels,
    ...Object.keys(save.roster).filter((id) => !before.roster[id]).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
      .map((id): HeartLine => ({ kind: 'arrived', id, home: save.dorm.home.includes(id) })),
    ...(context.story ? chaptersOpened(before, save, context.story, order) : []).map(({ id, chapter }): HeartLine => ({ kind: 'chapter', id, chapter })),
    ...(night.notes.houseLine ? [night.notes.houseLine] : []),
    ...night.notes.moved,
    ...(night.notes.misses ? [night.notes.misses] : []),
    ...[...items].map(([id, keys]): ItemLine => ({ kind: 'item', id, items: keys })),
    ...(choreItems > 0 || choreWatered > 0 || choreFondness > 0
      ? [{ kind: 'chores' as const, items: choreItems, watered: choreWatered, ...(choreFondness > 0 ? { fondness: choreFondness } : {}) }] : []),
    ...(perks > 0 ? [{ kind: 'perks' as const, items: perks }] : []),
    ...(extras > 0 ? [{ kind: 'side' as const, items: extras }] : []),
    ...newBondHearts(before, save, order),
  ]
}

/** Step 9, before the summary, the date already turned: praise earned overnight
 * (her work made a ★3+ item, or she ranked up), and birthdays and anniversaries today and tomorrow, an anniversary today
 * leaving its ★5 item of her line in the Warehouse. */
export const heartsMorning: NightStep = (night) => {
  const rankedUp = night.notes.ranks.flatMap((line) => (line.kind === 'rank-up' ? [line.outfitId] : []))
  const praised = praiseOvernight(night.save, night.notes.made, rankedUp)
  if (!night.context.story) return { ...night, save: praised }
  const { save, lines } = heartDays(praised, night.context.story, night.context.birthdays ?? NO_BIRTHDAYS)
  return { ...night, save, notes: { ...night.notes, days: lines } }
}

/** Step 9, after `heartsMorning` (her R2 and S2 perks): **this morning's items.** Each Uma on the farm
 * whose morning it is by her count (every 4th from Romance 2, every 2nd from Spouse 2) leaves a good of her line at her
 * line's stars (★2+, ★3+ from S2) in the Warehouse. A night without the pack leaves none. */
export const morningItems: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, lines } = leaveMorningItems(night.save, night.context.story, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, items: lines } }
}

/** Step 9, after `heartsMorning`: this morning's invitations, one (two from 10 married),
 * drawn by weight among the Umas home at Friendship 3+ whose favourite kind is open to them, into `today.invites`
 * unanswered and §4's second place. A night without the pack draws none. */
export const drawInvitations: NightStep = (night) => {
  if (!night.context.story) return night
  const save = drawInvites(night.save, night.context.story)
  const invites = save.today.invites.map((i): InviteLine => ({ kind: 'invite', id: i.id, evening: i.kind }))
  return { ...night, save, notes: { ...night.notes, invites } }
}

/** Step 9, before the summary: the farmhands well fed this morning (`today.fed`), each one more action today. */
export const noteTheFed: NightStep = (night) => {
  const fed = fedThisMorning(night.save)
  return fed.length === 0 ? night : { ...night, save: { ...night.save, today: { ...night.save.today, fed } } }
}

/** The release that reached the device, as §5's first line. */
const storyNews = (context: NightContext): StoryNews[] => (context.release ? [{ kind: 'story', number: context.release.number }] : [])

/** Step 9: the morning summary, built from what changed. It replaces last night's. */
export const buildSummary: NightStep = (night) => {
  const { save, notes } = night
  // The farmhands' days, the stations' loads, the ranch's nights, then the field's growth, then what withered.
  const loads = notes.loads.map((l): WorkLine => ({ kind: 'load', station: l.station, item: l.item, count: l.count }))
  const grew: WorkLine[] = notes.grew > 0 ? [{ kind: 'grew', tiles: notes.grew, ripe: notes.ripened }] : []
  const withered = notes.withered.map((w): WorkLine => ({ kind: 'withered', crop: w.crop, tiles: w.tiles }))
  const water = dryTiles(save)
  const plant = tilesToPlant(save)
  const nudges: Nudge[] = [...(water > 0 ? [{ kind: 'water' as const, tiles: water }] : []), ...(plant > 0 ? [{ kind: 'seeds' as const, tiles: plant }] : [])]
  const work = [...notes.hands, ...loads, ...notes.ranch, ...grew, ...withered]
  const ranks = [...notes.ranks, ...aptitudeUps(night.before, save, talentsOf(night))]
  const summary: MorningSummary = {
    day: save.calendar.day, bin: [...notes.sold], ...(notes.money.length > 0 ? { money: [...notes.money] } : {}), work, ranks, hearts: heartLines(night),
    news: [
      ...storyNews(night.context), ...newsOf(save.calendar.day, festivalsOf(night.context.story), night.context.story ?? null),
      ...(notes.townNotes.length > 0 ? [{ kind: 'notes' as const, ids: [...notes.townNotes] }] : []), ...goalNews(notes, save), ...notes.household, ...dormNews(night),
    ],
    nudges,
  }
  // The bond hearts are listed: the day ahead notes its own.
  return { ...night, save: { ...save, today: { ...save.today, bonds: {} }, summary } }
}

/** One of the night's steps: its number, its function and what it does (the manual's table). */
export interface NightStepDef {
  readonly step: number
  readonly name: string
  readonly run: NightStep
  readonly what: string
}

/** The night's steps, in order. */
export const NIGHT_STEPS: readonly NightStepDef[] = [
  { step: 1, name: 'noteTonight', run: noteTonight, what: 'Before the bin, once anyone is married: tonight’s house and companion are noted (her house’s last night slept, and hers, are today), your pick of her at Tonight or else the house slept in least lately and its resident who’s been your companion least lately; the picks clear for tomorrow, and she greets you in the morning' },
  { step: 1, name: 'payTheBin', run: payTheBin, what: 'The bin pays: everything shipped today, at price × stars × demand and the market’s ease (past a crate of 50 of one good, each crate more a step lower: −10% a step, to half); then the market moves: a good shipped past a crate stays eased by the steps it reached, and every other eased good recovers a step' },
  { step: 2, name: 'farmhandsWork', run: farmhandsWork, what: 'The farmhands: each, in the order you invited them, after her part-time job, spends her actions today (3; +1 settled in, +2 a spouse, +1 well fed this morning; at the farm’s pace) on her board’s tasks: the field’s, the loads, the animals’ care and the cooking first, in your order, then her gathering and her digging, a turn each; a point of practice an action, her goods into the Warehouse and her meals into the pantry, her place today where she spent the most' },
  { step: 2, name: 'theFarmEats', run: theFarmEats, what: 'The farm eats: the farmer, everyone living on the farm and every farmhand who worked tonight, two meals each from the pantry, the Umas first, the farmer last, the oldest meals first and the best of those; a ★2+ meal leaves an Uma well fed through tomorrow; what’s short is takeout; a meal keeps three days, then any left over spoil' },
  { step: 2, name: 'settleTheAccounts', run: settleTheAccounts, what: 'The bill: the bin’s pay joins the last seven nights’ income; each loan takes its share of it (a tenth of the loan, from the night’s income only); then the takeout (15g a meal) and the upkeep, with anything owed: what gold there is pays, takeout first, the rest is owed, a short night counted (the second in a row on is half pace) until it’s paid' },
  { step: 2, name: 'growCrops', run: growCrops, what: 'Crops grow: each growing tile watered today grows a stage, and one whose stages reach its days − 0.5 turns ripe; a dry tile doesn’t grow; a farmer’s night chores each water a dry growing tile first; then every tile dries for the next day' },
  { step: 3, name: 'tendAnimals', run: tendAnimals, what: 'Animals: each animal fed today makes its good, waiting in its building to be collected (one at a time), and grows 2 fonder; one left unfed goes hungry, makes nothing and loses 10 fondness, and never dies; then each is unfed and uncared for the next day' },
  { step: 3, name: 'ranchNightChores', run: ranchNightChores, what: 'Ranch chores: a rancher’s night chores each give every animal in her building (the Coop or the Barn she cares for on the work board, else the first that stands) +5 fondness, held to 200; 1 from F6, 2 from R7, 3 from S4, on the farm only' },
  { step: 4, name: 'finishTheLoads', run: finishTheLoads, what: 'Stations: every load started today is done, its goods into the Warehouse at their stars, the station free for the morning' },
  { step: 4, name: 'nightExtras', run: nightExtras, what: 'Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies' },
  { step: 4, name: 'nightChores', run: nightChores, what: 'Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, a miner’s one find each from the Mine’s or the Quarry’s deepest floor, at a face’s, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only' },
  { step: 5, name: 'resetWorkshops', run: resetWorkshops, what: 'Each workshop may be played again tomorrow' },
  { step: 6, name: 'tickRanks', run: tickRanks, what: 'Rank points for every farmhand who worked, one activity each (her place today’s), ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met' },
  { step: 6, name: 'tickBonds', run: tickBonds, what: 'Bonds: +10 to each pair of farmhands who worked one place today, once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend' },
  { step: 6, name: 'payLine', run: payLine, what: 'Her line: +10 to each farmhand who worked today at one of her line’s places, once a night' },
  { step: 6, name: 'shareTheHouses', run: shareTheHouses, what: 'Shared houses: +10 bond a night to each pair of spouses with rooms in the same house' },
  { step: 6, name: 'levelAtNight', run: levelAtNight, what: 'Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, with no Ready event (S2 starts her every-2nd-morning item); the morning’s line plays its scene and card; never S3 or S5' },
  { step: 6, name: 'countWellFed', run: countWellFed, what: 'The well-fed days count down' },
  { step: 7, name: 'witherCrops', run: witherCrops, what: 'On a season’s last night, crops still growing that don’t grow in the next season wither, their soil left tilled; ripe crops wait' },
  { step: 7, name: 'turnCalendar', run: turnCalendar, what: 'The date moves; the whole of `today` clears: the day’s actions and event actions, going into town, the areas worked, chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception' },
  { step: 8, name: 'raiseBuildings', run: raiseBuildings, what: 'Places built: every place paid for yesterday stands this morning (`buildings[id] = 1`), and a station’s level bought yesterday comes (its level one more), each one news' },
  { step: 8, name: 'settleDorm', run: settleDorm, what: 'The Dorm’s level bought takes effect; swaps arrive, each Uma in town coming home in the place of one leaving' },
  { step: 8, name: 'checkGoals', run: checkGoals, what: 'The Diary pays its milestones and rows, and the Farm Rank is recomputed from income and resources' },
  { step: 8, name: 'unlockTownNotes', run: unlockTownNotes, what: 'Town notes: each of the world’s notes not yet unlocked whose unlock holds on the morning’s date (a season, a festival, a Farm Rank, a place built, a good shipped, another’s event) unlocks, once; the morning names them' },
  { step: 8, name: 'openRingBench', run: openRingBench, what: 'The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and the smith’s scene is due in the morning' },
  { step: 8, name: 'householdMilestones', run: householdMilestones, what: 'Household milestones: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 brings the furniture set, 20 the finale’s morning; household scenes are Ready from this morning' },
  { step: 9, name: 'serveTheReception', run: serveTheReception, what: 'A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; the bakery’s cake one), never shortening a meal already running' },
  { step: 9, name: 'houseMorningStep', run: houseMorningStep, what: 'The house’s morning: each resident of the house slept in +30 (only hers on a birthday-alone night); her breakfast (S1) feeds everyone on the farm with no meal left; each resident at S2+ leaves one more morning item; a house with residents not slept in for 8 nights misses you' },
  { step: 9, name: 'moveInRooms', run: moveInRooms, what: 'Rooms: spouses home in the Dorm who wait for a room take one, in wedding order, by the same default as a wedding’s' },
  { step: 9, name: 'vowsMorning', run: vowsMorning, what: 'The Festival of Vows: on the finale’s day of the year, each later year, every spouse +50 and a festival night tonight' },
  { step: 9, name: 'heartsMorning', run: heartsMorning, what: 'Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse' },
  { step: 9, name: 'morningItems', run: morningItems, what: 'Morning items: each Uma on the farm leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+)' },
  { step: 9, name: 'drawInvitations', run: drawInvitations, what: 'Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, \'invite\', n)` among those home at Friendship 3+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14)' },
  { step: 9, name: 'noteTheFed', run: noteTheFed, what: 'The farmhands well fed this morning are noted (`today.fed`): each works one more action today' },
  { step: 9, name: 'buildSummary', run: buildSummary, what: 'The morning summary, from what changed; §2 Work done opens with each farmhand’s day, then the loads and the Coop’s and the Barn’s nights, §3 Ranks closes with the aptitudes that reached a level; §4 Hearts lists the invitations, the Festival of Vows, the night’s levels, the house’s morning, rooms taken and a house that misses you, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning; §5 the household milestones' },
]

/** The night's steps over a save, unstamped: `endDay` without its stamp. Tests swap a step to stand in for a later one. */
export function runNight<S extends FarmSave>(save: S, context: NightContext, steps: readonly { run: NightStep }[] = NIGHT_STEPS): S {
  const start: Night = { before: save, save, context, notes: emptyNotes() }
  return steps.reduce((night, step) => step.run(night), start).save as S
}

/** Ends the day: the night's nine steps, then the player's one stamp, `now` in real time. */
export function endDay<S extends FarmSave>(save: S, context: NightContext, now: string): S {
  return touched(runNight(save, context), now)
}

