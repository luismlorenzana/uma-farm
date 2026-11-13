// The farm's kit (KF13, KF14; D73): uma-art's `kit-farm` (2.27.0, wave 1's 87 frames), loaded through uma-stage's kit
// loader when the stage Home first mounts, and checked for kind `farm`. The names are the API: a frame the kit lacks
// (wave 2's 30 until they ship) is the stand-in's, copied onto the kit's page so the stage builds from one page. The
// stand-in alone while the page is slow to load, and if it can't. Part of the stage's lazy chunk, the only module that
// imports the kit's files: its 2048 page loads only with the preview switch on, and never sits in the precache.
import kitIndex from '@luismlorenzana/uma-art/kit-farm/atlas.json'
import kitPageUrl from '@luismlorenzana/uma-art/kit-farm/atlas.png?url'
import {
  checkedKit, loadKitPage, parseKitAtlas, pixelTexture, standInFarmKit, type KitAtlas, type KitFrame, type KitRole, type LoadedKit,
} from '@luismlorenzana/uma-stage'
import { CanvasTexture } from 'three'

export type FarmKitName = 'kit-farm' | 'stand-in'
/** A kit the stage builds the farm from, and which it is (the stage's `data-kit-name`). */
export interface FarmKit {
  name: FarmKitName
  loaded: LoadedKit
}

/** How long Home waits for kit-farm's page before it draws the stand-in and swaps when the page arrives, in ms. A cached
 * page decodes well within it; a first load on a slow line doesn't. */
export const KIT_WAIT_MS = 1500

// --- The stand-in's frames on the kit's page (KF14) ---------------------------------------------------------------------

/** Texels between copied frames, and how far a tiling piece's edge texels are copied into them, so a page the stage scales
 * down (fit-to-width, mipmapped) shows no seams, as kit-farm's own pieces are extruded. */
export const COPY_GAP = 4
export const COPY_EXTRUDE = 2
/** Cut-outs: their edges are transparent, so nothing is extruded. Every other role tiles or meets its neighbours. */
const CUT_OUT: ReadonlySet<KitRole> = new Set<KitRole>(['prop', 'sign', 'battle-mid'])
export const extrudes = (f: Pick<KitFrame, 'role'>): boolean => !CUT_OUT.has(f.role)

/** A stand-in frame copied onto the kit's page: where it is on the stand-in's, where it goes. */
export interface FrameCopy {
  name: string
  from: KitFrame
  to: { x: number; y: number }
}

/**
 * The kit with the stand-in's frames it lacks (KF14): every frame of the kit on its first page (the one the stage draws)
 * as it is, then each stand-in frame whose name the kit doesn't draw, packed in shelves below the kit's lowest frame,
 * tallest first, `COPY_GAP` apart; the page grows only if they don't fit. Their roles, sets, feet, blocking and lights stay
 * the stand-in's. No copies when the kit lacks nothing.
 */
export function withStandIns(kit: KitAtlas, standIn: KitAtlas): { atlas: KitAtlas; copies: FrameCopy[] } {
  const page = kit.pages[0]!
  const own = Object.fromEntries(Object.entries(kit.frames).filter(([, f]) => f.page === 0))
  const lacking = Object.entries(standIn.frames).filter(([name]) => !(name in own))
    .sort(([a, f], [b, g]) => g.h - f.h || g.w - f.w || a.localeCompare(b))
  if (lacking.length === 0) return { atlas: { ...kit, pages: [page], frames: own }, copies: [] }
  const top = Math.max(0, ...Object.values(own).map((f) => f.y + f.h)) + COPY_GAP
  const copies: FrameCopy[] = []
  let x = COPY_GAP, y = top, shelf = 0
  for (const [name, f] of lacking) {
    if (x + f.w + COPY_GAP > page.width) { x = COPY_GAP; y += shelf + COPY_GAP; shelf = 0 }
    copies.push({ name, from: f, to: { x, y } })
    x += f.w + COPY_GAP
    shelf = Math.max(shelf, f.h)
  }
  const height = Math.max(page.height, Math.ceil((y + shelf + COPY_GAP) / 4) * 4)
  const frames: Record<string, KitFrame> = { ...own }
  for (const c of copies) frames[c.name] = { ...c.from, page: 0, x: c.to.x, y: c.to.y }
  return { atlas: { ...kit, pages: [{ ...page, height }], frames }, copies }
}

/** The kit's page with the copies drawn in: the kit's image, then each stand-in frame, a tiling piece's edges first. */
function composePage(kit: LoadedKit, standIn: LoadedKit, plan: ReturnType<typeof withStandIns>): LoadedKit {
  if (plan.copies.length === 0) return { kit: plan.atlas, page: kit.page }
  const { width, height } = plan.atlas.pages[0]!
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')
  if (!g) throw new Error('no 2D canvas for the farm kit')
  g.imageSmoothingEnabled = false
  g.drawImage(kit.page.image as CanvasImageSource, 0, 0)
  const from = standIn.page.image as CanvasImageSource, e = COPY_EXTRUDE
  for (const { from: f, to } of plan.copies) {
    if (extrudes(f)) {
      // Each edge's outer texels stretched out, then the corners, so sampling past the edge finds the edge's colour.
      const r = f.x + f.w - 1, b = f.y + f.h - 1
      g.drawImage(from, f.x, f.y, 1, f.h, to.x - e, to.y, e, f.h)
      g.drawImage(from, r, f.y, 1, f.h, to.x + f.w, to.y, e, f.h)
      g.drawImage(from, f.x, f.y, f.w, 1, to.x, to.y - e, f.w, e)
      g.drawImage(from, f.x, b, f.w, 1, to.x, to.y + f.h, f.w, e)
      g.drawImage(from, f.x, f.y, 1, 1, to.x - e, to.y - e, e, e)
      g.drawImage(from, r, f.y, 1, 1, to.x + f.w, to.y - e, e, e)
      g.drawImage(from, f.x, b, 1, 1, to.x - e, to.y + f.h, e, e)
      g.drawImage(from, r, b, 1, 1, to.x + f.w, to.y + f.h, e, e)
    }
    g.drawImage(from, f.x, f.y, f.w, f.h, to.x, to.y, f.w, f.h)
  }
  return { kit: plan.atlas, page: pixelTexture(new CanvasTexture(canvas)) }
}

// --- Loading ------------------------------------------------------------------------------------------------------------------

/** kit-farm's atlas, parsed and checked: kind `farm` with wave 1's every frame, or it's refused (thrown). */
export function farmAtlas(value: unknown = kitIndex): KitAtlas {
  const atlas = parseKitAtlas(value)
  if (atlas.kind !== 'farm') throw new Error(`${atlas.id} is a ${atlas.kind} kit, not a farm kit`)
  return checkedKit(atlas, 'kit-farm')
}

let standIn: FarmKit | null = null
/** The stage's stand-in kit, drawn once a session. */
export const standInKit = (): FarmKit => (standIn ??= { name: 'stand-in', loaded: standInFarmKit() })

let ready: FarmKit | null = null
let loading: Promise<FarmKit> | null = null
/** The farm's kit once it has loaded (kit-farm, or the stand-in if it couldn't), or null while it loads. */
export const readyFarmKit = (): FarmKit | null => ready

/** Loads kit-farm once a session: its page through uma-stage's loader, the stand-in's frames for what it lacks; the
 * stand-in if the atlas is refused, the page fails or the copy can't be drawn. */
export function loadFarmKit(): Promise<FarmKit> {
  return (loading ??= (async () => {
    try {
      const atlas = farmAtlas()
      const page = await loadKitPage('farm', atlas, kitPageUrl)
      if (!page) throw new Error('kit-farm’s page didn’t load')
      const fallback = standInKit().loaded
      ready = { name: 'kit-farm', loaded: composePage(page, fallback, withStandIns(page.kit, fallback.kit)) }
    } catch (err) {
      console.warn('The farm draws its stand-in kit:', err)
      ready = standInKit()
    }
    return ready
  })())
}
