// The farm on the HD-2D stage (F11 decisions 2 and 3; hd2d-farm FR3, FR14; kit-farm KF2–KF7): the save as a farm design
// for uma-stage's band stage. Portrait, 9 tiles across: three 3 × 3 plots a band and a path row under each, the map's
// rows from `FARM_PLACES` (gather → process → make, left to right), the homestead's 0–3 rows after the yard on a v4 save
// in the romance build, and the town edge last. Each place is KF4's recipe (walls, roof, width × storeys, door, mounted
// pieces and landmarks); a place not yet standing is KF7's overgrown lot; crops by KF6's families. It only reads the
// save: the stage never changes a rule or the save (FR14). Typed from `@luismlorenzana/uma-stage/formats` (types only, so
// neither the rules nor farm-api load the stage). Pure.
//
// The tiles (F11's "left to the worker", D71):
// - **a plot:** its back two rows hold the building (or the place's ground and landmarks), the front row is its apron,
//   where its slots are and its `place` marker stands, at the apron's middle;
// - **the lanes:** each column keeps a lane at an edge, laid as path where the recipe leaves it free: the left column's
//   right edge (x = 2), the middle's and the right's left edges (x = 3, x = 6). Buildings stand flush to the other side
//   (the left column's at its left, the others' at their right), so the lanes and the path rows join every apron to the
//   Gate;
// - **the Gate** stands in the middle of the seventh row, its arch over its apron and the `gate` marker under it, on a
//   plot of path: the spine from the yard's path down to the town's;
// - **blocking landmarks** stand at the apron's outer tile, never on a lane, so a work place's four slots are its lane's
//   three tiles and the apron's middle.
import type { FarmBuilding, FarmDesign, FarmMarker, FarmMount } from '@luismlorenzana/uma-stage/formats'
import type { CropId } from '../goods/ids'
import { isStation } from '../gathering/ids'
import { homesteadShown } from '../romance/homestead'
import { readyAt } from '../fields/crops'
import { BLOCK_IDS, PLOTS_PER_BLOCK, type BlockId, type Plot } from '../save/v3'
import type { FarmSave } from '../save/v4'
import { FARM_MAP_ROWS, FARM_PLACES, placeOpen, type FarmPlace, type FarmPlaceId } from './places'

/** The farm's width in tiles (FR3), a plot's side and a band's depth (KF2). */
export const FARM_STAGE_TILES = 9
export const FARM_PLOT = 3
export const FARM_BAND = 4

// --- Crops (KF6; decision 3) ------------------------------------------------------------------------------------------

/** KF6's twelve ripe frames. */
export const CROP_FAMILIES = [
  'crop-root', 'crop-leafy', 'crop-herb', 'crop-grain', 'crop-rice', 'crop-staked-red', 'crop-staked-green', 'crop-staked-purple', 'crop-corn',
  'crop-sunflower', 'crop-spear', 'crop-gourd',
] as const
export type CropFamily = typeof CROP_FAMILIES[number]

/** CS11's 27 crops by their ripe family, KF6's table row for row. */
export const CROP_FAMILY: Readonly<Record<CropId, CropFamily>> = {
  carrot: 'crop-root', potato: 'crop-root', onion: 'crop-root', 'sugar-beet': 'crop-root', ginger: 'crop-root', peanut: 'crop-root',
  'golden-carrot': 'crop-root', mandrake: 'crop-root',
  cabbage: 'crop-leafy',
  mint: 'crop-herb', basil: 'crop-herb',
  wheat: 'crop-grain', oats: 'crop-grain', barley: 'crop-grain', rye: 'crop-grain', buckwheat: 'crop-grain', sunwheat: 'crop-grain',
  rice: 'crop-rice', moonrice: 'crop-rice', 'wild-rice': 'crop-rice',
  tomato: 'crop-staked-red',
  'bell-pepper': 'crop-staked-green',
  eggplant: 'crop-staked-purple',
  corn: 'crop-corn',
  'sunflower-seed': 'crop-sunflower',
  asparagus: 'crop-spear',
  'emperor-pumpkin': 'crop-gourd',
}

/** A growing crop shows `crop-growing` from this share of its growth to Ready; a sprout before it. */
export const CROP_GROWING_AT = 0.5

/** A plot's crop frame: its family's ripe frame when Ready, a sprout then growing on the way, or null when it's empty. */
export function cropFrame(plot: Pick<Plot, 'crop' | 'growth' | 'ready' | 'regrowing'>): string | null {
  if (plot.crop === null) return null
  if (plot.ready) return CROP_FAMILY[plot.crop]
  return plot.growth >= CROP_GROWING_AT * readyAt(plot.crop, plot.regrowing) ? 'crop-growing' : 'crop-sprout'
}

/** The plots the Fields' tiles show, in the Fields' screen's order (blocks A to D, plots 1 to 9), each with its frame; an
 * empty plot that withered last night shows `crop-withered` while the morning's summary lists it (the night empties it). */
export function fieldsFrames(save: Pick<FarmSave, 'fields' | 'summary'>): { block: BlockId; index: number; frame: string | null }[] {
  const withered = new Map<BlockId, number>()
  for (const line of save.summary?.work ?? []) if (line.kind === 'withered') withered.set(line.block, (withered.get(line.block) ?? 0) + line.plots)
  return BLOCK_IDS.flatMap((id) => {
    const block = save.fields.blocks.find((b) => b.id === id)
    if (!block) return []
    let left = withered.get(id) ?? 0
    return block.plots.slice(0, PLOTS_PER_BLOCK).map((plot, index) => {
      const frame = cropFrame(plot)
      if (frame === null && left > 0) { left--; return { block: id, index, frame: 'crop-withered' } }
      return { block: id, index, frame }
    })
  })
}

// --- The plots (KF2) --------------------------------------------------------------------------------------------------

export type FarmPlotKind = 'place' | 'house' | 'lot' | 'open'
/** A 3 × 3 plot on the stage: a map place, a built house, the homestead's next lot, or the open ground beside the Gate. */
export interface FarmPlot {
  /** The place's id, the house's (`farmhouse`, `house-1` …), or `open-ground`. */
  id: string
  kind: FarmPlotKind
  /** Its top-left tile. */
  x: number
  z: number
  band: number
  col: number
  /** Its recipe stands (a place open by CS3 and built; a house built); otherwise an overgrown lot (KF7). */
  standing: boolean
  place?: FarmPlace
  /** The homestead's house number (0, the Farmhouse, to 6). */
  house?: number
}

/** What a design reads besides the save: whether the homestead's rows show (the romance build, on a v4 save; F54). */
export interface FarmStageOptions {
  homestead: boolean
}

/** Whether a place's recipe stands on this save: CS3 has opened it and, for a station, it's built (F22 decision 5); on v4
 * the Forge stands once its ring bench does (F53 decision 3). The map's lock (`lockOf`) adds the screens not landed yet;
 * those stand, locked. */
export function placeStands(save: Pick<FarmSave, 'farm' | 'buildings' | 'version'>, place: FarmPlace): boolean {
  if (place.id === 'forge' && save.version === 4) return save.buildings.forge !== undefined
  if (!placeOpen(save, place)) return false
  if (isStation(place.id)) return (save.buildings[place.id] ?? -1) >= 1
  return true
}

/** The homestead's rows on this save's stage: 0, or 1–3 on v4 with the option. */
const homeRows = (save: FarmSave, options: FarmStageOptions): number =>
  options.homestead && save.version === 4 ? Math.ceil(homesteadShown(save).length / FARM_PLOT) : 0

/** Every plot on the stage, top to bottom, left to right: the map's rows, the homestead's, then the town edge. */
export function farmPlots(save: FarmSave, options: FarmStageOptions): FarmPlot[] {
  const home = homeRows(save, options)
  const bandOf = (row: number, group: FarmPlace['group']): number => (group === 'town' ? FARM_MAP_ROWS - 1 + home : row - 1)
  const at = (band: number, col: number) => ({ x: col * FARM_PLOT, z: band * FARM_BAND, band, col })
  const plots: FarmPlot[] = FARM_PLACES.map((place) => ({ id: place.id, kind: 'place', ...at(bandOf(place.row, place.group), place.col), standing: placeStands(save, place), place }))
  plots.push({ id: 'open-ground', kind: 'open', ...at(GATE_ROW - 1, 2), standing: true })
  if (home > 0 && save.version === 4) {
    for (const house of homesteadShown(save)) {
      const built = house.n < save.homestead.houses.length
      plots.push({ id: house.id, kind: built ? 'house' : 'lot', ...at(FARM_MAP_ROWS - 1 + Math.floor(house.n / FARM_PLOT), house.n % FARM_PLOT), standing: built, house: house.n })
    }
  }
  return plots.sort((a, b) => a.z - b.z || a.x - b.x)
}

/** The plot a tile lies in (its band's path row counts as the plot above it), or undefined. */
export function plotAt(plots: readonly FarmPlot[], x: number, z: number): FarmPlot | undefined {
  return plots.find((p) => x >= p.x && x < p.x + FARM_PLOT && z >= p.z && z < p.z + FARM_BAND)
}

// --- The recipes (KF4, KF7) -------------------------------------------------------------------------------------------

/** The Gate's row on the map (FC28), its arch in the middle column. */
const GATE_ROW = 7

/** A building in a recipe, from its plot's left (`lx`); it's always the back two rows. */
interface RecipeBuilding extends Omit<FarmBuilding, 'id' | 'x' | 'z' | 'd'> { lx: number }
/** A plot's recipe, in tiles from its top left: its three ground rows (`L` a lane, laid as path), its building, its props
 * (`[name, lx, lz]`) and its work slots' tiles in order. */
interface Recipe {
  ground: readonly [string, string, string]
  building?: RecipeBuilding
  props: readonly (readonly [string, number, number])[]
  slots: readonly (readonly [number, number])[]
}

const house = (lx: number, w: 2 | 3, walls: string, roof: string, storeys: 1 | 2, door: FarmBuilding['door'], mounts: FarmMount[] = []): RecipeBuilding =>
  ({ lx, w, walls, roof, storeys, door, mounts })
const front = (name: string, column: number, level: number): FarmMount => ({ name, face: 'front', column, level })
const roofMount = (name: string, column: number, level: number): FarmMount => ({ name, face: 'roof', column, level })
/** A lane on a plot's left edge (the middle and right columns) and its ground. */
const laneLeft = (g: string): Recipe['ground'] => [`L${g}${g}`, `L${g}${g}`, `${g}${g}${g}`]
/** A lane on a plot's right edge (the left column) and its ground. */
const laneRight = (g: string): Recipe['ground'] => [`${g}${g}L`, `${g}${g}L`, `${g}${g}${g}`]
/** A work place's four slots beside a building on the right: its lane's three tiles and the apron's middle. */
const BESIDE: Recipe['slots'] = [[0, 0], [0, 1], [0, 2], [1, 2]]
/** A gathering place's four slots: the apron's three tiles and one behind its right end. */
const APRON: Recipe['slots'] = [[0, 2], [1, 2], [2, 2], [2, 1]]
/** The Fields' scarecrow, in the middle of the soil; the crops take the other eight tiles. */
const SCARECROW: readonly [number, number] = [1, 1]

/** KF4's recipes for the places, row for row; a station's building stands once it's built. */
function placeRecipe(id: FarmPlaceId, v4: boolean): Recipe {
  switch (id) {
    case 'fields': return { ground: ['ttt', 'ttt', 'ttt'], props: [['scarecrow', ...SCARECROW]], slots: APRON }
    case 'mill': return { ground: laneLeft('g'), building: house(1, 2, 'plaster', 'thatch', 1, { column: 0 }, [front('mill-sails', 1, 2)]), props: [], slots: BESIDE }
    case 'coop': return { ground: laneLeft('d'), building: house(1, 2, 'plank', 'shingle', 1, { column: 0 }), props: [['trough', 2, 2]], slots: [] }
    case 'forest': return {
      ground: laneRight('f'), slots: APRON,
      props: [['tree-1', 0, 0], ['tree-3', 1, 0], ['tree-2', 0, 1], ['stump', 1, 1], ['mushroom-patch', 0, 2], ['herb-patch', 2, 2]],
    }
    // Open-fronted: windows only. Its four slots leave one tile for a landmark, the log pile (D71).
    case 'sawmill': return { ground: laneLeft('g'), building: house(1, 2, 'plank', 'shingle', 1, null), props: [['log-pile', 2, 2]], slots: BESIDE }
    case 'barn': return { ground: ['ddd', 'ddd', 'ddd'], building: house(0, 3, 'plank', 'red', 2, { column: 0, wide: true }), props: [['hay-bale', 2, 2]], slots: [] }
    case 'fishery': return { ground: ['wwL', 'wwL', 'ggg'], props: [['reeds', 0, 0], ['dock', 1, 1]], slots: APRON }
    case 'smokehouse': return { ground: laneLeft('g'), building: house(1, 2, 'plank', 'slate', 1, { column: 0 }), props: [['smoker', 2, 2]], slots: BESIDE }
    case 'kitchen': return {
      ground: laneLeft('g'), building: house(1, 2, 'plaster', 'red', 1, { column: 0 }, [roofMount('chimney', 1, 1), front('herb-box', 1, 1)]), props: [], slots: [],
    }
    case 'mine': return { ground: ['###', 'ggg', 'ggg'], props: [['mine-mouth', 1, 1], ['ore-cart', 0, 1], ['lantern', 2, 1]], slots: [[0, 2], [1, 2], [2, 2], [1, 1]] }
    case 'smelter': return { ground: laneLeft('g'), building: house(1, 2, 'stone', 'slate', 1, { column: 0 }), props: [['furnace', 2, 2]], slots: BESIDE }
    case 'restaurant': return {
      ground: ['vvv', 'vvv', 'vvv'], building: house(0, 3, 'plaster', 'shingle', 2, { column: 1 }, [front('awning', 1, 2)]), props: [['cafe-table', 2, 2]], slots: [],
    }
    case 'quarry': return { ground: ['qqL', 'qqL', 'ggg'], props: [['quarry-rock-1', 0, 0], ['stone-stack', 1, 0], ['quarry-rock-2', 1, 1]], slots: APRON }
    case 'cutter': return { ground: laneLeft('g'), building: house(1, 2, 'stone', 'slate', 1, { column: 0 }), props: [['grindstone', 2, 2]], slots: BESIDE }
    // The anvil and, on v4, the ring bench beside it (D58) take the Forge's lane: it has no slots.
    case 'forge': return {
      ground: ['ggg', 'ggg', 'ggg'], building: house(1, 2, 'stone', 'slate', 1, { column: 0 }, [roofMount('forge-chimney', 1, 1)]),
      props: [['anvil', 0, 1], ...(v4 ? [['ring-bench', 0, 0] as const] : [])], slots: [],
    }
    case 'bin': return { ground: laneRight('g'), props: [['sack', 0, 0], ['barrel', 0, 1], ['bin', 1, 1]], slots: [] }
    case 'warehouse': return { ground: ['ggg', 'ggg', 'ggg'], building: house(0, 3, 'plank', 'red', 2, { column: 0, wide: true }), props: [['crates', 2, 2]], slots: [] }
    case 'dorm': return {
      ground: ['ggg', 'ggg', 'ggg'], building: house(0, 3, 'plaster', 'red', 2, { column: 1 }, [front('flower-box', 0, 1), front('flower-box', 2, 1)]), props: [], slots: [],
    }
    case 'board': return { ground: laneRight('g'), props: [['notice-board', 0, 1]], slots: [] }
    // The Gate's plot is path, the spine from the yard to the town; its arch stands over the apron, fences either side.
    case 'gate': return { ground: ['ppp', 'ppp', 'ppp'], props: [['gate-arch', 1, 2], ['fence-1', -1, 2], ['fence-2', 3, 2]], slots: [] }
    case 'shop': return {
      ground: ['vvL', 'vvL', 'vvv'], building: house(0, 2, 'plaster', 'shingle', 1, { column: 1, frame: 'door-shop' }), props: [['stall-awning', 2, 1]], slots: [],
    }
    case 'festival': return { ground: ['Lvv', 'Lvv', 'vvv'], props: [['bunting', 1, 1], ['flagpole', 2, 0]], slots: [] }
    case 'expeditions': return { ground: ['ggg', 'ggg', 'ggg'], building: house(1, 2, 'plank', 'shingle', 1, { column: 0 }), props: [['flagpole', 0, 0], ['signpost', 0, 1]], slots: [] }
  }
}

/** A plot's lane edge: the left column's on its right, the others' on their left. */
const laneOf = (col: number): 'left' | 'right' => (col === 0 ? 'right' : 'left')

/** The homestead's recipes (KF4): the Farmhouse, one drawing for every house (RM41), and the next lot's stakes. */
function homeRecipe(plot: FarmPlot): Recipe {
  const lane = laneOf(plot.col)
  if (plot.kind === 'lot') return { ground: lane === 'left' ? laneLeft('g') : laneRight('g'), props: [['lot-stakes', 1, 1]], slots: [] }
  if (plot.house === 0) {
    return {
      ground: ['ggg', 'ggg', 'ggg'], props: [['porch', 1, 2]], slots: [],
      building: house(0, 3, 'plaster', 'red', 2, { column: 1 }, [roofMount('chimney', 0, 1.5), front('flower-box', 0, 1), front('flower-box', 2, 1)]),
    }
  }
  // Flush away from the lane, its door on the lane's side of the apron's middle, flowers under the other window.
  const left = lane === 'right'
  return {
    ground: left ? laneRight('g') : laneLeft('g'), props: [], slots: [],
    building: house(left ? 0 : 1, 2, 'plaster', 'thatch', 1, { column: left ? 1 : 0 }, [front('flower-box', left ? 0 : 1, 1), roofMount('chimney', left ? 0 : 1, 1)]),
  }
}

/** KF7's overgrown lot: weeds, brambles and a broken fence on grass, its lane left clear. */
function overgrown(col: number): Recipe {
  if (laneOf(col) === 'right') return { ground: laneRight('g'), props: [['weeds-1', 0, 0], ['brambles', 1, 0], ['weeds-2', 1, 1], ['fence-broken', 0, 2]], slots: [] }
  return { ground: laneLeft('g'), props: [['weeds-1', 2, 0], ['brambles', 1, 0], ['weeds-2', 1, 1], ['fence-broken', 2, 2]], slots: [] }
}

/** The open ground beside the Gate: grass and a few flowers, its lane on the left. */
const OPEN_GROUND: Recipe = { ground: laneLeft('g'), props: [['flowers-1', 1, 0], ['bush-2', 2, 0], ['flowers-2', 2, 2]], slots: [] }

function recipeOf(save: FarmSave, plot: FarmPlot): Recipe {
  if (plot.kind === 'open') return OPEN_GROUND
  if (plot.kind === 'house' || plot.kind === 'lot') return homeRecipe(plot)
  return plot.standing ? placeRecipe(plot.place!.id, save.version === 4) : overgrown(plot.col)
}

// --- The design (decision 2) --------------------------------------------------------------------------------------------

/** The tiles of the Fields' soil the crops stand on, row by row, around the scarecrow. */
export const FIELDS_CROP_TILES: readonly (readonly [number, number])[] = [0, 1, 2].flatMap((lz) => [0, 1, 2].map((lx) => [lx, lz] as const))
  .filter(([lx, lz]) => lx !== SCARECROW[0] || lz !== SCARECROW[1])

/** A work place's slot marker id: `forest-1` … `forest-4`, the Fields' by block (`fields-a`), ids being kebab-case. */
export const slotId = (place: string, slot: number | BlockId): string => `${place}-${typeof slot === 'number' ? slot + 1 : slot.toLowerCase()}`

/**
 * The save as a farm design (decision 2): every plot by its recipe (open places with a `place` marker on their apron and a
 * `slot` marker for each work slot, the Fields' one an owned block; places not standing as overgrown lots with their
 * `place` marker; on v4 with the homestead the Farmhouse, every built house and the next lot with its `lot` marker), the
 * Gate's `gate` marker, the path rows and the lanes, and the Fields' crops (decision 3). Levels: the ground is 1, the pond
 * and the quarry's pit 0, the Mine's cliff a rock wall.
 */
export function farmDesign(save: FarmSave, options: FarmStageOptions): FarmDesign {
  const plots = farmPlots(save, options)
  const bands = Math.max(...plots.map((p) => p.band)) + 1
  const depth = bands * FARM_BAND
  const cells = Array.from({ length: depth }, (_, z) => (z % FARM_BAND === FARM_PLOT ? 'p' : 'g').repeat(FARM_STAGE_TILES).split(''))
  const buildings: FarmBuilding[] = []
  const props: { name: string; x: number; z: number }[] = []
  const markers: FarmMarker[] = []
  for (const plot of plots) {
    const recipe = recipeOf(save, plot)
    recipe.ground.forEach((row, lz) => [...row].forEach((c, lx) => { cells[plot.z + lz]![plot.x + lx] = c === 'L' ? 'p' : c }))
    const b = recipe.building
    if (b) {
      const { lx, ...rest } = b
      buildings.push({ id: plot.id, ...rest, x: plot.x + lx, z: plot.z, d: 2 })
    }
    for (const [name, lx, lz] of recipe.props) props.push({ name, x: plot.x + lx, z: plot.z + lz })
    const apron = { x: plot.x + 1, z: plot.z + 2 }
    if (plot.kind === 'lot') markers.push({ kind: 'lot', id: plot.id, ...apron })
    else if (plot.kind !== 'open') markers.push({ kind: 'place', id: plot.id, ...apron })
    if (plot.id === 'gate') markers.push({ kind: 'gate', id: 'gate', ...apron })
    if (plot.kind !== 'place' || !plot.standing) continue
    const slots = plot.id === 'fields' ? save.fields.blocks.map((block) => block.id) : recipe.slots.map((_, i) => i)
    slots.forEach((slot, i) => {
      const tile = recipe.slots[i]
      if (tile) markers.push({ kind: 'slot', id: slotId(plot.id, slot), x: plot.x + tile[0], z: plot.z + tile[1] })
    })
    if (plot.id === 'fields') {
      fieldsFrames(save).slice(0, FIELDS_CROP_TILES.length).forEach((crop, i) => {
        const [lx, lz] = FIELDS_CROP_TILES[i]!
        if (crop.frame) props.push({ name: crop.frame, x: plot.x + lx, z: plot.z + lz })
      })
    }
  }
  const rows = cells.map((row) => row.join(''))
  return {
    id: `farm-${save.version}-${bands}`,
    cells: rows,
    heights: rows.map((row) => [...row].map((c) => (c === 'w' || c === 'q' ? '0' : '1')).join('')),
    buildings,
    props,
    markers,
  }
}
