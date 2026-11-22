import { HEIRLOOM_IDS, HEIRLOOM_DAWNS, TOOL_DAWNS, type ForgeState, type HeirloomOrder, type ToolOrder, type UpgradeTier } from '../forge/state'
import { BONUS_TOOLS } from '../forge/tools'
import { bool, int, list, object, oneOf, record } from './parse'
import { fail, member } from './parse-loop'
import { TOOL_IDS, type FarmSave, type TodayV4, type ToolId } from './v4'

export function parseForge(value: unknown, path: string, save: FarmSave): ForgeState {
  const data = object(value, path, ['bench', 'legacyLooks', 'tool', 'installed', 'heirlooms', 'tracked', 'ringOrder'])
  const today = save.calendar.day
  const roster = new Set(Object.keys(save.roster))
  const spouses = new Set([...roster].filter(id => save.love[id]?.stage === 'spouse'))
  const legacyLooks: ForgeState['legacyLooks'] = {}
  for (const [id, slots] of Object.entries(record(data.legacyLooks, path))) {
    member(id, path, spouses)
    legacyLooks[id] = [...new Set(list(slots, path, 0, 4).map(slot => int(slot, path, 2, 5)))]
  }
  function readTool(value: unknown): ToolOrder {
    const row = object(value, path, ['tool', 'tier', 'ordered', 'due', 'assistant', 'finish'])
    const tool = oneOf(row.tool, path, TOOL_IDS)
    const tier = int(row.tier, path, 2, 5) as UpgradeTier
    const ordered = int(row.ordered, path, 1, today)
    const due = int(row.due, path, ordered + TOOL_DAWNS[tier], ordered + TOOL_DAWNS[tier])
    return { tool, tier, ordered, due,
      ...(row.assistant === undefined ? {} : { assistant: member(row.assistant, path, roster) }),
      ...(row.finish === undefined ? {} : { finish: oneOf(row.finish, path, ['in-progress', 'standard', 'stamped'] as const) }),
    }
  }
  const tool = data.tool === undefined ? undefined : readTool(data.tool)
  if (tool && save.tools[tool.tool] !== tool.tier - 1) fail(path, 'expected next tool tier')
  const installed = list(data.installed, path, 0, TOOL_IDS.length).map(readTool)
  if (new Set(installed.map(row => row.tool)).size !== installed.length || installed.some(row => row.due > today || save.tools[row.tool] !== row.tier)) fail(path, 'invalid installed tools')
  const heirlooms = list(data.heirlooms, path, 0, spouses.size * HEIRLOOM_IDS.length).map((value): HeirloomOrder => {
    const row = object(value, path, ['recipient', 'piece', 'ordered', 'due', 'ready', 'gifted', 'assistant'])
    const recipient = member(row.recipient, path, spouses)
    const piece = oneOf(row.piece, path, HEIRLOOM_IDS)
    const ordered = int(row.ordered, path, 1, today)
    const due = int(row.due, path, ordered + HEIRLOOM_DAWNS[piece], ordered + HEIRLOOM_DAWNS[piece])
    const ready = row.ready === undefined ? undefined : int(row.ready, path, due, today)
    if (row.gifted !== undefined && ready === undefined) fail(path, 'gift before delivery')
    return { recipient, piece, ordered, due,
      ...(ready === undefined ? {} : { ready }),
      ...(row.gifted === undefined ? {} : { gifted: int(row.gifted, path, ready!, today) }),
      ...(row.assistant === undefined ? {} : { assistant: member(row.assistant, path, roster) }),
    }
  })
  if (new Set(heirlooms.map(row => `${row.recipient}:${row.piece}`)).size !== heirlooms.length
    || heirlooms.filter(row => !row.ready).length > 2) fail(path, 'invalid heirloom orders')
  const goal = data.tracked === undefined ? null : object(data.tracked, path, ['recipient', 'piece'])
  const tracked = goal ? { recipient: member(goal.recipient, path, spouses), piece: oneOf(goal.piece, path, HEIRLOOM_IDS) } : null
  const pending = data.ringOrder === undefined ? null : object(data.ringOrder, `${path}.ringOrder`, ['grade', 'due'])
  const ringOrder = pending ? { grade: int(pending.grade, path, 1, 10), due: int(pending.due, path, today + 1, today + 2) } : null
  return { bench: bool(data.bench, path), legacyLooks, ...(tool ? { tool } : {}), installed, heirlooms, ...(tracked ? { tracked } : {}),
    ...(ringOrder ? { ringOrder } : {}) }
}

export function parseForgeHelper(value: unknown, path: string, roster: ReadonlySet<string>): NonNullable<TodayV4['forgeHelper']> {
  const data = object(value, path, ['id', 'tier'])
  return { id: member(data.id, path, roster), tier: int(data.tier, path, 2, 5) as UpgradeTier }
}

export function parseToolCharges(value: unknown, path: string): Partial<Record<ToolId, number>> {
  return Object.fromEntries(Object.entries(object(value, path, BONUS_TOOLS)).map(([tool, count]) => [tool, int(count, path, 0, 4)]))
}
