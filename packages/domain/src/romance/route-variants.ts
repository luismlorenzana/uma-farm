import { bondHearts } from '../farm/bonds'
import { libraryReceipts, recordLibrary } from '../library/receipts'
import { pairKey, type FarmSave } from '../save/v4'
import { goodCount } from '../save/warehouse'
import { ARRIVAL, YOU, type Step, type StoryTrigger, type Trigger } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { beatOf, festivalsOf } from '../story/placeholders'
import { chapterAt, gateHolds, herChapters } from './chapters'

type RoutePack = Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'world'>>
type RouteSetup = Extract<Trigger, { kind: 'item' | 'bond' }>
export type RouteRequirement = { kind: 'gate'; gate: StoryTrigger } | { kind: 'setup'; setup: RouteSetup }

/** Conditions for a scene's original staging, including when the chapter is revisited in the Library. */
export function routeRequirements(save: FarmSave, pack: RoutePack, id: string, rung: string): RouteRequirement[] {
  if (rung === ARRIVAL) return []
  const chapter = chapterAt(herChapters(pack, id), rung)
  const gate = chapter?.events.find(event => event !== ARRIVAL) === rung ? chapter.gate : null
  const trigger = beatOf(pack, id, rung)?.trigger
  const requirements: RouteRequirement[] = []
  if (gate && !gateHolds(save, gate, festivalsOf(pack))) requirements.push({ kind: 'gate', gate })
  if ((trigger?.kind === 'item' && goodCount(save.items, trigger.good) === 0)
    || (trigger?.kind === 'bond' && bondHearts(save.bonds[pairKey(id, trigger.with)] ?? 0) < trigger.level)) {
    requirements.push({ kind: 'setup', setup: trigger })
  }
  return requirements
}

/** A scene for any site, season or roster. Relationship milestones keep their ordinary choices. */
export function alternateRouteSteps(pack: Pick<StoryPack, 'bibles'>, id: string, rung: string): Step[] {
  const romance = rung.startsWith('r')
  const [greeting, accept, question, close]: readonly [string, string, string, string] = romance
    ? ['I caught myself saving a story for you before I even knew when we’d meet again.', 'Then tell it from the beginning.', 'What part have you been waiting to tell me?', 'All right. Come a little closer.']
    : rung.startsWith('s')
      ? ['Some days I look up and realize we’ve spent the whole morning in different rooms.', 'Let’s sit together a while.', 'What did you want to tell me this morning?', 'I think I just wanted us to slow down together.']
      : ['I had something planned for today. I think I’d rather sit here a minute and hear how you’re doing.', 'I have time. Tell me about your day too.', 'Can we make a habit of this?', 'I’d like that. It’s easy to talk to you here.']
  const chats = pack.bibles.get(id)?.chats
  const stageLines = rung.startsWith('s') ? chats?.spouse : romance ? chats?.partner : chats?.friend
  const voice = stageLines?.length ? stageLines[((Number(rung.slice(1)) || 1) - 1) % stageLines.length] : undefined
  const choice: Step = rung === 'confession'
    ? { choice: [{ text: 'I want to be with you.', answer: 'yes', romance: 30 }, { text: 'I need a little more time.', answer: 'not-yet', friendship: 10 }] }
    : { choice: [{ text: accept, friendship: 30 }, { text: question, friendship: 10 }] }
  const opening = rung === 'confession' ? 'I’ve been trying to find the right moment to say this. I love you. Do you feel the same?'
    : rung === 'proposal' ? 'You’ve been holding something in your hand all the way here. What did you want to ask me?'
    : rung === 'wedding' ? 'I’m ready. Tell me what you want us to remember about today.' : voice ?? greeting
  if (rung === 'confession' && 'choice' in choice) {
    choice.choice[0]!.then = [{ say: id, line: 'I’m glad you feel the same. Let’s see where this takes us.' }]
    choice.choice[1]!.then = [{ say: id, line: 'Take the time you need. I’m glad I told you.' }]
    return [{ place: 'gate' }, { say: id, line: opening }, choice]
  }
  const crossing = rung === 'proposal' || rung === 'wedding'
  return [{ place: 'gate' }, { say: id, line: opening }, crossing ? {
    choice: [
      { text: rung === 'proposal' ? 'Will you marry me?' : 'I promise to make a home with you.', romance: 30 },
      { text: rung === 'proposal' ? 'I want to spend my life with you.' : 'I promise to keep making time for us.', romance: 10 },
    ],
  } : choice, ...(romance ? [{ say: YOU, line: 'We can stay a while.' } as Step] : []),
  { say: id, line: crossing ? rung === 'proposal' ? 'Yes. I would love to.' : 'I promise that too.' : close }]
}

export const alternateRouteDay = (save: Pick<FarmSave, 'library'>, id: string, rung: string): number | undefined =>
  libraryReceipts(save, id)?.first[`route:${rung}:alternate`]

export const originalRouteDay = (save: Pick<FarmSave, 'library'>, id: string, rung: string): number | undefined =>
  libraryReceipts(save, id)?.first[`route:${rung}:original`]

export function originalRouteAvailable(save: FarmSave, pack: RoutePack, id: string, rung: string): boolean {
  return originalRouteDay(save, id, rung) !== undefined || routeRequirements(save, pack, id, rung).length === 0
}

export function recordOriginalRoute(save: FarmSave, pack: RoutePack, id: string, rung: string): FarmSave {
  if (!save.memories[id]?.includes(rung) || alternateRouteDay(save, id, rung) === undefined || !originalRouteAvailable(save, pack, id, rung)) return save
  return recordLibrary(save, id, `route:${rung}:original`)
}
