// Which scene plays now: nothing while the farmer is unnamed (the name sheet covers everything); then the opening's
// lines; then the ring bench's scene, `scene:bench`, once the bench stands (`buildings.forge` set, the night after the
// first Romance 8) and the morning summary is put away; then each Uma's arrival scene, `arrival:<id>`, in arrival order,
// once the summary is put away. Day 1's helper is the exception: she joins as the opening ends and waits at the Gate
// (`atTheGate`), her arrival scene playing from the Gate's quick look, never on its own, so the start goes from the
// opening straight to Home. The opening and the bench's scene go in `diary.read`, an arrival in `arrivals`. Light on
// purpose: the shell reads it, and the scenes' lines and the player load on demand; the opening's lines are the pack's
// (`openingOf`), the bench scene's `story/bench.ts`'.
import type { FarmSave } from '../save/v4'

/** The opening's id, as `diary.read` keeps it. An older v4's `scene:1:close` there is read and means nothing now. */
export const OPENING_SCENE_ID = 'scene:1:open'
export type OpeningSceneId = typeof OPENING_SCENE_ID
/** The ring bench's scene. */
export const BENCH_SCENE = 'scene:bench'
/** A scene to play: the opening, the ring bench's, or an Uma's arrival. */
export type SceneId = OpeningSceneId | typeof BENCH_SCENE | `arrival:${string}`
/** The day the farm starts, and the opening's helper joins. */
const START_DAY = 1

/** The Uma an arrival scene belongs to, or null for the opening or the bench's. */
export const arrivalOf = (id: SceneId): string | null => (id.startsWith('arrival:') ? id.slice('arrival:'.length) : null)

type DueSave = Pick<FarmSave, 'roster' | 'diary' | 'summary' | 'farmer' | 'arrivals' | 'buildings'>

/** Everyone on the roster whose arrival scene hasn't played, by the day she joined, then the cast's order (`order`, the
 * pack's), then her id. */
function unwelcomed(save: Pick<FarmSave, 'roster' | 'arrivals'>, order: readonly string[]): [string, number][] {
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return Object.entries(save.roster).filter(([id]) => !save.arrivals.includes(id))
    .sort(([a, x], [b, y]) => x.joined - y.joined || rank(a) - rank(b) || Number(a) - Number(b))
    .map(([id, uma]) => [id, uma.joined])
}

/** Who waits at the Gate: an Uma who joined on the farm's first day (day 1's helper, as the opening ends) whose arrival
 * scene hasn't played. It plays from the Gate's quick look (`?hello=<id>`), never on its own; she works the farm
 * meanwhile. In the cast's order. */
export function atTheGate(save: Pick<FarmSave, 'roster' | 'arrivals'>, order: readonly string[] = []): string[] {
  return unwelcomed(save, order).filter(([, joined]) => joined === START_DAY).map(([id]) => id)
}

/** The scene to play now, or null. `order` is the cast's order (the pack's), which breaks ties between Umas who joined
 * the same day. Whoever waits at the Gate (`atTheGate`) is left to the Gate. */
export function sceneDue(save: DueSave, order: readonly string[] = []): SceneId | null {
  if (save.farmer.name === '') return null
  if (!save.diary.read.includes(OPENING_SCENE_ID)) return OPENING_SCENE_ID
  if (save.summary !== null) return null
  if (save.buildings.forge !== undefined && !save.diary.read.includes(BENCH_SCENE)) return BENCH_SCENE
  const waiting = unwelcomed(save, order).find(([, joined]) => joined !== START_DAY)
  return waiting ? `arrival:${waiting[0]}` : null
}

/** Her arrival scene from the Gate (`?hello=<id>`): while she waits there, else null. */
export const gateScene = (save: Pick<FarmSave, 'roster' | 'arrivals'>, id: string | null): SceneId | null =>
  id !== null && atTheGate(save).includes(id) ? `arrival:${id}` : null

/** The save with the opening (or the bench scene) read, played through or skipped. Never stamps: the app's action
 * does. The opening also joins day 1's helper (`joinFirstHelper`, the romance's arrivals). */
export function readScene<S extends FarmSave>(save: S, id: OpeningSceneId | typeof BENCH_SCENE): S {
  return save.diary.read.includes(id) ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
