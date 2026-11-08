// Copied from uma-rpg packages/domain/src/items/catalog.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The grade gate, the one rule the Wilds read from uma-rpg's v1 item catalog: its 160 v1 items stay behind (FM4).

export const ITEM_GRADES = 10

/** Craft Level opens one grade every five levels: grade k at Lv 5k − 4 (1, 6, 11 … 46). */
export const gradeUnlockLevel = (grade: number): number => 5 * grade - 4
export const highestGrade = (craftLevel: number): number => Math.min(ITEM_GRADES, Math.floor((craftLevel + 4) / 5))
