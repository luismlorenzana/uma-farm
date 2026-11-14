// The manual's live tables: every list in the game's docs is rendered here from the rules, so it can't drift from the
// game. A doc marks a block with `<!-- live:<key> -->` … `<!-- /live -->`; `pnpm docs:update` rewrites them, and
// `docs.test.ts` fails when one is stale. Pure: no I/O (the test reads and writes the files). Headings a block prints
// are `#####`, so a block never breaks the outline of the section it sits in. Adapted from uma-rpg's own `render.ts`.
import { FARM_RANK_POINTS } from '../farm/farm'
import { ACTIVITIES, ACTIVITY_NAMES, RANK_POINTS, RANKS, type Rank } from '../farm/ranks'
import { CROP_IDS, FAMILY_NAMES, GOOD_FAMILIES, GOODS, goodOf, refinedOf, type GoodFamily } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { inDemand, priceOf, STARS, starFactor, starPrice } from '../goods/prices'
import { DEMAND, FAMILY_FACTOR, LADDER, REFINED_FACTOR, type LadderFamily } from '../goods/rule'
import { DAYS_PER_SEASON, farmDay, FESTIVALS, SEASON_NAMES, SEASONS } from '../farm/calendar'
import { BUILD_PLACES, FARM_PLACES, MAP_PLACES, TOWN_FIRST_ROW, type FarmPlace, type PlaceOpens } from '../farm/places'
import { BOARD_MET, buildCostWords, buildGoodsWords } from '../farm/builds'
import { NIGHT_STEPS } from '../night/end-day'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { CLEAR_FINDS, cropLevelStart, GROUND_NAMES, harvestQuality, MAX_CROP_LEVEL, seedsBackChance, stagesOf } from '../fields/fields'
import { ACTIONS, BIRTHDAY_ACTIONS, DAY_ACTIONS, FESTIVAL_ACTIONS, NEW_YEAR_ACTIONS } from '../farm/actions'
import { CHOP_LOGS, FORAGE_HAUL, reachOf } from '../gathering/hauls'
import { LOAD_SIZE } from '../gathering/stations'
import {
  ACTIVITY_STAT, EXPEDITION_CUTOFFS, STAT_CUTOFFS, STAT_TEMPERAMENT, TALENT_D, TALENT_GRADES, TEMPERAMENTS, TALENT_RANK_POINTS, TALENT_STATS, TALENT_YIELD, talentAffection,
  talentGrowth, talentPower, talentQuality, type TalentStep,
} from '../farm/talents'
import {
  CHALLENGES, daysToRank, PLACE_ACTIVITY, RANK_BENEFITS, rankPointsForDay,
} from '../farm/rank-rules'
import { AREA_NAMES, FISHING_SPOTS, FOREST_AREAS, SPOT_NAMES, STATION_JOB_IDS, STATION_JOBS, stationJobOf, STATIONS, type FishingSpotId, type ForestAreaId, type StationId } from '../gathering/ids'
import { gatherQuality, sizeSkill, type WorkTerms } from '../gathering/kinds'
import { FISH_SIZES, FISHERY, FOREST, STATION_JOB_RULES } from '../gathering/tables'
import { farmPlace } from '../farm/places'
import { starShares } from '../goods/stars'
import { FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, OVERGROWTH_SHARES, pairKey, START_CLEAR } from '../save/v4'
import { DORM_LEVELS } from '../farm/dorm'
import { farmRankOpens } from '../farm/diary'
import { DIARY_ROWS, ENTRY_POINTS, GOLD_PER_POINT, MILESTONE_POINTS, MILESTONES, ROW_GOLD, type Milestone } from '../farm/milestones'
import { CAST, CAST_IDS } from '../story/cast'
import { MEET_KINDS } from '../romance/meeting'
import { ARRIVAL_POINTS, CHOICE_BEST, CHOICE_OTHER, costOf, LADDER_COLOURS, ROUTE_POINTS, rungName, SPOUSE_COST } from '../romance/love'
import { DISLIKED_LINE, GIFT_POINTS_V4, giftStars, LOVE_POINTS } from '../romance/acts'
import { farmBirthday } from '../romance/days'
import { READY_CONDITIONS, WAIT_ORDER } from '../romance/ready'
import { chapterTitle, GATE_RULES, gateWords, herChapters } from '../romance/chapters'
import { linePlace, MORNING_GOOD, NIGHT_CHORE, PERK_LINES, PERK_PLACE, PERKS, perkWords, type PerkId, type PerkLine } from '../romance/perks'
import {
  CREW_CAP, DREAM_BONUS, HOUSEHOLD, householdBonus, IN_ELEMENT, KEEPSAKE_GROWN, KEEPSAKE_QUALITY, LINE_BONUS, MAX_CHORES, MORNING_ITEMS, OWN_CAP, ROMANCE_CAP,
} from '../romance/perk-terms'
import { BREAKFAST_DAYS, CHORE_LINES, dishId, LINE_DISH, MENTOR_POINTS } from '../romance/perk-effects'
import { loveRankFactor } from '../farm/rank-rules'
import { dateOf } from '../farm/calendar'
import { FARMER_NAME_MAX } from '../romance/farmer'
import { storyPackFrom } from '../story/pack'
import { favouriteOf, PLACEHOLDER_SPOTS, PLACEHOLDER_TOWN_LINES } from '../story/placeholders'
import { FAVOURITE_SPOT, SPOT_ROOM } from '../town/town'
import { SPOT_IDS } from '../story/authored'
import { BOND_HEARTS, BOND_POINTS, bondHearts, CLOSEST_BOND, SHARED_LINE, SIDE_BY_SIDE, SIDE_BY_SIDE_HEARTS, TIE_SEEDS } from '../farm/bonds'
import { STAND_IN_FILES } from '../story/stand-in'
import { CAST_COUNT, CAST_MEET } from '../romance/plays/cast'
import { CHOOSE_MS, CHOOSE_SCORES } from '../romance/plays/choose'
import { EVENING_GRADE_POINTS, EVENT_GRADE_POINTS, GRADE_NAMES, GRADES, GREAT_AT, PERFECT_AT, PLAY_NAMES, TIMING_WINDOWS, timingScore, type Grade } from '../romance/plays/grade'
import { PICK_CELLS, PICK_POPS, PICK_ROUNDS, PICK_STARS, PICK_TIMES, PICK_WRONG } from '../romance/plays/pick'
import { RHYTHM_BEATS, RHYTHM_EXTRA, RHYTHM_LEAD, RHYTHM_MARK_WORDS, RHYTHM_PERIOD, RHYTHM_ROUNDS } from '../romance/plays/rhythm'
import { WALK_FORK_MS, WALK_FORKS } from '../romance/plays/walk'
import { PLAY_MAP, playOf, togetherPlay, type PlayAs } from '../romance/plays/which'
import { ART_NAMES, EXPRESSIONS, fallbackChain, MOMENT_OUTFITS, PERSONAL_OUTFITS, SHORE_PLACES, STORY_OUTFITS, type StoryOutfit } from '../story/look'
import { EVENT_POINTS } from '../romance/events'
import { DATE_FROM, EVENING_FACTOR, eveningPoints, EVENINGS, favouriteKind, HANGOUT_FROM, INVITE_POINTS, INVITE_WEIGHT_DAYS, ROLE_WORDS, type EveningWait } from '../romance/evening'
import { invitesFor, SECOND_EVENING_EVERY, TWO_EVENINGS_MARRIED } from '../save/v4'
import { BENCH_WORDS, benchTakes, forgeRecipe, MAKE_BONUS, RING_INPUTS, ringPercent } from '../romance/bench'
import { CAKE_DAYS, HOUSEHOLD_AT, receptionDays, WEDDING_FRIENDS } from '../romance/wedding'
import { EXTENSION_COSTS, FURNITURE, HOMESTEAD_PLACES, HOMESTEAD_ROW_MARRIED, HOUSE_COSTS, MISSES_NIGHTS } from '../romance/homestead'
import { HOUSE_ITEM_N, HOUSE_POINTS, HOUSE_TEMPLATES, VOWS_POINTS } from '../romance/household'
import { EXTENDED_ROOMS, FINALE_MARRIED, HOUSE_ROOMS } from '../save/v4'
import { BENCH_SCENE_LINES, type Beat } from '../story/bench'
import { DISH_WORDS, dishName, goodName, RING_GOODS } from '../goods/ids'
import { BIG_EVENTS, EVENT_LIMITS, RUNGS, type Route, type Step, type Together, type UmaBible } from '../story/authored'
import { ordinal, PLACEHOLDER_MOMENTS, PLACEHOLDER_OPENING, PLACEHOLDER_TABLE, tieKind, tieStrength, WEDDING_DEFAULTS, welcomeOf } from '../story/placeholders'

type Cell = string | number
/** A Markdown table; pipes in cells are escaped. */
function table(head: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const cell = (v: Cell) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n')
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function farmRanks(): string {
  return table(['Farm Rank', ...FARM_RANK_POINTS.map((_, i) => String(i + 1))], [['Points', ...FARM_RANK_POINTS.map((p) => p.toLocaleString('en-US'))]])
}

// --- The calendar, the night and the farm map -----------------------------------------------------------------

/** The seasons of year 1 and their festivals. */
function calendar(): string {
  return table(['Season', 'Days (year 1)', 'Festival'], SEASONS.map((season, i) => [
    SEASON_NAMES[season], `${i * DAYS_PER_SEASON + 1}–${(i + 1) * DAYS_PER_SEASON}`,
    FESTIVALS.filter((f) => f.season === season).map((f) => `${f.name}, ${SEASON_NAMES[season]} ${f.day} (day ${farmDay({ year: 1, season, day: f.day })})`).join('; '),
  ]))
}
/** The night's steps, their functions and what each does. */
function night(): string {
  return table(['Step', 'Function', 'What happens'], NIGHT_STEPS.map((s) => [s.step, `\`${s.name}\``, s.what]))
}
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const opensWords = (opens: PlaceOpens): string => {
  switch (opens.by) {
    case 'start': return 'Day 1'
    case 'farm-rank': return `Farm Rank ${opens.rank}`
    case 'build': return `Farm Rank ${opens.rank}, then built${opens.after ? ` after the ${FARM_PLACES.find((p) => p.id === opens.after)!.name}` : ''}${opens.game ? '' : ' (not built yet)'}`
    case 'met': return `${opens.umas} Umas met`
    case 'house': return `The ${ORDINAL[opens.n] ?? `${opens.n}th`} wedding`
    case 'later': return 'Not built yet'
  }
}
/** Each place's building and what opens it. */
function farmMap(): string {
  const at = (p: FarmPlace) => (p.on ? `At the ${FARM_PLACES.find((q) => q.id === p.on)!.name}` : `\`${p.frame}\`${p.borrowed ? ' (borrowed)' : ''}`)
  return table(['Place', 'Building (uma-art)', 'Opens'], FARM_PLACES.map((p) => [p.name, at(p), opensWords(p.opens)]))
}

/** The design's actions: where, what, the cost, and whether it's charged yet. */
function actionsBlock(): string {
  return table(['Where', 'Action', 'Cost', 'Charged'], ACTIONS.map((a) => [a.where, a.what, a.cost === 0 ? 'Free' : a.cost, a.from === null ? 'Now' : `With ${a.from}`]))
}

/** The day's budget and the special days' event actions. */
function dayBudgetBlock(): string {
  return table(['', 'Actions'], [
    ['Every day', `${DAY_ACTIONS}`],
    ['New Year’s (each year’s Spring 1)', `+${NEW_YEAR_ACTIONS} for events`],
    ['A festival day', `+${FESTIVAL_ACTIONS} for events`],
    ['Each birthday of an Uma you’ve met', `+${BIRTHDAY_ACTIONS} for events`],
  ])
}
/** Every place you build: the Farm Rank that offers it, its gold and goods, and whether its game is built. */
function buildsBlock(): string {
  return table(['Place', 'Farm Rank', 'Gold', 'Goods', 'Can be bought'], [...BUILD_PLACES].sort((x, y) => x.opens.rank - y.opens.rank).map((p) => [
    p.name, p.opens.rank, g(p.opens.cost.gold), p.opens.cost.goods.map((x) => buildGoodsWords(x)).join(', '),
    p.opens.game ? (p.opens.after ? `Yes, after the ${FARM_PLACES.find((q) => q.id === p.opens.after)!.name}` : 'Yes') : 'Not built yet',
  ]))
}
/** The milestones with the Umas, and what each opens. */
function umaMilestonesBlock(): string {
  return table(['Milestone', 'Opens', 'Read from'], [
    ['The first Romance 8 anyone plays', 'The ring bench at the Forge (the night after)', '`memories`, then `buildings.forge = 0`'],
    ...HOUSE_COSTS.map((cost, i) => [`The ${ORDINAL[i + 1]} wedding`, `House ${i + 1} to build (${g(cost)}), the house before it standing`, 'Spouses in `love`']),
    ...HOMESTEAD_ROW_MARRIED.slice(1).map((n, i) => [`${n} married`, `The homestead's ${ORDINAL[i + 2]} row on the map`, 'Spouses in `love`']),
    [`${BOARD_MET} Umas met`, 'The Requests board’s place (its game comes later)', 'Umas on the roster'],
  ])
}

// --- Goods and prices -----------------------------------------------------------------------------------------

/** Where each family comes from. */
const FAMILY_FROM: Readonly<Record<GoodFamily, string>> = {
  grains: 'The Fields', vegetables: 'The Fields', 'herbs-spices': 'The forest, some crops', 'nuts-seeds': 'The forest (Autumn), two crops',
  sweets: 'The forest (Spring), Sugar Beet', fruits: 'The forest (Summer)', mushrooms: 'The forest', woods: 'The forest', ores: 'The Mine',
  stones: 'The Quarry', crystals: 'The Quarry', fish: 'The Fishery', 'hides-scales': 'Expeditions', 'bones-horns': 'Expeditions', essences: 'Expeditions',
  rings: 'The ring bench',
}
const g = (gold: number): string => `${gold.toLocaleString('en-US')}g`
/** A day of each season, year 1, for the demand columns. */
const SEASON_DAY = Object.fromEntries(SEASONS.map((season) => [season, farmDay({ year: 1, season, day: 1 })])) as Record<(typeof SEASONS)[number], number>

/** The ladder, and each family's factor and where it comes from. */
function priceLadder(): string {
  return `${table(['Grade', ...LADDER.map((_, i) => `G${i + 1}`)], [['The ladder', ...LADDER.map(g)]])}

${table(['Family', 'Factor', 'Where from', 'Raw G1 → G10, ★1', 'Refined'], GOOD_FAMILIES.map((family) => {
    const factor = family in FAMILY_FACTOR ? `×${FAMILY_FACTOR[family as LadderFamily].toFixed(1)}` : 'Each crop its own'
    const raw = GOODS.filter((good) => good.family === family && !good.refined).map((good) => good.price)
    const refined = GOODS.some((good) => good.family === family && good.refined) ? `×${REFINED_FACTOR}` : '—'
    return [FAMILY_NAMES[family], factor, FAMILY_FROM[family], raw.join(' · '), refined]
  }))}`
}

/** Every family's goods, G1 → G10: raw and refined, each at ★1 and ★5, out of demand (in demand, ×1.2 then rounded to
 * 5g). Crops are marked. */
function goodsPrices(): string {
  const name = (id: string) => `${itemNameOf(id)}${goodOf(id)!.crop ? ' (crop)' : ''}`
  return GOOD_FAMILIES.map((family) => {
    const raws = GOODS.filter((good) => good.family === family && !good.refined)
    const hasRefined = raws.some((good) => refinedOf(good.id) !== null)
    const head = hasRefined ? ['Grade', 'Raw', '★1', '★5', 'Refined', '★1', '★5'] : ['Grade', 'Raw', '★1', '★5']
    const rows = raws.map((good) => {
      const raw = [`G${good.grade}`, name(good.id), g(starPrice(good.id, 1)), g(starPrice(good.id, 5))]
      const into = refinedOf(good.id)
      if (!hasRefined) return raw
      return into ? [...raw, itemNameOf(into), g(starPrice(into, 1)), g(starPrice(into, 5))] : [...raw, '—', '—', '—']
    })
    return `##### ${FAMILY_NAMES[family]}\n\n${table(head, rows)}`
  }).join('\n\n')
}

/** The crops' own prices, their refined forms and the season their family is in demand. */
function cropPrices(): string {
  const demanded = (id: string) => SEASONS.filter((season) => inDemand(id, SEASON_DAY[season])).map((season) => SEASON_NAMES[season]).join(', ') || '—'
  return table(['Crop', 'Id', 'Family', 'Price ★1', 'Refined', 'Its price ★1', 'In demand'], CROP_IDS.map((crop) => {
    const good = goodOf(crop)!
    const into = refinedOf(crop)
    return [itemNameOf(crop), `\`${crop}\``, FAMILY_NAMES[good.family], g(good.price), into ? itemNameOf(into) : '—', into ? g(goodOf(into)!.price) : '—', demanded(crop)]
  }))
}

/** Each season's demand, and how many of the catalogue's goods it lifts. */
function demand(): string {
  return table(['Season', 'In demand (+20%)', 'Goods lifted'], SEASONS.map((season) => {
    const lifted = GOODS.filter((good) => inDemand(good.id, SEASON_DAY[season])).length
    const rules = DEMAND[season].map((rule) => `${rule.name}${rule.refined ? ' (the refined row)' : ''}`).join(', ')
    return [SEASON_NAMES[season], rules, `${lifted} of ${GOODS.length}`]
  }))
}

/** The stars' factors, worked on three goods. */
function starPrices(): string {
  const summer = SEASON_DAY.summer
  return table(['Stars', 'Factor', 'Silver Ingot', 'Salmon, Summer (in demand)', 'Carrot, Summer'], STARS.map((stars) => [
    `★${stars}`, `×${starFactor(stars)}`, g(priceOf('silver-ingot', stars, summer)), g(priceOf('salmon', stars, summer)), g(priceOf('carrot', stars, summer)),
  ]))
}

// --- The Fields -----------------------------------------------------------------------------------------------

const STATION_NAME = { mill: 'Mill', sawmill: 'Sawmill' } as const
const seasonsOf = (seasons: readonly (typeof SEASONS)[number][]) => seasons.map((season) => SEASON_NAMES[season]).join(', ')
const tierWords = (tier: number | 'rare') => (tier === 'rare' ? 'Rare' : `Farm Rank ${tier}`)
const per = (n: number) => Number(n.toFixed(4)).toString()
const pct = (n: number) => `${Math.round(n * 100)}%`

/** Every crop, its seasons, its shop tier and seed price, its stages (the watered nights to ripe), its yield, regrowth,
 * price ★1 and its station. */
function crops(): string {
  return table(['Crop', 'Id', 'Seasons', 'Shop', 'Seed', 'Stages', 'Yield', 'Regrows', 'Price ★1', 'Refined at'],
    Object.values(CROPS).map((c) => {
      const into = refinedOf(c.id)
      return [itemNameOf(c.id), `\`${c.id}\``, seasonsOf(c.seasons), tierWords(c.tier), c.seed === null ? '—' : g(c.seed), stagesOf(c.id, false), c.yield,
        c.regrows === null ? '—' : `every ${stagesOf(c.id, true)}`, g(goodOf(c.id)!.price), into && c.station ? `${itemNameOf(into)} (${STATION_NAME[c.station]})` : '—']
    }))
}

/** The shop's seeds by season and tier, with their prices. */
function shopSeeds(): string {
  const tiers = [1, 2, 4] as const
  return table(['Season', ...tiers.map((t) => `Farm Rank ${t}`)], SEASONS.map((season) => [SEASON_NAMES[season],
    ...tiers.map((t) => SHOP_SEEDS[season].filter((id) => CROPS[id].tier === t).map((id) => `${itemNameOf(id)} ${g(CROPS[id].seed!)}`).join(', '))]))
}

/** The field on day 1: its grid, the cleared patch, what the rest is overgrown with, and what clearing leaves. */
function fieldBlock(): string {
  return table(['', 'The field'], [
    ['Tiles', `${FIELD_TILES}: ${FIELD_COLUMNS} across, ${FIELD_ROWS} down`],
    ['Cleared on day 1', `${START_CLEAR.length}, three by three at the top left`],
    ...OVERGROWTH_SHARES.map(([ground, share]) => [`${GROUND_NAMES[ground]}`, `${share}% of the rest${CLEAR_FINDS[ground] ? `; clearing leaves a ${itemNameOf(CLEAR_FINDS[ground])} ★1` : '; clearing leaves nothing'}`]),
  ])
}

/** A harvest's stars by the crop's level, and the chance of an own seed back (a Basic Hoe). */
function harvestStars(): string {
  const stars = (q: number) => starShares(q).flatMap((share, i) => (share > 0 ? [`★${i + 1} ${pct(share)}`] : [])).join(', ')
  return table(['Crop level', 'Quality', 'Stars', 'Seed back'], [1, 2, 4, 6, 8, 10].map((level) => [level, `+${per(harvestQuality(null, level))}`, stars(harvestQuality(null, level)), pct(seedsBackChance(null))]))
}

/** Crop levels, the points each starts at, and what it adds. */
function cropLevels(): string {
  const levels = Array.from({ length: MAX_CROP_LEVEL }, (_, i) => i + 1)
  return table(['Level', ...levels.map(String)], [
    ['Points', ...levels.map((l) => cropLevelStart(l).toLocaleString('en-US'))],
    ['Quality', ...levels.map((l) => `+${per(0.1 * (l - 1))}`)],
  ])
}

/** Farming's challenges, toward each rank (`CHALLENGES.farming`). */
function farmingChallenges(): string {
  return table(['Toward', 'Challenge', 'Counted'], CHALLENGES.farming.map((c) => [RANKS[c.rank], c.what, cap(c.by)]))
}

// --- Talents and ranks ----------------------------------------------------------------------------------------

const STAT_NAME = { speed: 'Speed', stamina: 'Stamina', power: 'Power', guts: 'Guts', wit: 'Wit' } as const
const signed = (n: number) => (n > 0 ? `+${per(n)}` : n < 0 ? `−${per(-n)}` : '0')
const times = (n: number) => `×${n.toFixed(2)}`
const STEPS = TALENT_GRADES.map((_, i) => i as TalentStep)

/** The stat each activity reads, and the temperament her top stat gives. */
function talentStats(): string {
  const rows = TALENT_STATS.map((stat) => [STAT_NAME[stat], ACTIVITIES.filter((a) => a !== 'expeditions' && ACTIVITY_STAT[a] === stat).map((a) => ACTIVITY_NAMES[a]).join(', '),
    cap(STAT_TEMPERAMENT[stat])])
  return table(['Stat', 'Activities', 'Temperament (her top stat)'], [...rows, ['All five: the mean of her three best scores', ACTIVITY_NAMES.expeditions, '—']])
}

/** The cut-offs, the same for everyone. */
function talentCutoffs(): string {
  const grades = [...TALENT_GRADES].reverse()
  const row = (cuts: readonly number[]) => grades.map((_, i) => (i === grades.length - 1 ? `< ${cuts[0]}` : `≥ ${cuts[cuts.length - 1 - i]}`))
  return table(['Grade', ...grades], [['A stat’s score', ...row(STAT_CUTOFFS)], ['Expeditions (mean of best three)', ...row(EXPEDITION_CUTOFFS)]])
}

/** What a talent gives. */
function talentGives(): string {
  return table(['Talent', ...STEPS.map((s) => TALENT_GRADES[s])], [
    ['Step', ...STEPS.map(String)],
    ['Yield (gathering, stations)', ...STEPS.map((s) => times(TALENT_YIELD[s]!))],
    ['Quality points', ...STEPS.map((s) => signed(talentQuality(s)))],
    ['Rank points', ...STEPS.map((s) => `×${per(TALENT_RANK_POINTS[s]!)}`)],
    ['Tended growth', ...STEPS.map((s) => (talentGrowth(s) > 0 ? `+${per(talentGrowth(s))}` : '—'))],
    ['Affection a day (ranch)', ...STEPS.map((s) => `+${talentAffection(s)}`)],
    ['Expedition power', ...STEPS.map((s) => `+${talentPower(s)}`)],
  ])
}

/** Each rank's points, and the days of work to reach it by talent (in her favourite line in brackets). */
function rankPoints(): string {
  const talents: readonly TalentStep[] = [0, 3, 4, 6, 7]
  const day = (talent: TalentStep, favourite: boolean) => rankPointsForDay({ talent, favourite, wellFed: false, heartsFactor: 1 })
  return table(['Rank', 'Points', ...talents.map((t) => TALENT_GRADES[t])], RANKS.map((name, r) => [name, RANK_POINTS[r]!.toLocaleString('en-US'),
    ...talents.map((t) => (r === 0 ? '—' : `${daysToRank(r as Rank, day(t, false))} (${daysToRank(r as Rank, day(t, true))})`))]))
}

/** Every activity's five challenges, and what counts them. */
function challenges(): string {
  const counted = (a: (typeof ACTIVITIES)[number]) => cap([...new Set(CHALLENGES[a].map((c) => c.by))].join('; '))
  return table(['Activity', ...RANKS.slice(1), 'Counted by'], ACTIVITIES.map((a) => [ACTIVITY_NAMES[a], ...CHALLENGES[a].map((c) => c.what), counted(a)]))
}

/** What each rank gives. */
function rankGives(): string {
  return table(['Rank', 'Yield', 'Tended growth', 'Quality', 'Deepest: Mine and Quarry · forest · Fishery', 'Expedition power', 'Seeds back', 'Affection a day', 'Workshop yield'],
    RANK_BENEFITS.map((b, r) => [RANKS[r]!, `×${per(b.yield)}`, per(b.tendedGrowth), `+${per(b.quality)}`,
      `Floor ${b.deepest.floor} · ${cap(AREA_NAMES[b.deepest.forest])} · ${cap(SPOT_NAMES[b.deepest.fishery])}`, b.expeditionPower, pct(b.seedsBack), `+${b.affection}`, `×${per(b.workshopYield)}`]))
}

/** The activity a day at each place pays. */
function placeActivity(): string {
  const places = Object.entries(PLACE_ACTIVITY).map(([place, activity]) => [farmPlace(place)?.name ?? place, ACTIVITY_NAMES[activity]])
  return table(['Where she worked', 'Pays rank points in'], [['The Fields, tending a block with a growing plot', ACTIVITY_NAMES.farming], ...places])
}

// --- The forest, the Fishery and the stations ---------------------------------------------------------------------

const SEASON_COLS = SEASONS.map((s) => SEASON_NAMES[s])
const shareCell = (shares: readonly (readonly [string, number])[]) => shares.map(([id, p]) => `${itemNameOf(id)} ${p}%`).join(', ')

/** The six areas, the Farm Rank that opens each for the farmer (and the rank an Uma needs), its grades, and each
 * season's goods with their shares. */
function forestAreas(): string {
  return table(['Area', 'Id', 'Opens at', 'An Uma at', 'Grades', ...SEASON_COLS], FOREST_AREAS.map((id) => {
    const area = FOREST[id]
    return [cap(AREA_NAMES[id]), `\`${id}\``, `Farm Rank ${reachOf('forest', id)}`, RANKS[area.opens]!, `G${area.grades.join('–G')}`, ...SEASONS.map((s) => shareCell(area.seasons[s]))]
  }))
}

/** The seven spots, the Farm Rank that opens each for the farmer (the sea's with its place built), and each season's
 * fish with their shares. */
function fishingSpots(): string {
  return table(['Spot', 'Id', 'Opens at', 'An Uma at', ...SEASON_COLS], FISHING_SPOTS.map((id) => {
    const spot = FISHERY[id]
    const needs = spot.needs ? [`the ${spot.needs === 'dock' ? 'Dock' : 'Boat'} built`] : []
    return [cap(SPOT_NAMES[id]), `\`${id}\``, [`Farm Rank ${reachOf('fishery', id)}`, ...needs].join(' + '), RANKS[spot.opens]!, ...SEASONS.map((s) => shareCell(spot.seasons[s]))]
  }))
}

/** What one of the farmer's actions at the woods' edge or the water brings. */
function farmerHauls(): string {
  const terms: WorkTerms = { rank: 0, talent: TALENT_D, tool: 1, wellFed: 0 }
  const stars = starShares(gatherQuality(terms, false)).flatMap((s, i) => (s > 0 ? [`★${i + 1} ${pct(s)}`] : [])).join(', ')
  return table(['Action', 'Brings', 'Stars, with the Basic Axe or Rod', 'Counted'], [
    ['Forage an area', `${FORAGE_HAUL} of its season’s finds, each by its share`, stars, '`home:forest`'],
    ['Chop at an area', `${CHOP_LOGS} logs of its season’s woods, each by its share`, stars, '`logs-chopped` and `home:forest`'],
    ['Fish a spot', `One fish of its season’s, by its share, measured as it lands (k = ${per(sizeSkill(terms))})`, stars, '`home:fishery`'],
  ])
}

/** Each fish's size range, its price and its fillet. */
function fishSizes(): string {
  return table(['Fish', 'Id', 'Size', 'Price ★1', 'At the Smokehouse', 'Price ★1'], Object.entries(FISH_SIZES).map(([id, [min, max]]) => {
    const fillet = refinedOf(id)!
    return [itemNameOf(id), `\`${id}\``, `${min}–${max} cm`, g(starPrice(id, 1)), itemNameOf(fillet), g(starPrice(fillet, 1))]
  }))
}

/** The three stations: what builds each, what opens it, its jobs, and a load. */
function stations(): string {
  const build = (s: StationId) => BUILD_PLACES.find((p) => p.id === s)!
  return table(['Station', 'Builds for', 'Opens', 'Jobs', 'A load'], STATIONS.map((s) => {
    const jobs = STATION_JOB_IDS.filter((j) => STATION_JOBS[j].station === s)
      .map((j) => `${STATION_JOB_RULES[j].name}: ${STATION_JOBS[j].families.map((f) => FAMILY_NAMES[f].toLowerCase()).join(', ')}`)
    return [farmPlace(s)!.name, buildCostWords(build(s)), `Farm Rank ${build(s).opens.rank}`, jobs.join(' · '), `1 to ${LOAD_SIZE}, ready the next morning`]
  }))
}

/** Every station job's input → output, with both prices ★1. */
function stationRecipes(): string {
  return STATION_JOB_IDS.map((job) => {
    const rows = GOODS.filter((good) => good.refined && stationJobOf(good.id) === job)
      .map((good) => [`G${good.grade}`, itemNameOf(good.input!), g(starPrice(good.input!, 1)), itemNameOf(good.id), g(starPrice(good.id, 1))])
    return `##### ${STATION_JOB_RULES[job].name} (${farmPlace(STATION_JOBS[job].station)!.name})\n\n${table(['Grade', 'In', '★1', 'Out', '★1'], rows)}`
  }).join('\n\n')
}

// --- The roster -----------------------------------------------------------------------------------------------

/** The Dorm for 20: its eight levels, their beds, costs and Farm Ranks. */
function dormLevels(): string {
  let total = 0
  return table(['Level', 'Beds', 'Costs', 'Farm Rank', 'Cumulative'], DORM_LEVELS.map((l) => {
    total += l.cost
    return [l.level, l.beds, l.cost ? g(l.cost) : '—', l.farmRank || '—', g(total)]
  }))
}
// --- The Farm Rank, the Diary and the cast ---------------------------------------------------------------------

/** The Farm Rank's points, and the save fields they're read from. */
function farmRankPoints(): string {
  return table(['Source', 'Points', 'Read from'], [
    ['Gold shipped at the bin', `1 per ${GOLD_PER_POINT}g`, '`farm.counts[\'gold-shipped\']`'],
    ['A Diary entry: a good shipped once', ENTRY_POINTS, '`diary.shipped`'],
    ['A milestone', MILESTONE_POINTS, '`diary.milestones`'],
  ])
}
/** Each Farm Rank's threshold and what it opens in the game as built, from the rules that gate on it. */
function farmRankOpensBlock(): string {
  return table(['Farm Rank', 'Points', 'Opens'], FARM_RANK_POINTS.map((points, i) => [i + 1, points.toLocaleString('en-US'), (i === 0 ? ['Block A and tier-1 seeds (the start)', ...farmRankOpens(1)] : farmRankOpens(i + 1)).join(', ')]))
}
const milestoneWhat = (m: Milestone): string => {
  switch (m.kind) {
    case 'shipped': return `${g(m.at)} shipped at the bin`
    case 'recruited': return `${m.at} Umas on the roster (the starters count)`
    case 'rank': return `The first Uma at ${RANKS[m.rank]}, in any activity`
    case 'depth': return `The first haul from ${m.place === 'forest' ? AREA_NAMES[m.area as ForestAreaId] : SPOT_NAMES[m.area as FishingSpotId]}`
    case 'crop-level': return `The first crop at level ${m.level}`
  }
}
/** The milestones. */
function milestonesBlock(): string {
  return table(['Milestone', 'Id', 'Gold', 'Points'], MILESTONES.map((m) => [milestoneWhat(m), `\`${m.id}\``, g(m.gold), MILESTONE_POINTS]))
}
/** The collection rows. */
function diaryRows(): string {
  return table(['Row', 'Id', 'Its ten goods', 'Gold'], DIARY_ROWS.map((r) => [`${FAMILY_NAMES[r.family]}${r.refined ? ', refined' : ''}`, `\`${r.id}\``, r.goods.map((id) => itemNameOf(id)).join(', '), g(ROW_GOLD)]))
}
/** The town's own six spots: each one's id, name, line and the role that keeps it. */
function townSpots(): string {
  return table(['Spot (`spot`)', 'The game’s name', 'Its line', 'Kept by'], SPOT_IDS.map((id) => [`\`${id}\``, PLACEHOLDER_SPOTS[id].name, PLACEHOLDER_SPOTS[id].blurb,
    CAST[PLACEHOLDER_SPOTS[id].keeper].role]))
}
/** The day's draw, and the game's own town lines. */
function townDraw(): string {
  return table(['', 'The rule'], [
    ['At each spot', `Up to ${SPOT_ROOM} a day: ${SPOT_ROOM * SPOT_IDS.length} in all, the rest at home`],
    ['Who’s out', 'Everyone in town but the town’s people and the welcome list not met yet (they come to the Gate; the day’s visitor stays out of town that day), in the order of `draw(uid, day, \'town:<id>\', 0)`, lowest first, until every spot is full; an Uma living on the farm keeps her place, unseen, so the day never shifts when someone moves in'],
    ['Where she stands', `Her favourite spot (her cast entry’s \`spot\`) while it has room, ${Math.round(FAVOURITE_SPOT * 100)}% of the time (\`draw(…, 1)\`); else a spot with room (\`draw(…, 2)\`)`],
    ['A talk', 'Once a day each: her talks so far and the last day, in the save’s `town`. It costs nothing and takes no time, and it meets her when it meets her trigger'],
    ['Her line', `One a day (\`draw(uid, day, 'town-line:<id>', 0)\`) of her bible’s \`townLines\`, else the game’s ${PLACEHOLDER_TOWN_LINES.length}: ${PLACEHOLDER_TOWN_LINES.join(' ')}`],
  ])
}
/** The town's roles, and who plays each without `town.json`. */
function castBlock(): string {
  return table(['Role', 'Id (`game`)', 'Does'], CAST_IDS.map((id) => [CAST[id].role, `\`${id}\``, CAST[id].is]))
}
const speakerWords = (beat: Beat): string => {
  switch (beat.speaker.kind) {
    case 'cast': return CAST[beat.speaker.id].role
    case 'narrator': return '(narration)'
  }
}
/** The game's own opening, line by line: what plays when the pack has no `opening.json`. */
function scenesBlock(): string {
  const kind = (step: Step): [string, string] => 'narrate' in step ? ['Narration', step.narrate] : 'thought' in step ? ['Your thought', step.thought]
    : 'say' in step ? [step.say, step.line] : 'wait' in step ? ['A pause', `${step.wait} ms`] : ['—', '—']
  return table(['#', 'Kind', 'Line'], PLACEHOLDER_OPENING.map((step, i) => [i + 1, ...kind(step)]))
}
// --- Meeting her ------------------------------------------------------------------------------

/** The trigger menu: what meets her, and when it's checked. */
function meetKinds(): string {
  return table(['Trigger (`meet`)', 'What meets her', 'Checked'], MEET_KINDS.map((k) => [`\`${k.kind}\``, k.meets, k.checked]))
}
/** What her meeting scene pays. */
function arrivalPay(): string {
  return table(['Her meeting scene', 'Points into her bar'], [
    ['Played or skipped to its end', `+${ARRIVAL_POINTS}`], ['Its choice: the option with the highest authored gain (each one tied at the top)', `+${CHOICE_BEST}`],
    ['Its choice: any other option', `+${CHOICE_OTHER}`], ['Written with no choice', 'The game’s hello is added, so its choice pays as above'],
    ['Written with more than one choice', 'The first pays; the rest are words only'],
  ])
}

// --- The placeholders --------------------------------------------------------------------------------------

function placeholdersBlock(): string {
  return table(['What the story can give', 'What plays without it'], PLACEHOLDER_TABLE.map((p) => [p.gives, p.without]))
}
function placeholderMoments(): string {
  return table(['Rung', 'The card’s first line (and its Memory’s caption)'], RUNGS.map((r) => [r === 'arrival' ? 'Her meeting scene' : rungName(r), PLACEHOLDER_MOMENTS[r] ?? '—']))
}
// --- The ladders and points ----------------------------------------------------------------------------------
const whole = (n: number) => n.toLocaleString('en-US')
/** Each heart's cost, the ladders' totals and the route's. */
function routeCosts(): string {
  const hearts = Array.from({ length: 10 }, (_, i) => costOf(`f${i + 1}`))
  const sum = (list: readonly number[], upTo: number) => list.slice(0, upTo + 1).reduce((a, b) => a + b, 0)
  const spouse = [1, 2, 3, 4, 5].map((n) => costOf(`s${n}`))
  return table(['Heart', ...hearts.map((_, i) => String(i + 1)), 'Ladder'], [
    ['**Friendship or romance**', ...hearts.map(whole), `**${whole(sum(hearts, 9))}**`],
    ['Cumulative', ...hearts.map((_, i) => whole(sum(hearts, i))), ''],
    ['**Spouse**', ...spouse.map(whole), ...Array(5).fill(''), `**${whole(sum(spouse, 4))}**`],
    ['**A route**: the three waiting rungs cost 0', ...Array(10).fill(''), `**${whole(ROUTE_POINTS)}**`],
  ])
}
/** What each act pays, and what pays it. */
function lovePoints(): string {
  const gift = (['loved', 'liked', 'neutral', 'disliked'] as const).map((t) => `${cap(t)} ${GIFT_POINTS_V4[t] > 0 ? '+' : ''}${GIFT_POINTS_V4[t]}`).join(', ')
  return table(['Act', 'Points', 'Limit', 'Paid by'], [
    ['Chat (tap her)', `+${LOVE_POINTS.chat}`, 'Once a day each, on the farm or in town', '`chatV4`'],
    ['Gift (one good, its stars your choice)', `${gift}; × (1 + 0.1 a star above ★1)`, 'One a day each; ×3 on her birthday', '`giftV4`'],
    ['Praise (a ★3+ day’s work, a rank-up, a Fine play)', `+${LOVE_POINTS.praise}`, 'Once a day, when earned', '`praiseV4`'],
    ['Her line (she worked it today)', `+${LOVE_POINTS.line}`, 'Paid at night, step 6', '`payLines`'],
    ['A festival together (its team or entry)', `+${LOVE_POINTS.festival}`, 'Once a festival a year each', '`festivalTogether` (festivals aren’t built yet)'],
    ['Her arrival scene', `+${ARRIVAL_POINTS}, and its choice (+${CHOICE_OTHER} or +${CHOICE_BEST})`, 'Once', '`finishArrival`'],
    ['A heart event', '+50, its choices and its play’s grade', 'One of hers a day', '`playEvent`'],
    ['The evening (a hangout from F2, a date from R1)', `Fine +${EVENING_GRADE_POINTS.fine}, Great +${EVENING_GRADE_POINTS.great}, Perfect +${EVENING_GRADE_POINTS.perfect}; ×${EVENING_FACTOR} in her favourite kind, on her birthday and on her anniversary, each once`, `One evening a day across all the Umas; two on some days from ${TWO_EVENINGS_MARRIED} married`, '`spendEvening`'],
    ['An invitation said yes', `+${INVITE_POINTS}`, 'With her first evening that day', '`spendEvening`'],
    ['A house morning', '+30 each resident', 'The house you slept in', '`houseMorning`, night step 9'],
    ['**On her anniversary**', `×2 on every act but the evening (×${EVENING_FACTOR} instead)`, 'From year 2 of her marriage', '`addLove`'],
  ])
}
/** A gift's points by her taste and its stars, then on her birthday. */
function giftStarsBlock(): string {
  const stars = [1, 2, 3, 4, 5]
  const tastes = ['loved', 'liked', 'neutral', 'disliked'] as const
  const pay = (t: typeof tastes[number], s: number, birthday: boolean) => Math.round(GIFT_POINTS_V4[t] * giftStars(s) * (birthday ? 3 : 1))
  return table(['Her taste', ...stars.map((n) => `★${n}`)], [
    ...tastes.map((t) => [cap(t), ...stars.map((n) => pay(t, n, false))]),
    ...(['loved', 'liked', 'neutral'] as const).map((t) => [`${cap(t)}, on her birthday (×3)`, ...stars.map((n) => pay(t, n, true))]),
  ]) + `\n\nA disliked gift pays 0 and she says one line: “${DISLIKED_LINE}”`
}
/** A real date's farm day. */
function birthdayMap(): string {
  const months = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2]
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const name = (m: number) => names[m - 1]!
  const at = (m: number, d: number) => { const date = dateOf(farmBirthday(m, d)); return `${SEASON_NAMES[date.season]} ${date.day}` }
  return table(['Month', 'Days 1–8', '9–16', '17–24', '25–31'], months.map((m) => [name(m), at(m, 1), at(m, 9), at(m, 17), at(m, 25)]))
}
/** The four conditions, and the order `readiness` says what waits. */
function readyRules(): string {
  return table(['#', 'Ready needs', 'Not met'], READY_CONDITIONS.map((c, i) => [i + 1, c.condition, c.unmet]))
}
/** Her chapters with no pack's: the four defaults and the events each holds. */
function defaultChapters(): string {
  const words = (events: readonly string[]): string => {
    const out: string[] = []
    let run: string[] = []
    const flush = () => {
      if (run.length > 0) out.push(run.length > 2 ? `${run[0]!.toUpperCase()}–${run.at(-1)!.toUpperCase()}` : run.map((r) => r.toUpperCase()).join(', '))
      run = []
    }
    for (const rung of events) {
      const last = run.at(-1)
      if (/^[fr]\d+$/.test(rung) && (!last || (last[0] === rung[0] && Number(last.slice(1)) + 1 === Number(rung.slice(1))))) { run.push(rung); continue }
      flush()
      if (/^[fr]\d+$/.test(rung)) run.push(rung)
      else out.push(rung === 'arrival' ? 'her meeting scene' : /^s\d$/.test(rung) ? rung.toUpperCase() : rung === 'confession' ? 'her confession' : `the ${rung}`)
    }
    flush()
    return cap(out.join(', '))
  }
  return table(['#', 'Chapter', 'Its events'], herChapters({ cast: { umas: [] } }, '1').map((c) => [c.n, chapterTitle(c), words(c.events)]))
}
/** A chapter's gate: each kind it takes, when it holds, and what her profile says while it doesn't. */
function chapterGates(): string {
  return table(['Gate (`gate`)', 'Holds', 'Her profile says'], GATE_RULES.map((g) => [`\`${g.example.kind}\``, g.holds, `“${gateWords(g.example, () => 'Stand-in 2')}”`]))
}
function readyWaits(): string {
  return table(['Order', '`waits`', 'When'], WAIT_ORDER.map((w, i) => [i + 1, `\`${w.kind}\``, w.when]))
}
/** The bar's colour by ladder. */
function ladderColours(): string {
  return table(['Ladder', 'Stages', 'Bar'], [
    ['Friendship', 'F0–F10, and her confession while it waits', `coral \`${LADDER_COLOURS.friendship}\``],
    ['Romance', 'R0–R10, the proposal and the wedding while they wait', `rose \`${LADDER_COLOURS.romance}\``],
    ['Spouse', `S0–S5 (${SPOUSE_COST} a level)`, `gold \`${LADDER_COLOURS.spouse}\``],
  ])
}
/** Her friendship's factor on rank points. */
function heartsFactor(): string {
  const levels = (factor: number) => Array.from({ length: 10 }, (_, l) => l).filter((l) => loveRankFactor({ stage: 'friendship', level: l }) === factor)
  const span = (list: number[]) => (list.length === 1 ? `F${list[0]}` : `F${list[0]}–F${list.at(-1)}`)
  return table(['×1', '×1.05', '×1.10'], [
    [span(levels(1)), span(levels(1.05)), `${loveRankFactor({ stage: 'confession', level: 10 }) === 1.1 ? 'F10 on: her confession, romance and spouse' : '?'}`],
  ])
}
// --- The perks' words ---------------------------------------------------------------------------------------
const PERK_LINE_NAME: Readonly<Record<PerkLine, string>> = {
  farming: 'Farming', foraging: 'Foraging', fishing: 'Fishing', mining: 'Mining (the Mine)', quarry: 'Mining (the Quarry)', ranch: 'Ranch', cooking: 'Cooking',
  serving: 'Serving', forging: 'Forging',
}
/** Every level's perk, with a forager's words for the ones her line templates; then each line's words. */
function perkWordsBlock(): string {
  const levels = table(['Level', 'Perk id', 'Words (a forager’s)', 'At her line’s place'], PERKS.map((p) => [
    p.rung.toUpperCase(), `\`${p.id}\``, perkWords(p.id, 'foraging'), p.place ? 'Yes: “Opens when the Kitchen is built” (her place) until it’s built' : '',
  ]))
  const lines = table(['Her line', 'Her place', '+10% (F3)', 'A night chore (F6)', 'A morning item (R2)', 'Opens with'], PERK_LINES.map((line) => [
    PERK_LINE_NAME[line], PERK_PLACE[line], perkWords('line-10', line), NIGHT_CHORE[line], `A ★2+ ${MORNING_GOOD[line]}`, linePlace(line) === null ? 'Day 1' : `When the ${FARM_PLACES.find((p) => p.id === linePlace(line))!.name} is built`,
  ]))
  return `${levels}\n\n${lines}`
}

// --- The perks' effects -------------------------------------------------------------------------------------
const sharePct = (share: number): string => `${Math.round(share * 1000) / 10}%`
/** What each perk does and where it acts (each read from her level). */
const PERK_EFFECT: Readonly<Record<PerkId, readonly [string, string]>> = {
  'tastes-loved': ['Her loved gift shows on her profile; she speaks her authored chats', 'Her profile, Chat'],
  hangouts: ['The evening opens: hangouts', 'Tonight'],
  'line-10': [`+${sharePct(LINE_BONUS)} at her line: copies of her night’s items there (a farmer: a tended plot’s chance of an extra crop)`, 'Night step 4, a harvest'],
  'signature-dish': ['Her signature dish’s recipe into the Kitchen’s list, once', '`playEvent`'],
  'rank-105': ['×1.05 her rank points', 'Night step 6'],
  'night-chore': ['One night chore', 'Night steps 2 and 4'],
  'tastes-all': ['All her tastes, and her closest friend’s loved gift, on her profile', 'Her profile'],
  'in-element': [`Side by side ×${IN_ELEMENT} in place of ×1.1 at her line, outside the cap`, 'Night steps 2 and 4'],
  mentor: [`×${MENTOR_POINTS} rank points for the others at her place while she works there; one mentor a place`, 'Night step 6'],
  keepsake: [`Her keepsake: +${KEEPSAKE_QUALITY} quality at her line; ×1.10 rank points`, 'A job planned, a harvest; night step 6'],
  dates: ['Dates open; her pet name for you on her profile', 'Tonight, her profile'],
  'morning-item': [`A ★${MORNING_ITEMS.r2.stars}+ good of her line every ${MORNING_ITEMS.r2.every}th morning`, 'Night step 9'],
  'date-stargazing': ['Date: stargazing', 'Tonight'],
  'closest-bond': ['×1.5 on her bond with her closest friend', '`addBond`'],
  'line-20': [`+${sharePct(LINE_BONUS)} more at her line (+${sharePct(2 * LINE_BONUS)})`, 'Night step 4, a harvest'],
  'date-dance-boat': ['Dates: dance and boat', 'Tonight'],
  'night-chore-2': ['A second night chore', 'Night steps 2 and 4'],
  engraving: ['Her ring’s engraving shows', 'The ring bench'],
  'date-footrace': ['Date: footrace', 'Tonight, once the footrace is built'],
  proposal: ['The proposal', 'Her proposal event (`playEvent`)'],
  breakfast: [`Breakfast: the crew well fed ${BREAKFAST_DAYS} day on a morning in her house, when no meal runs`, '`breakfast`, called by her house’s morning'],
  'morning-item-2': [`A ★${MORNING_ITEMS.s2.stars}+ good of her line every ${MORNING_ITEMS.s2.every}nd morning (and each morning in her house)`, 'Night step 9'],
  dream: [`Her dream: +${sharePct(DREAM_BONUS)} for anyone at her line’s place, once her S3 is in her Memories`, 'Night step 4, a harvest'],
  'night-chore-3': ['A third night chore', 'Night steps 2 and 4'],
  'vow-renewal': [`Vow renewal; her keepsake grows to +${KEEPSAKE_GROWN}`, 'Her S5 event (the vows); her keepsake at her line'],
}
/** Every perk, what it does (a forager's words) and where it acts. */
function perkEffects(): string {
  return table(['Level', 'Perk', 'What it does', 'Where it acts'], PERKS.map((p) => [p.rung.toUpperCase(), perkWords(p.id, 'foraging'), PERK_EFFECT[p.id][0], PERK_EFFECT[p.id][1]]))
}
const LINE_TEN: Readonly<Record<PerkLine, string>> = {
  farming: 'Each plot she tends: +10% chance of an extra crop at harvest, at the plot’s stars',
  foraging: 'Her haul ×1.1, and her Sawmill batch ×1.1', fishing: 'Her catch ×1.1, and her Smokehouse batch ×1.1',
  mining: 'Her haul ×1.1, and her Smelter batch ×1.1', quarry: 'Her haul ×1.1, and her Cutter batch ×1.1',
  ranch: 'Her pen: +10% chance of an extra product', cooking: '+10% dishes as the Kitchen’s assistant', serving: '+10% tips as the Restaurant’s server',
  forging: '+10% goods as the Forge’s assistant',
}
const LINE_CHORE: Readonly<Record<PerkLine, string>> = {
  farming: 'Waters one dry growing tile (step 2)',
  foraging: 'One item from her rank’s deepest area this season, at a day’s haul’s stars (step 4)',
  fishing: 'One fish from her deepest spot this season, at a day’s haul’s stars (step 4)',
  mining: 'One ore from her deepest floor', quarry: 'One stone or gem from her deepest floor', ranch: '+5 affection to her pen (step 3)',
  cooking: '+1 dish on the Kitchen’s next play', serving: '+1 cover on the Restaurant’s next shift', forging: '+5% refund on the Forge’s next tool',
}
/** What "her line" means for each template, and whether it acts yet. */
function perkLines(): string {
  return table(['Her line', '+10% at her line (F3, R5)', 'A night chore (F6, R7, S4)', 'A morning item (R2, S2)', 'Acts'], PERK_LINES.map((line) => {
    const opens = linePlace(line)
    const now = CHORE_LINES.includes(line) ? 'Yes' : `Not yet: once the ${FARM_PLACES.find((p) => p.id === opens)!.name}’s game is built`
    return [PERK_LINE_NAME[line], LINE_TEN[line], LINE_CHORE[line], `A ★2+ ${MORNING_GOOD[line]}${CHORE_LINES.includes(line) ? '' : ' (a crop of the season until its place opens)'}`, now]
  }))
}
/** The caps, and a worked forager. */
function perkCaps(): string {
  const own = Math.min(OWN_CAP, 2 * LINE_BONUS + 0.08)
  const crew = Math.min(CREW_CAP, DREAM_BONUS + householdBonus(15))
  const caps = table(['What', 'Cap', 'How'], [
    [`Her own line bonuses: F3 +${sharePct(LINE_BONUS)}, R5 +${sharePct(LINE_BONUS)}, her ring +1–15% once married`, `+${sharePct(OWN_CAP)}`, 'At her line’s place only (`romanceTerms`)'],
    [`The crew’s: a dream’s +${sharePct(DREAM_BONUS)} (the best at a place, never summed), the household’s ${HOUSEHOLD.map((h) => `+${sharePct(h.bonus)} at ${h.married}`).join(' and ')} married`, `+${sharePct(CREW_CAP)}`, 'Anyone working the place (the household anywhere)'],
    ['All romance bonuses on any one job, added', `+${sharePct(ROMANCE_CAP)}`, 'The romance term (`romanceBonus`)'],
    [`In her element (×${IN_ELEMENT})`, 'Outside the cap', 'The bond term (`extrasShare`)'],
    ['Night chores', `${MAX_CHORES} a night each`, 'F6, R7, S4'],
    ['Morning items', '1 a day each by her count, +1 on a morning in her house', `Every ${MORNING_ITEMS.r2.every}th from R2, every ${MORNING_ITEMS.s2.every}nd from S2`],
    ['Mentor', 'One a place', 'The most hearts, then the cast’s order'],
    ['Rank points from her ladder', '×1.10', 'F5 ×1.05, F10 ×1.10 (`loveRankFactor`)'],
  ])
  return `${caps}\n\nWorked: a married forager with F3, R5 and a grade-8 ring has +${sharePct(2 * LINE_BONUS + 0.08)} of her own (${sharePct(own)} after her cap); a dream at the forest (+${sharePct(DREAM_BONUS)}) and 15 married (+${sharePct(householdBonus(15))}) add +${sharePct(crew)}; together +${sharePct(own + crew)}, **held to +${sharePct(Math.min(ROMANCE_CAP, own + crew))}**. Beside a 3-heart partner in her element her night’s items come to ×${IN_ELEMENT} × ${1 + Math.min(ROMANCE_CAP, own + crew)} = ×${Math.round(IN_ELEMENT * (1 + Math.min(ROMANCE_CAP, own + crew)) * 100) / 100}.`
}
/** Her signature dish by her line. */
function signatureDishes(): string {
  const grade: Readonly<Record<PerkLine, string>> = {
    farming: 'The top grade of the shop’s vegetables at its open seed tiers (Farm Rank 1: G6; 2: G7; 4: G10)',
    foraging: 'The top grade of the deepest forest area anyone has worked (the Woods G2 … the World Tree G10)',
    fishing: 'The top grade of the deepest spot anyone has worked, its fish at 10% or more (the Pond G2)',
    mining: 'G1 until the Mine’s game is built', quarry: 'G1 until the Quarry’s game is built', ranch: 'G1 until the ranch’s game is built',
    cooking: 'G1 until the Kitchen’s game is built', serving: 'G1 until the Restaurant’s game is built', forging: 'G1 until the Forge’s game is built',
  }
  return table(['Her line', 'Her dish kind', 'Its grade', 'At G1'], PERK_LINES.map((line) => [PERK_LINE_NAME[line], DISH_WORDS[LINE_DISH[line]], grade[line], dishName(dishId(LINE_DISH[line], 1))]))
    + '\n\nHer loved good, when it’s a dish, is her signature dish as it is. The recipe joins `workshops.recipes` once (a recipe the farm knows stays once) and her route keeps its id (`love.dish`).'
}

/** The stand-in pack in git: the dev server's and the tests' cast. */
function standIn(): string {
  const pack = storyPackFrom(STAND_IN_FILES)
  const welcome = welcomeOf(pack)
  const listed = (id: string): string => (welcome.indexOf(id) === 0 ? '1st: day 1’s visitor' : welcome.includes(id) ? ordinal(welcome.indexOf(id) + 1) : '—')
  return table(['Character', 'Outfit', 'Calling', 'Favourite line', 'Welcome list', 'Bible', 'Scripted'], pack.cast.umas.map((u) => [
    u.characterId, u.outfitId ?? '—', u.calling ?? '—', favouriteOf(pack, u.characterId) ?? '—', listed(u.characterId), pack.bibles.has(u.characterId) ? 'Yes' : 'No (her calling stands in)',
    `${pack.scripted.get(u.characterId)?.size ?? 0} of 27`,
  ]))
}
/** The farmer's name. */
function farmerName(): string {
  return table(['Rule', 'Detail'], [
    ['Characters', 'Letters of any script (with their accents), spaces, apostrophes (\' and ’) and hyphens'],
    ['Length', `1–${FARMER_NAME_MAX} characters, after trimming and collapsing inner runs of spaces`],
    ['Default', 'None: an empty field with a grey “Farmer”'],
    ['Where it shows', '`{farmer}` in every line, filled when the line shows; the save holds the name, never story text'],
  ])
}

// --- Bonds between Umas -------------------------------------------------------------------------------------
/** What a pair earns, by what they shared. */
function bondPoints(): string {
  return table(['Shared', 'Points', 'Paid by'], [
    ['Working the same place the same day (the Fields’ tenders together)', `+${BOND_POINTS.place} a pair; ×${SHARED_LINE} when both favour that place’s line`, '`bondsTonight`, night step 6'],
    ['An expedition party, a day away', `+${BOND_POINTS.party} a pair`, '`addBond`, from expeditions (not built yet)'],
    ['A festival team', `+${BOND_POINTS.team} a pair`, '`addBond`, from the festivals (not built yet)'],
    ['The same staff meal, or the same breakfast', `+${BOND_POINTS.meal} a pair`, '`addBond`: breakfast at a house’s morning; the staff meal once the Kitchen is built'],
    ['The same house, a night', `+${BOND_POINTS.house} a pair`, '`shareTheHouses`, night step 6'],
    ['**Romance 4:** her bond with her closest friend', `×${CLOSEST_BOND} on any of these, once (never ×${CLOSEST_BOND * CLOSEST_BOND} when both qualify)`, '`bondFactor`, in `addBond`'],
  ])
}
/** The hearts' points, and the days two at one place reach them. */
function bondHeartsBlock(): string {
  const day = (points: number, a: number) => `Day ${Math.ceil(points / a - 1e-9)}`
  return table(['Hearts', ...BOND_HEARTS.map((_, i) => String(i + 1))], [
    ['Points', ...BOND_HEARTS.map((p) => p.toLocaleString('en-US'))],
    [`Two at one place every day (+${BOND_POINTS.place})`, ...BOND_HEARTS.map((p) => day(p, BOND_POINTS.place))],
    [`Sharing a favourite line there (+${BOND_POINTS.place * SHARED_LINE})`, ...BOND_HEARTS.map((p) => day(p, BOND_POINTS.place * SHARED_LINE))],
  ])
}
/** A tie's seed by strength, and the stand-in's ties. */
function tieSeeds(): string {
  const pack = storyPackFrom(STAND_IN_FILES)
  const levels = (a: string, b: string) => {
    const set = pack.pairs.get(pairKey(a, b))
    return set && set.size > 0 ? `Bond ${[...set].sort((x, y) => x - y).join(', ')}` : '— (the tie’s line)'
  }
  return table(['Tie strength', 'Bond starts at', 'Hearts'], ([3, 2, 1] as const).map((s) => [s, TIE_SEEDS[s], bondHearts(TIE_SEEDS[s])]))
    + '\n\nThe stand-in pack’s ties (invented):\n\n'
    + table(['Pair', 'Kind', 'Strength', 'Seeded at', 'Authored conversations'], pack.ties.ties.map((t) => [`${t.a} & ${t.b}`, tieKind(t), tieStrength(t), TIE_SEEDS[tieStrength(t)], levels(t.a, t.b)]))
}
/** Side by side at 3 hearts. */
function sideBySide(): string {
  const share = Math.round((SIDE_BY_SIDE - 1) * 100)
  return table(['Where', `Beside a ${SIDE_BY_SIDE_HEARTS}-heart partner`, 'How'], [
    ['A work place (gathering, a station)', `+${share}% of her night’s items`, 'Night step 4 (`nightExtras`): copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, \'bond:<id>\', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today. None until the farmhands work'],
  ])
}

// --- Heart events and the five plays -----------------------------------------------------------------------
const s1 = (ms: number) => `${Math.round(ms / 100) / 10} s`
/** The five plays, both lengths. */
function playsBlock(): string {
  return table(['Play', 'You', 'Graded by', 'In an event', 'As an evening'], [
    [PLAY_NAMES.cast, 'Tap as a closing ring meets the mark; the line lands every time', 'Timing', `${CAST_COUNT.event} cast`, `${CAST_COUNT.evening} casts`],
    [PLAY_NAMES.pick, `Tap her favourites (starred) among the goods popping up on a ${Math.sqrt(PICK_CELLS)} × ${Math.sqrt(PICK_CELLS)} field`, 'Right picks', `${PICK_ROUNDS.event} round of ${PICK_POPS}`, `${PICK_ROUNDS.evening} rounds`],
    [PLAY_NAMES.rhythm, 'Tap on her beat with the activity’s mark (a hoe, a brush, a step, an oar…)', 'Timing', `${RHYTHM_BEATS} beats after her ${RHYTHM_LEAD}`, `${RHYTHM_ROUNDS.evening} × ${RHYTHM_BEATS} beats`],
    [PLAY_NAMES.walk, 'Walk with her past today’s farm places; at each fork take a turn', 'Her favourite turns found', `${WALK_FORKS.event} forks`, `${WALK_FORKS.evening} forks`],
    [PLAY_NAMES.choose, 'Pick one good of three for her', 'Her taste', '1 pick', '—'],
  ])
}
const playWords = (p: PlayAs | null): string => (p === null ? 'No play: the grade is the best choice’s' : `${PLAY_NAMES[p.kind]}${p.mark ? ` with ${RHYTHM_MARK_WORDS[p.mark]}` : ''}${p.fallback ? ' (the fallback until its game ships)' : ''}`)
/** What plays as what. */
function playMap(): string {
  const work = ACTIVITIES.map((a) => [`\`work: ${a}\``, playWords(PLAY_MAP[a])])
  const dates = (['fishing', 'walk', 'boat', 'picnic', 'market', 'stargazing', 'dance', 'crafting', 'cooking', 'footrace'] as const).map((g) => [`\`date: ${g}\``, playWords(PLAY_MAP[g])])
  return table(['`together` (or a `play` step’s `game`)', 'Plays as'], [
    ...work, ['`work: farming` with `play.as: rhythm`', playWords(playOf({ game: 'farming', as: 'rhythm' }))], ...dates,
    ['`gift`', playWords(togetherPlay({ kind: 'gift', good: 'carrot' }))], ['`help`, `talk`', playWords(null)],
  ])
}
/** The grades and what each pays. */
function playGrades(): string {
  const band = (g: Grade) => (g === 'fine' ? `0–${GREAT_AT - 1}` : g === 'great' ? `${GREAT_AT}–${PERFECT_AT - 1}` : `${PERFECT_AT}–100`)
  return table(['Grade', 'Score', 'An event adds', 'An evening pays'], GRADES.map((g) => [GRADE_NAMES[g], band(g), `+${EVENT_GRADE_POINTS[g]}`, `+${EVENING_GRADE_POINTS[g]}`]))
}
/** Each play's timing windows and numbers. */
function playWindows(): string {
  const { exact, perfect, great, miss } = TIMING_WINDOWS
  const timing = table(['A tap this far from the moment', 'Scores', 'Grade'], [
    [`≤ ${exact} ms`, timingScore(exact), 'Perfect'],
    [`${exact + 1}–${perfect} ms`, `${timingScore(exact + 1)} → ${timingScore(perfect)}`, 'Perfect'],
    [`${perfect + 1}–${great} ms`, `${timingScore(perfect + 1)} → ${timingScore(great)}`, 'Great'],
    [`${great + 1}–${miss - 1} ms`, `${timingScore(great + 1)} → ${timingScore(miss - 1)}`, 'Fine'],
    [`${miss} ms or more, or no tap`, 0, 'Fine'],
  ])
  const plays = table(['Play', 'Seeded (`play:<id>:<rung>`)', 'Scored'], [
    [PLAY_NAMES.cast, `The ring meets the mark ${s1(CAST_MEET.from)}–${s1(CAST_MEET.from + CAST_MEET.spread)} after each cast starts`, 'The tap’s timing; casts score their mean'],
    [PLAY_NAMES.rhythm, `A beat every ${RHYTHM_PERIOD.from}–${RHYTHM_PERIOD.from + RHYTHM_PERIOD.spread} ms; her ${RHYTHM_LEAD} first, then ${RHYTHM_BEATS} to tap`, `Each beat by its nearest tap’s timing (within half a beat), their mean; a tap that matches no beat −${RHYTHM_EXTRA}; rounds score their mean`],
    [PLAY_NAMES.pick, `${PICK_POPS} goods a round, one every ${s1(PICK_TIMES.every)}, each showing ${s1(PICK_TIMES.show)}–${s1(PICK_TIMES.show + PICK_TIMES.spread)}; ${PICK_STARS} starred (her loved and liked, else her line’s first goods)`, `The starred tapped while showing, their share of 100; a tap on an unstarred one −${PICK_WRONG}; rounds score their mean`],
    [PLAY_NAMES.walk, `At each fork her place and another open farm place, left or right; ${s1(WALK_FORK_MS)} a fork`, 'Her place’s turn full, the other half, none 0: their share of 100 (two forks 50, 75 or 100)'],
    [PLAY_NAMES.choose, `Three goods, one of her loved or liked; ${s1(CHOOSE_MS)}`, `Loved ${CHOOSE_SCORES.loved}, liked ${CHOOSE_SCORES.liked}, anything else ${CHOOSE_SCORES.neutral}, none 0; the taste is learnt`],
  ])
  return `${timing}\n\n${plays}`
}
/** What an event pays. */
function eventPay(): string {
  return table(['An event', 'Points into her next bar'], [
    ['Played to its end', `+${EVENT_POINTS}`],
    ['Each choice: the option with the highest authored gain (each one tied at the top)', `+${CHOICE_BEST}`],
    ['Each choice: any other option', `+${CHOICE_OTHER}`],
    ['Each play: Fine, Great, Perfect', GRADES.map((g) => `+${EVENT_GRADE_POINTS[g]}`).join(', ')],
    ['No play (help, talk): the best option taken a Perfect, any other a Great', `+${EVENT_GRADE_POINTS.perfect} or +${EVENT_GRADE_POINTS.great}`],
    ['A heart event’s usual size (any other is a note, and plays)', `${EVENT_LIMITS.heart.choices[0]}–${EVENT_LIMITS.heart.choices[1]} choice points, at most ${EVENT_LIMITS.heart.plays} play`],
    [`The ${BIG_EVENTS.slice(0, -1).join('’s, the ')}’s and the ${BIG_EVENTS.at(-1)}’s usual size`, `${EVENT_LIMITS.big.choices[0]}–${EVENT_LIMITS.big.choices[1]} choice points, at most ${EVENT_LIMITS.big.plays} plays`],
  ])
}
const togetherWords = (t: Together): string => (t.kind === 'work' ? `work: ${t.activity}` : t.kind === 'date' ? `date: ${t.game}` : t.kind === 'gift' ? `gift: ${t.good}` : t.kind === 'help' ? `help: ${t.with}` : 'talk')
/** The stand-in's route, every play and option kind across its 26 events. */
function standInRoute(): string {
  const bible = STAND_IN_FILES.umas['9000001'] as UmaBible
  const route = STAND_IN_FILES.routes['9000001'] as Route
  return table(['Rung', 'Place', 'Together', 'Plays', 'Setup', 'Also'], (bible.route ?? []).filter((b) => b.id !== 'arrival').map((b) => {
    const steps = JSON.stringify(route.events.find((e) => e.id === b.id)?.steps ?? [])
    const plays = (route.events.find((e) => e.id === b.id)?.steps ?? []).filter((s): s is Extract<typeof s, { play: unknown }> => 'play' in s).map((s) => playWords(playOf(s.play)))
    const also = [steps.includes('"gives"') ? 'a cost' : '', steps.includes('"reveals"') ? 'a taste' : '', steps.includes('"flag"') ? 'a flag' : '', steps.includes('"when"') ? 'a `when`' : '',
      steps.includes('"answer"') ? 'Yes / Not yet' : '', b.unlock ? `unlocks ${b.unlock.kind}` : ''].filter(Boolean).join(', ')
    const t = b.trigger ?? { kind: 'hearts' }
    const setup = t.kind === 'hearts' ? '' : t.kind === 'working' ? `works ${t.activity}` : t.kind === 'item' ? `${t.good} held` : `bond ${t.level} with ${t.with}`
    const together = b.together ?? { kind: 'talk' }
    return [b.id.length <= 3 ? b.id.toUpperCase() : cap(b.id), b.place ?? '—', togetherWords(together), plays.length > 0 ? plays.join('; ') : `${playWords(togetherPlay(together))}${togetherPlay(together) ? ', from its together' : ''}`, setup, also]
  }))
}

// --- The evening ---------------------------------------------------------------------------------------------

const WAITS_WORDS: Readonly<Record<EveningWait, string>> = { kitchen: 'Not yet: waits for the Kitchen', footrace: 'Not yet: waits for the footrace' }
/** The kinds by ladder and game, whether each is offered, and each one's invitation. */
function eveningKinds(): string {
  const pack = storyPackFrom(STAND_IN_FILES)
  return table(['Kind', 'As a hangout', 'As a date', 'Plays as', 'Offered', 'Her invitation'], Object.values(EVENINGS).map((d) => [
    d.name,
    d.kind === 'festival' ? `Festival days, F${HANGOUT_FROM}` : d.hangout === null ? '—' : `F${d.hangout}`,
    d.kind === 'festival' ? `Festival days, R${DATE_FROM}` : `R${d.date}`,
    d.kind === 'festival' ? 'Walk, at the festival ground' : playWords(d.play),
    d.waits ? WAITS_WORDS[d.waits] : 'Yes',
    d.question ? `“${d.question}”` : '— (never asked for)',
  ])) + `

Who: ${ROLE_WORDS.hangout.toLowerCase()} from Friendship ${HANGOUT_FROM} (her confession’s wait and Romance 0 included), ${ROLE_WORDS.date.toLowerCase()} from Romance ${DATE_FROM} (the proposal’s and the wedding’s waits included), and every kind her ladders opened with a spouse; she must be home. The stand-in’s favourite kinds: ${['9000001', '9000002', '9000003'].map((id) => `${id} ${favouriteKind(pack, id)}`).join(', ')}.`
}
/** What an evening pays, each factor once. */
function eveningPointsBlock(): string {
  const f = (kind: boolean, birthday: boolean, anniversary: boolean) => ({ kind, birthday, anniversary })
  const cols = [f(false, false, false), f(true, false, false), f(true, true, false), f(true, true, true)]
  return table(['Grade', 'Any kind', `Her favourite kind (×${EVENING_FACTOR})`, 'Her kind, on her birthday', 'Her kind, on her birthday and anniversary'],
    GRADES.map((g) => [GRADE_NAMES[g], ...cols.map((c) => `+${eveningPoints(g, c)}`)]))
    + `\n\nAn invitation said yes adds **+${INVITE_POINTS}** with her first evening that day, whatever the kind; it’s an act of its own, so her anniversary doubles it (+${INVITE_POINTS * 2}).`
}
/** The day's slots and the morning's invitations. */
function eveningSlotsBlock(): string {
  const festivals = FESTIVALS.map((f) => `${SEASON_NAMES[f.season]} ${f.day}`).join(', ')
  return table(['Today', 'Evenings', 'Festival night', 'Invitations this morning'], [
    ['Any day', 1, '—', invitesFor(0)],
    [`From ${TWO_EVENINGS_MARRIED} married`, `2 on days divisible by ${SECOND_EVENING_EVERY}, else 1`, '—', invitesFor(TWO_EVENINGS_MARRIED)],
    [`A festival day (${festivals})`, 'As any day', '1 more, its own slot: only festival night fills it', 'As any day'],
  ]) + `\n\nAn invitation’s draw: \`draw(uid, day, 'invite', n)\` among the Umas home at Friendship ${HANGOUT_FROM}+ whose favourite kind is open to them, each weighted 1 + the days since her last evening (or since she arrived), up to ${INVITE_WEIGHT_DAYS}; a second invitation is never the first’s Uma.`
}

// --- The ring bench and the wedding ---------------------------------------------------------------------------

/** The ten rings, their prices, the bench's cheapest three and the ring's own recipe. */
function ringsBlock(): string {
  const cheapest = (grade: number): string => {
    const good = GOODS.filter((x) => x.grade === grade && benchTakes(false, x.id)).sort((a, b) => a.price - b.price)[0]!
    return `${RING_INPUTS} ${itemNameOf(good.id)} (${g(good.price)} each)`
  }
  return table(['Grade', 'Ring', 'Id', '★1', '★5', 'Her bonus once married', 'Cheapest at the bench', 'Its own recipe (once the Smelter and the Cutter stand)'], RING_GOODS.map((r) => {
    const recipe = forgeRecipe(r.grade)
    return [`G${r.grade}`, goodName(r.id), `\`${r.id}\``, g(starPrice(r.id, 1)), g(starPrice(r.id, 5)), `+${ringPercent(r.grade)}%`, cheapest(r.grade),
      `2 ${itemNameOf(recipe.ingot)} + 1 ${itemNameOf(recipe.gem)}`]
  }))
}
/** The bench's rule, its refusals, and what the merge game will add. */
function benchRecipe(): string {
  return table(['', 'The ring bench'], [
    ['Opens', 'The night after the first Romance 8 event anyone plays: `buildings.forge = 0`, and the smith’s scene the next morning'],
    ['A ring of grade g', `${RING_INPUTS} refined goods of grade g, any family, any mix; the mining families’ (ingots, blocks, cut gems) once the Smelter and the Cutter stand`],
    ['Cost', 'The goods only: no gold, no game, no assistant, no score'],
    ['Out', 'The ring, ★1 (a Rough make), into the Warehouse'],
    ['How often', 'One ring a day (`today.ring`)'],
    ['Her bonus once married', `+1% at her line a grade, inside her own +35%; the Forge’s merge game (not built yet) adds +${MAKE_BONUS.fine}, +${MAKE_BONUS.great} or +${MAKE_BONUS.masterwork} for a Fine, Great or Masterwork make`],
    ['Refusals', Object.values(BENCH_WORDS).map((w) => `“${w}”`).join(' · ')],
  ])
}
/** The smith's scene at the bench, beat by beat. */
// --- The dialogue engine -----------------------------------------------------------------------------------------
/** Outfits by context: the rules in their order, each with the story's id and the art's base. */
function outfitRules(): string {
  const art = (o: StoryOutfit) => (o === 'season' ? 'The season’s' : `\`${ART_NAMES[o]}\``)
  return table(['#', 'The moment', 'Her outfit', 'The base'], [
    ['—', 'The scene’s own `outfit`, when the story names one', 'Its own', 'Its art name, below'],
    ...MOMENT_OUTFITS.map((r, i) => [i + 1, `${r.words} (${r.moments.map((m) => `\`${m}\``).join(', ')})`, `\`${r.outfit}\``, art(r.outfit)]),
    [MOMENT_OUTFITS.length + 1, 'Else', '`season`', 'The day’s season’s'],
  ]) + `\n\nA wedding’s guests wear the moment’s other outfit (${PERSONAL_OUTFITS.map((o) => `\`${o}\``).join(' and ')} are the scene’s own Umas’ only). The heart events’ moments: the wedding rung, a beat whose \`together\` is work, a picnic date, and ${SHORE_PLACES.map((p) => `\`${p}\``).join(', ')} in summer. A household scene is a dinner and the finale a festival night; the other moments are the evenings’ and the calendar’s scenes’ to hand in.`
}
/** The story's outfit ids and the art's names for them. */
function outfitIds(): string {
  return table(['The story’s `outfit`', 'The art’s base'], STORY_OUTFITS.map((o) => [`\`${o}\``, o === 'season' ? SEASONS.map((s) => `\`${ART_NAMES[s]}\``).join(', ') + ' by the day' : `\`${ART_NAMES[o]}\``]))
}
/** The 22 expressions, their sets and their fallbacks. */
function expressionsBlock(): string {
  return table(['Expression', 'Set', 'Falls back to', 'Shown while not drawn'], EXPRESSIONS.map((e) => [
    `\`${e.id}\``, e.set.charAt(0).toUpperCase() + e.set.slice(1), e.fallback ? `\`${e.fallback}\`` : '—', fallbackChain(e.id).slice(1).map((x) => `\`${x}\``).join(' → ') || 'The base’s own face',
  ]))
}

function benchScene(): string {
  return `**${BENCH_SCENE_LINES.title}** (\`${BENCH_SCENE_LINES.id}\`)\n\n${table(['#', 'Who', 'Line'], BENCH_SCENE_LINES.beats.map((b, i) => [i + 1, speakerWords(b), b.line]))}`
}
/** The reception's well-fed days, and the wedding's guests and places. */
function receptionBlock(): string {
  return table(['The reception', 'Well fed from tomorrow, everyone on the farm'], [
    ...[1, 2, 3, 4, 5].map((stars) => [`A ★${stars} dish`, `${receptionDays(stars)} day${receptionDays(stars) === 1 ? '' : 's'}`]),
    ['No dish in the Warehouse: the town’s bakery sends a cake', `${CAKE_DAYS} day (a Rough meal)`],
  ]) + `\n\nA meal already running is never shortened. **The guests:** every spouse on the farm, then her ${WEDDING_FRIENDS} closest friends on the farm (by bond); they have no lines. **The places:** her bible’s \`wedding.places\`, else her wedding beat’s place and ${WEDDING_DEFAULTS.map((p) => `\`${p}\``).join(', ')}, three different. **Household milestones** at ${HOUSEHOLD_AT.join(', ')} married.`
}

// --- Married life --------------------------------------------------------------------------------------------
/** The homestead's houses, rooms, prices and what opens each. */
function housesBlock(): string {
  const rows = HOMESTEAD_PLACES.map((p) => p.n === 0
    ? ['The Farmhouse', `${HOUSE_ROOMS} (your own home)`, '—', '—', 'Day 1']
    : [`House ${p.n}`, `${HOUSE_ROOMS}, or ${EXTENDED_ROOMS} extended`, g(HOUSE_COSTS[p.n - 1]!), g(EXTENSION_COSTS[p.n - 1]!), `The ${ORDINAL[p.n]} wedding${p.n > 1 ? `, House ${p.n - 1} built` : ''}`])
  const sum = (list: readonly number[]) => list.reduce((a, b) => a + b, 0)
  return table(['', 'Rooms', 'Build', 'Extend', 'Opens'], [...rows,
    ['**All**', `**${HOUSE_ROOMS + HOUSE_COSTS.length * EXTENDED_ROOMS} rooms**`, `**${g(sum(HOUSE_COSTS))}**`, `**${g(sum(HOUSE_COSTS) + sum(EXTENSION_COSTS))} extended**`, '']])
}
/** The homestead's rows on the map, after the yard, the town edge last. */
function homesteadMap(): string {
  const rows = [...new Set(HOMESTEAD_PLACES.map((p) => p.row))].map((row) => {
    const here = HOMESTEAD_PLACES.filter((p) => p.row === row)
    const married = HOMESTEAD_ROW_MARRIED[row - HOMESTEAD_PLACES[0]!.row] ?? 0
    return [`${row}`, here.map((p) => `${p.name} (\`${p.frame}\`)`).join(' · '), married === 0 ? 'Day 1' : `${married} married`]
  })
  const town = (row: number) => MAP_PLACES.filter((p) => p.row === row).map((p) => p.name).join(' · ')
  return table(['Row', 'Places', 'Shows from'], [...rows,
    ['After the last shown', `The town edge: ${town(TOWN_FIRST_ROW)}`, 'Day 1'], ['Then', `The Town, in the middle: ${town(TOWN_FIRST_ROW + 1)}`, 'Day 1']])
}
/** The household milestones. */
function householdMilestonesBlock(): string {
  return table(['Married', 'Opens'], [
    ['1', 'The homestead (House 1 to build); the night’s house (Sleep at); anniversaries'],
    ['5', 'Household scene 1; the furniture set (five pieces); +5% items crew-wide'],
    ['10', 'Household scene 2; two evenings every fourth day; two invitations a morning'],
    ['15', 'Household scene 3; +5% more items crew-wide'],
    [`${FINALE_MARRIED}`, 'The finale, the Great Harvest; then the Festival of Vows each year'],
  ])
}
/** The house's morning, and the Festival of Vows. */
function houseMorningBlock(): string {
  return table(['', 'The morning of the house you slept in'], [
    ['Each resident', `+${HOUSE_POINTS} to her spouse bar (\`addLove\`, an anniversary’s ×2 applies)`],
    ['A resident at S1+', 'Her breakfast: everyone on the farm with no meal left well fed one day, once; +5 bond a pair it feeds'],
    ['Each resident at S2+', `One more morning item of her line, ★3+ (\`lineGood\`, n = ${HOUSE_ITEM_N}), in her own item line`],
    ['A house line', 'One resident’s line from the pack’s `houseLines`, else her temperament’s template'],
    ['Her birthday alone', 'Her room: only her +30, breakfast and item'],
    [`Not slept in for ${MISSES_NIGHTS} nights`, '“Rose Cottage misses you”, with Tonight › and Another night; never a penalty'],
    ['Shared houses', 'Every night, +10 bond to each pair of residents (step 6)'],
    ['The Festival of Vows', `The finale’s day, each later year: every spouse +${VOWS_POINTS}, and a festival night`],
  ])
}
/** The house lines' templates by temperament, for an Uma the pack writes none for. */
function houseLines(): string {
  return table(['Temperament', 'House lines (`{name}` hers)'], TEMPERAMENTS.map((t) => [t[0]!.toUpperCase() + t.slice(1), HOUSE_TEMPLATES[t].join('<br>')]))
}
/** The furniture set's five pieces. */
function furnitureBlock(): string {
  return FURNITURE.map((f, i) => `${i + 1}. ${f}`).join('\n')
}

export function renderBlock(key: string): string | null {
  const blocks_: Record<string, () => string> = { 'farm-ranks': farmRanks,
    'meet-kinds': meetKinds, 'arrival-pay': arrivalPay, placeholders: placeholdersBlock, 'placeholder-moments': placeholderMoments, 'stand-in': standIn, 'farmer-name': farmerName,
    'route-costs': routeCosts, 'love-points': lovePoints, 'gift-stars': giftStarsBlock, 'birthday-map': birthdayMap, 'ready-rules': readyRules,
    'ready-waits': readyWaits, 'default-chapters': defaultChapters, 'chapter-gates': chapterGates, 'ladder-colours': ladderColours, 'hearts-factor': heartsFactor, 'perk-words': perkWordsBlock,
    'perk-effects': perkEffects, 'perk-lines': perkLines, 'perk-caps': perkCaps, 'signature-dish': signatureDishes,
    'bond-points': bondPoints, 'bond-hearts': bondHeartsBlock, 'tie-seeds': tieSeeds, 'side-by-side': sideBySide,
    plays: playsBlock, 'play-map': playMap, 'play-grades': playGrades, 'play-windows': playWindows, 'event-pay': eventPay, 'stand-in-route': standInRoute,
    'evening-kinds': eveningKinds, 'evening-points': eveningPointsBlock, 'evening-slots': eveningSlotsBlock,
    rings: ringsBlock, 'bench-recipe': benchRecipe, reception: receptionBlock, 'bench-scene': benchScene,
    'outfit-rules': outfitRules, 'outfit-ids': outfitIds, expressions: expressionsBlock,
    houses: housesBlock, 'homestead-map': homesteadMap, 'household-milestones': householdMilestonesBlock, 'house-morning': houseMorningBlock, 'house-lines': houseLines,
    furniture: furnitureBlock,
    calendar, night, 'farm-map': farmMap, 'price-ladder': priceLadder, 'goods-prices': goodsPrices, 'crop-prices': cropPrices, demand, 'star-prices': starPrices,
    crops, 'shop-seeds': shopSeeds, field: fieldBlock, 'harvest-stars': harvestStars, 'crop-levels': cropLevels, 'farming-challenges': farmingChallenges,
    actions: actionsBlock, 'day-budget': dayBudgetBlock,
    'talent-stats': talentStats, 'talent-cutoffs': talentCutoffs, 'talent-gives': talentGives, 'rank-points': rankPoints, challenges, 'rank-gives': rankGives,
    'place-activity': placeActivity, 'forest-areas': forestAreas, 'fishing-spots': fishingSpots, 'fish-sizes': fishSizes, 'farmer-hauls': farmerHauls,
    stations, 'station-recipes': stationRecipes,
    'dorm-levels': dormLevels,
    'farm-rank-points': farmRankPoints, 'farm-rank-opens': farmRankOpensBlock, milestones: milestonesBlock, 'diary-rows': diaryRows, builds: buildsBlock,
    'uma-milestones': umaMilestonesBlock, cast: castBlock, scenes: scenesBlock, 'town-spots': townSpots, 'town-draw': townDraw }
  return blocks_[key]?.() ?? null
}
