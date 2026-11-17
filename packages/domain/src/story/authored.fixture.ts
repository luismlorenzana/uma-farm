// The stand-in story: an invented cast of three, numbered 9000001–9000003, and one Uma's whole route, so
// the authored format and its validator are tested without a real character, name or line. Read from the stand-in pack
// in `stand-in/`, the pack's own layout. Not shipped content.
import type { Cast, PairConversations, Route, Ties, UmaBible } from './authored'
import { storyPackFrom, type PackFiles, type StoryPack } from './pack'
import { STAND_IN_FILES } from './stand-in'

export const STAND_IN = '9000001'
export const STAND_INS = ['9000001', '9000002', '9000003'] as const

export const STAND_IN_CAST = STAND_IN_FILES.cast as Cast
export const STAND_IN_TIES = STAND_IN_FILES.ties as Ties
export const STAND_IN_BIBLE = STAND_IN_FILES.umas[STAND_IN] as UmaBible
export const STAND_IN_ROUTE = STAND_IN_FILES.routes[STAND_IN] as Route
/** The forager's and the fisher's routes: their arrival scenes only. */
export const STAND_IN_ARRIVALS = { 9000002: STAND_IN_FILES.routes['9000002'] as Route, 9000003: STAND_IN_FILES.routes['9000003'] as Route }

/** The stand-in pair's five conversations, 9000001 and 9000002. */
export const STAND_IN_PAIR = STAND_IN_FILES.pairs!['9000001-9000002'] as PairConversations

/** A pack of invented Umas only, in this order, each on the game's default schedule (no bible, no ties, no town): the
 * simulations' farmhands, whose farm days the night reads from it. */
export const castPack = (ids: readonly string[]): StoryPack =>
  storyPackFrom({ cast: { umas: ids.map((characterId) => ({ characterId })) }, ties: { version: 1, ties: [] }, umas: {}, routes: {} })

/** An invented home in town, for `atHomeInTown`. */
export const HOME_IN_TOWN = 'invented-home'
/** Pack files with every Uma of the cast given a home in town (an invented one, added to the town's locations): no day of
 * her schedule puts her out, so once she's a farmhand every day is her farm day (`town/town.ts`'s `farmDaysIn`). The
 * tests of what a farmhand on the farm does read it. */
export function atHomeInTown<F extends PackFiles>(files: F): F {
  const cast = files.cast as Cast
  const town = (files.town ?? {}) as { locations?: unknown[] }
  return {
    ...files,
    cast: { ...cast, umas: cast.umas.map((u) => ({ ...u, home: HOME_IN_TOWN })) },
    town: { ...town, locations: [...(town.locations ?? []), { id: HOME_IN_TOWN, name: 'An Invented Home', kind: 'home' }] },
  }
}
