// Which scene plays now: nothing while the farmer is unnamed (the name sheet covers everything); then the opening; then
// the closing scene the morning after chapter 1 completes, once the morning summary is put away; then the ring bench's
// scene, `scene:bench`, once the bench stands (`buildings.forge` set, the night after the first Romance 8); then each
// Uma's arrival scene, `arrival:<id>`, in arrival order, once the summary is put away. A chapter scene goes in
// `diary.read`, an arrival in `arrivals`. Light on purpose: the shell reads it, and the scenes' lines and the player load
// on demand; the bench scene's lines are `story/bench.ts`'.
import type { FarmSave } from '../save/v4'

/** The chapter scenes, by the id `diary.read` keeps. */
export const SCENE_IDS = ['scene:1:open', 'scene:1:close'] as const
export type ChapterSceneId = typeof SCENE_IDS[number]
/** The ring bench's scene. */
export const BENCH_SCENE = 'scene:bench'
/** A scene to play: a chapter's, the ring bench's, or an Uma's arrival. */
export type SceneId = ChapterSceneId | typeof BENCH_SCENE | `arrival:${string}`

/** The Uma an arrival scene belongs to, or null for a chapter scene. */
export const arrivalOf = (id: SceneId): string | null => (id.startsWith('arrival:') ? id.slice('arrival:'.length) : null)

type DueSave = Pick<FarmSave, 'roster' | 'diary' | 'farm' | 'summary' | 'farmer' | 'arrivals' | 'buildings'>

/** The scene to play now, or null. `order` is the cast's order (the pack's), which breaks ties between Umas who joined
 * the same day. */
export function sceneDue(save: DueSave, order: readonly string[] = []): SceneId | null {
  if (save.farmer.name === '') return null
  if (!save.diary.read.includes('scene:1:open')) return 'scene:1:open'
  if (save.summary !== null) return null
  if (save.farm.chapter >= 2 && !save.diary.read.includes('scene:1:close')) return 'scene:1:close'
  if (save.buildings.forge !== undefined && !save.diary.read.includes(BENCH_SCENE)) return BENCH_SCENE
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const waiting = Object.entries(save.roster).filter(([id]) => !save.arrivals.includes(id))
    .sort(([a, x], [b, y]) => x.joined - y.joined || rank(a) - rank(b) || Number(a) - Number(b))
  return waiting[0] ? `arrival:${waiting[0][0]}` : null
}

/** The save with a chapter scene (or the bench scene) read, played through or skipped. Never stamps: the app's action
 * does. The opening also joins the opening three (`joinOpening`, the romance's arrivals). */
export function readScene<S extends FarmSave>(save: S, id: ChapterSceneId | typeof BENCH_SCENE): S {
  return save.diary.read.includes(id) ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
