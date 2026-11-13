// The town's cast: eleven original people, whose names and lines live in git. Umas never
// appear here: they speak only in roles the app fills at runtime from master data (the cast's roles). Chapter 1's scenes
// speak three of them (the Mayor, Marta, Old Ben) and name a fourth (Dale Hart); Ida Stone opens the ring bench; the rest
// arrive with their chapters.

export const CAST_IDS = [
  'hollis-pryor', 'marta-quill', 'ben-carver', 'dale-hart', 'gus-talbot', 'rosa-bell', 'juno-park', 'ida-stone', 'nils-berg', 'wren-ashby', 'cole-varga',
] as const
export type CastId = typeof CAST_IDS[number]

export interface CastMember {
  readonly id: CastId
  /** How a scene names them. */
  readonly name: string
  /** Who they are in the town. */
  readonly is: string
  /** The chapter that first brings them in (1 for the rivals: the Flower Show). */
  readonly from: number
  /** uma-art's bust key (the `cast` atlas); a lettered disc until it ships. */
  readonly art: string
}

const member = (id: CastId, name: string, is: string, from: number): CastMember => ({ id, name, is, from, art: `cast/${id}` })

/** The cast table. */
export const CAST: Readonly<Record<CastId, CastMember>> = {
  'hollis-pryor': member('hollis-pryor', 'Mayor Hollis Pryor', 'Runs the town; opens each chapter', 1),
  'marta-quill': member('marta-quill', 'Marta Quill', 'Keeps the general store (the shop)', 1),
  'ben-carver': member('ben-carver', 'Old Ben Carver', 'Kept the farm before you; gives the first seeds', 1),
  'dale-hart': member('dale-hart', 'Dale Hart', 'Rancher; sells animals and feed', 2),
  'gus-talbot': member('gus-talbot', 'Gus Talbot', 'Retired miner; reopens the Mine and the Quarry', 3),
  'rosa-bell': member('rosa-bell', 'Rosa Bell', 'Cook; judges the Cooking Contest, first guest at the Restaurant', 4),
  'juno-park': member('juno-park', 'Juno Park', 'Runs the expedition post', 5),
  'ida-stone': member('ida-stone', 'Ida Stone', 'Smith; lights the Forge', 7),
  'nils-berg': member('nils-berg', 'Captain Nils Berg', 'Sails the boat to the deep sea', 7),
  'wren-ashby': member('wren-ashby', 'Wren Ashby', 'Rival: Ashby Orchards, crops and cooking', 1),
  'cole-varga': member('cole-varga', 'Cole Varga', 'Rival: Varga Ranch, animals and fishing', 1),
}

/** The letter on a cast member's disc until the busts ship: the first letter of their given name. */
export const castInitial = (id: CastId): string => CAST[id].name.replace(/^(Mayor|Old|Captain) /, '').charAt(0)
