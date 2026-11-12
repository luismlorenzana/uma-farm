// Which scene plays now (F24 decision 6; core spec CS42; F46 decision 9): on v3 the opening scene once the start's three
// are picked, before the first tap of day 1, and the closing scene the morning after chapter 1 completes, once the morning
// summary is put away. On v4 nothing plays while the farmer is unnamed (the name sheet covers everything); then the
// re-cut opening; then the closing scene when due; then each Uma's arrival scene, `arrival:<id>`, in arrival order, once
// the summary is put away. A chapter scene goes in `diary.read`, an arrival in `arrivals`. Light on purpose: the shell
// reads it, and the scenes' lines and the player load on demand. F53: on v4 the ring bench's scene, `scene:bench`, plays
// once the bench stands (`buildings.forge` set, the night after the first Romance 8), after the chapter scenes and before
// the arrivals, its lines `story/bench.ts`'.
import { picksLeft } from '../save/v3'
import type { FarmSave, SaveV4 } from '../save/v4'

/** The chapter scenes M4 plays, by the id `diary.read` keeps. */
export const SCENE_IDS = ['scene:1:open', 'scene:1:close'] as const
export type ChapterSceneId = typeof SCENE_IDS[number]
/** The ring bench's scene (F53 decision 4), v4's only. */
export const BENCH_SCENE = 'scene:bench'
/** A scene to play: a chapter's, (v4) the ring bench's, or (v4) an Uma's arrival. */
export type SceneId = ChapterSceneId | typeof BENCH_SCENE | `arrival:${string}`

/** The Uma an arrival scene belongs to, or null for a chapter scene. */
export const arrivalOf = (id: SceneId): string | null => (id.startsWith('arrival:') ? id.slice('arrival:'.length) : null)
export const isChapterScene = (id: SceneId): id is ChapterSceneId => (SCENE_IDS as readonly string[]).includes(id)

type DueSave = Pick<FarmSave, 'roster' | 'diary' | 'farm' | 'summary'> & ({ version: 3 } | Pick<SaveV4, 'version' | 'farmer' | 'arrivals' | 'buildings'>)

/** The scene to play now, or null. `order` is the cast's order (the pack's), which breaks ties between Umas who joined
 * the same day (v4). */
export function sceneDue(save: DueSave, order: readonly string[] = []): SceneId | null {
  if (save.version === 4) {
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
  if (picksLeft(save) > 0) return null
  if (!save.diary.read.includes('scene:1:open')) return 'scene:1:open'
  if (save.farm.chapter >= 2 && save.summary === null && !save.diary.read.includes('scene:1:close')) return 'scene:1:close'
  return null
}

/** The save with a chapter scene (or v4's bench scene) read, played through or skipped. Never stamps: the app's action
 * does. On v4 the opening also joins the opening three (`joinOpening`, the romance's arrivals). */
export function readScene<S extends FarmSave>(save: S, id: ChapterSceneId | typeof BENCH_SCENE): S {
  return save.diary.read.includes(id) ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
