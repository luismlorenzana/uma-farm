// The stand-in story pack: an invented cast of three, numbered 9000001–9000003, in the
// private pack's layout (`stand-in/`: cast, ties, `umas/<id>`, `routes/<id>`, `pairs/<a>-<b>`), so the romance core is
// built and tested without a real character, name or line. 9000001 is a farmer with her whole route (her arrival and 26
// events); 9000002, a forager, and 9000003, a fisher, have their arrival scenes only and no bible, so "still being
// written" and the calling's fallback are exercised. 9000001 and 9000002 (a strength-3 tie) have their pair's five
// conversations; 9000001 and 9000003 (strength 2) have none, so a tie's line stands in. The household
// holds the three scenes and the finale with a beat for each of the three, and house lines for 9000001
// and 9000002 (9000003's come from the templates); 9000001 wishes for her own house and her birthday alone. None of the three outfits (900000101, 900000201, 900000301) is in master data: they show lettered
// discs and read D talents. The dark build loads it through `loadStoryPack()`; shipping swaps that seam for the private
// pack. Never shipped content.
import cast from './stand-in/cast.json'
import household from './stand-in/household.json'
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
  household,
}
