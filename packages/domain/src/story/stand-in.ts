// The stand-in story pack (F46 decision 6; romance spec RM59): an invented cast of three, numbered 9000001–9000003, in the
// private pack's layout (`stand-in/`: cast, ties, `umas/<id>`, `routes/<id>`, `pairs/<a>-<b>`), so the romance core is
// built and tested without a real character, name or line. 9000001 is a farmer with her whole route (her arrival and 26
// events); 9000002, a forager, and 9000003, a fisher, have their arrival scenes only and no bible, so "still being
// written" and the calling's fallback are exercised. 9000001 and 9000002 (a strength-3 tie) have their pair's five
// conversations (F52 decision 10); 9000001 and 9000003 (strength 2) have none, so a tie's line stands in. None of the three outfits (900000101, 900000201, 900000301) is in master data: they show lettered
// discs and read D talents (RM3). The dark build loads it through `loadStoryPack()`; F56 swaps that seam for the private
// pack. Never shipped content.
import cast from './stand-in/cast.json'
import pair9000001x9000002 from './stand-in/pairs/9000001-9000002.json'
import route9000001 from './stand-in/routes/9000001.json'
import route9000002 from './stand-in/routes/9000002.json'
import route9000003 from './stand-in/routes/9000003.json'
import ties from './stand-in/ties.json'
import bible9000001 from './stand-in/umas/9000001.json'
import type { PackFiles } from './pack'

/** The stand-in's files, as a release would hold them: unchecked JSON, which `storyPackFrom` validates. */
export const STAND_IN_FILES: PackFiles = {
  cast,
  ties,
  umas: { 9000001: bible9000001 },
  routes: { 9000001: route9000001, 9000002: route9000002, 9000003: route9000003 },
  pairs: { '9000001-9000002': pair9000001x9000002 },
}
