// The launch cast (F96): the game opens with the Uma Ranker's Tier 1–5, 50 Umas, and only they are in the game: in
// town, on the People page, met, on the calendar and in the romance. Later releases add sets of Umas as release packs
// (the roadmap's "Later: release packs").
//
//   the 50       the live Ranker plan's identities in tiers T1–T5 (generated 2026-11-16, profiles revision 6),
//                in its order: 44 characters and 6 sisters, by id only
//   applied      where the app forms its cast, after the story's (else master data's placeholders): each of the 50 keeps
//                her story entry, in the story's order, and one the story lacks joins bare at the end and plays the
//                default story. Everyone else leaves the cast; the town's people keep their posts (`town.json`), and
//                an Uma already on a farm's roster stays (`withCast`)
import type { StoryPack } from './pack'
import type { CastId } from './cast'
import { WEEKDAYS, type TownProfession } from '../town/professions'

/** The launch cast's ids, in the Ranker's order (Tier 1 first). */
export const LAUNCH_CAST: readonly string[] = [
  // Tier 1
  '1129', '1068', '1116', '1115', '1067', '1149', '1114', '1134', '1118', '1117',
  // Tier 2
  '1076', '1086', '1141', '1081', '1090', '1106', '1143', '1094', '1110', '1130',
  // Tier 3
  's106802', 's106702', '1137', '1069', '1071', '1006', '1136', '1031', '1064', '1004',
  // Tier 4
  's106803', 's106703', '1010', '1016', '1020', '1144', '1026', '1111', '1093', '1088',
  // Tier 5
  's102602', 's103102', '1002', '1087', '1105', '1077', '1092', '1121', '1082', '1112',
]

const LAUNCH_JOBS: readonly [id: string, name: string, at: string, role?: CastId][] = [
  ['grocer', 'Grocer', 'store', 'marta-quill'], ['rancher', 'Rancher', 'rancher', 'dale-hart'],
  ['smith', 'Smith', 'smith', 'ida-stone'], ['cook', 'Cook', 'cafe', 'rosa-bell'],
  ['dock-steward', 'Dock steward', 'harbour', 'nils-berg'], ['baker', 'Baker', 'store'],
  ['tailor', 'Tailor', 'market'], ['seed-merchant', 'Seed merchant', 'market'],
  ['courier', 'Courier', 'plaza', 'courier'], ['cafe-host', 'Café host', 'cafe'],
  ['innkeeper', 'Innkeeper', 'plaza'], ['musician', 'Musician', 'plaza', 'musician'],
  ['florist', 'Florist', 'market'], ['carpenter', 'Carpenter', 'smith', 'gus-talbot'],
  ['librarian', 'Librarian', 'library'], ['archivist', 'Archivist', 'library'],
  ['bell-keeper', 'Bell keeper', 'plaza', 'bell-keeper'], ['animal-nurse', 'Animal nurse', 'rancher', 'cole-varga'],
  ['orchard-keeper', 'Orchard keeper', 'market', 'wren-ashby'], ['woodland-guide', 'Woodland guide', 'track', 'juno-park'],
  ['beekeeper', 'Beekeeper', 'market'], ['fisher', 'Fisher', 'harbour'], ['boatwright', 'Boatwright', 'harbour'],
  ['miller', 'Miller', 'market', 'ben-carver'], ['expedition-outfitter', 'Expedition outfitter', 'track'],
]

/** Working assignments until a release supplies the owner's complete launch plan. Pairs follow stable launch order. */
function bundledProfessions(): TownProfession[] {
  return LAUNCH_JOBS.map(([id, name, at, role], index) => ({
    id, name, at, off: WEEKDAYS[index % WEEKDAYS.length]!,
    partners: [LAUNCH_CAST[index * 2]!, LAUNCH_CAST[index * 2 + 1]!], ...(role ? { role } : {}),
  }))
}

export function withLaunchProfessions(pack: StoryPack): StoryPack {
  const inCast = new Set(pack.cast.umas.map(uma => uma.characterId))
  if (!LAUNCH_CAST.every(id => inCast.has(id))) return pack
  const authored = pack.town?.professions
  const assigned = new Set(authored?.flatMap(job => job.partners))
  const complete = assigned.size === LAUNCH_CAST.length && LAUNCH_CAST.every(id => assigned.has(id))
  return complete ? pack : { ...pack, town: { ...pack.town, professions: bundledProfessions() } }
}

/** The cast kept to `ids`: each one's story entry in the pack's order, then any the pack lacks, bare, in the list's order.
 * Everything else in the pack is unchanged. */
export function launchCast(pack: StoryPack, ids: readonly string[]): StoryPack {
  const keep = new Set(ids)
  const kept = pack.cast.umas.filter((u) => keep.has(u.characterId))
  const held = new Set(kept.map((u) => u.characterId))
  const bare = ids.filter((id) => !held.has(id)).map((characterId) => ({ characterId }))
  return { ...pack, cast: { ...pack.cast, umas: [...kept, ...bare] } }
}
