// The loop's boot (F17 decisions 2 and 9): every stored save the loop meets becomes v3 once master data's roster has
// loaded, since her calling's line comes from it. Loaded on demand: only the loop's build reaches it. Nothing here moves
// `account.updatedAt`, so two devices carrying the same save over agree, and the conflict rule still sees the player's
// last change.
import { bedsAt, draw, migrateToV3, newRosterUma, newSave, type SaveV3, type StoredSave } from '@farm/domain'
import { masterReady } from '../master/master'

/** The start's three (CS2). */
export const START_UMAS = 3

/**
 * The temporary picks (decision 9): until F23's sheet lets the player choose, a save with fewer than three Umas is filled
 * from a seeded shuffle of the release (`draw(uid, 0, 'start', n)`), so F18–F22 can be tried locally. A migrated save
 * keeps its Umas; the picks fill only the gap. Seeded, so every device fills the same way. F23 removes this.
 */
export function fillStart(save: SaveV3, release: readonly string[]): SaveV3 {
  const missing = START_UMAS - Object.keys(save.roster).length
  if (missing <= 0) return save
  const pool = release.filter((id) => !save.roster[id])
  let n = 0
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(draw(save.account.uid, 0, 'start', n++) * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const picks = pool.slice(0, missing)
  if (picks.length === 0) return save
  const roster = { ...save.roster }
  for (const id of picks) roster[id] = newRosterUma(save.calendar.day)
  const home = [...save.dorm.home, ...picks].slice(0, bedsAt(save.dorm.level))
  return { ...save, roster, dorm: { ...save.dorm, home } }
}

/** A stored save as the loop plays it: a v2 (a v1 is read as v2) migrates (CS54), and a roster under three is filled. The
 * same object comes back when nothing changes, so the store knows when to commit. Waits for master data only then. */
export async function toLoopSave(save: StoredSave): Promise<SaveV3> {
  if (save.version === 3 && Object.keys(save.roster).length >= START_UMAS) return save
  const view = await masterReady()
  const lines = new Map(view.roster.map((o) => [o.outfitId, o.line]))
  const v3 = save.version === 3 ? save : migrateToV3(save, { lineOf: (id) => lines.get(id) ?? null })
  return fillStart(v3, view.roster.map((o) => o.outfitId))
}

/** A new account in the loop: day 1 (CS3) with the temporary picks. */
export const newLoopSave = (uid: string, now: string): Promise<SaveV3> => toLoopSave(newSave(uid, now))
