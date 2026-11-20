import { recordLibrary } from '../library/receipts'
import { availableDishes } from '../expeditions/stock'
import { bookedForExpedition } from '../expeditions/presence'
import { actionCost, canSpendForEvent, GAME_DAYS, spendForEvent, type SpecialDays } from '../farm/actions'
import { dateDayOf, dateOf, festivalOn, turnOnDate } from '../farm/calendar'
import { draw } from '../farm/draw'
import { farmRankOf } from '../farm/farm'
import { aptitudeOf, gatherer, handDay } from '../farm/farmhands'
import { isFoodId } from '../farm/food'
import { countChallenge } from '../farm/rank-rules'
import { round5 } from '../farm/round'
import { talentsD, type TalentOf } from '../farm/talents'
import { cropGradeOf, goodOf, baseGoodId, isBaseFish, isCropId, type CropId } from '../goods/ids'
import { ANIMAL_PRODUCTS } from '../goods/production-catalogue'
import { discoverOutput } from '../goods/discovery'
import { drawStars } from '../goods/stars'
import { tileOf } from '../fields/fields'
import { farmerGatherer, reachLock } from '../gathering/hauls'
import { catchGrade } from '../gathering/fishing-grades'
import { fishSize, pickShare, sharesOn, sizeRecord, HOME_COUNT } from '../gathering/kinds'
import { FISH_SIZES, FOREST } from '../gathering/tables'
import type { FishingSpotId } from '../gathering/ids'
import { recipeOf } from '../kitchen/recipes'
import { heartsOf, homeBuilt, ANIMALS } from '../ranch/ranch'
import { restaurantGrade } from '../restaurant/rules'
import { festivalTogether } from '../romance/acts'
import { castPlan } from '../romance/plays/cast'
import { timingScore } from '../romance/plays/grade'
import type { PerkPack } from '../romance/perk-terms'
import { earnGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { isDishId, type FarmSave } from '../save/v4'
import { addGoods, parseStockKey, stockKey, takeGoods } from '../save/warehouse'
import { worksOn } from '../town/town'
import { CARE_WINDOW, CUP_WINDOW, FLOWER_WINDOW, noteCupWork } from './evidence'
import { activeContest, CONTESTS, contestStaff, festivalBooked, SHOW_CUES, withFestival, type ActiveContest, type AnimalPlay, type ContestCard,
  type CupCategory, type DerbyPlay, type FarmContest, type ShowCue } from './state'

export const FESTIVAL_CONTESTS = {
  'flower-show': { name: 'Flower Show', rivals: ['The orchard', 'The town garden'], base: 36, step: 5, cap: 88, gold: 500 },
  'fishing-derby': { name: 'Fishing Derby', rivals: ['The river team', 'The pond team'], base: 34, step: 5, cap: 82, gold: 700 },
  'animal-show': { name: 'Animal Show', rivals: ['The ranch', 'The smallholding'], base: 42, step: 5, cap: 88, gold: 900 },
  'harvest-cup': { name: 'Harvest Cup', rivals: ['The valley growers', 'The town market'], base: 30, step: 6, cap: 88, gold: 1200 },
} as const
export const FESTIVAL_ACTION_COST = actionCost('festival')
export const DERBY_TURNS = 3
export const DERBY_TURN_MS = 4000
export const ANIMAL_TURNS = 4
export const CUE_WORDS = { stand: 'Hold for inspection.', walk: 'Take a lap by the fence.', brush: 'Smooth the coat.' }

export const festivalResult = (save: Pick<FarmSave, 'workshops'>, id: FarmContest) => save.workshops.festival?.last?.[id]
export function contestDate(id: FarmContest, year: number, days: SpecialDays, clock?: FarmSave['calendar']): number | null {
  const festival = days.festivals.find((festival) => festival.rule === id)
  return festival ? turnOnDate({ year, season: festival.season, day: festival.day }, clock) : null
}

export function contestCutoffs(id: FarmContest, rank: number): [number, number] {
  const rule = FESTIVAL_CONTESTS[id]
  const first = Math.min(rule.cap, rule.base + (rank - 1) * rule.step)
  return [first, first - 10]
}

export function festivalPrize(id: FarmContest, rank: number, year: number, place: 1 | 2 | 3): number {
  const first = round5(FESTIVAL_CONTESTS[id].gold * (1 + .06 * (rank - 1)) * Math.min(2, 1 + .15 * (year - 1)))
  return round5(first * ([1, .5, .2][place - 1]!))
}

export interface ContestContext { days: SpecialDays; story?: PerkPack | null; talentOf?: TalentOf }

export function festivalEntryLock(save: FarmSave, id: FarmContest, days: SpecialDays): string | null {
  const day = save.calendar.day
  const year = dateOf(day, save.calendar).year
  const last = festivalResult(save, id)
  if (festivalOn(day, days.festivals, save.calendar)?.rule !== id) return 'The contest is on its festival day.'
  if (last && dateOf(last.day, save.calendar).year === year || save.farm.festivals.some((r) => r.id === id && dateOf(r.day, save.calendar).year === year)) return 'Already entered this year.'
  if (CONTESTS.some((rule) => festivalResult(save, rule)?.day === day)) return 'Already entered a contest today.'
  if (activeContest(save) || save.workshops.current || save.workshops.restaurant?.shift) return 'A play is under way.'
  if (!canSpendForEvent(save, FESTIVAL_ACTION_COST, days)) return 'Entering takes 3 actions.'
  return null
}

export function festivalHandLock(save: FarmSave, id: string, story: PerkPack | null = null): string | null {
  const hand = handDay(save, id)
  if (!hand) return 'Choose a farmhand.'
  if (bookedForExpedition(save, id)) return 'She’s booked for an expedition.'
  if (!worksOn(save, story, id)) return 'She’s in town today.'
  if (hand.kitchen || save.today.server === id || festivalBooked(save, id)) return 'She’s booked today.'
  return hand.actions > 0 ? null : 'She has no work action left.'
}

const requireOpen = (lock: string | null) => { if (lock) throw new SaveRuleError('bad-job', lock) }
const dayRank = (save: FarmSave) => ({ day: save.calendar.day, rank: farmRankOf(save.farm.points) })

function judge<S extends FarmSave>(save: S, id: FarmContest, entry: Omit<ContestCard, 'place' | 'gold' | 'credit'>,
  present: readonly string[], nominated: readonly string[]): S {
  const year = dateOf(entry.day, save.calendar).year
  const place = entry.score === null ? null : (1 + contestCutoffs(id, entry.rank).filter((score) => score > entry.score!).length) as 1 | 2 | 3
  const gold = place ? festivalPrize(id, entry.rank, year, place) : 0
  const credit = place === 1 ? [...nominated] : []
  const card: ContestCard = { ...entry, place, gold, credit }
  const state = save.workshops.festival
  const { active: _active, ...rest } = state ?? {}
  let next = withFestival(save, { ...rest, last: { ...state?.last, [id]: card } })
  if (!place || entry.score === null) return next
  const key = `festival:${id}`
  next = earnGold({ ...next,
    farm: { ...next.farm, festivals: [...next.farm.festivals, { id, day: entry.day, score: entry.score, place }] },
    diary: { ...next.diary, records: { ...next.diary.records, [key]: Math.max(next.diary.records[key] ?? 0, entry.score) } },
  }, gold)
  const activity = id === 'flower-show' ? 'farming' : id === 'fishing-derby' ? 'fishing' : 'ranch'
  for (const hand of credit) next = countChallenge(next, hand, activity, { kind: 'won', festival: id })
  const shown = id === 'flower-show' || id === 'animal-show' ? [...new Set([...nominated, ...present])] : present
  for (const hand of shown) {
    const role = id === 'flower-show' ? 'grower' : id === 'animal-show' ? (present.includes(hand) ? 'handler' : 'caretaker')
      : id === 'fishing-derby' ? 'caster' : 'presenter'
    const won = credit.includes(hand) ? ':won' : ''
    next = recordLibrary(next, hand, `festival:${id}:${role}:${place}${won}`, { activity: `festival:${id}`, score: entry.score })
  }
  return present.length ? festivalTogether(next, present, id, year).save as S : next
}

export function flowerMarkLock(save: FarmSave, tile: number, crop: CropId, days: SpecialDays): string | null {
  const day = save.calendar.day
  const year = dateOf(day, save.calendar).year
  const show = contestDate('flower-show', year, days, save.calendar)
  if (show === null || day > show || day <= show - FLOWER_WINDOW) return 'Mark a tile in the ten days through the show.'
  const last = festivalResult(save, 'flower-show')
  if (last && dateOf(last.day, save.calendar).year === year) return 'Already entered this year.'
  if (save.workshops.festival?.box) return 'Return the boxed crop first.'
  const at = Number.isInteger(tile) && tile >= 0 ? tileOf(save, tile) : undefined
  if (!isCropId(crop) || !at || at.ground !== 'tilled' || (at.crop !== null && at.crop !== crop)) return 'Choose a tilled tile for this crop.'
  return null
}

export function markFlowerTile<S extends FarmSave>(save: S, tile: number, crop: CropId, days: SpecialDays): S {
  requireOpen(flowerMarkLock(save, tile, crop, days))
  const state = save.workshops.festival
  if (state?.mark?.tile === tile && state.mark.crop === crop) return save
  const day = save.calendar.day
  return withFestival(save, { ...state, mark: { day, year: dateOf(day, save.calendar).year, tile, crop, dates: [] } })
}

export function releaseFlower<S extends FarmSave>(save: S): S {
  const state = save.workshops.festival
  if (!state?.mark && !state?.box) return save
  const { mark: _mark, box, ...rest } = state
  const at = box ? parseStockKey(box.key)! : null
  return withFestival(at ? { ...save, items: addGoods(save.items, at.id, at.stars, 1) } : save, rest)
}

/** Use the resolved year on the night that closes the show, before any workers harvest. */
export function closeFlowerWindow<S extends FarmSave>(save: S, days: SpecialDays): S {
  const state = save.workshops.festival
  const year = state?.box?.year ?? state?.mark?.year
  if (!year) return save
  const show = contestDate('flower-show', year, days, save.calendar)
  return show === null || save.calendar.day >= show ? releaseFlower(save) : save
}

export function flowerPreview(save: FarmSave, key: string | null, grower: string | null, days = GAME_DAYS) {
  const box = key === null ? save.workshops.festival?.box : undefined
  const at = parseStockKey(key ?? box?.key ?? '')
  if (!at || !cropGradeOf(at.id) || (box ? box.year !== dateOf(save.calendar.day, save.calendar).year : !save.items[at.id]?.[at.stars - 1])) return null
  const show = box ? contestDate('flower-show', box.year, days, save.calendar) : null
  const dates = show !== null && box ? box.dates.filter(({ day }) => day > show - FLOWER_WINDOW && day <= show) : []
  const hands = [...new Set(dates.flatMap((date) => date.hands))]
  const parts = [10 * at.stars, 2 * goodOf(at.id)!.grade, 6 * Math.min(5, dates.length)]
  return { ...at, key: stockKey(at.id, at.stars), hands, parts, valid: grower === null || hands.includes(grower), score: sum(parts) }
}

const sum = (values: readonly number[]) => values.reduce((total, n) => total + n, 0)

export function enterFlower<S extends FarmSave>(save: S, key: string | null, grower: string | null, days: SpecialDays): S {
  requireOpen(festivalEntryLock(save, 'flower-show', days))
  const entry = flowerPreview(save, key, grower, days)
  if (!entry?.valid) throw new SaveRuleError('bad-job', 'Choose an available crop and its grower.')
  const spent = spendForEvent(save, FESTIVAL_ACTION_COST, days)
  const items = key === null ? spent.items : takeGoods(spent.items, entry.id, entry.stars, 1)
  const { mark: _mark, box: _box, ...rest } = spent.workshops.festival ?? {}
  // Entering with Warehouse stock releases a different, unused boxed crop.
  const next = key === null ? withFestival({ ...spent, items }, rest) : releaseFlower({ ...spent, items })
  return judge(next, 'flower-show', { ...dayRank(save), score: entry.score, parts: entry.parts, exhibits: [entry.key], staff: [] }, [], grower ? [grower] : [])
}

export function animalPreview(save: FarmSave, id: string) {
  const animal = save.ranch.animals.find((animal) => animal.id === id)
  if (!animal || !homeBuilt(save, ANIMALS[animal.kind].home)) return null
  const trail = (save.workshops.festival?.care?.[id] ?? []).filter(({ day }) => day > save.calendar.day - CARE_WINDOW)
  const caretakers = [...new Set(trail.flatMap(({ by }) => by ? [by] : []))].filter((by) => trail.filter((care) => care.by === by).length >= 2)
  const parts = [3 * heartsOf(animal.fondness), animal.fed ? 10 : 0, 5 * Math.min(4, trail.length)]
  return { animal, caretakers, dates: trail.length, parts }
}

function playSeed(save: FarmSave, id: FarmContest) {
  return Math.floor(draw(save.account.uid, save.calendar.day, `contest:${id}`, 0) * 0x100000000)
}

const seeded = (play: ActiveContest, n: number) => draw(String(play.seed), play.day, play.id, n)

export function enterAnimal<S extends FarmSave>(save: S, animal: string, caretaker: string | null, handler: boolean, context: ContestContext): S {
  requireOpen(festivalEntryLock(save, 'animal-show', context.days))
  const entry = animalPreview(save, animal)
  if (!entry || (caretaker !== null && !entry.caretakers.includes(caretaker)) || (handler && caretaker === null)) throw new SaveRuleError('bad-job', 'Choose an owned animal and a qualified caretaker.')
  if (handler) requireOpen(festivalHandLock(save, caretaker!, context.story))
  const auto = handler ? (aptitudeOf(save.roster[caretaker!]!, 'care', (activity) => (context.talentOf ?? talentsD)(caretaker!, activity)).level >= 6 ? 2 : 1) : 0
  const play: AnimalPlay = {
    id: 'animal-show', ...dayRank(save), seed: playSeed(save, 'animal-show'), animal, kind: entry.animal.kind, caretaker,
    handler: handler ? caretaker : null, auto, hearts: heartsOf(entry.animal.fondness), fed: entry.animal.fed, cared: entry.dates, cues: [], answers: [],
  }
  play.cues = Array.from({ length: ANIMAL_TURNS }, (_, i) => SHOW_CUES[Math.floor(seeded(play, i) * SHOW_CUES.length)]!)
  if (new Set(play.cues).size === 1) play.cues[ANIMAL_TURNS - 1] = SHOW_CUES[(SHOW_CUES.indexOf(play.cues[0]!) + 1) % SHOW_CUES.length]!
  // Her opening cues are performed at entry. This transcript is already committed on reload.
  play.answers = play.cues.slice(0, auto).map(() => true)
  return withFestival(spendForEvent(save, FESTIVAL_ACTION_COST, context.days), { ...save.workshops.festival, active: play })
}

export function answerAnimal<S extends FarmSave>(save: S, slot: number, cue: ShowCue): S {
  const play = activeContest(save)
  if (play?.id !== 'animal-show' || play.day !== save.calendar.day || slot !== play.answers.length || !play.cues[slot] || !SHOW_CUES.includes(cue)) return save
  const next = withFestival(save, { ...save.workshops.festival, active: { ...play, answers: [...play.answers, play.cues[slot] === cue] } })
  return slot + 1 === ANIMAL_TURNS ? settleFestival(next) : next
}

export function enterDerby<S extends FarmSave>(save: S, spot: FishingSpotId, crew: readonly (string | null)[], context: ContestContext): S {
  requireOpen(festivalEntryLock(save, 'fishing-derby', context.days) ?? reachLock(save, 'fishery', spot))
  const hands = crew.filter((id): id is string => id !== null)
  if (crew.length !== DERBY_TURNS || hands.length > 2 || new Set(hands).size !== hands.length) throw new SaveRuleError('bad-job', 'Choose one caster for each of the three turns.')
  const talent = context.talentOf ?? talentsD
  const casters = crew.map((by) => {
    if (by === null) return { by, ...farmerGatherer(save, 'fishery', 1), level: 0, timing: 0 }
    requireOpen(festivalHandLock(save, by, context.story))
    const hand = save.roster[by]!
    const level = aptitudeOf(hand, 'fish', (activity) => talent(by, activity)).level
    const { q, skill } = gatherer(save, by, 'fishery', 'fish', level, hand.wellFed > 0, talent, context.story ?? null, 1)
    return { by, q, skill, level, timing: Math.min(95, 50 + 4 * level + hand.ranks.fishing.rank) }
  }).map(({ by, q, skill, level, timing }) => ({ by, q, skill, level, timing }))
  const play: DerbyPlay = { id: 'fishing-derby', ...dayRank(save), seed: playSeed(save, 'fishing-derby'),
    spot, mode: save.farm.fishingModes?.[spot] ?? 'standard', casters, catches: [] }
  return withFestival(spendForEvent(save, FESTIVAL_ACTION_COST, context.days), { ...save.workshops.festival, active: play })
}

export const derbyMeet = (play: DerbyPlay, slot: number): number => castPlan((n) => seeded(play, 20 + n), 'evening').meets[slot]!

export function castDerby<S extends FarmSave>(save: S, slot: number, elapsed: number | null): S {
  const play = activeContest(save)
  if (play?.id !== 'fishing-derby' || play.day !== save.calendar.day || slot !== play.catches.length) return save
  const caster = play.casters[slot]
  if (!caster || (elapsed !== null && (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > DERBY_TURN_MS))) return save
  const timing = caster.by ? caster.timing : timingScore(elapsed === null ? null : elapsed - derbyMeet(play, slot))
  let next = save
  let caught: DerbyPlay['catches'][number] = null
  if (timing > 0) {
    const species = pickShare(sharesOn('fishery', play.spot, dateDayOf(play.day, save.calendar)), seeded(play, slot * 3))
    const stars = drawStars(caster.q, seeded(play, slot * 3 + 1))
    const u = seeded(play, slot * 3 + 2)
    const cm = fishSize(species, caster.skill, u + (1 - u) * .65 * timing / 100)
    const [min, max] = FISH_SIZES[species]!
    const percentile = Math.max(0, Math.min(1, (cm - min) / (max - min)))
    const grade = catchGrade(next, species, play.mode, caster.level, caster.by === null)
    next = grade.save
    caught = { key: stockKey(grade.id, stars), cm, score: Math.round(40 * percentile + 8 * stars + .20 * timing), slot, by: caster.by }
  }
  next = withFestival(next, { ...next.workshops.festival, active: { ...play, catches: [...play.catches, caught] } })
  return slot + 1 === DERBY_TURNS ? settleFestival(next) : next
}

function practised<S extends FarmSave>(save: S, id: string, key: 'fish' | 'care'): S {
  const uma = save.roster[id]!
  return { ...save, roster: { ...save.roster, [id]: { ...uma, practice: { ...uma.practice, [key]: (uma.practice?.[key] ?? 0) + 1 } } } }
}

export function settleFestival<S extends FarmSave>(save: S): S {
  const play = activeContest(save)
  if (!play) return save
  const staff = contestStaff(play)
  const { day, rank } = play
  if (play.id === 'animal-show') {
    const correct = play.answers.filter(Boolean).length
    const parts = [3 * play.hearts, play.fed ? 10 : 0, 5 * Math.min(4, play.cared), 10 * correct]
    const next = correct && play.handler ? practised(save, play.handler, 'care') : save
    return judge(next, play.id, { day, rank, score: correct ? sum(parts) : null, parts, exhibits: [], animal: { id: play.animal, kind: play.kind }, staff },
      correct ? staff : [], play.caretaker ? [play.caretaker] : [])
  }
  const catches = play.catches.flatMap((fish) => fish ?? [])
  let next = save
  for (const fish of catches) {
    const { id, stars } = parseStockKey(fish.key)!
    const record = sizeRecord(baseGoodId(id))
    const count = HOME_COUNT.fishery
    const found = discoverOutput(next, id)
    next = { ...found, items: addGoods(found.items, id, stars, 1),
      diary: { ...found.diary, records: { ...found.diary.records, [record]: Math.max(fish.cm, found.diary.records[record] ?? 0) } },
      farm: { ...found.farm, counts: { ...found.farm.counts, [count]: (found.farm.counts[count] ?? 0) + 1 } },
    }
    if (fish.by) next = noteCupWork(countChallenge(next, fish.by, 'fishing', { kind: 'catch', spot: play.spot, fish: 1 }), fish.by, 'fish')
  }
  const present = play.casters.slice(0, play.catches.length).flatMap(({ by }) => by ? [by] : [])
  for (const id of present) next = practised(next, id, 'fish')
  const parts = Array.from({ length: DERBY_TURNS }, (_, i) => play.catches[i]?.score ?? 0)
  const best = [...parts].sort((a, b) => b - a).slice(0, 2)
  return judge(next, play.id, { day, rank, score: catches.length ? Math.round(sum(best) / 2) : null, parts, exhibits: [], catches, staff },
    present, catches.flatMap(({ by }) => by ? [by] : []))
}

const ranchProducts = new Set<string>(Object.values(ANIMAL_PRODUCTS))
const wildGoods = new Set(Object.values(FOREST).flatMap((area) => Object.values(area.seasons).flatMap((shares) => shares.map(([id]) => id))))
export function cupCategory(id: string): CupCategory | null {
  if (isDishId(id)) return 'kitchen'
  const good = goodOf(id)
  if (!good) return null
  if (good.refined) return isFoodId(id) ? 'workshop' : null
  const base = baseGoodId(id)
  if (ranchProducts.has(base)) return 'ranch'
  if (isBaseFish(base)) return 'fish'
  if (cropGradeOf(id)) return 'field'
  return isFoodId(id) && wildGoods.has(base) ? 'wild' : null
}

export function cupWorkDay(save: FarmSave, by: string, category: CupCategory): number | null {
  const day = save.calendar.day
  const at = save.workshops.festival?.worked?.[by]?.[category]
  return at !== undefined && at < day && at >= day - CUP_WINDOW ? at : null
}

export function festivalStock(save: FarmSave, key: string): number {
  const at = parseStockKey(key)
  return at ? isDishId(at.id) ? availableDishes(save, key) : save.items[at.id]?.[at.stars - 1] ?? 0 : 0
}

export interface CupEntry { key: string; by: string | null }
export function cupPreview(save: FarmSave, entries: readonly CupEntry[], story: PerkPack | null = null) {
  const kinds = new Set<CupCategory>()
  const staff = new Set<string>()
  const parts: number[] = []
  let block = entries.length === 3 ? null : 'Choose three exhibits.'
  for (const { key, by } of entries) {
    const at = parseStockKey(key)
    const category = at && cupCategory(at.id)
    if (!at || !category || !festivalStock(save, key)) { block ??= 'Choose an available exhibit.'; continue }
    if (kinds.has(category)) block ??= 'Choose three different categories.'
    kinds.add(category)
    const grade = goodOf(at.id)?.grade ?? (restaurantGrade(at.id) || recipeOf(at.id)!.grade)
    parts.push(4 * at.stars + grade)
    if (by === null) continue
    if (staff.has(by)) block ??= 'One category per presenter.'
    else if (cupWorkDay(save, by, category) === null) block ??= 'She hasn’t worked this category recently.'
    else block ??= festivalHandLock(save, by, story)
    staff.add(by)
  }
  parts.push(staff.size * 3)
  return { parts, score: sum(parts), staff: [...staff], block }
}

export function enterCup<S extends FarmSave>(save: S, entries: readonly CupEntry[], context: ContestContext): S {
  requireOpen(festivalEntryLock(save, 'harvest-cup', context.days))
  const preview = cupPreview(save, entries, context.story)
  requireOpen(preview.block)
  let next = spendForEvent(save, FESTIVAL_ACTION_COST, context.days)
  for (const { key } of entries) {
    const at = parseStockKey(key)!
    next = { ...next, items: takeGoods(next.items, at.id, at.stars, 1) }
  }
  return judge(next, 'harvest-cup', { ...dayRank(save), score: preview.score, parts: preview.parts,
    exhibits: entries.map(({ key }) => key), presenters: entries.map(({ by }) => by), staff: preview.staff }, preview.staff, [])
}
