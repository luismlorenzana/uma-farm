// Married life at night and the household: the night's
// house, shared houses' bonds, the spouse ladder's night levels, the household milestones, the house's morning with its
// house line, the household scenes, the finale and the Festival of Vows.
//
//   before step 1  tonight's house is noted (`slept`): your pick, else the house slept in least lately
//   step 6         +10 bond a night to each pair sharing a house; a spouse at S1 or S3 whose 600 is full reaches S2 or S4
//   step 8         the married count passing 1, 5, 10, 15 and 20: news, the furniture set at 5, the finale's day at 20
//   step 9         the house's morning: each resident +30, her breakfast (S1) if no meal runs, one more morning item each
//                  at S2+, a house line; then spouses waiting take rooms; on the finale's day each year, the Festival of
//                  Vows: every spouse +50 and a festival night
//
// Household scenes (5, 10, 15) and the finale (20) are Ready offers from the morning after, never auto-played; they pay
// nothing. Every draw is `draw(uid, day, what, n)`. Pure; save v4 only. Loaded with the night and the romance's screens.
import { addBond, BOND_POINTS } from '../farm/bonds'
import { draw } from '../farm/draw'
import { talentsD, type TalentOf, type Temperament } from '../farm/talents'
import { drawStars } from '../goods/stars'
import type { HouseholdNews, HouseLine, ItemLine, LevelLine, VowsLine } from '../night/summary'
import { FINALE_MARRIED, FURNITURE_PIECES, HOUSEHOLD_MILESTONES, marriedCount, residentsOf, vowsOn, type SaveV4 } from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'
import type { Finale, Household, HouseholdAt, Step } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { lineGood } from './days'
import { defaultHouse, missesYou } from './homestead'
import { addLove, advance, bar } from './love'
import type { EventCard } from './events'
import { perkOf } from './perks'
import { breakfast, lineQuality } from './perk-effects'
import { hasPerk, MORNING_ITEMS } from './perk-terms'

/** A house morning pays each resident +30. */
export const HOUSE_POINTS = 30
/** The Festival of Vows pays every spouse +50. */
export const VOWS_POINTS = 50
/** The house's extra morning item's draw on `lineGood` (F51's `MORNING_ITEM_N` is 1). */
export const HOUSE_ITEM_N = 2

// --- Before step 1: the night's house ----------------------------------------------------------------------

/** The house slept in tonight, and whose room it is on a birthday-alone night. */
export interface NightHouse {
  house: number
  alone: string | null
}

/** Before step 1: once anyone is married, tonight's house is noted, your pick or else the default (the
 * house slept in least lately), its night the evening's day; the pick clears for tomorrow's. Before the first wedding, nothing. */
export function noteTheNight(save: SaveV4): { save: SaveV4; night: NightHouse | null } {
  if (marriedCount(save) === 0) return { save, night: null }
  const h = save.homestead
  const house = h.tonight ?? defaultHouse(save)
  const alone = h.tonight === null || h.alone === null || save.love[h.alone]?.house !== house ? null : h.alone
  const slept = h.slept.map((d, i) => (i === house ? save.calendar.day : d))
  return { save: { ...save, homestead: { ...h, tonight: null, alone: null, slept } }, night: { house, alone } }
}

// --- Step 6: shared houses and night levels ---------------------------------------------------------

/** Step 6: +10 bond a night to each pair of residents sharing a house, through F52's `addBond` (Romance 4's
 * ×1.5 inside). Every house, every night. */
export function shareHouses(save: SaveV4, pack: Pick<StoryPack, 'ties'>): { save: SaveV4; paid: { a: string; b: string; points: number }[] } {
  let next = save
  const paid: { a: string; b: string; points: number }[] = []
  save.homestead.houses.forEach((_, house) => {
    const here = residentsOf(save, house).filter((id) => save.roster[id]).sort((a, b) => Number(a) - Number(b))
    for (let i = 0; i < here.length; i++) {
      for (let j = i + 1; j < here.length; j++) {
        const pay = addBond(next, pack, here[i]!, here[j]!, BOND_POINTS.house)
        next = pay.save
        if (pay.paid > 0) paid.push({ a: here[i]!, b: here[j]!, points: pay.paid })
      }
    }
  })
  return { save: next, paid }
}

/** The spouse levels that come at night: S2 and S4, from S1 and S3. */
const NIGHT_LEVEL_FROM: Readonly<Record<number, 's2' | 's4'>> = { 1: 's2', 3: 's4' }

/** Step 6: a spouse at S1 or S3 whose 600 is full reaches S2 or S4 through F47's `advance` (which starts
 * S2's every-2nd-morning count), no event; never S3 or S5, which are events. In the roster's id order. */
export function levelsTonight(save: SaveV4): { save: SaveV4; levels: LevelLine[] } {
  let love = save.love
  const levels: LevelLine[] = []
  for (const id of Object.keys(save.roster).sort((a, b) => Number(a) - Number(b))) {
    const her = love[id]
    const rung = her?.stage === 'spouse' ? NIGHT_LEVEL_FROM[her.level] : undefined
    if (!her || !rung || !bar(her).full) continue
    love = { ...love, [id]: advance(her, save.calendar.day) }
    levels.push({ kind: 'level', id, rung })
  }
  return { save: levels.length === 0 ? save : { ...save, love }, levels }
}

/** A night level's card: F49's level-up card with no event, her perk and her next rung, read from her
 * route now. Null unless she has reached that rung. */
export function nightLevelCard(save: Pick<SaveV4, 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, rung: 's2' | 's4'): EventCard | null {
  const love = save.love[id]
  if (!love || love.stage !== 'spouse' || love.level < Number(rung.slice(1))) return null
  const after = bar(love)
  return {
    id, rung, event: 0, choices: [], plays: [], chosen: null, sum: 0, paid: 0, carried: 0, learnt: [], taken: [], perk: perkOf(rung)?.id ?? null, recipe: null, memory: null,
    unlock: null, answer: null, stage: null, ring: null, wedding: null, line: null, night: true,
    next: after.rung === null ? null : {
      rung: after.rung, cost: after.cost, points: after.points, banked: after.banked, hint: pack.bibles.get(id)?.route.find((b) => b.id === after.rung)?.hint ?? null,
      perk: perkOf(after.rung)?.id ?? null,
    },
  }
}

// --- Step 8: the household milestones ----------------------------------------------------------------

/** Step 8: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 gives the furniture set (five
 * pieces, none placed) and 20 sets the finale's morning (today, the morning after the 20th wedding). The count the night
 * saw is kept, so household scenes are Ready from this morning. */
export function householdNight(save: SaveV4): { save: SaveV4; news: HouseholdNews[] } {
  const count = marriedCount(save)
  const h = save.homestead
  if (count === h.married) return { save, news: [] }
  const passed = HOUSEHOLD_MILESTONES.filter((m) => h.married < m && m <= count)
  const furniture = passed.includes(5) && h.furniture.length === 0 ? Array.from({ length: FURNITURE_PIECES }, () => null) : h.furniture
  const finale = passed.includes(FINALE_MARRIED) && h.finale === 0 ? save.calendar.day : h.finale
  return { save: { ...save, homestead: { ...h, married: count, furniture, finale } }, news: passed.map((married) => ({ kind: 'household', married })) }
}

// --- Step 9: the house's morning ---------------------------------------------------------------------

/**
 * Step 9: the morning of the house slept in. Each resident +30 through `addLove` (an anniversary's ×2 applies);
 * a resident at S1 or more brings **breakfast** (F51's, once: everyone on the farm with no meal left, +5 bond a pair it
 * feeds); each resident at S2 or more leaves **one more morning item** of her line (★3+, `lineGood(…, n = 2)`), on top of her
 * own count. On a birthday-alone night only she counts. An empty house's morning is quiet: no line.
 */
export function houseMorning(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>, night: NightHouse, talentOf: TalentOf = talentsD): { save: SaveV4; line: HouseLine | null; items: ItemLine[] } {
  const umas = (night.alone !== null ? [night.alone] : residentsOf(save, night.house)).filter((id) => save.roster[id])
  if (umas.length === 0) return { save, line: null, items: [] }
  let next = save
  let paid = 0
  for (const id of umas) {
    const pay = addLove(next, id, HOUSE_POINTS, 'house')
    next = pay.save
    paid += pay.paid
  }
  let fed = 0
  if (umas.some((id) => hasPerk(next.love[id], 's1'))) {
    const meal = breakfast(next, pack)
    next = meal.save
    fed = meal.fed.length
  }
  const items: ItemLine[] = []
  let warehouse = next.items
  for (const id of umas) {
    if (!hasPerk(next.love[id], 's2')) continue
    const stars = Math.max(MORNING_ITEMS.s2.stars, drawStars(lineQuality(next, pack, id, talentOf), draw(next.account.uid, next.calendar.day, `house:${id}`, 0)))
    const good = lineGood(next, pack, id, stars, HOUSE_ITEM_N)
    warehouse = addGoods(warehouse, good.id, good.stars, 1)
    items.push({ kind: 'item', id, items: [stockKey(good.id, good.stars)] })
  }
  if (warehouse !== next.items) next = { ...next, items: warehouse }
  return { save: next, line: { kind: 'house', house: night.house, umas, paid, breakfast: fed, items: items.length }, items }
}

/** The morning's "misses you" line: among the houses with residents not slept in for 8 nights or more, the one slept
 * in least lately (ties the lower number); null with none. */
export function missesLine(save: SaveV4): { kind: 'misses'; house: number } | null {
  const houses = save.homestead.houses.map((_, i) => i).filter((i) => missesYou(save, i))
    .sort((a, b) => (save.homestead.slept[a] ?? 0) - (save.homestead.slept[b] ?? 0) || a - b)
  return houses.length > 0 ? { kind: 'misses', house: houses[0]! } : null
}

/** "Another night": the morning's "misses you" line put away for the day. Free; nothing else changes. */
export function anotherNight(save: SaveV4): SaveV4 {
  if (!save.summary || !save.summary.hearts.some((h) => h.kind === 'misses')) return save
  return { ...save, summary: { ...save.summary, hearts: save.summary.hearts.filter((h) => h.kind !== 'misses') } }
}

/** Step 9: on the finale's day of the year, each later year, the Festival of Vows: every spouse +50,
 * and a festival night tonight (`eveningSlots`). */
export function festivalOfVows(save: SaveV4): { save: SaveV4; line: VowsLine | null } {
  if (!vowsOn(save.homestead, save.calendar.day)) return { save, line: null }
  const spouses = Object.keys(save.love).filter((id) => save.roster[id] && save.love[id]!.stage === 'spouse').sort((a, b) => Number(a) - Number(b))
  let next = save
  let paid = 0
  for (const id of spouses) {
    const pay = addLove(next, id, VOWS_POINTS, 'festival')
    next = pay.save
    paid += pay.paid
  }
  return { save: next, line: spouses.length > 0 ? { kind: 'vows', spouses: spouses.length, paid } : null }
}

// --- The house line ----------------------------------------------------------------------------------------

/** The house lines by temperament (CS46's templates), until the pack's are written: three a temperament, `{name}`
 * her name, filled at runtime. Original; mornings only (W16); you are never gendered. */
export const HOUSE_TEMPLATES: Readonly<Record<Temperament, readonly [string, string, string]>> = {
  breezy: [
    '{name} is already out the door: “Race you to the porch!”',
    '{name} hums at the window, toast in one hand. “Morning! The sky’s showing off.”',
    '{name} swings in with the post. “Up, up. The day’s waiting for us.”',
  ],
  steady: [
    '{name} sets two cups down without a word and slides yours closer.',
    '{name} has swept the step and folded the blankets. “Slept well? Good.”',
    '{name} pours the tea. “No rush this morning. Sit a while.”',
  ],
  bold: [
    '{name} hauls in an armful of firewood. “Breakfast after. Chores first, together.”',
    '{name} plants a hand on the table. “Big plans today. You’re in, right?”',
    '{name} grins over her mug. “I was up an hour ago. Took you long enough.”',
  ],
  gritty: [
    '{name} is mending a chair by the hearth. “Almost done. Then we eat.”',
    '{name} shakes the frost off her boots. “Cold one. Kettle’s on for you.”',
    '{name} nods at the door. “Rain later. We’ll beat it if we start now.”',
  ],
  clever: [
    '{name} looks up from her notes. “I’ve planned the whole day. Want to hear it?”',
    '{name} slides the almanac over. “Look: perfect weather for the east rows.”',
    '{name} taps the window. “The swallows are back early. Good sign.”',
  ],
}

/** The house line a morning shows: one resident, drawn by `draw(uid, day, 'house-line', 0)`, says one of her
 * pack's house lines (`draw(…, 1)`; `authored`, her words, `{farmer}` still to fill), else her temperament's template with
 * `{name}` filled. Read live, never stored. */
export function houseLineOf(uid: string, day: number, umas: readonly string[], household: Pick<Household, 'houseLines'> | null, temperamentOf: (id: string) => Temperament,
  nameOf: (id: string) => string): { id: string; text: string; authored: boolean } | null {
  if (umas.length === 0) return null
  const id = umas[Math.floor(draw(uid, day, 'house-line', 0) * umas.length)]!
  const lines = household?.houseLines[id] ?? []
  const pick = (list: readonly string[]) => list[Math.floor(draw(uid, day, 'house-line', 1) * list.length)]!
  return lines.length > 0 ? { id, text: pick(lines), authored: true } : { id, text: pick(HOUSE_TEMPLATES[temperamentOf(id)]).replaceAll('{name}', nameOf(id)), authored: false }
}

// --- Household scenes and the finale ----------------------------------------------

/** A household scene's or the finale's id in `diary.read`: `household:5`, `household:10`, `household:15`,
 * `finale`. */
export type HouseholdId = `household:${HouseholdAt}` | 'finale'
export const HOUSEHOLD_IDS: readonly HouseholdId[] = ['household:5', 'household:10', 'household:15', 'finale']
export const isHouseholdId = (id: string): id is HouseholdId => (HOUSEHOLD_IDS as readonly string[]).includes(id)
/** Its count: 5, 10, 15, or 20 for the finale. */
export const householdAt = (id: HouseholdId): number => (id === 'finale' ? FINALE_MARRIED : Number(id.split(':')[1]))
/** Its title: "Household scene 1", …, "The Great Harvest". */
export const householdTitle = (id: HouseholdId): string => (id === 'finale' ? 'The Great Harvest' : `Household scene ${HOUSEHOLD_IDS.indexOf(id) + 1}`)

/** Whether a household scene or the finale is reached: the night saw its count (the morning after the
 * wedding that made it), the finale once its morning came. */
export const householdReached = (save: Pick<SaveV4, 'homestead'>, id: HouseholdId): boolean =>
  id === 'finale' ? save.homestead.finale > 0 : save.homestead.married >= householdAt(id)

/** The household's Ready offers: each scene and the finale reached, written in the pack, and not yet played.
 * Never auto-played. */
export function householdReady(save: Pick<SaveV4, 'homestead' | 'diary'>, household: Household | null): HouseholdId[] {
  if (!household) return []
  return HOUSEHOLD_IDS.filter((id) => householdReached(save, id) && !save.diary.read.includes(id)
    && (id === 'finale' || household.scenes.some((s) => `household:${s.at}` === id)))
}

/** The spouses on the farm's roster, in wedding order: who a household scene's `each` plays for. */
export function spousesInOrder(save: Pick<SaveV4, 'love' | 'roster'>): string[] {
  return Object.keys(save.love).filter((id) => save.roster[id] && save.love[id]!.stage === 'spouse')
    .sort((a, b) => (save.love[a]!.wed ?? 0) - (save.love[b]!.wed ?? 0) || Number(a) - Number(b))
}

/** A household scene as it plays: `open`, each spouse's `each` in wedding order (one without hers is skipped,
 * partial), then `close`; the finale's play after its `open`. */
export interface HouseholdPlay {
  id: HouseholdId
  title: string
  /** Each part's steps in order, and whose beat it is (null for `open` and `close`). */
  parts: { who: string | null; steps: Step[] }[]
  /** The finale's play, after its `open`. */
  play: Finale['play'] | null
  spouses: string[]
}
export function householdPlay(save: Pick<SaveV4, 'love' | 'roster'>, household: Household, id: HouseholdId): HouseholdPlay | null {
  const scene = id === 'finale' ? household.finale : household.scenes.find((s) => `household:${s.at}` === id)
  if (!scene) return null
  const spouses = spousesInOrder(save)
  const beats = spouses.flatMap((who) => (scene.each[who] ? [{ who, steps: scene.each[who]! }] : []))
  return {
    id, title: householdTitle(id), spouses, play: id === 'finale' ? household.finale.play : null,
    parts: [{ who: null, steps: scene.open }, ...beats, { who: null, steps: scene.close }],
  }
}

/** A household scene or the finale played or skipped: read once into `diary.read`, paying nothing. Refused
 * before it's reached. */
export function readHousehold(save: SaveV4, id: HouseholdId): SaveV4 {
  if (!householdReached(save, id)) return save
  if (save.diary.read.includes(id)) return save
  return { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
