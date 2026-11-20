import { CROPS, FIELD_COLUMNS, FIELD_ROWS } from '@farm/domain'
import type { LookScene, SceneLight } from '@luismlorenzana/uma-stage/look'
import {
  BoxGeometry, CylinderGeometry, DataTexture, Group, IcosahedronGeometry, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  NearestFilter, Object3D, Shape, ShapeGeometry, Sprite, SpriteMaterial, SRGBColorSpace,
  type BufferGeometry, type Texture,
} from 'three'
import { visibleHands, type BandHand, type BandPlace, type BandState } from './field-pond-state'

type Point = readonly [number, number, number]
export const BAND_ANCHORS: Record<BandPlace, Point> = {
  forest: [4.7, 0.75, 11.5], fields: [16.8, 0.5, 9.5], fishery: [16.5, 0.35, 17.4],
  bin: [28.7, 0.95, 11.4], farmhouse: [37.6, 2.85, 6.5],
}
export const BAND_TARGET: Point = [23, 0.25, 10]

const SEASONS = {
  spring: { grass: '#8ca45b', leaf: '#789748', tip: '#a7b758', water: '#31766d', path: '#c1aa76' },
  summer: { grass: '#789752', leaf: '#4e783b', tip: '#829c46', water: '#317870', path: '#bd9d6e' },
  autumn: { grass: '#ab8d51', leaf: '#aa6138', tip: '#d99c51', water: '#467976', path: '#c7a176' },
  winter: { grass: '#c4cec7', leaf: '#597771', tip: '#a2b7ad', water: '#4d7989', path: '#c8beb0' },
} as const

const TREES = [
  [1.3, 2.8, 1.06], [3.7, 2, 0.92], [6.2, 1.9, 1.25], [8.9, 2.0, 0.84],
  [2.3, 5.7, 1.24], [5.6, 5.3, 1.04], [7.5, 4.5, 0.91], [3.1, 8.1, 0.95],
  [1.5, 10.4, 1.1], [6.3, 8.5, 1.0], [4.7, 11.08, 0.87], [2.5, 13.05, 1.06],
  [2.1, 16.7, 0.87], [6.9, 14.1, 0.71], [11.0, 0.95, 0.72], [22.3, 1.0, 0.75],
  [40.1, 1.21, 0.68], [43.4, 4.0, 1.0], [45.5, 2.2, 0.8], [45.2, 8.61, 0.85],
] as const
const HAND_POSITIONS: Record<BandHand['place'], readonly Point[]> = {
  fields: [[13.1, 0, 8.7], [18.9, 0, 7.3], [20.8, 0, 9.9]],
  forest: [[7.1, 0, 10.7]], fishery: [[21.65, 0, 13.4]], bin: [[29.6, 0, 11.6]],
}

/** A warm low sun in the morning and a cool late-day fill. The grade runs in the shared post pipeline. */
export function bandLight(dusk: boolean): SceneLight {
  return {
    key: {
      colour: dusk ? '#afbfef' : '#fff0cc', intensity: dusk ? 1.1 : 2.25,
      from: dusk ? [-15, 19, 28] : [-5, 28, 14], to: BAND_TARGET, box: 32,
    },
    hemi: { sky: dusk ? '#9eafdc' : '#e5ecd6', ground: dusk ? '#4d536a' : '#7d6951', intensity: dusk ? 1.05 : 1.35 },
    sky: [dusk ? '#283651' : '#b6c4a6'],
    fog: { colour: dusk ? '#374764' : '#c4d1b1', density: dusk ? 0.012 : 0.008 },
    exposure: dusk ? 0.9 : 1.05,
    post: { grade: true, contrast: 1.09, saturation: 1.13, split: 0.21, aberration: 0, vignette: 0.24 },
    rim: { colour: '#efdad0', strength: 0, dir: [1, 1] },
  }
}

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

/** Repeat terrain, trim and vegetation in batches by geometry and material. */
class Stamps {
  private readonly groups = new Map<BufferGeometry, Map<MeshStandardMaterial, Matrix4[]>>()
  private readonly object = new Object3D()

  add(geometry: BufferGeometry, material: MeshStandardMaterial, at: Point, size: Point, tilt = 0, yaw = 0) {
    this.object.position.set(...at)
    this.object.scale.set(...size)
    this.object.rotation.set(tilt, yaw, 0)
    this.object.updateMatrix()
    let materials = this.groups.get(geometry)
    if (!materials) this.groups.set(geometry, materials = new Map())
    let matrices = materials.get(material)
    if (!matrices) materials.set(material, matrices = [])
    matrices.push(this.object.matrix.clone())
  }

  commit(root: Group, shadows = true) {
    for (const [geometry, materials] of this.groups) {
      for (const [material, matrices] of materials) {
        const mesh = new InstancedMesh(geometry, material, matrices.length)
        matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
        mesh.instanceMatrix.needsUpdate = true
        mesh.castShadow = shadows
        mesh.receiveShadow = true
        root.add(mesh)
      }
    }
    this.groups.clear()
  }
}

function removeInstances(group: Group) {
  for (const child of [...group.children]) {
    if (child instanceof InstancedMesh) child.dispose()
    child.removeFromParent()
  }
}

function shoreline() {
  const outline = new Shape()
  for (let step = 0; step < 40; step++) {
    const t = step * Math.PI / 20
    const edge = 1 + 0.065 * Math.sin(t * 3 + 0.4) + 0.038 * Math.cos(t * 5)
    const x = edge * Math.cos(t)
    const z = edge * Math.sin(t)
    if (step === 0) outline.moveTo(x, z)
    else outline.lineTo(x, z)
  }
  outline.closePath()
  return new ShapeGeometry(outline).rotateX(-Math.PI / 2)
}

const SPRITE = [
  '..O....O....', '..H....H....', '..HHHHHH....', '.HHHHHHHH...', '.HHKHKKHH...',
  '.HKKKKKKH...', '..KOKKOK....', '..HKKKKH....', '..HLLLLH....', '.TTTTTTTT...',
  '.TKTTTTK....', '..TTTTTT....', '..TTTTTT....', '..BBBBBB....', '..BB..BB....', '.LLL..LLL...',
]
const TOOLS: Partial<Record<BandHand['job'], readonly [string, number, number][]>> = {
  water: [['#75c7c4', 9, 9], ['#75c7c4', 10, 9], ['#75c7c4', 11, 10], ['#b9e6e2', 11, 12]],
  fish: [['#d8b881', 9, 9], ['#d8b881', 10, 8], ['#d8b881', 11, 7], ['#e8dec4', 11, 8], ['#e8dec4', 11, 9]],
  chop: [['#b9b3a2', 10, 6], ['#b9b3a2', 11, 6], ['#a47d50', 10, 7], ['#a47d50', 9, 8]],
  harvest: [['#e28749', 9, 9], ['#e28749', 9, 10], ['#8d9d58', 10, 8]],
  forage: [['#d4ad75', 9, 9], ['#cfad76', 10, 9], ['#a47d50', 9, 10], ['#a47d50', 10, 10]],
  'ship-surplus': [['#bc955f', 9, 9], ['#bc955f', 10, 9], ['#a47d50', 9, 10], ['#a47d50', 10, 10]],
}

/** Original review figures. The record's actual outfit id chooses a stable stand-in palette. */
function handSprite(hand: BandHand): DataTexture {
  const variant = [...hand.id].reduce((seed, letter) => (seed * 31 + letter.charCodeAt(0)) >>> 0, 0) % 5
  const coat = ['#ad506b', '#736aa8', '#c58b4f', '#457e78', '#647dba'][variant]!
  const hair = ['#6d493a', '#3f394b', '#7e583e', '#554134', '#8e513a'][variant]!
  const inks: Record<string, string> = { O: '#372b38', H: hair, K: '#e9b48a', T: coat, B: '#4d4255', L: '#eed9b1' }
  const pixels = new Uint8Array(12 * 16 * 4)
  function pixel(color: string, x: number, y: number) {
    const rgb = Number.parseInt(color.slice(1), 16)
    pixels.set([rgb >> 16, (rgb >> 8) & 255, rgb & 255, 255], ((15 - y) * 12 + x) * 4)
  }
  SPRITE.forEach((row, y) => [...row].forEach((ink, x) => { if (inks[ink]) pixel(inks[ink], x, y) }))
  for (const [ink, x, y] of TOOLS[hand.job] ?? []) pixel(ink, x, y)
  const texture = new DataTexture(pixels, 12, 16)
  texture.magFilter = texture.minFilter = NearestFilter
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export interface FieldPondScene extends LookScene {
  setBand(view: BandState): void
}

export function buildFieldPond(initial: BandState): FieldPondScene {
  const root = new Group(), fixed = new Group(), crops = new Group(), people = new Group()
  root.add(fixed, crops, people)
  const box = new BoxGeometry(), pebble = new IcosahedronGeometry(1, 0), crown = new IcosahedronGeometry(1, 1)
  const log = new CylinderGeometry(.48, .57, 1, 6), oval = shoreline()
  const materials: MeshStandardMaterial[] = []
  const paint = (color: string, detail: Partial<Pick<MeshStandardMaterial, 'roughness' | 'metalness' | 'emissiveIntensity'>> = {}) => {
    const material = new MeshStandardMaterial({ color, roughness: 0.88, ...detail })
    materials.push(material)
    return material
  }
  const base = paint('#796047'), grass = paint('#8ca45b'), leaf = paint('#789748'), tip = paint('#a7b758')
  const path = paint('#c1aa76'), bank = paint('#92805b'), water = paint('#31766d', { roughness: 0.46, metalness: 0.13 })
  const glint = paint('#8db8a3'), treeTrunk = paint('#765941'), timber = paint('#926a45'), trim = paint('#684d39')
  const soil = paint('#996f53'), wet = paint('#664e41'), uncultivated = paint('#b5a171'), stones = paint('#8a8a7c')
  const boards = paint('#c4a578'), plaster = paint('#cbb89a'), shingles = paint('#a65c49'), roofGreen = paint('#648777')
  const window = paint('#719087'), plant = paint('#628749'), ripe = paint('#e7a454')
  const flower = paint('#d4a28c')
  const rng = seeded(7828), scenery = new Stamps()
  const put = (material: MeshStandardMaterial, at: Point, size: Point, tilt = 0, yaw = 0) => scenery.add(box, material, at, size, tilt, yaw)
  put(base, [23.5, -.9, 10.5], [47, 1.65, 21])
  put(grass, [23.5, -.1, 10.5], [47, .2, 21])
  put(path, [24.5, .016, 10.3], [1.9, .029, 19.6])
  put(path, [35.2, .027, 10.35], [22.9, .036, 1.94])
  put(path, [17.0, .015, 10.2], [14, .03, 1.22])
  scenery.add(oval, bank, [16.16, .028, 16.02], [7.12, 1, 4.25])
  scenery.add(oval, water, [16.16, .045, 16.10], [6.55, 1, 3.73])
  for (let i = 0; i < 9; i++) put(boards, [20.2 + i * .16, .13, 13.7], [.14, .095, .93])
  for (const [x, z, size] of TREES) {
    scenery.add(log, treeTrunk, [x, size * 1.25, z], [size * .38, size * 2.5, size * .38])
    for (const [dx, y, dz, w] of [[-.59, 2.55, -.04, 1.09], [.65, 2.67, .18, 1.02], [.12, 3.34, -.15, 1.2], [-.39, 3.7, .26, .82]] as const) {
      scenery.add(crown, y >= 3.3 ? tip : leaf, [x + dx * size, y * size, z + dz * size], [w * size, w * size * .72, w * size * .92], 0, rng() * 2)
    }
  }
  for (const [x, z] of [[8.5, 15.1], [10, 18.1], [13.4, 19.9], [20.1, 19.5], [22.5, 17.5], [22.25, 13.05]] as const) {
    for (let i = 0; i < 6; i++) {
      const h = .17 + rng() * .44
      put(i % 3 === 0 ? tip : leaf, [x + rng() * .9, h * .5, z + rng() * .31], [.055, h, .045], rng() * .2)
    }
    scenery.add(pebble, stones, [x - .18, .13, z + .2], [.28, .18, .24], 0, rng())
  }
  const fence = (x: number, z: number, posts: number) => {
    const length = (posts - 1) * .88
    for (let i = 0; i < posts; i++) put(trim, [x + i * .88, .32, z], [.12, .64, .12])
    for (const y of [.28, .50]) put(timber, [x + length * .5, y, z], [length, .09, .085])
  }
  fence(11.0, 2.21, 14)
  fence(26.4, 17, 4)
  fence(32.5, 17, 12)
  for (const [x, z] of [[27, 15.3], [35.6, 16.1], [39.8, 18.4], [43.8, 13.9], [8, 12.8]] as const) {
    for (let i = 0; i < 8; i++) {
      const dx = rng() * 1.45, dz = rng() * .61
      put(grass, [x + dx, .1, z + dz], [.053, .2, .06])
      put(flower, [x + dx, .22, z + dz], [.12, .083, .11])
    }
  }
  function house(x: number, z: number, w: number, d: number, h: number, roof: MeshStandardMaterial) {
    put(stones, [x, .2, z], [w + .25, .4, d + .25])
    put(plaster, [x, h * .5 + .25, z], [w, h, d])
    put(boards, [x, h * .5 + .25, z + d * .5 + .02], [w + .09, h, .072])
    put(trim, [x - .12, .92, z + d * .5 + .079], [1.0, 1.55, .084])
    for (const u of [-w * .29, w * .29]) {
      put(trim, [x + u, h * .64, z + d * .5 + .08], [.83, .83, .13])
      put(window, [x + u, h * .64, z + d * .5 + .16], [.66, .62, .09])
      put(boards, [x + u, h * .64, z + d * .5 + .22], [.049, .63, .034])
    }
    for (const side of [-1, 1]) {
      const half = d * .5 + .24, rise = 1.47, depth = Math.hypot(half, rise)
      const tilt = side * Math.atan2(rise, half)
      put(trim, [x, h + .23 + rise * .45, z + side * half * .5], [w + .62, .17, depth], tilt)
      for (let row = 0; row < 7; row++) {
        const t = (row + .5) / 7
        put(roof, [x, h + .36 + rise * (1 - t), z + side * half * t], [w + .55, .16, depth / 7 + .026], tilt)
      }
    }
    put(trim, [x, h + 1.8, z], [w + .64, .17, .22])
    put(stones, [x + w * .3, h + 1.66, z - d * .22], [.64, 1.5, .64])
    put(boards, [x + w * .3, h + 2.42, z - d * .22], [.74, .13, .74])
  }
  house(38.25, 5.05, 7.1, 4.85, 2.62, shingles)
  house(30.0, 4.95, 3.9, 3.08, 1.76, roofGreen)
  for (const [x, z, w] of [[28.25, 11.0, 1.05], [29.36, 11.22, .6], [28.03, 12.03, .64]] as const) {
    put(timber, [x, w * .34, z], [w, w * .68, w])
    put(boards, [x, w * .69, z], [w + .06, .1, w + .06])
  }
  scenery.commit(fixed)

  const ripples = new Group()
  const rippleStamps = new Stamps()
  for (let i = 0; i < 22; i++) {
    const t = rng() * Math.PI * 2, r = Math.sqrt(rng()) * .83
    rippleStamps.add(box, glint, [16.16 + Math.cos(t) * 6.2 * r, .056, 16.1 + Math.sin(t) * 3.51 * r], [.08 + rng() * .45, .009, .045])
  }
  rippleStamps.commit(ripples, false)
  root.add(ripples)
  const figures: Mesh[] = []
  const sprites: { sprite: Sprite; material: SpriteMaterial; texture: Texture; y: number }[] = []

  function clearSprites() {
    for (const { sprite, material, texture } of sprites) {
      sprite.removeFromParent()
      material.dispose()
      texture.dispose()
    }
    sprites.length = 0
  }

  function setBand(view: BandState) {
    const color = SEASONS[view.season]
    grass.color.set(color.grass); leaf.color.set(color.leaf); tip.color.set(color.tip)
    path.color.set(color.path); water.color.set(color.water)
    window.emissive.set(view.dusk ? '#ffd093' : '#000000')
    window.emissiveIntensity = view.dusk ? 0.82 : 0
    removeInstances(crops)
    const tiles = new Stamps()
    for (let n = 0; n < FIELD_COLUMNS * FIELD_ROWS; n++) {
      const x = 11.55 + n % FIELD_COLUMNS * 1.48, z = 3.0 + Math.floor(n / FIELD_COLUMNS) * 1.27
      const tile = view.tiles[n]
      const ground = !tile || tile.ground !== 'tilled' ? uncultivated : tile.watered ? wet : soil
      tiles.add(box, ground, [x, .04, z], [1.40, .13, 1.17])
      if (tile?.ground === 'stone') tiles.add(pebble, stones, [x, .26, z], [.31, .25, .30])
      if (tile?.ground === 'stump') tiles.add(log, treeTrunk, [x, .25, z], [.38, .36, .40])
      if (tile?.ground === 'weeds') {
        for (const offset of [-.16, .03, .17]) tiles.add(box, leaf, [x + offset, .24, z], [.07, .33, .07], 0)
      }
      if (!tile?.look || !tile.crop) continue
      const height = { seed: .12, sprout: .29, growing: .46, nearly: .68, dormant: .86, ripe: .73 }[tile.look]
      const woody = Boolean(CROPS[tile.crop].woody)
      const size = woody ? .34 : .20
      tiles.add(box, woody ? treeTrunk : plant, [x, height * .5 + .11, z], [.09, height, .09])
      if (tile.look !== 'seed' && tile.look !== 'dormant') {
        tiles.add(crown, plant, [x, height + .06, z], [size, height * .29, size])
        if (tile.look === 'ripe') tiles.add(pebble, ripe, [x + size * .45, height + .025, z + size * .24], [.15, .19, .15])
      }
    }
    tiles.commit(crops)
    clearSprites()
    const used = { fields: 0, forest: 0, fishery: 0, bin: 0 }
    for (const hand of visibleHands(view)) {
      const [x, y, z] = HAND_POSITIONS[hand.place][used[hand.place]++]!
      const texture = handSprite(hand)
      const material = new SpriteMaterial({ map: texture, color: view.dusk ? '#c0c4d9' : '#fff8eb', alphaTest: .5 })
      const sprite = new Sprite(material)
      sprite.position.set(x, y + .11, z)
      sprite.center.set(.5, 0)
      sprite.scale.set(1.38, 1.84, 1)
      people.add(sprite)
      sprites.push({ sprite, material, texture, y: y + .11 })
    }
  }

  const camera = { label: 'Field and Pond', target: BAND_TARGET, elevation: 41, azimuth: -18, distance: 53, fov: 31 }
  const scene: FieldPondScene = {
    id: 'field-pond', title: 'Field and Pond', root, figures, light: bandLight(initial.dusk),
    cameras: { front: camera, tactics: camera, high: camera }, layers: {},
    setBand,
    update(t) {
      ripples.position.x = Math.sin(t * .87) * .12
      for (const [i, hand] of sprites.entries()) hand.sprite.position.y = hand.y + Math.max(0, Math.sin(t * 2.1 + i)) * .03
    },
    dispose() {
      clearSprites()
      for (const group of [fixed, crops, ripples]) removeInstances(group)
      for (const geometry of [box, pebble, crown, log, oval]) geometry.dispose()
      for (const material of materials) material.dispose()
      root.clear()
    },
  }
  setBand(initial)
  return scene
}
