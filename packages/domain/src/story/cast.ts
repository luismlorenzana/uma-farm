// The town's people: fourteen roles, each played by an Uma. The story's `town.json` names who plays each role, by her
// character id (`people[].game` is the role's id below); with none, master data's characters fill them (`townOf`). Her
// name and bust come from master data at run time, so no name lives here: only each role's id and what it is. Eleven
// roles keep the ids of the game's first townsfolk, since the story maps onto them; three are new.

export const CAST_IDS = [
  'hollis-pryor', 'marta-quill', 'ben-carver', 'dale-hart', 'gus-talbot', 'rosa-bell', 'juno-park', 'ida-stone', 'nils-berg', 'wren-ashby', 'cole-varga',
  'courier', 'musician', 'bell-keeper',
] as const
export type CastId = typeof CAST_IDS[number]

export interface CastMember {
  readonly id: CastId
  /** The role in words, as a scene names her until master data gives her name ("The smith"). */
  readonly role: string
  /** What she does in the town. */
  readonly is: string
}

const member = (id: CastId, role: string, is: string): CastMember => ({ id, role, is })

/** The town's roles. */
export const CAST: Readonly<Record<CastId, CastMember>> = {
  'hollis-pryor': member('hollis-pryor', 'The mayor', 'Runs the town; welcomes you at the start'),
  'marta-quill': member('marta-quill', 'The shopkeeper', 'Keeps the general store (the shop) and its bakery'),
  'ben-carver': member('ben-carver', 'The farm’s last keeper', 'Kept the farm before you; gives the first seeds'),
  'dale-hart': member('dale-hart', 'The rancher', 'Sells animals and feed'),
  'gus-talbot': member('gus-talbot', 'The old miner', 'Knows the Mine and the Quarry'),
  'rosa-bell': member('rosa-bell', 'The cook', 'Judges the Cooking Contest'),
  'juno-park': member('juno-park', 'The guide', 'Knows the roads past the town'),
  'ida-stone': member('ida-stone', 'The smith', 'Sets up the ring bench'),
  'nils-berg': member('nils-berg', 'The captain', 'Sails the boat to the deep sea'),
  'wren-ashby': member('wren-ashby', 'The orchard’s keeper', 'A rival: the orchard over the hill, crops and cooking'),
  'cole-varga': member('cole-varga', 'The ranch’s keeper', 'A rival: the ranch down the road, animals and fishing'),
  courier: member('courier', 'The courier', 'Carries the post and the parcels'),
  musician: member('musician', 'The musician', 'Plays in the town’s squares'),
  'bell-keeper': member('bell-keeper', 'The bell’s keeper', 'Keeps the chapel bell'),
}

/** Whether an id is one of the town's roles. */
export const isCastId = (id: string): id is CastId => (CAST_IDS as readonly string[]).includes(id)
