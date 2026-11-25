import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

const three = new URL('../apps/web/node_modules/three/', import.meta.url)
const { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Scene } = await import(new URL('build/three.module.js', three))
const { GLTFExporter } = await import(new URL('examples/jsm/exporters/GLTFExporter.js', three))

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(data => {
      this.result = data
      this.onloadend()
    }, error => this.onerror(error))
  }
}

const wood = new MeshStandardMaterial({ color: '#654333', roughness: .87 })
const edge = new MeshStandardMaterial({ color: '#b08356', roughness: .81 })
const plaster = new MeshStandardMaterial({ color: '#c0a88e', roughness: .93 })
const metal = new MeshStandardMaterial({ color: '#735239', roughness: .48, metalness: .45 })
const glass = new MeshStandardMaterial({ color: '#8aaebb', roughness: .36 })
const amber = new MeshStandardMaterial({ color: '#f5bc68', roughness: .31, emissive: '#f7a744', emissiveIntensity: 1.1 })
const unit = new BoxGeometry()
const cylinder = new CylinderGeometry(.5, .5, 1, 12)

const root = new Scene()
function model(name, parts) {
  const group = new Group()
  group.name = name
  for (const [material, position, size, primitive = unit] of parts) {
    const mesh = new Mesh(primitive, material)
    mesh.position.set(...position)
    mesh.scale.set(...size)
    group.add(mesh)
  }
  root.add(group)
}

model('post', [
  [wood, [0,1.2,0], [.24,2.4,.29]],
  [plaster, [0,.19,0], [.38,.38,.43]],
  [edge, [0,.4,0], [.3,.085,.37]],
  [edge, [0,2.15,0], [.32,.09,.39]],
])
model('window', [
  [wood, [0,0,0], [1.67,1.53,.12]],
  [glass, [0,.03,.067], [1.44,1.29,.024]],
  [edge, [0,.01,.12], [.075,1.37,.065]],
  [edge, [0,.03,.12], [1.47,.078,.065]],
  [wood, [0,-.76,.145], [1.82,.10,.32]],
  [edge, [0,.81,.09], [1.76,.11,.22]],
])
model('lantern', [
  [metal, [0,.19,0], [.17,.09,.17], cylinder],
  [amber, [0,.04,0], [.185,.22,.185], cylinder],
  [edge, [0,-.10,0], [.22,.065,.22], cylinder],
  [metal, [-.1,.045,0], [.021,.22,.023]],
  [metal, [.1,.045,0], [.021,.22,.023]],
])
model('counter-sign', [
  [wood, [0,.037,0], [.62,.074,.34]],
  [wood, [0,.2,0], [.1,.34,.1]],
  [edge, [0,.38,0], [.72,.29,.085]],
  [plaster, [0,.38,.048], [.61,.19,.024]],
])

const output = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true })
const bytes = Buffer.from(output)
const dir = new URL('../apps/web/src/world/rooms/', import.meta.url)
await writeFile(new URL('architecture.glb', dir), bytes)
await writeFile(new URL('architecture.json', dir), JSON.stringify({
  version: 1, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  models: ['post', 'window', 'lantern', 'counter-sign'],
}, null, 2) + '\n')
