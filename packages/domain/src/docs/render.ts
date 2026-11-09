// Copied from uma-rpg packages/domain/src/docs/render.ts at 30a322a (F4, FM2, FW13); cuts in docs/technical/wilds-copy.md.
// The live docs' generated blocks (docs/game/, D92): every list in the manual is rendered here from the rules, so it can't
// drift from the game. A doc marks a block with `<!-- live:<key> -->` … `<!-- /live -->`; `pnpm docs:update` rewrites
// them, and `docs.test.ts` fails when one is stale. Pure: no I/O (the test reads and writes the files). uma-rpg's blocks
// for fights, classes, gear, Extra Stats, Laurels, prices, worlds, the Rift and achievements stay behind.
import { MAX_QUEUE } from '@luismlorenzana/uma-work'
import {
  EXP_PER_MINUTE, JOB_SIZES, JOB_STEPS_MOST, jobSizes, makeMinutesV4, PROFESSION_MAX_LEVEL, professionExpToNext, STEP_MINUTES, stepMinutes,
} from '../economy/pacing'
import { isMakingPlaceV4, isProcessingPlaceV4, PLACES_V4 } from '../economy/places-v4'
import { PLACE_SLOTS_V3, PLACE_SPEED_V3, professionById, tradeOfCalling, TRADES } from '../economy/professions'
import { stockName } from '../economy/stock'
import { placeById } from '../hub/places'
import { gradeUnlockLevel } from '../items/catalog'
import { lineItems, MATERIAL_LINES, type MaterialLine } from '../items/lines'
import { madeName } from '../items/made'
import { MADE_IDENTITIES, MADE_LINES, type MadeLine } from '../items/made-id'
import { madeRecipeV4, RECIPE_V4 } from '../items/made-v4'
import { tradeLine } from '../roster/roster'
import { UMA_ROW_CALLING_V3, type UmaCallingRowV3 } from '../roster/template'
import { BEDS, FARM_RANK_POINTS } from '../farm/farm'
import { ACTIVITY_NAMES, CRAFT_BANDS, craftRank, LINE_ACTIVITY, RANKS } from '../farm/ranks'
import { CROP_IDS, FAMILY_NAMES, GOOD_FAMILIES, GOODS, goodOf, isGoodId, refinedOf, type GoodFamily } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { inDemand, priceOf, STARS, starFactor, starPrice } from '../goods/prices'
import { DEMAND, FAMILY_FACTOR, LADDER, REFINED_FACTOR, type LadderFamily } from '../goods/rule'
import { refundOf } from '../save/migrate-v3'
import { DAYS_PER_SEASON, farmDay, FESTIVALS, SEASON_NAMES, SEASONS } from '../farm/calendar'
import { FARM_MAP_ROWS, FARM_PLACES, type PlaceOpens } from '../farm/places'
import { NIGHT_STEPS } from '../night/end-day'
import { CROPS, nightsToReady, SHOP_SEEDS } from '../fields/crops'
import {
  BLOCK_RULES, cropLevelStart, FARMING_CHALLENGES, harvestQuality, MAX_CROP_LEVEL, seedsBackChance, TALENT_D, tendedGrowth, UNTENDED_GROWTH, type TalentStep,
} from '../fields/fields'
import { starShares } from '../goods/stars'
import { BLOCK_IDS } from '../save/v3'
import type { Rank } from '../farm/ranks'

type Cell = string | number
/** A Markdown table; pipes in cells are escaped. */
function table(head: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const cell = (v: Cell) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n')
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const itemName = (id: string) => stockName(id)
const inputs = (list: Record<string, number>) => Object.entries(list).map(([id, n]) => `${n > 1 ? `${n}× ` : ''}${itemName(id)}`).join(', ')

// --- The lines and their items --------------------------------------------------------------------------------------

const LINE_NAME: Readonly<Record<MaterialLine, string>> = { metal: 'Metal', wood: 'Wood', vegetables: 'Vegetables', fish: 'Fish', stone: 'Stone' }
const MADE_LINE_NAME: Readonly<Record<MadeLine, string>> = { 'weapon-gem': 'Arms Gems', 'tome-ink': 'Tome Ink', 'armor-fittings': 'Armor Fittings',
  'accessory-setting': 'Accessory Settings', 'jewel-planet': 'Planet Jewels', 'jewel-moon': 'Moon Jewels' }
/** A line's three places (FL31): gathering, processing and making, and what the last makes. */
function lineHome(line: MaterialLine): { profession: string; place: string; processor: string; maker: string; makes: string } {
  const gather = PLACES_V4.find((p) => p.line === line && p.kinds.includes('gather'))!
  const process = PLACES_V4.find((p) => p.line === line && isProcessingPlaceV4(p))!
  const make = PLACES_V4.find((p) => p.line === line && isMakingPlaceV4(p))!
  return {
    profession: professionById(gather.profession)!.name, place: placeById(gather.id)?.name ?? gather.id,
    processor: `the ${placeById(process.id)?.name ?? process.id} (${professionById(process.profession)!.name})`,
    maker: `the ${placeById(make.id)?.name ?? make.id} (${professionById(make.profession)!.name})`,
    makes: make.made.map((m) => MADE_LINE_NAME[m]).join(' and '),
  }
}

/** The five lines (FL1, FL5): who gathers each, where it's processed and made, and its ten raw items. */
function families(): string {
  return table(['Line', 'Gathered by', 'Processed at', 'Made at', 'Makes', 'Raw, G1 → G10'], MATERIAL_LINES.map((line) => {
    const home = lineHome(line)
    return [LINE_NAME[line], `${home.profession}, the ${home.place}`, home.processor, home.maker, home.makes, lineItems(line, false).map((m) => m.name).join(', ')]
  }))
}
/** Every item, raw and refined, by line and grade (FL5, FL6): grade g opens at Craft Lv 5g − 4. */
function items(): string {
  const out: string[] = []
  for (const line of MATERIAL_LINES) {
    const home = lineHome(line)
    out.push(`### ${LINE_NAME[line]} (${home.profession}, the ${home.place}; ${home.processor}; ${home.maker})`, '')
    const refined = lineItems(line, true)
    out.push(table(['Grade', 'Raw', 'Refined', 'Opens at Craft Lv'], lineItems(line, false).map((m, i) => [
      `G${m.grade}`, `${m.name} (\`${m.id}\`)`, `${refined[i]!.name} (\`${refined[i]!.id}\`)`, gradeUnlockLevel(m.grade),
    ])), '')
  }
  return out.join('\n').trimEnd()
}
/** The made items (FM8, R4): uma-rpg's five kinds with its ids and recipes, by line, each a line's refined items of its grade. */
function made(): string {
  return table(['Made item', 'Id', 'Grade', 'Opens at Craft Lv', 'Made at', 'Recipe'], MADE_LINES.flatMap((line) =>
    MADE_IDENTITIES.filter((m) => m.line === line).map((m) => {
      const place = PLACES_V4.find((p) => p.made.includes(line))!
      return [madeName(m.id)!, `\`${m.id}\``, m.grade, gradeUnlockLevel(m.grade), placeById(place.id)?.name ?? place.id, inputs(madeRecipeV4(m.id))]
    })))
}

// --- The places and the trades --------------------------------------------------------------------------------------

/** The fifteen places (FL31) and the trades: who works each, and its one job. */
function facilities(): string {
  const trade = (profession: string) => TRADES.find((t) => t.gathering === profession || t.processing === profession || t.crafting === profession)!
  const does = (id: string): string => {
    const spec = PLACES_V4.find((p) => p.id === id)!
    if (spec.kinds.includes('gather')) return `Gathers ${LINE_NAME[spec.line].toLowerCase()}, G1–G10`
    if (isProcessingPlaceV4(spec)) return `Processes ${LINE_NAME[spec.line].toLowerCase()} raw into refined, one for one`
    return `Makes ${spec.made.map((m) => MADE_LINE_NAME[m]).join(' and ')}`
  }
  return table(['Place', 'Id', 'Profession', 'Job', 'What it does', 'Its trade'], PLACES_V4.map((p) => {
    const profession = professionById(p.profession)!
    return [placeById(p.id)?.name ?? p.id, `\`${p.id}\``, profession.name, cap(profession.kind), does(p.id), LINE_NAME[tradeLine(trade(p.profession).id)]]
  })) + `\n\nEvery place has ${PLACE_SLOTS_V3} slots at ×${PLACE_SPEED_V3} from day one, and nothing to upgrade. An Uma works her trade's three places; a place whose trade has no Uma on the roster is an open shop, taking everyone.`
}

/** The calling rule's rows (CV19), in the farm's words: her best running styles name her line. */
const CALLING_ROW: Readonly<Record<UmaCallingRowV3, string>> = {
  1: 'Front among them', 2: 'Pace alone', 3: 'Pace with Late or End', 4: 'End among them (End, or Late and End)', 5: 'Late alone',
}
/** Her trade by her best running styles (FM7): the first row that fits. */
function callings(): string {
  return table(['Row', 'Her best running styles', 'Her trade\'s line', 'Her places'], (Object.keys(CALLING_ROW).map(Number) as UmaCallingRowV3[]).map((row) => {
    const trade = tradeOfCalling(UMA_ROW_CALLING_V3[row])
    const places = PLACES_V4.filter((p) => p.line === tradeLine(trade)).map((p) => placeById(p.id)?.name ?? p.id).join(', ')
    return [row, CALLING_ROW[row], LINE_NAME[tradeLine(trade)], places]
  })) + '\n\nHer best running styles are every style at her top grade. Distance, Power and Wit don\'t count.'
}

// --- Jobs and Craft Level -------------------------------------------------------------------------------------------

const hours = (m: number): string => `${Number((m / 60).toFixed(1))} h`
function jobs(): string {
  return table(['Setting', 'Value'], [
    ['One step', `gather one raw or process one raw into one refined: ${STEP_MINUTES.atFirst} min at Craft Lv1, falling evenly to ${STEP_MINUTES.atMax} min at Lv${PROFESSION_MAX_LEVEL} (ten in ${hours(10 * stepMinutes(1))} and ${hours(10 * stepMinutes(PROFESSION_MAX_LEVEL))})`],
    ['Make one item', `one step for each refined item in it: an Arms Gem or Tome Ink ${RECIPE_V4['weapon-gem'].qty}, Armor Fittings ${RECIPE_V4['armor-fittings'].qty}, an Accessory Setting ${RECIPE_V4['accessory-setting'].qty}, a Planet Jewel ${RECIPE_V4['jewel-planet'].qty}, a Moon Jewel ${RECIPE_V4['jewel-moon'].qty} (an Arms Gem ${hours(makeMinutesV4(1, RECIPE_V4['weapon-gem'].qty))} at Lv1, ${hours(makeMinutesV4(PROFESSION_MAX_LEVEL, RECIPE_V4['weapon-gem'].qty))} at Lv${PROFESSION_MAX_LEVEL})`],
    ['Opens', 'grade g at Craft Lv 5g − 4, to gather, to process and to make'],
    ['Craft EXP', `${EXP_PER_MINUTE} per minute of the job at her level, before the place's speed`],
    ['Sizes', `${JOB_SIZES.map((n) => `×${n}`).join(', ')} to gather or process; a make up to about ${JOB_STEPS_MOST} steps (${hours((JOB_STEPS_MOST * stepMinutes(25)) / PLACE_SPEED_V3)} at Craft Lv25): Armor Fittings ×${jobSizes(RECIPE_V4['armor-fittings'].qty).at(-1)}, a Moon Jewel ×${jobSizes(RECIPE_V4['jewel-moon'].qty).at(-1)}, an Arms Gem or Tome Ink ×${jobSizes(RECIPE_V4['weapon-gem'].qty).at(-1)}, an Accessory Setting or a Planet Jewel ×${jobSizes(RECIPE_V4['accessory-setting'].qty).at(-1)}`],
    ['Jobs queued after it', String(MAX_QUEUE)],
    ['Places', `${PLACE_SLOTS_V3} Uma slots each, speed ×${PLACE_SPEED_V3}, from day one; no upgrades`],
  ])
}
function levels(): string {
  const rows: Cell[][] = []
  for (let lv = 1; lv < PROFESSION_MAX_LEVEL; lv += 7) rows.push([lv, professionExpToNext(lv).toLocaleString('en-US')])
  return table(['Craft Level', 'Craft EXP to next'], rows) +
    `\n\nCraft EXP to next: ${professionExpToNext(0).toLocaleString('en-US')} + ${professionExpToNext(1) - professionExpToNext(0)} × level, up to Lv ${PROFESSION_MAX_LEVEL}; jobs pay ${EXP_PER_MINUTE} EXP per base minute of work, so a level takes ${professionExpToNext(1) / EXP_PER_MINUTE / 60} base hours at Lv1 and ${professionExpToNext(PROFESSION_MAX_LEVEL - 1) / EXP_PER_MINUTE / 60} at Lv${PROFESSION_MAX_LEVEL - 1}.`
}

/** Every block a doc may embed, by key. */
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

/** CS30: farming's challenges, toward each rank. */
function farmingChallenges(): string {
  return table(['Toward', 'Challenge', 'Counted'], FARMING_CHALLENGES.map((c) => [RANKS[c.rank], c.what, c.rank === 5 ? 'M6 (F32)' : 'At harvest, for the tender (F20)']))
}

export function renderBlock(key: string): string | null {
  const blocks_: Record<string, () => string> = { families, items, made, facilities, callings, jobs, levels, 'craft-ranks': craftRanks, refunds, beds, 'farm-ranks': farmRanks,
    calendar, night, 'farm-map': farmMap, 'price-ladder': priceLadder, 'goods-prices': goodsPrices, 'crop-prices': cropPrices, demand, 'star-prices': starPrices,
    crops, 'shop-seeds': shopSeeds, blocks, tending, 'crop-levels': cropLevels, 'farming-challenges': farmingChallenges }
  return blocks_[key]?.() ?? null
}
