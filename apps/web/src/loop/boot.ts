// The loop's boot (F17 decision 2): every stored save the loop meets becomes v3 once master data's roster has loaded,
// since her calling's line comes from it. Loaded on demand: only a v2 or a new account reaches it. Nothing here moves
// `account.updatedAt`, so two devices carrying the same save over agree, and the conflict rule still sees the player's
// last change. A roster under three isn't filled here: the start's sheet asks for the picks (F23, CS2), which replaced
// F17's temporary ones.
import { migrateToV3, newSave, newSaveV4, type SaveV3, type SaveV4, type StoredSave } from '@farm/domain'
import { masterReady } from '../master/master'

/** A stored save as the loop plays it: a v2 (a v1 is read as v2) migrates (CS54), waiting for master data; a v3 is
 * played as it is. The same object comes back when nothing changes, so the store knows when to commit. */
export async function toLoopSave(save: Exclude<StoredSave, { version: 4 }>): Promise<SaveV3> {
  if (save.version === 3) return save
  const view = await masterReady()
  const lines = new Map(view.roster.map((o) => [o.outfitId, o.line]))
  return migrateToV3(save, { lineOf: (id) => lines.get(id) ?? null })
}

/** A new account in the loop: day 1 (CS3), nobody on the roster yet; the start's sheet is the first tap. */
export const newLoopSave = (uid: string, now: string): Promise<SaveV3> => Promise.resolve(newSave(uid, now))
/** A new account in the romance build (F46): v4's day 1, the farmer's name the first tap (RM8). */
export const newRomanceSave = (uid: string, now: string): Promise<SaveV4> => Promise.resolve(newSaveV4(uid, now))
