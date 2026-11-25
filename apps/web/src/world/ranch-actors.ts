import { ANIMAL_HOME, HOME_ROOM, type Animal, type RanchHome } from '@farm/domain'
import { atlasFigure } from '@luismlorenzana/uma-stage/look'
import { CircleGeometry, Group, Mesh, MeshBasicMaterial, type Object3D } from 'three'
import { ANIMAL_CELL, ANIMAL_FOOT, ANIMAL_PAGE, animalAtlas, animalFrame, animalSize, type AnimalFacing } from './animal-atlas'
import { pixelBillboard } from './pixel-billboard'
import { ENTRANCE, type FloorPoint } from './room-walk'

export interface RanchActor extends FloorPoint { animal: Animal; radius: number }

export function ranchAnimals(animals: readonly Animal[], home: RanchHome): Animal[] {
  return animals.filter(animal => ANIMAL_HOME[animal.kind] === home).slice(0, HOME_ROOM)
}

export function penAnimals(animals: readonly Animal[], x: number, z: number): RanchActor[] {
  return animals.map((animal, index) => ({
    animal, x: x + (index % 4 - 1.5) * .93, z: z + 2.03 + Math.floor(index / 4) * .93, radius: .14,
  }))
}

/** Reserve eight separated marks away from furniture and the room entrance. */
export function roomAnimals(animals: readonly Animal[], clear: (point: FloorPoint) => boolean): RanchActor[] {
  const marks: FloorPoint[] = []
  const radius = .15
  for (const z of [-.7, .65, 1.95, -2.05, 3.1]) {
    for (const x of [-3.65, -2.25, 2.25, 3.65, 0, -1.23, 1.23]) {
      if (Math.hypot(x - ENTRANCE.x, z - ENTRANCE.z) < 1) continue
      if (![-radius, radius].every(dx => [-radius, radius].every(dz => clear({ x: x + dx, z: z + dz })))) continue
      if (marks.some(mark => Math.hypot(x - mark.x, z - mark.z) < 1.1)) continue
      marks.push({ x, z })
    }
  }
  return animals.flatMap((animal, i) => marks[i] ? [{ ...marks[i]!, animal, radius }] : [])
}

export function mountAnimals(root: Object3D, actors: readonly RanchActor[], night: boolean, lit = false) {
  const geometry = new CircleGeometry(1, 16)
  const shadow = new MeshBasicMaterial({ color: '#42382d', opacity: .33, transparent: true, depthWrite: false })
  const fed = new MeshBasicMaterial({ color: '#82c77b', toneMapped: false })
  const hungry = new MeshBasicMaterial({ color: '#e6a771', toneMapped: false })
  const ready = new MeshBasicMaterial({ color: '#ffdc74', toneMapped: false })
  function dot(scaleX: number, scaleY: number, material: MeshBasicMaterial) {
    const mark = new Mesh(geometry, material)
    mark.rotation.x = -Math.PI / 2
    mark.scale.set(scaleX, scaleY, 1)
    return mark
  }
  const herd = actors.map(({ animal, x, z, radius }, index) => {
    const group = new Group()
    const size = animalSize(animal.kind)
    const image = animalAtlas(animal.kind)
    const interior = lit ? atlasFigure(image, ANIMAL_CELL, ANIMAL_PAGE, ANIMAL_FOOT, size) : null
    const billboard = interior ? {
      sprite: interior.sprite,
      frame(at: { x: number; y: number }, mirror: boolean) { interior.sprite.scale.x = mirror ? -1 : 1; interior.frame(at) },
      dispose: interior.dispose,
    } : pixelBillboard(image, ANIMAL_CELL, ANIMAL_PAGE, ANIMAL_FOOT, size, night)
    group.add(billboard.sprite)
    const shade = dot(size * .34, size * .20, shadow)
    shade.position.y = .035
    const feed = dot(.061, .061, animal.fed ? fed : hungry)
    feed.position.set(-.095, .042, size * .3)
    group.add(feed)
    if (!lit) group.add(shade)
    if (animal.ready) {
      const produce = dot(.072, .072, ready)
      produce.position.set(.095, .044, size * .3)
      group.add(produce)
    }
    root.add(group)
    return { group, billboard, x, z, radius, offset: (index * 2.13) % 6.2 }
  })

  return {
    draw(time: number, reduced: boolean) {
      for (const { group, billboard, x, z, radius, offset } of herd) {
        const phase = (time * .001 + offset) % 7
        const moving = !reduced && phase < 4
        const theta = phase / 4 * Math.PI * 2
        const dx = moving ? Math.sin(theta) * radius : 0
        const dz = moving ? (1 - Math.cos(theta)) * radius * .5 : 0
        const side = Math.abs(Math.cos(theta)) > .58
        const facing: AnimalFacing = !moving ? 'front' : side ? 'side' : Math.sin(theta) < 0 ? 'back' : 'front'
        billboard.frame(animalFrame(facing, moving ? 1 + Math.floor(phase * 8) % 4 : 0), moving && side && Math.cos(theta) < 0)
        group.position.set(x + dx, 0, z + dz)
      }
    },
    dispose() {
      for (const { group, billboard } of herd) {
        group.removeFromParent()
        billboard.dispose()
      }
      geometry.dispose()
      for (const material of [shadow, fed, hungry, ready]) material.dispose()
    },
  }
}
