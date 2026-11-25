import { NearestFilter, Sprite, SpriteMaterial, SRGBColorSpace, Texture } from 'three'

interface Size { width: number; height: number }
interface Point { x: number; y: number }

export function pixelBillboard(image: HTMLImageElement | HTMLCanvasElement, cell: Size, page: Size, foot: Point, height: number, night: boolean) {
  const texture = new Texture(image)
  texture.minFilter = texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = SRGBColorSpace
  texture.repeat.set(cell.width / page.width, cell.height / page.height)
  texture.needsUpdate = true
  const sprite = new Sprite(new SpriteMaterial({ map: texture, color: night ? '#d8d6ef' : '#fff9ee', alphaTest: .38, toneMapped: false }))
  sprite.center.set(foot.x / cell.width, 1 - foot.y / cell.height)
  sprite.scale.set(height * cell.width / cell.height, height, 1)
  return {
    sprite,
    frame({ x, y }: Point, mirror = false) {
      texture.repeat.x = (mirror ? -1 : 1) * cell.width / page.width
      texture.offset.set((x + (mirror ? cell.width : 0)) / page.width, 1 - (y + cell.height) / page.height)
    },
    dispose() {
      sprite.removeFromParent()
      texture.dispose()
      sprite.material.dispose()
    },
  }
}
