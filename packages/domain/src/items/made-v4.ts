// Copied from uma-rpg packages/domain/src/items/made-v4.ts at 30a322a, with its Wilds-only parts cut.
// The farm by line's recipes: a made item takes one line's refined items of
// its own grade, the same amount at every grade (a jewel's grade is its node's: Planet n 2n − 1, Moon n 2n). An Arms Gem
// (R2's Weapon Gem, renamed) or Tome Ink 10, Armor Fittings 3, an Accessory Setting 5, a Planet Jewel or a Moon Jewel 5, so
// one rank of everything takes two Umas, one on Arms and one on Tomes, exactly 30 refined items on each of the five lines
// (3 × 10, 5 × 3 × 2, 3 × 5 × 2, 3 × 5 × 2.
import { lineItemId, type MaterialLine } from './lines'
import { madeName } from './made'
import { madeIdentity, type MadeLine } from './made-id'

/** Each made line's line and amount. */
export const RECIPE_V4: Readonly<Record<MadeLine, { line: MaterialLine; qty: number }>> = {
  'weapon-gem': { line: 'metal', qty: 10 },
  'tome-ink': { line: 'vegetables', qty: 10 },
  'armor-fittings': { line: 'wood', qty: 3 },
  'accessory-setting': { line: 'fish', qty: 5 },
  'jewel-planet': { line: 'stone', qty: 5 },
  'jewel-moon': { line: 'stone', qty: 5 },
}

/** What one made item takes: its line's refined item of its grade → the amount. Throws for an id that isn't a made item. */
export function madeRecipeV4(id: string): Readonly<Record<string, number>> {
  const made = madeIdentity(id)
  if (!made) throw new RangeError(`${id} isn't a made item`)
  const { line, qty } = RECIPE_V4[made.line]
  return { [lineItemId(line, made.grade, true)]: qty }
}

/** A made item's refined count: its make time in three-quarter gathers. */
export const madeRefinedV4 = (id: string): number => Object.values(madeRecipeV4(id)).reduce((a, b) => a + b, 0)

/** A made item's name: `madeName`, which reads Arms Gem for a Weapon Gem since the farm by line. */
export const madeNameV4 = (id: string): string | undefined => madeName(id)
