// The stand-in story (F40 RS15, F46): an invented cast of three, numbered 9000001–9000003, and one Uma's whole route, so
// the authored format and its validator are tested without a real character, name or line. Read from the stand-in pack
// in `stand-in/`, the pack's own layout (F46 decision 6). Not shipped content.
import type { Cast, PairConversations, Route, Ties, UmaBible } from './authored'
import { STAND_IN_FILES } from './stand-in'

export const STAND_IN = '9000001'
export const STAND_INS = ['9000001', '9000002', '9000003'] as const

export const STAND_IN_CAST = STAND_IN_FILES.cast as Cast
export const STAND_IN_TIES = STAND_IN_FILES.ties as Ties
export const STAND_IN_BIBLE = STAND_IN_FILES.umas[STAND_IN] as UmaBible
export const STAND_IN_ROUTE = STAND_IN_FILES.routes[STAND_IN] as Route
/** The forager's and the fisher's routes: their arrival scenes only. */
export const STAND_IN_ARRIVALS = { 9000002: STAND_IN_FILES.routes['9000002'] as Route, 9000003: STAND_IN_FILES.routes['9000003'] as Route }

/** The stand-in pair's five conversations, 9000001 and 9000002 (F52 decision 10). */
export const STAND_IN_PAIR = STAND_IN_FILES.pairs!['9000001-9000002'] as PairConversations
