import type { AnimalKind } from '@farm/domain'

export const ANIMAL_CELL = { width: 32, height: 32 }
export const ANIMAL_PAGE = { width: 160, height: 96 }
export const ANIMAL_FOOT = { x: 16, y: 29 }
export type AnimalFacing = 'front' | 'back' | 'side'

interface Design {
  coat: string
  light: string
  dark: string
  face: string
  size: number
}
const DESIGN: Record<AnimalKind, Design> = {
  chicken: { coat: '#e5cbaa', light: '#fff0d0', dark: '#8e6052', face: '#e9aa48', size: .64 },
  duck: { coat: '#a87e4a', light: '#d9b16b', dark: '#6e4e37', face: '#e6ad41', size: .60 },
  cow: { coat: '#ead8ba', light: '#fff0d9', dark: '#604439', face: '#d59e88', size: 1.18 },
  goat: { coat: '#a88162', light: '#dfbc87', dark: '#664938', face: '#cd9b6d', size: .89 },
  sheep: { coat: '#d8c5ac', light: '#fff0d7', dark: '#63514a', face: '#977765', size: .93 },
  alpaca: { coat: '#b17c57', light: '#d9a174', dark: '#71463b', face: '#c4946e', size: 1.20 },
  'cashmere-goat': { coat: '#a89583', light: '#dbcbb0', dark: '#665a53', face: '#c4ad92', size: .96 },
}

const atlases = new Map<AnimalKind, HTMLCanvasElement>()
const facings: readonly AnimalFacing[] = ['front', 'back', 'side']
const ink = '#463431'
export const animalSize = (kind: AnimalKind) => DESIGN[kind].size
export const animalFrame = (facing: AnimalFacing, frame: number) => ({ x: frame * ANIMAL_CELL.width, y: facings.indexOf(facing) * ANIMAL_CELL.height })

/** Original pixel artwork. Each cell is planted on the same foot anchor. */
function drawAnimal(ctx: CanvasRenderingContext2D, kind: AnimalKind, facing: AnimalFacing, frame: number) {
  const { coat, light, dark, face } = DESIGN[kind]
  const side = facing === 'side'
  const back = facing === 'back'
  const bob = frame === 2 || frame === 4 ? 1 : 0
  const stride = [0, -1, 0, 1, 0][frame]!
  const poultry = kind === 'chicken' || kind === 'duck'
  const wool = kind === 'sheep' || kind === 'cashmere-goat'
  const long = kind === 'alpaca'
  const cow = kind === 'cow'
  const goat = kind === 'goat' || kind === 'cashmere-goat'
  const rect = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }
  const oval = (color: string, x: number, y: number, width: number, height: number) => {
    for (let j = 0; j < height; j++) {
      const offset = (2 * j + 1 - height) / height
      const w = Math.max(1, Math.round(width * Math.sqrt(1 - offset * offset)))
      rect(color, x + Math.floor((width - w) / 2), y + j, w, 1)
    }
  }

  if (poultry) {
    const duck = kind === 'duck'
    for (const dir of [-1, 1]) {
      const x = 15 + dir * (side ? 3 : 2) + stride * dir
      rect('#a3633a', x, 24 - bob, 1, 4 + bob)
      rect(face, x - 1, 28 - (stride === dir ? 1 : 0), 4, 1)
    }
    if (side || back) oval(dark, side ? 5 : 11, 15 + bob, side ? 8 : 10, 8)
    oval(dark, side ? 7 : 9, 15 + bob, side ? 19 : 14, 12)
    oval(coat, side ? 8 : 10, 15 + bob, side ? 17 : 12, 11)
    oval(light, side ? 10 : 12, 18 + bob, side ? 9 : 7, 6)
    if (back) {
      oval(light, 13, 16 + bob, 6, 7)
      if (!duck) rect('#c85147', 15, 10 + bob, 2, 4)
      oval(coat, 12, 12 + bob, 8, 6)
    } else {
      const headX = side ? 19 : 12
      oval(duck ? '#557864' : light, headX, (duck ? 13 : 10) + bob, 8, 9)
      if (!duck) {
        rect('#b84942', headX + 2, 8 + bob, 4, 3)
        rect('#e26a50', headX + 3, 7 + bob, 2, 2)
        rect('#bb5048', headX + (side ? 5 : 3), 17 + bob, 2, 3)
      }
      rect(ink, headX + (side ? 5 : 2), (duck ? 15 : 13) + bob, 1, 1)
      if (!side) rect(ink, headX + 5, (duck ? 15 : 13) + bob, 1, 1)
      rect(face, headX + (side ? 7 : 2), (duck ? 17 : 15) + bob, duck ? 4 : 3, 2)
    }
    return
  }

  const body = cow ? 23 : wool ? 21 : 18
  const left = side ? 5 : 16 - Math.floor((body - 4) / 2)
  for (const [i, at] of (side ? [left + 2, left + 6, left + body - 7, left + body - 3] : [left + 3, left + body - 8]).entries()) {
    const shift = stride * (i % 2 === 0 ? 1 : -1)
    rect(i % 2 ? dark : coat, at + shift, 22 + bob, 3, 6 - bob)
    rect(ink, at + shift, 27 - Math.max(0, -shift), 3, 2)
  }
  if (side) rect(dark, left - 2, 14 + bob, 3, 4)
  oval(dark, left - 1, 13 + bob, side ? body + 1 : body - 2, 13)
  oval(coat, left, 13 + bob, side ? body - 1 : body - 4, 12)
  oval(light, left + 2, 14 + bob, side ? body - 5 : body - 8, 5)
  if (cow) {
    oval(dark, left + 1, 15 + bob, 7, 8)
    if (side || back) oval(dark, left + body - 9, 13 + bob, 6, 7)
  }
  if (wool) for (let i = 0; i < (side ? 4 : 3); i++) {
    oval(light, left + i * 4, 13 + bob + (i % 2), 6, 6)
    oval(kind === 'sheep' ? coat : light, left + i * 4 + 1, 18 + bob, 6, kind === 'sheep' ? 6 : 8)
  }
  if (back) {
    oval(light, 13, 12 + bob, 6, 7)
    if (long) {
      rect(coat, 13, 7 + bob, 6, 10)
      oval(light, 12, 4 + bob, 8, 6)
      rect(dark, 12, 2 + bob, 2, 5)
      rect(dark, 18, 2 + bob, 2, 5)
    } else {
      rect(dark, 15 + stride, 17 + bob, 2, cow ? 7 : 3)
      if (cow || goat) for (const x of [11, 20]) rect(light, x, 9 + bob, 2, 5)
    }
    return
  }

  const headX = side ? (cow ? 22 : 20) : 12
  const top = (long ? 3 : cow ? 9 : 8) + bob
  if (long) rect(coat, headX, top + 3, 5, 15)
  if (cow || goat || long) {
    rect(goat ? dark : light, headX - 1, top - 2, 2, goat ? 5 : 4)
    if (!side || long) rect(goat ? dark : light, headX + 6, top - 2, 2, 4)
  }
  rect(dark, headX - 2, top + 2, 3, 2)
  if (!side) rect(dark, headX + 7, top + 2, 3, 2)
  oval(wool && !goat ? dark : coat, headX, top, cow ? 9 : 8, long ? 7 : 10)
  if (wool) oval(light, headX - 1, top - 1, 9, 4)
  if (goat) rect(light, headX + (side ? 5 : 3), top + 8, 2, 4)
  oval(face, headX + (side ? 3 : 1), top + (long ? 4 : 6), cow ? 7 : 5, 4)
  rect(ink, headX + (side ? 5 : 1), top + 4, 1, 1)
  if (!side) rect(ink, headX + 6, top + 4, 1, 1)
  rect(dark, headX + (side ? 7 : 3), top + (long ? 6 : 8), 2, 1)
}

export function animalAtlas(kind: AnimalKind): HTMLCanvasElement {
  const cached = atlases.get(kind)
  if (cached) return cached
  const atlas = document.createElement('canvas')
  atlas.width = ANIMAL_PAGE.width
  atlas.height = ANIMAL_PAGE.height
  const ctx = atlas.getContext('2d')!
  for (const facing of facings) for (let frame = 0; frame <= 4; frame++) {
    const { x, y } = animalFrame(facing, frame)
    ctx.save()
    ctx.translate(x, y)
    drawAnimal(ctx, kind, facing, frame)
    ctx.restore()
  }
  atlases.set(kind, atlas)
  return atlas
}
