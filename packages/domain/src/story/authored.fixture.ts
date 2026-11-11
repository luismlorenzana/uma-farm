// The stand-in story (F40 RS15): an invented cast of three, numbered 9000001–9000003, and one Uma's whole route, so the
// authored format and its validator are tested without a real character, name or line. Not shipped content.
import { RUNGS, type Beat, type Cast, type PairConversations, type Route, type Ties, type UmaBible } from './authored'

export const STAND_IN = '9000001'
export const STAND_INS = ['9000001', '9000002', '9000003'] as const

export const STAND_IN_CAST: Cast = {
  version: 1,
  export: { file: 'export/stand-in.zip', exportedAt: '2026-01-01T00:00:00Z', tier: 'SS' },
  opening: ['9000001', '9000002', '9000003'],
  umas: [
    { characterId: '9000001', outfitId: '900000101', arrives: { kind: 'opening' }, calling: 'farming', paragraph: 'Stand-in one came to grow things.' },
    { characterId: '9000002', outfitId: null, arrives: { kind: 'opening' }, calling: 'foraging', paragraph: 'Stand-in two came for the woods.' },
    { characterId: '9000003', outfitId: null, arrives: { kind: 'opening' }, calling: 'fishing', paragraph: 'Stand-in three came for the quiet.' },
  ],
}

export const STAND_IN_TIES: Ties = {
  version: 1,
  ties: [
    { a: '9000001', b: '9000002', kind: 'friends', strength: 3, line: 'Old friends.', history: 'Invented.' },
    { a: '9000001', b: '9000003', kind: 'rivals', strength: 2, line: 'Old rivals.', history: 'Invented.' },
    { a: '9000002', b: '9000003', kind: 'teammates', strength: 1, line: 'They share the Pond.', history: 'Invented.' },
  ],
}

const beatFor = (id: string): Beat => {
  const ladder = id.startsWith('f') ? 'friendship' : id.startsWith('r') ? 'romance' : (id as Beat['ladder'])
  const hearts = /^[fr]\d+$/.test(id) ? Number(id.slice(1)) : 10
  return { id, ladder, hearts, trigger: { kind: 'hearts' }, place: 'fields', together: { kind: 'work', activity: 'farming' }, beat: `The stand-in's ${id}.` }
}

export const STAND_IN_BIBLE: UmaBible = {
  characterId: STAND_IN,
  outfitId: '900000101',
  now: 'An invented Uma, for tests.',
  whyTheFarm: 'To be tested.',
  dream: 'A clean run.',
  blurb: 'The stand-in.',
  favouriteLine: 'farming',
  season: 'spring',
  festival: 'flower-show',
  gifts: { loved: 'golden-carrot', liked: ['carrot', 'potato', 'cabbage'], disliked: ['limestone', 'iron-ore'] },
  laughs: 'A dropped hoe.',
  hurts: 'Being rushed.',
  route: RUNGS.map(beatFor),
}

export const STAND_IN_ROUTE: Route = {
  characterId: STAND_IN,
  events: RUNGS.map((id): Route['events'][number] => ({
    id,
    steps: [
      { place: 'fields' },
      { say: STAND_IN, line: 'Hello, {farmer}.', emote: 'happy' },
      { choice: [{ text: 'Hello yourself.', tone: 'warm', friendship: 20 }, { text: 'You again?', tone: 'playful', friendship: 10 }] },
      { play: { game: 'farming', prompt: 'Pull the weed', good: [{ narrate: 'It comes up clean.' }], miss: [{ narrate: 'It snaps.' }], friendship: 10 } },
    ],
  })),
}

export const STAND_IN_PAIR: PairConversations = {
  a: '9000001',
  b: '9000002',
  levels: [1, 2, 3, 4, 5].map((hearts): PairConversations['levels'][number] => ({ hearts, place: 'fields', steps: [{ say: '9000001', line: 'Morning.' }, { say: '9000002', line: 'Morning.' }] })),
}
