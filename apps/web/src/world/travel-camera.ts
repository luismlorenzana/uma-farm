import type { FloorPoint } from './room-walk'

export const TRAVEL_ELEVATION = 41
export const TRAVEL_AZIMUTH = 0
export const PLOT_FOV = 30
export const ROOM_FOV = 29
export const ROOM_ELEVATION = 24
// Turn the sprite plane toward the screen while its separate floor shadow stays level.
export const ROOM_SPRITE_PITCH = -ROOM_ELEVATION * Math.PI / 180
export const ROOM_VIEWS = ['walk', 'close', 'whole'] as const
export type RoomView = typeof ROOM_VIEWS[number]

export interface CameraPose { x: number; z: number; zoom: number }

export const PLOT_CAMERA: CameraPose = { x: 0, z: 0, zoom: 1 }

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** Hold the bearing and translate the focus with the walking marker. */
export function roomCamera(at: FloorPoint, mode: RoomView): CameraPose {
  if (mode === 'whole') return { x: 0, z: -.12, zoom: .86 }
  const close = mode === 'close'
  return { x: clamp(at.x * (close ? .69 : .44), close ? 3.1 : 2.15),
    z: clamp((at.z - .5) * (close ? .45 : .31), close ? 1.55 : 1.12), zoom: close ? 1.39 : 1.06 }
}

export function followCamera(previous: CameraPose, next: CameraPose, elapsed: number): CameraPose {
  const blend = 1 - Math.exp(-elapsed / 120)
  return { x: previous.x + (next.x - previous.x) * blend, z: previous.z + (next.z - previous.z) * blend,
    zoom: previous.zoom + (next.zoom - previous.zoom) * blend }
}

/** Distance that fits the full plot including row tabs and mature foliage. */
export function plotDistance(aspect: number, width: number, depth: number, targetY: number): number {
  const pitch = TRAVEL_ELEVATION * Math.PI / 180
  const tangent = Math.tan(PLOT_FOV * Math.PI / 360)
  let fit = 0
  for (const y of [-targetY, 1.3 - targetY]) for (const z of [-depth / 2, depth / 2]) {
    const near = y * Math.sin(pitch) + z * Math.cos(pitch)
    const vertical = Math.abs(y * Math.cos(pitch) - z * Math.sin(pitch))
    fit = Math.max(fit, near + Math.max(width / 2 / (aspect * .94), vertical / .90) / tangent)
  }
  return fit
}
