import { FrameRecorder, LookStage, POST_DEFAULTS, type LookAssets, type SceneLight } from '@luismlorenzana/uma-stage/look'
import { Color, Vector3 } from 'three'
import { BAND_ANCHORS, BAND_TARGET, bandLight, buildFieldPond, type FieldPondScene } from './field-pond-scene'
import type { BandPlace, BandState } from './field-pond-state'

export type Graphics = 'standard' | 'saver'
export type Projections = Record<BandPlace, { x: number; y: number }>
export type PhoneRun = ReturnType<FrameRecorder['summary']> & { calls: number; memory: number; running: boolean }

// stage.load() in 0.7.0 dispatches to its two built-in review scenes. This band authors its kit locally and mounts on
// the public LookScene contract. It has no external pack requests.
const LOCAL_ASSETS: LookAssets = {
  index: async () => ({ version: 1, kit: { path: '', bytes: 0, sha256: '' }, cast: {} }),
  kit: async () => new ArrayBuffer(0),
  sprite: async () => null,
}

export class FieldPondRenderer {
  private readonly stage: LookStage
  private scene: FieldPondScene | null = null
  private dusk: boolean
  private pan = 0
  private run: FrameRecorder | null = null
  private elapsedSecond = -1

  constructor(private readonly canvas: HTMLCanvasElement, view: BandState, private readonly report: (run: PhoneRun) => void) {
    this.dusk = view.dusk
    this.stage = new LookStage({ canvas, assets: LOCAL_ASSETS })
    try {
      this.scene = buildFieldPond(view)
      this.stage.current = this.scene
      this.stage.scene.add(this.scene.root)
      this.stage.useCamera('front')
      this.stage.life.sway = false
      this.graphics('standard')
      this.stage.onFrame = (ms) => this.record(ms)
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  private light(lighting: SceneLight) {
    const { stage } = this
    stage.key.color.set(lighting.key.colour)
    stage.key.intensity = lighting.key.intensity
    stage.key.position.set(...lighting.key.from)
    stage.key.target.position.set(...lighting.key.to)
    const box = lighting.key.box
    Object.assign(stage.key.shadow.camera, { left: -box, right: box, top: box, bottom: -box, near: 1, far: 100 })
    stage.key.shadow.camera.updateProjectionMatrix()
    stage.hemi.color.set(lighting.hemi.sky)
    stage.hemi.groundColor.set(lighting.hemi.ground)
    stage.hemi.intensity = lighting.hemi.intensity
    stage.scene.background = new Color(lighting.sky[0])
    stage.renderer.toneMappingExposure = lighting.exposure
  }

  update(view: BandState) {
    this.scene?.setBand(view)
    if (this.dusk !== view.dusk) {
      this.dusk = view.dusk
      this.apply()
    }
    this.draw()
  }

  graphics(mode: Graphics) {
    this.stage.useTier(mode === 'saver' ? 'saver' : 'medium')
    this.stage.life.shadowMap = mode === 'saver' ? 512 : 1024
    this.apply()
    this.draw()
  }

  private apply() {
    const light = bandLight(this.dusk)
    this.light(light)
    const { stage } = this
    Object.assign(stage.look, {
      ...light.post, ao: false, dof: false, bloomStrength: .22,
      vignette: light.post.vignette ?? POST_DEFAULTS.vignette,
    })
    this.stage.apply()
    // The scene light supplied to LookStage is its initial data contract. Refresh the fog with the live preset.
    stage.scene.fog?.color.set(light.fog?.colour ?? '#9aa4a1')
    if (stage.scene.fog && 'density' in stage.scene.fog) stage.scene.fog.density = light.fog?.density ?? 0
  }

  move(delta: number): Projections {
    this.pan = Math.max(-3.8, Math.min(3.8, this.pan + delta))
    return this.project()
  }

  layout(): Projections {
    this.stage.resize()
    const ratio = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight)
    this.stage.view.distance = Math.min(76, Math.max(46, 101 / Math.max(1, ratio)))
    return this.project()
  }

  private project(): Projections {
    this.stage.target.set(BAND_TARGET[0] + this.pan, BAND_TARGET[1], BAND_TARGET[2])
    this.stage.placeCamera()
    this.stage.camera.updateMatrixWorld()
    this.draw()
    const project = (point: readonly [number, number, number]) => {
      const p = new Vector3(...point).project(this.stage.camera)
      return { x: Math.max(15, Math.min(85, (p.x + 1) * 50)), y: Math.max(23, Math.min(89, (1 - p.y) * 50)) }
    }
    return {
      fields: project(BAND_ANCHORS.fields), forest: project(BAND_ANCHORS.forest),
      fishery: project(BAND_ANCHORS.fishery), bin: project(BAND_ANCHORS.bin), farmhouse: project(BAND_ANCHORS.farmhouse),
    }
  }

  draw() { this.stage.frame(0); this.stage.render() }
  active(on: boolean) {
    if (on) this.stage.start()
    else this.stage.stop()
  }

  toggleRun() {
    if (this.run) return this.finishRun()
    this.run = new FrameRecorder()
    this.elapsedSecond = -1
    this.showRun(true)
  }

  private record(ms: number) {
    if (!this.run) return
    this.run.push(ms)
    const second = Math.floor(this.run.elapsed)
    if (second >= 600) this.finishRun()
    else if (second !== this.elapsedSecond) {
      this.elapsedSecond = second
      this.showRun(true)
    }
  }

  private showRun(running: boolean) {
    if (!this.run) return
    const info = this.stage.stats()
    this.report({ ...this.run.summary(), calls: info.calls, memory: info.gpu.totalMB, running })
  }

  private finishRun() {
    this.showRun(false)
    this.run = null
  }

  dispose() {
    this.stage.stop()
    this.stage.onFrame = null
    this.run = null
    this.stage.key.shadow.dispose()
    for (const pass of this.stage.post.composer.passes) pass.dispose()
    this.stage.post.composer.dispose()
    this.stage.dispose()
    this.scene = null
  }
}
