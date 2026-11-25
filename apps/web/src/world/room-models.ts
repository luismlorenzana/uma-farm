import { Box3, Group, Mesh, type Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import asset from './rooms/architecture.glb?url'
import manifest from './rooms/architecture.json'
import type { RoomId } from './room-specs'

type Model = 'post' | 'window' | 'lantern' | 'counter-sign'
type Placement = readonly [Model, number, number, number]
const WINDOWS = new Set<RoomId>(['library', 'mayor', 'home-table', 'harbour-inn', 'store'])
const DRAWN: readonly Placement[] = [
  ['post', -5.57, 0, 2.83], ['post', 5.57, 0, 2.83],
  ['lantern', -4.6, 2.24, -.85], ['lantern', 3.7, 2.21, -1.87],
]
interface Models { root: Group; props: Map<Model, Object3D> }
let cache: { ready: Promise<Models>; users: number } | undefined

async function load() {
  const response = await fetch(asset)
  if (!response.ok) throw new Error('Room geometry could not be loaded')
  const bytes = await response.arrayBuffer()
  if (bytes.byteLength !== manifest.bytes || bytes.byteLength > 64_000) throw new Error('Room geometry size does not match its manifest')
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('')
  if (hash !== manifest.sha256) throw new Error('Room geometry hash does not match its manifest')
  const { scene } = await new GLTFLoader().parseAsync(bytes, '')
  const props = new Map<Model, Object3D>()
  for (const model of manifest.models as Model[]) {
    const prop = scene.getObjectByName(model)
    const bounds = prop && new Box3().setFromObject(prop)
    if (!prop || !bounds || bounds.isEmpty() || bounds.max.distanceTo(bounds.min) > 4) {
      dispose({ root: scene, props })
      throw new Error('Room model geometry is invalid · ' + model)
    }
    props.set(model, prop)
  }
  return { root: scene, props }
}

function dispose(models: Models) {
  const geometry = new Set<Mesh['geometry']>()
  const material = new Set<Exclude<Mesh['material'], Array<unknown>>>()
  models.root.traverse(node => {
    if (!(node instanceof Mesh)) return
    geometry.add(node.geometry)
    for (const value of Array.isArray(node.material) ? node.material : [node.material]) material.add(value)
  })
  for (const value of geometry) value.dispose()
  for (const value of material) value.dispose()
}

export function occupyRoomKit(place: RoomId, root: Group) {
  const entry = cache ??= { ready: load(), users: 0 }
  entry.users++
  let released = false
  const props = new Group()
  const ready = entry.ready.then(models => {
    if (released) return false
    const plans: Placement[] = [...DRAWN]
    if (WINDOWS.has(place)) plans.push(['window', 0, 2.22, -3.76])
    if (place === 'library') plans.push(['counter-sign', 3.44, .86, -.51])
    for (const [name, x, y, z] of plans) {
      const instance = models.props.get(name)!.clone(true)
      instance.position.set(x,y,z)
      instance.traverse(node => { if (node instanceof Mesh) node.castShadow = node.receiveShadow = true })
      props.add(instance)
    }
    root.add(props)
    return true
  })
  return {
    ready,
    release() {
      if (released) return
      released = true
      props.removeFromParent()
      props.clear()
      if (--entry.users === 0) {
        if (cache === entry) cache = undefined
        void entry.ready.then(dispose, () => undefined)
      }
    },
  }
}
