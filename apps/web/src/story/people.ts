// Anyone the game names, as a scene, the town or a profile shows her: a cast Uma (master data's name through the cast's
// lens), a sister (the pack's name, else her elder's, as her sister), one of the town's roles (the Uma who plays it,
// else the role in words: "The smith"), or any other character of master data's. Names come from master data and the
// pack at run time, never from git. Loaded with the screens that name people.
import { CAST, isCastId, isSister, sisterNameOf, sisterOutfit, speakerId, type StoryPack } from '@farm/domain'
import type { MasterView } from '../master/master'
import { unknownName } from './story'

type NamesView = Pick<MasterView, 'album' | 'names' | 'outfits'>

/** Who a `say` (or a tie, or a spot's keeper) is once the town's roles are filled: the Uma who plays a role, else the
 * role; anyone else is herself. */
export const whoIs = (pack: StoryPack | null, who: string): string => (pack ? speakerId(pack, who) : who)

/** Her name: see the top. "An Uma" (or a stand-in's "Stand-in 1") for someone neither master data nor the pack holds. */
export function nameOfAnyone(view: NamesView | null, pack: StoryPack | null, who: string): string {
  const id = whoIs(pack, who)
  if (isCastId(id)) return CAST[id].role
  const row = view?.album.get(id)?.name
  if (row) return row
  if (isSister(id)) {
    const elder = view?.outfits.get(sisterOutfit(id))?.characterId
    return (pack ? sisterNameOf(pack, id, elder ? view?.names?.get(elder) ?? null : null) : null) ?? unknownName(id)
  }
  return view?.names?.get(id) ?? unknownName(id)
}

/** `nameOfAnyone` bound to a view and a pack: the players' and the town's `nameOf`. */
export const namer = (view: NamesView | null, pack: StoryPack | null) => (who: string): string => nameOfAnyone(view, pack, who)
