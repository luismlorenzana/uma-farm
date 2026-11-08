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
export function renderBlock(key: string): string | null {
  const blocks: Record<string, () => string> = { families, items, made, facilities, callings, jobs, levels }
  return blocks[key]?.() ?? null
}
