// Bonds between Umas (core spec CS44; romance spec RM48): a pair's bond points (`save.bonds`, by `pairKey`) and the hearts
// they make. F47 writes the hearts' thresholds for Ready's bond setup (decision 13); F52 grows this file with the points
// themselves (`addBond`, `tickBonds`, the ties' seeds, the closest friend). Loaded with the romance's rules.

/** CS44: a pair's bond hearts 1–5 at 50, 150, 300, 500 and 750 points. */
export const BOND_HEARTS: readonly number[] = [50, 150, 300, 500, 750]

/** A pair's bond hearts, 0–5, from its points. */
export const bondHearts = (points: number): number => BOND_HEARTS.filter((at) => points >= at).length
