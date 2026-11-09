// Which scene plays now (F24 decision 6; core spec CS42): the opening scene once the start's three are picked, before the
// first tap of day 1; the closing scene the morning after chapter 1 completes, once the morning summary is put away.
// Each plays once: its id goes in `diary.read`. Light on purpose: the shell reads it, and the scenes' lines
// (`chapter-1.ts`) and the player load on demand.
import { picksLeft, type SaveV3 } from '../save/v3'

/** The scenes M4 plays, by the id `diary.read` keeps. */
export const SCENE_IDS = ['scene:1:open', 'scene:1:close'] as const
export type SceneId = typeof SCENE_IDS[number]

/** The scene to play now, or null. The start's picks come first (a migrated save, already on day 1 with its Umas, sees
 * the opening scene once too); the closing scene waits for chapter 2 and for the morning summary to be put away. */
export function sceneDue(save: Pick<SaveV3, 'roster' | 'diary' | 'farm' | 'summary'>): SceneId | null {
  if (picksLeft(save) > 0) return null
  if (!save.diary.read.includes('scene:1:open')) return 'scene:1:open'
  if (save.farm.chapter >= 2 && save.summary === null && !save.diary.read.includes('scene:1:close')) return 'scene:1:close'
  return null
}

/** The save with a scene read, played through or skipped. Never stamps: the app's action does. */
export function readScene<S extends SaveV3>(save: S, id: SceneId): S {
  return save.diary.read.includes(id) ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, id] } }
}
