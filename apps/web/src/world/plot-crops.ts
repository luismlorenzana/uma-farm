import { cropLook, type CropId } from '@farm/domain'
import type { GroundPoint } from './farm-region-stage'

type Form = 'root' | 'rosette' | 'spear' | 'grain' | 'flower' | 'vine' | 'stem' | 'shrub' | 'tree'
type Design = readonly [Form, string, string, number, number]
type Look = NonNullable<ReturnType<typeof cropLook>>
type Stamp = (shape: 'box' | 'round' | 'cone', color: string, at: GroundPoint, size: GroundPoint, roll?: number) => void

/** Form, foliage, harvest color, full height, and spread within one tile. */
const DESIGNS: Record<CropId, Design> = {
  carrot: ['root', '#588941', '#ec823b', .37, .39],
  potato: ['root', '#526a36', '#ab8759', .26, .59],
  mint: ['stem', '#478574', '#c9add4', .34, .46],
  onion: ['spear', '#648f6a', '#d9b181', .37, .29],
  cabbage: ['rosette', '#5b855b', '#a3b587', .26, .62],
  asparagus: ['spear', '#608645', '#8a606c', .53, .39],
  tomato: ['stem', '#4f7831', '#d74835', .56, .51],
  basil: ['stem', '#6e933b', '#d7dec0', .42, .54],
  'bell-pepper': ['stem', '#406341', '#e58a30', .54, .41],
  eggplant: ['stem', '#607949', '#75528a', .51, .57],
  'sunflower-seed': ['flower', '#638132', '#efc146', .78, .42],
  corn: ['grain', '#608337', '#ebbb44', .83, .53],
  wheat: ['grain', '#8c8a47', '#d1a359', .56, .42],
  peanut: ['root', '#779045', '#cca466', .19, .56],
  rice: ['grain', '#749454', '#c7c280', .39, .36],
  'sugar-beet': ['root', '#728847', '#e3cc9e', .31, .57],
  'emperor-pumpkin': ['vine', '#65863b', '#cf6c34', .23, .66],
  buckwheat: ['flower', '#748544', '#ead4c2', .35, .37],
  oats: ['grain', '#88915c', '#dcc292', .52, .44],
  barley: ['grain', '#889756', '#c2a06d', .58, .35],
  rye: ['grain', '#6f845e', '#b8a270', .64, .37],
  ginger: ['spear', '#538544', '#e2b780', .54, .50],
  'golden-carrot': ['root', '#7a9b47', '#f8c540', .47, .48],
  sunwheat: ['grain', '#9b9346', '#ffd251', .68, .49],
  moonrice: ['grain', '#638e9c', '#d8d5f4', .43, .45],
  'wild-rice': ['grain', '#647d4d', '#826444', .61, .43],
  mandrake: ['root', '#79577e', '#b58969', .39, .53],
  radish: ['root', '#5d8f4e', '#cf4d61', .27, .38],
  lettuce: ['rosette', '#83a751', '#b6cd66', .29, .60],
  'green-peas': ['stem', '#64884a', '#abc45d', .57, .37],
  strawberry: ['vine', '#568251', '#dc505a', .21, .51],
  raspberry: ['shrub', '#658746', '#cb4365', .61, .57],
  plum: ['tree', '#677d71', '#7e50a0', .98, .46],
  cucumber: ['vine', '#5d854c', '#79b057', .25, .64],
  okra: ['stem', '#67803a', '#98b44e', .65, .41],
  zucchini: ['vine', '#507348', '#488944', .29, .59],
  peach: ['tree', '#7f9757', '#f0a17b', 1.02, .56],
  blueberry: ['shrub', '#497c68', '#676fbd', .50, .53],
  mango: ['tree', '#4c7852', '#e8ac4f', 1.12, .59],
  turnip: ['root', '#749751', '#d5a9be', .31, .43],
  'sweet-potato': ['root', '#766c49', '#ba6264', .21, .58],
  'winter-squash': ['vine', '#688044', '#c3a846', .3, .56],
  apple: ['tree', '#56813b', '#d64b42', 1.03, .59],
  pear: ['tree', '#6f883f', '#d4bc5d', 1.17, .44],
  grape: ['shrub', '#6c8544', '#81518c', .67, .55],
  leek: ['spear', '#497c62', '#b4bd9e', .53, .30],
  cauliflower: ['rosette', '#668669', '#f2e4c3', .32, .52],
  'red-beet': ['root', '#906052', '#ae486c', .32, .50],
  orange: ['tree', '#438363', '#f39a35', .94, .57],
  persimmon: ['tree', '#817d47', '#d47847', 1.06, .51],
  pomegranate: ['tree', '#547d53', '#b84c55', .83, .62],
}

const GROWTH: Record<Look, number> = { seed: 0, sprout: .27, growing: .59, nearly: .85, ripe: 1, dormant: 1 }

/** Draw one plant, returning the height for a ripe item marker. Small canopies leave the next row visible. */
export function drawPlotCrop(stamp: Stamp, crop: CropId, look: Look, x: number, z: number): number | null {
  const [form, foliage, produce, height, spread] = DESIGNS[crop]
  const y = .105
  const stem = '#557040'
  const growth = GROWTH[look]
  const h = height * growth
  const w = spread * growth
  const ripe = look === 'ripe'
  if (look === 'seed') {
    stamp('round', '#dbb376', [x, y + .024, z], [.078, .05, .10])
    return null
  }
  if (look === 'sprout') {
    for (const side of [-1, 1]) stamp('round', foliage, [x + side * .059, y + .067 + h * .3, z], [.14, h * .47 + .04, .087], side * .38)
    return null
  }

  if (form === 'tree' || form === 'shrub') {
    const trunk = form === 'tree' ? .66 : .53
    stamp('box', '#7a573d', [x, y + h * trunk / 2, z], [form === 'tree' ? .09 : .045, h * trunk, .07])
    for (const side of [-1, 1]) {
      stamp('box', '#7a573d', [x + side * w * .15, y + h * .57, z], [.045, h * .44, .044], -side * .59)
      if (look !== 'dormant') stamp('round', foliage, [x + side * w * .21, y + h * .68, z], [w * .66, h * .38, w * .59])
      if (ripe) stamp('round', produce, [x + side * w * .27, y + h * .59, z + w * .30], [.105, .12, .11])
    }
    if (look !== 'dormant') stamp('round', foliage, [x, y + h * .80, z - .06], [w * .84, h * .32, w * .7])
  } else if (form === 'root' || form === 'rosette' || form === 'vine') {
    const bulb = form === 'rosette' ? .65 : form === 'vine' ? .56 : .32
    for (const side of [-1, 1]) {
      stamp('round', foliage, [x + side * w * .28, y + h * .55, z], [w * .7, h * .57, w * .53], side * .48)
      if (form !== 'root') stamp('round', foliage, [x + side * w * .13, y + h * .45, z + side * w * .25], [w * .56, h * .54, w * .62])
    }
    if (ripe || look === 'nearly') stamp('round', ripe ? produce : foliage, [x, y + h * .34, z + .07], [w * bulb, h * bulb, w * bulb])
  } else if (form === 'grain' || form === 'spear') {
    for (const side of [-1, 0, 1]) {
      const top = h * (side === 0 ? 1 : .76)
      stamp('box', foliage, [x + side * w * .20, y + top * .47, z], [.035, top * .95, .035], -side * .20)
      stamp('round', ripe ? produce : foliage, [x + side * w * .34, y + top * .87, z], [.085, top * .32, .077], -side * .18)
    }
  } else {
    stamp('box', stem, [x, y + h * .46, z], [.042, h * .91, .045])
    for (const side of [-1, 1]) {
      stamp('round', foliage, [x + side * w * .24, y + h * (.54 + side * .12), z], [w * .64, h * .25, w * .47], side * .44)
      if (form === 'stem' && ripe) stamp('round', produce, [x + side * w * .32, y + h * .42, z + .10], [.108, .13, .106])
    }
    if (form === 'flower' && (ripe || look === 'nearly')) {
      stamp('round', ripe ? produce : foliage, [x, y + h * .84, z + .06], [w * .67, w * .65, .11])
      stamp('round', '#89643d', [x, y + h * .84, z + .12], [w * .28, w * .29, .08])
    }
  }
  return ripe ? y + (form === 'tree' || form === 'shrub' ? h * .68 : h * .59) + .13 : null
}
