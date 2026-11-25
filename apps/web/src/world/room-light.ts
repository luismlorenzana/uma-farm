import type { SceneLight, TierName } from '@luismlorenzana/uma-stage/look'
import { Color, Group, Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from 'three'
import type { ScenePhase } from '../dialogue/scene-context'
import type { GroundPoint } from './farm-region-stage'
import type { RoomId } from './room-specs'

const heat = new Set<RoomId>(['forge', 'smelter', 'smith', 'smokehouse'])
const rock = new Set<RoomId>(['mine', 'quarry'])
export function roomLights(place: RoomId, phase: ScenePhase, base: SceneLight): SceneLight {
  const night = phase === 'night'
  const afternoon = phase === 'afternoon'
  const fire = heat.has(place)
  const cave = rock.has(place)
  return {
    ...base,
    sky: night ? ['#141d2e', '#302a35'] : ['#535464', '#a99c89'],
    key: { ...base.key, to: [0, .5, 0], box: 8.7,
      from: night ? [3, 7, 3] : afternoon ? [6, 10, -5] : [-5, 9, -6],
      colour: night ? '#c3d1ed' : afternoon ? '#ffe0a9' : '#fff1d0',
      intensity: cave ? .52 : night ? .85 : 2.55 },
    hemi: { sky: night ? '#b9ccee' : '#dfecf5', ground: fire ? '#b17c52' : '#91746a', intensity: cave ? .9 : night ? 1.18 : 1.48 },
    exposure: night ? 1.22 : 1.02,
    post: { ...base.post, saturation: 1.05, contrast: 1.11, split: .14, vignette: .12, aberration: 0,
      bloomStrength: night ? .29 : .16, bloomThreshold: 1.12, bloomRadius: .5, maxblur: .0024, aperture: .00028 },
  }
}

/** Sources with practical bulbs plus a small radius. Static contact comes from the model and the atlas figure decal. */
export function mountPracticalLights(root: Group, place: RoomId, phase: ScenePhase, quality: TierName) {
  const night = phase === 'night'
  const cave = rock.has(place)
  const fire = heat.has(place)
  const sources: GroundPoint[] = cave ? [[-2.5, 1.7, -.6], [3, 1.8, -2.7]]
    : fire ? [[2.9, .94, -2.75], [-4.6, 2.3, -.4]] : [[-4.6, 2.24, -.85], [3.7, 2.21, -1.87]]
  const geometry = new SphereGeometry(.08, 8, 6)
  const material = new MeshBasicMaterial({ color: new Color(fire ? '#ffc46f' : '#ffe2a1').multiplyScalar(night ? 2.4 : 1.1), toneMapped: false })
  const fixtures = sources.map((at, index) => {
    const housing = new Group()
    housing.position.set(...at)
    housing.add(new Mesh(geometry, material))
    if (quality !== 'saver' || index === 0) housing.add(new PointLight(fire || cave ? '#ffaf61' : '#ffc884', night ? 26 : fire ? 13 : 6, night ? 5.6 : 4.2, 2))
    root.add(housing)
    return housing
  })
  return () => {
    for (const fixture of fixtures) fixture.removeFromParent()
    geometry.dispose()
    material.dispose()
  }
}
