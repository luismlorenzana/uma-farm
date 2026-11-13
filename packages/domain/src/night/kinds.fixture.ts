// Test-only work kinds on the day clock, so the night can be tested before the real ones: a 1-day gather at the
// forest and a multi-day make at the Mill. Invented requests over real good ids.
import { payItems, type WorkKindRules } from '@luismlorenzana/uma-work'
import { DAY_MS } from '../farm/calendar'
import { int, object, oneOf } from '../save/parse'
import type { LoopKinds } from '../save/parse-v3'
import { stockKey } from '../save/warehouse'
import type { LoopWorld } from '../work/loop-env'

const DAY_S = DAY_MS / 1000

/** A day at the forest per item: one Pine Log a day, its stars 1 + her foraging rank as the day's job is planned. */
const gather: WorkKindRules<LoopWorld> = {
  maxItems: 4,
  plan(world, outfitId, request) {
    const rank = world.save.roster[outfitId]?.ranks.foraging.rank ?? 0
    return Array.from({ length: request.count }, () => ({ seconds: DAY_S, inputs: [], output: { item: stockKey('pine-log', Math.min(5, 1 + rank)) }, exp: 0 }))
  },
  pay: payItems,
}

/** One Wheat Flour that takes `count` days, from one Wheat. */
const make: WorkKindRules<LoopWorld> = {
  count: () => 1,
  plan: (_world, _outfitId, request) => [{ seconds: request.count * DAY_S, inputs: [{ item: stockKey('wheat', 1), qty: 1 }], output: { item: stockKey('wheat-flour', 1) }, exp: 0 }],
  pay: payItems,
}

const parse = (kind: string, max: number) => (value: Record<string, unknown>, path: string) => {
  const r = object(value, path, ['kind', 'item', 'count'])
  return { kind, item: oneOf(r.item, `${path}.item`, kind === 'gather' ? ['pine-log'] : ['wheat-flour']), count: int(r.count, `${path}.count`, 1, max) }
}

export const TEST_KINDS: LoopKinds = {
  gather: { places: ['forest'], parseRequest: parse('gather', 4), rules: gather, multiDay: false },
  make: { places: ['mill'], parseRequest: parse('make', 3), rules: make, multiDay: true },
}
