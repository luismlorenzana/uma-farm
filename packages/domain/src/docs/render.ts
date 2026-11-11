// Copied from uma-rpg packages/domain/src/docs/render.ts at 30a322a (F4, FM2, FW13); cuts in docs/technical/wilds-copy.md.
// The live docs' generated blocks (docs/game/, D92): every list in the manual is rendered here from the rules, so it can't
// drift from the game. A doc marks a block with `<!-- live:<key> -->` … `<!-- /live -->`; `pnpm docs:update` rewrites
// them, and `docs.test.ts` fails when one is stale. Pure: no I/O (the test reads and writes the files). uma-rpg's blocks
// for fights, classes, gear, Extra Stats, Laurels, prices, worlds, the Rift and achievements stay behind; the Wilds' own
// (their lines, items, made items, places, callings, jobs and Craft Levels) left with their pages in F24.
import { lineItems, MATERIAL_LINES, type MaterialLine } from '../items/lines'
import { MADE_IDENTITIES, MADE_LINES, type MadeLine } from '../items/made-id'
import { madeRecipeV4 } from '../items/made-v4'
import { BEDS, FARM_RANK_POINTS } from '../farm/farm'
import { ACTIVITIES, ACTIVITY_NAMES, CRAFT_BANDS, craftRank, LINE_ACTIVITY, RANK_POINTS, RANKS, type Rank } from '../farm/ranks'
import { CROP_IDS, FAMILY_NAMES, GOOD_FAMILIES, GOODS, goodOf, isGoodId, refinedOf, type GoodFamily } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { inDemand, priceOf, STARS, starFactor, starPrice } from '../goods/prices'
import { DEMAND, FAMILY_FACTOR, LADDER, REFINED_FACTOR, type LadderFamily } from '../goods/rule'
import { refundOf } from '../save/migrate-v3'
import { DAYS_PER_SEASON, farmDay, FESTIVALS, SEASON_NAMES, SEASONS } from '../farm/calendar'
import { FARM_MAP_ROWS, FARM_PLACES, type PlaceOpens } from '../farm/places'
import { NIGHT_STEPS } from '../night/end-day'
import { CROPS, nightsToReady, SHOP_SEEDS } from '../fields/crops'
import { BLOCK_RULES, cropLevelStart, harvestQuality, MAX_CROP_LEVEL, seedsBackChance, tendedGrowth, UNTENDED_GROWTH } from '../fields/fields'
import {
  ACTIVITY_STAT, EXPEDITION_CUTOFFS, STAT_CUTOFFS, STAT_TEMPERAMENT, TALENT_D, TALENT_GRADES, TEMPERAMENTS, TALENT_RANK_POINTS, TALENT_STATS, TALENT_YIELD, talentAffection,
  talentGrowth, talentPower, talentQuality, type TalentStep,
} from '../farm/talents'
import {
  CHALLENGES, daysToRank, PLACE_ACTIVITY, RANK_BENEFITS, rankPointsForDay,
} from '../farm/rank-rules'
import { AREA_NAMES, FISHING_SPOTS, FOREST_AREAS, SPOT_NAMES, STATION_JOB_IDS, STATION_JOBS, stationJobOf, STATIONS, type FishingSpotId, type ForestAreaId, type StationId } from '../gathering/ids'
import { gatherQuality, haulCount, sizeSkill, stationRate, type GatherPlace, type WorkTerms } from '../gathering/kinds'
import { FISH_SIZES, FISHERY, FOREST, HAUL_BASE, STATION_JOB_RULES, STATION_RULES, TOOL_YIELD, WELL_FED_YIELD } from '../gathering/tables'
import { farmPlace } from '../farm/places'
import { starShares } from '../goods/stars'
import { BLOCK_IDS, pairKey } from '../save/v3'
import { DORM_LEVELS } from '../farm/dorm'
import { CHAT_POINTS, GATE_EVERY, GIFT_POINTS, giftTaste, STAY_AFFINITY, TASTES, VISITOR_DAYS } from '../farm/visitors'
import { START_NEEDS, START_SHEET } from '../farm/start'
import { farmRankOpens } from '../farm/diary'
import { CHAPTER_POINTS, DIARY_ROWS, ENTRY_POINTS, GOLD_PER_POINT, MILESTONE_POINTS, MILESTONES, ROW_GOLD, type Milestone } from '../farm/milestones'
import { CAST, CAST_IDS } from '../story/cast'
import { CHAPTER_1_GOALS, CHAPTERS } from '../story/chapters'
import { CLOSING_SCENE, HELLO_LINES, OPENING_SCENE, type Beat } from '../story/chapter-1'
import { ARRIVAL_DORM_LEVELS, DORM_LEVELS_V4 } from '../farm/dorm'
import { NIGHT_STEPS_V4, type NightStepDef } from '../night/end-day'
import { ARRIVAL_KINDS } from '../romance/arrivals'
import { ARRIVAL_POINTS, CHOICE_BEST, CHOICE_OTHER, costOf, LADDER_COLOURS, ROUTE_POINTS, SPOUSE_COST } from '../romance/love'
import { DISLIKED_LINE, GIFT_POINTS_V4, giftStars, LOVE_POINTS } from '../romance/acts'
import { farmBirthday } from '../romance/days'
import { READY_CONDITIONS, WAIT_ORDER } from '../romance/ready'
import { lineChapter, MORNING_GOOD, NIGHT_CHORE, PERK_LINES, PERK_PLACE, PERKS, perkWords, type PerkLine } from '../romance/perks'
import { loveRankFactor } from '../farm/rank-rules'
import { dateOf } from '../farm/calendar'
import { FARMER_NAME_MAX } from '../romance/farmer'
import { OPENING_SCENE_V4 } from '../story/opening-v4'
import { favouriteOf, storyPackFrom } from '../story/pack'
import { BOND_HEARTS, BOND_POINTS, bondHearts, CLOSEST_BOND, SHARED_LINE, SIDE_BY_SIDE, SIDE_BY_SIDE_HEARTS, TIE_SEEDS } from '../farm/bonds'
import { STAND_IN_FILES } from '../story/stand-in'

type Cell = string | number
/** A Markdown table; pipes in cells are escaped. */
function table(head: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const cell = (v: Cell) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n')
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// --- The lines' names (the migration's refunds and the gifts' likes) ------------------------------------------------

const LINE_NAME: Readonly<Record<MaterialLine, string>> = { metal: 'Metal', wood: 'Wood', vegetables: 'Vegetables', fish: 'Fish', stone: 'Stone' }
const MADE_LINE_NAME: Readonly<Record<MadeLine, string>> = { 'weapon-gem': 'Arms Gems', 'tome-ink': 'Tome Ink', 'armor-fittings': 'Armor Fittings',
  'accessory-setting': 'Accessory Settings', 'jewel-planet': 'Planet Jewels', 'jewel-moon': 'Moon Jewels' }
// --- Save v3 and the migration (F17) --------------------------------------------------------------------------------

/** CS32: Craft Level → her rank in her calling's activity, with the points it starts at. */
function craftRanks(): string {
  const lines = MATERIAL_LINES.map((line) => `${LINE_NAME[line]} → ${ACTIVITY_NAMES[LINE_ACTIVITY[line]].toLowerCase()}`).join(', ')
  const rows = CRAFT_BANDS.map((band, i) => {
    const to = (CRAFT_BANDS[i + 1]?.from ?? 51) - 1
    const start = band.points === 0 ? '' : `${band.points.toLocaleString('en-US')} + `
    const points = band.perLevel === 0 ? band.points.toLocaleString('en-US') : `${start}${band.perLevel} a level above ${band.from} (Lv ${to}: ${craftRank(to).points.toLocaleString('en-US')})`
    return [`${band.from}–${to}`, RANKS[band.rank]!, points]
  })
  return `${table(['Craft Level', 'Rank', 'Points set to'], rows)}

Her calling's line names the activity: ${lines}. Every challenge up to the rank counts as done; her other eight activities start at Novice, 0 points.`
}
/** D28: what each v2 item that leaves the game is refunded, by kind and grade. */
function refunds(): string {
  const leaving = [
    ...MATERIAL_LINES.flatMap((line) => [false, true].map((refined) => ({ name: `${LINE_NAME[line]}, ${refined ? 'refined' : 'raw'}`, ids: lineItems(line, refined).map((m) => m.id) }))),
    ...MADE_LINES.map((line) => ({ name: MADE_LINE_NAME[line], ids: MADE_IDENTITIES.filter((m) => m.line === line).sort((a, b) => a.grade - b.grade).map((m) => m.id) })),
  ].filter((group) => group.ids.every((id) => !isGoodId(id)))
  return `${table(['Leaves the game', 'Refund each, by grade', 'Rule'], leaving.map((group) => {
    const made = MADE_IDENTITIES.find((m) => m.id === group.ids[0])
    const rule = made ? `15g × grade × ${madeRecipeV4(made.id)[Object.keys(madeRecipeV4(made.id))[0]!]} refined` : '15g × grade'
    return [group.name, group.ids.map((id) => `${refundOf(id).toLocaleString('en-US')}g`).join(' · '), rule]
  }))}

Everything else in a v2 Warehouse (ores and ingots, logs and planks, fish and fillets, crystals and cut crystals, raw vegetables) is still a good, and carries over at ★1.`
}
/** CS34's beds by Dorm level, and CS39's Farm Rank thresholds. */
function beds(): string {
  return table(['Dorm level', ...BEDS.map((_, i) => String(i + 1))], [['Beds', ...BEDS]])
}
function farmRanks(): string {
  return table(['Farm Rank', ...FARM_RANK_POINTS.map((_, i) => String(i + 1))], [['Points', ...FARM_RANK_POINTS.map((p) => p.toLocaleString('en-US'))]])
}

// --- The calendar, the night and the farm map (F18) -----------------------------------------------------------------

/** CS4: the seasons of year 1 and their festivals. */
function calendar(): string {
  return table(['Season', 'Days (year 1)', 'Festival'], SEASONS.map((season, i) => [
    SEASON_NAMES[season], `${i * DAYS_PER_SEASON + 1}–${(i + 1) * DAYS_PER_SEASON}`,
    FESTIVALS.filter((f) => f.season === season).map((f) => `${f.name}, ${SEASON_NAMES[season]} ${f.day} (day ${farmDay({ year: 1, season, day: f.day })})`).join('; '),
  ]))
}
/** CS7: the night's steps, their functions and who fills them. */
function night(): string {
  return table(['Step', 'Function', 'What happens', 'Filled by'], NIGHT_STEPS.map((s) => [s.step, `\`${s.name}\``, s.what, s.by]))
}
const opensWords = (opens: PlaceOpens): string =>
  opens.by === 'start' ? 'Day 1' : opens.by === 'chapter' ? `Chapter ${opens.chapter}` : opens.by === 'reward' ? `Chapter ${opens.chapter}'s reward`
    : opens.by === 'farm-rank' ? `Farm Rank ${opens.rank}` : 'M6'
/** FC28: the map's eight rows, and each place's building and what opens it. */
function farmMap(): string {
  const rows = Array.from({ length: FARM_MAP_ROWS }, (_, r) => {
    const row = FARM_PLACES.filter((p) => p.row === r + 1)
    return [r + 1, ...[0, 1, 2].map((c) => row.find((p) => p.col === c)?.name ?? '—')]
  })
  return `${table(['Row', 'Left', 'Centre', 'Right'], rows)}

${table(['Place', 'Building (uma-art)', 'Opens'], FARM_PLACES.map((p) => [p.name, `\`${p.frame}\`${p.borrowed ? ' (borrowed)' : ''}`, opensWords(p.opens)]))}`
}

// --- Goods and prices (F19) -----------------------------------------------------------------------------------------

/** Where each family comes from (CS9's table). */
const FAMILY_FROM: Readonly<Record<GoodFamily, string>> = {
  grains: 'The Fields', vegetables: 'The Fields', 'herbs-spices': 'The forest, some crops', 'nuts-seeds': 'The forest (Autumn), two crops',
  sweets: 'The forest (Spring), Sugar Beet', fruits: 'The forest (Summer)', mushrooms: 'The forest', woods: 'The forest', ores: 'The Mine',
  stones: 'The Quarry', crystals: 'The Quarry', fish: 'The Fishery', 'hides-scales': 'Expeditions', 'bones-horns': 'Expeditions', essences: 'Expeditions',
}
const g = (gold: number): string => `${gold.toLocaleString('en-US')}g`
/** A day of each season, year 1, for the demand columns. */
const SEASON_DAY = Object.fromEntries(SEASONS.map((season) => [season, farmDay({ year: 1, season, day: 1 })])) as Record<(typeof SEASONS)[number], number>

/** CS9: the ladder, and each family's factor and where it comes from. */
function priceLadder(): string {
  return `${table(['Grade', ...LADDER.map((_, i) => `G${i + 1}`)], [['The ladder', ...LADDER.map(g)]])}

${table(['Family', 'Factor', 'Where from', 'Raw G1 → G10, ★1', 'Refined'], GOOD_FAMILIES.map((family) => {
    const factor = family in FAMILY_FACTOR ? `×${FAMILY_FACTOR[family as LadderFamily].toFixed(1)}` : 'Crops (CS11)'
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
    return `### ${FAMILY_NAMES[family]}\n\n${table(head, rows)}`
  }).join('\n\n')
}

/** CS11: the crops' own prices, their refined forms and the season their family is in demand. */
function cropPrices(): string {
  const demanded = (id: string) => SEASONS.filter((season) => inDemand(id, SEASON_DAY[season])).map((season) => SEASON_NAMES[season]).join(', ') || '—'
  return table(['Crop', 'Id', 'Family', 'Price ★1', 'Refined', 'Its price ★1', 'In demand'], CROP_IDS.map((crop) => {
    const good = goodOf(crop)!
    const into = refinedOf(crop)
    return [itemNameOf(crop), `\`${crop}\``, FAMILY_NAMES[good.family], g(good.price), into ? itemNameOf(into) : '—', into ? g(goodOf(into)!.price) : '—', demanded(crop)]
  }))
}

/** CS4: each season's demand, and how many of the catalogue's goods it lifts. */
function demand(): string {
  return table(['Season', 'In demand (+20%)', 'Goods lifted'], SEASONS.map((season) => {
    const lifted = GOODS.filter((good) => inDemand(good.id, SEASON_DAY[season])).length
    const rules = DEMAND[season].map((rule) => `${rule.name}${rule.refined ? ' (the refined row)' : ''}`).join(', ')
    return [SEASON_NAMES[season], rules, `${lifted} of ${GOODS.length}`]
  }))
}

/** CS9 rule 5: the stars' factors, worked on two goods. */
function starPrices(): string {
  const summer = SEASON_DAY.summer
  return table(['Stars', 'Factor', 'Silver Ingot', 'Salmon, Summer (in demand)', 'Carrot, Summer'], STARS.map((stars) => [
    `★${stars}`, `×${starFactor(stars)}`, g(priceOf('silver-ingot', stars, summer)), g(priceOf('salmon', stars, summer)), g(priceOf('carrot', stars, summer)),
  ]))
}

// --- The Fields (F20) -----------------------------------------------------------------------------------------------

const STATION_NAME = { mill: 'Mill', sawmill: 'Sawmill' } as const
const seasonsOf = (seasons: readonly (typeof SEASONS)[number][]) => seasons.map((season) => SEASON_NAMES[season]).join(', ')
const tierWords = (tier: number | 'rare') => (tier === 'rare' ? 'Rare' : `FR${tier}`)
const per = (n: number) => Number(n.toFixed(4)).toString()
const pct = (n: number) => `${Math.round(n * 100)}%`

/** CS11: every crop, its seasons, its shop tier and seed price, its days untended · Novice · Expert (derived by CS12's
 * rule), its yield, regrowth, price ★1 and its station. */
function crops(): string {
  return table(['Crop', 'Id', 'Seasons', 'Shop', 'Seed', 'Days: untended · Novice · Expert', 'Yield', 'Regrows', 'Price ★1', 'Refined at'],
    Object.values(CROPS).map((c) => {
      const days = [UNTENDED_GROWTH, tendedGrowth(0, TALENT_D), tendedGrowth(3, TALENT_D)].map((g) => nightsToReady(c.id, g)).join(' · ')
      const into = refinedOf(c.id)
      return [itemNameOf(c.id), `\`${c.id}\``, seasonsOf(c.seasons), tierWords(c.tier), c.seed === null ? '—' : g(c.seed), days, c.yield,
        c.regrows === null ? '—' : `every ${c.regrows}`, g(goodOf(c.id)!.price), into && c.station ? `${itemNameOf(into)} (${STATION_NAME[c.station]})` : '—']
    }))
}

/** CS4: the shop's seeds by season and tier, with their prices. */
function shopSeeds(): string {
  const tiers = [1, 2, 4] as const
  return table(['Season', ...tiers.map((t) => `Farm Rank ${t}`)], SEASONS.map((season) => [SEASON_NAMES[season],
    ...tiers.map((t) => SHOP_SEEDS[season].filter((id) => CROPS[id].tier === t).map((id) => `${itemNameOf(id)} ${g(CROPS[id].seed!)}`).join(', '))]))
}

/** CS12: the four blocks. */
function blocks(): string {
  return table(['Block', 'Plots', 'Opens at', 'Costs'], BLOCK_IDS.map((id) => {
    const rule = BLOCK_RULES[id]
    return [id, 9, rule.opens.by === 'farm-rank' ? `Farm Rank ${rule.opens.rank}` : 'Day 1', rule.cost === 0 ? '—' : g(rule.cost)]
  }))
}

/** CS12, CS26, CS28, CS31: a block's growth a night, its harvest's quality and stars, and seeds back, untended and by
 * the tender's rank and talent (Basic tools, not well fed, crop level 1). */
function tending(): string {
  const talents: readonly [string, TalentStep][] = [['G', 0], ['D', 3], ['C', 4], ['B', 5], ['A', 6], ['S', 7]]
  const stars = (q: number) => starShares(q).flatMap((share, i) => (share > 0 ? [`★${i + 1} ${pct(share)}`] : [])).join(', ')
  const rows = [
    ['Untended', ...talents.map(() => per(UNTENDED_GROWTH)), stars(harvestQuality(null, 1)), pct(seedsBackChance(null))],
    ...RANKS.map((name, r) => [name, ...talents.map(([, step]) => per(tendedGrowth(r as Rank, step))),
      stars(harvestQuality({ rank: r as Rank, talent: TALENT_D, wellFed: false }, 1)), pct(seedsBackChance(r as Rank))]),
  ]
  return table(['Tender', ...talents.map(([grade]) => `Growth, ${grade}`), 'Stars, a D tender', 'Seeds back'], rows)
}

/** CS11: crop levels, the points each starts at, and what it adds. */
function cropLevels(): string {
  const levels = Array.from({ length: MAX_CROP_LEVEL }, (_, i) => i + 1)
  return table(['Level', ...levels.map(String)], [
    ['Points', ...levels.map((l) => cropLevelStart(l).toLocaleString('en-US'))],
    ['Quality', ...levels.map((l) => `+${per(0.1 * (l - 1))}`)],
  ])
}

/** CS30: farming's challenges, toward each rank (F21's `CHALLENGES.farming`). */
function farmingChallenges(): string {
  return table(['Toward', 'Challenge', 'Counted'], CHALLENGES.farming.map((c) => [RANKS[c.rank], c.what, c.by === 'F20' ? 'At harvest, for the tender (F20)' : c.by]))
}

// --- Talents and ranks (F21) ----------------------------------------------------------------------------------------

const STAT_NAME = { speed: 'Speed', stamina: 'Stamina', power: 'Power', guts: 'Guts', wit: 'Wit' } as const
const signed = (n: number) => (n > 0 ? `+${per(n)}` : n < 0 ? `−${per(-n)}` : '0')
const times = (n: number) => `×${n.toFixed(2)}`
const STEPS = TALENT_GRADES.map((_, i) => i as TalentStep)

/** CS27: the stat each activity reads, and CS46's temperament from it. */
function talentStats(): string {
  const rows = TALENT_STATS.map((stat) => [STAT_NAME[stat], ACTIVITIES.filter((a) => a !== 'expeditions' && ACTIVITY_STAT[a] === stat).map((a) => ACTIVITY_NAMES[a]).join(', '),
    cap(STAT_TEMPERAMENT[stat])])
  return table(['Stat', 'Activities', 'Temperament (her top stat)'], [...rows, ['All five: the mean of her three best scores', ACTIVITY_NAMES.expeditions, '—']])
}

/** CS27: the cut-offs, the same for everyone. */
function talentCutoffs(): string {
  const grades = [...TALENT_GRADES].reverse()
  const row = (cuts: readonly number[]) => grades.map((_, i) => (i === grades.length - 1 ? `< ${cuts[0]}` : `≥ ${cuts[cuts.length - 1 - i]}`))
  return table(['Grade', ...grades], [['A stat’s score', ...row(STAT_CUTOFFS)], ['Expeditions (mean of best three)', ...row(EXPEDITION_CUTOFFS)]])
}

/** CS28: what a talent gives. */
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

/** CS29: each rank's points, and the days of work to reach it by talent (in her favourite line in brackets). */
function rankPoints(): string {
  const talents: readonly TalentStep[] = [0, 3, 4, 6, 7]
  const day = (talent: TalentStep, favourite: boolean) => rankPointsForDay({ talent, favourite, wellFed: false, heartsFactor: 1 })
  return table(['Rank', 'Points', ...talents.map((t) => TALENT_GRADES[t])], RANKS.map((name, r) => [name, RANK_POINTS[r]!.toLocaleString('en-US'),
    ...talents.map((t) => (r === 0 ? '—' : `${daysToRank(r as Rank, day(t, false))} (${daysToRank(r as Rank, day(t, true))})`))]))
}

/** CS30: every activity's five challenges. */
function challenges(): string {
  const counted = (a: (typeof ACTIVITIES)[number]) => [...new Set(CHALLENGES[a].map((c) => c.by))].join(', ')
  return table(['Activity', ...RANKS.slice(1), 'Counted by'], ACTIVITIES.map((a) => [ACTIVITY_NAMES[a], ...CHALLENGES[a].map((c) => c.what), counted(a)]))
}

/** CS31: what each rank gives. */
function rankGives(): string {
  return table(['Rank', 'Yield', 'Tended growth', 'Quality', 'Deepest: Mine and Quarry · forest · Fishery', 'Expedition power', 'Seeds back', 'Affection a day', 'Workshop yield'],
    RANK_BENEFITS.map((b, r) => [RANKS[r]!, `×${per(b.yield)}`, per(b.tendedGrowth), `+${per(b.quality)}`,
      `Floor ${b.deepest.floor} · ${cap(AREA_NAMES[b.deepest.forest])} · ${cap(SPOT_NAMES[b.deepest.fishery])}`, b.expeditionPower, pct(b.seedsBack), `+${b.affection}`, `×${per(b.workshopYield)}`]))
}

/** Decision 2: the activity a day at each place pays. */
function placeActivity(): string {
  const places = Object.entries(PLACE_ACTIVITY).map(([place, activity]) => [farmPlace(place)?.name ?? place, ACTIVITY_NAMES[activity]])
  return table(['Where she worked', 'Pays rank points in'], [['The Fields, tending a block with a growing plot', ACTIVITY_NAMES.farming], ...places])
}

// --- The forest, the Fishery and the stations (F22) ---------------------------------------------------------------------

const SEASON_COLS = SEASONS.map((s) => SEASON_NAMES[s])
const shareCell = (shares: readonly (readonly [string, number])[]) => shares.map(([id, p]) => `${itemNameOf(id)} ${p}%`).join(', ')
const TALENT_COLS: readonly TalentStep[] = [3, 4, 7]
const basic = (rank: number, talent: TalentStep, wellFed = 0): WorkTerms => ({ rank: rank as Rank, talent, tool: 1, wellFed })

/** CS16: the six areas, what opens each, its grades, and each season's goods with their shares. */
function forestAreas(): string {
  return table(['Area', 'Id', 'Opens at', 'Grades', ...SEASON_COLS], FOREST_AREAS.map((id) => {
    const area = FOREST[id]
    return [cap(AREA_NAMES[id]), `\`${id}\``, RANKS[area.opens]!, `G${area.grades.join('–G')}`, ...SEASONS.map((s) => shareCell(area.seasons[s]))]
  }))
}

/** CS15: the seven spots, what opens each, and each season's fish with their shares. */
function fishingSpots(): string {
  return table(['Spot', 'Id', 'Opens at', ...SEASON_COLS], FISHING_SPOTS.map((id) => {
    const spot = FISHERY[id]
    const opens = [RANKS[spot.opens]!, ...(spot.chapter ? [`chapter ${spot.chapter}`] : []), ...(spot.boat ? ['the boat'] : [])].join(' + ')
    return [cap(SPOT_NAMES[id]), `\`${id}\``, opens, ...SEASONS.map((s) => shareCell(spot.seasons[s]))]
  }))
}

/** CS15: each fish's size range, its price and its fillet. */
function fishSizes(): string {
  return table(['Fish', 'Id', 'Size', 'Price ★1', 'At the Smokehouse', 'Price ★1'], Object.entries(FISH_SIZES).map(([id, [min, max]]) => {
    const fillet = refinedOf(id)!
    return [itemNameOf(id), `\`${id}\``, `${min}–${max} cm`, g(starPrice(id, 1)), itemNameOf(fillet), g(starPrice(fillet, 1))]
  }))
}

/** CS15: how her skill leans the catch big: k by rank at talents D, C and S with the Basic Rod, and the average share of
 * the range `1 / (8/k + 1)`. */
function sizeSkills(): string {
  return table(['Rank', ...TALENT_COLS.map((t) => `k at ${TALENT_GRADES[t]}`), 'Average at C', 'A Carp at C, on average'], RANKS.map((name, r) => {
    const k = (t: TalentStep) => sizeSkill(basic(r, t))
    const mean = 1 / (8 / k(4) + 1)
    return [name, ...TALENT_COLS.map((t) => per(k(t))), pct(mean), `${(20 + 40 * mean).toFixed(1)} cm`]
  }))
}

/** CS17: items a day, Basic tool, by rank at talents D, C and S; well fed ×1.25. */
function haulDay(): string {
  const cells = (place: GatherPlace, r: number) => TALENT_COLS.map((t) => haulCount(place, basic(r, t)))
  return table(['Rank', 'Yield', ...TALENT_COLS.map((t) => `Forest ${TALENT_GRADES[t]}`), ...TALENT_COLS.map((t) => `Fishery ${TALENT_GRADES[t]}`), 'Forest C, well fed'],
    RANKS.map((name, r) => [name, `×${per(RANK_BENEFITS[r]!.yield)}`, ...cells('forest', r), ...cells('fishery', r), haulCount('forest', basic(r, 4, 1))]))
}

/** CS17's factors. */
function haulFactors(): string {
  return table(['Factor', 'Values'], [
    ['Base, at Novice', `The forest ${HAUL_BASE.forest}, the Fishery ${HAUL_BASE.fishery}`],
    ['Rank', RANK_BENEFITS.map((b) => `×${per(b.yield)}`).join(' · ')],
    ['Talent, G → S', TALENT_YIELD.map((y) => `×${per(y)}`).join(' · ')],
    ['Tool (the Axe, the Rod), Basic → Mythril', TOOL_YIELD.map((y) => `×${per(y)}`).join(' · ')],
    ['Well fed', `×${per(WELL_FED_YIELD)}`],
  ])
}

/** CS26: a gathered good's quality points by rank at talents D, C and S, Basic tool, and its stars at C. */
function gatherQualities(): string {
  const shares = (q: number) => starShares(q).flatMap((s, i) => (s > 0 ? [`★${i + 1} ${pct(s)}`] : [])).join(', ')
  return table(['Rank', ...TALENT_COLS.map((t) => `Q at ${TALENT_GRADES[t]}`), 'Stars at C', 'Stars at C, well fed'], RANKS.map((name, r) => [
    name, ...TALENT_COLS.map((t) => per(gatherQuality(basic(r, t), false))), shares(gatherQuality(basic(r, 4), false)), shares(gatherQuality(basic(r, 4), true)),
  ]))
}

/** CS18: the three stations M4 opens. */
function stations(): string {
  const opens = (s: StationId) => {
    const rule = STATION_RULES[s].opens
    return rule.by === 'plans' ? 'Its plans: chapter 1’s reward (F24)' : `Farm Rank ${rule.rank}`
  }
  return table(['Station', 'At', 'Rank used', 'Builds for', 'Opens', 'Jobs'], STATIONS.map((s) => {
    const jobs = STATION_JOB_IDS.filter((j) => STATION_JOBS[j].station === s)
      .map((j) => `${STATION_JOB_RULES[j].name} (${STATION_JOB_RULES[j].days === 1 ? '1 day' : `${STATION_JOB_RULES[j].days} days`}): ${STATION_JOBS[j].families.map((f) => FAMILY_NAMES[f].toLowerCase()).join(', ')}`)
    const place = Object.entries(PLACE_ACTIVITY).find(([p]) => p === s)!
    return [farmPlace(s)!.name, farmPlace({ mill: 'fields', sawmill: 'forest', smokehouse: 'fishery' }[s])!.name, ACTIVITY_NAMES[place[1]], g(STATION_RULES[s].cost), opens(s), jobs.join(' · ')]
  }))
}

/** CS18: items a station turns a day, by rank at talents D, C and S; well fed ×1.25 on a 1-day job. */
function stationDay(): string {
  return table(['Rank', ...TALENT_COLS.map((t) => `${TALENT_GRADES[t]}`), 'C, well fed'], RANKS.map((name, r) => [
    name, ...TALENT_COLS.map((t) => stationRate(basic(r, t), 0, false)), stationRate(basic(r, 4, 1), 0, false),
  ]))
}

/** CS18: every station job's input → output, with both prices ★1. */
function stationRecipes(): string {
  return STATION_JOB_IDS.map((job) => {
    const rows = GOODS.filter((good) => good.refined && stationJobOf(good.id) === job)
      .map((good) => [`G${good.grade}`, itemNameOf(good.input!), g(starPrice(good.input!, 1)), itemNameOf(good.id), g(starPrice(good.id, 1))])
    return `### ${STATION_JOB_RULES[job].name} (${farmPlace(STATION_JOBS[job].station)!.name})\n\n${table(['Grade', 'In', '★1', 'Out', '★1'], rows)}`
  }).join('\n\n')
}

// --- The roster (F23) -----------------------------------------------------------------------------------------------

/** CS34: the Dorm's ten levels, their beds, costs and Farm Ranks. */
function dormLevels(): string {
  let total = 0
  return table(['Level', 'Beds', 'Costs', 'Farm Rank', 'Cumulative'], DORM_LEVELS.map((l) => {
    total += l.cost
    return [l.level, l.beds, l.cost ? g(l.cost) : '—', l.farmRank || '—', g(total)]
  }))
}
/** CS35: the ways an Uma joins, as built (decisions 5, 6, 10). */
function rosterWays(): string {
  const days = [1, 2, 3].map((n) => n * GATE_EVERY).join(', ')
  return table(['Way', 'Who', 'When she joins'], [
    ['The start (CS2)', `${START_SHEET} candidates, a C or better in ${START_NEEDS.map((a) => ACTIVITY_NAMES[a].toLowerCase()).join(', ')} among them; one free redraw`, 'You pick 3 (3 − the Umas a migrated save brings)'],
    ['The Gate', `While a bed is free and no visitor waits, one stops by every ${GATE_EVERY}th morning (days ${days} …), drawn from the release's outfits not on the roster and not waiting`,
      `At ${STAY_AFFINITY} affinity (2 hearts), the moment a chat or a gift reaches it. She waits ${VISITOR_DAYS} days, then leaves; she may come again`],
    ['Chapters', 'Each chapter\'s end: drawn C or better in the open activity whose best rank on the roster is lowest, then whose best talent is', 'At once (F24 calls it)'],
    ['Festivals, requests, expeditions', 'M5 and M6', '—'],
  ])
}
/** CS45: affinity's acts and their limits. */
function affinityActs(): string {
  return table(['Act', 'Points', 'Limit'], [
    ['Chat (tap her)', `+${CHAT_POINTS}`, 'Once a day each'],
    ['Gift (one good, its stars your choice)', TASTES.map((t) => `${cap(t)} ${signed(GIFT_POINTS[t])}`).join(', '), 'One a day each'],
    ['Praise', '+20', 'M6 (F34)'],
  ])
}
const LINES: readonly MaterialLine[] = ['metal', 'stone', 'wood', 'fish', 'vegetables']
/** Decision 8: what each favourite line likes and dislikes as a gift, counted from the rule over the goods. */
function giftLikes(): string {
  const byFamily = (line: MaterialLine, taste: 'liked' | 'disliked') => {
    const counts = new Map<GoodFamily, { raw: number; refined: number }>()
    for (const good of GOODS) {
      if (giftTaste(good.id, line) !== taste) continue
      const c = counts.get(good.family) ?? { raw: 0, refined: 0 }
      if (good.refined) c.refined++
      else c.raw++
      counts.set(good.family, c)
    }
    return [...counts].map(([f, c]) => `${FAMILY_NAMES[f]} (${c.raw && c.refined ? `${c.raw} raw, ${c.refined} refined` : c.raw ? `${c.raw} raw` : `${c.refined} refined`})`).join('; ') || '—'
  }
  return table(['Favourite line', 'Likes (+30)', 'Dislikes (−20)'], LINES.map((line) => [LINE_NAME[line], byFamily(line, 'liked'), byFamily(line, 'disliked')]))
}

// --- Farm Rank and chapter 1 (F24) ----------------------------------------------------------------------------------

/** CS39's point values (decision 1). */
function farmRankPoints(): string {
  return table(['Source', 'Points', 'In M4'], [
    ['Gold shipped at the bin', `1 per ${GOLD_PER_POINT}g`, 'Yes: `farm.counts[\'gold-shipped\']`'],
    ['A Diary entry: a good shipped once', ENTRY_POINTS, 'Yes: `diary.shipped`'],
    ['A milestone', MILESTONE_POINTS, 'Yes: `diary.milestones`'],
    ['A chapter done', CHAPTER_POINTS, 'Yes: `farm.chapter` − 1'],
    ['A festival\'s 1st / 2nd / 3rd', '150 / 75 / 25', 'M6'],
    ['Decorations', '1 per 100g', 'M6'],
  ])
}
/** Each Farm Rank's threshold and what it opens in the game as built (decision 8), from the rules that gate on it. */
function farmRankOpensBlock(): string {
  return table(['Farm Rank', 'Points', 'Opens'], FARM_RANK_POINTS.map((points, i) => [i + 1, points.toLocaleString('en-US'), i === 0 ? 'Block A, tier-1 seeds (the start); Dorm level 2' : farmRankOpens(i + 1).join(', ')]))
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
/** CS38's milestones as built (decision 2). */
function milestonesBlock(): string {
  return table(['Milestone', 'Id', 'Gold', 'Points'], MILESTONES.map((m) => [milestoneWhat(m), `\`${m.id}\``, g(m.gold), MILESTONE_POINTS]))
}
/** The collection rows (decision 3). */
function diaryRows(): string {
  return table(['Row', 'Id', 'Its ten goods', 'Gold'], DIARY_ROWS.map((r) => [`${FAMILY_NAMES[r.family]}${r.refined ? ', refined' : ''}`, `\`${r.id}\``, r.goods.map((id) => itemNameOf(id)).join(', '), g(ROW_GOLD)]))
}
/** Chapter 1's six goals (CS42, decision 4). */
function chapterOne(): string {
  const reads: Readonly<Record<string, string>> = {
    harvest: '`farm.counts[\'plots-harvested\']` since the chapter opened', ship: '`farm.counts[\'gold-shipped\']` since the chapter opened',
    'bring-home': '`farm.counts[\'home:forest\']` + `[\'home:fishery\']` since the chapter opened', 'second-crop': 'Kinds planted: entries in `crops`',
    'rank-hand': 'Any Uma at Hand or above, in any activity', 'farm-rank': 'The Farm Rank from `farm.points`',
  }
  return table(['#', 'Goal', 'Done at', 'Read from', 'Teaches'], CHAPTER_1_GOALS.map((goal, i) => [i + 1, goal.text, goal.id === 'ship' ? g(goal.need) : goal.need, reads[goal.id] ?? '', goal.teaches]))
}
/** The chapters as built. */
function chaptersBlock(): string {
  return table(['Chapter', 'Title', 'Opens with', 'Goals', 'Reward'], CHAPTERS.map((c) => [
    c.chapter, c.title, c.opens, c.goals ? c.goals.length : 'Soon (M5)',
    c.reward ? [`${g(c.reward.gold)}`, ...c.reward.plans.map((b) => `the ${cap(b)}'s plans (\`buildings.${b} = 0\`)`), ...(c.reward.recruit ? ['a recruit'] : []), `${CHAPTER_POINTS} Farm Rank points`].join(', ') : '—',
  ]))
}
/** The town's cast (CS41). */
function castBlock(): string {
  return table(['Who', 'Is', 'From chapter', 'Bust (F25)'], CAST_IDS.map((id) => [CAST[id].name, CAST[id].is, CAST[id].from, `\`${CAST[id].art}\``]))
}
const speakerWords = (beat: Beat): string => {
  switch (beat.speaker.kind) {
    case 'cast': return CAST[beat.speaker.id].name
    case 'first-hand': return `Your first hand #${beat.speaker.index + 1} (her hello)`
    case 'newest-hand': return 'Your newest hand'
    case 'narrator': return '(narration)'
  }
}
/** The two scenes, beat by beat (decision 6). */
function scenesBlock(): string {
  return [OPENING_SCENE, CLOSING_SCENE].map((scene) => `**${scene.title}** (\`${scene.id}\`)\n\n${table(['#', 'Who', 'Line'], scene.beats.map((b, i) => [i + 1, speakerWords(b), b.line || '—']))}`).join('\n\n')
}
/** The hello lines (decision 7). */
function helloLines(): string {
  return table(['Temperament', 'Her hello'], TEMPERAMENTS.map((t) => [cap(t), HELLO_LINES[t]]))
}

// --- The romance core's start (F46) ---------------------------------------------------------------------------------

/** RM5: the Dorm for 20, save v4's eight levels. */
function dormV4(): string {
  const levels = DORM_LEVELS_V4
  return table(['Level', ...levels.map((l) => String(l.level))], [
    ['Beds', ...levels.map((l) => l.beds)],
    ['Costs', ...levels.map((l) => (l.cost === 0 ? '—' : l.cost.toLocaleString('en-US')))],
    ['Farm Rank', ...levels.map((l) => (l.farmRank === 0 ? '—' : l.farmRank))],
    ['Brings', ...levels.map((l) => (ARRIVAL_DORM_LEVELS.includes(l.level) ? 'an arrival' : ''))],
  ])
}
/** RM4: the five kinds of arrival. */
function arrivals(): string {
  return table(['Arrival', 'When she arrives', 'Checked'], ARRIVAL_KINDS.map((a) => [`\`${a.kind}\``, a.when, a.where]))
}
/** Decision 10: what her arrival scene pays. */
function arrivalPay(): string {
  return table(['Her arrival scene', 'Points into her bar'], [
    ['Played or skipped to its end', `+${ARRIVAL_POINTS}`], ['Its choice: the option with the highest authored gain (each one tied at the top)', `+${CHOICE_BEST}`],
    ['Its choice: any other option', `+${CHOICE_OTHER}`],
  ])
}
/** RM9: "The Overgrown Farm", re-cut for v4. */
function openingV4(): string {
  return table(['#', 'Who', 'Line'], OPENING_SCENE_V4.beats.map((b, i) => [i + 1, speakerWords(b), b.line]))
}
/** F46 decision 8, F47: the steps v4 adds or changes from v3's. */
function nightV4(): string {
  const same = (s: NightStepDef) => NIGHT_STEPS.some((v3) => v3.name === s.name && v3.what === s.what)
  return table(['Step', 'Function', 'What happens', 'Filled by'], NIGHT_STEPS_V4.filter((s) => !same(s)).map((s) => [s.step, `\`${s.name}\``, s.what, s.by]))
}

// --- F47: the ladders and points (romance spec RM11–RM18, RM24) ---------------------------------------------------------
const whole = (n: number) => n.toLocaleString('en-US')
/** RM12: each heart's cost, the ladders' totals and the route's. */
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
/** RM13: what each act pays, built now or by a later packet. */
function lovePoints(): string {
  const gift = (['loved', 'liked', 'neutral', 'disliked'] as const).map((t) => `${cap(t)} ${GIFT_POINTS_V4[t] > 0 ? '+' : ''}${GIFT_POINTS_V4[t]}`).join(', ')
  return table(['Act', 'Points', 'Limit', 'Paid by'], [
    ['Chat (tap her)', `+${LOVE_POINTS.chat}`, 'Once a day each, home or away', '`chatV4`'],
    ['Gift (one good, its stars your choice)', `${gift}; × (1 + 0.1 a star above ★1)`, 'One a day each; ×3 on her birthday', '`giftV4`'],
    ['Praise (a ★3+ day’s work, a rank-up, a Fine play)', `+${LOVE_POINTS.praise}`, 'Once a day, when earned', '`praiseV4`'],
    ['Her line (she worked it today)', `+${LOVE_POINTS.line}`, 'Paid at night, step 6', '`payLines`'],
    ['A festival together (its team or entry)', `+${LOVE_POINTS.festival}`, 'Once a festival a year each', '`festivalTogether` (F39, F32 call it)'],
    ['Her arrival scene', `+${ARRIVAL_POINTS}, and its choice (+${CHOICE_OTHER} or +${CHOICE_BEST})`, 'Once', '`finishArrival` (F46)'],
    ['A heart event', '+50, its choices and its play’s grade', 'One of hers a day', 'F49'],
    ['The evening · an invitation said yes · a house morning', 'F50 · F50 · F54', '', ''],
    ['**On her anniversary**', '×2 on every act but the evening (×1.5 instead, F50)', 'From year 2 of her marriage', '`addLove`'],
  ])
}
/** RM15: a gift's points by her taste and its stars, then on her birthday. */
function giftStarsBlock(): string {
  const stars = [1, 2, 3, 4, 5]
  const tastes = ['loved', 'liked', 'neutral', 'disliked'] as const
  const pay = (t: typeof tastes[number], s: number, birthday: boolean) => Math.round(GIFT_POINTS_V4[t] * giftStars(s) * (birthday ? 3 : 1))
  return table(['Her taste', ...stars.map((n) => `★${n}`)], [
    ...tastes.map((t) => [cap(t), ...stars.map((n) => pay(t, n, false))]),
    ...(['loved', 'liked', 'neutral'] as const).map((t) => [`${cap(t)}, on her birthday (×3)`, ...stars.map((n) => pay(t, n, true))]),
  ]) + `\n\nA disliked gift pays 0 and she says one line: “${DISLIKED_LINE}”`
}
/** RM16: a real date's farm day. */
function birthdayMap(): string {
  const months = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2]
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const name = (m: number) => names[m - 1]!
  const at = (m: number, d: number) => { const date = dateOf(farmBirthday(m, d)); return `${SEASON_NAMES[date.season]} ${date.day}` }
  return table(['Month', 'Days 1–8', '9–16', '17–24', '25–31'], months.map((m) => [name(m), at(m, 1), at(m, 9), at(m, 17), at(m, 25)]))
}
/** RM24: the four conditions, and the order `readiness` says what waits. */
function readyRules(): string {
  return table(['#', 'Ready needs', 'Not met'], READY_CONDITIONS.map((c, i) => [i + 1, c.condition, c.unmet]))
}
function readyWaits(): string {
  return table(['Order', '`waits`', 'When'], WAIT_ORDER.map((w, i) => [i + 1, `\`${w.kind}\``, w.when]))
}
/** RM11: the bar's colour by ladder. */
function ladderColours(): string {
  return table(['Ladder', 'Stages', 'Bar'], [
    ['Friendship', 'F0–F10, and her confession while it waits', `coral \`${LADDER_COLOURS.friendship}\``],
    ['Romance', 'R0–R10, the proposal and the wedding while they wait', `rose \`${LADDER_COLOURS.romance}\``],
    ['Spouse', `S0–S5 (${SPOUSE_COST} a level)`, `gold \`${LADDER_COLOURS.spouse}\``],
  ])
}
/** RM18, decision 12: the hearts' factor on rank points, by save. */
function heartsFactor(): string {
  const levels = (factor: number) => Array.from({ length: 10 }, (_, l) => l).filter((l) => loveRankFactor({ stage: 'friendship', level: l }) === factor)
  const span = (list: number[]) => (list.length === 1 ? `F${list[0]}` : `F${list[0]}–F${list.at(-1)}`)
  return table(['Save', '×1', '×1.05', '×1.10'], [
    ['v3 (M4, live): your affinity', '0–4 hearts', '5–9 hearts', '10 hearts'],
    ['v4 (romance build): her friendship', span(levels(1)), span(levels(1.05)), `${loveRankFactor({ stage: 'confession', level: 10 }) === 1.1 ? 'F10 on: her confession, romance and spouse' : '?'}`],
  ])
}
// --- F48: the perks' words (romance spec RM31, RM32, RM36) -------------------------------------------------------------
const PERK_LINE_NAME: Readonly<Record<PerkLine, string>> = {
  farming: 'Farming', foraging: 'Foraging', fishing: 'Fishing', mining: 'Mining (the Mine)', quarry: 'Mining (the Quarry)', ranch: 'Ranch', cooking: 'Cooking',
  serving: 'Serving', forging: 'Forging',
}
/** RM31: every level's perk, with a forager's words for the ones her line templates; then each line's words. */
function perkWordsBlock(): string {
  const levels = table(['Level', 'Perk id', 'Words (a forager’s)', 'At her line’s place'], PERKS.map((p) => [
    p.rung.toUpperCase(), `\`${p.id}\``, perkWords(p.id, 'foraging'), p.place ? 'Yes: “Opens with chapter n” until it opens' : '',
  ]))
  const lines = table(['Her line', 'Her place', '+10% (F3)', 'A night chore (F6)', 'A morning item (R2)', 'Opens with'], PERK_LINES.map((line) => [
    PERK_LINE_NAME[line], PERK_PLACE[line], perkWords('line-10', line), NIGHT_CHORE[line], `A ★2+ ${MORNING_GOOD[line]}`, lineChapter(line) === null ? 'Day 1' : `Chapter ${lineChapter(line)}`,
  ]))
  return `${levels}\n\n${lines}`
}

/** Decision 6: the stand-in pack in git, the dark build's cast. */
function standIn(): string {
  const pack = storyPackFrom(STAND_IN_FILES)
  return table(['Character', 'Outfit', 'Calling', 'Favourite line', 'Arrives', 'Bible', 'Scripted'], pack.cast.umas.map((u) => [
    u.characterId, u.outfitId, u.calling, favouriteOf(pack, u.characterId) ?? '—', u.arrives.kind, pack.bibles.has(u.characterId) ? 'Yes' : 'No (her calling stands in)',
    `${pack.scripted.get(u.characterId)?.size ?? 0} of 27`,
  ]))
}
/** Decision 11: the farmer's name. */
function farmerName(): string {
  return table(['Rule', 'Detail'], [
    ['Characters', 'Letters of any script (with their accents), spaces, apostrophes (\' and ’) and hyphens'],
    ['Length', `1–${FARMER_NAME_MAX} characters, after trimming and collapsing inner runs of spaces`],
    ['Default', 'None: an empty field with a grey “Farmer”'],
    ['Where it shows', '`{farmer}` in every line, filled when the line shows; the save holds the name, never story text'],
  ])
}

// --- F52: bonds between Umas (romance spec RM48–RM50; CS44, CS17) --------------------------------------------------------
/** RM48: what a pair earns, by what they shared. */
function bondPoints(): string {
  return table(['Shared', 'Points', 'Paid by'], [
    ['Working the same place the same day (the Fields’ tenders together)', `+${BOND_POINTS.place} a pair; ×${SHARED_LINE} when both favour that place’s line`, '`bondsTonight`, night step 6'],
    ['An expedition party, a day away', `+${BOND_POINTS.party} a pair`, '`addBond`, F28 (M5)'],
    ['A festival team', `+${BOND_POINTS.team} a pair`, '`addBond`, F32 (M6)'],
    ['The same staff meal, or the same breakfast', `+${BOND_POINTS.meal} a pair`, '`addBond`, F8 and F54'],
    ['The same house, a night', `+${BOND_POINTS.house} a pair`, '`addBond`, F54'],
    ['**Romance 4:** her bond with her closest friend', `×${CLOSEST_BOND} on any of these, once (never ×${CLOSEST_BOND * CLOSEST_BOND} when both qualify)`, '`bondFactor`, in `addBond`'],
  ])
}
/** CS44: the hearts' points, and the days two at one place reach them. */
function bondHeartsBlock(): string {
  const day = (points: number, a: number) => `Day ${Math.ceil(points / a - 1e-9)}`
  return table(['Hearts', ...BOND_HEARTS.map((_, i) => String(i + 1))], [
    ['Points', ...BOND_HEARTS.map((p) => p.toLocaleString('en-US'))],
    [`Two at one place every day (+${BOND_POINTS.place})`, ...BOND_HEARTS.map((p) => day(p, BOND_POINTS.place))],
    [`Sharing a favourite line there (+${BOND_POINTS.place * SHARED_LINE})`, ...BOND_HEARTS.map((p) => day(p, BOND_POINTS.place * SHARED_LINE))],
  ])
}
/** RM49: a tie's seed by strength, and the stand-in's ties. */
function tieSeeds(): string {
  const pack = storyPackFrom(STAND_IN_FILES)
  const levels = (a: string, b: string) => {
    const set = pack.pairs.get(pairKey(a, b))
    return set && set.size > 0 ? `Bond ${[...set].sort((x, y) => x - y).join(', ')}` : '— (the tie’s line)'
  }
  return table(['Tie strength', 'Bond starts at', 'Hearts'], ([3, 2, 1] as const).map((s) => [s, TIE_SEEDS[s], bondHearts(TIE_SEEDS[s])]))
    + '\n\nThe stand-in pack’s ties (invented):\n\n'
    + table(['Pair', 'Kind', 'Strength', 'Seeded at', 'Authored conversations'], pack.ties.ties.map((t) => [`${t.a} & ${t.b}`, t.kind, t.strength, TIE_SEEDS[t.strength], levels(t.a, t.b)]))
}
/** CS17, CS44: side by side at 3 hearts. */
function sideBySide(): string {
  const share = Math.round((SIDE_BY_SIDE - 1) * 100)
  return table(['Where', `Beside a ${SIDE_BY_SIDE_HEARTS}-heart partner`, 'How'], [
    ['A work place (gathering, a station)', `+${share}% of her night’s items`, 'Night step 4 (`nightExtras`), after the hauls: copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, \'bond:<id>\', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today'],
    ['The Fields', `Tended growth ×${SIDE_BY_SIDE}`, 'Night step 2 (`blockGrowth`): her partner tends another block with a growing plot'],
  ])
}

export function renderBlock(key: string): string | null {
  const blocks_: Record<string, () => string> = { 'craft-ranks': craftRanks, refunds, beds, 'farm-ranks': farmRanks,
    'dorm-v4': dormV4, arrivals, 'arrival-pay': arrivalPay, 'opening-v4': openingV4, 'night-v4': nightV4, 'stand-in': standIn, 'farmer-name': farmerName,
    'route-costs': routeCosts, 'love-points': lovePoints, 'gift-stars': giftStarsBlock, 'birthday-map': birthdayMap, 'ready-rules': readyRules,
    'ready-waits': readyWaits, 'ladder-colours': ladderColours, 'hearts-factor': heartsFactor, 'perk-words': perkWordsBlock,
    'bond-points': bondPoints, 'bond-hearts': bondHeartsBlock, 'tie-seeds': tieSeeds, 'side-by-side': sideBySide,
    calendar, night, 'farm-map': farmMap, 'price-ladder': priceLadder, 'goods-prices': goodsPrices, 'crop-prices': cropPrices, demand, 'star-prices': starPrices,
    crops, 'shop-seeds': shopSeeds, blocks, tending, 'crop-levels': cropLevels, 'farming-challenges': farmingChallenges,
    'talent-stats': talentStats, 'talent-cutoffs': talentCutoffs, 'talent-gives': talentGives, 'rank-points': rankPoints, challenges, 'rank-gives': rankGives,
    'place-activity': placeActivity, 'forest-areas': forestAreas, 'fishing-spots': fishingSpots, 'fish-sizes': fishSizes, 'size-skill': sizeSkills,
    'haul-day': haulDay, 'haul-factors': haulFactors, 'gather-quality': gatherQualities, stations, 'station-day': stationDay, 'station-recipes': stationRecipes,
    'dorm-levels': dormLevels, 'roster-ways': rosterWays, 'affinity-acts': affinityActs, 'gift-likes': giftLikes,
    'farm-rank-points': farmRankPoints, 'farm-rank-opens': farmRankOpensBlock, milestones: milestonesBlock, 'diary-rows': diaryRows, 'chapter-1': chapterOne,
    chapters: chaptersBlock, cast: castBlock, scenes: scenesBlock, 'hello-lines': helloLines }
  return blocks_[key]?.() ?? null
}
