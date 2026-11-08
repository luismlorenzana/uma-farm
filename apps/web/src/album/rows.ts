// The worker picker's rows on uma-kit's album (FW7; from uma-rpg apps/web/src/album/rows.ts at 30a322a, F5): every outfit
// on the release, each her own row with her Craft Level (Lv 1 until her first job), whether she's free, her aptitudes and
// her trade as facets. Names and art keys come from master data at runtime only. uma-rpg's classes, templates, ownership
// and upgrades stay behind: every outfit works (FM6).
import { availableWorkers, type FarmOutfit, type FarmWorld } from '@farm/domain'
import type { UmaPickerRow, UmaPickerSort } from '@luismlorenzana/uma-kit/album'
import type { FacetDef, OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import type { MasterView } from '../master/master'
import { tradeLabel, TRADES_BY_ROW } from '../save/trade'

export interface FarmUmaRow extends UmaPickerRow {
  outfit: FarmOutfit
  base: OutfitRowBase
  /** Her Craft Level; 1 before her first job. */
  craft: number
  /** She has worked: her row is in the save. */
  worked: boolean
  busy: boolean
}

const A_PLUS = (grades: Readonly<Record<string, string>>) => Object.keys(grades).filter((k) => grades[k] === 'A' || grades[k] === 'S')
const LABEL: Readonly<Record<string, string>> = {
  turf: 'Turf', dirt: 'Dirt', sprint: 'Sprint', mile: 'Mile', medium: 'Medium', long: 'Long', front: 'Front', pace: 'Pace', late: 'Late', end: 'End',
}
const aptitude = (key: string, label: string, options: readonly string[]): FacetDef => ({
  key, label, group: 'Aptitudes', kind: 'enum', options: options.map((value) => ({ value, label: LABEL[value] ?? value })),
})

/** Her trade (FW7): the line her best running styles name, in the map's row order. */
export const TRADE_FACET: FacetDef = { key: 'trade', label: 'Trade', group: 'Trade', kind: 'enum', options: TRADES_BY_ROW.map((value) => ({ value, label: tradeLabel(value) })) }

/** The picker's filters: her trade, free now, rarity, and her A+ aptitudes. */
export const PICKER_FACETS: readonly FacetDef[] = [
  TRADE_FACET,
  { key: 'free', label: 'Free now', group: 'Work', kind: 'boolean' },
  { key: 'worked', label: 'Has worked', group: 'Work', kind: 'boolean' },
  { key: 'rarity', label: 'Rarity', group: 'Collection', kind: 'enum', options: [1, 2, 3].map((n) => ({ value: String(n), label: '★'.repeat(n) })) },
  aptitude('strategy', 'Running style · A+', ['front', 'pace', 'late', 'end']),
  aptitude('distance', 'Distance · A+', ['sprint', 'mile', 'medium', 'long']),
  aptitude('surface', 'Surface · A+', ['turf', 'dirt']),
]

/** The picker's sorts beyond its opening order (her trade, free, Craft Level). */
export const PICKER_SORTS: readonly UmaPickerSort<FarmUmaRow>[] = [
  { key: 'release', label: 'Release date', direction: 'desc', value: (row) => row.releasedAt },
  { key: 'name', label: 'Name', direction: 'asc', value: (row) => row.name },
  { key: 'rarity', label: 'Rarity', direction: 'desc', value: (row) => row.base.rarity },
]

export const foldSearch = (text: string): string => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Every outfit on the release as a picker row, at `now`. */
export function albumRows(view: Pick<MasterView, 'roster' | 'album'>, world: FarmWorld, now: string): FarmUmaRow[] {
  const available = availableWorkers(world, now, view.roster.map((o) => o.outfitId))
  return view.roster.flatMap((outfit) => {
    const base = view.album.get(outfit.outfitId)
    if (!base) return []
    const uma = world.umas[outfit.outfitId]
    const craft = uma?.craft.level ?? 1
    const busy = !available.has(outfit.outfitId)
    return [{
      id: base.id, name: base.name, releasedAt: base.releasedAt, level: craft, workLevel: craft, free: !busy,
      search: `${base.name} ${base.title ?? ''} ${foldSearch(`${base.name} ${base.title ?? ''}`)}`.toLowerCase(),
      facets: {
        trade: [outfit.trade], free: !busy, worked: uma !== undefined, rarity: [String(base.rarity)],
        strategy: A_PLUS(base.aptitudes.strategy), distance: A_PLUS(base.aptitudes.distance), surface: A_PLUS(base.aptitudes.surface),
      },
      sorts: { release: base.releasedAt, name: base.name, rarity: base.rarity, craft },
      outfit, base, craft, worked: uma !== undefined, busy,
    }]
  })
}
