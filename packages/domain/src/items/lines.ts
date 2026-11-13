// The five material lines, an Uma's favourite line among them, and items' names from their uma-art ids. The story
// sandbox reads `MATERIAL_LINES` from here as the callings.

export const MATERIAL_LINES = ['metal', 'wood', 'vegetables', 'fish', 'stone'] as const
/** A line of goods: Metal, Wood, Vegetables, Fish and Stone. An Uma's favourite line is one of them. */
export type MaterialLine = typeof MATERIAL_LINES[number]

/** The words an id spells without their marks. */
const MARKED: Readonly<Record<string, string>> = { puree: 'Purée', philosophers: "Philosopher's" }
/** An item's name from its uma-art id: its words capitalized, two keeping their marks ("Tomato Purée"). */
export const itemNameOf = (id: string): string => id.split('-').map((w) => MARKED[w] ?? w[0]!.toUpperCase() + w.slice(1)).join(' ')
