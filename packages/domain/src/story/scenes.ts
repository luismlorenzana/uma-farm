// Which scene plays now: nothing while the farmer is unnamed (the name sheet covers everything); then the opening's
// lines; then the ring bench's scene, `scene:bench`, once the bench stands (`buildings.forge` set, the night after the
// first Romance 8) and the morning summary is put away; then each meeting scene, `arrival:<id>`, in the order you met
// them, once the summary is put away: right after a talk that met her (in town, or Say hello at the Gate), or the morning
// after the night met her. The opening and the bench's scene go in `diary.read`, a meeting scene in `arrivals`. Light on
// purpose: the shell reads it, and the scenes' lines and the player load on demand; the opening's lines are the pack's
// (`openingOf`), the bench scene's `story/bench.ts`'.
import type { FarmSave } from '../save/v4'

/** The opening's id, as `diary.read` keeps it. An older v4's `scene:1:close` there is read and means nothing now. */
export const OPENING_SCENE_ID = 'scene:1:open'
export type OpeningSceneId = typeof OPENING_SCENE_ID
/** The ring bench's scene. */
export const BENCH_SCENE = 'scene:bench'
/** A scene to play: the opening, the ring bench's, or the scene of meeting her (her arrival scene). */
export type SceneId = OpeningSceneId | typeof BENCH_SCENE | `arrival:${string}`

/** The Uma a meeting scene belongs to, or null for the opening or the bench's. */
export const arrivalOf = (id: SceneId): string | null => (id.startsWith('arrival:') ? id.slice('arrival:'.length) : null)

type DueSave = Pick<FarmSave, 'roster' | 'diary' | 'summary' | 'farmer' | 'arrivals' | 'buildings'>

/** Everyone met whose meeting scene hasn't played, by the day you met her, then the cast's order (`order`, the pack's),
 * then her id. */
export function unwelcomed(save: Pick<FarmSave, 'roster' | 'arrivals'>, order: readonly string[] = []): string[] {
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const n = (id: string) => Number(id.replace(/^s/, ''))
  return Object.entries(save.roster).filter(([id]) => !save.arrivals.includes(id))
    .sort(([a, x], [b, y]) => x.joined - y.joined || rank(a) - rank(b) || n(a) - n(b) || a.localeCompare(b))
    .map(([id]) => id)
}

/** The scene to play now, or null. `order` is the cast's order (the pack's), which breaks ties between Umas met the
 * same day. */
export function sceneDue(save: DueSave, order: readonly string[] = []): SceneId | null {
  if (save.farmer.name === '') return null
  if (!save.diary.read.includes(OPENING_SCENE_ID)) return OPENING_SCENE_ID
  if (save.summary !== null) return null
  if (save.buildings.forge !== undefined && !save.diary.read.includes(BENCH_SCENE)) return BENCH_SCENE
  const waiting = unwelcomed(save, order)[0]
  return waiting ? `arrival:${waiting}` : null
}

/** The save with the opening (or the bench scene) read, played through or skipped. Never stamps: the app's action
 * does. Day 1's visitor waits at the Gate (`gateVisitor`). */
export function readScene<S extends FarmSave>(save: S, id: OpeningSceneId | typeof BENCH_SCENE): S {
  return save.diary.read.includes(id) ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
