// An invented world for the tests: made-up names, festivals, places and Town notes, in the stand-in's numbering
// (9000001–9000003). No original-game content.
import type { World } from './authored'

export const WORLD_FIXTURE: World = {
  names: { town: 'Fernwick', farm: 'Thistle Farm', region: 'the Marrow Vale' },
  history: ['Three families farmed this hill before you.', 'The last of them left the gate unlatched.'],
  festivals: [
    // One of the game's, renamed and moved a day earlier: it keeps its rule.
    { id: 'harvest-cup', name: 'The Long Run', season: 'winter', day: 11, happens: 'Everyone races the ridge road at dawn.' },
    // One of the game's, renamed only.
    { id: 'flower-show', name: 'Bloom Fair' },
    // One of the story's own.
    { id: 'lantern-walk', name: 'Lantern Walk', season: 'summer', day: 4, happens: 'Paper lanterns float down the river.' },
  ],
  places: { gate: { line: 'The old gate, latched at last.' }, fields: { name: 'Low Fields' } },
  seasons: { spring: 'The thaw runs off the hills.', winter: 'Frost on the fence rails.' },
  notes: [
    { id: 'old-well', title: 'The old well', lines: ['Nobody remembers who dug it.'] },
    { id: 'first-friend', title: 'A first friend', lines: ['She knew the farm before you did.'], unlock: { kind: 'event', after: '9000001:arrival' } },
    { id: 'cafe-window', title: 'The café window', lines: ['The best seat faces the hills.'], unlock: { kind: 'spot', spot: 'cafe' } },
    { id: 'lanterns', title: 'Lanterns', lines: ['Some float as far as the sea.'], unlock: { kind: 'festival', festival: 'lantern-walk' } },
    { id: 'the-mill', title: 'The mill', lines: ['It turned again the day you built it.'], unlock: { kind: 'built', place: 'mill' } },
  ],
}
