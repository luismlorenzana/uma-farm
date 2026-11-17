// The stove's bots and the simulations' farmer at the Kitchen, for the tests and the simulations only (never the game's:
// nothing in the app imports them, and the domain's index doesn't export them). A bot plays a seed tick by tick on the
// stove's own rules and returns its taps, so its score is the replay's like any play's:
//
//   careful   keeps all three burners busy and pulls each part in the green's middle (Perfect)
//   casual    keeps two burners busy and pulls late in the green (Good)
//
// Over 8 seeds, a batch's 30 s: the careful bot 100, the casual 70. The Kitchen's 60 s brings tickets faster than two
// burners clear them, so the casual bot lets some go late there: about 57, still Good.
import { actionsLeft } from '../farm/actions'
import { goodOf } from '../goods/ids'
import { MENU_RECIPES, type FarmSave, type MenuLine } from '../save/v4'
import { parseStockKey } from '../save/warehouse'
import { canMake, finishPlay, kitchenBase, kitchenPlayedToday, menuBlock, menuLine, serveStaffMeal, staffBlock, startKitchenPlay } from './kitchen'
import { kitchenBuilt, knownRecipes, MAINS_A_DISH, recipeOf, recipeShelf, SIDES_A_DISH } from './recipes'
import type { SchedulePack } from '../town/town'
import { BURNERS, burnerView, focusTicket, GREEN_MS, newStove, stoveAt, stoveTap, type StoveTap } from './stove'

export type StoveBot = 'careful' | 'casual'
/** How each bot plays: its burners, and how far into the green it pulls. */
export const BOTS: Readonly<Record<StoveBot, { burners: number; pull: number }>> = {
  careful: { burners: BURNERS, pull: 480 },
  casual: { burners: 2, pull: 700 },
}
/** The bots look at the stove this often. */
const TICK_MS = 40

/** A bot's taps for a play of `length` milliseconds on `seed`: each tick, a part in the green past its pull comes off,
 * and an empty burner starts the first ticket's next part. */
export function botTaps(seed: number, length: number, bot: StoveBot): StoveTap[] {
  const { burners, pull } = BOTS[bot]
  let s = newStove(seed, length)
  const taps: StoveTap[] = []
  for (let at = 0; at < length; at += TICK_MS) {
    s = stoveAt(s, at)
    for (let i = 0; i < burners; i++) {
      const view = burnerView(s, i, at)
      const go = view.kind === 'green' ? view.into * GREEN_MS >= pull : view.kind === 'empty' && focusTicket(s) !== null
      if (!go) continue
      const tap = { at, burner: i }
      s = stoveTap(s, tap)
      taps.push(tap)
    }
  }
  return taps
}

// --- The simulations' farmer at the Kitchen --------------------------------------------------------------------------

/** The menu a bot cooks: up to three known recipes the Warehouse can make, the base dealt out a dish at a time to each in
 * turn while its main and side hold out (each at its star held most); null when they can't make the whole base. */
export function botMenu(save: FarmSave): MenuLine[] | null {
  const base = kitchenBase(save)
  if (base === 0) return null
  const lines = knownRecipes(save).filter((dish) => canMake(save, dish) > 0).sort((a, b) => canMake(save, b) - canMake(save, a))
    .slice(0, MENU_RECIPES).map((dish) => menuLine(save, dish, 0))
  const left = new Map<string, number>()
  const held = (key: string): number => {
    const at = parseStockKey(key)!
    return left.get(key) ?? save.items[at.id]?.[at.stars - 1] ?? 0
  }
  let dealt = 0
  for (let more = true; more && dealt < base;) {
    more = false
    for (const line of lines) {
      if (dealt >= base) break
      if (held(line.main) < MAINS_A_DISH || held(line.side) < SIDES_A_DISH) continue
      left.set(line.main, held(line.main) - MAINS_A_DISH)
      left.set(line.side, held(line.side) - SIDES_A_DISH)
      line.count++
      dealt++
      more = true
    }
  }
  const menu = lines.filter((l) => l.count > 0)
  return dealt === base && menuBlock(save, menu) === null ? menu : null
}

/** A bot's day at the Kitchen, once it stands: the play (its menu, an action, the bot's taps), then the staff meal when
 * the dishes are there (its mouths tonight's: `pack` reads the farmhands' farm days). What it made, its score, and whether
 * it served. */
export function botKitchen(save: FarmSave, bot: StoveBot = 'casual', pack: SchedulePack | null = null): { save: FarmSave; dishes: number; score: number | null; served: boolean } {
  let next = save
  let dishes = 0
  let score: number | null = null
  const menu = kitchenBuilt(next) && !kitchenPlayedToday(next) && !next.workshops.current && actionsLeft(next) > 0 ? botMenu(next) : null
  if (menu) {
    next = startKitchenPlay(next, menu)
    const play = next.workshops.current!
    const done = finishPlay(next, botTaps(play.seed, play.length * 1000, bot))
    next = done.save
    dishes = done.result.dishes.reduce((n, d) => n + d.count, 0)
    score = done.result.score
  }
  const served = kitchenBuilt(next) && staffBlock(next, null, pack) === null
  if (served) next = serveStaffMeal(next, null, pack)
  return { save: next, dishes, score, served }
}

/** The goods tomorrow's play takes, kept back from the bin: the three known recipes the Warehouse holds the most mains
 * for, each its main (at the star held most) up to two a dish of the base, its side up to one a dish. */
export function botKitchenKeeps(save: FarmSave): Map<string, number> {
  const keep = new Map<string, number>()
  const base = kitchenBase(save)
  if (base === 0) return keep
  const lines = knownRecipes(save).map((dish) => menuLine(save, dish, 0))
    .map((l) => ({ l, main: held(save, l.main), shipped: shippedMains(save, l.dish) })).sort((a, b) => b.main - a.main || b.shipped - a.shipped).slice(0, MENU_RECIPES)
  for (const { l } of lines) {
    keep.set(l.main, Math.min(held(save, l.main), (keep.get(l.main) ?? 0) + MAINS_A_DISH * base))
    keep.set(l.side, Math.min(held(save, l.side), (keep.get(l.side) ?? 0) + SIDES_A_DISH * base))
  }
  return keep
}
const held = (save: FarmSave, key: string): number => {
  const at = parseStockKey(key)
  return at ? save.items[at.id]?.[at.stars - 1] ?? 0 : 0
}

/** A recipe's mains the farm has shipped, all time (`diary.shipped`): what it grows and gathers. */
const shippedMains = (save: FarmSave, dish: string): number => (recipeOf(dish)?.mains ?? []).reduce((n, id) => n + (save.diary.shipped[id] ?? 0), 0)

/** A recipe a bot would buy with `spare` gold: the unknown recipe whose main the farm has shipped the most of (and held
 * now), its side's family shipped too, the cheapest on a tie; null when none is worth it or the Kitchen doesn't stand.
 * The shop is in town: the bot buys it there. */
export function botRecipe(save: FarmSave, spare: number): string | null {
  if (!kitchenBuilt(save)) return null
  const shipped = (fits: (id: string) => boolean) => Object.entries(save.diary.shipped).reduce((n, [id, k]) => n + (fits(id) ? k : 0), 0)
  const pick = recipeShelf(save).filter((r) => r.price <= spare)
    .map((r) => ({ r, mains: shippedMains(save, r.dish), sides: shipped((id) => goodOf(id)?.family === r.side) }))
    .filter((x) => x.mains >= 2 * MENU_RECIPES * MAINS_A_DISH && x.sides > 0).sort((a, b) => b.mains - a.mains || a.r.price - b.r.price)[0]
  return pick?.r.dish ?? null
}
