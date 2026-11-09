// The forest's areas, the Fishery's spots, the fish's sizes, a day's haul and the stations (F22; core spec CS15–CS18):
// the spec's tables as data, row for row. Loaded with the loop's screens and the night, never in the initial JS (the
// save's parse reads only `ids.ts`).
import type { Season } from '../farm/calendar'
import type { Rank } from '../farm/ranks'
import type { FishingSpotId, ForestAreaId, StationId, StationJobId } from './ids'

/** One good in a place's season, and its share of the draws in percent. */
export type Share = readonly [good: string, percent: number]

/** A forest area (CS16): the rank that opens it, its two grades, and each season's goods with their shares. */
export interface ForestArea {
  readonly opens: Rank
  readonly grades: readonly [number, number]
  readonly seasons: Readonly<Record<Season, readonly Share[]>>
}

/** CS16, row for row: woods 40%, mushrooms 30%, herbs and spices 15%, the season's family 15% (Spring sweets, Summer
 * fruits, Autumn nuts and seeds, Winter more mushrooms), each family's two grades about 65/35. */
export const FOREST: Readonly<Record<ForestAreaId, ForestArea>> = {
  woods: {
    opens: 0, grades: [1, 2],
    seasons: {
      spring: [['pine-log', 26], ['button-mushroom', 20], ['birch-log', 14], ['shiitake', 10], ['basil', 10], ['honeycomb', 10], ['mint', 5], ['sugarcane', 5]],
      summer: [['pine-log', 26], ['button-mushroom', 20], ['birch-log', 14], ['shiitake', 10], ['basil', 10], ['apple', 10], ['mint', 5], ['pear', 5]],
      autumn: [['pine-log', 26], ['button-mushroom', 20], ['birch-log', 14], ['shiitake', 10], ['basil', 10], ['peanut', 10], ['mint', 5], ['sunflower-seed', 5]],
      winter: [['button-mushroom', 29], ['pine-log', 26], ['shiitake', 16], ['birch-log', 14], ['basil', 10], ['mint', 5]],
    },
  },
  hills: {
    opens: 1, grades: [3, 4],
    seasons: {
      spring: [['cedar-log', 26], ['oyster-mushroom', 20], ['maple-log', 14], ['enoki', 10], ['rosemary', 10], ['sugar-beet', 10], ['thyme', 5], ['maple-sap', 5]],
      summer: [['cedar-log', 26], ['oyster-mushroom', 20], ['maple-log', 14], ['enoki', 10], ['rosemary', 10], ['peach', 10], ['thyme', 5], ['plum', 5]],
      autumn: [['cedar-log', 26], ['oyster-mushroom', 20], ['maple-log', 14], ['enoki', 10], ['rosemary', 10], ['sesame', 10], ['thyme', 5], ['walnut', 5]],
      winter: [['oyster-mushroom', 29], ['cedar-log', 26], ['enoki', 16], ['maple-log', 14], ['rosemary', 10], ['thyme', 5]],
    },
  },
  'old-forest': {
    opens: 2, grades: [4, 5],
    seasons: {
      spring: [['maple-log', 26], ['enoki', 20], ['oak-log', 14], ['chanterelle', 10], ['thyme', 10], ['maple-sap', 10], ['ginger', 5], ['cacao-pod', 5]],
      summer: [['maple-log', 26], ['enoki', 20], ['oak-log', 14], ['chanterelle', 10], ['thyme', 10], ['plum', 10], ['ginger', 5], ['orange', 5]],
      autumn: [['maple-log', 26], ['enoki', 20], ['oak-log', 14], ['chanterelle', 10], ['thyme', 10], ['walnut', 10], ['ginger', 5], ['chestnut', 5]],
      winter: [['enoki', 29], ['maple-log', 26], ['chanterelle', 16], ['oak-log', 14], ['thyme', 10], ['ginger', 5]],
    },
  },
  mountain: {
    opens: 3, grades: [6, 7],
    seasons: {
      spring: [['cherry-log', 26], ['porcini', 20], ['mahogany-log', 14], ['morel', 10], ['peppercorn', 10], ['vanilla-pod', 10], ['cinnamon', 5], ['agave-heart', 5]],
      summer: [['cherry-log', 26], ['porcini', 20], ['mahogany-log', 14], ['morel', 10], ['peppercorn', 10], ['grape', 10], ['cinnamon', 5], ['mango', 5]],
      autumn: [['cherry-log', 26], ['porcini', 20], ['mahogany-log', 14], ['morel', 10], ['peppercorn', 10], ['almond', 10], ['cinnamon', 5], ['pistachio', 5]],
      winter: [['porcini', 29], ['cherry-log', 26], ['morel', 16], ['mahogany-log', 14], ['peppercorn', 10], ['cinnamon', 5]],
    },
  },
  'misty-vale': {
    opens: 4, grades: [8, 9],
    seasons: {
      spring: [['ebony-log', 26], ['truffle', 20], ['elderwood-log', 14], ['glowcap', 10], ['saffron', 10], ['palm-sap', 10], ['mandrake', 5], ['fairy-honeycomb', 5]],
      summer: [['ebony-log', 26], ['truffle', 20], ['elderwood-log', 14], ['glowcap', 10], ['saffron', 10], ['pomegranate', 10], ['mandrake', 5], ['starpeach', 5]],
      autumn: [['ebony-log', 26], ['truffle', 20], ['elderwood-log', 14], ['glowcap', 10], ['saffron', 10], ['macadamia', 10], ['mandrake', 5], ['thundernut', 5]],
      winter: [['truffle', 29], ['ebony-log', 26], ['glowcap', 16], ['elderwood-log', 14], ['saffron', 10], ['mandrake', 5]],
    },
  },
  'world-tree': {
    opens: 5, grades: [9, 10],
    seasons: {
      spring: [['elderwood-log', 26], ['glowcap', 20], ['yggdrasil-branch', 14], ['king-reishi', 10], ['mandrake', 10], ['fairy-honeycomb', 10], ['phoenix-pepper', 5], ['ambrosia-blossom', 5]],
      summer: [['elderwood-log', 26], ['glowcap', 20], ['yggdrasil-branch', 14], ['king-reishi', 10], ['mandrake', 10], ['starpeach', 10], ['phoenix-pepper', 5], ['golden-apple', 5]],
      autumn: [['elderwood-log', 26], ['glowcap', 20], ['yggdrasil-branch', 14], ['king-reishi', 10], ['mandrake', 10], ['thundernut', 10], ['phoenix-pepper', 5], ['worldseed', 5]],
      winter: [['glowcap', 29], ['elderwood-log', 26], ['king-reishi', 16], ['yggdrasil-branch', 14], ['mandrake', 10], ['phoenix-pepper', 5]],
    },
  },
}

/** A fishing spot (CS15): the rank that opens it, the chapter (and the boat) the sea also needs, and each season's fish. */
export interface FishingSpot {
  readonly opens: Rank
  /** The sea's spots wait for chapter 7 (M6); null for freshwater. */
  readonly chapter: number | null
  /** The Deep Sea also needs the boat (40,000g, M6). */
  readonly boat: boolean
  readonly seasons: Readonly<Record<Season, readonly Share[]>>
}

const all = (shares: readonly Share[]): Readonly<Record<Season, readonly Share[]>> => ({ spring: shares, summer: shares, autumn: shares, winter: shares })

/** CS15, row for row. The Sea Pier and the Deep Sea wait for M6. */
export const FISHERY: Readonly<Record<FishingSpotId, FishingSpot>> = {
  pond: {
    opens: 0, chapter: null, boat: false,
    seasons: { spring: [['carp', 60], ['trout', 40]], summer: [['carp', 98], ['rainbow-koi', 2]], autumn: [['carp', 60], ['trout', 40]], winter: [['carp', 70], ['trout', 30]] },
  },
  river: {
    opens: 1, chapter: null, boat: false,
    seasons: {
      spring: [['trout', 40], ['carp', 20], ['salmon', 40]], summer: [['eel', 40], ['trout', 40], ['carp', 20]], autumn: [['salmon', 50], ['trout', 50]],
      winter: [['trout', 60], ['salmon', 20], ['carp', 20]],
    },
  },
  lake: {
    opens: 2, chapter: null, boat: false,
    seasons: {
      spring: [['salmon', 50], ['trout', 20], ['eel', 30]], summer: [['eel', 50], ['salmon', 47], ['rainbow-koi', 3]], autumn: [['salmon', 50], ['eel', 30], ['silverfin', 20]],
      winter: [['silverfin', 20], ['trout', 30], ['salmon', 50]],
    },
  },
  falls: {
    opens: 3, chapter: null, boat: false,
    seasons: {
      spring: [['eel', 50], ['salmon', 25], ['silverfin', 20], ['rainbow-koi', 5]], summer: [['eel', 60], ['silverfin', 30], ['rainbow-koi', 10]],
      autumn: [['silverfin', 30], ['salmon', 40], ['eel', 25], ['rainbow-koi', 5]], winter: [['silverfin', 40], ['trout', 50], ['rainbow-koi', 10]],
    },
  },
  'moon-pool': { opens: 5, chapter: null, boat: false, seasons: all([['rainbow-koi', 60], ['silverfin', 40]]) },
  'sea-pier': {
    opens: 1, chapter: 7, boat: false,
    seasons: {
      spring: [['sardine', 60], ['sea-bream', 40]], summer: [['sardine', 50], ['mackerel', 20], ['sea-bream', 30]], autumn: [['mackerel', 60], ['sea-bream', 40]],
      winter: [['mackerel', 70], ['sardine', 30]],
    },
  },
  'deep-sea': {
    opens: 4, chapter: 7, boat: true,
    seasons: {
      spring: [['tuna', 50], ['silverfin', 40], ['rainbow-koi', 10]], summer: [['tuna', 60], ['silverfin', 30], ['sea-bream', 10]],
      autumn: [['tuna', 50], ['silverfin', 40], ['rainbow-koi', 10]], winter: [['tuna', 60], ['silverfin', 40]],
    },
  },
}

/** Each fish's size range in cm (CS15). */
export const FISH_SIZES: Readonly<Record<string, readonly [min: number, max: number]>> = {
  carp: [20, 60], trout: [25, 70], sardine: [12, 25], mackerel: [25, 50], salmon: [50, 120], 'sea-bream': [30, 70], eel: [40, 120], tuna: [80, 250],
  silverfin: [40, 90], 'rainbow-koi': [40, 100],
}

// --- A day's haul (CS17) ---------------------------------------------------------------------------------------------

/** Items a day at Novice before the factors: the forest 5, the Fishery 3 (the Mine and the Quarry 4, M5). */
export const HAUL_BASE = { forest: 5, fishery: 3 } as const
/** The tool's factor by tier, Basic → Mythril (CS17): the Axe in the forest, the Rod at the Fishery. */
export const TOOL_YIELD: readonly number[] = [1, 1.15, 1.3, 1.45, 1.6]
/** Well fed (CS22): ×1.25 items a day for a 1-day kind. */
export const WELL_FED_YIELD = 1.25

// --- The stations (CS18) ---------------------------------------------------------------------------------------------

/** Items a station turns a day at Novice D, before her rank, talent and well fed. */
export const STATION_RATE = 8

/** A station: the place whose activity's rank it uses, what it costs to build, and what opens it. */
export interface Station {
  readonly cost: number
  /** The Mill needs its plans (chapter 1's reward, F24); the Sawmill and the Smokehouse Farm Rank 3. */
  readonly opens: { readonly by: 'plans' } | { readonly by: 'farm-rank'; readonly rank: number }
}
export const STATION_RULES: Readonly<Record<StationId, Station>> = {
  mill: { cost: 1200, opens: { by: 'plans' } },
  sawmill: { cost: 1500, opens: { by: 'farm-rank', rank: 3 } },
  smokehouse: { cost: 2000, opens: { by: 'farm-rank', rank: 3 } },
}

/** Each station job's least days and its name (CS18): a job lasts at least its days, 1 or the preserves' 2. */
export const STATION_JOB_RULES: Readonly<Record<StationJobId, { readonly days: number; readonly name: string }>> = {
  flour: { days: 1, name: 'Flour' },
  'sugars-oils': { days: 1, name: 'Sugars and oils' },
  preserves: { days: 2, name: 'Preserves' },
  planks: { days: 1, name: 'Planks' },
  drying: { days: 1, name: 'Drying' },
  smoking: { days: 1, name: 'Smoking' },
}
