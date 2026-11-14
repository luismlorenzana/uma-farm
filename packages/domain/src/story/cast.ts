// The town's cast: eleven original people, whose names and lines live in git. They're the town's people, with no plot:
// the farm has no global story. Umas never appear here. The opening speaks three of them (the Mayor, Marta, Old Ben);
// Ida Stone opens the ring bench; the rest have no lines yet.

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
  /** uma-art's bust key (the `cast` atlas); a lettered disc until it ships. */
  readonly art: string
}

const member = (id: CastId, name: string, is: string): CastMember => ({ id, name, is, art: `cast/${id}` })

/** The cast table. */
export const CAST: Readonly<Record<CastId, CastMember>> = {
  'hollis-pryor': member('hollis-pryor', 'Mayor Hollis Pryor', 'Runs the town; welcomes you at the start'),
  'marta-quill': member('marta-quill', 'Marta Quill', 'Keeps the general store (the shop)'),
  'ben-carver': member('ben-carver', 'Old Ben Carver', 'Kept the farm before you; gives the first seeds'),
  'dale-hart': member('dale-hart', 'Dale Hart', 'Rancher; sells animals and feed'),
  'gus-talbot': member('gus-talbot', 'Gus Talbot', 'Retired miner; knows the Mine and the Quarry'),
  'rosa-bell': member('rosa-bell', 'Rosa Bell', 'Cook; judges the Cooking Contest'),
  'juno-park': member('juno-park', 'Juno Park', 'Knows the roads past the town'),
  'ida-stone': member('ida-stone', 'Ida Stone', 'Smith; sets up the ring bench'),
  'nils-berg': member('nils-berg', 'Captain Nils Berg', 'Sails the boat to the deep sea'),
  'wren-ashby': member('wren-ashby', 'Wren Ashby', 'Rival: Ashby Orchards, crops and cooking'),
  'cole-varga': member('cole-varga', 'Cole Varga', 'Rival: Varga Ranch, animals and fishing'),
}

/** The letter on a cast member's disc until the busts ship: the first letter of their given name. */
export const castInitial = (id: CastId): string => CAST[id].name.replace(/^(Mayor|Old|Captain) /, '').charAt(0)
