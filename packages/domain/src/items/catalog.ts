// Copied from uma-rpg packages/domain/src/items/catalog.ts at 30a322a, with its Wilds-only parts cut.
// The grade gate, the one rule the Wilds read from uma-rpg's v1 item catalog: its 160 v1 items stay behind.

/** Craft Level opens one grade every five levels: grade k at Lv 5k − 4 (1, 6, 11 … 46). */
export const gradeUnlockLevel = (grade: number): number => 5 * grade - 4
