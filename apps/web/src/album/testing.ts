// Small, invented UI fixtures only (from uma-rpg's album/testing.ts at 30a322a). Never import private release data into
// tests: the outfits are copies of uma-data's synthetic one with invented ids, names, running styles and, for F21's
// talents, chosen 5★ stats and growth rates.
import type { Character, Outfit } from '@luismlorenzana/uma-data'
import { buildMemoryRelease, syntheticMasterData } from '@luismlorenzana/uma-data/testing'
import { masterView, type MasterView } from '../master/master'

export const NOW = '2026-11-08T12:00:00.000Z'

type Style = 'front' | 'pace' | 'late' | 'end'
/** Six invented outfits: a Front runner (Metal), two Pace alone (Wood), Pace with Late (Stone), End (Fish), Late alone
 * (Vegetables). */
const STYLES: readonly Style[][] = [['front'], ['pace'], ['pace'], ['pace', 'late'], ['end'], ['late']]
const NAMES = ['Aster', 'Beryl', 'Cinder', 'Dune', 'Ember', 'Fable']
/** Speed, Stamina, Power, Guts, Wit. */
export type Five = readonly [number, number, number, number, number]
const stat = (v: Five) => ({ speed: v[0], stamina: v[1], power: v[2], guts: v[3], wit: v[4] })

/** The six invented outfits; `stats` gives each her 5★ stats and growth rates (else the synthetic one's). */
export async function albumFixture(styles: readonly Style[][] = STYLES, stats?: readonly { star5: Five; growth?: Five }[]): Promise<{ view: MasterView }> {
  const data = syntheticMasterData()
  const characters: Character[] = styles.map((_, i) => ({ ...data.characters[0]!, id: 90001 + i, name: { ja: NAMES[i]!, en: NAMES[i]!, global: NAMES[i]! } }))
  const outfits: Outfit[] = styles.map((best, i) => ({
    ...data.outfits[0]!, id: 81001 + i, characterId: 90001 + i,
    title: { ja: `Practice ${i}`, en: `Practice ${i}`, global: `Practice ${i}` },
    release: { ...data.outfits[0]!.release, jp: `2026-01-${String(i + 1).padStart(2, '0')}` },
    aptitudes: { ...data.outfits[0]!.aptitudes, strategy: { front: 'C', pace: 'C', late: 'C', end: 'C', ...Object.fromEntries(best.map((s) => [s, 'A'])) } },
    ...(stats?.[i] ? { stats: { ...data.outfits[0]!.stats, star5: stat(stats[i].star5) }, growthRatePercents: stat(stats[i].growth ?? [0, 0, 0, 0, 0]) } : {}),
  }))
  const { manifest } = await buildMemoryRelease(data)
  return { view: masterView(manifest, characters, outfits, null) }
}
