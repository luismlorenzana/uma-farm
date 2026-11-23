import { ANIMAL_HOME, CROPS, cropLook, dateOf, FIELD_COLUMNS, FIELD_ROWS, placeBuilt, type FarmSave } from '@farm/domain'
import { LookStage, type LookAssets, type LookScene } from '@luismlorenzana/uma-stage/look'
import {
  BoxGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Group, IcosahedronGeometry,
  InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, Vector3,
} from 'three'
import { bandLight } from '../hd2d/field-pond-scene'
import type { FarmEntrance, FarmRegion } from './farm-regions'

export type GroundPoint = readonly [number, number, number]
export interface CameraPose { x: number; z: number; zoom: number }
export interface ScenePoint { x: number; y: number }
export interface RegionScene {
  scene: LookScene
  anchors: ReadonlyMap<string, GroundPoint>
  width: number
  depth: number
}

const EMPTY: LookAssets = {
  index: async () => ({ version: 1, kit: { path: '', bytes: 0, sha256: '' }, cast: {} }),
  kit: async () => new ArrayBuffer(0),
  sprite: async () => null,
}
const tones = {
  spring: ['#92a95d', '#648542', '#a4b858'], summer: ['#7b9c52', '#4c743d', '#8dab50'],
  autumn: ['#beab62', '#b77839', '#c99346'], winter: ['#bbc9c3', '#658579', '#d4ddd8'],
} as const

/** A small local kit, batched by shape and finish. Scene inputs are saved state and existing entrances. */
export function buildRegion(region: FarmRegion, save: FarmSave, entrances: readonly FarmEntrance[], night: boolean): RegionScene {
  const root = new Group()
  const anchors = new Map<string, GroundPoint>()
  const [grass, leaf, lightLeaf] = tones[dateOf(save.calendar.day, save.calendar).season]
  const shapes = {
    box: new BoxGeometry(), roof: new CylinderGeometry(.5, .5, 1, 3),
    round: new IcosahedronGeometry(.65, 1), cone: new ConeGeometry(.7, 1.3, 7), disc: new CircleGeometry(1, 24),
  }
  const palette = new Map<string, MeshStandardMaterial>()
  const batches = new Map<string, Matrix4[]>()
  const transform = new Object3D()
  function stamp(shape: keyof typeof shapes, color: string, at: GroundPoint, size: GroundPoint, roll = 0, pitch = 0, yaw = 0) {
    transform.position.set(...at)
    transform.scale.set(...size)
    transform.rotation.set(pitch, yaw, roll)
    transform.updateMatrix()
    const key = shape + ':' + color
    const instances = batches.get(key) ?? []
    instances.push(transform.matrix.clone())
    batches.set(key, instances)
    if (!palette.has(color)) palette.set(color, new MeshStandardMaterial({ color, roughness: .9 }))
  }
  function tree(x: number, z: number, height = 1, pine = false) {
    stamp('box', '#72513b', [x, .51 * height, z], [.28 * height, 1.05 * height, .32 * height])
    stamp(pine ? 'cone' : 'round', leaf, [x, 1.45 * height, z], [1.1 * height, 1.26 * height, height])
    stamp('round', lightLeaf, [x - .23 * height, 1.72 * height, z + .14], [.72 * height, .71 * height, .72 * height])
  }
  function house(x: number, z: number, id: string) {
    const work = region === 'work'
    const siding = region === 'barns' ? '#a65542' : work ? '#a4a091' : '#cfb180'
    stamp('box', '#b0a08a', [x, .15, z], [3.95, .3, 2.9])
    stamp('box', siding, [x, 1.05, z], [3.6, 1.95, 2.7])
    stamp('roof', work ? '#59666a' : '#8a5a4a', [x, 2.45, z], [1.65, 4.08, 3.3], Math.PI / 2)
    stamp('box', '#6c4736', [x, .83, z + 1.38], [.82, 1.56, .08])
    stamp('box', night ? '#e5a853' : '#729393', [x - 1.08, 1.36, z + 1.39], [.54, .55, .085])
    if (id !== 'coop' && id !== 'barn') stamp('box', '#8b7d75', [x + 1.04, 2.88, z - .54], [.46, 1.18, .48])
  }
  function field(centerX: number, centerZ: number, plot: number) {
    const tiles = save.fields.plots[plot]?.tiles ?? []
    for (const [i,tile] of tiles.entries()) {
      const x = centerX + (i % FIELD_COLUMNS - (FIELD_COLUMNS - 1) / 2) * .79
      const z = centerZ + (Math.floor(i / FIELD_COLUMNS) - (FIELD_ROWS - 1) / 2) * .68
      stamp('box', tile.ground === 'tilled' ? (tile.watered ? '#69493a' : '#a37852') : grass, [x,.05,z], [.75,.1,.64])
      if (tile.ground === 'stone') stamp('round', '#8a9384', [x,.24,z],[.43,.38,.41])
      if (tile.ground === 'stump') stamp('box', '#78573f', [x,.19,z],[.42,.38,.39])
      if (tile.ground === 'weeds') stamp('cone', leaf, [x,.22,z],[.42,.34,.42])
      const look = cropLook(tile)
      if (!look || !tile.crop) continue
      const woody = CROPS[tile.crop].woody
      if (woody && look !== 'seed' && look !== 'sprout') {
        tree(x,z,look === 'ripe' ? .58 : .43)
        if (look === 'ripe') stamp('round','#cb7140',[x+.14,.78,z+.12],[.18,.18,.18])
      } else {
        const size = look === 'seed' ? .11 : look === 'sprout' ? .24 : look === 'ripe' ? .49 : .36
        stamp('round', look === 'ripe' ? '#d6a74c' : lightLeaf, [x,size*.57+.1,z], [size,size,size])
      }
    }
  }
  const width = region === 'farm' ? 28 : 24
  const columns = region === 'farm' ? 3 : 4
  const rows = Math.max(1, Math.ceil(entrances.length / columns))
  const depth = Math.max(14, rows * 6 + 3)
  const cell = (width - 3) / columns
  stamp('box', grass, [0,-.2,0], [width,.4,depth])
  stamp('box', '#d6b383', [0,.012,depth / 2-1.2], [width-.8,.025,1.7])
  for (let row = 1; row < rows; row++) {
    stamp('box', '#c4a772', [0,.014,(row-rows/2)*6], [width-.8,.026,1.02])
  }
  for (const [i,entrance] of entrances.entries()) {
    const x = (i % columns - (columns - 1) / 2) * cell
    const z = (Math.floor(i / columns) - (rows - 1) / 2) * 6
    anchors.set(entrance.id,[x, .06, z + 1.94])
    if (entrance.locked) {
      stamp('box','#b1a281',[x,.025,z],[3.9,.05,2.6])
      if (entrance.buildingTonight) {
        for (const offset of [-1.25, 1.25]) stamp('box','#946742',[x+offset,.6,z],[.17,1.2,2.25])
        stamp('box','#cfad6f',[x,1.15,z],[2.9,.12,.22])
      }
      continue
    }
    if (entrance.id.startsWith('fields:')) field(x,z,Number(entrance.id.slice(7)))
    else if (entrance.id.startsWith('forest:')) {
      for (let n=0;n<6;n++) tree(x+(n%3-1)*1.18,z-1.18+Math.floor(n/3)*1.25,.78+(n%3)*.19,true)
    } else if (entrance.id.startsWith('fishery:')) {
      stamp('disc','#518b83',[x,.04,z],[2.58,1.78,1],0,-Math.PI/2)
      stamp('box','#9a7556',[x,.14,z+1.12],[1.13,.19,1.35])
      for (let n=0;n<3;n++) stamp('disc',lightLeaf,[x-1.5+n*.61,.051,z-.52+n*.18],[.18,.13,1],0,-Math.PI/2)
    } else if (entrance.id === 'dock') {
      stamp('disc','#518b83',[x,.04,z],[2.58,1.78,1],0,-Math.PI/2)
      stamp('box','#9a7556',[x,.14,z+.72],[1.6,.19,2.4])
      if (placeBuilt(save,'boat')) stamp('round','#775f49',[x+.9,.3,z-.4],[1.05,.35,1.31])
    } else if (entrance.id === 'bin') {
      stamp('box','#9a7850',[x,.39,z],[1.38,.76,1.12])
      if (entrance.detail) for (const offset of [-.31,0,.31]) stamp('round','#c6a657',[x+offset,.83,z],[.22,.24,.25])
    } else if (entrance.plate) house(x,z,entrance.id)
    else {
      stamp('box','#87674d',[x,.53,z],[1.38,.95,.72])
      stamp('box','#bc9467',[x,1.03,z],[1.53,.16,.83])
    }
    if (entrance.id === 'coop' || entrance.id === 'barn') {
      if (entrance.id === 'coop') {
        stamp('box','#b1a087',[x+2.35,1.17,z],[.78,2.3,.78])
        stamp('cone','#866550',[x+2.35,2.57,z],[.71,.67,.71])
      }
      stamp('box','#9b7650',[x-1.52,.18,z+1.58],[.83,.25,.4])
      stamp('box','#779ba2',[x+1.53,.17,z+1.58],[.82,.25,.42])
      const animals = save.ranch.animals.filter(animal => ANIMAL_HOME[animal.kind] === entrance.id)
      animals.slice(0,8).forEach((animal,index) => {
        const px = x-2.5+(index%4)*.53
        const pz = z+1.37+Math.floor(index/4)*.61
        const poultry = entrance.id === 'coop'
        const color = ['cow','chicken'].includes(animal.kind) ? '#efdfc2' : '#b59774'
        stamp('round',color,[px,poultry ? .25 : .39,pz],[.37,poultry ? .36 : .48,poultry ? .45 : .6])
        stamp('round',color,[px+.15,poultry ? .39 : .65,pz+.18],[.24,.24,.24])
        if (animal.ready) stamp('round','#e4bc68',[px,.12,pz+.31],[.13,.18,.13])
        if (animal.fed) stamp('box','#b3934d',[px-.1,.06,pz+.37],[.18,.09,.11])
      })
    }
  }
  for (let i=0;i<12;i++) tree((i%6-2.5)*(width/6),i<6 ? -depth/2+.55 : depth/2-.32,.72+(i%3)*.18,region==='forest')
  for (const [key, matrices] of batches) {
    const [shape,color] = key.split(':') as [keyof typeof shapes,string]
    const mesh = new InstancedMesh(shapes[shape],palette.get(color)!,matrices.length)
    matrices.forEach((matrix,i) => mesh.setMatrixAt(i,matrix))
    mesh.castShadow = true
    mesh.receiveShadow = true
    root.add(mesh)
  }
  const camera = { label:region, target:[0,0,0] as GroundPoint, elevation:41, azimuth:0, distance:42, fov:31 }
  return {
    anchors, width, depth,
    scene: {
      id:region,title:region,root,figures:[],layers:{},cameras:{front:camera,tactics:camera,high:camera},
      light:{ ...bandLight(night), key:{ ...bandLight(night).key, to:[0,0,0], box:Math.max(width,depth) } },
      update() {},
      dispose() {
        for (const child of root.children) (child as InstancedMesh).dispose()
        for (const shape of Object.values(shapes)) shape.dispose()
        for (const material of palette.values()) material.dispose()
        root.clear()
      },
    }
  }
}

export function mountRegion(canvas: HTMLCanvasElement, layout: RegionScene) {
  const stage = new LookStage({ canvas, assets: EMPTY })
  try {
    stage.current = layout.scene
    stage.scene.add(layout.scene.root)
    const light = layout.scene.light
    stage.scene.background = new Color(light.sky[0])
    stage.key.color.set(light.key.colour)
    stage.key.intensity = light.key.intensity
    stage.key.position.set(...light.key.from)
    stage.key.target.position.set(...light.key.to)
    stage.hemi.color.set(light.hemi.sky)
    stage.hemi.groundColor.set(light.hemi.ground)
    stage.hemi.intensity = light.hemi.intensity
    stage.renderer.toneMappingExposure = light.exposure
    stage.useCamera('front')
    stage.useTier('saver')
    stage.life.sway = false
    stage.life.shadowMap = 512
    Object.assign(stage.look, { ao:false, dof:false, bloom:false })
    stage.apply()
  } catch (error) {
    stage.dispose()
    throw error
  }
  function project(pose: CameraPose) {
    stage.resize()
    const aspect = Math.max(1, canvas.clientWidth / Math.max(1,canvas.clientHeight))
    stage.view.distance = Math.max(layout.width / aspect, layout.depth * .77) * 2.12 / pose.zoom
    stage.target.set(pose.x,0,pose.z)
    stage.placeCamera()
    stage.camera.updateMatrixWorld()
    stage.frame(0)
    stage.render()
    return new Map([...layout.anchors].map(([id, at]) => {
      const point = new Vector3(...at).project(stage.camera)
      return [id,{x:(point.x + 1) / 2,y:(1 - point.y) / 2}] as const
    }))
  }
  return {
    project,
    dispose() {
      stage.stop()
      stage.key.shadow.dispose()
      for (const pass of stage.post.composer.passes) pass.dispose()
      stage.post.composer.dispose()
      stage.dispose()
    },
  }
}
