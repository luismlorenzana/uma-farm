// The story pack's one loader seam: the private pack from farm-api's
// `/api/content/story…` (`delivery.ts`: the index fresh, each file verified by hash and cached, the last index offline),
// with master data's placeholders (`storyOf`): each character's default outfit and her line from her stats. When farm-api
// serves no pack at all (a 404 for `story.json`: nothing published yet, or no `content/story-release/` on the dev server),
// the game plays with no pack, on placeholders, so a farm always opens and plays whole. Either way the cast is the launch
// cast's 50 (`launchCast`, F96): the story's entry for each, else a bare one. The
// invented stand-in is the tests' only (`VITE_FARM_STORY=stand-in`, Vitest's): no production build holds it
// (`scripts/check-size.mjs`'s `DEV_ONLY_MODULES`). Loaded on demand, with the pack, so none of it reaches the initial JS.
import {
  birthdaysOf, castEntry, festivalsOf, isCastId, isSister, LAUNCH_CAST, launchCast, masterCastFrom, outfitOf, sisterNameOf, speakerId, STAND_IN_FILES, storyOf, storyPackFrom, type MasterCast, type MasterOutfit,
  withLaunchProfessions, type SpecialDays, type StoryPack,
} from '@farm/domain'
import type { OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import { CONTENT } from '../content/client'
import { masterReady, setMasterLens, type MasterView } from '../master/master'
import { deviceIndexStore, loadReleasedPack } from './delivery'
export { refreshTownRequests } from '@farm/domain'
import { keepArrived } from './news'
import { unknownName } from './story'

/** Keeps a roster's Umas on the cast (`story.ts`'s `keepOnCast`), and the year's festivals (`story.ts`'s
 * `useStoryYear`), loaded with the seam. */
export { activateLongGame, festivalsOf, withCast } from '@farm/domain'

/** Master data's birthdays as the pack loaded with them: the special days read them through the cast. */
let birthdays: MasterView['birthdays'] = new Map()

/** The story the game plays: the release farm-api serves, or no pack when it serves none, with master data's
 * placeholders. Both wait for master data, as the boot does. A shipped release new to this device waits for the
 * morning's "New story arrived" (`news.ts`). In the tests, the invented stand-in alone. */
/** The story pack the game plays: the released one (else none), with master data's placeholders, its cast kept to the
 * launch cast (`launch`, the Ranker's Tier 1–5; the tests name their own). */
export async function loadStoryPack(launch: readonly string[] = LAUNCH_CAST): Promise<StoryPack> {
  if (import.meta.env.DEV && import.meta.env.VITE_FARM_STORY === 'stand-in') return storyPackFrom(STAND_IN_FILES)
  const arrived = (index: { number?: number }) => { if (index.number) keepArrived({ number: index.number }) }
  const [pack, view] = await Promise.all([loadReleasedPack(CONTENT, deviceIndexStore(), { missing: async () => null, arrived }), masterReady()])
  birthdays = view.birthdays
  // The launch cast (F96): the game's Umas are the Ranker's Tier 1–5, whatever else the story holds.
  const all = storyOf(pack, masterCast(view))
  const base = withLaunchProfessions(launchCast(all, launch))
  const extras = new Set((all.world?.expansionCast ?? []).filter(id => !launch.includes(id)))
  const expansion = all.cast.umas.filter(uma => extras.has(uma.characterId))
  const expansionProfessions = base.town?.professions?.filter(job => job.partners.every(id => extras.has(id)))
  const town = base.town?.professions ? { ...base.town, professions: base.town.professions.filter(job => job.partners.every(id => launch.includes(id))) } : base.town
  return { ...base, town, expansion, expansionProfessions }
}

/** The special days: the year's festivals (the story's) and the cast's birthdays (her cast entry's, else master data's). */
export const specialDaysOf = (pack: StoryPack): SpecialDays => ({ festivals: festivalsOf(pack), birthdays: birthdaysOf(pack, birthdays) })

/** What master data gives the placeholders: each character's default outfit and each outfit's line from its stats. */
export function masterCast(view: Pick<MasterView, 'outfits' | 'stats'>): MasterCast {
  const outfits = [...view.outfits].flatMap(([id, o]): MasterOutfit[] => {
    const stats = view.stats.get(id)
    return stats ? [{ id, characterId: o.characterId, variant: o.variant, stats: stats.stats, growthRatePercents: stats.growthRatePercents }] : []
  })
  return masterCastFrom(outfits)
}

/** An album row for a character master data doesn't hold (the stand-ins): her lettered disc's name, nothing else. */
function unknownRow(id: string, name: string | null = null): OutfitRowBase {
  const grades = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 'G'])) as Record<K, 'G'>
  return {
    id, name: name ?? unknownName(id), title: null, rarity: 3, releasedAt: '',
    aptitudes: { surface: grades(['turf', 'dirt']), distance: grades(['sprint', 'mile', 'medium', 'long']), strategy: grades(['front', 'pace', 'late', 'end']) },
    art: { icon: id, bust: id, face: id, chibi: `${id}-a` },
  }
}

/** Master data seen through the resolver: each cast Uma's character id gets her outfit's album row (the cast's outfit,
 * else her default from master data; her name is her character's, a sister's the pack's) and stats, so the screens, the
 * talents and the pickers read the roster's character ids as outfits. A character master data lacks gets a lettered
 * disc's row and no stats (D talents). */
export function castLens(pack: StoryPack): (view: MasterView) => MasterView {
  return (view) => {
    const album = new Map(view.album)
    const stats = new Map(view.stats)
    for (const { characterId } of pack.cast.umas) {
      const outfit = outfitOf(pack, characterId)
      const row = view.album.get(outfit)
      // A sister's name is the pack's (else her elder's, as her sister): her outfit's row names her elder.
      const name = isSister(characterId) ? sisterNameOf(pack, characterId, row?.name || null) : null
      album.set(characterId, row ? { ...row, id: characterId, ...(name ? { name } : {}) } : unknownRow(characterId, name))
      const stat = view.stats.get(outfit)
      if (stat) stats.set(characterId, stat)
    }
    return { ...view, album, stats }
  }
}

/** The outfit anyone's art shows: a cast Uma's (her cast entry's, else master data's default); a sister's own outfit;
 * one of the town's roles, the Uma who plays it; any other character of master data's, her default outfit; anything
 * else (an outfit id itself), as it is. Outfit ids and character ids never meet, so a character id maps safely. */
export function artResolver(pack: StoryPack): (id: string) => string {
  return (id) => {
    if (castEntry(pack, id) || isSister(id)) return outfitOf(pack, id)
    const who = isCastId(id) ? speakerId(pack, id) : id
    return pack.master?.outfits.get(who) ?? who
  }
}

/** Turns the pack on: master data's view through the cast, and the resolver the album's art reads. */
export function installStory(pack: StoryPack): (id: string) => string {
  setMasterLens(castLens(pack))
  return artResolver(pack)
}
