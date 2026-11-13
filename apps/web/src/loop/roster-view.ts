// The roster's cards: the Umas on the farm as album rows with their talents and ranks, the
// filters (talent and rank in each activity, favourite line) and the sorts (talent score and rank points in an activity,
// joined, name), the words on a card, and one Uma's nine activities for her sheet. `/roster` and every Uma picker (the
// Fields' tender, F22's jobs, F23's swaps) read these. F23 adds everyone on the roster, home or away, and your affinity
// with her. On save v4 her favourite line is the story pack's and there is no affinity until F47's route. Pure
// but for the pack, which the romance build has loaded before any screen.
import {
  atHome, farmHome,
  ACTIVITIES, ACTIVITY_NAMES, activityScore, challengeFor, challengeMet, favouriteActivity, favouriteOf, FAVOURITE_ACTIVITIES, HEART_POINTS, heartsOf,
  MAX_AFFINITY, pointsFull, RANK_POINTS, RANKS, TALENT_D, TALENT_GRADES,
  type Activity, type FarmOutfit, type RosterUma, type FarmSave, type StoryPack, type Talents, type TalentStep,
} from '@farm/domain'
import { storyPack } from '../story/story'
import type { UmaPickerRow, UmaPickerSort } from '@luismlorenzana/uma-kit/album'
import type { AlbumQuery, FacetDef, SortDef } from '@luismlorenzana/uma-kit/roster'

export interface LoopUma {
  outfitId: string
  /** "Hand · Mining", or "Novice" when she has no rank yet. */
  rank: string
}

export interface RosterView {
  home: LoopUma[]
  /** Umas on the roster on their off-season. */
  away: number
}

/** Her best activity by rank: the highest, then the most points, then the activities' order. */
export function bestActivity(uma: Pick<RosterUma, 'ranks'>): Activity {
  return ACTIVITIES.reduce((top, a) => {
    const r = uma.ranks[a]
    const t = uma.ranks[top]
    return r.rank > t.rank || (r.rank === t.rank && r.points > t.points) ? a : top
  })
}

/** Her best rank: "Hand · Mining", or "Novice" before her first points. */
export function bestRank(uma: Pick<RosterUma, 'ranks'>): string {
  const best = bestActivity(uma)
  const { rank, points } = uma.ranks[best]
  return rank === 0 && points === 0 ? RANKS[0] : `${RANKS[rank]} · ${ACTIVITY_NAMES[best]}`
}

export function rosterView(save: FarmSave): RosterView {
  return {
    home: farmHome(save).flatMap((id) => (save.roster[id] ? [{ outfitId: id, rank: bestRank(save.roster[id]) }] : [])),
    away: Object.keys(save.roster).length - farmHome(save).length,
  }
}

// --- The album's rows -----------------------------------------------------------------------------------

/** One Uma as the roster and the pickers show her. */
export interface LoopUmaRow extends UmaPickerRow {
  /** Her talents on this release; null for an outfit master data doesn't hold (she reads D). */
  talents: Talents | null
  ranks: RosterUma['ranks']
  /** Her favourite activity, from her calling's line. */
  favourite: Activity | null
  joined: number
  /** On the farm, or away on her off-season. */
  home: boolean
  /** Your affinity with her, 0–1,000. */
  affinity: number
}

/** Her step in an activity: master data's, or D. */
export const stepIn = (row: Pick<LoopUmaRow, 'talents'>, activity: Activity): TalentStep => row.talents?.steps[activity] ?? TALENT_D
/** Her score in an activity, for the talent sort; null without master data (sorts last). */
export const scoreIn = (row: Pick<LoopUmaRow, 'talents'>, activity: Activity): number | null => (row.talents ? activityScore(row.talents.scores, activity) : null)
/** "Hand · B": her rank and talent in an activity (the picker's card for a place's activity). */
export const rankTalent = (row: Pick<LoopUmaRow, 'talents' | 'ranks'>, activity: Activity): string => `${RANKS[row.ranks[activity].rank]} · ${TALENT_GRADES[stepIn(row, activity)]}`

/** The talent filter's bands: a row meets every band up to her grade (decision 7: C+, B+, A+, S). */
const TALENT_BANDS: readonly { value: string; label: string; step: TalentStep }[] = [
  { value: 'c', label: 'C+', step: 4 }, { value: 'b', label: 'B+', step: 5 }, { value: 'a', label: 'A+', step: 6 }, { value: 's', label: 'S', step: 7 },
]
export const talentFacet = (activity: Activity): string => `talent-${activity}`
export const rankFacet = (activity: Activity): string => `rank-${activity}`

/** The filters: her favourite line, her talent in each activity (C+, B+, A+, S), her rank in each. */
export const UMA_FACETS: readonly FacetDef[] = [
  { key: 'favourite', label: 'Favourite line', group: 'Favourite line', kind: 'enum', options: FAVOURITE_ACTIVITIES.map((a) => ({ value: a, label: ACTIVITY_NAMES[a] })) },
  ...ACTIVITIES.map((a): FacetDef => ({ key: talentFacet(a), label: `${ACTIVITY_NAMES[a]} talent`, group: 'Talent', kind: 'enum', options: TALENT_BANDS.map(({ value, label }) => ({ value, label })) })),
  ...ACTIVITIES.map((a): FacetDef => ({ key: rankFacet(a), label: `${ACTIVITY_NAMES[a]} rank`, group: 'Rank', kind: 'enum', options: RANKS.map((label, r) => ({ value: String(r), label })) })),
]

/** Where she is: on the farm or away. The roster's filter; pickers list only the Umas home. */
export const WHERE_FACET: FacetDef = {
  key: 'where', label: 'Where', group: 'Where', kind: 'enum', options: [{ value: 'home', label: 'On the farm' }, { value: 'away', label: 'Away' }],
}
/** The roster's filters: where she is, then the pickers'. */
export const ROSTER_FACETS: readonly FacetDef[] = [WHERE_FACET, ...UMA_FACETS]

/** The Umas `ids` (on the roster) as rows, with master data's names and talents; favourites from master data's roster on
 * v3, from the story pack on v4. */
export function umaRows(save: FarmSave, ids: readonly string[], names: ReadonlyMap<string, { name: string; releasedAt: string }>, talents: ReadonlyMap<string, Talents> | null,
  roster: readonly FarmOutfit[], story: Pick<StoryPack, 'cast' | 'bibles'> | null = storyPack()): LoopUmaRow[] {
  const lines = new Map(roster.map((o) => [o.outfitId, o]))
  return ids.flatMap((id) => {
    const uma = save.roster[id]
    if (!uma) return []
    const base = names.get(id)
    const name = base?.name ?? 'Uma'
    const outfit = lines.get(id)
    const favourite = save.version === 4 ? (story ? favouriteOf(story, id) : null) : outfit ? favouriteActivity(outfit) : null
    const row: LoopUmaRow = {
      id, name, releasedAt: base?.releasedAt ?? '', level: null, search: name.toLowerCase(), facets: {}, sorts: {},
      talents: talents?.get(id) ?? null, ranks: uma.ranks, favourite, joined: uma.joined, home: atHome(save, id), affinity: 'affinity' in uma ? uma.affinity : 0,
    }
    const facets: Record<string, readonly string[]> = { favourite: favourite ? [favourite] : [], where: [row.home ? 'home' : 'away'] }
    for (const a of ACTIVITIES) {
      facets[talentFacet(a)] = TALENT_BANDS.filter((band) => stepIn(row, a) >= band.step).map((band) => band.value)
      facets[rankFacet(a)] = [String(uma.ranks[a].rank)]
    }
    return [{ ...row, facets, sorts: { joined: uma.joined, name } }]
  })
}

/** The rows' sort values for an activity: her talent score and her rank points in it, joined and name. */
export function sortedFor(rows: readonly LoopUmaRow[], activity: Activity): LoopUmaRow[] {
  return rows.map((row) => ({ ...row, sorts: { ...row.sorts, talent: scoreIn(row, activity), points: row.ranks[activity].points } }))
}

const ACTIVITY_OPTIONS = ACTIVITIES.map((a) => ({ value: a, label: ACTIVITY_NAMES[a] }))
/** The roster's sorts: talent score and rank points in a chosen activity, joined, name. */
export const ROSTER_SORTS: readonly SortDef[] = [
  { key: 'joined', label: 'Joined', defaultDirection: 'asc' },
  { key: 'talent', label: 'Talent', defaultDirection: 'desc', parameter: { label: 'In', options: ACTIVITY_OPTIONS } },
  { key: 'points', label: 'Rank points', defaultDirection: 'desc', parameter: { label: 'In', options: ACTIVITY_OPTIONS } },
  { key: 'name', label: 'Name', defaultDirection: 'asc' },
]
/** The roster opens by joined, oldest first. */
export const ROSTER_QUERY: AlbumQuery = { search: '', filters: {}, sort: 'joined', direction: 'asc', group: null, view: 'icons', mode: null }
/** The activity a sort reads, or null for joined and name. */
export const sortActivity = (query: Pick<AlbumQuery, 'sort'>, parameter: string | null): Activity | null =>
  query.sort === 'talent' || query.sort === 'points' ? ((parameter as Activity | null) ?? 'farming') : null

/** A picker's sorts for a place's activity: her talent and rank points in it, joined, name. */
export function pickerSorts<T extends LoopUmaRow>(activity: Activity): UmaPickerSort<T>[] {
  const name = ACTIVITY_NAMES[activity]
  return [
    { key: 'talent', label: `${name} talent`, direction: 'desc', value: (row) => scoreIn(row, activity) },
    { key: 'points', label: `${name} points`, direction: 'desc', value: (row) => row.ranks[activity].points },
    { key: 'joined', label: 'Joined', direction: 'asc', value: (row) => row.joined },
    { key: 'name', label: 'Name', direction: 'asc', value: (row) => row.name },
  ]
}
/** A picker's opening order by a place's activity: rank, then points, then talent, then name. */
export const activityOrder = (activity: Activity) => (a: LoopUmaRow, b: LoopUmaRow): number =>
  b.ranks[activity].rank - a.ranks[activity].rank || b.ranks[activity].points - a.ranks[activity].points
  || (scoreIn(b, activity) ?? 0) - (scoreIn(a, activity) ?? 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

/** A roster card's two lines: her rank and talent in the sorted activity, with the activity (and her points when sorted
 * by them); else her best rank, and her best talent's activity and grade. */
export function cardLines(row: LoopUmaRow, activity: Activity | null, byPoints = false): [string, string] {
  if (activity) return [rankTalent(row, activity), `${ACTIVITY_NAMES[activity]}${byPoints ? ` · ${Math.floor(row.ranks[activity].points)} pts` : ''}`]
  const best = bestRank({ ranks: row.ranks } as RosterUma)
  const talent = row.talents ? `${ACTIVITY_NAMES[row.talents.best]} ${TALENT_GRADES[row.talents.steps[row.talents.best]]}` : ''
  return [best, talent]
}

// --- Her sheet: the nine activities -------------------------------------------------------------------------------

export interface ActivityLine {
  activity: Activity
  grade: string
  rank: string
  /** "52 / 160", or her points alone at Legend. */
  points: string
  /** Her next rank's challenge and her count: "Catch 30 fish · 12/30"; null at Legend. */
  challenge: string | null
  /** Points full, the challenge still to meet. */
  full: boolean
  /** Points full and the challenge met: she ranks up tonight. */
  tonight: boolean
  favourite: boolean
}

/** Whole points for the screens: 13.2 shows 13. */
export const wholePoints = (points: number): string => Math.floor(points + 1e-9).toLocaleString('en-US')

/** "Catch 30 fish · 12/30", or the challenge alone when its target is 1. */
export function challengeWords(activity: Activity, rank: number, count: number): string | null {
  const next = challengeFor(activity, rank as 0)
  if (!next) return null
  return next.target > 1 ? `${next.what} · ${Math.min(count, next.target).toLocaleString('en-US')}/${next.target.toLocaleString('en-US')}` : next.what
}

/** Her nine activities, in order, for her sheet. */
export function activityLines(row: LoopUmaRow): ActivityLine[] {
  return ACTIVITIES.map((activity) => {
    const state = row.ranks[activity]
    const next = RANK_POINTS[state.rank + 1]
    return {
      activity, grade: TALENT_GRADES[stepIn(row, activity)], rank: RANKS[state.rank],
      points: next === undefined ? wholePoints(state.points) : `${wholePoints(state.points)} / ${next.toLocaleString('en-US')}`,
      challenge: challengeWords(activity, state.rank, state.challenge), full: pointsFull(state) && !challengeMet(activity, state),
      tonight: pointsFull(state) && challengeMet(activity, state), favourite: row.favourite === activity,
    }
  })
}

// --- Affinity --------------------------------------------------------------------------------------------

/** "♥ 2 · 45/100": her whole hearts and her points toward the next; "♥ 10" at the top. */
export function heartsWords(affinity: number): string {
  const hearts = heartsOf(affinity)
  if (affinity >= MAX_AFFINITY) return '♥ 10'
  return `♥ ${hearts} · ${Math.floor(affinity - hearts * HEART_POINTS)}/${HEART_POINTS}`
}
