// Praise's causes (core spec CS45's rule): she earns praise for the day when (a) her
// work that finished overnight made a ★3+ item or (c) she ranked up last night (night step 9), (b) a harvest today from the
// block she tends gave a ★3+ crop (`harvest`), or (d) she assisted a Fine-or-better workshop play today (M5's packets).
// Earning only lists her in `today.praise`; Praise +20 (`praiseV4`) pays once, and step 7 clears both lists. Light on
// purpose: the Fields' harvest calls it.
import { isSaveV4, type FarmSave } from '../save/v4'

/** She earned praise today: into `today.praise`, once. A v3 save, or an Uma off the roster, changes nothing. Never stamps. */
export function earnPraise<S extends FarmSave>(save: S, id: string): S {
  if (!isSaveV4(save) || !save.roster[id] || save.today.praise.includes(id)) return save
  return { ...save, today: { ...save.today, praise: [...save.today.praise, id] } }
}

/** Praise earned overnight (night step 9, after the date turns): (a) each Uma whose work that finished overnight made a ★3+
 * item (step 4's `made`, as stock keys), and (c) each who ranked up last night (step 6), in that order. */
export function praiseOvernight<S extends FarmSave>(save: S, made: readonly { outfitId: string; items: readonly string[] }[], rankedUp: readonly string[]): S {
  const good = made.filter((m) => m.items.some((key) => Number(key.slice(key.lastIndexOf('@') + 1)) >= 3)).map((m) => m.outfitId)
  return [...good, ...rankedUp].reduce(earnPraise, save)
}
